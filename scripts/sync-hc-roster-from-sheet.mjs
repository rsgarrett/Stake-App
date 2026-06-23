#!/usr/bin/env node
/**
 * Sync high_council_members + presidency-only lines from the stake HC assignments Google Sheet.
 * Usage: node scripts/sync-hc-roster-from-sheet.mjs [--dry-run]
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

const SHEET_ID = "1qKNOlz-H0jy5QC72prJFWXB2XgVqUBuILH8NQIDFX90"
const SHEET_NAME = "HC assignments"
const dryRun = process.argv.includes("--dry-run")

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else inQuotes = false
      } else cell += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ",") {
      row.push(cell)
      cell = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else cell += ch
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

function normalizePresidency(raw) {
  const s = raw.replace(/\s+/g, " ").trim()
  if (!s) return ""
  if (/chandler.*williams|williams.*chandler/i.test(s)) return "President Chandler & President Williams"
  return s
}

function fmtWard(raw) {
  const w = raw.trim()
  if (!w || w === "*") return ""
  if (/ward$/i.test(w)) return w.replace(/\s+ward$/i, (m) => m[0].toUpperCase() + m.slice(1))
  return `${w} Ward`
}

function buildAssignedWards(assignedWard, homeWard, program) {
  const assigned = assignedWard.trim()
  const home = homeWard.trim()
  const prog = program.trim()

  if ((!assigned || assigned === "*") && home) {
    return `Coordinating ${fmtWard(home)}`
  }
  if (!assigned || assigned === "*") return ""

  const coord = fmtWard(assigned)
  if (!home || home === assigned) return `Coordinating ${coord}`

  const homeBare = home.replace(/\s+ward$/i, "")
  if (prog.includes("ALC/YLC") || (prog.includes("YLC") && !prog.includes("ALC"))) {
    return `Coordinating ${coord}; wards in group ${homeBare}`
  }
  return `Coordinating ${coord}; ALC group ${fmtWard(home)}`
}

function cleanAssignment(text) {
  return text.replace(/\s+/g, " ").replace(/ \/ $/, "").trim()
}

async function fetchSheetCsv() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)
  return res.text()
}

function buildRosterFromSheet(rows) {
  const headerIdx = rows.findIndex((r) => r[0]?.trim() === "Stake Presidency Member")
  if (headerIdx === -1) throw new Error("Could not find HC assignments header row")

  /** @type {Map<string, any>} */
  const byName = new Map()

  const ensure = (name) => {
    const key = name.trim()
    if (!byName.has(key)) {
      byName.set(key, {
        member_name: key,
        presidency_oversight: new Set(),
        stewardships: [],
        program_assignment: new Set(),
        assigned_wards: "",
        stewardship_notes: [],
      })
    }
    return byName.get(key)
  }

  let lastAssignedHc = ""

  for (const row of rows.slice(headerIdx + 1)) {
    const pres = (row[0] ?? "").trim()
    const resp = (row[1] ?? "").trim()
    const hcRaw = (row[2] ?? "").trim()
    const ward = (row[3] ?? "").trim()
    const committee = (row[4] ?? "").trim()
    const home = (row[5] ?? "").trim()
    const wasBefore = (row[6] ?? "").trim()

    if (!resp || /^YLC =|^ALC =|^\* =/i.test(resp)) continue

    // Supplementary duty tied to a named HC in the "Was before" column — only if
    // that person has a primary assignment row elsewhere in the sheet.
    if (!pres && !hcRaw && wasBefore) {
      const name = wasBefore.replace(/\s+\d.*$/, "").trim()
      const existing = byName.get(name)
      if (existing?.stewardships?.length) {
        existing.stewardship_notes.push(cleanAssignment(resp.replace(/\n/g, " / ")))
      }
      continue
    }

    // Primary HC assignment row
    if (hcRaw && hcRaw.toLowerCase() !== "new hc") {
      const m = ensure(hcRaw)
      lastAssignedHc = hcRaw
      if (pres) m.presidency_oversight.add(normalizePresidency(pres))
      if (resp) m.stewardships.push(cleanAssignment(resp.replace(/\n/g, " / ")))
      if (committee) m.program_assignment.add(committee)
      m.assigned_wards = buildAssignedWards(ward, home, committee) || m.assigned_wards
      continue
    }

    // Placeholder row still on some sheet versions
    if (hcRaw.toLowerCase() === "new hc") {
      lastAssignedHc = "__NEW_HC__"
      const m = ensure("__NEW_HC__")
      if (pres) m.presidency_oversight.add(normalizePresidency(pres))
      if (resp) m.stewardships.push(cleanAssignment(resp.replace(/\n/g, " / ")))
      if (committee) m.program_assignment.add(committee)
      m.assigned_wards = buildAssignedWards(ward, home, committee)
      continue
    }

    // Orphan lines: building scheduler, communications committee, missionary prep, etc.
    if (!pres && !hcRaw) {
      const note = cleanAssignment(resp.replace(/\n/g, " / "))
      if (/^communications committee$/i.test(note)) {
        let target = ""
        for (const ahead of rows.slice(headerIdx + 1)) {
          const aResp = (ahead[1] ?? "").trim()
          const aHc = (ahead[2] ?? "").trim()
          if (aHc && /sunday school/i.test(aResp)) {
            target = aHc.toLowerCase() === "new hc" ? "__NEW_HC__" : aHc
            break
          }
        }
        if (target) ensure(target).stewardship_notes.push(note)
        else if (lastAssignedHc) ensure(lastAssignedHc).stewardship_notes.push(note)
        continue
      }
      if (/^seminary$/i.test(note)) {
        let target = ""
        for (const ahead of rows.slice(headerIdx + 1)) {
          const aResp = (ahead[1] ?? "").trim()
          const aHc = (ahead[2] ?? "").trim()
          if (aHc && /sunday school/i.test(aResp)) {
            target = aHc.toLowerCase() === "new hc" ? "__NEW_HC__" : aHc
            break
          }
        }
        if (target) ensure(target).stewardship_notes.push(note)
        continue
      }
      if (lastAssignedHc) ensure(lastAssignedHc).stewardship_notes.push(note)
    }
  }

  const out = []
  for (const [key, m] of byName) {
    if (key === "__NEW_HC__") continue
    // Only roster people with a primary assignment row (Assigned High Councilor column).
    if (!m.stewardships.length) continue
    out.push({
      member_name: m.member_name,
      presidency_oversight: [...m.presidency_oversight].join(" · ") || null,
      stewardships: [...new Set(m.stewardships)].join(" / ") || null,
      program_assignment: [...m.program_assignment].join(" / ") || null,
      assigned_wards: m.assigned_wards || null,
      stewardship_notes: [...new Set(m.stewardship_notes)].join(" · ") || null,
    })
  }

  const newHc = byName.get("__NEW_HC__")
  if (newHc) {
    out.push({
      member_name: "__NEW_HC__",
      presidency_oversight: [...newHc.presidency_oversight].join(" · ") || null,
      stewardships: [...new Set(newHc.stewardships)].join(" / ") || null,
      program_assignment: [...newHc.program_assignment].join(" / ") || null,
      assigned_wards: newHc.assigned_wards || null,
      stewardship_notes: [...new Set(newHc.stewardship_notes)].join(" · ") || null,
    })
  }

  return out
}

