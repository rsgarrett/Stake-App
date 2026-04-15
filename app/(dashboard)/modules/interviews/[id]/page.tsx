"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Save, CheckCircle2, Clock, XCircle } from "lucide-react"

interface Interview {
  id: string
  interviewee_name: string
  interview_type: string
  scheduled_date: string
  conducted_date?: string | null
  interviewer_id: string
  status: "scheduled" | "completed" | "cancelled"
  created_at: string
}

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

export default function InterviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [interview, setInterview] = useState<Interview | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingNotes, setSavingNotes] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from("interviews").select("*").eq("id", id).single()
      if (data) setInterview(data)

      // Load encrypted notes via API
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_note", interview_id: id }),
      })
      const noteData = await res.json()
      if (noteData.note) setNotes(noteData.note.note_content || "")
    } catch (err: any) {
      console.error("Error loading interview:", err)
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_note", interview_id: id, note_content: notes }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to save")
    } catch (err: any) {
      alert("Error saving notes: " + err.message)
    } finally {
      setSavingNotes(false)
    }
  }

  const updateStatus = async (newStatus: "completed" | "cancelled") => {
    if (!interview) return
    setUpdatingStatus(true)
    try {
      const updateData: any = { status: newStatus }
      if (newStatus === "completed") updateData.conducted_date = new Date().toISOString()

      const { error } = await supabase.from("interviews").update(updateData).eq("id", id)
      if (error) throw error
      await loadData()
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  if (loading) return <div className="p-6"><div className="text-center py-12">Loading...</div></div>
  if (!interview) return <div className="p-6"><div className="text-center py-12 text-gray-500">Interview not found</div></div>

  return (
    <div className="p-6">
      <Link href="/modules/interviews" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Interviews
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{interview.interviewee_name}</h1>
          <p className="mt-1 text-gray-600">{formatType(interview.interview_type)} Interview</p>
        </div>
        <div className="flex items-center space-x-2">
          {interview.status === "scheduled" && (
            <>
              <Button onClick={() => updateStatus("completed")} disabled={updatingStatus} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
              </Button>
              <Button variant="outline" onClick={() => updateStatus("cancelled")} disabled={updatingStatus}>
                <XCircle className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </>
          )}
          {interview.status === "completed" && (
            <span className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Completed
            </span>
          )}
          {interview.status === "cancelled" && (
            <span className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
              <XCircle className="h-4 w-4 mr-1" /> Cancelled
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-gray-500">Type</span>
              <p className="text-sm font-medium">{formatType(interview.interview_type)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Scheduled</span>
              <p className="text-sm font-medium">{new Date(interview.scheduled_date).toLocaleString()}</p>
            </div>
            {interview.conducted_date && (
              <div>
                <span className="text-xs text-gray-500">Conducted</span>
                <p className="text-sm font-medium">{new Date(interview.conducted_date).toLocaleString()}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-500">Status</span>
              <p className="text-sm font-medium capitalize">{interview.status}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Interview Notes</CardTitle>
            <CardDescription>Notes are stored securely. Only you can view them.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea rows={12} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass}
              placeholder="Record interview notes here...&#10;&#10;These notes are encrypted and only accessible by authorized leaders." />
            <div className="flex justify-end mt-4">
              <Button onClick={saveNotes} disabled={savingNotes}>
                <Save className="h-4 w-4 mr-2" />{savingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
