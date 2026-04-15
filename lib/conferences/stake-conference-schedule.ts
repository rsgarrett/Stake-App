/**
 * Stake conference is Saturday (start) and Sunday (end). Session times follow handbook-style defaults.
 * Dates use noon local parsing to avoid timezone shifting the calendar day.
 */

/** YYYY-MM-DD from a local Date (no UTC shift). */
function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00")
  d.setDate(d.getDate() + days)
  return toLocalIsoDate(d)
}

/**
 * Maps any chosen calendar day to the stake-conference weekend containing it:
 * - Saturday → that day + following Sunday
 * - Sunday → preceding Saturday + that Sunday
 * - Mon–Fri → the next Saturday + Sunday (e.g. Friday → Sat/Sun of that weekend)
 */
export function normalizeStakeConferenceWeekend(anchorIso: string): { saturday: string; sunday: string } | null {
  const raw = anchorIso?.trim().slice(0, 10)
  if (!raw) return null
  const d = new Date(raw + "T12:00:00")
  if (Number.isNaN(d.getTime())) return null
  const day = d.getDay() // 0 Sun … 6 Sat
  const sat = new Date(d)
  if (day === 6) {
    // already Saturday
  } else if (day === 0) {
    sat.setDate(sat.getDate() - 1)
  } else {
    sat.setDate(sat.getDate() + ((6 - day + 7) % 7))
  }
  const saturday = toLocalIsoDate(sat)
  const sunday = addDaysToIsoDate(saturday, 1)
  return { saturday, sunday }
}

const SATURDAY_SESSION_TYPES = new Set([
  "ministering_visits",
  "presidency_meeting",
  "leadership_session",
  "dinner",
  "adult_session",
])

/** Default session_date (YYYY-MM-DD) for template sessions when event spans Sat–Sun. */
export function defaultStakeConferenceSessionDate(
  sessionType: string,
  saturdayIso: string,
  sundayIso: string
): string | null {
  if (!saturdayIso) return null
  const sun = sundayIso || addDaysToIsoDate(saturdayIso, 1)
  if (sessionType === "general_session") return sun
  if (SATURDAY_SESSION_TYPES.has(sessionType)) return saturdayIso
  return saturdayIso
}
