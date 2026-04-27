"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Send, Mail, MailOpen } from "lucide-react"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  subject: string
  content: string
  read: boolean
  created_at: string
}

interface User {
  id: string
  email: string
  full_name?: string | null
  role?: string | null
}

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

type TabView = "inbox" | "sent" | "compose"

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sentMessages, setSentMessages] = useState<Message[]>([])
  const [leaders, setLeaders] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tabView, setTabView] = useState<TabView>("inbox")
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null)
  const [sending, setSending] = useState(false)
  const [composeData, setComposeData] = useState({ to: "", subject: "", content: "" })
  const supabase = createClient()

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel("messages_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => { loadData() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null
      setCurrentUserId(userId)

      const [inboxResult, sentResult, leadersResult] = await Promise.all([
        safeQuery(
          userId
            ? supabase.from("messages").select("*").eq("to_user_id", userId).order("created_at", { ascending: false })
            : supabase.from("messages").select("*").order("created_at", { ascending: false })
        ),
        safeQuery(
          userId
            ? supabase.from("messages").select("*").eq("from_user_id", userId).order("created_at", { ascending: false })
            : supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(0)
        ),
        safeQuery(supabase.from("users").select("id, email, full_name, role").order("full_name")),
      ])
      setMessages(inboxResult.data || [])
      setSentMessages(sentResult.data || [])
      setLeaders(leadersResult.data || [])
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (msg: Message) => {
    if (msg.read) return
    await supabase.from("messages").update({ read: true }).eq("id", msg.id)
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, read: true } : m))
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const { error } = await supabase.from("messages").insert({
        from_user_id: currentUserId,
        to_user_id: composeData.to,
        subject: composeData.subject,
        content: composeData.content,
        read: false,
      })
      if (error) throw error

      const recipientName = leaders.find(l => l.id === composeData.to)?.full_name || "recipient"
      await supabase.from("calling_notifications").insert({
        user_id: composeData.to,
        notification_type: "new_message",
        title: "New Message",
        message: `You have a new message: "${composeData.subject}"`,
        action_url: "/modules/communication/messages",
        priority: "normal",
        read: false,
      })

      setComposeData({ to: "", subject: "", content: "" })
      setTabView("sent")
      await loadData()
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSending(false)
    }
  }

  const unreadCount = messages.filter((m) => !m.read).length

  if (loading) return <div className="p-6"><div className="text-center py-12">Loading...</div></div>

  return (
    <div className="p-6">
      <Link href="/modules/communication" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Communication
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">Leader-to-leader messaging</p>
        </div>
        <Button onClick={() => { setTabView("compose"); setSelectedMsg(null) }}>
          <Send className="h-4 w-4 mr-2" />Compose
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b mb-6">
        {([
          { key: "inbox" as const, label: `Inbox${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
          { key: "sent" as const, label: "Sent" },
          { key: "compose" as const, label: "Compose" },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => { setTabView(key); setSelectedMsg(null) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tabView === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        {tabView !== "compose" && (
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-4">
                {(tabView === "inbox" ? messages : sentMessages).length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No messages</p>
                ) : (
                  <div className="space-y-1">
                    {(tabView === "inbox" ? messages : sentMessages).map((msg) => (
                      <button key={msg.id} onClick={() => { setSelectedMsg(msg); if (tabView === "inbox") markAsRead(msg) }}
                        className={`w-full text-left p-3 rounded-lg border ${selectedMsg?.id === msg.id ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"} ${!msg.read && tabView === "inbox" ? "bg-blue-50" : ""}`}>
                        <div className="flex items-center space-x-2">
                          {tabView === "inbox" && (msg.read ? <MailOpen className="h-4 w-4 text-gray-400" /> : <Mail className="h-4 w-4 text-blue-500" />)}
                          <span className={`text-sm font-medium truncate ${!msg.read && tabView === "inbox" ? "text-gray-900" : "text-gray-700"}`}>{msg.subject}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{new Date(msg.created_at).toLocaleDateString()}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Message Detail / Compose */}
        <div className={tabView === "compose" ? "lg:col-span-3" : "lg:col-span-2"}>
          {tabView === "compose" ? (
            <Card>
              <CardHeader><CardTitle>New Message</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={sendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To <span className="text-red-500">*</span></label>
                    <select required value={composeData.to} onChange={(e) => setComposeData({ ...composeData, to: e.target.value })} className={inputClass}>
                      <option value="">{englishMenuTitleCase("Select recipient...")}</option>
                      {leaders.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.full_name || l.email}
                          {l.role ? ` (${englishMenuTitleCase(l.role.replace(/_/g, " "))})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
                    <input type="text" required value={composeData.subject} onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
                    <textarea rows={8} required value={composeData.content} onChange={(e) => setComposeData({ ...composeData, content: e.target.value })} className={inputClass} />
                  </div>
                  <Button type="submit" disabled={sending}><Send className="h-4 w-4 mr-2" />{sending ? "Sending..." : "Send Message"}</Button>
                </form>
              </CardContent>
            </Card>
          ) : selectedMsg ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedMsg.subject}</CardTitle>
                <CardDescription>{new Date(selectedMsg.created_at).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-gray-800">{selectedMsg.content}</div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">Select a message to read</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
