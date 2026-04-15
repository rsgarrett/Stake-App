"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Download, List, LayoutGrid } from "lucide-react"

interface UnifiedEvent {
  id: string
  title: string
  start: Date
  end?: Date
  source: "meeting" | "interview" | "conference" | "youth" | "temple" | "event"
  color: string
  location?: string
  extra?: string
}

const SOURCE_COLORS: Record<string, string> = {
  meeting: "#3b82f6",
  interview: "#8b5cf6",
  conference: "#ef4444",
  youth: "#f59e0b",
  temple: "#10b981",
  event: "#6366f1",
}

const SOURCE_LABELS: Record<string, string> = {
  meeting: "Meeting",
  interview: "Interview",
  conference: "Conference",
  youth: "Youth",
  temple: "Temple",
  event: "Event",
}

type ViewMode = "month" | "list"

export default function UnifiedCalendarPage() {
  const [allEvents, setAllEvents] = useState<UnifiedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [sourceFilters, setSourceFilters] = useState<Record<string, boolean>>({
    meeting: true, interview: true, conference: true, youth: true, temple: true, event: true,
  })
  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const events: UnifiedEvent[] = []

      // Meetings
      const { data: meetings } = await safeQuery(supabase.from("meetings").select("id, title, scheduled_date, end_date, location, meeting_type"))
      meetings?.forEach((m) => events.push({
        id: `meeting-${m.id}`, title: m.title, start: new Date(m.scheduled_date),
        end: m.end_date ? new Date(m.end_date) : undefined, source: "meeting",
        color: SOURCE_COLORS.meeting, location: m.location, extra: m.meeting_type,
      }))

      // Interviews
      const { data: interviews } = await safeQuery(supabase.from("interviews").select("id, interviewee_name, interview_type, scheduled_date, status").eq("status", "scheduled"))
      interviews?.forEach((i) => events.push({
        id: `interview-${i.id}`, title: `Interview: ${i.interviewee_name}`, start: new Date(i.scheduled_date),
        source: "interview", color: SOURCE_COLORS.interview,
        extra: i.interview_type.replace(/_/g, " "),
      }))

      // Conferences
      const { data: conferences } = await safeQuery(supabase.from("special_events").select("id, title, start_date, end_date, location, event_type"))
      conferences?.forEach((c) => events.push({
        id: `conference-${c.id}`, title: c.title, start: new Date(c.start_date),
        end: new Date(c.end_date), source: "conference", color: SOURCE_COLORS.conference,
        location: c.location, extra: c.event_type,
      }))

      // Youth activities
      const { data: youthActs } = await safeQuery(supabase.from("youth_activities").select("id, activity_name, activity_date, location"))
      youthActs?.forEach((y) => events.push({
        id: `youth-${y.id}`, title: y.activity_name, start: new Date(y.activity_date),
        source: "youth", color: SOURCE_COLORS.youth, location: y.location,
      }))

      // Temple trips
      const { data: templeAtt } = await safeQuery(supabase.from("temple_attendance").select("id, event_type, event_date, attendance_count"))
      templeAtt?.forEach((t) => events.push({
        id: `temple-${t.id}`, title: `${t.event_type} (${t.attendance_count})`, start: new Date(t.event_date),
        source: "temple", color: SOURCE_COLORS.temple,
      }))

      // General events
      const { data: genEvents } = await safeQuery(supabase.from("events").select("id, title, start_date, end_date, location, event_type"))
      genEvents?.forEach((e) => events.push({
        id: `event-${e.id}`, title: e.title, start: new Date(e.start_date),
        end: e.end_date ? new Date(e.end_date) : undefined, source: "event",
        color: SOURCE_COLORS.event, location: e.location, extra: e.event_type,
      }))

      events.sort((a, b) => a.start.getTime() - b.start.getTime())
      setAllEvents(events)
    } catch (err) {
      console.error("Error loading calendar:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = useMemo(() =>
    allEvents.filter((e) => sourceFilters[e.source]),
    [allEvents, sourceFilters]
  )

  // Conflict detection
  const conflicts = useMemo(() => {
    const result: { event1: UnifiedEvent; event2: UnifiedEvent }[] = []
    for (let i = 0; i < filteredEvents.length; i++) {
      for (let j = i + 1; j < filteredEvents.length; j++) {
        const a = filteredEvents[i]
        const b = filteredEvents[j]
        const aEnd = a.end || new Date(a.start.getTime() + 60 * 60 * 1000)
        const bEnd = b.end || new Date(b.start.getTime() + 60 * 60 * 1000)
        if (a.start < bEnd && b.start < aEnd) {
          result.push({ event1: a, event2: b })
        }
      }
    }
    return result
  }, [filteredEvents])

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const monthEvents = filteredEvents.filter((e) =>
    e.start.getFullYear() === currentMonth.getFullYear() && e.start.getMonth() === currentMonth.getMonth()
  )

  const getEventsForDay = (day: number) =>
    monthEvents.filter((e) => e.start.getDate() === day)

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

  // iCal export
  const exportICal = () => {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//StakeApp//EN"]
    filteredEvents.forEach((e) => {
      const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
      lines.push("BEGIN:VEVENT")
      lines.push(`DTSTART:${fmt(e.start)}`)
      if (e.end) lines.push(`DTEND:${fmt(e.end)}`)
      lines.push(`SUMMARY:${e.title}`)
      if (e.location) lines.push(`LOCATION:${e.location}`)
      lines.push(`UID:${e.id}@stakeapp`)
      lines.push("END:VEVENT")
    })
    lines.push("END:VCALENDAR")
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "stake-calendar.ics"
    a.click()
    URL.revokeObjectURL(url)
  }

  const upcomingList = filteredEvents.filter((e) => e.start >= new Date()).slice(0, 50)

  if (loading) return <div className="p-6"><div className="text-center py-12">Loading calendar...</div></div>

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" })

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unified Calendar</h1>
          <p className="mt-2 text-gray-600">All stake events in one view</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-300 rounded-md">
            <Button variant={viewMode === "month" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("month")} className="rounded-r-none">
              <LayoutGrid className="h-4 w-4 mr-1" />Month
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-l-none">
              <List className="h-4 w-4 mr-1" />List
            </Button>
          </div>
          <Button variant="outline" onClick={exportICal}><Download className="h-4 w-4 mr-2" />Export iCal</Button>
        </div>
      </div>

      {/* Source Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">Show:</span>
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setSourceFilters((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={`flex items-center px-3 py-1 text-xs rounded-full border ${sourceFilters[key] ? "border-transparent text-white" : "border-gray-300 text-gray-500 bg-white"}`}
                style={sourceFilters[key] ? { backgroundColor: SOURCE_COLORS[key] } : {}}>
                {label}
              </button>
            ))}
            {conflicts.length > 0 && (
              <span className="flex items-center text-xs text-red-600 ml-4">
                <AlertTriangle className="h-3 w-3 mr-1" />{conflicts.length} conflict{conflicts.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {viewMode === "month" ? (
        /* MONTH VIEW */
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle>{monthName}</CardTitle>
              <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = getEventsForDay(day)
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear()
                return (
                  <div key={day} className={`bg-white p-1 min-h-[80px] ${isToday ? "ring-2 ring-indigo-500 ring-inset" : ""}`}>
                    <div className={`text-xs font-medium mb-1 ${isToday ? "text-indigo-600" : "text-gray-700"}`}>{day}</div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div key={e.id} className="text-xs px-1 py-0.5 rounded truncate text-white" style={{ backgroundColor: e.color }}>
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3} more</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* LIST VIEW */
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events ({upcomingList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingList.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcomingList.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <div>
                        <div className="font-medium text-gray-900">{e.title}</div>
                        <div className="text-xs text-gray-500">
                          {e.start.toLocaleDateString()} {e.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {e.location && ` · ${e.location}`}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: e.color }}>
                      {SOURCE_LABELS[e.source]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />Scheduling Conflicts ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.map((c, idx) => (
                <div key={idx} className="p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.event1.color }} />
                    <span className="text-sm font-medium">{c.event1.title}</span>
                    <span className="text-xs text-gray-500">{c.event1.start.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-red-500 my-1 ml-5">overlaps with</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.event2.color }} />
                    <span className="text-sm font-medium">{c.event2.title}</span>
                    <span className="text-xs text-gray-500">{c.event2.start.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
