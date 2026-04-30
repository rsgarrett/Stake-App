import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isHttpDevHost } from "@/lib/http-dev-host"

export async function updateSession(request: NextRequest) {
  // Prefer NEXT_PUBLIC_* (matches browser client). Also accept non-public names — some teams
  // duplicate these in Vercel if Edge reads them more reliably than NEXT_PUBLIC_* alone.
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[middleware] Missing Supabase URL/anon key (need NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_URL + SUPABASE_ANON_KEY)"
    )
    return new NextResponse(
      "Missing Supabase env on Vercel. Open this project → Settings → Environment Variables. Add for Production:\n\n" +
        "NEXT_PUBLIC_SUPABASE_URL = (from Supabase → Project Settings → API → Project URL)\n" +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY = (anon / public API key)\n\n" +
        "Enable Production on both, Save, then Deployments → Redeploy.",
      { status: 503 }
    )
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        const { hostname, protocol } = request.nextUrl
        const relaxCookies = isHttpDevHost(hostname, protocol)

        // Do not call request.cookies.set — it throws on Vercel Edge (immutable request).
        // Only set cookies and cache headers on the response (Supabase SSR pattern).
        supabaseResponse = NextResponse.next({
          request,
        })

        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = { ...options }
          if (relaxCookies) {
            if (cookieOptions.sameSite === "none") {
              cookieOptions.sameSite = "lax"
            }
            cookieOptions.secure = false
          }

          supabaseResponse.cookies.set(name, value, cookieOptions)
        })

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value)
        })
      },
    },
  })

  // getUser() validates the JWT with Supabase and refreshes expired access tokens.
  // getSession() only reads cookies and does NOT refresh — after ~1h idle you appear logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/auth/callback")
  ) {
    // If user is already logged in and trying to access login/register, redirect to dashboard
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = "/modules/leadership"
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Allow API routes without authentication (they handle their own auth)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return supabaseResponse
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser to loop on requests
  // and the authentication will stop working.

  return supabaseResponse
}

