"use client"

import { useCallback } from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ConferenceProgramItem, ConferenceSession } from "@/types"
import type { ConductingSheetEvent } from "@/lib/conferences/conducting-sheet-event"
import { ConductingSessionSheet } from "@/components/conferences/conducting-session-sheet"

export type { ConductingSheetEvent }

interface ConductingSheetViewProps {
  event: ConductingSheetEvent
  sessions: ConferenceSession[]
  formatTime: (time?: string) => string
  resolveSessionDisplayDateIso: (session: ConferenceSession, ev: ConductingSheetEvent | null) => string | null
  formatSessionDateLong: (iso: string) => string
  generateConductingText: (session: ConferenceSession, items: ConferenceProgramItem[]) => string
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
        <p className="font-medium text-slate-900">Conducting sheets</p>
        <p className="mt-1 text-slate-600">
          Click the button below or use your browser's print (⌘P / Ctrl+P). Header quotes are in{" "}
          <code className="rounded bg-white px-1 py-0.5 text-xs">lib/conferences/conducting-sheet-header-quotes.ts</code>.
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
          Print conducting sheets
        </Button>
      </div>

      {lagSessions.map((session) => (
        <ConductingSessionSheet
          key={session.id}
          session={session}
          event={event}
          formatTime={formatTime}
          resolveSessionDisplayDateIso={resolveSessionDisplayDateIso}
          formatSessionDateLong={formatSessionDateLong}
          formatEventDateRange={formatEventDateRange}
          generateConductingText={generateConductingText}
        />
      ))}

      {lagSessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
          Add a Leadership, Adult, or General session to generate conducting sheets.
        </p>
      ) : null}
    </div>
  )
}
