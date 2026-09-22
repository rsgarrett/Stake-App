"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as Y from "yjs"
import { SupabaseProvider } from "@supabase-labs/y-supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import { decodeYUpdate, encodeYUpdate } from "@/lib/collab/y-update-codec"

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

  const supabaseRef = useRef(supabase)
  supabaseRef.current = supabase
  const userNameRef = useRef(userName)
  userNameRef.current = userName
  const providerRef = useRef<SupabaseProvider | null>(null)

  // Keep awareness name fresh without tearing down the Y.Doc mid-meeting.
  useEffect(() => {
    const awareness = providerRef.current?.getAwareness()
    if (!awareness) return
    const prev = awareness.getLocalState()?.user as { name?: string; color?: string } | undefined
    awareness.setLocalStateField("user", {
      name: userName?.trim() || prev?.name || "Someone",
      color: prev?.color || colorForClient(0),
    })
  }, [userName])

  useEffect(() => {
    if (!enabled || !room) {
      setDoc(null)
      setProvider(null)
      providerRef.current = null
      setPeers([])
      setStatus("connecting")
      setReady(false)
      return
    }

    let cancelled = false
    const ydoc = new Y.Doc()
    let providerInstance: SupabaseProvider | null = null
    let readyFallback: ReturnType<typeof setTimeout> | null = null
    let persistChannel: ReturnType<SupabaseClient["channel"]> | null = null

    const markReady = () => {
      if (!cancelled) setReady(true)
    }

    const applyPersistedState = (encoded: string | null | undefined) => {
      if (!encoded || cancelled) return
      try {
        const current = encodeYUpdate(Y.encodeStateAsUpdate(ydoc))
        if (current === encoded) return
        Y.applyUpdate(ydoc, decodeYUpdate(encoded), "remote")
      } catch {
        // Corrupt or empty snapshot — ignore; live broadcast may still work.
      }
    }

    ;(async () => {
      const sb = supabaseRef.current
      const { data } = await sb.auth.getSession()
      const token = data.session?.access_token
      if (token) await sb.realtime.setAuth(token)
      if (cancelled) {
        ydoc.destroy()
        return
      }

      providerInstance = new SupabaseProvider(room, ydoc, sb, {
        awareness: true,
        persistence: { storeTimeout: 400 },
        broadcastThrottleMs: 33,
        autoReconnect: true,
      })
      providerRef.current = providerInstance

      const awareness = providerInstance.getAwareness()
      if (awareness) {
        awareness.setLocalStateField("user", {
          name: userNameRef.current?.trim() || "Someone",
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
      providerInstance.on("disconnect", () => {
        if (!cancelled) setStatus("connecting")
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
      readyFallback = setTimeout(markReady, 1800)

      // Fallback when Broadcast frames are dropped: applying the persisted
      // snapshot still updates every other open agenda within ~400ms.
      persistChannel = sb
        .channel(`yjs-persist-${room}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "yjs_documents" },
          (payload) => {
            const row = payload.new as { room?: string; state?: string } | null
            if (!row || row.room !== room) return
            applyPersistedState(row.state)
            if (!cancelled) setStatus("live")
          }
        )
        .subscribe()

      setDoc(ydoc)
      setProvider(providerInstance)
      refreshPeers()
    })()

    return () => {
      cancelled = true
      if (readyFallback) clearTimeout(readyFallback)
      if (persistChannel) void supabaseRef.current.removeChannel(persistChannel)
      providerInstance?.destroy()
      providerRef.current = null
      ydoc.destroy()
      setDoc(null)
      setProvider(null)
      setPeers([])
      setReady(false)
    }
    // Intentionally omit supabase/userName — use refs so typing/name load doesn't reset the doc.
  }, [enabled, room])

  return useMemo(
    () => ({ doc, provider, status, peers, ready }),
    [doc, provider, status, peers, ready]
  )
}

export function meetingCollabRoom(meetingId: string, surface: "minutes" | "agenda") {
  return `mtg:${meetingId}:${surface}`
}
