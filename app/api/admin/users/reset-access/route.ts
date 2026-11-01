import { NextRequest, NextResponse } from "next/server"
import { requireElevatedLeader } from "@/lib/auth/require-elevated-leader"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveAppOrigin } from "@/lib/settings/seat-claim"

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  let out = ""
  for (let i = 0; i < 12; i += 1) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

/**
 * Stake presidency / clerks: give a seated person a new password, or a
 * one-time link they can open to set their own. Confirms the email so an
 * unconfirmed account can sign in.
 */
export async function POST(req: NextRequest) {
  const auth = await requireElevatedLeader()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const userId = String(body.userId ?? "").trim()
    const mode = body.mode === "link" ? "link" : "password"
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }
    if (userId === auth.ctx.userId) {
      return NextResponse.json(
        { error: "Use the sign-in page to change your own password." },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { data: profile, error: profileErr } = await admin
      .from("users")
      .select("id, email, stake_id, full_name")
      .eq("id", userId)
      .maybeSingle()
    if (profileErr) throw profileErr
    if (!profile?.email) {
      return NextResponse.json({ error: "That account has no email on file." }, { status: 404 })
    }
    if (profile.stake_id !== auth.ctx.stakeId) {
      return NextResponse.json({ error: "That account is not in your stake." }, { status: 403 })
    }

    const { error: confirmErr } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })
    if (confirmErr) throw confirmErr

    if (mode === "password") {
      const tempPassword = generateTempPassword()
      const { error: pwErr } = await admin.auth.admin.updateUserById(userId, {
        password: tempPassword,
      })
      if (pwErr) throw pwErr
      return NextResponse.json({
        success: true,
        tempPassword,
        email: profile.email,
        message: `New password set for ${profile.full_name || profile.email}. Send it to them, then they can sign in at the login page. It replaces their old password.`,
      })
    }

    const requestOrigin = req.nextUrl.origin.replace(/\/$/, "")
    const origin = requestOrigin.startsWith("https://")
      ? requestOrigin
      : resolveAppOrigin(requestOrigin)
    const redirectTo = `${origin}/auth/reset-password`
    const { data, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: profile.email,
      options: { redirectTo },
    })
    if (linkErr) {
      const hint = /redirect|not allowed|invalid/i.test(linkErr.message)
        ? ` Add ${redirectTo} under Supabase → Authentication → URL Configuration → Redirect URLs, then try again. You can still set a password directly.`
        : ""
      return NextResponse.json({ error: linkErr.message + hint }, { status: 400 })
    }
    const signInUrl = data.properties?.action_link
    const returnedTo = data.properties?.redirect_to || ""
    if (!signInUrl) {
      return NextResponse.json({ error: "No sign-in link was returned." }, { status: 500 })
    }
    if (!returnedTo.startsWith(origin)) {
      return NextResponse.json(
        {
          error: `Sign-in links are still pointed at ${returnedTo || "the Supabase Site URL"}. In Supabase → Authentication → URL Configuration, set Site URL to ${origin} and add ${redirectTo} under Redirect URLs. Until that is saved, use Set a new password — that works immediately.`,
        },
        { status: 400 }
      )
    }
    return NextResponse.json({
      success: true,
      signInUrl,
      email: profile.email,
      message:
        "One-time sign-in link ready. Send it by text or email. They open it, choose a new password, and are signed in. It replaces any older reset link.",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not reset access."
    console.error("reset-access:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
