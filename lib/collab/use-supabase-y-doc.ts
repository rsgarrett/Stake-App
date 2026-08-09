"use client"

import { useEffect, useMemo, useState } from "react"
import * as Y from "yjs"
import { SupabaseProvider } from "@supabase-labs/y-supabase"
import type { SupabaseClient } from "@supabase/supabase-js"

export type CollabStatus = "connecting" | "synced" | "live" | "error"

type Peer = { id: number; name: string; color: string }

const PEER_COLORS = ["#059669", "#2563eb", "#d97706", "#db2777", "#7c3aed", "#0891b2"]

function colorForClient(clientId: number) {
  return PEER_COLORS[Math.abs(clientId) % PEER_COLORS.length]
}

/**
 * Free Docs-style room: Yjs over Supabase Realtime + Postgres persistence.
 * Room names should be `mtg:{meetingId}:minutes` or `mtg:{meetingId}:agenda`.
 */
export function useSupabaseYDoc(options: {
  room: string | null
  supabase: SupabaseClient
  userName?: string | null
  enabled?: boolean
}) {
  const { room, supabase, userName, enabled = true } = options
  const [status, setStatus] = useState<CollabStatus>("connecting")
  const [peers, setPeers] = useState<Peer[]>([])
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<SupabaseProvider | null>(null)
  /** True after DB restore finishes (or fails) — safe to seed legacy plain text. */
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled || !room) {
      setDoc(null)
      setProvider(null)
      setPeers([])
      setStatus("connecting")
      setReady(false)
      return
    }

    let cancelled = false
    const ydoc = new Y.Doc()
    let providerInstance: SupabaseProvider | null = null
    let readyFallback: ReturnType<typeof setTimeout> | null = null

    const markReady = () => {
      if (!cancelled) setReady(true)
    }

    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (token) await supabase.realtime.setAuth(token)
      if (cancelled) {
        ydoc.destroy()
        return
      }

      providerInstance = new SupabaseProvider(room, ydoc, supabase, {
        awareness: true,
        persistence: true,
        broadcastThrottleMs: 50,
      })

      const awareness = providerInstance.getAwareness()
      if (awareness) {
        awareness.setLocalStateField("user", {
          name: userName?.trim() || "Someone",
          color: colorForClient(ydoc.clientID),
        })
      }

      const refreshPeers = () => {
        if (!awareness || cancelled) return
        const next: Peer[] = []
        awareness.getStates().forEach((state, clientId) => {
          if (clientId === ydoc.clientID) return
          const user = state?.user as { name?: string; color?: string } | undefined
          next.push({
            id: clientId,
            name: user?.name?.trim() || "Someone",
            color: user?.color || colorForClient(clientId),
          })
        })
        next.sort((a, b) => a.name.localeCompare(b.name))
        setPeers(next)
      }

      awareness?.on("change", refreshPeers)

      providerInstance.on("status", (s) => {
        if (cancelled) return
        if (s === "connected") setStatus("live")
        else if (s === "connecting") setStatus("connecting")
        else setStatus("error")
      })
      providerInstance.on("connect", () => {
        if (!cancelled) setStatus("live")
      })
      providerInstance.on("error", () => {
        if (!cancelled) setStatus("error")
      })

      const persistence = providerInstance.getPersistence()
      persistence?.on("synced", () => {
        if (!cancelled) setStatus("live")
        markReady()
      })
      persistence?.on("error", () => {
        // Persistence may fail before migration 078; live broadcast can still work.
        if (!cancelled) setStatus((prev) => (prev === "connecting" ? "live" : prev))
        markReady()
      })

      // If persistence never emits (older package edge cases), don't block forever.
      readyFallback = setTimeout(markReady, 2500)

      setDoc(ydoc)
      setProvider(providerInstance)
      refreshPeers()
    })()

    return () => {
      cancelled = true
      if (readyFallback) clearTimeout(readyFallback)
      providerInstance?.destroy()
      ydoc.destroy()
      setDoc(null)
      setProvider(null)
      setPeers([])
      setReady(false)
    }
  }, [enabled, room, supabase, userName])

  return useMemo(
    () => ({ doc, provider, status, peers, ready }),
    [doc, provider, status, peers, ready]
  )
}

export function meetingCollabRoom(meetingId: string, surface: "minutes" | "agenda") {
  return `mtg:${meetingId}:${surface}`
}
