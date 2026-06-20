"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  BookOpen, CheckCircle2, Users, MessageSquare, CalendarDays, ClipboardList,
  RefreshCw, ExternalLink,
} from "lucide-react"
import {
  getFieldTypeForTitle, getSubItemPlaceholder, getTemplateForMeetingType,
  type AgendaFieldType,
} from "@/lib/meetings/agenda-field-config"
import { canManageStakeMeetings } from "@/lib/meetings/meeting-permissions"
import { useAgendaPeople } from "@/lib/meetings/use-agenda-people"
import { setAgendaReturn } from "@/lib/navigation/agenda-return"

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
  notes?: string | null
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
  calendar: CalendarDays,
  action_items: ClipboardList,
  agenda_submissions: FileText,
  callings_link: Users,
  notes: MessageSquare,
  person_notes: User,
}

const ACTION_ITEM_STATUSES = ["Assigned", "In Progress", "Completed"] as const

/** Calendar rows are stored one-per-line in `description`, with the three
 *  columns tab-separated: `date<TAB>time<TAB>event`. Tabs can't be typed into
 *  the inputs, so they're a safe delimiter and no schema change is needed. */
const CALENDAR_COL_SEP = "\t"
interface CalendarRow {
  date: string
  time: string
  event: string
}
function parseCalendarRows(raw: string | null | undefined): CalendarRow[] {
  if (!raw) return []
  return raw.split("\n").map((line) => {
    const parts = line.split(CALENDAR_COL_SEP)
    // Legacy free-text rows (no tabs) fall into the event column.
    if (parts.length === 1) return { date: "", time: "", event: parts[0] }
    return { date: parts[0] ?? "", time: parts[1] ?? "", event: parts[2] ?? "" }
  })
}
function serializeCalendarRows(rows: CalendarRow[]): string {
  return rows
    .map((r) => [r.date, r.time, r.event].join(CALENDAR_COL_SEP))
    .join("\n")
}

/** Action-item rows are stored one-per-line in `description`, tab-separated as
 *  `assignment<TAB>assignedTo<TAB>status`. Same delimiter rationale as calendar. */
interface ActionRow {
  assignment: string
  assignedTo: string
  status: string
}
function parseActionRows(raw: string | null | undefined): ActionRow[] {
  if (!raw) return []
  return raw.split("\n").map((line) => {
    const parts = line.split(CALENDAR_COL_SEP)
    // Legacy free-text rows (no tabs) fall into the assignment column.
    if (parts.length === 1) return { assignment: parts[0], assignedTo: "", status: "" }
    return { assignment: parts[0] ?? "", assignedTo: parts[1] ?? "", status: parts[2] ?? "" }
  })
}
function serializeActionRows(rows: ActionRow[]): string {
  return rows
    .map((r) => [r.assignment, r.assignedTo, r.status].join(CALENDAR_COL_SEP))
    .join("\n")
}

/** Submitted agenda rows: `agendaItem<TAB>submittedBy` per line in `description`. */
interface SubmissionRow {
  agendaItem: string
  submittedBy: string
}
function parseSubmissionRows(raw: string | null | undefined): SubmissionRow[] {
  if (!raw) return []
  return raw.split("\n").map((line) => {
    const parts = line.split(CALENDAR_COL_SEP)
    if (parts.length === 1) return { agendaItem: parts[0], submittedBy: "" }
    return { agendaItem: parts[0] ?? "", submittedBy: parts[1] ?? "" }
  })
}
function serializeSubmissionRows(rows: SubmissionRow[]): string {
  return rows
    .map((r) => [r.agendaItem, r.submittedBy].join(CALENDAR_COL_SEP))
    .join("\n")
}

function isWardAndMemberNeedsTitle(title: string): boolean {
  const lower = title.toLowerCase()
  return lower.includes("ward") && lower.includes("member") && lower.includes("need")
}

function isAddAgendaItemTitle(title: string): boolean {
  return title.toLowerCase().includes("add agenda item")
}

/** Live link to the General Handbook on churchofjesuschrist.org. */
const GENERAL_HANDBOOK_URL =
  "https://www.churchofjesuschrist.org/study/manual/general-handbook?lang=eng"

