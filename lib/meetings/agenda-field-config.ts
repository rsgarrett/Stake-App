/**
 * In-app handbook agenda templates for stake meetings.
 *
 * Each template mirrors the structure of the corresponding Google-Doc agenda
 * the stake currently uses, rendered with native in-app input fields. The
 * detail page picks the right input(s) based on `field_type`:
 *
 *   - "person"        → single name input (prayers)
 *   - "hymn"          → hymn number + hymn name side-by-side
 *   - "trainer"       → person name + section/topic side-by-side
 *   - "sub_items"     → numbered list with + button (action items, council topics, callings, etc.)
 *   - "readonly"      → title only, no editable fields (stake vision)
 *   - "notes"         → single multi-line notes input
 *   - "person_notes"  → person + notes side-by-side (closing thoughts/remarks)
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
  /** Short hint shown beneath the agenda item title */
  description?: string
}

export interface AgendaTemplateConfig {
  label: string
  meeting_types: string[]
  presiding_field: boolean
  conducting_field: boolean
  items: AgendaItemConfig[]
}

/** Match DB slugs permissively (case, spaces, hyphen vs underscore). */
function slugNorm(mt: string): string {
  return String(mt ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
}

// -------- Reusable item builders ---------------------------------------------

const calendarReview: AgendaItemConfig = {
  title: "Calendar Review",
  field_type: "sub_items",
  duration_minutes: 5,
  sub_item_placeholder: "Date — time — event",
  description: "Upcoming meetings, conferences, and stake events",
}

const calendarItems: AgendaItemConfig = {
  title: "Calendar Items",
  field_type: "sub_items",
  duration_minutes: 5,
  sub_item_placeholder: "Date — time — event",
  description: "Calendar items for your information",
}

const openingHymn: AgendaItemConfig = {
  title: "Opening Hymn",
  field_type: "hymn",
  duration_minutes: 3,
}

const openingPrayer: AgendaItemConfig = {
  title: "Opening Prayer",
  field_type: "person",
  duration_minutes: 2,
  placeholder: "Who is giving the prayer?",
}

const stakeVision: AgendaItemConfig = {
  title: "Stake Vision",
  field_type: "readonly",
  duration_minutes: 3,
  description:
    "We are centered on Jesus Christ and His atonement and are establishing Zion by loving God and our neighbors as ourselves.",
}

const handbookTraining: AgendaItemConfig = {
  title: "Handbook Training",
  field_type: "trainer",
  duration_minutes: 10,
  description: "Trainer + handbook section / topic",
}

const handbookInstruction: AgendaItemConfig = {
  title: "Handbook Instruction",
  field_type: "trainer",
  duration_minutes: 10,
  description: "Trainer + handbook section / topic",
}

const closingThoughts: AgendaItemConfig = {
  title: "Closing Thoughts",
  field_type: "person_notes",
  duration_minutes: 3,
  placeholder: "Who is sharing closing thoughts?",
}

const closingRemarks: AgendaItemConfig = {
  title: "Closing Remarks",
  field_type: "person_notes",
  duration_minutes: 3,
  placeholder: "Who is sharing closing remarks?",
}

const closingPrayer: AgendaItemConfig = {
  title: "Closing Prayer",
  field_type: "person",
  duration_minutes: 2,
  placeholder: "Who is giving the prayer?",
}

// -------- Templates ----------------------------------------------------------

export const AGENDA_TEMPLATES: Record<string, AgendaTemplateConfig> = {
  // ---------- Stake Presidency Meeting -------------------------------------
  // Source: "Stake Pres Mtg Agenda Perpetual" Google Doc
  stake_presidency: {
    label: "Stake Presidency Meeting",
    meeting_types: ["stake_presidency", "stake_presidency_meeting"],
    presiding_field: true,
    conducting_field: true,
    items: [
      {
        title: "Review Calendar Items / Announcements",
        field_type: "sub_items",
        duration_minutes: 5,
        sub_item_placeholder: "Date — time — event",
      },
      openingPrayer,
      stakeVision,
      handbookTraining,
      {
        title: "Agenda Planning",
        field_type: "notes",
        duration_minutes: 15,
        placeholder:
          "Items for the next high council, stake council, and coordinating council agendas",
        description:
          "Agenda Planning, Stake Planning Calendar, HC Return & Report Survey, TR Interviews Schedule",
      },
      {
        title: "Callings, Sustainings & Priesthood Advancement",
        field_type: "sub_items",
        duration_minutes: 15,
        sub_item_placeholder: "Person — ward — calling/ordination — status",
        description:
          "Calling Tracker, New Calling Submissions, Sustained-to-be-Set-Apart, Stake Business",
      },
      {
        title: "God's Work of Salvation & Exaltation",
        field_type: "sub_items",
        duration_minutes: 45,
        sub_item_placeholder: "Core area — item — result (TBD/Decision/Action)",
        description: "Administration items, decisions, and actions",
      },
      closingPrayer,
    ],
  },

  // ---------- High Council & Stake Council ---------------------------------
  // Source: "2026 High Council & Stake Council_perpetual" Google Doc
  high_council: {
    label: "High Council / Stake Council Meeting",
    meeting_types: [
      "high_council",
      "high_council_meeting",
      "stake_council",
      "stake_council_meeting",
    ],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarReview,
      openingHymn,
      openingPrayer,
      stakeVision,
      handbookTraining,
      {
        title: "Returned Missionary Reports",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Missionary — mission — highlights",
      },
      {
        title: "Action Items",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Who — status — assignment",
        description:
          "Assignments with bishoprics, ward councils, and EQ/RS presidencies",
      },
      {
        title: "The Work of Salvation & Exaltation",
        field_type: "sub_items",
        duration_minutes: 30,
        sub_item_placeholder: "Divinely appointed responsibility — item — result",
        description: "Administration / Assign — item & result (TBD/Decision/Action)",
      },
      {
        title: "Agenda Planning",
        field_type: "notes",
        duration_minutes: 5,
        placeholder: "Items for the next high council / stake council agenda",
      },
      {
        title: "Callings & Ordinations",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Person — ward — proposed calling — assigned to",
      },
      {
        title: "Assignment Reports",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "High councilor — stewardship — report",
        description:
          "How does your stewardship help to further the vision of the stake?",
      },
      {
        title: "Quarterly Report Indicators (ICCG)",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Indicator — observation",
      },
      {
        title: "Additional Items",
        field_type: "sub_items",
        duration_minutes: 5,
        sub_item_placeholder: "Add additional item",
      },
      closingThoughts,
      closingPrayer,
    ],
  },

  // ---------- Bishops' Council ---------------------------------------------
  // Source: "Stake Bishops' Council Meeting" Google Doc
  bishops_council: {
    label: "Stake Bishops' Council Meeting",
    meeting_types: ["bishops_council", "stake_bishops_council"],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarItems,
      openingHymn,
      openingPrayer,
      stakeVision,
      {
        title: "Agenda — Council Topics",
        field_type: "sub_items",
        duration_minutes: 60,
        sub_item_placeholder: "Topic — desired result (Council/Decision/Action)",
        description: "Core area — item & result; capture notes for each topic",
      },
      closingPrayer,
    ],
  },

  // ---------- Elders Quorum Presidents' Council ----------------------------
  // Source: "Stake Elders Quorum Council" Google Doc
  elders_quorum_presidents_council: {
    label: "Stake Elders Quorum Presidents' Council",
    meeting_types: [
      "elders_quorum_presidents_council",
      "stake_elders_quorum_council",
      "elders_quorum_council",
    ],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarItems,
      openingHymn,
      openingPrayer,
      stakeVision,
      {
        title: "Agenda — Council Topics",
        field_type: "sub_items",
        duration_minutes: 60,
        sub_item_placeholder: "Topic — desired result (Council/Decision/Action)",
        description: "Core area — item & result; capture notes for each topic",
      },
      closingPrayer,
    ],
  },

  // ---------- Relief Society Presidents' Council ---------------------------
  // Source: "Stake Relief Society Council" Google Doc
  relief_society_presidents_council: {
    label: "Stake Relief Society Presidents' Council",
    meeting_types: [
      "relief_society_presidents_council",
      "stake_relief_society_council",
    ],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarItems,
      openingHymn,
      openingPrayer,
      stakeVision,
      {
        title: "Agenda — Council Topics",
        field_type: "sub_items",
        duration_minutes: 60,
        sub_item_placeholder: "Topic — desired result (Council/Decision/Action)",
        description: "Core area — item & result; capture notes for each topic",
      },
      closingPrayer,
    ],
  },

  // ---------- Stake Relief Society (Coordination) -------------------------
  // Source: "Relief Society Coordination Meeting Agenda_perpetual" Google Doc
  stake_relief_society_presidency: {
    label: "Stake Relief Society Coordination Meeting",
    meeting_types: [
      "stake_relief_society_presidency",
      "relief_society_presidency",
      "stake_relief_society_coordination",
    ],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarReview,
      openingPrayer,
      stakeVision,
      handbookInstruction,
      {
        title: "Action Item: Reports",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Assigned to — status — assignment",
        description: "Brief reports on assignments and action items",
      },
      {
        title: "Training",
        field_type: "trainer",
        duration_minutes: 15,
        description: "Conducted by + topic",
      },
      {
        title: "Group Discussion",
        field_type: "sub_items",
        duration_minutes: 25,
        sub_item_placeholder: "Topic — notes",
      },
      {
        title: "Action Item: New Assignments",
        field_type: "sub_items",
        duration_minutes: 5,
        sub_item_placeholder: "Assigned to — status — assignment",
      },
      closingRemarks,
      closingPrayer,
    ],
  },

  // ---------- Stake Missionary Correlation Meeting -------------------------
  // Source: "Stake Missionary Coordination Meeting" Google Doc
  missionary_correlation: {
    label: "Stake Missionary Correlation Meeting",
    meeting_types: [
      "missionary_correlation",
      "stake_missionary_coordination",
      "stake_missionary_correlation",
    ],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarReview,
      openingPrayer,
      stakeVision,
      {
        title: "Action Item: Reports",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Assigned to — status — assignment",
        description: "Brief reports on assignments and action items",
      },
      {
        title: "Discussion / Training",
        field_type: "trainer",
        duration_minutes: 15,
        description: "Conducted by + topic",
      },
      {
        title: "Action Item: New Assignments",
        field_type: "sub_items",
        duration_minutes: 5,
        sub_item_placeholder: "Assigned to — status — assignment",
        description: "Brief reports on new assignments and action items",
      },
      closingRemarks,
      closingPrayer,
    ],
  },

  // ---------- Stake Temple & Family History Correlation Meeting ------------
  // Source: "Temple & Family History Coordination Meeting" Google Doc
  temple_family_history: {
    label: "Stake Temple & Family History Correlation Meeting",
    meeting_types: [
      "temple_family_history",
      "stake_temple_family_history_coordination",
      "temple_and_family_history_coordination",
    ],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarReview,
      openingHymn,
      openingPrayer,
      stakeVision,
      {
        title: "Action Items",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Assigned to — status — assignment",
        description: "Brief reports on assignments and action items",
      },
      {
        title: "Training",
        field_type: "trainer",
        duration_minutes: 15,
        description: "Conducted by + topic",
      },
      {
        title: "Group Discussion",
        field_type: "sub_items",
        duration_minutes: 20,
        sub_item_placeholder: "Topic — notes",
      },
      closingRemarks,
      closingPrayer,
    ],
  },

  // ---------- Stake Finance Meeting ----------------------------------------
  // No source doc — handbook-aligned default outline.
  stake_finance_meeting: {
    label: "Stake Finance Meeting",
    meeting_types: ["stake_finance_meeting", "stake_finance"],
    presiding_field: true,
    conducting_field: true,
    items: [
      {
        title: "Calendar & Deadlines",
        field_type: "sub_items",
        duration_minutes: 5,
        sub_item_placeholder: "Date — finance/audit deadline or event",
      },
      openingPrayer,
      stakeVision,
      {
        title: "Audit Status",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Ward / unit — finding — corrective action",
      },
      {
        title: "Stake Budget Review",
        field_type: "sub_items",
        duration_minutes: 15,
        sub_item_placeholder: "Category — variance — action",
      },
      {
        title: "Ward Budget & Activity Funding",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Ward — request / concern — decision",
      },
      {
        title: "Donations & Tithing Settlement",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Topic — owner",
      },
      closingPrayer,
    ],
  },
}

