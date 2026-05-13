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
  "high_council_1",
  "high_council_2",
  "high_council_3",
  "high_council_4",
  "high_council_5",
  "high_council_6",
  "high_council_7",
  "high_council_8",
  "high_council_9",
  "high_council_10",
  "high_council_11",
  "high_council_12",
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
  high_council_1: 9,
  high_council_2: 10,
  high_council_3: 11,
  high_council_4: 12,
  high_council_5: 13,
  high_council_6: 14,
  high_council_7: 15,
  high_council_8: 16,
  high_council_9: 17,
  high_council_10: 18,
  high_council_11: 19,
  high_council_12: 20,
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
  high_council_1: "Stake high council (seat 1)",
  high_council_2: "Stake high council (seat 2)",
  high_council_3: "Stake high council (seat 3)",
  high_council_4: "Stake high council (seat 4)",
  high_council_5: "Stake high council (seat 5)",
  high_council_6: "Stake high council (seat 6)",
  high_council_7: "Stake high council (seat 7)",
  high_council_8: "Stake high council (seat 8)",
  high_council_9: "Stake high council (seat 9)",
  high_council_10: "Stake high council (seat 10)",
  high_council_11: "Stake high council (seat 11)",
  high_council_12: "Stake high council (seat 12)",
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
    case "high_council_1":
    case "high_council_2":
    case "high_council_3":
    case "high_council_4":
    case "high_council_5":
    case "high_council_6":
    case "high_council_7":
    case "high_council_8":
    case "high_council_9":
    case "high_council_10":
    case "high_council_11":
    case "high_council_12":
      return "high_council"
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
