"use client"

import { useState, useMemo } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export interface CalendarEvent {
  id: string
  title: string
  start_date: string
  end_date?: string | null
  meeting_type: string
  location?: string | null
  color?: string | null
}

interface CalendarViewProps {
  events: CalendarEvent[]
  onDateClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onAddEvent?: () => void
}

export function CalendarView({ events, onDateClick, onEventClick, onAddEvent }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const daysInMonth = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    
    events.forEach((event) => {
      const eventDate = format(new Date(event.start_date), "yyyy-MM-dd")
      if (!map.has(eventDate)) {
        map.set(eventDate, [])
      }
      map.get(eventDate)!.push(event)
    })
    
    return map
  }, [events])

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateKey = format(date, "yyyy-MM-dd")
    return eventsByDate.get(dateKey) || []
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        {onAddEvent && (
          <Button onClick={onAddEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Add Meeting
          </Button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {daysInMonth.map((day, idx) => {
          const dayEvents = getEventsForDate(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={idx}
              className={`min-h-[100px] border border-gray-200 p-2 ${
                isCurrentMonth ? "bg-white" : "bg-gray-50"
              } ${isToday ? "ring-2 ring-indigo-500" : ""} cursor-pointer hover:bg-gray-50 transition-colors`}
              onClick={() => onDateClick?.(day)}
            >
              <div className={`text-sm mb-1 ${isCurrentMonth ? "text-gray-900" : "text-gray-400"} ${isToday ? "font-bold text-indigo-600" : ""}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                      event.color || "bg-indigo-100 text-indigo-800"
                    }`}
                    style={{ 
                      backgroundColor: event.color ? `${event.color}20` : "#e0e7ff", 
                      color: event.color || "#3730a3" 
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

