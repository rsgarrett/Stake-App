"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Globe, CheckCircle2, ClipboardCheck, ChevronRight, Award } from "lucide-react"
import { DEFAULT_MISSION_READY_TASKS } from "@/lib/missionary/mission-ready-defaults"

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

type TabView = "mission_ready" | "serving" | "returned"

const READY_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  preparing: { bg: "bg-blue-100", text: "text-blue-700", label: "Preparing" },
  papers_submitted: { bg: "bg-amber-100", text: "text-amber-700", label: "Papers Submitted" },
  call_received: { bg: "bg-purple-100", text: "text-purple-700", label: "Call Received" },
  set_apart: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Set Apart" },
  serving: { bg: "bg-green-100", text: "text-green-700", label: "Serving" },
  completed: { bg: "bg-gray-100", text: "text-gray-600", label: "Returned" },
}

export default function MissionaryPage() {
  const [readyMissionaries, setReadyMissionaries] = useState<MissionReadyMissionary[]>([])
  const [readyProgress, setReadyProgress] = useState<MissionReadyProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [tabView, setTabView] = useState<TabView>("mission_ready")
  const [showAddReady, setShowAddReady] = useState(false)
  const [newReadyName, setNewReadyName] = useState("")
  const [addingReady, setAddingReady] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [readyResult, progResult] = await Promise.all([
        safeQuery(supabase.from("mission_ready_missionaries").select("*").order("created_at", { ascending: false })),
        safeQuery(supabase.from("mission_ready_progress").select("missionary_id, completed")),
      ])
      const missionaries: MissionReadyMissionary[] = readyResult.data || []
      const progress: MissionReadyProgress[] = progResult.data || []

      // Auto-transition: if all tasks are completed and status is still a preparing stage, move to "serving"
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
    finally { setLoading(false) }
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
      await loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setAddingReady(false)
    }
  }

  const deleteReadyMissionary = async (id: string) => {
    if (!confirm("Remove this missionary? This will delete all their progress.")) return
    await supabase.from("mission_ready_missionaries").delete().eq("id", id)
    await loadData()
  }

  const markMissionComplete = async (id: string) => {
    await supabase.from("mission_ready_missionaries").update({ status: "completed" }).eq("id", id)
    await loadData()
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

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

  if (loading) return <div className="p-4 sm:p-6"><div className="text-center py-12">Loading...</div></div>

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Missionary Work</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">Mission readiness tracking, currently serving, and returned missionaries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Mission Ready</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-indigo-600">{preparingMissionaries.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Currently Serving</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{servingMissionaries.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Returned</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-700">{returnedMissionaries.length}</div></CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b mb-4 overflow-x-auto">
        {([
          { key: "mission_ready" as const, label: `Mission Ready (${preparingMissionaries.length})`, icon: ClipboardCheck },
          { key: "serving" as const, label: `Currently Serving (${servingMissionaries.length})`, icon: Globe },
          { key: "returned" as const, label: `Returned (${returnedMissionaries.length})`, icon: Award },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTabView(key)}
            className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tabView === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Icon className="h-4 w-4 mr-2" />{label}
          </button>
        ))}
      </div>

      {/* ==================== MISSION READY TAB ==================== */}
      {tabView === "mission_ready" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle>Mission Ready Tracker</CardTitle>
                  <CardDescription>Track each prospective missionary through the 20-step preparation process. When all tasks are complete, they automatically move to Currently Serving.</CardDescription>
                </div>
                <Button className="w-full shrink-0 sm:w-auto" onClick={() => setShowAddReady(true)}><Plus className="h-4 w-4 mr-2" />Add Missionary</Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddReady && (
                <div className="mb-4 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Missionary Name</label>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={newReadyName}
                        onChange={(e) => setNewReadyName(e.target.value)}
                        className={inputClass}
                        onKeyDown={(e) => { if (e.key === "Enter") addReadyMissionary() }}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 sm:flex-none" onClick={addReadyMissionary} disabled={addingReady || !newReadyName.trim()}>
                        {addingReady ? "Adding..." : "Add"}
                      </Button>
                      <Button className="flex-1 sm:flex-none" variant="outline" onClick={() => { setShowAddReady(false); setNewReadyName("") }}>Cancel</Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    A full 20-step preparation checklist will be created automatically.
                  </p>
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
                                <span className="text-xs text-gray-500">
                                  {prog.completed}/{prog.total} tasks complete
                                </span>
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
                            <span className="sr-only">Delete</span>
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
        </div>
      )}

      {/* ==================== CURRENTLY SERVING TAB ==================== */}
      {tabView === "serving" && (
        <Card>
          <CardHeader>
            <CardTitle>Currently Serving</CardTitle>
            <CardDescription>Missionaries who have completed all preparation steps. Check &quot;Mission Complete&quot; when they return home.</CardDescription>
          </CardHeader>
          <CardContent>
            {servingMissionaries.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No missionaries currently serving. Missionaries move here automatically when all 20 preparation tasks are complete.</p>
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
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        onChange={() => markMissionComplete(m.id)}
                      />
                      <span className="text-sm text-gray-600">Mission Complete</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================== RETURNED TAB ==================== */}
      {tabView === "returned" && (
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
  )
}
