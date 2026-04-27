"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Building, BookOpen, Users, Calendar } from "lucide-react"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

interface TempleAttendance {
  id: string
  event_date: string
  attendance_count: number
  event_type: string
  created_at: string
}

interface FamilyHistoryActivity {
  id: string
  activity_type: string
  description?: string | null
  date: string
  created_at: string
}

interface TempleAssignment {
  id: string
  assignment_date: string
  assignment_type: string
  assigned_to?: string | null
  created_at: string
}

type TabView = "attendance" | "familyhistory" | "assignments"

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function TemplePage() {
  const [attendance, setAttendance] = useState<TempleAttendance[]>([])
  const [activities, setActivities] = useState<FamilyHistoryActivity[]>([])
  const [assignments, setAssignments] = useState<TempleAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [tabView, setTabView] = useState<TabView>("attendance")

  // Forms
  const [showAttForm, setShowAttForm] = useState(false)
  const [attForm, setAttForm] = useState({ event_date: "", attendance_count: "", event_type: "Stake Temple Trip" })
  const [showActForm, setShowActForm] = useState(false)
  const [actForm, setActForm] = useState({ activity_type: "Indexing Event", description: "", date: "" })
  const [showAssForm, setShowAssForm] = useState(false)
  const [assForm, setAssForm] = useState({ assignment_type: "Temple Worker", assigned_to: "", assignment_date: "" })

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [attRes, actRes, assRes] = await Promise.all([
        safeQuery(supabase.from("temple_attendance").select("*").order("event_date", { ascending: false })),
        safeQuery(supabase.from("family_history_activities").select("*").order("date", { ascending: false })),
        safeQuery(supabase.from("temple_assignments").select("*").order("assignment_date", { ascending: false })),
      ])
      setAttendance(attRes.data || [])
      setActivities(actRes.data || [])
      setAssignments(assRes.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const getStakeId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from("users").select("stake_id").eq("id", user.id).single()
    if (data?.stake_id) return data.stake_id
    const { data: s } = await supabase.from("stakes").select("id").limit(1).single()
    return s?.id || null
  }

  const addAttendance = async () => {
    if (!attForm.event_date || !attForm.attendance_count) return
    const stakeId = await getStakeId()
    await supabase.from("temple_attendance").insert({
      event_date: attForm.event_date,
      attendance_count: parseInt(attForm.attendance_count),
      event_type: attForm.event_type,
      stake_id: stakeId,
    })
    setAttForm({ event_date: "", attendance_count: "", event_type: "Stake Temple Trip" })
    setShowAttForm(false)
    await loadData()
  }

  const addActivity = async () => {
    if (!actForm.date) return
    const stakeId = await getStakeId()
    await supabase.from("family_history_activities").insert({
      activity_type: actForm.activity_type,
      description: actForm.description || null,
      date: actForm.date,
      stake_id: stakeId,
    })
    setActForm({ activity_type: "Indexing Event", description: "", date: "" })
    setShowActForm(false)
    await loadData()
  }

  const addAssignment = async () => {
    if (!assForm.assignment_date) return
    const stakeId = await getStakeId()
    await supabase.from("temple_assignments").insert({
      assignment_type: assForm.assignment_type,
      assigned_to: assForm.assigned_to || null,
      assignment_date: assForm.assignment_date,
      stake_id: stakeId,
    })
    setAssForm({ assignment_type: "Temple Worker", assigned_to: "", assignment_date: "" })
    setShowAssForm(false)
    await loadData()
  }

  const totalAttendees = attendance.reduce((sum, a) => sum + a.attendance_count, 0)

  if (loading) return <div className="p-6"><div className="text-center py-12">Loading...</div></div>

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Temple & Family History</h1>
          <p className="mt-2 text-gray-600">Track temple attendance, family history activities, and assignments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Temple Events</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{attendance.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Attendees</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-indigo-600">{totalAttendees}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">FH Activities</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{activities.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Assignments</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{assignments.length}</div></CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b mb-4">
        {([
          { key: "attendance" as const, label: "Attendance", icon: Building },
          { key: "familyhistory" as const, label: "Family History", icon: BookOpen },
          { key: "assignments" as const, label: "Assignments", icon: Users },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTabView(key)}
            className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tabView === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"}`}>
            <Icon className="h-4 w-4 mr-2" />{label}
          </button>
        ))}
      </div>

      {/* ATTENDANCE TAB */}
      {tabView === "attendance" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAttForm(true)}><Plus className="h-4 w-4 mr-2" />Log Attendance</Button>
          </div>
          {showAttForm && (
            <Card><CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="date" value={attForm.event_date} onChange={(e) => setAttForm({ ...attForm, event_date: e.target.value })} className={inputClass} />
                <input type="number" placeholder="Attendance count" value={attForm.attendance_count} onChange={(e) => setAttForm({ ...attForm, attendance_count: e.target.value })} className={inputClass} min="1" />
                <select value={attForm.event_type} onChange={(e) => setAttForm({ ...attForm, event_type: e.target.value })} className={inputClass}>
                  <option value="Stake Temple Trip">{englishMenuTitleCase("Stake temple trip")}</option>
                  <option value="Ward Temple Trip">{englishMenuTitleCase("Ward temple trip")}</option>
                  <option value="Youth Temple Trip">{englishMenuTitleCase("Youth temple trip")}</option>
                  <option value="Temple Day">{englishMenuTitleCase("Temple day")}</option>
                  <option value="Other">{englishMenuTitleCase("Other")}</option>
                </select>
              </div>
              <div className="flex space-x-2 mt-3">
                <Button onClick={addAttendance}>Save</Button>
                <Button variant="outline" onClick={() => setShowAttForm(false)}>Cancel</Button>
              </div>
            </CardContent></Card>
          )}
          <Card><CardContent className="pt-6">
            {attendance.length === 0 ? <p className="text-center text-gray-500 py-8">No attendance records</p> : (
              <div className="space-y-2">{attendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{a.event_type}</div>
                    <div className="text-xs text-gray-500">{new Date(a.event_date).toLocaleDateString()}</div>
                  </div>
                  <span className="text-lg font-bold text-indigo-600">{a.attendance_count}</span>
                </div>
              ))}</div>
            )}
          </CardContent></Card>
        </div>
      )}

      {/* FAMILY HISTORY TAB */}
      {tabView === "familyhistory" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowActForm(true)}><Plus className="h-4 w-4 mr-2" />Add Activity</Button>
          </div>
          {showActForm && (
            <Card><CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={actForm.activity_type} onChange={(e) => setActForm({ ...actForm, activity_type: e.target.value })} className={inputClass}>
                  <option value="Indexing Event">{englishMenuTitleCase("Indexing event")}</option>
                  <option value="Family History Class">{englishMenuTitleCase("Family history class")}</option>
                  <option value="Temple Name Preparation">{englishMenuTitleCase("Temple name preparation")}</option>
                  <option value="Family History Fair">{englishMenuTitleCase("Family history fair")}</option>
                  <option value="Other">{englishMenuTitleCase("Other")}</option>
                </select>
                <input type="date" value={actForm.date} onChange={(e) => setActForm({ ...actForm, date: e.target.value })} className={inputClass} />
                <input type="text" placeholder="Description" value={actForm.description} onChange={(e) => setActForm({ ...actForm, description: e.target.value })} className={inputClass} />
              </div>
              <div className="flex space-x-2 mt-3">
                <Button onClick={addActivity}>Save</Button>
                <Button variant="outline" onClick={() => setShowActForm(false)}>Cancel</Button>
              </div>
            </CardContent></Card>
          )}
          <Card><CardContent className="pt-6">
            {activities.length === 0 ? <p className="text-center text-gray-500 py-8">No family history activities recorded</p> : (
              <div className="space-y-2">{activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{a.activity_type}</div>
                    {a.description && <div className="text-sm text-gray-500">{a.description}</div>}
                    <div className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}</div>
            )}
          </CardContent></Card>
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {tabView === "assignments" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAssForm(true)}><Plus className="h-4 w-4 mr-2" />Add Assignment</Button>
          </div>
          {showAssForm && (
            <Card><CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={assForm.assignment_type} onChange={(e) => setAssForm({ ...assForm, assignment_type: e.target.value })} className={inputClass}>
                  <option value="Temple Worker">{englishMenuTitleCase("Temple worker")}</option>
                  <option value="Ordinance Worker">{englishMenuTitleCase("Ordinance worker")}</option>
                  <option value="Veil Worker">{englishMenuTitleCase("Veil worker")}</option>
                  <option value="Temple Volunteer">{englishMenuTitleCase("Temple volunteer")}</option>
                  <option value="Other">{englishMenuTitleCase("Other")}</option>
                </select>
                <input type="text" placeholder="Assigned to" value={assForm.assigned_to} onChange={(e) => setAssForm({ ...assForm, assigned_to: e.target.value })} className={inputClass} />
                <input type="date" value={assForm.assignment_date} onChange={(e) => setAssForm({ ...assForm, assignment_date: e.target.value })} className={inputClass} />
              </div>
              <div className="flex space-x-2 mt-3">
                <Button onClick={addAssignment}>Save</Button>
                <Button variant="outline" onClick={() => setShowAssForm(false)}>Cancel</Button>
              </div>
            </CardContent></Card>
          )}
          <Card><CardContent className="pt-6">
            {assignments.length === 0 ? <p className="text-center text-gray-500 py-8">No assignments recorded</p> : (
              <div className="space-y-2">{assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{a.assignment_type}</div>
                    {a.assigned_to && <div className="text-sm text-gray-500">{a.assigned_to}</div>}
                    <div className="text-xs text-gray-400">{new Date(a.assignment_date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}</div>
            )}
          </CardContent></Card>
        </div>
      )}
    </div>
  )
}
