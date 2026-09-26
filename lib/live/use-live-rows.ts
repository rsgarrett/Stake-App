"use client"

import { useCallback, useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { liveValuesEqual, normalizeLiveValue } from "@/lib/live/values"

type Order = { column: string; ascending?: boolean }

/**
 * Keep a list of rows in sync for everyone who has the page open.
 * Realtime is used when the table is in the publication; a short poll
 * covers the cases where those events never arrive. In-progress local
 * edits (dirty fields) are not replaced by an older copy of the row.
 */
export function useLiveRows<T extends { id: string }>(options: {
  table: string
  enabled?: boolean
  setRows: Dispatch<SetStateAction<T[]>>
  eq?: Record<string, string>
  order?: Order
  pollMs?: number
  /** Keep only rows this screen is showing, when the query is broader than the view. */
  matches?: (row: T) => boolean
}) {
  const { table, enabled = true, setRows, eq, order, pollMs = 1200 } = options
  const supabase = createClient()
  const supabaseRef = useRef(supabase)
  supabaseRef.current = supabase
  const setRowsRef = useRef(setRows)
  setRowsRef.current = setRows
  const dirtyRef = useRef(new Map<string, Map<string, unknown>>())
  const matchesRef = useRef(options.matches)
  matchesRef.current = options.matches
  const eqKey = JSON.stringify(eq ?? {})
  const orderKey = order ? `${order.column}:${order.ascending !== false}` : ""

  const applyIncoming = useCallback((incoming: T[]) => {
    setRowsRef.current((prev) => {
      const visible = matchesRef.current ? incoming.filter(matchesRef.current) : incoming
      const prevById = new Map(prev.map((row) => [row.id, row]))
      const next = visible.map((remote) => {
        const local = prevById.get(remote.id)
        if (!local) return remote
        const dirty = dirtyRef.current.get(remote.id)
        if (!dirty || dirty.size === 0) return { ...local, ...remote }
        const merged = { ...local, ...remote }
        for (const [key, pending] of [...dirty.entries()]) {
          const remoteValue = (remote as Record<string, unknown>)[key]
          if (liveValuesEqual(pending, remoteValue)) {
            dirty.delete(key)
            continue
          }
          ;(merged as Record<string, unknown>)[key] = normalizeLiveValue(
            (local as Record<string, unknown>)[key],
            pending
          )
        }
        if (dirty.size === 0) dirtyRef.current.delete(remote.id)
        return merged
      })
      return next
    })
  }, [])

  const fetchRows = useCallback(async (sb: SupabaseClient) => {
    let query = sb.from(table).select("*")
    const match = eq ?? {}
    for (const [column, value] of Object.entries(match)) {
      query = query.eq(column, value)
    }
    if (order) query = query.order(order.column, { ascending: order.ascending !== false })
    const { data, error } = await query
    if (error) throw error
    return (data || []) as T[]
  }, [table, eqKey, orderKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const sb = supabaseRef.current

    const pull = async () => {
      if (cancelled || (typeof document !== "undefined" && document.visibilityState === "hidden")) return
      try {
        const rows = await fetchRows(sb)
        if (!cancelled) applyIncoming(rows)
      } catch (err) {
        console.error(`[live] ${table} poll failed`, err)
      }
    }

    void pull()
    const poll = setInterval(() => {
      void pull()
    }, pollMs)

    let channel: ReturnType<SupabaseClient["channel"]> | null = null
    const filter =
      eq && Object.keys(eq).length === 1
        ? `${Object.keys(eq)[0]}=eq.${Object.values(eq)[0]}`
        : undefined

    ;(async () => {
      const { data } = await sb.auth.getSession()
      const token = data.session?.access_token
      if (token) await sb.realtime.setAuth(token)
      if (cancelled) return
      channel = sb
        .channel(`live-rows:${table}:${eqKey}:${Math.random().toString(36).slice(2, 8)}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter },
          () => {
            void pull()
          }
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      clearInterval(poll)
      if (channel) void sb.removeChannel(channel)
    }
  }, [enabled, table, eqKey, fetchRows, applyIncoming, pollMs])

  const patch = useCallback(
    async (id: string, partial: Record<string, unknown>) => {
      const pending = dirtyRef.current.get(id) ?? new Map<string, unknown>()
      for (const [key, value] of Object.entries(partial)) pending.set(key, value)
      dirtyRef.current.set(id, pending)
      setRowsRef.current((prev) =>
        prev.map((row) => (row.id === id ? ({ ...row, ...partial } as T) : row))
      )
      const { data, error } = await supabaseRef.current
        .from(table)
        .update(partial)
        .eq("id", id)
        .select("id")
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Save blocked — you may not have permission to edit this.")
      }
    },
    [table]
  )

  const remove = useCallback(
    async (id: string) => {
      setRowsRef.current((prev) => prev.filter((row) => row.id !== id))
      dirtyRef.current.delete(id)
      const { data, error } = await supabaseRef.current.from(table).delete().eq("id", id).select("id")
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Delete blocked — you may not have permission.")
      }
    },
    [table]
  )

  return { patch, remove }
}
