"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft, Plus, Trash2,
  Calendar, BookOpen, Users, ClipboardList,
  Copy, MessageSquare,
} from "lucide-react"
import { AgendaPager, pagerDateLabel } from "@/components/meetings/agenda-pager"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"
import { CollaborativeInput } from "@/components/collab/collaborative-input"
import { CollaborativeTextarea } from "@/components/collab/collaborative-textarea"
import { AutosaveBadge } from "@/components/ui/autosave-badge"
import {
  agendaCollabRoom,
  useAgendaAutosave,
  useLiveAgenda,
} from "@/lib/collab/use-live-agenda"
import { applyTextChange } from "@/lib/collab/apply-text-change"
import { localDateISO, scheduledDateLocal } from "@/lib/utils/local-date"

export interface CalendarItem { date: string; time: string; event: string }
export interface ActionItem { assigned_to: string; status: string; assignment: string }
export interface TrainingItem { conducted_by: string; topic: string }
export interface DiscussionItem { topic: string; notes: string }

export interface AgendaConfig {
  meetingType: string
  title: string
  defaultPresiding?: string
  defaultConducting?: string
  defaultTime?: string
  sections: AgendaSection[]
  defaultAttendees?: string[]
  calendarKeywords?: string[]
}

export type AgendaSection =
  | "calendar" | "opening" | "action_items" | "training"
  | "discussion" | "closing" | "general_notes" | "attendees"

export interface AgendaData {
  id?: string
  meeting_type: string
  meeting_date: string
  meeting_time: string
  presiding: string
  conducting: string
  opening_hymn: string
  opening_prayer: string
  closing_prayer: string
  stake_vision: string
  handbook_trainer: string
  handbook_topic: string
  calendar_items: CalendarItem[]
  attendees: string[]
  action_items: ActionItem[]
  training: TrainingItem[]
  discussion_items: DiscussionItem[]
  closing_remarks: string
  general_notes: string
  status: string
}

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
const textareaClass = inputClass

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
}

function getNextDate(): string {
  return localDateISO()
}

/** Text fields shared through the live doc (everything except date/select scalars). */
const TEXT_FIELDS = [
  "meeting_time", "presiding", "conducting", "opening_hymn", "opening_prayer",
  "closing_prayer", "stake_vision", "handbook_trainer", "handbook_topic",
  "closing_remarks", "general_notes",
] as const

/**
 * Live, Google-Docs-style agenda: every keystroke, row add/remove, and status
 * change syncs to everyone viewing this meeting type + date. Postgres
 * (`meeting_agendas`) is a debounced backup, not the live channel.
 */
