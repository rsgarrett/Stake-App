import { NextRequest, NextResponse } from "next/server"
import { requireElevatedLeader } from "@/lib/auth/require-elevated-leader"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  isAssistantExecSecCalling,
  isHighCouncilCalling,
  officeSlugForCallingName,
  pickAssistantExecSecSeatSlug,
  pickHighCouncilSeatSlug,
  samePersonName,
  type SeatPickRow,
} from "@/lib/settings/calling-office-map"
import {
  clearUserFromStakeRoster,
  seatUserOnRoster,
  userHasOtherRosterSeats,
} from "@/lib/settings/roster-login"
import {
  releaseCallingHolder,
  syncCallingHolderOnComplete,
} from "@/lib/callings/calling-holders"

async function findUserByName(
  admin: ReturnType<typeof createAdminClient>,
  stakeId: string,
  personName: string
) {
  const name = personName.trim()
  if (!name) return null

  const { data } = await admin
    .from("users")
    .select("id, role, full_name, email")
    .eq("stake_id", stakeId)
    .ilike("full_name", name)
    .limit(1)
    .maybeSingle()
  return data
}

async function revokeReleasedPerson(
  admin: ReturnType<typeof createAdminClient>,
  stakeId: string,
  personName: string,
  excludeRowId?: string
) {
  const oldUser = await findUserByName(admin, stakeId, personName)
  if (!oldUser) return `No login found for released person '${personName}'.`

  const stillElsewhere = await userHasOtherRosterSeats(admin, stakeId, oldUser.id, excludeRowId)
  await clearUserFromStakeRoster(admin, stakeId, oldUser.id)

  if (stillElsewhere) {
    await admin.from("users").update({ role: "viewer" }).eq("id", oldUser.id)
    return `Removed '${personName}' from roster seat(s); login kept as viewer (other seat held).`
  }

  const { error } = await admin.auth.admin.deleteUser(oldUser.id)
  if (error) throw error
  return `Removed login for '${personName}' (released from calling).`
}

interface RosterSeatRow extends SeatPickRow {
  id: string
  stake_id: string
}

/** Loads roster seats incl. `person_name`; falls back pre-migration-072 (names then unavailable). */
async function loadRosterSeats(
  admin: ReturnType<typeof createAdminClient>,
  stakeId: string
): Promise<{ rows: RosterSeatRow[]; personNamesAvailable: boolean }> {
  const withNames = await admin
    .from("stake_permission_roster")
    .select("id, office_slug, assigned_user_id, stake_id, person_name")
    .eq("stake_id", stakeId)
  if (!withNames.error) {
    return { rows: (withNames.data ?? []) as RosterSeatRow[], personNamesAvailable: true }
  }
  const basic = await admin
    .from("stake_permission_roster")
    .select("id, office_slug, assigned_user_id, stake_id")
    .eq("stake_id", stakeId)
  return { rows: (basic.data ?? []) as RosterSeatRow[], personNamesAvailable: false }
}

/** Writes the new holder's name on the seat and clears the released holder's name elsewhere. */
async function syncSeatHolderNames(
  admin: ReturnType<typeof createAdminClient>,
  rosterRows: RosterSeatRow[],
  seatRowId: string | null,
  newPersonName: string,
  replacesPersonName: string | null
): Promise<string[]> {
  const notes: string[] = []
  if (seatRowId) {
    const { error } = await admin
      .from("stake_permission_roster")
      .update({ person_name: newPersonName })
      .eq("id", seatRowId)
    if (error) throw error
    notes.push(`Seat now shows '${newPersonName}' as the calling holder.`)
  }
  if (replacesPersonName) {
    const stale = rosterRows.filter(
      (r) => r.id !== seatRowId && samePersonName(r.person_name, replacesPersonName)
    )
    for (const r of stale) {
      const { error } = await admin
        .from("stake_permission_roster")
        .update({ person_name: null })
        .eq("id", r.id)
      if (error) throw error
      notes.push(`Cleared '${replacesPersonName}' from the ${r.office_slug} seat.`)
    }
  }
  return notes
}