// -------- Lookup helpers -----------------------------------------------------

export function getTemplateForMeetingType(
  meetingType: string
): AgendaTemplateConfig | undefined {
  if (!meetingType) return undefined
  const wanted = slugNorm(meetingType)
  if (!wanted) return undefined
  for (const config of Object.values(AGENDA_TEMPLATES)) {
    if (config.meeting_types.some((mt) => slugNorm(mt) === wanted)) return config
  }
  return undefined
}

export function getFieldTypeForTitle(
  title: string,
  meetingType?: string
): AgendaFieldType {
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
  if (
    lower.includes("handbook training") ||
    lower.includes("handbook instruction") ||
    lower.includes("training / handbook")
  )
    return "trainer"
  if (
    lower === "training" ||
    lower.startsWith("training ") ||
    lower.startsWith("training:") ||
    lower.includes("discussion / training") ||
    lower.includes("discussion/training")
  )
    return "trainer"
  if (lower.includes("stake vision") || lower.includes("vision / goal"))
    return "readonly"
  if (lower.includes("closing thought") || lower.includes("closing remark"))
    return "person_notes"
  if (lower.includes("agenda planning")) return "notes"

  if (
    lower.includes("action item") ||
    lower.includes("calendar") ||
    lower.includes("calling") ||
    lower.includes("ordination") ||
    lower.includes("recommendation") ||
    lower.includes("assignment") ||
    lower.includes("quarterly") ||
    lower.includes("report indicator") ||
    lower.includes("salvation") ||
    lower.includes("ward & member") ||
    lower.includes("ward report") ||
    lower.includes("ministering") ||
    lower.includes("council topic") ||
    lower.includes("topic") ||
    lower.includes("returned missionary") ||
    lower.includes("audit") ||
    lower.includes("budget") ||
    lower.includes("donation") ||
    lower.includes("tithing") ||
    lower.includes("group discussion") ||
    lower.includes("additional items") ||
    lower.includes("deadlines")
  ) {
    return "sub_items"
  }

  return "person_notes"
}

export function getSubItemPlaceholder(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes("calendar") || lower.includes("deadline"))
    return "Date — time — event"
  if (lower.includes("action item")) return "Assigned to — status — assignment"
  if (lower.includes("salvation"))
    return "Divinely appointed responsibility — item — result"
  if (
    lower.includes("calling") ||
    lower.includes("ordination") ||
    lower.includes("recommendation")
  )
    return "Person — ward — proposed calling"
  if (lower.includes("assignment report"))
    return "High councilor — stewardship — report"
  if (lower.includes("quarterly") || lower.includes("indicator"))
    return "Indicator — observation"
  if (lower.includes("returned missionary"))
    return "Missionary — mission — highlights"
  if (lower.includes("audit")) return "Ward / unit — finding — corrective action"
  if (lower.includes("budget")) return "Category — variance — action"
  if (lower.includes("donation") || lower.includes("tithing")) return "Topic — owner"
  if (lower.includes("group discussion") || lower.includes("topic"))
    return "Topic — notes"
  if (lower.includes("additional items")) return "Add additional item"
  if (lower.includes("council topic"))
    return "Topic — desired result (Council/Decision/Action)"
  return "Add item"
}
