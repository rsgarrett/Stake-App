"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Bell, CheckCircle2, Circle, AlertCircle, Info } from "lucide-react"

interface Notification {
  id: string
  calling_id: string | null
  recommendation_id: string | null
  notification_type: string
  title: string | null
  message: string
  action_url: string | null
  priority: string
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("unread")

  useEffect(() => {
    loadNotifications()
    
    // Set up realtime subscription for notification changes
    const supabase = createClient()
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calling_notifications",
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  const loadNotifications = async () => {
    try {
      const supabase = createClient()
      // Auth disabled — load all notifications
      const { data } = await safeQuery(supabase
        .from("calling_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100))

      setNotifications(data || [])
    } catch (err: any) {
      console.error("Error loading notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("calling_notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
      await loadNotifications()
    } catch (err: any) {
      console.error("Error marking as read:", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("calling_notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("read", false)

      if (error) throw error
      await loadNotifications()
    } catch (err: any) {
      console.error("Error marking all as read:", err)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "high":
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-red-200 bg-red-50"
      case "high":
        return "border-orange-200 bg-orange-50"
      default:
        return "border-gray-200 bg-white"
    }
  }

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-600">
            Stay updated on calling workflow activities
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {unreadCount} unread
            </span>
          )}
          <Link href="/modules/leadership" className={buttonVariants({ variant: "outline" })}>
            Back to Leadership
          </Link>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-md ${
                filter === "unread"
                  ? "bg-indigo-100 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md ${
                filter === "all"
                  ? "bg-indigo-100 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All ({notifications.length})
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                !notification.read ? getPriorityColor(notification.priority) : ""
              }`}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification.id)
                }
                if (notification.action_url) {
                  window.location.href = notification.action_url
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {notification.read ? (
                      <Circle className="h-5 w-5 text-gray-300" />
                    ) : (
                      getPriorityIcon(notification.priority)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        {notification.title || "Notification"}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString()}{" "}
                        {new Date(notification.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    {notification.action_url && (
                      <Link
                        href={notification.action_url}
                        className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
