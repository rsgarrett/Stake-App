import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function TemplePage() {
  const supabase = await createClient()
  // Authentication temporarily disabled for testing
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // Fetch temple attendance
  const { data: attendance } = await supabase
    .from("temple_attendance")
    .select("*")
    .order("event_date", { ascending: false })
    .limit(10)

  // Fetch upcoming temple interviews
  const { data: interviews } = await supabase
    .from("temple_interviews")
    .select("*")
    .eq("status", "scheduled")
    .gte("scheduled_date", new Date().toISOString())
    .order("scheduled_date", { ascending: true })
    .limit(10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Temple & Family History</h1>
          <p className="mt-2 text-gray-600">Track temple attendance and manage interviews</p>
        </div>
        <Button asChild>
          <Link href="/modules/temple/schedule-interview">Schedule Interview</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Temple Attendance</CardTitle>
            <CardDescription>Recent temple attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance && attendance.length > 0 ? (
              <div className="space-y-4">
                {attendance.map((record) => (
                  <div key={record.id} className="border-b pb-3">
                    <div className="font-medium">{record.event_type}</div>
                    <div className="text-sm text-gray-600">
                      {record.attendance_count} attendees
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(record.event_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No attendance records found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
            <CardDescription>Scheduled temple interviews</CardDescription>
          </CardHeader>
          <CardContent>
            {interviews && interviews.length > 0 ? (
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <div key={interview.id} className="border-b pb-3">
                    <div className="font-medium">{interview.interviewee_name}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {interview.interview_type.replace("_", " ")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(interview.scheduled_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming interviews</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

