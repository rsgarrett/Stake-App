"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { clearAgendaReturn, getAgendaReturn, setAgendaReturn } from "@/lib/navigation/agenda-return"

function isSamePath(
  returnTo: string,
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  const [returnPath, returnQuery = ""] = returnTo.split("?")
  if (pathname !== returnPath) return false
  if (!returnQuery) return true
  const expected = new URLSearchParams(returnQuery)
  for (const [key, value] of expected.entries()) {
    if (searchParams.get(key) !== value) return false
  }
  return true
}

/** Sticky bar shown anywhere in the dashboard after opening Callings from a meeting agenda. */
export function AgendaReturnBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [returnTo, setReturnTo] = useState<string | null>(null)

  useEffect(() => {
    const fromQuery = searchParams.get("returnTo")
    if (fromQuery) {
      setAgendaReturn(fromQuery)
      setReturnTo(fromQuery)
      return
    }
    setReturnTo(getAgendaReturn())
  }, [pathname, searchParams])

  if (!returnTo || isSamePath(returnTo, pathname, searchParams)) return null

  return (
    <div className="shrink-0 border-b border-indigo-300 bg-indigo-600 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">
          You opened the Calling Tracker from a meeting agenda.
        </p>
        <Link
          href={returnTo}
          onClick={() => clearAgendaReturn()}
          className={`${buttonVariants({ size: "sm", variant: "secondary" })} shrink-0`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to agenda
        </Link>
      </div>
    </div>
  )
}
