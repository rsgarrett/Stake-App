/** Parse the 2026 Thursday Schedule tab (gid 1215946628). */

export const THURSDAY_GID = "1215946628"

function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ""
  let i = 0
  let inQ = false
  while (i < text.length) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i += 2
          continue
        }
        inQ = false
        i++
        continue
      }
      cur += c
      i++
      continue
    }
    if (c === '"') {
      inQ = true
      i++
      continue
    }
    if (c === ",") {
      row.push(cur)
      cur = ""
      i++
      continue
    }
    if (c === "\r") {
      i++
      continue
    }
    if (c === "\n") {
      row.push(cur)
      rows.push(row)
      row = []
      cur = ""
      i++
      continue
    }
    cur += c
    i++
  }
  if (cur.length || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows
}

function parseSheetDate(s) {
  const t = String(s || "").trim()
  if (!t) return null
  const m = t.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/)
  if (!m) return null
  const d = new Date(`${m[1]} ${m[2]}, ${m[3]}`)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${mo}-${day}`
}

function looksLikeSerial(s) {
  const t = String(s || "").trim()
  return t !== "" && /^\d+(\.\d+)?$/.test(t)
}

function asName(s) {
  const t = String(s || "").trim()
  if (!t) return null
  if (looksLikeSerial(t)) return null
  if (/^[A-Za-z]+ \d{1,2}, \d{4}$/.test(t)) return null
  if (!/[A-Za-z]/.test(t)) return null
  return t
}

function fmtTime(raw, ward) {
  if (raw == null) return null
  const t = String(raw).trim()
  if (!t) return null
  let m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (m) {
    return `${Number(m[1])}:${m[2]} ${m[3].toUpperCase()}`
  }
  m = t.match(/^(\d{1,2}):(\d{2})$/)
  if (m) {
    let h = Number(m[1])
    const mi = m[2]
    const blitz = String(ward || "").toLowerCase().includes("blitz")
    if (blitz || (h >= 1 && h <= 11)) h += 12
    const ampm = h >= 12 ? "PM" : "AM"
    let h12 = h % 12
    if (h12 === 0) h12 = 12
    return `${h12}:${mi} ${ampm}`
  }
  return null
}

function shortTitle(meetingType) {
  if (meetingType === "Relief Society Ministering") return "RS Ministering"
  if (meetingType === "Relief Society Presidents") return "RS Presidents Council"
  if (meetingType === "Elders Quorum Ministering") return "EQ Ministering"
  if (meetingType === "Elders Quorum Presidents") return "EQ Presidents Council"
  return meetingType
}

export function meetingTypeSlug(meetingType) {
  if (meetingType.startsWith("Bishopric")) return "bishopric_ministering"
  if (meetingType.includes("Elders Quorum") || meetingType === "Elders Quorum Presidents") {
    return "eq_ministering"
  }
  if (meetingType.includes("Relief Society") || meetingType === "Relief Society Presidents") {
    return "rs_ministering"
  }
  if (meetingType === "Coordinating Council") return "coordinating_council"
  if (meetingType === "Bishops Council") return "bishops_council"
  return "thursday_ministering"
}

export function meetingColor(meetingType) {
  if (meetingType === "Coordinating Council" || meetingType === "Bishops Council") return "#6b7280"
  if (meetingType.includes("Elders Quorum") || meetingType === "Elders Quorum Presidents") return "#2563eb"
  if (meetingType.includes("Relief Society") || meetingType === "Relief Society Presidents") return "#dc2626"
  return "#0d9488"
}

export function eventTitle(ward, meetingType) {
  return `${ward} — ${shortTitle(meetingType)}`
}

/**
 * Thursday evenings in America/Denver → timestamptz ISO.
 * 2026 US DST: Mar 8 – Nov 1.
 */
export function denverEveningIso(dateStr, time12h) {
  const m = String(time12h).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return `${dateStr}T18:30:00-07:00`
  let h = Number(m[1]) % 12
  if (m[3].toUpperCase() === "PM") h += 12
  const mi = m[2]
  const mdt = dateStr >= "2026-03-08" && dateStr < "2026-11-01"
  const off = mdt ? "-06:00" : "-07:00"
  return `${dateStr}T${String(h).padStart(2, "0")}:${mi}:00${off}`
}

export function parseThursdayCsv(text) {
  const csvRows = parseCsv(text)
  /** @type {Array<{visit_date: string, ward: string, meeting_type: string, start_time: string|null, end_time: string|null, slot: number|null, pg: string|null, pc: string|null, pw: string|null, notes: string|null}>} */
  const rows = []
  for (let i = 1; i < csvRows.length; i++) {
    const r = csvRows[i]
    const visit_date = parseSheetDate(r[0])
    const ward = String(r[1] || "").trim()
    if (!visit_date || !ward) continue
    let meeting_type = String(r[2] || "").trim()
    if (looksLikeSerial(meeting_type)) meeting_type = ""
    const start_time = fmtTime(r[3], ward)
    const end_time = fmtTime(r[4], ward)
    const slotRaw = String(r[5] || "").trim()
    const slot = /^\d+$/.test(slotRaw) ? Number(slotRaw) : null
    const pg = asName(r[7])
    const pc = asName(r[8])
    const pw = asName(r[9])
    const extra = String(r[6] || "").trim()
    const notes =
      asName(r[10]) ||
      (extra && /[A-Za-z]/.test(extra) && !looksLikeSerial(extra) ? extra : null)
    if (!meeting_type && !start_time) continue
    rows.push({
      visit_date,
      ward,
      meeting_type,
      start_time,
      end_time,
      slot,
      pg,
      pc,
      pw,
      notes,
    })
  }

  for (const row of rows) {
    if (row.meeting_type) continue
    if (row.ward.toLowerCase().includes("blitz")) {
      row.meeting_type = "Elders Quorum Ministering"
      continue
    }
    const siblings = rows.filter((o) => o.visit_date === row.visit_date && o.meeting_type)
    const bishopric = siblings.find((o) => o.meeting_type.startsWith("Bishopric"))
    if (bishopric) row.meeting_type = bishopric.meeting_type
    else if (siblings[0]) row.meeting_type = siblings[0].meeting_type
    else row.meeting_type = "Bishopric Ministering"
  }

  return rows.filter((r) => r.meeting_type)
}
