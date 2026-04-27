"use client"

import { useState, useMemo, useRef, useLayoutEffect, useCallback } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  isAfter,
  eachDayOfInterval,
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Grid3x3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils/cn"

export interface CalendarEvent {
  id: string
  title: string
  start_date: string
  end_date?: string | null
  meeting_type: string
  location?: string | null
  color?: string | null
  navigationId?: string
  calendarRecordType?: "meeting" | "conference" | "interview"
  interview_type?: string
  interviewee_name?: string
}

interface CalendarViewProps {
  events: CalendarEvent[]
  fillHeight?: boolean
  onDateClick?: (date: Date) => void
  onTodayClick?: () => void
  onEventClick?: (event: CalendarEvent) => void
  onAddEvent?: () => void
}

type BrowseMode = "weeks" | "year"

const MONTHS_BEFORE = 24
const MONTHS_AFTER = 36
const WEEK_ROW_PX = 120

const miniDayLetters = ["S", "M", "T", "W", "T", "F", "S"]

function buildWeeks(): Date[][] {
  const today = new Date()
  const rangeStart = startOfWeek(startOfMonth(subMonths(today, MONTHS_BEFORE)), { weekStartsOn: 0 })
  const rangeEnd = endOfWeek(endOfMonth(addMonths(startOfMonth(today), MONTHS_AFTER)), { weekStartsOn: 0 })
  const weeks: Date[][] = []
  let weekStart = rangeStart
  while (!isAfter(weekStart, rangeEnd)) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) week.push(addDays(weekStart, i))
    weeks.push(week)
    weekStart = addDays(weekStart, 7)
  }
  return weeks
}

function headerLabelForWeek(week: Date[]): string {
  const a = week[0]!
  const b = week[6]!
  if (isSameMonth(a, b) && a.getFullYear() === b.getFullYear()) {
    return format(a, "MMMM yyyy")
  }
  return `${format(a, "MMM d")} – ${format(b, "MMM d, yyyy")}`
}

/** 42 cells (6×7) for one month mini-grid, padded with leading/trailing days. */
function miniMonthDaySlots(monthStart: Date): (Date | null)[] {
  const m0 = startOfMonth(monthStart)
  const m1 = endOfMonth(monthStart)
  const cal0 = startOfWeek(m0, { weekStartsOn: 0 })
  const cal1 = endOfWeek(m1, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: cal0, end: cal1 })
  const out: (Date | null)[] = [...days]
  while (out.length < 42) out.push(null)
  return out.slice(0, 42)
}

/** First week row that overlaps the given calendar month (Sunday-based weeks). */
function firstWeekIndexOverlappingMonth(weeks: Date[][], year: number, monthIndex: number): number {
  if (weeks.length === 0) return 0
  const mStart = new Date(year, monthIndex, 1)
  const mEnd = endOfMonth(mStart)
  const tStart = mStart.getTime()
  const tEnd = mEnd.getTime()
  const idx = weeks.findIndex((week) => {
    const w0 = week[0]!.getTime()
    const w6 = week[6]!.getTime()
    return w0 <= tEnd && w6 >= tStart
  })
  if (idx >= 0) return idx
  if (tEnd < weeks[0]![0]!.getTime()) return 0
  return weeks.length - 1
}

