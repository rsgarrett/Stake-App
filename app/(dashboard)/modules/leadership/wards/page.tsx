"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WardsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/modules/leadership")
  }, [router])

  return null
}
