import { NextRequest, NextResponse } from "next/server"
import { requireElevatedLeader } from "@/lib/auth/require-elevated-leader"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  isAssistantExecSecCalling,
  isHighCouncilCalling,
  officeSlugForCallingName,
  pickAssistantExecSecSeatSlug,
  pickHighCouncilSeatSlug,
} from "@/lib/settings/calling-office-map"
import {
  clearUserFromStakeRoster,
  seatUserOnRoster,
  userHasOtherRosterSeats,
} from "@/lib/settings/roster-login"

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
      .select("person_name, calling_name, replaces_person_name, ward, stake_id")
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

    const { data: rosterRows } = await admin
      .from("stake_permission_roster")
      .select("id, office_slug, assigned_user_id, stake_id")
      .eq("stake_id", stakeId)

    if (isHighCouncilCalling(calling.calling_name)) {
      officeSlug = pickHighCouncilSeatSlug(rosterRows ?? [])
      if (!officeSlug) {
        results.push("No high council permission seat found — add one in Settings first.")
      }
    } else if (isAssistantExecSecCalling(calling.calling_name)) {
      officeSlug = pickAssistantExecSecSeatSlug(rosterRows ?? [])
      if (!officeSlug) {
        results.push("No assistant executive secretary seat found — check Settings roster.")
      }
    }

    let rosterRowId: string | null = null
    if (officeSlug && rosterRows?.length) {
      const row = rosterRows.find((r) => r.office_slug === officeSlug)
      rosterRowId = row?.id ?? null
    }

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
