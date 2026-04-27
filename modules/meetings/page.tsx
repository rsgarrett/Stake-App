"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarView, type CalendarEvent } from "@/components/meetings/CalendarView"
import { MeetingForm, MeetingFormData } from "@/components/meetings/MeetingForm"
import { Calendar, List, Plus } from "lucide-react"
import { format } from "date-fns"

type ViewMode = "calendar" | "list"

interface Meeting {
  id: string
  title: string
  meeting_type: string
  scheduled_date: string
  end_date?: string | null
  location?: string | null
  color?: string | null
  recurrence_type?: string | null
  recurrence_interval?: number | null
  recurrence_end_date?: string | null
  recurrence_days_of_week?: number[] | null
  viewable_by_roles?: string[] | null
  editable_by_roles?: string[] | null
  is_all_day?: boolean | null
  description?: string | null
}

export default function MeetingsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [standardTemplates, setStandardTemplates] = useState<any[]>([])
  const [userRoleKeys, setUserRoleKeys] = useState<string[]>(["all"])
  const [selectedAudience, setSelectedAudience] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadMeetings()
    loadUserRole()
    loadStandardTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("scheduled_date", { ascending: true })

      if (error) throw error
      setMeetings(data || [])
    } catch (error) {
      console.error("Error loading meetings:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadStandardTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("standard_meeting_templates")
        .select("*")
        .order("category")

      if (error) {
        // Template table might not exist yet - that's okay
        console.warn("Standard templates table not found. Run the migration to enable this feature.")
        return
      }
      setStandardTemplates(data || [])
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUserRoleKeys(["all"])
        return
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      const role = userData?.role || ""
      const roleKeys: string[] = ["all"]

      if (["stake_president", "counselor", "clerk"].includes(role)) {
        roleKeys.push("stake_presidency", "stake_council")
      }
      if (role === "high_council") roleKeys.push("high_council", "stake_council")
      if (role === "bishop") roleKeys.push("bishops", "ward_councils")
      if (role === "elders_quorum") roleKeys.push("elders_quorum")
      if (role === "relief_society") roleKeys.push("relief_society")
      if (role === "young_men") roleKeys.push("young_men")
      if (role === "young_women") roleKeys.push("young_women")
      if (role === "primary") roleKeys.push("primary")
      if (role === "sunday_school") roleKeys.push("sunday_school")

      setUserRoleKeys(Array.from(new Set(roleKeys)))
    } catch (error) {
      console.error("Error loading user role:", error)
      setUserRoleKeys(["all"])
    }
  }

  const getAudienceLabel = (key: string) => {
    const labels: Record<string, string> = {
      all: "All my meetings",
      stake_presidency: "Stake Presidency",
      stake_council: "Stake Council",
      high_council: "High Council",
      bishops: "Bishopric",
      ward_councils: "Ward Council",
      elders_quorum: "Elders Quorum",
      relief_society: "Relief Society",
      young_men: "Young Men",
      young_women: "Young Women",
      primary: "Primary",
      sunday_school: "Sunday School",
    }
    return labels[key] || key.replace(/_/g, " ")
  }

  const handleSubmitMeeting = async (formData: MeetingFormData) => {
    try {
      // Convert datetime-local format to ISO string with timezone
      const scheduledDate = formData.scheduled_date.includes('T') 
        ? new Date(formData.scheduled_date).toISOString()
        : formData.scheduled_date
      
      // Build basic meeting data (required fields)
      const meetingData: any = {
        title: formData.title,
        meeting_type: formData.meeting_type,
        scheduled_date: scheduledDate,
      }

      // Only include optional fields if they have values
      if (formData.end_date) {
        meetingData.end_date = formData.end_date.includes('T')
          ? new Date(formData.end_date).toISOString()
          : formData.end_date
      }
      if (formData.location) meetingData.location = formData.location
      if (formData.description) meetingData.description = formData.description
      
      // Try to include new fields - these may not exist if migration hasn't been run
      const extendedFields: any = {}
      
      // Only add extended fields if they have non-default values
      if (formData.is_all_day) extendedFields.is_all_day = formData.is_all_day
      if (formData.recurrence_type && formData.recurrence_type !== "none") {
        extendedFields.recurrence_type = formData.recurrence_type
        extendedFields.recurrence_interval = formData.recurrence_interval
        if (formData.recurrence_end_date) extendedFields.recurrence_end_date = formData.recurrence_end_date
        if (formData.recurrence_days_of_week.length > 0) extendedFields.recurrence_days_of_week = formData.recurrence_days_of_week
      }
      if (formData.viewable_by_roles.length > 0) extendedFields.viewable_by_roles = formData.viewable_by_roles
      if (formData.editable_by_roles.length > 0) extendedFields.editable_by_roles = formData.editable_by_roles
      if (formData.color && formData.color !== "#3b82f6") extendedFields.color = formData.color

      // Track if we're using extended fields (for error recovery)
      const hasExtendedFields = Object.keys(extendedFields).length > 0
      
      // Merge extended fields into meeting data
      Object.assign(meetingData, extendedFields)

      if (selectedMeeting) {
        // Update existing meeting
        const { error } = await supabase
          .from("meetings")
          .update(meetingData)
          .eq("id", selectedMeeting.id)

        if (error) {
          console.error("Update error details:", error)
          throw error
        }
      } else {
        // Create new meeting
        const { error, data } = await supabase
          .from("meetings")
          .insert([meetingData])
          .select()

        if (error) {
          console.error("Insert error details:", error)
          console.error("Error code:", error.code)
          console.error("Error message:", error.message)
          console.error("Error details:", error.details)
          console.error("Meeting data attempted:", JSON.stringify(meetingData, null, 2))
          
          // If we tried to use extended fields and got a 400 error, retry with basic fields only
          // 400 errors often mean columns don't exist
          
          const errorMessage = error.message || error.details || JSON.stringify(error)
          
          // If we used extended fields and got an error, always retry with basic fields
          // This handles the case where the migration hasn't been run yet
          if (hasExtendedFields) {
            console.warn("Columns may not exist yet, retrying with basic fields only...")
            // Try with only the original table columns (before migration 014)
            const basicData: any = {
              title: formData.title,
              meeting_type: formData.meeting_type,
              scheduled_date: scheduledDate,
            }
            if (formData.end_date) {
              basicData.end_date = formData.end_date.includes('T')
                ? new Date(formData.end_date).toISOString()
                : formData.end_date
            }
            if (formData.location) basicData.location = formData.location
            
            const { error: retryError, data: retryData } = await supabase
              .from("meetings")
              .insert([basicData])
              .select()
            
            if (retryError) {
              console.error("Retry also failed:", retryError)
              throw new Error(`Failed to save meeting. ${retryError.message || retryError.details || JSON.stringify(retryError)}`)
            }
            console.log("Meeting saved successfully with basic fields")
          } else {
            throw new Error(`Failed to save meeting: ${errorMessage}`)
          }
        }
      }

      await loadMeetings()
      setShowForm(false)
      setSelectedMeeting(null)
      setSelectedDate(null)
    } catch (error: any) {
      console.error("Error saving meeting:", error)
      const errorMessage = error?.message || error?.toString() || "Unknown error occurred"
      alert(`Failed to save meeting: ${errorMessage}\n\nTip: If you see column errors, run the database migration file: supabase/migrations/014_meetings_calendar_enhancements.sql`)
    }
  }

  const handleDeleteMeeting = async () => {
    if (!selectedMeeting) return
    const confirmDelete = window.confirm(
      `Delete "${selectedMeeting.title}"? This cannot be undone.`
    )
    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", selectedMeeting.id)

      if (error) throw error

      await loadMeetings()
      setShowForm(false)
      setSelectedMeeting(null)
      setSelectedDate(null)
    } catch (error: any) {
      console.error("Error deleting meeting:", error)
      alert("Failed to delete meeting. " + (error?.message || ""))
    }
  }

  const handleCreateFromTemplate = async (template: any) => {
    try {
      const now = new Date()
      const scheduledDate = new Date(now)
      
      // Set default day and time if template has them
      if (template.default_day_of_week !== null && template.default_day_of_week !== undefined) {
        const daysUntil = (template.default_day_of_week - now.getDay() + 7) % 7 || 7
        scheduledDate.setDate(now.getDate() + daysUntil)
      }
      
      if (template.default_time_of_day) {
        const timeParts = template.default_time_of_day.split(":")
        if (timeParts.length >= 2) {
          scheduledDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0)
        }
      }

      const meetingData: MeetingFormData = {
        title: template.title,
        meeting_type: template.meeting_type,
        scheduled_date: scheduledDate.toISOString().slice(0, 16),
        location: template.default_location || "",
        is_all_day: false,
        recurrence_type: (template.default_recurrence_type || "none") as any,
        recurrence_interval: template.default_recurrence_interval || 1,
        recurrence_days_of_week: template.default_day_of_week !== null && template.default_day_of_week !== undefined ? [template.default_day_of_week] : [],
        viewable_by_roles: Array.isArray(template.viewable_by_roles) ? template.viewable_by_roles : [],
        editable_by_roles: [],
        color: "#3b82f6",
        description: template.description || "",
      }

      await handleSubmitMeeting(meetingData)
    } catch (error) {
      console.error("Error creating from template:", error)
      alert("Failed to create meeting from template.")
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedMeeting(null)
    setShowForm(true)
  }

  const handleMeetingRowClick = (event: Meeting) => {
    setSelectedMeeting(event)
    setShowForm(true)
  }

  const handleCalendarEventClick = (event: CalendarEvent) => {
    const meeting = meetings.find((m) => m.id === event.id)
    if (meeting) handleMeetingRowClick(meeting)
  }

  // Convert meetings to calendar events format
  const expandedMeetings = meetings.map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    start_date: meeting.scheduled_date,
    end_date: meeting.end_date,
    meeting_type: meeting.meeting_type,
    location: meeting.location,
    color: meeting.color || "#3b82f6",
  }))

  const baseTemplates = standardTemplates.filter((template) => {
    const roles = Array.isArray(template.viewable_by_roles) ? template.viewable_by_roles : []
    if (roles.length === 0) return true
    return roles.some((role: string) => role === "all" || userRoleKeys.includes(role))
  })
  const filteredTemplates = selectedAudience === "all"
    ? baseTemplates
    : baseTemplates.filter((template) => {
        const roles = Array.isArray(template.viewable_by_roles) ? template.viewable_by_roles : []
        if (roles.length === 0) return true
        return roles.includes("all") || roles.includes(selectedAudience)
      })

  if (showForm) {
    const initialData: Partial<MeetingFormData> | undefined = selectedMeeting
      ? {
          title: selectedMeeting.title,
          meeting_type: selectedMeeting.meeting_type,
          scheduled_date: selectedMeeting.scheduled_date,
          end_date: selectedMeeting.end_date ?? undefined,
          location: selectedMeeting.location ?? undefined,
          color: selectedMeeting.color ?? undefined,
        }
      : selectedDate
      ? {
          scheduled_date: selectedDate.toISOString().slice(0, 16),
        }
      : undefined

    return (
      <div className="p-6">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Choose a Meeting Group</CardTitle>
            <CardDescription>
              Pick a leadership group to see only the meetings that apply to that calling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(["all", ...userRoleKeys])).map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant={selectedAudience === key ? "default" : "outline"}
                  onClick={() => setSelectedAudience(key)}
                >
                  {getAudienceLabel(key)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        <MeetingForm
          onSubmit={handleSubmitMeeting}
          onDelete={handleDeleteMeeting}
          onCancel={() => {
            setShowForm(false)
            setSelectedMeeting(null)
            setSelectedDate(null)
          }}
          initialData={initialData}
          standardTemplates={filteredTemplates}
        />
      </div>
    )
  }

  const upcomingMeetings = meetings
    .filter((m) => new Date(m.scheduled_date) >= new Date())
    .slice(0, 10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings & Conferences</h1>
          <p className="mt-2 text-gray-600">Schedule meetings, manage agendas, and plan conferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-300 rounded-md">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="rounded-r-none"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="space-y-6">
          <CalendarView
            events={expandedMeetings}
            onDateClick={handleDateClick}
            onEventClick={handleCalendarEventClick}
            onAddEvent={() => setShowForm(true)}
          />

          {/* Standard Meeting Templates */}
          {filteredTemplates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Standard Stake Meetings</CardTitle>
                <CardDescription>
                  Quick-add meetings from the General Handbook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">{template.title}</h3>
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500 capitalize">
                          {template.category} • {template.default_recurrence_type}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateFromTemplate(template)}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>Next scheduled meetings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : upcomingMeetings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="border-b pb-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={() => handleMeetingRowClick(meeting)}
                    >
                      <div className="font-medium">{meeting.title}</div>
                      <div className="text-sm text-gray-600">{meeting.meeting_type}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(meeting.scheduled_date).toLocaleString()}
                        {meeting.location && ` • ${meeting.location}`}
                      </div>
                      {meeting.recurrence_type && meeting.recurrence_type !== "none" && (
                        <div className="text-xs text-indigo-600 mt-1">
                          Repeats {meeting.recurrence_type}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No upcoming meetings</p>
              )}
            </CardContent>
          </Card>

          {/* Standard Templates in List View */}
          {filteredTemplates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Standard Meeting Templates</CardTitle>
                <CardDescription>General Handbook meetings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{template.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {template.category} • {template.default_recurrence_type}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateFromTemplate(template)}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
