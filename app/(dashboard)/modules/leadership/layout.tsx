"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { canAccessCallingTracker, isHighCouncilOnly } from "@/lib/auth/module-access"

/**
 * High councilors may use HC Communication (own R&R) but not the calling tracker
 * or other Callings sub-pages.
 */
export default function LeadershipModuleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
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
      const role = profile?.role ?? null
      const onHcComms = pathname?.includes("/hc-communication") ?? false
      const ok = canAccessCallingTracker(role) || (isHighCouncilOnly(role) && onHcComms)
      if (!cancelled) {
        setAllowed(ok)
        if (!ok) router.replace("/modules/communication")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pathname, router])

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
