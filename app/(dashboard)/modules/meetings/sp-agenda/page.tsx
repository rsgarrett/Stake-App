"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  BookOpen,
  Users,
  ClipboardList,
  Copy,
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
import { localDateISO } from "@/lib/utils/local-date"

interface CalendarItem {
  date: string
  time: string
  event: string
}

interface GodsWorkItem {
  core_area: string
  item: string
  notes: string
  status: string
}

interface AgendaData {
  id?: string
  meeting_date: string
  meeting_time: string
  conducting: string
  opening_prayer: string
  closing_prayer: string
  stake_goal: string
  handbook_trainer: string
  handbook_topic: string
  calendar_items: CalendarItem[]
  agenda_planning_notes: string
  callings_notes: string
  stake_business_notes: string
  gods_work_items: GodsWorkItem[]
  general_notes: string
  status: string
}

const EMPTY_AGENDA: AgendaData = {
  meeting_date: "",
  meeting_time: "8:00 PM",
  conducting: "President Garrett",
  opening_prayer: "",
  closing_prayer: "",
  stake_goal: "Stake Vision",
  handbook_trainer: "",
  handbook_topic: "",
  calendar_items: [],
  agenda_planning_notes: "",
  callings_notes: "",
  stake_business_notes: "",
  gods_work_items: [],
  general_notes: "",
  status: "upcoming",
}

const CORE_AREAS = [
  "Administration",
  "Living the Gospel",
  "Caring for Those in Need",
  "Inviting All to Receive the Gospel",
  "Uniting Families for Eternity",
  "Assign",
]

/** Free-text fields shared through the live doc. */
const TEXT_FIELDS = [
  "meeting_time", "conducting", "opening_prayer", "closing_prayer", "stake_goal",
  "handbook_trainer", "handbook_topic", "agenda_planning_notes", "callings_notes",
  "stake_business_notes", "general_notes",
] as const

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
const textareaClass = inputClass

function getThursday(offset: number = 0): string {
  const now = new Date()
  const day = now.getDay()
  const diff = ((4 - day + 7) % 7) + offset * 7
  const thursday = new Date(now)
  thursday.setDate(now.getDate() + diff)
  if (offset === 0 && day > 4) {
    thursday.setDate(thursday.getDate() + 7)
  }
  return localDateISO(thursday)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
}

export default function SPMeetingAgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex min-h-[40vh] items-center justify-center text-gray-500 text-sm">
          Loading…
        </div>
      }
    >
      <SPMeetingAgendaContent />
    </Suspense>
  )
}

/**
 * Live, Google-Docs-style Stake Presidency agenda: keystrokes, row changes,
 * and selects sync to everyone on this date. `sp_meeting_agendas` is a
 * debounced backup, not the live channel.
 */
function SPMeetingAgendaContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date")

  const [date, setDate] = useState(dateParam || getThursday())
  const [initial, setInitial] = useState<AgendaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasRow, setHasRow] = useState(false)
  const rowIdRef = useRef<string | null>(null)
  const [allDates, setAllDates] = useState<string[]>([])
  const [viewerName, setViewerName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle()
      if (cancelled) return
      setViewerName(
        (typeof data?.full_name === "string" && data.full_name.trim()) ||
          user.email?.split("@")[0] ||
          "Someone"
      )
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Set after the autosave hook below; lets loadAgenda flush pending saves
  // while the current live doc still holds the edits.
  const autosaveFlushRef = useRef<(() => Promise<void>) | null>(null)

  const loadAgenda = useCallback(
    async (nextDate: string) => {
      await autosaveFlushRef.current?.()
      setLoading(true)
      const { data } = await supabase
        .from("sp_meeting_agendas")
        .select("*")
        .eq("meeting_date", nextDate)
        .maybeSingle()

      rowIdRef.current = data?.id ?? null
      setHasRow(Boolean(data?.id))
      if (data) {
        setInitial({
          id: data.id,
          meeting_date: data.meeting_date,
          meeting_time: data.meeting_time || "8:00 PM",
          conducting: data.conducting || "",
          opening_prayer: data.opening_prayer || "",
          closing_prayer: data.closing_prayer || "",
          stake_goal: data.stake_goal || "Stake Vision",
          handbook_trainer: data.handbook_trainer || "",
          handbook_topic: data.handbook_topic || "",
          calendar_items: (data.calendar_items as CalendarItem[]) || [],
          agenda_planning_notes: data.agenda_planning_notes || "",
          callings_notes: data.callings_notes || "",
          stake_business_notes: data.stake_business_notes || "",
          gods_work_items: (data.gods_work_items as GodsWorkItem[]) || [],
          general_notes: data.general_notes || "",
          status: data.status || "upcoming",
        })
      } else {
        setInitial({ ...EMPTY_AGENDA, meeting_date: nextDate })
      }
      setDate(nextDate)
      setLoading(false)
    },
    [supabase]
  )

  const loadAllDates = useCallback(async () => {
    const { data } = await supabase
      .from("sp_meeting_agendas")
      .select("meeting_date")
      .order("meeting_date", { ascending: false })
      .limit(52)
    setAllDates((data || []).map((d: any) => d.meeting_date))
  }, [supabase])

  useEffect(() => {
    loadAgenda(dateParam || getThursday())
    loadAllDates()
  }, [loadAgenda, loadAllDates, dateParam])

  // ---- Live shared doc (one room per Thursday) ----
  const live = useLiveAgenda({
    room: agendaCollabRoom("sp", date),
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
      initial.gods_work_items.forEach((item, i) => {
        const id = `seed-gw-${i}`
        api.addRow("gods_work", {
          core_area: item.core_area || "Assign",
          status: item.status || "TBD",
        }, id)
        api.setRowText("gods_work", id, "item", item.item || "")
        api.setRowText("gods_work", id, "notes", item.notes || "")
      })
      api.setMeta("status", initial.status || "upcoming")
    })
  }, [live.ready, initial, loading, seedRowsIfEmpty])

  // ---- Debounced Postgres backup of the whole doc ----
  const buildPayload = useCallback(() => {
    const fields = Object.fromEntries(TEXT_FIELDS.map((f) => [f, live.fieldValue(f)]))
    return {
      meeting_date: date,
      ...fields,
      calendar_items: live.rows("calendar").map((r) => ({
        date: String(r.data.date ?? ""),
        time: live.rowTextValue("calendar", r.id, "time"),
        event: live.rowTextValue("calendar", r.id, "event"),
      })),
      gods_work_items: live.rows("gods_work").map((r) => ({
        core_area: String(r.data.core_area ?? "Assign"),
        status: String(r.data.status ?? "TBD"),
        item: live.rowTextValue("gods_work", r.id, "item"),
        notes: live.rowTextValue("gods_work", r.id, "notes"),
      })),
      status: (live.getMeta("status") as string) || "upcoming",
    }
  }, [live, date])

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
        .from("sp_meeting_agendas")
        .upsert(payload, { onConflict: "meeting_date" })
        .select("id")
        .single()
      if (error) throw error
      rowIdRef.current = data.id
      setHasRow(true)
      if (!hadRow) void loadAllDates()
    },
  })
  autosaveFlushRef.current = autosave.flush

  const shiftDays = (from: string, days: number) => {
    const d = new Date(from + "T12:00:00")
    d.setDate(d.getDate() + days)
    return localDateISO(d)
  }
  // Nearest saved agenda in each direction; otherwise the adjacent Thursday.
  const sortedDates = [...allDates].sort()
  const prevAgendaDate = [...sortedDates].reverse().find((d) => d < date) ?? shiftDays(date, -7)
  const nextAgendaDate = sortedDates.find((d) => d > date) ?? shiftDays(date, 7)
  const pagerPrevious = {
    dateLabel: pagerDateLabel(prevAgendaDate),
    onClick: () => void loadAgenda(prevAgendaDate),
  }
  const pagerNext = {
    dateLabel: pagerDateLabel(nextAgendaDate),
    onClick: () => void loadAgenda(nextAgendaDate),
  }

  const copyFromPrevious = async () => {
    const prevDate = new Date(date + "T12:00:00")
    prevDate.setDate(prevDate.getDate() - 7)
    const prevDateStr = localDateISO(prevDate)
    const { data } = await supabase
      .from("sp_meeting_agendas")
      .select("*")
      .eq("meeting_date", prevDateStr)
      .maybeSingle()

    if (!data || !live.doc) {
      alert("No previous week agenda found.")
      return
    }

    const doc = live.doc
    const setField = (name: string, value: unknown) => {
      if (typeof value === "string" && value) applyTextChange(doc.getText(`field/${name}`), value)
    }
    setField("meeting_time", data.meeting_time)
    setField("conducting", data.conducting)
    setField("stake_goal", data.stake_goal)

    // Only carry items into an empty list — repeat clicks must not stack duplicates.
    if (live.rows("gods_work").length === 0) {
      ;((data.gods_work_items as GodsWorkItem[]) || [])
        .filter((i) => i.status !== "Completed")
        .forEach((item) => {
          const id = live.addRow("gods_work", {
            core_area: item.core_area || "Assign",
            status: item.status || "TBD",
          })
          if (id) live.setRowText("gods_work", id, "item", item.item || "")
        })
    }
  }

  if (loading || !initial) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-12 text-gray-500">Loading agenda...</div>
      </div>
    )
  }

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

  const noteArea = (name: (typeof TEXT_FIELDS)[number], rows: number, placeholder: string) => (
    <CollaborativeTextarea
      yText={live.fieldText(name)}
      seedText={(initial[name as keyof AgendaData] as string) || ""}
      ready={live.ready}
      rows={rows}
      placeholder={placeholder}
      className={textareaClass}
    />
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/modules/meetings"
          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Meetings
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stake Presidency Meeting</h1>
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

        {/* Week Navigation */}
        <AgendaPager previous={pagerPrevious} next={pagerNext} className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadAgenda(getThursday())}
          >
            This Week
          </Button>
          {allDates.length > 0 && (
            <select
              className="text-sm border rounded-md px-2 py-1 text-gray-700 max-w-[10rem]"
              value={date}
              onChange={(e) => void loadAgenda(e.target.value)}
            >
              {!allDates.includes(date) && (
                <option value={date}>
                  {formatShortDate(date)} {englishMenuTitleCase("(new)")}
                </option>
              )}
              {allDates.map((d) => (
                <option key={d} value={d}>
                  {formatShortDate(d)}
                </option>
              ))}
            </select>
          )}
        </AgendaPager>
      </div>

      <div className="space-y-6">
        {/* 1. Review Calendar Items/Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              Review Calendar Items / Announcements
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
                  <CollaborativeInput
                    yText={live.rowText("calendar", row.id, "time")}
                    ready={live.ready}
                    placeholder="Time"
                    className={`${inputClass} col-span-1 sm:col-span-2`}
                  />
                  <CollaborativeInput
                    yText={live.rowText("calendar", row.id, "event")}
                    ready={live.ready}
                    placeholder="Event description"
                    className={`${inputClass} col-span-2 sm:col-span-6`}
                  />
                  <button
                    onClick={() => live.removeRow("calendar", row.id)}
                    className="text-red-400 hover:text-red-600 col-span-2 sm:col-span-1 flex justify-end sm:justify-center p-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => live.addRow("calendar", { date: "" })}>
                <Plus className="h-4 w-4 mr-1" /> Add Event
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Opening */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
              Opening
              <span className="ml-2 text-sm font-normal text-gray-500">10 mins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                {field("meeting_time")}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Conducting</label>
                {field("conducting")}
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Goal</label>
                {field("stake_goal")}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Handbook Trainer</label>
                {field("handbook_trainer")}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Handbook Topic</label>
                {field("handbook_topic", "e.g., 1.3.2. Covenants and Ordinances")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Agenda Planning */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-indigo-600" />
              Agenda Planning
              <span className="ml-2 text-sm font-normal text-gray-500">15 mins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {noteArea("agenda_planning_notes", 4, "Agenda planning notes, references to planning calendar, HC survey responses, TR interview schedule, etc.")}
          </CardContent>
        </Card>

        {/* 4. Callings, Sustainings, Priesthood Advancement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Callings, Sustainings, Priesthood Advancement
              <span className="ml-2 text-sm font-normal text-gray-500">15 mins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Calling Tracker / New Submissions Notes
                </label>
                {noteArea("callings_notes", 3, "Notes on callings, new submissions, set aparts, ordinations...")}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Stake Business Notes
                </label>
                {noteArea("stake_business_notes", 3, "Review stake business items...")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. God's Work of Salvation and Exaltation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
                God&apos;s Work of Salvation and Exaltation
                <span className="ml-2 text-sm font-normal text-gray-500">45 mins</span>
              </span>
              <Button variant="outline" size="sm" onClick={() => live.addRow("gods_work", { core_area: "Assign", status: "TBD" })}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {live.rows("gods_work").length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">
                No items yet. Click &quot;Add Item&quot; to add discussion topics.
              </p>
            ) : (
              <div className="space-y-4">
                {live.rows("gods_work").map((row) => (
                  <div key={row.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 mr-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Core Area
                          </label>
                          <select
                            value={String(row.data.core_area ?? "Assign")}
                            onChange={(e) => live.updateRow("gods_work", row.id, { core_area: e.target.value })}
                            className={inputClass}
                          >
                            {CORE_AREAS.map((area) => (
                              <option key={area} value={area}>
                                {englishMenuTitleCase(area)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Status
                          </label>
                          <select
                            value={String(row.data.status ?? "TBD")}
                            onChange={(e) => live.updateRow("gods_work", row.id, { status: e.target.value })}
                            className={inputClass}
                          >
                            <option value="TBD">{englishMenuTitleCase("TBD")}</option>
                            <option value="Decision">{englishMenuTitleCase("Decision needed")}</option>
                            <option value="Action">{englishMenuTitleCase("Action required")}</option>
                            <option value="In Progress">{englishMenuTitleCase("In progress")}</option>
                            <option value="Completed">{englishMenuTitleCase("Completed")}</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => live.removeRow("gods_work", row.id)}
                            className="text-red-400 hover:text-red-600 p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Item</label>
                      <CollaborativeInput
                        yText={live.rowText("gods_work", row.id, "item")}
                        ready={live.ready}
                        placeholder="Discussion item description"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                      <CollaborativeTextarea
                        yText={live.rowText("gods_work", row.id, "notes")}
                        ready={live.ready}
                        rows={3}
                        placeholder="Discussion notes, decisions, action items..."
                        className={textareaClass}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6. General Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">General Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {noteArea("general_notes", 6, "Additional notes, reminders, follow-up items...")}
          </CardContent>
        </Card>

        {/* Status + autosave */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Status:</label>
            <select
              value={statusValue}
              onChange={(e) => live.setMeta("status", e.target.value)}
              className="text-sm border rounded-md px-2 py-1 text-gray-700"
            >
              <option value="upcoming">{englishMenuTitleCase("Upcoming")}</option>
              <option value="in_progress">{englishMenuTitleCase("In progress")}</option>
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
