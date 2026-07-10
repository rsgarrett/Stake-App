"use client"

import { format, isToday, isTomorrow } from "date-fns"
import { CalendarClock, ChevronRight } from "lucide-react"
import type { NextAppointment } from "@/lib/meetings/next-appointment"

function whenLabel(start: Date): string {
  if (isToday(start)) return `Today, ${format(start, "h:mm a")}`
  if (isTomorrow(start)) return `Tomorrow, ${format(start, "h:mm a")}`
  return format(start, "EEE, MMM d, h:mm a")
}

type Props = {
  appointment: NextAppointment | null
  onOpen: (appointment: NextAppointment) => void
}

/** Single-line personalized "Next appointment" strip for the top of Meetings & Conferences. */
export function NextAppointmentBar({ appointment, onOpen }: Props) {
  if (!appointment) return null
  return (
    <button
      type="button"
      onClick={() => onOpen(appointment)}
      className="mb-4 flex w-full min-w-0 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2 text-left shadow-sm transition-colors hover:bg-blue-100/70"
    >
      <CalendarClock className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
      <span className="shrink-0 text-sm font-semibold text-blue-900">Next appointment:</span>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
        <span className="font-medium tabular-nums text-gray-900">{whenLabel(appointment.start)}</span>
        <span className="text-gray-400"> — </span>
        {appointment.label}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-blue-400" aria-hidden />
    </button>
  )
}
