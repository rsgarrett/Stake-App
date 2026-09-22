/** Local calendar YYYY-MM-DD (avoids UTC day-shift from toISOString). */
export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Date portion of a timestamp or YYYY-MM-DD string, in local time. */
export function scheduledDateLocal(isoOrDate: string): string {
  if (!isoOrDate) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) return isoOrDate
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return isoOrDate.slice(0, 10)
  return localDateISO(d)
}
