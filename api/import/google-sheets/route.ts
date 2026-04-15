import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/utils/audit"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has elevated role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userData || !["stake_president", "counselor", "clerk"].includes(userData.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const tableName = formData.get("table") as string

    if (!file || !tableName) {
      return NextResponse.json(
        { error: "File and table name are required" },
        { status: 400 }
      )
    }

    // Read CSV file
    const text = await file.text()
    const lines = text.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())

    // Parse CSV rows
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim())
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || null
      })
      return row
    })

    // Insert data into Supabase
    const { data, error } = await supabase
      .from(tableName)
      .insert(rows)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit event
    await logAuditEvent({
      table_name: tableName,
      record_id: "bulk_import",
      action: "INSERT",
      new_data: { count: rows.length },
    })

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    )
  }
}


