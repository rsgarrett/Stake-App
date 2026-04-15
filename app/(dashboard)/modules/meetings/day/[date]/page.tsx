"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Plus,
  Calendar,
  FileText,
  UserCircle,
  Edit2,
  Trash2,
} from "lucide-react"
import { format, addDays, subDays } from "date-fns"

interface Meeting {
  id: string
  title: string
  meeting_type: string
  scheduled_date: string
  end_date?: string | null
  location?: string | null
  description?: string | null
  color?: string | null
  participants?: string[] | null
}

interface Interview {
  id: string
  interviewee_name: string
  interview_type: string
  scheduled_date: string
  location?: string | null
  status: string
  interviewer_id?: string | null
  notes?: string | null
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  stake_presidency: "Stake Presidency",
  high_council: "High Council",
  stake_council: "Stake Council",
  bishopric_ministering: "Bishopric Ministering",
  eq_ministering: "EQ Ministering",
  rs_ministering: "RS Ministering",
  coordinating_council: "Coordinating Council",
  bishops_council: "Bishops Council",
  ward_visit: "Ward Visit",
  teaching: "Teaching Assignment",
  ward_conference: "Ward Conference",
  stake_conference: "Stake Conference",
  general_conference: "General Conference",
  thursday_ministering: "Thursday Ministering",
}

function getAgendaRoute(meetingType: string, title: string): string | null {
  const mt = (meetingType || "").toLowerCase().replace(/[\s-]+/g, "_")
  const t = (title || "").toLowerCase()
  if (mt.includes("stake_presidency") || t.includes("stake pres")) return "stake-presidency"
  if (mt.includes("high_council") || t.includes("high council")) return "high-council"
  if (mt.includes("stake_council") || t.includes("stake council")) return "stake-council"
  if (mt.includes("missionary") || t.includes("missionary")) return "missionary-coordination"
  if (mt.includes("temple") || mt.includes("family_history") || t.includes("temple") || t.includes("family history")) return "temple-family-history"
  if (mt === "rs_ministering" || t.includes("rs ministering") || t.includes("relief society ministering")) return null
  if (mt === "eq_ministering" || t.includes("eq ministering") || t.includes("elders quorum ministering")) return null
  if (mt === "bishopric_ministering" || t.includes("bishopric ministering")) return null
  if (mt.includes("relief_society") || t.includes("relief society") || t.includes("rs presidents")) return "relief-society-coordination"
  return null
}

