/**
 * Defines how each agenda item should render its editable fields.
 *
 * "field_type" controls the UI:
 *   - "person"       → single name input (prayers, closing thoughts)
 *   - "hymn"         → hymn number + hymn name side-by-side
 *   - "trainer"      → person name + section/topic side-by-side
 *   - "sub_items"    → numbered list with + button (action items, callings, etc.)
 *   - "readonly"     → title only, no editable fields (stake vision)
 *   - "notes"        → single notes/description input
 *   - "person_notes" → person + notes side-by-side (closing thoughts, agenda planning)
 */
export type AgendaFieldType =
  | "person"
  | "hymn"
  | "trainer"
  | "sub_items"
  | "readonly"
  | "notes"
  | "person_notes"

export interface AgendaItemConfig {
  title: string
  field_type: AgendaFieldType
  duration_minutes: number
  placeholder?: string
  sub_item_placeholder?: string
  description?: string
}

export interface AgendaTemplateConfig {
  label: string
  meeting_types: string[]
  presiding_field: boolean
  conducting_field: boolean
  items: AgendaItemConfig[]
}

export const AGENDA_TEMPLATES: Record<string, AgendaTemplateConfig> = {
  high_council: {
    label: "High Council / Stake Council Meeting",
    meeting_types: ["high_council", "high_council_meeting", "stake_council", "stake_council_meeting"],
    presiding_field: true,
    conducting_field: true,
    items: [
      { title: "Review Calendar", field_type: "sub_items", duration_minutes: 5, sub_item_placeholder: "Add upcoming event or date" },
      { title: "Opening Hymn", field_type: "hymn", duration_minutes: 3 },
      { title: "Opening Prayer", field_type: "person", duration_minutes: 2, placeholder: "Who is giving the prayer?" },
      { title: "Stake Vision", field_type: "readonly", duration_minutes: 5 },
      { title: "Handbook Training", field_type: "trainer", duration_minutes: 10 },
      { title: "Action Items", field_type: "sub_items", duration_minutes: 10, sub_item_placeholder: "Add action item", description: "Assignments with bishoprics, ward councils, and EQ presidencies" },
      { title: "The Work of Salvation & Exaltation", field_type: "sub_items", duration_minutes: 30, sub_item_placeholder: "Add discussion item", description: "Administration items, decisions, and actions" },
      { title: "Agenda Planning", field_type: "notes", duration_minutes: 5, placeholder: "Notes for future agenda planning" },
      { title: "Callings & Ordinations", field_type: "sub_items", duration_minutes: 10, sub_item_placeholder: "Add name — calling (ward)" },
      { title: "Assignment Reports", field_type: "sub_items", duration_minutes: 10, sub_item_placeholder: "Add assignment report" },
      { title: "Quarterly Report Indicators (ICCG)", field_type: "sub_items", duration_minutes: 10, sub_item_placeholder: "Add indicator" },
      { title: "Closing Thoughts", field_type: "person_notes", duration_minutes: 5, placeholder: "Who is sharing closing thoughts?" },
      { title: "Closing Prayer", field_type: "person", duration_minutes: 2, placeholder: "Who is giving the prayer?" },
    ],
  },

  stake_presidency: {
    label: "Stake Presidency Meeting",
    meeting_types: ["stake_presidency", "stake_presidency_meeting"],
    presiding_field: true,
    conducting_field: true,
    items: [
      { title: "Calendar Review", field_type: "sub_items", duration_minutes: 5, sub_item_placeholder: "Add upcoming event or date" },
      { title: "Opening Prayer", field_type: "person", duration_minutes: 2, placeholder: "Who is giving the prayer?" },
      { title: "Stake Vision / Goal Review", field_type: "readonly", duration_minutes: 5 },
      { title: "Handbook Training", field_type: "trainer", duration_minutes: 15 },
      { title: "Action Items", field_type: "sub_items", duration_minutes: 10, sub_item_placeholder: "Add action item" },
      { title: "Callings & Recommendations", field_type: "sub_items", duration_minutes: 10, sub_item_placeholder: "Add name — calling (ward)" },
      { title: "Ward & Member Needs", field_type: "sub_items", duration_minutes: 10, sub_item_placeholder: "Add ward or member need" },
      { title: "Closing Prayer", field_type: "person", duration_minutes: 2, placeholder: "Who is giving the prayer?" },
    ],
  },

  relief_society: {
    label: "Stake Relief Society Presidency Meeting",
    meeting_types: ["stake_relief_society_presidency", "relief_society_presidency"],
    presiding_field: true,
    conducting_field: true,
    items: [
      { title: "Opening Prayer", field_type: "person", duration_minutes: 2, placeholder: "Who is giving the prayer?" },
      { title: "Spiritual Thought", field_type: "person_notes", duration_minutes: 5, placeholder: "Who is sharing?" },
      { title: "Calendar Review", field_type: "sub_items", duration_minutes: 5, sub_item_placeholder: "Add upcoming event or date" },
      { title: "Ward RS Presidency Reports", field_type: "sub_items", duration_minutes: 15, sub_item_placeholder: "Add ward report" },
      { title: "Ministering Discussion", field_type: "sub_items", duration_minutes: 10, sub_item_placeholder: "Add discussion item" },
      { title: "Training / Handbook Topic", field_type: "trainer", duration_minutes: 10 },
      { title: "Action Items", field_type: "sub_items", duration_minutes: 10, sub_item_placeholder: "Add action item" },
      { title: "Closing Prayer", field_type: "person", duration_minutes: 2, placeholder: "Who is giving the prayer?" },
    ],
  },
}

