import { samePersonName } from "@/lib/settings/calling-office-map"
import { sameCallingTitle } from "@/lib/callings/calling-name-aliases"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface CallingHolderRow {
  id: string
  stake_id: string
  organization: string | null
  calling_name: string
  person_name: string
  ward: string | null
  status: "active" | "released"
  called_date?: string | null
  released_date?: string | null
}

export function normalizeCallingName(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

export function sameCallingName(a: string | null | undefined, b: string | null | undefined): boolean {
  return sameCallingTitle(a, b)
}

type AdminClient = SupabaseClient

/**
 * Mark a person released from a calling (or from all active callings if
 * callingName is omitted). Returns a short note for the sync result log.
 */
export async function releaseCallingHolder(
  admin: AdminClient,
  stakeId: string,
  personName: string,
  callingName?: string | null
): Promise<string[]> {
  const notes: string[] = []

  const { data: active, error: loadErr } = await admin
    .from("stake_calling_holders")
    .select("id, person_name, calling_name")
    .eq("stake_id", stakeId)
    .eq("status", "active")
  if (loadErr) {
    // Table may not exist yet (migration 074 not run).
    if (/stake_calling_holders|schema cache/i.test(loadErr.message)) return []
    throw loadErr
  }

  const targets = (active ?? []).filter((row) => {
    if (!samePersonName(row.person_name, personName)) return false
    if (callingName && !sameCallingName(row.calling_name, callingName)) return false
    return true
  })
  if (targets.length === 0) return notes

  for (const row of targets) {
    const { error } = await admin
      .from("stake_calling_holders")
      .update({
        status: "released",
        released_date: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
    if (error) throw error
    notes.push(`Released '${row.person_name}' from ${row.calling_name} on the calling roster.`)
  }
  return notes
}

/**
 * After a calling is set apart: release the predecessor (if any) from that
 * calling, then record the new person as the active holder.
 */
export async function syncCallingHolderOnComplete(
  admin: AdminClient,
  opts: {
    stakeId: string
    personName: string
    callingName: string
    organization?: string | null
    ward?: string | null
    replacesPersonName?: string | null
    sourceCallingId?: string | null
  }
): Promise<string[]> {
  const notes: string[] = []
  const today = new Date().toISOString().slice(0, 10)

  // Probe that the table exists (graceful if migration 074 not run yet).
  const probe = await admin.from("stake_calling_holders").select("id").limit(1)
  if (probe.error && /stake_calling_holders|schema cache/i.test(probe.error.message)) {
    return ["Calling holders roster unavailable — run migration 074_stake_calling_holders.sql."]
  }

  if (opts.replacesPersonName?.trim()) {
    notes.push(
      ...(await releaseCallingHolder(
        admin,
        opts.stakeId,
        opts.replacesPersonName,
        opts.callingName
      ))
    )
  }

  // Reactivate if this person already has a released row for the same calling.
  const { data: prior } = await admin
    .from("stake_calling_holders")
    .select("id, status, person_name, calling_name")
    .eq("stake_id", opts.stakeId)
    .eq("calling_name", opts.callingName)

  const match = (prior ?? []).find((r) => samePersonName(r.person_name, opts.personName))
  if (match) {
    const { error } = await admin
      .from("stake_calling_holders")
      .update({
        status: "active",
        organization: opts.organization ?? null,
        ward: opts.ward ?? null,
        source_calling_id: opts.sourceCallingId ?? null,
        called_date: today,
        released_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.id)
    if (error) throw error
    notes.push(`Recorded '${opts.personName}' as current ${opts.callingName}.`)
    return notes
  }

  // Also release any other active holder of this exact seat-style calling when
  // replaces was set but name matching missed — for multi-seat callings like
  // High Councilor we only release the named predecessor (done above).
  const { error: insertErr } = await admin.from("stake_calling_holders").insert({
    stake_id: opts.stakeId,
    organization: opts.organization ?? null,
    calling_name: opts.callingName.trim(),
    person_name: opts.personName.trim(),
    ward: opts.ward ?? null,
    status: "active",
    source_calling_id: opts.sourceCallingId ?? null,
    called_date: today,
  })
  if (insertErr) throw insertErr
  notes.push(`Added '${opts.personName}' to the calling roster as ${opts.callingName}.`)
  return notes
}

/** Active holders for a calling (optionally scoped by organization). */
export async function loadActiveHoldersForCalling(
  supabase: AdminClient,
  stakeId: string,
  callingName: string
): Promise<CallingHolderRow[]> {
  const { data, error } = await supabase
    .from("stake_calling_holders")
    .select("id, stake_id, organization, calling_name, person_name, ward, status, called_date, released_date")
    .eq("stake_id", stakeId)
    .eq("status", "active")
    .order("person_name")
  if (error) {
    if (/stake_calling_holders|schema cache/i.test(error.message)) return []
    throw error
  }
  return ((data ?? []) as CallingHolderRow[]).filter((r) =>
    sameCallingName(r.calling_name, callingName)
  )
}
