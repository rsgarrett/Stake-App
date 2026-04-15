import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function CalendarPage() {
  const supabase = await createClient()
  // Authentication temporarily disabled for testing
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // Fetch upcoming events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(10)

  // Fetch calendar conflicts
  const { data: conflicts } = await supabase
    .from("calendar_conflicts")
    .select("*, events!calendar_conflicts_event1_id_fkey(*), events!calendar_conflicts_event2_id_fkey(*)")
    .eq("resolved", false)
    .limit(10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar & Scheduling</h1>
          <p className="mt-2 text-gray-600">Manage stake calendar and detect conflicts</p>
        </div>
        <Button asChild>
          <Link href="/modules/calendar/new-event">New Event</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next scheduled stake events</CardDescription>
          </CardHeader>
          <CardContent>
            {events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border-b pb-3">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {event.event_type}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                    </div>
                    {event.location && (
                      <div className="text-xs text-gray-500">
                        Location: {event.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming events</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar Conflicts</CardTitle>
            <CardDescription>Detected scheduling conflicts</CardDescription>
          </CardHeader>
          <CardContent>
            {conflicts && conflicts.length > 0 ? (
              <div className="space-y-4">
                {conflicts.map((conflict: any) => (
                  <div key={conflict.id} className="border-b pb-3">
                    <div className="font-medium text-red-600">Conflict Detected</div>
                    <div className="text-sm text-gray-600 capitalize">
                      Type: {conflict.conflict_type}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Event 1: {conflict.events?.title || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Event 2: {conflict.events?.title || "Unknown"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No conflicts detected</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

