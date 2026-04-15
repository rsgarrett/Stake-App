import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  console.log("[Home] User found:", !!user)
  console.log("[Home] User email:", user?.email)
  console.log("[Home] Error:", error?.message)

  redirect("/modules/leadership")
}

