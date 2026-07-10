/**
 * Per-person calendar filtering for the Meetings & Conferences page.
 *
 * Everyone signed in sees only their own calendar: shared meetings their role
 * attends, plus the Sunday visit/teaching rows tagged with their name, plus
 * interviews assigned to them. The stake president additionally gets a
 * "View calendar for" dropdown listing every roster seat, so he can look at any
 * leader's calendar (or the full stake calendar).
 */

import { presenterMatchesUser, UNASSIGNED_INTERVIEW_ROLES } from "@/lib/meetings/next-appointment"
import { appRoleForOfficeSlug, labelForOfficeSlug } from "@/lib/settings/stake-office-slugs"

/** The person whose calendar is being viewed. */
export interface CalendarPerson {
  /** Display / presenter-matching name (e.g. "President Chandler", "Nathan Lee"). */
  name: string | null
  /** App login id when this person has one (matches `interviews.interviewer_id`). */
  userId: string | null
  /** App role — decides which shared meetings and unassigned interviews are theirs. */
  role: string | null
}

/** Option in the stake president's "View calendar for" dropdown. */
export interface CalendarPersonOption extends CalendarPerson {
  /** Stable option value (roster row id). */
  key: string
  /** Dropdown label, e.g. "President Chandler — first counselor". */
  label: string
}

/** `users.role` → the `viewable_by_roles` group names used on meetings rows. */
function roleGroupsForAppRole(role: string | null): Set<string> {
  const groups = new Set<string>()
  if (!role) return groups
  if (
    role === "stake_president" ||
    role === "counselor" ||
    role === "clerk" ||
    role === "assistant_clerk" ||
    role === "executive_secretary" ||
    role === "assistant_executive_secretary"
  ) {
    groups.add("stake_presidency")
    groups.add("stake_council")
  }
  if (role === "high_council") {
    groups.add("stake_council")
    groups.add("high_council")
  }
  return groups
}

/** High councilors' shared meetings mirror the RLS rule from migration 057. */
function highCouncilCanViewMeetingType(meetingType: string): boolean {
  const slug = meetingType.trim().toLowerCase().replace(/[\s-]+/g, "_")
  return (
    slug === "high_council_meeting" ||
    slug === "high_council" ||
    slug === "stake_council" ||
    slug === "stake_council_meeting"
  )
}

export interface PersonFilterMeeting {
  id: string
  meeting_type: string
  viewable_by_roles?: string[] | null
}

export interface PersonFilterAgendaRow {
  presenter?: string | null
}

/**
 * True when this meeting belongs on `person`'s calendar.
 * Sunday visit/teaching meetings with presenter-tagged rows count only when one
 * of the rows names this person; other meetings follow role visibility.
 */
export function meetingBelongsToPerson(
  meeting: PersonFilterMeeting,
  agendaRows: PersonFilterAgendaRow[],
  person: CalendarPerson
): boolean {
  const isPresidencyAssignment = meeting.meeting_type === "ward_visit" || meeting.meeting_type === "teaching"
  if (isPresidencyAssignment) {
    const tagged = agendaRows.filter((r) => r.presenter)
    if (tagged.length > 0) {
      if (!person.name) return false
      return tagged.some((r) => presenterMatchesUser(r.presenter!, person.name!))
    }
  }

  if (person.role === "high_council") {
    return highCouncilCanViewMeetingType(meeting.meeting_type)
  }

  const roles = meeting.viewable_by_roles
  if (!roles || roles.length === 0) return true
  const groups = roleGroupsForAppRole(person.role)
  return roles.some((r) => groups.has(r))
}

export interface PersonFilterInterview {
  interviewer_id?: string | null
}

/** Assigned interviews match by interviewer; unassigned ones fall to presidency / exec-sec roles. */
export function interviewBelongsToPerson(interview: PersonFilterInterview, person: CalendarPerson): boolean {
  if (interview.interviewer_id) {
    return person.userId != null && interview.interviewer_id === person.userId
  }
  return person.role != null && UNASSIGNED_INTERVIEW_ROLES.has(person.role)
}

interface RosterRowForOptions {
  id: string
  office_slug: string
  assigned_user_id: string | null
  person_name?: string | null
}

interface UserRowForOptions {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
}

/** Builds the president's dropdown options from roster seats (skips unnamed vacant seats). */
export function buildCalendarPersonOptions(
  rosterRows: RosterRowForOptions[],
  users: UserRowForOptions[]
): CalendarPersonOption[] {
  const usersById = new Map(users.map((u) => [u.id, u]))
  const options: CalendarPersonOption[] = []
  for (const row of rosterRows) {
    const linked = row.assigned_user_id ? usersById.get(row.assigned_user_id) : undefined
    const name = linked?.full_name?.trim() || row.person_name?.trim() || null
    if (!name) continue
    const role = appRoleForOfficeSlug(row.office_slug)
    options.push({
      key: row.id,
      label: `${name} — ${labelForOfficeSlug(row.office_slug)}`,
      name,
      userId: linked?.id ?? null,
      role,
    })
  }
  return options
}
