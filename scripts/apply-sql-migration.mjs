#!/usr/bin/env node
/**
 * Apply a SQL migration file when DATABASE_URL is available.
 * Usage: DATABASE_URL="postgresql://..." node scripts/apply-sql-migration.mjs supabase/migrations/070_agenda_item_notes.sql
 *
 * Get the connection string from Supabase Dashboard → Project Settings → Database → Connection string (URI).
 */
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"

const file = process.argv[2]
const url = process.env.DATABASE_URL?.trim()

if (!file) {
  console.error("Usage: DATABASE_URL=... node scripts/apply-sql-migration.mjs <path-to.sql>")
  process.exit(1)
}

const sql = readFileSync(file, "utf8")

if (!url) {
  console.error("DATABASE_URL is not set.\n")
  console.error("Paste this in Supabase SQL Editor instead:\n")
  console.error(sql)
  process.exit(2)
}

let pg
try {
  const require = createRequire(import.meta.url)
  pg = require("pg")
} catch {
  console.error("Install pg first: npm install --save-dev pg")
  console.error("\nOr paste this in Supabase SQL Editor:\n")
  console.error(sql)
  process.exit(3)
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query(sql)
  console.log(`Applied ${file}`)
} catch (err) {
  console.error("Migration failed:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
