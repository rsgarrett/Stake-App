/**
 * Personalized "Next appointment" selection for the Meetings & Conferences page.
 *
 * Personalization layers:
 * 1. Meetings are already role-filtered by RLS (`viewable_by_roles`), so the input
 *    list only contains meetings the signed-in user may see.
 * 2. Sunday ward visits / teaching meetings are shared by the whole presidency but
 *    tag each agenda row with a `presenter` ("President Garrett", ...). We only count
 *    the row that matches the signed-in user's name, at that row's computed time.
 * 3. Interviews count when they are assigned to the signed-in user; unassigned
 *    interviews count only for presidency / executive-secretary roles.
 */

export interface NextApptMeeting {
  id: string
  title: string
  meeting_type: string
  scheduled_date: string
}

export interface NextApptAgendaRow {
  title: string
  presenter?: string | null
  item_order: number
  duration_minutes?: number | null
}

export interface NextApptConference {
  id: string
  title: string
  start_date: string
  end_date: string
}

export interface NextApptInterview {
  id: string
  interviewee_name: string
  interview_type: string
  scheduled_date: string
  status: string
  interviewer_id?: string | null
}

export type NextAppointment =
  | { kind: "meeting"; id: string; label: string; start: Date }
  | { kind: "conference"; id: string; label: string; start: Date }
  | {
      kind: "interview"
      id: string
      label: string
      start: Date
      interview_type: string
      interviewee_name: string
    }

/** Roles whose "next appointment" includes unassigned (no interviewer set) interviews. */
const UNASSIGNED_INTERVIEW_ROLES = new Set([
  "stake_president",
  "counselor",
  "executive_secretary",
  "assistant_executive_secretary",
])

const NAME_TITLE_WORDS = new Set(["president", "pres", "elder", "brother", "sister", "bishop"])

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !NAME_TITLE_WORDS.has(t))
}

/** True when the agenda presenter ("President Garrett") refers to the signed-in user ("Garrett" / "R. S. Garrett"). */
export function presenterMatchesUser(presenter: string, userFullName: string): boolean {
  const p = nameTokens(presenter)
  const u = nameTokens(userFullName)
  if (p.length === 0 || u.length === 0) return false
  return p.some((t) => u.includes(t))
}

/** Start time per agenda row: meeting start, offset by prior rows' duration when set. */
function agendaRowStartTimes(scheduledIso: string, rows: NextApptAgendaRow[]): Date[] {
  const out: Date[] = []
  let t = new Date(scheduledIso).getTime()
  for (const row of rows) {
    out.push(new Date(t))
    const d = row.duration_minutes
    t += (typeof d === "number" && d > 0 ? d : 0) * 60 * 1000
  }
  return out
}

/** "President Garrett — 17th Ward\nTeach EQ" → "17th Ward · Teach EQ" (viewer already knows it's them). */
function personalizedRowLabel(rowTitle: string, presenter: string | null | undefined): string {
  let text = rowTitle
  if (presenter) {
    const prefix = new RegExp(`^\\s*${presenter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[—–-]\\s*`, "i")
    text = text.replace(prefix, "")
  }
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" · ")
}

export interface SelectNextAppointmentInput {
  now: Date
  userId: string | null
  userFullName: string | null
  userRole: string | null
  meetings: NextApptMeeting[]
  agendaItemsByMeetingId: Record<string, NextApptAgendaRow[]>
  conferences: NextApptConference[]
  interviews: NextApptInterview[]
}

/** Earliest upcoming appointment relevant to the signed-in user, or null when none. */
export function selectNextAppointment(input: SelectNextAppointmentInput): NextAppointment | null {
  const { now, userId, userFullName, userRole, meetings, agendaItemsByMeetingId, conferences, interviews } = input
  const candidates: NextAppointment[] = []

  for (const m of meetings) {
    const isPresidencyAssignment = m.meeting_type === "ward_visit" || m.meeting_type === "teaching"
    if (isPresidencyAssignment) {
      const rows = [...(agendaItemsByMeetingId[m.id] ?? [])].sort((a, b) => a.item_order - b.item_order)
      const hasPresenters = rows.some((r) => r.presenter)
      if (hasPresenters) {
        const times = agendaRowStartTimes(m.scheduled_date, rows)
        rows.forEach((row, i) => {
          if (!row.presenter) return
          if (!userFullName || !presenterMatchesUser(row.presenter, userFullName)) return
          const start = times[i]!
          if (start <= now) return
          const what = m.meeting_type === "teaching" ? "Teaching" : "Ward visit"
          candidates.push({
            kind: "meeting",
            id: m.id,
            label: `${what} — ${personalizedRowLabel(row.title, row.presenter)}`,
            start,
          })
        })
        continue
      }
    }
    const start = new Date(m.scheduled_date)
    if (start <= now) continue
    candidates.push({ kind: "meeting", id: m.id, label: m.title, start })
  }

  for (const c of conferences) {
    const day = c.start_date.length >= 10 ? c.start_date.slice(0, 10) : c.start_date
    const start = new Date(`${day}T00:00:00`)
    if (start <= now) continue
    candidates.push({ kind: "conference", id: c.id, label: c.title, start })
  }

  const includeUnassigned = userRole != null && UNASSIGNED_INTERVIEW_ROLES.has(userRole)
  for (const i of interviews) {
    if (i.status !== "scheduled") continue
    const mine = i.interviewer_id ? i.interviewer_id === userId : includeUnassigned
    if (!mine) continue
    const start = new Date(i.scheduled_date)
    if (start <= now) continue
    candidates.push({
      kind: "interview",
      id: i.id,
      label: `Interview — ${i.interviewee_name}`,
      start,
      interview_type: i.interview_type,
      interviewee_name: i.interviewee_name,
    })
  }

  if (candidates.length === 0) return null
  candidates.sort((a, b) => a.start.getTime() - b.start.getTime())
  return candidates[0]!
}
