"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type * as Y from "yjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useSupabaseYDoc } from "@/lib/collab/use-supabase-y-doc"
import { applyTextChange } from "@/lib/collab/apply-text-change"
import type { AutosaveState } from "@/components/ui/autosave-badge"

/** Scalar (non-collaborative-text) values on a row: selects, dates, flags. */
export type AgendaRowData = Record<string, string | number | boolean | undefined>
export type AgendaRow = { id: string; data: AgendaRowData }

/** Room per agenda instance, shared by every client viewing that date. */
export function agendaCollabRoom(kind: string, date: string) {
  return `agenda:${kind}:${date}`
}

function newRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Live Google-Docs-style agenda state on a Yjs doc (Supabase Realtime transport,
 * `yjs_documents` persistence — same stack as the meeting page).
 *
 * Doc layout:
 *   - Y.Text `field/{name}`            top-level free-text fields (char-level merge)
 *   - Y.Text `row/{list}/{id}/{field}` free-text fields inside list rows
 *   - Y.Map  `rows`                    `{list}/{id}` → scalar row data (+ `deleted` tombstone)
 *   - Y.Map  `order`                   `{list}` → row id array (concurrent adds reconciled at render)
 *   - Y.Map  `meta`                    page-level scalars (status select, seeded flag)
 *
 * Local edits transact with origin "local"; `localTick` only counts those, so
 * autosave runs on the editing client, not on every listener.
 */
export function useLiveAgenda(options: {
  room: string | null
  supabase: SupabaseClient
  userName?: string | null
  enabled?: boolean
}) {
  const { doc, ready, status, peers } = useSupabaseYDoc(options)
  const [tick, setTick] = useState(0)
  const [localTick, setLocalTick] = useState(0)

  useEffect(() => {
    if (!doc) return
    const onUpdate = (_update: Uint8Array, origin: unknown) => {
      setTick((t) => t + 1)
      if (origin === "local") setLocalTick((t) => t + 1)
    }
    doc.on("update", onUpdate)
    return () => {
      doc.off("update", onUpdate)
    }
  }, [doc])

  const fieldText = useCallback(
    (name: string): Y.Text | null => doc?.getText(`field/${name}`) ?? null,
    [doc]
  )
  const rowText = useCallback(
    (list: string, id: string, field: string): Y.Text | null =>
      doc?.getText(`row/${list}/${id}/${field}`) ?? null,
    [doc]
  )
  const fieldValue = useCallback(
    (name: string): string => (doc ? doc.getText(`field/${name}`).toString() : ""),
    [doc]
  )
  const rowTextValue = useCallback(
    (list: string, id: string, field: string): string =>
      doc ? doc.getText(`row/${list}/${id}/${field}`).toString() : "",
    [doc]
  )

  /** Live rows for a list: explicit order first, then concurrent strays by creation time. */
  const rows = useCallback(
    (list: string): AgendaRow[] => {
      void tick
      if (!doc) return []
      const rowsMap = doc.getMap<AgendaRowData>("rows")
      const orderMap = doc.getMap<string[]>("order")
      const live = new Map<string, AgendaRowData>()
      rowsMap.forEach((data, key) => {
        if (!key.startsWith(`${list}/`) || !data || data.deleted) return
        live.set(key.slice(list.length + 1), data)
      })
      const ordered: AgendaRow[] = []
      const seen = new Set<string>()
      for (const id of orderMap.get(list) ?? []) {
        const data = live.get(id)
        if (!data || seen.has(id)) continue
        seen.add(id)
        ordered.push({ id, data })
      }
      const strays = [...live.entries()]
        .filter(([id]) => !seen.has(id))
        .sort((a, b) => Number(a[1].created ?? 0) - Number(b[1].created ?? 0))
      for (const [id, data] of strays) ordered.push({ id, data })
      return ordered
    },
    [doc, tick]
  )

  const addRow = useCallback(
    (list: string, data: AgendaRowData = {}, id?: string): string | null => {
      if (!doc) return null
      const rowId = id ?? newRowId()
      doc.transact(() => {
        doc.getMap<AgendaRowData>("rows").set(`${list}/${rowId}`, {
          created: Date.now(),
          ...data,
        })
        const orderMap = doc.getMap<string[]>("order")
        const order = orderMap.get(list) ?? []
        if (!order.includes(rowId)) orderMap.set(list, [...order, rowId])
      }, "local")
      return rowId
    },
    [doc]
  )

  const updateRow = useCallback(
    (list: string, id: string, patch: AgendaRowData) => {
      if (!doc) return
      doc.transact(() => {
        const rowsMap = doc.getMap<AgendaRowData>("rows")
        const key = `${list}/${id}`
        rowsMap.set(key, { ...(rowsMap.get(key) ?? {}), ...patch })
      }, "local")
    },
    [doc]
  )

  /** Tombstone (never hard-delete) so membership survives concurrent order writes. */
  const removeRow = useCallback(
    (list: string, id: string) => {
      if (!doc) return
      doc.transact(() => {
        const rowsMap = doc.getMap<AgendaRowData>("rows")
        const key = `${list}/${id}`
        rowsMap.set(key, { ...(rowsMap.get(key) ?? {}), deleted: true })
        const orderMap = doc.getMap<string[]>("order")
        const order = orderMap.get(list) ?? []
        if (order.includes(id)) orderMap.set(list, order.filter((x) => x !== id))
      }, "local")
    },
    [doc]
  )

  /** Replace a row's free-text field (used by copy-from-previous; typing uses CollaborativeInput). */
  const setRowText = useCallback(
    (list: string, id: string, field: string, value: string) => {
      if (!doc) return
      applyTextChange(doc.getText(`row/${list}/${id}/${field}`), value)
    },
    [doc]
  )

  const getMeta = useCallback(
    (key: string): unknown => {
      void tick
      return doc?.getMap("meta").get(key)
    },
    [doc, tick]
  )
  const setMeta = useCallback(
    (key: string, value: string | number | boolean) => {
      if (!doc) return
      doc.transact(() => doc.getMap("meta").set(key, value), "local")
    },
    [doc]
  )

  /**
   * One-time structural seed from the Postgres backup row. Runs after the
   * persisted doc restores; uses origin "seed" so it never triggers autosave.
   * Callers must pass deterministic row ids (e.g. `seed-3`) so a rare double
   * seed collapses onto the same map keys.
   */
  const seedRowsIfEmpty = useCallback(
    (seed: (api: {
      addRow: (list: string, data: AgendaRowData, id: string) => void
      setRowText: (list: string, id: string, field: string, value: string) => void
      setMeta: (key: string, value: string | number | boolean) => void
    }) => void) => {
      if (!doc) return
      const meta = doc.getMap("meta")
      if (meta.get("seeded")) return
      doc.transact(() => {
        seed({
          addRow: (list, data, id) => {
            doc.getMap<AgendaRowData>("rows").set(`${list}/${id}`, { created: Date.now(), ...data })
            const orderMap = doc.getMap<string[]>("order")
            const order = orderMap.get(list) ?? []
            if (!order.includes(id)) orderMap.set(list, [...order, id])
          },
          setRowText: (list, id, field, value) => {
            const yText = doc.getText(`row/${list}/${id}/${field}`)
            if (yText.length === 0 && value) yText.insert(0, value)
          },
          setMeta: (key, value) => {
            if (meta.get(key) === undefined) meta.set(key, value)
          },
        })
        meta.set("seeded", true)
      }, "seed")
    },
    [doc]
  )

  return {
    doc,
    ready,
    status,
    peers,
    tick,
    localTick,
    fieldText,
    fieldValue,
    rowText,
    rowTextValue,
    rows,
    addRow,
    updateRow,
    removeRow,
    setRowText,
    getMeta,
    setMeta,
    seedRowsIfEmpty,
  }
}

