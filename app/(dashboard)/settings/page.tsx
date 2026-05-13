"use client"

import { useState, useEffect } from "react"
import { GoogleSheetsImporter } from "@/components/import/GoogleSheetsImporter"
import { PermissionsRoster } from "@/components/settings/permissions-roster"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { canEditStakePermissionRoster } from "@/lib/settings/stake-office-slugs"

export default function SettingsPage() {
  const [canImport, setCanImport] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        setCanImport(canEditStakePermissionRoster(userData?.role))
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
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">Manage app settings and data</p>
      </div>

      <div className="mb-8">
        <PermissionsRoster />
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
