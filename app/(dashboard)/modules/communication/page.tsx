"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Plus, MessageSquare, Bell, Trash2, Pencil, Users } from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  target_audience: string
  publish_date?: string | null
  created_by: string
  created_at: string
  priority?: string | null
  expiration_date?: string | null
}

interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  subject: string
  content: string
  read: boolean
  created_at: string
}

export default function CommunicationPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [annResult, msgResult] = await Promise.all([
        safeQuery(supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(20)),
        safeQuery(supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(20)),
      ])
      setAnnouncements(annResult.data || [])
      setMessages(msgResult.data || [])
    } catch (err: any) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return
    const { error } = await supabase.from("announcements").delete().eq("id", id)
    if (error) alert("Error: " + error.message)
    else await loadData()
  }

  const unreadCount = messages.filter((m) => !m.read).length

  if (loading) return <div className="p-4 sm:p-6"><div className="text-center py-12">Loading...</div></div>

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communication</h1>
          <p className="mt-2 text-gray-600">Announcements and leader messaging</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/modules/communication/messages" className={buttonVariants({ variant: "outline" })}>
              <MessageSquare className="h-4 w-4 mr-2" />Messages
              {unreadCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>}
          </Link>
          <Link href="/modules/communication/new-announcement" className={buttonVariants()}>
              <Plus className="h-4 w-4 mr-2" />New Announcement
          </Link>
        </div>
      </div>

      {/* HC Communication */}
      <div className="mb-6">
        <Link href="/modules/leadership/hc-communication">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200 hover:border-emerald-400">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">HC Communication</CardTitle>
                  <CardDescription>Weekly return &amp; report from high councilors</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Announcements</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{announcements.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Unread Messages</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">{unreadCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Messages</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{messages.length}</div></CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
          <CardDescription>Stake-wide announcements visible to targeted audiences</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No announcements yet</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-indigo-500" />
                      <span className="font-medium text-gray-900">{a.title}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 capitalize">{a.target_audience}</span>
                      {a.priority === "high" && <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">High Priority</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.content}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</p>
                      {a.expiration_date && <p className="text-xs text-amber-500">Expires {new Date(a.expiration_date).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <Link href={`/modules/communication/edit-announcement/${a.id}`} className="text-gray-400 hover:text-indigo-600">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => deleteAnnouncement(a.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
