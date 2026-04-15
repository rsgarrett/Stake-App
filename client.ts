import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // createBrowserClient automatically handles cookies
  // The middleware will adjust cookie settings for localhost
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

