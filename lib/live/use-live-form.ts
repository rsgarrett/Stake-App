"use client"

import { useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSupabaseYDoc } from "@/lib/collab/use-supabase-y-doc"
import { applyTextChange } from "@/lib/collab/apply-text-change"
import { canonicalLiveValue, liveValuesEqual, normalizeLiveValue } from "@/lib/live/values"

const SKIP_KEYS = new Set(["id", "created_at", "updated_at", "stake_id"])

/**
 * A single open record stays live for everyone editing it.
 * Text fields merge character-by-character through the shared document.
 * Checkboxes, dates, and selects save only that field, so one person's
 * change does not replace a field someone else just edited.
 */
export function useLiveForm<T extends Record<string, unknown>>(options: {
  table: string
  id: string | null | undefined
  enabled: boolean
  values: T
  setValues: Dispatch<SetStateAction<T>>
  textFields?: string[]
  userName?: string | null
}) {
  const { table, id, enabled, values, setValues, textFields = [], userName } = options
  const supabase = createClient()
  const valuesRef = useRef(values)
  valuesRef.current = values
  const setValuesRef = useRef(setValues)
  setValuesRef.current = setValues
  const ackRef = useRef<Record<string, unknown>>({})
  const dirtyRef = useRef(new Set<string>())
  const hydratedRef = useRef(false)
  const textKey = textFields.join("|")
  const textSetRef = useRef(new Set(textFields))
  textSetRef.current = new Set(textFields)

  const collab = useSupabaseYDoc({
    room: enabled && id ? `agenda:row:${table}:${id}` : null,
    supabase,
    userName,
    enabled: Boolean(enabled && id),
  })
  const docRef = useRef(collab.doc)
  docRef.current = collab.doc

  useEffect(() => {
    hydratedRef.current = false
    ackRef.current = {}
    dirtyRef.current = new Set()
  }, [table, id])

  useEffect(() => {
    const doc = collab.doc
    if (!doc || !collab.ready || !enabled) return
    const fields = textSetRef.current
    doc.transact(() => {
      for (const field of fields) {
        const yText = doc.getText(field)
        if (yText.length > 0) continue
        const seed = valuesRef.current[field]
        if (typeof seed === "string" && seed) yText.insert(0, seed)
      }
    }, "seed")
  }, [collab.doc, collab.ready, enabled, textKey])

  useEffect(() => {
    const doc = collab.doc
    if (!doc) return
    const applyDocText = () => {
      const fields = textSetRef.current
      setValuesRef.current((prev) => {
        let changed = false
        const next = { ...prev } as Record<string, unknown>
        for (const field of fields) {
          const text = doc.getText(field).toString()
          if (text === String(prev[field] ?? "")) continue
          next[field] = text
          ackRef.current[field] = text
          dirtyRef.current.delete(field)
          changed = true
        }
        return (changed ? next : prev) as T
      })
    }
    doc.on("update", applyDocText)
    return () => {
      doc.off("update", applyDocText)
    }
  }, [collab.doc])

  useEffect(() => {
    if (!enabled || !id) return
    if (!hydratedRef.current) {
      ackRef.current = { ...values }
      hydratedRef.current = true
      return
    }

    const doc = docRef.current
    const pending: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(values)) {
      if (SKIP_KEYS.has(key)) continue
      if (liveValuesEqual(value, ackRef.current[key])) {
        dirtyRef.current.delete(key)
        continue
      }
      dirtyRef.current.add(key)
      if (textSetRef.current.has(key) && doc && collab.ready && typeof value === "string") {
        applyTextChange(doc.getText(key), value)
        const merged = doc.getText(key).toString()
        // Ack the merged text so this effect does not re-apply the same keystroke.
        // The database copy can lag; the shared document is the live source for text.
        ackRef.current[key] = merged
        if (merged !== value) {
          setValuesRef.current((prev) => ({ ...prev, [key]: merged }))
        }
        pending[key] = merged === "" ? null : merged
      } else if (!textSetRef.current.has(key)) {
        pending[key] = canonicalLiveValue(value)
      }
    }

    if (Object.keys(pending).length === 0) return
    const timer = setTimeout(() => {
      void supabase
        .from(table)
        .update(pending)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error(`[live] ${table} field save failed`, error)
        })
    }, 280)
    return () => clearTimeout(timer)
  }, [values, enabled, id, table, supabase, collab.ready])

  useEffect(() => {
    if (!enabled || !id) return
    let cancelled = false
    const sb = supabase

    const pull = async () => {
      if (cancelled || document.visibilityState === "hidden") return
      const { data, error } = await sb.from(table).select("*").eq("id", id).maybeSingle()
      if (error || !data || cancelled) return
      const remote = data as Record<string, unknown>
      setValuesRef.current((prev) => {
        let changed = false
        const next = { ...prev } as Record<string, unknown>
        for (const [key, remoteValue] of Object.entries(remote)) {
          if (SKIP_KEYS.has(key) || !(key in prev)) continue
          if (textSetRef.current.has(key)) continue
          if (dirtyRef.current.has(key) && !liveValuesEqual(prev[key], remoteValue)) continue
          const normalized = normalizeLiveValue(prev[key], remoteValue)
          if (liveValuesEqual(prev[key], normalized)) {
            dirtyRef.current.delete(key)
            continue
          }
          next[key] = normalized
          ackRef.current[key] = normalized
          dirtyRef.current.delete(key)
          changed = true
        }
        return (changed ? next : prev) as T
      })
    }

    void pull()
    const poll = setInterval(() => {
      void pull()
    }, 1000)

    let channel: ReturnType<typeof sb.channel> | null = null
    ;(async () => {
      const { data } = await sb.auth.getSession()
      if (data.session?.access_token) await sb.realtime.setAuth(data.session.access_token)
      if (cancelled) return
      channel = sb
        .channel(`live-form:${table}:${id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table, filter: `id=eq.${id}` },
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
  }, [enabled, id, table, supabase])

  return { status: collab.status, peers: collab.peers }
}
