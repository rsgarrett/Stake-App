"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLiveResume } from "@/lib/live/use-live-resume"

/**
 * Re-run a loader whenever any of the given tables change, with a short
 * poll as a fallback. For screens that combine several tables into one
 * read-mostly view (calendars, compliance grids, rosters).
 */
export function useLiveRefresh(options: {
  tables: string[]
  enabled?: boolean
  refresh: () => void | Promise<unknown>
  pollMs?: number
}) {
  const { tables, enabled = true, refresh, pollMs = 3000 } = options
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh
  const tablesKey = tables.join(",")
  const runRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!enabled) return
    const sb = createClient()
    let cancelled = false
    let inFlight = false
    const run = () => {
      if (cancelled || inFlight || document.visibilityState === "hidden") return
      inFlight = true
      Promise.resolve(refreshRef.current()).finally(() => {
        inFlight = false
      })
    }
    runRef.current = run
    const poll = setInterval(run, pollMs)
    let channel: ReturnType<typeof sb.channel> | null = null
    ;(async () => {
      const { data } = await sb.auth.getSession()
      if (data.session?.access_token) await sb.realtime.setAuth(data.session.access_token)
      if (cancelled) return
      let ch = sb.channel(`live-refresh:${tablesKey}:${Math.random().toString(36).slice(2, 8)}`)
      for (const table of tablesKey.split(",")) {
        ch = ch.on("postgres_changes", { event: "*", schema: "public", table }, run)
      }
      channel = ch.subscribe()
    })()
    return () => {
      cancelled = true
      clearInterval(poll)
      if (channel) void sb.removeChannel(channel)
    }
  }, [enabled, tablesKey, pollMs])

  useLiveResume(() => runRef.current(), enabled)
}
