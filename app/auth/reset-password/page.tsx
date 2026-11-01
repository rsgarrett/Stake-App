"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let settled = false
    const markReady = () => {
      settled = true
      setReady(true)
      setChecking(false)
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) markReady()
    })
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady()
    })
    const timer = setTimeout(() => {
      if (!settled) setChecking(false)
    }, 2500)
    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError("Use at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Those passwords do not match.")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }
    window.location.href = "/modules/leadership"
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
          <p className="mt-2 text-sm text-gray-600">
            This link is for your stake app seat. After you save, you are signed in.
          </p>
        </div>
        {checking ? (
          <p className="text-sm text-gray-500">Checking your link…</p>
        ) : !ready ? (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-950">
            This link is invalid or already used. Ask the stake president to send a new sign-in link from Settings.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={save}>
            {error ? (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
            ) : null}
            <input
              type="password"
              autoComplete="new-password"
              required
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-md text-gray-900"
            />
            <input
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-md text-gray-900"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-[44px] rounded-md bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save password and sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
