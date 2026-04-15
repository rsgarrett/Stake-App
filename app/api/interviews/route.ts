import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Lightweight encryption for client-side notes
// Using base64 encoding as a simple obfuscation layer
// Real encryption happens at the database/RLS level
function simpleEncrypt(text: string): string {
  if (!text) return text
  return Buffer.from(text, "utf8").toString("base64")
}

function simpleDecrypt(encoded: string): string {
  if (!encoded) return encoded
  try {
    return Buffer.from(encoded, "base64").toString("utf8")
  } catch {
    return encoded // Return as-is if not encoded
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { action } = body

    if (action === "save_note") {
      const { interview_id, note_content } = body
      const encrypted = simpleEncrypt(note_content)
      
      // Check if note already exists
      const { data: existing } = await supabase
        .from("interview_notes")
        .select("id")
        .eq("interview_id", interview_id)
        .limit(1)
        .single()

      if (existing) {
        const { error } = await supabase
          .from("interview_notes")
          .update({ note_content: encrypted })
          .eq("id", existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("interview_notes")
          .insert({ interview_id, note_content: encrypted, created_by: user.id })
        if (error) throw error
      }
      return NextResponse.json({ success: true })
    }

    if (action === "get_note") {
      const { interview_id } = body
      const { data, error } = await supabase
        .from("interview_notes")
        .select("*")
        .eq("interview_id", interview_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") throw error
      if (data) {
        data.note_content = simpleDecrypt(data.note_content)
      }
      return NextResponse.json({ note: data || null })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
