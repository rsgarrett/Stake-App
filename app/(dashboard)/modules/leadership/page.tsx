"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Plus, Edit, CheckCircle2, ChevronRight, ChevronLeft, Search, Trash2 } from "lucide-react"

interface Calling {
  id: string
  type: "Calling" | "Release" | "Assignment" | "MP" | null
  person_name: string
  ward: string | null
  calling_name: string
  organization: string | null
  bishop_approval: boolean
  presidency_approval: boolean
  high_council_approval: boolean
  calling_extended: boolean
  previous_release_verified: boolean
  replaces_person_name: string | null
  sustained_date: string | null
  set_apart_date: string | null
  updated_in_lcr: boolean
  status: "active" | "released" | "pending"
  created_at: string
}

const STAGES = [
  { key: "sp", label: "SP Consideration", color: "bg-blue-500", light: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-700" },
  { key: "bishop", label: "Bishop Approval", color: "bg-purple-500", light: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-700" },
  { key: "hc", label: "HC Sustained", color: "bg-indigo-500", light: "bg-indigo-50 border-indigo-200", badge: "bg-indigo-100 text-indigo-700" },
  { key: "ward", label: "Ward Sustained", color: "bg-teal-500", light: "bg-teal-50 border-teal-200", badge: "bg-teal-100 text-teal-700" },
  { key: "setapart", label: "Set Apart", color: "bg-amber-500", light: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-700" },
  { key: "done", label: "Completed", color: "bg-green-500", light: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-700" },
]

function getStage(c: Calling): number {
  if (c.set_apart_date) return 5
  if (c.sustained_date) return 4
  if (c.high_council_approval) return 3
  if (c.bishop_approval) return 2
  if (c.presidency_approval) return 1
  return 0
}

export default function LeadershipPage() {
  const [callings, setCallings] = useState<Calling[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await safeQuery(
      supabase.from("callings").select("*").order("created_at", { ascending: false })
    )
    setCallings(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateCalling = async (id: string, updates: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from("callings")
      .update(updates)
      .eq("id", id)
      .select()
    if (error) {
      alert("Error: " + error.message)
      return false
    }
    if (!data || data.length === 0) {
      alert("Update blocked — you may not have permission, or the calling's stake doesn't match your account. Try signing out and back in.")
      return false
    }
    await load()
    return true
  }

  const advance = async (c: Calling) => {
    const s = getStage(c)
    if (s >= 5) return
    const today = new Date().toISOString().split("T")[0]
    const updates: Record<string, unknown> = [
      { presidency_approval: true },
      { bishop_approval: true },
      { high_council_approval: true, previous_release_verified: true },
      { sustained_date: today },
      { set_apart_date: today, status: "active" },
    ][s]
    const success = await updateCalling(c.id, updates)

    if (success && s === 4) {
      try {
        const res = await fetch("/api/callings/sync-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callingId: c.id }),
        })
        const result = await res.json()
        if (result.results && result.results.length > 0) {
          alert("Permissions updated:\n\n" + result.results.join("\n"))
        }
      } catch {
        // Permission sync is best-effort; don't block the advance
      }
    }
  }

  const revert = async (c: Calling) => {
    const s = getStage(c)
    if (s === 0) return
    const updates: Record<string, unknown> = [
      {},
      { presidency_approval: false },
      { bishop_approval: false },
      { high_council_approval: false },
      { sustained_date: null },
      { set_apart_date: null, status: "pending" },
    ][s]
    await updateCalling(c.id, updates)
  }

  const deleteCalling = async (c: Calling) => {
    if (!confirm(`Remove ${c.person_name} — ${c.calling_name}?`)) return
    const { data, error } = await supabase.from("callings").delete().eq("id", c.id).select()
    if (error) {
      alert("Error: " + error.message)
      return
    }
    if (!data || data.length === 0) {
      alert("Delete blocked — you may not have permission.")
      return
    }
    await load()
  }

  const active = callings.filter((c) => {
    if (c.status === "released") return false
    if (!searchTerm) return true
    const t = searchTerm.toLowerCase()
    return c.person_name.toLowerCase().includes(t) || c.calling_name.toLowerCase().includes(t) || (c.ward || "").toLowerCase().includes(t)
  })

  if (loading) return <div className="p-6 text-center py-12 text-gray-500">Loading...</div>

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calling Tracker</h1>
          <p className="mt-1 text-gray-600">Manage callings through each stage of the process</p>
        </div>
        <Link href="/modules/leadership/recommend" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />Submit Name
        </Link>
      </div>

      <div className="mb-5 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {STAGES.filter((_, si) => si < 5).map((stage, si) => {
          const items = active.filter((c) => getStage(c) === si)
          return (
            <Card key={stage.key} className={`border ${stage.light}`}>
              <div className={`${stage.color} h-1.5 rounded-t-lg`} />
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  {stage.label}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.badge}`}>{items.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {items.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">None</p>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {items.map((c) => (
                      <div key={c.id} className="py-2 flex items-center gap-2">
                        {si > 0 ? (
                          <button onClick={() => revert(c)} className="text-gray-300 hover:text-gray-500 shrink-0" title="Move back">
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="w-4 shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.person_name}</p>
                          <p className="text-xs text-gray-500 truncate">{c.calling_name}{c.ward ? ` · ${c.ward}` : ""}</p>
                          {c.replaces_person_name && (
                            <p className="text-xs text-orange-500 truncate">Replaces {c.replaces_person_name}</p>
                          )}
                        </div>

                        <Link href={`/modules/leadership/edit/${c.id}`} className="text-gray-300 hover:text-indigo-600 shrink-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Link>

                        <button onClick={() => deleteCalling(c)} className="text-gray-300 hover:text-red-500 shrink-0" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => advance(c)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 shrink-0 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-colors"
                        >
                          Advance<ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {(() => {
          const completedCount = active.filter((c) => getStage(c) === 5).length
          const doneStage = STAGES[5]
          return (
            <Link href="/modules/leadership/completed">
              <Card className={`border ${doneStage.light} hover:shadow-md transition-shadow cursor-pointer`}>
                <div className={`${doneStage.color} h-1.5 rounded-t-lg`} />
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    {doneStage.label}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${doneStage.badge}`}>{completedCount}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-center py-4 text-sm text-green-600 gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{completedCount} completed</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })()}
      </div>
    </div>
  )
}
