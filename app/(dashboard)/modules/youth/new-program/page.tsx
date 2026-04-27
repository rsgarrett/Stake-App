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

const PROGRAM_TYPES = ["FSY", "Youth Conference", "Camp", "Service Project", "Multi-Stake Activity", "Other"]

export default function NewProgramPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    program_name: "",
    program_type: "Youth Conference",
    start_date: "",
    end_date: "",
    status: "planned" as "active" | "completed" | "planned",
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

      const { error: insertError } = await supabase.from("youth_programs").insert({
        program_name: formData.program_name,
        program_type: formData.program_type,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
        stake_id: stakeId,
      })
      if (insertError) throw insertError
      router.push("/modules/youth")
    } catch (err: any) {
      setError(err.message || "Failed to create program")
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <Link href="/modules/youth" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Youth
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Youth Program</h1>
        <p className="mt-2 text-gray-600">Plan a new youth event or program</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Program Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-800">{error}</p></div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Name <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.program_name} onChange={(e) => setFormData({ ...formData, program_name: e.target.value })} className={inputClass} placeholder="e.g., 2026 Stake Youth Conference" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.program_type} onChange={(e) => setFormData({ ...formData, program_type: e.target.value })} className={inputClass}>
                  {PROGRAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {englishMenuTitleCase(t)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className={inputClass}>
                  <option value="planned">{englishMenuTitleCase("Planned")}</option>
                  <option value="active">{englishMenuTitleCase("Active")}</option>
                  <option value="completed">{englishMenuTitleCase("Completed")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Program"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/modules/youth")} disabled={loading}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
