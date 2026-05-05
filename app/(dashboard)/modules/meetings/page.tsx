"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarView, type CalendarEvent } from "@/components/meetings/CalendarView"
import { MeetingForm, MeetingFormData } from "@/components/meetings/MeetingForm"
import { getDefaultAgendaDraftForMeetingType } from "@/lib/meetings/agenda-templates"
import { Calendar, List, BookOpen, ArrowLeft, Plus, Clock, MapPin, ExternalLink, Repeat, Edit, User, Trash2, Loader2 } from "lucide-react"
import { format, isSameDay, eachDayOfInterval, parseISO, startOfDay } from "date-fns"
import {
  dedupeSchedulingStandardTemplates,
  templateAllowedInStakeMeetingScheduler,
} from "@/lib/meetings/schedulable-standard-templates"
import { formatInterviewType } from "@/lib/interviews/interview-types"
import { navigateInterviewSelection } from "@/lib/interviews/navigate-mission-interview"
import { canManageStakeMeetings } from "@/lib/meetings/meeting-permissions"

type ViewMode = "calendar" | "list" | "templates"

interface Meeting {
  id: string
  title: string
  meeting_type: string
  scheduled_date: string
  end_date?: string | null
  location?: string | null
  color?: string | null
  recurrence_type?: string | null
  recurrence_interval?: number | null
  recurrence_end_date?: string | null
  recurrence_days_of_week?: number[] | null
  viewable_by_roles?: string[] | null
  editable_by_roles?: string[] | null
  is_all_day?: boolean | null
  description?: string | null
}

/** Stake conferences / special events from `special_events` (shown on this calendar). */
interface StakeConferenceCalendarRow {
  id: string
  title: string
  start_date: string
  end_date: string
  location?: string | null
  event_type: string
  updated_at?: string | null
}

/** Scheduled interviews from `interviews` (shown on the same calendar as meetings). */
interface InterviewCalendarRow {
  id: string
  interviewee_name: string
  interview_type: string
  scheduled_date: string
  status: string
}

function parseLocalDateOnly(isoOrDate: string): Date {
  const day = isoOrDate.length >= 10 ? isoOrDate.slice(0, 10) : isoOrDate
  return parseISO(`${day}T12:00:00`)
}

function conferenceLabel(eventType: string): string {
  if (eventType === "stake_conference") return "Stake conference"
  return eventType.replace(/_/g, " ") || "Conference"
}

/** One calendar chip per day for multi-day conferences. */
function expandConferenceToCalendarEvents(c: StakeConferenceCalendarRow): CalendarEvent[] {
  const start = parseLocalDateOnly(c.start_date)
  const end = parseLocalDateOnly(c.end_date)
  const days = eachDayOfInterval({ start, end })
  const color = "#dc2626"
  return days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd")
    return {
      id: `conf-${c.id}-${dayStr}`,
      navigationId: c.id,
      title: c.title,
      start_date: `${dayStr}T12:00:00.000Z`,
      end_date: null,
      meeting_type: conferenceLabel(c.event_type),
      location: c.location ?? undefined,
      color,
      calendarRecordType: "conference" as const,
    }
  })
}

function conferenceOccursOnDay(c: StakeConferenceCalendarRow, day: Date): boolean {
  const d = format(day, "yyyy-MM-dd")
  const start = c.start_date.slice(0, 10)
  const end = c.end_date.slice(0, 10)
  return d >= start && d <= end
}

function conferenceWindowKey(c: StakeConferenceCalendarRow): string {
  return `${c.start_date.slice(0, 10)}|${c.end_date.slice(0, 10)}|${c.event_type}`
}

/** Standard meeting templates for stake conference weekend — superseded by the conference planner row. */
function isStakeConferenceTemplateMeetingType(meetingType: string): boolean {
  return meetingType === "stake_conference" || meetingType.startsWith("stake_conference_")
}

function meetingFallsInConferenceWindow(m: Meeting, c: StakeConferenceCalendarRow): boolean {
  const d = m.scheduled_date.slice(0, 10)
  return d >= c.start_date.slice(0, 10) && d <= c.end_date.slice(0, 10)
}

/**
 * When multiple `special_events` share the same dates and type (duplicate rows),
 * keep the one with the most planner program items; tie-break by title length, then `updated_at`.
 */
function pickCanonicalConferencePerWindow(
  rows: StakeConferenceCalendarRow[],
  agendaItemCountByEventId: Record<string, number>
): StakeConferenceCalendarRow[] {
  const groups = new Map<string, StakeConferenceCalendarRow[]>()
  for (const c of rows) {
    const k = conferenceWindowKey(c)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(c)
  }
  const out: StakeConferenceCalendarRow[] = []
  for (const group of groups.values()) {
    if (group.length === 1) {
      out.push(group[0])
      continue
    }
    const sorted = [...group].sort((a, b) => {
      const ca = agendaItemCountByEventId[a.id] ?? 0
      const cb = agendaItemCountByEventId[b.id] ?? 0
      if (cb !== ca) return cb - ca
      const ta = (a.title || "").length
      const tb = (b.title || "").length
      if (tb !== ta) return tb - ta
      const ua = a.updated_at || ""
      const ub = b.updated_at || ""
      if (ub !== ua) return ub.localeCompare(ua)
      return a.id.localeCompare(b.id)
    })
    out.push(sorted[0])
  }
  return out.sort((a, b) => a.start_date.localeCompare(b.start_date))
}

function hiddenStakeConferenceTemplateMeetingIds(
  allMeetings: Meeting[],
  plannerStakeConferences: StakeConferenceCalendarRow[]
): Set<string> {
  const ids = new Set<string>()
  for (const m of allMeetings) {
    if (!isStakeConferenceTemplateMeetingType(m.meeting_type)) continue
    for (const c of plannerStakeConferences) {
      if (c.event_type !== "stake_conference") continue
      if (meetingFallsInConferenceWindow(m, c)) {
        ids.add(m.id)
        break
      }
    }
  }
  return ids
}

type ListScheduleRow =
  | { kind: "meeting"; start: Date; meeting: Meeting }
  | { kind: "conference"; start: Date; conference: StakeConferenceCalendarRow }
  | { kind: "interview"; start: Date; interview: InterviewCalendarRow }

