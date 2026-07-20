"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ExternalLink } from "lucide-react"
import {
  BISHOP_GOOGLE_FORM_URL,
  RECOMMEND_WARDS,
  type RecommendCallingType,
} from "@/lib/callings/recommend-links"

const ORGANIZATIONS = [
  "High Council",
  "Stake Clerks",
  "Stake Executive Secretary",
  "Bishopric",
  "Elders Quorum",
  "Relief Society",
  "Young Men",
  "Young Women",
  "Primary",
  "Sunday School",
  "Music",
  "Seminary & Institute",
  "Stake Missionary",
  "Stake Temple & Family History",
  "Stake Welfare & Self-Reliance",
  "Stake Activities",
  "Stake Single Adults / Young Single Adults",
  "Other",
] as const

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"

/**
 * Public page (no login) for bishops and other ward leaders to recommend a name
 * for stake review. Submissions land as pending callings in the tracker.
 */
export default function PublicRecommendCallingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    person_name: "",
    ward: "",
    submitter_name: "",
    type: "Calling" as RecommendCallingType,
    organization: "",
    calling_name: "",
    current_calling: "",
    replaces_person_name: "",
    notes: "",
    company_website: "",
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/callings/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const payload = (await res.json()) as { error?: string; success?: boolean }
      if (!res.ok) throw new Error(payload.error || "Could not submit.")
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not submit.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <Card className="mx-auto max-w-lg border-emerald-200 bg-white shadow-sm">
          <CardContent className="py-10 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h1 className="text-xl font-semibold text-gray-900">Recommendation received</h1>
            <p className="text-sm text-gray-600">
              Thank you. The stake presidency will see this name in the calling tracker and will contact you
              before any interview is held.
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => {
                setDone(false)
                setForm({
                  person_name: "",
                  ward: "",
                  submitter_name: "",
                  type: "Calling",
                  organization: "",
                  calling_name: "",
                  current_calling: "",
                  replaces_person_name: "",
                  notes: "",
                  company_website: "",
                })
              }}
            >
              Submit another name
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Clearfield Utah North Stake
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Recommend a name for stake review
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            For bishops and ward leaders. Your recommendation goes straight to the stake calling tracker for
            presidency discussion. Please wait to interview the person until the stake presidency contacts you.
          </p>
        </div>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommendation</CardTitle>
            <CardDescription>
              Required fields are marked. Use the notes box for schedule, family, or other factors the
              presidency should know.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              ) : null}

              {/* Honeypot */}
              <input
                type="text"
                name="company_website"
                value={form.company_website}
                onChange={(e) => setForm({ ...form, company_website: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Full name of the person being recommended <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  className={inputClass}
                  value={form.person_name}
                  onChange={(e) => setForm({ ...form, person_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Person&apos;s home ward <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className={inputClass}
                    value={form.ward}
                    onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  >
                    <option value="">Select ward…</option>
                    {RECOMMEND_WARDS.map((w) => (
                      <option key={w} value={w}>
                        {w} Ward
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Your name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className={inputClass}
                    placeholder="Bishop / counselor submitting"
                    value={form.submitter_name}
                    onChange={(e) => setForm({ ...form, submitter_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className={inputClass}
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as RecommendCallingType })
                  }
                >
                  <option value="Calling">Stake or ward calling</option>
                  <option value="Assignment">Assignment</option>
                  <option value="MP">Melchizedek Priesthood advancement</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Organization</label>
                  <select
                    className={inputClass}
                    value={form.organization}
                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  >
                    <option value="">Optional…</option>
                    {ORGANIZATIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Calling / assignment name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className={inputClass}
                    placeholder="e.g. High Councilor, Stake Primary President"
                    value={form.calling_name}
                    onChange={(e) => setForm({ ...form, calling_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Their current calling (if any)
                  </label>
                  <input
                    className={inputClass}
                    value={form.current_calling}
                    onChange={(e) => setForm({ ...form, current_calling: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Would replace (if a release)
                  </label>
                  <input
                    className={inputClass}
                    value={form.replaces_person_name}
                    onChange={(e) => setForm({ ...form, replaces_person_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes for the stake presidency
                </label>
                <textarea
                  className={inputClass}
                  rows={4}
                  placeholder="Schedule, family situation, worthiness conversation, other factors…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting…" : "Submit recommendation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          Prefer the longer Google Form?{" "}
          <a
            href={BISHOP_GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"
          >
            Open detailed form <ExternalLink className="h-3 w-3" />
          </a>
          <span className="block mt-1 text-gray-400">
            (Google Form responses are not imported automatically — use this page when you want the name
            in the tracker right away.)
          </span>
        </p>
      </div>
    </div>
  )
}
