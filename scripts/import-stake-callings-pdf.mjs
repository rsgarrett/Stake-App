/**
 * Import filled callings from an LCR "Organizations and Callings" PDF into
 * stake_calling_holders. Skips High Priests Quorum and Stake President.
 *
 * Usage: node scripts/import-stake-callings-pdf.mjs "/path/to/Stake callings.pdf"
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { execFileSync } from "child_process"

const pdfPath = process.argv[2] || "/Users/GarrettRS/Downloads/Stake callings.pdf"
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim()
const admin = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"))

const SKIP_ORGS = new Set(["High Priests Quorum", "Other Callings"])
const ORG_HEADERS = new Set([
  "Stake Presidency", "High Council", "Patriarch", "Stake Relief Society",
  "Stake Young Men", "Stake Young Women", "Stake Sunday School", "Stake Primary",
  "Young Single Adult", "Single Adult", "Stake Temple and Family History",
  "Other Callings", "Activities and Sports", "Auditing", "Church Communication",
  "Church Service Missionaries", "Facilities", "For the Strength of Youth",
  "History", "Military Relations", "Music", "Seminary and Institute",
  "Technology", "Welfare and Self-Reliance", "Additional Callings",
  "High Priests Quorum",
])

/** LCR title → app title (null = skip). */
const CALLING_ALIASES = {
  "Stake High Councilor": "High Councilor",
  "Stake Presidency First Counselor": "First Counselor in the Stake Presidency",
  "Stake Presidency Second Counselor": "Second Counselor in the Stake Presidency",
  "Stake Assistant Clerk": "Assistant Stake Clerk",
  "Stake Assistant Clerk--Membership": "Assistant Stake Clerk — Membership",
  "Stake Assistant Clerk--Finance": "Assistant Stake Clerk — Finance",
  "Stake Assistant Executive Secretary": "Assistant Stake Executive Secretary",
  "Stake President": null,
}

/**
 * Known LCR calling titles (longest first). Built from the stake PDF + vacant rows.
 * Matching uses longest-prefix so names don't get swallowed into the title.
 */
