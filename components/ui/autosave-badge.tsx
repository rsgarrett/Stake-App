"use client"

import { Cloud, CloudOff, Loader2 } from "lucide-react"

/**
 * State machine for any autosaved field on a page.
 *
 *  idle    – nothing has changed yet, no badge to show
 *  saving  – a save is queued or in flight
 *  saved   – the most recent change has been persisted
 *  error   – the most recent save attempt failed; user should be alerted
 */
export type AutosaveState = "idle" | "saving" | "saved" | "error"

interface AutosaveBadgeProps {
  state: AutosaveState
  /** Override the success label (default: "All changes saved"). */
  label?: string
}

/**
 * Subtle inline indicator that a section of the UI is being autosaved.
 *
 * Designed to live in card headers next to a title, replacing the manual
 * "Save" buttons that used to appear there. Renders nothing in the idle
 * state to avoid distracting the user before they have made any change.
 */
export function AutosaveBadge({ state, label = "All changes saved" }: AutosaveBadgeProps) {
  if (state === "idle") return null
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    )
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
        <CloudOff className="h-3.5 w-3.5" />
        Save failed — check your connection
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
      <Cloud className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
