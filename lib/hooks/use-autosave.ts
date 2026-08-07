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
   *
   * Read via a ref so parent re-renders (polling) do not reset the debounce.
   */
  save: () => Promise<void>
  /**
   * Changes whenever the user edits local state. Resets the debounce timer
   * without depending on the `save` callback identity (which often changes
   * every render and used to starve flushes / clobber errors).
   */
  debounceKey?: string | number
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
  /** Most recent error message, when `state === "error"`. */
  errorMessage: string | null
  /** Manually flush any pending save (await for completion). */
  flush: () => Promise<boolean>
}

/**
 * Generic debounced autosave hook.
 */
export function useAutosave({
  hasPending,
  save,
  debounceKey = 0,
  debounceMs = 700,
  flushOnUnload = true,
}: UseAutosaveOptions): UseAutosaveResult {
  const [state, setState] = useState<AutosaveState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef(false)
  const pendingRef = useRef(hasPending)
  const saveRef = useRef(save)
  const needsFollowUp = useRef(false)

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
    if (!pendingRef.current) {
      setState((prev) => (prev === "saving" ? "saved" : prev))
      return true
    }
    if (inFlight.current) {
      needsFollowUp.current = true
      return true
    }
    inFlight.current = true
    setState("saving")
    try {
      await saveRef.current()
      if (pendingRef.current) {
        setState("saving")
        timer.current = setTimeout(() => {
          void flush()
        }, debounceMs)
      } else {
        setState("saved")
        setErrorMessage(null)
      }
      return true
    } catch (err) {
      console.error("[useAutosave] save failed", err)
      const msg =
        (typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : null) || (typeof err === "string" ? err : null) || "Unknown error"
      setErrorMessage(msg)
      setState("error")
      return false
    } finally {
      inFlight.current = false
      if (needsFollowUp.current && pendingRef.current) {
        needsFollowUp.current = false
        timer.current = setTimeout(() => {
          void flush()
        }, debounceMs)
      } else {
        needsFollowUp.current = false
      }
    }
  }, [debounceMs])

  useEffect(() => {
    if (!hasPending) {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
      if (!inFlight.current) {
        setState((prev) => (prev === "saving" ? "saved" : prev))
      }
      return
    }

    setState("saving")
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      void flush()
    }, debounceMs)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [hasPending, debounceKey, debounceMs, flush])

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

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
      if (pendingRef.current && !inFlight.current) {
        void saveRef.current()
      }
    }
  }, [])

  return { state, errorMessage, flush }
}
