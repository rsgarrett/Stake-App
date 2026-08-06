"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"
import { BishopRecommendShareCard } from "@/components/leadership/bishop-recommend-share-card"
import { sameCallingName } from "@/lib/callings/calling-holders"

const CUSTOM_CALLING_VALUE = "__custom__"
const CUSTOM_ORG_VALUE = "__custom_org__"
const CUSTOM_REPLACES_VALUE = "__custom_replaces__"

/** Core org list; live roster orgs are merged in so LCR imports stay available. */
const ORGANIZATIONS = [
  "Stake Presidency",
  "High Council",
  "Patriarch",
  "Stake Relief Society",
  "Stake Young Men",
  "Stake Young Women",
  "Stake Sunday School",
  "Stake Primary",
  "Young Single Adult",
  "Single Adult",
  "Stake Temple and Family History",
  "Activities and Sports",
  "Auditing",
  "Church Communication",
  "Church Service Missionaries",
  "Facilities",
  "Music",
  "Seminary and Institute",
  "Technology",
  "Welfare and Self-Reliance",
  "Additional Callings",
  "Bishopric",
  "Elders Quorum",
] as const

function orgMatches(holderOrg: string | null | undefined, selected: string): boolean {
  if (!holderOrg || !selected) return false
  const a = holderOrg.toLowerCase()
  const b = selected.toLowerCase()
  return a === b || a.includes(b) || b.includes(a)
}

const CALLINGS_BY_ORG: Record<string, string[]> = {
  "Stake Presidency": [
    "Stake Executive Secretary",
    "Assistant Stake Executive Secretary",
    "Stake Clerk",
    "Assistant Stake Clerk",
    "Assistant Stake Clerk — Membership",
    "Assistant Stake Clerk — Finance",
  ],
  "High Council": ["High Councilor"],
  "Patriarch": ["Patriarch"],
  "Bishopric": [
    "First Counselor in the Bishopric",
    "Second Counselor in the Bishopric",
    "Ward Clerk",
    "Assistant Ward Clerk",
    "Assistant Ward Clerk — Finance",
    "Assistant Ward Clerk — Membership",
    "Ward Executive Secretary",
    "Ward Mission Leader",
    "Ward Temple & Family History Leader",
  ],
  "Elders Quorum": ["Elders Quorum President", "First Counselor in the Elders Quorum Presidency", "Second Counselor in the Elders Quorum Presidency", "Elders Quorum Secretary", "Stake Elders Quorum Adviser (High Councilor)"],
  "Relief Society": ["Stake Relief Society President", "First Counselor in the Stake Relief Society Presidency", "Second Counselor in the Stake Relief Society Presidency", "Stake Relief Society Secretary", "Ward Relief Society President", "First Counselor in the Ward Relief Society Presidency", "Second Counselor in the Ward Relief Society Presidency", "Ward Relief Society Secretary"],
  "Young Men": ["Stake Young Men President", "First Counselor in the Stake Young Men Presidency", "Second Counselor in the Stake Young Men Presidency", "Stake Young Men Secretary", "Ward Young Men President", "First Counselor in the Ward Young Men Presidency", "Second Counselor in the Ward Young Men Presidency", "Ward Young Men Secretary", "Priests Quorum Adviser", "Teachers Quorum Adviser", "Deacons Quorum Adviser"],
  "Young Women": ["Stake Young Women President", "First Counselor in the Stake Young Women Presidency", "Second Counselor in the Stake Young Women Presidency", "Stake Young Women Secretary", "Ward Young Women President", "First Counselor in the Ward Young Women Presidency", "Second Counselor in the Ward Young Women Presidency", "Ward Young Women Secretary", "Young Women Class Adviser"],
  "Primary": ["Stake Primary President", "First Counselor in the Stake Primary Presidency", "Second Counselor in the Stake Primary Presidency", "Stake Primary Secretary", "Ward Primary President", "First Counselor in the Ward Primary Presidency", "Second Counselor in the Ward Primary Presidency", "Ward Primary Secretary", "Nursery Leader", "Primary Teacher"],
  "Sunday School": ["Stake Sunday School President", "First Counselor in the Stake Sunday School Presidency", "Second Counselor in the Stake Sunday School Presidency", "Stake Sunday School Secretary", "Ward Sunday School President", "First Counselor in the Ward Sunday School Presidency", "Second Counselor in the Ward Sunday School Presidency", "Ward Sunday School Secretary", "Gospel Doctrine Teacher", "Gospel Principles Teacher", "Sunday School Teacher"],
  "Music": ["Stake Music Chairman", "Stake Music Director", "Stake Organist / Pianist", "Ward Music Chairman", "Ward Choir Director", "Ward Music Director", "Ward Organist / Pianist"],
  "Seminary & Institute": ["Stake Seminary & Institute Coordinator", "Seminary Teacher", "Institute Teacher"],
  "Stake Communication": ["Stake Communication Director", "Stake Communication Specialist"],
  "Stake Temple & Family History": ["Stake Temple & Family History Consultant", "Ward Temple & Family History Consultant"],
  "Stake Missionary": ["Stake Mission Leader", "Stake Missionary — Service", "Stake Missionary Preparation Leader"],
  "Stake Welfare & Self-Reliance": ["Stake Self-Reliance Specialist", "Stake Welfare Specialist", "Employment Specialist"],
  "Stake Auditing": ["Stake Auditor", "Assistant Stake Auditor"],
  "Stake Technology": ["Stake Technology Specialist"],
  "Stake Facilities": ["Stake Building Representative", "Stake Facilities Specialist"],
  "Stake Emergency Preparedness": ["Stake Emergency Preparedness Specialist"],
  "Stake Activities": ["Stake Activities Committee Chairman", "Stake Activities Specialist", "Stake Dance Specialist", "Stake Sports Specialist"],
  "Stake Single Adults / Young Single Adults": ["Stake Young Single Adult Adviser", "Stake Single Adult Adviser", "Ward Young Single Adult Adviser"],
}