/**
 * Advance a handbook topic to the next section number. The stake marches
 * through the Handbook sequentially (1.0 → 1.1 → 1.2 …), so the trailing
 * numeric segment is incremented. Returns just the number (the new section's
 * title is left for the user to fill). Non-numeric topics are returned as-is.
 */
function nextHandbookTopic(prev: string | null | undefined): string {
  const raw = (prev ?? "").trim()
  const m = /^(\d+(?:\.\d+)*)/.exec(raw)
  if (!m) return raw
  const parts = m[1].split(".").map((n) => parseInt(n, 10))
  parts[parts.length - 1] += 1
  return parts.join(".")
}

function fieldIcon(ft: AgendaFieldType) {
  const Icon = FIELD_ICONS[ft]
  return Icon ? <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" /> : null
}

/** Per-section meeting notes — skip on prayers and vision/goal headers. */
function shouldShowItemNotes(title: string, meetingType?: string): boolean {
  const lower = title.toLowerCase()
  const ft = getFieldTypeForTitle(title, meetingType)
  if (ft === "person" && lower.includes("prayer")) return false
  if (ft === "readonly") return false
  if (lower.includes("stake vision") || lower.includes("goal review")) return false
  if (lower.includes("vision / goal") || lower.includes("vision/goal")) return false
  return true
}

