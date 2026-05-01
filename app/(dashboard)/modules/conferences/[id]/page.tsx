"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConductingSheetView } from "@/components/conferences/conducting-sheet-view"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import Link from "next/link"
import {
  ArrowLeft, Plus, Trash2, Clock, Music, Calendar,
  FileText, Lightbulb, ChevronDown, ChevronUp, Check, X,
  Send, UserCheck, Edit2, GripVertical, ExternalLink,
  Printer, BookOpen
} from "lucide-react"

import type {
  ConferenceSession, ConferenceProgramItem, ConferenceMinisteringVisit,
  ConferenceNote, ConferenceNameSuggestion, ProgramItemType, InviteStatus,
  ConferenceSessionType
} from "@/types"
import { defaultStakeConferenceSessionDate, normalizeStakeConferenceWeekend } from "@/lib/conferences/stake-conference-schedule"
import { programItemAllowsDuration, programItemMinutesForTotal } from "@/lib/conferences/program-item-duration"
import { PROGRAM_ITEM_LABELS } from "@/lib/conferences/program-item-labels"
import { CONDUCTING_SHEET_HEADER_QUOTES } from "@/lib/conferences/conducting-sheet-header-quotes"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"
import {
  anyStandardOpeningTypeInProgram,
  hasStandardOpeningPrefix,
  isStandardLagFixedProgramItemType,
  isStandardOpeningItemType,
  runStandardOpeningMaintenance,
  sessionUsesStandardOpeningBlock,
  sortProgramItemsByOrder,
  standardOpeningBlockTemplateRows,
  STANDARD_OPENING_ITEM_TYPES,
} from "@/lib/conferences/standard-opening-block"

interface SpecialEvent {
  id: string
  title: string
  description?: string | null
  theme?: string | null
  presiding_authority?: string | null
  start_date: string
  end_date: string
  location?: string | null
  event_type: string
  status: "planned" | "in_progress" | "completed"
  include_sustaining?: boolean
  stand_seating?: string | null
  streaming_notes?: string | null
}

type TabView = "sessions" | "conducting" | "business" | "notes" | "suggestions"

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
const selectClass = "px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"

const SESSION_TYPE_LABELS: Record<ConferenceSessionType, string> = {
  ministering_visits: "Ministering Visits",
  presidency_meeting: "Stake Presidency Meeting",
  leadership_session: "Leadership Session",
  dinner: "Dinner",
  adult_session: "Adult Session",
  general_session: "General Session",
  other: "Other",
}

const INVITE_STATUS_STYLES: Record<InviteStatus, { bg: string; text: string; label: string }> = {
  not_invited: { bg: "bg-gray-100", text: "text-gray-600", label: "Not Invited" },
  invited: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Invited" },
  accepted: { bg: "bg-green-100", text: "text-green-700", label: "Accepted" },
  declined: { bg: "bg-red-100", text: "text-red-700", label: "Declined" },
  completed: { bg: "bg-blue-100", text: "text-blue-700", label: "Completed" },
}

// Priesthood / leadership session outline (Handbook 29.3.3). Types only — duration, assigned to, topic filled in per conference.
const DEFAULT_LEADERSHIP_ITEMS: Partial<ConferenceProgramItem>[] = [
  { item_type: "prelude_music", duration_minutes: 0, display_order: 1 },
  { item_type: "presiding", duration_minutes: 0, display_order: 2 },
  { item_type: "conducting", duration_minutes: 0, display_order: 3 },
  { item_type: "pianist", duration_minutes: 0, display_order: 4 },
  { item_type: "organist", duration_minutes: 0, display_order: 5 },
  { item_type: "music_leader", duration_minutes: 0, display_order: 6 },
  { item_type: "opening_hymn", duration_minutes: 5, display_order: 7 },
  { item_type: "invocation", duration_minutes: 0, display_order: 8 },
  { item_type: "breakout", duration_minutes: 0, display_order: 9 },
  { item_type: "discussion", duration_minutes: 0, display_order: 10 },
  { item_type: "breakout", duration_minutes: 0, display_order: 11 },
  { item_type: "discussion", duration_minutes: 0, display_order: 12 },
  { item_type: "breakout", duration_minutes: 0, display_order: 13 },
  { item_type: "discussion", duration_minutes: 0, display_order: 14 },
  { item_type: "closing_remarks", duration_minutes: 0, display_order: 15 },
  { item_type: "closing_hymn", duration_minutes: 5, display_order: 16 },
  { item_type: "benediction", duration_minutes: 0, display_order: 17 },
]

const DEFAULT_ADULT_ITEMS: Partial<ConferenceProgramItem>[] = [
  { item_type: "prelude_music", duration_minutes: 0, display_order: 1 },
  { item_type: "presiding", duration_minutes: 0, display_order: 2 },
  { item_type: "conducting", duration_minutes: 0, display_order: 3 },
  { item_type: "pianist", duration_minutes: 0, display_order: 4 },
  { item_type: "organist", duration_minutes: 0, display_order: 5 },
  { item_type: "music_leader", duration_minutes: 0, display_order: 6 },
  { item_type: "opening_hymn", duration_minutes: 5, display_order: 7 },
  { item_type: "invocation", duration_minutes: 0, display_order: 8 },
  { item_type: "speaker", duration_minutes: 7, display_order: 9 },
  { item_type: "speaker", duration_minutes: 10, display_order: 10 },
  { item_type: "speaker", duration_minutes: 7, display_order: 11 },
  { item_type: "speaker", duration_minutes: 15, display_order: 12 },
  { item_type: "intermediate_hymn", duration_minutes: 5, display_order: 13 },
  { item_type: "speaker", duration_minutes: 15, display_order: 14 },
  { item_type: "speaker", duration_minutes: 15, display_order: 15 },
  { item_type: "speaker", duration_minutes: 20, display_order: 16 },
  { item_type: "closing_hymn", duration_minutes: 5, display_order: 17 },
  { item_type: "benediction", duration_minutes: 0, display_order: 18 },
]

const DEFAULT_GENERAL_ITEMS: Partial<ConferenceProgramItem>[] = [
  { item_type: "prelude_music", duration_minutes: 0, display_order: 1 },
  { item_type: "presiding", duration_minutes: 0, display_order: 2 },
  { item_type: "conducting", duration_minutes: 0, display_order: 3 },
  { item_type: "pianist", duration_minutes: 0, display_order: 4 },
  { item_type: "organist", duration_minutes: 0, display_order: 5 },
  { item_type: "music_leader", duration_minutes: 0, display_order: 6 },
  { item_type: "opening_hymn", duration_minutes: 5, display_order: 7 },
  { item_type: "invocation", duration_minutes: 0, display_order: 8 },
  { item_type: "stake_business", duration_minutes: 5, display_order: 9 },
  { item_type: "speaker_primary", duration_minutes: 5, display_order: 10 },
  { item_type: "speaker_youth", duration_minutes: 7, display_order: 11 },
  { item_type: "speaker", duration_minutes: 15, display_order: 12 },
  { item_type: "speaker", duration_minutes: 10, display_order: 13 },
  { item_type: "intermediate_hymn", duration_minutes: 5, display_order: 14 },
  { item_type: "speaker", duration_minutes: 10, display_order: 15 },
  { item_type: "speaker", duration_minutes: 15, display_order: 16 },
  { item_type: "special_musical_number", duration_minutes: 5, display_order: 17 },
  { item_type: "speaker", duration_minutes: 30, display_order: 18 },
  { item_type: "closing_hymn", duration_minutes: 5, display_order: 19 },
  { item_type: "benediction", duration_minutes: 0, display_order: 20 },
]

const DEFAULT_PRESIDENCY_ITEMS: Partial<ConferenceProgramItem>[] = [
  { item_type: "discussion", duration_minutes: 5, display_order: 1 },
  { item_type: "discussion", duration_minutes: 10, display_order: 2 },
  { item_type: "discussion", duration_minutes: 10, display_order: 3 },
  { item_type: "discussion", duration_minutes: 10, display_order: 4 },
  { item_type: "instruction", duration_minutes: 10, display_order: 5 },
  { item_type: "discussion", duration_minutes: 10, display_order: 6 },
]

const SESSION_DEFAULTS: Record<string, { items: Partial<ConferenceProgramItem>[]; startTime: string; endTime: string }> = {
  leadership_session: { items: DEFAULT_LEADERSHIP_ITEMS, startTime: "16:00", endTime: "18:00" },
  adult_session: { items: DEFAULT_ADULT_ITEMS, startTime: "19:00", endTime: "21:00" },
  general_session: { items: DEFAULT_GENERAL_ITEMS, startTime: "10:00", endTime: "12:00" },
  dinner: { items: [], startTime: "17:30", endTime: "18:30" },
  presidency_meeting: { items: DEFAULT_PRESIDENCY_ITEMS, startTime: "14:30", endTime: "15:30" },
  ministering_visits: { items: [], startTime: "12:00", endTime: "14:00" },
}

