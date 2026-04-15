/**
 * Perpetual agenda templates (e.g. Google Docs) keyed by `meetings.meeting_type` /
 * `standard_meeting_templates.meeting_type`.
 *
 * Add more entries here as new agenda docs are created.
 */
export const MEETING_AGENDA_TEMPLATE_URLS: Record<string, string> = {
  stake_presidency_meeting:
    "https://docs.google.com/document/d/1lrYGFxacWwvf-ZyyqdlWNywsoJeBPwzg-s1U3oRrpik/edit",
  high_council_meeting:
    "https://docs.google.com/document/d/1AZ36CXBEvNPKdQEQLINznylIE2BxvNee8wuM4R7Hz8c/edit",
  stake_council:
    "https://docs.google.com/document/d/1AZ36CXBEvNPKdQEQLINznylIE2BxvNee8wuM4R7Hz8c/edit",
  stake_relief_society_presidency:
    "https://docs.google.com/document/d/1BWeg_S86u15LKXDzt3u5_gNy0dp1-UI-xLbU-sygw4Q/edit",
}

export function getAgendaTemplateUrl(meetingType: string): string | undefined {
  if (!meetingType) return undefined
  return MEETING_AGENDA_TEMPLATE_URLS[meetingType]
}

export function hasAgendaTemplate(meetingType: string): boolean {
  return Boolean(meetingType && MEETING_AGENDA_TEMPLATE_URLS[meetingType])
}
