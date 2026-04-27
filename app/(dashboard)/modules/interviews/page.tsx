"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { formatInterviewType, MISSION_INTERVIEW_TYPE } from "@/lib/interviews/interview-types"
import { navigateInterviewSelection } from "@/lib/interviews/navigate-mission-interview"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"
import { DEFAULT_MISSION_READY_TASKS } from "@/lib/missionary/mission-ready-defaults"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Globe,
  ClipboardCheck,
  ChevronRight,
  Award,
  AlertTriangle,
  Trash2,
  Loader2,
} from "lucide-react"

interface Interview {
  id: string
  interviewee_name: string
  interview_type: string
  scheduled_date: string
  conducted_date?: string | null
  interviewer_id: string
  status: "scheduled" | "completed" | "cancelled"
  notes?: string | null
  created_at: string
}

interface MissionReadyMissionary {
  id: string
  missionary_name: string
  status: string
  notes?: string | null
  created_at: string
}

interface MissionReadyProgress {
  missionary_id: string
  completed: boolean
}

type InterviewTab = "upcoming" | "missed" | "all"
type MissionTab = "preparing" | "serving" | "returned"

const READY_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  preparing: { bg: "bg-blue-100", text: "text-blue-700", label: "Preparing" },
  papers_submitted: { bg: "bg-amber-100", text: "text-amber-700", label: "Papers Submitted" },
  call_received: { bg: "bg-purple-100", text: "text-purple-700", label: "Call Received" },
  set_apart: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Set Apart" },
  serving: { bg: "bg-green-100", text: "text-green-700", label: "Serving" },
  completed: { bg: "bg-gray-100", text: "text-gray-600", label: "Returned" },
}

