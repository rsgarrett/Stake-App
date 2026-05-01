/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /** Ensure Supabase URLs are wired into bundles when Vercel injects Dashboard env during `next build`. */
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    /** Shown in dashboard footer on Vercel — proves which commit the browser bundle came from. */
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "",
  },

  // PWA configuration
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
