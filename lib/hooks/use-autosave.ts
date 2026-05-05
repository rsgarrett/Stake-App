"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { AutosaveState } from "@/components/ui/autosave-badge"

interface UseAutosaveOptions {
  /**
   * Reactive flag — `true` when the local state has unsaved changes
   * relative to the server. The hook schedules a debounced save whenever
   * this flips from `false` to `true` (or while it stays `true` after a
   * keystroke causes a re-render).
   */
  hasPending: boolean
  /**
   * Async persistence callback. Should throw on failure so the hook can
   * surface an "error" state in the badge. The hook does not pass any
   * arguments — closures over the current state are the easiest pattern.
   */
  save: () => Promise<void>
  /** Debounce in milliseconds before save fires (default 700ms). */
  debounceMs?: number
  /**
   * If true, also flush pending saves on `visibilitychange` (tab hidden)
   * and on `beforeunload`. Defaults to true.
   */
  flushOnUnload?: boolean
}

interface UseAutosaveResult {
  /** Current visual state for the AutosaveBadge. */
  state: AutosaveState
  /** Manually flush any pending save (await for completion). */
  flush: () => Promise<boolean>
}

/**
 * Generic debounced autosave hook.
 *
 * The hook is intentionally state-machine-only: callers own the data and
 * decide when something is "pending" (typically by comparing local state
 * to the most recent server snapshot). When a save fails the badge will
 * show the error state until the next change re-triggers a save.
 */
export function useAutosave({
  hasPending,
  save,
  debounceMs = 700,
  flushOnUnload = true,
}: UseAutosaveOptions): UseAutosaveResult {
  const [state, setState] = useState<AutosaveState>("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef(false)
  const pendingRef = useRef(hasPending)
  const saveRef = useRef(save)

  useEffect(() => {
    pendingRef.current = hasPending
  }, [hasPending])

  useEffect(() => {
    saveRef.current = save
  }, [save])

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (!pendingRef.current) return true
    if (inFlight.current) return true
    inFlight.current = true
    setState("saving")
    try {
      await saveRef.current()
      // If new edits came in while we were saving, we'll already be flagged
      // pending again and the next render will re-schedule a save.
      setState("saved")
      return true
    } catch (err) {
      console.error("[useAutosave] save failed", err)
      setState("error")
      return false
    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    if (!hasPending) return
    setState("saving")
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      void flush()
    }, debounceMs)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [hasPending, debounceMs, flush])

  useEffect(() => {
    if (!flushOnUnload) return
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") void flush()
    }
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!pendingRef.current) return
      void flush()
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [flushOnUnload, flush])

  return { state, flush }
}
