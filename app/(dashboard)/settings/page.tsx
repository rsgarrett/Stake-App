"use client"

import { useState, useEffect } from "react"
import { GoogleSheetsImporter } from "@/components/import/GoogleSheetsImporter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [canImport, setCanImport] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        setCanImport(
          userData?.role === "stake_president" ||
          userData?.role === "counselor" ||
          userData?.role === "clerk"
        )
      }
    }

    getUser()
  }, [supabase])

  const handleExport = () => {
    const table = prompt("Enter table name to export:")
    if (table) {
      window.location.href = `/api/export?table=${table}`
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage app settings and data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {canImport && (
          <div>
            <GoogleSheetsImporter />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Export data to CSV format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Export data from any table in CSV format for backup or analysis.
              </p>
              <Button onClick={handleExport}>Export Data</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
