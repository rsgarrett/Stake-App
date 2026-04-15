import { createClient } from "@/lib/supabase/server"

export interface AuditLogEntry {
  table_name: string
  record_id: string
  action: "INSERT" | "UPDATE" | "DELETE"
  old_data?: any
  new_data?: any
}

export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("audit_logs").insert({
      table_name: entry.table_name,
      record_id: entry.record_id,
      action: entry.action,
      user_id: user?.id,
      old_data: entry.old_data,
      new_data: entry.new_data,
    })
  } catch (error) {
    console.error("Failed to log audit event:", error)
    // Don't throw - audit logging should not break the application
  }
}

export async function getAuditLogs(
  tableName?: string,
  recordId?: string,
  limit: number = 100
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (tableName) {
      query = query.eq("table_name", tableName)
    }

    if (recordId) {
      query = query.eq("record_id", recordId)
    }

    const { data, error } = await query

    if (error) throw error

    return data
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    return []
  }
}


