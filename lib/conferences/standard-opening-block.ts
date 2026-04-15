import type { SupabaseClient } from "@supabase/supabase-js"
import type { ConferenceProgramItem, ConferenceSessionType, ProgramItemType } from "@/types"

/** Fixed prelude → invocation block for leadership, adult, and general sessions. */
export const STANDARD_OPENING_ITEM_TYPES: readonly ProgramItemType[] = [
  "prelude_music",
  "presiding",
  "conducting",
  "pianist",
  "organist",
  "music_leader",
  "opening_hymn",
  "invocation",
] as const

export const STANDARD_OPENING_TYPE_SET = new Set<ProgramItemType>(STANDARD_OPENING_ITEM_TYPES)

/** Closing pair for L/A/G sessions (after middle content). */
export const STANDARD_CLOSING_ITEM_TYPES: readonly ProgramItemType[] = ["closing_hymn", "benediction"] as const

export const STANDARD_CLOSING_TYPE_SET = new Set<ProgramItemType>(STANDARD_CLOSING_ITEM_TYPES)

/** Opening + closing rows that are auto-managed and fixed-type on the sheet. */
export const STANDARD_LAG_FIXED_TYPE_SET = new Set<ProgramItemType>([
  ...STANDARD_OPENING_ITEM_TYPES,
  ...STANDARD_CLOSING_ITEM_TYPES,
])

const LAG: ConferenceSessionType[] = ["leadership_session", "adult_session", "general_session"]

export function sessionUsesStandardOpeningBlock(sessionType: string): boolean {
  return LAG.includes(sessionType as ConferenceSessionType)
}

export function isStandardOpeningItemType(itemType: ProgramItemType): boolean {
  return STANDARD_OPENING_TYPE_SET.has(itemType)
}

export function isStandardClosingItemType(itemType: ProgramItemType): boolean {
  return STANDARD_CLOSING_TYPE_SET.has(itemType)
}

/** Opening or closing standard rows for leadership / adult / general. */
export function isStandardLagFixedProgramItemType(itemType: ProgramItemType): boolean {
  return STANDARD_LAG_FIXED_TYPE_SET.has(itemType)
}

export function openingBlockDurationMinutes(itemType: ProgramItemType): number {
  return itemType === "opening_hymn" ? 5 : 0
}

/** Rows to insert for positions 1–8 (display_order 1-based). */
export function standardOpeningBlockTemplateRows(): Array<{
  item_type: ProgramItemType
  duration_minutes: number
  display_order: number
}> {
  return STANDARD_OPENING_ITEM_TYPES.map((item_type, i) => ({
    item_type,
    duration_minutes: openingBlockDurationMinutes(item_type),
    display_order: i + 1,
  }))
}

export function sortProgramItemsByOrder(items: ConferenceProgramItem[]): ConferenceProgramItem[] {
  return [...items].sort((a, b) => a.display_order - b.display_order)
}

/** True when the first eight program rows match the standard opening sequence in order. */
export function hasStandardOpeningPrefix(items: ConferenceProgramItem[]): boolean {
  const sorted = sortProgramItemsByOrder(items)
  if (sorted.length < STANDARD_OPENING_ITEM_TYPES.length) return false
  return STANDARD_OPENING_ITEM_TYPES.every((t, i) => sorted[i].item_type === t)
}

export function anyStandardOpeningTypeInProgram(items: ConferenceProgramItem[]): boolean {
  return items.some((i) => STANDARD_OPENING_TYPE_SET.has(i.item_type))
}

/**
 * When the same standard opening block was inserted twice at the start (e.g. parallel load),
 * returns row ids to delete: all full duplicate blocks after the first.
 */
