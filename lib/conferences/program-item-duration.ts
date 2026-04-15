import type { ProgramItemType } from "@/types"

/** Types where we do not collect or display duration (minutes) in the planner. */
const WITHOUT_DURATION = new Set<ProgramItemType>([
  "presiding",
  "conducting",
  "pianist",
  "organist",
  "music_leader",
  "prelude_music",
  "invocation",
  "benediction",
])

export function programItemAllowsDuration(itemType: ProgramItemType): boolean {
  return !WITHOUT_DURATION.has(itemType)
}

/** Minutes counted toward session total / conducting sheet (excludes ceremonial rows). */
export function programItemMinutesForTotal(item: { item_type: ProgramItemType; duration_minutes?: number }): number {
  if (!programItemAllowsDuration(item.item_type)) return 0
  return item.duration_minutes || 0
}
