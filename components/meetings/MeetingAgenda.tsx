"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft, ChevronLeft, ChevronRight, Save, Plus, Trash2,
  Calendar, Clock, BookOpen, Users, ClipboardList, CheckCircle,
  Copy, MessageSquare,
} from "lucide-react"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

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
  return new Date().toISOString().split("T")[0]
}

export function MeetingAgenda({ config, initialDate }: { config: AgendaConfig; initialDate?: string }) {
  const supabase = createClient()
  const emptyAgenda: AgendaData = {
    meeting_type: config.meetingType,
    meeting_date: initialDate || getNextDate(),
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
  }

  const [agenda, setAgenda] = useState<AgendaData>(emptyAgenda)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allDates, setAllDates] = useState<string[]>([])

  const loadAgenda = useCallback(async (date: string) => {
    setLoading(true)
    setSaved(false)
    const { data } = await supabase
      .from("meeting_agendas")
      .select("*")
      .eq("meeting_type", config.meetingType)
      .eq("meeting_date", date)
      .maybeSingle()

    if (data) {
      setAgenda({
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
      setAgenda({ ...emptyAgenda, meeting_date: date })
    }
    setLoading(false)
  }, [supabase, config.meetingType])

  const [scheduledDates, setScheduledDates] = useState<string[]>([])

  const loadAllDates = useCallback(async () => {
    const { data } = await supabase
      .from("meeting_agendas")
      .select("meeting_date")
      .eq("meeting_type", config.meetingType)
      .order("meeting_date", { ascending: false })
      .limit(52)
    setAllDates((data || []).map((d: any) => d.meeting_date))
  }, [supabase, config.meetingType])

  const loadScheduledDates = useCallback(async () => {
    const keywords = config.calendarKeywords || [config.meetingType]
    let query = supabase.from("meetings").select("scheduled_date, title, meeting_type")
    const orClauses = keywords.map((kw) => `title.ilike.%${kw}%,meeting_type.ilike.%${kw}%`).join(",")
    const { data } = await query.or(orClauses).order("scheduled_date", { ascending: true })
    const dates = (data || []).map((m: any) => new Date(m.scheduled_date).toISOString().split("T")[0])
    setScheduledDates(Array.from(new Set(dates)).sort())
  }, [supabase, config.meetingType, config.calendarKeywords])

  useEffect(() => {
    loadAgenda(initialDate || getNextDate())
    loadAllDates()
    loadScheduledDates()
  }, [loadAgenda, loadAllDates, loadScheduledDates, initialDate])

  const allKnownDates = Array.from(new Set([...allDates, ...scheduledDates])).sort()

  const navigateToMeeting = (direction: number) => {
    const current = agenda.meeting_date
    if (direction > 0) {
      const next = allKnownDates.find((d) => d > current)
      if (next) { loadAgenda(next); return }
    } else {
      const prev = [...allKnownDates].reverse().find((d) => d < current)
      if (prev) { loadAgenda(prev); return }
    }
    const fallback = new Date(current + "T12:00:00")
    fallback.setDate(fallback.getDate() + direction * 7)
    loadAgenda(fallback.toISOString().split("T")[0])
  }

  const saveAgenda = async () => {
    setSaving(true)
    try {
      const payload = { ...agenda }
      delete (payload as any).id

      if (agenda.id) {
        const { error } = await supabase.from("meeting_agendas").update(payload).eq("id", agenda.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from("meeting_agendas").insert(payload).select().single()
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
    const sorted = [...allDates].sort().reverse()
    const prevDate = sorted.find((d) => d < agenda.meeting_date)
    if (!prevDate) { alert("No previous agenda found."); return }

    const { data } = await supabase
      .from("meeting_agendas")
      .select("*")
      .eq("meeting_type", config.meetingType)
      .eq("meeting_date", prevDate)
      .maybeSingle()
    if (!data) { alert("No previous agenda found."); return }

    const carryItems = (data.action_items as ActionItem[] || [])
      .filter((i) => i.status !== "Completed")
    setAgenda((prev) => ({
      ...prev,
      meeting_time: data.meeting_time || prev.meeting_time,
      presiding: data.presiding || prev.presiding,
      conducting: data.conducting || prev.conducting,
      stake_vision: data.stake_vision || prev.stake_vision,
      attendees: (data.attendees as string[]) || prev.attendees,
      action_items: carryItems,
    }))
  }

  const update = (field: keyof AgendaData, value: any) => {
    setAgenda((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  if (loading) return <div className="p-6"><div className="text-center py-12 text-gray-500">Loading agenda...</div></div>

  const has = (s: AgendaSection) => config.sections.includes(s)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/modules/meetings" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Meetings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600 mt-1">{formatDate(agenda.meeting_date)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!agenda.id && (
              <Button variant="outline" size="sm" onClick={copyFromPrevious}>
                <Copy className="h-4 w-4 mr-2" /> Copy from Previous
              </Button>
            )}
            <Button onClick={saveAgenda} disabled={saving}>
              {saving ? "Saving..." : saved ? <><CheckCircle className="h-4 w-4 mr-2" /> Saved</> : <><Save className="h-4 w-4 mr-2" /> Save Agenda</>}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Button variant="outline" size="sm" onClick={() => navigateToMeeting(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium text-gray-700">{formatShortDate(agenda.meeting_date)}</span>
          <Button variant="outline" size="sm" onClick={() => navigateToMeeting(1)}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => loadAgenda(getNextDate())} className="ml-2">Today</Button>
          {allKnownDates.length > 0 && (
            <select className="text-sm border rounded-md px-2 py-1 text-gray-700" value={agenda.meeting_date} onChange={(e) => loadAgenda(e.target.value)}>
              {!allKnownDates.includes(agenda.meeting_date) && (
                <option value={agenda.meeting_date}>
                  {formatShortDate(agenda.meeting_date)} {englishMenuTitleCase("(new)")}
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
        </div>
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
                {agenda.calendar_items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input type="date" value={item.date} onChange={(e) => { const items = [...agenda.calendar_items]; items[idx] = { ...items[idx], date: e.target.value }; update("calendar_items", items) }} className={`${inputClass} col-span-3`} />
                    <input type="text" value={item.time} onChange={(e) => { const items = [...agenda.calendar_items]; items[idx] = { ...items[idx], time: e.target.value }; update("calendar_items", items) }} placeholder="Time" className={`${inputClass} col-span-2`} />
                    <input type="text" value={item.event} onChange={(e) => { const items = [...agenda.calendar_items]; items[idx] = { ...items[idx], event: e.target.value }; update("calendar_items", items) }} placeholder="Event" className={`${inputClass} col-span-6`} />
                    <button onClick={() => update("calendar_items", agenda.calendar_items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 col-span-1 flex justify-center"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => update("calendar_items", [...agenda.calendar_items, { date: "", time: "", event: "" }])}>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Presiding</label>
                  <input type="text" value={agenda.presiding} onChange={(e) => update("presiding", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Conducting</label>
                  <input type="text" value={agenda.conducting} onChange={(e) => update("conducting", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hymn</label>
                  <input type="text" value={agenda.opening_hymn} onChange={(e) => update("opening_hymn", e.target.value)} className={inputClass} placeholder="e.g., #288" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                  <input type="text" value={agenda.meeting_time} onChange={(e) => update("meeting_time", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Opening Prayer</label>
                  <input type="text" value={agenda.opening_prayer} onChange={(e) => update("opening_prayer", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Closing Prayer</label>
                  <input type="text" value={agenda.closing_prayer} onChange={(e) => update("closing_prayer", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Stake Vision</label>
                  <input type="text" value={agenda.stake_vision} onChange={(e) => update("stake_vision", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Handbook Trainer</label>
                  <input type="text" value={agenda.handbook_trainer} onChange={(e) => update("handbook_trainer", e.target.value)} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Handbook Topic</label>
                  <input type="text" value={agenda.handbook_topic} onChange={(e) => update("handbook_topic", e.target.value)} className={inputClass} placeholder="e.g., 1.2.3. Inviting All to Receive the Gospel" />
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
                {agenda.attendees.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="text" value={name} onChange={(e) => { const a = [...agenda.attendees]; a[idx] = e.target.value; update("attendees", a) }} className={`${inputClass} flex-1`} />
                    <button onClick={() => update("attendees", agenda.attendees.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => update("attendees", [...agenda.attendees, ""])}>
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
                <Button variant="outline" size="sm" onClick={() => update("action_items", [...agenda.action_items, { assigned_to: "", status: "Assigned", assignment: "" }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agenda.action_items.length === 0 ? (
                <p className="text-gray-400 text-center py-4 text-sm">No action items yet.</p>
              ) : (
                <div className="space-y-3">
                  {agenda.action_items.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" value={item.assigned_to} onChange={(e) => { const items = [...agenda.action_items]; items[idx] = { ...items[idx], assigned_to: e.target.value }; update("action_items", items) }} placeholder="Assigned to" className={`${inputClass} col-span-4`} />
                        <select value={item.status} onChange={(e) => { const items = [...agenda.action_items]; items[idx] = { ...items[idx], status: e.target.value }; update("action_items", items) }} className={`${inputClass} col-span-3`}>
                          <option value="Assigned">{englishMenuTitleCase("Assigned")}</option>
                          <option value="In Progress">{englishMenuTitleCase("In Progress")}</option>
                          <option value="Completed">{englishMenuTitleCase("Completed")}</option>
                        </select>
                        <input type="text" value={item.assignment} onChange={(e) => { const items = [...agenda.action_items]; items[idx] = { ...items[idx], assignment: e.target.value }; update("action_items", items) }} placeholder="Assignment description" className={`${inputClass} col-span-4`} />
                        <button onClick={() => update("action_items", agenda.action_items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 col-span-1 flex justify-center"><Trash2 className="h-4 w-4" /></button>
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
                <Button variant="outline" size="sm" onClick={() => update("training", [...agenda.training, { conducted_by: "", topic: "" }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agenda.training.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input type="text" value={item.conducted_by} onChange={(e) => { const items = [...agenda.training]; items[idx] = { ...items[idx], conducted_by: e.target.value }; update("training", items) }} placeholder="Conducted by" className={`${inputClass} col-span-4`} />
                    <input type="text" value={item.topic} onChange={(e) => { const items = [...agenda.training]; items[idx] = { ...items[idx], topic: e.target.value }; update("training", items) }} placeholder="Topic" className={`${inputClass} col-span-7`} />
                    <button onClick={() => update("training", agenda.training.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 col-span-1 flex justify-center"><Trash2 className="h-4 w-4" /></button>
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
                <Button variant="outline" size="sm" onClick={() => update("discussion_items", [...agenda.discussion_items, { topic: "", notes: "" }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Topic
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agenda.discussion_items.length === 0 ? (
                <p className="text-gray-400 text-center py-4 text-sm">No discussion topics yet.</p>
              ) : (
                <div className="space-y-4">
                  {agenda.discussion_items.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="text" value={item.topic} onChange={(e) => { const items = [...agenda.discussion_items]; items[idx] = { ...items[idx], topic: e.target.value }; update("discussion_items", items) }} placeholder="Topic" className={`${inputClass} flex-1`} />
                        <button onClick={() => update("discussion_items", agenda.discussion_items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <textarea rows={2} value={item.notes} onChange={(e) => { const items = [...agenda.discussion_items]; items[idx] = { ...items[idx], notes: e.target.value }; update("discussion_items", items) }} placeholder="Notes..." className={textareaClass} />
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
              <textarea rows={3} value={agenda.closing_remarks} onChange={(e) => update("closing_remarks", e.target.value)} className={textareaClass} placeholder="Closing remarks and summary..." />
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
              <textarea rows={4} value={agenda.general_notes} onChange={(e) => update("general_notes", e.target.value)} className={textareaClass} placeholder="Additional notes, reminders, follow-up items..." />
            </CardContent>
          </Card>
        )}

        {/* Bottom save */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Status:</label>
            <select value={agenda.status} onChange={(e) => update("status", e.target.value)} className="text-sm border rounded-md px-2 py-1 text-gray-700">
              <option value="upcoming">{englishMenuTitleCase("Upcoming")}</option>
              <option value="in_progress">{englishMenuTitleCase("In Progress")}</option>
              <option value="completed">{englishMenuTitleCase("Completed")}</option>
            </select>
          </div>
          <Button onClick={saveAgenda} disabled={saving} size="lg">
            {saving ? "Saving..." : saved ? <><CheckCircle className="h-4 w-4 mr-2" /> Saved</> : <><Save className="h-4 w-4 mr-2" /> Save Agenda</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
