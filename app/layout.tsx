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
  themeColor: "#4f46e5",
}

export const metadata: Metadata = {
  title: "Stake President App",
  description: "Comprehensive stake management application",
  manifest: "/manifest.json",
  applicationName: "Stake App",
  appleWebApp: {
    capable: true,
    title: "Stake App",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
