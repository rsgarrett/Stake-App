"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AutosaveBadge } from "@/components/ui/autosave-badge"
import { useAutosave } from "@/lib/hooks/use-autosave"
import Link from "next/link"
import {
  ArrowLeft, Plus, Trash2, Clock, FileText, ListOrdered,
  User, MapPin, ChevronDown, ChevronUp, Music,
  BookOpen, CheckCircle2, Users, MessageSquare, CalendarDays,
} from "lucide-react"
import {
  getFieldTypeForTitle, getSubItemPlaceholder, getTemplateForMeetingType,
  type AgendaFieldType,
} from "@/lib/meetings/agenda-field-config"
import { canManageStakeMeetings } from "@/lib/meetings/meeting-permissions"

interface Meeting {
  id: string
  title: string
  meeting_type: string
  scheduled_date: string
  end_date?: string | null
  location?: string | null
  description?: string | null
  recurrence_type?: string | null
  source_type?: string | null
  color?: string | null
  presiding?: string | null
  conducting?: string | null
}

interface AgendaItem {
  id: string
  meeting_id: string
  item_order: number
  title: string
  description?: string | null
  assigned_to?: string | null
  presenter?: string | null
  duration_minutes?: number | null
}

interface Minutes {
  id: string
  meeting_id: string
  content: string
  created_by: string
  created_at: string
  updated_at: string
}

type Tab = "details" | "agenda" | "minutes"

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

const MINISTERING_TYPES = new Set([
  "bishopric_ministering", "eq_ministering", "rs_ministering", "thursday_ministering",
])

const NO_AGENDA_TYPES = new Set([
  "general_conference",
])

const ASSIGNMENT_TYPES = new Set([
  "ward_visit", "teaching",
])

type SimpleMeetingMode = "ministering" | "no_agenda" | "assignments" | null

function getSimpleMode(meetingType: string | undefined): SimpleMeetingMode {
  if (!meetingType) return null
  const mt = meetingType.toLowerCase()
  if (MINISTERING_TYPES.has(mt) || mt.includes("ministering")) return "ministering"
  if (NO_AGENDA_TYPES.has(mt)) return "no_agenda"
  if (ASSIGNMENT_TYPES.has(mt)) return "assignments"
  return null
}

const FIELD_ICONS: Partial<Record<AgendaFieldType, typeof User>> = {
  person: User,
  hymn: Music,
  trainer: BookOpen,
  sub_items: ListOrdered,
  notes: MessageSquare,
  person_notes: User,
}

