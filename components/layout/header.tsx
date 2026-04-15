"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, MessageSquare } from "lucide-react"
import Link from "next/link"

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [notificationCount, setNotificationCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)

  useEffect(() => {
    loadUnreadCounts()

    const notifChannel = supabase
      .channel("header_notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calling_notifications" },
        () => { loadUnreadCounts() }
      )
      .subscribe()

    const msgChannel = supabase
      .channel("header_messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => { loadUnreadCounts() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notifChannel)
      supabase.removeChannel(msgChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUnreadCounts = async () => {
    try {
      const [notifResult, msgResult] = await Promise.all([
        supabase.from("calling_notifications").select("*", { count: "exact", head: true }).eq("read", false),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("read", false),
      ])
      setNotificationCount(notifResult.count || 0)
      setMessageCount(msgResult.count || 0)
    } catch {
      // Tables may not exist yet
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Stake President Management
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/modules/communication/messages" className="relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            <MessageSquare className="h-5 w-5" />
            {messageCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                {messageCount > 9 ? "9+" : messageCount}
              </span>
            )}
          </Link>
          <Link href="/modules/leadership/notifications" className="relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Link>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
