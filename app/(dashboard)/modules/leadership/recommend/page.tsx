"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

const ORGANIZATIONS = [
  "Stake Presidency",
  "High Council",
  "Stake Clerks",
  "Stake Executive Secretary",
  "Bishopric",
  "Elders Quorum",
  "Relief Society",
  "Young Men",
  "Young Women",
  "Primary",
  "Sunday School",
  "Music",
  "Seminary & Institute",
  "Stake Communication",
  "Stake Temple & Family History",
  "Stake Missionary",
  "Stake Welfare & Self-Reliance",
  "Stake Auditing",
  "Stake Technology",
  "Stake Facilities",
  "Stake Emergency Preparedness",
  "Stake Activities",
  "Stake Single Adults / Young Single Adults",
] as const

const CALLINGS_BY_ORG: Record<string, string[]> = {
  "Stake Presidency": ["Stake Patriarch", "Stake President (submitted to First Presidency)"],
  "High Council": ["High Councilor"],
  "Stake Clerks": ["Stake Clerk", "Assistant Stake Clerk", "Assistant Stake Clerk — Finance", "Assistant Stake Clerk — Membership"],
  "Stake Executive Secretary": ["Stake Executive Secretary", "Assistant Stake Executive Secretary"],
  "Bishopric": ["Bishop", "First Counselor in the Bishopric", "Second Counselor in the Bishopric", "Ward Clerk", "Assistant Ward Clerk", "Assistant Ward Clerk — Finance", "Assistant Ward Clerk — Membership", "Ward Executive Secretary", "Ward Mission Leader", "Ward Temple & Family History Leader"],
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
  const [formData, setFormData] = useState({
    type: "Calling" as "Calling" | "Release" | "Assignment" | "MP",
    person_name: "",
    ward: "",
    calling_name: "",
    custom_calling: "",
    organization: "",
    current_calling: "",
    replaces_person_name: "",
    reason: "",
  })

  const [roleUsers, setRoleUsers] = useState<{ full_name: string; role: string }[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("users")
      .select("full_name, role")
      .neq("role", "viewer")
      .order("full_name")
      .then(({ data }) => {
        setRoleUsers((data || []).filter((u) => u.full_name))
      })
  }, [])

  const handleOrgChange = (org: string) => {
    setFormData({ ...formData, organization: org, calling_name: "" })
  }

  const filteredCallings = formData.organization
    ? CALLINGS_BY_ORG[formData.organization] || []
    : ALL_CALLINGS.map((c) => c.calling)

  const effectiveCallingName = useCustomCalling
    ? formData.custom_calling
    : formData.calling_name

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!effectiveCallingName.trim()) {
      setError("Please select or enter a calling name")
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
          organization: formData.organization || null,
          notes: [
            formData.current_calling ? `Current calling: ${formData.current_calling}` : "",
            formData.reason || "",
          ].filter(Boolean).join("\n") || null,
          replaces_person_name: formData.replaces_person_name || null,
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
    <div className="p-6">
      <div className="mb-6">
        <Link href="/modules/leadership" className="inline-flex items-center text-sm text-indigo-600 hover:underline mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Callings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Submit a Name</h1>
        <p className="mt-1 text-gray-600">
          Submit a name for consideration. It will appear in the pipeline for stake presidency review.
        </p>
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

            <div className="grid grid-cols-2 gap-4">
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
                required
                value={formData.organization}
                onChange={(e) => handleOrgChange(e.target.value)}
                className={inputClass}
              >
                <option value="">-- {englishMenuTitleCase("Select organization")} --</option>
                {ORGANIZATIONS.map((org) => (
                  <option key={org} value={org}>
                    {englishMenuTitleCase(org)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setUseCustomCalling(!useCustomCalling)
                  setFormData({ ...formData, calling_name: "", custom_calling: "" })
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useCustomCalling ? "bg-indigo-600" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useCustomCalling ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <label className="text-sm text-gray-700">Custom calling name</label>
            </div>

            {useCustomCalling ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Calling <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required={useCustomCalling}
                  value={formData.custom_calling}
                  onChange={(e) => setFormData({ ...formData, custom_calling: e.target.value })}
                  className={inputClass}
                  placeholder="Enter the calling title"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calling <span className="text-red-500">*</span>
                </label>
                <select
                  required={!useCustomCalling}
                  value={formData.calling_name}
                  onChange={(e) => setFormData({ ...formData, calling_name: e.target.value })}
                  className={inputClass}
                >
                  <option value="">
                    {formData.organization
                      ? `-- ${englishMenuTitleCase(`Select calling in ${formData.organization}`)} --`
                      : `-- ${englishMenuTitleCase("Select organization first")} --`}
                  </option>
                  {formData.organization ? (
                    filteredCallings.map((c) => (
                      <option key={c} value={c}>
                        {englishMenuTitleCase(c)}
                      </option>
                    ))
                  ) : (
                    Object.entries(CALLINGS_BY_ORG).map(([org, callings]) => (
                      <optgroup key={org} label={englishMenuTitleCase(org)}>
                        {callings.map((c) => (
                          <option key={`${org}-${c}`} value={c}>
                            {englishMenuTitleCase(c)}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  )}
                </select>
              </div>
            )}

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
                value={formData.replaces_person_name}
                onChange={(e) => setFormData({ ...formData, replaces_person_name: e.target.value })}
                className={inputClass}
              >
                <option value="">{englishMenuTitleCase("N/A — New calling (no one to replace)")}</option>
                {roleUsers.map((u) => (
                  <option key={u.full_name} value={u.full_name}>
                    {u.full_name} ({englishMenuTitleCase(u.role?.replace(/_/g, " ") || "")})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                When this calling is completed, the replaced person&apos;s app permissions will be updated automatically.
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
