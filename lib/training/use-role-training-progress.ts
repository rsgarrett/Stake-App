"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { CurriculumKey } from "@/lib/training/regimen-types"

export type ProgressRow = {
  lesson_id: string
  status: "completed" | "in_progress"
  completed_at: string | null
  reflection_note: string | null
}

/**
 * Persist lesson completion for a role curriculum (Supabase-backed).
 */
export function useRoleTrainingProgress(curriculumKey: CurriculumKey) {
  const supabase = createClient()
  const [rows, setRows] = useState<ProgressRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [stakeId, setStakeId] = useState<string | null>(null)
  const [tableMissing, setTableMissing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setUserId(null)
        setRows([])
        return
      }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from("users")
        .select("stake_id")
        .eq("id", user.id)
        .maybeSingle()
      setStakeId(profile?.stake_id ?? null)

      const { data, error: qErr } = await supabase
        .from("role_training_progress")
        .select("lesson_id, status, completed_at, reflection_note")
        .eq("user_id", user.id)
        .eq("curriculum_key", curriculumKey)

      if (qErr) {
        const msg = qErr.message || ""
        if (/role_training_progress|schema cache|does not exist/i.test(msg)) {
          setTableMissing(true)
          setRows([])
          return
        }
        throw qErr
      }
      setTableMissing(false)
      setRows((data || []) as ProgressRow[])
    } catch (err) {
      console.error("[role-training-progress]", err)
      setError(err instanceof Error ? err.message : "Could not load progress")
    } finally {
      setLoading(false)
    }
  }, [curriculumKey, supabase])

  useEffect(() => {
    void load()
  }, [load])

  const completedIds = useMemo(() => {
    return new Set(
      rows.filter((r) => r.status === "completed").map((r) => r.lesson_id)
    )
  }, [rows])

  const toggleLesson = useCallback(
    async (lessonId: string, reflectionNote?: string) => {
      if (!userId) {
        setError("Sign in to save training completion.")
        return
      }
      if (tableMissing) {
        setError("Run migration 079_role_training_progress.sql in Supabase, then refresh.")
        return
      }

      const existing = rows.find((r) => r.lesson_id === lessonId)
      if (existing?.status === "completed") {
        const { error: delErr } = await supabase
          .from("role_training_progress")
          .delete()
          .eq("user_id", userId)
          .eq("curriculum_key", curriculumKey)
          .eq("lesson_id", lessonId)
        if (delErr) {
          setError(delErr.message)
          return
        }
      } else {
        const payload = {
          user_id: userId,
          stake_id: stakeId,
          curriculum_key: curriculumKey,
          lesson_id: lessonId,
          status: "completed" as const,
          completed_at: new Date().toISOString(),
          reflection_note: reflectionNote?.trim() || null,
        }
        const { error: upErr } = await supabase
          .from("role_training_progress")
          .upsert(payload, { onConflict: "user_id,curriculum_key,lesson_id" })
        if (upErr) {
          setError(upErr.message)
          return
        }
      }
      await load()
    },
    [userId, stakeId, curriculumKey, rows, tableMissing, supabase, load]
  )

  return {
    loading,
    error,
    tableMissing,
    rows,
    completedIds,
    toggleLesson,
    reload: load,
    signedIn: Boolean(userId),
  }
}
