"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery, safeCount } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import {
  Users,
  Clock,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  UserPlus,
  ShieldCheck,
  Vote,
  Hand,
  Sparkles,
  FileText,
  ListFilter,
} from "lucide-react"

interface PipelineStats {
  submitted: number
  spConsideration: number
  bishopApproval: number
  hcSustained: number
  wardSustained: number
  setApart: number
  completed: number
  totalActive: number
}

export default function CallingsDashboard() {
  const [stats, setStats] = useState<PipelineStats>({
    submitted: 0, spConsideration: 0, bishopApproval: 0,
    hcSustained: 0, wardSustained: 0, setApart: 0,
    completed: 0, totalActive: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    try {
      const [recsResult, callingsResult] = await Promise.all([
        safeCount(supabase.from("calling_recommendations").select("*", { count: "exact", head: true }).eq("status", "pending")),
        safeQuery(supabase.from("callings").select("presidency_approval, bishop_approval, high_council_approval, ward_sustained, sustained_date, set_apart_date, status")),
      ])

      const callings = callingsResult.data || []
      let sp = 0, bish = 0, hc = 0, ws = 0, sa = 0, comp = 0
      for (const c of callings) {
        if (c.set_apart_date && c.status === "active") { comp++; continue }
        if (c.ward_sustained || c.sustained_date) { sa++ }
        else if (c.high_council_approval) { ws++ }
        else if (c.bishop_approval) { hc++ }
        else if (c.presidency_approval) { bish++ }
        else { sp++ }
      }

      setStats({
        submitted: recsResult,
        spConsideration: sp,
        bishopApproval: bish,
        hcSustained: hc,
        wardSustained: ws,
        setApart: sa,
        completed: comp,
        totalActive: callings.length - comp,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const stages = [
    { label: "Names Submitted", value: stats.submitted, icon: UserPlus, color: "border-orange-200 bg-orange-50 text-orange-900", link: "/modules/leadership" },
    { label: "SP Consideration", value: stats.spConsideration, icon: Users, color: "border-blue-200 bg-blue-50 text-blue-900", link: "/modules/leadership/workflow?filter=sp_consideration" },
    { label: "Bishop Approval", value: stats.bishopApproval, icon: ShieldCheck, color: "border-purple-200 bg-purple-50 text-purple-900", link: "/modules/leadership/workflow?filter=bishop_approval" },
    { label: "HC Sustained", value: stats.hcSustained, icon: Vote, color: "border-indigo-200 bg-indigo-50 text-indigo-900", link: "/modules/leadership/workflow?filter=hc_sustained" },
    { label: "Ward Sustained", value: stats.wardSustained, icon: Hand, color: "border-teal-200 bg-teal-50 text-teal-900", link: "/modules/leadership/workflow?filter=ward_sustained" },
    { label: "Set Apart", value: stats.setApart, icon: Sparkles, color: "border-green-200 bg-green-50 text-green-900", link: "/modules/leadership/workflow?filter=set_apart" },
  ]

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Link href="/modules/leadership" className="inline-flex items-center text-sm text-indigo-600 hover:underline mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Callings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Callings Dashboard</h1>
        <p className="mt-1 text-gray-600">
          {loading ? "Loading..." : `${stats.totalActive} active in pipeline · ${stats.completed} completed`}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">Error loading data</p>
            <p className="text-sm text-yellow-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Link href="/modules/leadership/recommend" className={buttonVariants({ className: "h-auto py-4 justify-start" })}>
          <FileText className="h-5 w-5 mr-2" />Submit a Name
        </Link>
        <Link href="/modules/leadership/workflow" className={buttonVariants({ variant: "outline", className: "h-auto py-4 justify-start" })}>
          <Clock className="h-5 w-5 mr-2" />View Workflow
        </Link>
        <Link href="/modules/leadership/tracker" className={buttonVariants({ variant: "outline", className: "h-auto py-4 justify-start" })}>
          <ListFilter className="h-5 w-5 mr-2" />Full Tracker
        </Link>
      </div>

      {/* Pipeline Stages */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Pipeline Stages</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {stages.map((s) => (
          <Link key={s.label} href={s.link}>
            <Card className={`${s.color} hover:shadow-md transition-shadow cursor-pointer`}>
              <CardHeader className="pb-2 pt-4">
                <s.icon className="h-6 w-6 mb-1" />
                <CardTitle className="text-2xl">{loading ? "..." : s.value}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs font-medium">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Completed Callings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{loading ? "..." : stats.completed}</div>
            <Link href="/modules/leadership/tracker" className="inline-flex items-center mt-2 text-sm text-indigo-600 hover:underline">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total in Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.totalActive}</div>
            <Link href="/modules/leadership/workflow" className="inline-flex items-center mt-2 text-sm text-indigo-600 hover:underline">
              View workflow <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
