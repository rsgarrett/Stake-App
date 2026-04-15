"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"

export function useRealtimeSubscription<T>(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: filter,
        },
        (payload) => {
          if (callback) {
            callback(payload)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, callback])
}

export function subscribeToTable<T>(
  supabase: ReturnType<typeof createClient>,
  table: string,
  filter: string | undefined,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: table,
        filter: filter,
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}


