import { NextRequest, NextResponse } from "next/server"
import { requireElevatedLeader } from "@/lib/auth/require-elevated-leader"
import { createAdminClient } from "@/lib/supabase/admin"
import { clearUserFromStakeRoster, userHasOtherRosterSeats } from "@/lib/settings/roster-login"

/** Remove a leadership login: clear roster seats and delete auth account when safe. */
export async function POST(req: NextRequest) {
  const auth = await requireElevatedLeader()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const userId = String(body.userId ?? "")
    const demoteOnly = body.demoteOnly === true

    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 })
    }
    if (userId === auth.ctx.userId) {
      return NextResponse.json({ error: "You cannot revoke your own login." }, { status: 400 })
    }

    const admin = createAdminClient()
    const { stakeId } = auth.ctx

    const { data: target, error: targetErr } = await admin
      .from("users")
      .select("id, stake_id, email, full_name, role")
      .eq("id", userId)
      .single()
    if (targetErr || !target) {
      return NextResponse.json({ error: "User not found in this stake." }, { status: 404 })
    }
    if (target.stake_id !== stakeId) {
      return NextResponse.json({ error: "That account is not in your stake." }, { status: 403 })
    }

    await clearUserFromStakeRoster(admin, stakeId, userId)

    if (demoteOnly) {
      const { error: demoteErr } = await admin.from("users").update({ role: "viewer" }).eq("id", userId)
      if (demoteErr) throw demoteErr
      return NextResponse.json({
        success: true,
        action: "demoted",
        message: `${target.full_name || target.email || "User"} was removed from all seats and demoted to viewer.`,
      })
    }

    const stillSeated = await userHasOtherRosterSeats(admin, stakeId, userId)
    if (stillSeated) {
      const { error: demoteErr } = await admin.from("users").update({ role: "viewer" }).eq("id", userId)
      if (demoteErr) throw demoteErr
      return NextResponse.json({
        success: true,
        action: "demoted",
        message: "User still holds another roster seat elsewhere; login kept as viewer only.",
      })
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(userId)
    if (delErr) throw delErr

    return NextResponse.json({
      success: true,
      action: "deleted",
      message: `${target.full_name || target.email || "User"} login was removed.`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not revoke login."
    console.error("revoke user:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