const CALLING_TITLES = [
  "Stake Trek - On-Trek Activities Committee Chairperson",
  "Stake Trek -Families Committee Chair",
  "Stake Trek - On-Site Activities Committee Chairperson",
  "Stake Trek / Logistics Committee Chair",
  "2025 Youth Conference Sub-Committee Chairperson",
  "Stake Recreation Camp Manager and Scheduler",
  "Stake Temple and Family History Consultant",
  "Stake Welfare and Self-Reliance Specialist",
  "Stake Y.W. Camp - Craft Committe Chariperson",
  "Stake Y.W. Camp - Food Committe Chairperson",
  "Stake Activities Assistant Director",
  "Stake Activities Committee Chairman",
  "Stake Trek - Activities Chairperson",
  "Young Single Adult Committee Member",
  "Young Women Assistant Camp Director",
  "Assistant Stake Y.W. Camp Director",
  "Stake Physical Activities Director",
  "Stake Sports Officials Coordinator",
  "Stake Trek - Logistics Chairperson",
  "Young Single Adult Committee Chair",
  "2025 Youth Conference Chairperson",
  "Assistant Stake Sports Specialist",
  "Young Men Assistant Camp Director",
  "Assistant Communication Director",
  "S&I Succeed in School Instructor",
  "S&I Succeed in School Supervisor",
  "Stake Interpretation Coordinator",
  "Stake Young Single Adult Adviser",
  "Stake Young Single Adult Representative",
  "Self-Reliance Group Facilitator",
  "Stake Recreation Camp Scheduler",
  "Stake Recreation Camp Service Missionary",
  "FSY Conferences Representative",
  "Stake Communication Specialist",
  "Military Relations Specialist",
  "Stake Building Representative",
  "Stake Recreation Camp Manager",
  "Stake Trek - Food Chairperson",
  "Senior Missionary Specialist",
  "Stake Cultural Arts Director",
  "Stake Service Mission Specialist",
  "Stake Scheduler--Building 1",
  "Stake Scheduler--Building 2",
  "Stake Valiant Activity Leader (Boys)",
  "Stake Valiant Activity Leader (Girls)",
  "Disability Activity Leader",
  "Stake Education Specialist",
  "Stake Single Adult Adviser",
  "Stake Single Adult Representative",
  "Stake Activities Director",
  "Stake Activities Committee",
  "Stake Building Specialist",
  "Young Women Camp Director",
  "Communication Specialist",
  "Stake Y.W. Camp Director",
  "Stake Young Women Historian",
  "Young Men Camp Director",
  "Communication Director",
  "Stake Music Specialist",
  "Stake Music Coordinator",
  "Stake Music Library Coordinator",
  "Stake Music Adviser",
  "Stake Sports Official",
  "Stake Sports Specialist",
  "Institute Supervisor",
  "Institute Teacher",
  "Seminary Supervisor",
  "Seminary Teacher",
  "SC Institute Supervisor",
  "Stake Seminary Council Representative",
  "Stake CS Missionary",
  "Stake Disability Specialist",
  "History Specialist",
  "Family Specialist",
  "Stake Interpreter",
  "Stake Trek Master",
  "Technology Specialist",
  "JustServe Specialist",
  "Audit Committee Chairman",
  "Audit Committee Member",
  "Auditor",
  "Patriarch",
  "Stake High Councilor",
  "Stake President",
  "Stake Presidency First Counselor",
  "Stake Presidency Second Counselor",
  "Stake Clerk",
  "Stake Assistant Clerk--Membership",
  "Stake Assistant Clerk--Finance",
  "Stake Assistant Clerk",
  "Stake Executive Secretary",
  "Stake Assistant Executive Secretary",
  "Stake Relief Society President",
  "Stake Relief Society First Counselor",
  "Stake Relief Society Second Counselor",
  "Stake Relief Society Secretary",
  "Assistant Stake Relief Society Secretary",
  "Stake Young Men President",
  "Stake Young Men First Counselor",
  "Stake Young Men Second Counselor",
  "Stake Young Men Secretary",
  "Stake Young Women President",
  "Stake Young Women First Counselor",
  "Stake Young Women Second Counselor",
  "Stake Young Women Secretary",
  "Stake Sunday School President",
  "Stake Sunday School First Counselor",
  "Stake Sunday School Second Counselor",
  "Stake Sunday School Secretary",
  "Stake Primary President",
  "Stake Primary First Counselor",
  "Stake Primary Second Counselor",
  "Stake Primary Secretary",
  "Stake Primary Music Leader",
  "Baptism Clothing",
  "FSY Instructor",
  "Mini-MTC Chairperson",
  "Stake Baptism Scheduler",
  "Stake Communication Chair",
  "Stake Education Mentor",
  "Stake FSY Leader",
  "FamilySearch Center Coordinator",
].sort((a, b) => b.length - a.length)

const DATE_RE = /(\d{1,2} [A-Z][a-z]{2} \d{4})/
const WARD_RE = /(Clearfield \d+(?:st|nd|rd|th) Ward)\s*$/i

function normalizeCalling(raw) {
  const cleaned = raw.replace(/^\*\s*/, "").replace(/\s+/g, " ").trim()
  if (cleaned in CALLING_ALIASES) return CALLING_ALIASES[cleaned]
  return cleaned
}

function lcrNameToDisplay(lastFirst) {
  // "Arave, Mike" or "Monroy Palacios, Daniel"
  const i = lastFirst.indexOf(",")
  if (i < 0) return lastFirst.trim()
  const last = lastFirst.slice(0, i).trim()
  const rest = lastFirst.slice(i + 1).trim()
  return `${rest} ${last}`.replace(/\s+/g, " ").trim()
}

function wardShort(ward) {
  const m = ward?.match(/Clearfield\s+(\d+(?:st|nd|rd|th))/i)
  return m ? m[1] : ward?.replace(/\s*Ward\s*$/i, "") ?? null
}

function parseLcrDate(s) {
  const m = s.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/)
  if (!m) return null
  const months = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  }
  const mo = months[m[2]]
  if (!mo) return null
  return `${m[3]}-${mo}-${m[1].padStart(2, "0")}`
}

function matchCallingTitle(beforeDate) {
  const s = beforeDate.replace(/^\*\s*/, "").trim()
  for (const title of CALLING_TITLES) {
    if (s === title) return { title, namePart: "" }
    if (s.startsWith(title + " ")) {
      return { title, namePart: s.slice(title.length).trim() }
    }
  }
  return null
}

