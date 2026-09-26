"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy path — bishopric training lives at /modules/training/bishopric */
export default function BishopTrainingRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/modules/training/bishopric")
  }, [router])
  return (
    <div className="p-6 text-center text-gray-600">
      Redirecting to Bishopric training…
    </div>
  )
}