function fieldIcon(ft: AgendaFieldType) {
  const Icon = FIELD_ICONS[ft]
  return Icon ? <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" /> : null
}

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const meetingId = params.id as string
  const initialTab = (searchParams.get("tab") as Tab) || "details"

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [minutes, setMinutes] = useState<Minutes | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [loading, setLoading] = useState(true)

  // Pending agenda edits keyed by item id. Mirrored to localStorage so a
  // failed save (or a refresh / crash) does not lose what the user typed.
  const editingItemsStorageKey = `stake-app:meeting-edits:${meetingId}`
  const [editingItems, setEditingItems] = useState<Record<string, Partial<AgendaItem>>>(() => {
    if (typeof window === "undefined") return {}
    try {
      const raw = window.localStorage.getItem(`stake-app:meeting-edits:${meetingId}`)
      return raw ? (JSON.parse(raw) as Record<string, Partial<AgendaItem>>) : {}
    } catch {
      return {}
    }
  })
  const [subItemInputs, setSubItemInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      if (Object.keys(editingItems).length === 0) {
        window.localStorage.removeItem(editingItemsStorageKey)
      } else {
        window.localStorage.setItem(editingItemsStorageKey, JSON.stringify(editingItems))
      }
    } catch {
      // Quota exceeded or storage disabled — fall back to in-memory only.
    }
  }, [editingItems, editingItemsStorageKey])

  const [newAgendaTitle, setNewAgendaTitle] = useState("")
  const [newAgendaAssigned, setNewAgendaAssigned] = useState("")
  const [newAgendaDuration, setNewAgendaDuration] = useState("")
  const [newAgendaDesc, setNewAgendaDesc] = useState("")

  const [minutesContent, setMinutesContent] = useState("")

  const [userMeetingRole, setUserMeetingRole] = useState<string | null>(null)
  const meetingWriteAllowed = canManageStakeMeetings(userMeetingRole)
  const [seededTemplateForMeetingId, setSeededTemplateForMeetingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setUserMeetingRole(null)
        return
      }
      const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!cancelled) setUserMeetingRole(data?.role ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => { loadAll() }, [meetingId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadMeeting(), loadAgenda(), loadMinutes()])
    setLoading(false)
  }

  const loadMeeting = async () => {
    const { data } = await supabase.from("meetings").select("*").eq("id", meetingId).single()
    if (data) setMeeting(data)
  }

  const loadAgenda = async () => {
    const { data } = await supabase.from("meeting_agendas").select("*").eq("meeting_id", meetingId).order("item_order", { ascending: true })
    setAgendaItems(data || [])
  }

  const loadMinutes = async () => {
    const { data } = await supabase.from("meeting_minutes").select("*").eq("meeting_id", meetingId).order("created_at", { ascending: false }).limit(1).single()
    if (data) {
      setMinutes(data)
      setMinutesContent(data.content)
    }
  }

  /**
   * Insert the handbook template's items as the meeting's agenda. Used by both
   * the silent auto-seed (on first view) and the explicit "Use template" /
   * "Reset to template" buttons.
   */
  const applyHandbookTemplate = useCallback(
    async (opts: { silent?: boolean } = {}): Promise<boolean> => {
      if (!meeting) return false
      const tmpl = getTemplateForMeetingType(meeting.meeting_type)
      if (!tmpl) return false
      const rows = tmpl.items.map((cfg, idx) => ({
        meeting_id: meetingId,
        item_order: idx + 1,
        title: cfg.title,
        description: null,
        duration_minutes: cfg.duration_minutes ?? null,
      }))
      const { error } = await supabase.from("meeting_agendas").insert(rows)
      if (error) {
        if (!opts.silent) {
          alert("Could not load handbook agenda: " + error.message)
        }
        return false
      }
      await loadAgenda()
      return true
    },
    [meeting, meetingId, supabase] // loadAgenda is stable enough; intentionally narrow deps
  )

  /**
   * Backfill: meetings scheduled before in-app templates existed have no agenda
   * rows. On first view by a user with write permission, seed the agenda from
   * the handbook template so clicking a calendar event opens a usable agenda.
   */
  useEffect(() => {
    if (loading) return
    if (!meeting) return
    if (seededTemplateForMeetingId === meetingId) return
    if (agendaItems.length > 0) return
    if (!meetingWriteAllowed) return
    if (!getTemplateForMeetingType(meeting.meeting_type)) return

    let cancelled = false
    setSeededTemplateForMeetingId(meetingId)
    ;(async () => {
      // Not silent: if RLS or anything else blocks the insert, surface the
      // exact error so we can diagnose instead of leaving the user with an
      // empty agenda and no explanation.
      await applyHandbookTemplate({ silent: false })
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
    // Intentionally only re-run when the relevant inputs settle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, meeting?.id, meeting?.meeting_type, agendaItems.length, meetingWriteAllowed, meetingId, seededTemplateForMeetingId])

  const addAgendaItem = async () => {
    if (!newAgendaTitle.trim()) return
    const maxOrder = agendaItems.length > 0 ? Math.max(...agendaItems.map((a) => a.item_order)) : 0
    const { error } = await supabase.from("meeting_agendas").insert({
      meeting_id: meetingId,
      title: newAgendaTitle.trim(),
      description: newAgendaDesc.trim() || null,
      assigned_to: newAgendaAssigned.trim() || null,
      duration_minutes: newAgendaDuration ? parseInt(newAgendaDuration) : null,
      item_order: maxOrder + 1,
    })
    if (error) { alert("Error adding item: " + error.message); return }
    setNewAgendaTitle("")
    setNewAgendaAssigned("")
    setNewAgendaDuration("")
    setNewAgendaDesc("")
    await loadAgenda()
  }

  const deleteAgendaItem = async (id: string) => {
    const { error } = await supabase.from("meeting_agendas").delete().eq("id", id)
    if (error) alert("Error: " + error.message)
    else await loadAgenda()
  }

  /**
   * Replace the current meeting's agenda with a fresh copy from the handbook
   * template. Used when an older template was previously seeded and we want
   * the latest structure to take its place.
   */
  const resetAgendaToTemplate = async () => {
    if (!meeting) return
    if (!getTemplateForMeetingType(meeting.meeting_type)) return
    if (
      agendaItems.length > 0 &&
      !confirm(
        "Replace the current agenda with the handbook template? Any unsaved notes on existing items will be lost."
      )
    ) {
      return
    }

    if (agendaItems.length > 0) {
      const { error: delErr } = await supabase
        .from("meeting_agendas")
        .delete()
        .eq("meeting_id", meetingId)
      if (delErr) {
        alert("Error clearing agenda: " + delErr.message)
        return
      }
    }
    setEditingItems({})
    setSubItemInputs({})
    const ok = await applyHandbookTemplate()
    if (ok) setSeededTemplateForMeetingId(meetingId)
  }

  const moveAgendaItem = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === agendaItems.length - 1) return
    const swapIndex = direction === "up" ? index - 1 : index + 1
    const items = [...agendaItems]
    const tempOrder = items[index].item_order
    items[index].item_order = items[swapIndex].item_order
    items[swapIndex].item_order = tempOrder
    await Promise.all([
      supabase.from("meeting_agendas").update({ item_order: items[index].item_order }).eq("id", items[index].id),
      supabase.from("meeting_agendas").update({ item_order: items[swapIndex].item_order }).eq("id", items[swapIndex].id),
    ])
    await loadAgenda()
  }

  // --- Inline editing helpers ---

  const getEditValue = (item: AgendaItem, field: keyof AgendaItem) => {
    const edits = editingItems[item.id]
    if (edits && field in edits) return edits[field] ?? ""
    return item[field] ?? ""
  }

  const setEditField = (itemId: string, field: keyof AgendaItem, value: string | number | null) => {
    setEditingItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  /**
   * Persist all pending agenda-item edits in one pass. Driven by the
   * `useAutosave` hook below and also called on unload by that same hook.
   */
  const persistAgendaEdits = useCallback(async () => {
    const snapshot = editingItems
    const ids = Object.keys(snapshot)
    if (ids.length === 0) return
    const results = await Promise.all(
      ids.map((id) => {
        const edits = snapshot[id]
        if (!edits || Object.keys(edits).length === 0) return null
        const payload: Record<string, unknown> = {}
        for (const [key, val] of Object.entries(edits)) {
          payload[key] = val === "" ? null : val
        }
        return supabase.from("meeting_agendas").update(payload).eq("id", id)
      })
    )
    const firstError = results.find((r) => r && r.error)?.error
    if (firstError) throw firstError
    setEditingItems((prev) => {
      const next = { ...prev }
      for (const id of ids) delete next[id]
      return next
    })
    await loadAgenda()
  }, [editingItems, supabase])

  const agendaAutosave = useAutosave({
    hasPending: Object.keys(editingItems).length > 0,
    save: persistAgendaEdits,
    debounceMs: 600,
  })

  // --- Sub-item helpers (stored as newline-separated text in description) ---

  const getSubItems = (item: AgendaItem): string[] => {
    const raw = (editingItems[item.id]?.description as string | undefined) ?? item.description ?? ""
    if (!raw.trim()) return []
    return raw.split("\n").filter((line) => line.trim() !== "")
  }

  const updateSubItems = (itemId: string, lines: string[]) => {
    setEditField(itemId, "description", lines.join("\n") || null)
  }

  const addSubItem = (item: AgendaItem, text: string) => {
    if (!text.trim()) return
    const current = getSubItems(item)
    current.push(text.trim())
    updateSubItems(item.id, current)
    setSubItemInputs((prev) => ({ ...prev, [item.id]: "" }))
  }

  const removeSubItem = (item: AgendaItem, index: number) => {
    const current = getSubItems(item)
    current.splice(index, 1)
    updateSubItems(item.id, current)
  }

  const editSubItem = (item: AgendaItem, index: number, value: string) => {
    const current = getSubItems(item)
    current[index] = value
    updateSubItems(item.id, current)
  }

  // --- Minutes (autosaved) ---

  const persistMinutes = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    if (minutes) {
      const { error } = await supabase
        .from("meeting_minutes")
        .update({ content: minutesContent })
        .eq("id", minutes.id)
      if (error) throw error
    } else if (minutesContent.trim().length > 0) {
      const { error } = await supabase
        .from("meeting_minutes")
        .insert({ meeting_id: meetingId, content: minutesContent, created_by: user.id })
      if (error) throw error
    } else {
      return // empty + no row yet — nothing to save
    }
    await loadMinutes()
  }, [minutes, minutesContent, meetingId, supabase])

  const minutesAutosave = useAutosave({
    hasPending: minutesContent !== (minutes?.content ?? ""),
    save: persistMinutes,
    debounceMs: 800,
  })

  // --- Ministering visit names (stored in meeting.description as newline-separated) ---

  const simpleMode = meeting ? getSimpleMode(meeting.meeting_type) : null
  const isMinistering = simpleMode === "ministering"
  const isSimpleView = simpleMode !== null

  const getVisitedNames = (): string[] => {
    const raw = meeting?.description ?? ""
    if (!raw.trim()) return []
    return raw.split("\n").filter((l) => l.trim() !== "")
  }

  const [visitInput, setVisitInput] = useState("")
  const [visitNames, setVisitNames] = useState<string[]>([])
  const [visitDirty, setVisitDirty] = useState(false)

  useEffect(() => {
    if (meeting) setVisitNames(getVisitedNames())
  }, [meeting?.description]) // eslint-disable-line react-hooks/exhaustive-deps

  const addVisitName = () => {
    if (!visitInput.trim()) return
    setVisitNames((prev) => [...prev, visitInput.trim()])
    setVisitInput("")
    setVisitDirty(true)
  }

  const removeVisitName = (index: number) => {
    setVisitNames((prev) => prev.filter((_, i) => i !== index))
    setVisitDirty(true)
  }

  const editVisitName = (index: number, value: string) => {
    setVisitNames((prev) => { const next = [...prev]; next[index] = value; return next })
    setVisitDirty(true)
  }

  const persistVisitNames = useCallback(async () => {
    const joined = visitNames.filter((n) => n.trim()).join("\n") || null
    const { error } = await supabase
      .from("meetings")
      .update({ description: joined })
      .eq("id", meetingId)
    if (error) throw error
    setVisitDirty(false)
    await loadMeeting()
  }, [visitNames, meetingId, supabase])

  // --- Presiding / Conducting (autosaved on the meetings row) ---

  const [presiding, setPresiding] = useState("")
  const [conducting, setConducting] = useState("")

  useEffect(() => {
    if (!meeting) return
    setPresiding(meeting.presiding ?? "")
    setConducting(meeting.conducting ?? "")
  }, [meeting?.id, meeting?.presiding, meeting?.conducting])

  const persistPresidingConducting = useCallback(async () => {
    const { error } = await supabase
      .from("meetings")
      .update({
        presiding: presiding.trim() || null,
        conducting: conducting.trim() || null,
      })
      .eq("id", meetingId)
    if (error) throw error
  }, [presiding, conducting, meetingId, supabase])

  const presidingConductingAutosave = useAutosave({
    hasPending:
      Boolean(meeting) &&
      ((presiding ?? "") !== (meeting?.presiding ?? "") ||
        (conducting ?? "") !== (meeting?.conducting ?? "")),
    save: persistPresidingConducting,
    debounceMs: 600,
  })

  const visitsAutosave = useAutosave({
    hasPending: visitDirty,
    save: persistVisitNames,
    debounceMs: 600,
  })

  // --- Render ---

  if (loading) return <div className="p-4 sm:p-6"><div className="text-center py-12">Loading...</div></div>
  if (!meeting) return <div className="p-4 sm:p-6"><div className="text-center py-12 text-gray-500">Meeting not found</div></div>

  const totalDuration = agendaItems.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
  const templateConfig = getTemplateForMeetingType(meeting.meeting_type)

  // --- Sub-item list renderer ---
  const renderSubItems = (item: AgendaItem, placeholder: string) => {
    const lines = getSubItems(item)
    const inputVal = subItemInputs[item.id] ?? ""
    return (
      <div className="space-y-1.5">
        {lines.map((line, li) => (
          <div key={li} className="flex items-center gap-2 group">
            <span className="text-xs text-gray-400 w-5 text-right shrink-0">{li + 1}.</span>
            <input
              type="text"
              value={line}
              onChange={(e) => editSubItem(item, li, e.target.value)}
              className={`${inputClass} text-sm flex-1 py-1.5`}
            />
            <button
              onClick={() => removeSubItem(item, li)}
              className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="w-5 shrink-0" />
          <input
            type="text"
            placeholder={placeholder}
            value={inputVal}
            onChange={(e) => setSubItemInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubItem(item, inputVal) } }}
            onBlur={(e) => { if (e.target.value.trim()) addSubItem(item, e.target.value) }}
            className={`${inputClass} text-sm flex-1 py-1.5 border-dashed border-gray-300`}
          />
          <button
            onClick={() => addSubItem(item, inputVal)}
            disabled={!inputVal.trim()}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 disabled:opacity-30 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // --- Field renderer per item ---
  const renderItemFields = (item: AgendaItem) => {
    const ft = getFieldTypeForTitle(item.title, meeting?.meeting_type)
    const isDirty = Boolean(editingItems[item.id] && Object.keys(editingItems[item.id]).length > 0)

    switch (ft) {
      case "readonly":
        return null

      case "person":
        return (
          <input
            type="text"
            placeholder={item.description || "Name"}
            value={getEditValue(item, "assigned_to") as string}
            onChange={(e) => setEditField(item.id, "assigned_to", e.target.value)}
            className={`${inputClass} text-sm py-1.5`}
          />
        )

      case "hymn":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Hymn number"
              value={getEditValue(item, "presenter") as string}
              onChange={(e) => setEditField(item.id, "presenter", e.target.value)}
              className={`${inputClass} text-sm py-1.5`}
            />
            <input
              type="text"
              placeholder="Hymn name (optional)"
              value={getEditValue(item, "description") as string}
              onChange={(e) => setEditField(item.id, "description", e.target.value)}
              className={`${inputClass} text-sm py-1.5`}
            />
          </div>
        )

      case "trainer":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Trainer name"
              value={getEditValue(item, "assigned_to") as string}
              onChange={(e) => setEditField(item.id, "assigned_to", e.target.value)}
              className={`${inputClass} text-sm py-1.5`}
            />
            <input
              type="text"
              placeholder="Section / topic"
              value={getEditValue(item, "description") as string}
              onChange={(e) => setEditField(item.id, "description", e.target.value)}
              className={`${inputClass} text-sm py-1.5`}
            />
          </div>
        )

      case "sub_items":
        return renderSubItems(item, getSubItemPlaceholder(item.title))

      case "notes":
        return (
          <input
            type="text"
            placeholder="Notes"
            value={getEditValue(item, "description") as string}
            onChange={(e) => setEditField(item.id, "description", e.target.value)}
            className={`${inputClass} text-sm py-1.5`}
          />
        )

      case "person_notes":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Assigned to"
              value={getEditValue(item, "assigned_to") as string}
              onChange={(e) => setEditField(item.id, "assigned_to", e.target.value)}
              className={`${inputClass} text-sm py-1.5`}
            />
            <input
              type="text"
              placeholder="Notes"
              value={getEditValue(item, "description") as string}
              onChange={(e) => setEditField(item.id, "description", e.target.value)}
              className={`${inputClass} text-sm py-1.5`}
            />
          </div>
        )

      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Assigned to"
              value={getEditValue(item, "assigned_to") as string}
              onChange={(e) => setEditField(item.id, "assigned_to", e.target.value)}
              className={`${inputClass} text-sm py-1.5`}
            />
            <input
              type="text"
              placeholder="Notes"
              value={getEditValue(item, "description") as string}
              onChange={(e) => setEditField(item.id, "description", e.target.value)}
              className={`${inputClass} text-sm py-1.5`}
            />
          </div>
        )
    }
  }

  // --- Saved value preview ---
  const renderSavedPreview = (item: AgendaItem) => {
    const ft = getFieldTypeForTitle(item.title, meeting?.meeting_type)
    const isDirty = Boolean(editingItems[item.id] && Object.keys(editingItems[item.id]).length > 0)
    if (isDirty) return null

    if (ft === "sub_items") {
      if (!item.description) return null
      const lines = item.description.split("\n").filter((l) => l.trim())
      if (lines.length === 0) return null
      return (
        <div className="text-sm text-gray-600 space-y-0.5">
          {lines.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-gray-400 text-xs w-5 text-right shrink-0 pt-0.5">{i + 1}.</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      )
    }

    const parts: string[] = []
    if (item.assigned_to) parts.push(item.assigned_to)
    if (item.presenter) parts.push(item.presenter)
    if (ft !== "hymn" && item.description) parts.push(item.description)

    if (parts.length === 0) return null
    return (
      <p className="text-sm text-indigo-600 flex items-center gap-1.5">
        {fieldIcon(ft)}
        {parts.join(" · ")}
      </p>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link href="/modules/meetings" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Meetings
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 break-words">{meeting.title}</h1>
            <p className="mt-1 text-gray-600 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {new Date(meeting.scheduled_date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(meeting.scheduled_date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                {meeting.end_date && ` – ${new Date(meeting.end_date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
              </span>
              {meeting.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {meeting.location}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ==================== SIMPLE VIEW MODES ==================== */}
      {isSimpleView ? (
        <>
        {/* Ministering Visits — people visited list */}
        {simpleMode === "ministering" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                People Visited
              </CardTitle>
              <CardDescription>
                Record who was visited during this ministering session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {visitNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <span className="text-sm font-bold text-indigo-400 w-6 text-right shrink-0">{i + 1}.</span>
                    <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 group-hover:border-gray-300 transition-colors">
                      <User className="h-4 w-4 text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={name}
                        readOnly={!meetingWriteAllowed}
                        onChange={(e) => editVisitName(i, e.target.value)}
                        className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none"
                      />
                    </div>
                    {meetingWriteAllowed && (
                    <button
                      type="button"
                      onClick={() => removeVisitName(i)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    )}
                  </div>
                ))}
                {meetingWriteAllowed && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="w-6 shrink-0" />
                  <div className="flex items-center gap-2 flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-lg">
                    <User className="h-4 w-4 text-gray-300 shrink-0" />
                    <input
                      type="text"
                      placeholder="Add name of person visited"
                      value={visitInput}
                      onChange={(e) => setVisitInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVisitName() } }}
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addVisitName}
                    disabled={!visitInput.trim()}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 disabled:opacity-30 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                )}
              </div>
              {(visitsAutosave.state !== "idle" || visitNames.length > 0) && (
                <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    {visitNames.length > 0 && (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
                        {visitNames.length} {visitNames.length === 1 ? "person" : "people"} visited
                      </>
                    )}
                  </div>
                  {meetingWriteAllowed && (
                    <AutosaveBadge
                      state={visitsAutosave.state}
                      errorMessage={visitsAutosave.errorMessage}
                      onRetry={() => void visitsAutosave.flush()}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* General Conference — no agenda, just details */}
        {simpleMode === "no_agenda" && (
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div><span className="text-sm text-gray-500">Title</span><p className="font-medium">{meeting.title}</p></div>
                <div><span className="text-sm text-gray-500">Type</span><p className="font-medium capitalize">{meeting.meeting_type?.replace(/_/g, " ")}</p></div>
                <div><span className="text-sm text-gray-500">Date</span><p className="font-medium">{new Date(meeting.scheduled_date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p></div>
                <div><span className="text-sm text-gray-500">Location</span><p className="font-medium">{meeting.location || "—"}</p></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sunday Ward Visits & Teaching Assignments — show who is assigned where */}
        {simpleMode === "assignments" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Assignments
              </CardTitle>
              <CardDescription>
                {meeting.meeting_type === "teaching"
                  ? "Who is teaching where this week"
                  : "Who is visiting which ward this week"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agendaItems.length > 0 ? (
                <div className="space-y-2">
                  {agendaItems.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <span className="text-sm font-bold text-indigo-400 w-6 text-right shrink-0">{i + 1}.</span>
                      <User className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-900 flex-1">{item.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No assignments recorded for this week.</p>
              )}

              {/* Topics taught — only for teaching assignments */}
              {meeting.meeting_type === "teaching" && (
                <div className="mt-6 pt-5 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    Topics Taught
                  </h3>
                  <div className="space-y-2">
                    {visitNames.map((name, i) => (
                      <div key={i} className="flex items-center gap-2 group">
                        <span className="text-sm font-bold text-purple-400 w-6 text-right shrink-0">{i + 1}.</span>
                        <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 group-hover:border-gray-300 transition-colors">
                          <BookOpen className="h-4 w-4 text-gray-400 shrink-0" />
                          <input
                            type="text"
                            value={name}
                            readOnly={!meetingWriteAllowed}
                            onChange={(e) => editVisitName(i, e.target.value)}
                            className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none"
                          />
                        </div>
                        {meetingWriteAllowed && (
                        <button
                          type="button"
                          onClick={() => removeVisitName(i)}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        )}
                      </div>
                    ))}
                    {meetingWriteAllowed && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="w-6 shrink-0" />
                      <div className="flex items-center gap-2 flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-lg">
                        <BookOpen className="h-4 w-4 text-gray-300 shrink-0" />
                        <input
                          type="text"
                          placeholder="Add topic taught"
                          value={visitInput}
                          onChange={(e) => setVisitInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVisitName() } }}
                          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addVisitName}
                        disabled={!visitInput.trim()}
                        className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-50 text-purple-500 hover:bg-purple-100 hover:text-purple-700 disabled:opacity-30 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    )}
                  </div>
                  {meetingWriteAllowed && visitsAutosave.state !== "idle" && (
                    <div className="flex justify-end mt-4 pt-3 border-t">
                      <AutosaveBadge
                        state={visitsAutosave.state}
                        errorMessage={visitsAutosave.errorMessage}
                        onRetry={() => void visitsAutosave.flush()}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </>
      ) : (
      <>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {([
          { key: "details" as Tab, label: "Details", icon: FileText },
          { key: "agenda" as Tab, label: `Agenda (${agendaItems.length})`, icon: ListOrdered },
          { key: "minutes" as Tab, label: "Minutes", icon: FileText },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />{label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Meeting Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div><span className="text-sm text-gray-500">Title</span><p className="font-medium">{meeting.title}</p></div>
                <div><span className="text-sm text-gray-500">Type</span><p className="font-medium capitalize">{meeting.meeting_type?.replace(/_/g, " ")}</p></div>
                <div><span className="text-sm text-gray-500">Start</span><p className="font-medium">{new Date(meeting.scheduled_date).toLocaleString()}</p></div>
                <div><span className="text-sm text-gray-500">End</span><p className="font-medium">{meeting.end_date ? new Date(meeting.end_date).toLocaleString() : "—"}</p></div>
                <div><span className="text-sm text-gray-500">Location</span><p className="font-medium">{meeting.location || "—"}</p></div>
                <div><span className="text-sm text-gray-500">Recurrence</span><p className="font-medium capitalize">{meeting.recurrence_type || "None"}</p></div>
              </div>
              {meeting.description && (
                <div className="mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-500">Description</span>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{meeting.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {agendaItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <ListOrdered className="h-4 w-4 mr-2 text-indigo-600" />
                  Agenda Overview
                </CardTitle>
                <CardDescription>
                  {meetingWriteAllowed
                    ? "Click the Agenda tab to edit items"
                    : "Your account can view this meeting; schedule changes require stake leadership"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agendaItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                      <span className="text-xs font-bold text-gray-400 w-6 text-right">{idx + 1}.</span>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{item.title}</span>
                      </div>
                      {(item.presenter || item.assigned_to) && (
                        <span className="text-xs text-indigo-600 flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {item.presenter || item.assigned_to}
                        </span>
                      )}
                      {item.duration_minutes && (
                        <span className="text-xs text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.duration_minutes}m
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {totalDuration > 0 && (
                  <div className="mt-3 pt-2 border-t text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" /> Total: {totalDuration} minutes
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Agenda Tab */}
      {activeTab === "agenda" &&
        (!meetingWriteAllowed ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-indigo-600" />
                Agenda
              </CardTitle>
              <CardDescription>View only — contact stake leadership to request changes.</CardDescription>
            </CardHeader>
            <CardContent>
              {agendaItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No agenda items.</p>
              ) : (
                <div className="space-y-2">
                  {agendaItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-xs font-bold text-gray-400 w-6 text-right">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">{item.title}</span>
                      </div>
                      {(item.presenter || item.assigned_to) && (
                        <span className="text-xs text-indigo-600 flex items-center shrink-0">
                          <User className="h-3 w-3 mr-1" />
                          {item.presenter || item.assigned_to}
                        </span>
                      )}
                      {item.duration_minutes ? (
                        <span className="text-xs text-gray-400 flex items-center shrink-0">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.duration_minutes}m
                        </span>
                      ) : null}
                    </div>
                  ))}
                  {totalDuration > 0 && (
                    <div className="mt-3 pt-2 border-t text-sm text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> Total: {totalDuration} minutes
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
        <div className="space-y-6">
          {/* Presiding / Conducting header for structured meetings */}
          {templateConfig && (templateConfig.presiding_field || templateConfig.conducting_field) && (
            <Card>
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {templateConfig.presiding_field && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Presiding</label>
                      <input
                        type="text"
                        placeholder="Who is presiding?"
                        value={presiding}
                        readOnly={!meetingWriteAllowed}
                        onChange={(e) => setPresiding(e.target.value)}
                        className={`${inputClass} text-sm py-1.5`}
                      />
                    </div>
                  )}
                  {templateConfig.conducting_field && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Conducting</label>
                      <input
                        type="text"
                        placeholder="Who is conducting?"
                        value={conducting}
                        readOnly={!meetingWriteAllowed}
                        onChange={(e) => setConducting(e.target.value)}
                        className={`${inputClass} text-sm py-1.5`}
                      />
                    </div>
                  )}
                </div>
                {meetingWriteAllowed && (
                  <div className="mt-3 flex justify-end">
                    <AutosaveBadge
                      state={presidingConductingAutosave.state}
                      errorMessage={presidingConductingAutosave.errorMessage}
                      onRetry={() => void presidingConductingAutosave.flush()}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 flex-wrap">
                  Agenda
                  {templateConfig && (
                    <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {templateConfig.label}
                    </span>
                  )}
                </span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {totalDuration > 0 && (
                    <span className="text-sm font-normal text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> {totalDuration} min
                    </span>
                  )}
                  {meetingWriteAllowed && (
                    <AutosaveBadge
                      state={agendaAutosave.state}
                      errorMessage={agendaAutosave.errorMessage}
                      onRetry={() => void agendaAutosave.flush()}
                    />
                  )}
                  {meetingWriteAllowed && templateConfig && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetAgendaToTemplate}
                      title="Replace the current agenda with the handbook template"
                    >
                      Reset to template
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agendaItems.length === 0 ? (
                <div className="py-8 text-center">
                  {templateConfig && meetingWriteAllowed ? (
                    <>
                      <p className="text-gray-600 mb-3">
                        No agenda items yet. Load the handbook agenda for this meeting type to get started.
                      </p>
                      <Button onClick={resetAgendaToTemplate}>
                        <FileText className="h-4 w-4 mr-2" />
                        Use {templateConfig.label} template
                      </Button>
                      <p className="text-xs text-gray-400 mt-3">
                        You can edit, reorder, or delete any item afterwards.
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">
                      No agenda items yet{meetingWriteAllowed ? ". Add one below." : "."}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {agendaItems.map((item, idx) => {
                    const isDirty = Boolean(editingItems[item.id] && Object.keys(editingItems[item.id]).length > 0)
                    const ft = getFieldTypeForTitle(item.title, meeting?.meeting_type)
                    const isReadOnly = ft === "readonly"
                    const sectionHint = templateConfig?.items.find(
                      (cfg) => cfg.title.toLowerCase() === item.title.toLowerCase()
                    )?.description

                    return (
                      <div
                        key={item.id}
                        className={`border rounded-lg transition-all ${
                          isDirty ? "border-indigo-400 bg-indigo-50/40 shadow-sm" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* Header row */}
                        <div className="flex items-center px-3 py-2.5 gap-2">
                          <div className="flex flex-col">
                            <button type="button" onClick={() => moveAgendaItem(idx, "up")} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-20 p-0.5">
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => moveAgendaItem(idx, "down")} disabled={idx === agendaItems.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-20 p-0.5">
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="text-sm font-bold text-indigo-400 w-6 text-right shrink-0">{idx + 1}.</span>

                          <div className="flex-1 flex items-center gap-2">
                            {fieldIcon(ft)}
                            <span className="font-semibold text-gray-900 text-sm">{item.title}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.duration_minutes && (
                              <span className="text-xs text-gray-400 flex items-center bg-gray-50 px-1.5 py-0.5 rounded">
                                <Clock className="h-3 w-3 mr-0.5" />{item.duration_minutes}m
                              </span>
                            )}
                            <button type="button" onClick={() => deleteAgendaItem(item.id)} className="text-gray-300 hover:text-red-500 p-0.5 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {sectionHint && (
                          <p className="px-3 pb-2 ml-[3.25rem] -mt-1 text-xs italic text-gray-500">
                            {sectionHint}
                          </p>
                        )}

                        {!isReadOnly && (
                          <div className="px-3 pb-3 ml-[3.25rem]">
                            {renderItemFields(item)}
                            {renderSavedPreview(item)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add agenda item */}
          <Card>
            <CardHeader><CardTitle className="text-base">Add Agenda Item</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input type="text" placeholder="Agenda item title *" value={newAgendaTitle} onChange={(e) => setNewAgendaTitle(e.target.value)} className={inputClass} />
                  </div>
                  <input type="number" placeholder="Minutes" value={newAgendaDuration} onChange={(e) => setNewAgendaDuration(e.target.value)} className={inputClass} min="1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Assigned to (optional)" value={newAgendaAssigned} onChange={(e) => setNewAgendaAssigned(e.target.value)} className={inputClass} />
                  <input type="text" placeholder="Description (optional)" value={newAgendaDesc} onChange={(e) => setNewAgendaDesc(e.target.value)} className={inputClass} />
                </div>
                <Button onClick={addAgendaItem} disabled={!newAgendaTitle.trim()} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        ))}

      {/* Minutes Tab */}
      {activeTab === "minutes" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Meeting Minutes</span>
              {meetingWriteAllowed && (
                <AutosaveBadge
                  state={minutesAutosave.state}
                  errorMessage={minutesAutosave.errorMessage}
                  onRetry={() => void minutesAutosave.flush()}
                />
              )}
            </CardTitle>
            <CardDescription>
              {minutes ? `Last updated ${new Date(minutes.updated_at).toLocaleString()}` : "Type below — your notes are saved automatically as you go."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              rows={16}
              value={minutesContent}
              readOnly={!meetingWriteAllowed}
              onChange={(e) => meetingWriteAllowed && setMinutesContent(e.target.value)}
              className={`${inputClass}${!meetingWriteAllowed ? " bg-gray-50 text-gray-700" : ""}`}
              placeholder={"Record meeting minutes here...\n\nDiscussion Items:\n- ...\n\nAction Items:\n- [ ] ...\n\nDecisions Made:\n- ..."}
            />
          </CardContent>
        </Card>
      )}

      </>
      )}
    </div>
  )
}
