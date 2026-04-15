"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { defaultStakeConferenceSessionDate, normalizeStakeConferenceWeekend } from "@/lib/conferences/stake-conference-schedule"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    theme: "",
    presiding_authority: "",
    event_type: "stake_conference",
    setup: "template" as "template" | "blank",
    start_date: "",
    end_date: "",
    location: "",
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

      let insertStart = formData.start_date
      let insertEnd = formData.end_date || formData.start_date
      if (formData.event_type === "stake_conference" && formData.start_date) {
        const w = normalizeStakeConferenceWeekend(formData.start_date)
        if (w) {
          insertStart = w.saturday
          insertEnd = w.sunday
        }
      }

      const { data: newEvent, error: insertError } = await supabase.from("special_events").insert({
        title: formData.title,
        description: formData.description || null,
        theme: formData.theme || null,
        presiding_authority: formData.presiding_authority || null,
        event_type: formData.event_type,
        start_date: insertStart,
        end_date: insertEnd,
        location: formData.location || null,
        stake_id: stakeId,
        status: "planned",
      }).select().single()

      if (insertError) throw insertError

      if (newEvent && formData.event_type === "stake_conference" && formData.setup === "template") {
        const sat = insertStart
        const sun = insertEnd
        const sessionDefaults = [
          { session_type: "ministering_visits", session_label: "Ministering Visits", start_time: "12:00", end_time: "14:00", display_order: 1 },
          { session_type: "presidency_meeting", session_label: "Stake Presidency Meeting", start_time: "14:30", end_time: "15:30", display_order: 2 },
          { session_type: "leadership_session", session_label: "Leadership Session", start_time: "16:00", end_time: "18:00", display_order: 3 },
          { session_type: "dinner", session_label: "Dinner", start_time: "17:30", end_time: "18:30", display_order: 4 },
          { session_type: "adult_session", session_label: "Adult Session", start_time: "19:00", end_time: "21:00", display_order: 5 },
          { session_type: "general_session", session_label: "General Session", start_time: "10:00", end_time: "12:00", display_order: 6 },
        ].map((s) => ({
          ...s,
          session_date: defaultStakeConferenceSessionDate(s.session_type, sat, sun),
        }))

        const { data: createdSessions } = await supabase
          .from("conference_sessions")
          .insert(sessionDefaults.map((s) => ({ ...s, event_id: newEvent.id })))
          .select()

        if (createdSessions) {
          const programTemplates: Record<string, Array<{ item_type: string; duration_minutes: number; display_order: number }>> = {
            leadership_session: [
              { item_type: "prelude_music", duration_minutes: 0, display_order: 1 },
              { item_type: "presiding", duration_minutes: 0, display_order: 2 },
              { item_type: "conducting", duration_minutes: 0, display_order: 3 },
              { item_type: "pianist", duration_minutes: 0, display_order: 4 },
              { item_type: "organist", duration_minutes: 0, display_order: 5 },
              { item_type: "music_leader", duration_minutes: 0, display_order: 6 },
              { item_type: "opening_hymn", duration_minutes: 5, display_order: 7 },
              { item_type: "invocation", duration_minutes: 0, display_order: 8 },
              { item_type: "breakout", duration_minutes: 0, display_order: 9 },
              { item_type: "discussion", duration_minutes: 0, display_order: 10 },
              { item_type: "breakout", duration_minutes: 0, display_order: 11 },
              { item_type: "discussion", duration_minutes: 0, display_order: 12 },
              { item_type: "breakout", duration_minutes: 0, display_order: 13 },
              { item_type: "discussion", duration_minutes: 0, display_order: 14 },
              { item_type: "closing_remarks", duration_minutes: 0, display_order: 15 },
              { item_type: "closing_hymn", duration_minutes: 5, display_order: 16 },
              { item_type: "benediction", duration_minutes: 0, display_order: 17 },
            ],
            adult_session: [
              { item_type: "prelude_music", duration_minutes: 0, display_order: 1 },
              { item_type: "presiding", duration_minutes: 0, display_order: 2 },
              { item_type: "conducting", duration_minutes: 0, display_order: 3 },
              { item_type: "pianist", duration_minutes: 0, display_order: 4 },
              { item_type: "organist", duration_minutes: 0, display_order: 5 },
              { item_type: "music_leader", duration_minutes: 0, display_order: 6 },
              { item_type: "opening_hymn", duration_minutes: 5, display_order: 7 },
              { item_type: "invocation", duration_minutes: 0, display_order: 8 },
              { item_type: "speaker", duration_minutes: 7, display_order: 9 },
              { item_type: "speaker", duration_minutes: 10, display_order: 10 },
              { item_type: "speaker", duration_minutes: 7, display_order: 11 },
              { item_type: "speaker", duration_minutes: 15, display_order: 12 },
              { item_type: "intermediate_hymn", duration_minutes: 5, display_order: 13 },
              { item_type: "speaker", duration_minutes: 15, display_order: 14 },
              { item_type: "speaker", duration_minutes: 15, display_order: 15 },
              { item_type: "speaker", duration_minutes: 20, display_order: 16 },
              { item_type: "closing_hymn", duration_minutes: 5, display_order: 17 },
              { item_type: "benediction", duration_minutes: 0, display_order: 18 },
            ],
            presidency_meeting: [
              { item_type: "discussion", duration_minutes: 5, display_order: 1 },
              { item_type: "discussion", duration_minutes: 10, display_order: 2 },
              { item_type: "discussion", duration_minutes: 10, display_order: 3 },
              { item_type: "discussion", duration_minutes: 10, display_order: 4 },
              { item_type: "instruction", duration_minutes: 10, display_order: 5 },
              { item_type: "discussion", duration_minutes: 10, display_order: 6 },
            ],
            general_session: [
              { item_type: "prelude_music", duration_minutes: 0, display_order: 1 },
              { item_type: "presiding", duration_minutes: 0, display_order: 2 },
              { item_type: "conducting", duration_minutes: 0, display_order: 3 },
              { item_type: "pianist", duration_minutes: 0, display_order: 4 },
              { item_type: "organist", duration_minutes: 0, display_order: 5 },
              { item_type: "music_leader", duration_minutes: 0, display_order: 6 },
              { item_type: "opening_hymn", duration_minutes: 5, display_order: 7 },
              { item_type: "invocation", duration_minutes: 0, display_order: 8 },
              { item_type: "stake_business", duration_minutes: 10, display_order: 9 },
              { item_type: "speaker_primary", duration_minutes: 5, display_order: 10 },
              { item_type: "speaker_youth", duration_minutes: 7, display_order: 11 },
              { item_type: "speaker", duration_minutes: 15, display_order: 12 },
              { item_type: "speaker", duration_minutes: 10, display_order: 13 },
              { item_type: "intermediate_hymn", duration_minutes: 5, display_order: 14 },
              { item_type: "speaker", duration_minutes: 10, display_order: 15 },
              { item_type: "speaker", duration_minutes: 15, display_order: 16 },
              { item_type: "special_musical_number", duration_minutes: 5, display_order: 17 },
              { item_type: "speaker", duration_minutes: 30, display_order: 18 },
              { item_type: "closing_hymn", duration_minutes: 5, display_order: 19 },
              { item_type: "benediction", duration_minutes: 0, display_order: 20 },
            ],
          }

          const allItems: Array<{ session_id: string; item_type: string; duration_minutes: number; display_order: number; invite_status: string }> = []
          createdSessions.forEach((session) => {
            const template = programTemplates[session.session_type]
            if (template) {
              template.forEach((item) => {
                allItems.push({ ...item, session_id: session.id, invite_status: "not_invited" })
              })
            }
          })

          if (allItems.length > 0) {
            await supabase.from("conference_program_items").insert(allItems)
          }
        }
      }

      if (newEvent && formData.event_type === "stake_conference") {
        router.push(`/modules/conferences/${newEvent.id}`)
      } else if (newEvent) {
        router.push("/modules/conferences")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create event")
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <Link href="/modules/conferences" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Conferences
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Event</h1>
        <p className="mt-2 text-gray-600">Plan a stake conference, fireside, or special event</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-800">{error}</p></div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClass} placeholder="e.g., April 2026 Stake Conference" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={formData.event_type}
                onChange={(e) => {
                  const t = e.target.value
                  setFormData((prev) => {
                    const next = { ...prev, event_type: t }
                    if (t === "stake_conference" && prev.start_date) {
                      const w = normalizeStakeConferenceWeekend(prev.start_date)
                      if (w) {
                        next.start_date = w.saturday
                        next.end_date = w.sunday
                      }
                    }
                    return next
                  })
                }}
                className={inputClass}
              >
                <option value="stake_conference">Stake Conference</option>
                <option value="fireside">Fireside</option>
                <option value="broadcast">Broadcast</option>
                <option value="devotional">Devotional</option>
                <option value="training">Training</option>
                <option value="other">Other</option>
              </select>
            </div>

            {formData.event_type === "stake_conference" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Setup (each of the 2 conferences per year can be different)</label>
                <select value={formData.setup} onChange={(e) => setFormData({ ...formData, setup: e.target.value as "template" | "blank" })} className={inputClass}>
                  <option value="template">Suggested template — Ministering visits, Presidency meeting, Leadership, Adult & General sessions</option>
                  <option value="blank">Start blank — Add only the sessions you need for this conference</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Handbook 29.3.1: Stake conference is held twice each year. The stake president presides and plans the meetings. He may invite visiting General Authorities or Area Seventies.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conference Theme</label>
              <input type="text" value={formData.theme} onChange={(e) => setFormData({ ...formData, theme: e.target.value })} className={inputClass} placeholder="e.g., Ministering in a Higher and Holier Way" />
            </div>

            {formData.event_type === "stake_conference" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presiding Authority</label>
                <select value={formData.presiding_authority} onChange={(e) => setFormData({ ...formData, presiding_authority: e.target.value })} className={inputClass}>
                  <option value="">Select who will preside...</option>
                  <option value="Stake President">Stake President</option>
                  <option value="Area Seventy">Area Seventy</option>
                  <option value="General Authority">General Authority</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.presiding_authority === "Stake President"
                    ? "Handbook 29.3.1: The stake president and counselors select topics. Leadership meeting includes priesthood leaders only."
                    : formData.presiding_authority === "Area Seventy" || formData.presiding_authority === "General Authority"
                    ? "Handbook 29.3.1: The presiding officer directs all planning and approves participants and music. Leadership meeting includes ALL stake council and ward council members."
                    : "This determines who directs planning and the scope of the leadership meeting."}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClass} rows={2} placeholder="Optional notes or description..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => {
                    const v = e.target.value
                    setFormData((prev) => {
                      if (prev.event_type !== "stake_conference" || !v) {
                        return { ...prev, start_date: v }
                      }
                      const w = normalizeStakeConferenceWeekend(v)
                      if (!w) return { ...prev, start_date: v }
                      return { ...prev, start_date: w.saturday, end_date: w.sunday }
                    })
                  }}
                  className={inputClass}
                />
                {formData.event_type === "stake_conference" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pick any day in the weekend week: dates are saved as that weekend&apos;s <strong>Saturday–Sunday</strong> (e.g. choosing Friday moves to the following Saturday and Sunday).
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className={inputClass}
                />
                {formData.event_type === "stake_conference" && (
                  <p className="text-xs text-gray-500 mt-1">Sunday of the same weekend (updates when start date changes).</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className={inputClass} placeholder="Stake Center" />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Event"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/modules/conferences")} disabled={loading}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
