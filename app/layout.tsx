import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

/** Avoid static prerender of client pages that call createClient() before Supabase env exists at build time. */
export const dynamic = "force-dynamic"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "Stake President App",
  description: "Comprehensive stake management application",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
