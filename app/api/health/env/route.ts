import { NextResponse } from "next/server"

/** Node runtime: confirms Dashboard env reaches serverless build (middleware uses Edge separately). */
export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({
    has_NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    has_NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
    has_SUPABASE_URL: !!process.env.SUPABASE_URL?.trim(),
    has_SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY?.trim(),
  })
}
