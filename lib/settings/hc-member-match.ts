import { samePersonName } from "@/lib/settings/calling-office-map"
import type { HighCouncilMember } from "@/types"

export type HcUserProfile = {
  email?: string | null
  full_name?: string | null
}

/**
 * Match the signed-in user to HC roster row(s) by email, full name, or
 * permission-roster person_name for their HC seat.
 */
export function matchHcMembersForUser(
  members: HighCouncilMember[],
  profile: HcUserProfile,
  rosterPersonNames: string[] = []
): HighCouncilMember[] {
  const email = profile.email?.trim().toLowerCase() || ""
  const matched = members.filter((m) => {
    if (email && m.email?.trim().toLowerCase() === email) return true
    if (samePersonName(m.member_name, profile.full_name)) return true
    if (rosterPersonNames.some((n) => samePersonName(m.member_name, n))) return true
    return false
  })
  // Prefer active rows when both active + released match.
  const active = matched.filter((m) => m.status === "active")
  return active.length > 0 ? active : matched
}

/** Current seat holder plus predecessors via replaced_member_id (for R&R history). */
export function hcSeatHistoryIds(
  members: HighCouncilMember[],
  current: HighCouncilMember | null | undefined
): Set<string> {
  const ids = new Set<string>()
  if (!current) return ids
  const byId = new Map(members.map((m) => [m.id, m]))
  let cur: HighCouncilMember | undefined = current
  while (cur && !ids.has(cur.id)) {
    ids.add(cur.id)
    cur = cur.replaced_member_id ? byId.get(cur.replaced_member_id) : undefined
  }
  return ids
}
