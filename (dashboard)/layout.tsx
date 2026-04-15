import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Authentication temporarily disabled for testing
  // const supabase = await createClient()
  // const { data: { user }, error } = await supabase.auth.getUser()

  // Debug logging
  // console.log("[DashboardLayout] User found:", !!user)
  // console.log("[DashboardLayout] User email:", user?.email)
  // console.log("[DashboardLayout] Error:", error?.message)

  // TEMPORARILY DISABLED FOR TESTING
  // if (!user) {
  //   redirect("/login")
  // }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