export function CalendarView({
  events,
  fillHeight = false,
  onDateClick,
  onTodayClick,
  onEventClick,
  onAddEvent,
}: CalendarViewProps) {
  const weeks = useMemo(() => buildWeeks(), [])
  const scrollRef = useRef<HTMLDivElement>(null)
  const didInitialScroll = useRef(false)
  /** After switching Year → Weeks, scroll to this week index (set before `setBrowseMode("weeks")`). */
  const pendingWeekScrollIndex = useRef<number | null>(null)
  const [browseMode, setBrowseMode] = useState<BrowseMode>("weeks")
  const [yearViewYear, setYearViewYear] = useState(() => new Date().getFullYear())
  const [headerLabel, setHeaderLabel] = useState(() => (weeks[0] ? headerLabelForWeek(weeks[0]) : ""))

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach((event) => {
      const eventDate = format(new Date(event.start_date), "yyyy-MM-dd")
      if (!map.has(eventDate)) map.set(eventDate, [])
      map.get(eventDate)!.push(event)
    })
    return map
  }, [events])

  const getEventsForDate = useCallback(
    (date: Date): CalendarEvent[] => {
      const dateKey = format(date, "yyyy-MM-dd")
      return eventsByDate.get(dateKey) || []
    },
    [eventsByDate]
  )

  const today = new Date()
  const todayWeekIndex = useMemo(() => {
    const t = new Date()
    return weeks.findIndex((w) => w.some((d) => isSameDay(d, t)))
  }, [weeks])

  const yearGridMonths = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(yearViewYear, i, 1)),
    [yearViewYear]
  )

  const updateHeaderFromScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || weeks.length === 0) return
    const idx = Math.min(weeks.length - 1, Math.max(0, Math.floor(el.scrollTop / WEEK_ROW_PX)))
    const w = weeks[idx]
    if (w) setHeaderLabel(headerLabelForWeek(w))
  }, [weeks])

  useLayoutEffect(() => {
    if (browseMode !== "weeks") return
    const el = scrollRef.current
    if (!el || didInitialScroll.current || weeks.length === 0) return
    const idx = todayWeekIndex >= 0 ? todayWeekIndex : 0
    const targetIdx = Math.max(0, idx - 1)
    el.scrollTop = targetIdx * WEEK_ROW_PX
    const w = weeks[idx]
    if (w) setHeaderLabel(headerLabelForWeek(w))
    didInitialScroll.current = true
  }, [weeks, todayWeekIndex, browseMode])

  useLayoutEffect(() => {
    if (browseMode !== "weeks" || weeks.length === 0) return
    const pending = pendingWeekScrollIndex.current
    if (pending === null) return
    const el = scrollRef.current
    if (!el) return
    const idx = Math.min(weeks.length - 1, Math.max(0, pending))
    const scrollIdx = Math.max(0, idx - 1)
    el.scrollTop = scrollIdx * WEEK_ROW_PX
    setHeaderLabel(headerLabelForWeek(weeks[idx]!))
    pendingWeekScrollIndex.current = null
  }, [browseMode, weeks])

  const goToMonthInWeekView = useCallback(
    (monthIndex: number) => {
      const idx = firstWeekIndexOverlappingMonth(weeks, yearViewYear, monthIndex)
      pendingWeekScrollIndex.current = idx
      setBrowseMode("weeks")
    },
    [weeks, yearViewYear]
  )

  const scrollByWeeks = (delta: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ top: delta * WEEK_ROW_PX, behavior })
  }

  const scrollToTodayWeek = (behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current
    if (!el || weeks.length === 0) return
    const t = new Date()
    const idx = weeks.findIndex((w) => w.some((d) => isSameDay(d, t)))
    if (idx < 0) return
    const targetIdx = Math.max(0, idx - 1)
    el.scrollTo({ top: targetIdx * WEEK_ROW_PX, behavior })
    const w = weeks[idx]
    if (w) setHeaderLabel(headerLabelForWeek(w))
  }

  const switchToYearView = useCallback(() => {
    const el = scrollRef.current
    if (el && weeks.length > 0) {
      const idx = Math.min(weeks.length - 1, Math.max(0, Math.floor(el.scrollTop / WEEK_ROW_PX)))
      setYearViewYear(weeks[idx]![3]!.getFullYear())
    } else {
      setYearViewYear(new Date().getFullYear())
    }
    setBrowseMode("year")
  }, [weeks])

  const goToToday = () => {
    const y = new Date().getFullYear()
    if (browseMode === "weeks") {
      scrollToTodayWeek("smooth")
    } else {
      setYearViewYear(y)
    }
    onTodayClick?.()
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden",
        fillHeight ? "min-h-0 flex-1 p-4 sm:p-6" : "p-6"
      )}
    >
      <div className="mb-3 flex shrink-0 flex-col gap-3 sm:mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="inline-flex rounded-md border border-gray-300 bg-white shadow-sm">
              <Button
                type="button"
                variant={browseMode === "weeks" ? "default" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setBrowseMode("weeks")}
                aria-pressed={browseMode === "weeks"}
              >
                <CalendarDays className="mr-1.5 h-4 w-4" />
                Weeks
              </Button>
              <Button
                type="button"
                variant={browseMode === "year" ? "default" : "ghost"}
                size="sm"
                className="rounded-l-none border-l border-gray-200"
                onClick={switchToYearView}
                aria-pressed={browseMode === "year"}
              >
                <Grid3x3 className="mr-1.5 h-4 w-4" />
                Year
              </Button>
            </div>
          </div>
          {onAddEvent && (
            <Button onClick={onAddEvent}>
              <Plus className="mr-2 h-4 w-4" />
              Add Meeting
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              browseMode === "weeks" ? scrollByWeeks(-1) : setYearViewYear((y) => y - 1)
            }
            aria-label={browseMode === "weeks" ? "Scroll up one week" : "Previous year"}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[9rem] max-w-[min(100%,28rem)] flex-1 text-center text-base font-bold leading-tight text-gray-900 sm:min-w-[11rem] sm:text-lg">
            {browseMode === "weeks" ? headerLabel : String(yearViewYear)}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              browseMode === "weeks" ? scrollByWeeks(1) : setYearViewYear((y) => y + 1)
            }
            aria-label={browseMode === "weeks" ? "Scroll down one week" : "Next year"}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {browseMode === "weeks" ? (
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white",
            fillHeight && "min-h-0 flex-1"
          )}
        >
          <div className="grid shrink-0 grid-cols-7 border-b border-gray-200 bg-gray-50 px-1 py-2 sm:px-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-[10px] font-semibold text-gray-600 sm:text-xs">
                {day}
              </div>
            ))}
          </div>

          <div
            ref={scrollRef}
            onScroll={updateHeaderFromScroll}
            className={cn(
              "overflow-y-auto overscroll-y-contain",
              fillHeight ? "min-h-0 flex-1" : "h-[min(72vh,680px)] min-h-[360px]"
            )}
          >
            {weeks.map((week) => (
              <div
                key={format(week[0]!, "yyyy-MM-dd")}
                className="box-border grid grid-cols-7 gap-0.5 border-b border-gray-100 bg-gray-50/30 px-1 py-0.5 sm:gap-1 sm:px-2"
                style={{ height: WEEK_ROW_PX }}
              >
                {week.map((day) => {
                  const dayEvents = getEventsForDate(day)
                  const isTodayCell = isSameDay(day, today)
                  const isMonthStart = day.getDate() === 1

                  return (
                    <div
                      key={format(day, "yyyy-MM-dd")}
                      className={cn(
                        "flex min-h-0 min-w-0 cursor-pointer flex-col overflow-hidden rounded border border-gray-200 bg-white p-0.5 transition-colors hover:bg-gray-50 sm:p-1",
                        isTodayCell && "ring-2 ring-indigo-500",
                        isMonthStart && "border-l-2 border-l-indigo-400"
                      )}
                      onClick={() => onDateClick?.(day)}
                    >
                      <div className="flex shrink-0 items-baseline justify-between gap-0.5 leading-none">
                        <span
                          className={cn(
                            "text-[10px] font-medium sm:text-xs",
                            isTodayCell ? "font-bold text-indigo-600" : "text-gray-900"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {isMonthStart ? (
                          <span className="truncate text-[8px] font-semibold uppercase text-indigo-700 sm:text-[9px]">
                            {format(day, "MMM")}
                          </span>
                        ) : null}
                      </div>
                      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden pt-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "cursor-pointer truncate rounded px-0.5 py-px text-[9px] hover:opacity-80 sm:text-[10px]",
                              event.color || "bg-indigo-100 text-indigo-800"
                            )}
                            style={{
                              backgroundColor: event.color ? `${event.color}20` : "#e0e7ff",
                              color: event.color || "#3730a3",
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
                          <div className="text-[9px] text-gray-500 sm:text-[10px]">+{dayEvents.length - 3}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white",
            fillHeight && "min-h-0 flex-1"
          )}
        >
          <div
            className={cn(
              "overflow-y-auto overscroll-y-contain p-2 sm:p-3",
              fillHeight ? "min-h-0 flex-1" : "max-h-[min(72vh,680px)] min-h-[360px]"
            )}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {yearGridMonths.map((monthStart, monthIndex) => {
                const slots = miniMonthDaySlots(monthStart)
                return (
                  <div
                    key={format(monthStart, "yyyy-MM")}
                    title={`Open ${format(monthStart, "MMMM yyyy")} in week view — or pick a day for the day list`}
                    className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50/40 p-2 shadow-sm transition-shadow hover:border-indigo-300 hover:shadow-md"
                    onClick={() => goToMonthInWeekView(monthIndex)}
                  >
                    <h3 className="mb-1.5 text-center text-sm font-semibold text-gray-900">
                      {format(monthStart, "MMMM")}
                    </h3>
                    <div className="grid grid-cols-7 gap-px">
                      {miniDayLetters.map((letter, i) => (
                        <div
                          key={`h-${format(monthStart, "yyyy-MM")}-${i}`}
                          className="py-0.5 text-center text-[9px] font-medium text-gray-500"
                        >
                          {letter}
                        </div>
                      ))}
                      {slots.map((day, idx) => {
                        if (!day) {
                          return (
                            <div
                              key={`e-${format(monthStart, "yyyy-MM")}-${idx}`}
                              className="aspect-square min-h-[1.5rem]"
                            />
                          )
                        }
                        const inMonth = isSameMonth(day, monthStart)
                        const dayEvents = getEventsForDate(day)
                        const isTodayCell = isSameDay(day, today)
                        const dotColor = dayEvents[0]?.color || "#4f46e5"

                        return (
                          <button
                            key={format(day, "yyyy-MM-dd")}
                            type="button"
                            className={cn(
                              "flex aspect-square min-h-[1.5rem] flex-col items-center justify-center rounded border border-transparent p-0.5 text-[10px] transition-colors hover:bg-white/90",
                              inMonth ? "text-gray-900" : "text-gray-400",
                              isTodayCell && "bg-indigo-100 font-semibold text-indigo-900 ring-1 ring-indigo-500"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onDateClick?.(day)
                            }}
                          >
                            <span>{format(day, "d")}</span>
                            {dayEvents.length > 0 ? (
                              <span
                                className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: dotColor }}
                                title={`${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
                              />
                            ) : (
                              <span className="mt-0.5 h-1.5 w-1.5 shrink-0" aria-hidden />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
