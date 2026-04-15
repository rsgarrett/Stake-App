import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function LeadershipPage() {
  const supabase = await createClient()
  // Authentication temporarily disabled for testing
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // Fetch callings
  const { data: callings } = await supabase
    .from("callings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  // Fetch leadership positions
  const { data: positions } = await supabase
    .from("leadership_positions")
    .select("*")
    .limit(10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leadership Management</h1>
          <p className="mt-2 text-gray-600">Manage callings, leadership positions, and training records</p>
        </div>
        <Button asChild>
          <Link href="/modules/leadership/recommend">Submit Name</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Callings</CardTitle>
            <CardDescription>Latest calling assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {callings && callings.length > 0 ? (
              <div className="space-y-4">
                {callings.map((calling) => (
                  <div key={calling.id} className="border-b pb-3">
                    <div className="font-medium">{calling.person_name}</div>
                    <div className="text-sm text-gray-600">{calling.calling_name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Status: {calling.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No callings found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leadership Positions</CardTitle>
            <CardDescription>Current leadership structure</CardDescription>
          </CardHeader>
          <CardContent>
            {positions && positions.length > 0 ? (
              <div className="space-y-4">
                {positions.map((position) => (
                  <div key={position.id} className="border-b pb-3">
                    <div className="font-medium capitalize">{position.position_type}</div>
                    {position.organization && (
                      <div className="text-sm text-gray-600">{position.organization}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No positions found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

