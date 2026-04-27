/**
 * Fetches the stake Google Sheet (Sunday, Thursday, Ward Conference tabs),
 * applies high-council + Wednesday stake-presidency prep rules, and writes
 * supabase/migrations/054_calendar_sunday_ward_times.sql
 *
 * Run from repo root: node scripts/generate-2026-calendar-migration.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "supabase/migrations/054_calendar_sunday_ward_times.sql");

const SPREADSHEET_ID = "1qKNOlz-H0jy5QC72prJFWXB2XgVqUBuILH8NQIDFX90";
const SUNDAY_GID = "891020465";

function parseGvizDate(v) {
  if (!v || typeof v !== "string") return null;
  const m = v.match(/^Date\((-?\d+),(\d+),(\d+)\)/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo, d);
}

/**
 * Google Sheets gviz time cells are often `Date(1899,11,30,h,m,s)` strings.
 * Convert to `h:mm AM/PM` for PostgreSQL to_timestamp(..., 'HH12:MI AM').
 */
function gvizSerialTimeTo12h(v, ward) {
  if (!v || typeof v !== "string" || !v.startsWith("Date(")) return null;
  const m = v.match(
    /^Date\(\s*(-?\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*)?\)/
  );
  if (!m || m[4] === undefined) return null;
  let h = Number(m[4]);
  const mi = Number(m[5] ?? 0);
  const wstr = (ward || "").toLowerCase();
  if (wstr.includes("blitz") && h >= 1 && h < 12) h += 12;
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(mi).padStart(2, "0")} ${ampm}`;
}

function formatISODate(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Sacrament meeting start (local) by ward */
const SACRAMENT_LOCAL = Object.freeze({
  "17th": "09:00:00",
  "19th": "09:00:00",
  "23rd": "09:00:00",
  "18th": "10:30:00",
  "8th": "12:00:00",
  "12th": "12:00:00",
  "22nd": "13:30:00",
});

/** Teaching block start (local) by ward */
const TEACHING_LOCAL = Object.freeze({
  "17th": "10:00:00",
  "19th": "10:00:00",
  "23rd": "10:00:00",
  "18th": "12:30:00",
  "8th": "13:00:00",
  "12th": "13:00:00",
  "22nd": "14:30:00",
});

const WARD_TOKEN_RE = /\b(8th|12th|17th|18th|19th|22nd|23rd)\b/i;

function firstWardToken(text) {
  if (text == null) return null;
  const m = normalizeSundayText(text).match(WARD_TOKEN_RE);
  return m ? m[1].toLowerCase() : null;
}

function eventTimeForAssignment(cellText, entryType) {
  const ward = firstWardToken(cellText);
  const map = entryType === "teaching" ? TEACHING_LOCAL : SACRAMENT_LOCAL;
  if (!ward) return "09:00:00";
  return map[ward] || "09:00:00";
}

/** Orphan text (no ward token) inherits the nearest earlier slot with a ward (G → C → W). */
function resolvedEventTimeForSlot(filled, index, entryType) {
  if (firstWardToken(filled[index].val)) {
    return eventTimeForAssignment(filled[index].val, entryType);
  }
  for (let j = index - 1; j >= 0; j--) {
    if (firstWardToken(filled[j].val)) {
      return eventTimeForAssignment(filled[j].val, entryType);
    }
  }
  return "09:00:00";
}

/**
 * One presidency_visit_schedule row if all assignments share the same start time;
 * otherwise group by start time so each calendar event is correct (e.g. two wards at noon).
 */
function expandVisitTeaching(visitDate, wn, g, c, w, entryType, notes, addPres) {
  const slots = [
    { key: "pg", val: g },
    { key: "pc", val: c },
    { key: "pw", val: w },
  ];
  const filled = slots.filter((s) => s.val && String(s.val).trim());
  if (filled.length === 0) return;
  const times = filled.map((_, i) => resolvedEventTimeForSlot(filled, i, entryType));
  /** @type {Map<string, { pg: string|null, pc: string|null, pw: string|null }>} */
  const byTime = new Map();
  for (let i = 0; i < filled.length; i++) {
    const t = times[i];
    const cur = byTime.get(t) || { pg: null, pc: null, pw: null };
    if (filled[i].key === "pg") cur.pg = filled[i].val;
    if (filled[i].key === "pc") cur.pc = filled[i].val;
    if (filled[i].key === "pw") cur.pw = filled[i].val;
    byTime.set(t, cur);
  }
  const uniq = [...byTime.keys()].sort();
  if (uniq.length === 1) {
    const t = uniq[0];
    addPres(visitDate, wn, g, c, w, entryType, notes, t === "09:00:00" ? null : t);
    return;
  }
  for (const t of uniq) {
    const { pg, pc, pw } = byTime.get(t);
    addPres(visitDate, wn, pg, pc, pw, entryType, notes, t === "09:00:00" ? null : t);
  }
}

function parseMDY(s) {
  if (!s) return null;
  const t = String(s).trim();
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const mo = Number(m[1]) - 1;
  const d = Number(m[2]);
  const y = Number(m[3]);
  return new Date(y, mo, d);
}

/** RFC4180-ish CSV parser with quoted newlines */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let i = 0;
  let inQ = false;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i++;
        continue;
      }
      cur += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQ = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(cur);
      cur = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      i++;
      continue;
    }
    cur += c;
    i++;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function sqlStr(s) {
  if (s == null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.text();
}

function loadGvizTable(jsonText) {
  const s = jsonText.replace(/^\s*\/\*O_o\*\/\s*\n?/, "").replace(/^google\.visualization\.Query\.setResponse\(/, "").replace(/\);\s*$/, "");
  const j = JSON.parse(s);
  if (j.status !== "ok") throw new Error("gviz not ok: " + JSON.stringify(j));
  return j.table;
}

function cellVal(c) {
  if (!c) return null;
  if ("v" in c && c.v != null) return c.v;
  if ("f" in c && c.f != null) return c.f;
  return null;
}

function cellFmt(c) {
  if (!c) return null;
  if (c.f != null && String(c.f).trim() !== "") return String(c.f);
  const v = cellVal(c);
  return v != null ? String(v) : null;
}

function normalizeSundayText(s) {
  if (s == null) return "";
  return String(s).replace(/\r\n/g, "\n").trim();
}

function classifyGarrett(g) {
  const t = normalizeSundayText(g).replace(/\s+/g, " ");
  const lower = t.toLowerCase();
  if (!t) return { kind: "empty" };
  if (lower === "high council meeting") return { kind: "high_council_sheet" };
  if (lower === "stake council meeting") return { kind: "stake_council" };
  if (lower.includes("general conference")) return { kind: "general_conference" };
  if (lower === "stake conference" || lower.includes("stake conference")) return { kind: "stake_conference" };
  if (lower.includes("ward conference")) return { kind: "ward_conference", title: t };
  if (lower.includes("teach")) return { kind: "teaching" };
  return { kind: "visit" };
}

function allSundays2026() {
  const out = [];
  let d = new Date(2026, 0, 4);
  while (d.getFullYear() === 2026) {
    out.push(new Date(d));
    d = new Date(d.getTime() + 7 * 86400000);
  }
  return out;
}

function rowContainsTeach(g, c, w) {
  return [g, c, w].some((x) => normalizeSundayText(x).toLowerCase().includes("teach"));
}

/** Plain ward visit cell (e.g. "18th") — not teaching, conference, or council rows. */
function cellIsPlainWardVisitCell(s) {
  const t = normalizeSundayText(s);
  if (!t) return false;
  const lower = t.toLowerCase();
  if (lower.includes("teach")) return false;
  if (
    lower.includes("conference") ||
    lower.includes("stake council") ||
    lower.includes("general conference") ||
    lower.includes("high council")
  ) {
    return false;
  }
  if (firstWardToken(t)) return true;
  const first = (t.split(/\s+/)[0] || "").trim();
  return /^\d+(st|nd|rd|th)$/i.test(first);
}

/** Sheet row is a numbered Sunday ward-visit week (not a teaching-only row). */
function rowIsSundayWardVisitRow(rec) {
  if (rowContainsTeach(rec.garrett, rec.chandler, rec.williams)) return false;
  if (!rec.week || !String(rec.week).trim()) return false;
  return (
    cellIsPlainWardVisitCell(rec.garrett) ||
    cellIsPlainWardVisitCell(rec.chandler) ||
    cellIsPlainWardVisitCell(rec.williams)
  );
}

function shortVisitLabelFromTeachingCell(text) {
  return firstWardToken(text);
}

async function main() {
  const sundayCsv = await fetchText(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SUNDAY_GID}`
  );
  const thursdayJson = await fetchText(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent("2026 Thursday Schedule")}`
  );
  const wardJson = await fetchText(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent("Ward Conference Schedule")}`
  );

  const csvRows = parseCsv(sundayCsv);
  if (csvRows.length < 3) throw new Error("Unexpected Sunday CSV");

  /** @type {{week: string|null, date: Date|null, garrett: string, chandler: string, williams: string}[]} */
  const records = [];
  for (let r = 2; r < csvRows.length; r++) {
    const row = csvRows[r];
    if (row.length < 5) continue;
    const week = row[0]?.trim() || null;
    const dateCell = row[1]?.trim() || null;
    const garrett = row[2] ?? "";
    const chandler = row[3] ?? "";
    const williams = row[4] ?? "";
    const date = dateCell ? parseMDY(dateCell) : null;
    records.push({ week, date, garrett, chandler, williams });
  }

  // Forward-fill orphan stake council rows (missing date) from next dated row
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const cl = classifyGarrett(rec.garrett);
    if (cl.kind === "stake_council" && !rec.date) {
      for (let j = i + 1; j < records.length; j++) {
        if (records[j].date) {
          rec.date = new Date(records[j].date);
          break;
        }
      }
    }
  }

  /** Dates that already have a Sunday ward-visit row (week + plain wards, not teaching-only). */
  const datesWithSundayWardVisit = new Set();
  for (const rec of records) {
    let dt = rec.date ? new Date(rec.date) : null;
    if (dt) {
      if (dt.getFullYear() === 2025 && dt.getMonth() >= 8) {
        dt = new Date(dt.getFullYear() + 1, dt.getMonth(), dt.getDate());
      }
    }
    if (!dt) continue;
    const visitDate = formatISODate(dt);
    if (!visitDate.startsWith("2026-")) continue;
    const cl = classifyGarrett(rec.garrett);
    if (cl.kind === "high_council_sheet") continue;
    if (rowIsSundayWardVisitRow(rec)) datesWithSundayWardVisit.add(visitDate);
  }

  /** @type {Map<string, {timeNote: string, date: string}>} */
  const wardConfFromTab = new Map();
  const wardTable = loadGvizTable(wardJson);
  for (const row of wardTable.rows) {
    const cells = row.c || [];
    const name = normalizeSundayText(cellVal(cells[0]));
    if (!name || name === "2026" || name === "Event") continue;
    const timeNote = cellFmt(cells[1]) || "";
    // Columns C–G: pick first calendar date in 2026
    let picked = null;
    for (let ci = 2; ci <= 6; ci++) {
      const raw = cells[ci]?.v;
      const dt = typeof raw === "string" ? parseGvizDate(raw) : null;
      if (dt && dt.getFullYear() === 2026) {
        picked = dt;
        break;
      }
    }
    if (picked) {
      wardConfFromTab.set(name.toLowerCase(), {
        timeNote: timeNote || "See ward schedule",
        date: formatISODate(picked),
      });
    }
  }

  /** @type {Set<string>} */
  const exceptionSundays = new Set();
  /** @type {Array<[string, number|null, string|null, string|null, string|null, string, string|null, string|null]>} */
  const presidencyRows = [];

  function addPres(visitDate, weekNum, pg, pc, pw, entryType, notes = null, eventTimeLocal = null) {
    presidencyRows.push([visitDate, weekNum, pg, pc, pw, entryType, notes, eventTimeLocal]);
    if (["stake_council_meeting", "general_conference", "stake_conference"].includes(entryType)) {
      exceptionSundays.add(visitDate);
    }
  }

  for (const rec of records) {
    let dt = rec.date ? new Date(rec.date) : null;
    if (dt) {
      if (dt.getFullYear() === 2025 && dt.getMonth() >= 8) dt = new Date(dt.getFullYear() + 1, dt.getMonth(), dt.getDate());
    }
    if (!dt) continue;
    const visitDate = formatISODate(dt);
    if (!visitDate.startsWith("2026-")) continue;

    const cl = classifyGarrett(rec.garrett);
    if (cl.kind === "high_council_sheet") continue;

    const weekNum = rec.week ? parseInt(rec.week, 10) : null;
    const wn = Number.isFinite(weekNum) ? weekNum : null;

    if (cl.kind === "stake_council") {
      addPres(visitDate, null, null, null, null, "stake_council_meeting", null, null);
      continue;
    }
    if (cl.kind === "general_conference") {
      addPres(visitDate, wn, rec.garrett, null, null, "general_conference", null, null);
      continue;
    }
    if (cl.kind === "stake_conference") {
      addPres(visitDate, wn, rec.garrett, null, null, "stake_conference", null, null);
      continue;
    }
    if (cl.kind === "ward_conference") {
      const key = normalizeSundayText(rec.garrett).toLowerCase();
      const extra = wardConfFromTab.get(key);
      const notes = extra ? `Conference time: ${extra.timeNote}` : null;
      addPres(visitDate, wn, rec.garrett, rec.chandler || null, rec.williams || null, "ward_conference", notes, null);
      continue;
    }
    if (cl.kind === "teaching") {
      if (!datesWithSundayWardVisit.has(visitDate)) {
        const vg = rec.garrett ? shortVisitLabelFromTeachingCell(rec.garrett) : null;
        const vc = rec.chandler ? shortVisitLabelFromTeachingCell(rec.chandler) : null;
        const vw = rec.williams ? shortVisitLabelFromTeachingCell(rec.williams) : null;
        expandVisitTeaching(visitDate, wn, vg, vc, vw, "visit", null, addPres);
      }
      expandVisitTeaching(visitDate, wn, rec.garrett, rec.chandler, rec.williams, "teaching", null, addPres);
      continue;
    }
    if (cl.kind === "visit") {
      expandVisitTeaching(visitDate, wn, rec.garrett, rec.chandler, rec.williams, "visit", null, addPres);
      continue;
    }
  }

  for (const sun of allSundays2026()) {
    const key = formatISODate(sun);
    if (exceptionSundays.has(key)) continue;
    addPres(key, null, null, null, null, "high_council_meeting", null, null);
  }

  const CAL_ENTRY_ORDER = {
    high_council_meeting: 0,
    stake_council_meeting: 1,
    general_conference: 2,
    stake_conference: 3,
    visit: 4,
    ward_conference: 5,
    teaching: 6,
  };
  presidencyRows.sort((a, b) => {
    const etA = String(a[5]);
    const etB = String(b[5]);
    return (
      a[0].localeCompare(b[0]) ||
      (CAL_ENTRY_ORDER[etA] ?? 99) - (CAL_ENTRY_ORDER[etB] ?? 99) ||
      String(a[7] || "").localeCompare(String(b[7] || ""))
    );
  });

  const thursdayTable = loadGvizTable(thursdayJson);
  /** @type {Array<{visit_date: string, ward: string, meeting_type: string, start_time: string|null, end_time: string|null, slot: number|null, pg: string|null, pc: string|null, pw: string|null, notes: string|null}>} */
  const thursdayRows = [];

  function pushThursday(visitDate, ward, meetingType, startV, endV, slot, pg, pc, pw, notes) {
    function fmtTime(v, w) {
      if (v == null) return null;
      if (typeof v === "string") {
        const serial = gvizSerialTimeTo12h(v, w);
        if (serial) return serial;
        const t = v.trim();
        if (/^\d{1,2}:\d{2}\s*(AM|PM)\b/i.test(t)) return t;
        return null;
      }
      const d = parseGvizDate(v);
      if (!d) return null;
      let h = d.getHours();
      const mi = d.getMinutes();
      const wstr = (w || "").toLowerCase();
      if (wstr.includes("blitz") && h >= 1 && h < 12) h += 12;
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      return `${h}:${String(mi).padStart(2, "0")} ${ampm}`;
    }
    const st = fmtTime(startV, ward);
    const et = fmtTime(endV, ward);
    thursdayRows.push({
      visit_date: visitDate,
      ward,
      meeting_type: meetingType,
      start_time: st,
      end_time: et,
      slot,
      pg,
      pc,
      pw,
      notes,
    });
  }

  for (const row of thursdayTable.rows) {
    const cells = row.c || [];
    const dateRaw = cells[0]?.v;
    const visitD = typeof dateRaw === "string" ? parseGvizDate(dateRaw) : null;
    if (!visitD) continue;
    const visit_date = formatISODate(visitD);
    const ward = cellVal(cells[1]);
    const meetingType = cellVal(cells[2]);
    if (!ward || !meetingType) continue;
    const slot = cellVal(cells[5]);
    const pg = cellVal(cells[7]);
    const pc = cellVal(cells[8]);
    const pw = cellVal(cells[9]);
    const notes = cellVal(cells[10]);
    pushThursday(visit_date, String(ward), String(meetingType), cells[3]?.v, cells[4]?.v, typeof slot === "number" ? slot : null, pg, pc, pw, notes);
  }

  const councilWards = new Set(["Coordinating Council", "Bishops Council", "Elders Quorum Council", "Relief Society Council"]);
  /** @type {Set<string>} */
  const wedPrepDates = new Set();
  for (const tr of thursdayRows) {
    if (!councilWards.has(tr.ward)) continue;
    const d = new Date(tr.visit_date + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    wedPrepDates.add(formatISODate(d));
  }

  const lines = [];
  lines.push(`-- Sync 2026 stake calendar: ward sacrament/teaching times; teaching-only Sundays get synthetic ward visits`);
  lines.push(`-- Generated by scripts/generate-2026-calendar-migration.mjs — re-run script after sheet edits.`);
  lines.push(``);
  lines.push(`ALTER TABLE presidency_visit_schedule ADD COLUMN IF NOT EXISTS event_time_local TIME;`);
  lines.push(``);
  lines.push(`DELETE FROM meeting_agendas WHERE meeting_id IN (`);
  lines.push(`  SELECT id FROM meetings WHERE source_type IN ('visit_schedule', 'thursday_schedule', 'council_prep')`);
  lines.push(`);`);
  lines.push(`DELETE FROM meetings WHERE source_type IN ('visit_schedule', 'thursday_schedule', 'council_prep');`);
  lines.push(``);
  lines.push(`DELETE FROM presidency_visit_schedule WHERE stake_id = (SELECT id FROM stakes LIMIT 1);`);
  lines.push(`DELETE FROM thursday_schedule WHERE stake_id = (SELECT id FROM stakes LIMIT 1);`);
  lines.push(``);

  lines.push(`INSERT INTO presidency_visit_schedule (stake_id, visit_date, week_number, president_assignment, first_counselor_assignment, second_counselor_assignment, entry_type, notes, event_time_local)`);
  lines.push(`SELECT s.id, d.visit_date::date, d.week_number, d.president_assignment, d.first_counselor_assignment, d.second_counselor_assignment, d.entry_type, d.notes, d.event_time_local::time`);
  lines.push(`FROM (SELECT id FROM stakes LIMIT 1) AS s`);
  lines.push(`CROSS JOIN (`);
  lines.push(`  VALUES`);
  const presValues = presidencyRows.map(
    ([vd, wn, pg, pc, pw, et, notes, etl]) =>
      `    (${sqlStr(vd)}::date, ${wn == null ? "NULL::int" : `${wn}::int`}, ${sqlStr(pg)}, ${sqlStr(pc)}, ${sqlStr(pw)}, ${sqlStr(et)}::text, ${sqlStr(notes)}, ${etl == null ? "NULL::time" : `'${etl}'::time`})`
  );
  lines.push(presValues.join(",\n"));
  lines.push(`) AS d(visit_date, week_number, president_assignment, first_counselor_assignment, second_counselor_assignment, entry_type, notes, event_time_local);`);
  lines.push(``);

  lines.push(`INSERT INTO thursday_schedule (stake_id, visit_date, ward, meeting_type, start_time, end_time, slot, pg_attendee, pc_attendee, pw_attendee, notes)`);
  lines.push(`SELECT s.id, t.visit_date::date, t.ward, t.meeting_type, t.start_time, t.end_time, t.slot, t.pg_attendee, t.pc_attendee, t.pw_attendee, t.notes`);
  lines.push(`FROM (SELECT id FROM stakes LIMIT 1) AS s`);
  lines.push(`CROSS JOIN (`);
  lines.push(`  VALUES`);
  const thVals = thursdayRows.map(
    (t) =>
      `    (${sqlStr(t.visit_date)}::date, ${sqlStr(t.ward)}, ${sqlStr(t.meeting_type)}, ${sqlStr(t.start_time)}, ${sqlStr(t.end_time)}, ${t.slot == null ? "NULL::int" : t.slot}, ${sqlStr(t.pg)}, ${sqlStr(t.pc)}, ${sqlStr(t.pw)}, ${sqlStr(t.notes)})`
  );
  lines.push(thVals.join(",\n"));
  lines.push(`) AS t(visit_date, ward, meeting_type, start_time, end_time, slot, pg_attendee, pc_attendee, pw_attendee, notes);`);
  lines.push(``);

  // --- Visit schedule → meetings (ward-specific or 9:00 America/Denver; high council 6:00)
  lines.push(`DO $$`);
  lines.push(`DECLARE`);
  lines.push(`  v_stake_id UUID;`);
  lines.push(`  rec RECORD;`);
  lines.push(`  v_meeting_id UUID;`);
  lines.push(`  v_title TEXT;`);
  lines.push(`  v_color TEXT;`);
  lines.push(`  v_type TEXT;`);
  lines.push(`  v_order INT;`);
  lines.push(`  v_scheduled TIMESTAMPTZ;`);
  lines.push(`BEGIN`);
  lines.push(`  SELECT id INTO v_stake_id FROM stakes LIMIT 1;`);
  lines.push(`  FOR rec IN SELECT * FROM presidency_visit_schedule ORDER BY visit_date, entry_type`);
  lines.push(`  LOOP`);
  lines.push(`    CASE rec.entry_type`);
  lines.push(`      WHEN 'visit' THEN v_title := 'Sunday Ward Visits'; v_color := '#0891b2'; v_type := 'ward_visit';`);
  lines.push(`      WHEN 'teaching' THEN v_title := 'Sunday Teaching Assignments'; v_color := '#7c3aed'; v_type := 'teaching';`);
  lines.push(`      WHEN 'ward_conference' THEN v_title := rec.president_assignment; v_color := '#d97706'; v_type := 'ward_conference';`);
  lines.push(`      WHEN 'stake_conference' THEN v_title := 'Stake Conference'; v_color := '#dc2626'; v_type := 'stake_conference';`);
  lines.push(`      WHEN 'general_conference' THEN v_title := 'General Conference'; v_color := '#16a34a'; v_type := 'general_conference';`);
  lines.push(`      WHEN 'high_council_meeting' THEN v_title := 'High Council Meeting'; v_color := '#6b7280'; v_type := 'high_council';`);
  lines.push(`      WHEN 'stake_council_meeting' THEN v_title := 'Stake Council Meeting'; v_color := '#6b7280'; v_type := 'stake_council';`);
  lines.push(`      ELSE v_title := 'Presidency Schedule'; v_color := '#3b82f6'; v_type := 'other';`);
  lines.push(`    END CASE;`);
  lines.push(`    v_scheduled := CASE`);
  lines.push(`      WHEN rec.entry_type = 'high_council_meeting' THEN (rec.visit_date::timestamp + interval '6 hours') AT TIME ZONE 'America/Denver'`);
  lines.push(`      WHEN rec.entry_type IN ('visit', 'teaching') AND rec.event_time_local IS NOT NULL THEN (rec.visit_date + rec.event_time_local) AT TIME ZONE 'America/Denver'`);
  lines.push(`      ELSE (rec.visit_date::timestamp + interval '9 hours') AT TIME ZONE 'America/Denver'`);
  lines.push(`    END;`);
  lines.push(`    INSERT INTO meetings (stake_id, title, meeting_type, scheduled_date, description, color, source_type, viewable_by_roles)`);
  lines.push(`    VALUES (`);
  lines.push(`      v_stake_id, v_title, v_type, v_scheduled,`);
  lines.push(`      CASE WHEN rec.notes IS NOT NULL THEN rec.notes ELSE NULL END,`);
  lines.push(`      v_color, 'visit_schedule', ARRAY['stake_presidency']::text[]`);
  lines.push(`    ) RETURNING id INTO v_meeting_id;`);
  lines.push(`    IF rec.entry_type IN ('visit', 'teaching') THEN`);
  lines.push(`      v_order := 1;`);
  lines.push(`      IF rec.president_assignment IS NOT NULL THEN`);
  lines.push(`        INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter)`);
  lines.push(`        VALUES (v_meeting_id, v_order, 'President Garrett — ' || rec.president_assignment, 'President Garrett');`);
  lines.push(`        v_order := v_order + 1;`);
  lines.push(`      END IF;`);
  lines.push(`      IF rec.first_counselor_assignment IS NOT NULL THEN`);
  lines.push(`        INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter)`);
  lines.push(`        VALUES (v_meeting_id, v_order, 'President Chandler — ' || rec.first_counselor_assignment, 'President Chandler');`);
  lines.push(`        v_order := v_order + 1;`);
  lines.push(`      END IF;`);
  lines.push(`      IF rec.second_counselor_assignment IS NOT NULL THEN`);
  lines.push(`        INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter)`);
  lines.push(`        VALUES (v_meeting_id, v_order, 'President Williams — ' || rec.second_counselor_assignment, 'President Williams');`);
  lines.push(`        v_order := v_order + 1;`);
  lines.push(`      END IF;`);
  lines.push(`    END IF;`);
  lines.push(`  END LOOP;`);
  lines.push(`END $$;`);
  lines.push(``);

  // Thursday → meetings with proper time in America/Denver
  lines.push(`DO $$`);
  lines.push(`DECLARE`);
  lines.push(`  v_stake_id UUID;`);
  lines.push(`  rec RECORD;`);
  lines.push(`  v_meeting_id UUID;`);
  lines.push(`  v_scheduled TIMESTAMPTZ;`);
  lines.push(`  v_title TEXT;`);
  lines.push(`  v_color TEXT;`);
  lines.push(`  v_desc TEXT;`);
  lines.push(`BEGIN`);
  lines.push(`  SELECT id INTO v_stake_id FROM stakes LIMIT 1;`);
  lines.push(`  FOR rec IN SELECT * FROM thursday_schedule ORDER BY visit_date, start_time NULLS LAST, ward`);
  lines.push(`  LOOP`);
  lines.push(`    IF rec.start_time IS NOT NULL THEN`);
  lines.push(`      v_scheduled := to_timestamp(to_char(rec.visit_date, 'YYYY-MM-DD') || ' ' || rec.start_time, 'YYYY-MM-DD HH12:MI AM') AT TIME ZONE 'America/Denver';`);
  lines.push(`    ELSE`);
  lines.push(`      v_scheduled := (rec.visit_date::timestamp + interval '18 hours 30 minutes') AT TIME ZONE 'America/Denver';`);
  lines.push(`    END IF;`);
  lines.push(`    v_title := rec.ward || ' — ' ||`);
  lines.push(`      CASE`);
  lines.push(`        WHEN rec.meeting_type = 'Relief Society Ministering' THEN 'RS Ministering'`);
  lines.push(`        WHEN rec.meeting_type = 'Relief Society Presidents' THEN 'RS Presidents Council'`);
  lines.push(`        WHEN rec.meeting_type = 'Elders Quorum Ministering' THEN 'EQ Ministering'`);
  lines.push(`        WHEN rec.meeting_type = 'Elders Quorum Presidents' THEN 'EQ Presidents Council'`);
  lines.push(`        WHEN rec.meeting_type = 'Bishopric Ministering' THEN 'Bishopric Ministering'`);
  lines.push(`        ELSE rec.meeting_type`);
  lines.push(`      END;`);
  lines.push(`    v_desc := COALESCE(rec.start_time || COALESCE(' - ' || rec.end_time, ''), '');`);
  lines.push(`    IF rec.pg_attendee IS NOT NULL OR rec.pc_attendee IS NOT NULL OR rec.pw_attendee IS NOT NULL THEN`);
  lines.push(`      v_desc := v_desc || E'\\nPG: ' || COALESCE(rec.pg_attendee, '—') || ' | PC: ' || COALESCE(rec.pc_attendee, '—') || ' | PW: ' || COALESCE(rec.pw_attendee, '—');`);
  lines.push(`    END IF;`);
  lines.push(`    IF rec.notes IS NOT NULL THEN v_desc := v_desc || E'\\n' || rec.notes; END IF;`);
  lines.push(`    IF rec.meeting_type = 'Coordinating Council' OR rec.meeting_type = 'Bishops Council' THEN v_color := '#6b7280';`);
  lines.push(`    ELSIF rec.meeting_type LIKE '%Elders Quorum%' OR rec.meeting_type = 'Elders Quorum Presidents' THEN v_color := '#2563eb';`);
  lines.push(`    ELSIF rec.meeting_type LIKE '%Relief Society%' OR rec.meeting_type = 'Relief Society Presidents' THEN v_color := '#dc2626';`);
  lines.push(`    ELSE v_color := '#0d9488';`);
  lines.push(`    END IF;`);
  lines.push(`    INSERT INTO meetings (stake_id, title, meeting_type, scheduled_date, description, color, source_type, viewable_by_roles)`);
  lines.push(`    VALUES (`);
  lines.push(`      v_stake_id, v_title,`);
  lines.push(`      CASE`);
  lines.push(`        WHEN rec.meeting_type LIKE 'Bishopric%' THEN 'bishopric_ministering'`);
  lines.push(`        WHEN rec.meeting_type LIKE 'Elders Quorum%' OR rec.meeting_type = 'Elders Quorum Presidents' THEN 'eq_ministering'`);
  lines.push(`        WHEN rec.meeting_type LIKE 'Relief Society%' OR rec.meeting_type = 'Relief Society Presidents' THEN 'rs_ministering'`);
  lines.push(`        WHEN rec.meeting_type = 'Coordinating Council' THEN 'coordinating_council'`);
  lines.push(`        WHEN rec.meeting_type = 'Bishops Council' THEN 'bishops_council'`);
  lines.push(`        ELSE 'thursday_ministering'`);
  lines.push(`      END,`);
  lines.push(`      v_scheduled, v_desc, v_color, 'thursday_schedule', ARRAY['stake_presidency', 'stake_council']::text[]`);
  lines.push(`    ) RETURNING id INTO v_meeting_id;`);
  lines.push(`    INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter, description)`);
  lines.push(`    VALUES (v_meeting_id, 1, rec.ward || ' — ' || rec.meeting_type, NULL,`);
  lines.push(`      COALESCE(rec.start_time || COALESCE(' - ' || rec.end_time, ''), '') ||`);
  lines.push(`      CASE WHEN rec.pg_attendee IS NOT NULL THEN E'\\nPG: ' || rec.pg_attendee ELSE '' END ||`);
  lines.push(`      CASE WHEN rec.pc_attendee IS NOT NULL THEN E'\\nPC: ' || rec.pc_attendee ELSE '' END ||`);
  lines.push(`      CASE WHEN rec.pw_attendee IS NOT NULL THEN E'\\nPW: ' || rec.pw_attendee ELSE '' END ||`);
  lines.push(`      CASE WHEN rec.notes IS NOT NULL THEN E'\\nNote: ' || rec.notes ELSE '' END);`);
  lines.push(`  END LOOP;`);
  lines.push(`END $$;`);
  lines.push(``);

  const prepDates = [...wedPrepDates].sort();
  if (prepDates.length > 0) {
    lines.push(`INSERT INTO meetings (stake_id, title, meeting_type, scheduled_date, description, color, source_type, viewable_by_roles)`);
    lines.push(`SELECT`);
    lines.push(`  s.id,`);
    lines.push(`  'Stake Presidency Meeting',`);
    lines.push(`  'stake_presidency',`);
    lines.push(`  (d.prep_date::timestamp + interval '19 hours 30 minutes') AT TIME ZONE 'America/Denver',`);
    lines.push(`  'Preparation for Thursday coordinating / bishops / elders quorum / relief society council (7:30 PM).',`);
    lines.push(`  '#3b82f6',`);
    lines.push(`  'council_prep',`);
    lines.push(`  ARRAY['stake_presidency']::text[]`);
    lines.push(`FROM (SELECT id FROM stakes LIMIT 1) AS s`);
    lines.push(`CROSS JOIN (`);
    lines.push(`  VALUES`);
    lines.push(prepDates.map((pd) => `    (${sqlStr(pd)}::date)`).join(",\n"));
    lines.push(`) AS d(prep_date);`);
    lines.push(``);
  }

  fs.writeFileSync(OUT, lines.join("\n"), "utf8");
  console.log("Wrote", OUT);
  console.log("Presidency rows", presidencyRows.length, "Thursday", thursdayRows.length, "Wed prep", prepDates.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
