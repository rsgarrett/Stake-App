#!/usr/bin/env node
/**
 * Replace thursday_schedule + calendar meetings with the Thursday Schedule tab
 * (gid 1215946628) from Stake Presidency Trainings and Visits.
 *
 * Usage: node scripts/sync-thursday-schedule-from-sheet.mjs [--dry-run]
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import {
  THURSDAY_GID,
  parseThursdayCsv,
  eventTitle,
  meetingTypeSlug,
  meetingColor,
  denverEveningIso,
} from "./parse-thursday-schedule.mjs"

const SPREADSHEET_ID = "1qKNOlz-H0jy5QC72prJFWXB2XgVqUBuILH8NQIDFX90"
const dryRun = process.argv.includes("--dry-run")
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")

const env = Object.fromEntries(
  readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function sqlStr(s) {
  if (s == null) return "NULL"
  return "'" + String(s).replace(/'/g, "''") + "'"
}

function meetingPayload(stakeId, row) {
  const start = row.start_time || "6:30 PM"
  let desc = start + (row.end_time ? ` - ${row.end_time}` : "")
  if (row.pg || row.pc || row.pw) {
    desc += `\nPG: ${row.pg || "—"} | PC: ${row.pc || "—"} | PW: ${row.pw || "—"}`
  }
  if (row.notes) desc += `\n${row.notes}`
  const agendaDesc =
    (row.start_time || "") +
    (row.end_time ? ` - ${row.end_time}` : "") +
    (row.pg ? `\nPG: ${row.pg}` : "") +
    (row.pc ? `\nPC: ${row.pc}` : "") +
    (row.pw ? `\nPW: ${row.pw}` : "") +
    (row.notes ? `\nNote: ${row.notes}` : "")
  return {
    stake_id: stakeId,
    title: eventTitle(row.ward, row.meeting_type),
    meeting_type: meetingTypeSlug(row.meeting_type),
    scheduled_date: denverEveningIso(row.visit_date, start),
    description: desc,
    color: meetingColor(row.meeting_type),
    source_type: "thursday_schedule",
    viewable_by_roles: ["stake_presidency", "stake_council"],
    agenda_title: `${row.ward} — ${row.meeting_type}`,
    agenda_description: agendaDesc || null,
  }
}

function writeMigration(rows) {
  const values = rows.map(
    (t) =>
      `    (${sqlStr(t.visit_date)}::date, ${sqlStr(t.ward)}, ${sqlStr(t.meeting_type)}, ${sqlStr(t.start_time)}, ${sqlStr(t.end_time)}, ${t.slot == null ? "NULL::int" : t.slot}, ${sqlStr(t.pg)}, ${sqlStr(t.pc)}, ${sqlStr(t.pw)}, ${sqlStr(t.notes)})`
  )
  const sql = `-- Align Thursday calendar events with Stake Presidency Trainings and Visits
-- tab gid ${THURSDAY_GID} (full-year Thursday Schedule).

DELETE FROM public.meeting_agendas
WHERE meeting_id IN (
  SELECT id FROM public.meetings WHERE source_type = 'thursday_schedule'
);
DELETE FROM public.meetings WHERE source_type = 'thursday_schedule';
DELETE FROM public.thursday_schedule WHERE stake_id = (SELECT id FROM public.stakes LIMIT 1);

INSERT INTO public.thursday_schedule (
  stake_id, visit_date, ward, meeting_type, start_time, end_time, slot,
  pg_attendee, pc_attendee, pw_attendee, notes
)
SELECT s.id, t.visit_date::date, t.ward, t.meeting_type, t.start_time, t.end_time, t.slot,
       t.pg_attendee, t.pc_attendee, t.pw_attendee, t.notes
FROM (SELECT id FROM public.stakes LIMIT 1) AS s
CROSS JOIN (
  VALUES
${values.join(",\n")}
) AS t(visit_date, ward, meeting_type, start_time, end_time, slot, pg_attendee, pc_attendee, pw_attendee, notes);

DO $$
DECLARE
  v_stake_id UUID;
  rec RECORD;
  v_meeting_id UUID;
  v_scheduled TIMESTAMPTZ;
  v_title TEXT;
  v_color TEXT;
  v_desc TEXT;
BEGIN
  SELECT id INTO v_stake_id FROM public.stakes LIMIT 1;
  FOR rec IN SELECT * FROM public.thursday_schedule ORDER BY visit_date, start_time NULLS LAST, ward
  LOOP
    IF rec.start_time IS NOT NULL THEN
      v_scheduled := to_timestamp(to_char(rec.visit_date, 'YYYY-MM-DD') || ' ' || rec.start_time, 'YYYY-MM-DD HH12:MI AM') AT TIME ZONE 'America/Denver';
    ELSE
      v_scheduled := (rec.visit_date::timestamp + interval '18 hours 30 minutes') AT TIME ZONE 'America/Denver';
    END IF;
    v_title := rec.ward || ' — ' ||
      CASE
        WHEN rec.meeting_type = 'Relief Society Ministering' THEN 'RS Ministering'
        WHEN rec.meeting_type = 'Relief Society Presidents' THEN 'RS Presidents Council'
        WHEN rec.meeting_type = 'Elders Quorum Ministering' THEN 'EQ Ministering'
        WHEN rec.meeting_type = 'Elders Quorum Presidents' THEN 'EQ Presidents Council'
        WHEN rec.meeting_type = 'Bishopric Ministering' THEN 'Bishopric Ministering'
        ELSE rec.meeting_type
      END;
    v_desc := COALESCE(rec.start_time || COALESCE(' - ' || rec.end_time, ''), '');
    IF rec.pg_attendee IS NOT NULL OR rec.pc_attendee IS NOT NULL OR rec.pw_attendee IS NOT NULL THEN
      v_desc := v_desc || E'\\nPG: ' || COALESCE(rec.pg_attendee, '—') || ' | PC: ' || COALESCE(rec.pc_attendee, '—') || ' | PW: ' || COALESCE(rec.pw_attendee, '—');
    END IF;
    IF rec.notes IS NOT NULL THEN v_desc := v_desc || E'\\n' || rec.notes; END IF;
    IF rec.meeting_type = 'Coordinating Council' OR rec.meeting_type = 'Bishops Council' THEN v_color := '#6b7280';
    ELSIF rec.meeting_type LIKE '%Elders Quorum%' OR rec.meeting_type = 'Elders Quorum Presidents' THEN v_color := '#2563eb';
    ELSIF rec.meeting_type LIKE '%Relief Society%' OR rec.meeting_type = 'Relief Society Presidents' THEN v_color := '#dc2626';
    ELSE v_color := '#0d9488';
    END IF;
    INSERT INTO public.meetings (stake_id, title, meeting_type, scheduled_date, description, color, source_type, viewable_by_roles)
    VALUES (
      v_stake_id, v_title,
      CASE
        WHEN rec.meeting_type LIKE 'Bishopric%' THEN 'bishopric_ministering'
        WHEN rec.meeting_type LIKE 'Elders Quorum%' OR rec.meeting_type = 'Elders Quorum Presidents' THEN 'eq_ministering'
        WHEN rec.meeting_type LIKE 'Relief Society%' OR rec.meeting_type = 'Relief Society Presidents' THEN 'rs_ministering'
        WHEN rec.meeting_type = 'Coordinating Council' THEN 'coordinating_council'
        WHEN rec.meeting_type = 'Bishops Council' THEN 'bishops_council'
        ELSE 'thursday_ministering'
      END,
      v_scheduled, v_desc, v_color, 'thursday_schedule', ARRAY['stake_presidency', 'stake_council']::text[]
    ) RETURNING id INTO v_meeting_id;
    INSERT INTO public.meeting_agendas (meeting_id, item_order, title, presenter, description)
    VALUES (v_meeting_id, 1, rec.ward || ' — ' || rec.meeting_type, NULL,
      COALESCE(rec.start_time || COALESCE(' - ' || rec.end_time, ''), '') ||
      CASE WHEN rec.pg_attendee IS NOT NULL THEN E'\\nPG: ' || rec.pg_attendee ELSE '' END ||
      CASE WHEN rec.pc_attendee IS NOT NULL THEN E'\\nPC: ' || rec.pc_attendee ELSE '' END ||
      CASE WHEN rec.pw_attendee IS NOT NULL THEN E'\\nPW: ' || rec.pw_attendee ELSE '' END ||
      CASE WHEN rec.notes IS NOT NULL THEN E'\\nNote: ' || rec.notes ELSE '' END);
  END LOOP;
END $$;
`
  const out = path.join(ROOT, "supabase/migrations/081_thursday_schedule_sheet_align.sql")
  writeFileSync(out, sql, "utf8")
  return out
}

async function main() {
  const csv = await fetch(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${THURSDAY_GID}`
  ).then((r) => {
    if (!r.ok) throw new Error(`Sheet HTTP ${r.status}`)
    return r.text()
  })
  const rows = parseThursdayCsv(csv)
  if (rows.length < 40) throw new Error(`Too few Thursday rows: ${rows.length}`)
  const out = writeMigration(rows)
  console.log("Wrote", out)
  console.log("Thursday rows", rows.length, rows[0].visit_date, "→", rows.at(-1).visit_date)

  if (dryRun) return

  const { data: stake, error: stakeErr } = await admin.from("stakes").select("id").limit(1).single()
  if (stakeErr) throw stakeErr
  const stakeId = stake.id

  const { data: oldMeetings, error: oldErr } = await admin
    .from("meetings")
    .select("id")
    .eq("source_type", "thursday_schedule")
  if (oldErr) throw oldErr
  const oldIds = (oldMeetings || []).map((r) => r.id)
  if (oldIds.length) {
    const { error: delAgendas } = await admin.from("meeting_agendas").delete().in("meeting_id", oldIds)
    if (delAgendas) throw delAgendas
  }

  const { error: delMeetings } = await admin.from("meetings").delete().eq("source_type", "thursday_schedule")
  if (delMeetings) throw delMeetings

  const { error: delSched } = await admin.from("thursday_schedule").delete().eq("stake_id", stakeId)
  if (delSched) throw delSched

  const schedRows = rows.map((t) => ({
    stake_id: stakeId,
    visit_date: t.visit_date,
    ward: t.ward,
    meeting_type: t.meeting_type,
    start_time: t.start_time,
    end_time: t.end_time,
    slot: t.slot,
    pg_attendee: t.pg,
    pc_attendee: t.pc,
    pw_attendee: t.pw,
    notes: t.notes,
  }))
  const { error: insSched } = await admin.from("thursday_schedule").insert(schedRows)
  if (insSched) throw insSched

  const meetingRows = rows.map((row) => {
    const p = meetingPayload(stakeId, row)
    return {
      stake_id: p.stake_id,
      title: p.title,
      meeting_type: p.meeting_type,
      scheduled_date: p.scheduled_date,
      description: p.description,
      color: p.color,
      source_type: p.source_type,
      viewable_by_roles: p.viewable_by_roles,
    }
  })
  const { data: inserted, error: insMeet } = await admin.from("meetings").insert(meetingRows).select("id")
  if (insMeet) throw insMeet
  if (!inserted || inserted.length !== rows.length) {
    throw new Error(`Inserted ${inserted?.length ?? 0} meetings, expected ${rows.length}`)
  }

  const agendas = inserted.map((m, i) => {
    const p = meetingPayload(stakeId, rows[i])
    return {
      meeting_id: m.id,
      item_order: 1,
      title: p.agenda_title,
      presenter: null,
      description: p.agenda_description,
    }
  })
  const { error: insAg } = await admin.from("meeting_agendas").insert(agendas)
  if (insAg) throw insAg

  console.log("Live calendar updated:", inserted.length, "Thursday events")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
