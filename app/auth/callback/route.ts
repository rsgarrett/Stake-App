import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isHttpDevHost } from "@/lib/http-dev-host"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/modules/leadership"
  const relaxCookies = isHttpDevHost(requestUrl.hostname, requestUrl.protocol)

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet, _headers) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const merged = { ...options }
              if (relaxCookies) {
                if (merged.sameSite === "none") merged.sameSite = "lax"
                merged.secure = false
              }
              cookieStore.set(name, value, merged)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
