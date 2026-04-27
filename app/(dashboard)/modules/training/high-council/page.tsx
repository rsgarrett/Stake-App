"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookMarked,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  GraduationCap,
  Heart,
  LayoutList,
  ListOrdered,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  X,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  canEditHighCouncilTraining,
  getDefaultHighCouncilPayload,
  mergeHighCouncilPayload,
  type HighCouncilSlide,
  type HighCouncilSlidePresentation,
  type HighCouncilTopic,
  type HighCouncilTrainingPayload,
  type OfficialResourceRow,
} from "@/lib/training/high-council-training"

const STORAGE_KEY = "stake-app-hc-training-checklist"
const PAYLOAD_DRAFT_PREFIX = "stake-app-hc-training-payload-"

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"

function loadChecked(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function linesToArray(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
}

function arrayToLines(arr: string[]): string {
  return arr.join("\n")
}

function SlideBodyReadView({ body }: { body: string }) {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return <p className="text-sm text-gray-500 italic">No bullets yet.</p>
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  )
}

function scrollToSlide(slideId: string) {
  document.getElementById(`hc-slide-${slideId}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

async function getStakeId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from("users").select("stake_id").eq("id", user.id).single()
  if (data?.stake_id) return data.stake_id as string
  const { data: s } = await supabase.from("stakes").select("id").limit(1).single()
  return (s?.id as string) || null
}

function payloadDraftKey(stakeId: string) {
  return `${PAYLOAD_DRAFT_PREFIX}${stakeId}`
}

function loadPayloadDraftFromBrowser(stakeId: string): HighCouncilTrainingPayload | null {
  try {
    const raw = localStorage.getItem(payloadDraftKey(stakeId))
    if (!raw) return null
    return mergeHighCouncilPayload(JSON.parse(raw))
  } catch {
    return null
  }
}

function savePayloadDraftToBrowser(stakeId: string, payload: HighCouncilTrainingPayload) {
  try {
    localStorage.setItem(payloadDraftKey(stakeId), JSON.stringify(payload))
  } catch {
    /* quota or private mode */
  }
}

function isLikelyMissingTableError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false
  const m = (err.message || "").toLowerCase()
  const c = String(err.code || "")
  if (c === "42P01") return true
  if (m.includes("does not exist") && (m.includes("relation") || m.includes("table"))) return true
  if (m.includes("schema cache") || m.includes("could not find the table")) return true
  return false
}

export default function HighCouncilTrainingPage() {
  const supabase = createClient() // stable client for handlers; initial load uses fresh client in effect
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [payload, setPayload] = useState<HighCouncilTrainingPayload>(getDefaultHighCouncilPayload)
  const [baselineJson, setBaselineJson] = useState("")
  const [rowId, setRowId] = useState<string | null>(null)
  const [stakeId, setStakeId] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [openTopic, setOpenTopic] = useState<string | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [dbNote, setDbNote] = useState<string | null>(null)
  /** `info` = blue (migration / local draft); `warning` = amber (unexpected errors). */
  const [dbNoticeTone, setDbNoticeTone] = useState<"info" | "warning" | null>(null)

  const persistChecklist = useCallback((next: Set<string>) => {
    setChecked(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    setChecked(loadChecked())
  }, [])

  useEffect(() => {
    const sb = createClient()
    let cancelled = false
    ;(async () => {
      try {
        const sid = await getStakeId(sb)
        if (cancelled) return
        setStakeId(sid)

        const {
          data: { user },
        } = await sb.auth.getUser()
        if (user) {
          const { data: profile } = await sb.from("users").select("role").eq("id", user.id).single()
          if (!cancelled) setCanEdit(canEditHighCouncilTraining(profile?.role as string | undefined))
        }

        if (!sid) {
          if (!cancelled) {
            setPayload(getDefaultHighCouncilPayload())
            setBaselineJson(JSON.stringify(getDefaultHighCouncilPayload()))
            setDbNoticeTone("info")
            setDbNote(
              "No stake on your profile — showing default content. Link your user to a stake to enable shared saves."
            )
          }
          return
        }

        const { data, error } = await sb
          .from("high_council_training_content")
          .select("id, payload")
          .eq("stake_id", sid)
          .maybeSingle()

        if (cancelled) return

        if (error) {
          console.warn("high_council_training_content:", error.message, error)
          const draft = loadPayloadDraftFromBrowser(sid)
          if (draft) {
            setPayload(draft)
            setBaselineJson(JSON.stringify(draft))
            setDbNoticeTone("info")
            setDbNote(
              "Could not reach the Supabase table (often not migrated yet). Loaded your last draft from this browser. You can keep editing and use Save — it will store locally until `046_high_council_training_content.sql` is applied, then Save will sync to the stake."
            )
            return
          }
          const merged = getDefaultHighCouncilPayload()
          setPayload(merged)
          setBaselineJson(JSON.stringify(merged))
          setRowId(null)
          if (isLikelyMissingTableError(error)) {
            setDbNoticeTone("info")
            setDbNote(
              "The `high_council_training_content` table is not in your database yet. Showing defaults. Run `046_high_council_training_content.sql` from this repo in the Supabase SQL Editor, then refresh. Until then, Save stores a draft on this device only."
            )
          } else {
            setDbNoticeTone("warning")
            setDbNote(
              `Could not load training content: ${error.message || "Unknown error"}. If this is not a missing table, check Row Level Security and that your user has a stake_id. You can still edit; Save will try local backup.`
            )
          }
          return
        }

        if (!data) {
          const draft = loadPayloadDraftFromBrowser(sid)
          if (draft) {
            setPayload(draft)
            setBaselineJson(JSON.stringify(draft))
            setDbNoticeTone("info")
            setDbNote("No stake-wide copy yet — loaded your browser draft. Save after migration to store for everyone.")
            return
          }
        }

        const merged = mergeHighCouncilPayload(data?.payload)
        setPayload(merged)
        setBaselineJson(JSON.stringify(merged))
        if (data?.id) setRowId(data.id)
        savePayloadDraftToBrowser(sid, merged)
        setDbNote(null)
        setDbNoticeTone(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const beginEdit = () => {
    setBaselineJson(JSON.stringify(payload))
    setEditMode(true)
  }

  const cancelEdit = () => {
    try {
      setPayload(JSON.parse(baselineJson) as HighCouncilTrainingPayload)
    } catch {
      setPayload(getDefaultHighCouncilPayload())
    }
    setEditMode(false)
  }

  const savePayload = async () => {
    if (!stakeId || !canEdit) return
    setSaving(true)
    setDbNote(null)
    setDbNoticeTone(null)
    try {
      if (rowId) {
        const { error } = await supabase
          .from("high_council_training_content")
          .update({ payload })
          .eq("id", rowId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("high_council_training_content")
          .insert({ stake_id: stakeId, payload })
          .select("id")
          .single()
        if (error) throw error
        if (data?.id) setRowId(data.id as string)
      }
      savePayloadDraftToBrowser(stakeId, payload)
      setBaselineJson(JSON.stringify(payload))
      setEditMode(false)
    } catch (e: unknown) {
      savePayloadDraftToBrowser(stakeId, payload)
      setBaselineJson(JSON.stringify(payload))
      setEditMode(false)
      const msg = e instanceof Error ? e.message : String(e)
      setDbNoticeTone("info")
      setDbNote(
        `Could not save to Supabase (${msg}). Your changes were saved in this browser. After you run \`046_high_council_training_content.sql\` in the SQL Editor, open this page again and Save once to copy the draft to the database for all users.`
      )
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    if (!confirm("Replace all content with the original Church-aligned defaults?")) return
    const d = getDefaultHighCouncilPayload()
    setPayload(d)
  }

  const updateTopic = (id: string, patch: Partial<HighCouncilTopic>) => {
    setPayload((p) => ({
      ...p,
      topics: p.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }

  const removeTopic = (id: string) => {
    setPayload((p) => ({ ...p, topics: p.topics.filter((t) => t.id !== id) }))
    if (openTopic === id) setOpenTopic(null)
  }

  const addTopic = () => {
    const id = `topic-${crypto.randomUUID()}`
    const t: HighCouncilTopic = {
      id,
      title: "New topic",
      summary: "",
      handbookFocus: [""],
      practices: [""],
    }
    setPayload((p) => ({ ...p, topics: [...p.topics, t] }))
    setOpenTopic(id)
  }

  const updateResource = (id: string, patch: Partial<OfficialResourceRow>) => {
    setPayload((p) => ({
      ...p,
      officialResources: p.officialResources.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  const addResource = () => {
    const id = `or-${crypto.randomUUID()}`
    setPayload((p) => ({
      ...p,
      officialResources: [
        ...p.officialResources,
        { id, label: "", href: "https://", description: "" },
      ],
    }))
  }

  const removeResource = (id: string) => {
    setPayload((p) => ({ ...p, officialResources: p.officialResources.filter((r) => r.id !== id) }))
  }

  const updateChecklist = (id: string, label: string) => {
    setPayload((p) => ({
      ...p,
      checklist: p.checklist.map((c) => (c.id === id ? { ...c, label } : c)),
    }))
  }

  const addChecklist = () => {
    const id = `c-${crypto.randomUUID()}`
    setPayload((p) => ({ ...p, checklist: [...p.checklist, { id, label: "" }] }))
  }

  const removeChecklist = (id: string) => {
    setPayload((p) => {
      if (p.checklist.length <= 1) return p
      return { ...p, checklist: p.checklist.filter((c) => c.id !== id) }
    })
  }

  const updateSlidePresentation = (patch: Partial<HighCouncilSlidePresentation>) => {
    setPayload((p) => ({
      ...p,
      slidePresentation: { ...p.slidePresentation, ...patch },
    }))
  }

  const updateDeckSlide = (id: string, patch: Partial<HighCouncilSlide>) => {
    setPayload((p) => ({
      ...p,
      slidePresentation: {
        ...p.slidePresentation,
        slides: p.slidePresentation.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      },
    }))
  }

  const addDeckSlide = () => {
    const id = `slide-${crypto.randomUUID()}`
    const slide: HighCouncilSlide = { id, title: "New slide", body: "" }
    setPayload((p) => ({
      ...p,
      slidePresentation: {
        ...p.slidePresentation,
        slides: [...p.slidePresentation.slides, slide],
      },
    }))
  }

  const removeDeckSlide = (id: string) => {
    setPayload((p) => {
      if (p.slidePresentation.slides.length <= 1) return p
      return {
        ...p,
        slidePresentation: {
          ...p.slidePresentation,
          slides: p.slidePresentation.slides.filter((s) => s.id !== id),
        },
      }
    })
  }

  const moveDeckSlide = (index: number, delta: number) => {
    setPayload((p) => {
      const slides = [...p.slidePresentation.slides]
      const j = index + delta
      if (j < 0 || j >= slides.length) return p
      ;[slides[index], slides[j]] = [slides[j], slides[index]]
      return { ...p, slidePresentation: { ...p.slidePresentation, slides } }
    })
  }

  const toggleCheck = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    persistChecklist(next)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-16 text-gray-500">Loading training content…</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href="/modules/training"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Training
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2">
            <GraduationCap className="h-8 w-8 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">High Council Training</h1>
            {editMode ? (
              <textarea
                className={`${inputClass} mt-2 min-h-[5rem]`}
                value={payload.intro}
                onChange={(e) => setPayload((p) => ({ ...p, intro: e.target.value }))}
              />
            ) : (
              <p className="text-gray-600 mt-2 whitespace-pre-wrap">{payload.intro}</p>
            )}
          </div>
        </div>

        {canEdit && stakeId && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {!editMode ? (
              <Button type="button" onClick={beginEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit content
              </Button>
            ) : (
              <>
                <Button type="button" onClick={savePayload} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={resetToDefaults}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to defaults
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {dbNote && (
        <div
          className={
            dbNoticeTone === "warning"
              ? "mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              : "mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950"
          }
        >
          {dbNote}
        </div>
      )}

      {canEdit && !stakeId && (
        <p className="mb-4 text-sm text-gray-600">
          Editing is available to stake leaders when your account has a stake. You can still read defaults below.
        </p>
      )}

      <Card className="border-amber-200 bg-amber-50/80 mb-6">
        <CardContent className="pt-4 pb-4 flex gap-3 text-sm text-amber-950">
          <Shield className="h-5 w-5 shrink-0 text-amber-800 mt-0.5" />
          {editMode ? (
            <textarea
              className={`${inputClass} flex-1 min-h-[4.5rem] bg-white/90`}
              value={payload.disclaimer}
              onChange={(e) => setPayload((p) => ({ ...p, disclaimer: e.target.value }))}
            />
          ) : (
            <p className="whitespace-pre-wrap">{payload.disclaimer}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 overflow-hidden border-indigo-200 shadow-sm">
        <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/90 to-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-indigo-600 p-2 text-white shadow-sm">
                <LayoutList className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                {editMode ? (
                  <input
                    className={`${inputClass} font-semibold text-lg`}
                    value={payload.slidePresentation.title}
                    onChange={(e) => updateSlidePresentation({ title: e.target.value })}
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl text-gray-900">{payload.slidePresentation.title}</CardTitle>
                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                      <ListOrdered className="h-3.5 w-3.5" />
                      {payload.slidePresentation.slides.length} modules
                    </span>
                  </div>
                )}
                <CardDescription className="mt-1.5">
                  {editMode
                    ? "In-app modules (not an external file). One line in the body = one bullet when viewing."
                    : "Structured onboarding: read top to bottom, or jump ahead with Quick navigation. Your presidency can edit every module."}
                </CardDescription>
              </div>
            </div>
            {editMode && (
              <Button type="button" size="sm" variant="outline" onClick={addDeckSlide} className="shrink-0">
                <Plus className="h-4 w-4 mr-1" />
                Add slide
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {!editMode && (
            <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-slate-50 to-indigo-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-white p-2 shadow-sm ring-1 ring-gray-200">
                  <Compass className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Your learning path</p>
                  <p className="text-xs text-gray-600 mt-0.5 max-w-xl">
                    Expect about 35–50 minutes to read every module once. New councilors: complete modules 1–8 before
                    your first release or calling assignment if possible.
                  </p>
                </div>
              </div>
            </div>
          )}

          {editMode ? (
            <textarea
              className={`${inputClass} min-h-[3.5rem]`}
              value={payload.slidePresentation.intro}
              onChange={(e) => updateSlidePresentation({ intro: e.target.value })}
              placeholder="Intro for this deck…"
            />
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap border-l-2 border-indigo-200 pl-4">
              {payload.slidePresentation.intro}
            </p>
          )}

          {!editMode && payload.slidePresentation.slides.length > 1 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Quick navigation</p>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {payload.slidePresentation.slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollToSlide(s.id)}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-left text-xs font-medium text-gray-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <span className="shrink-0 text-indigo-600 tabular-nums">{i + 1}</span>
                    <span className="truncate">{s.title.length > 42 ? `${s.title.slice(0, 40)}…` : s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {payload.slidePresentation.slides.map((slide, idx) => (
              <div
                key={slide.id}
                id={`hc-slide-${slide.id}`}
                className="flex scroll-mt-24 gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-900/5"
              >
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow">
                    {idx + 1}
                  </div>
                  {editMode && (
                    <div className="flex flex-col gap-0.5 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={idx === 0}
                        onClick={() => moveDeckSlide(idx, -1)}
                        aria-label="Move slide up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={idx === payload.slidePresentation.slides.length - 1}
                        onClick={() => moveDeckSlide(idx, 1)}
                        aria-label="Move slide down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  {editMode ? (
                    <>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <input
                          className={`${inputClass} font-medium sm:flex-1`}
                          value={slide.title}
                          onChange={(e) => updateDeckSlide(slide.id, { title: e.target.value })}
                          placeholder="Slide title"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={payload.slidePresentation.slides.length <= 1}
                          onClick={() => removeDeckSlide(slide.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Body — one bullet per line</label>
                        <textarea
                          className={`${inputClass} mt-1 min-h-[7rem] font-mono text-xs`}
                          value={slide.body}
                          onChange={(e) => updateDeckSlide(slide.id, { body: e.target.value })}
                          placeholder="Each line becomes a bullet in view mode."
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold tracking-tight text-gray-900">{slide.title}</h3>
                      <SlideBodyReadView body={slide.body} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-indigo-600" />
                  Training topics
                </CardTitle>
                <CardDescription>
                  {editMode ? "Edit titles, summaries, and bullet lists (one line per bullet)." : "Expand each topic."}
                </CardDescription>
              </div>
              {editMode && (
                <Button type="button" size="sm" variant="outline" onClick={addTopic}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add topic
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {payload.topics.map((topic) => {
                const open = openTopic === topic.id
                return (
                  <div key={topic.id} className="rounded-lg border border-gray-200 overflow-hidden">
                    {editMode ? (
                      <div className="p-4 space-y-3 bg-gray-50/80">
                        <div className="flex justify-between gap-2">
                          <input
                            className={inputClass}
                            value={topic.title}
                            onChange={(e) => updateTopic(topic.id, { title: e.target.value })}
                          />
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeTopic(topic.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                        <textarea
                          className={`${inputClass} min-h-[5rem]`}
                          placeholder="Summary"
                          value={topic.summary}
                          onChange={(e) => updateTopic(topic.id, { summary: e.target.value })}
                        />
                        <div>
                          <label className="text-xs font-medium text-gray-600">Handbook themes (one per line)</label>
                          <textarea
                            className={`${inputClass} mt-1 min-h-[4rem] font-mono text-xs`}
                            value={arrayToLines(topic.handbookFocus)}
                            onChange={(e) =>
                              updateTopic(topic.id, { handbookFocus: linesToArray(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Practices (one per line)</label>
                          <textarea
                            className={`${inputClass} mt-1 min-h-[4rem] font-mono text-xs`}
                            value={arrayToLines(topic.practices)}
                            onChange={(e) => updateTopic(topic.id, { practices: linesToArray(e.target.value) })}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenTopic(open ? null : topic.id)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-white hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-900">{topic.title}</span>
                          <span className="text-xs text-gray-500 shrink-0">{open ? "Hide" : "Show"}</span>
                        </button>
                        {open && (
                          <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50/50 space-y-4 text-sm text-gray-700">
                            <p className="whitespace-pre-wrap">{topic.summary}</p>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Handbook themes to study</p>
                              <ul className="list-disc pl-5 space-y-1">
                                {topic.handbookFocus.filter(Boolean).map((line, i) => (
                                  <li key={i}>{line}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">On-the-ground practices</p>
                              <ul className="list-disc pl-5 space-y-1">
                                {topic.practices.filter(Boolean).map((line, i) => (
                                  <li key={i}>{line}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-600" />
                  First 90 days — personal checklist
                </CardTitle>
                <CardDescription>Checklist progress is saved on this device only (not synced to the server).</CardDescription>
              </div>
              {editMode && (
                <Button type="button" size="sm" variant="outline" onClick={addChecklist}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add item
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {editMode
                ? payload.checklist.map((item) => (
                    <div key={item.id} className="flex gap-2 items-start">
                      <input
                        className={inputClass}
                        value={item.label}
                        onChange={(e) => updateChecklist(item.id, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={payload.checklist.length <= 1}
                        onClick={() => removeChecklist(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))
                : payload.checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 cursor-pointer rounded-md border border-gray-100 p-3 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(item.id)}
                        onChange={() => toggleCheck(item.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-800">{item.label}</span>
                    </label>
                  ))}
              {!editMode && (
                <Button type="button" variant="outline" size="sm" onClick={() => persistChecklist(new Set())}>
                  Clear checklist
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Official Church resources</CardTitle>
                <CardDescription>Open in a new tab</CardDescription>
              </div>
              {editMode && (
                <Button type="button" size="sm" variant="outline" onClick={addResource}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add link
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {editMode
                ? payload.officialResources.map((r) => (
                    <div key={r.id} className="rounded-md border border-gray-200 p-3 space-y-2 bg-gray-50/50">
                      <div className="flex justify-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeResource(r.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                      <input
                        className={inputClass}
                        placeholder="Label"
                        value={r.label}
                        onChange={(e) => updateResource(r.id, { label: e.target.value })}
                      />
                      <input
                        className={inputClass}
                        placeholder="https://…"
                        value={r.href}
                        onChange={(e) => updateResource(r.id, { href: e.target.value })}
                      />
                      <textarea
                        className={`${inputClass} min-h-[3rem]`}
                        placeholder="Short description"
                        value={r.description}
                        onChange={(e) => updateResource(r.id, { description: e.target.value })}
                      />
                    </div>
                  ))
                : payload.officialResources.map((r) => (
                    <a
                      key={r.id}
                      href={r.href || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${buttonVariants({ variant: "outline" })} h-auto min-h-0 w-full flex-col items-start gap-1 py-3 px-3 whitespace-normal text-left font-normal`}
                    >
                      <span className="flex items-center gap-2 font-medium text-gray-900">
                        {r.label || "Link"}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      </span>
                      <span className="text-xs text-gray-600 font-normal">{r.description}</span>
                    </a>
                  ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Suggested study rhythm
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-3">
              {editMode ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Weekly</label>
                    <textarea
                      className={`${inputClass} mt-1 min-h-[3rem]`}
                      value={payload.studyRhythm.weekly}
                      onChange={(e) =>
                        setPayload((p) => ({ ...p, studyRhythm: { ...p.studyRhythm, weekly: e.target.value } }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Monthly</label>
                    <textarea
                      className={`${inputClass} mt-1 min-h-[3rem]`}
                      value={payload.studyRhythm.monthly}
                      onChange={(e) =>
                        setPayload((p) => ({ ...p, studyRhythm: { ...p.studyRhythm, monthly: e.target.value } }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Quarterly</label>
                    <textarea
                      className={`${inputClass} mt-1 min-h-[3rem]`}
                      value={payload.studyRhythm.quarterly}
                      onChange={(e) =>
                        setPayload((p) => ({ ...p, studyRhythm: { ...p.studyRhythm, quarterly: e.target.value } }))
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong className="text-gray-800">Weekly:</strong> {payload.studyRhythm.weekly}
                  </p>
                  <p>
                    <strong className="text-gray-800">Monthly:</strong> {payload.studyRhythm.monthly}
                  </p>
                  <p>
                    <strong className="text-gray-800">Quarterly:</strong> {payload.studyRhythm.quarterly}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
