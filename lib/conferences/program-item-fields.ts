import type { ConferenceProgramItem, ProgramItemType } from "@/types"
import { PROGRAM_ITEM_LABELS } from "@/lib/conferences/program-item-labels"
import {
  isStandardLagFixedProgramItemType,
  sessionUsesStandardOpeningBlock,
} from "@/lib/conferences/standard-opening-block"

/** Item types offered by "Add item" inside stake conference sessions (between invocation and closing hymn). */
export const CONFERENCE_ADD_ITEM_TYPES: ProgramItemType[] = [
  "speaker",
  "testimony",
  "breakout",
  "discussion",
  "intermediate_hymn",
  "special_musical_number",
]

/**
 * Type picker options for a program item row.
 * Stake conference sessions (leadership / adult / general) get the narrowed
 * appointment list; other sessions keep the full non-fixed catalog. The row's
 * current type is always included so existing data still displays correctly.
 */
export function programItemTypeOptions(
  sessionType: string,
  currentType?: ProgramItemType
): Array<[ProgramItemType, string]> {
  const base: ProgramItemType[] = sessionUsesStandardOpeningBlock(sessionType)
    ? [...CONFERENCE_ADD_ITEM_TYPES]
    : (Object.keys(PROGRAM_ITEM_LABELS) as ProgramItemType[]).filter(
        (t) => !isStandardLagFixedProgramItemType(t)
      )
  if (currentType && !base.includes(currentType)) base.unshift(currentType)
  return base.map((t) => [t, PROGRAM_ITEM_LABELS[t] || t])
}

interface FieldSpec {
  label: string
  placeholder: string
}

/** Which inputs make sense for a program item type (duration visibility stays with programItemAllowsDuration). */
export interface ProgramItemFieldConfig {
  /** `assigned_to` input (speaker / performer / person). Omitted when the type has no person. */
  name?: FieldSpec
  /** `topic` input (topic, hymn name, piece, breakout subject). Omitted when not applicable. */
  topic?: FieldSpec
  /** `hymn_number` input, shown for hymn rows. */
  hymnNumber?: FieldSpec
}

export function programItemFieldConfig(itemType: ProgramItemType): ProgramItemFieldConfig {
  switch (itemType) {
    case "speaker":
    case "speaker_primary":
    case "speaker_youth":
      return {
        name: { label: "Speaker", placeholder: "Speaker name…" },
        topic: { label: "Topic", placeholder: "Topic…" },
      }
    case "testimony":
      return { name: { label: "Name", placeholder: "Who is bearing testimony?" } }
    case "breakout":
      return { topic: { label: "Breakout", placeholder: "Breakout topic / group…" } }
    case "discussion":
      return { topic: { label: "Discussion", placeholder: "Discussion topic…" } }
    case "intermediate_hymn":
      return {
        hymnNumber: { label: "Hymn #", placeholder: "#" },
        topic: { label: "Hymn name", placeholder: "Hymn name…" },
      }
    case "opening_hymn":
    case "closing_hymn":
      return {
        name: { label: "Name", placeholder: "Name…" },
        hymnNumber: { label: "Hymn #", placeholder: "#" },
        topic: { label: "Hymn name", placeholder: "Hymn name…" },
      }
    case "special_musical_number":
      return {
        name: { label: "Performer(s)", placeholder: "Performer(s)…" },
        topic: { label: "Musical number", placeholder: "Song / piece…" },
      }
    default:
      return {
        name: { label: "Name", placeholder: "Name…" },
        topic: { label: "Topic", placeholder: "Topic…" },
      }
  }
}

/** Display text for the Topic / Hymn column, combining hymn number and name when both are set. */
export function programItemTopicText(item: Pick<ConferenceProgramItem, "topic" | "hymn_number">): string {
  const num = item.hymn_number?.trim()
  const topic = item.topic?.trim()
  if (num && topic) return `#${num} — ${topic}`
  if (num) return `#${num}`
  return topic || ""
}