export type LiveAgenda = ReturnType<typeof useLiveAgenda>

/**
 * Debounced Postgres backup of the live doc. Fires only after local edits
 * (localTick), so ten viewers don't all upsert the same row.
 */
export function useAgendaAutosave(options: {
  enabled: boolean
  localTick: number
  save: () => Promise<void>
  delayMs?: number
}) {
  const { enabled, localTick, save, delayMs = 900 } = options
  const [state, setState] = useState<AutosaveState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const saveRef = useRef(save)
  saveRef.current = save
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef(false)
  const queued = useRef(false)

  const runSave = useCallback(async () => {
    if (inFlight.current) {
      queued.current = true
      return
    }
    inFlight.current = true
    setState("saving")
    try {
      await saveRef.current()
      setState("saved")
      setErrorMessage(null)
    } catch (err) {
      setState("error")
      setErrorMessage(err instanceof Error ? err.message : String(err))
    } finally {
      inFlight.current = false
      if (queued.current) {
        queued.current = false
        void runSave()
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled || localTick === 0) return
    setState("saving")
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      void runSave()
    }, delayMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, localTick, delayMs, runSave])

  /**
   * Run any pending debounced save right now. Call before tearing down the
   * live doc (e.g. switching agenda dates) so the last edits reach Postgres
   * while the doc still has them.
   */
  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      await runSave()
    }
  }, [runSave])

  return { state, errorMessage, retry: runSave, flush }
}