const ALL_CALLINGS = Object.entries(CALLINGS_BY_ORG).flatMap(([org, callings]) =>
  callings.map((c) => ({ org, calling: c }))
)

const WARDS = ["8th", "12th", "17th", "18th", "19th", "22nd", "23rd"]

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function SubmitNamePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useCustomCalling, setUseCustomCalling] = useState(false)
  const [useCustomOrg, setUseCustomOrg] = useState(false)
  const [formData, setFormData] = useState({
    type: "Calling" as "Calling" | "Release" | "Assignment" | "MP",
    person_name: "",
    ward: "",
    calling_name: "",
    custom_calling: "",
    organization: "",
    custom_organization: "",
    current_calling: "",
    replaces_person_name: "",
    custom_replaces: "",
    reason: "",
  })

  const [useCustomReplaces, setUseCustomReplaces] = useState(false)
  type HolderRow = {
    organization: string | null
    calling_name: string
    person_name: string
    ward: string | null
  }
  const [holders, setHolders] = useState<HolderRow[]>([])
  const [holdersReady, setHoldersReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const { data, error } = await supabase
        .from("stake_calling_holders")
        .select("organization, calling_name, person_name, ward")
        .eq("status", "active")
        .order("person_name")
      if (!error && data) {
        setHolders(
          data
            .filter((r) => r.person_name?.trim() && r.calling_name?.trim())
            .map((r) => ({
              organization: (r.organization as string | null) ?? null,
              calling_name: r.calling_name as string,
              person_name: (r.person_name as string).trim(),
              ward: (r.ward as string | null) ?? null,
            }))
        )
        setHoldersReady(true)
        return
      }
      setHoldersReady(true)
    })()
  }, [])

  const organizationOptions = useMemo(() => {
    const fromRoster = holders
      .map((h) => h.organization)
      .filter((o): o is string => !!o?.trim())
    return [...new Set([...ORGANIZATIONS, ...fromRoster])].sort((a, b) => a.localeCompare(b))
  }, [holders])

  const selectedCallingForReplaces = (
    useCustomCalling ? formData.custom_calling : formData.calling_name
  ).trim()

  const replaceCandidates = useMemo(() => {
    if (!selectedCallingForReplaces) return [] as string[]
    const names = holders
      .filter((h) => sameCallingName(h.calling_name, selectedCallingForReplaces))
      .map((h) => h.person_name)
    return [...new Set(names)].sort((a, b) => a.localeCompare(b))
  }, [holders, selectedCallingForReplaces])

  const handleOrgChange = (org: string) => {
    if (org === CUSTOM_ORG_VALUE) {
      setUseCustomOrg(true)
      setUseCustomCalling(true)
      setUseCustomReplaces(false)
      setFormData({
        ...formData,
        organization: "",
        custom_organization: "",
        calling_name: "",
        custom_calling: "",
        replaces_person_name: "",
        custom_replaces: "",
      })
      return
    }
    setUseCustomOrg(false)
    setUseCustomCalling(false)
    setUseCustomReplaces(false)
    setFormData({
      ...formData,
      organization: org,
      custom_organization: "",
      calling_name: "",
      custom_calling: "",
      replaces_person_name: "",
      custom_replaces: "",
    })
  }

  const filteredCallings = useMemo(() => {
    if (useCustomOrg) return [] as string[]
    if (!formData.organization) {
      return [...new Set([
        ...ALL_CALLINGS.map((c) => c.calling),
        ...holders.map((h) => h.calling_name),
      ])].sort((a, b) => a.localeCompare(b))
    }
    const fromStatic = CALLINGS_BY_ORG[formData.organization] || []
    const fromRoster = holders
      .filter((h) => orgMatches(h.organization, formData.organization))
      .map((h) => h.calling_name)
    return [...new Set([...fromStatic, ...fromRoster])].sort((a, b) => a.localeCompare(b))
  }, [useCustomOrg, formData.organization, holders])

  const handleCallingSelect = (value: string) => {
    if (value === CUSTOM_CALLING_VALUE) {
      setUseCustomCalling(true)
      setUseCustomReplaces(false)
      setFormData({
        ...formData,
        calling_name: "",
        custom_calling: "",
        replaces_person_name: "",
        custom_replaces: "",
      })
      return
    }
    setUseCustomCalling(false)
    setUseCustomReplaces(false)
    setFormData({
      ...formData,
      calling_name: value,
      custom_calling: "",
      replaces_person_name: "",
      custom_replaces: "",
    })
  }

  const effectiveCallingName = useCustomCalling
    ? formData.custom_calling
    : formData.calling_name
  const effectiveOrganization = useCustomOrg
    ? formData.custom_organization
    : formData.organization
  const effectiveReplacesName = useCustomReplaces
    ? formData.custom_replaces.trim()
    : formData.replaces_person_name.trim()

  const handleReplacesSelect = (value: string) => {
    if (value === CUSTOM_REPLACES_VALUE) {
      setUseCustomReplaces(true)
      setFormData({ ...formData, replaces_person_name: "", custom_replaces: "" })
      return
    }
    setUseCustomReplaces(false)
    setFormData({ ...formData, replaces_person_name: value, custom_replaces: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!effectiveOrganization.trim()) {
      setError("Please select or enter an organization")
      setLoading(false)
      return
    }

    if (!effectiveCallingName.trim()) {
      setError("Please select or enter a calling name")
      setLoading(false)
      return
    }

    if (useCustomReplaces && !effectiveReplacesName) {
      setError("Please enter the name of the person being replaced, or choose N/A")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const wardValue = formData.ward || "Stake"
      const userId = user?.id || null

      let stakeId = null
      if (user) {
        const { data: userData } = await supabase.from("users").select("stake_id").eq("id", user.id).single()
        stakeId = userData?.stake_id
      }

      const { error: insertError } = await supabase
        .from("callings")
        .insert({
          type: formData.type,
          person_name: formData.person_name,
          ward: wardValue,
          calling_name: effectiveCallingName,
          organization: effectiveOrganization.trim() || null,
          notes: [
            formData.current_calling ? `Current calling: ${formData.current_calling}` : "",
            formData.reason || "",
          ].filter(Boolean).join("\n") || null,
          replaces_person_name: effectiveReplacesName || null,
          submitted_by: userId,
          stake_id: stakeId,
          status: "pending",
        })

      if (insertError) throw insertError

      router.push("/modules/leadership")
    } catch (err: any) {
      setError(err.message || "Failed to submit name")
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Link href="/modules/leadership" className="inline-flex items-center text-sm text-indigo-600 hover:underline mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Callings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Submit a Name</h1>
        <p className="mt-1 text-gray-600">
          Submit a name for consideration. It will appear in the pipeline for stake presidency review.
        </p>
      </div>

      <div className="mb-6 max-w-2xl">
        <BishopRecommendShareCard />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Calling Recommendation</CardTitle>
          <CardDescription>
            This name will be added to the &ldquo;Name Submitted&rdquo; column for stake presidency consideration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="Calling">{englishMenuTitleCase("Calling")}</option>
                  <option value="Release">{englishMenuTitleCase("Release")}</option>
                  <option value="Assignment">{englishMenuTitleCase("Assignment")}</option>
                  <option value="MP">{englishMenuTitleCase("Melchizedek priesthood")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ward <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className={inputClass}
                >
                  <option value="">-- {englishMenuTitleCase("Select ward")} --</option>
                  {WARDS.map((w) => (
                    <option key={w} value={w}>
                      {englishMenuTitleCase(w)}
                    </option>
                  ))}
                  <option value="Stake">{englishMenuTitleCase("Stake-wide")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Person&apos;s Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                className={inputClass}
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization <span className="text-red-500">*</span>
              </label>
              <select
                required={!useCustomOrg}
                value={useCustomOrg ? CUSTOM_ORG_VALUE : formData.organization}
                onChange={(e) => handleOrgChange(e.target.value)}
                className={inputClass}
              >
                <option value="">-- {englishMenuTitleCase("Select organization")} --</option>
                {organizationOptions.map((org) => (
                  <option key={org} value={org}>
                    {englishMenuTitleCase(org)}
                  </option>
                ))}
                <option value={CUSTOM_ORG_VALUE}>Other (enter custom organization)…</option>
              </select>
            </div>

            {useCustomOrg ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom organization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required={useCustomOrg}
                  value={formData.custom_organization}
                  onChange={(e) => setFormData({ ...formData, custom_organization: e.target.value })}
                  className={inputClass}
                  placeholder="Enter the organization name"
                  autoFocus
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calling / assignment <span className="text-red-500">*</span>
              </label>
              <select
                required={!useCustomCalling}
                value={useCustomCalling ? CUSTOM_CALLING_VALUE : formData.calling_name}
                onChange={(e) => handleCallingSelect(e.target.value)}
                className={inputClass}
              >
                <option value="">
                  {useCustomOrg
                    ? `-- ${englishMenuTitleCase("Select other for a custom name")} --`
                    : formData.organization
                      ? `-- ${englishMenuTitleCase(`Select calling in ${formData.organization}`)} --`
                      : `-- ${englishMenuTitleCase("Select organization first")} --`}
                </option>
                {!useCustomOrg && formData.organization ? (
                  filteredCallings.map((c) => (
                    <option key={c} value={c}>
                      {englishMenuTitleCase(c)}
                    </option>
                  ))
                ) : null}
                {!useCustomOrg && !formData.organization ? (
                  Object.entries(CALLINGS_BY_ORG).map(([org, callings]) => (
                    <optgroup key={org} label={englishMenuTitleCase(org)}>
                      {callings.map((c) => (
                        <option key={`${org}-${c}`} value={c}>
                          {englishMenuTitleCase(c)}
                        </option>
                      ))}
                    </optgroup>
                  ))
                ) : null}
                <option value={CUSTOM_CALLING_VALUE}>Other (enter custom name)…</option>
              </select>
            </div>

            {useCustomCalling ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom calling or assignment <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required={useCustomCalling}
                  value={formData.custom_calling}
                  onChange={(e) => setFormData({ ...formData, custom_calling: e.target.value })}
                  className={inputClass}
                  placeholder="Enter the calling or assignment title"
                  autoFocus={!useCustomOrg}
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Calling</label>
              <input
                type="text"
                value={formData.current_calling}
                onChange={(e) => setFormData({ ...formData, current_calling: e.target.value })}
                className={inputClass}
                placeholder="Their current calling (if any)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Replaces (person currently in the calling)</label>
              <select
                value={useCustomReplaces ? CUSTOM_REPLACES_VALUE : formData.replaces_person_name}
                onChange={(e) => handleReplacesSelect(e.target.value)}
                className={inputClass}
                disabled={!selectedCallingForReplaces && !useCustomReplaces}
              >
                <option value="">
                  {!selectedCallingForReplaces
                    ? englishMenuTitleCase("Select a calling first")
                    : englishMenuTitleCase("N/A — New calling (no one to replace)")}
                </option>
                {holders
                  .filter(
                    (h) =>
                      selectedCallingForReplaces &&
                      sameCallingName(h.calling_name, selectedCallingForReplaces)
                  )
                  .filter(
                    (h, i, arr) =>
                      arr.findIndex((x) => x.person_name === h.person_name) === i
                  )
                  .sort((a, b) => a.person_name.localeCompare(b.person_name))
                  .map((h) => (
                    <option key={`${h.person_name}-${h.ward ?? ""}`} value={h.person_name}>
                      {h.person_name}
                      {h.ward ? ` (${h.ward})` : ""}
                    </option>
                  ))}
                <option value={CUSTOM_REPLACES_VALUE}>Other (enter name)…</option>
              </select>
              {useCustomReplaces ? (
                <input
                  type="text"
                  required={useCustomReplaces}
                  value={formData.custom_replaces}
                  onChange={(e) => setFormData({ ...formData, custom_replaces: e.target.value })}
                  className={`${inputClass} mt-2`}
                  placeholder="Name of the person being replaced"
                  autoFocus
                />
              ) : null}
              <p className="text-xs text-gray-500 mt-1">
                {!selectedCallingForReplaces
                  ? "Pick a calling first — then only current holders of that calling appear here."
                  : holdersReady && replaceCandidates.length === 0
                    ? "No one is currently listed in this calling. Choose Other to type a name, or update the Calling roster."
                    : `${replaceCandidates.length} current holder${replaceCandidates.length === 1 ? "" : "s"} for this calling. Completing the calling updates the roster automatically.`}
                {" "}
                <Link href="/modules/leadership/calling-roster" className="text-indigo-600 hover:underline">
                  Calling roster
                </Link>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className={inputClass}
                placeholder="Work schedule, family dynamics, concerns, etc."
              />
            </div>

            <div className="flex space-x-4 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Name"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/modules/leadership")} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
