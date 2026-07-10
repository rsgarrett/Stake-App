"use client"

import { Fragment, useCallback } from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ConferenceProgramItem, ConferenceSession } from "@/types"
import type { ConductingSheetEvent } from "@/lib/conferences/conducting-sheet-event"
import { ConductingSessionSheet } from "@/components/conferences/conducting-session-sheet"
import { WelcomeAnnouncementsSheet } from "@/components/conferences/welcome-announcements-sheet"

export type { ConductingSheetEvent }

interface ConductingSheetViewProps {
  event: ConductingSheetEvent
  sessions: ConferenceSession[]
  formatTime: (time?: string) => string
  resolveSessionDisplayDateIso: (session: ConferenceSession, ev: ConductingSheetEvent | null) => string | null
  formatSessionDateLong: (iso: string) => string
  generateConductingText: (session: ConferenceSession, items: ConferenceProgramItem[]) => string
  patchProgramItem: (itemId: string, updates: Partial<ConferenceProgramItem>) => Promise<void>
  patchSessionField: (sessionId: string, field: string, value: string | null) => Promise<void>
}

function formatEventDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00")
  const e = new Date(end + "T12:00:00")
  const long: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  const short: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" }
  if (start === end) return s.toLocaleDateString("en-US", long)
  return `${s.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} – ${e.toLocaleDateString("en-US", short)}`
}

export function ConductingSheetView({
  event,
  sessions,
  formatTime,
  resolveSessionDisplayDateIso,
  formatSessionDateLong,
  generateConductingText,
  patchProgramItem,
  patchSessionField,
}: ConductingSheetViewProps) {
  const lagSessions = sessions.filter(
    (s) => s.session_type === "leadership_session" || s.session_type === "adult_session" || s.session_type === "general_session"
  )

  const printSheets = useCallback(() => {
    if (lagSessions.length === 0) {
      window.alert("Add a Leadership, Adult, or General session before printing.")
      return
    }
    const html = document.documentElement
    const cleanup = () => html.classList.remove("print-conducting-sheets")
    html.classList.add("print-conducting-sheets")
    const afterPrint = () => {
      cleanup()
      window.removeEventListener("afterprint", afterPrint)
    }
    window.addEventListener("afterprint", afterPrint)
    window.print()
    window.setTimeout(cleanup, 500)
  }, [lagSessions.length])

  return (
    <div className="conducting-sheet-print space-y-8 px-3 sm:px-0">
      <div className="conducting-no-print rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Welcome sheets &amp; conducting sheets</p>
        <p className="mt-1 text-slate-600">
          Each session gets a Welcome &amp; Announcements page (read before the meeting begins) followed by a one-page
          conducting sheet. Everything is editable in place — click a line on a conducting sheet, or use
          &ldquo;Edit script&rdquo; on a welcome page. Stand seating and sustaining flow in from the Stake Business tab.
        </p>
      </div>

      <div className="conducting-no-print flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          variant="default"
          className="bg-slate-900 text-white hover:bg-slate-800"
          disabled={lagSessions.length === 0}
          onClick={printSheets}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print all sheets
        </Button>
      </div>

      {lagSessions.map((session) => (
        <Fragment key={session.id}>
          <WelcomeAnnouncementsSheet
            session={session}
            event={event}
            formatTime={formatTime}
            resolveSessionDisplayDateIso={resolveSessionDisplayDateIso}
            formatSessionDateLong={formatSessionDateLong}
            patchSessionField={patchSessionField}
          />
          <ConductingSessionSheet
            session={session}
            event={event}
            formatTime={formatTime}
            resolveSessionDisplayDateIso={resolveSessionDisplayDateIso}
            formatSessionDateLong={formatSessionDateLong}
            formatEventDateRange={formatEventDateRange}
            generateConductingText={generateConductingText}
            patchProgramItem={patchProgramItem}
            patchSessionField={patchSessionField}
          />
        </Fragment>
      ))}

      {lagSessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
          Add a Leadership, Adult, or General session to generate welcome and conducting sheets.
        </p>
      ) : null}
    </div>
  )
}
