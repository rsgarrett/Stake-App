"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

/** Desktop: fixed sidebar + content. Narrow viewports: hamburger toggles drawer (full-width content). */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileDrawerOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileDrawerOpen])

  const closeDrawer = () => setMobileDrawerOpen(false)
  const toggleDrawer = () => setMobileDrawerOpen((o) => !o)

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden bg-gray-50 md:h-screen md:max-h-none">
      <div className="hidden h-[100dvh] shrink-0 md:flex md:h-auto">
        <Sidebar />
      </div>

      {mobileDrawerOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={closeDrawer}
          />
          <div className="fixed inset-y-0 left-0 z-50 h-[100dvh] w-[min(280px,88vw)] overflow-hidden shadow-2xl md:hidden">
            <Sidebar onItemSelect={closeDrawer} variant="overlay" />
          </div>
        </>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={toggleDrawer} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
