import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value ?? null
        },
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          const isLocalhost = request.nextUrl.hostname === "localhost"
          
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          
          // Create new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Set cookies with localhost-friendly options
          cookiesToSet.forEach(({ name, value, options }) => {
            // Adjust cookie options for localhost
            const cookieOptions = { ...options }
            if (isLocalhost) {
              // On localhost, use Lax instead of None (None requires Secure)
              if (cookieOptions.sameSite === "none") {
                cookieOptions.sameSite = "lax"
              }
              // Don't use Secure on localhost (http://)
              cookieOptions.secure = false
            }
            
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

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

