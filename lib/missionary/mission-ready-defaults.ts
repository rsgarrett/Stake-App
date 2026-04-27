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
