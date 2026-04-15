"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Calendar, ChevronRight } from "lucide-react"

interface SpecialEvent {
  id: string
  title: string
  event_type: string
  start_date: string
  end_date: string
  status: string
}

export default function ConferencesPage() {
  const [events, setEvents] = useState<SpecialEvent[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await safeQuery(
      supabase
        .from("special_events")
        .select("id, title, event_type, start_date, end_date, status")
        .order("start_date", { ascending: false })
    )
    setEvents(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="p-6 text-center py-12 text-gray-500">Loading...</div>

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conferences & Special Events</h1>
          <p className="mt-2 text-gray-600">Plan conferences and coordinate special events</p>
        </div>
        <Link href="/modules/conferences/new-event" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No events yet. Click &ldquo;New Event&rdquo; to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link key={event.id} href={`/modules/conferences/${event.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.start_date + "T00:00:00").toLocaleDateString()} – {new Date(event.end_date + "T00:00:00").toLocaleDateString()}
                      <span className="mx-1.5">·</span>
                      <span className="capitalize">{event.event_type.replace(/_/g, " ")}</span>
                      <span className="mx-1.5">·</span>
                      <span className="capitalize">{event.status}</span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
