import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  // Debug logging
  const allCookies = cookieStore.getAll()
  const supabaseCookies = allCookies.filter(c => c.name.startsWith("sb-"))
  console.log("[Server Client] Total cookies:", allCookies.length)
  console.log("[Server Client] Supabase cookies:", supabaseCookies.length)
  supabaseCookies.forEach(c => {
    console.log(`[Server Client] Cookie: ${c.name} = ${c.value.substring(0, 30)}...`)
  })

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

