/** Public bishop recommendation links and helpers. */

/** Existing Google Form for the full detailed bishop intake. */
export const BISHOP_GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSe28V2cvZYNKxa7qbX6yrQ-mzo_HRCuTtKEZZXPFDTBQDFzUw/viewform"

/** In-app public path (no login) that inserts straight into the calling tracker. */
export const PUBLIC_RECOMMEND_PATH = "/recommend-calling"

export const RECOMMEND_WARDS = ["8th", "12th", "17th", "18th", "19th", "22nd", "23rd"] as const

export type RecommendCallingType = "Calling" | "Assignment" | "MP"

export interface PublicRecommendPayload {
  person_name: string
  ward: string
  submitter_name: string
  type: RecommendCallingType
  calling_name: string
  organization?: string | null
  current_calling?: string | null
  replaces_person_name?: string | null
  notes?: string | null
  /** Honeypot — must be empty. */
  company_website?: string
}