/** For a single day: conferences → interviews → ward visits → teaching → other meetings; each by time. */
function listDayCategoryRank(row: ListScheduleRow): number {
  if (row.kind === "conference") return 0
  if (row.kind === "interview") return 1
  if (row.kind === "meeting") {
    if (row.meeting.meeting_type === "ward_visit") return 2
    if (row.meeting.meeting_type === "teaching") return 3
    return 4
  }
  return 5
}

function sortListRowsByTimeThenCategory(rows: ListScheduleRow[], groupByCategory: boolean): ListScheduleRow[] {
  const out = [...rows]
  out.sort((a, b) => {
    if (groupByCategory) {
      const d = listDayCategoryRank(a) - listDayCategoryRank(b)
      if (d !== 0) return d
    }
    return a.start.getTime() - b.start.getTime()
  })
  return out
}

function listDaySectionHeading(row: ListScheduleRow): string {
  if (row.kind === "conference") return "Conferences"
  if (row.kind === "interview") return "Interviews"
  if (row.kind === "meeting") {
    if (row.meeting.meeting_type === "ward_visit") return "Sunday ward visits"
    if (row.meeting.meeting_type === "teaching") return "Sunday teaching assignments"
    return "Other meetings"
  }
  return "Schedule"
}

type ListDayMeetingRow = Extract<ListScheduleRow, { kind: "meeting" }>

/** Single-day list: one combined card for ward visits + teaching; other rows stay separate. */
type ListDayDisplayItem =
  | { kind: "conference"; row: Extract<ListScheduleRow, { kind: "conference" }> }
  | { kind: "interview"; row: Extract<ListScheduleRow, { kind: "interview" }> }
  | { kind: "sunday_block"; visits: ListDayMeetingRow[]; teachings: ListDayMeetingRow[] }
  | { kind: "meeting"; row: ListDayMeetingRow }

function buildListDayDisplayItems(rows: ListScheduleRow[]): ListDayDisplayItem[] {
  const wardVisitRows = rows.filter(
    (r): r is ListDayMeetingRow => r.kind === "meeting" && r.meeting.meeting_type === "ward_visit"
  )
  const teachingRows = rows.filter(
    (r): r is ListDayMeetingRow => r.kind === "meeting" && r.meeting.meeting_type === "teaching"
  )
  const rest = rows.filter(
    (r) =>
      !(
        r.kind === "meeting" &&
        (r.meeting.meeting_type === "ward_visit" || r.meeting.meeting_type === "teaching")
      )
  )
  const conferences = rest
    .filter((r): r is Extract<ListScheduleRow, { kind: "conference" }> => r.kind === "conference")
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  const interviews = rest
    .filter((r): r is Extract<ListScheduleRow, { kind: "interview" }> => r.kind === "interview")
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  const otherMeetings = rest
    .filter((r): r is ListDayMeetingRow => r.kind === "meeting")
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const visitsSorted = sortListRowsByTimeThenCategory(wardVisitRows, false) as ListDayMeetingRow[]
  const teachingsSorted = sortListRowsByTimeThenCategory(teachingRows, false) as ListDayMeetingRow[]

  const out: ListDayDisplayItem[] = []
  conferences.forEach((row) => out.push({ kind: "conference", row }))
  interviews.forEach((row) => out.push({ kind: "interview", row }))
  if (visitsSorted.length > 0 || teachingsSorted.length > 0) {
    out.push({ kind: "sunday_block", visits: visitsSorted, teachings: teachingsSorted })
  }
  otherMeetings.forEach((row) => out.push({ kind: "meeting", row }))
  return out
}

/** Flattened row for list rendering: normal schedule row or one combined Sunday card. */
type UnifiedListRow =
  | { t: "row"; row: ListScheduleRow }
  | { t: "bundle"; visits: ListDayMeetingRow[]; teachings: ListDayMeetingRow[] }

function listUnifiedSectionRank(entry: UnifiedListRow): number {
  if (entry.t === "bundle") return 2
  return listDayCategoryRank(entry.row)
}

type MeetingAgendaListRow = {
  id: string
  title: string
  assigned_to?: string | null
  item_order: number
  presenter?: string | null
  duration_minutes?: number | null
}

/** Start time for each agenda row: meeting start, then +duration for prior rows when set. */
function presidencyAgendaStartTimes(scheduledIso: string, items: MeetingAgendaListRow[]): Date[] {
  const sorted = [...items].sort((a, b) => a.item_order - b.item_order)
  const out: Date[] = []
  let t = new Date(scheduledIso).getTime()
  for (const item of sorted) {
    out.push(new Date(t))
    const d = item.duration_minutes
    const incMin = typeof d === "number" && d > 0 ? d : 0
    t += incMin * 60 * 1000
  }
  return out
}

