import { NextRequest, NextResponse } from "next/server"
import { requireElevatedLeader } from "@/lib/auth/require-elevated-leader"
import { createAdminClient } from "@/lib/supabase/admin"
import { appRoleForOfficeSlug } from "@/lib/settings/stake-office-slugs"
import {
  clearUserFromStakeRoster,
  seatUserOnRoster,
  userHasOtherRosterSeats,
} from "@/lib/settings/roster-login"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  let out = ""
  for (let i = 0; i < 12; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

/** Create auth + app user and optionally seat them on a roster row. */
export async function POST(req: NextRequest) {
  const auth = await requireElevatedLeader()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const email = normalizeEmail(String(body.email ?? ""))
    const fullName = String(body.fullName ?? "").trim()
    const rosterRowId = body.rosterRowId ? String(body.rosterRowId) : null
    const mode = body.mode === "invite" ? "invite" : "create"
    let password = body.password ? String(body.password) : ""
    const revokePrevious = body.revokePrevious !== false

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 })
    }
    if (!fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 })
    }

    const admin = createAdminClient()
    const { stakeId } = auth.ctx

    let targetRole = "viewer"
    if (rosterRowId) {
      const { data: row, error: rowErr } = await admin
        .from("stake_permission_roster")
        .select("office_slug, stake_id, assigned_user_id")
        .eq("id", rosterRowId)
        .single()
      if (rowErr || !row) {
        return NextResponse.json({ error: "Roster seat not found." }, { status: 404 })
      }
      if (row.stake_id !== stakeId) {
        return NextResponse.json({ error: "That seat is not in your stake." }, { status: 403 })
      }
      targetRole = appRoleForOfficeSlug(row.office_slug)

      if (row.assigned_user_id && revokePrevious) {
        const stillElsewhere = await userHasOtherRosterSeats(
          admin,
          stakeId,
          row.assigned_user_id,
          rosterRowId
        )
        if (!stillElsewhere) {
          await clearUserFromStakeRoster(admin, stakeId, row.assigned_user_id)
          const { error: delErr } = await admin.auth.admin.deleteUser(row.assigned_user_id)
          if (delErr) throw delErr
        } else {
          await clearUserFromStakeRoster(admin, stakeId, row.assigned_user_id)
          await admin.from("users").update({ role: "viewer" }).eq("id", row.assigned_user_id)
        }
      }
    }

    let existingUserId: string | null = null
    const { data: dbMatch } = await admin
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle()
    if (dbMatch?.id) existingUserId = dbMatch.id

    if (!existingUserId) {
      const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authMatch = authList?.users.find((u) => u.email?.toLowerCase() === email)
      if (authMatch) existingUserId = authMatch.id
    }

    let userId: string
    let tempPassword: string | null = null

    if (existingUserId) {
      userId = existingUserId
      const { error: updateErr } = await admin
        .from("users")
        .upsert(
          {
            id: userId,
            stake_id: stakeId,
            role: targetRole,
            email,
            full_name: fullName,
          },
          { onConflict: "id" }
        )
      if (updateErr) throw updateErr
    } else if (mode === "invite") {
      const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
      })
      if (inviteErr) throw inviteErr
      if (!invited.user) throw new Error("Invite did not return a user.")
      userId = invited.user.id

      const { error: insertErr } = await admin.from("users").insert({
        id: userId,
        stake_id: stakeId,
        role: targetRole,
        email,
        full_name: fullName,
      })
      if (insertErr) throw insertErr
    } else {
      if (!password || password.length < 8) {
        password = generateTempPassword()
        tempPassword = password
      }
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (createErr) throw createErr
      if (!created.user) throw new Error("User creation failed.")
      userId = created.user.id

      const { error: insertErr } = await admin.from("users").insert({
        id: userId,
        stake_id: stakeId,
        role: targetRole,
        email,
        full_name: fullName,
      })
      if (insertErr) throw insertErr
    }

    if (rosterRowId) {
      await seatUserOnRoster(admin, stakeId, rosterRowId, userId)
    }

    return NextResponse.json({
      success: true,
      userId,
      email,
      fullName,
      role: targetRole,
      tempPassword,
      mode: existingUserId ? "linked_existing" : mode,
      message: existingUserId
        ? "Linked an existing login to this stake and seat."
        : mode === "invite"
          ? "Invitation email sent. They can set a password from the link."
          : tempPassword
            ? "Login created. Share the temporary password securely; they should change it after first sign-in."
            : "Login created.",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not create login."
    console.error("provision user:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
