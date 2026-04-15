import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function WelfarePage() {
  const supabase = await createClient()
  // Authentication temporarily disabled for testing
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // Check user role for welfare access (disabled - auth bypassed)
  // const { data: userData } = await supabase
  //   .from("users")
  //   .select("role")
  //   .eq("id", user.id)
  //   .single()

  // Allow access during auth bypass
  const canViewWelfare = true // userData?.role === "stake_president" || userData?.role === "counselor"

  // Fetch welfare cases (restricted)
  const { data: welfareCases } = canViewWelfare
    ? await supabase
        .from("welfare_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: null }

  // Fetch self-reliance participants
  const { data: participants } = await supabase
    .from("self_reliance_participants")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welfare & Self-Reliance</h1>
          <p className="mt-2 text-gray-600">Track welfare cases and self-reliance programs</p>
        </div>
        {canViewWelfare && (
          <Button asChild>
            <Link href="/modules/welfare/new-case">New Welfare Case</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {canViewWelfare && (
          <Card>
            <CardHeader>
              <CardTitle>Welfare Cases</CardTitle>
              <CardDescription>Active welfare assistance cases</CardDescription>
            </CardHeader>
            <CardContent>
              {welfareCases && welfareCases.length > 0 ? (
                <div className="space-y-4">
                  {welfareCases.map((case_) => (
                    <div key={case_.id} className="border-b pb-3">
                      <div className="font-medium">Case #{case_.case_number}</div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        Status: {case_.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No welfare cases found</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Self-Reliance Participants</CardTitle>
            <CardDescription>Course participants and progress</CardDescription>
          </CardHeader>
          <CardContent>
            {participants && participants.length > 0 ? (
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="border-b pb-3">
                    <div className="font-medium">{participant.participant_name}</div>
                    <div className="text-sm text-gray-600">{participant.course_name}</div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">
                      Status: {participant.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No participants found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

