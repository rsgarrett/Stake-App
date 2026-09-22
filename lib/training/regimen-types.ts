/**
 * Role training regimen model.
 *
 * Design draws on historically effective patterns:
 * - Microlearning (one objective per lesson)
 * - Spaced phases (foundation → core → application → mastery)
 * - Decision / practice prompts (active retrieval > passive reading)
 * - Completion tracking for accountability (not a substitute for Spirit-led mentoring)
 *
 * Content is anchored to the current General Handbook and public
 * churchofjesuschrist.org resources. Not a substitute for the Handbook,
 * area direction, or personal counsel from priesthood leaders.
 */

export type CurriculumKey = "stake_presidency" | "high_council" | "bishopric"

export type TrainingPhase = "foundation" | "core" | "application" | "mastery"

export type ResourceLink = {
  label: string
  href: string
  description?: string
}

export type TrainingLesson = {
  id: string
  phase: TrainingPhase
  title: string
  /** Typical completion time for busy leaders */
  estimatedMinutes: number
  /** Single learning objective */
  objective: string
  summary: string
  handbook: ResourceLink[]
  videos: ResourceLink[]
  /** Decision / application rehearsal */
  practice: string
  /** Optional reflection prompt saved with completion */
  reflectionPrompt?: string
  required: boolean
}

export type RoleCurriculum = {
  key: CurriculumKey
  title: string
  shortTitle: string
  audience: string
  intro: string
  disclaimer: string
  /** Shown once — why this regimen is structured this way */
  designNotes: string[]
  lessons: TrainingLesson[]
  officialResources: ResourceLink[]
  /** Suggested spacing for reinforcement */
  cadence: {
    first14Days: string
    first90Days: string
    ongoing: string
  }
}

export const PHASE_META: Record<
  TrainingPhase,
  { label: string; order: number; blurb: string }
> = {
  foundation: {
    label: "Foundation",
    order: 1,
    blurb: "Identity, keys, covenants, and how to learn from the Handbook.",
  },
  core: {
    label: "Core duties",
    order: 2,
    blurb: "The recurring work of your calling — councils, people, and priorities.",
  },
  application: {
    label: "Application",
    order: 3,
    blurb: "Rehearse high-stakes moments before they arrive.",
  },
  mastery: {
    label: "Ongoing mastery",
    order: 4,
    blurb: "Quarterly habits that keep skill and Spirit sharp.",
  },
}

export function lessonsByPhase(curriculum: RoleCurriculum) {
  const phases: TrainingPhase[] = ["foundation", "core", "application", "mastery"]
  return phases.map((phase) => ({
    phase,
    meta: PHASE_META[phase],
    lessons: curriculum.lessons.filter((l) => l.phase === phase),
  }))
}

export function curriculumProgress(
  curriculum: RoleCurriculum,
  completedIds: Set<string>
) {
  const required = curriculum.lessons.filter((l) => l.required)
  const optional = curriculum.lessons.filter((l) => !l.required)
  const requiredDone = required.filter((l) => completedIds.has(l.id)).length
  const optionalDone = optional.filter((l) => completedIds.has(l.id)).length
  const totalDone = curriculum.lessons.filter((l) => completedIds.has(l.id)).length
  const requiredComplete = required.length > 0 && requiredDone === required.length
  return {
    total: curriculum.lessons.length,
    totalDone,
    required: required.length,
    requiredDone,
    optional: optional.length,
    optionalDone,
    requiredComplete,
    percent: curriculum.lessons.length
      ? Math.round((totalDone / curriculum.lessons.length) * 100)
      : 0,
  }
}
