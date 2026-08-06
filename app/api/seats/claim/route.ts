import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { claimSeatWithToken, loadClaimPreview } from "@/lib/settings/seat-claim"

/** Public: preview who/what a claim token is for. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() || ""
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 })
  }
  try {
    const admin = createAdminClient()
    const result = await loadClaimPreview(admin, token)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not load claim."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Public: first-time secure login — create account + seat from one-time token. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = String(body.token ?? "").trim()
    const email = String(body.email ?? "").trim()
    const password = String(body.password ?? "")
    if (!token) {
      return NextResponse.json({ error: "Missing token." }, { status: 400 })
    }

    const admin = createAdminClient()
    const result = await claimSeatWithToken(admin, { rawToken: token, email, password })
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({
      success: true,
      message: "Account created. You can sign in with your email and password.",
      officeSlug: result.officeSlug,
      role: result.role,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not complete claim."
    console.error("seat claim:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
