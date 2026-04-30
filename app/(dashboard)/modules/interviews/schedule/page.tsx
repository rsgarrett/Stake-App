"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { INTERVIEW_TYPE_OPTIONS, MISSION_INTERVIEW_TYPE } from "@/lib/interviews/interview-types"
import { ensureMissionReadyMissionary } from "@/lib/missionary/mission-ready-defaults"

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function ScheduleInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex min-h-[40vh] items-center justify-center text-gray-500 text-sm">
          Loading…
        </div>
      }
    >
      <ScheduleInterviewContent />
    </Suspense>
  )
}

function ScheduleInterviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    interviewee_name: "",
    interview_type: INTERVIEW_TYPE_OPTIONS[0].value as string,
    scheduled_date: "",
    location: "",
    notes: "",
  })

  useEffect(() => {
    const name = searchParams.get("interviewee") || searchParams.get("missionary") || ""
    const type = searchParams.get("type") || ""
    if (!name && !type) return
    setFormData((prev) => ({
      ...prev,
      interviewee_name: name || prev.interviewee_name,
      interview_type: type === MISSION_INTERVIEW_TYPE ? MISSION_INTERVIEW_TYPE : prev.interview_type,
    }))
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("stake_id")
        .eq("id", user.id)
        .single()

      if (profileError || !profile?.stake_id) {
        throw new Error(
          "Your account is not linked to a stake (missing stake_id). An administrator can set this in the users table so interviews can be saved."
        )
      }

      const scheduledIso = new Date(formData.scheduled_date).toISOString()

      const { data: created, error: insertError } = await supabase
        .from("interviews")
        .insert({
          interviewee_name: formData.interviewee_name,
          interview_type: formData.interview_type,
          scheduled_date: scheduledIso,
          interviewer_id: user.id,
          status: "scheduled",
          stake_id: profile.stake_id,
        })
        .select("id")
        .single()

      if (insertError) throw insertError

      if (formData.location && created?.id) {
        try {
          const { error: schedError } = await supabase.from("interview_schedules").insert({
            interview_id: created.id,
            time_slot: scheduledIso,
            location: formData.location,
          })
          if (schedError) console.warn("interview_schedules:", schedError.message)
        } catch {
          /* table may be missing in older DBs */
        }
      }

      if (formData.interview_type === MISSION_INTERVIEW_TYPE) {
        const { id } = await ensureMissionReadyMissionary(supabase, {
          missionaryName: formData.interviewee_name,
          stakeId: profile.stake_id,
        })
        router.push(`/modules/missionary/mission-ready/${id}?from=interview-schedule`)
        return
      }

      router.push("/modules/interviews")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to schedule interview"
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <Link
        href="/modules/interviews"
        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4"
      >
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
              <input
                type="text"
                required
                value={formData.interviewee_name}
                onChange={(e) => setFormData({ ...formData, interviewee_name: e.target.value })}
                className={inputClass}
                placeholder="Full name of person being interviewed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.interview_type}
                onChange={(e) => setFormData({ ...formData, interview_type: e.target.value })}
                className={inputClass}
              >
                {INTERVIEW_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {formData.interview_type === MISSION_INTERVIEW_TYPE && (
                <p className="mt-2 text-xs text-gray-600">
                  After you set <strong>date and time</strong> and click <strong>Schedule Interview</strong>, the
                  interview is saved and you are taken to the <strong>Mission Ready</strong> tracker for this person.
                  If they are not already on the list, they are added automatically.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={inputClass}
                placeholder="e.g., Stake Center Office #2"
              />
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Scheduling..." : "Schedule Interview"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/modules/interviews")} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
