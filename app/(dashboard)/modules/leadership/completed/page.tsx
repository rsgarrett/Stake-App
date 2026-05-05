"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { safeQuery } from "@/lib/utils/safe-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Search, Edit, Trash2, CheckCircle2 } from "lucide-react"

interface Calling {
  id: string
  person_name: string
  ward: string | null
  calling_name: string
  organization: string | null
  set_apart_date: string | null
  sustained_date: string | null
  status: string
  created_at: string
}

export default function CompletedCallingsPage() {
  const [callings, setCallings] = useState<Calling[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await safeQuery(
      supabase
        .from("callings")
        .select("*")
        .not("set_apart_date", "is", null)
        .order("set_apart_date", { ascending: false })
    )
    setCallings(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteCalling = async (c: Calling) => {
    if (!confirm(`Remove ${c.person_name} — ${c.calling_name}?`)) return
    const { data, error } = await supabase.from("callings").delete().eq("id", c.id).select()
    if (error) {
      alert("Error: " + error.message)
      return
    }
    if (!data || data.length === 0) {
      alert("Delete blocked — you may not have permission.")
      return
    }
    await load()
  }

  const filtered = callings.filter((c) => {
    if (!searchTerm) return true
    const t = searchTerm.toLowerCase()
    return (
      c.person_name.toLowerCase().includes(t) ||
      c.calling_name.toLowerCase().includes(t) ||
      (c.ward || "").toLowerCase().includes(t) ||
      (c.organization || "").toLowerCase().includes(t)
    )
  })

  if (loading) return <div className="p-6 text-center py-12 text-gray-500">Loading...</div>

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Link href="/modules/leadership" className="inline-flex items-center text-sm text-indigo-600 hover:underline mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Calling Tracker
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Completed Callings</h1>
        <p className="mt-1 text-gray-600">{callings.length} callings have been fully processed</p>
      </div>

      <div className="mb-5 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, calling, ward..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Completed</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{filtered.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No completed callings found</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {filtered.map((c) => (
                <div key={c.id} className="py-3 flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.person_name}</p>
                    <p className="text-xs text-gray-500">{c.calling_name}{c.ward ? ` · ${c.ward}` : ""}{c.organization ? ` · ${c.organization}` : ""}</p>
                  </div>
                  {c.set_apart_date && (
                    <span className="text-xs text-gray-400 shrink-0">Set apart {c.set_apart_date}</span>
                  )}
                  <Link href={`/modules/leadership/edit/${c.id}`} className="text-gray-300 hover:text-indigo-600 shrink-0">
                    <Edit className="h-3.5 w-3.5" />
                  </Link>
                  <button onClick={() => deleteCalling(c)} className="text-gray-300 hover:text-red-500 shrink-0" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
