"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

const AVAILABLE_TABLES = [
  "callings",
  "meetings",
  "welfare_cases",
  "missionary_applications",
  "temple_attendance",
  "youth_programs",
  "announcements",
  "events",
  "interviews",
  "special_events",
]

export function GoogleSheetsImporter() {
  const [selectedTable, setSelectedTable] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file || !selectedTable) {
      setResult({
        success: false,
        message: "Please select a file and table",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("table", selectedTable)

      const response = await fetch("/api/import/google-sheets", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `Successfully imported ${data.inserted} records`,
        })
        setFile(null)
      } else {
        setResult({
          success: false,
          message: data.error || "Import failed",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Import failed",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from Google Sheets</CardTitle>
        <CardDescription>
          Upload a CSV file exported from Google Sheets to import data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Table
          </label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{englishMenuTitleCase("Choose a table...")}</option>
            {AVAILABLE_TABLES.map((table) => (
              <option key={table} value={table}>
                {englishMenuTitleCase(table.replace(/_/g, " "))}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {result && (
          <div
            className={`p-3 rounded-md ${
              result.success
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {result.message}
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={loading || !file || !selectedTable}
          className="w-full"
        >
          {loading ? "Importing..." : "Import Data"}
        </Button>
      </CardContent>
    </Card>
  )
}


