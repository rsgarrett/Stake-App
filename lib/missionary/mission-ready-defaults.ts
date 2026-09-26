import type { SupabaseClient } from "@supabase/supabase-js"

/** 20-step checklist rows inserted into `mission_ready_progress` for each new missionary. */
export const DEFAULT_MISSION_READY_TASKS = [
  { task_number: 1, task_name: "Read The Book of Mormon", additional_resource: "For the Strength of Youth Guide" },
  { task_number: 2, task_name: "D&C 121", additional_resource: null },
  { task_number: 3, task_name: "Missionary Growth Path", additional_resource: "Emotional Resilience Manual" },
  { task_number: 4, task_name: "Melchizedek Priesthood", additional_resource: "Missionary Preparation" },
  { task_number: 5, task_name: "Endowment", additional_resource: "Supplemental Information" },
  { task_number: 6, task_name: "Submit name to work in the temple", additional_resource: null },
  { task_number: 7, task_name: "Fulfill Your Missionary Purpose (PMG chp. 1)", additional_resource: "The District Video Series" },
  { task_number: 8, task_name: "Adjusting to Missionary Life", additional_resource: "Serve and Prepare Videos" },
  { task_number: 9, task_name: "Missionary Standards for Disciples of Jesus Christ", additional_resource: "Mission Ready Talks" },
  { task_number: 10, task_name: "The Fourth Missionary", additional_resource: null },
  { task_number: 11, task_name: "Growth Mindset", additional_resource: null },
  { task_number: 12, task_name: "Using Technology Wisely and Righteously", additional_resource: null },
  { task_number: 13, task_name: "Study & Teach the Gospel (PMG chp. 3)", additional_resource: null },
  { task_number: 14, task_name: "Teach to Build Faith (PMG chp. 10)", additional_resource: null },
  { task_number: 15, task_name: "Help People Make & Keep Commitments (PMG chp. 11)", additional_resource: null },
  { task_number: 16, task_name: "Accomplish the Work through Goals and Plans (PMG chp. 8)", additional_resource: null },
  { task_number: 17, task_name: "Papers Submitted", additional_resource: null },
  { task_number: 18, task_name: "Call Received", additional_resource: null },
  { task_number: 19, task_name: "Setting Apart Scheduled", additional_resource: null },
  { task_number: 20, task_name: "Seek Christlike Attributes (PMG chp. 6)", additional_resource: null },
] as const

/** Stored as task_number 101–110 so they never mix with the 20 preparation steps. */
export const RM_CHECKLIST_TASK_OFFSET = 100

export const DEFAULT_RM_CHECKLIST_TASKS = [
  { task_number: 1, task_name: 'Review "My Plan" with them' },
  { task_number: 2, task_name: "Ward council report" },
  { task_number: 3, task_name: "Teach a discussion to family" },
  { task_number: 4, task_name: "Submit name to work in the temple" },
  { task_number: 5, task_name: "Enrolled in Institute (gathering place)" },
  { task_number: 6, task_name: "Education discussion ($500 BYU scholarship for RMs)" },
  { task_number: 7, task_name: 'One month follow-up review of "My Plan"' },
  { task_number: 8, task_name: "Be careful playing ward carousel" },
  { task_number: 9, task_name: "Request ministering families" },
  { task_number: 10, task_name: "Change your environment as a symbol you are now a different person from before you left" },
] as const

export function isPrepProgress(row: { task_number: number }) {
  return row.task_number < RM_CHECKLIST_TASK_OFFSET
}

export function isRmProgress(row: { task_number: number }) {
  return row.task_number >= RM_CHECKLIST_TASK_OFFSET
}

export function rmDisplayNumber(taskNumber: number) {
  return taskNumber - RM_CHECKLIST_TASK_OFFSET
}

export function checklistProgress(
  rows: { missionary_id: string; task_number: number; completed: boolean }[],
  missionaryId: string,
  kind: "prep" | "rm"
) {
  const items = rows.filter(
    (p) => p.missionary_id === missionaryId && (kind === "rm" ? isRmProgress(p) : isPrepProgress(p))
  )
  const total = kind === "rm" ? DEFAULT_RM_CHECKLIST_TASKS.length : DEFAULT_MISSION_READY_TASKS.length
  const completed = items.filter((p) => p.completed).length
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  }
}

export function rmChecklistInsertRows(missionaryId: string) {
  return DEFAULT_RM_CHECKLIST_TASKS.map((task) => ({
    missionary_id: missionaryId,
    task_number: RM_CHECKLIST_TASK_OFFSET + task.task_number,
    task_name: task.task_name,
    additional_resource: null as string | null,
    completed: false,
    display_order: RM_CHECKLIST_TASK_OFFSET + task.task_number,
  }))
}

/** Insert missing RM checklist rows. Safe to call repeatedly. Returns true if rows were added. */
export async function ensureRmChecklist(
  supabase: SupabaseClient,
  missionaryId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("mission_ready_progress")
    .select("task_number")
    .eq("missionary_id", missionaryId)
  if (error) throw error

  const existing = new Set((data || []).map((r) => r.task_number))
  const missing = rmChecklistInsertRows(missionaryId).filter((row) => !existing.has(row.task_number))
  if (missing.length === 0) return false

  const { error: insertError } = await supabase.from("mission_ready_progress").insert(missing)
  if (insertError) throw insertError
  return true
}

/**
 * Find a mission-ready row for this stake by case-insensitive name match, or create one
 * with the default 20 progress rows. Safe to call repeatedly.
 */
export async function ensureMissionReadyMissionary(
  supabase: SupabaseClient,
  params: { missionaryName: string; stakeId: string }
): Promise<{ id: string; created: boolean }> {
  const name = params.missionaryName.trim().replace(/\s+/g, " ")
  if (!name) {
    throw new Error("Missionary name is required")
  }

  const { data: rows, error: listError } = await supabase
    .from("mission_ready_missionaries")
    .select("id, missionary_name")
    .eq("stake_id", params.stakeId)

  if (listError) throw listError

  const target = name.toLowerCase()
  const existing = rows?.find((r) => r.missionary_name.trim().replace(/\s+/g, " ").toLowerCase() === target)
  if (existing) {
    return { id: existing.id, created: false }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("mission_ready_missionaries")
    .insert({ missionary_name: name, stake_id: params.stakeId, status: "preparing" })
    .select("id")
    .single()

  if (insertError || !inserted) throw insertError || new Error("Could not add missionary to Mission Ready tracker")

  const progressItems = DEFAULT_MISSION_READY_TASKS.map((task) => ({
    missionary_id: inserted.id,
    task_number: task.task_number,
    task_name: task.task_name,
    additional_resource: task.additional_resource,
    completed: false,
    display_order: task.task_number,
  }))

  const { error: progressError } = await supabase.from("mission_ready_progress").insert(progressItems)
  if (progressError) throw progressError

  return { id: inserted.id, created: true }
}
