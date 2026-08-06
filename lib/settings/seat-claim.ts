import { createHash, randomBytes } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { appRoleForOfficeSlug, labelForOfficeSlug } from "@/lib/settings/stake-office-slugs"
import { seatUserOnRoster } from "@/lib/settings/roster-login"

export const SEAT_CLAIM_PATH = "/claim-seat"
export const SEAT_CLAIM_TTL_DAYS = 14

export function hashClaimToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex")
}

export function generateRawClaimToken(): string {
  return randomBytes(32).toString("base64url")
}

export function claimUrlForToken(origin: string, rawToken: string): string {
  const base = origin.replace(/\/$/, "")
  return `${base}${SEAT_CLAIM_PATH}?token=${encodeURIComponent(rawToken)}`
}

/** Prefer configured public app URL; fall back to request Origin / Vercel URL. */
export function resolveAppOrigin(reqOrigin?: string | null): string {
  const env =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  if (env) return env.replace(/\/$/, "")
  return (reqOrigin || "").replace(/\/$/, "")
}

/**
 * Mint a new one-time claim link for a roster seat. Invalidates any unused
 * prior tokens for that seat. Returns the raw token once (never stored).
 */
export async function createSeatClaimToken(
  admin: SupabaseClient,
  opts: {
    stakeId: string
    rosterRowId: string
    personName: string
    createdBy?: string | null
    ttlDays?: number
  }
): Promise<{ rawToken: string; expiresAt: string } | { error: string }> {
  const personName = opts.personName.trim()
  if (!personName) return { error: "Seat has no calling-holder name yet." }

  const { data: row, error: rowErr } = await admin
    .from("stake_permission_roster")
    .select("id, stake_id, office_slug, assigned_user_id, person_name")
    .eq("id", opts.rosterRowId)
    .single()
  if (rowErr || !row) return { error: "Roster seat not found." }
  if (row.stake_id !== opts.stakeId) return { error: "That seat is not in your stake." }
  if (row.assigned_user_id) {
    return { error: "This seat already has a login linked. Revoke it first if you need a new claim link." }
  }
  // Prefer the roster's current holder name when present.
  const holderName = (row.person_name?.trim() || personName).trim()

  // Invalidate unused tokens for this seat.
  await admin
    .from("seat_claim_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("roster_row_id", opts.rosterRowId)
    .is("used_at", null)

  const rawToken = generateRawClaimToken()
  const tokenHash = hashClaimToken(rawToken)
  const ttl = opts.ttlDays ?? SEAT_CLAIM_TTL_DAYS
  const expiresAt = new Date(Date.now() + ttl * 24 * 60 * 60 * 1000).toISOString()

  const { error: insErr } = await admin.from("seat_claim_tokens").insert({
    stake_id: opts.stakeId,
    roster_row_id: opts.rosterRowId,
    person_name: holderName,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: opts.createdBy ?? null,
  })
  if (insErr) {
    if (/seat_claim_tokens|schema cache/i.test(insErr.message)) {
      return { error: "Claim links unavailable — run migration 075_seat_claim_tokens.sql." }
    }
    return { error: insErr.message }
  }

  return { rawToken, expiresAt }
}

export async function loadClaimPreview(
  admin: SupabaseClient,
  rawToken: string
): Promise<
  | {
      personName: string
      officeLabel: string
      expiresAt: string
    }
  | { error: string; status: number }
> {
  const tokenHash = hashClaimToken(rawToken)
  const { data: token, error } = await admin
    .from("seat_claim_tokens")
    .select("id, person_name, expires_at, used_at, roster_row_id")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (error) {
    if (/seat_claim_tokens|schema cache/i.test(error.message)) {
      return { error: "Claim links are not set up yet.", status: 503 }
    }
    return { error: error.message, status: 500 }
  }
  if (!token) return { error: "This claim link is invalid.", status: 404 }
  if (token.used_at) return { error: "This claim link has already been used.", status: 410 }
  if (new Date(token.expires_at).getTime() < Date.now()) {
    return { error: "This claim link has expired. Ask stake leadership for a new one.", status: 410 }
  }

  const { data: seat } = await admin
    .from("stake_permission_roster")
    .select("office_slug, assigned_user_id")
    .eq("id", token.roster_row_id)
    .maybeSingle()
  if (!seat) return { error: "The seat for this link no longer exists.", status: 404 }
  if (seat.assigned_user_id) {
    return { error: "This seat already has a login. Sign in instead.", status: 409 }
  }

  return {
    personName: token.person_name,
    officeLabel: labelForOfficeSlug(seat.office_slug),
    expiresAt: token.expires_at,
  }
}

export async function claimSeatWithToken(
  admin: SupabaseClient,
  opts: { rawToken: string; email: string; password: string }
): Promise<{ userId: string; officeSlug: string; role: string } | { error: string; status: number }> {
  const email = opts.email.trim().toLowerCase()
  const password = opts.password
  if (!email.includes("@")) return { error: "Enter a valid email address.", status: 400 }
  if (password.length < 8) return { error: "Password must be at least 8 characters.", status: 400 }

  const preview = await loadClaimPreview(admin, opts.rawToken)
  if ("error" in preview) return preview

  const tokenHash = hashClaimToken(opts.rawToken)
  const { data: token } = await admin
    .from("seat_claim_tokens")
    .select("id, stake_id, roster_row_id, person_name, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .single()
  if (!token || token.used_at) return { error: "This claim link is no longer valid.", status: 410 }

  const { data: seat } = await admin
    .from("stake_permission_roster")
    .select("id, office_slug, assigned_user_id, person_name")
    .eq("id", token.roster_row_id)
    .single()
  if (!seat) return { error: "The seat for this link no longer exists.", status: 404 }
  if (seat.assigned_user_id) return { error: "This seat already has a login. Sign in instead.", status: 409 }

  // Email must not already belong to another account.
  const { data: existingProfile } = await admin
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle()
  if (existingProfile) {
    return { error: "That email already has an account. Sign in, or use a different email.", status: 409 }
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: token.person_name },
  })
  if (createErr || !created.user) {
    return { error: createErr?.message || "Could not create account.", status: 500 }
  }

  const userId = created.user.id
  const role = appRoleForOfficeSlug(seat.office_slug)

  const { error: profileErr } = await admin.from("users").upsert(
    {
      id: userId,
      email,
      full_name: token.person_name,
      role,
      stake_id: token.stake_id,
    },
    { onConflict: "id" }
  )
  if (profileErr) {
    await admin.auth.admin.deleteUser(userId)
    return { error: profileErr.message, status: 500 }
  }

  try {
    await seatUserOnRoster(admin, token.stake_id, token.roster_row_id, userId)
  } catch (e) {
    await admin.auth.admin.deleteUser(userId)
    return { error: e instanceof Error ? e.message : "Could not seat the account.", status: 500 }
  }

  // Keep person_name on the seat (calling holder).
  if (!seat.person_name?.trim()) {
    await admin
      .from("stake_permission_roster")
      .update({ person_name: token.person_name })
      .eq("id", token.roster_row_id)
  }

  await admin
    .from("seat_claim_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", token.id)

  return { userId, officeSlug: seat.office_slug, role }
}
