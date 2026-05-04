import {
  type AgendaItemConfig,
  getTemplateForMeetingType,
} from "@/lib/meetings/agenda-field-config"

/**
 * Editable agenda rows shown when scheduling a meeting (saved as `meeting_agendas`).
 */
export type AgendaDraftRow = {
  title: string
  /** Handbook / template note for this agenda item */
  sectionHint?: string | null
  notes: string
  duration_minutes: number | null
}

export function hasInAppAgendaTemplate(meetingType: string): boolean {
  return Boolean(meetingType && getTemplateForMeetingType(meetingType))
}

/** Default outline for a handbook meeting type (same structure as meeting detail Agenda tab). */
export function getDefaultAgendaDraftForMeetingType(meetingType: string): AgendaDraftRow[] {
  const t = getTemplateForMeetingType(meetingType)
  if (!t) return []
  return t.items.map((item: AgendaItemConfig) => ({
    title: item.title,
    sectionHint: item.description ?? null,
    notes: "",
    duration_minutes: item.duration_minutes ?? null,
  }))
}
