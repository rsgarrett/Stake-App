"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  Search, Plus, Edit, CheckCircle2, ArrowLeft,
  ChevronRight, ChevronLeft, AlertTriangle,
} from "lucide-react"

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
  assigned_to_extend: string | null
  set_apart_by: string | null
  sustained_date: string | null
  set_apart_date: string | null
  updated_in_lcr: boolean
  status: "active" | "released" | "pending"
  notes: string | null
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

export default function CallingTrackerPage() {
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
    const { error } = await supabase.from("callings").update(updates).eq("id", c.id)
    if (error) alert("Error: " + error.message)
    else await load()
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
    const { error } = await supabase.from("callings").update(updates).eq("id", c.id)
    if (error) alert("Error: " + error.message)
    else await load()
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
          <Link href="/modules/leadership" className="inline-flex items-center text-sm text-indigo-600 hover:underline mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />Back to Callings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Calling Tracker</h1>
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
        {STAGES.map((stage, si) => {
          const items = active.filter((c) => getStage(c) === si)
          return (
            <Card key={stage.key} className={`border ${stage.light}`}>
              {/* Colored header bar */}
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
                        {/* Revert */}
                        {si > 0 && (
                          <button onClick={() => revert(c)} className="text-gray-300 hover:text-gray-500 shrink-0" title="Move back">
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        )}
                        {si === 0 && <span className="w-4 shrink-0" />}

                        {/* Name & calling */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.person_name}</p>
                          <p className="text-xs text-gray-500 truncate">{c.calling_name}{c.ward ? ` · ${c.ward}` : ""}</p>
                        </div>

                        {/* Edit */}
                        <Link href={`/modules/leadership/edit/${c.id}`} className="text-gray-300 hover:text-indigo-600 shrink-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Link>

                        {/* Advance */}
                        {si < 5 && (
                          <button
                            onClick={() => advance(c)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 shrink-0 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-colors"
                          >
                            Advance<ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {si === 5 && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
