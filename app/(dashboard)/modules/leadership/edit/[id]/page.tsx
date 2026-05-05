"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, UserPlus, Users, ShieldCheck, Vote, Hand, Sparkles } from "lucide-react"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

const ORGANIZATIONS = [
  "Stake Presidency", "High Council", "Stake Clerk", "Stake Executive Secretary",
  "Bishopric", "Relief Society", "Elders Quorum", "Young Men", "Young Women",
  "Primary", "Sunday School", "Music", "Seminary & Institute",
  "Stake Communication", "Stake Temple & Family History", "Stake Missionary",
  "Stake Welfare & Self-Reliance", "Stake Auditing", "Stake Technology",
  "Stake Facilities", "Stake Emergency Preparedness", "Stake Activities",
  "Stake Single Adults / Young Single Adults", "Facilities", "Other",
]

const WARDS = ["8th", "12th", "17th", "18th", "19th", "22nd", "23rd", "Stake"]

const WORKFLOW_STEPS = [
  { key: "submitted", label: "Submitted", icon: UserPlus },
  { key: "sp_consideration", label: "SP Considered", icon: Users },
  { key: "bishop_approval", label: "Bishop Approved", icon: ShieldCheck },
  { key: "hc_sustained", label: "HC Sustained", icon: Vote },
  { key: "ward_sustained", label: "Ward Sustained", icon: Hand },
  { key: "set_apart", label: "Set Apart", icon: Sparkles },
]

// General Handbook 30.8 — Authority to extend and set apart
// General Handbook 30.8 — Stake-level authority to extend and set apart
const AUTHORITY_LEVELS = [
  "Stake President",
  "Stake Presidency",
  "Stake Presidency or High Councilor",
] as const

type AuthLevel = typeof AUTHORITY_LEVELS[number]
interface HandbookAuth { extend: AuthLevel; setApart: AuthLevel }

const CALLING_AUTH: Record<string, HandbookAuth> = {
  "Stake Patriarch":                        { extend: "Stake President",  setApart: "Stake President" },
  "Bishop":                                 { extend: "Stake President",  setApart: "Stake President" },
  "High Councilor":                         { extend: "Stake President",  setApart: "Stake President" },
  "Elders Quorum President":                { extend: "Stake President",  setApart: "Stake President" },
  "First Counselor in the Bishopric":       { extend: "Stake Presidency", setApart: "Stake Presidency" },
  "Second Counselor in the Bishopric":      { extend: "Stake Presidency", setApart: "Stake Presidency" },
  "Stake Clerk":                            { extend: "Stake Presidency", setApart: "Stake Presidency" },
  "Assistant Stake Clerk":                  { extend: "Stake Presidency", setApart: "Stake Presidency" },
  "Stake Executive Secretary":              { extend: "Stake Presidency", setApart: "Stake Presidency" },
}

const ORG_AUTH: Record<string, HandbookAuth> = {
  "High Council":              { extend: "Stake President",  setApart: "Stake President" },
  "Stake Clerks":              { extend: "Stake Presidency", setApart: "Stake Presidency" },
  "Stake Executive Secretary": { extend: "Stake Presidency", setApart: "Stake Presidency" },
  "Bishopric":                 { extend: "Stake Presidency", setApart: "Stake Presidency" },
  "Stake Auditing":            { extend: "Stake Presidency", setApart: "Stake Presidency" },
}

const DEFAULT_AUTH: HandbookAuth = { extend: "Stake Presidency", setApart: "Stake Presidency or High Councilor" }

