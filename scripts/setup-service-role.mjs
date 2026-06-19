#!/usr/bin/env node
/**
 * Writes SUPABASE_SERVICE_ROLE_KEY to .env.local and Vercel (production + preview).
 * Usage: node scripts/setup-service-role.mjs "<service_role_jwt>"
 */
import { readFileSync, writeFileSync, existsSync } from "fs"
import { execSync } from "child_process"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
function promptMacDialog() {
  try {
    const out = execSync(
      `osascript -e 'display dialog "Paste your Supabase service_role key (Project Settings → API → service_role → Reveal)." default answer "" with title "Stake App" buttons {"Cancel", "OK"} default button "OK"' -e 'text returned of result'`,
      { encoding: "utf8", shell: "/bin/bash" }
    ).trim()
    return out && out !== "false" ? out : ""
  } catch {
    return ""
  }
}

let key = (process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
if (!key) key = promptMacDialog().trim()

if (!key || key === "your_service_role_key_here" || !key.startsWith("eyJ")) {
  console.error(
    "Need the service_role JWT from https://supabase.com/dashboard/project/gqqbllsbukcipczrdjma/settings/api"
  )
  console.error("Usage: node scripts/setup-service-role.mjs <service_role_jwt>")
  process.exit(1)
}

const envPath = join(root, ".env.local")
let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : ""
if (/^SUPABASE_SERVICE_ROLE_KEY=/m.test(content)) {
  content = content.replace(/^SUPABASE_SERVICE_ROLE_KEY=.*$/m, `SUPABASE_SERVICE_ROLE_KEY=${key}`)
} else {
  content += `${content.endsWith("\n") ? "" : "\n"}SUPABASE_SERVICE_ROLE_KEY=${key}\n`
}
writeFileSync(envPath, content)
console.log("Updated .env.local")

const vercelTargets = [
  { env: "production" },
  { env: "preview", branch: "main" },
  { env: "development" },
]
for (const { env, branch } of vercelTargets) {
  try {
    const rmArgs = branch
      ? `npx vercel env rm SUPABASE_SERVICE_ROLE_KEY ${env} ${branch} --yes`
      : `npx vercel env rm SUPABASE_SERVICE_ROLE_KEY ${env} --yes`
    execSync(rmArgs, { cwd: root, stdio: "pipe" })
  } catch {
    /* not set yet */
  }
  const addArgs = branch
    ? `npx vercel env add SUPABASE_SERVICE_ROLE_KEY ${env} ${branch} --value '${key.replace(/'/g, "'\\''")}' --yes`
    : `npx vercel env add SUPABASE_SERVICE_ROLE_KEY ${env} --value '${key.replace(/'/g, "'\\''")}' --yes`
  execSync(addArgs, { cwd: root, stdio: "inherit", shell: "/bin/bash" })
  console.log(`Vercel ${env}${branch ? ` (${branch})` : ""}: SUPABASE_SERVICE_ROLE_KEY set`)
}

console.log("Done. Run: npx vercel --prod --yes  (to redeploy)")