export default function ConferenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const supabase = createClient()

  const [event, setEvent] = useState<SpecialEvent | null>(null)
  const [sessions, setSessions] = useState<ConferenceSession[]>([])
  const [visits, setVisits] = useState<ConferenceMinisteringVisit[]>([])
  const [notes, setNotes] = useState<ConferenceNote[]>([])
  const [suggestions, setSuggestions] = useState<ConferenceNameSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [tabView, setTabView] = useState<TabView>("sessions")
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  // Forms
  const [showAddSession, setShowAddSession] = useState(false)
  const [newSessionType, setNewSessionType] = useState<ConferenceSessionType>("leadership_session")
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [visitForm, setVisitForm] = useState({ presidency_member: "", visitee_name: "", ward: "", start_time: "", end_time: "", notes: "" })
  const [visitError, setVisitError] = useState<string | null>(null)
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteForm, setNoteForm] = useState<{
    content: string
    note_type: "general" | "followup" | "feedback"
  }>({ content: "", note_type: "general" })
  const [showAddSuggestion, setShowAddSuggestion] = useState(false)
  const [suggestionForm, setSuggestionForm] = useState({ suggested_name: "", suggested_role: "", notes: "" })

  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ConferenceProgramItem>>({})
  const [addingPresidencySessionId, setAddingPresidencySessionId] = useState<string | null>(null)
  const [presidencyItemForm, setPresidencyItemForm] = useState({ topic: "", notes: "" })
  const [editingTheme, setEditingTheme] = useState(false)
  const [themeInput, setThemeInput] = useState("")
  const [editingPresiding, setEditingPresiding] = useState(false)
  const [presidingInput, setPresidingInput] = useState("")
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false)
  /** Set when auto-insert of prelude–invocation rows fails (usually DB check constraint). */
  const [openingBlockLoadErrors, setOpeningBlockLoadErrors] = useState<Record<string, string>>({})

  const loadData = useCallback(async (opts?: { background?: boolean }) => {
    const background = opts?.background === true
    if (!background) setLoading(true)
    try {
      setOpeningBlockLoadErrors({})
      const [evRes, sessRes, visitRes, noteRes, sugRes] = await Promise.all([
        supabase.from("special_events").select("*").eq("id", eventId).single(),
        supabase.from("conference_sessions").select("*").eq("event_id", eventId).order("display_order"),
        supabase.from("conference_ministering_visits").select("*").eq("event_id", eventId).order("display_order"),
        supabase.from("conference_notes").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
        supabase.from("conference_name_suggestions").select("*").eq("event_id", eventId).order("created_at"),
      ])

      if (evRes.data) setEvent(evRes.data)
      const sessionsData: ConferenceSession[] = sessRes.data || []

      // Load program items for each session
      if (sessionsData.length > 0) {
        const sessionIds = sessionsData.map((s) => s.id)
        const { data: items } = await supabase
          .from("conference_program_items")
          .select("*")
          .in("session_id", sessionIds)
          .order("display_order")

        const itemsBySession = new Map<string, ConferenceProgramItem[]>()
        ;(items || []).forEach((item: ConferenceProgramItem) => {
          const existing = itemsBySession.get(item.session_id) || []
          existing.push(item)
          itemsBySession.set(item.session_id, existing)
        })

        sessionsData.forEach((s) => {
          s.program_items = itemsBySession.get(s.id) || []
        })

        // Dedupe double standard opening blocks, then auto-prepend if needed (serialized + refetch inside helper)
        const { errors: nextOpeningErrors } = await runStandardOpeningMaintenance(supabase, sessionsData)
        setOpeningBlockLoadErrors(nextOpeningErrors)
      }

      setSessions(sessionsData)
      setVisits(visitRes.data || [])
      setNotes(noteRes.data || [])
      setSuggestions(sugRes.data || [])

      // Auto-expand all sessions on first load
      if (sessionsData.length > 0 && expandedSessions.size === 0) {
        setExpandedSessions(new Set(sessionsData.map((s) => s.id)))
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (!background) setLoading(false)
    }
  }, [eventId])

  useEffect(() => { loadData() }, [loadData])

  const deleteConference = async () => {
    if (!event) return
    setDeletingEvent(true)
    try {
      const { error } = await supabase.from("special_events").delete().eq("id", eventId)
      if (error) {
        console.error(error)
        window.alert(error.message || "Could not delete this event.")
        return
      }
      setDeleteEventDialogOpen(false)
      router.push("/modules/conferences")
    } finally {
      setDeletingEvent(false)
    }
  }

  const toggleSession = (id: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // --- Session CRUD ---
  const addSession = async () => {
    const defaults = SESSION_DEFAULTS[newSessionType] || { items: [], startTime: "", endTime: "" }
    const maxOrder = sessions.length > 0 ? Math.max(...sessions.map((s) => s.display_order)) : 0

    const sessionDate =
      event?.event_type === "stake_conference" && event.start_date
        ? (() => {
            const w = normalizeStakeConferenceWeekend(event.start_date)
            return w ? defaultStakeConferenceSessionDate(newSessionType, w.saturday, w.sunday) : null
          })()
        : null

    const { data: newSession, error } = await supabase.from("conference_sessions").insert({
      event_id: eventId,
      session_type: newSessionType,
      session_label: SESSION_TYPE_LABELS[newSessionType],
      session_date: sessionDate,
      start_time: defaults.startTime || null,
      end_time: defaults.endTime || null,
      display_order: maxOrder + 1,
    }).select().single()

    if (error || !newSession) { console.error(error); return }

    // Insert default program items
    if (defaults.items.length > 0) {
      const itemsToInsert = defaults.items.map((item) => ({
        session_id: newSession.id,
        item_type: item.item_type,
        duration_minutes: item.duration_minutes ?? 0,
        display_order: item.display_order || 0,
        invite_status: "not_invited",
      }))
      await supabase.from("conference_program_items").insert(itemsToInsert)
    }

    setShowAddSession(false)
    await loadData({ background: true })
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Delete this session and all its program items?")) return
    await supabase.from("conference_sessions").delete().eq("id", sessionId)
    await loadData({ background: true })
  }

  const updateSessionField = async (sessionId: string, field: string, value: string) => {
    let payload: Record<string, string | number | null> = {}
    if (field === "dinner_guest_count") {
      const t = value.trim()
      if (t === "") payload[field] = null
      else {
        const n = parseInt(t, 10)
        payload[field] = Number.isFinite(n) && n >= 0 ? n : null
      }
    } else {
      payload[field] = value.trim() === "" ? null : value
    }
    await supabase.from("conference_sessions").update(payload).eq("id", sessionId)
  }

  // --- Program Item CRUD ---
  const addProgramItem = async (sessionId: string, overrides?: { topic?: string | null; notes?: string | null; duration_minutes?: number }) => {
    const session = sessions.find((s) => s.id === sessionId)
    const items = session?.program_items || []
    const isPresidencyMeeting = session?.session_type === "presidency_meeting"
    const isLag = session != null && sessionUsesStandardOpeningBlock(session.session_type)

    let displayOrder: number
    if (!isPresidencyMeeting && isLag) {
      const sorted = sortProgramItemsByOrder(items)
      const firstClosing = sorted.find((i) => i.item_type === "closing_hymn")
      if (firstClosing) {
        const target = firstClosing.display_order
        const toShift = sorted.filter((i) => i.display_order >= target).sort((a, b) => b.display_order - a.display_order)
        for (const row of toShift) {
          const { error: uErr } = await supabase
            .from("conference_program_items")
            .update({ display_order: row.display_order + 1 })
            .eq("id", row.id)
          if (uErr) {
            console.error("addProgramItem shift:", uErr)
            return
          }
        }
        displayOrder = target
      } else {
        const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.display_order)) : 0
        displayOrder = maxOrder + 1
      }
    } else {
      const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.display_order)) : 0
      displayOrder = maxOrder + 1
    }

    const { data: inserted, error } = await supabase
      .from("conference_program_items")
      .insert({
        session_id: sessionId,
        item_type: isPresidencyMeeting ? "discussion" : "speaker",
        duration_minutes: overrides?.duration_minutes ?? (isPresidencyMeeting ? 0 : 10),
        topic: overrides?.topic !== undefined ? overrides.topic : null,
        notes: overrides?.notes !== undefined ? overrides.notes : null,
        display_order: displayOrder,
        invite_status: "not_invited",
      })
      .select("id")
      .maybeSingle()

    if (error) {
      console.error("addProgramItem:", error)
      return
    }

    await loadData({ background: true })
    if (inserted?.id) {
      setEditingItem(inserted.id)
      setEditForm({})
    }
  }

  const addPresidencyItem = async (sessionId: string) => {
    const topic = presidencyItemForm.topic?.trim() || ""
    const notes = presidencyItemForm.notes?.trim() || ""
    if (!topic && !notes) return
    await addProgramItem(sessionId, { topic: topic || null, notes: notes || null, duration_minutes: 0 })
    setPresidencyItemForm({ topic: "", notes: "" })
    setAddingPresidencySessionId(null)
  }

  /** Partial update; does not close the row editor (use for blur / select change auto-save). */
  const patchProgramItem = async (itemId: string, updates: Partial<ConferenceProgramItem>) => {
    setSaving(true)
    const { error } = await supabase.from("conference_program_items").update(updates).eq("id", itemId)
    if (error) console.error("patchProgramItem:", error)
    setSaving(false)
    await loadData({ background: true })
  }

  const moveProgramItem = async (sessionId: string, itemId: string, direction: "up" | "down") => {
    const session = sessions.find((s) => s.id === sessionId)
    if (!session?.program_items) return
    const sorted = sortProgramItemsByOrder(session.program_items)
    const idx = sorted.findIndex((i) => i.id === itemId)
    if (idx < 0) return
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const a = sorted[idx]
    const b = sorted[swapIdx]

    if (sessionUsesStandardOpeningBlock(session.session_type)) {
      const fixedTypes = new Set([...STANDARD_OPENING_ITEM_TYPES, "closing_hymn", "benediction"])
      if (fixedTypes.has(a.item_type) || fixedTypes.has(b.item_type)) return
    }

    await Promise.all([
      supabase.from("conference_program_items").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("conference_program_items").update({ display_order: a.display_order }).eq("id", b.id),
    ])
    await loadData({ background: true })
  }

  const deleteProgramItem = async (itemId: string) => {
    const session = sessions.find((s) => s.program_items?.some((i) => i.id === itemId))
    const item = session?.program_items?.find((i) => i.id === itemId)
    if (session && item && sessionUsesStandardOpeningBlock(session.session_type)) {
      if (isStandardOpeningItemType(item.item_type)) {
        window.alert("Standard opening rows cannot be deleted.")
        return
      }
      const sorted = sortProgramItemsByOrder(session.program_items || [])
      const closingHymnCount = sorted.filter((i) => i.item_type === "closing_hymn").length
      const benedictionCount = sorted.filter((i) => i.item_type === "benediction").length
      const lastClosingHymn = [...sorted].reverse().find((i) => i.item_type === "closing_hymn")
      const lastBenediction = [...sorted].reverse().find((i) => i.item_type === "benediction")
      if (
        (item.item_type === "closing_hymn" && closingHymnCount <= 1 && lastClosingHymn?.id === item.id) ||
        (item.item_type === "benediction" && benedictionCount <= 1 && lastBenediction?.id === item.id)
      ) {
        window.alert("The last closing hymn and benediction cannot be deleted.")
        return
      }
    }
    await supabase.from("conference_program_items").delete().eq("id", itemId)
    await loadData({ background: true })
  }

  /** Rebuild prelude–invocation rows when the program is incomplete or out of order (keeps speakers, etc.). */
  const normalizeStandardOpeningBlock = useCallback(
    async (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session || !sessionUsesStandardOpeningBlock(session.session_type)) return
      const items = session.program_items || []
      if (hasStandardOpeningPrefix(items)) return
      if (
        !confirm(
          "Replace opening roles with the standard prelude–invocation block? Rows for prelude, presiding, conducting, pianist, organist, music leader, opening hymn, and invocation will be rebuilt. Speakers and other items stay."
        )
      )
        return

      const sorted = sortProgramItemsByOrder(items)
      const openingIds = sorted.filter((i) => isStandardOpeningItemType(i.item_type)).map((i) => i.id)
      const nonOpening = sorted.filter((i) => !isStandardOpeningItemType(i.item_type))

      if (openingIds.length > 0) {
        const { error } = await supabase.from("conference_program_items").delete().in("id", openingIds)
        if (error) {
          console.error(error)
          window.alert(error.message || "Could not update program.")
          return
        }
      }

      const base = STANDARD_OPENING_ITEM_TYPES.length
      const STAGE = 1000
      await Promise.all(
        nonOpening.map((row, i) =>
          supabase.from("conference_program_items").update({ display_order: STAGE + i }).eq("id", row.id)
        )
      )

      const insertRows = standardOpeningBlockTemplateRows().map((row) => ({
        ...row,
        session_id: sessionId,
        invite_status: "not_invited" as const,
      }))
      const { error: insErr } = await supabase.from("conference_program_items").insert(insertRows)
      if (insErr) {
        console.error(insErr)
        window.alert(
          `${insErr.message || "Could not insert opening block."}\n\nIf this mentions a check constraint, run 041_conference_program_item_types.sql in the Supabase SQL Editor, then try again.`
        )
        return
      }

      await Promise.all(
        nonOpening.map((row, i) =>
          supabase.from("conference_program_items").update({ display_order: base + 1 + i }).eq("id", row.id)
        )
      )

      await loadData({ background: true })
    },
    [sessions, supabase, loadData]
  )

  const cycleInviteStatus = async (item: ConferenceProgramItem) => {
    const order: InviteStatus[] = ["not_invited", "invited", "accepted", "declined"]
    const currentIdx = order.indexOf(item.invite_status)
    const next = order[(currentIdx + 1) % order.length]
    await patchProgramItem(item.id, { invite_status: next })
  }

  // --- Ministering Visits CRUD ---
  const addVisit = async () => {
    setVisitError(null)
    const name = visitForm.visitee_name?.trim()
    if (!name) return
    const maxOrder = visits.length > 0 ? Math.max(...visits.map((v) => v.display_order ?? 0)) : 0
    const { error } = await supabase.from("conference_ministering_visits").insert({
      event_id: eventId,
      presidency_member: visitForm.presidency_member?.trim() || "",
      visitee_name: name,
      ward: visitForm.ward?.trim() || null,
      start_time: visitForm.start_time || null,
      end_time: visitForm.end_time || null,
      notes: visitForm.notes?.trim() || null,
      display_order: maxOrder + 1,
    })
    if (error) {
      setVisitError(error.message)
      return
    }
    setVisitForm({ presidency_member: "", visitee_name: "", ward: "", start_time: "", end_time: "", notes: "" })
    setShowAddVisit(false)
    await loadData({ background: true })
  }

  const deleteVisit = async (id: string) => {
    await supabase.from("conference_ministering_visits").delete().eq("id", id)
    await loadData({ background: true })
  }

  // --- Notes CRUD ---
  const addNote = async () => {
    if (!noteForm.content) return
    await supabase.from("conference_notes").insert({
      event_id: eventId,
      content: noteForm.content,
      note_type: noteForm.note_type,
    })
    setNoteForm({ content: "", note_type: "general" })
    setShowAddNote(false)
    await loadData({ background: true })
  }

  const deleteNote = async (id: string) => {
    await supabase.from("conference_notes").delete().eq("id", id)
    await loadData({ background: true })
  }

  // --- Name Suggestions CRUD ---
  const addSuggestion = async () => {
    if (!suggestionForm.suggested_name) return
    await supabase.from("conference_name_suggestions").insert({
      event_id: eventId,
      suggested_name: suggestionForm.suggested_name,
      suggested_role: suggestionForm.suggested_role || null,
      notes: suggestionForm.notes || null,
    })
    setSuggestionForm({ suggested_name: "", suggested_role: "", notes: "" })
    setShowAddSuggestion(false)
    await loadData({ background: true })
  }

  const toggleSuggestionUsed = async (id: string, currentUsed: boolean) => {
    await supabase.from("conference_name_suggestions").update({ used: !currentUsed }).eq("id", id)
    await loadData({ background: true })
  }

  const deleteSuggestion = async (id: string) => {
    await supabase.from("conference_name_suggestions").delete().eq("id", id)
    await loadData({ background: true })
  }

  const saveTheme = async () => {
    await supabase.from("special_events").update({ theme: themeInput || null }).eq("id", eventId)
    setEditingTheme(false)
    await loadData({ background: true })
  }

  const savePresiding = async () => {
    await supabase.from("special_events").update({ presiding_authority: presidingInput || null }).eq("id", eventId)
    setEditingPresiding(false)
    await loadData({ background: true })
  }

  const updateEventField = async (field: string, value: any) => {
    await supabase.from("special_events").update({ [field]: value }).eq("id", eventId)
    await loadData({ background: true })
  }

  // --- Helpers ---
  const getTotalDuration = (items: ConferenceProgramItem[]) =>
    items.reduce((sum, i) => sum + programItemMinutesForTotal(i), 0)

  const formatTime = (time?: string) => {
    if (!time) return ""
    const [h, m] = time.split(":")
    const hour = parseInt(h)
    const ampm = hour >= 12 ? "pm" : "am"
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${m} ${ampm}`
  }

  const resolveSessionDisplayDateIso = (
    session: ConferenceSession,
    ev: Pick<SpecialEvent, "event_type" | "start_date"> | null
  ): string | null => {
    if (ev?.event_type === "stake_conference" && ev.start_date) {
      const w = normalizeStakeConferenceWeekend(ev.start_date)
      if (w) {
        return defaultStakeConferenceSessionDate(session.session_type, w.saturday, w.sunday)
      }
    }
    if (session.session_date) return session.session_date
    return ev?.start_date ?? null
  }

  const formatSessionDateShort = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })

  const formatSessionDateLong = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

  const generateConductingText = (session: ConferenceSession, items: ConferenceProgramItem[]) => {
    let lines: string[] = []
    CONDUCTING_SHEET_HEADER_QUOTES.forEach((q) => lines.push(q))
    lines.push("")
    lines.push(session.session_label.toUpperCase())
    const dateIso = resolveSessionDisplayDateIso(session, event)
    if (dateIso) lines.push(`Date: ${formatSessionDateLong(dateIso)}`)
    if (session.start_time && session.end_time) lines.push(`Time: ${formatTime(session.start_time)} – ${formatTime(session.end_time)}`)
    if (event?.presiding_authority) lines.push(`Presiding: ${event.presiding_authority}`)
    if (event?.theme) lines.push(`Theme: ${event.theme}`)
    if (session.announcements) lines.push(`\nAnnouncements: ${session.announcements}`)
    lines.push("")
    sortProgramItemsByOrder(items).forEach((item) => {
      const label = PROGRAM_ITEM_LABELS[item.item_type] || item.item_type
      const parts = [label]
      if (item.assigned_to) parts.push(`— ${item.assigned_to}`)
      if (item.topic || item.hymn_number) parts.push(`| ${item.topic || item.hymn_number}`)
      lines.push(parts.join(" "))
    })
    return lines.join("\n")
  }

  if (loading) return <div className="p-6"><div className="text-center py-12">Loading...</div></div>
  if (!event) return <div className="p-6"><div className="text-center py-12 text-gray-500">Event not found</div></div>

  const HANDBOOK_URL = "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng"

  return (
    <div className="conference-detail-root mx-auto max-w-6xl min-w-0 px-3 py-4 sm:px-6 sm:py-6">
      <div className="conference-detail-print-chrome">
      <div className="mb-4 flex flex-col gap-3 flex-wrap sm:flex-row sm:items-start sm:justify-between">
        <Link href="/modules/conferences" className="text-sm text-indigo-600 hover:text-indigo-800 flex shrink-0 items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Conferences
        </Link>
        <div className="flex shrink-0 flex-wrap items-start gap-x-3 gap-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={deletingEvent}
            onClick={() => setDeleteEventDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete event
          </Button>
          <a href={HANDBOOK_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> General Handbook Ch. 29 — Meetings
          </a>
        </div>
      </div>

      {/* Header Card */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-xl font-bold sm:text-2xl">{event.title}</h1>
              <p className="mt-1 text-sm text-indigo-100 leading-snug">
                {event.event_type === "stake_conference" ? (
                  (() => {
                    const w = normalizeStakeConferenceWeekend(event.start_date)
                    if (!w) {
                      return (
                        <>
                          {new Date(event.start_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                          {event.end_date !== event.start_date && ` – ${new Date(event.end_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
                        </>
                      )
                    }
                    return (
                      <>
                        {new Date(w.saturday + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                        {" – "}
                        {new Date(w.sunday + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </>
                    )
                  })()
                ) : (
                  <>
                    {new Date(event.start_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    {event.end_date !== event.start_date && ` – ${new Date(event.end_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
                  </>
                )}
                {event.location && ` · ${event.location}`}
              </p>
              {event.theme && !editingTheme && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-indigo-200 shrink-0">Theme:</span>
                  <span className="font-medium text-white">{event.theme}</span>
                  <button onClick={() => { setEditingTheme(true); setThemeInput(event.theme || "") }} className="text-indigo-200 hover:text-white"><Edit2 className="h-3 w-3" /></button>
                </div>
              )}
              {!event.theme && !editingTheme && (
                <button onClick={() => { setEditingTheme(true); setThemeInput("") }} className="mt-2 text-xs text-indigo-200 hover:text-white underline">+ Add conference theme</button>
              )}
              {editingTheme && (
                <div className="mt-2 flex flex-wrap items-start gap-2">
                  <input type="text" value={themeInput} onChange={(e) => setThemeInput(e.target.value)} placeholder="e.g., Stake Vision, Ministering in a Higher Way" className="w-full max-w-xl rounded px-2 py-1 text-sm text-gray-900 bg-white/90 sm:max-w-lg" autoFocus onKeyDown={(e) => e.key === "Enter" && saveTheme()} />
                  <button onClick={saveTheme} className="text-white hover:text-indigo-200"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingTheme(false)} className="text-indigo-200 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
              )}
              {event.presiding_authority && !editingPresiding && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-indigo-200 shrink-0">Presiding:</span>
                  <span className="break-words text-sm text-white">{event.presiding_authority}</span>
                  <button onClick={() => { setEditingPresiding(true); setPresidingInput(event.presiding_authority || "") }} className="text-indigo-200 hover:text-white"><Edit2 className="h-3 w-3" /></button>
                </div>
              )}
              {!event.presiding_authority && !editingPresiding && (
                <button onClick={() => { setEditingPresiding(true); setPresidingInput("") }} className="mt-1 text-xs text-indigo-200 hover:text-white underline">+ Set presiding authority</button>
              )}
              {editingPresiding && (
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <select value={presidingInput} onChange={(e) => setPresidingInput(e.target.value)} className="w-full max-w-xs rounded px-2 py-1 text-sm text-gray-900 bg-white/90 sm:w-auto">
                    <option value="">{englishMenuTitleCase("Select...")}</option>
                    <option value="Stake President">{englishMenuTitleCase("Stake president")}</option>
                    <option value="Area Seventy">{englishMenuTitleCase("Area seventy")}</option>
                    <option value="General Authority">{englishMenuTitleCase("General authority")}</option>
                  </select>
                  <input type="text" value={presidingInput} onChange={(e) => setPresidingInput(e.target.value)} placeholder="Or type a name..." className="w-full max-w-sm rounded px-2 py-1 text-sm text-gray-900 bg-white/90 sm:w-48" onKeyDown={(e) => e.key === "Enter" && savePresiding()} />
                  <button onClick={savePresiding} className="text-white hover:text-indigo-200"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingPresiding(false)} className="text-indigo-200 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="-mx-3 mb-6 flex gap-1 overflow-x-auto border-b px-3 pb-px [-webkit-overflow-scrolling:touch] sm:mx-0 sm:px-0">
        {([
          { key: "sessions" as const, label: `Sessions (${sessions.length})`, icon: Calendar },
          { key: "conducting" as const, label: "Conducting Sheets", icon: Printer },
          { key: "business" as const, label: "Stake Business", icon: UserCheck },
          { key: "notes" as const, label: `Notes (${notes.length})`, icon: FileText },
          { key: "suggestions" as const, label: `Name Bank (${suggestions.length})`, icon: Lightbulb },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTabView(key)}
            className={`flex shrink-0 items-center rounded-t-md px-2.5 py-2 text-xs font-medium border-b-2 -mb-px sm:px-4 sm:text-sm whitespace-nowrap ${tabView === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Icon className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2" />{label}
          </button>
        ))}
      </div>
      </div>

      {/* ==================== SESSIONS TAB ==================== */}
      {tabView === "sessions" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button className="w-full sm:w-auto" onClick={() => setShowAddSession(true)}><Plus className="h-4 w-4 mr-2" />Add Session</Button>
          </div>

          {showAddSession && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-start">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                    <select value={newSessionType} onChange={(e) => setNewSessionType(e.target.value as ConferenceSessionType)} className={inputClass}>
                      {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {englishMenuTitleCase(label)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={addSession}>Add</Button>
                  <Button variant="outline" onClick={() => setShowAddSession(false)}>Cancel</Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {(newSessionType === "leadership_session" || newSessionType === "adult_session" || newSessionType === "general_session")
                    ? "A default program template will be created. You can customize every item."
                    : newSessionType === "presidency_meeting"
                    ? "Default discussion items will be created for conference preparation."
                    : "An empty session block will be created."}
                </p>
              </CardContent>
            </Card>
          )}

          {sessions.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-gray-500">
              No sessions yet. Add your first session to start building the conference program.
            </CardContent></Card>
          ) : (
            sessions.map((session) => {
              const isExpanded = expandedSessions.has(session.id)
              const items = session.program_items || []
              const isMinisteringVisits = session.session_type === "ministering_visits"
              const totalMin = getTotalDuration(items)
              const confirmedCount = items.filter((i) => i.invite_status === "accepted" || i.invite_status === "completed").length
              const assignedCount = items.filter((i) => i.assigned_to).length
              const needsAction = items.filter((i) => i.invite_status === "not_invited" && i.assigned_to).length

              const sessionColor = session.session_type === "leadership_session" ? "border-l-blue-500"
                : session.session_type === "adult_session" ? "border-l-purple-500"
                : session.session_type === "general_session" ? "border-l-indigo-500"
                : session.session_type === "ministering_visits" ? "border-l-emerald-500"
                : session.session_type === "presidency_meeting" ? "border-l-amber-500"
                : session.session_type === "dinner" ? "border-l-orange-500"
                : "border-l-gray-400"

              const sessionDateIso = resolveSessionDisplayDateIso(session, event)
              const sessionDateLabel = sessionDateIso ? formatSessionDateShort(sessionDateIso) : null

              return (
                <Card key={session.id} className={`overflow-hidden border-l-4 ${sessionColor}`}>
                  <div
                    className="flex cursor-pointer flex-col gap-3 p-4 hover:bg-gray-50 sm:flex-row sm:items-start sm:justify-between"
                    onClick={() => toggleSession(session.id)}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {isExpanded ? <ChevronUp className="h-5 w-5 shrink-0 text-gray-400 mt-0.5" /> : <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 mt-0.5" />}
                      <div className="min-w-0">
                        <div className="break-words text-lg font-semibold text-gray-900">{session.session_label}</div>
                        <div className="text-sm text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {sessionDateLabel && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                              {sessionDateLabel}
                            </span>
                          )}
                          {session.start_time && session.end_time && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                              {formatTime(session.start_time)} – {formatTime(session.end_time)}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-3 flex-wrap mt-1">
                          {isMinisteringVisits ? (
                            <span>{visits.length} visit{visits.length !== 1 ? "s" : ""}</span>
                          ) : session.session_type === "presidency_meeting" ? (
                            <span>{items.length} discussion items</span>
                          ) : session.session_type === "dinner" ? (
                            <>
                              {session.dinner_group_invited && (
                                <span>
                                  <span className="text-gray-400">People invited:</span> {session.dinner_group_invited}
                                </span>
                              )}
                              {session.dinner_provided_by && (
                                <span>
                                  <span className="text-gray-400">Provided by:</span> {session.dinner_provided_by}
                                </span>
                              )}
                              {session.dinner_guest_count != null && (
                                <span>
                                  <span className="text-gray-400">Guests:</span> {session.dinner_guest_count}
                                </span>
                              )}
                              {!session.dinner_group_invited &&
                                !session.dinner_provided_by &&
                                session.dinner_guest_count == null && (
                                  <span className="text-gray-400">Add dinner details when expanded</span>
                                )}
                            </>
                          ) : (
                            <>
                              <span>{items.length} items</span>
                              <span>{totalMin} min</span>
                              {assignedCount > 0 && (
                                <span className="text-green-600">{confirmedCount}/{assignedCount} confirmed</span>
                              )}
                              {needsAction > 0 && (
                                <span className="text-amber-600 font-medium">{needsAction} need invite</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-2 sm:pt-0.5 self-end sm:self-start" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => deleteSession(session.id)} className="text-red-400 hover:text-red-600 p-1" title="Delete session">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t">
                      {session.session_type === "leadership_session" && (
                        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
                          <p>
                            <strong>Handbook 29.3.1 / 29.3.3:</strong>{" "}
                            {event?.presiding_authority && (event.presiding_authority.toLowerCase().includes("area") || event.presiding_authority.toLowerCase().includes("general"))
                              ? "When a General Authority or Area Seventy presides, this meeting includes all members of the stake council AND ward councils (bishoprics, EQ presidencies, RS presidencies, etc.)."
                              : "When the stake president presides, this meeting includes priesthood leaders only — stake presidency, high council, clerks, executive secretaries, bishoprics, elders quorum presidencies, and Aaronic Priesthood quorum advisers."
                            }
                          </p>
                        </div>
                      )}
                      {session.session_type === "adult_session" && (
                        <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 text-xs text-purple-700">
                          <strong>Handbook 29.3.1:</strong> Saturday evening session for all stake members 18 and older. A member of the stake presidency conducts. Depending on local circumstances, this meeting may be held on Sunday if approved by the presiding authority.
                        </div>
                      )}
                      {session.session_type === "general_session" && (
                        <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 text-xs text-indigo-700">
                          <strong>Handbook 29.3.1:</strong> Sunday general session for all members. The stake president conducts and speaks. No visual aids or audiovisual materials. If General Officers, temple president/matron, mission president/companion, or stake patriarch attend, they sit on the stand.
                        </div>
                      )}
                      <div className="px-4 py-3 bg-gray-50 border-b">
                        <div className={`grid gap-3 ${(session.session_type !== "ministering_visits" && session.session_type !== "presidency_meeting" && session.session_type !== "leadership_session" && session.session_type !== "dinner") ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                            <input type="time" defaultValue={session.start_time || ""} onBlur={(e) => updateSessionField(session.id, "start_time", e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                            <input type="time" defaultValue={session.end_time || ""} onBlur={(e) => updateSessionField(session.id, "end_time", e.target.value)} className={inputClass} />
                          </div>
                          {(session.session_type !== "ministering_visits" && session.session_type !== "presidency_meeting" && session.session_type !== "leadership_session" && session.session_type !== "dinner") && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Broadcast URL</label>
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                                <input type="url" defaultValue={session.broadcast_url || ""} placeholder="YouTube link..." onBlur={(e) => updateSessionField(session.id, "broadcast_url", e.target.value)} className={inputClass} />
                                {session.broadcast_url && (
                                  <a href={session.broadcast_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 p-1">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {session.session_type === "dinner" && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">People invited</label>
                              <input
                                type="text"
                                defaultValue={session.dinner_group_invited || ""}
                                placeholder="e.g., Stake council members, ward RS presidencies"
                                onBlur={(e) => updateSessionField(session.id, "dinner_group_invited", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Assigned to provide dinner</label>
                              <input
                                type="text"
                                defaultValue={session.dinner_provided_by || ""}
                                placeholder="e.g., Relief Society, High Priests Group"
                                onBlur={(e) => updateSessionField(session.id, "dinner_provided_by", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Number of guests (expected)</label>
                              <input
                                type="number"
                                min={0}
                                defaultValue={session.dinner_guest_count ?? ""}
                                placeholder="e.g., 45"
                                onBlur={(e) => updateSessionField(session.id, "dinner_guest_count", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                          </div>
                        )}
                        {(session.session_type !== "ministering_visits" && session.session_type !== "presidency_meeting" && session.session_type !== "dinner") && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Equipment Needed</label>
                              <input type="text" defaultValue={session.equipment_notes || ""} placeholder="Projector, wireless mics, whiteboard..." onBlur={(e) => updateSessionField(session.id, "equipment_notes", e.target.value)} className={inputClass} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Announcements (for conducting sheet)</label>
                              <input type="text" defaultValue={session.announcements || ""} placeholder="Announcements for conducting sheet..." onBlur={(e) => updateSessionField(session.id, "announcements", e.target.value)} className={inputClass} />
                            </div>
                          </div>
                        )}
                      </div>

                      {session.session_type === "ministering_visits" ? (
                        <div className="px-4 py-3">
                          {visitError && (
                            <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{visitError}</div>
                          )}
                          {showAddVisit ? (
                            <div className="mb-4 p-4 border border-emerald-200 rounded-lg bg-emerald-50">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                                <input type="text" placeholder="Name being visited *" value={visitForm.visitee_name} onChange={(e) => setVisitForm({ ...visitForm, visitee_name: e.target.value })} className={inputClass} />
                                <input type="text" placeholder="Who is making the visit" value={visitForm.presidency_member} onChange={(e) => setVisitForm({ ...visitForm, presidency_member: e.target.value })} className={inputClass} />
                                <input type="text" placeholder="Ward" value={visitForm.ward} onChange={(e) => setVisitForm({ ...visitForm, ward: e.target.value })} className={inputClass} />
                                <input type="time" placeholder="Time" value={visitForm.start_time} onChange={(e) => setVisitForm({ ...visitForm, start_time: e.target.value })} className={inputClass} title="Time of visit" />
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button onClick={addVisit} size="sm">Add name</Button>
                                <Button variant="outline" size="sm" onClick={() => setShowAddVisit(false)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setVisitError(null); setShowAddVisit(true) }} className="text-emerald-600 hover:text-emerald-800 text-sm flex items-center mb-3">
                              <Plus className="h-3.5 w-3.5 mr-1" /> Add name
                            </button>
                          )}
                          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] rounded-lg border">
                            <p className="px-3 pt-3 text-[11px] text-gray-500 md:hidden">
                              Swipe sideways to see all columns.
                            </p>
                            <table className="w-full min-w-[560px] text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b text-left">
                                  <th className="px-3 py-2 font-medium text-gray-500">Name</th>
                                  <th className="px-3 py-2 font-medium text-gray-500">Who is visiting</th>
                                  <th className="px-3 py-2 font-medium text-gray-500">Ward</th>
                                  <th className="px-3 py-2 font-medium text-gray-500">Time</th>
                                  <th className="px-3 py-2 w-12"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {visits.map((v) => (
                                  <tr key={v.id} className="border-b hover:bg-gray-50 last:border-b-0">
                                    <td className="px-3 py-2 font-medium text-gray-800">{v.visitee_name}</td>
                                    <td className="px-3 py-2 text-gray-600">{v.presidency_member || "—"}</td>
                                    <td className="px-3 py-2 text-gray-600">{v.ward || "—"}</td>
                                    <td className="px-3 py-2 text-gray-600">{v.start_time ? formatTime(v.start_time) : "—"}</td>
                                    <td className="px-3 py-2">
                                      <button onClick={() => deleteVisit(v.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {visits.length === 0 && !showAddVisit && <p className="text-gray-500 text-sm py-4">No visits added yet. Click &quot;Add name&quot; to add someone to visit.</p>}
                        </div>
                      ) : session.session_type === "dinner" ? null : (
                      <>
                      {sessionUsesStandardOpeningBlock(session.session_type) &&
                        openingBlockLoadErrors[session.id] &&
                        !hasStandardOpeningPrefix(items) && (
                        <div className="px-4 py-3 bg-red-50 border-b border-red-200 text-sm text-red-900">
                          <p className="font-medium">Standard opening rows couldn&apos;t be created automatically</p>
                          <p className="mt-1 text-red-800 break-words">{openingBlockLoadErrors[session.id]}</p>
                          <p className="mt-2 text-xs text-red-700">
                            In Supabase open <strong>SQL</strong>, run the full script <code className="bg-red-100 px-1 rounded font-mono text-[11px]">041_conference_program_item_types.sql</code> from this repo, then refresh this page. After that, prelude through invocation appear by themselves for leadership, adult, and general sessions.
                          </p>
                        </div>
                      )}
                      {sessionUsesStandardOpeningBlock(session.session_type) &&
                        !hasStandardOpeningPrefix(items) &&
                        anyStandardOpeningTypeInProgram(items) && (
                        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-sm text-amber-950 flex flex-wrap items-center gap-2">
                          <span>This session doesn&apos;t start with the full standard opening block (prelude through invocation).</span>
                          <Button type="button" variant="outline" size="sm" className="border-amber-300" onClick={() => void normalizeStandardOpeningBlock(session.id)}>
                            Fix opening block
                          </Button>
                        </div>
                      )}
                      <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                        {(() => {
                          const isPresidencyMeeting = session.session_type === "presidency_meeting"
                          const sortedProgramItems = sortProgramItemsByOrder(items)
                          const firstClosingIdx =
                            !isPresidencyMeeting && sessionUsesStandardOpeningBlock(session.session_type)
                              ? sortedProgramItems.findIndex((i) => i.item_type === "closing_hymn")
                              : -1
                          const lastClosingHymnIdx = sortedProgramItems.map((i) => i.item_type).lastIndexOf("closing_hymn")
                          const lastBenedictionIdx = sortedProgramItems.map((i) => i.item_type).lastIndexOf("benediction")
                          const typeOptionsForAdd = Object.entries(PROGRAM_ITEM_LABELS).filter(
                            ([val]) => !isStandardLagFixedProgramItemType(val as ProgramItemType)
                          )
                          return (
                        <>
                        {!isPresidencyMeeting && (
                          <p className="mb-2 px-1 text-[11px] text-gray-500 md:hidden">
                            Swipe sideways for full program row (type, assignee, notes, status).
                          </p>
                        )}
                        <table className={`w-full text-sm ${isPresidencyMeeting ? "min-w-0" : "min-w-[720px]"}`}>
                          <thead>
                            <tr className="bg-gray-50 border-b text-left">
                              {isPresidencyMeeting ? (
                                <>
                                  <th className="px-3 py-2 font-medium text-gray-500">Topic</th>
                                  <th className="px-3 py-2 font-medium text-gray-500">Notes</th>
                                  <th className="px-3 py-2 font-medium text-gray-500 w-16"></th>
                                </>
                              ) : (
                                <>
                                  <th className="px-3 py-2 font-medium text-gray-500 w-10">#</th>
                                  <th className="px-3 py-2 font-medium text-gray-500">Type</th>
                                  <th className="px-3 py-2 font-medium text-gray-500 w-14">Min</th>
                                  <th className="px-3 py-2 font-medium text-gray-500">Assigned To</th>
                                  <th className="px-3 py-2 font-medium text-gray-500">Topic / Hymn</th>
                                  <th className="px-3 py-2 font-medium text-gray-500">Notes</th>
                                  <th className="px-3 py-2 font-medium text-gray-500 w-24">Status</th>
                                  <th className="px-3 py-2 font-medium text-gray-500 w-16"></th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {sortedProgramItems.map((item, idx) => {
                              const isEditing = editingItem === item.id
                              const showAddRowBefore =
                                !isPresidencyMeeting &&
                                sessionUsesStandardOpeningBlock(session.session_type) &&
                                firstClosingIdx >= 0 &&
                                idx === firstClosingIdx
                              const addItemRow = showAddRowBefore ? (
                                <tr key={`${session.id}-add-slot`} className="border-b bg-slate-50/90">
                                  <td className="px-3 py-2" colSpan={8}>
                                    <button
                                      type="button"
                                      onClick={() => addProgramItem(session.id)}
                                      className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                                    >
                                      <Plus className="h-3.5 w-3.5 mr-1" /> Add item
                                    </button>
                                  </td>
                                </tr>
                              ) : null
                              const statusStyle = INVITE_STATUS_STYLES[item.invite_status]
                              const isBreakout = item.item_type === "breakout"
                              const isDiscussion = item.item_type === "discussion"
                              const isOpeningFixed = sessionUsesStandardOpeningBlock(session.session_type) && isStandardOpeningItemType(item.item_type)
                              const isLastClosingHymn = item.item_type === "closing_hymn" && idx === lastClosingHymnIdx
                              const isLastBenediction = item.item_type === "benediction" && idx === lastBenedictionIdx
                              const isClosingFixed = isLastClosingHymn || isLastBenediction
                              const isProtected = isOpeningFixed || isClosingFixed
                              const canMove = !isProtected

                              if (isEditing) {
                                if (isPresidencyMeeting) {
                                  return (
                                    <tr key={item.id} className="border-b bg-indigo-50">
                                      <td className="px-3 py-2">
                                        <input
                                          type="text"
                                          value={editForm.topic ?? item.topic ?? ""}
                                          onChange={(e) => setEditForm((f) => ({ ...f, topic: e.target.value }))}
                                          onBlur={(e) =>
                                            void patchProgramItem(item.id, {
                                              topic: e.target.value.trim() || undefined,
                                            })
                                          }
                                          placeholder="Topic"
                                          className={inputClass}
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <input
                                          type="text"
                                          value={editForm.notes ?? item.notes ?? ""}
                                          onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                                          onBlur={(e) =>
                                            void patchProgramItem(item.id, {
                                              notes: e.target.value.trim() || undefined,
                                            })
                                          }
                                          placeholder="Notes"
                                          className={inputClass}
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <button
                                          type="button"
                                          onClick={() => { setEditingItem(null); setEditForm({}) }}
                                          className="text-green-600 hover:text-green-700 p-1"
                                          title="Done (each field saves when you leave it)"
                                        >
                                          <Check className="h-4 w-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                }
                                return (
                                  <Fragment key={item.id}>
                                    {addItemRow}
                                  <tr className="border-b bg-indigo-50">
                                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                                    <td className="px-3 py-2">
                                      {sessionUsesStandardOpeningBlock(session.session_type) &&
                                      isStandardLagFixedProgramItemType(editForm.item_type || item.item_type) ? (
                                        <span className="font-medium text-gray-800">
                                          {PROGRAM_ITEM_LABELS[editForm.item_type || item.item_type] ||
                                            (editForm.item_type || item.item_type)}
                                        </span>
                                      ) : (
                                      <select
                                        value={editForm.item_type || item.item_type}
                                        onChange={(e) => {
                                          const v = e.target.value as ProgramItemType
                                          setEditForm((f) => ({ ...f, item_type: v }))
                                          const patch: Partial<ConferenceProgramItem> = { item_type: v }
                                          if (!programItemAllowsDuration(v)) patch.duration_minutes = 0
                                          void patchProgramItem(item.id, patch)
                                        }}
                                        className={selectClass}
                                      >
                                        {typeOptionsForAdd.map(([val, lbl]) => (
                                          <option key={val} value={val}>
                                            {englishMenuTitleCase(lbl)}
                                          </option>
                                        ))}
                                      </select>
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      {programItemAllowsDuration(editForm.item_type || item.item_type) ? (
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          autoComplete="off"
                                          value={String(editForm.duration_minutes ?? item.duration_minutes ?? "")}
                                          onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, "").slice(0, 3)
                                            if (digits === "") {
                                              setEditForm((f) => ({ ...f, duration_minutes: 0 }))
                                              return
                                            }
                                            const n = parseInt(digits, 10)
                                            if (!Number.isNaN(n)) setEditForm((f) => ({ ...f, duration_minutes: n }))
                                          }}
                                          onBlur={(e) => {
                                            const n = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0
                                            void patchProgramItem(item.id, { duration_minutes: n })
                                          }}
                                          className={`${inputClass} w-16 min-w-[3.25rem]`}
                                        />
                                      ) : (
                                        <span className="text-gray-400 text-sm">—</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        value={editForm.assigned_to ?? item.assigned_to ?? ""}
                                        onChange={(e) => setEditForm((f) => ({ ...f, assigned_to: e.target.value }))}
                                        onBlur={(e) =>
                                        void patchProgramItem(item.id, {
                                          assigned_to: e.target.value.trim() || undefined,
                                        })
                                      }
                                        placeholder="Name..."
                                        className={inputClass}
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        value={editForm.topic ?? item.topic ?? ""}
                                        onChange={(e) => setEditForm((f) => ({ ...f, topic: e.target.value }))}
                                        onBlur={(e) =>
                                            void patchProgramItem(item.id, {
                                              topic: e.target.value.trim() || undefined,
                                            })
                                          }
                                        placeholder="Topic or hymn..."
                                        className={inputClass}
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        value={editForm.notes ?? item.notes ?? ""}
                                        onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                                        onBlur={(e) =>
                                            void patchProgramItem(item.id, {
                                              notes: e.target.value.trim() || undefined,
                                            })
                                          }
                                        placeholder="Notes..."
                                        className={inputClass}
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <select
                                        value={editForm.invite_status || item.invite_status}
                                        onChange={(e) => {
                                          const v = e.target.value as InviteStatus
                                          setEditForm((f) => ({ ...f, invite_status: v }))
                                          void patchProgramItem(item.id, { invite_status: v })
                                        }}
                                        className={selectClass}
                                      >
                                        {Object.entries(INVITE_STATUS_STYLES).map(([val, s]) => (
                                          <option key={val} value={val}>
                                            {englishMenuTitleCase(s.label)}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-3 py-2">
                                      <button
                                        type="button"
                                        onClick={() => { setEditingItem(null); setEditForm({}) }}
                                        className="text-green-600 hover:text-green-700 p-1"
                                        title="Done (each field saves when you change it or leave it)"
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                  </Fragment>
                                )
                              }

                              if (isPresidencyMeeting) {
                                return (
                                  <tr key={item.id} className="border-b hover:bg-gray-50 group bg-blue-50/20">
                                    <td className="px-3 py-2 text-gray-800 max-w-[280px]" title={item.topic || ""}>
                                      {item.topic || item.hymn_number || "—"}
                                    </td>
                                    <td className="px-3 py-2 text-gray-500 text-sm max-w-[240px] truncate" title={item.notes || ""}>
                                      {item.notes || "—"}
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center space-x-1">
                                        <button type="button" onClick={() => moveProgramItem(session.id, item.id, "up")} disabled={idx === 0} className={`p-1 ${idx === 0 ? "text-gray-200" : "text-gray-400 hover:text-gray-600"}`} title="Move up">
                                          <ChevronUp className="h-3.5 w-3.5" />
                                        </button>
                                        <button type="button" onClick={() => moveProgramItem(session.id, item.id, "down")} disabled={idx === sortedProgramItems.length - 1} className={`p-1 ${idx === sortedProgramItems.length - 1 ? "text-gray-200" : "text-gray-400 hover:text-gray-600"}`} title="Move down">
                                          <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                        <button type="button" onClick={() => { setEditingItem(item.id); setEditForm({}) }} className="text-indigo-500 hover:text-indigo-700 p-1" title="Edit">
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button type="button" onClick={() => deleteProgramItem(item.id)} className="text-red-400 hover:text-red-600 p-1" title="Delete">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              }

                              return (
                                <Fragment key={item.id}>
                                  {addItemRow}
                                <tr className={`border-b hover:bg-gray-50 group ${isBreakout ? "bg-amber-50/50" : isDiscussion ? "bg-blue-50/30" : ""}`}>
                                  <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                                  <td className="px-3 py-2">
                                    <span className={`font-medium ${isBreakout ? "text-amber-700" : isDiscussion ? "text-blue-700" : "text-gray-800"}`}>
                                      {PROGRAM_ITEM_LABELS[item.item_type] || item.item_type}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {programItemAllowsDuration(item.item_type) && item.duration_minutes > 0 ? item.duration_minutes : "—"}
                                  </td>
                                  <td className="px-3 py-2 text-gray-800">
                                    {sessionUsesStandardOpeningBlock(session.session_type) && isStandardLagFixedProgramItemType(item.item_type) ? (
                                      <input
                                        type="text"
                                        key={`assign-${item.id}-${item.assigned_to ?? ""}`}
                                        defaultValue={item.assigned_to ?? ""}
                                        placeholder="Name..."
                                        onBlur={(e) => {
                                          const v = e.target.value.trim() || undefined
                                          const prev = item.assigned_to?.trim() || undefined
                                          if (v !== prev) void patchProgramItem(item.id, { assigned_to: v })
                                        }}
                                        className={`${inputClass} py-1.5 text-sm`}
                                      />
                                    ) : (
                                      item.assigned_to || <span className="text-gray-300 italic">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate" title={item.topic || ""}>
                                    {item.topic || item.hymn_number || "—"}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500 text-xs max-w-[150px] truncate" title={item.notes || ""}>
                                    {item.notes || "—"}
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => cycleInviteStatus(item)}
                                      className={`px-2 py-0.5 text-xs rounded-full ${statusStyle.bg} ${statusStyle.text} hover:opacity-80`}
                                      title="Click to cycle status"
                                    >
                                      {statusStyle.label}
                                    </button>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center space-x-1">
                                      {canMove && (
                                        <>
                                          <button type="button" onClick={() => moveProgramItem(session.id, item.id, "up")} disabled={idx === 0 || isStandardLagFixedProgramItemType(sortedProgramItems[idx - 1]?.item_type)} className={`p-1 ${idx === 0 || isStandardLagFixedProgramItemType(sortedProgramItems[idx - 1]?.item_type) ? "text-gray-200" : "text-gray-400 hover:text-gray-600"}`} title="Move up">
                                            <ChevronUp className="h-3.5 w-3.5" />
                                          </button>
                                          <button type="button" onClick={() => moveProgramItem(session.id, item.id, "down")} disabled={idx === sortedProgramItems.length - 1 || sortedProgramItems[idx + 1]?.item_type === "closing_hymn" || sortedProgramItems[idx + 1]?.item_type === "benediction"} className={`p-1 ${idx === sortedProgramItems.length - 1 || sortedProgramItems[idx + 1]?.item_type === "closing_hymn" || sortedProgramItems[idx + 1]?.item_type === "benediction" ? "text-gray-200" : "text-gray-400 hover:text-gray-600"}`} title="Move down">
                                            <ChevronDown className="h-3.5 w-3.5" />
                                          </button>
                                        </>
                                      )}
                                      <button type="button" onClick={() => { setEditingItem(item.id); setEditForm({}) }} className="text-indigo-500 hover:text-indigo-700 p-1" title="Edit row">
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      {!isProtected && (
                                      <button type="button" onClick={() => deleteProgramItem(item.id)} className="text-red-400 hover:text-red-600 p-1" title="Delete">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                </Fragment>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50">
                              {isPresidencyMeeting ? (
                                <td className="px-3 py-2" colSpan={3}>
                                  {addingPresidencySessionId === session.id ? (
                                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 py-1">
                                      <input type="text" value={presidencyItemForm.topic} onChange={(e) => setPresidencyItemForm({ ...presidencyItemForm, topic: e.target.value })} placeholder="Topic" className={`${inputClass} flex-1 min-w-[140px]`} />
                                      <input type="text" value={presidencyItemForm.notes} onChange={(e) => setPresidencyItemForm({ ...presidencyItemForm, notes: e.target.value })} placeholder="Notes" className={`${inputClass} flex-1 min-w-[140px]`} />
                                      <div className="flex gap-2">
                                        <Button onClick={() => addPresidencyItem(session.id)} size="sm">Add</Button>
                                        <Button variant="outline" size="sm" onClick={() => { setAddingPresidencySessionId(null); setPresidencyItemForm({ topic: "", notes: "" }) }}>Cancel</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setAddingPresidencySessionId(session.id)}
                                      className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                                    >
                                      <Plus className="h-3.5 w-3.5 mr-1" /> Add item
                                    </button>
                                  )}
                                </td>
                              ) : sessionUsesStandardOpeningBlock(session.session_type) && firstClosingIdx >= 0 ? (
                                <>
                                  <td className="px-3 py-2" colSpan={2} />
                                  <td className="px-3 py-2 font-semibold text-gray-700">{totalMin}</td>
                                  <td className="px-3 py-2 text-gray-500 text-xs" colSpan={5}>
                                    total minutes {session.start_time && session.end_time && (() => {
                                      const [sh, sm] = session.start_time!.split(":").map(Number)
                                      const [eh, em] = session.end_time!.split(":").map(Number)
                                      const allotted = (eh * 60 + em) - (sh * 60 + sm)
                                      const diff = allotted - totalMin
                                      return diff !== 0 ? <span className={diff > 0 ? "text-green-600 ml-2" : "text-red-600 ml-2"}>({diff > 0 ? "+" : ""}{diff} min {diff > 0 ? "remaining" : "over"})</span> : <span className="text-green-600 ml-2">(exactly on time)</span>
                                    })()}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-3 py-2" colSpan={2}>
                                    <button type="button" onClick={() => addProgramItem(session.id)} className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                                      <Plus className="h-3.5 w-3.5 mr-1" /> Add item
                                    </button>
                                  </td>
                                  <td className="px-3 py-2 font-semibold text-gray-700">{totalMin}</td>
                                  <td className="px-3 py-2 text-gray-500 text-xs" colSpan={5}>
                                    total minutes {session.start_time && session.end_time && (() => {
                                      const [sh, sm] = session.start_time!.split(":").map(Number)
                                      const [eh, em] = session.end_time!.split(":").map(Number)
                                      const allotted = (eh * 60 + em) - (sh * 60 + sm)
                                      const diff = allotted - totalMin
                                      return diff !== 0 ? <span className={diff > 0 ? "text-green-600 ml-2" : "text-red-600 ml-2"}>({diff > 0 ? "+" : ""}{diff} min {diff > 0 ? "remaining" : "over"})</span> : <span className="text-green-600 ml-2">(exactly on time)</span>
                                    })()}
                                  </td>
                                </>
                              )}
                            </tr>
                          </tfoot>
                        </table>
                        </>
                          )
                        })()}
                      </div>
                      </>
                      )}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {tabView === "conducting" && event && (
        <div className="min-w-0 overflow-x-auto">
          <ConductingSheetView
          event={{
            title: event.title,
            theme: event.theme,
            presiding_authority: event.presiding_authority,
            start_date: event.start_date,
            end_date: event.end_date,
            location: event.location,
            event_type: event.event_type,
          }}
          sessions={sessions}
          formatTime={formatTime}
          resolveSessionDisplayDateIso={resolveSessionDisplayDateIso}
          formatSessionDateLong={formatSessionDateLong}
          generateConductingText={generateConductingText}
        />
        </div>
      )}

      {tabView === "business" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stake Business & Stand Seating</CardTitle>
              <CardDescription>Per Handbook 29.3.1 — manage sustaining, ordinations, and stand assignments for the general session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h3 className="font-semibold text-indigo-800 text-sm mb-2">Sustaining of Officers</h3>
                <p className="text-xs text-indigo-700 mb-3">In one stake conference each year, a member of the stake presidency presents general, area, and stake officers for sustaining using the Officers Sustained form (prepared by the stake clerk). This is usually done in the first conference of the year.</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={event?.include_sustaining || false} onChange={(e) => updateEventField("include_sustaining", e.target.checked)} className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-indigo-800">This conference includes sustaining of officers</span>
                </label>
                {event?.include_sustaining && (
                  <div className="mt-3 p-3 bg-white rounded border border-indigo-100">
                    <p className="text-xs text-gray-600 mb-2">Checklist for sustaining:</p>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                      <li>Officers Sustained form prepared by stake clerk</li>
                      <li>General, area, and stake officers listed</li>
                      <li>Any officers called/released between conferences included</li>
                      <li>Brethren recommended for ordination as elders or high priests presented</li>
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">Stand Seating Assignments</h3>
                <p className="text-xs text-gray-500 mb-2">Per Handbook: If General Officers, the temple president and matron, the mission president and companion, or the stake patriarch attend, they should sit on the stand.</p>
                <textarea
                  defaultValue={event?.stand_seating || ""}
                  onBlur={(e) => updateEventField("stand_seating", e.target.value || null)}
                  placeholder="List individuals seated on the stand (e.g., Stake Presidency, Visiting Authority, Temple President & Matron, Mission President & Companion, Stake Patriarch...)"
                  rows={4}
                  className={inputClass}
                />
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">Streaming & Broadcast</h3>
                <p className="text-xs text-gray-500 mb-2">Conference sessions may be streamed to meetinghouses or homes. Stream recordings should be deleted within one day after the meeting.</p>
                <textarea
                  defaultValue={event?.streaming_notes || ""}
                  onBlur={(e) => updateEventField("streaming_notes", e.target.value || null)}
                  placeholder="Streaming plan: which sessions, to which locations, tech specialist assigned..."
                  rows={3}
                  className={inputClass}
                />
              </div>

              {event?.presiding_authority && (event.presiding_authority.toLowerCase().includes("area") || event.presiding_authority.toLowerCase().includes("general")) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold text-amber-800 text-sm mb-1">Visiting Authority Coordination</h3>
                  <p className="text-xs text-amber-700">When an Area Seventy or General Authority presides, a meeting of the visiting authority and the stake presidency (with clerk and executive secretary) is held. The visiting authority directs all planning and approves participants and musical selections in advance.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tabView === "notes" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle>Post-Conference Notes</CardTitle>
                  <CardDescription>Record follow-up items, feedback, and observations</CardDescription>
                </div>
                <Button className="w-full shrink-0 sm:w-auto" onClick={() => setShowAddNote(true)}><Plus className="h-4 w-4 mr-2" />Add Note</Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddNote && (
                <div className="mb-4 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                  <div className="space-y-3">
                    <select
                      value={noteForm.note_type}
                      onChange={(e) =>
                        setNoteForm({
                          ...noteForm,
                          note_type: e.target.value as "general" | "followup" | "feedback",
                        })
                      }
                      className={inputClass}
                    >
                      <option value="general">{englishMenuTitleCase("General note")}</option>
                      <option value="followup">{englishMenuTitleCase("Follow-up action")}</option>
                      <option value="feedback">{englishMenuTitleCase("Feedback")}</option>
                    </select>
                    <textarea value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} placeholder="Write your note..." rows={3} className={inputClass} />
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button onClick={addNote} size="sm">Add Note</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAddNote(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {notes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No post-conference notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="flex flex-col gap-3 border border-gray-200 rounded-lg p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            n.note_type === "followup" ? "bg-amber-100 text-amber-700" :
                            n.note_type === "feedback" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {n.note_type === "followup" ? "Follow-up" : n.note_type === "feedback" ? "Feedback" : "General"}
                          </span>
                          <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-800 text-sm whitespace-pre-wrap">{n.content}</p>
                      </div>
                      <button onClick={() => deleteNote(n.id)} className="self-end text-red-400 hover:text-red-600 sm:self-start sm:ml-3"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== NAME SUGGESTIONS TAB ==================== */}
      {tabView === "suggestions" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle>Name Suggestions</CardTitle>
                  <CardDescription>Track potential speakers, musicians, and participants for future conferences</CardDescription>
                </div>
                <Button className="w-full shrink-0 sm:w-auto" onClick={() => setShowAddSuggestion(true)}><Plus className="h-4 w-4 mr-2" />Add Suggestion</Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddSuggestion && (
                <div className="mb-4 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Name *" value={suggestionForm.suggested_name} onChange={(e) => setSuggestionForm({ ...suggestionForm, suggested_name: e.target.value })} className={inputClass} />
                    <input type="text" placeholder="Suggested Role (e.g., Speaker, Choir)" value={suggestionForm.suggested_role} onChange={(e) => setSuggestionForm({ ...suggestionForm, suggested_role: e.target.value })} className={inputClass} />
                    <input type="text" placeholder="Notes" value={suggestionForm.notes} onChange={(e) => setSuggestionForm({ ...suggestionForm, notes: e.target.value })} className={inputClass} />
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button onClick={addSuggestion} size="sm">Add</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAddSuggestion(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {suggestions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No name suggestions yet.</p>
              ) : (
                <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="px-4 py-2 font-medium text-gray-500">Name</th>
                        <th className="px-4 py-2 font-medium text-gray-500">Suggested Role</th>
                        <th className="px-4 py-2 font-medium text-gray-500">Notes</th>
                        <th className="px-4 py-2 font-medium text-gray-500 w-24">Used</th>
                        <th className="px-4 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {suggestions.map((s) => (
                        <tr key={s.id} className={`border-b hover:bg-gray-50 ${s.used ? "opacity-60" : ""}`}>
                          <td className="px-4 py-2 font-medium text-gray-800">{s.suggested_name}</td>
                          <td className="px-4 py-2 text-gray-600">{s.suggested_role || "—"}</td>
                          <td className="px-4 py-2 text-gray-500">{s.notes || "—"}</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => toggleSuggestionUsed(s.id, s.used)}
                              className={`px-2 py-0.5 text-xs rounded-full ${s.used ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                            >
                              {s.used ? "Used" : "Available"}
                            </button>
                          </td>
                          <td className="px-4 py-2">
                            <button onClick={() => deleteSuggestion(s.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteEventDialogOpen && !!event}
        title="Delete this conference?"
        description={
          event
            ? `You are about to delete “${event.title}.” All sessions, program items, ministering visits, and notes for this event will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Yes, delete"
        pending={deletingEvent}
        onCancel={() => {
          if (!deletingEvent) setDeleteEventDialogOpen(false)
        }}
        onConfirm={deleteConference}
      />
    </div>
  )
}
