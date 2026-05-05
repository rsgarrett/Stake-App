"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  Users,
  ClipboardList,
  CheckCircle,
  Copy,
} from "lucide-react"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

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

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
const textareaClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"

function getThursday(offset: number = 0): string {
  const now = new Date()
  const day = now.getDay()
  const diff = ((4 - day + 7) % 7) + offset * 7
  const thursday = new Date(now)
  thursday.setDate(now.getDate() + diff)
  if (offset === 0 && day > 4) {
    thursday.setDate(thursday.getDate() + 7)
  }
  return thursday.toISOString().split("T")[0]
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

function SPMeetingAgendaContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date")
  const [agenda, setAgenda] = useState<AgendaData>({ ...EMPTY_AGENDA, meeting_date: dateParam || getThursday() })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allDates, setAllDates] = useState<string[]>([])

  const loadAgenda = useCallback(
    async (date: string) => {
      setLoading(true)
      setSaved(false)
      const { data } = await supabase
        .from("sp_meeting_agendas")
        .select("*")
        .eq("meeting_date", date)
        .maybeSingle()

      if (data) {
        setAgenda({
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
        setAgenda({ ...EMPTY_AGENDA, meeting_date: date })
      }
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
    const date = dateParam || getThursday()
    loadAgenda(date)
    loadAllDates()
  }, [loadAgenda, loadAllDates, dateParam])

  const navigateWeek = (direction: number) => {
    const current = new Date(agenda.meeting_date + "T12:00:00")
    current.setDate(current.getDate() + direction * 7)
    const newDate = current.toISOString().split("T")[0]
    loadAgenda(newDate)
  }

  const saveAgenda = async () => {
    setSaving(true)
    try {
      const payload = {
        meeting_date: agenda.meeting_date,
        meeting_time: agenda.meeting_time,
        conducting: agenda.conducting,
        opening_prayer: agenda.opening_prayer,
        closing_prayer: agenda.closing_prayer,
        stake_goal: agenda.stake_goal,
        handbook_trainer: agenda.handbook_trainer,
        handbook_topic: agenda.handbook_topic,
        calendar_items: agenda.calendar_items,
        agenda_planning_notes: agenda.agenda_planning_notes,
        callings_notes: agenda.callings_notes,
        stake_business_notes: agenda.stake_business_notes,
        gods_work_items: agenda.gods_work_items,
        general_notes: agenda.general_notes,
        status: agenda.status,
      }

      if (agenda.id) {
        const { error } = await supabase
          .from("sp_meeting_agendas")
          .update(payload)
          .eq("id", agenda.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("sp_meeting_agendas")
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setAgenda((prev) => ({ ...prev, id: data.id }))
      }
      setSaved(true)
      await loadAllDates()
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      alert("Error saving: " + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  const copyFromPrevious = async () => {
    const prevDate = new Date(agenda.meeting_date + "T12:00:00")
    prevDate.setDate(prevDate.getDate() - 7)
    const prevDateStr = prevDate.toISOString().split("T")[0]
    const { data } = await supabase
      .from("sp_meeting_agendas")
      .select("*")
      .eq("meeting_date", prevDateStr)
      .maybeSingle()

    if (!data) {
      alert("No previous week agenda found.")
      return
    }

    const carryForward = (data.gods_work_items as GodsWorkItem[] || [])
      .filter((i) => i.status !== "Completed")
      .map((i) => ({ ...i, notes: "" }))

    setAgenda((prev) => ({
      ...prev,
      meeting_time: data.meeting_time || prev.meeting_time,
      conducting: data.conducting || prev.conducting,
      stake_goal: data.stake_goal || prev.stake_goal,
      gods_work_items: carryForward,
    }))
  }

  const update = (field: keyof AgendaData, value: any) => {
    setAgenda((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const addCalendarItem = () => {
    update("calendar_items", [...agenda.calendar_items, { date: "", time: "", event: "" }])
  }

  const updateCalendarItem = (idx: number, field: keyof CalendarItem, value: string) => {
    const items = [...agenda.calendar_items]
    items[idx] = { ...items[idx], [field]: value }
    update("calendar_items", items)
  }

  const removeCalendarItem = (idx: number) => {
    update(
      "calendar_items",
      agenda.calendar_items.filter((_, i) => i !== idx)
    )
  }

  const addGodsWorkItem = () => {
    update("gods_work_items", [
      ...agenda.gods_work_items,
      { core_area: "Assign", item: "", notes: "", status: "TBD" },
    ])
  }

  const updateGodsWorkItem = (idx: number, field: keyof GodsWorkItem, value: string) => {
    const items = [...agenda.gods_work_items]
    items[idx] = { ...items[idx], [field]: value }
    update("gods_work_items", items)
  }

  const removeGodsWorkItem = (idx: number) => {
    update(
      "gods_work_items",
      agenda.gods_work_items.filter((_, i) => i !== idx)
    )
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-12 text-gray-500">Loading agenda...</div>
      </div>
    )
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stake Presidency Meeting</h1>
            <p className="text-gray-600 mt-1">{formatDate(agenda.meeting_date)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!agenda.id && (
              <Button variant="outline" size="sm" onClick={copyFromPrevious}>
                <Copy className="h-4 w-4 mr-2" /> Copy from Previous
              </Button>
            )}
            <Button onClick={saveAgenda} disabled={saving}>
              {saving ? (
                "Saving..."
              ) : saved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" /> Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Agenda
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-3 mt-4">
          <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-gray-700">
            {formatShortDate(agenda.meeting_date)}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAgenda(getThursday())}
            className="ml-2"
          >
            This Week
          </Button>
          {allDates.length > 0 && (
            <select
              className="text-sm border rounded-md px-2 py-1 text-gray-700"
              value={agenda.meeting_date}
              onChange={(e) => loadAgenda(e.target.value)}
            >
              {!allDates.includes(agenda.meeting_date) && (
                <option value={agenda.meeting_date}>
                  {formatShortDate(agenda.meeting_date)} {englishMenuTitleCase("(new)")}
                </option>
              )}
              {allDates.map((d) => (
                <option key={d} value={d}>
                  {formatShortDate(d)}
                </option>
              ))}
            </select>
          )}
        </div>
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
              {agenda.calendar_items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateCalendarItem(idx, "date", e.target.value)}
                    className={`${inputClass} col-span-3`}
                  />
                  <input
                    type="text"
                    value={item.time}
                    onChange={(e) => updateCalendarItem(idx, "time", e.target.value)}
                    placeholder="Time"
                    className={`${inputClass} col-span-2`}
                  />
                  <input
                    type="text"
                    value={item.event}
                    onChange={(e) => updateCalendarItem(idx, "event", e.target.value)}
                    placeholder="Event description"
                    className={`${inputClass} col-span-6`}
                  />
                  <button
                    onClick={() => removeCalendarItem(idx)}
                    className="text-red-400 hover:text-red-600 col-span-1 flex justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCalendarItem}>
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
                <input
                  type="text"
                  value={agenda.meeting_time}
                  onChange={(e) => update("meeting_time", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Conducting</label>
                <input
                  type="text"
                  value={agenda.conducting}
                  onChange={(e) => update("conducting", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Opening Prayer</label>
                <input
                  type="text"
                  value={agenda.opening_prayer}
                  onChange={(e) => update("opening_prayer", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Closing Prayer</label>
                <input
                  type="text"
                  value={agenda.closing_prayer}
                  onChange={(e) => update("closing_prayer", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Goal</label>
                <input
                  type="text"
                  value={agenda.stake_goal}
                  onChange={(e) => update("stake_goal", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Handbook Trainer
                </label>
                <input
                  type="text"
                  value={agenda.handbook_trainer}
                  onChange={(e) => update("handbook_trainer", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Handbook Topic
                </label>
                <input
                  type="text"
                  value={agenda.handbook_topic}
                  onChange={(e) => update("handbook_topic", e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 1.3.2. Covenants and Ordinances"
                />
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
            <textarea
              rows={4}
              value={agenda.agenda_planning_notes}
              onChange={(e) => update("agenda_planning_notes", e.target.value)}
              className={textareaClass}
              placeholder="Agenda planning notes, references to planning calendar, HC survey responses, TR interview schedule, etc."
            />
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
                <textarea
                  rows={3}
                  value={agenda.callings_notes}
                  onChange={(e) => update("callings_notes", e.target.value)}
                  className={textareaClass}
                  placeholder="Notes on callings, new submissions, set aparts, ordinations..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Stake Business Notes
                </label>
                <textarea
                  rows={3}
                  value={agenda.stake_business_notes}
                  onChange={(e) => update("stake_business_notes", e.target.value)}
                  className={textareaClass}
                  placeholder="Review stake business items..."
                />
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
              <Button variant="outline" size="sm" onClick={addGodsWorkItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agenda.gods_work_items.length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">
                No items yet. Click &quot;Add Item&quot; to add discussion topics.
              </p>
            ) : (
              <div className="space-y-4">
                {agenda.gods_work_items.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 mr-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Core Area
                          </label>
                          <select
                            value={item.core_area}
                            onChange={(e) =>
                              updateGodsWorkItem(idx, "core_area", e.target.value)
                            }
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
                            value={item.status}
                            onChange={(e) =>
                              updateGodsWorkItem(idx, "status", e.target.value)
                            }
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
                            onClick={() => removeGodsWorkItem(idx)}
                            className="text-red-400 hover:text-red-600 p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Item
                      </label>
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => updateGodsWorkItem(idx, "item", e.target.value)}
                        className={inputClass}
                        placeholder="Discussion item description"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Notes
                      </label>
                      <textarea
                        rows={3}
                        value={item.notes}
                        onChange={(e) => updateGodsWorkItem(idx, "notes", e.target.value)}
                        className={textareaClass}
                        placeholder="Discussion notes, decisions, action items..."
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
            <textarea
              rows={6}
              value={agenda.general_notes}
              onChange={(e) => update("general_notes", e.target.value)}
              className={textareaClass}
              placeholder="Additional notes, reminders, follow-up items..."
            />
          </CardContent>
        </Card>

        {/* Bottom save */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Status:</label>
            <select
              value={agenda.status}
              onChange={(e) => update("status", e.target.value)}
              className="text-sm border rounded-md px-2 py-1 text-gray-700"
            >
              <option value="upcoming">{englishMenuTitleCase("Upcoming")}</option>
              <option value="in_progress">{englishMenuTitleCase("In progress")}</option>
              <option value="completed">{englishMenuTitleCase("Completed")}</option>
            </select>
          </div>
          <Button onClick={saveAgenda} disabled={saving} size="lg">
            {saving ? (
              "Saving..."
            ) : saved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" /> Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Agenda
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
