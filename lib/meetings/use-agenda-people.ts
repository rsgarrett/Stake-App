"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  isHighCouncilSeatSlug,
  labelForOfficeSlug,
} from "@/lib/settings/stake-office-slugs"

/** Who this person is for meeting-attendance / rotation pool rules. */
export type AgendaPersonGroup =
  | "presidency"
  | "clerk_secretary"
  | "high_council"
  | "stake_auxiliary"
  | "bishop"
  | "other"

export interface AgendaPerson {
  name: string
  role: string
  group: AgendaPersonGroup
}

/** Stake council includes these organization presidents (from calling holders). */
export const STAKE_COUNCIL_AUXILIARY_CALLINGS = [
  "Stake Relief Society President",
  "Stake Young Women President",
  "Stake Primary President",
] as const

function groupForOfficeSlug(slug: string): AgendaPersonGroup {
  if (isHighCouncilSeatSlug(slug)) return "high_council"
  if (
    slug === "stake_president" ||
    slug === "first_counselor" ||
    slug === "second_counselor"
  ) {
    return "presidency"
  }
  if (
    slug === "stake_clerk" ||
    slug === "assistant_stake_clerk" ||
    slug === "executive_secretary" ||
    slug.startsWith("assistant_executive_secretary")
  ) {
    return "clerk_secretary"
  }
  return "other"
}

/**
 * Loads people for agenda assignment / prayer–training rotation:
 * presidency seats, clerks/secretaries, high council, stake auxiliary
 * presidents (RS / YW / Primary from the calling-holders roster), bishops.
 *
 * Auxiliary names follow the calling tracker via `stake_calling_holders`.
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

      const [{ data: users }] = await Promise.all([
        supabase.from("users").select("id, full_name, email").eq("stake_id", stakeId),
      ])
      const userById = new Map((users ?? []).map((u) => [u.id, u]))

      type RosterSeat = {
        office_slug: string
        assigned_user_id: string | null
        person_name?: string | null
        sort_order: number
      }
      const withNames = await supabase
        .from("stake_permission_roster")
        .select("office_slug, assigned_user_id, person_name, sort_order")
        .eq("stake_id", stakeId)
        .order("sort_order")
      let roster: RosterSeat[] = (withNames.data as RosterSeat[] | null) ?? []
      if (withNames.error) {
        const basic = await supabase
          .from("stake_permission_roster")
          .select("office_slug, assigned_user_id, sort_order")
          .eq("stake_id", stakeId)
          .order("sort_order")
        roster = (basic.data as RosterSeat[] | null) ?? []
      }
      for (const seat of roster) {
        const u = seat.assigned_user_id ? userById.get(seat.assigned_user_id) : null
        const name = (seat.person_name?.trim() || u?.full_name || u?.email || "").trim()
        if (!name) continue
        collected.push({
          name,
          role: labelForOfficeSlug(seat.office_slug),
          group: groupForOfficeSlug(seat.office_slug),
        })
      }

      const { data: hc } = await supabase
        .from("high_council_members")
        .select("member_name, status, display_order")
        .eq("stake_id", stakeId)
        .order("display_order")
      for (const m of hc ?? []) {
        if (m.status && m.status !== "active") continue
        const name = (m.member_name || "").trim()
        if (name) collected.push({ name, role: "High councilor", group: "high_council" })
      }

      // Stake RS / YW / Primary presidents — names stay current via calling tracker.
      const { data: auxiliaries } = await supabase
        .from("stake_calling_holders")
        .select("person_name, calling_name, status")
        .eq("stake_id", stakeId)
        .eq("status", "active")
        .in("calling_name", [...STAKE_COUNCIL_AUXILIARY_CALLINGS])
      for (const a of auxiliaries ?? []) {
        const name = (a.person_name || "").trim()
        if (!name) continue
        collected.push({
          name,
          role: a.calling_name,
          group: "stake_auxiliary",
        })
      }

      const { data: bishops } = await supabase
        .from("callings")
        .select("person_name, calling_name, status")
        .eq("stake_id", stakeId)
        .eq("calling_name", "Bishop")
      for (const b of bishops ?? []) {
        if (b.status && b.status !== "active") continue
        const name = (b.person_name || "").trim()
        if (name) collected.push({ name, role: "Bishop", group: "bishop" })
      }

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
