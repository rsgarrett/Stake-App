import type { UserRole } from "@/types"

/** Fixed Handbook 7 stake offices (not high council seats). */
export const HANDBOOK_OFFICE_SLUGS = [
  "stake_president",
  "first_counselor",
  "second_counselor",
  "stake_clerk",
  "assistant_stake_clerk",
  "executive_secretary",
  "assistant_executive_secretary_1",
  "assistant_executive_secretary_2",
] as const

export type HandbookOfficeSlug = (typeof HANDBOOK_OFFICE_SLUGS)[number]

/** @deprecated Prefer `string` + {@link labelForOfficeSlug} — HC seats are `high_council_<n>`. */
export type StakeOfficeSlug = string

export function isHandbookOfficeSlug(slug: string): slug is HandbookOfficeSlug {
  return (HANDBOOK_OFFICE_SLUGS as readonly string[]).includes(slug)
}

export function isHighCouncilSeatSlug(slug: string): boolean {
  return /^high_council_[0-9]+$/.test(slug)
}

export const HANDBOOK_OFFICE_LABELS: Record<HandbookOfficeSlug, string> = {
  stake_president: "Stake president",
  first_counselor: "Stake president’s first counselor",
  second_counselor: "Stake president’s second counselor",
  stake_clerk: "Stake clerk",
  assistant_stake_clerk: "Assistant stake clerk",
  executive_secretary: "Stake executive secretary",
  assistant_executive_secretary_1: "Stake assistant executive secretary (1)",
  assistant_executive_secretary_2: "Stake assistant executive secretary (2)",
}

/** Row label in Settings (handbook row or `Stake high council (seat n)`). */
export function labelForOfficeSlug(slug: string): string {
  if (isHandbookOfficeSlug(slug)) return HANDBOOK_OFFICE_LABELS[slug]
  const m = /^high_council_([0-9]+)$/.exec(slug)
  if (m) return `Stake high council (seat ${parseInt(m[1], 10)})`
  return slug.replace(/_/g, " ")
}

/** Maps a roster seat → `public.users.role` when someone is seated. */
export function appRoleForOfficeSlug(slug: string): UserRole {
  if (isHighCouncilSeatSlug(slug)) return "high_council"
  if (!isHandbookOfficeSlug(slug)) return "viewer"
  switch (slug) {
    case "stake_president":
      return "stake_president"
    case "first_counselor":
    case "second_counselor":
      return "counselor"
    case "stake_clerk":
      return "clerk"
    case "assistant_stake_clerk":
      return "assistant_clerk"
    case "executive_secretary":
      return "executive_secretary"
    case "assistant_executive_secretary_1":
    case "assistant_executive_secretary_2":
      return "assistant_executive_secretary"
    default:
      return "viewer"
  }
}

/** @deprecated Use {@link appRoleForOfficeSlug} */
export function appRoleForOffice(slug: StakeOfficeSlug): UserRole {
  return appRoleForOfficeSlug(slug)
}

/** Short description of what the app allows for that role (high level). */
export const ROLE_CAPABILITY_SUMMARY: Record<UserRole, string> = {
  stake_president: "Full stake leadership access; can manage meetings, callings, welfare where policy allows, conferences, and roster.",
  counselor: "Stake leadership access with presidency; can manage meetings, callings, and most stake modules per RLS.",
  clerk: "Stake clerk access; can manage meetings, callings, records, and training content per RLS.",
  assistant_clerk: "Assistant clerk access; same elevated stake tools as clerk in this app (meetings, callings, etc.).",
  executive_secretary: "Executive secretary access; elevated like clerk for scheduling, meetings, and stake coordination in this app.",
  assistant_executive_secretary: "Assistant executive secretary; elevated for stake scheduling and operational modules.",
  high_council:
    "Stake-facing access without presidency write tools: filtered meeting visibility (High Council / Stake Council), stake callings and modules per RLS, interviews where configured. Seat assignments use Settings → roster.",
  bishop: "Ward bishop tools in this app where linked to a ward.",
  auxiliary_leader: "Auxiliary-oriented access (narrower than presidency).",
  viewer: "Read-only baseline for assigned modules only.",
}

export function canEditStakePermissionRoster(
  role: UserRole | string | null | undefined
): boolean {
  if (!role) return false
  return (
    role === "stake_president" ||
    role === "counselor" ||
    role === "clerk" ||
    role === "assistant_clerk" ||
    role === "executive_secretary" ||
    role === "assistant_executive_secretary"
  )
}
