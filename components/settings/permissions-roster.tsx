"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  OFFICE_LABELS,
  OFFICE_SORT_ORDER,
  ROLE_CAPABILITY_SUMMARY,
  type StakeOfficeSlug,
  appRoleForOffice,
  canEditStakePermissionRoster,
} from "@/lib/settings/stake-office-slugs"
import type { UserRole } from "@/types"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"
import { AlertCircle, Shield, UserRoundCog } from "lucide-react"

export interface StakePermissionRosterRow {
  id: string
  stake_id: string
  sort_order: number
  office_slug: StakeOfficeSlug
  assigned_user_id: string | null
}

interface StakeUserOption {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole | string
}

const selectClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"

export function PermissionsRoster() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [roster, setRoster] = useState<StakePermissionRosterRow[]>([])
  const [stakeUsers, setStakeUsers] = useState<StakeUserOption[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [demoteRemoved, setDemoteRemoved] = useState(true)

  const canEdit = canEditStakePermissionRoster(myRole)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setMyRole(null)
        setRoster([])
        setStakeUsers([])
        return
      }

      const { data: me, error: meErr } = await supabase.from("users").select("role, stake_id").eq("id", user.id).single()
      if (meErr || !me?.stake_id) {
        setError(meErr?.message || "Stake not found on your profile.")
        return
      }
      setMyRole(me.role ?? null)

      const [rosterResult, leadersResult] = await Promise.all([
        supabase
          .from("stake_permission_roster")
          .select("id,stake_id,sort_order,office_slug,assigned_user_id")
          .eq("stake_id", me.stake_id)
          .order("sort_order"),
        supabase.from("users").select("id,email,full_name,role").eq("stake_id", me.stake_id).order("full_name"),
      ])

      if (rosterResult.error) throw rosterResult.error
      if (leadersResult.error) throw leadersResult.error

      let rosterRows = ((rosterResult.data || []) as StakePermissionRosterRow[])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)

      // Pre-064 presidents keep users.role but the roster seat stays vacant until assigned — seat self once if allowed by RLS.
      const presSeat = rosterRows.find((r) => r.office_slug === "stake_president")
      if (
        me.role === "stake_president" &&
        presSeat &&
        !presSeat.assigned_user_id &&
        presSeat.stake_id === me.stake_id
      ) {
        const { error: seatErr } = await supabase
          .from("stake_permission_roster")
          .update({ assigned_user_id: user.id })
          .eq("id", presSeat.id)
        if (!seatErr) {
          const refetch = await supabase
            .from("stake_permission_roster")
            .select("id,stake_id,sort_order,office_slug,assigned_user_id")
            .eq("stake_id", me.stake_id)
            .order("sort_order")
          if (!refetch.error && refetch.data?.length) {
            rosterRows = (refetch.data as StakePermissionRosterRow[]).slice().sort((a, b) => a.sort_order - b.sort_order)
          }
        }
      }

      setRoster(rosterRows)
      setStakeUsers((leadersResult.data || []) as StakeUserOption[])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  const occupiedOthers = useCallback(
    (excludeRowId: string) => new Set(roster.filter((r) => r.id !== excludeRowId && r.assigned_user_id).map((r) => r.assigned_user_id)),
    [roster]
  )

  const userLabel = (u: StakeUserOption) => [u.full_name, u.email].filter(Boolean).join(" · ") || u.id.slice(0, 8)

  const applyAssignment = async (row: StakePermissionRosterRow, newUserId: string | null) => {
    const targetRole = appRoleForOffice(row.office_slug as StakeOfficeSlug)
    const previousId = row.assigned_user_id
    const take = occupiedOthers(row.id)
    if (newUserId && take.has(newUserId)) {
      window.alert("That leader is already assigned to another officeship. Clear the other seat first.")
      return
    }

    setSavingId(row.id)
    setError(null)
    try {
      const { error: rErr } = await supabase.from("stake_permission_roster").update({ assigned_user_id: newUserId }).eq("id", row.id)
      if (rErr) throw rErr

      if (previousId && previousId !== newUserId) {
        const stillElsewhere = roster.some((x) => x.id !== row.id && x.assigned_user_id === previousId)
        if (demoteRemoved && !stillElsewhere) {
          const { error: uPrev } = await supabase.from("users").update({ role: "viewer" }).eq("id", previousId)
          if (uPrev) throw uPrev
        }
      }

      if (newUserId) {
        const { error: uNew } = await supabase.from("users").update({ role: targetRole }).eq("id", newUserId)
        if (uNew) throw uNew
      }

      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      window.alert(`Could not save: ${msg}`)
    } finally {
      setSavingId(null)
    }
  }

  const roleSummariesSection = useMemo(() => {
    const roles: UserRole[] = [
      "stake_president",
      "counselor",
      "clerk",
      "assistant_clerk",
      "executive_secretary",
      "assistant_executive_secretary",
      "high_council",
    ]
    return roles.map((r) => (
      <div key={r} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
        <p className="text-xs font-semibold capitalize text-gray-800">{englishMenuTitleCase(r.replace(/_/g, " "))}</p>
        <p className="text-xs text-gray-600 mt-0.5">{ROLE_CAPABILITY_SUMMARY[r]}</p>
      </div>
    ))
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">Loading permissions roster…</CardContent>
      </Card>
    )
  }

  if (error && roster.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-900">
            <AlertCircle className="h-4 w-4" /> Permissions roster unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900">{error}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <UserRoundCog className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-xl">Stake leadership roster &amp; app roles</CardTitle>
            </div>
            <CardDescription>
              Handbook stake offices through the assistant executive secretaries, plus twelve high council seats below (leave vacant if your council is smaller).
              Seats control who carries which <strong>logged-in permission</strong> in this app. Only leaders with an account in your stake directory appear in the dropdowns.
              {canEdit
                ? " You can seat or rotate leaders anytime. If the stake president seat was still empty after the roster migration, it links to your account the first time you open this screen while signed in as president."
                : " Contact a stake presidency member or clerk to change seats."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {canEdit ? (
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" checked={demoteRemoved} onChange={(e) => setDemoteRemoved(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
              <span>
                When someone is <strong>removed</strong> from a seat or <strong>replaced</strong>, set their former app login to{" "}
                <span className="font-medium">viewer</span> unless they still hold another seat elsewhere on this roster (still shown in the Member list below).
              </span>
            </label>
          ) : (
            <p className="text-sm rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-slate-800">
              <Shield className="inline h-4 w-4 mr-1 -mt-0.5 text-slate-500" aria-hidden />
              Read-only snapshot for your stake. Clerks edit seats from presidency or clerical elevated accounts after migration <code className="text-xs bg-white px-1 rounded">064</code> is applied.
            </p>
          )}

          <div className="space-y-3">
            {[...roster]
              .sort((a, b) => OFFICE_SORT_ORDER[a.office_slug as StakeOfficeSlug] - OFFICE_SORT_ORDER[b.office_slug as StakeOfficeSlug])
              .map((row) => {
                const taken = occupiedOthers(row.id)
                const opts = stakeUsers.filter((u) => !taken.has(u.id) || u.id === row.assigned_user_id)
                const seated = stakeUsers.find((u) => u.id === row.assigned_user_id)
                return (
                  <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{OFFICE_LABELS[row.office_slug as StakeOfficeSlug]}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          App role when seated:{" "}
                          <span className="font-medium text-gray-700">
                            {englishMenuTitleCase(appRoleForOffice(row.office_slug as StakeOfficeSlug).replace(/_/g, " "))}
                          </span>
                        </p>
                        {seated ? (
                          <p className="text-xs text-gray-600 mt-1">
                            Current: <span className="font-medium">{userLabel(seated)}</span> · role {seated.role}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-700 mt-1">Vacant — assign a stake account after they sign in once.</p>
                        )}
                      </div>
                      <div className="w-full sm:max-w-xs shrink-0 space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Member</label>
                        <select
                          disabled={!canEdit || savingId === row.id}
                          className={selectClass}
                          value={row.assigned_user_id ?? ""}
                          onChange={(e) => {
                            const v = e.target.value || null
                            void applyAssignment(row, v)
                          }}
                        >
                          <option value="">{englishMenuTitleCase("Vacant")}</option>
                          {opts.map((u) => (
                            <option key={u.id} value={u.id}>
                              {userLabel(u)}
                            </option>
                          ))}
                        </select>
                        {canEdit && row.assigned_user_id ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={savingId === row.id}
                            onClick={() => void applyAssignment(row, null)}
                          >
                            Remove from seat
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What each elevated role can do (summary)</CardTitle>
          <CardDescription>Row-level security in the database matches these broad patterns; some modules have extra rules (e.g. High Council view-only meetings).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">{roleSummariesSection}</CardContent>
      </Card>
    </div>
  )
}
