"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, CheckCircle2, Clock, Plus, AlertTriangle, Users } from "lucide-react"

interface TrainingModule {
  id: string
  title: string
  description?: string | null
  module_type: string
  content_url?: string | null
  created_at: string
}

interface Completion {
  id: string
  user_id: string
  module_id: string
  completed_date?: string | null
  status: "completed" | "in_progress"
  training_modules?: TrainingModule | null
}

interface PolicyUpdate {
  id: string
  title: string
  description: string
  effective_date: string
  category: string
  created_at: string
}

export default function TrainingPage() {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [policyUpdates, setPolicyUpdates] = useState<PolicyUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [addingModule, setAddingModule] = useState(false)
  const [newModule, setNewModule] = useState({ title: "", description: "", module_type: "required" })
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      // Auth disabled — load modules and policy updates
      const [modResult, polResult] = await Promise.all([
        safeQuery(supabase.from("training_modules").select("*").order("created_at", { ascending: false })),
        safeQuery(supabase.from("policy_updates").select("*").order("effective_date", { ascending: false }).limit(10)),
      ])
      setModules(modResult.data || [])
      setPolicyUpdates(polResult.data || [])
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const addModule = async () => {
    if (!newModule.title) return
    const { error } = await supabase.from("training_modules").insert(newModule)
    if (error) { alert("Error: " + error.message); return }
    setNewModule({ title: "", description: "", module_type: "required" })
    setAddingModule(false)
    await loadData()
  }

  const toggleCompletion = async (moduleId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const existing = completions.find((c) => c.module_id === moduleId)
    if (existing) {
      const newStatus = existing.status === "completed" ? "in_progress" : "completed"
      await supabase.from("training_completions").update({
        status: newStatus,
        completed_date: newStatus === "completed" ? new Date().toISOString() : null,
      }).eq("id", existing.id)
    } else {
      await supabase.from("training_completions").insert({
        user_id: user.id,
        module_id: moduleId,
        status: "completed",
        completed_date: new Date().toISOString(),
      })
    }
    await loadData()
  }

  const getCompletionStatus = (moduleId: string) => completions.find((c) => c.module_id === moduleId)

  const completedCount = completions.filter((c) => c.status === "completed").length
  const requiredModules = modules.filter((m) => m.module_type === "required")
  const completedRequired = requiredModules.filter((m) => getCompletionStatus(m.id)?.status === "completed").length

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

  if (loading) return <div className="p-6"><div className="text-center py-12">Loading...</div></div>

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training & Resources</h1>
          <p className="mt-2 text-gray-600">Training modules, handbook resources, and policy updates</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/modules/training/handbook" className={buttonVariants({ variant: "outline" })}><BookOpen className="h-4 w-4 mr-2" />Handbook</Link>
          <Link href="/modules/training/compliance" className={buttonVariants({ variant: "outline" })}><Users className="h-4 w-4 mr-2" />Compliance Dashboard</Link>
          <Button onClick={() => setAddingModule(true)}><Plus className="h-4 w-4 mr-2" />Add Module</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Modules</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{modules.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">My Completed</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{completedCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Required Compliance</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedRequired}/{requiredModules.length}</div>
            {completedRequired < requiredModules.length && <p className="text-xs text-amber-600 mt-1 flex items-center"><AlertTriangle className="h-3 w-3 mr-1" />Incomplete</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Policy Updates</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{policyUpdates.length}</div></CardContent>
        </Card>
      </div>

      {/* Add Module Form */}
      {addingModule && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Add Training Module</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <input type="text" placeholder="Module title *" value={newModule.title} onChange={(e) => setNewModule({ ...newModule, title: e.target.value })} className={inputClass} />
              <textarea rows={2} placeholder="Description" value={newModule.description} onChange={(e) => setNewModule({ ...newModule, description: e.target.value })} className={inputClass} />
              <select value={newModule.module_type} onChange={(e) => setNewModule({ ...newModule, module_type: e.target.value })} className={inputClass}>
                <option value="required">Required</option>
                <option value="recommended">Recommended</option>
                <option value="optional">Optional</option>
              </select>
              <div className="flex space-x-2">
                <Button onClick={addModule} disabled={!newModule.title}>Add Module</Button>
                <Button variant="outline" onClick={() => setAddingModule(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Training Modules */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Training Modules</CardTitle>
              <CardDescription>Click to toggle your completion status</CardDescription>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No training modules yet. Add one to get started.</p>
              ) : (
                <div className="space-y-2">
                  {modules.map((mod) => {
                    const completion = getCompletionStatus(mod.id)
                    const isComplete = completion?.status === "completed"
                    return (
                      <div key={mod.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${isComplete ? "border-green-200 bg-green-50" : "border-gray-200"}`}
                        onClick={() => toggleCompletion(mod.id)}>
                        <div className="flex items-center space-x-3">
                          {isComplete ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-gray-400" />}
                          <div>
                            <div className="font-medium text-gray-900">{mod.title}</div>
                            {mod.description && <p className="text-sm text-gray-500">{mod.description}</p>}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${mod.module_type === "required" ? "bg-red-100 text-red-700" : mod.module_type === "recommended" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                              {mod.module_type}
                            </span>
                          </div>
                        </div>
                        {isComplete && completion?.completed_date && (
                          <span className="text-xs text-green-600">{new Date(completion.completed_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Policy Updates */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Policy Updates</CardTitle>
              <CardDescription>Recent changes and announcements</CardDescription>
            </CardHeader>
            <CardContent>
              {policyUpdates.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No policy updates</p>
              ) : (
                <div className="space-y-3">
                  {policyUpdates.map((update) => (
                    <div key={update.id} className="border-b pb-3">
                      <div className="font-medium text-sm">{update.title}</div>
                      <p className="text-xs text-gray-500 mt-1">{update.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400 capitalize">{update.category}</span>
                        <span className="text-xs text-gray-400">{new Date(update.effective_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