export function idsOfRedundantStandardOpeningBlocks(items: ConferenceProgramItem[]): string[] {
  const sorted = sortProgramItemsByOrder(items)
  const n = STANDARD_OPENING_ITEM_TYPES.length
  let start = 0
  while (start + n <= sorted.length) {
    const ok = STANDARD_OPENING_ITEM_TYPES.every((t, i) => sorted[start + i]?.item_type === t)
    if (!ok) break
    start += n
  }
  const blockCount = start / n
  if (blockCount <= 1) return []
  return sorted.slice(n, start).map((r) => r.id)
}

/** Last two rows (by display_order) are closing hymn then benediction. */
export function hasStandardClosingSuffix(items: ConferenceProgramItem[]): boolean {
  const sorted = sortProgramItemsByOrder(items)
  if (sorted.length < STANDARD_CLOSING_ITEM_TYPES.length) return false
  const n = sorted.length
  return (
    sorted[n - 2]?.item_type === "closing_hymn" && sorted[n - 1]?.item_type === "benediction"
  )
}

/**
 * Trailing duplicate closing_hymn,benediction pairs (e.g. … ch, ben, ch, ben) — ids to delete (earlier pairs only).
 */
export function idsOfRedundantClosingHymnBenedictionPairs(items: ConferenceProgramItem[]): string[] {
  const sorted = sortProgramItemsByOrder(items)
  const ids: string[] = []
  let i = sorted.length - 1
  while (i >= 3) {
    if (
      sorted[i - 1]?.item_type === "closing_hymn" &&
      sorted[i]?.item_type === "benediction" &&
      sorted[i - 3]?.item_type === "closing_hymn" &&
      sorted[i - 2]?.item_type === "benediction"
    ) {
      ids.push(sorted[i - 3].id, sorted[i - 2].id)
      i -= 2
    } else {
      break
    }
  }
  return ids
}

/** When partial_opening, use normalize (replace opening rows) instead of prepend. */
export const PARTIAL_OPENING_BLOCK = "partial_opening" as const

let openingMaintenanceQueue: Promise<void> = Promise.resolve()

/**
 * Append closing hymn + benediction at end when missing (middle content stays between opening and closing).
 */
export async function appendStandardClosingBlockForSession(
  supabase: SupabaseClient,
  session: { id: string; session_type: string; program_items?: ConferenceProgramItem[] }
): Promise<{ inserted: boolean; error?: string }> {
  if (!sessionUsesStandardOpeningBlock(session.session_type)) return { inserted: false }
  const items = session.program_items || []
  if (!hasStandardOpeningPrefix(items)) return { inserted: false }
  const sorted = sortProgramItemsByOrder(items)
  if (hasStandardClosingSuffix(items)) return { inserted: false }

  const maxOrder = sorted.length > 0 ? Math.max(...sorted.map((r) => r.display_order)) : 0
  const last = sorted[sorted.length - 1]

  if (last?.item_type === "closing_hymn") {
    const { error } = await supabase.from("conference_program_items").insert({
      session_id: session.id,
      item_type: "benediction",
      duration_minutes: 0,
      display_order: maxOrder + 1,
      invite_status: "not_invited",
    })
    if (error) return { inserted: false, error: error.message || "Could not append benediction." }
    return { inserted: true }
  }

  const rows = [
    {
      session_id: session.id,
      item_type: "closing_hymn" as const,
      duration_minutes: 5,
      display_order: maxOrder + 1,
      invite_status: "not_invited" as const,
    },
    {
      session_id: session.id,
      item_type: "benediction" as const,
      duration_minutes: 0,
      display_order: maxOrder + 2,
      invite_status: "not_invited" as const,
    },
  ]
  const { error: iErr } = await supabase.from("conference_program_items").insert(rows)
  if (iErr) return { inserted: false, error: iErr.message || "Could not append closing block." }
  return { inserted: true }
}

/**
 * Serialized: dedupe duplicate opening/closing blocks, prepend opening, append closing; refetch session items in memory.
 */
