"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ConferenceProgramItem, ConferenceSession } from "@/types"
import { programItemAllowsDuration } from "@/lib/conferences/program-item-duration"
import { programItemFieldConfig } from "@/lib/conferences/program-item-fields"
import { PROGRAM_ITEM_LABELS } from "@/lib/conferences/program-item-labels"
import {
  isStandardOpeningItemType,
  sortProgramItemsByOrder,
} from "@/lib/conferences/standard-opening-block"
import { STAKE_VISION_TEXT } from "@/lib/conferences/conducting-sheet-header-quotes"
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
  patchProgramItem: (itemId: string, updates: Partial<ConferenceProgramItem>) => Promise<void>
  patchSessionField: (sessionId: string, field: string, value: string | null) => Promise<void>
}

const inlineInput =
  "conducting-inline-input min-w-0 border-0 border-b border-dotted border-transparent bg-transparent p-0 font-serif text-[0.95rem] leading-snug text-slate-900 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none focus:ring-0 hover:border-slate-300"

/** Uncontrolled inline text input that saves on blur when the value changed. */
function InlineText({
  value,
  placeholder,
  onCommit,
  className,
  align = "left",
}: {
  value: string
  placeholder: string
  onCommit: (next: string) => void
  className?: string
  align?: "left" | "center"
}) {
  return (
    <input
      type="text"
      key={value}
      defaultValue={value}
      placeholder={placeholder}
      onBlur={(e) => {
        const next = e.target.value.trim()
        if (next !== value.trim()) onCommit(next)
      }}
      className={`${inlineInput} ${align === "center" ? "text-center" : ""} ${className || ""}`}
    />
  )
}

function DocLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(8.5rem,30%)_1fr] items-baseline gap-x-3 py-[3px]">
      <p className="font-semibold text-slate-900">{label}:</p>
      <div className="min-w-0 flex items-baseline gap-1.5 flex-wrap">{children}</div>
    </div>
  )
}

