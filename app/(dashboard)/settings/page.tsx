"use client"

import { useState, useEffect } from "react"
import { GoogleSheetsImporter } from "@/components/import/GoogleSheetsImporter"
import { PermissionsRoster } from "@/components/settings/permissions-roster"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { canEditStakePermissionRoster } from "@/lib/settings/stake-office-slugs"
import { EXPORTABLE_TABLES } from "@/lib/export/exportable-tables"

export default function SettingsPage() {
  const [canImport, setCanImport] = useState(false)
  const [exportTable, setExportTable] = useState<string>(EXPORTABLE_TABLES[0].table)
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
    window.location.href = `/api/export?table=${encodeURIComponent(exportTable)}`
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

        {canImport && (
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Export stake data to CSV format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Choose the data to export as a CSV file for backup or analysis.
                </p>
                <select
                  value={exportTable}
                  onChange={(e) => setExportTable(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  {EXPORTABLE_TABLES.map((t) => (
                    <option key={t.table} value={t.table}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Button onClick={handleExport}>Export CSV</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
