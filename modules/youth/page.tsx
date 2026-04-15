import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function YouthPage() {
  const supabase = await createClient()
  // Authentication temporarily disabled for testing
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // Fetch youth programs
  const { data: programs } = await supabase
    .from("youth_programs")
    .select("*")
    .eq("status", "active")
    .order("start_date", { ascending: true })
    .limit(10)

  // Fetch priesthood advancements
  const { data: advancements } = await supabase
    .from("priesthood_advancements")
    .select("*")
    .order("advancement_date", { ascending: false })
    .limit(10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Youth Programs</h1>
          <p className="mt-2 text-gray-600">Oversee youth programs and track priesthood advancements</p>
        </div>
        <Button asChild>
          <Link href="/modules/youth/new-program">New Program</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Youth Programs</CardTitle>
            <CardDescription>Current youth programs</CardDescription>
          </CardHeader>
          <CardContent>
            {programs && programs.length > 0 ? (
              <div className="space-y-4">
                {programs.map((program) => (
                  <div key={program.id} className="border-b pb-3">
                    <div className="font-medium">{program.program_name}</div>
                    <div className="text-sm text-gray-600">{program.program_type}</div>
                    {program.start_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        Started: {new Date(program.start_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No active programs found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priesthood Advancements</CardTitle>
            <CardDescription>Recent priesthood ordinations</CardDescription>
          </CardHeader>
          <CardContent>
            {advancements && advancements.length > 0 ? (
              <div className="space-y-4">
                {advancements.map((advancement) => (
                  <div key={advancement.id} className="border-b pb-3">
                    <div className="font-medium">{advancement.youth_name}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {advancement.advancement_type}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(advancement.advancement_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No advancements found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

