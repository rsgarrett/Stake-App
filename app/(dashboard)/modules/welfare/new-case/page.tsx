"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function NewWelfareCasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    case_number: "",
    status: "pending" as "open" | "closed" | "pending",
    case_notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: userData } = await supabase.from("users").select("stake_id, role").eq("id", user.id).single()
      if (!["stake_president", "counselor"].includes(userData?.role || "")) {
        throw new Error("Unauthorized: Only the stake presidency can create welfare cases")
      }

      let stakeId = userData?.stake_id
      if (!stakeId) {
        const { data: stake } = await supabase.from("stakes").select("id").limit(1).single()
        stakeId = stake?.id
      }
      if (!stakeId) throw new Error("No stake found")

      const caseNumber = formData.case_number || `WC-${Date.now().toString(36).toUpperCase()}`

      const { error: insertError } = await supabase.from("welfare_cases").insert({
        case_number: caseNumber,
        stake_id: stakeId,
        status: formData.status,
        case_notes: formData.case_notes,
        created_by: user.id,
      })
      if (insertError) throw insertError

      router.push("/modules/welfare")
    } catch (err: any) {
      setError(err.message || "Failed to create case")
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <Link href="/modules/welfare" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Welfare
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Welfare Case</h1>
        <p className="mt-2 text-gray-600">Create a new welfare assistance case. All notes are confidential.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Case Details</CardTitle>
          <CardDescription>Only the stake presidency can view welfare cases</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-800">{error}</p></div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Case Number (auto-generated if blank)</label>
              <input type="text" value={formData.case_number} onChange={(e) => setFormData({ ...formData, case_number: e.target.value })} className={inputClass} placeholder="WC-XXXXX" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className={inputClass}>
                <option value="pending">{englishMenuTitleCase("Pending review")}</option>
                <option value="open">{englishMenuTitleCase("Open / active")}</option>
                <option value="closed">{englishMenuTitleCase("Closed")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Case Notes <span className="text-red-500">*</span></label>
              <textarea rows={8} required value={formData.case_notes} onChange={(e) => setFormData({ ...formData, case_notes: e.target.value })} className={inputClass}
                placeholder="Describe the situation, assistance needed, and any relevant details...&#10;&#10;These notes are confidential and restricted to stake presidency." />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Case"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/modules/welfare")} disabled={loading}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
