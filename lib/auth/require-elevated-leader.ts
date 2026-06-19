import { createClient } from "@/lib/supabase/server"
import { canEditStakePermissionRoster } from "@/lib/settings/stake-office-slugs"

export type ElevatedLeaderContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  stakeId: string
  role: string
}

export async function requireElevatedLeader(): Promise<
  | { ok: true; ctx: ElevatedLeaderContext }
  | { ok: false; error: string; status: number }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: "Sign in required.", status: 401 }
  }

  const { data: me, error } = await supabase
    .from("users")
    .select("role, stake_id")
    .eq("id", user.id)
    .single()

  if (error || !me?.stake_id) {
    return { ok: false, error: "Stake profile not found.", status: 403 }
  }

  if (!canEditStakePermissionRoster(me.role)) {
    return { ok: false, error: "Only stake presidency or clerks can manage logins.", status: 403 }
  }

  return {
    ok: true,
    ctx: {
      supabase,
      userId: user.id,
      stakeId: me.stake_id,
      role: me.role ?? "viewer",
    },
  }
}