export default function DayViewPage() {
  const params = useParams()
  const router = useRouter()
  const dateStr = params.date as string
  const supabase = createClient()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [navigating, setNavigating] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState<string | null>(null)
  const [newParticipant, setNewParticipant] = useState("")

  const dateObj = new Date(dateStr + "T12:00:00")
  const displayDate = format(dateObj, "EEEE, MMMM d, yyyy")

  const navigateToNextScheduledDay = async (direction: "prev" | "next") => {
    setNavigating(true)
    try {
      const current = dateStr + (direction === "next" ? "T23:59:59" : "T00:00:00")
      const op = direction === "next" ? "gt" : "lt"
      const order = direction === "next" ? true : false

      const { data: meetingHit } = await supabase
        .from("meetings")
        .select("scheduled_date")
        [op]("scheduled_date", current)
        .order("scheduled_date", { ascending: order })
        .limit(1)
        .maybeSingle()

      const { data: interviewHit } = await supabase
        .from("interviews")
        .select("scheduled_date")
        [op]("scheduled_date", current)
        .order("scheduled_date", { ascending: order })
        .limit(1)
        .maybeSingle()

      const candidates: string[] = []
      if (meetingHit?.scheduled_date) candidates.push(meetingHit.scheduled_date)
      if (interviewHit?.scheduled_date) candidates.push(interviewHit.scheduled_date)

      if (candidates.length === 0) {
        const fallback = direction === "next" ? format(addDays(dateObj, 1), "yyyy-MM-dd") : format(subDays(dateObj, 1), "yyyy-MM-dd")
        router.push(`/modules/meetings/day/${fallback}`)
        return
      }

      candidates.sort()
      const winner = direction === "next" ? candidates[0] : candidates[candidates.length - 1]
      const targetDate = new Date(winner).toISOString().split("T")[0]
      router.push(`/modules/meetings/day/${targetDate}`)
    } catch (err) {
      console.error("Navigation error:", err)
      const fallback = direction === "next" ? format(addDays(dateObj, 1), "yyyy-MM-dd") : format(subDays(dateObj, 1), "yyyy-MM-dd")
      router.push(`/modules/meetings/day/${fallback}`)
    } finally {
      setNavigating(false)
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const dayStart = dateStr + "T00:00:00"
      const dayEnd = dateStr + "T23:59:59"

      const [meetingsResult, interviewsResult] = await Promise.all([
        safeQuery(
          supabase
            .from("meetings")
            .select("*")
            .gte("scheduled_date", dayStart)
            .lte("scheduled_date", dayEnd)
            .order("scheduled_date", { ascending: true })
        ),
        safeQuery(
          supabase
            .from("interviews")
            .select("*")
            .gte("scheduled_date", dayStart)
            .lte("scheduled_date", dayEnd)
            .order("scheduled_date", { ascending: true })
        ),
      ])

      setMeetings(meetingsResult.data || [])
      setInterviews(interviewsResult.data || [])
    } catch (err) {
      console.error("Error loading day data:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, dateStr])

  useEffect(() => {
    loadData()
  }, [dateStr])

  const navigateToMeeting = (meeting: Meeting) => {
    const date = new Date(meeting.scheduled_date).toISOString().split("T")[0]
    const agendaType = getAgendaRoute(meeting.meeting_type, meeting.title)
    if (agendaType === "stake-presidency") {
      router.push(`/modules/meetings/sp-agenda?date=${date}`)
    } else if (agendaType) {
      router.push(`/modules/meetings/agenda/${agendaType}?date=${date}`)
    } else {
      router.push(`/modules/meetings/${meeting.id}`)
    }
  }

  const addParticipant = async (meetingId: string) => {
    if (!newParticipant.trim()) return
    const meeting = meetings.find((m) => m.id === meetingId)
    const current = meeting?.participants || []
    const updated = [...current, newParticipant.trim()]

    await supabase.from("meetings").update({ participants: updated }).eq("id", meetingId)
    setNewParticipant("")
    setShowAddParticipant(null)
    await loadData()
  }

  const removeParticipant = async (meetingId: string, name: string) => {
    const meeting = meetings.find((m) => m.id === meetingId)
    const updated = (meeting?.participants || []).filter((p) => p !== name)
    await supabase.from("meetings").update({ participants: updated }).eq("id", meetingId)
    await loadData()
  }

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "h:mm a")
    } catch {
      return ""
    }
  }

  const totalItems = meetings.length + interviews.length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/modules/meetings"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Calendar
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" disabled={navigating} onClick={() => navigateToNextScheduledDay("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{displayDate}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {totalItems === 0 ? "Nothing scheduled" : `${totalItems} item${totalItems !== 1 ? "s" : ""} scheduled`}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={navigating} onClick={() => navigateToNextScheduledDay("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => router.push(`/modules/meetings?addDate=${dateStr}`)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : totalItems === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No meetings or interviews scheduled</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add" to schedule something for this day</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Meetings */}
          {meetings.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Meetings ({meetings.length})
              </h2>
              <div className="space-y-3">
                {meetings.map((meeting) => {
                  const typeLabel = MEETING_TYPE_LABELS[meeting.meeting_type] || meeting.meeting_type.replace(/_/g, " ")
                  const hasAgenda = !!getAgendaRoute(meeting.meeting_type, meeting.title)
                  const desc = meeting.description || ""
                  const descLines = desc.split("\n").filter(Boolean)
                  const timeLine = descLines.find((l) => /^\d/.test(l))
                  const attendeeLine = descLines.find((l) => l.startsWith("PG:") || l.startsWith("PC:"))

                  return (
                    <Card
                      key={meeting.id}
                      className="overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div
                        className="h-1.5"
                        style={{ backgroundColor: meeting.color || "#3b82f6" }}
                      />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">{typeLabel}</p>
                          </div>
                          <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                            {hasAgenda && (
                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                                onClick={() => navigateToMeeting(meeting)}
                                title="Open agenda"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              onClick={() => router.push(`/modules/meetings/${meeting.id}`)}
                              title="Meeting details"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          {timeLine && (
                            <span className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                              {timeLine}
                            </span>
                          )}
                          {!timeLine && meeting.scheduled_date && (
                            <span className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                              {formatTime(meeting.scheduled_date)}
                              {meeting.end_date && ` – ${formatTime(meeting.end_date)}`}
                            </span>
                          )}
                          {meeting.location && (
                            <span className="flex items-center">
                              <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                              {meeting.location}
                            </span>
                          )}
                        </div>

                        {attendeeLine && (
                          <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1.5 font-mono">
                            {attendeeLine}
                          </div>
                        )}

                        {/* Participants */}
                        <div className="mt-3 border-t pt-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              Participants
                            </span>
                            <button
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                              onClick={() => {
                                setShowAddParticipant(showAddParticipant === meeting.id ? null : meeting.id)
                                setNewParticipant("")
                              }}
                            >
                              {showAddParticipant === meeting.id ? "Cancel" : "+ Add"}
                            </button>
                          </div>

                          {showAddParticipant === meeting.id && (
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                placeholder="Name or role..."
                                value={newParticipant}
                                onChange={(e) => setNewParticipant(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") addParticipant(meeting.id) }}
                                className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                              <Button size="sm" className="h-8" onClick={() => addParticipant(meeting.id)}>
                                Add
                              </Button>
                            </div>
                          )}

                          {(meeting.participants && meeting.participants.length > 0) ? (
                            <div className="flex flex-wrap gap-1.5">
                              {meeting.participants.map((p, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center bg-gray-100 text-gray-700 text-xs rounded-full px-2.5 py-1 group"
                                >
                                  <UserCircle className="h-3 w-3 mr-1 text-gray-400" />
                                  {p}
                                  <button
                                    className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeParticipant(meeting.id, p)}
                                    title="Remove"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No participants assigned</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Interviews */}
          {interviews.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">
                Interviews ({interviews.length})
              </h2>
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <Card key={interview.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-1.5 bg-amber-400" />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{interview.interviewee_name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {interview.interview_type.replace(/_/g, " ")}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          interview.status === "completed" ? "bg-green-100 text-green-700" :
                          interview.status === "cancelled" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {interview.status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          {formatTime(interview.scheduled_date)}
                        </span>
                        {interview.location && (
                          <span className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                            {interview.location}
                          </span>
                        )}
                      </div>

                      {interview.notes && (
                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded px-2 py-1.5">
                          {interview.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