export default function InterviewsPage() {
  const supabase = createClient()
  const router = useRouter()

  // --- Interviews state ---
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [interviewTab, setInterviewTab] = useState<InterviewTab>("upcoming")
  const [typeFilter, setTypeFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [deletingInterviewId, setDeletingInterviewId] = useState<string | null>(null)
  const [openingInterviewId, setOpeningInterviewId] = useState<string | null>(null)

  // --- Mission Ready state ---
  const [readyMissionaries, setReadyMissionaries] = useState<MissionReadyMissionary[]>([])
  const [readyProgress, setReadyProgress] = useState<MissionReadyProgress[]>([])
  const [missionTab, setMissionTab] = useState<MissionTab>("preparing")
  const [showAddReady, setShowAddReady] = useState(false)
  const [newReadyName, setNewReadyName] = useState("")
  const [addingReady, setAddingReady] = useState(false)
  const [missionLoading, setMissionLoading] = useState(true)

  useEffect(() => {
    loadInterviews()
    loadMissionData()
  }, [])

  // ==================== INTERVIEWS ====================

  const loadInterviews = async () => {
    try {
      const { data } = await safeQuery(supabase
        .from("interviews")
        .select("*")
        .order("scheduled_date", { ascending: true }))
      setInterviews(data || [])
    } catch (err: any) {
      console.error("Error loading interviews:", err)
    } finally {
      setLoading(false)
    }
  }

  const deleteInterview = async (id: string) => {
    if (!confirm("Delete this interview? Related notes and schedule slots will be removed. This cannot be undone.")) {
      return
    }
    setDeletingInterviewId(id)
    try {
      const { error } = await supabase.from("interviews").delete().eq("id", id)
      if (error) throw error
      await loadInterviews()
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Could not delete this interview."
      alert(message)
    } finally {
      setDeletingInterviewId(null)
    }
  }

  const openMissionInterviewRow = (interview: Interview) => {
    if (openingInterviewId) return
    setOpeningInterviewId(interview.id)
    void navigateInterviewSelection(supabase, router, interview).finally(() => setOpeningInterviewId(null))
  }

  const now = new Date()
  const missedInterviews = interviews.filter((i) => {
    if (i.status !== "scheduled") return false
    return new Date(i.scheduled_date) < now
  })

  const filteredInterviews = interviews.filter((i) => {
    if (interviewTab === "upcoming") return i.status === "scheduled" && new Date(i.scheduled_date) >= now
    if (interviewTab === "missed") return i.status === "scheduled" && new Date(i.scheduled_date) < now
    return true
  }).filter((i) => typeFilter === "all" || i.interview_type === typeFilter)

  const todayInterviews = interviews.filter((i) => {
    if (i.status !== "scheduled") return false
    return new Date(i.scheduled_date).toDateString() === now.toDateString()
  })

  const thisWeekInterviews = interviews.filter((i) => {
    if (i.status !== "scheduled") return false
    const d = new Date(i.scheduled_date)
    const weekFromNow = new Date(now)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return d >= now && d <= weekFromNow
  })

  const uniqueTypes = Array.from(new Set(interviews.map((i) => i.interview_type))).sort()

  const getStatusIcon = (status: string) => {
    if (status === "scheduled") return <Clock className="h-4 w-4 text-blue-500" />
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-gray-400" />
  }

  // ==================== MISSION READY ====================

  const loadMissionData = async () => {
    try {
      const [readyResult, progResult] = await Promise.all([
        safeQuery(supabase.from("mission_ready_missionaries").select("*").order("created_at", { ascending: false })),
        safeQuery(supabase.from("mission_ready_progress").select("missionary_id, completed")),
      ])
      const missionaries: MissionReadyMissionary[] = readyResult.data || []
      const progress: MissionReadyProgress[] = progResult.data || []

      const preparingStatuses = ["preparing", "papers_submitted", "call_received", "set_apart"]
      for (const m of missionaries) {
        if (preparingStatuses.includes(m.status)) {
          const items = progress.filter((p) => p.missionary_id === m.id)
          if (items.length > 0 && items.every((p) => p.completed)) {
            await supabase.from("mission_ready_missionaries").update({ status: "serving" }).eq("id", m.id)
            m.status = "serving"
          }
        }
      }

      setReadyMissionaries(missionaries)
      setReadyProgress(progress)
    } catch (err) { console.error(err) }
    finally { setMissionLoading(false) }
  }

  const addReadyMissionary = async () => {
    if (!newReadyName.trim()) return
    setAddingReady(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = user ? await supabase.from("users").select("stake_id").eq("id", user!.id).single() : { data: null }
      let stakeId = userData?.stake_id
      if (!stakeId) { const { data: s } = await supabase.from("stakes").select("id").limit(1).single(); stakeId = s?.id }

      const { data: newMissionary, error: insertError } = await supabase
        .from("mission_ready_missionaries")
        .insert({ missionary_name: newReadyName.trim(), stake_id: stakeId, status: "preparing" })
        .select()
        .single()

      if (insertError || !newMissionary) throw insertError

      const progressItems = DEFAULT_MISSION_READY_TASKS.map((task) => ({
        missionary_id: newMissionary.id,
        task_number: task.task_number,
        task_name: task.task_name,
        additional_resource: task.additional_resource,
        completed: false,
        display_order: task.task_number,
      }))

      await supabase.from("mission_ready_progress").insert(progressItems)
      setNewReadyName("")
      setShowAddReady(false)
      await loadMissionData()
    } catch (err) {
      console.error(err)
    } finally {
      setAddingReady(false)
    }
  }

  const deleteReadyMissionary = async (id: string) => {
    if (!confirm("Remove this missionary? This will delete all their progress.")) return
    await supabase.from("mission_ready_missionaries").delete().eq("id", id)
    await loadMissionData()
  }

  const markMissionComplete = async (id: string) => {
    await supabase.from("mission_ready_missionaries").update({ status: "completed" }).eq("id", id)
    await loadMissionData()
  }

  const getProgressForMissionary = (missionaryId: string) => {
    const items = readyProgress.filter((p) => p.missionary_id === missionaryId)
    const completed = items.filter((p) => p.completed).length
    const total = items.length || 20
    return { completed, total, percent: Math.round((completed / total) * 100) }
  }

  const preparingMissionaries = readyMissionaries.filter((m) => !["serving", "completed"].includes(m.status))
  const servingMissionaries = readyMissionaries.filter((m) => m.status === "serving")
  const returnedMissionaries = readyMissionaries.filter((m) => m.status === "completed")

  if (loading && missionLoading) return <div className="p-6"><div className="text-center py-12">Loading...</div></div>

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
          <p className="mt-2 text-gray-600">Schedule interviews and track Mission Ready candidates on this page.</p>
        </div>
        <Link href="/modules/interviews/schedule" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Interview
        </Link>
      </div>

      {/* ==================== INTERVIEWS ==================== */}
      <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Today</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{todayInterviews.length}</div>
                <p className="text-xs text-gray-500 mt-1">interviews scheduled</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">This Week</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{thisWeekInterviews.length}</div>
                <p className="text-xs text-gray-500 mt-1">upcoming interviews</p>
              </CardContent>
            </Card>
            <Card className={missedInterviews.length > 0 ? "border-amber-200 bg-amber-50/40" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${missedInterviews.length > 0 ? "text-amber-600" : "text-gray-400"}`} />
                  Missed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${missedInterviews.length > 0 ? "text-amber-700" : "text-gray-700"}`}>
                  {missedInterviews.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">scheduled but past time — mark complete or reschedule</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-1 border-b">
              {(["upcoming", "missed", "all"] as const).map((t) => (
                <button key={t} onClick={() => setInterviewTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${interviewTab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  {t === "missed" ? "Missed" : t}
                </button>
              ))}
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md">
              <option value="all">{englishMenuTitleCase("All types")}</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {formatInterviewType(t)}
                </option>
              ))}
            </select>
          </div>

          <Card>
            <CardContent className="pt-6">
              {filteredInterviews.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {interviewTab === "missed"
                    ? "No missed interviews — past-due scheduled interviews will appear here."
                    : "No interviews found"}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredInterviews.map((interview) => {
                    const isMissionInterview = interview.interview_type === MISSION_INTERVIEW_TYPE
                    const rowOpening = openingInterviewId === interview.id

                    const rowBody = (
                      <>
                        <div className="flex items-center space-x-3 min-w-0">
                          {getStatusIcon(interview.status)}
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">{interview.interviewee_name}</div>
                            <div className="text-sm text-gray-500">{formatInterviewType(interview.interview_type)}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          {isMissionInterview && rowOpening ? (
                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600 inline-block mb-1" aria-label="Opening Mission Ready" />
                          ) : null}
                          <div className="text-sm text-gray-700">{new Date(interview.scheduled_date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(interview.scheduled_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                          {interviewTab === "missed" && interview.status === "scheduled" && (
                            <div className="text-xs font-medium text-amber-700 mt-1">Needs follow-up</div>
                          )}
                        </div>
                      </>
                    )

                    const missionPrimaryClass =
                      "flex flex-1 min-w-0 items-center justify-between p-3 text-left rounded-l-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"

                    if (interviewTab === "all") {
                      return (
                        <div
                          key={interview.id}
                          className="flex items-stretch rounded-lg border border-gray-200 bg-white hover:bg-gray-50/80"
                        >
                          {isMissionInterview ? (
                            <div
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault()
                                  openMissionInterviewRow(interview)
                                }
                              }}
                              onClick={() => openMissionInterviewRow(interview)}
                              className={`${missionPrimaryClass} cursor-pointer hover:bg-gray-50/80 ${rowOpening ? "pointer-events-none opacity-70" : ""}`}
                            >
                              {rowBody}
                            </div>
                          ) : (
                            <Link href={`/modules/interviews/${interview.id}`} className={missionPrimaryClass}>
                              {rowBody}
                            </Link>
                          )}
                          <button
                            type="button"
                            title="Delete interview"
                            aria-label="Delete interview"
                            disabled={deletingInterviewId === interview.id}
                            onClick={(e) => {
                              e.preventDefault()
                              void deleteInterview(interview.id)
                            }}
                            className="shrink-0 px-3 border-l border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            {deletingInterviewId === interview.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )
                    }

                    if (isMissionInterview) {
                      return (
                        <div
                          key={interview.id}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              openMissionInterviewRow(interview)
                            }
                          }}
                          onClick={() => openMissionInterviewRow(interview)}
                          className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${rowOpening ? "pointer-events-none opacity-70" : ""}`}
                        >
                          {rowBody}
                        </div>
                      )
                    }

                    return (
                      <Link key={interview.id} href={`/modules/interviews/${interview.id}`}>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          {rowBody}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
      </>

      {/* ==================== MISSION READY (all candidates) ==================== */}
      <div className="mt-12 pt-10 border-t border-gray-200">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Mission Ready tracker</h2>
            <p className="text-sm text-gray-600 mt-1">
              All missionary candidates in your stake. Scheduling a <strong>Mission Interview</strong> (after date and
              time are saved) or opening one from this page or the meetings calendar goes here; new interviewees are added
              automatically if needed.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Mission Ready</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-indigo-600">{preparingMissionaries.length}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Currently Serving</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-green-600">{servingMissionaries.length}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Returned</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-gray-700">{returnedMissionaries.length}</div></CardContent></Card>
          </div>

          <div className="flex space-x-1 border-b mb-4 overflow-x-auto">
            {([
              { key: "preparing" as const, label: `Mission Ready (${preparingMissionaries.length})`, icon: ClipboardCheck },
              { key: "serving" as const, label: `Currently Serving (${servingMissionaries.length})`, icon: Globe },
              { key: "returned" as const, label: `Returned (${returnedMissionaries.length})`, icon: Award },
            ]).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setMissionTab(key)}
                className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${missionTab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                <Icon className="h-4 w-4 mr-2" />{label}
              </button>
            ))}
          </div>

          {missionTab === "preparing" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mission Ready Tracker</CardTitle>
                    <CardDescription>Track each prospective missionary through the 20-step preparation process.</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddReady(true)}><Plus className="h-4 w-4 mr-2" />Add Missionary</Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddReady && (
                  <div className="mb-4 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Missionary Name</label>
                        <input
                          type="text"
                          placeholder="Full name"
                          value={newReadyName}
                          onChange={(e) => setNewReadyName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          onKeyDown={(e) => { if (e.key === "Enter") addReadyMissionary() }}
                          autoFocus
                        />
                      </div>
                      <Button onClick={addReadyMissionary} disabled={addingReady || !newReadyName.trim()}>
                        {addingReady ? "Adding..." : "Add"}
                      </Button>
                      <Button variant="outline" onClick={() => { setShowAddReady(false); setNewReadyName("") }}>Cancel</Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">A full 20-step preparation checklist will be created automatically.</p>
                  </div>
                )}

                {preparingMissionaries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No missionaries in the Mission Ready tracker yet.</p>
                ) : (
                  <div className="space-y-2">
                    {preparingMissionaries.map((m) => {
                      const prog = getProgressForMissionary(m.id)
                      const statusStyle = READY_STATUS_STYLES[m.status] || READY_STATUS_STYLES.preparing
                      return (
                        <div key={m.id} className="border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between p-4">
                            <Link href={`/modules/missionary/mission-ready/${m.id}`} className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{m.missionary_name}</div>
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                    {statusStyle.label}
                                  </span>
                                  <span className="text-xs text-gray-500">{prog.completed}/{prog.total} tasks complete</span>
                                </div>
                                <div className="mt-2 w-full max-w-xs bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${prog.percent === 100 ? "bg-green-500" : "bg-indigo-500"}`}
                                    style={{ width: `${prog.percent}%` }}
                                  />
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </Link>
                            <button
                              onClick={(e) => { e.preventDefault(); deleteReadyMissionary(m.id) }}
                              className="text-red-400 hover:text-red-600 ml-3 p-1"
                              title="Remove missionary"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {missionTab === "serving" && (
            <Card>
              <CardHeader>
                <CardTitle>Currently Serving</CardTitle>
                <CardDescription>Missionaries who have completed all preparation steps.</CardDescription>
              </CardHeader>
              <CardContent>
                {servingMissionaries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No missionaries currently serving.</p>
                ) : (
                  <div className="space-y-2">
                    {servingMissionaries.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <Globe className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-medium text-gray-900">{m.missionary_name}</div>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Serving</span>
                          </div>
                        </div>
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded" onChange={() => markMissionComplete(m.id)} />
                          <span className="text-sm text-gray-600">Mission Complete</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {missionTab === "returned" && (
            <Card>
              <CardHeader>
                <CardTitle>Returned Missionaries</CardTitle>
                <CardDescription>Missionaries who have completed their service</CardDescription>
              </CardHeader>
              <CardContent>
                {returnedMissionaries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No returned missionaries yet.</p>
                ) : (
                  <div className="space-y-2">
                    {returnedMissionaries.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Award className="h-5 w-5 text-amber-500" />
                          <div>
                            <div className="font-medium text-gray-900">{m.missionary_name}</div>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">Returned</span>
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  )
}