export async function runStandardOpeningMaintenance(
  supabase: SupabaseClient,
  sessions: Array<{ id: string; session_type: string; program_items?: ConferenceProgramItem[] }>
): Promise<{ errors: Record<string, string> }> {
  const errors: Record<string, string> = {}
  const allSessionIds = sessions.map((s) => s.id)
  if (allSessionIds.length === 0) return { errors }

  const refetchIntoSessions = async () => {
    const { data: refreshed } = await supabase
      .from("conference_program_items")
      .select("*")
      .in("session_id", allSessionIds)
      .order("display_order")
    const map = new Map<string, ConferenceProgramItem[]>()
    ;(refreshed || []).forEach((item: ConferenceProgramItem) => {
      const arr = map.get(item.session_id) || []
      arr.push(item)
      map.set(item.session_id, arr)
    })
    sessions.forEach((s) => {
      s.program_items = map.get(s.id) || []
    })
  }

  const job = openingMaintenanceQueue.then(async () => {
    const allDupIds: string[] = []
    for (const s of sessions) {
      if (!sessionUsesStandardOpeningBlock(s.session_type)) continue
      allDupIds.push(...idsOfRedundantStandardOpeningBlocks(s.program_items || []))
    }
    if (allDupIds.length > 0) {
      const { error } = await supabase.from("conference_program_items").delete().in("id", allDupIds)
      if (error) console.error("dedupe opening block:", error)
      else await refetchIntoSessions()
    }

    const allClosingDupIds: string[] = []
    for (const s of sessions) {
      if (!sessionUsesStandardOpeningBlock(s.session_type)) continue
      allClosingDupIds.push(...idsOfRedundantClosingHymnBenedictionPairs(s.program_items || []))
    }
    if (allClosingDupIds.length > 0) {
      const { error } = await supabase.from("conference_program_items").delete().in("id", allClosingDupIds)
      if (error) console.error("dedupe closing block:", error)
      else await refetchIntoSessions()
    }

    let insertedAny = false
    for (const s of sessions) {
      const result = await prependStandardOpeningBlockForSession(supabase, s)
      if (result.error && result.error !== PARTIAL_OPENING_BLOCK) errors[s.id] = result.error
      if (result.inserted) insertedAny = true
    }
    if (insertedAny) await refetchIntoSessions()

    let appendedClosing = false
    for (const s of sessions) {
      const result = await appendStandardClosingBlockForSession(supabase, s)
      if (result.error) errors[s.id] = result.error
      if (result.inserted) appendedClosing = true
    }
    if (appendedClosing) await refetchIntoSessions()
  })

  openingMaintenanceQueue = job.catch(() => {})
  await job
  return { errors }
}

/**
 * Shift existing rows down and insert prelude–invocation rows (positions 1–8).
 * Skips if session type doesn’t use the block, already has the prefix, or has any opening-type row (partial state).
 */
export async function prependStandardOpeningBlockForSession(
  supabase: SupabaseClient,
  session: { id: string; session_type: string; program_items?: ConferenceProgramItem[] }
): Promise<{ inserted: boolean; error?: string }> {
  if (!sessionUsesStandardOpeningBlock(session.session_type)) return { inserted: false }
  const items = session.program_items || []
  if (hasStandardOpeningPrefix(items)) return { inserted: false }
  if (anyStandardOpeningTypeInProgram(items)) return { inserted: false, error: PARTIAL_OPENING_BLOCK }

  const sorted = sortProgramItemsByOrder(items)
  const shift = STANDARD_OPENING_ITEM_TYPES.length
  for (const row of sorted) {
    const { error: uErr } = await supabase
      .from("conference_program_items")
      .update({ display_order: row.display_order + shift })
      .eq("id", row.id)
    if (uErr) return { inserted: false, error: uErr.message || "Could not reorder program." }
  }
  const insertRows = standardOpeningBlockTemplateRows().map((row) => ({
    ...row,
    session_id: session.id,
    invite_status: "not_invited" as const,
  }))
  const { error: iErr } = await supabase.from("conference_program_items").insert(insertRows)
  if (iErr) return { inserted: false, error: iErr.message || "Could not insert opening block." }
  return { inserted: true }
}
