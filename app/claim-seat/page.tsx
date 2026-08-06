"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"

/**
 * Public one-time page: new calling holder sets email + password and claims their app seat.
 * Token comes from Set Apart / Settings → Copy claim link (not open signup).
 */
function ClaimSeatForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")?.trim() || ""

  const [loadingPreview, setLoadingPreview] = useState(true)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [personName, setPersonName] = useState("")
  const [officeLabel, setOfficeLabel] = useState("")
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setPreviewError("This link is missing its secure token. Ask stake leadership for a new claim link.")
      setLoadingPreview(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingPreview(true)
      setPreviewError(null)
      try {
        const res = await fetch(`/api/seats/claim?token=${encodeURIComponent(token)}`)
        const payload = (await res.json()) as {
          error?: string
          personName?: string
          officeLabel?: string
          expiresAt?: string
        }
        if (!res.ok) throw new Error(payload.error || "Could not load this claim link.")
        if (cancelled) return
        setPersonName(payload.personName || "")
        setOfficeLabel(payload.officeLabel || "")
        setExpiresAt(payload.expiresAt || null)
      } catch (e: unknown) {
        if (!cancelled) {
          setPreviewError(e instanceof Error ? e.message : "Could not load this claim link.")
        }
      } finally {
        if (!cancelled) setLoadingPreview(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/seats/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      })
      const payload = (await res.json()) as { error?: string; success?: boolean }
      if (!res.ok) throw new Error(payload.error || "Could not create your login.")
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create your login.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <Card className="mx-auto max-w-lg border-emerald-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              Login created
            </CardTitle>
            <CardDescription>
              Your account is ready for {officeLabel || "your stake seat"}. Sign in with the email and password you just
              chose.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Go to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <Card className="mx-auto max-w-lg bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Claim your stake app seat</CardTitle>
          <CardDescription>
            This is a one-time secure link from stake leadership. Choose the email and password you will use to sign in.
            Public signup is not available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingPreview ? (
            <p className="text-sm text-gray-500">Checking your claim link…</p>
          ) : previewError ? (
            <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-800">
              {previewError}
            </div>
          ) : (
            <>
              <div className="rounded-md bg-sky-50 border border-sky-100 px-3 py-2 text-sm text-sky-950">
                <p>
                  <span className="font-medium">{personName}</span>
                  {officeLabel ? <> · {officeLabel}</> : null}
                </p>
                {expiresAt ? (
                  <p className="text-xs text-sky-800 mt-1">
                    Link expires {new Date(expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                ) : null}
              </div>

              <form className="space-y-3" onSubmit={(e) => void submit(e)}>
                {error ? (
                  <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-800">{error}</div>
                ) : null}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Your email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className={inputClass}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating login…" : "Create login & claim seat"}
                </Button>
              </form>
            </>
          )}

          <p className="text-xs text-gray-500 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ClaimSeatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-gray-500">
          Loading…
        </div>
      }
    >
      <ClaimSeatForm />
    </Suspense>
  )
}
