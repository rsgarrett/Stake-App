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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log("[Middleware] Path:", request.nextUrl.pathname)
    console.log("[Middleware] User found:", !!user)
    console.log("[Middleware] User email:", user?.email)
    console.log("[Middleware] User error:", userError?.message)
    
    // Log cookies
    const cookies = request.cookies.getAll()
    const supabaseCookies = cookies.filter(c => c.name.startsWith("sb-"))
    console.log("[Middleware] Supabase cookies found:", supabaseCookies.length)
    supabaseCookies.forEach(c => {
      console.log(`[Middleware] Cookie: ${c.name} = ${c.value.substring(0, 20)}...`)
    })
  }

  // Allow access to login and register pages without authentication
  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register")
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

  // TEMPORARILY DISABLED FOR TESTING
  // For all other routes, require authentication
  // if (!user) {
  //   // no user, redirect to login page
  //   if (process.env.NODE_ENV === "development") {
  //     console.log("[Middleware] No user found, redirecting to login")
  //   }
  //   const url = request.nextUrl.clone()
  //   url.pathname = "/login"
  //   return NextResponse.redirect(url)
  // }

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

