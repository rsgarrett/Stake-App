"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function NewApplicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    applicant_name: "",
    application_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: userData } = await supabase.from("users").select("stake_id").eq("id", user.id).single()
      let stakeId = userData?.stake_id
      if (!stakeId) { const { data: s } = await supabase.from("stakes").select("id").limit(1).single(); stakeId = s?.id }
      if (!stakeId) throw new Error("No stake found")

      const { error: insertError } = await supabase.from("missionary_applications").insert({
        applicant_name: formData.applicant_name,
        application_date: formData.application_date,
        status: "pending",
        notes: formData.notes || null,
        stake_id: stakeId,
      })
      if (insertError) throw insertError
      router.push("/modules/missionary")
    } catch (err: any) {
      setError(err.message || "Failed to create application")
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <Link href="/modules/missionary" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Missionary
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Missionary Application</h1>
        <p className="mt-2 text-gray-600">Start the missionary recommendation process</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>This will start the application in the pipeline at "Pending" status</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-800">{error}</p></div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.applicant_name} onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })} className={inputClass} placeholder="Full name of prospective missionary" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Date</label>
              <input type="date" value={formData.application_date} onChange={(e) => setFormData({ ...formData, application_date: e.target.value })} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className={inputClass}
                placeholder="Interview notes, readiness assessment, special considerations..." />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Application"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/modules/missionary")} disabled={loading}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
