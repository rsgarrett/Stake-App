import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function InterviewsPage() {
  const supabase = await createClient()
  // Authentication temporarily disabled for testing
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // Fetch upcoming interviews
  const { data: interviews } = await supabase
    .from("interviews")
    .select("*")
    .eq("status", "scheduled")
    .gte("scheduled_date", new Date().toISOString())
    .order("scheduled_date", { ascending: true })
    .limit(10)

  // Scheduled interviews that are past due (still not completed or cancelled)
  const { data: missed } = await supabase
    .from("interviews")
    .select("*")
    .eq("status", "scheduled")
    .lt("scheduled_date", new Date().toISOString())
    .order("scheduled_date", { ascending: true })
    .limit(10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
          <p className="mt-2 text-gray-600">Schedule and manage interviews</p>
        </div>
        <Button asChild>
          <Link href="/modules/interviews/schedule">Schedule Interview</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
            <CardDescription>Scheduled interviews</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>Missed interviews</CardTitle>
            <CardDescription>Scheduled past their time — follow up, complete, or reschedule</CardDescription>
          </CardHeader>
          <CardContent>
            {missed && missed.length > 0 ? (
              <div className="space-y-4">
                {missed.map((interview) => (
                  <div key={interview.id} className="border-b pb-3">
                    <div className="font-medium">{interview.interviewee_name}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {interview.interview_type.replace("_", " ")}
                    </div>
                    <div className="text-xs text-amber-700 mt-1 font-medium">
                      Was scheduled {new Date(interview.scheduled_date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No missed interviews</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

