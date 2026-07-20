/**
 * Fair rotation for the opening assignments of stake meetings (prayers and
 * handbook training), so participation spreads across everyone in the room
 * instead of falling to the same few people.
 *
 * Fairness rule: whoever has gone the longest without ANY rotating assignment
 * (prayer or training, in this meeting series) is up next. People who have
 * never served come first, in roster order. Assignments within one meeting are
 * always distinct people.
 */

import type { AgendaPerson } from "@/lib/meetings/use-agenda-people"

/** Prayers + handbook training rotate; other person fields (e.g. closing thoughts) do not. */
export function isRotatingOpeningTitle(title: string): boolean {
  const lower = title.toLowerCase()
  if (lower.includes("prayer")) return true
  if (lower.includes("handbook training") || lower.includes("handbook instruction")) return true
  return false
}

function slugNorm(meetingType: string): string {
  return (meetingType ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_")
}

/**
 * Who is actually in the room and can take an opening assignment.
 * Stake presidency meetings: presidency, clerks, and executive secretaries.
 * Council meetings (HC / stake council / etc.): everyone except bishops.
 */
export function rotationPoolForMeeting(meetingType: string, people: AgendaPerson[]): string[] {
  const slug = slugNorm(meetingType)
  const presidencyOnly = slug.startsWith("stake_presidency")
  return people
    .filter((p) => {
      if (p.role === "Bishop") return false
      if (presidencyOnly && /high council/i.test(p.role)) return false
      return true
    })
    .map((p) => p.name)
}

function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(president|pres|elder|brother|sister|bishop)\b/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Loose match so "President Garrett" and "Garrett" count as the same person. */
function sameName(a: string, b: string): boolean {
  const na = normName(a)
  const nb = normName(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const ta = na.split(" ")
  const tb = nb.split(" ")
  return ta.some((t) => t.length > 2 && tb.includes(t))
}

export interface RotationHistoryEntry {
  /** ISO date of the meeting where this person served. */
  date: string
  /** Name as stored on the agenda item's assigned_to. */
  name: string
}

/**
 * Picks the next person for one rotating assignment: least-recently served
 * from `pool`, skipping anyone in `exclude` (already assigned in this meeting).
 */
export function pickNextInRotation(
  pool: string[],
  history: RotationHistoryEntry[],
  exclude: string[]
): string | null {
  const candidates = pool.filter((name) => !exclude.some((x) => sameName(x, name)))
  if (candidates.length === 0) return null

  const lastServed = new Map<string, string>()
  for (const entry of history) {
    const match = pool.find((p) => sameName(p, entry.name))
    if (!match) continue
    const prev = lastServed.get(match)
    if (!prev || entry.date > prev) lastServed.set(match, entry.date)
  }

  const ranked = [...candidates].sort((a, b) => {
    const da = lastServed.get(a) ?? ""
    const db = lastServed.get(b) ?? ""
    if (da !== db) return da.localeCompare(db) // never-served ("") first, then oldest
    return pool.indexOf(a) - pool.indexOf(b)
  })
  return ranked[0] ?? null
}

/**
 * Assigns every open rotating title in one meeting at once, guaranteeing
 * distinct people. `titles` should be in agenda order.
 */
export function assignOpeningRotation(input: {
  titles: string[]
  pool: string[]
  history: RotationHistoryEntry[]
  alreadyAssigned: string[]
}): Record<string, string> {
  const { titles, pool, history, alreadyAssigned } = input
  const taken = [...alreadyAssigned]
  const out: Record<string, string> = {}
  for (const title of titles) {
    const pick = pickNextInRotation(pool, history, taken)
    if (!pick) continue
    out[title] = pick
    taken.push(pick)
  }
  return out
}
