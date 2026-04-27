"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

const ORGANIZATIONS = [
  "Stake Presidency",
  "High Council",
  "Stake Clerk",
  "Stake Executive Secretary",
  "Relief Society",
  "Elders Quorum",
  "Young Men",
  "Young Women",
  "Primary",
  "Sunday School",
  "Music",
  "Seminary & Institute",
  "Facilities",
  "Other",
]

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function NewCallingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: "Calling" as "Calling" | "Release" | "Assignment" | "MP",
    person_name: "",
    calling_name: "",
    organization: "",
    status: "pending" as "active" | "released" | "pending",
    assigned_to_extend: "",
    sustained_date: "",
    set_apart_date: "",
    extended_date: "",
    released_date: "",
    protecting_children_training_complete: false,
    stake_training_complete: false,
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      let stakeId: string | null = null

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("stake_id")
          .eq("id", user.id)
          .single()
        stakeId = userData?.stake_id || null
      }

      if (!stakeId) {
        const { data: stakes } = await supabase
          .from("stakes")
          .select("id")
          .limit(1)
          .single()
        if (stakes) stakeId = stakes.id
      }

      if (!stakeId) {
        throw new Error("Unable to determine stake. Please ensure a stake exists in the database.")
      }

      const callingData: any = {
        type: formData.type,
        person_name: formData.person_name,
        calling_name: formData.calling_name,
        organization: formData.organization || null,
        stake_id: stakeId,
        status: formData.status,
        assigned_to_extend: formData.assigned_to_extend || null,
        sustained_date: formData.sustained_date || null,
        set_apart_date: formData.set_apart_date || null,
        extended_date: formData.extended_date || null,
        released_date: formData.released_date || null,
        protecting_children_training_complete: formData.protecting_children_training_complete,
        stake_training_complete: formData.stake_training_complete,
        notes: formData.notes || null,
        submitted_by: user?.id || null,
        workflow_status: "submitted",
      }

      const { error: insertError } = await supabase.from("callings").insert(callingData)
      if (insertError) throw insertError

      router.push("/modules/leadership/workflow")
    } catch (err: any) {
      setError(err.message || "Failed to create calling")
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Calling</h1>
        <p className="mt-2 text-gray-600">Record a new calling, release, assignment, or priesthood action</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Calling Information</CardTitle>
          <CardDescription>Enter the details. Approvals can be managed from the Workflow or Tracker pages.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Row 1: Type & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select id="type" required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className={inputClass}>
                  <option value="Calling">{englishMenuTitleCase("Calling")}</option>
                  <option value="Release">{englishMenuTitleCase("Release")}</option>
                  <option value="Assignment">{englishMenuTitleCase("Assignment")}</option>
                  <option value="MP">{englishMenuTitleCase("Melchizedek priesthood")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select id="status" required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className={inputClass}>
                  <option value="pending">{englishMenuTitleCase("Pending")}</option>
                  <option value="active">{englishMenuTitleCase("Active")}</option>
                  <option value="released">{englishMenuTitleCase("Released")}</option>
                </select>
              </div>
            </div>

            {/* Person Name */}
            <div>
              <label htmlFor="person_name" className="block text-sm font-medium text-gray-700 mb-1">
                Person Name <span className="text-red-500">*</span>
              </label>
              <input type="text" id="person_name" required value={formData.person_name} onChange={(e) => setFormData({ ...formData, person_name: e.target.value })} className={inputClass} placeholder="Full name" />
            </div>

            {/* Calling Name */}
            <div>
              <label htmlFor="calling_name" className="block text-sm font-medium text-gray-700 mb-1">
                Calling / Office <span className="text-red-500">*</span>
              </label>
              <input type="text" id="calling_name" required value={formData.calling_name} onChange={(e) => setFormData({ ...formData, calling_name: e.target.value })} className={inputClass} placeholder="e.g., Stake RS President, Elder" />
            </div>

            {/* Organization */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <select id="organization" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} className={inputClass}>
                <option value="">{englishMenuTitleCase("Select organization...")}</option>
                {ORGANIZATIONS.map((org) => (
                  <option key={org} value={org}>
                    {englishMenuTitleCase(org)}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned To Extend */}
            <div>
              <label htmlFor="assigned_to_extend" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned to Extend
              </label>
              <input type="text" id="assigned_to_extend" value={formData.assigned_to_extend} onChange={(e) => setFormData({ ...formData, assigned_to_extend: e.target.value })} className={inputClass} placeholder="Who will extend the calling" />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="extended_date" className="block text-sm font-medium text-gray-700 mb-1">Extended Date</label>
                <input type="date" id="extended_date" value={formData.extended_date} onChange={(e) => setFormData({ ...formData, extended_date: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="sustained_date" className="block text-sm font-medium text-gray-700 mb-1">Sustained Date</label>
                <input type="date" id="sustained_date" value={formData.sustained_date} onChange={(e) => setFormData({ ...formData, sustained_date: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="set_apart_date" className="block text-sm font-medium text-gray-700 mb-1">Set Apart Date</label>
                <input type="date" id="set_apart_date" value={formData.set_apart_date} onChange={(e) => setFormData({ ...formData, set_apart_date: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="released_date" className="block text-sm font-medium text-gray-700 mb-1">Released Date</label>
                <input type="date" id="released_date" value={formData.released_date} onChange={(e) => setFormData({ ...formData, released_date: e.target.value })} className={inputClass} />
              </div>
            </div>

            {/* Training checkboxes */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Training & Compliance</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" checked={formData.protecting_children_training_complete} onChange={(e) => setFormData({ ...formData, protecting_children_training_complete: e.target.checked })} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                  <span className="text-sm text-gray-700">Protecting Children & Youth training complete</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" checked={formData.stake_training_complete} onChange={(e) => setFormData({ ...formData, stake_training_complete: e.target.checked })} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                  <span className="text-sm text-gray-700">Stake-required training complete</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea id="notes" rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className={inputClass} placeholder="Additional notes..." />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Calling"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/modules/leadership")} disabled={loading}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
