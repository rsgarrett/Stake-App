import { NextRequest, NextResponse } from "next/server"
import { requireElevatedLeader } from "@/lib/auth/require-elevated-leader"
import { createAdminClient } from "@/lib/supabase/admin"
import { claimUrlForToken, createSeatClaimToken, resolveAppOrigin } from "@/lib/settings/seat-claim"

/** Mint (or remint) a one-time claim link for an unclaimed roster seat. */
export async function POST(req: NextRequest) {
  const auth = await requireElevatedLeader()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const rosterRowId = String(body.rosterRowId ?? "").trim()
    const personName = String(body.personName ?? "").trim()
    if (!rosterRowId) {
      return NextResponse.json({ error: "rosterRowId required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const result = await createSeatClaimToken(admin, {
      stakeId: auth.ctx.stakeId,
      rosterRowId,
      personName,
      createdBy: auth.ctx.userId,
    })
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const claimUrl = claimUrlForToken(resolveAppOrigin(req.nextUrl.origin), result.rawToken)
    return NextResponse.json({
      success: true,
      claimUrl,
      expiresAt: result.expiresAt,
      message:
        "Copy this link and send it to them (text or email). They will set their own email and password. The link works once and expires in 14 days.",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not create claim link."
    console.error("claim-link:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
