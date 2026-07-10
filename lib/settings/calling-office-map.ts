import { isHighCouncilSeatSlug } from "@/lib/settings/stake-office-slugs"

/** Maps LCR-style calling names to fixed handbook roster seats. */
const CALLING_TO_OFFICE_SLUG: Record<string, string> = {
  "Stake President": "stake_president",
  "Stake President (submitted to First Presidency)": "stake_president",
  "First Counselor in the Stake Presidency": "first_counselor",
  "Second Counselor in the Stake Presidency": "second_counselor",
  "Stake Clerk": "stake_clerk",
  "Assistant Stake Clerk": "assistant_stake_clerk",
  "Assistant Stake Clerk — Finance": "assistant_stake_clerk",
  "Assistant Stake Clerk — Membership": "assistant_stake_clerk",
  "Stake Executive Secretary": "executive_secretary",
}

export function officeSlugForCallingName(callingName: string): string | null {
  const direct = CALLING_TO_OFFICE_SLUG[callingName]
  if (direct) return direct
  if (callingName === "High Councilor") return "high_council"
  return null
}

export function isHighCouncilCalling(callingName: string): boolean {
  return callingName === "High Councilor"
}

export function isAssistantExecSecCalling(callingName: string): boolean {
  return callingName === "Assistant Stake Executive Secretary"
}

const ASSISTANT_EXEC_SEC_SEATS = [
  "assistant_executive_secretary_1",
  "assistant_executive_secretary_2",
]

export interface SeatPickRow {
  office_slug: string
  assigned_user_id: string | null
  /** Current calling holder for the seat (migration 072); may be absent pre-migration. */
  person_name?: string | null
}

/** "President J. Kimo Esplin (12th)" → "j kimo esplin" (for holder-name comparison). */
export function normalizePersonName(name: string | null | undefined): string {
  return (name ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(president|pres|elder|brother|sister|bishop)\b/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function samePersonName(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizePersonName(a)
  const nb = normalizePersonName(b)
  return na.length > 0 && na === nb
}

/**
 * Best seat for a completed calling in a multi-seat group:
 * 1. seat currently held (by name) by the person being replaced,
 * 2. seat with no holder name and no login,
 * 3. seat with no login,
 * 4. first seat.
 */
function pickSeat(
  rosterRows: SeatPickRow[],
  isSeat: (slug: string) => boolean,
  replacesPersonName?: string | null
): string | null {
  const seats = rosterRows
    .filter((r) => isSeat(r.office_slug))
    .sort((a, b) => a.office_slug.localeCompare(b.office_slug))
  if (replacesPersonName) {
    const held = seats.find((r) => samePersonName(r.person_name, replacesPersonName))
    if (held) return held.office_slug
  }
  const empty = seats.find((r) => !r.assigned_user_id && !r.person_name?.trim())
  if (empty) return empty.office_slug
  const vacantLogin = seats.find((r) => !r.assigned_user_id)
  return vacantLogin?.office_slug ?? seats[0]?.office_slug ?? null
}

export function pickHighCouncilSeatSlug(
  rosterRows: SeatPickRow[],
  replacesPersonName?: string | null
): string | null {
  return pickSeat(rosterRows, isHighCouncilSeatSlug, replacesPersonName)
}

/** Two assistant exec sec seats exist; prefer the released person's seat, then a vacant one. */
export function pickAssistantExecSecSeatSlug(
  rosterRows: SeatPickRow[],
  replacesPersonName?: string | null
): string | null {
  return pickSeat(rosterRows, (slug) => ASSISTANT_EXEC_SEC_SEATS.includes(slug), replacesPersonName)
}
