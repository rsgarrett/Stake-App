"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

const ROLE_OPTIONS = [
  { value: "stake_presidency", label: "Stake Presidency" },
  { value: "high_council", label: "High Council" },
  { value: "bishops", label: "Bishops" },
  { value: "elders_quorum", label: "Elders Quorum" },
  { value: "relief_society", label: "Relief Society" },
  { value: "young_men", label: "Young Men" },
  { value: "young_women", label: "Young Women" },
  { value: "primary", label: "Primary" },
  { value: "sunday_school", label: "Sunday School" },
  { value: "ward_councils", label: "Ward Councils" },
  { value: "stake_council", label: "Stake Council" },
  { value: "all", label: "All" },
]

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
}: MeetingFormProps) {
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const toggleRole = (role: string, field: "viewable_by_roles" | "editable_by_roles") => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(role)
        ? prev[field].filter((r) => r !== role)
        : [...prev[field], role],
    }))
  }

  const toggleDayOfWeek = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      recurrence_days_of_week: prev.recurrence_days_of_week.includes(day)
        ? prev.recurrence_days_of_week.filter((d) => d !== day)
        : [...prev.recurrence_days_of_week, day],
    }))
  }

  const applyTemplate = (template: StandardMeetingTemplate) => {
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

    const endDate = new Date(scheduledDate)
    const durationMinutes = template.default_duration_minutes || 60
    endDate.setMinutes(endDate.getMinutes() + durationMinutes)

    setFormData((prev) => ({
      ...prev,
      title: template.title,
      meeting_type: template.meeting_type,
      scheduled_date: scheduledDate.toISOString().slice(0, 16),
      end_date: template.default_time_of_day ? endDate.toISOString().slice(0, 16) : "",
      location: template.default_location || "",
      is_all_day: false,
      recurrence_type: (template.default_recurrence_type || "weekly") as any,
      recurrence_interval: template.default_recurrence_interval || 1,
      recurrence_days_of_week:
        template.default_day_of_week !== null && template.default_day_of_week !== undefined
          ? [template.default_day_of_week]
          : [],
      viewable_by_roles: Array.isArray(template.viewable_by_roles)
        ? template.viewable_by_roles
        : [],
      description: template.description || "",
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Meeting" : "Schedule New Meeting"}</CardTitle>
        <CardDescription>Create a meeting with optional recurrence and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            {standardTemplates && standardTemplates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Handbook Meeting (optional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const templateId = e.target.value
                    setSelectedTemplateId(templateId)
                    const template = standardTemplates.find((t) => t.id === templateId)
                    if (template) {
                      applyTemplate(template)
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        meeting_type: prev.title,
                      }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Custom meeting</option>
                  {standardTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Name *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                    meeting_type: selectedTemplateId ? prev.meeting_type : e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
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
                    title={color.label}
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
                    {option.label}
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
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
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

          {/* Permissions */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who can view this meeting?
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => toggleRole(role.value, "viewable_by_roles")}
                    className={`px-3 py-1 rounded-md text-sm ${
                      formData.viewable_by_roles.includes(role.value)
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who can edit this meeting?
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => toggleRole(role.value, "editable_by_roles")}
                    className={`px-3 py-1 rounded-md text-sm ${
                      formData.editable_by_roles.includes(role.value)
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            {initialData && onDelete ? (
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


