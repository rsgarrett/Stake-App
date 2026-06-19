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

function pickVacantSeat(
  rosterRows: { office_slug: string; assigned_user_id: string | null }[],
  isSeat: (slug: string) => boolean
): string | null {
  const seats = rosterRows
    .filter((r) => isSeat(r.office_slug))
    .sort((a, b) => a.office_slug.localeCompare(b.office_slug))
  const vacant = seats.find((r) => !r.assigned_user_id)
  return vacant?.office_slug ?? seats[0]?.office_slug ?? null
}

export function pickHighCouncilSeatSlug(
  rosterRows: { office_slug: string; assigned_user_id: string | null }[]
): string | null {
  return pickVacantSeat(rosterRows, isHighCouncilSeatSlug)
}

/** Two assistant exec sec seats exist; prefer the vacant one. */
export function pickAssistantExecSecSeatSlug(
  rosterRows: { office_slug: string; assigned_user_id: string | null }[]
): string | null {
  return pickVacantSeat(rosterRows, (slug) => ASSISTANT_EXEC_SEC_SEATS.includes(slug))
}
