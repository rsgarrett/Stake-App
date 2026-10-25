"use client"

import { useEffect, useRef } from "react"

/**
 * Phones suspend JavaScript and drop Realtime when Safari is backgrounded
 * or the network drops. Fire `onResume` as soon as the tab is usable again
 * so the next pull / snapshot happens immediately instead of waiting for
 * the next poll tick.
 */
export function useLiveResume(onResume: () => void, enabled = true) {
  const onResumeRef = useRef(onResume)
  onResumeRef.current = onResume

  useEffect(() => {
    if (!enabled) return
    const fire = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return
      onResumeRef.current()
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") fire()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", fire)
    window.addEventListener("pageshow", fire)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", fire)
      window.removeEventListener("pageshow", fire)
    }
  }, [enabled])
}
