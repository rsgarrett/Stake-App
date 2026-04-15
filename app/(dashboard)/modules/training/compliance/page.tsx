"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

interface TrainingModule {
  id: string
  title: string
  module_type: string
}

interface UserWithCompletions {
  id: string
  email: string
  full_name?: string | null
  role?: string | null
  completions: { module_id: string; status: string }[]
}

export default function ComplianceDashboard() {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [users, setUsers] = useState<UserWithCompletions[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [modResult, usersResult, compResult] = await Promise.all([
        supabase.from("training_modules").select("id, title, module_type").eq("module_type", "required").order("title"),
        supabase.from("users").select("id, email, full_name, role").order("full_name"),
        supabase.from("training_completions").select("user_id, module_id, status"),
      ])

      const mods = modResult.data || []
      const allUsers = usersResult.data || []
      const completions = compResult.data || []

      const usersWithComps = allUsers.map((u) => ({
        ...u,
        completions: completions.filter((c) => c.user_id === u.id),
      }))

      setModules(mods)
      setUsers(usersWithComps)
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const isComplete = (userId: string, moduleId: string) => {
    const user = users.find((u) => u.id === userId)
    return user?.completions.some((c) => c.module_id === moduleId && c.status === "completed") || false
  }

  const getComplianceRate = () => {
    if (users.length === 0 || modules.length === 0) return 0
    const totalSlots = users.length * modules.length
    const completed = users.reduce((sum, u) => sum + u.completions.filter((c) => c.status === "completed" && modules.some((m) => m.id === c.module_id)).length, 0)
    return Math.round((completed / totalSlots) * 100)
  }

  if (loading) return <div className="p-6"><div className="text-center py-12">Loading...</div></div>

  const complianceRate = getComplianceRate()

  return (
    <div className="p-6">
      <Link href="/modules/training" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Training
      </Link>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Training Compliance Dashboard</h1>
        <p className="mt-2 text-gray-600">Track required training completion across all leaders</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Overall Compliance</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${complianceRate >= 80 ? "text-green-600" : complianceRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
              {complianceRate}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className={`h-2 rounded-full ${complianceRate >= 80 ? "bg-green-500" : complianceRate >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${complianceRate}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Required Modules</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{modules.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Leaders</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{users.length}</div></CardContent>
        </Card>
      </div>

      {/* Compliance Matrix */}
      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No required training modules found. Mark modules as "required" in the training page to track compliance.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Leader Compliance Matrix</CardTitle>
            <CardDescription>Green = completed, Red = incomplete</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Leader</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Role</th>
                    {modules.map((m) => (
                      <th key={m.id} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase max-w-[120px] truncate" title={m.title}>
                        {m.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    const userCompleted = modules.filter((m) => isComplete(user.id, m.id)).length
                    const allComplete = userCompleted === modules.length
                    return (
                      <tr key={user.id} className={allComplete ? "bg-green-50" : ""}>
                        <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-inherit">{user.full_name || user.email}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs capitalize">{user.role?.replace(/_/g, " ") || "-"}</td>
                        {modules.map((m) => (
                          <td key={m.id} className="px-3 py-2 text-center">
                            {isComplete(user.id, m.id) ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
