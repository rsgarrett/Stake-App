import type { UserRole } from "@/types"

/** Roles that may create, edit, or delete stake meetings and agendas in the app. */
export const STAKE_MEETING_MANAGER_ROLES: readonly UserRole[] = [
  "stake_president",
  "counselor",
  "clerk",
  "assistant_clerk",
  "executive_secretary",
  "assistant_executive_secretary",
]

export function canManageStakeMeetings(
  role: UserRole | string | null | undefined
): boolean {
  if (!role) return false
  return (STAKE_MEETING_MANAGER_ROLES as readonly string[]).includes(role)
}
