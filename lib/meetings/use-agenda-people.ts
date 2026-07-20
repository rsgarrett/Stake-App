"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { labelForOfficeSlug } from "@/lib/settings/stake-office-slugs"

export interface AgendaPerson {
  name: string
  role: string
}

/**
 * Loads a de-duplicated list of assignable people for agenda pickers:
 * stake presidency / clerks / exec sec (from the permission roster + their
 * user profiles), active high councilors, and active bishops. Used to power
 * autocomplete on person / trainer / assigned-to fields so leaders pick a
 * name instead of retyping it every week.
 *
 * Fails soft: any query that errors is simply skipped.
 */
export function useAgendaPeople(): { people: AgendaPerson[] } {
  const [people, setPeople] = useState<AgendaPerson[]>([])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: me } = await supabase
        .from("users")
        .select("stake_id")
        .eq("id", user.id)
        .maybeSingle()
      const stakeId = me?.stake_id
      if (!stakeId) return

      const collected: AgendaPerson[] = []

      // Presidency / clerks / exec sec — roster seats joined to user profiles.
      const [{ data: roster }, { data: users }] = await Promise.all([
        supabase
          .from("stake_permission_roster")
          .select("office_slug, assigned_user_id, sort_order")
          .eq("stake_id", stakeId)
          .order("sort_order"),
        supabase
          .from("users")
          .select("id, full_name, email")
          .eq("stake_id", stakeId),
      ])
      const userById = new Map((users ?? []).map((u) => [u.id, u]))
      for (const seat of roster ?? []) {
        if (!seat.assigned_user_id) continue
        const u = userById.get(seat.assigned_user_id)
        const name = (u?.full_name || u?.email || "").trim()
        if (name) collected.push({ name, role: labelForOfficeSlug(seat.office_slug) })
      }

      // Active high councilors.
      const { data: hc } = await supabase
        .from("high_council_members")
        .select("member_name, status, display_order")
        .eq("stake_id", stakeId)
        .order("display_order")
      for (const m of hc ?? []) {
        if (m.status && m.status !== "active") continue
        const name = (m.member_name || "").trim()
        if (name) collected.push({ name, role: "High councilor" })
      }

      // Active bishops.
      const { data: bishops } = await supabase
        .from("callings")
        .select("person_name, calling_name, status")
        .eq("stake_id", stakeId)
        .eq("calling_name", "Bishop")
      for (const b of bishops ?? []) {
        if (b.status && b.status !== "active") continue
        const name = (b.person_name || "").trim()
        if (name) collected.push({ name, role: "Bishop" })
      }

      // De-dupe by name (first role label wins), keep insertion order.
      const seen = new Set<string>()
      const unique: AgendaPerson[] = []
      for (const p of collected) {
        const key = p.name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        unique.push(p)
      }

      if (!cancelled) setPeople(unique)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { people }
}
