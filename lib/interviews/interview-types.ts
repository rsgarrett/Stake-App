/** Interview type value for mission interviews — ties schedule flow to Mission Ready tracker. */
export const MISSION_INTERVIEW_TYPE = "mission_interview" as const

/** Stored on `interviews.interview_type` (snake_case). Labels use English title case. */
export const INTERVIEW_TYPE_OPTIONS = [
  { value: "living_ordinance_recommend", label: "Living Ordinance Recommend" },
  { value: "temple_recommend_renewal", label: "Temple Recommend Renewal" },
  { value: "mission_interview", label: "Mission Interview" },
  { value: "calling", label: "Calling" },
  { value: "release", label: "Release" },
  { value: "bishop_1_on_1", label: "Bishop One-on-One" },
  { value: "other", label: "Other" },
] as const

const LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  INTERVIEW_TYPE_OPTIONS.map((o) => [o.value, o.label])
)

/** Previous schedule dropdown values — keep readable labels for existing rows. */
const LEGACY_INTERVIEW_TYPE_LABELS: Record<string, string> = {
  temple_recommend: "Temple Recommend",
  youth: "Youth Interview",
  membership_council: "Membership Council",
  worthiness: "Worthiness Interview",
  missionary: "Missionary Interview",
  new_member: "New Member Interview",
}

export function formatInterviewType(value: string): string {
  return (
    LABEL_BY_VALUE[value] ??
    LEGACY_INTERVIEW_TYPE_LABELS[value] ??
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  )
}
