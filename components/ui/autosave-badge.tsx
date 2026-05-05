"use client"

import { Cloud, CloudOff, Loader2, RotateCw } from "lucide-react"

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
  /** Detail message from the last failed save (shown in error state). */
  errorMessage?: string | null
  /** If provided, an inline "Retry" button is shown in the error state. */
  onRetry?: () => void
}

/**
 * Subtle inline indicator that a section of the UI is being autosaved.
 *
 * Designed to live in card headers next to a title, replacing the manual
 * "Save" buttons that used to appear there. Renders nothing in the idle
 * state to avoid distracting the user before they have made any change.
 */
export function AutosaveBadge({ state, label = "All changes saved", errorMessage, onRetry }: AutosaveBadgeProps) {
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
      <span
        className="inline-flex items-center gap-1.5 text-xs text-red-600"
        title={errorMessage || undefined}
      >
        <CloudOff className="h-3.5 w-3.5" />
        <span className="max-w-[24rem] truncate">
          Save failed{errorMessage ? `: ${errorMessage}` : " — check your connection"}
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-0.5 ml-0.5 px-1.5 py-0.5 rounded border border-red-200 hover:bg-red-50 text-red-700"
          >
            <RotateCw className="h-3 w-3" /> Retry
          </button>
        )}
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
