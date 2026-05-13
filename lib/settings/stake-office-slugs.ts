import type { UserRole } from "@/types"

export const STAKE_OFFICE_SLUGS = [
  "stake_president",
  "first_counselor",
  "second_counselor",
  "stake_clerk",
  "assistant_stake_clerk",
  "executive_secretary",
  "assistant_executive_secretary_1",
  "assistant_executive_secretary_2",
] as const

export type StakeOfficeSlug = (typeof STAKE_OFFICE_SLUGS)[number]

/** Order shown in Settings roster (matches seeded sort_order best-effort). */
export const OFFICE_SORT_ORDER: Record<StakeOfficeSlug, number> = {
  stake_president: 1,
  first_counselor: 2,
  second_counselor: 3,
  stake_clerk: 4,
  assistant_stake_clerk: 5,
  executive_secretary: 6,
  assistant_executive_secretary_1: 7,
  assistant_executive_secretary_2: 8,
}

export const OFFICE_LABELS: Record<StakeOfficeSlug, string> = {
  stake_president: "Stake president",
  first_counselor: "Stake president’s first counselor",
  second_counselor: "Stake president’s second counselor",
  stake_clerk: "Stake clerk",
  assistant_stake_clerk: "Assistant stake clerk",
  executive_secretary: "Stake executive secretary",
  assistant_executive_secretary_1: "Stake assistant executive secretary (1)",
  assistant_executive_secretary_2: "Stake assistant executive secretary (2)",
}

/** Maps a roster seat → `public.users.role` when someone is seated. */
export function appRoleForOffice(slug: StakeOfficeSlug): UserRole {
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
  }
}

/** Short description of what the app allows for that role (high level). */
export const ROLE_CAPABILITY_SUMMARY: Record<
  UserRole,
  string
> = {
  stake_president: "Full stake leadership access; can manage meetings, callings, welfare where policy allows, conferences, and roster.",
  counselor: "Stake leadership access with presidency; can manage meetings, callings, and most stake modules per RLS.",
  clerk: "Stake clerk access; can manage meetings, callings, records, and training content per RLS.",
  assistant_clerk: "Assistant clerk access; same elevated stake tools as clerk in this app (meetings, callings, etc.).",
  executive_secretary: "Executive secretary access; elevated like clerk for scheduling, meetings, and stake coordination in this app.",
  assistant_executive_secretary: "Assistant executive secretary; elevated for stake scheduling and operational modules.",
  high_council: "View-only for High Council and Stake Council meetings; read-only callings; interview tools where configured.",
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
