import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tableName = searchParams.get("table")

    if (!tableName) {
      return NextResponse.json(
        { error: "Table name is required" },
        { status: 400 }
      )
    }

    // Fetch data from table
    const { data, error } = await supabase
      .from(tableName)
      .select("*")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 })
    }

    // Convert to CSV
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header]
          return value === null || value === undefined
            ? ""
            : typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value
        }).join(",")
      ),
    ]

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${tableName}_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Export failed" },
      { status: 500 }
    )
  }
}


