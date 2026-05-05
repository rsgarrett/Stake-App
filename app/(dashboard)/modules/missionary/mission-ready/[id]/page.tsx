"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft, CheckCircle2, Circle, Calendar,
  Save, X
} from "lucide-react"

import type { MissionReadyMissionary, MissionReadyProgress } from "@/types"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"
import { MISSION_INTERVIEW_TYPE } from "@/lib/interviews/interview-types"

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"

const STATUS_OPTIONS = [
  { value: "preparing", label: "Preparing", bg: "bg-blue-100", text: "text-blue-700" },
  { value: "papers_submitted", label: "Papers Submitted", bg: "bg-amber-100", text: "text-amber-700" },
  { value: "call_received", label: "Call Received", bg: "bg-purple-100", text: "text-purple-700" },
  { value: "set_apart", label: "Set Apart", bg: "bg-indigo-100", text: "text-indigo-700" },
  { value: "serving", label: "Serving", bg: "bg-green-100", text: "text-green-700" },
  { value: "completed", label: "Completed", bg: "bg-gray-100", text: "text-gray-600" },
]

export default function MissionReadyDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const missionaryId = params.id as string
  const fromInterviewSchedule = searchParams.get("from") === "interview-schedule"
  const supabase = createClient()

  const [missionary, setMissionary] = useState<MissionReadyMissionary | null>(null)
  const [progress, setProgress] = useState<MissionReadyProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")
  const loadData = useCallback(async () => {
    try {
      const [missRes, progRes] = await Promise.all([
        supabase.from("mission_ready_missionaries").select("*").eq("id", missionaryId).single(),
        supabase.from("mission_ready_progress").select("*").eq("missionary_id", missionaryId).order("task_number"),
      ])
      if (missRes.data) setMissionary(missRes.data)
      setProgress(progRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [missionaryId])

  useEffect(() => { loadData() }, [loadData])

  const toggleCompleted = async (item: MissionReadyProgress) => {
    const newCompleted = !item.completed
    await supabase.from("mission_ready_progress").update({
      completed: newCompleted,
      completed_date: newCompleted ? new Date().toISOString().split("T")[0] : null,
    }).eq("id", item.id)
    await loadData()
  }

  const updateNote = async (itemId: string) => {
    await supabase.from("mission_ready_progress").update({ notes: noteText || null }).eq("id", itemId)
    setEditingNote(null)
    setNoteText("")
    await loadData()
  }

  const updateCompletedDate = async (itemId: string, date: string) => {
    await supabase.from("mission_ready_progress").update({
      completed_date: date || null,
      completed: !!date,
    }).eq("id", itemId)
    await loadData()
  }

  const updateMissionaryStatus = async (newStatus: string) => {
    await supabase.from("mission_ready_missionaries").update({ status: newStatus }).eq("id", missionaryId)
    await loadData()
  }

  const completedCount = progress.filter((p) => p.completed).length
  const totalCount = progress.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (loading) return <div className="p-4 sm:p-6"><div className="text-center py-12">Loading...</div></div>
  if (!missionary) return <div className="p-4 sm:p-6"><div className="text-center py-12 text-gray-500">Missionary not found</div></div>

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === missionary.status) || STATUS_OPTIONS[0]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/modules/missionary" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Missionary Work
      </Link>

      {fromInterviewSchedule && (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
          <p className="font-medium">Mission interview is on the calendar</p>
          <p className="mt-1 text-indigo-900/90">
            Date and time were saved with the interview. Checklist updates here save automatically. Open the form again
            if you need to change date, time, or location.
          </p>
          <Link
            href={`/modules/interviews/schedule?interviewee=${encodeURIComponent(missionary.missionary_name)}&type=${MISSION_INTERVIEW_TYPE}`}
            className="mt-2 inline-flex font-medium text-indigo-700 underline hover:text-indigo-900"
          >
            Open schedule form for this person
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{missionary.missionary_name}</h1>
          <p className="mt-1 text-gray-600">Mission Ready Tracker</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={missionary.status}
            onChange={(e) => updateMissionaryStatus(e.target.value)}
            className={`px-3 py-1.5 text-sm rounded-full border-0 font-medium ${currentStatus.bg} ${currentStatus.text} cursor-pointer`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {englishMenuTitleCase(s.label)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{completedCount} of {totalCount} tasks ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Preparation Checklist</CardTitle>
          <CardDescription>Track each step of missionary preparation. Click the circle to mark complete.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2 font-medium text-gray-500 w-10">#</th>
                  <th className="px-3 py-2 font-medium text-gray-500 w-10"></th>
                  <th className="px-3 py-2 font-medium text-gray-500">Task</th>
                  <th className="px-3 py-2 font-medium text-gray-500 w-32">Date</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((item) => {
                  const isEditingNote = editingNote === item.id

                  return (
                    <tr key={item.id} className={`border-b hover:bg-gray-50 ${item.completed ? "bg-green-50/50" : ""}`}>
                      {/* Task Number */}
                      <td className="px-3 py-3 text-gray-400 font-medium">{item.task_number}</td>

                      {/* Checkbox */}
                      <td className="px-3 py-3">
                        <button onClick={() => toggleCompleted(item)} className="focus:outline-none">
                          {item.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300 hover:text-indigo-400" />
                          )}
                        </button>
                      </td>

                      {/* Task Name */}
                      <td className={`px-3 py-3 font-medium ${item.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {item.task_name}
                      </td>

                      {/* Completed Date */}
                      <td className="px-3 py-3">
                        <input
                          type="date"
                          value={item.completed_date || ""}
                          onChange={(e) => updateCompletedDate(item.id, e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded text-xs bg-white text-gray-700 w-full"
                        />
                      </td>

                      {/* Notes */}
                      <td className="px-3 py-3">
                        {isEditingNote ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-xs flex-1"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter") updateNote(item.id); if (e.key === "Escape") setEditingNote(null) }}
                            />
                            <button onClick={() => updateNote(item.id)} className="text-green-600 hover:text-green-800"><Save className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setEditingNote(null)} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingNote(item.id); setNoteText(item.notes || "") }}
                            className="text-left text-xs text-gray-500 hover:text-gray-700 w-full min-h-[20px]"
                          >
                            {item.notes || <span className="text-gray-300 italic">Add note...</span>}
                          </button>
                        )}
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
