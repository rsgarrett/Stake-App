/** Tables that elevated leaders may export to CSV. Keep sensitive tables (users, audit_logs, messages, interview_notes) out. */
export const EXPORTABLE_TABLES = [
  { table: "meetings", label: "Meetings" },
  { table: "meeting_agendas", label: "Meeting agendas" },
  { table: "meeting_minutes", label: "Meeting minutes" },
  { table: "callings", label: "Callings" },
  { table: "leadership_positions", label: "Leadership positions" },
  { table: "calling_history", label: "Calling history" },
  { table: "interviews", label: "Interviews" },
  { table: "welfare_cases", label: "Welfare cases" },
  { table: "self_reliance_participants", label: "Self-reliance participants" },
  { table: "missionary_applications", label: "Missionary applications" },
  { table: "full_time_missionaries", label: "Full-time missionaries" },
  { table: "temple_attendance", label: "Temple attendance" },
  { table: "temple_assignments", label: "Temple assignments" },
  { table: "youth_programs", label: "Youth programs" },
  { table: "priesthood_advancements", label: "Priesthood advancements" },
  { table: "announcements", label: "Announcements" },
  { table: "special_events", label: "Stake conferences & special events" },
  { table: "events", label: "Calendar events" },
  { table: "training_records", label: "Training records" },
] as const

export type ExportableTable = (typeof EXPORTABLE_TABLES)[number]["table"]

export function isExportableTable(table: string): table is ExportableTable {
  return EXPORTABLE_TABLES.some((t) => t.table === table)
}
