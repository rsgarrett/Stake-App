"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"

interface Holder {
  id: string
  organization: string | null
  calling_name: string
  person_name: string
  ward: string | null
  status: "active" | "released"
  called_date: string | null
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"

export default function CallingRosterPage() {
  const supabase = createClient()
  const [holders, setHolders] = useState<Holder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [stakeId, setStakeId] = useState<string | null>(null)
  const [form, setForm] = useState({
    person_name: "",
    calling_name: "",
    organization: "",
    ward: "",
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setError("Sign in required.")
      setLoading(false)
      return
    }
    const { data: profile } = await supabase
      .from("users")
      .select("stake_id")
      .eq("id", auth.user.id)
      .single()
    setStakeId(profile?.stake_id ?? null)

    const { data, error: loadErr } = await supabase
      .from("stake_calling_holders")
      .select("id, organization, calling_name, person_name, ward, status, called_date")
      .eq("status", "active")
      .order("calling_name")
      .order("person_name")

    if (loadErr) {
      if (/stake_calling_holders|schema cache/i.test(loadErr.message)) {
        setMigrationNeeded(true)
        setHolders([])
      } else {
        setError(loadErr.message)
      }
    } else {
      setHolders((data ?? []) as Holder[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  const grouped = useMemo(() => {
    const map = new Map<string, Holder[]>()
    for (const h of holders) {
      const key = h.calling_name
      const list = map.get(key) ?? []
      list.push(h)
      map.set(key, list)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [holders])

  const addHolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stakeId) {
      setError("No stake on your profile.")
      return
    }
    if (!form.person_name.trim() || !form.calling_name.trim()) {
      setError("Person name and calling are required.")
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertErr } = await supabase.from("stake_calling_holders").insert({
      stake_id: stakeId,
      person_name: form.person_name.trim(),
      calling_name: form.calling_name.trim(),
      organization: form.organization.trim() || null,
      ward: form.ward.trim() || null,
      status: "active",
      called_date: new Date().toISOString().slice(0, 10),
    })
    setSaving(false)
    if (insertErr) {
      setError(insertErr.message)
      return
    }
    setForm({ person_name: "", calling_name: "", organization: "", ward: "" })
    await load()
  }

  const releaseHolder = async (h: Holder) => {
    if (!confirm(`Mark ${h.person_name} released from ${h.calling_name}?`)) return
    const { error: updErr } = await supabase
      .from("stake_calling_holders")
      .update({
        status: "released",
        released_date: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("id", h.id)
    if (updErr) {
      setError(updErr.message)
      return
    }
    await load()
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Link
        href="/modules/leadership"
        className="inline-flex items-center text-sm text-indigo-600 hover:underline mb-3"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Calling Tracker
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stake calling roster</h1>
      <p className="mt-1 text-sm text-gray-600 mb-6">
        Who currently holds each stake calling. The Replaces dropdown on Submit a Name only shows
        people listed here for that calling. Completing a calling in the tracker updates this
        automatically — use this page to seed or correct names.
      </p>

      {migrationNeeded ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Run <code className="font-mono text-xs">074_stake_calling_holders.sql</code> in the
          Supabase SQL editor to enable this roster.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add current holder</CardTitle>
          <CardDescription>
            Enter someone already serving so they appear in Replaces for that calling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addHolder} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Person name *</label>
                <input
                  className={inputClass}
                  value={form.person_name}
                  onChange={(e) => setForm({ ...form, person_name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Calling *</label>
                <input
                  className={inputClass}
                  value={form.calling_name}
                  onChange={(e) => setForm({ ...form, calling_name: e.target.value })}
                  placeholder="e.g. High Councilor"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Organization</label>
                <input
                  className={inputClass}
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  placeholder="e.g. High Council"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ward</label>
                <input
                  className={inputClass}
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving || migrationNeeded} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {saving ? "Saving…" : "Add to roster"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-gray-500">No active holders yet. Add people above.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([calling, people]) => (
            <Card key={calling}>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  {calling}
                  <span className="text-xs font-normal text-gray-500">{people.length}</span>
                </CardTitle>
                {people[0]?.organization ? (
                  <CardDescription className="text-xs">{people[0].organization}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="pt-0 divide-y">
                {people.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{h.person_name}</p>
                      {h.ward ? <p className="text-xs text-gray-500">{h.ward}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => releaseHolder(h)}
                      className="text-gray-300 hover:text-red-500 shrink-0 p-1"
                      title="Mark released"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link href="/modules/leadership/recommend" className={buttonVariants({ variant: "outline" })}>
          Submit a name
        </Link>
      </div>
    </div>
  )
}
