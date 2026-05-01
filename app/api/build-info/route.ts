import { NextResponse } from "next/server"

/** Diagnostics: confirms which Git commit Production built (helps debug stale mobile caches). */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA
  const ref = process.env.VERCEL_GIT_COMMIT_REF
  const env = process.env.VERCEL_ENV ?? "unknown"

  return NextResponse.json(
    {
      commit: commit ?? null,
      ref: ref ?? null,
      env,
      hasCommit: Boolean(commit),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  )
}
