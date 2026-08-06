import { canEditStakePermissionRoster } from "@/lib/settings/stake-office-slugs"

/** High councilors do not use the calling tracker. */
export function canAccessCallingTracker(role: string | null | undefined): boolean {
  return role !== "high_council"
}

/** High councilors do not use Interviews. */
export function canAccessInterviews(role: string | null | undefined): boolean {
  return role !== "high_council"
}

/** Presidency / clerks / exec secs manage the full HC R&R roster and all reports. */
export function canManageHcCommunication(role: string | null | undefined): boolean {
  return canEditStakePermissionRoster(role)
}

/** True when the user is a high councilor without elevated tools. */
export function isHighCouncilOnly(role: string | null | undefined): boolean {
  return role === "high_council"
}
