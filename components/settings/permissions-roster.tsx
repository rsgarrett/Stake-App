"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  appRoleForOfficeSlug,
  canEditStakePermissionRoster,
  isHighCouncilSeatSlug,
  labelForOfficeSlug,
  ROLE_CAPABILITY_SUMMARY,
} from "@/lib/settings/stake-office-slugs"
import type { UserRole } from "@/types"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"
import { AlertCircle, KeyRound, Plus, Shield, Trash2, UserPlus, UserRoundCog } from "lucide-react"

export interface StakePermissionRosterRow {
  id: string
  stake_id: string
  sort_order: number
  office_slug: string
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

function buildHcEmailToDisplayName(
  rows: { member_name: string; email: string | null; status: string }[]
): Record<string, string> {
  const o: Record<string, string> = {}
  for (const r of rows) {
    if (r.status !== "active") continue
    const key = r.email?.trim().toLowerCase()
    if (key) o[key] = r.member_name.trim()
  }
  return o
}

function primaryAccountLabel(
  u: StakeUserOption,
  hcByEmail: Record<string, string>
): { primary: string; fromHcCommsRoster: boolean } {
  const em = u.email?.trim().toLowerCase()
  if (em && hcByEmail[em]) {
    return { primary: hcByEmail[em], fromHcCommsRoster: true }
  }
  if (u.full_name?.trim()) return { primary: u.full_name.trim(), fromHcCommsRoster: false }
  if (u.email?.trim()) return { primary: u.email.trim(), fromHcCommsRoster: false }
  return { primary: "Unnamed account", fromHcCommsRoster: false }
}

/** Next `high_council_n` slug; fills lowest unused integer (reuse after deletes). */
function nextHighCouncilSeatSlug(rows: StakePermissionRosterRow[]): string {
  const used = new Set<number>()
  for (const r of rows) {
    const m = /^high_council_([0-9]+)$/.exec(r.office_slug)
    if (m) used.add(parseInt(m[1], 10))
  }
  let n = 1
  while (used.has(n)) n += 1
  return `high_council_${n}`
}

export function PermissionsRoster() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [stakeId, setStakeId] = useState<string | null>(null)
  const [roster, setRoster] = useState<StakePermissionRosterRow[]>([])
  const [stakeUsers, setStakeUsers] = useState<StakeUserOption[]>([])
  const [hcNameByEmail, setHcNameByEmail] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [addingHc, setAddingHc] = useState(false)
  /** When true, removed/replaced leaders lose their login entirely (default). */
  const [revokeRemovedLogin, setRevokeRemovedLogin] = useState(true)
  const [creatingForRowId, setCreatingForRowId] = useState<string | null>(null)
  const [createEmail, setCreateEmail] = useState("")
  const [createFullName, setCreateFullName] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [createMode, setCreateMode] = useState<"create" | "invite">("create")
  const [lastProvisionMessage, setLastProvisionMessage] = useState<string | null>(null)

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
        setStakeId(null)
        setRoster([])
        setStakeUsers([])
        setHcNameByEmail({})
        return
      }

      const { data: me, error: meErr } = await supabase.from("users").select("role, stake_id").eq("id", user.id).single()
      if (meErr || !me?.stake_id) {
        setError(meErr?.message || "Stake not found on your profile.")
        return
      }
      setMyRole(me.role ?? null)
      setStakeId(me.stake_id)

      const [rosterResult, leadersResult, hcResult] = await Promise.all([
        supabase
          .from("stake_permission_roster")
          .select("id,stake_id,sort_order,office_slug,assigned_user_id")
          .eq("stake_id", me.stake_id)
          .order("sort_order"),
        supabase.from("users").select("id,email,full_name,role").eq("stake_id", me.stake_id).order("full_name"),
        supabase
          .from("high_council_members")
          .select("member_name,email,status")
          .eq("stake_id", me.stake_id),
      ])

      if (rosterResult.error) throw rosterResult.error
      if (leadersResult.error) throw leadersResult.error

      if (!hcResult.error && hcResult.data?.length) {
        setHcNameByEmail(buildHcEmailToDisplayName(hcResult.data as { member_name: string; email: string | null; status: string }[]))
      } else {
        setHcNameByEmail({})
      }

      let rosterRows = ((rosterResult.data || []) as StakePermissionRosterRow[])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order || a.office_slug.localeCompare(b.office_slug))

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
            rosterRows = (refetch.data as StakePermissionRosterRow[])
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order || a.office_slug.localeCompare(b.office_slug))
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
    (excludeRowId: string) =>
      new Set(roster.filter((r) => r.id !== excludeRowId && r.assigned_user_id).map((r) => r.assigned_user_id)),
    [roster]
  )

  const revokeUserLogin = async (userId: string, demoteOnly = false) => {
    const res = await fetch("/api/admin/users/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, demoteOnly }),
    })
    const payload = (await res.json()) as { error?: string; message?: string }
    if (!res.ok) throw new Error(payload.error || "Could not revoke login.")
    return payload.message || "Login updated."
  }

  const handleRemovedUser = async (previousId: string, excludeRowId: string) => {
    const stillElsewhere = roster.some((x) => x.id !== excludeRowId && x.assigned_user_id === previousId)
    if (stillElsewhere) return

    if (revokeRemovedLogin) {
      await revokeUserLogin(previousId, false)
      return
    }
    const { error: uPrev } = await supabase.from("users").update({ role: "viewer" }).eq("id", previousId)
    if (uPrev) throw uPrev
  }

  const provisionLoginForSeat = async (row: StakePermissionRosterRow) => {
    if (!canEdit) return
    setSavingId(row.id)
    setError(null)
    setLastProvisionMessage(null)
    try {
      const res = await fetch("/api/admin/users/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createEmail,
          fullName: createFullName,
          password: createPassword || undefined,
          rosterRowId: row.id,
          mode: createMode,
          revokePrevious: revokeRemovedLogin,
        }),
      })
      const payload = (await res.json()) as {
        error?: string
        message?: string
        tempPassword?: string
      }
      if (!res.ok) throw new Error(payload.error || "Could not create login.")

      let msg = payload.message || "Login created."
      if (payload.tempPassword) {
        msg += ` Temporary password: ${payload.tempPassword}`
      }
      setLastProvisionMessage(msg)
      setCreatingForRowId(null)
      setCreateEmail("")
      setCreateFullName("")
      setCreatePassword("")
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      window.alert(msg)
    } finally {
      setSavingId(null)
    }
  }

  const applyAssignment = async (row: StakePermissionRosterRow, newUserId: string | null) => {
    const targetRole = appRoleForOfficeSlug(row.office_slug)
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
        await handleRemovedUser(previousId, row.id)
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

  const deleteHighCouncilSeat = async (row: StakePermissionRosterRow) => {
    if (!canEdit || !isHighCouncilSeatSlug(row.office_slug)) return
    if (
      !window.confirm(
        "Remove this high council permission seat? If someone is seated, their login will be revoked or demoted per your setting below."
      )
    ) {
      return
    }
    setSavingId(row.id)
    setError(null)
    try {
      const previousId = row.assigned_user_id
      if (previousId) {
        const { error: rErr } = await supabase.from("stake_permission_roster").update({ assigned_user_id: null }).eq("id", row.id)
        if (rErr) throw rErr
        await handleRemovedUser(previousId, row.id)
      }
      const { error: delErr } = await supabase.from("stake_permission_roster").delete().eq("id", row.id)
      if (delErr) throw delErr
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      window.alert(`Could not remove seat: ${msg}`)
    } finally {
      setSavingId(null)
    }
  }

  const addHighCouncilSeat = async () => {
    if (!canEdit || !stakeId) return
    setAddingHc(true)
    setError(null)
    try {
      const slug = nextHighCouncilSeatSlug(roster)
      const maxOrd = roster.length ? Math.max(...roster.map((r) => r.sort_order)) : 0
      const { error: insErr } = await supabase.from("stake_permission_roster").insert({
        stake_id: stakeId,
        office_slug: slug,
        sort_order: maxOrd + 1,
      })
      if (insErr) throw insErr
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      window.alert(`Could not add seat: ${msg}`)
    } finally {
      setAddingHc(false)
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

  const handbookRows = useMemo(
    () => roster.filter((r) => !isHighCouncilSeatSlug(r.office_slug)).sort((a, b) => a.sort_order - b.sort_order),
    [roster]
  )
  const hcRows = useMemo(
    () => roster.filter((r) => isHighCouncilSeatSlug(r.office_slug)).sort((a, b) => a.sort_order - b.sort_order),
    [roster]
  )

  const renderSeatRow = (row: StakePermissionRosterRow) => {
    const taken = occupiedOthers(row.id)
    const opts = stakeUsers.filter((u) => !taken.has(u.id) || u.id === row.assigned_user_id)
    const seated = row.assigned_user_id ? stakeUsers.find((u) => u.id === row.assigned_user_id) : undefined
    const label = labelForOfficeSlug(row.office_slug)
    const appRole = appRoleForOfficeSlug(row.office_slug)
    const appRolePretty = englishMenuTitleCase(appRole.replace(/_/g, " "))

    let primary = "Vacant"
    let fromHc = false
    let subtitle: string | null = null
    if (seated) {
      const resolved = primaryAccountLabel(seated, hcNameByEmail)
      primary = resolved.primary
      fromHc = resolved.fromHcCommsRoster
      const extras: string[] = []
      if (seated.email && seated.email.trim() && !primary.includes(seated.email.trim())) extras.push(seated.email.trim())
      if (seated.full_name?.trim() && seated.full_name.trim() !== primary) extras.push(seated.full_name.trim())
      if (extras.length) subtitle = extras.join(" · ")
    }

    return (
      <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xl font-semibold text-gray-950 tracking-tight">{primary}</p>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">{label}</span>
              <span className="text-gray-400"> · </span>
              App permission: <span className="font-medium text-gray-800">{appRolePretty}</span>
            </p>
            {fromHc && seated ? (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-2 py-1 inline-block">
                Name matched from Leadership → High Council communications roster (same email).
              </p>
            ) : null}
            {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
            {!seated ? (
              <p className="text-xs text-amber-800">No one seated — create a login below or assign an existing stake account.</p>
            ) : (
              <p className="text-xs text-gray-500">
                Account ID <span className="font-mono text-gray-600">{seated.id.slice(0, 8)}…</span>
                {seated.role ? ` · current role ${seated.role}` : null}
              </p>
            )}
          </div>
          <div className="w-full sm:max-w-xs shrink-0 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Assign member</label>
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
              {opts.map((u) => {
                const { primary: optPrimary } = primaryAccountLabel(u, hcNameByEmail)
                const optLine = [optPrimary, u.email].filter(Boolean).join(" · ")
                return (
                  <option key={u.id} value={u.id}>
                    {optLine}
                  </option>
                )
              })}
            </select>
            <div className="flex flex-col gap-2">
              {canEdit && !seated ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={savingId === row.id}
                  onClick={() => {
                    setCreatingForRowId(creatingForRowId === row.id ? null : row.id)
                    setCreateEmail("")
                    setCreateFullName("")
                    setCreatePassword("")
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5 inline" aria-hidden />
                  {creatingForRowId === row.id ? "Cancel create login" : "Create login for this seat"}
                </Button>
              ) : null}
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
              {canEdit && seated ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-red-700 border-red-200 hover:bg-red-50"
                  disabled={savingId === row.id}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Revoke login for ${primary}? They will be removed from this seat and their account deleted (unless they hold another seat).`
                      )
                    ) {
                      return
                    }
                    setSavingId(row.id)
                    try {
                      await revokeUserLogin(seated.id, false)
                      await load()
                    } catch (e: unknown) {
                      window.alert(e instanceof Error ? e.message : String(e))
                    } finally {
                      setSavingId(null)
                    }
                  }}
                >
                  <KeyRound className="h-3.5 w-3.5 mr-1.5 inline" aria-hidden />
                  Revoke login
                </Button>
              ) : null}
              {canEdit && isHighCouncilSeatSlug(row.office_slug) ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-red-700 border-red-200 hover:bg-red-50"
                  disabled={savingId === row.id}
                  onClick={() => void deleteHighCouncilSeat(row)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5 inline" aria-hidden />
                  Delete this HC seat
                </Button>
              ) : null}
            </div>
            {canEdit && creatingForRowId === row.id ? (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 space-y-2">
                <p className="text-xs font-semibold text-indigo-900">New login for {label}</p>
                <input
                  type="email"
                  placeholder="Email address"
                  className={selectClass}
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Full name (as in LCR)"
                  className={selectClass}
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                />
                <div className="flex gap-2 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name={`mode-${row.id}`}
                      checked={createMode === "create"}
                      onChange={() => setCreateMode("create")}
                    />
                    Set password now
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name={`mode-${row.id}`}
                      checked={createMode === "invite"}
                      onChange={() => setCreateMode("invite")}
                    />
                    Email invite
                  </label>
                </div>
                {createMode === "create" ? (
                  <input
                    type="text"
                    placeholder="Password (optional — auto-generated if blank)"
                    className={selectClass}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                  />
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={savingId === row.id}
                  onClick={() => void provisionLoginForSeat(row)}
                >
                  Create &amp; seat
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

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
              <CardTitle className="text-xl">Stake leadership roster &amp; app permissions</CardTitle>
            </div>
            <CardDescription>
              Create and manage logins for stake presidency, clerks, executive secretaries, and high councilors.
              Each seat maps to app permissions. When someone is released, use <strong>Remove from seat</strong> or{" "}
              <strong>Revoke login</strong> so the previous person loses access.
              {canEdit
                ? " If the stake president seat was still empty after migration, it links to your account the first time you open this screen as president."
                : " Contact stake presidency or a clerk to change assignments."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {canEdit ? (
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={revokeRemovedLogin}
                onChange={(e) => setRevokeRemovedLogin(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <span>
                When someone is <strong>removed</strong> or <strong>replaced</strong>,{" "}
                <strong>revoke their login entirely</strong> (delete account) unless they still hold another seat.
                Uncheck to keep their account as <span className="font-medium">viewer</span> instead.
              </span>
            </label>
          ) : (
            <p className="text-sm rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-slate-800">
              <Shield className="inline h-4 w-4 mr-1 -mt-0.5 text-slate-500" aria-hidden />
              Read-only snapshot for your stake. Clerks edit seats from elevated accounts after migrations <code className="text-xs bg-white px-1 rounded">064</code>
              –<code className="text-xs bg-white px-1 rounded">067</code>.
            </p>
          )}

          {lastProvisionMessage ? (
            <p className="text-sm rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-900">
              {lastProvisionMessage}
            </p>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Handbook stake offices</h3>
            <div className="space-y-3">{handbookRows.map((row) => renderSeatRow(row))}</div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-gray-900">High council · app permission seats</h3>
              {canEdit ? (
                <Button type="button" size="sm" variant="secondary" disabled={addingHc || !stakeId} onClick={() => void addHighCouncilSeat()}>
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden />
                  Add HC seat
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-gray-500">
              Each seat grants the <span className="font-medium">high council</span> app role. Use Communications → High Council roster for calling names;
              match <span className="font-medium">login email</span> so the right name appears here.
            </p>
            <div className="space-y-3">{hcRows.length ? hcRows.map((row) => renderSeatRow(row)) : <p className="text-sm text-gray-500">No high council seats yet — click Add HC seat.</p>}</div>
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
