// Authentication temporarily disabled for testing
// import { createClient } from "@/lib/supabase/server"
// import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  BookOpen,
  Church,
  Heart,
  UsersRound,
  GraduationCap,
  FileText,
  Mic,
} from "lucide-react"
import Link from "next/link"

const modules = [
  { name: "Leadership", href: "/modules/leadership", icon: Users, description: "Manage callings and leadership positions" },
  { name: "Meetings", href: "/modules/meetings", icon: Calendar, description: "Schedule and manage meetings" },
  { name: "Welfare", href: "/modules/welfare", icon: Heart, description: "Track welfare cases and self-reliance" },
  { name: "Missionary", href: "/modules/missionary", icon: Church, description: "Manage missionary work" },
  { name: "Temple", href: "/modules/temple", icon: BookOpen, description: "Temple attendance and interviews" },
  { name: "Youth", href: "/modules/youth", icon: UsersRound, description: "Youth programs and activities" },
  { name: "Communication", href: "/modules/communication", icon: MessageSquare, description: "Announcements and messaging" },
  { name: "Training", href: "/modules/training", icon: GraduationCap, description: "Training and resources" },
  { name: "Interviews", href: "/modules/interviews", icon: FileText, description: "Schedule and manage interviews" },
  { name: "Conferences", href: "/modules/conferences", icon: Mic, description: "Plan conferences and events" },
]

export default async function DashboardPage() {
  // Authentication temporarily disabled for testing
  // const supabase = await createClient()
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to the Stake President Management App</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link key={module.name} href={module.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <module.icon className="h-8 w-8 text-indigo-600" />
                  <CardTitle>{module.name}</CardTitle>
                </div>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

