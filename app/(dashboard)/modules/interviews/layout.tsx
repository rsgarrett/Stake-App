"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { canAccessInterviews } from "@/lib/auth/module-access"

/** High councilors do not have access to Interviews. */
export default function InterviewsModuleLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setAllowed(false)
        return
      }
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      const ok = canAccessInterviews(profile?.role)
      if (!cancelled) {
        setAllowed(ok)
        if (!ok) router.replace("/modules/meetings")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  if (allowed === null) {
    return (
      <div className="p-4 sm:p-6">
        <div className="py-12 text-center text-sm text-gray-500">Loading…</div>
      </div>
    )
  }
  if (!allowed) return null
  return <>{children}</>
}
