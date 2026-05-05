"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ConferenceProgramItem, ConferenceSession } from "@/types"
import { PROGRAM_ITEM_LABELS } from "@/lib/conferences/program-item-labels"
import { sortProgramItemsByOrder } from "@/lib/conferences/standard-opening-block"
import { CONDUCTING_SHEET_HEADER_QUOTES } from "@/lib/conferences/conducting-sheet-header-quotes"
import type { ConductingSheetEvent } from "@/lib/conferences/conducting-sheet-event"
import { fitConductingSheet, CONDUCTING_PAGE_MARGIN_IN, type FitResult } from "@/lib/conferences/conducting-sheet-fit"

interface ConductingSessionSheetProps {
  session: ConferenceSession
  event: ConductingSheetEvent
  formatTime: (time?: string) => string
  resolveSessionDisplayDateIso: (session: ConferenceSession, ev: ConductingSheetEvent | null) => string | null
  formatSessionDateLong: (iso: string) => string
  formatEventDateRange: (start: string, end: string) => string
  generateConductingText: (session: ConferenceSession, items: ConferenceProgramItem[]) => string
}

export function ConductingSessionSheet({
  session,
  event,
  formatTime,
  resolveSessionDisplayDateIso,
  formatSessionDateLong,
  formatEventDateRange,
  generateConductingText,
}: ConductingSessionSheetProps) {
  const items = sortProgramItemsByOrder(session.program_items || [])
  const condDateIso = resolveSessionDisplayDateIso(session, event)
  const condDateLabel = condDateIso ? formatSessionDateLong(condDateIso) : null

  const metaParts: string[] = []
  if (condDateLabel) metaParts.push(condDateLabel)
  if (session.start_time && session.end_time) {
    metaParts.push(`${formatTime(session.start_time)} – ${formatTime(session.end_time)}`)
  }
  if (event.location) metaParts.push(event.location)

  const contentRef = useRef<HTMLDivElement>(null)
  const articleRef = useRef<HTMLElement>(null)
  const clipRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<FitResult>({ paddingIn: 0.44, zoom: 1 })

  const measureKey = JSON.stringify({
    id: session.id,
    items: items.map((i) => `${i.id}:${i.item_type}:${i.assigned_to}:${i.topic}:${i.hymn_number}:${i.notes}`),
    announcements: session.announcements,
    equipment_notes: session.equipment_notes,
    broadcast_url: session.broadcast_url,
  })

  // The fit logic forces the inner content element to a fixed letter-page
  // width so each session prints to one page. On phones that fixed width
  // (~693px) is wider than the viewport and clips the right side of the
  // sheet. On small screens we skip the fit and let the sheet flow.
  const isSmallScreen = useCallback(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth < 768
  }, [])

  const clearFitStyles = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.width = ""
      contentRef.current.style.zoom = ""
      contentRef.current.style.transform = ""
      contentRef.current.style.transformOrigin = ""
    }
  }, [])

  const measure = useCallback(() => {
    if (!contentRef.current) return
    if (isSmallScreen()) {
      clearFitStyles()
      setFit({ paddingIn: 0.16, zoom: 1 })
      return
    }
    const result = fitConductingSheet(contentRef.current)
    setFit(result)
  }, [isSmallScreen, clearFitStyles])

  useEffect(() => {
    measure()
  }, [measure, measureKey])

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timeout)
      timeout = setTimeout(measure, 200)
    }
    window.addEventListener("resize", onResize)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener("resize", onResize)
    }
  }, [measure])

  useEffect(() => {
    const onBeforePrint = () => {
      // Always run the actual page fit before print, even on phones, so the
      // printed sheet is identical regardless of the on-screen viewport.
      if (!contentRef.current) return
      const result = fitConductingSheet(contentRef.current)
      setFit(result)
      if (clipRef.current) {
        const pageH = (11 - 2 * CONDUCTING_PAGE_MARGIN_IN) * 96
        const padPx = result.paddingIn * 96 * 2
        clipRef.current.style.height = `${pageH - padPx}px`
        clipRef.current.style.overflow = "hidden"
        if (result.zoom < 1) {
          contentRef.current.style.zoom = `${result.zoom}`
          contentRef.current.style.transform = `scale(${result.zoom})`
          contentRef.current.style.transformOrigin = "top left"
        }
      }
    }
    const onAfterPrint = () => {
      if (clipRef.current) {
        clipRef.current.style.height = ""
        clipRef.current.style.overflow = ""
      }
      clearFitStyles()
      // Re-measure so the on-screen view returns to its responsive state
      // (especially important on phones where the print fit forced a width).
      measure()
    }
    window.addEventListener("beforeprint", onBeforePrint)
    window.addEventListener("afterprint", onAfterPrint)
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint)
      window.removeEventListener("afterprint", onAfterPrint)
    }
  }, [measure, clearFitStyles])

  const zoomStyle: React.CSSProperties =
    fit.zoom < 1
      ? { zoom: fit.zoom, transform: `scale(${fit.zoom})`, transformOrigin: "top left" }
      : {}

  return (
    <article
      ref={articleRef}
      className="conducting-sheet-page w-full min-w-0 max-w-full overflow-hidden break-words bg-white text-slate-900"
      style={{ padding: `${fit.paddingIn}in`, pageBreakAfter: "always", breakAfter: "page" }}
    >
      <div ref={clipRef} className="min-w-0">
        <div ref={contentRef} className="conducting-doc mx-auto w-full max-w-3xl min-w-0 font-serif" style={zoomStyle}>
          <header className="text-center font-serif">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Stake conference
            </p>
            <h1 className="mt-2 break-words text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {session.session_label}
            </h1>
            <p className="mt-1 text-base text-slate-700">{event.title}</p>
            <p className="mt-2 text-sm text-slate-600">{formatEventDateRange(event.start_date, event.end_date)}</p>

            <div className="mx-auto mt-5 max-w-[34rem] space-y-3 border-t border-slate-200 pt-4 text-sm leading-relaxed text-slate-800">
              <p className="text-center">{CONDUCTING_SHEET_HEADER_QUOTES[0]}</p>
              <p className="text-center">{CONDUCTING_SHEET_HEADER_QUOTES[1]}</p>
              <p className="text-center text-base font-semibold text-slate-900">
                {CONDUCTING_SHEET_HEADER_QUOTES[2]}
              </p>
            </div>
          </header>

          <div className="my-4 h-px bg-slate-300" aria-hidden />

          <div className="space-y-1 text-center text-sm text-slate-700">
            {metaParts.length > 0 ? <p>{metaParts.join(" · ")}</p> : (
              <p className="text-amber-800">Set date, time, and location on the Sessions tab.</p>
            )}
            {event.presiding_authority ? (
              <p>
                <span className="font-semibold text-slate-800">Presiding: </span>
                {event.presiding_authority}
              </p>
            ) : null}
            {event.theme ? (
              <p>
                <span className="font-semibold text-slate-800">Theme: </span>
                <span className="italic">{event.theme}</span>
              </p>
            ) : null}
          </div>

          {session.announcements ? (
            <>
              <div className="my-4 h-px bg-slate-300" aria-hidden />
              <section>
                <h2 className="text-center font-serif text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Announcements
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">{session.announcements}</p>
              </section>
            </>
          ) : null}

          {(session.equipment_notes || session.broadcast_url) && (
            <>
              <div className="my-4 h-px bg-slate-300" aria-hidden />
              <section className="text-sm text-slate-700">
                <h2 className="text-center font-serif text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Logistics
                </h2>
                <div className="mt-2 space-y-1.5">
                  {session.equipment_notes ? (
                    <p>
                      <span className="font-semibold text-slate-800">Equipment / setup: </span>
                      {session.equipment_notes}
                    </p>
                  ) : null}
                  {session.broadcast_url ? (
                    <p className="break-all">
                      <span className="font-semibold text-slate-800">Broadcast: </span>
                      {session.broadcast_url}
                    </p>
                  ) : null}
                </div>
              </section>
            </>
          )}

          <div className="my-4 h-px bg-slate-300" aria-hidden />

          <section>
            <h2 className="text-center font-serif text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Program</h2>
            {items.length === 0 ? (
              <p className="mt-3 text-center text-sm text-slate-500">No program items yet. Add them on the Sessions tab.</p>
            ) : (
              <div className="mx-auto mt-3 max-w-[96%] border-l-2 border-slate-300 pl-4">
                <ul className="list-none">
                  {items.map((item) => {
                    const label = PROGRAM_ITEM_LABELS[item.item_type] || item.item_type
                    const detailParts: string[] = []
                    if (item.assigned_to) detailParts.push(item.assigned_to)
                    const musicOrTopic = item.topic || item.hymn_number
                    if (musicOrTopic) detailParts.push(musicOrTopic)
                    const detailLine = detailParts.length > 0 ? detailParts.join(" — ") : null
                    return (
                      <li
                        key={item.id}
                        className="border-b border-slate-200 py-2.5 first:border-t first:border-slate-200"
                      >
                        <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[minmax(9rem,32%)_1fr] sm:items-start">
                          <p className="font-semibold text-slate-900">{label}</p>
                          <div className="min-w-0 text-left">
                            {detailLine ? (
                              <p className="text-sm leading-snug text-slate-800">{detailLine}</p>
                            ) : (
                              <p className="text-sm text-slate-400">—</p>
                            )}
                            {item.notes ? (
                              <p className="mt-1 text-xs leading-snug text-slate-600">{item.notes}</p>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>

          <div className="conducting-no-print mt-5 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const text = generateConductingText(session, items)
                void navigator.clipboard.writeText(text)
                window.alert("This session's conducting text copied to the clipboard.")
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy text
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
