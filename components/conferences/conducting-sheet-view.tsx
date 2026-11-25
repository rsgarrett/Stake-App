"use client"

import { Fragment, useCallback, useState } from "react"
import { FileText, Printer } from "lucide-react"
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

  const [exportingWord, setExportingWord] = useState(false)

  const downloadWord = async () => {
    if (lagSessions.length === 0 || exportingWord) return
    setExportingWord(true)
    try {
      // Loaded on demand: the Word library must never be part of the page's own code.
      const { buildConductingSheetsDocx, conductingDocxFilename } = await import(
        "@/lib/conferences/build-conducting-docx"
      )
      const blob = await buildConductingSheetsDocx({
        event,
        sessions: lagSessions,
        formatTime,
        resolveSessionDisplayDateIso,
        formatSessionDateLong,
        formatEventDateRange,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = conductingDocxFilename(event.title)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (err) {
      console.error("Word export failed:", err)
      window.alert("Could not create the Word document. Please try again.")
    } finally {
      setExportingWord(false)
    }
  }

  return (
    <div className="conducting-sheet-print space-y-8 px-3 sm:px-0">
      {lagSessions.length > 0 ? (
        <div className="conducting-no-print flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2">
          <button
            type="button"
            disabled={exportingWord}
            onClick={() => void downloadWord()}
            className="inline-flex min-h-[44px] items-center text-left text-sm font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-900 disabled:opacity-60"
          >
            <FileText className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            {exportingWord ? "Creating Word document…" : "Open conducting sheets in Word"}
          </button>
          <span className="text-xs text-slate-600">
            Built from what is in the app right now. Edits made in Word stay in that file.
          </span>
        </div>
      ) : null}

      <div className="conducting-no-print rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Welcome sheets &amp; conducting sheets</p>
        <p className="mt-1 text-slate-600">
          Each session gets a Welcome &amp; Announcements page (read before the meeting begins) followed by a one-page
          conducting sheet. Everything is editable in place — click a line on a conducting sheet, or use
          &ldquo;Edit script&rdquo; on a welcome page. Stand seating and sustaining flow in from the Stake Business tab.
        </p>
        <p className="mt-1 text-slate-600">
          To change wording or formatting freely, use &ldquo;Open conducting sheets in Word&rdquo; at the top of this
          page. Changes made in Word stay in that file and do not come back into the app.
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
