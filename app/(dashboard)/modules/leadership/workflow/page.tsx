"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  ArrowRight,
  Filter,
  UserPlus,
  Users,
  ShieldCheck,
  Vote,
  Hand,
  Sparkles,
  Clock,
  Edit,
} from "lucide-react"

interface Calling {
  id: string
  type: string | null
  person_name: string
  ward: string | null
  calling_name: string
  organization: string | null
  bishop_approval: boolean
  bishop_approval_date: string | null
  presidency_approval: boolean
  presidency_approval_date: string | null
  high_council_approval: boolean
  high_council_approval_date: string | null
  calling_extended: boolean
  previous_release_verified: boolean
  ward_sustained: boolean
  sustained_date: string | null
  set_apart_date: string | null
  assigned_to_extend: string | null
  set_apart_by: string | null
  notes: string | null
  created_at: string
  status: string
}

const WORKFLOW_STEPS = [
  { key: "submitted", label: "Name Submitted", icon: UserPlus },
  { key: "sp_consideration", label: "SP Considered", icon: Users },
  { key: "bishop_approval", label: "Bishop Approved", icon: ShieldCheck },
  { key: "hc_sustained", label: "HC Sustained", icon: Vote },
  { key: "ward_sustained", label: "Ward Sustained", icon: Hand },
  { key: "set_apart", label: "Set Apart", icon: Sparkles },
]

function getStepIndex(c: Calling): number {
  if (c.set_apart_date) return 6
  if (c.sustained_date) return 5
  if (c.high_council_approval) return 4
  if (c.bishop_approval) return 3
  if (c.presidency_approval) return 2
  return 1
}

function getStepLabel(index: number): string {
  if (index >= 6) return "Completed"
  return WORKFLOW_STEPS[index]?.label || "Unknown"
}

