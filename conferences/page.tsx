import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ConferencesPage() {
  const supabase = await createClient()
  // Authentication temporarily disabled for testing
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // Fetch special events
  const { data: events } = await supabase
    .from("special_events")
    .select("*")
    .order("start_date", { ascending: true })
    .limit(10)

  // Fetch event speakers
  const { data: speakers } = await supabase
    .from("event_speakers")
    .select("*, special_events(*)")
    .order("display_order", { ascending: true })
    .limit(10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conferences & Special Events</h1>
          <p className="mt-2 text-gray-600">Plan conferences and coordinate special events</p>
        </div>
        <Button asChild>
          <Link href="/modules/conferences/new-event">New Event</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Special Events</CardTitle>
            <CardDescription>Planned conferences and events</CardDescription>
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
                    <div className="text-xs text-gray-500 capitalize">
                      Status: {event.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No events found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Speakers</CardTitle>
            <CardDescription>Speaker assignments for events</CardDescription>
          </CardHeader>
          <CardContent>
            {speakers && speakers.length > 0 ? (
              <div className="space-y-4">
                {speakers.map((speaker: any) => (
                  <div key={speaker.id} className="border-b pb-3">
                    <div className="font-medium">{speaker.speaker_name}</div>
                    <div className="text-sm text-gray-600">
                      Event: {speaker.special_events?.title}
                    </div>
                    {speaker.topic && (
                      <div className="text-xs text-gray-500 mt-1">
                        Topic: {speaker.topic}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Session: {speaker.session}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No speakers assigned</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

