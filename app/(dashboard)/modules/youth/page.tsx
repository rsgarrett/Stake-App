"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Award, Calendar, Users, ArrowUp } from "lucide-react"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

interface YouthProgram {
  id: string
  program_name: string
  program_type: string
  start_date?: string | null
  end_date?: string | null
  status: "active" | "completed" | "planned"
}

interface Advancement {
  id: string
  youth_name: string
  advancement_type: "deacon" | "teacher" | "priest" | "elder"
  advancement_date: string
}

interface YouthActivity {
  id: string
  activity_name: string
  activity_date: string
  location?: string | null
}

type TabView = "programs" | "advancements" | "activities"

const ADVANCEMENT_ORDER = ["deacon", "teacher", "priest", "elder"]
const ADVANCEMENT_COLORS: Record<string, string> = {
  deacon: "bg-blue-100 text-blue-700",
  teacher: "bg-green-100 text-green-700",
  priest: "bg-purple-100 text-purple-700",
  elder: "bg-amber-100 text-amber-700",
}

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function YouthPage() {
  const [programs, setPrograms] = useState<YouthProgram[]>([])
  const [advancements, setAdvancements] = useState<Advancement[]>([])
  const [activities, setActivities] = useState<YouthActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [tabView, setTabView] = useState<TabView>("programs")

  // Forms
  const [showAdvForm, setShowAdvForm] = useState(false)
  const [advForm, setAdvForm] = useState({ youth_name: "", advancement_type: "deacon", advancement_date: "" })
  const [showActForm, setShowActForm] = useState(false)
  const [actForm, setActForm] = useState({ activity_name: "", activity_date: "", location: "" })

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [progRes, advRes, actRes] = await Promise.all([
        safeQuery(supabase.from("youth_programs").select("*").order("start_date", { ascending: false })),
        safeQuery(supabase.from("priesthood_advancements").select("*").order("advancement_date", { ascending: false })),
        safeQuery(supabase.from("youth_activities").select("*").order("activity_date", { ascending: false })),
      ])
      setPrograms(progRes.data || [])
      setAdvancements(advRes.data || [])
      setActivities(actRes.data || [])
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

  const addAdvancement = async () => {
    if (!advForm.youth_name || !advForm.advancement_date) return
    const stakeId = await getStakeId()
    await supabase.from("priesthood_advancements").insert({
      youth_name: advForm.youth_name,
      advancement_type: advForm.advancement_type,
      advancement_date: advForm.advancement_date,
      stake_id: stakeId,
    })
    setAdvForm({ youth_name: "", advancement_type: "deacon", advancement_date: "" })
    setShowAdvForm(false)
    await loadData()
  }

  const addActivity = async () => {
    if (!actForm.activity_name || !actForm.activity_date) return
    const stakeId = await getStakeId()
    await supabase.from("youth_activities").insert({
      activity_name: actForm.activity_name,
      activity_date: actForm.activity_date,
      location: actForm.location || null,
      stake_id: stakeId,
    })
    setActForm({ activity_name: "", activity_date: "", location: "" })
    setShowActForm(false)
    await loadData()
  }

  const activePrograms = programs.filter((p) => p.status === "active")

  if (loading) return <div className="p-4 sm:p-6"><div className="text-center py-12">Loading...</div></div>

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Youth Programs</h1>
          <p className="mt-2 text-gray-600">Programs, priesthood advancements, and youth activities</p>
        </div>
        <Link href="/modules/youth/new-program" className={buttonVariants()}><Plus className="h-4 w-4 mr-2" />New Program</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Active Programs</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{activePrograms.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Advancements</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-indigo-600">{advancements.length}</div></CardContent></Card>
        {ADVANCEMENT_ORDER.map((type) => {
          const count = advancements.filter((a) => a.advancement_type === type).length
          return count > 0 ? null : null // skip individual counters if empty
        })}
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Activities</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{activities.length}</div></CardContent></Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Advancement Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              {ADVANCEMENT_ORDER.map((type) => (
                <span key={type} className={`px-2 py-0.5 text-xs rounded-full ${ADVANCEMENT_COLORS[type]}`}>
                  {type}: {advancements.filter((a) => a.advancement_type === type).length}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b mb-4">
        {([
          { key: "programs" as const, label: `Programs (${programs.length})`, icon: Calendar },
          { key: "advancements" as const, label: `Advancements (${advancements.length})`, icon: ArrowUp },
          { key: "activities" as const, label: `Activities (${activities.length})`, icon: Users },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTabView(key)}
            className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tabView === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"}`}>
            <Icon className="h-4 w-4 mr-2" />{label}
          </button>
        ))}
      </div>

      {/* PROGRAMS */}
      {tabView === "programs" && (
        <Card><CardContent className="pt-6">
          {programs.length === 0 ? <p className="text-center text-gray-500 py-8">No youth programs. Create one to get started.</p> : (
            <div className="space-y-2">{programs.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{p.program_name}</div>
                  <div className="text-sm text-gray-500">{p.program_type}</div>
                  {p.start_date && <div className="text-xs text-gray-400">{new Date(p.start_date).toLocaleDateString()}{p.end_date && ` - ${new Date(p.end_date).toLocaleDateString()}`}</div>}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${p.status === "active" ? "bg-green-100 text-green-700" : p.status === "planned" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                  {p.status}
                </span>
              </div>
            ))}</div>
          )}
        </CardContent></Card>
      )}

      {/* ADVANCEMENTS */}
      {tabView === "advancements" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAdvForm(true)}><Plus className="h-4 w-4 mr-2" />Record Advancement</Button>
          </div>
          {showAdvForm && (
            <Card><CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Youth name *" value={advForm.youth_name} onChange={(e) => setAdvForm({ ...advForm, youth_name: e.target.value })} className={inputClass} />
                <select value={advForm.advancement_type} onChange={(e) => setAdvForm({ ...advForm, advancement_type: e.target.value })} className={inputClass}>
                  <option value="deacon">{englishMenuTitleCase("Deacon")}</option>
                  <option value="teacher">{englishMenuTitleCase("Teacher")}</option>
                  <option value="priest">{englishMenuTitleCase("Priest")}</option>
                  <option value="elder">{englishMenuTitleCase("Elder")}</option>
                </select>
                <input type="date" value={advForm.advancement_date} onChange={(e) => setAdvForm({ ...advForm, advancement_date: e.target.value })} className={inputClass} />
              </div>
              <div className="flex space-x-2 mt-3">
                <Button onClick={addAdvancement}>Save</Button>
                <Button variant="outline" onClick={() => setShowAdvForm(false)}>Cancel</Button>
              </div>
            </CardContent></Card>
          )}
          <Card><CardContent className="pt-6">
            {advancements.length === 0 ? <p className="text-center text-gray-500 py-8">No advancements recorded</p> : (
              <div className="space-y-2">{advancements.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Award className="h-5 w-5 text-indigo-500" />
                    <div>
                      <div className="font-medium text-gray-900">{a.youth_name}</div>
                      <div className="text-xs text-gray-500">{new Date(a.advancement_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${ADVANCEMENT_COLORS[a.advancement_type]}`}>
                    {a.advancement_type}
                  </span>
                </div>
              ))}</div>
            )}
          </CardContent></Card>
        </div>
      )}

      {/* ACTIVITIES */}
      {tabView === "activities" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowActForm(true)}><Plus className="h-4 w-4 mr-2" />Add Activity</Button>
          </div>
          {showActForm && (
            <Card><CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Activity name *" value={actForm.activity_name} onChange={(e) => setActForm({ ...actForm, activity_name: e.target.value })} className={inputClass} />
                <input type="date" value={actForm.activity_date} onChange={(e) => setActForm({ ...actForm, activity_date: e.target.value })} className={inputClass} />
                <input type="text" placeholder="Location" value={actForm.location} onChange={(e) => setActForm({ ...actForm, location: e.target.value })} className={inputClass} />
              </div>
              <div className="flex space-x-2 mt-3">
                <Button onClick={addActivity}>Save</Button>
                <Button variant="outline" onClick={() => setShowActForm(false)}>Cancel</Button>
              </div>
            </CardContent></Card>
          )}
          <Card><CardContent className="pt-6">
            {activities.length === 0 ? <p className="text-center text-gray-500 py-8">No activities recorded</p> : (
              <div className="space-y-2">{activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{a.activity_name}</div>
                    {a.location && <div className="text-sm text-gray-500">{a.location}</div>}
                    <div className="text-xs text-gray-400">{new Date(a.activity_date).toLocaleDateString()}</div>
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