export function ConductingSessionSheet({
  session,
  event,
  formatTime,
  resolveSessionDisplayDateIso,
  formatSessionDateLong,
  formatEventDateRange,
  generateConductingText,
  patchProgramItem,
  patchSessionField,
}: ConductingSessionSheetProps) {
  const items = sortProgramItemsByOrder(session.program_items || [])
  const condDateIso = resolveSessionDisplayDateIso(session, event)
  const condDateLabel = condDateIso ? formatSessionDateLong(condDateIso) : null

  const timeLabel =
    session.start_time && session.end_time
      ? `${formatTime(session.start_time)} — ${formatTime(session.end_time)}`
      : null

  const contentRef = useRef<HTMLDivElement>(null)
  const clipRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<FitResult>({ paddingIn: 0.44, zoom: 1 })

  const measureKey = JSON.stringify({
    id: session.id,
    items: items.map((i) => `${i.id}:${i.item_type}:${i.assigned_to}:${i.topic}:${i.hymn_number}:${i.notes}:${i.duration_minutes}`),
    attended_by: session.attended_by,
    equipment_notes: session.equipment_notes,
    broadcast_url: session.broadcast_url,
  })

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

  const commitItem = (itemId: string, updates: Partial<ConferenceProgramItem>) => {
    void patchProgramItem(itemId, updates)
  }

  const firstOpeningHymnId = items.find((i) => i.item_type === "opening_hymn")?.id

  return (
    <article
      className="conducting-sheet-page w-full min-w-0 max-w-full overflow-hidden break-words bg-white text-slate-900"
      style={{ padding: `${fit.paddingIn}in`, pageBreakAfter: "always", breakAfter: "page" }}
    >
      <div ref={clipRef} className="min-w-0">
        <div ref={contentRef} className="conducting-doc mx-auto w-full max-w-3xl min-w-0 font-serif" style={zoomStyle}>
          <header className="text-center font-serif">
            <p className="mx-auto max-w-[36rem] text-[12.5px] italic leading-snug text-slate-600">
              &ldquo;{STAKE_VISION_TEXT}&rdquo;
            </p>
            <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
              {session.session_label}
            </h1>
            <p className="mt-1 text-sm text-slate-700">
              {event.title}
              {event.title && (condDateLabel || timeLabel) ? " · " : ""}
              {condDateLabel || formatEventDateRange(event.start_date, event.end_date)}
            </p>
            {timeLabel ? <p className="text-sm text-slate-700">{timeLabel}{event.location ? ` · ${event.location}` : ""}</p> : null}
          </header>

          <div className="my-3 h-px bg-slate-400" aria-hidden />

          <div className="text-[0.95rem] leading-snug">
            <DocLine label="Attended by">
              <InlineText
                value={session.attended_by ?? ""}
                placeholder="Who attends this session…"
                onCommit={(v) => void patchSessionField(session.id, "attended_by", v || null)}
                className="w-full"
              />
            </DocLine>
            <DocLine label="Materials requested">
              <InlineText
                value={session.equipment_notes ?? ""}
                placeholder="Microphones, projector, whiteboard…"
                onCommit={(v) => void patchSessionField(session.id, "equipment_notes", v || null)}
                className="w-full"
              />
            </DocLine>
            {event.presiding_authority ? (
              <DocLine label="Presiding authority">
                <span>{event.presiding_authority}</span>
              </DocLine>
            ) : null}
            {event.theme ? (
              <DocLine label="Theme">
                <span className="italic">{event.theme}</span>
              </DocLine>
            ) : null}
          </div>

          <div className="my-3 h-px bg-slate-400" aria-hidden />

          <section className="text-[0.95rem] leading-snug">
            {items.length === 0 ? (
              <p className="mt-2 text-center text-sm text-slate-500">No program items yet. Add them on the Sessions tab.</p>
            ) : (
              items.map((item) => {
                const label = PROGRAM_ITEM_LABELS[item.item_type] || item.item_type
                const fields = programItemFieldConfig(item.item_type)
                const showMinutes =
                  programItemAllowsDuration(item.item_type) &&
                  !isStandardOpeningItemType(item.item_type) &&
                  item.item_type !== "closing_hymn" &&
                  item.item_type !== "benediction"
                const welcomeLineBefore = item.id === firstOpeningHymnId ? (
                  <DocLine key={`${item.id}-welcome`} label="Welcome / Announcements">
                    <span className="text-slate-600 italic">(see welcome sheet)</span>
                  </DocLine>
                ) : null
                return (
                  <div key={item.id}>
                    {welcomeLineBefore}
                    <DocLine label={label}>
                      {fields.hymnNumber ? (
                        <InlineText
                          value={item.hymn_number ?? ""}
                          placeholder="#"
                          onCommit={(v) => commitItem(item.id, { hymn_number: v || undefined })}
                          className="w-10"
                          align="center"
                        />
                      ) : null}
                      {fields.hymnNumber && fields.topic ? <span className="text-slate-500">:</span> : null}
                      {fields.name ? (
                        <InlineText
                          value={item.assigned_to ?? ""}
                          placeholder={fields.name.placeholder}
                          onCommit={(v) => commitItem(item.id, { assigned_to: v || undefined })}
                          className="flex-1 min-w-[8rem]"
                        />
                      ) : null}
                      {fields.topic && !fields.name ? (
                        <InlineText
                          value={item.topic ?? ""}
                          placeholder={fields.topic.placeholder}
                          onCommit={(v) => commitItem(item.id, { topic: v || undefined })}
                          className="flex-1 min-w-[8rem]"
                        />
                      ) : null}
                      {showMinutes ? (
                        <span className="whitespace-nowrap text-slate-700">
                          (
                          <input
                            type="text"
                            inputMode="numeric"
                            key={`min-${item.id}-${item.duration_minutes}`}
                            defaultValue={item.duration_minutes > 0 ? String(item.duration_minutes) : ""}
                            placeholder="—"
                            onBlur={(e) => {
                              const n = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0
                              if (n !== (item.duration_minutes || 0)) commitItem(item.id, { duration_minutes: n })
                            }}
                            className={`${inlineInput} w-8 text-center`}
                          />{" "}
                          min)
                        </span>
                      ) : null}
                    </DocLine>
                    {fields.topic && fields.name ? (
                      <div className="grid grid-cols-[minmax(8.5rem,30%)_1fr] gap-x-3 pb-[3px] -mt-[2px]">
                        <span aria-hidden />
                        <InlineText
                          value={item.topic ?? ""}
                          placeholder={fields.topic.placeholder}
                          onCommit={(v) => commitItem(item.id, { topic: v || undefined })}
                          className="w-full italic text-slate-700"
                        />
                      </div>
                    ) : null}
                    {item.notes ? (
                      <div className="grid grid-cols-[minmax(8.5rem,30%)_1fr] gap-x-3 pb-[3px] -mt-[2px]">
                        <span aria-hidden />
                        <p className="text-xs leading-snug text-slate-500">{item.notes}</p>
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </section>

          {session.broadcast_url ? (
            <>
              <div className="my-3 h-px bg-slate-300" aria-hidden />
              <p className="break-all text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Broadcast: </span>
                {session.broadcast_url}
              </p>
            </>
          ) : null}

          <div className="conducting-no-print mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">Click any line to edit — changes save automatically.</p>
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
