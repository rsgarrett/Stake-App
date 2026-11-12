"use client"

import { Suspense, useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AgendaReturnBar } from "@/components/layout/agenda-return-bar"

/**
 * Pixels at the bottom of the screen covered by the on-screen keyboard.
 * iPad/iPhone keyboards overlay the page without resizing it, so the end of a
 * long form (its Submit button) would otherwise sit underneath the keyboard.
 */
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => {
      // Pinch-zoom also shrinks the visual viewport; that is not a keyboard.
      if (viewport.scale > 1.01) {
        setInset(0)
        return
      }
      const pageHeight = Math.max(window.innerHeight, document.documentElement.clientHeight)
      const covered = Math.round(pageHeight - viewport.height)
      setInset(covered > 40 ? covered : 0)
    }
    update()
    viewport.addEventListener("resize", update)
    return () => viewport.removeEventListener("resize", update)
  }, [])

  return inset
}

/** Desktop: fixed sidebar + content. Narrow viewports: hamburger toggles drawer (full-width content). */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const keyboardInset = useKeyboardInset()

  useEffect(() => {
    document.body.style.overflow = mobileDrawerOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileDrawerOpen])

  const closeDrawer = () => setMobileDrawerOpen(false)
  const toggleDrawer = () => setMobileDrawerOpen((o) => !o)

  return (
    <div className="app-shell flex h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden bg-gray-50">
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

      <div className="app-shell-content flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={toggleDrawer} />
        <Suspense fallback={null}>
          <AgendaReturnBar />
        </Suspense>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain pb-[env(safe-area-inset-bottom)] [-webkit-overflow-scrolling:touch] [&>*]:min-w-0 [&>*]:max-w-full">
          {children}
          {/* Extra scroll room so the end of the page can be brought above the keyboard. */}
          {keyboardInset ? <div aria-hidden className="shrink-0" style={{ height: keyboardInset }} /> : null}
        </main>
      </div>
    </div>
  )
}