export function MeetingAgenda({ config, initialDate }: { config: AgendaConfig; initialDate?: string }) {
  const supabase = createClient()

  const emptyAgenda = useCallback((date: string): AgendaData => ({
    meeting_type: config.meetingType,
    meeting_date: date,
    meeting_time: config.defaultTime || "8:00 AM",
    presiding: config.defaultPresiding || "President Garrett",
    conducting: config.defaultConducting || "",
    opening_hymn: "",
    opening_prayer: "",
    closing_prayer: "",
    stake_vision: "Stake Vision",
    handbook_trainer: "",
    handbook_topic: "",
    calendar_items: [],
    attendees: config.defaultAttendees || [],
    action_items: [],
    training: [{ conducted_by: "", topic: "" }],
    discussion_items: [],
    closing_remarks: "",
    general_notes: "",
    status: "upcoming",
  }), [config])

  const [date, setDate] = useState(initialDate || getNextDate())
  const [initial, setInitial] = useState<AgendaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasRow, setHasRow] = useState(false)
  const rowIdRef = useRef<string | null>(null)
  const [allDates, setAllDates] = useState<string[]>([])
  const [scheduledDates, setScheduledDates] = useState<string[]>([])
  const [viewerName, setViewerName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle()
      if (cancelled) return
      const name =
        (typeof data?.full_name === "string" && data.full_name.trim()) ||
        user.email?.split("@")[0] ||
        "Someone"
      setViewerName(name)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Set after the autosave hook below; lets loadAgenda flush pending saves
  // while the current live doc still holds the edits.
  const autosaveFlushRef = useRef<(() => Promise<void>) | null>(null)

  const loadAgenda = useCallback(async (nextDate: string) => {
    await autosaveFlushRef.current?.()
    setLoading(true)
    const { data } = await supabase
      .from("standing_meeting_agendas")
      .select("*")
      .eq("meeting_type", config.meetingType)
      .eq("meeting_date", nextDate)
      .maybeSingle()

    rowIdRef.current = data?.id ?? null
    setHasRow(Boolean(data?.id))
    if (data) {
      setInitial({
        id: data.id,
        meeting_type: data.meeting_type,
        meeting_date: data.meeting_date,
        meeting_time: data.meeting_time || config.defaultTime || "8:00 AM",
        presiding: data.presiding || config.defaultPresiding || "",
        conducting: data.conducting || config.defaultConducting || "",
        opening_hymn: data.opening_hymn || "",
        opening_prayer: data.opening_prayer || "",
        closing_prayer: data.closing_prayer || "",
        stake_vision: data.stake_vision || "Stake Vision",
        handbook_trainer: data.handbook_trainer || "",
        handbook_topic: data.handbook_topic || "",
        calendar_items: (data.calendar_items as CalendarItem[]) || [],
        attendees: (data.attendees as string[]) || config.defaultAttendees || [],
        action_items: (data.action_items as ActionItem[]) || [],
        training: (data.training as TrainingItem[]) || [],
        discussion_items: (data.discussion_items as DiscussionItem[]) || [],
        closing_remarks: data.closing_remarks || "",
        general_notes: data.general_notes || "",
        status: data.status || "upcoming",
      })
    } else {
      setInitial(emptyAgenda(nextDate))
    }
    setDate(nextDate)
    setLoading(false)
  }, [supabase, config, emptyAgenda])

  const loadAllDates = useCallback(async () => {
    const { data } = await supabase
      .from("standing_meeting_agendas")
      .select("meeting_date")
      .eq("meeting_type", config.meetingType)
      .order("meeting_date", { ascending: false })
      .limit(52)
    setAllDates((data || []).map((d: any) => d.meeting_date))
  }, [supabase, config.meetingType])

  const loadScheduledDates = useCallback(async () => {
    const keywords = config.calendarKeywords || [config.meetingType]
    const orClauses = keywords.map((kw) => `title.ilike.%${kw}%,meeting_type.ilike.%${kw}%`).join(",")
    const { data } = await supabase
      .from("meetings").select("scheduled_date, title, meeting_type")
      .or(orClauses).order("scheduled_date", { ascending: true })
    const dates = (data || []).map((m: any) => scheduledDateLocal(m.scheduled_date))
    setScheduledDates(Array.from(new Set(dates)).sort())
  }, [supabase, config.meetingType, config.calendarKeywords])

  useEffect(() => {
    loadAgenda(initialDate || getNextDate())
    loadAllDates()
    loadScheduledDates()
  }, [loadAgenda, loadAllDates, loadScheduledDates, initialDate])

  // ---- Live shared doc (one room per meeting type + date) ----
  const live = useLiveAgenda({
    room: agendaCollabRoom(config.meetingType, date),
    supabase,
    userName: viewerName,
    enabled: !loading,
  })

  // One-time structural seed from the Postgres backup (deterministic ids).
  const seedRowsIfEmpty = live.seedRowsIfEmpty
  useEffect(() => {
    if (!live.ready || !initial || loading) return
    seedRowsIfEmpty((api) => {
      initial.calendar_items.forEach((item, i) => {
        const id = `seed-cal-${i}`
        api.addRow("calendar", { date: item.date || "" }, id)
        api.setRowText("calendar", id, "time", item.time || "")
        api.setRowText("calendar", id, "event", item.event || "")
      })
      initial.attendees.forEach((name, i) => {
        const id = `seed-att-${i}`
        api.addRow("attendees", {}, id)
        api.setRowText("attendees", id, "name", name || "")
      })
      initial.action_items.forEach((item, i) => {
        const id = `seed-act-${i}`
        api.addRow("actions", { status: item.status || "Assigned" }, id)
        api.setRowText("actions", id, "assigned_to", item.assigned_to || "")
        api.setRowText("actions", id, "assignment", item.assignment || "")
      })
      initial.training.forEach((item, i) => {
        const id = `seed-trn-${i}`
        api.addRow("training", {}, id)
        api.setRowText("training", id, "conducted_by", item.conducted_by || "")
        api.setRowText("training", id, "topic", item.topic || "")
      })
      initial.discussion_items.forEach((item, i) => {
        const id = `seed-dis-${i}`
        api.addRow("discussion", {}, id)
        api.setRowText("discussion", id, "topic", item.topic || "")
        api.setRowText("discussion", id, "notes", item.notes || "")
      })
      api.setMeta("status", initial.status || "upcoming")
    })
  }, [live.ready, initial, loading, seedRowsIfEmpty])

  // ---- Debounced Postgres backup of the whole doc ----
  const buildPayload = useCallback(() => {
    const fields = Object.fromEntries(TEXT_FIELDS.map((f) => [f, live.fieldValue(f)]))
    return {
      meeting_type: config.meetingType,
      meeting_date: date,
      ...fields,
      calendar_items: live.rows("calendar").map((r) => ({
        date: String(r.data.date ?? ""),
        time: live.rowTextValue("calendar", r.id, "time"),
        event: live.rowTextValue("calendar", r.id, "event"),
      })),
      attendees: live.rows("attendees").map((r) => live.rowTextValue("attendees", r.id, "name")),
      action_items: live.rows("actions").map((r) => ({
        assigned_to: live.rowTextValue("actions", r.id, "assigned_to"),
        status: String(r.data.status ?? "Assigned"),
        assignment: live.rowTextValue("actions", r.id, "assignment"),
      })),
      training: live.rows("training").map((r) => ({
        conducted_by: live.rowTextValue("training", r.id, "conducted_by"),
        topic: live.rowTextValue("training", r.id, "topic"),
      })),
      discussion_items: live.rows("discussion").map((r) => ({
        topic: live.rowTextValue("discussion", r.id, "topic"),
        notes: live.rowTextValue("discussion", r.id, "notes"),
      })),
      status: (live.getMeta("status") as string) || "upcoming",
    }
  }, [live, config.meetingType, date])

  const autosave = useAgendaAutosave({
    enabled: !loading && live.ready,
    localTick: live.localTick,
    save: async () => {
      // Doc torn down mid-debounce (date switch/unmount) — a save now would
      // read empty fields and blank the backup row.
      if (!live.doc || !live.ready) return
      const payload = buildPayload()
      const hadRow = Boolean(rowIdRef.current)
      const { data, error } = await supabase
        .from("standing_meeting_agendas")
        .upsert(payload, { onConflict: "meeting_type,meeting_date" })
        .select("id")
        .single()
      if (error) throw error
      rowIdRef.current = data.id
      setHasRow(true)
      if (!hadRow) void loadAllDates()
    },
  })
  autosaveFlushRef.current = autosave.flush

  const allKnownDates = Array.from(new Set([...allDates, ...scheduledDates])).sort()

  const shiftDays = (from: string, days: number) => {
    const d = new Date(from + "T12:00:00")
    d.setDate(d.getDate() + days)
    return localDateISO(d)
  }
  // Nearest saved/scheduled agenda in each direction; fall back a week if none.
  const prevAgendaDate = [...allKnownDates].reverse().find((d) => d < date) ?? shiftDays(date, -7)
  const nextAgendaDate = allKnownDates.find((d) => d > date) ?? shiftDays(date, 7)
  const pagerPrevious = {
    dateLabel: pagerDateLabel(prevAgendaDate),
    onClick: () => void loadAgenda(prevAgendaDate),
  }
  const pagerNext = {
    dateLabel: pagerDateLabel(nextAgendaDate),
    onClick: () => void loadAgenda(nextAgendaDate),
  }

  const copyFromPrevious = async () => {
    const sorted = [...allDates].sort().reverse()
    const prevDate = sorted.find((d) => d < date)
    if (!prevDate) { alert("No previous agenda found."); return }

    const { data } = await supabase
      .from("standing_meeting_agendas").select("*")
      .eq("meeting_type", config.meetingType).eq("meeting_date", prevDate)
      .maybeSingle()
    if (!data || !live.doc) { alert("No previous agenda found."); return }

    const doc = live.doc
    const setField = (name: string, value: unknown) => {
      if (typeof value === "string" && value) applyTextChange(doc.getText(`field/${name}`), value)
    }
    setField("meeting_time", data.meeting_time)
    setField("presiding", data.presiding)
    setField("conducting", data.conducting)
    setField("stake_vision", data.stake_vision)

    if (live.rows("attendees").length === 0) {
      ;((data.attendees as string[]) || []).forEach((name) => {
        const id = live.addRow("attendees", {})
        if (id) live.setRowText("attendees", id, "name", name)
      })
    }
    // Only carry action items into an empty list — repeat clicks must not stack duplicates.
    if (live.rows("actions").length === 0) {
      ;((data.action_items as ActionItem[]) || [])
        .filter((i) => i.status !== "Completed")
        .forEach((item) => {
          const id = live.addRow("actions", { status: item.status || "Assigned" })
          if (id) {
            live.setRowText("actions", id, "assigned_to", item.assigned_to || "")
            live.setRowText("actions", id, "assignment", item.assignment || "")
          }
        })
    }
  }

  if (loading || !initial) return <div className="p-6"><div className="text-center py-12 text-gray-500">Loading agenda...</div></div>

  const has = (s: AgendaSection) => config.sections.includes(s)
  const statusValue = (live.getMeta("status") as string) || initial.status || "upcoming"

  const field = (name: (typeof TEXT_FIELDS)[number], placeholder?: string) => (
    <CollaborativeInput
      yText={live.fieldText(name)}
      seedText={(initial[name as keyof AgendaData] as string) || ""}
      ready={live.ready}
      className={inputClass}
      placeholder={placeholder}
    />
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/modules/meetings" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Meetings
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600 mt-1">{formatDate(date)}</p>
          </div>
          <div className="flex items-center gap-3">
            {live.peers.length > 0 && (
              <span
                className="text-xs font-medium text-emerald-700 truncate max-w-[12rem]"
                title={live.peers.map((p) => p.name).join(", ")}
              >
                {live.peers.length === 1
                  ? `${live.peers[0].name} editing live`
                  : `${live.peers.length} others editing live`}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                live.status === "live"
                  ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                  : live.status === "error"
                    ? "text-red-600 border-red-200 bg-red-50"
                    : "text-gray-500 border-gray-200 bg-gray-50"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${live.status === "live" ? "bg-emerald-500" : live.status === "error" ? "bg-red-500" : "bg-gray-400"}`} />
              {live.status === "live" ? "Live" : live.status === "error" ? "Offline" : "Connecting…"}
            </span>
            {!hasRow && (
              <Button variant="outline" size="sm" onClick={copyFromPrevious}>
                <Copy className="h-4 w-4 mr-2" /> Copy from Previous
              </Button>
            )}
            <AutosaveBadge state={autosave.state} errorMessage={autosave.errorMessage} onRetry={autosave.retry} />
          </div>
        </div>
        <AgendaPager previous={pagerPrevious} next={pagerNext} className="mt-4">
          <Button variant="outline" size="sm" onClick={() => void loadAgenda(getNextDate())}>Today</Button>
          {allKnownDates.length > 0 && (
            <select className="text-sm border rounded-md px-2 py-1 text-gray-700 max-w-[10rem]" value={date} onChange={(e) => void loadAgenda(e.target.value)}>
              {!allKnownDates.includes(date) && (
                <option value={date}>
                  {formatShortDate(date)} {englishMenuTitleCase("(new)")}
                </option>
              )}
              {[...allKnownDates].reverse().map((d) => (
                <option key={d} value={d}>
                  {formatShortDate(d)}
                  {allDates.includes(d) ? "" : ` ${englishMenuTitleCase("(scheduled)")}`}
                </option>
              ))}
            </select>
          )}
        </AgendaPager>
      </div>

      <div className="space-y-6">
        {/* Calendar / Announcements */}
        {has("calendar") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-indigo-600" /> Review Calendar / Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {live.rows("calendar").map((row) => (
                  <div key={row.id} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
                    <input
                      type="date"
                      value={String(row.data.date ?? "")}
                      onChange={(e) => live.updateRow("calendar", row.id, { date: e.target.value })}
                      className={`${inputClass} col-span-1 sm:col-span-3`}
                    />
                    <CollaborativeInput yText={live.rowText("calendar", row.id, "time")} ready={live.ready} placeholder="Time" className={`${inputClass} col-span-1 sm:col-span-2`} />
                    <CollaborativeInput yText={live.rowText("calendar", row.id, "event")} ready={live.ready} placeholder="Event" className={`${inputClass} col-span-2 sm:col-span-6`} />
                    <button onClick={() => live.removeRow("calendar", row.id)} className="text-red-400 hover:text-red-600 col-span-2 sm:col-span-1 flex justify-end sm:justify-center p-1.5"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => live.addRow("calendar", { date: "" })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Event
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Opening */}
        {has("opening") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-indigo-600" /> Opening
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Presiding</label>
                  {field("presiding")}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Conducting</label>
                  {field("conducting")}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hymn</label>
                  {field("opening_hymn", "e.g., #288")}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                  {field("meeting_time")}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Opening Prayer</label>
                  {field("opening_prayer")}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Closing Prayer</label>
                  {field("closing_prayer")}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Stake Vision</label>
                  {field("stake_vision")}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Handbook Trainer</label>
                  {field("handbook_trainer")}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Handbook Topic</label>
                  {field("handbook_topic", "e.g., 1.2.3. Inviting All to Receive the Gospel")}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendees */}
        {has("attendees") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600" /> Attendees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {live.rows("attendees").map((row) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <CollaborativeInput yText={live.rowText("attendees", row.id, "name")} ready={live.ready} className={`${inputClass} flex-1`} />
                    <button onClick={() => live.removeRow("attendees", row.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => live.addRow("attendees", {})}>
                  <Plus className="h-4 w-4 mr-1" /> Add Attendee
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Items */}
        {has("action_items") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center"><ClipboardList className="h-5 w-5 mr-2 text-indigo-600" /> Action Items</span>
                <Button variant="outline" size="sm" onClick={() => live.addRow("actions", { status: "Assigned" })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {live.rows("actions").length === 0 ? (
                <p className="text-gray-400 text-center py-4 text-sm">No action items yet.</p>
              ) : (
                <div className="space-y-3">
                  {live.rows("actions").map((row) => (
                    <div key={row.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
                        <CollaborativeInput yText={live.rowText("actions", row.id, "assigned_to")} ready={live.ready} placeholder="Assigned to" className={`${inputClass} col-span-1 sm:col-span-4`} />
                        <select
                          value={String(row.data.status ?? "Assigned")}
                          onChange={(e) => live.updateRow("actions", row.id, { status: e.target.value })}
                          className={`${inputClass} col-span-1 sm:col-span-3`}
                        >
                          <option value="Assigned">{englishMenuTitleCase("Assigned")}</option>
                          <option value="In Progress">{englishMenuTitleCase("In Progress")}</option>
                          <option value="Completed">{englishMenuTitleCase("Completed")}</option>
                        </select>
                        <CollaborativeInput yText={live.rowText("actions", row.id, "assignment")} ready={live.ready} placeholder="Assignment description" className={`${inputClass} col-span-2 sm:col-span-4`} />
                        <button onClick={() => live.removeRow("actions", row.id)} className="text-red-400 hover:text-red-600 col-span-2 sm:col-span-1 flex justify-end sm:justify-center p-1.5"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Training */}
        {has("training") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center"><BookOpen className="h-5 w-5 mr-2 text-indigo-600" /> Training / Discussion</span>
                <Button variant="outline" size="sm" onClick={() => live.addRow("training", {})}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {live.rows("training").map((row) => (
                  <div key={row.id} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
                    <CollaborativeInput yText={live.rowText("training", row.id, "conducted_by")} ready={live.ready} placeholder="Conducted by" className={`${inputClass} col-span-2 sm:col-span-4`} />
                    <CollaborativeInput yText={live.rowText("training", row.id, "topic")} ready={live.ready} placeholder="Topic" className={`${inputClass} col-span-2 sm:col-span-7`} />
                    <button onClick={() => live.removeRow("training", row.id)} className="text-red-400 hover:text-red-600 col-span-2 sm:col-span-1 flex justify-end sm:justify-center p-1.5"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Group Discussion */}
        {has("discussion") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center"><MessageSquare className="h-5 w-5 mr-2 text-indigo-600" /> Group Discussion</span>
                <Button variant="outline" size="sm" onClick={() => live.addRow("discussion", {})}>
                  <Plus className="h-4 w-4 mr-1" /> Add Topic
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {live.rows("discussion").length === 0 ? (
                <p className="text-gray-400 text-center py-4 text-sm">No discussion topics yet.</p>
              ) : (
                <div className="space-y-4">
                  {live.rows("discussion").map((row) => (
                    <div key={row.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <CollaborativeInput yText={live.rowText("discussion", row.id, "topic")} ready={live.ready} placeholder="Topic" className={`${inputClass} flex-1`} />
                        <button onClick={() => live.removeRow("discussion", row.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <CollaborativeTextarea yText={live.rowText("discussion", row.id, "notes")} ready={live.ready} rows={2} placeholder="Notes..." className={textareaClass} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Closing Remarks */}
        {has("closing") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Closing Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <CollaborativeTextarea yText={live.fieldText("closing_remarks")} seedText={initial.closing_remarks} ready={live.ready} rows={3} placeholder="Closing remarks and summary..." className={textareaClass} />
            </CardContent>
          </Card>
        )}

        {/* General Notes */}
        {has("general_notes") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">General Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <CollaborativeTextarea yText={live.fieldText("general_notes")} seedText={initial.general_notes} ready={live.ready} rows={4} placeholder="Additional notes, reminders, follow-up items..." className={textareaClass} />
            </CardContent>
          </Card>
        )}

        {/* Status + autosave */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Status:</label>
            <select value={statusValue} onChange={(e) => live.setMeta("status", e.target.value)} className="text-sm border rounded-md px-2 py-1 text-gray-700">
              <option value="upcoming">{englishMenuTitleCase("Upcoming")}</option>
              <option value="in_progress">{englishMenuTitleCase("In Progress")}</option>
              <option value="completed">{englishMenuTitleCase("Completed")}</option>
            </select>
          </div>
          <AutosaveBadge state={autosave.state} errorMessage={autosave.errorMessage} onRetry={autosave.retry} />
        </div>

        {/* Bottom pager — page onward without scrolling back up */}
        <AgendaPager previous={pagerPrevious} next={pagerNext} />
      </div>
    </div>
  )
}
