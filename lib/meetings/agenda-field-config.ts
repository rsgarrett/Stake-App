/**
 * In-app handbook agenda templates for stake meetings.
 *
 * Each meeting type maps to a list of {@link AgendaItemConfig} rows. The detail
 * page renders the right input(s) based on `field_type`:
 *
 *   - "person"        → single name input (prayers)
 *   - "hymn"          → hymn number + hymn name side-by-side
 *   - "trainer"       → person name + section/topic side-by-side
 *   - "sub_items"     → numbered list with + button (action items, callings, council topics, etc.)
 *   - "readonly"      → title only, no editable fields (stake vision)
 *   - "notes"         → single multi-line notes input
 *   - "person_notes"  → person + notes side-by-side (closing thoughts/remarks)
 *
 * The structure is informed by the live Google-Doc agendas the stake currently
 * uses, plus light reorganization for accountability:
 *   • "Action Item Review" appears early to drive follow-through on prior assignments
 *   • Every meeting closes with "New Assignments" so commitments are explicit
 *   • Closing thoughts/remarks are captured before the closing prayer
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
  sub_item_placeholder: "Add upcoming event (date, time, where)",
  description: "Upcoming meetings, conferences, ministering visits, and stake events",
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
    "Read the stake vision aloud to anchor the meeting on Christ and on becoming Zion.",
}

const handbookTraining: AgendaItemConfig = {
  title: "Handbook Training",
  field_type: "trainer",
  duration_minutes: 10,
  description: "Trainer + section/topic from the General Handbook",
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

const actionItemReview: AgendaItemConfig = {
  title: "Action Item Review",
  field_type: "sub_items",
  duration_minutes: 10,
  sub_item_placeholder: "Owner — assignment — status",
  description: "Status of assignments from the previous meeting",
}

const newAssignments: AgendaItemConfig = {
  title: "New Assignments",
  field_type: "sub_items",
  duration_minutes: 5,
  sub_item_placeholder: "Owner — assignment — due",
  description: "Capture every commitment so it can be tracked next meeting",
}

const coordinatingCouncilUpdates: AgendaItemConfig = {
  title: "Coordinating Council Updates",
  field_type: "sub_items",
  duration_minutes: 10,
  sub_item_placeholder: "Add direction or note from coordinating council",
  description: "Cascade items from the most recent area / coordinating council",
}

// -------- Templates ----------------------------------------------------------

export const AGENDA_TEMPLATES: Record<string, AgendaTemplateConfig> = {
  // ---------- Stake Presidency Meeting -------------------------------------
  stake_presidency: {
    label: "Stake Presidency Meeting",
    meeting_types: ["stake_presidency", "stake_presidency_meeting"],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarReview,
      openingPrayer,
      stakeVision,
      handbookTraining,
      {
        title: "Agenda Planning",
        field_type: "notes",
        duration_minutes: 10,
        placeholder:
          "Items to add to upcoming HC, Stake Council, or coordinating council agendas",
        description:
          "Decide what goes on the next high council, stake council, and presidents' council agendas",
      },
      {
        title: "Callings, Sustainings & Priesthood Advancement",
        field_type: "sub_items",
        duration_minutes: 15,
        sub_item_placeholder: "Name — calling/ordination — ward — status",
        description:
          "Calling tracker review, new submissions, sustainings to be set apart/ordained/recorded",
      },
      {
        title: "Stake Business",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Add stake business item",
        description: "Standing items requiring presidency decision or action",
      },
      {
        title: "God's Work of Salvation & Exaltation",
        field_type: "sub_items",
        duration_minutes: 30,
        sub_item_placeholder: "Topic — owner — desired result (TBD/Decision/Action)",
        description: "Administration, ward & member needs, and ministry decisions",
      },
      actionItemReview,
      newAssignments,
      closingPrayer,
    ],
  },

  // ---------- High Council & Stake Council ---------------------------------
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
        sub_item_placeholder: "Missionary name — mission — testimony/highlights",
        description: "Recently returned missionaries report and the council asks questions",
      },
      {
        title: "Action Item Review",
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
        sub_item_placeholder: "Core area — item — result (TBD/Decision/Action)",
        description: "Administration items, decisions, and actions",
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
        sub_item_placeholder: "Stewardship — how it furthers the stake vision",
        description:
          "Rotating high councilor reports tied to ward stewardship and the stake vision",
      },
      {
        title: "Quarterly Report Indicators (ICCG)",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Indicator — observation",
      },
      {
        title: "Agenda Planning",
        field_type: "notes",
        duration_minutes: 5,
        placeholder: "Items for the next high council / stake council agenda",
      },
      newAssignments,
      closingThoughts,
      closingPrayer,
    ],
  },

  // ---------- Bishops' Council ---------------------------------------------
  bishops_council: {
    label: "Stake Bishops' Council Meeting",
    meeting_types: ["bishops_council", "stake_bishops_council"],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarReview,
      openingHymn,
      openingPrayer,
      stakeVision,
      coordinatingCouncilUpdates,
      {
        title: "Council Topics",
        field_type: "sub_items",
        duration_minutes: 35,
        sub_item_placeholder: "Topic — desired result (discussion / decision / action)",
        description: "Stake president-led counsel with bishops on ward matters",
      },
      {
        title: "Worthiness, Recommends & Priesthood Advancement",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Bishop / ward — interview or advancement note",
        description:
          "Coordinate Melchizedek priesthood advancements, recommend renewals, and timing of interviews",
      },
      {
        title: "Sacrament Meeting Coordination",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Date — speakers/topic — ward",
        description:
          "Plan upcoming joint sacrament meeting topics, speakers, and special events",
      },
      actionItemReview,
      newAssignments,
      closingThoughts,
      closingPrayer,
    ],
  },

  // ---------- Elders Quorum Presidents' Council ----------------------------
  elders_quorum_presidents_council: {
    label: "Elders Quorum Presidents' Council Meeting",
    meeting_types: [
      "elders_quorum_presidents_council",
      "stake_elders_quorum_council",
      "elders_quorum_council",
    ],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarReview,
      openingHymn,
      openingPrayer,
      stakeVision,
      coordinatingCouncilUpdates,
      {
        title: "Council Topics",
        field_type: "sub_items",
        duration_minutes: 30,
        sub_item_placeholder: "Topic — desired result",
        description: "Counsel together on quorum work across the stake",
      },
      {
        title: "Ministering & Quorum Health",
        field_type: "sub_items",
        duration_minutes: 15,
        sub_item_placeholder: "Ward — what's working / what to improve",
        description: "Ministering interviews, prospective elders, quorum activation",
      },
      {
        title: "Missionary Work & Ward Mission Plan",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Ward — observation or assignment",
        description:
          "Coordinate with WMLs and full-time missionaries; review the ward mission plan",
      },
      actionItemReview,
      newAssignments,
      closingThoughts,
      closingPrayer,
    ],
  },

  // ---------- Relief Society Presidents' Council ---------------------------
  relief_society_presidents_council: {
    label: "Relief Society Presidents' Council Meeting",
    meeting_types: [
      "relief_society_presidents_council",
      "stake_relief_society_council",
    ],
    presiding_field: true,
    conducting_field: true,
    items: [
      calendarReview,
      openingHymn,
      openingPrayer,
      stakeVision,
      coordinatingCouncilUpdates,
      {
        title: "Council Topics",
        field_type: "sub_items",
        duration_minutes: 30,
        sub_item_placeholder: "Topic — desired result",
        description: "Counsel together on Relief Society work across the stake",
      },
      {
        title: "Ministering Discussion",
        field_type: "sub_items",
        duration_minutes: 15,
        sub_item_placeholder: "Ward — what's working / what to improve",
        description: "Ministering interviews, sister activation, ward needs",
      },
      {
        title: "Stake Activities & Conferences",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Activity — date — owner",
        description:
          "Plan upcoming stake RS events, women's session, and ward conference participation",
      },
      actionItemReview,
      newAssignments,
      closingThoughts,
      closingPrayer,
    ],
  },

  // ---------- Stake Relief Society (Presidency / Coordination) ------------
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
      {
        title: "Handbook Instruction",
        field_type: "trainer",
        duration_minutes: 10,
        description: "Trainer + handbook section",
      },
      actionItemReview,
      {
        title: "Group Discussion",
        field_type: "sub_items",
        duration_minutes: 25,
        sub_item_placeholder: "Topic — discussion notes",
        description: "Coordinated planning across stake auxiliaries and wards",
      },
      {
        title: "Ward Reports",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Ward — report or need",
      },
      newAssignments,
      closingRemarks,
      closingPrayer,
    ],
  },

  // ---------- Stake Missionary Correlation Meeting -------------------------
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
      actionItemReview,
      {
        title: "Discussion / Training",
        field_type: "trainer",
        duration_minutes: 15,
        description: "Trainer + topic (e.g., generating non-member interest)",
      },
      {
        title: "Ward Mission Plan Reports",
        field_type: "sub_items",
        duration_minutes: 20,
        sub_item_placeholder: "Ward — WML report — what's working / needs",
        description: "Each ward briefly reports on their ward mission plan and key indicators",
      },
      {
        title: "Convert Baptisms & New Member Retention",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Ward — name — first-week temple visit / assignment",
        description:
          "Coordinate to get every new convert to the temple within their first week",
      },
      newAssignments,
      closingRemarks,
      closingPrayer,
    ],
  },

  // ---------- Stake Temple & Family History Correlation Meeting ------------
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
      actionItemReview,
      {
        title: "Training",
        field_type: "trainer",
        duration_minutes: 15,
        description: "Trainer + topic (handbook/manual or video resource)",
      },
      {
        title: "Convert Baptism Coordination",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Ward — convert name — temple visit plan",
        description:
          "Help every new convert find a name and attend the temple in their first week",
      },
      {
        title: "Ward Reports",
        field_type: "sub_items",
        duration_minutes: 15,
        sub_item_placeholder: "Ward — consultants — temple/FH activity",
        description:
          "Ward T&FH leaders share the status of their plan and youth consultants",
      },
      newAssignments,
      closingRemarks,
      closingPrayer,
    ],
  },

  // ---------- Stake Finance Meeting ----------------------------------------
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
        description: "Audits, tithing settlement window, year-end deadlines",
      },
      openingPrayer,
      stakeVision,
      {
        title: "Audit Status",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Ward / unit — audit finding — corrective action",
        description: "Most recent audit results and outstanding corrective actions",
      },
      {
        title: "Stake Budget Review",
        field_type: "sub_items",
        duration_minutes: 15,
        sub_item_placeholder: "Category — variance — action",
        description:
          "Year-to-date stake budget vs. plan; reallocations and large upcoming spends",
      },
      {
        title: "Ward Budget & Activity Funding",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Ward — request / concern — decision",
        description: "Decisions on requests from ward bishoprics and clerks",
      },
      {
        title: "Donations & Tithing Settlement",
        field_type: "sub_items",
        duration_minutes: 10,
        sub_item_placeholder: "Topic — owner",
        description: "Coordination of donations workflow and tithing settlement",
      },
      actionItemReview,
      newAssignments,
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
  if (lower.includes("handbook training") || lower.includes("handbook instruction"))
    return "trainer"
  if (
    lower === "training" ||
    lower.startsWith("training ") ||
    lower.includes("discussion / training") ||
    lower.includes("training / handbook")
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
    lower.includes("ward mission") ||
    lower.includes("ministering") ||
    lower.includes("council topic") ||
    lower.includes("coordinating council") ||
    lower.includes("convert baptism") ||
    lower.includes("audit") ||
    lower.includes("budget") ||
    lower.includes("donation") ||
    lower.includes("tithing") ||
    lower.includes("group discussion") ||
    lower.includes("returned missionary") ||
    lower.includes("worthiness") ||
    lower.includes("sacrament meeting coordination") ||
    lower.includes("stake activities") ||
    lower.includes("deadlines")
  ) {
    return "sub_items"
  }

  return "person_notes"
}

export function getSubItemPlaceholder(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes("calendar") || lower.includes("deadline"))
    return "Add upcoming event or date"
  if (lower.includes("action item review")) return "Owner — assignment — status"
  if (lower.includes("new assignment")) return "Owner — assignment — due"
  if (lower.includes("action item")) return "Owner — assignment — status"
  if (lower.includes("salvation")) return "Topic — owner — desired result"
  if (
    lower.includes("calling") ||
    lower.includes("ordination") ||
    lower.includes("recommendation")
  )
    return "Person — ward — proposed calling"
  if (lower.includes("assignment report"))
    return "Stewardship — how it furthers the stake vision"
  if (lower.includes("quarterly") || lower.includes("indicator"))
    return "Indicator — observation"
  if (lower.includes("ward & member")) return "Add ward or member need"
  if (lower.includes("ward mission")) return "Ward — WML report — what's working / needs"
  if (lower.includes("ward report") || lower.includes("ward rs")) return "Ward — report or need"
  if (lower.includes("ministering")) return "Ward — what's working / what to improve"
  if (lower.includes("council topic")) return "Topic — desired result"
  if (lower.includes("coordinating council")) return "Add direction or note from coordinating council"
  if (lower.includes("convert baptism")) return "Ward — convert — temple plan"
  if (lower.includes("returned missionary")) return "Missionary — mission — highlights"
  if (lower.includes("audit")) return "Ward / unit — finding — corrective action"
  if (lower.includes("budget")) return "Category — variance — action"
  if (lower.includes("donation") || lower.includes("tithing")) return "Topic — owner"
  if (lower.includes("group discussion")) return "Topic — discussion notes"
  if (lower.includes("stake activities")) return "Activity — date — owner"
  if (lower.includes("worthiness") || lower.includes("recommend"))
    return "Bishop / ward — interview or advancement"
  if (lower.includes("sacrament meeting coordination"))
    return "Date — speakers/topic — ward"
  return "Add item"
}
