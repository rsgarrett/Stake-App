// Read-only launch-readiness probe: verifies roster seats, seated users, and key tables.
// Usage: node scripts/check-launch-readiness.mjs
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })

async function probeTable(name, select = "*", limit = 1) {
  const { error, count } = await admin
    .from(name)
    .select(select, { count: "exact", head: true })
  if (error) return { ok: false, error: error.message }
  return { ok: true, count }
}

const checks = []

// 1. Roster table + seats
{
  const { data, error } = await admin
    .from("stake_permission_roster")
    .select("office_slug, assigned_user_id")
    .order("office_slug")
  if (error) {
    checks.push(["stake_permission_roster", `MISSING/ERROR: ${error.message} — apply migrations 064-067`])
  } else {
    const seated = data.filter((r) => r.assigned_user_id).length
    const hcSeats = data.filter((r) => /^high_council_\d+$/.test(r.office_slug)).length
    checks.push(["stake_permission_roster", `${data.length} seats (${hcSeats} HC), ${seated} seated`])
    for (const r of data) {
      checks.push([`  seat ${r.office_slug}`, r.assigned_user_id ? "seated" : "vacant"])
    }
  }
}

// 2. Users with roles
{
  const { data, error } = await admin.from("users").select("email, role, stake_id")
  if (error) checks.push(["users", `ERROR: ${error.message}`])
  else {
    checks.push(["users", `${data.length} profiles`])
    for (const u of data) {
      checks.push([`  ${u.email}`, `${u.role}${u.stake_id ? "" : "  ⚠️ NO STAKE_ID"}`])
    }
  }
}

// 3. Auth users without profiles (orphans from old self-registration)
{
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) checks.push(["auth users", `ERROR: ${error.message}`])
  else {
    const { data: profiles } = await admin.from("users").select("id")
    const profileIds = new Set((profiles ?? []).map((p) => p.id))
    const orphans = data.users.filter((u) => !profileIds.has(u.id))
    checks.push(["auth users", `${data.users.length} total, ${orphans.length} without app profile`])
    for (const o of orphans) checks.push([`  orphan`, o.email ?? o.id])
  }
}

// 4. Newer tables/columns that signal which migrations are applied
for (const t of ["calling_role_map", "high_council_training_content", "bishop_training_content", "sp_meeting_agenda"]) {
  const r = await probeTable(t)
  checks.push([t, r.ok ? `present (${r.count} rows)` : `missing: ${r.error}`])
}

// 5. meeting_agendas.notes column (migration 070)
{
  const { error } = await admin.from("meeting_agendas").select("notes").limit(1)
  if (error) {
    checks.push([
      "meeting_agendas.notes",
      `MISSING — apply supabase/migrations/070_agenda_item_notes.sql (${error.message})`,
    ])
  } else {
    checks.push(["meeting_agendas.notes", "present"])
  }
}

// 6. Launch summary
{
  const { data: roster } = await admin.from("stake_permission_roster").select("assigned_user_id")
  const vacant = (roster ?? []).filter((r) => !r.assigned_user_id).length
  if (vacant > 0) {
    checks.push(["launch", `${vacant} roster seat(s) still vacant — provision from Settings → Permissions`])
  } else {
    checks.push(["launch", "all roster seats filled"])
  }
}

console.log("\n=== Launch readiness ===")
for (const [k, v] of checks) console.log(`${k.padEnd(42)} ${v}`)