export default function CallingWorkflowPage() {
  const [callings, setCallings] = useState<Calling[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data } = await safeQuery(
      supabase.from("callings").select("*").order("created_at", { ascending: false })
    )
    setCallings(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [])

  const advanceStep = async (calling: Calling) => {
    const step = getStepIndex(calling)

    if (step === 4 && !calling.previous_release_verified) {
      alert("Cannot advance to Ward Sustained — the previous release has not been verified.\n\nCheck \"Release Verified\" in the calling details first.")
      return
    }

    const today = new Date().toISOString().split("T")[0]
    let updates: Record<string, any> = {}

    switch (step) {
      case 1: updates = { presidency_approval: true }; break
      case 2: updates = { bishop_approval: true }; break
      case 3: updates = { high_council_approval: true }; break
      case 4: updates = { sustained_date: today }; break
      case 5: updates = { set_apart_date: today, status: "active" }; break
      default: return
    }

    try {
      const { error: updateError } = await supabase.from("callings").update(updates).eq("id", calling.id)
      if (updateError) throw updateError

      await supabase.from("calling_workflow_log").insert({
        calling_id: calling.id,
        action: `step_${step}_completed`,
        new_status: getStepLabel(step + 1),
      }).then(({ error: logErr }) => {
        if (logErr) console.warn("Log error (non-critical):", logErr)
      })

      await loadData()
    } catch (err: any) {
      console.error("Advance error:", err)
      alert("Failed to advance: " + (err.message || "Unknown error"))
    }
  }

  const revertStep = async (calling: Calling) => {
    const step = getStepIndex(calling)
    let updates: Record<string, any> = {}

    switch (step) {
      case 2: updates = { presidency_approval: false }; break
      case 3: updates = { bishop_approval: false }; break
      case 4: updates = { high_council_approval: false }; break
      case 5: updates = { sustained_date: null }; break
      case 6: updates = { set_apart_date: null, status: "pending" }; break
      default: return
    }

    try {
      const { error: updateError } = await supabase.from("callings").update(updates).eq("id", calling.id)
      if (updateError) throw updateError
      await loadData()
    } catch (err: any) {
      alert("Failed to revert: " + (err.message || "Unknown error"))
    }
  }

  const getFilteredCallings = () => {
    let list = callings.filter((c) => c.status !== "released")
    if (filter === "active") return list.filter((c) => getStepIndex(c) < 6)
    if (filter === "completed") return list.filter((c) => getStepIndex(c) >= 6)
    if (filter === "sp_consideration") return list.filter((c) => getStepIndex(c) === 1)
    if (filter === "bishop_approval") return list.filter((c) => getStepIndex(c) === 2)
    if (filter === "hc_sustained") return list.filter((c) => getStepIndex(c) === 3)
    if (filter === "ward_sustained") return list.filter((c) => getStepIndex(c) === 4)
    if (filter === "set_apart") return list.filter((c) => getStepIndex(c) === 5)
    return list
  }

  const filtered = getFilteredCallings()

  if (loading) {
    return <div className="p-6 text-center py-12 text-gray-500">Loading workflow...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/modules/leadership" className="inline-flex items-center text-sm text-indigo-600 hover:underline mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />Back to Callings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Calling Workflow</h1>
          <p className="mt-1 text-gray-600">Step-by-step progression for each calling</p>
        </div>
      </div>

      {/* Stage Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {WORKFLOW_STEPS.map((step, i) => {
          const count = callings.filter((c) => getStepIndex(c) === i + 1).length
          return (
            <button
              key={step.key}
              onClick={() => setFilter(filter === step.key ? "all" : step.key)}
              className={`p-3 rounded-lg border text-center transition-all ${
                filter === step.key ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <step.icon className="h-5 w-5 mx-auto mb-1 text-gray-600" />
              <div className="text-lg font-bold">{count}</div>
              <div className="text-[10px] text-gray-500 leading-tight">{step.label}</div>
            </button>
          )
        })}
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center space-x-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Callings ({callings.length})</option>
          <option value="active">In Progress ({callings.filter((c) => getStepIndex(c) < 6).length})</option>
          <option value="completed">Completed ({callings.filter((c) => getStepIndex(c) >= 6).length})</option>
          <option value="sp_consideration">SP Consideration</option>
          <option value="bishop_approval">Bishop Approval</option>
          <option value="hc_sustained">HC Sustained</option>
          <option value="ward_sustained">Ward Sustained</option>
          <option value="set_apart">Set Apart</option>
        </select>
      </div>

      {/* Callings List with Step Progress */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-gray-500">No callings match this filter</CardContent></Card>
        ) : (
          filtered.map((calling) => {
            const currentStep = getStepIndex(calling)
            const isExpanded = expandedId === calling.id
            return (
              <Card key={calling.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : calling.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900">{calling.person_name}</span>
                      {calling.type && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{calling.type}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{calling.calling_name}</div>
                    <div className="text-xs text-gray-400">
                      {calling.ward && <span>{calling.ward}</span>}
                      {calling.ward && calling.organization && <span> &middot; </span>}
                      {calling.organization && <span>{calling.organization}</span>}
                    </div>
                  </div>

                  {/* Mini progress dots */}
                  <div className="flex items-center space-x-1 mr-4">
                    {WORKFLOW_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-2.5 w-2.5 rounded-full ${
                          i + 1 <= currentStep ? "bg-green-500" :
                          i + 1 === currentStep + 1 ? "bg-yellow-400" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      currentStep >= 6 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {currentStep >= 6 ? "Completed" : getStepLabel(currentStep)}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-4 bg-gray-50">
                    {/* Full stepper */}
                    <div className="flex items-center justify-between mb-6">
                      {WORKFLOW_STEPS.map((step, i) => {
                        const done = i + 1 <= currentStep
                        const active = i + 1 === currentStep + 1
                        return (
                          <div key={step.key} className="flex flex-col items-center flex-1">
                            <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 mb-1 ${
                              done ? "border-green-500 bg-green-500 text-white" :
                              active ? "border-yellow-400 bg-yellow-50 text-yellow-600" :
                              "border-gray-200 bg-white text-gray-300"
                            }`}>
                              {done ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                            </div>
                            <span className={`text-[10px] text-center leading-tight ${done ? "text-green-700 font-medium" : active ? "text-yellow-700 font-medium" : "text-gray-400"}`}>
                              {step.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {currentStep > 1 && currentStep <= 6 && (
                          <Button size="sm" variant="outline" onClick={() => revertStep(calling)}>
                            <ArrowLeft className="h-3 w-3 mr-1" />Revert Step
                          </Button>
                        )}
                        {currentStep < 6 && (
                          <Button size="sm" onClick={() => advanceStep(calling)}>
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {currentStep === 5 ? "Mark Set Apart" : "Advance to Next Step"}
                          </Button>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/modules/leadership/edit/${calling.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                          <Edit className="h-3 w-3 mr-1" />Edit Details
                        </Link>
                      </div>
                    </div>

                    {/* Dates & details */}
                    {(calling.presidency_approval_date || calling.bishop_approval_date || calling.high_council_approval_date || calling.sustained_date || calling.set_apart_date || calling.assigned_to_extend || calling.notes) && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {calling.presidency_approval_date && (
                          <div className="bg-white rounded p-2 border">
                            <span className="text-gray-500">SP Considered:</span>{" "}
                            <span className="font-medium">{new Date(calling.presidency_approval_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {calling.bishop_approval_date && (
                          <div className="bg-white rounded p-2 border">
                            <span className="text-gray-500">Bishop Approved:</span>{" "}
                            <span className="font-medium">{new Date(calling.bishop_approval_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {calling.high_council_approval_date && (
                          <div className="bg-white rounded p-2 border">
                            <span className="text-gray-500">HC Sustained:</span>{" "}
                            <span className="font-medium">{new Date(calling.high_council_approval_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {calling.sustained_date && (
                          <div className="bg-white rounded p-2 border">
                            <span className="text-gray-500">Ward Sustained:</span>{" "}
                            <span className="font-medium">{new Date(calling.sustained_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {calling.set_apart_date && (
                          <div className="bg-white rounded p-2 border">
                            <span className="text-gray-500">Set Apart:</span>{" "}
                            <span className="font-medium">{new Date(calling.set_apart_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {calling.assigned_to_extend && (
                          <div className="bg-white rounded p-2 border">
                            <span className="text-gray-500">Extend By:</span>{" "}
                            <span className="font-medium">{calling.assigned_to_extend}</span>
                          </div>
                        )}
                        {calling.notes && (
                          <div className="bg-white rounded p-2 border col-span-full">
                            <span className="text-gray-500">Notes:</span>{" "}
                            <span className="font-medium">{calling.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