export function getTemplateForMeetingType(meetingType: string): AgendaTemplateConfig | undefined {
  if (!meetingType) return undefined
  for (const config of Object.values(AGENDA_TEMPLATES)) {
    if (config.meeting_types.includes(meetingType)) return config
  }
  return undefined
}

export function getFieldTypeForTitle(title: string, meetingType?: string): AgendaFieldType {
  const lower = title.toLowerCase()

  if (meetingType) {
    const template = getTemplateForMeetingType(meetingType)
    if (template) {
      const match = template.items.find((i) => i.title.toLowerCase() === lower)
      if (match) return match.field_type
    }
  }

  if (lower.includes("hymn")) return "hymn"
  if (lower.includes("prayer")) return "person"
  if (lower.includes("handbook") || lower.includes("training / handbook")) return "trainer"
  if (lower.includes("stake vision") || lower.includes("vision / goal")) return "readonly"
  if (lower.includes("closing thought")) return "person_notes"
  if (lower.includes("agenda planning")) return "notes"

  if (
    lower.includes("action item") ||
    lower.includes("calendar") ||
    lower.includes("calling") ||
    lower.includes("ordination") ||
    lower.includes("recommendation") ||
    lower.includes("assignment report") ||
    lower.includes("quarterly") ||
    lower.includes("report indicator") ||
    lower.includes("salvation") ||
    lower.includes("ward & member") ||
    lower.includes("ward report") ||
    lower.includes("ministering")
  ) {
    return "sub_items"
  }

  return "person_notes"
}

export function getSubItemPlaceholder(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes("calendar")) return "Add upcoming event or date"
  if (lower.includes("action item")) return "Add action item"
  if (lower.includes("salvation")) return "Add discussion item"
  if (lower.includes("calling") || lower.includes("ordination") || lower.includes("recommendation")) return "Add name — calling (ward)"
  if (lower.includes("assignment report")) return "Add assignment report"
  if (lower.includes("quarterly") || lower.includes("indicator")) return "Add indicator"
  if (lower.includes("ward & member")) return "Add ward or member need"
  if (lower.includes("ward report") || lower.includes("ward rs")) return "Add ward report"
  if (lower.includes("ministering")) return "Add discussion item"
  return "Add item"
}
