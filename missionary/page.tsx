import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MissionaryPage() {
  const supabase = await createClient()
  // Authentication temporarily disabled for testing
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // Fetch missionary applications
  const { data: applications } = await supabase
    .from("missionary_applications")
    .select("*")
    .order("application_date", { ascending: false })
    .limit(10)

  // Fetch full-time missionaries
  const { data: missionaries } = await supabase
    .from("full_time_missionaries")
    .select("*")
    .eq("status", "serving")
    .order("start_date", { ascending: false })
    .limit(10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Missionary Work</h1>
          <p className="mt-2 text-gray-600">Manage missionary applications and track missionary efforts</p>
        </div>
        <Button asChild>
          <Link href="/modules/missionary/new-application">New Application</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Missionary Applications</CardTitle>
            <CardDescription>Recent missionary recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {applications && applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="border-b pb-3">
                    <div className="font-medium">{app.applicant_name}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(app.application_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">
                      Status: {app.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No applications found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Full-Time Missionaries</CardTitle>
            <CardDescription>Currently serving missionaries</CardDescription>
          </CardHeader>
          <CardContent>
            {missionaries && missionaries.length > 0 ? (
              <div className="space-y-4">
                {missionaries.map((missionary) => (
                  <div key={missionary.id} className="border-b pb-3">
                    <div className="font-medium">{missionary.missionary_name}</div>
                    <div className="text-sm text-gray-600">{missionary.mission_name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Started: {new Date(missionary.start_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No missionaries found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