function getAuthority(callingName: string, org: string): HandbookAuth {
  if (CALLING_AUTH[callingName]) return CALLING_AUTH[callingName]
  for (const [key, auth] of Object.entries(CALLING_AUTH)) {
    if (callingName.toLowerCase().includes(key.toLowerCase())) return auth
  }
  if (ORG_AUTH[org]) return ORG_AUTH[org]
  return DEFAULT_AUTH
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function EditCallingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: "Calling",
    person_name: "",
    calling_name: "",
    ward: "",
    organization: "",
    status: "pending",
    extend_authority: "",
    assigned_to_extend: "",
    set_apart_authority: "",
    set_apart_by: "",
    sustained_date: "",
    set_apart_date: "",
    extended_date: "",
    released_date: "",
    presidency_approval: false,
    presidency_approval_date: "",
    bishop_approval: false,
    bishop_approval_date: "",
    high_council_approval: false,
    high_council_approval_date: "",
    calling_extended: false,
    ward_sustained: false,
    previous_release_verified: false,
    updated_in_lcr: false,
    ratified_in_stake_conference: false,
    protecting_children_training_complete: false,
    stake_training_complete: false,
    notes: "",
  })

  useEffect(() => { loadCalling() }, [id])

  const loadCalling = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("callings").select("*").eq("id", id).single()
      if (error) throw error
      if (data) {
        const d = (v: string | null) => v ? v.split("T")[0] : ""
        setFormData({
          type: data.type || "Calling",
          person_name: data.person_name || "",
          calling_name: data.calling_name || "",
          ward: data.ward || "",
          organization: data.organization || "",
          status: data.status || "pending",
          extend_authority: data.extend_authority || "",
          assigned_to_extend: data.assigned_to_extend || "",
          set_apart_authority: data.set_apart_authority || "",
          set_apart_by: data.set_apart_by || "",
          sustained_date: d(data.sustained_date),
          set_apart_date: d(data.set_apart_date),
          extended_date: d(data.extended_date),
          released_date: d(data.released_date),
          presidency_approval: data.presidency_approval || false,
          presidency_approval_date: d(data.presidency_approval_date),
          bishop_approval: data.bishop_approval || false,
          bishop_approval_date: d(data.bishop_approval_date),
          high_council_approval: data.high_council_approval || false,
          high_council_approval_date: d(data.high_council_approval_date),
          calling_extended: data.calling_extended || false,
          ward_sustained: data.ward_sustained || false,
          previous_release_verified: data.previous_release_verified || false,
          updated_in_lcr: data.updated_in_lcr || false,
          ratified_in_stake_conference: data.ratified_in_stake_conference || false,
          protecting_children_training_complete: data.protecting_children_training_complete || false,
          stake_training_complete: data.stake_training_complete || false,
          notes: data.notes || "",
        })
      }
    } catch (err: any) {
      setError("Failed to load: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStepIndex = (): number => {
    if (formData.set_apart_date) return 6
    if (formData.ward_sustained || formData.sustained_date) return 5
    if (formData.high_council_approval) return 4
    if (formData.bishop_approval) return 3
    if (formData.presidency_approval) return 2
    return 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.from("callings").update({
        type: formData.type || null,
        person_name: formData.person_name,
        calling_name: formData.calling_name,
        ward: formData.ward || null,
        organization: formData.organization || null,
        status: formData.status,
        extend_authority: formData.extend_authority || null,
        assigned_to_extend: formData.assigned_to_extend || null,
        set_apart_authority: formData.set_apart_authority || null,
        set_apart_by: formData.set_apart_by || null,
        sustained_date: formData.sustained_date || null,
        set_apart_date: formData.set_apart_date || null,
        extended_date: formData.extended_date || null,
        released_date: formData.released_date || null,
        presidency_approval: formData.presidency_approval,
        presidency_approval_date: formData.presidency_approval_date || null,
        bishop_approval: formData.bishop_approval,
        bishop_approval_date: formData.bishop_approval_date || null,
        high_council_approval: formData.high_council_approval,
        high_council_approval_date: formData.high_council_approval_date || null,
        calling_extended: formData.calling_extended,
        ward_sustained: formData.ward_sustained,
        previous_release_verified: formData.previous_release_verified,
        updated_in_lcr: formData.updated_in_lcr,
        ratified_in_stake_conference: formData.ratified_in_stake_conference,
        protecting_children_training_complete: formData.protecting_children_training_complete,
        stake_training_complete: formData.stake_training_complete,
        notes: formData.notes || null,
      }).eq("id", id)
      if (updateError) throw updateError
      router.push("/modules/leadership")
    } catch (err: any) {
      setError(err.message || "Failed to update")
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center py-12 text-gray-500">Loading...</div>
  }

  const currentStep = getStepIndex()

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Link href="/modules/leadership" className="inline-flex items-center text-sm text-indigo-600 hover:underline mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Callings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Calling</h1>
        <p className="mt-1 text-gray-600">Update details, workflow stage, and compliance</p>
      </div>

      {/* Workflow Stepper */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
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
                  <span className={`text-[10px] text-center leading-tight ${
                    done ? "text-green-700 font-medium" : active ? "text-yellow-700 font-medium" : "text-gray-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>{formData.person_name || "Calling"}</CardTitle>
          <CardDescription>{formData.calling_name}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className={inputClass}>
                  <option value="Calling">{englishMenuTitleCase("Calling")}</option>
                  <option value="Release">{englishMenuTitleCase("Release")}</option>
                  <option value="Assignment">{englishMenuTitleCase("Assignment")}</option>
                  <option value="MP">{englishMenuTitleCase("Melchizedek priesthood")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={inputClass}>
                  <option value="pending">{englishMenuTitleCase("Pending")}</option>
                  <option value="active">{englishMenuTitleCase("Active")}</option>
                  <option value="released">{englishMenuTitleCase("Released")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
                <select value={formData.ward} onChange={(e) => setFormData({ ...formData, ward: e.target.value })} className={inputClass}>
                  <option value="">{englishMenuTitleCase("Select ward...")}</option>
                  {WARDS.map((w) => (
                    <option key={w} value={w}>
                      {englishMenuTitleCase(w)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Person Name <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.person_name} onChange={(e) => setFormData({ ...formData, person_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calling / Office <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.calling_name} onChange={(e) => setFormData({ ...formData, calling_name: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <select value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} className={inputClass}>
                <option value="">{englishMenuTitleCase("Select...")}</option>
                {ORGANIZATIONS.map((org) => (
                  <option key={org} value={org}>
                    {englishMenuTitleCase(org)}
                  </option>
                ))}
              </select>
            </div>

            {/* Workflow Steps */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Calling Workflow (6 Steps)</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.presidency_approval} onChange={(e) => setFormData({ ...formData, presidency_approval: e.target.checked, presidency_approval_date: e.target.checked && !formData.presidency_approval_date ? new Date().toISOString().split("T")[0] : formData.presidency_approval_date })} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700">1. SP Considered</span>
                  </label>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input type="date" value={formData.presidency_approval_date} onChange={(e) => setFormData({ ...formData, presidency_approval_date: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.bishop_approval} onChange={(e) => setFormData({ ...formData, bishop_approval: e.target.checked, bishop_approval_date: e.target.checked && !formData.bishop_approval_date ? new Date().toISOString().split("T")[0] : formData.bishop_approval_date })} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700">2. Bishop Approved</span>
                  </label>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input type="date" value={formData.bishop_approval_date} onChange={(e) => setFormData({ ...formData, bishop_approval_date: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.high_council_approval} onChange={(e) => setFormData({ ...formData, high_council_approval: e.target.checked, high_council_approval_date: e.target.checked && !formData.high_council_approval_date ? new Date().toISOString().split("T")[0] : formData.high_council_approval_date })} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700">3. HC Sustained</span>
                  </label>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input type="date" value={formData.high_council_approval_date} onChange={(e) => setFormData({ ...formData, high_council_approval_date: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.ward_sustained} onChange={(e) => setFormData({ ...formData, ward_sustained: e.target.checked, sustained_date: e.target.checked && !formData.sustained_date ? new Date().toISOString().split("T")[0] : formData.sustained_date })} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700">4. Ward / Stake Sustained</span>
                  </label>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Sustained Date</label>
                    <input type="date" value={formData.sustained_date} onChange={(e) => setFormData({ ...formData, sustained_date: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.calling_extended} onChange={(e) => setFormData({ ...formData, calling_extended: e.target.checked, extended_date: e.target.checked && !formData.extended_date ? new Date().toISOString().split("T")[0] : formData.extended_date })} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700">5. Calling Extended</span>
                  </label>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Extended Date</label>
                    <input type="date" value={formData.extended_date} onChange={(e) => setFormData({ ...formData, extended_date: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">6. Set Apart Date</label>
                    <input type="date" value={formData.set_apart_date} onChange={(e) => setFormData({ ...formData, set_apart_date: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Released Date</label>
                    <input type="date" value={formData.released_date} onChange={(e) => setFormData({ ...formData, released_date: e.target.value })} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Handbook Authority — Extend & Set Apart */}
            {(() => {
              const auth = getAuthority(formData.calling_name, formData.organization)
              return (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Authority to Extend & Set Apart</h3>
                  <p className="text-xs text-gray-500 mb-4">Per General Handbook 30.8. Authority level is auto-selected based on the calling.</p>

                  <div className="space-y-4">
                    {/* Extend */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-3">Who Extends the Calling</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-blue-800 mb-1">Authority Level (Handbook)</label>
                          <select
                            value={formData.extend_authority || auth.extend}
                            onChange={(e) => setFormData({ ...formData, extend_authority: e.target.value })}
                            className={inputClass}
                          >
                            <option value={auth.extend}>
                              {englishMenuTitleCase(auth.extend)} ({englishMenuTitleCase("recommended")})
                            </option>
                            {AUTHORITY_LEVELS.filter((a) => a !== auth.extend).map((a) => (
                              <option key={a} value={a}>
                                {englishMenuTitleCase(a)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-blue-800 mb-1">Person Assigned to Extend</label>
                          <input
                            type="text"
                            value={formData.assigned_to_extend}
                            onChange={(e) => setFormData({ ...formData, assigned_to_extend: e.target.value })}
                            className={inputClass}
                            placeholder="Enter name"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Set Apart */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 mb-3">Who Sets Apart</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-green-800 mb-1">Authority Level (Handbook)</label>
                          <select
                            value={formData.set_apart_authority || auth.setApart}
                            onChange={(e) => setFormData({ ...formData, set_apart_authority: e.target.value })}
                            className={inputClass}
                          >
                            <option value={auth.setApart}>
                              {englishMenuTitleCase(auth.setApart)} ({englishMenuTitleCase("recommended")})
                            </option>
                            {AUTHORITY_LEVELS.filter((a) => a !== auth.setApart).map((a) => (
                              <option key={a} value={a}>
                                {englishMenuTitleCase(a)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-green-800 mb-1">Person Who Set Apart</label>
                          <input
                            type="text"
                            value={formData.set_apart_by}
                            onChange={(e) => setFormData({ ...formData, set_apart_by: e.target.value })}
                            className={inputClass}
                            placeholder="Enter name"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Compliance */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Compliance & Records</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "previous_release_verified", label: "Previous release verified" },
                  { key: "updated_in_lcr", label: "Updated in LCR" },
                  { key: "ratified_in_stake_conference", label: "Ratified in stake conference" },
                  { key: "protecting_children_training_complete", label: "Protecting Children training" },
                  { key: "stake_training_complete", label: "Stake training complete" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input type="checkbox" checked={(formData as any)[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className={inputClass} />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/modules/leadership")} disabled={saving}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