function parsePdfText(text) {
  let org = null
  let skip = false
  const rows = []
  const unmatched = []

  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\u00a0/g, " ").trim()
    if (!line) continue
    if (/^===== PAGE/.test(line)) continue
    if (/^Organizations and Callings/.test(line)) continue
    if (/^For Church Use Only/.test(line)) continue
    if (/^\d+ Aug \d{4}/.test(line)) continue
    if (/^Calling Name Sustained/.test(line)) continue
    if (/^Count:\s*\d+/.test(line)) continue
    if (/^\* custom calling/i.test(line)) continue
    if (/^Clearfield Utah North Stake$/.test(line)) continue

    if (ORG_HEADERS.has(line)) {
      org = line
      skip = SKIP_ORGS.has(line) || line === "High Priests Quorum"
      continue
    }

    if (skip) continue
    if (!org || org === "Other Callings") continue
    if (/Calling Vacant/i.test(line)) continue

    const wardMatch = line.match(WARD_RE)
    const ward = wardMatch ? wardMatch[1] : null
    let work = wardMatch ? line.slice(0, wardMatch.index).trim() : line
    work = work.replace(/\s*✓\s*$/, "").trim()

    const dateMatch = work.match(DATE_RE)
    if (!dateMatch) continue
    // Allow missing space before date: "Lynn20 Mar 2022"
    const beforeDate = work.slice(0, dateMatch.index).replace(/([A-Za-z])$/, "$1").trim()

    const matched = matchCallingTitle(beforeDate)
    if (!matched || !matched.namePart) {
      unmatched.push(beforeDate)
      continue
    }

    const calling = normalizeCalling(matched.title)
    if (!calling) continue
    if (!matched.namePart.includes(",")) {
      unmatched.push(beforeDate)
      continue
    }

    rows.push({
      organization: org,
      calling_name: calling,
      person_name: lcrNameToDisplay(matched.namePart),
      ward: wardShort(ward),
      called_date: parseLcrDate(dateMatch[1]),
    })
  }

  if (unmatched.length) {
    console.log(`\nUnmatched filled rows (${unmatched.length}):`)
    for (const u of unmatched.slice(0, 30)) console.log("  ?", u)
  }
  return rows
}

function extractText(path) {
  if (path.endsWith(".txt") && existsSync(path)) return readFileSync(path, "utf8")
  const out = "/tmp/stake-callings.txt"
  const py = `
from pypdf import PdfReader
reader = PdfReader(${JSON.stringify(path)})
text = "\\n".join((p.extract_text() or "") for p in reader.pages)
open(${JSON.stringify(out)}, "w").write(text)
print(len(text))
`
  execFileSync("python3", ["-c", py], { stdio: "inherit" })
  return readFileSync(out, "utf8")
}

async function main() {
  const text = extractText(pdfPath)
  const rows = parsePdfText(text)
  console.log(`\nParsed ${rows.length} filled callings (High Priests Quorum & Stake President excluded)`)

  const byCalling = new Map()
  for (const r of rows) {
    const list = byCalling.get(r.calling_name) ?? []
    list.push(r.person_name)
    byCalling.set(r.calling_name, list)
  }
  for (const [c, people] of [...byCalling.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${c} (${people.length}): ${people.join("; ")}`)
  }

  writeFileSync("/tmp/stake-callings-parsed.json", JSON.stringify(rows, null, 2))

  const { data: stakes, error: stakeErr } = await admin.from("stakes").select("id").limit(1)
  if (stakeErr || !stakes?.[0]) throw new Error(stakeErr?.message || "No stake found")
  const stakeId = stakes[0].id

  const today = new Date().toISOString().slice(0, 10)
  const { error: relErr } = await admin
    .from("stake_calling_holders")
    .update({ status: "released", released_date: today, updated_at: new Date().toISOString() })
    .eq("stake_id", stakeId)
    .eq("status", "active")
  if (relErr) throw relErr

  const payload = rows.map((r) => ({
    stake_id: stakeId,
    organization: r.organization,
    calling_name: r.calling_name,
    person_name: r.person_name,
    ward: r.ward,
    status: "active",
    called_date: r.called_date,
  }))

  for (let i = 0; i < payload.length; i += 50) {
    const { error } = await admin.from("stake_calling_holders").insert(payload.slice(i, i + 50))
    if (error) throw error
  }

  const { count } = await admin
    .from("stake_calling_holders")
    .select("id", { count: "exact", head: true })
    .eq("stake_id", stakeId)
    .eq("status", "active")
  console.log(`\nImported. Active holders now: ${count}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