function presidencyOnlyFromSheet(rows) {
  const headerIdx = rows.findIndex((r) => r[0]?.trim() === "Stake Presidency Member")
  const blocks = []
  let garrett = []
  let williams = []
  let chandler = []

  for (const row of rows.slice(headerIdx + 1)) {
    const pres = (row[0] ?? "").trim()
    const resp = (row[1] ?? "").trim()
    const hc = (row[2] ?? "").trim()
    if (!pres || hc) continue
    if (!resp) continue
    const lines = resp.split(/\n|\/(?!\s)/).map((l) => cleanAssignment(l)).filter(Boolean)
    if (/garrett/i.test(pres)) garrett.push(...lines)
    else if (/williams/i.test(pres) && !/chandler/i.test(pres)) williams.push(...lines)
    else if (/chandler/i.test(pres) && !hc) {
      if (!resp.match(/president|primary|young women|sunday school|young men/i)) chandler.push(...lines)
    }
    if (!pres && resp && !hc) {
      if (/ward baptisms/i.test(resp)) chandler.push(cleanAssignment(resp))
    }
  }

  if (garrett.length) blocks.push({ title: "President Garrett — presidency stewardship", lines: [...new Set(garrett)] })
  if (williams.length) blocks.push({ title: "President Williams — presidency stewardship", lines: [...new Set(williams)] })
  if (chandler.length) blocks.push({ title: "President Chandler — presidency stewardship", lines: [...new Set(chandler)] })
  return blocks
}

