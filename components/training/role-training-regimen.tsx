"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  PlayCircle,
  Sparkles,
  Trophy,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import type { RoleCurriculum, TrainingLesson, TrainingPhase } from "@/lib/training/regimen-types"
import { curriculumProgress, lessonsByPhase } from "@/lib/training/regimen-types"
import { useRoleTrainingProgress } from "@/lib/training/use-role-training-progress"
import { ChurchWebLink } from "@/components/church-web-link"

const THEME: Record<
  RoleCurriculum["key"],
  { accent: string; badge: string; bar: string; soft: string }
> = {
  stake_presidency: {
    accent: "text-violet-700",
    badge: "bg-violet-50 text-violet-800 border-violet-200",
    bar: "bg-violet-600",
    soft: "bg-violet-50/80 border-violet-100",
  },
  high_council: {
    accent: "text-indigo-700",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
    bar: "bg-indigo-600",
    soft: "bg-indigo-50/80 border-indigo-100",
  },
  bishopric: {
    accent: "text-teal-700",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
    bar: "bg-teal-600",
    soft: "bg-teal-50/80 border-teal-100",
  },
}

function LessonCard({
  lesson,
  done,
  themeBar,
  themeSoft,
  onToggle,
  busy,
}: {
  lesson: TrainingLesson
  done: boolean
  themeBar: string
  themeSoft: string
  onToggle: (reflection?: string) => void
  busy: boolean
}) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")

  return (
    <div className={`rounded-lg border bg-white overflow-hidden ${done ? "border-emerald-200" : "border-gray-200"}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50/80"
      >
        <span className="mt-0.5 shrink-0">
          {done ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <Circle className="h-5 w-5 text-gray-300" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900">{lesson.title}</span>
            {lesson.required ? (
              <span className="text-[10px] uppercase tracking-wide font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                Required
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                Optional
              </span>
            )}
          </span>
          <span className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lesson.estimatedMinutes} min
            </span>
            <span className="truncate">{lesson.objective}</span>
          </span>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed mt-3">{lesson.summary}</p>

          {lesson.handbook.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> Handbook
              </h4>
              <ul className="space-y-1">
                {lesson.handbook.map((r) => (
                  <li key={r.href + r.label}>
                    <ChurchWebLink
                      href={r.href}
                      className="inline-flex items-center gap-1 text-sm text-indigo-700 hover:underline"
                    >
                      {r.label} <ExternalLink className="h-3 w-3" />
                    </ChurchWebLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lesson.videos.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 flex items-center gap-1">
                <PlayCircle className="h-3.5 w-3.5" /> Video & official training
              </h4>
              <ul className="space-y-2">
                {lesson.videos.map((r) => (
                  <li key={r.href + r.label} className="text-sm">
                    <ChurchWebLink
                      href={r.href}
                      className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:underline"
                    >
                      {r.label} <ExternalLink className="h-3 w-3" />
                    </ChurchWebLink>
                    {r.description ? (
                      <p className="text-xs text-gray-500 mt-0.5 ml-0.5">{r.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={`rounded-md border p-3 ${themeSoft}`}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Practice (decision rehearsal)
            </h4>
            <p className="text-sm text-gray-800">{lesson.practice}</p>
          </div>

          {lesson.reflectionPrompt && !done && (
            <div>
              <label className="text-xs font-medium text-gray-600">
                Optional reflection (saved with completion)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={lesson.reflectionPrompt}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => onToggle(note)}
              className={done ? "bg-gray-700 hover:bg-gray-800" : themeBar}
            >
              {done ? "Mark incomplete" : "Mark complete"}
            </Button>
            {!done && (
              <span className="text-xs text-gray-500 self-center">
                Completing records progress for your stake login.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function RoleTrainingRegimen({ curriculum }: { curriculum: RoleCurriculum }) {
  const theme = THEME[curriculum.key]
  const progressApi = useRoleTrainingProgress(curriculum.key)
  const grouped = useMemo(() => lessonsByPhase(curriculum), [curriculum])
  const stats = useMemo(
    () => curriculumProgress(curriculum, progressApi.completedIds),
    [curriculum, progressApi.completedIds]
  )
  const [phaseFilter, setPhaseFilter] = useState<TrainingPhase | "all">("all")

  const visible = grouped.filter((g) => phaseFilter === "all" || g.phase === phaseFilter)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/modules/training"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Training hub
          </Link>
          <h1 className={`text-2xl sm:text-3xl font-bold ${theme.accent}`}>{curriculum.title}</h1>
          <p className="mt-1 text-gray-600">{curriculum.audience}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${theme.badge}`}>
          <Trophy className="h-3.5 w-3.5" />
          {stats.requiredComplete ? "Required path complete" : `${stats.requiredDone}/${stats.required} required`}
        </span>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your progress</CardTitle>
          <CardDescription>
            {progressApi.signedIn
              ? "Saved to your account — visible to you (and stake leaders with elevated access)."
              : "Sign in to save completion."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full ${theme.bar} transition-all`}
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>
              <strong className="text-gray-900">{stats.totalDone}</strong> / {stats.total} lessons
            </span>
            <span>
              Required: <strong className="text-gray-900">{stats.requiredDone}</strong> / {stats.required}
            </span>
            <span>
              Optional: <strong className="text-gray-900">{stats.optionalDone}</strong> / {stats.optional}
            </span>
          </div>
          {progressApi.tableMissing && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
              Run migration <code className="text-xs">079_role_training_progress.sql</code> in Supabase to
              enable completion tracking, then refresh.
            </p>
          )}
          {progressApi.error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {progressApi.error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className={theme.soft}>
        <CardHeader>
          <CardTitle className="text-base">How this regimen works</CardTitle>
          <CardDescription>{curriculum.intro}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <ul className="list-disc pl-5 space-y-1">
            {curriculum.designNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-md bg-white/80 border border-white px-3 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">First 14 days</p>
              <p className="mt-1 text-sm">{curriculum.cadence.first14Days}</p>
            </div>
            <div className="rounded-md bg-white/80 border border-white px-3 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">First 90 days</p>
              <p className="mt-1 text-sm">{curriculum.cadence.first90Days}</p>
            </div>
            <div className="rounded-md bg-white/80 border border-white px-3 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Ongoing</p>
              <p className="mt-1 text-sm">{curriculum.cadence.ongoing}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 border-t border-white/60 pt-3">{curriculum.disclaimer}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPhaseFilter("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
            phaseFilter === "all" ? `${theme.badge}` : "bg-white text-gray-600 border-gray-200"
          }`}
        >
          All phases
        </button>
        {grouped.map(({ phase, meta }) => (
          <button
            key={phase}
            type="button"
            onClick={() => setPhaseFilter(phase)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
              phaseFilter === phase ? `${theme.badge}` : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {meta.order}. {meta.label}
          </button>
        ))}
      </div>

      {progressApi.loading ? (
        <p className="text-center text-gray-500 py-8">Loading your progress…</p>
      ) : (
        visible.map(({ phase, meta, lessons }) => (
          <section key={phase} className="space-y-3">
            <div>
              <h2 className={`text-lg font-semibold ${theme.accent}`}>
                Phase {meta.order}: {meta.label}
              </h2>
              <p className="text-sm text-gray-600">{meta.blurb}</p>
            </div>
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  done={progressApi.completedIds.has(lesson.id)}
                  themeBar={theme.bar}
                  themeSoft={theme.soft}
                  busy={progressApi.loading}
                  onToggle={(reflection) => void progressApi.toggleLesson(lesson.id, reflection)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Official Church resources</CardTitle>
          <CardDescription>Always verify current policy on ChurchofJesusChrist.org</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-2">
          {curriculum.officialResources.map((r) => (
            <ChurchWebLink
              key={r.href + r.label}
              href={r.href}
              className={`${buttonVariants({ variant: "outline" })} h-auto min-h-0 justify-start whitespace-normal text-left py-3 px-3`}
            >
              <span>
                <span className="font-medium text-gray-900 inline-flex items-center gap-1">
                  {r.label} <ExternalLink className="h-3 w-3 opacity-70" />
                </span>
                {r.description ? (
                  <span className="block text-xs text-gray-500 font-normal mt-0.5">{r.description}</span>
                ) : null}
              </span>
            </ChurchWebLink>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
