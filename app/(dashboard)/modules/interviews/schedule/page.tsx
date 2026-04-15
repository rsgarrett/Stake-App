"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const INTERVIEW_TYPES = [
  { value: "temple_recommend", label: "Temple Recommend" },
  { value: "calling", label: "Calling Interview" },
  { value: "youth", label: "Youth Interview" },
  { value: "membership_council", label: "Membership Council" },
  { value: "worthiness", label: "Worthiness Interview" },
  { value: "missionary", label: "Missionary Interview" },
  { value: "new_member", label: "New Member Interview" },
  { value: "other", label: "Other" },
]

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function ScheduleInterviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    interviewee_name: "",
    interview_type: "temple_recommend",
    scheduled_date: "",
    location: "",
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

      const { error: insertError } = await supabase.from("interviews").insert({
        interviewee_name: formData.interviewee_name,
        interview_type: formData.interview_type,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        interviewer_id: user.id,
        status: "scheduled",
      })
      if (insertError) throw insertError

      // Create schedule record with location if provided
      if (formData.location) {
        // Try to create schedule record - may not exist yet
        try {
          const { data: interviewData } = await supabase
            .from("interviews")
            .select("id")
            .eq("interviewee_name", formData.interviewee_name)
            .eq("scheduled_date", new Date(formData.scheduled_date).toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          if (interviewData) {
            await supabase.from("interview_schedules").insert({
              interview_id: interviewData.id,
              time_slot: new Date(formData.scheduled_date).toISOString(),
              location: formData.location,
            })
          }
        } catch {
          // interview_schedules table may not exist, that's okay
        }
      }

      router.push("/modules/interviews")
    } catch (err: any) {
      setError(err.message || "Failed to schedule interview")
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <Link href="/modules/interviews" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Interviews
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Schedule Interview</h1>
        <p className="mt-2 text-gray-600">Create a new interview appointment</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
          <CardDescription>Enter the information for the interview</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interviewee Name <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={formData.interviewee_name}
                onChange={(e) => setFormData({ ...formData, interviewee_name: e.target.value })}
                className={inputClass} placeholder="Full name of person being interviewed" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Type <span className="text-red-500">*</span>
              </label>
              <select value={formData.interview_type}
                onChange={(e) => setFormData({ ...formData, interview_type: e.target.value })}
                className={inputClass}>
                {INTERVIEW_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time <span className="text-red-500">*</span>
              </label>
              <input type="datetime-local" required value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={inputClass} placeholder="e.g., Stake Center Office #2" />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Scheduling..." : "Schedule Interview"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/modules/interviews")} disabled={loading}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
