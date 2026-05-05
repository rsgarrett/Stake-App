"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Plus, ShieldCheck, AlertTriangle, Users, Clock } from "lucide-react"

interface WelfareCase {
  id: string
  case_number: string
  status: "open" | "closed" | "pending"
  case_notes: string
  created_by: string
  created_at: string
}

interface SelfRelianceParticipant {
  id: string
  participant_name: string
  course_name: string
  start_date?: string | null
  completion_date?: string | null
  status: "enrolled" | "completed" | "dropped"
}

export default function WelfarePage() {
  const [cases, setCases] = useState<WelfareCase[]>([])
  const [participants, setParticipants] = useState<SelfRelianceParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [tabView, setTabView] = useState<"cases" | "self-reliance">("cases")
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      // Auth disabled — default to stake_president view
      setUserRole("stake_president")

      const { data: caseData } = await safeQuery(supabase.from("welfare_cases").select("*").order("created_at", { ascending: false }))
      setCases(caseData || [])

      const { data: partData } = await safeQuery(supabase.from("self_reliance_participants").select("*").order("created_at", { ascending: false }))
      setParticipants(partData || [])
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const canViewCases = ["stake_president", "counselor", "clerk"].includes(userRole || "")
  const activeCases = cases.filter((c) => c.status === "open")
  const pendingCases = cases.filter((c) => c.status === "pending")
  const enrolledParticipants = participants.filter((p) => p.status === "enrolled")

  if (loading) return <div className="p-4 sm:p-6"><div className="text-center py-12">Loading...</div></div>

  if (!canViewCases) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welfare & Self-Reliance</h1>
          <p className="mt-2 text-gray-600">Self-reliance programs and course tracking</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Self-Reliance Participants</CardTitle></CardHeader>
          <CardContent>
            <Link href="/modules/welfare/self-reliance" className={buttonVariants()}><Users className="h-4 w-4 mr-2" />View Self-Reliance Programs</Link>
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="py-8 text-center text-gray-500">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            Welfare case management is restricted to stake presidency and clerk.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welfare & Self-Reliance</h1>
          <p className="mt-2 text-gray-600">Manage welfare cases and self-reliance programs</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/modules/welfare/self-reliance" className={buttonVariants({ variant: "outline" })}><Users className="h-4 w-4 mr-2" />Self-Reliance</Link>
          <Link href="/modules/welfare/new-case" className={buttonVariants()}><Plus className="h-4 w-4 mr-2" />New Case</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Active Cases</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-600">{activeCases.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Pending Review</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-600">{pendingCases.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Closed Cases</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{cases.filter((c) => c.status === "closed").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">SR Enrolled</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{enrolledParticipants.length}</div></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b mb-4">
        <button onClick={() => setTabView("cases")} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tabView === "cases" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"}`}>
          Cases ({cases.length})
        </button>
        <button onClick={() => setTabView("self-reliance")} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tabView === "self-reliance" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"}`}>
          Self-Reliance ({participants.length})
        </button>
      </div>

      {tabView === "cases" ? (
        <Card>
          <CardContent className="pt-6">
            {cases.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No welfare cases. All notes are encrypted for confidentiality.</p>
            ) : (
              <div className="space-y-2">
                {cases.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`w-3 h-3 rounded-full ${c.status === "open" ? "bg-amber-500" : c.status === "pending" ? "bg-blue-500" : "bg-green-500"}`} />
                      <div>
                        <div className="font-medium text-gray-900">Case #{c.case_number}</div>
                        <div className="text-xs text-gray-500 capitalize">{c.status} &middot; {new Date(c.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${c.status === "open" ? "bg-amber-100 text-amber-700" : c.status === "pending" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {participants.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No self-reliance participants yet</p>
            ) : (
              <div className="space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{p.participant_name}</div>
                      <div className="text-sm text-gray-500">{p.course_name}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${p.status === "enrolled" ? "bg-blue-100 text-blue-700" : p.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
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
