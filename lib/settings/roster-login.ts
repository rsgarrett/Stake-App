import type { SupabaseClient } from "@supabase/supabase-js"
import { appRoleForOfficeSlug } from "@/lib/settings/stake-office-slugs"

export async function clearUserFromStakeRoster(
  admin: SupabaseClient,
  stakeId: string,
  userId: string
) {
  const { error } = await admin
    .from("stake_permission_roster")
    .update({ assigned_user_id: null })
    .eq("stake_id", stakeId)
    .eq("assigned_user_id", userId)
  if (error) throw error
}

export async function userHasOtherRosterSeats(
  admin: SupabaseClient,
  stakeId: string,
  userId: string,
  excludeRowId?: string
): Promise<boolean> {
  let query = admin
    .from("stake_permission_roster")
    .select("id")
    .eq("stake_id", stakeId)
    .eq("assigned_user_id", userId)
  if (excludeRowId) {
    query = query.neq("id", excludeRowId)
  }
  const { data, error } = await query.limit(1)
  if (error) throw error
  return (data?.length ?? 0) > 0
}

export async function seatUserOnRoster(
  admin: SupabaseClient,
  stakeId: string,
  rosterRowId: string,
  userId: string
) {
  const { data: row, error: rowErr } = await admin
    .from("stake_permission_roster")
    .select("id, stake_id, office_slug, assigned_user_id")
    .eq("id", rosterRowId)
    .single()
  if (rowErr || !row) throw rowErr ?? new Error("Roster seat not found.")
  if (row.stake_id !== stakeId) throw new Error("Roster seat is not in your stake.")

  const targetRole = appRoleForOfficeSlug(row.office_slug)

  const { error: seatErr } = await admin
    .from("stake_permission_roster")
    .update({ assigned_user_id: userId })
    .eq("id", rosterRowId)
  if (seatErr) throw seatErr

  const { error: roleErr } = await admin.from("users").update({ role: targetRole }).eq("id", userId)
  if (roleErr) throw roleErr

  return { officeSlug: row.office_slug, role: targetRole, previousUserId: row.assigned_user_id as string | null }
}
