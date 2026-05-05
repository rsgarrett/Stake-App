"use client"

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList } from "lucide-react"
import {
  getDefaultAgendaDraftForMeetingType,
  hasInAppAgendaTemplate,
  type AgendaDraftRow,
} from "@/lib/meetings/agenda-templates"
import {
  dedupeSchedulingStandardTemplates,
  normalizeMeetingTypeSlug,
  sortSchedulableStandardTemplates,
  templateAllowedInStakeMeetingScheduler,
} from "@/lib/meetings/schedulable-standard-templates"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

interface StandardMeetingTemplate {
  id: string
  title: string
  description?: string | null
  meeting_type: string
  default_duration_minutes?: number | null
  default_day_of_week?: number | null
  default_time_of_day?: string | null
  default_recurrence_type?: string | null
  default_recurrence_interval?: number | null
  default_location?: string | null
  handbook_reference?: string | null
  is_required?: boolean | null
  viewable_by_roles?: string[] | null
  category?: string | null
}

interface MeetingFormProps {
  onSubmit: (data: MeetingFormData) => void
  onCancel: () => void
  onDelete?: () => void
  initialData?: Partial<MeetingFormData>
  standardTemplates?: StandardMeetingTemplate[]
  existingMeetingNames?: string[]
  /** Opt-in full handbook picker (every `standard_meeting_templates` row). Default: narrowed coordinating-council catalog only. */
  allowFullStandardCatalog?: boolean
  /** When omitted, edit mode is inferred only if both `initialData.title` and `initialData.meeting_type` are set (a date-only preset is still “schedule”). Pass `true` when updating an existing meeting row. */
  isEditingMeeting?: boolean
}

export interface MeetingFormData {
  title: string
  meeting_type: string
  scheduled_date: string
  end_date?: string
  location?: string
  is_all_day: boolean
  recurrence_type: "none" | "daily" | "weekly" | "monthly" | "yearly"
  recurrence_interval: number
  recurrence_end_date?: string
  recurrence_days_of_week: number[]
  viewable_by_roles: string[]
  editable_by_roles: string[]
  color: string
  description?: string
  /** Populated when creating a meeting with an in-app template outline */
  agendaDraft?: AgendaDraftRow[]
}