/** Marks a person released on the High Council communications roster (no-op if not on it). */
async function releaseFromHcRoster(
  admin: ReturnType<typeof createAdminClient>,
  stakeId: string,
  personName: string
): Promise<string[]> {
  const { data: released } = await admin
    .from("high_council_members")
    .update({ status: "released", released_date: new Date().toISOString().slice(0, 10) })
    .eq("stake_id", stakeId)
    .eq("status", "active")
    .ilike("member_name", personName.trim())
    .select("id")
  return released?.length ? [`Marked '${personName}' released on the HC roster.`] : []
}

function isMissingSuccessionColumn(error: { message?: string } | null): boolean {
  return /replaced_member_id/i.test(error?.message ?? "")
}

/** Keeps the High Council communications roster in step with completed HC callings/releases. */
async function syncHighCouncilRoster(
  admin: ReturnType<typeof createAdminClient>,
  stakeId: string,
  newPersonName: string,
  replacesPersonName: string | null
): Promise<string[]> {
  const notes: string[] = []
  const today = new Date().toISOString().slice(0, 10)

  // Predecessor row id — links the seat's report history to the new holder.
  let predecessorId: string | null = null
  if (replacesPersonName) {
    const { data: predecessor } = await admin
      .from("high_council_members")
      .select("id")
      .eq("stake_id", stakeId)
      .ilike("member_name", replacesPersonName.trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    predecessorId = predecessor?.id ?? null
    notes.push(...(await releaseFromHcRoster(admin, stakeId, replacesPersonName)))
  }

  const { data: existing } = await admin
    .from("high_council_members")
    .select("id, status")
    .eq("stake_id", stakeId)
    .ilike("member_name", newPersonName.trim())
    .limit(1)
    .maybeSingle()

  const successionPatch =
    predecessorId && predecessorId !== existing?.id ? { replaced_member_id: predecessorId } : {}

  let successionLinked = false

  if (existing) {
    const patch: Record<string, unknown> = { ...successionPatch }
    if (existing.status !== "active") {
      Object.assign(patch, { status: "active", called_date: today, released_date: null })
    }
    if (Object.keys(patch).length > 0) {
      let { error } = await admin.from("high_council_members").update(patch).eq("id", existing.id)
      if (error && isMissingSuccessionColumn(error)) {
        delete patch.replaced_member_id
        notes.push("Seat history link not saved — run migration 073_hc_member_succession.sql.")
        if (Object.keys(patch).length > 0) {
          ;({ error } = await admin.from("high_council_members").update(patch).eq("id", existing.id))
        } else {
          error = null
        }
      }
      if (!error) {
        successionLinked = "replaced_member_id" in patch
        if (existing.status !== "active") notes.push(`Reactivated '${newPersonName}' on the HC roster.`)
      }
    }
  } else {
    const baseRow = {
      stake_id: stakeId,
      member_name: newPersonName.trim(),
      status: "active",
      called_date: today,
    }
    const withSuccession = Object.keys(successionPatch).length > 0
    let { error } = await admin
      .from("high_council_members")
      .insert({ ...baseRow, ...successionPatch })
    let insertedWithSuccession = withSuccession
    if (error && isMissingSuccessionColumn(error)) {
      notes.push("Seat history link not saved — run migration 073_hc_member_succession.sql.")
      insertedWithSuccession = false
      ;({ error } = await admin.from("high_council_members").insert(baseRow))
    }
    if (!error) {
      notes.push(`Added '${newPersonName}' to the HC roster.`)
      successionLinked = insertedWithSuccession
    }
  }

  if (successionLinked) {
    notes.push(`Linked ${newPersonName}'s seat history to ${replacesPersonName}.`)
  }
  return notes
}

export async function POST(req: NextRequest) {
  const auth = await requireElevatedLeader()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { callingId } = await req.json()
    if (!callingId) {
      return NextResponse.json({ error: "callingId required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { stakeId } = auth.ctx

    const { data: calling, error: callingError } = await admin
      .from("callings")
      .select("type, person_name, calling_name, organization, replaces_person_name, ward, stake_id")
      .eq("id", callingId)
      .single()

    if (callingError || !calling) {
      return NextResponse.json({ error: "Calling not found" }, { status: 404 })
    }
    if (calling.stake_id !== stakeId) {
      return NextResponse.json({ error: "Calling is not in your stake." }, { status: 403 })
    }

    const results: string[] = []
    let officeSlug = officeSlugForCallingName(calling.calling_name)

    const { rows: rosterRows, personNamesAvailable } = await loadRosterSeats(admin, stakeId)

    // Standalone release (no replacement calling): clear the person's seat,
    // HC roster entry, and login — they are not a new holder of anything.
    if (calling.type === "Release") {
      if (personNamesAvailable) {
        const cleared = await syncSeatHolderNames(admin, rosterRows, null, "", calling.person_name)
        results.push(
          ...(cleared.length ? cleared : [`'${calling.person_name}' did not hold a permission seat.`])
        )
      } else {
        results.push(
          "Seat holder names could not be updated — run migration 072_roster_seat_person_names.sql."
        )
      }
      results.push(
        ...(await releaseCallingHolder(
          admin,
          stakeId,
          calling.person_name,
          calling.calling_name
        ))
      )
      results.push(...(await releaseFromHcRoster(admin, stakeId, calling.person_name)))
      results.push(await revokeReleasedPerson(admin, stakeId, calling.person_name))
      return NextResponse.json({ success: true, results, release: true })
    }

    if (isHighCouncilCalling(calling.calling_name)) {
      officeSlug = pickHighCouncilSeatSlug(rosterRows, calling.replaces_person_name)
      if (!officeSlug) {
        results.push("No high council permission seat found — add one in Settings first.")
      }
    } else if (isAssistantExecSecCalling(calling.calling_name)) {
      officeSlug = pickAssistantExecSecSeatSlug(rosterRows, calling.replaces_person_name)
      if (!officeSlug) {
        results.push("No assistant executive secretary seat found — check Settings roster.")
      }
    }

    let rosterRowId: string | null = null
    if (officeSlug && rosterRows.length) {
      const row = rosterRows.find((r) => r.office_slug === officeSlug)
      rosterRowId = row?.id ?? null
    }

    if (personNamesAvailable) {
      results.push(
        ...(await syncSeatHolderNames(
          admin,
          rosterRows,
          rosterRowId,
          calling.person_name,
          calling.replaces_person_name ?? null
        ))
      )
    } else {
      results.push(
        "Seat holder names could not be updated — run migration 072_roster_seat_person_names.sql."
      )
    }

    if (isHighCouncilCalling(calling.calling_name)) {
      results.push(
        ...(await syncHighCouncilRoster(
          admin,
          stakeId,
          calling.person_name,
          calling.replaces_person_name ?? null
        ))
      )
    }

    results.push(
      ...(await syncCallingHolderOnComplete(admin, {
        stakeId,
        personName: calling.person_name,
        callingName: calling.calling_name,
        organization: calling.organization,
        ward: calling.ward,
        replacesPersonName: calling.replaces_person_name,
        sourceCallingId: callingId,
      }))
    )

    if (calling.replaces_person_name) {
      results.push(
        await revokeReleasedPerson(admin, stakeId, calling.replaces_person_name, rosterRowId ?? undefined)
      )
    }

    const newUser = await findUserByName(admin, stakeId, calling.person_name)
    if (newUser && rosterRowId) {
      const seated = await seatUserOnRoster(admin, stakeId, rosterRowId, newUser.id)
      results.push(`Seated ${calling.person_name} on ${seated.officeSlug} (${seated.role}).`)
    } else if (newUser) {
      const { data: roleMap } = await admin
        .from("calling_role_map")
        .select("app_role")
        .eq("calling_name", calling.calling_name)
        .limit(1)
        .maybeSingle()
      if (roleMap?.app_role) {
        await admin.from("users").update({ role: roleMap.app_role }).eq("id", newUser.id)
        results.push(`Updated ${calling.person_name} role to ${roleMap.app_role}.`)
      }
    } else {
      results.push(
        `No login for '${calling.person_name}' — create one in Settings → Stake leadership roster (email required).`
      )
    }

    return NextResponse.json({ success: true, results, rosterRowId, officeSlug })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error"
    console.error("sync-role:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
