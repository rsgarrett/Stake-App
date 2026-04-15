"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

const AUDIENCES = [
  { value: "stake", label: "All Stake Members" },
  { value: "ward", label: "Ward Members" },
  { value: "leaders", label: "Stake Leadership Only" },
  { value: "youth", label: "Youth Leaders" },
]

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_audience: "stake",
    priority: "normal" as "normal" | "high",
    expiration_date: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get stake_id
      const { data: userData } = await supabase.from("users").select("stake_id").eq("id", user.id).single()
      let stakeId = userData?.stake_id
      if (!stakeId) {
        const { data: stake } = await supabase.from("stakes").select("id").limit(1).single()
        stakeId = stake?.id
      }
      if (!stakeId) throw new Error("No stake found")

      const { error: insertError } = await supabase.from("announcements").insert({
        title: formData.title,
        content: formData.content,
        target_audience: formData.target_audience,
        priority: formData.priority,
        expires_at: formData.expiration_date || null,
        publish_date: new Date().toISOString(),
        stake_id: stakeId,
        created_by: user.id,
      })
      if (insertError) throw insertError

      router.push("/modules/communication")
    } catch (err: any) {
      setError(err.message || "Failed to create announcement")
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <Link href="/modules/communication" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Communication
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Announcement</h1>
        <p className="mt-2 text-gray-600">Create a stake announcement</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Announcement Details</CardTitle>
          <CardDescription>This will be visible to the selected audience</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-800">{error}</p></div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClass} placeholder="Announcement title" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
              <textarea rows={6} required value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className={inputClass} placeholder="Announcement content..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                <select value={formData.target_audience} onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })} className={inputClass}>
                  {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })} className={inputClass}>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (optional)</label>
              <input type="date" value={formData.expiration_date} onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })} className={inputClass} />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Publishing..." : "Publish Announcement"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/modules/communication")} disabled={loading}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