/** Template hint text — skip on vision/goal so it isn't stacked under the title. */
function shouldShowSectionHint(title: string, meetingType?: string): boolean {
  const lower = title.toLowerCase()
  if (lower.includes("stake vision") || lower.includes("goal review")) return false
  if (lower.includes("vision / goal") || lower.includes("vision/goal")) return false
  if (getFieldTypeForTitle(title, meetingType) === "readonly") return false
  return true
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
  const { people: agendaPeople } = useAgendaPeople()
  const [seededTemplateForMeetingId, setSeededTemplateForMeetingId] = useState<string | null>(null)
  const [carryNotice, setCarryNotice] = useState<string | null>(null)
  const [carryingOver, setCarryingOver] = useState(false)
  const calendarReorderAttempted = useRef<string | null>(null)
  const addAgendaItemAttempted = useRef<string | null>(null)

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

  /** Older seeded agendas put calendar fourth; handbook order expects it first. */
  const ensureCalendarReviewFirst = useCallback(
    async (items: AgendaItem[], meetingType: string) => {
      if (items.length < 2) return
      const calIdx = items.findIndex(
        (it) => getFieldTypeForTitle(it.title, meetingType) === "calendar"
      )
      if (calIdx <= 0) return

      const reordered = [...items]
      const [calItem] = reordered.splice(calIdx, 1)
      reordered.unshift(calItem)

      const results = await Promise.all(
        reordered.map((item, idx) =>
          supabase.from("meeting_agendas").update({ item_order: idx + 1 }).eq("id", item.id)
        )
      )
      const err = results.find((r) => r.error)?.error
      if (err) {
        console.error("Could not move Calendar Review to item 1:", err)
        return
      }
      await loadAgenda()
    },
    [meetingId, supabase] // eslint-disable-line react-hooks/exhaustive-deps
  )

  useEffect(() => {
    calendarReorderAttempted.current = null
  }, [meetingId])

  useEffect(() => {
    if (loading) return
    if (!meeting) return
    if (!meetingWriteAllowed) return
    if (agendaItems.length < 2) return
    if (calendarReorderAttempted.current === meetingId) return

    const calIdx = agendaItems.findIndex(
      (it) => getFieldTypeForTitle(it.title, meeting.meeting_type) === "calendar"
    )
    if (calIdx <= 0) {
      calendarReorderAttempted.current = meetingId
      return
    }

    calendarReorderAttempted.current = meetingId
    void ensureCalendarReviewFirst(agendaItems, meeting.meeting_type)
  }, [
    loading,
    meeting?.id,
    meeting?.meeting_type,
    agendaItems,
    meetingWriteAllowed,
    meetingId,
    ensureCalendarReviewFirst,
  ])

  /** Insert “Add Agenda Item” immediately after “Ward and Member Needs” when missing. */
  const ensureAddAgendaItemSection = useCallback(
    async (items: AgendaItem[]) => {
      const wardIdx = items.findIndex((it) => isWardAndMemberNeedsTitle(it.title))
      if (wardIdx === -1) return
      if (items.some((it) => isAddAgendaItemTitle(it.title))) return

      const insertOrder = items[wardIdx].item_order + 1
      const toShift = items.filter((it) => it.item_order >= insertOrder)
      const shiftResults = await Promise.all(
        toShift.map((it) =>
          supabase
            .from("meeting_agendas")
            .update({ item_order: it.item_order + 1 })
            .eq("id", it.id)
        )
      )
      const shiftErr = shiftResults.find((r) => r.error)?.error
      if (shiftErr) {
        console.error("Could not shift agenda items for Add Agenda Item:", shiftErr)
        return
      }

      const { error } = await supabase.from("meeting_agendas").insert({
        meeting_id: meetingId,
        title: "Add Agenda Item",
        description: null,
        item_order: insertOrder,
        duration_minutes: 5,
      })
      if (error) {
        console.error("Could not insert Add Agenda Item section:", error)
        return
      }
      await loadAgenda()
    },
    [meetingId, supabase] // eslint-disable-line react-hooks/exhaustive-deps
  )

  useEffect(() => {
    addAgendaItemAttempted.current = null
  }, [meetingId])

  useEffect(() => {
    if (loading) return
    if (!meeting) return
    if (!meetingWriteAllowed) return
    if (agendaItems.length === 0) return
    if (addAgendaItemAttempted.current === meetingId) return

    const wardIdx = agendaItems.findIndex((it) => isWardAndMemberNeedsTitle(it.title))
    if (wardIdx === -1) {
      addAgendaItemAttempted.current = meetingId
      return
    }
    if (agendaItems.some((it) => isAddAgendaItemTitle(it.title))) {
      addAgendaItemAttempted.current = meetingId
      return
    }

    addAgendaItemAttempted.current = meetingId
    void ensureAddAgendaItemSection(agendaItems)
  }, [
    loading,
    meeting?.id,
    agendaItems,
    meetingWriteAllowed,
    meetingId,
    ensureAddAgendaItemSection,
  ])

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

  /**
   * Pull unfinished action items forward from the most recent earlier meeting
   * of the same type into this meeting's action-item section. Saves the weekly
   * busywork of retyping carry-over assignments. Merged rows are staged as
   * edits (so they autosave) and de-duplicated against what's already here.
   */
  const carryOverOpenItems = async () => {
    if (!meeting) return
    setCarryNotice(null)
    setCarryingOver(true)
    try {
      const target = agendaItems.find(
        (it) => getFieldTypeForTitle(it.title, meeting.meeting_type) === "action_items"
      )
      if (!target) {
        setCarryNotice("This agenda has no action-item section to carry into.")
        return
      }

      // Most recent earlier meeting of the same type. RLS already scopes
      // meetings to the current user's stake, so no stake filter is needed.
      const { data: prior } = await supabase
        .from("meetings")
        .select("id, scheduled_date")
        .eq("meeting_type", meeting.meeting_type)
        .lt("scheduled_date", meeting.scheduled_date)
        .order("scheduled_date", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!prior) {
        setCarryNotice("No earlier meeting of this type was found.")
        return
      }

      const { data: priorItems } = await supabase
        .from("meeting_agendas")
        .select("title, description")
        .eq("meeting_id", prior.id)

      const openRows: ActionRow[] = []
      for (const pi of priorItems ?? []) {
        if (getFieldTypeForTitle(pi.title, meeting.meeting_type) !== "action_items") continue
        for (const row of parseActionRows(pi.description)) {
          if (!row.assignment.trim()) continue
          if (row.status === "Completed") continue
          openRows.push(row)
        }
      }
      if (openRows.length === 0) {
        setCarryNotice("No open action items to carry over from the last meeting.")
        return
      }

      const key = (r: ActionRow) =>
        `${r.assignment.trim().toLowerCase()}|${r.assignedTo.trim().toLowerCase()}`
      const existing = getActionRows(target).filter((r) => r.assignment.trim())
      const seen = new Set(existing.map(key))
      const merged = [...existing]
      let added = 0
      for (const row of openRows) {
        if (seen.has(key(row))) continue
        seen.add(key(row))
        merged.push(row)
        added += 1
      }
      if (added === 0) {
        setCarryNotice("All open items are already on this agenda.")
        return
      }
      writeActionRows(target.id, merged)
      setCarryNotice(`Carried over ${added} open item${added === 1 ? "" : "s"} — review and they’ll save automatically.`)
    } finally {
      setCarryingOver(false)
    }
  }

  /**
   * Suggest the next person for a rotating assignment (prayer, conducting,
   * handbook trainer, etc.) by round-robin through the presidency + high
   * council roster, advancing one seat past whoever held that role at the most
   * recent earlier meeting of this type. Bishops are excluded from the pool.
   */
  const suggestRotationFor = async (itemTitle: string): Promise<string | null> => {
    if (!meeting) return null
    const pool = agendaPeople.filter((p) => p.role !== "Bishop").map((p) => p.name)
    if (pool.length === 0) return null

    const { data: prior } = await supabase
      .from("meetings")
      .select("id, scheduled_date")
      .eq("meeting_type", meeting.meeting_type)
      .lt("scheduled_date", meeting.scheduled_date)
      .order("scheduled_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    let lastName: string | null = null
    if (prior) {
      const { data: priorItems } = await supabase
        .from("meeting_agendas")
        .select("title, assigned_to")
        .eq("meeting_id", prior.id)
      const match = (priorItems ?? []).find(
        (i) => i.title.toLowerCase() === itemTitle.toLowerCase()
      )
      lastName = (match?.assigned_to ?? "").trim() || null
    }

    if (!lastName) return pool[0]
    const idx = pool.findIndex((n) => n.toLowerCase() === lastName!.toLowerCase())
    if (idx === -1) return pool[0]
    return pool[(idx + 1) % pool.length]
  }

  const rotateAssignment = async (itemTitle: string, apply: (name: string) => void) => {
    const name = await suggestRotationFor(itemTitle)
    if (name) apply(name)
  }

  /** Conducting lives on the meetings row, so its rotation reads the prior
   *  meeting's `conducting` column rather than an agenda item. */
  const rotateConducting = async () => {
    if (!meeting) return
    const pool = agendaPeople.filter((p) => p.role !== "Bishop").map((p) => p.name)
    if (pool.length === 0) return
    const { data: prior } = await supabase
      .from("meetings")
      .select("conducting, scheduled_date")
      .eq("meeting_type", meeting.meeting_type)
      .lt("scheduled_date", meeting.scheduled_date)
      .order("scheduled_date", { ascending: false })
      .limit(1)
      .maybeSingle()
    const lastName = (prior?.conducting ?? "").trim() || null
    if (!lastName) {
      setConducting(pool[0])
      return
    }
    const idx = pool.findIndex((n) => n.toLowerCase() === lastName.toLowerCase())
    setConducting(idx === -1 ? pool[0] : pool[(idx + 1) % pool.length])
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
    const saved: Record<string, Partial<AgendaItem>> = {}
    const results = await Promise.all(
      ids.map((id) => {
        const edits = snapshot[id]
        if (!edits || Object.keys(edits).length === 0) return null
        const payload: Record<string, unknown> = {}
        for (const [key, val] of Object.entries(edits)) {
          payload[key] = val === "" ? null : val
        }
        saved[id] = edits
        return supabase.from("meeting_agendas").update(payload).eq("id", id)
      })
    )
    const firstError = results.find((r) => r && r.error)?.error
    if (firstError) throw firstError

    // Merge the values we just saved into local state so the rendered inputs
    // (which fall back to item[field]) stay current without a server reload.
    setAgendaItems((prev) =>
      prev.map((it) => (saved[it.id] ? { ...it, ...saved[it.id] } : it))
    )

    // Clear only the fields we persisted that haven't changed since the
    // snapshot. Anything typed during the in-flight save is preserved so the
    // next debounce can save it (never reload/clear it out from under typing).
    setEditingItems((prev) => {
      const next: Record<string, Partial<AgendaItem>> = {}
      for (const [id, edits] of Object.entries(prev)) {
        const savedEdits = saved[id]
        if (!savedEdits) {
          next[id] = edits
          continue
        }
        const remaining: Record<string, unknown> = {}
        for (const [field, val] of Object.entries(edits)) {
          if (!(field in savedEdits) || (savedEdits as Record<string, unknown>)[field] !== val) {
            remaining[field] = val
          }
        }
        if (Object.keys(remaining).length > 0) next[id] = remaining as Partial<AgendaItem>
      }
      return next
    })
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

  // --- Calendar rows (date / time / event), stored in `description` ---

  const getCalendarRows = (item: AgendaItem): CalendarRow[] => {
    const raw = (editingItems[item.id]?.description as string | undefined) ?? item.description ?? ""
    return parseCalendarRows(raw)
  }

  const writeCalendarRows = (itemId: string, rows: CalendarRow[]) => {
    const serialized = serializeCalendarRows(rows)
    setEditField(itemId, "description", serialized.length > 0 ? serialized : null)
  }

  const addCalendarRow = (item: AgendaItem) => {
    writeCalendarRows(item.id, [...getCalendarRows(item), { date: "", time: "", event: "" }])
  }

  const editCalendarRow = (item: AgendaItem, index: number, patch: Partial<CalendarRow>) => {
    const rows = getCalendarRows(item)
    rows[index] = { ...rows[index], ...patch }
    writeCalendarRows(item.id, rows)
  }

  const removeCalendarRow = (item: AgendaItem, index: number) => {
    const rows = getCalendarRows(item)
    rows.splice(index, 1)
    writeCalendarRows(item.id, rows)
  }

  // --- Action-item rows (assignment / assigned-to / status), in `description` ---

  const getActionRows = (item: AgendaItem): ActionRow[] => {
    const raw = (editingItems[item.id]?.description as string | undefined) ?? item.description ?? ""
    return parseActionRows(raw)
  }

  const writeActionRows = (itemId: string, rows: ActionRow[]) => {
    const serialized = serializeActionRows(rows)
    setEditField(itemId, "description", serialized.length > 0 ? serialized : null)
  }

  const addActionRow = (item: AgendaItem) => {
    writeActionRows(item.id, [...getActionRows(item), { assignment: "", assignedTo: "", status: "Assigned" }])
  }

  const editActionRow = (item: AgendaItem, index: number, patch: Partial<ActionRow>) => {
    const rows = getActionRows(item)
    rows[index] = { ...rows[index], ...patch }
    writeActionRows(item.id, rows)
  }

  const removeActionRow = (item: AgendaItem, index: number) => {
    const rows = getActionRows(item)
    rows.splice(index, 1)
    writeActionRows(item.id, rows)
  }

  // --- Submitted agenda rows (agenda item / submitted by), in `description` ---

  const getSubmissionRows = (item: AgendaItem): SubmissionRow[] => {
    const raw = (editingItems[item.id]?.description as string | undefined) ?? item.description ?? ""
    return parseSubmissionRows(raw)
  }

  const writeSubmissionRows = (itemId: string, rows: SubmissionRow[]) => {
    const serialized = serializeSubmissionRows(rows)
    setEditField(itemId, "description", serialized.length > 0 ? serialized : null)
  }

  const addSubmissionRow = (item: AgendaItem) => {
    writeSubmissionRows(item.id, [...getSubmissionRows(item), { agendaItem: "", submittedBy: "" }])
  }

  const editSubmissionRow = (item: AgendaItem, index: number, patch: Partial<SubmissionRow>) => {
    const rows = getSubmissionRows(item)
    rows[index] = { ...rows[index], ...patch }
    writeSubmissionRows(item.id, rows)
  }

  const removeSubmissionRow = (item: AgendaItem, index: number) => {
    const rows = getSubmissionRows(item)
    rows.splice(index, 1)
    writeSubmissionRows(item.id, rows)
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
  const hasActionItemsSection = agendaItems.some(
    (it) => getFieldTypeForTitle(it.title, meeting.meeting_type) === "action_items"
  )

  // --- Calendar row renderer (date / time / event) ---
  const renderCalendarRows = (item: AgendaItem) => {
    const rows = getCalendarRows(item)
    return (
      <div className="space-y-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center group">
            <input
              type="date"
              value={row.date}
              onChange={(e) => editCalendarRow(item, ri, { date: e.target.value })}
              className={`${inputClass} text-sm py-1.5 col-span-1 sm:col-span-3`}
            />
            <input
              type="text"
              placeholder="Time"
              value={row.time}
              onChange={(e) => editCalendarRow(item, ri, { time: e.target.value })}
              className={`${inputClass} text-sm py-1.5 col-span-1 sm:col-span-3`}
            />
            <input
              type="text"
              placeholder="Event"
              value={row.event}
              onChange={(e) => editCalendarRow(item, ri, { event: e.target.value })}
              className={`${inputClass} text-sm py-1.5 col-span-2 sm:col-span-5`}
            />
            <button
              onClick={() => removeCalendarRow(item, ri)}
              className="text-red-300 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity col-span-2 sm:col-span-1 flex justify-end sm:justify-center p-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addCalendarRow(item)}>
          <Plus className="h-4 w-4 mr-1" /> Add event
        </Button>
      </div>
    )
  }

  // --- Action-item row renderer (assignment / assigned-to / status) ---
  const renderActionRows = (item: AgendaItem) => {
    const rows = getActionRows(item)
    return (
      <div className="space-y-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center group">
            <input
              type="text"
              placeholder="Assignment"
              value={row.assignment}
              onChange={(e) => editActionRow(item, ri, { assignment: e.target.value })}
              className={`${inputClass} text-sm py-1.5 col-span-2 sm:col-span-5`}
            />
            <input
              type="text"
              list="agenda-people-list"
              placeholder="Assigned to"
              value={row.assignedTo}
              onChange={(e) => editActionRow(item, ri, { assignedTo: e.target.value })}
              className={`${inputClass} text-sm py-1.5 col-span-1 sm:col-span-4`}
            />
            <select
              value={row.status || "Assigned"}
              onChange={(e) => editActionRow(item, ri, { status: e.target.value })}
              className={`${inputClass} text-sm py-1.5 col-span-1 sm:col-span-2`}
            >
              {ACTION_ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => removeActionRow(item, ri)}
              className="text-red-300 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity col-span-2 sm:col-span-1 flex justify-end sm:justify-center p-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addActionRow(item)}>
          <Plus className="h-4 w-4 mr-1" /> Add action item
        </Button>
      </div>
    )
  }

  // --- Submitted agenda row renderer (agenda item / submitted by) ---
  const renderAgendaSubmissionRows = (item: AgendaItem) => {
    const rows = getSubmissionRows(item)
    return (
      <div className="space-y-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center group">
            <input
              type="text"
              placeholder="Agenda item"
              value={row.agendaItem}
              onChange={(e) => editSubmissionRow(item, ri, { agendaItem: e.target.value })}
              className={`${inputClass} text-sm py-1.5 col-span-2 sm:col-span-7`}
            />
            <input
              type="text"
              list="agenda-people-list"
              placeholder="Submitted by"
              value={row.submittedBy}
              onChange={(e) => editSubmissionRow(item, ri, { submittedBy: e.target.value })}
              className={`${inputClass} text-sm py-1.5 col-span-1 sm:col-span-4`}
            />
            <button
              onClick={() => removeSubmissionRow(item, ri)}
              className="text-red-300 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity col-span-2 sm:col-span-1 flex justify-end sm:justify-center p-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addSubmissionRow(item)}>
          <Plus className="h-4 w-4 mr-1" /> Add submission
        </Button>
      </div>
    )
  }

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
              className="text-red-300 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5"
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

  const hasRotationPool = agendaPeople.some((p) => p.role !== "Bishop")

  /** Small "next in rotation" button shown beside rotating person fields. */
  const renderRotateButton = (itemTitle: string, apply: (name: string) => void) => {
    if (!hasRotationPool) return null
    return (
      <button
        type="button"
        onClick={() => void rotateAssignment(itemTitle, apply)}
        title="Suggest the next person in the rotation"
        className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
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
          <div className="flex items-center gap-2">
            <input
              type="text"
              list="agenda-people-list"
              placeholder={item.description || "Name"}
              value={getEditValue(item, "assigned_to") as string}
              onChange={(e) => setEditField(item.id, "assigned_to", e.target.value)}
              className={`${inputClass} text-sm py-1.5`}
            />
            {renderRotateButton(item.title, (n) => setEditField(item.id, "assigned_to", n))}
          </div>
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
          <div className="space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  list="agenda-people-list"
                  placeholder="Trainer name"
                  value={getEditValue(item, "assigned_to") as string}
                  onChange={(e) => setEditField(item.id, "assigned_to", e.target.value)}
                  className={`${inputClass} text-sm py-1.5`}
                />
                {renderRotateButton(item.title, (n) => setEditField(item.id, "assigned_to", n))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Section / topic (e.g. 1.3)"
                  value={getEditValue(item, "description") as string}
                  onChange={(e) => setEditField(item.id, "description", e.target.value)}
                  className={`${inputClass} text-sm py-1.5`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setEditField(
                      item.id,
                      "description",
                      nextHandbookTopic(getEditValue(item, "description") as string)
                    )
                  }
                  title="Advance to the next handbook section number"
                  className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <a
              href={GENERAL_HANDBOOK_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
            >
              Open the General Handbook <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )

      case "calendar":
        return renderCalendarRows(item)

      case "action_items":
        return renderActionRows(item)

      case "agenda_submissions":
        return renderAgendaSubmissionRows(item)

      case "callings_link":
        return (
          <Link
            href={`/modules/leadership?returnTo=${encodeURIComponent(`/modules/meetings/${meetingId}?tab=agenda`)}`}
            onClick={() => setAgendaReturn(`/modules/meetings/${meetingId}?tab=agenda`)}
            className="inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <Users className="h-4 w-4" />
            Open the Calling Tracker
          </Link>
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
              list="agenda-people-list"
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
              list="agenda-people-list"
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

    // Calendar / action-item rows are fully shown by their always-on inputs.
    if (ft === "calendar" || ft === "action_items" || ft === "agenda_submissions") return null
    // Callings link has no saved value to preview.
    if (ft === "callings_link") return null

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
                      className="text-gray-300 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all p-1.5"
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
                          className="text-gray-300 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all p-1.5"
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
          {/* Shared autocomplete source for every person / assigned-to field. */}
          <datalist id="agenda-people-list">
            {agendaPeople.map((p) => (
              <option key={p.name} value={p.name}>
                {p.role}
              </option>
            ))}
          </datalist>
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
                        list="agenda-people-list"
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
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          list="agenda-people-list"
                          placeholder="Who is conducting?"
                          value={conducting}
                          readOnly={!meetingWriteAllowed}
                          onChange={(e) => setConducting(e.target.value)}
                          className={`${inputClass} text-sm py-1.5`}
                        />
                        {meetingWriteAllowed && hasRotationPool && (
                          <button
                            type="button"
                            onClick={() => void rotateConducting()}
                            title="Suggest the next person in the conducting rotation"
                            className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
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
                  {meetingWriteAllowed && hasActionItemsSection && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void carryOverOpenItems()}
                      disabled={carryingOver}
                      title="Pull unfinished action items from the most recent earlier meeting of this type"
                    >
                      <ClipboardList className="h-4 w-4 mr-1.5" />
                      {carryingOver ? "Carrying over…" : "Carry over open items"}
                    </Button>
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
              {carryNotice && (
                <p className="mt-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-3 py-2">
                  {carryNotice}
                </p>
              )}
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

                        {sectionHint && shouldShowSectionHint(item.title, meeting?.meeting_type) && (
                          <p className="px-3 pb-2 ml-[3.25rem] -mt-1 text-xs italic text-gray-500">
                            {sectionHint}
                          </p>
                        )}

                        <div className="px-3 pb-3 ml-[3.25rem] space-y-2">
                          {!isReadOnly && (
                            <>
                              {renderItemFields(item)}
                              {renderSavedPreview(item)}
                            </>
                          )}
                          {shouldShowItemNotes(item.title, meeting?.meeting_type) && (
                            meetingWriteAllowed ? (
                              <textarea
                                rows={2}
                                placeholder="Notes / minutes from the meeting…"
                                value={getEditValue(item, "notes") as string}
                                onChange={(e) => setEditField(item.id, "notes", e.target.value)}
                                className={`${inputClass} text-sm py-1.5 bg-amber-50/40 border-amber-100 focus:bg-white`}
                              />
                            ) : (
                              (getEditValue(item, "notes") as string) ? (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap rounded-md bg-amber-50/40 border border-amber-100 px-3 py-2">
                                  {getEditValue(item, "notes") as string}
                                </p>
                              ) : null
                            )
                          )}
                        </div>
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
                  <input type="text" list="agenda-people-list" placeholder="Assigned to (optional)" value={newAgendaAssigned} onChange={(e) => setNewAgendaAssigned(e.target.value)} className={inputClass} />
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
