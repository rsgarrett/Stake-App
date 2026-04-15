import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function TrainingPage() {
  const supabase = await createClient()
  // Authentication temporarily disabled for testing
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // Fetch training modules
  const { data: modules } = await supabase
    .from("training_modules")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  // Fetch user's training completions
  const { data: completions } = await supabase
    .from("training_completions")
    .select("*, training_modules(*)")
    .eq("user_id", user.id)
    .order("completed_date", { ascending: false })
    .limit(10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training & Resources</h1>
          <p className="mt-2 text-gray-600">Access training materials and handbook resources</p>
        </div>
        <Button asChild>
          <Link href="/modules/training/handbook">Handbook</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Training Modules</CardTitle>
            <CardDescription>Training materials and courses</CardDescription>
          </CardHeader>
          <CardContent>
            {modules && modules.length > 0 ? (
              <div className="space-y-4">
                {modules.map((module) => (
                  <div key={module.id} className="border-b pb-3">
                    <div className="font-medium">{module.title}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {module.module_type}
                    </div>
                    {module.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {module.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No training modules found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Training Progress</CardTitle>
            <CardDescription>Your completed and in-progress training</CardDescription>
          </CardHeader>
          <CardContent>
            {completions && completions.length > 0 ? (
              <div className="space-y-4">
                {completions.map((completion: any) => (
                  <div key={completion.id} className="border-b pb-3">
                    <div className="font-medium">{completion.training_modules?.title}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      Status: {completion.status}
                    </div>
                    {completion.completed_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        Completed: {new Date(completion.completed_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No training records found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

