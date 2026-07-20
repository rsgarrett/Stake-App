/**
 * Groups high councilors (and their weekly R&R reports) by which stake
 * presidency member oversees their stewardship. Everyone in the presidency
 * can still see every report — sections just make each steward's area easy
 * to find at a glance.
 */

export type PresidencyStewardKey = "garrett" | "chandler" | "williams" | "shared" | "unassigned"

export interface PresidencyStewardGroup {
  key: PresidencyStewardKey
  /** Section heading shown above that group of reports. */
  label: string
  /** Short chip label (e.g. "Garrett"). */
  shortLabel: string
  /** Tailwind classes for the colored accent bar / header strip. */
  accent: {
    bar: string
    headerBg: string
    headerText: string
    chip: string
  }
}

const GROUP_DEFS: Record<PresidencyStewardKey, PresidencyStewardGroup> = {
  garrett: {
    key: "garrett",
    label: "President Garrett — stewardship",
    shortLabel: "Garrett",
    accent: {
      bar: "bg-sky-600",
      headerBg: "bg-sky-50 border-sky-200",
      headerText: "text-sky-900",
      chip: "bg-sky-100 text-sky-800 border-sky-200",
    },
  },
  chandler: {
    key: "chandler",
    label: "President Chandler — stewardship",
    shortLabel: "Chandler",
    accent: {
      bar: "bg-emerald-600",
      headerBg: "bg-emerald-50 border-emerald-200",
      headerText: "text-emerald-900",
      chip: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
  },
  williams: {
    key: "williams",
    label: "President Williams — stewardship",
    shortLabel: "Williams",
    accent: {
      bar: "bg-amber-600",
      headerBg: "bg-amber-50 border-amber-200",
      headerText: "text-amber-900",
      chip: "bg-amber-100 text-amber-800 border-amber-200",
    },
  },
  shared: {
    key: "shared",
    label: "Shared oversight (Chandler & Williams)",
    shortLabel: "Shared",
    accent: {
      bar: "bg-violet-600",
      headerBg: "bg-violet-50 border-violet-200",
      headerText: "text-violet-900",
      chip: "bg-violet-100 text-violet-800 border-violet-200",
    },
  },
  unassigned: {
    key: "unassigned",
    label: "Unassigned / other",
    shortLabel: "Other",
    accent: {
      bar: "bg-gray-400",
      headerBg: "bg-gray-50 border-gray-200",
      headerText: "text-gray-800",
      chip: "bg-gray-100 text-gray-700 border-gray-200",
    },
  },
}

/** Display order for stewardship sections on the R&R page. */
export const PRESIDENCY_STEWARD_ORDER: PresidencyStewardKey[] = [
  "garrett",
  "williams",
  "chandler",
  "shared",
  "unassigned",
]

export function getPresidencyStewardGroup(key: PresidencyStewardKey): PresidencyStewardGroup {
  return GROUP_DEFS[key]
}

/**
 * Maps free-text `presidency_oversight` (from the HC assignments sheet) onto
 * a stable stewardship key. Dual oversight ("Chandler & Williams") → shared.
 */
export function stewardshipKeyFromOversight(
  oversight: string | null | undefined
): PresidencyStewardKey {
  const raw = (oversight ?? "").toLowerCase()
  if (!raw.trim()) return "unassigned"

  const hasGarrett = /\bgarrett\b/.test(raw)
  const hasChandler = /\bchandler\b/.test(raw)
  const hasWilliams = /\bwilliams\b/.test(raw)
  const named = [hasGarrett, hasChandler, hasWilliams].filter(Boolean).length

  if (named >= 2) return "shared"
  if (hasGarrett) return "garrett"
  if (hasChandler) return "chandler"
  if (hasWilliams) return "williams"
  return "unassigned"
}

export function groupByPresidencyStewardship<T>(
  items: T[],
  getOversight: (item: T) => string | null | undefined
): { group: PresidencyStewardGroup; items: T[] }[] {
  const buckets = new Map<PresidencyStewardKey, T[]>()
  for (const key of PRESIDENCY_STEWARD_ORDER) buckets.set(key, [])

  for (const item of items) {
    const key = stewardshipKeyFromOversight(getOversight(item))
    buckets.get(key)!.push(item)
  }

  return PRESIDENCY_STEWARD_ORDER.map((key) => ({
    group: GROUP_DEFS[key],
    items: buckets.get(key)!,
  })).filter((section) => section.items.length > 0)
}
