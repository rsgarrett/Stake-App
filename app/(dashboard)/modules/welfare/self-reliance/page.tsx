"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Plus, CheckCircle2, Clock, XCircle } from "lucide-react"

interface Participant {
  id: string
  participant_name: string
  course_name: string
  start_date?: string | null
  completion_date?: string | null
  status: "enrolled" | "completed" | "dropped"
  created_at: string
}

const COURSES = [
  "Personal Finances",
  "Starting and Growing My Business",
  "Find a Better Job",
  "Education for Better Work",
  "Emotional Resilience",
]

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function SelfReliancePage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ participant_name: "", course_name: COURSES[0], start_date: "" })
  const [courseFilter, setCourseFilter] = useState("all")
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data } = await supabase.from("self_reliance_participants").select("*").order("created_at", { ascending: false })
      setParticipants(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const addParticipant = async () => {
    if (!formData.participant_name) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userData } = user ? await supabase.from("users").select("stake_id").eq("id", user!.id).single() : { data: null }
    let stakeId = userData?.stake_id
    if (!stakeId) {
      const { data: stake } = await supabase.from("stakes").select("id").limit(1).single()
      stakeId = stake?.id
    }

    const { error } = await supabase.from("self_reliance_participants").insert({
      participant_name: formData.participant_name,
      course_name: formData.course_name,
      start_date: formData.start_date || null,
      status: "enrolled",
      stake_id: stakeId,
    })
    if (error) { alert("Error: " + error.message); return }
    setFormData({ participant_name: "", course_name: COURSES[0], start_date: "" })
    setShowForm(false)
    await loadData()
  }

  const updateStatus = async (id: string, newStatus: "completed" | "dropped") => {
    const updateData: any = { status: newStatus }
    if (newStatus === "completed") updateData.completion_date = new Date().toISOString()
    await supabase.from("self_reliance_participants").update(updateData).eq("id", id)
    await loadData()
  }

  const filtered = courseFilter === "all" ? participants : participants.filter((p) => p.course_name === courseFilter)
  const uniqueCourses = Array.from(new Set(participants.map((p) => p.course_name))).sort()

  if (loading) return <div className="p-6"><div className="text-center py-12">Loading...</div></div>

  return (
    <div className="p-6">
      <Link href="/modules/welfare" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Welfare
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Self-Reliance Programs</h1>
          <p className="mt-2 text-gray-600">Track participants in self-reliance courses</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Add Participant</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Enrolled</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-600">{participants.filter((p) => p.status === "enrolled").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Completed</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{participants.filter((p) => p.status === "completed").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Courses Active</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{uniqueCourses.length}</div></CardContent></Card>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Add Participant</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" placeholder="Participant name *" value={formData.participant_name} onChange={(e) => setFormData({ ...formData, participant_name: e.target.value })} className={inputClass} />
              <select value={formData.course_name} onChange={(e) => setFormData({ ...formData, course_name: e.target.value })} className={inputClass}>
                {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className={inputClass} />
            </div>
            <div className="flex space-x-2 mt-3">
              <Button onClick={addParticipant} disabled={!formData.participant_name}>Add</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Courses</option>
          {uniqueCourses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Participant List */}
      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No participants found</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {p.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : p.status === "enrolled" ? <Clock className="h-4 w-4 text-blue-500" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                    <div>
                      <div className="font-medium text-gray-900">{p.participant_name}</div>
                      <div className="text-sm text-gray-500">{p.course_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {p.status === "enrolled" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "completed")} className="text-green-600">Complete</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "dropped")} className="text-gray-500">Drop</Button>
                      </>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${p.status === "enrolled" ? "bg-blue-100 text-blue-700" : p.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