const RECURRENCE_OPTIONS = [
  { value: "none", label: "No recurrence" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

const MEETING_TYPE_ROLES: Record<string, string[]> = {
  stake_presidency: ["stake_presidency"],
  stake_presidency_meeting: ["stake_presidency"],
  high_council: ["stake_presidency", "high_council"],
  high_council_meeting: ["stake_presidency", "high_council"],
  stake_council: ["stake_presidency", "high_council", "stake_council"],
  stake_council_meeting: ["stake_presidency", "high_council", "stake_council"],
  stake_finance_meeting: ["stake_presidency", "bishops"],
  bishopric_meeting: ["stake_presidency"],
  bishops_council: ["stake_presidency", "bishops"],
  elders_quorum_presidents_council: ["stake_presidency", "high_council", "elders_quorum"],
  relief_society_presidents_council: ["stake_presidency", "high_council", "relief_society"],
  stake_conference: ["all"],
  ward_conference: ["all"],
  sacrament_meeting: ["all"],
  priesthood_leadership: ["stake_presidency", "high_council", "elders_quorum"],
  leadership_meeting: ["stake_presidency", "high_council"],
  stake_adult_leadership: ["stake_presidency", "high_council", "elders_quorum", "relief_society"],
  stake_youth_leadership: ["stake_presidency", "young_men", "young_women"],
  elders_quorum: ["elders_quorum"],
  relief_society: ["relief_society"],
  young_men: ["young_men"],
  young_women: ["young_women"],
  primary: ["primary"],
  sunday_school: ["sunday_school"],
  youth: ["young_men", "young_women"],
  fireside: ["all"],
  training: ["all"],
}

function getRolesForMeetingType(meetingType: string): string[] {
  const normalized = meetingType.toLowerCase().replace(/[\s-]+/g, "_")
  if (MEETING_TYPE_ROLES[normalized]) return MEETING_TYPE_ROLES[normalized]
  for (const [key, roles] of Object.entries(MEETING_TYPE_ROLES)) {
    if (normalized.includes(key)) return roles
  }
  return ["all"]
}

const COLOR_OPTIONS = [
  { value: "#3b82f6", label: "Blue", color: "#3b82f6" },
  { value: "#ef4444", label: "Red", color: "#ef4444" },
  { value: "#10b981", label: "Green", color: "#10b981" },
  { value: "#f59e0b", label: "Orange", color: "#f59e0b" },
  { value: "#8b5cf6", label: "Purple", color: "#8b5cf6" },
  { value: "#ec4899", label: "Pink", color: "#ec4899" },
]

export function MeetingForm({
  onSubmit,
  onCancel,
  onDelete,
  initialData,
  standardTemplates = [],
  existingMeetingNames = [],
  allowFullStandardCatalog = false,
  isEditingMeeting: isEditingMeetingProp,
}: MeetingFormProps) {
  const editingMeeting = useMemo(() => {
    if (typeof isEditingMeetingProp === "boolean") return isEditingMeetingProp
    return Boolean(initialData?.title?.trim() && initialData?.meeting_type?.trim())
  }, [isEditingMeetingProp, initialData?.title, initialData?.meeting_type])
  const [formData, setFormData] = useState<MeetingFormData>({
    title: initialData?.title || "",
    meeting_type: initialData?.meeting_type || initialData?.title || "",
    scheduled_date: initialData?.scheduled_date || new Date().toISOString().slice(0, 16),
    end_date: initialData?.end_date || "",
    location: initialData?.location || "",
    is_all_day: initialData?.is_all_day || false,
    recurrence_type: initialData?.recurrence_type || "none",
    recurrence_interval: initialData?.recurrence_interval || 1,
    recurrence_end_date: initialData?.recurrence_end_date || "",
    recurrence_days_of_week: initialData?.recurrence_days_of_week || [],
    viewable_by_roles: initialData?.viewable_by_roles || [],
    editable_by_roles: initialData?.editable_by_roles || [],
    color: initialData?.color || "#3b82f6",
    description: initialData?.description || "",
  })
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("")
  const [useCustomName, setUseCustomName] = useState(!existingMeetingNames.length || (!!initialData?.title && !existingMeetingNames.includes(initialData.title)))

  /** Deduped filtered catalog for the picker (always enforce narrow UX here so deploys can't skip it). */
  const catalogTemplates = useMemo(() => {
    const deduped = dedupeSchedulingStandardTemplates([...standardTemplates])

    if (allowFullStandardCatalog) {
      return deduped.sort(
        (a, b) =>
          (a.category || "").localeCompare(b.category || "") ||
          (a.title || "").localeCompare(b.title || "")
      )
    }

    let rows = deduped.filter((t) =>
      templateAllowedInStakeMeetingScheduler(
        t.meeting_type,
        initialData?.meeting_type ?? null
      )
    )
    rows = dedupeSchedulingStandardTemplates(rows)
    return sortSchedulableStandardTemplates(rows)
  }, [standardTemplates, allowFullStandardCatalog, initialData?.meeting_type])

  const sortedStandardTemplates = catalogTemplates

  const [draftAgendaRows, setDraftAgendaRows] = useState<AgendaDraftRow[]>([])
  const agendaDraftSlugRef = useRef("")

  const preserveScheduleOnTemplate = Boolean(initialData?.scheduled_date)

  /** Clear user edits when handbook meeting slug changes; defaults come from templates until the user edits. */
  useLayoutEffect(() => {
    if (editingMeeting) {
      agendaDraftSlugRef.current = ""
      setDraftAgendaRows([])
      return
    }
    const mtSlug = normalizeMeetingTypeSlug(formData.meeting_type)
    if (
      !mtSlug ||
      formData.meeting_type === "custom" ||
      !hasInAppAgendaTemplate(formData.meeting_type)
    ) {
      agendaDraftSlugRef.current = ""
      setDraftAgendaRows([])
      return
    }
    if (agendaDraftSlugRef.current !== mtSlug) {
      agendaDraftSlugRef.current = mtSlug
      setDraftAgendaRows([])
    }
  }, [editingMeeting, formData.meeting_type])

  useEffect(() => {
    if (!catalogTemplates.length || !initialData?.meeting_type) return
    const want = normalizeMeetingTypeSlug(initialData.meeting_type)
    const t = catalogTemplates.find(
      (x) => normalizeMeetingTypeSlug(x.meeting_type) === want
    )
    if (t) setSelectedCatalogId(t.id)
    else setSelectedCatalogId("__custom__")
  }, [catalogTemplates, initialData?.meeting_type])

  const toggleDayOfWeek = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      recurrence_days_of_week: prev.recurrence_days_of_week.includes(day)
        ? prev.recurrence_days_of_week.filter((d) => d !== day)
        : [...prev.recurrence_days_of_week, day],
    }))
  }

  const applyTemplateFromCatalog = (template: StandardMeetingTemplate) => {
    setFormData((prev) => {
      let scheduled_date = prev.scheduled_date
      let end_date = prev.end_date

      if (!preserveScheduleOnTemplate) {
        const now = new Date()
        const scheduledDate = new Date(now)

        if (template.default_day_of_week !== null && template.default_day_of_week !== undefined) {
          const daysUntil = (template.default_day_of_week - now.getDay() + 7) % 7 || 7
          scheduledDate.setDate(now.getDate() + daysUntil)
        }

        if (template.default_time_of_day) {
          const [hours, minutes] = template.default_time_of_day.split(":").map((p) => parseInt(p, 10))
          if (!Number.isNaN(hours)) {
            scheduledDate.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0)
          }
        }

        const endDateCalc = new Date(scheduledDate)
        const durationMinutes = template.default_duration_minutes || 60
        endDateCalc.setMinutes(endDateCalc.getMinutes() + durationMinutes)

        scheduled_date = scheduledDate.toISOString().slice(0, 16)
        end_date = template.default_time_of_day ? endDateCalc.toISOString().slice(0, 16) : ""
      } else if (template.default_time_of_day && scheduled_date && !end_date) {
        const start = new Date(scheduled_date)
        const endDateCalc = new Date(start)
        const durationMinutes = template.default_duration_minutes || 60
        endDateCalc.setMinutes(endDateCalc.getMinutes() + durationMinutes)
        end_date = endDateCalc.toISOString().slice(0, 16)
      }

      return {
        ...prev,
        title: template.title,
        meeting_type: template.meeting_type,
        scheduled_date,
        end_date,
        location: template.default_location || prev.location || "",
        is_all_day: false,
        recurrence_type: (template.default_recurrence_type || "weekly") as MeetingFormData["recurrence_type"],
        recurrence_interval: template.default_recurrence_interval || 1,
        recurrence_days_of_week:
          template.default_day_of_week !== null && template.default_day_of_week !== undefined
            ? [template.default_day_of_week]
            : [],
        viewable_by_roles: Array.isArray(template.viewable_by_roles) ? template.viewable_by_roles : [],
        description: template.description || prev.description || "",
      }
    })
    setSelectedCatalogId(template.id)
  }

  const showAgendaOutline =
    !editingMeeting &&
    (formData.meeting_type || "").trim() !== "" &&
    formData.meeting_type !== "custom" &&
    hasInAppAgendaTemplate(formData.meeting_type)

  const scheduleAgendaRows =
    showAgendaOutline &&
    (draftAgendaRows.length > 0 ||
      getDefaultAgendaDraftForMeetingType(formData.meeting_type).length > 0)
      ? draftAgendaRows.length > 0
        ? draftAgendaRows
        : getDefaultAgendaDraftForMeetingType(formData.meeting_type)
      : []

  const patchDraftAgendaRow = (index: number, patch: Partial<AgendaDraftRow>) => {
    const mt = (formData.meeting_type || "").trim()
    setDraftAgendaRows((prev) => {
      const base =
        prev.length > 0
          ? prev
          : showAgendaOutline && mt !== "custom"
            ? getDefaultAgendaDraftForMeetingType(mt)
            : []
      if (!base.length) return prev
      return base.map((row, i) => (i === index ? { ...row, ...patch } : row))
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (catalogTemplates.length > 0) {
      if (!selectedCatalogId) {
        alert("Please select a meeting type.")
        return
      }
      if (selectedCatalogId === "__custom__" && !formData.title.trim()) {
        alert("Please enter a meeting title.")
        return
      }
    }
    const roles = getRolesForMeetingType(formData.meeting_type || formData.title)
    const agendaDraftToSave =
      !editingMeeting && scheduleAgendaRows.length > 0 ? scheduleAgendaRows : undefined
    onSubmit({
      ...formData,
      viewable_by_roles: roles,
      editable_by_roles: roles,
      agendaDraft: agendaDraftToSave,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingMeeting ? "Edit Meeting" : "Schedule New Meeting"}</CardTitle>
        <CardDescription>Attendees are automatically assigned per the General Handbook</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            {catalogTemplates.length > 0 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting type *
                  </label>
                  <select
                    required
                    value={selectedCatalogId}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") {
                        setSelectedCatalogId("")
                        setFormData((prev) => ({ ...prev, title: "", meeting_type: "" }))
                        return
                      }
                      if (v === "__custom__") {
                        setSelectedCatalogId("__custom__")
                        setFormData((prev) => ({
                          ...prev,
                          meeting_type: "custom",
                          title: prev.meeting_type === "custom" ? prev.title : "",
                        }))
                        return
                      }
                      const template = catalogTemplates.find((t) => t.id === v)
                      if (template) applyTemplateFromCatalog(template)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{englishMenuTitleCase("Select a meeting type...")}</option>
                    {sortedStandardTemplates.map((t) => (
                      <option key={`${normalizeMeetingTypeSlug(t.meeting_type)}-${t.id}`} value={t.id}>
                        {englishMenuTitleCase(t.title)}
                      </option>
                    ))}
                    <option value="__custom__">{englishMenuTitleCase("Other (custom)…")}</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Standard stake meetings from the handbook catalog.
                  </p>
                </div>

                {selectedCatalogId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                          meeting_type:
                            selectedCatalogId === "__custom__" ? "custom" : prev.meeting_type,
                        }))
                      }
                      placeholder={
                        selectedCatalogId === "__custom__"
                          ? "Enter meeting title"
                          : "Adjust title if needed"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Name *
                </label>
                {existingMeetingNames.length > 0 && !useCustomName ? (
                  <div className="space-y-2">
                    <select
                      required
                      value={formData.title}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === "__custom__") {
                          setUseCustomName(true)
                          setFormData((prev) => ({ ...prev, title: "", meeting_type: "" }))
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            title: value,
                            meeting_type: value,
                          }))
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">{englishMenuTitleCase("Select a meeting...")}</option>
                      {existingMeetingNames.map((name) => (
                        <option key={name} value={name}>
                          {englishMenuTitleCase(name)}
                        </option>
                      ))}
                      <option value="__custom__">{englishMenuTitleCase("+ New meeting name...")}</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                          meeting_type: e.target.value,
                        }))
                      }
                      placeholder="Enter meeting name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {existingMeetingNames.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setUseCustomName(false)}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Choose from existing meetings
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {showAgendaOutline && scheduleAgendaRows.length > 0 && (
              <div className="rounded-lg border-2 border-indigo-400 bg-gradient-to-br from-white to-indigo-50/50 shadow-md p-4 text-sm text-gray-800">
                <div className="flex items-start gap-2 mb-3">
                  <ClipboardList className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="font-semibold text-gray-900 text-base">Meeting agenda outline</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Handbook-style items for this meeting type. Fill in presenter and topics; these save with your
                      meeting and appear under the Agenda tab.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 max-h-[min(24rem,50vh)] overflow-y-auto rounded-md bg-white border border-indigo-200 p-3">
                  {scheduleAgendaRows.map((row, idx) => (
                    <div
                      key={`${row.title}-${idx}`}
                      className="rounded-md border border-gray-100 bg-gray-50/80 p-3"
                    >
                      <div className="flex flex-wrap items-baseline gap-2 gap-y-1">
                        <span className="text-xs font-semibold text-gray-500 w-8 shrink-0">{idx + 1}.</span>
                        <span className="text-sm font-medium text-gray-900 flex-1 min-w-[8rem]">{row.title}</span>
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0">
                          Minutes
                          <input
                            type="number"
                            min={1}
                            value={row.duration_minutes ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value
                              patchDraftAgendaRow(idx, {
                                duration_minutes:
                                  raw === ""
                                    ? null
                                    : Number.isFinite(parseInt(raw, 10))
                                      ? Math.max(1, parseInt(raw, 10))
                                      : row.duration_minutes,
                              })
                            }}
                            placeholder="—"
                            className="w-14 px-2 py-1 border border-gray-300 rounded-md text-gray-900 text-xs"
                          />
                        </label>
                      </div>
                      {row.sectionHint && (
                        <p className="text-xs text-gray-500 mt-1.5 ml-8 italic">{row.sectionHint}</p>
                      )}
                      <textarea
                        rows={2}
                        value={row.notes}
                        onChange={(e) => patchDraftAgendaRow(idx, { notes: e.target.value })}
                        placeholder="Presenter, topic, hymn number, bullets…"
                        className="mt-2 ml-8 w-[calc(100%-2rem)] px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[2.75rem]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_all_day"
                checked={formData.is_all_day}
                onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_all_day" className="ml-2 block text-sm text-gray-700">
                All-day event
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type={formData.is_all_day ? "date" : "datetime-local"}
                  required
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {!formData.is_all_day && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Stake Center, Room 101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex space-x-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-10 h-10 rounded-full border-2 ${
                      formData.color === color.value ? "border-gray-900" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={englishMenuTitleCase(color.label)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900">Recurrence</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repeat
              </label>
              <select
                value={formData.recurrence_type}
                onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {RECURRENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {englishMenuTitleCase(option.label)}
                  </option>
                ))}
              </select>
            </div>

            {formData.recurrence_type !== "none" && (
              <>
                {formData.recurrence_type === "weekly" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days of Week
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDayOfWeek(day.value)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            formData.recurrence_days_of_week.includes(day.value)
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {englishMenuTitleCase(day.label)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repeat Every
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.recurrence_interval}
                      onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">
                      {formData.recurrence_type === "daily" && "day(s)"}
                      {formData.recurrence_type === "weekly" && "week(s)"}
                      {formData.recurrence_type === "monthly" && "month(s)"}
                      {formData.recurrence_type === "yearly" && "year(s)"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.recurrence_end_date}
                      onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            {editingMeeting && onDelete ? (
              <Button
                type="button"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={onDelete}
              >
                Delete Meeting
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? "Update Meeting" : "Schedule Meeting"}
            </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


