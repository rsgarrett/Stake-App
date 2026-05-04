/**
 * Stake coordinating-council picker: only these handbook template slugs plus “custom”.
 * Compare using {@link normalizeMeetingTypeSlug}; DB duplicates collapse in {@link dedupeSchedulingStandardTemplates}.
 */

export const STAKE_PRESIDENCY_MEETING_TYPE_PREFERRED = "stake_presidency_meeting"
export const HIGH_COUNCIL_MEETING_TYPE_PREFERRED = "high_council_meeting"

/** Normalize for comparisons (trim, lower, hyphen/space collapse to `_`). */
export function normalizeMeetingTypeSlug(
  meetingType: string | null | undefined
): string {
  return String(meetingType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
}

/** Raw `standard_meeting_templates.meeting_type` values permitted in stakeholder scheduler UX. */
const SCHEDULER_MEETING_TYPES_RAW = [
  "stake_presidency_meeting",
  "stake_presidency",
  "stake_council",
  "high_council_meeting",
  "high_council",
  "bishops_council",
  "elders_quorum_presidents_council",
  "relief_society_presidents_council",
  "stake_finance_meeting",
  "stake_relief_society_presidency",
  "missionary_correlation",
  "temple_family_history",
] as const

export const SCHEDULABLE_STANDARD_MEETING_TYPES: readonly string[] =
  SCHEDULER_MEETING_TYPES_RAW

const SCHEDULER_SLUG_SET = new Set<string>(
  SCHEDULER_MEETING_TYPES_RAW.map((x) => normalizeMeetingTypeSlug(x))
)

/**
 * Rows allowed on the narrowed “Schedule meeting” handbook picker.
 * When editing legacy meetings, include `extraMeetingTypeRaw` so the current row survives filtering.
 */
export function templateAllowedInStakeMeetingScheduler(
  meetingTypeRaw: string | null | undefined,
  extraMeetingTypeRaw?: string | null
): boolean {
  const slug = normalizeMeetingTypeSlug(meetingTypeRaw)
  if (!slug) return false
  const extraSlug = normalizeMeetingTypeSlug(extraMeetingTypeRaw ?? "")
  if (extraSlug && slug === extraSlug) return true
  return SCHEDULER_SLUG_SET.has(slug)
}

export function isSchedulableStandardMeetingType(
  meetingType: string | null | undefined
): boolean {
  return templateAllowedInStakeMeetingScheduler(meetingType, undefined)
}

/** Display rows alphabetically by title (then meeting_type as a tiebreaker). */
export function sortSchedulableStandardTemplates<
  T extends { meeting_type: string; title?: string | null },
>(templates: T[]): T[] {
  const collator = new Intl.Collator("en", { sensitivity: "base" })

  return [...templates].sort((a, b) => {
    const titleA = (a.title ?? "").trim()
    const titleB = (b.title ?? "").trim()
    const byTitle = collator.compare(titleA, titleB)
    if (byTitle !== 0) return byTitle
    return collator.compare(a.meeting_type, b.meeting_type)
  })
}

/** Slug synonyms → one bucket for presidency variants. */
function isPresidencyVariantSlug(norm: string): boolean {
  return (
    norm === normalizeMeetingTypeSlug(STAKE_PRESIDENCY_MEETING_TYPE_PREFERRED) ||
    norm === normalizeMeetingTypeSlug("stake_presidency")
  )
}

/** Slug synonyms → one bucket for high council variants. */
function isHighCouncilVariantSlug(norm: string): boolean {
  return (
    norm === normalizeMeetingTypeSlug(HIGH_COUNCIL_MEETING_TYPE_PREFERRED) ||
    norm === normalizeMeetingTypeSlug("high_council")
  )
}

/**
 * Dedupe handbook rows so the picker stays short:
 * - duplicate slugs after normalization share one `<option>`
 * - presidency / HC synonym slugs collapse to preferred `meeting_type` strings
 */
export function dedupeSchedulingStandardTemplates<
  T extends { id: string; meeting_type: string },
>(templates: T[]): T[] {
  let bestPres: T | null = null
  let bestHc: T | null = null
  const byNormSlug = new Map<string, T>()

  for (const row of templates) {
    const slug = normalizeMeetingTypeSlug(row.meeting_type)
    if (!slug) continue

    if (isPresidencyVariantSlug(slug)) {
      if (
        !bestPres ||
        normalizeMeetingTypeSlug(row.meeting_type) ===
          normalizeMeetingTypeSlug(STAKE_PRESIDENCY_MEETING_TYPE_PREFERRED)
      ) {
        bestPres = {
          ...row,
          meeting_type: STAKE_PRESIDENCY_MEETING_TYPE_PREFERRED,
        } as T
      }
      continue
    }
    if (isHighCouncilVariantSlug(slug)) {
      if (
        !bestHc ||
        normalizeMeetingTypeSlug(row.meeting_type) ===
          normalizeMeetingTypeSlug(HIGH_COUNCIL_MEETING_TYPE_PREFERRED)
      ) {
        bestHc = {
          ...row,
          meeting_type: HIGH_COUNCIL_MEETING_TYPE_PREFERRED,
        } as T
      }
      continue
    }
    if (!byNormSlug.has(slug)) byNormSlug.set(slug, row)
  }

  const out: T[] = [...byNormSlug.values()]
  if (bestHc) out.push(bestHc)
  if (bestPres) out.push(bestPres)
  return sortSchedulableStandardTemplates(out)
}