async function main() {
  const csv = await fetchSheetCsv()
  const rows = parseCsv(csv)
  const target = buildRosterFromSheet(rows)
  const presidencyBlocks = presidencyOnlyFromSheet(rows)

  const { data: stakes } = await admin.from("stakes").select("id").order("created_at").limit(1)
  const stakeId = stakes?.[0]?.id
  if (!stakeId) throw new Error("No stake found")

  const { data: existing } = await admin
    .from("high_council_members")
    .select("id, member_name, email, status, display_order, stewardships")
    .eq("stake_id", stakeId)

  const byName = new Map((existing ?? []).map((m) => [m.member_name.trim().toLowerCase(), m]))
  const sundaySchoolMember = (existing ?? []).find(
    (m) =>
      /sunday school/i.test(m.stewardships ?? "") ||
      m.member_name.trim().toLowerCase() === "cameron hoffman"
  )

  let maxOrder = Math.max(0, ...(existing ?? []).map((m) => m.display_order ?? 0))

  console.log(`\n=== HC roster sync (${dryRun ? "DRY RUN" : "LIVE"}) ===\n`)
  console.log("Presidency-only blocks:")
  for (const b of presidencyBlocks) {
    console.log(`  ${b.title}`)
    for (const l of b.lines) console.log(`    - ${l}`)
  }
  console.log("")

  const matchedIds = new Set()

  for (const row of target) {
    let match =
      row.member_name === "__NEW_HC__"
        ? sundaySchoolMember
        : byName.get(row.member_name.toLowerCase())

    const payload = {
      presidency_oversight: row.presidency_oversight,
      stewardships: row.stewardships,
      program_assignment: row.program_assignment,
      assigned_wards: row.assigned_wards,
      stewardship_notes: row.stewardship_notes,
      status: "active",
    }

    if (match) {
      matchedIds.add(match.id)
      console.log(`UPDATE ${match.member_name}`)
      console.log(JSON.stringify(payload, null, 2))
      if (!dryRun) {
        const { error } = await admin.from("high_council_members").update(payload).eq("id", match.id)
        if (error) throw new Error(`Update ${match.member_name}: ${error.message}`)
      }
    } else {
      maxOrder += 1
      console.log(`INSERT ${row.member_name}`)
      console.log(JSON.stringify({ ...payload, display_order: maxOrder }, null, 2))
      if (!dryRun) {
        const { error } = await admin.from("high_council_members").insert({
          member_name: row.member_name,
          stake_id: stakeId,
          display_order: maxOrder,
          called_date: new Date().toISOString().split("T")[0],
          ...payload,
        })
        if (error) throw new Error(`Insert ${row.member_name}: ${error.message}`)
      }
    }
    console.log("")
  }

  // Release active members not present in sheet (except intentional placeholders)
  for (const m of existing ?? []) {
    if (m.status !== "active" || matchedIds.has(m.id)) continue
    console.log(`RELEASE (not in sheet): ${m.member_name}`)
    if (!dryRun) {
      await admin
        .from("high_council_members")
        .update({ status: "released", released_date: new Date().toISOString().split("T")[0] })
        .eq("id", m.id)
    }
  }

  console.log(dryRun ? "\nDry run complete — no database changes." : "\nSync complete.")
  return presidencyBlocks
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
