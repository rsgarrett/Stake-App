"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type AgendaPagerTarget = {
  /** Friendly date shown under the label, e.g. "Thu, Sep 4". */
  dateLabel: string
  /** Navigate by link (meeting pages)… */
  href?: string
  /** …or by callback (date-keyed agenda pages). */
  onClick?: () => void
}

function PagerButton({
  side,
  target,
}: {
  side: "previous" | "next"
  target?: AgendaPagerTarget | null
}) {
  if (!target) {
    // Invisible placeholder keeps the other button and any center content aligned.
    return <span className="w-36 shrink-0" aria-hidden />
  }

  const isPrev = side === "previous"
  const inner = (
    <>
      {isPrev && <ChevronLeft className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-indigo-600" />}
      <span className={`flex min-w-0 flex-col ${isPrev ? "items-start" : "items-end"}`}>
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 group-hover:text-indigo-500">
          {isPrev ? "Previous agenda" : "Next agenda"}
        </span>
        <span className="truncate text-sm font-semibold text-gray-800 group-hover:text-indigo-700">
          {target.dateLabel}
        </span>
      </span>
      {!isPrev && <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-indigo-600" />}
    </>
  )
  const buttonClass =
    "group flex w-36 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 " +
    (isPrev ? "justify-start text-left" : "justify-end text-right")

  if (target.href) {
    return (
      <Link href={target.href} className={buttonClass}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={target.onClick} className={buttonClass}>
      {inner}
    </button>
  )
}

/**
 * Friendly previous/next agenda navigation: labeled buttons showing the date
 * of each neighboring agenda, so users can page through meetings without
 * going back to the calendar. Optional children render centered between them
 * (e.g. a "Today" button or date picker).
 */
export function AgendaPager({
  previous,
  next,
  children,
  className = "",
}: {
  previous?: AgendaPagerTarget | null
  next?: AgendaPagerTarget | null
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <PagerButton side="previous" target={previous} />
      {children ? <div className="flex min-w-0 items-center gap-2">{children}</div> : null}
      <PagerButton side="next" target={next} />
    </div>
  )
}

/** "Thu, Sep 4" from a YYYY-MM-DD date string (noon avoids UTC day shifts). */
export function pagerDateLabel(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T12:00:00")
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}
