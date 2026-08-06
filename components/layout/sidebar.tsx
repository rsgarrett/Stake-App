"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { createClient } from "@/lib/supabase/client"
import { canAccessCallingTracker, canAccessInterviews } from "@/lib/auth/module-access"
import {
  Users,
  Calendar,
  MessageSquare,
  GraduationCap,
  FileText,
  Mic,
  Settings,
  X,
} from "lucide-react"

const navigation = [
  { name: "Meetings", href: "/modules/meetings", icon: Calendar },
  { name: "Callings", href: "/modules/leadership", icon: Users, requiresCallingTracker: true },
  { name: "Communication", href: "/modules/communication", icon: MessageSquare },
  { name: "Conferences", href: "/modules/conferences", icon: Mic },
  { name: "Training", href: "/modules/training", icon: GraduationCap },
  { name: "Interviews", href: "/modules/interviews", icon: FileText, requiresInterviews: true },
  { name: "Settings", href: "/settings", icon: Settings },
]

type SidebarVariant = "default" | "overlay"

export function Sidebar({
  onItemSelect,
  variant = "default",
}: {
  onItemSelect?: () => void
  variant?: SidebarVariant
}) {
  const pathname = usePathname()
  const showClose = variant === "overlay" && !!onItemSelect
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!cancelled) setRole(data?.role ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const items = navigation.filter((item) => {
    if ("requiresCallingTracker" in item && item.requiresCallingTracker) {
      return canAccessCallingTracker(role)
    }
    if ("requiresInterviews" in item && item.requiresInterviews) {
      return canAccessInterviews(role)
    }
    return true
  })

  return (
    <div
      className={cn(
        "app-print-chrome flex h-full w-[min(16rem,100%)] shrink-0 flex-col bg-gray-900",
        variant === "overlay" && "rounded-r-xl border-r border-gray-800"
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-800 px-6">
        <h1 className="text-xl font-bold text-white truncate">Stake App</h1>
        {showClose ? (
          <button
            type="button"
            onClick={() => onItemSelect?.()}
            className="-mr-2 inline-flex shrink-0 items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onItemSelect?.()}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
