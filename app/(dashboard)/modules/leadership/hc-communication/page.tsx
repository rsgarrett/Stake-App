"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft, Plus, Trash2, Users, MessageSquare, Calendar,
  ChevronDown, ChevronUp, Send, CheckCircle2, Clock, UserMinus,
  UserPlus, Edit2, Save, X, AlertCircle
} from "lucide-react"

import type { HighCouncilMember, HCWeeklyReport, HCReportResponse } from "@/types"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"
import { getHcPresidencyOnlyAssignmentLines } from "@/lib/leadership/hc-presidency-only-assignments"
import {
  groupByPresidencyStewardship,
  stewardshipKeyFromOversight,
  getPresidencyStewardGroup,
  type PresidencyStewardKey,
} from "@/lib/leadership/presidency-stewardship-groups"

type TabView = "reports" | "roster"

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"

const MEETING_OPTIONS = [
  "Ward Council",
  "Bishopric",
  "Elder Quorum Presidency",
  "Relief Society Presidency",
  "Youth Presidency",
  "Ward Mission Coordination",
  "Primary Presidency",
  "NA",
]

function getReportingWeekSunday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 0 : 7 - day
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + diff)
  return sunday.toISOString().split("T")[0]
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function HCCommunicationPage() {
  const supabase = createClient()

  const [members, setMembers] = useState<HighCouncilMember[]>([])
  const [reports, setReports] = useState<(HCWeeklyReport & { member?: HighCouncilMember; responses?: HCReportResponse[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [tabView, setTabView] = useState<TabView>("reports")
  const [selectedWeek, setSelectedWeek] = useState(getReportingWeekSunday())
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  /** Filter reports by stewardship steward; "all" shows every group. */
  const [stewardFilter, setStewardFilter] = useState<"all" | PresidencyStewardKey>("all")
  /** "all" = weekly view; a member id = every report from that person, chronological. */
  const [personFilter, setPersonFilter] = useState<string>("all")

  // Roster form
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberForm, setMemberForm] = useState({
    member_name: "",
    email: "",
    stewardships: "",
    assigned_wards: "",
    presidency_oversight: "",
    program_assignment: "",
    stewardship_notes: "",
  })
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [editMemberForm, setEditMemberForm] = useState<Partial<HighCouncilMember>>({})

  // Report form
  const [showSubmitReport, setShowSubmitReport] = useState(false)
  const [reportForm, setReportForm] = useState({ member_id: "", meetings_attended: "", stewardship_report: "", followup_needed: "" })

  // Response form
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState("")

  const loadData = useCallback(async () => {
    try {
      const [membersRes, reportsRes] = await Promise.all([
        safeQuery(supabase.from("high_council_members").select("*").order("display_order")),
        safeQuery(supabase.from("hc_weekly_reports").select("*").order("submitted_at", { ascending: false })),
      ])

      const membersData: HighCouncilMember[] = membersRes.data || []
      const reportsData: HCWeeklyReport[] = reportsRes.data || []

      // Load responses for all reports
      if (reportsData.length > 0) {
        const reportIds = reportsData.map((r) => r.id)
        const { data: responses } = await supabase
          .from("hc_report_responses")
          .select("*")
          .in("report_id", reportIds)
          .order("created_at")

        const responsesByReport = new Map<string, HCReportResponse[]>()
        ;(responses || []).forEach((resp: HCReportResponse) => {
          const existing = responsesByReport.get(resp.report_id) || []
          existing.push(resp)
          responsesByReport.set(resp.report_id, existing)
        })

        const memberMap = new Map(membersData.map((m) => [m.id, m]))

        reportsData.forEach((r: any) => {
          r.member = memberMap.get(r.member_id)
          r.responses = responsesByReport.get(r.id) || []
        })
      }

      setMembers(membersData)
      setReports(reportsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // --- Roster CRUD ---
  const addMember = async () => {
    if (!memberForm.member_name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userData } = user ? await supabase.from("users").select("stake_id").eq("id", user!.id).single() : { data: null }
    let stakeId = userData?.stake_id
    if (!stakeId) { const { data: s } = await supabase.from("stakes").select("id").limit(1).single(); stakeId = s?.id }

    const maxOrder = members.length > 0 ? Math.max(...members.map((m) => m.display_order)) : 0
    await supabase.from("high_council_members").insert({
      member_name: memberForm.member_name.trim(),
      email: memberForm.email.trim() || null,
      stewardships: memberForm.stewardships.trim() || null,
      assigned_wards: memberForm.assigned_wards.trim() || null,
      presidency_oversight: memberForm.presidency_oversight.trim() || null,
      program_assignment: memberForm.program_assignment.trim() || null,
      stewardship_notes: memberForm.stewardship_notes.trim() || null,
      stake_id: stakeId,
      status: "active",
      called_date: new Date().toISOString().split("T")[0],
      display_order: maxOrder + 1,
    })
    setMemberForm({
      member_name: "",
      email: "",
      stewardships: "",
      assigned_wards: "",
      presidency_oversight: "",
      program_assignment: "",
      stewardship_notes: "",
    })
    setShowAddMember(false)
    await loadData()
  }

  const releaseMember = async (id: string) => {
    if (!confirm("Release this high councilor? Their historical reports will be preserved.")) return
    await supabase.from("high_council_members").update({
      status: "released",
      released_date: new Date().toISOString().split("T")[0],
    }).eq("id", id)
    await loadData()
  }

  const reactivateMember = async (id: string) => {
    await supabase.from("high_council_members").update({
      status: "active",
      released_date: null,
    }).eq("id", id)
    await loadData()
  }

  const updateMember = async (id: string) => {
    await supabase.from("high_council_members").update({
      member_name: editMemberForm.member_name,
      email: editMemberForm.email || null,
      stewardships: editMemberForm.stewardships || null,
      assigned_wards: editMemberForm.assigned_wards || null,
      presidency_oversight: editMemberForm.presidency_oversight ?? null,
      program_assignment: editMemberForm.program_assignment ?? null,
      stewardship_notes: editMemberForm.stewardship_notes ?? null,
    }).eq("id", id)
    setEditingMember(null)
    setEditMemberForm({})
    await loadData()
  }

  const deleteMember = async (id: string) => {
    if (!confirm("Permanently delete this member and all their reports? Use 'Release' instead to preserve history.")) return
    await supabase.from("high_council_members").delete().eq("id", id)
    await loadData()
  }

  // --- Report CRUD ---
  const submitReport = async () => {
    if (!reportForm.member_id || !reportForm.stewardship_report.trim()) return
    await supabase.from("hc_weekly_reports").insert({
      member_id: reportForm.member_id,
      reporting_week: selectedWeek,
      meetings_attended: reportForm.meetings_attended || null,
      stewardship_report: reportForm.stewardship_report.trim(),
      followup_needed: reportForm.followup_needed.trim() || null,
    })
    setReportForm({ member_id: "", meetings_attended: "", stewardship_report: "", followup_needed: "" })
    setShowSubmitReport(false)
    await loadData()
  }

  // --- Response CRUD ---
  const submitResponse = async (reportId: string) => {
    if (!responseText.trim()) return
    await supabase.from("hc_report_responses").insert({
      report_id: reportId,
      responder_name: "Stake Presidency",
      response_text: responseText.trim(),
    })
    setRespondingTo(null)
    setResponseText("")
    await loadData()
  }

  const deleteResponse = async (id: string) => {
    await supabase.from("hc_report_responses").delete().eq("id", id)
    await loadData()
  }

  // --- Helpers ---
  const activeMembers = members.filter((m) => m.status === "active")
  const releasedMembers = members.filter((m) => m.status === "released")
  const weekReports = reports.filter((r) => r.reporting_week === selectedWeek)
  const reportedMemberIds = new Set(weekReports.map((r) => r.member_id))
  const notReported = activeMembers.filter((m) => !reportedMemberIds.has(m.id))

  const reportSections = groupByPresidencyStewardship(
    weekReports,
    (r) => r.member?.presidency_oversight
  ).filter((s) => stewardFilter === "all" || s.group.key === stewardFilter)

  const notReportedSections = groupByPresidencyStewardship(
    notReported,
    (m) => m.presidency_oversight
  ).filter((s) => stewardFilter === "all" || s.group.key === stewardFilter)

  const stewardFilterOptions: { value: "all" | PresidencyStewardKey; label: string }[] = [
    { value: "all", label: "All stewardships" },
    { value: "garrett", label: "President Garrett" },
    { value: "williams", label: "President Williams" },
    { value: "chandler", label: "President Chandler" },
    { value: "shared", label: "Shared" },
  ]

  /** Released members whose seat was taken by a successor — their report history
   *  lives under the successor's name (succession chain from migration 073). */
  const succeededMemberIds = new Set(
    members.map((m) => m.replaced_member_id).filter((id): id is string => Boolean(id))
  )

  /** Everyone who has ever submitted a report (active roster order, released last).
   *  Released members with a successor are folded into the successor's history. */
  const memberIdsWithReports = new Set(reports.map((r) => r.member_id))
  const reportingMembers = [
    ...activeMembers.filter((m) => memberIdsWithReports.has(m.id)),
    ...releasedMembers.filter((m) => memberIdsWithReports.has(m.id) && !succeededMemberIds.has(m.id)),
  ]

  const selectedPerson = personFilter === "all" ? null : members.find((m) => m.id === personFilter) ?? null

  /** The selected member plus every predecessor whose seat they inherited. */
  const personChain: HighCouncilMember[] = []
  if (selectedPerson) {
    const byId = new Map(members.map((m) => [m.id, m]))
    const seen = new Set<string>()
    let current: HighCouncilMember | undefined = selectedPerson
    while (current && !seen.has(current.id)) {
      personChain.push(current)
      seen.add(current.id)
      current = current.replaced_member_id ? byId.get(current.replaced_member_id) : undefined
    }
  }
  const personChainIds = new Set(personChain.map((m) => m.id))
  const inheritedFrom = personChain.slice(1).map((m) => m.member_name)

  /** All reports from the selected person's seat (them + predecessors), oldest week first. */
  const personReports = selectedPerson
    ? [...reports]
        .filter((r) => personChainIds.has(r.member_id))
        .sort(
          (a, b) =>
            (a.reporting_week ?? "").localeCompare(b.reporting_week ?? "") ||
            (a.submitted_at ?? "").localeCompare(b.submitted_at ?? "")
        )
    : []

  // Generate week options (last 8 weeks + next 2)
  const weekOptions: string[] = []
  for (let i = -2; i <= 8; i++) {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? 0 : 7 - day
    d.setDate(d.getDate() + diff - i * 7)
    weekOptions.push(d.toISOString().split("T")[0])
  }

  /** One expandable report card — used by both the weekly view and the per-person history. */
  const renderReportCard = (
    report: (typeof reports)[number],
    opts: { showWeek?: boolean; authorLabel?: string } = {}
  ) => {
    const isExpanded = expandedReport === report.id
    const responses = report.responses || []
    const isResponding = respondingTo === report.id
    const stewardKey = stewardshipKeyFromOversight(report.member?.presidency_oversight)
    const stewardChip = getPresidencyStewardGroup(stewardKey)

    return (
      <Card key={report.id} className="overflow-hidden">
        <div className={`flex overflow-hidden`}>
          <div className={`w-1.5 shrink-0 ${stewardChip.accent.bar}`} aria-hidden />
          <div className="min-w-0 flex-1">
            {/* Report header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedReport(isExpanded ? null : report.id)}
            >
              <div className="flex items-center space-x-3 min-w-0">
                {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {opts.showWeek
                        ? `Week of ${formatWeek(report.reporting_week)}`
                        : report.member?.member_name || "Unknown"}
                    </span>
                    {opts.authorLabel && (
                      <span className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                        {opts.authorLabel}
                      </span>
                    )}
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${stewardChip.accent.chip}`}>
                      {stewardChip.shortLabel}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {[
                      report.member?.program_assignment,
                      report.member?.stewardships,
                      report.member?.assigned_wards,
                    ].filter(Boolean).join(" · ") || ""}
                    {report.meetings_attended && <span> &middot; Attended: {report.meetings_attended}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                {responses.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />{responses.length}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(report.submitted_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Expanded report content */}
            {isExpanded && (
              <div className="border-t">
                {/* Stewardship report */}
                <div className="px-4 py-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stewardship Report</h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.stewardship_report}</p>
                </div>

                {/* Follow-up needed */}
                {report.followup_needed && (
                  <div className="px-4 py-3 bg-amber-50 border-t border-b">
                    <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Follow-up Needed</h4>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{report.followup_needed}</p>
                  </div>
                )}

                {/* Responses thread */}
                {responses.length > 0 && (
                  <div className="px-4 py-3 bg-indigo-50/50 border-t">
                    <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Responses</h4>
                    <div className="space-y-2">
                      {responses.map((resp) => (
                        <div key={resp.id} className="flex items-start justify-between bg-white p-3 rounded-lg border border-indigo-100">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-indigo-700">{resp.responder_name || "Presidency"}</span>
                              <span className="text-xs text-gray-400">{new Date(resp.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{resp.response_text}</p>
                          </div>
                          <button onClick={() => deleteResponse(resp.id)} className="text-red-300 hover:text-red-500 ml-2 p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response form */}
                <div className="px-4 py-3 border-t bg-gray-50">
                  {isResponding ? (
                    <div className="space-y-2">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className={inputClass}
                        rows={3}
                        placeholder="Type your response..."
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => submitResponse(report.id)} disabled={!responseText.trim()}>
                          <Send className="h-3.5 w-3.5 mr-1" />Send Response
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setResponseText("") }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setRespondingTo(report.id)}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />Respond
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  if (loading) return <div className="p-4 sm:p-6"><div className="text-center py-12">Loading...</div></div>

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <Link href="/modules/leadership" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Leadership
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">High Council Communication</h1>
        <p className="mt-1 text-gray-600">Weekly return &amp; report from high councilors with presidency responses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-xl">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Active Members</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-indigo-600">{activeMembers.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Reported This Week</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{weekReports.length}</div></CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b pb-px mb-6 -mx-1 px-1 sm:mx-0 sm:px-0">
        {([
          { key: "reports" as const, label: "Weekly Reports", icon: MessageSquare },
          { key: "roster" as const, label: `Roster (${activeMembers.length})`, icon: Users },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTabView(key)}
            className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tabView === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Icon className="h-4 w-4 mr-2" />{label}
          </button>
        ))}
      </div>

      {/* ==================== WEEKLY REPORTS TAB ==================== */}
      {tabView === "reports" && (
        <div className="space-y-4">
          {/* Week selector + stewardship filter + submit */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">High Councilor:</label>
                <select
                  value={personFilter}
                  onChange={(e) => setPersonFilter(e.target.value)}
                  className={`${inputClass} w-auto`}
                  aria-label="View all reports from one high councilor"
                >
                  <option value="all">{englishMenuTitleCase("All — weekly view")}</option>
                  {reportingMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_name}{m.status === "released" ? " (released)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              {personFilter === "all" && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Reporting Week:</label>
                    <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className={`${inputClass} w-auto`}>
                      {weekOptions.map((w) => (
                        <option key={w} value={w}>
                          {englishMenuTitleCase("Week of")} {formatWeek(w)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">View:</label>
                    <select
                      value={stewardFilter}
                      onChange={(e) => setStewardFilter(e.target.value as "all" | PresidencyStewardKey)}
                      className={`${inputClass} w-auto`}
                      aria-label="Filter by presidency stewardship"
                    >
                      {stewardFilterOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <Button onClick={() => setShowSubmitReport(true)}><Plus className="h-4 w-4 mr-2" />Submit Report</Button>
          </div>

          <p className="text-xs text-gray-500">
            {personFilter === "all" ? (
              <>
                Reports are grouped by presidency stewardship so each president can quickly find the high councilors he oversees.
                Everyone in the presidency can still read every report. Pick a high councilor above to see their full report history.
              </>
            ) : (
              <>Showing every report from one high councilor, oldest to newest. Choose “All — weekly view” to return to the week-by-week view.</>
            )}
          </p>

          {/* Submit report form */}
          {showSubmitReport && (
            <Card className="border-indigo-200">
              <CardHeader><CardTitle className="text-base">Submit Weekly Report</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">High Councilor</label>
                    <select value={reportForm.member_id} onChange={(e) => setReportForm({ ...reportForm, member_id: e.target.value })} className={inputClass}>
                      <option value="">{englishMenuTitleCase("Select member...")}</option>
                      {activeMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.member_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meetings Attended This Week</label>
                    <input type="text" value={reportForm.meetings_attended} onChange={(e) => setReportForm({ ...reportForm, meetings_attended: e.target.value })} className={inputClass} placeholder="e.g., Ward Council, Elder Quorum Presidency" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report on Stewardship Work <span className="text-red-500">*</span></label>
                    <textarea value={reportForm.stewardship_report} onChange={(e) => setReportForm({ ...reportForm, stewardship_report: e.target.value })} className={inputClass} rows={5} placeholder="Report on the work happening this week in your stewardship..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Needed / How Can the Stake Presidency Help?</label>
                    <textarea value={reportForm.followup_needed} onChange={(e) => setReportForm({ ...reportForm, followup_needed: e.target.value })} className={inputClass} rows={3} placeholder="What follow-up is needed and how can the Stake Presidency help?" />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={submitReport} disabled={!reportForm.member_id || !reportForm.stewardship_report.trim()}>Submit Report</Button>
                    <Button variant="outline" onClick={() => setShowSubmitReport(false)}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not yet reported — grouped by stewardship */}
          {personFilter === "all" && notReportedSections.some((s) => s.items.length > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-amber-800">Not yet reported this week</p>
              </div>
              <div className="space-y-1.5 pl-6">
                {notReportedSections.map(({ group, items }) => (
                  <p key={group.key} className="text-sm text-amber-900">
                    <span className={`inline-block mr-2 rounded border px-1.5 py-0.5 text-[11px] font-semibold ${group.accent.chip}`}>
                      {group.shortLabel}
                    </span>
                    {items.map((m) => m.member_name).join(", ")}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Per-person history: every report from one high councilor, oldest first */}
          {personFilter !== "all" && selectedPerson && (
            <div className="space-y-3">
              {(() => {
                const stewardKey = stewardshipKeyFromOversight(selectedPerson.presidency_oversight)
                const steward = getPresidencyStewardGroup(stewardKey)
                return (
                  <div className={`rounded-lg border px-3 py-2 ${steward.accent.headerBg}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${steward.accent.bar}`} aria-hidden />
                        <h3 className={`text-sm font-semibold ${steward.accent.headerText}`}>
                          {selectedPerson.member_name}
                          {selectedPerson.status === "released" ? " (released)" : ""}
                          {" — all reports"}
                        </h3>
                      </div>
                      <span className={`shrink-0 text-xs font-medium ${steward.accent.headerText}`}>
                        {personReports.length} report{personReports.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {inheritedFrom.length > 0 && (
                      <p className={`mt-1 pl-5 text-xs ${steward.accent.headerText} opacity-80`}>
                        Includes seat history from {inheritedFrom.join(", ")} — inherited reports are labeled with their author.
                      </p>
                    )}
                  </div>
                )
              })()}
              {personReports.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-gray-500">
                  No reports from {selectedPerson.member_name} yet.
                </CardContent></Card>
              ) : (
                personReports.map((report) =>
                  renderReportCard(report, {
                    showWeek: true,
                    authorLabel:
                      report.member_id !== selectedPerson.id
                        ? report.member?.member_name || "Previous councilor"
                        : undefined,
                  })
                )
              )}
            </div>
          )}

          {/* Reports grouped by presidency stewardship */}
          {personFilter === "all" && (
            weekReports.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-gray-500">
                No reports submitted for this week yet.
              </CardContent></Card>
            ) : reportSections.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-gray-500">
                No reports in this stewardship filter for this week.
              </CardContent></Card>
            ) : (
              reportSections.map(({ group, items }) => (
                <div key={group.key} className="space-y-3">
                  <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${group.accent.headerBg}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${group.accent.bar}`} aria-hidden />
                      <h3 className={`text-sm font-semibold ${group.accent.headerText}`}>{group.label}</h3>
                    </div>
                    <span className={`shrink-0 text-xs font-medium ${group.accent.headerText}`}>
                      {items.length} report{items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {items.map((report) => renderReportCard(report))}
                </div>
              ))
            )
          )}
        </div>
      )}

      {/* ==================== ROSTER TAB ==================== */}
      {tabView === "roster" && (
        <div className="space-y-4">
          {/* Presidency-only stewardship lines from the HC assignment spreadsheet (editable in code until a DB column exists). */}
          <Card className="border-slate-200 bg-slate-50/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Presidency stewardship (sheet reference)</CardTitle>
              <CardDescription className="text-xs">
                These items are stewarded directly by presidency members rather than roster lines here. Clerks can tweak the wording in{" "}
                <code className="rounded bg-white px-1 py-0.5 text-[11px]">lib/leadership/hc-presidency-only-assignments.ts</code>{" "}
                or we can add a stake-setting field later.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {getHcPresidencyOnlyAssignmentLines().map((blk) =>
                blk.lines.length === 0 ? null : (
                  <div key={blk.title}>
                    <p className="text-sm font-semibold text-slate-800">{blk.title}</p>
                    <ul className="mt-1.5 list-inside list-disc text-sm text-slate-700 space-y-0.5">
                      {blk.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle>Active High Councilors</CardTitle>
                  <CardDescription>Manage the roster and assignment details — use Edit under each row. Release members when callings change; report history stays.</CardDescription>
                </div>
                <Button className="w-full shrink-0 sm:w-auto" onClick={() => setShowAddMember(true)}><UserPlus className="h-4 w-4 mr-2" />Add Member</Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddMember && (
                <div className="mb-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Name *" value={memberForm.member_name} onChange={(e) => setMemberForm({ ...memberForm, member_name: e.target.value })} className={inputClass} autoFocus />
                    <input type="email" placeholder="Email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} className={inputClass} />
                  </div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Primary assignment title</label>
                  <textarea
                    placeholder="e.g. Missionary work, Physical facilities representative, Stake music coordinator..."
                    rows={2}
                    value={memberForm.stewardships}
                    onChange={(e) => setMemberForm({ ...memberForm, stewardships: e.target.value })}
                    className={inputClass}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Presidency oversight</label>
                      <input
                        type="text"
                        placeholder="e.g. President Garrett"
                        value={memberForm.presidency_oversight}
                        onChange={(e) => setMemberForm({ ...memberForm, presidency_oversight: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Program (ALC / YLC …)</label>
                      <input
                        type="text"
                        placeholder="ALC · YLC · ALC / YLC"
                        value={memberForm.program_assignment}
                        onChange={(e) => setMemberForm({ ...memberForm, program_assignment: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Wards / coordinating context</label>
                    <textarea
                      rows={2}
                      placeholder="Which wards or ALC grouping (e.g. Coordinating 12th Ward …)"
                      value={memberForm.assigned_wards}
                      onChange={(e) => setMemberForm({ ...memberForm, assigned_wards: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Additional notes</label>
                    <textarea
                      rows={3}
                      placeholder="Building scheduler, ushering, seminary, institute, ward baptisms coordination, stake camp, etc."
                      value={memberForm.stewardship_notes}
                      onChange={(e) => setMemberForm({ ...memberForm, stewardship_notes: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={addMember} disabled={!memberForm.member_name.trim()}>Add</Button>
                    <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {activeMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active high councilors.</p>
              ) : (
                <div className="space-y-3">
                  {activeMembers.map((m) => {
                    const isEditing = editingMember === m.id
                    const memberReportCount = reports.filter((r) => r.member_id === m.id).length
                    const hasReportedThisWeek = reportedMemberIds.has(m.id)

                    const startEdit = () => {
                      setEditingMember(m.id)
                      setEditMemberForm({
                        member_name: m.member_name,
                        email: m.email,
                        stewardships: m.stewardships,
                        assigned_wards: m.assigned_wards,
                        presidency_oversight: m.presidency_oversight ?? "",
                        program_assignment: m.program_assignment ?? "",
                        stewardship_notes: m.stewardship_notes ?? "",
                      })
                    }

                    if (isEditing) {
                      return (
                        <div key={m.id} className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input type="text" value={editMemberForm.member_name || ""} onChange={(e) => setEditMemberForm({ ...editMemberForm, member_name: e.target.value })} className={inputClass} />
                            <input type="email" value={editMemberForm.email || ""} onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })} className={inputClass} />
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Primary assignment title(s)"
                            value={editMemberForm.stewardships || ""}
                            onChange={(e) => setEditMemberForm({ ...editMemberForm, stewardships: e.target.value })}
                            className={inputClass}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input type="text" placeholder="Presidency oversight" value={editMemberForm.presidency_oversight ?? ""} onChange={(e) => setEditMemberForm({ ...editMemberForm, presidency_oversight: e.target.value })} className={inputClass} />
                            <input type="text" placeholder="Program (ALC / YLC)" value={editMemberForm.program_assignment ?? ""} onChange={(e) => setEditMemberForm({ ...editMemberForm, program_assignment: e.target.value })} className={inputClass} />
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Wards / coordinating context"
                            value={editMemberForm.assigned_wards || ""}
                            onChange={(e) => setEditMemberForm({ ...editMemberForm, assigned_wards: e.target.value })}
                            className={inputClass}
                          />
                          <textarea
                            rows={3}
                            placeholder="Additional duties / notes"
                            value={editMemberForm.stewardship_notes ?? ""}
                            onChange={(e) => setEditMemberForm({ ...editMemberForm, stewardship_notes: e.target.value })}
                            className={inputClass}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => updateMember(m.id)}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
                            <Button size="sm" variant="outline" onClick={() => { setEditingMember(null); setEditMemberForm({}) }}>Cancel</Button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={m.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 sm:flex-row sm:items-start sm:justify-between group">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900">{m.member_name}</span>
                            {m.program_assignment ? (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{m.program_assignment}</span>
                            ) : null}
                            {hasReportedThisWeek ? (
                              <span title="Reported this week" className="inline-flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden />
                              </span>
                            ) : (
                              <span title="Not yet reported this week" className="inline-flex items-center">
                                <Clock className="h-4 w-4 text-amber-400" aria-hidden />
                              </span>
                            )}
                          </div>
                          <dl className="mt-2 space-y-1.5 text-sm text-gray-700">
                            {m.presidency_oversight ? (
                              <div className="flex flex-col gap-0.5">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Presidency oversight</dt>
                                <dd>{m.presidency_oversight}</dd>
                              </div>
                            ) : null}
                            {m.stewardships ? (
                              <div className="flex flex-col gap-0.5">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Assignment</dt>
                                <dd className="whitespace-pre-wrap">{m.stewardships}</dd>
                              </div>
                            ) : null}
                            {m.assigned_wards ? (
                              <div className="flex flex-col gap-0.5">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Wards / coordinating</dt>
                                <dd className="whitespace-pre-wrap">{m.assigned_wards}</dd>
                              </div>
                            ) : null}
                            {m.stewardship_notes ? (
                              <div className="flex flex-col gap-0.5">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Additional duties</dt>
                                <dd className="text-gray-600 whitespace-pre-wrap">{m.stewardship_notes}</dd>
                              </div>
                            ) : null}
                          </dl>
                          <div className="mt-2 space-y-0.5">
                            {m.email ? <p className="text-xs text-gray-500">{m.email}</p> : null}
                            <p className="text-xs text-gray-400">{memberReportCount} total reports</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 border-t pt-3 sm:border-0 sm:pt-0 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                          <button type="button" onClick={() => startEdit()} className="tap-target rounded-md text-indigo-600 hover:bg-indigo-50 p-2" title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => releaseMember(m.id)} className="tap-target rounded-md text-amber-600 hover:bg-amber-50 p-2" title="Release">
                            <UserMinus className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => deleteMember(m.id)} className="tap-target rounded-md text-red-600 hover:bg-red-50 p-2" title="Delete permanently">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Released members */}
          {releasedMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-gray-500">Released High Councilors</CardTitle>
                <CardDescription>Historical members — report history preserved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {releasedMembers.map((m) => (
                    <div key={m.id} className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3 opacity-60 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-700">{m.member_name}</div>
                        <div className="text-xs text-gray-400">
                          Released {m.released_date ? new Date(m.released_date).toLocaleDateString() : ""}
                        </div>
                        {m.presidency_oversight || m.stewardships ? (
                          <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                            {[m.presidency_oversight, m.stewardships, m.assigned_wards].filter(Boolean).join("\n")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center shrink-0">
                        <Button size="sm" variant="outline" onClick={() => reactivateMember(m.id)}>Reactivate</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
