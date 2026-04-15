"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  Users,
  Calendar,
  MessageSquare,
  GraduationCap,
  FileText,
  Mic,
  Settings,
} from "lucide-react"

const navigation = [
  { name: "Meetings", href: "/modules/meetings", icon: Calendar },
  { name: "Callings", href: "/modules/leadership", icon: Users },
  { name: "Communication", href: "/modules/communication", icon: MessageSquare },
  { name: "Conferences", href: "/modules/conferences", icon: Mic },
  { name: "Training", href: "/modules/training", icon: GraduationCap },
  { name: "Interviews", href: "/modules/interviews", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="app-print-chrome flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Stake App</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
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