function PresidencyTimedAgendaList({
  meetingScheduledIso,
  items,
  meetingKeyPrefix,
}: {
  meetingScheduledIso: string
  items: MeetingAgendaListRow[]
  meetingKeyPrefix: string
}) {
  if (items.length === 0) return null
  const sorted = [...items].sort((a, b) => a.item_order - b.item_order)
  const times = presidencyAgendaStartTimes(meetingScheduledIso, sorted)
  return (
    <ul className="space-y-1.5">
      {sorted.map((item, i) => (
        <li
          key={item.id || `${meetingKeyPrefix}-${item.item_order}`}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-gray-700"
        >
          <span className="inline-flex shrink-0 items-center gap-1 font-medium tabular-nums text-gray-900">
            <Clock className="h-3 w-3 text-gray-400" />
            {format(times[i]!, "h:mm a")}
          </span>
          <span className="min-w-0">
            {item.presenter ? (
              <>
                <span className="font-medium text-gray-800">{item.presenter}</span>
                <span className="text-gray-500"> — </span>
              </>
            ) : null}
            <span>{item.title}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function MeetingsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  /** When set, list view shows only meetings on this calendar day (from clicking a day on the calendar). */
  const [listDayFilter, setListDayFilter] = useState<Date | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [interviews, setInterviews] = useState<InterviewCalendarRow[]>([])
  const [conferences, setConferences] = useState<StakeConferenceCalendarRow[]>([])
  const [conferenceAgendaItemCount, setConferenceAgendaItemCount] = useState<Record<string, number>>({})
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [standardTemplates, setStandardTemplates] = useState<any[]>([])
  const [agendaItems, setAgendaItems] = useState<Record<string, MeetingAgendaListRow[]>>({})
  const [scheduleByDate, setScheduleByDate] = useState<Record<string, {
    meeting_time: string; conducting: string; opening_prayer: string;
    closing_prayer: string; handbook_trainer: string; handbook_topic: string; goal: string;
  }>>({})
  const [loading, setLoading] = useState(true)
  /** Tracks an in-flight delete from list view (interview or meeting). */
  const [deletingListItem, setDeletingListItem] = useState<{ kind: "interview" | "meeting"; id: string } | null>(null)
  /** `public.users.role` — used to hide add/edit for high council (view-only on HC + stake council). */
  const [userMeetingRole, setUserMeetingRole] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const meetingWriteAllowed = canManageStakeMeetings(userMeetingRole)

  const schedulableStandardTemplates = useMemo(() => {
    const narrowed = standardTemplates.filter((t) =>
      templateAllowedInStakeMeetingScheduler(t.meeting_type as string, null)
    )
    return dedupeSchedulingStandardTemplates(narrowed)
  }, [standardTemplates])

  useEffect(() => {
    loadMeetings()
    loadInterviews()
    loadConferences()
    loadStandardTemplates()
    loadAgendaItems()
    loadScheduleDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setUserMeetingRole(null)
        return
      }
      const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!cancelled) setUserMeetingRole(data?.role ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => {
    if (showForm && !meetingWriteAllowed) {
      setShowForm(false)
      setSelectedMeeting(null)
      setSelectedDate(null)
    }
  }, [showForm, meetingWriteAllowed])

  useEffect(() => {
    if (userMeetingRole === null) return
    if (!canManageStakeMeetings(userMeetingRole) && viewMode === "templates") {
      setViewMode("calendar")
    }
  }, [userMeetingRole, viewMode])

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("scheduled_date", { ascending: true })

      if (error) throw error
      setMeetings(data || [])
    } catch (error) {
      console.error("Error loading meetings:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from("interviews")
        .select("id, interviewee_name, interview_type, scheduled_date, status")
        .eq("status", "scheduled")
        .order("scheduled_date", { ascending: true })

      if (error) {
        console.warn("Could not load interviews for meetings calendar:", error.message)
        setInterviews([])
        return
      }
      setInterviews((data as InterviewCalendarRow[]) || [])
    } catch (e) {
      console.warn("Interviews calendar load:", e)
      setInterviews([])
    }
  }

  const loadConferences = async () => {
    try {
      const { data, error } = await supabase
        .from("special_events")
        .select("id, title, start_date, end_date, location, event_type, updated_at")
        .order("start_date", { ascending: true })

      if (error) {
        console.warn("Could not load conferences for meetings calendar:", error.message)
        return
      }
      const rows = data || []
      setConferences(rows)

      const eventIds = rows.map((r) => r.id)
      const counts: Record<string, number> = {}
      if (eventIds.length > 0) {
        const { data: sessions, error: sessErr } = await supabase
          .from("conference_sessions")
          .select("id, event_id")
          .in("event_id", eventIds)
        if (!sessErr && sessions?.length) {
          const sessionIdToEventId = new Map(sessions.map((s) => [s.id, s.event_id as string]))
          const sessionIds = sessions.map((s) => s.id)
          const { data: items, error: itemsErr } = await supabase
            .from("conference_program_items")
            .select("session_id")
            .in("session_id", sessionIds)
          if (!itemsErr && items?.length) {
            for (const row of items) {
              const eid = sessionIdToEventId.get(row.session_id as string)
              if (eid) counts[eid] = (counts[eid] || 0) + 1
            }
          }
        }
      }
      setConferenceAgendaItemCount(counts)
    } catch (error) {
      console.error("Error loading conferences:", error)
    }
  }

  const loadStandardTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("standard_meeting_templates")
        .select("*")
        .order("category")

      if (error) {
        // Template table might not exist yet - that's okay
        console.warn("Standard templates table not found. Run the migration to enable this feature.")
        return
      }
      setStandardTemplates(data || [])
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }

  const loadAgendaItems = async () => {
    try {
      const { data, error } = await supabase
        .from("meeting_agendas")
        .select("id, meeting_id, title, assigned_to, item_order, presenter, duration_minutes")
        .order("item_order", { ascending: true })

      if (error) {
        console.warn("Could not load agenda items:", error.message)
        return
      }

      const grouped: Record<string, MeetingAgendaListRow[]> = {}
      data?.forEach((item) => {
        if (!grouped[item.meeting_id]) grouped[item.meeting_id] = []
        grouped[item.meeting_id].push({
          id: item.id,
          title: item.title,
          assigned_to: item.assigned_to,
          item_order: item.item_order,
          presenter: item.presenter ?? null,
          duration_minutes: item.duration_minutes ?? null,
        })
      })
      setAgendaItems(grouped)
    } catch (error) {
      console.error("Error loading agenda items:", error)
    }
  }

  const loadScheduleDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("stake_meeting_schedule")
        .select("meeting_date, meeting_time, conducting, opening_prayer, closing_prayer, handbook_trainer, handbook_topic, goal")
        .order("meeting_date", { ascending: true })

      if (error) {
        console.warn("Could not load schedule details:", error.message)
        return
      }

      const byDate: typeof scheduleByDate = {}
      data?.forEach((row) => {
        if (!byDate[row.meeting_date]) {
          byDate[row.meeting_date] = row
        }
      })
      setScheduleByDate(byDate)
    } catch (error) {
      console.error("Error loading schedule details:", error)
    }
  }

  const deleteListInterview = async (id: string) => {
    if (
      !confirm(
        "Delete this interview? Related notes and schedule slots will be removed. This cannot be undone."
      )
    ) {
      return
    }
    setDeletingListItem({ kind: "interview", id })
    try {
      const { error } = await supabase.from("interviews").delete().eq("id", id)
      if (error) throw error
      await loadInterviews()
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Could not delete this interview."
      alert(message)
    } finally {
      setDeletingListItem(null)
    }
  }

  const deleteListMeeting = async (id: string) => {
    if (
      !confirm(
        "Delete this meeting? Agendas and related data for this meeting will be removed. This cannot be undone."
      )
    ) {
      return
    }
    setDeletingListItem({ kind: "meeting", id })
    try {
      const { error } = await supabase.from("meetings").delete().eq("id", id)
      if (error) throw error
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(null)
        setShowForm(false)
      }
      await loadMeetings()
      await loadAgendaItems()
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Could not delete this meeting."
      alert(message)
    } finally {
      setDeletingListItem(null)
    }
  }

  const handleSubmitMeeting = async (formData: MeetingFormData) => {
    try {
      // Convert datetime-local format to ISO string with timezone
      const scheduledDate = formData.scheduled_date.includes('T') 
        ? new Date(formData.scheduled_date).toISOString()
        : formData.scheduled_date
      
      // Build basic meeting data (required fields)
      const meetingData: any = {
        title: formData.title,
        meeting_type: formData.meeting_type,
        scheduled_date: scheduledDate,
      }

      // Only include optional fields if they have values
      if (formData.end_date) {
        meetingData.end_date = formData.end_date.includes('T')
          ? new Date(formData.end_date).toISOString()
          : formData.end_date
      }
      if (formData.location) meetingData.location = formData.location
      if (formData.description) meetingData.description = formData.description
      
      // Try to include new fields - these may not exist if migration hasn't been run
      const extendedFields: any = {}
      
      // Only add extended fields if they have non-default values
      if (formData.is_all_day) extendedFields.is_all_day = formData.is_all_day
      if (formData.recurrence_type && formData.recurrence_type !== "none") {
        extendedFields.recurrence_type = formData.recurrence_type
        extendedFields.recurrence_interval = formData.recurrence_interval
        if (formData.recurrence_end_date) extendedFields.recurrence_end_date = formData.recurrence_end_date
        if (formData.recurrence_days_of_week.length > 0) extendedFields.recurrence_days_of_week = formData.recurrence_days_of_week
      }
      if (formData.viewable_by_roles.length > 0) extendedFields.viewable_by_roles = formData.viewable_by_roles
      if (formData.editable_by_roles.length > 0) extendedFields.editable_by_roles = formData.editable_by_roles
      if (formData.color && formData.color !== "#3b82f6") extendedFields.color = formData.color

      // Track if we're using extended fields (for error recovery)
      const hasExtendedFields = Object.keys(extendedFields).length > 0
      
      // Merge extended fields into meeting data
      Object.assign(meetingData, extendedFields)

      if (selectedMeeting) {
        // Update existing meeting
        const { error } = await supabase
          .from("meetings")
          .update(meetingData)
          .eq("id", selectedMeeting.id)

        if (error) {
          console.error("Update error details:", error)
          throw error
        }
      } else {
        const runInsert = async (payload: Record<string, unknown>) =>
          await supabase.from("meetings").insert([payload]).select()

        let { data: insertedRows, error } = await runInsert(meetingData)

        if (error && hasExtendedFields) {
          console.warn("Columns may not exist yet, retrying with basic fields only...")
          const basicData: Record<string, unknown> = {
            title: formData.title,
            meeting_type: formData.meeting_type,
            scheduled_date: scheduledDate,
          }
          if (formData.end_date) {
            basicData.end_date = formData.end_date.includes("T")
              ? new Date(formData.end_date).toISOString()
              : formData.end_date
          }
          if (formData.location) basicData.location = formData.location
          const retry = await runInsert(basicData)
          error = retry.error
          insertedRows = retry.data
        }

        if (error) {
          console.error("Insert error details:", error)
          const errorMessage = error.message || error.details || JSON.stringify(error)
          throw new Error(`Failed to save meeting: ${errorMessage}`)
        }

        const newMeetingId = insertedRows?.[0]?.id as string | undefined

        if (newMeetingId && formData.agendaDraft?.length) {
          const agendaRows = formData.agendaDraft.map((row, idx) => ({
            meeting_id: newMeetingId,
            item_order: idx + 1,
            title: row.title,
            description: row.notes.trim() || null,
            duration_minutes: row.duration_minutes,
          }))
          const { error: agendaError } = await supabase.from("meeting_agendas").insert(agendaRows)
          if (agendaError) {
            console.error("Agenda insert error:", agendaError)
            alert(
              `Meeting was saved but the agenda outline could not be saved: ${agendaError.message}\nOpen the meeting and rebuild the Agenda tab if needed.`
            )
          }
        }
      }

      await loadMeetings()
      await loadConferences()
      setShowForm(false)
      setSelectedMeeting(null)
      setSelectedDate(null)
    } catch (error: any) {
      console.error("Error saving meeting:", error)
      const errorMessage = error?.message || error?.toString() || "Unknown error occurred"
      alert(`Failed to save meeting: ${errorMessage}\n\nTip: If you see column errors, run the database migration file: supabase/migrations/014_meetings_calendar_enhancements.sql`)
    }
  }

  const handleCreateFromTemplate = async (template: any) => {
    try {
      const now = new Date()
      const scheduledDate = new Date(now)
      
      // Set default day and time if template has them
      if (template.default_day_of_week !== null && template.default_day_of_week !== undefined) {
        const daysUntil = (template.default_day_of_week - now.getDay() + 7) % 7 || 7
        scheduledDate.setDate(now.getDate() + daysUntil)
      }
      
      if (template.default_time_of_day) {
        const timeParts = template.default_time_of_day.split(":")
        if (timeParts.length >= 2) {
          scheduledDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0)
        }
      }

      const meetingData: MeetingFormData = {
        title: template.title,
        meeting_type: template.meeting_type,
        scheduled_date: scheduledDate.toISOString().slice(0, 16),
        location: template.default_location || "",
        is_all_day: false,
        recurrence_type: (template.default_recurrence_type || "none") as any,
        recurrence_interval: template.default_recurrence_interval || 1,
        recurrence_days_of_week: template.default_day_of_week !== null && template.default_day_of_week !== undefined ? [template.default_day_of_week] : [],
        viewable_by_roles: Array.isArray(template.viewable_by_roles) ? template.viewable_by_roles : [],
        editable_by_roles: [],
        color: "#3b82f6",
        description: template.description || "",
        agendaDraft: getDefaultAgendaDraftForMeetingType(template.meeting_type),
      }

      await handleSubmitMeeting(meetingData)
    } catch (error) {
      console.error("Error creating from template:", error)
      alert("Failed to create meeting from template.")
    }
  }

  const handleDateClick = (date: Date) => {
    setListDayFilter(startOfDay(date))
    setViewMode("list")
  }

  const handleTodayFromCalendar = () => {
    setListDayFilter(startOfDay(new Date()))
    setViewMode("list")
  }

  const handleEventClick = (event: CalendarEvent) => {
    if (event.calendarRecordType === "conference" && event.navigationId) {
      router.push(`/modules/conferences/${event.navigationId}`)
      return
    }
    if (event.calendarRecordType === "interview") {
      void navigateInterviewSelection(supabase, router, {
        id: event.id,
        interview_type: event.interview_type ?? "",
        interviewee_name: event.interviewee_name ?? "",
      })
      return
    }
    router.push(`/modules/meetings/${event.id}?tab=agenda`)
  }

  const conferencesForCalendar = useMemo(
    () => pickCanonicalConferencePerWindow(conferences, conferenceAgendaItemCount),
    [conferences, conferenceAgendaItemCount]
  )

  const hiddenStakeConferenceMeetingIds = useMemo(
    () => hiddenStakeConferenceTemplateMeetingIds(meetings, conferencesForCalendar),
    [meetings, conferencesForCalendar]
  )

  const meetingsForCalendar = useMemo(
    () => meetings.filter((m) => !hiddenStakeConferenceMeetingIds.has(m.id)),
    [meetings, hiddenStakeConferenceMeetingIds]
  )

  const meetingCalendarEvents: CalendarEvent[] = useMemo(
    () =>
      meetingsForCalendar.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        start_date: meeting.scheduled_date,
        end_date: meeting.end_date,
        meeting_type: meeting.meeting_type,
        location: meeting.location,
        color: meeting.color || "#3b82f6",
        calendarRecordType: "meeting" as const,
      })),
    [meetingsForCalendar]
  )

  const conferenceCalendarEvents: CalendarEvent[] = useMemo(
    () => conferencesForCalendar.flatMap((c) => expandConferenceToCalendarEvents(c)),
    [conferencesForCalendar]
  )

  const interviewCalendarEvents: CalendarEvent[] = useMemo(
    () =>
      interviews.map((i) => ({
        id: i.id,
        title: `Interview: ${i.interviewee_name}`,
        start_date: i.scheduled_date,
        end_date: null,
        meeting_type: formatInterviewType(i.interview_type),
        location: null,
        color: "#7c3aed",
        calendarRecordType: "interview" as const,
        interview_type: i.interview_type,
        interviewee_name: i.interviewee_name,
      })),
    [interviews]
  )

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const merged = [...meetingCalendarEvents, ...conferenceCalendarEvents, ...interviewCalendarEvents]
    return merged.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [meetingCalendarEvents, conferenceCalendarEvents, interviewCalendarEvents])

  const listScheduleRows: ListScheduleRow[] = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const rows: ListScheduleRow[] = []
    if (listDayFilter) {
      meetingsForCalendar
        .filter((m) => isSameDay(new Date(m.scheduled_date), listDayFilter))
        .forEach((m) => rows.push({ kind: "meeting", start: new Date(m.scheduled_date), meeting: m }))
      conferencesForCalendar
        .filter((c) => conferenceOccursOnDay(c, listDayFilter))
        .forEach((c) => rows.push({ kind: "conference", start: parseLocalDateOnly(c.start_date), conference: c }))
      interviews
        .filter((i) => i.status === "scheduled" && isSameDay(new Date(i.scheduled_date), listDayFilter))
        .forEach((i) => rows.push({ kind: "interview", start: new Date(i.scheduled_date), interview: i }))
      return sortListRowsByTimeThenCategory(rows, true)
    }
    meetingsForCalendar
      .filter((m) => new Date(m.scheduled_date) >= today)
      .forEach((m) => rows.push({ kind: "meeting", start: new Date(m.scheduled_date), meeting: m }))
    conferencesForCalendar
      .filter((c) => parseLocalDateOnly(c.end_date) >= today)
      .forEach((c) => rows.push({ kind: "conference", start: parseLocalDateOnly(c.start_date), conference: c }))
    interviews
      .filter((i) => i.status === "scheduled" && new Date(i.scheduled_date) >= today)
      .forEach((i) => rows.push({ kind: "interview", start: new Date(i.scheduled_date), interview: i }))
    return sortListRowsByTimeThenCategory(rows, false).slice(0, 15)
  }, [meetingsForCalendar, conferencesForCalendar, interviews, listDayFilter])

  const listRowsForRender: UnifiedListRow[] = useMemo(() => {
    if (!listDayFilter) {
      return listScheduleRows.map((row) => ({ t: "row" as const, row }))
    }
    return buildListDayDisplayItems(listScheduleRows).map((item) => {
      if (item.kind === "sunday_block") {
        return { t: "bundle" as const, visits: item.visits, teachings: item.teachings }
      }
      if (item.kind === "conference") return { t: "row" as const, row: item.row }
      if (item.kind === "interview") return { t: "row" as const, row: item.row }
      return { t: "row" as const, row: item.row }
    })
  }, [listDayFilter, listScheduleRows])

  if (showForm) {
    const initialData: Partial<MeetingFormData> | undefined = selectedMeeting
      ? {
          title: selectedMeeting.title,
          meeting_type: selectedMeeting.meeting_type,
          scheduled_date: selectedMeeting.scheduled_date,
          end_date: selectedMeeting.end_date ?? undefined,
          location: selectedMeeting.location ?? undefined,
          color: selectedMeeting.color ?? undefined,
        }
      : selectedDate
      ? {
          scheduled_date: selectedDate.toISOString().slice(0, 16),
        }
      : undefined

    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
        <MeetingForm
          onSubmit={handleSubmitMeeting}
          onCancel={() => {
            setShowForm(false)
            setSelectedMeeting(null)
            setSelectedDate(null)
          }}
          initialData={initialData}
          standardTemplates={standardTemplates}
          isEditingMeeting={Boolean(selectedMeeting)}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
      <div className="mb-4 flex shrink-0 flex-col gap-4 sm:mb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Meetings & Conferences
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Schedule meetings, manage agendas, and plan conferences
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-gray-300 bg-white shadow-sm">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode("calendar")
                setListDayFilter(null)
              }}
              className="rounded-r-none"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none border-l border-gray-200"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            {meetingWriteAllowed && (
            <Button
              variant={viewMode === "templates" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("templates")}
              className="rounded-l-none border-l border-gray-200"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Standard meetings
            </Button>
            )}
          </div>
        </div>
      </div>

      {viewMode === "calendar" && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CalendarView
            fillHeight
            events={calendarEvents}
            onDateClick={handleDateClick}
            onTodayClick={handleTodayFromCalendar}
            onEventClick={handleEventClick}
            onAddEvent={meetingWriteAllowed ? () => setShowForm(true) : undefined}
          />
        </div>
      )}

      {viewMode === "list" && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Header bar */}
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {listDayFilter && (
                <button
                  onClick={() => { setViewMode("calendar"); setListDayFilter(null) }}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                  title="Back to calendar"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {listDayFilter
                    ? format(listDayFilter, "EEEE, MMMM d, yyyy")
                    : "Upcoming Meetings"}
                </h2>
                <p className="text-sm text-gray-500">
                  {listDayFilter
                    ? `${listRowsForRender.length} item${listRowsForRender.length !== 1 ? "s" : ""} (meetings, conferences & interviews)`
                    : "Next 15 upcoming meetings, conferences & interviews"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {listDayFilter && (
                <Button variant="outline" size="sm" onClick={() => setListDayFilter(null)}>
                  Show all upcoming
                </Button>
              )}
              {meetingWriteAllowed && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedDate(listDayFilter || new Date())
                  setSelectedMeeting(null)
                  setShowForm(true)
                }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add meeting
              </Button>
              )}
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {/* Meeting cards */}
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading...</div>
          ) : listRowsForRender.length > 0 ? (
            <div className="space-y-3">
              {listRowsForRender.map((entry, rowIndex) => {
                if (entry.t === "bundle") {
                  const { visits, teachings } = entry
                  const prevEntry = rowIndex > 0 ? listRowsForRender[rowIndex - 1]! : null
                  const showSectionHeading =
                    Boolean(listDayFilter) &&
                    (rowIndex === 0 ||
                      (prevEntry != null &&
                        listUnifiedSectionRank(entry) !== listUnifiedSectionRank(prevEntry)))
                  return (
                    <div
                      key="sunday-ward-teaching-bundle"
                      className={
                        listDayFilter && rowIndex > 0 && showSectionHeading
                          ? "pt-4 border-t border-gray-100"
                          : ""
                      }
                    >
                      {showSectionHeading && (
                        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Sunday ward visits & teaching
                        </h3>
                      )}
                      <div className="space-y-3">
                        {visits.length > 0 && (
                          <div className="flex overflow-hidden rounded-lg border border-teal-200/90 bg-teal-50/90 shadow-sm">
                            <div className="w-1.5 shrink-0 bg-teal-600" aria-hidden />
                            <div className="min-w-0 flex-1 px-4 py-3">
                              <h3 className="font-semibold text-gray-900">Sunday ward visits</h3>
                              <p className="text-xs text-teal-900/75 mt-0.5">
                                Presidency ward visits (all times)
                              </p>
                              <div className="mt-4 space-y-4">
                                {visits.map((r, vi) => {
                                  const meeting = r.meeting
                                  const startDate = new Date(meeting.scheduled_date)
                                  const endDate = meeting.end_date ? new Date(meeting.end_date) : null
                                  const items = agendaItems[meeting.id] || []
                                  const dateKey = meeting.scheduled_date.substring(0, 10)
                                  const schedDetail =
                                    meeting.meeting_type === "stake_presidency" ||
                                    meeting.meeting_type === "stake_presidency_meeting"
                                      ? scheduleByDate[dateKey]
                                      : undefined
                                  const timeLine = schedDetail?.meeting_time
                                    ? schedDetail.meeting_time
                                    : `${format(startDate, "h:mm a")}${
                                        !schedDetail && endDate ? ` – ${format(endDate, "h:mm a")}` : ""
                                      }`
                                  return (
                                    <div
                                      key={meeting.id}
                                      className={vi > 0 ? "border-t border-teal-200/80 pt-4" : ""}
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-2 gap-y-2">
                                        <button
                                          type="button"
                                          className="min-w-0 text-left rounded-md -m-1 p-1 hover:bg-teal-100/60 transition-colors"
                                          onClick={() =>
                                            void router.push(`/modules/meetings/${meeting.id}?tab=agenda`)
                                          }
                                        >
                                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-950">
                                            <Clock className="h-4 w-4 shrink-0 text-teal-700" />
                                            {timeLine}
                                          </span>
                                          <span className="block text-xs font-medium text-gray-800 truncate mt-0.5">
                                            {meeting.title}
                                          </span>
                                        </button>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {meetingWriteAllowed && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setSelectedMeeting(meeting)
                                                  setShowForm(true)
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-teal-900/80 bg-white/60 border border-teal-200/60 hover:bg-white/90 transition-colors"
                                                title="Edit meeting"
                                              >
                                                <Edit className="h-3.5 w-3.5" />
                                                Edit
                                              </button>
                                              <button
                                                type="button"
                                                title="Delete meeting"
                                                aria-label="Delete meeting"
                                                disabled={
                                                  deletingListItem?.kind === "meeting" &&
                                                  deletingListItem.id === meeting.id
                                                }
                                                onClick={() => void deleteListMeeting(meeting.id)}
                                                className="inline-flex items-center justify-center rounded-md px-2 py-1 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 disabled:opacity-50 disabled:pointer-events-none"
                                              >
                                                {deletingListItem?.kind === "meeting" &&
                                                deletingListItem.id === meeting.id ? (
                                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      {meeting.location && (
                                        <p className="mt-1 text-xs text-gray-600 inline-flex items-center gap-1">
                                          <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-700/80" />
                                          {meeting.location}
                                        </p>
                                      )}
                                      {items.length > 0 && (
                                        <div className="mt-2 rounded-md bg-white/50 px-2 py-2 border border-teal-100/80">
                                          <PresidencyTimedAgendaList
                                            meetingScheduledIso={meeting.scheduled_date}
                                            items={items}
                                            meetingKeyPrefix={meeting.id}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                        {teachings.length > 0 && (
                          <div className="flex overflow-hidden rounded-lg border border-violet-200/90 bg-violet-50/90 shadow-sm">
                            <div className="w-1.5 shrink-0 bg-violet-600" aria-hidden />
                            <div className="min-w-0 flex-1 px-4 py-3">
                              <h3 className="font-semibold text-gray-900">Sunday teaching assignments</h3>
                              <p className="text-xs text-violet-900/75 mt-0.5">
                                Presidency teaching (all times)
                              </p>
                              <div className="mt-4 space-y-4">
                                {teachings.map((r, ti) => {
                                  const meeting = r.meeting
                                  const startDate = new Date(meeting.scheduled_date)
                                  const endDate = meeting.end_date ? new Date(meeting.end_date) : null
                                  const items = agendaItems[meeting.id] || []
                                  const dateKey = meeting.scheduled_date.substring(0, 10)
                                  const schedDetail =
                                    meeting.meeting_type === "stake_presidency" ||
                                    meeting.meeting_type === "stake_presidency_meeting"
                                      ? scheduleByDate[dateKey]
                                      : undefined
                                  const timeLine = schedDetail?.meeting_time
                                    ? schedDetail.meeting_time
                                    : `${format(startDate, "h:mm a")}${
                                        !schedDetail && endDate ? ` – ${format(endDate, "h:mm a")}` : ""
                                      }`
                                  return (
                                    <div
                                      key={meeting.id}
                                      className={ti > 0 ? "border-t border-violet-200/80 pt-4" : ""}
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-2 gap-y-2">
                                        <button
                                          type="button"
                                          className="min-w-0 text-left rounded-md -m-1 p-1 hover:bg-violet-100/60 transition-colors"
                                          onClick={() =>
                                            void router.push(`/modules/meetings/${meeting.id}?tab=agenda`)
                                          }
                                        >
                                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-950">
                                            <Clock className="h-4 w-4 shrink-0 text-violet-700" />
                                            {timeLine}
                                          </span>
                                          <span className="block text-xs font-medium text-gray-800 truncate mt-0.5">
                                            {meeting.title}
                                          </span>
                                        </button>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {meetingWriteAllowed && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setSelectedMeeting(meeting)
                                                  setShowForm(true)
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-violet-900/80 bg-white/60 border border-violet-200/60 hover:bg-white/90 transition-colors"
                                                title="Edit meeting"
                                              >
                                                <Edit className="h-3.5 w-3.5" />
                                                Edit
                                              </button>
                                              <button
                                                type="button"
                                                title="Delete meeting"
                                                aria-label="Delete meeting"
                                                disabled={
                                                  deletingListItem?.kind === "meeting" &&
                                                  deletingListItem.id === meeting.id
                                                }
                                                onClick={() => void deleteListMeeting(meeting.id)}
                                                className="inline-flex items-center justify-center rounded-md px-2 py-1 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 disabled:opacity-50 disabled:pointer-events-none"
                                              >
                                                {deletingListItem?.kind === "meeting" &&
                                                deletingListItem.id === meeting.id ? (
                                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      {meeting.location && (
                                        <p className="mt-1 text-xs text-gray-600 inline-flex items-center gap-1">
                                          <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-700/80" />
                                          {meeting.location}
                                        </p>
                                      )}
                                      {items.length > 0 && (
                                        <div className="mt-2 rounded-md bg-white/50 px-2 py-2 border border-violet-100/80">
                                          <PresidencyTimedAgendaList
                                            meetingScheduledIso={meeting.scheduled_date}
                                            items={items}
                                            meetingKeyPrefix={meeting.id}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                const row = entry.row
                const prevEntry = rowIndex > 0 ? listRowsForRender[rowIndex - 1]! : null
                const showSectionHeading =
                  Boolean(listDayFilter) &&
                  (rowIndex === 0 ||
                    (prevEntry != null &&
                      listUnifiedSectionRank(entry) !== listUnifiedSectionRank(prevEntry)))

                if (row.kind === "interview") {
                  const inv = row.interview
                  const startDate = new Date(inv.scheduled_date)
                  const openInterviewRow = () => {
                    void navigateInterviewSelection(supabase, router, {
                      id: inv.id,
                      interview_type: inv.interview_type,
                      interviewee_name: inv.interviewee_name,
                    })
                  }
                  return (
                    <div key={`int-${inv.id}`} className={listDayFilter && rowIndex > 0 && showSectionHeading ? "pt-4 border-t border-gray-100" : ""}>
                      {showSectionHeading && (
                        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          {listDaySectionHeading(row)}
                        </h3>
                      )}
                    <div
                      className="group relative flex items-stretch rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                      onClick={openInterviewRow}
                    >
                      <div className="w-1.5 shrink-0 bg-violet-600" />
                      <div className="flex-1 min-w-0 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">Interview: {inv.interviewee_name}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">{formatInterviewType(inv.interview_type)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              title="Delete interview appointment"
                              aria-label="Delete interview appointment"
                              disabled={
                                deletingListItem?.kind === "interview" && deletingListItem.id === inv.id
                              }
                              onClick={(e) => {
                                e.stopPropagation()
                                void deleteListInterview(inv.id)
                              }}
                              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none"
                            >
                              {deletingListItem?.kind === "interview" && deletingListItem.id === inv.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                openInterviewRow()
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-violet-50 text-violet-800 hover:bg-violet-100"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(startDate, "MMM d, yyyy · h:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>
                    </div>
                  )
                }

                if (row.kind === "conference") {
                  const c = row.conference
                  const startDate = parseLocalDateOnly(c.start_date)
                  const endDate = parseLocalDateOnly(c.end_date)
                  return (
                    <div key={`conf-${c.id}`} className={listDayFilter && rowIndex > 0 && showSectionHeading ? "pt-4 border-t border-gray-100" : ""}>
                      {showSectionHeading && (
                        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          {listDaySectionHeading(row)}
                        </h3>
                      )}
                    <div
                      className="group relative flex items-stretch rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/modules/conferences/${c.id}`)}
                    >
                      <div className="w-1.5 shrink-0" style={{ backgroundColor: "#dc2626" }} />
                      <div className="flex-1 min-w-0 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                            <p className="text-sm text-gray-500 capitalize mt-0.5">{conferenceLabel(c.event_type)}</p>
                          </div>
                          <a
                            href={`/modules/conferences/${c.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-red-50 text-red-800 hover:bg-red-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Conference planner
                          </a>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
                          </span>
                          {c.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {c.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    </div>
                  )
                }

                const meeting = row.meeting
                const meetingColor = meeting.color || "#3b82f6"
                const startDate = new Date(meeting.scheduled_date)
                const endDate = meeting.end_date ? new Date(meeting.end_date) : null
                const items = agendaItems[meeting.id] || []
                const dateKey = meeting.scheduled_date.substring(0, 10)
                const schedDetail = (meeting.meeting_type === "stake_presidency" || meeting.meeting_type === "stake_presidency_meeting")
                  ? scheduleByDate[dateKey]
                  : undefined

                return (
                  <div key={meeting.id} className={listDayFilter && rowIndex > 0 && showSectionHeading ? "pt-4 border-t border-gray-100" : ""}>
                    {showSectionHeading && (
                      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {listDaySectionHeading(row)}
                      </h3>
                    )}
                  <div
                    className="group relative flex items-stretch rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                    onClick={() => router.push(`/modules/meetings/${meeting.id}?tab=agenda`)}
                  >
                    {/* Color accent bar */}
                    <div className="w-1.5 shrink-0" style={{ backgroundColor: meetingColor }} />

                    {/* Main content */}
                    <div className="flex-1 min-w-0 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {meeting.title}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize mt-0.5">
                            {meeting.meeting_type.replace(/_/g, " ")}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {meetingWriteAllowed && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedMeeting(meeting)
                                  setShowForm(true)
                                }}
                                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                title="Edit meeting"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                title="Delete meeting"
                                aria-label="Delete meeting"
                                disabled={
                                  deletingListItem?.kind === "meeting" && deletingListItem.id === meeting.id
                                }
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void deleteListMeeting(meeting.id)
                                }}
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none"
                              >
                                {deletingListItem?.kind === "meeting" && deletingListItem.id === meeting.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {schedDetail?.meeting_time
                            ? schedDetail.meeting_time
                            : format(startDate, "h:mm a")}
                          {!schedDetail && endDate && ` – ${format(endDate, "h:mm a")}`}
                        </span>
                        {meeting.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {meeting.location}
                          </span>
                        )}
                        {meeting.recurrence_type && meeting.recurrence_type !== "none" && (
                          <span className="inline-flex items-center gap-1">
                            <Repeat className="h-3.5 w-3.5" />
                            {meeting.recurrence_type}
                          </span>
                        )}
                      </div>

                      {(meeting.meeting_type === "ward_visit" || meeting.meeting_type === "teaching") &&
                        items.length > 0 && (
                          <div className="mt-3 border-t border-gray-100 pt-2">
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              {meeting.meeting_type === "teaching"
                                ? "Sunday teaching — presidency"
                                : "Sunday ward visits — presidency"}
                            </p>
                            <PresidencyTimedAgendaList
                              meetingScheduledIso={meeting.scheduled_date}
                              items={items}
                              meetingKeyPrefix={meeting.id}
                            />
                          </div>
                        )}

                      {/* Stake Presidency schedule details */}
                      {schedDetail && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                            <div><span className="text-gray-400">Conducting:</span> <span className="text-gray-700">{schedDetail.conducting}</span></div>
                            <div><span className="text-gray-400">Goal:</span> <span className="text-gray-700">{schedDetail.goal}</span></div>
                            <div><span className="text-gray-400">Opening Prayer:</span> <span className="text-gray-700">{schedDetail.opening_prayer}</span></div>
                            <div><span className="text-gray-400">Closing Prayer:</span> <span className="text-gray-700">{schedDetail.closing_prayer}</span></div>
                            <div><span className="text-gray-400">Handbook Trainer:</span> <span className="text-gray-700">{schedDetail.handbook_trainer}</span></div>
                            <div><span className="text-gray-400">Topic:</span> <span className="text-gray-700">{schedDetail.handbook_topic}</span></div>
                          </div>
                        </div>
                      )}

                      {/* Description (shown when no schedule detail) */}
                      {!schedDetail && meeting.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{meeting.description}</p>
                      )}

                      {/* Agenda items / assignments (ward visit & teaching use presidency block above) */}
                      {items.length > 0 &&
                        !schedDetail &&
                        meeting.meeting_type !== "ward_visit" &&
                        meeting.meeting_type !== "teaching" && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="space-y-1.5">
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm"
                              >
                                <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="text-gray-700">{item.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
              <p className="text-gray-500">
                {listDayFilter ? "No meetings or conferences on this day" : "No upcoming meetings or conferences"}
              </p>
              {meetingWriteAllowed && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSelectedDate(listDayFilter || new Date())
                  setSelectedMeeting(null)
                  setShowForm(true)
                }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {listDayFilter ? "Add meeting for this day" : "Schedule a meeting"}
              </Button>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {viewMode === "templates" && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {schedulableStandardTemplates.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No standard meeting templates are available.</p>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Standard Stake Meetings</CardTitle>
                <CardDescription>Quick-add meetings from the General Handbook</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {schedulableStandardTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                    >
                      <h3 className="mb-1 font-semibold text-gray-900">{template.title}</h3>
                      {template.description && (
                        <p className="mb-2 text-sm text-gray-600">{template.description}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs capitalize text-gray-500">
                          {template.category} • {template.default_recurrence_type}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => handleCreateFromTemplate(template)}>
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
