import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { callingId } = await req.json()
    if (!callingId) {
      return NextResponse.json({ error: "callingId required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: calling, error: callingError } = await supabase
      .from("callings")
      .select("person_name, calling_name, replaces_person_name, ward, stake_id")
      .eq("id", callingId)
      .single()

    if (callingError || !calling) {
      return NextResponse.json({ error: "Calling not found" }, { status: 404 })
    }

    const { data: roleMap } = await supabase
      .from("calling_role_map")
      .select("app_role")
      .eq("calling_name", calling.calling_name)
      .limit(1)
      .single()

    if (!roleMap) {
      return NextResponse.json({
        message: "No role mapping for this calling — no permission changes made",
        calling_name: calling.calling_name,
      })
    }

    const newRole = roleMap.app_role
    const results: string[] = []

    const { data: newUser } = await supabase
      .from("users")
      .select("id, role, full_name")
      .ilike("full_name", calling.person_name)
      .limit(1)
      .single()

    if (newUser) {
      if (newUser.role !== newRole) {
        await supabase
          .from("users")
          .update({ role: newRole })
          .eq("id", newUser.id)
        results.push(`Granted '${newRole}' to ${calling.person_name}`)
      } else {
        results.push(`${calling.person_name} already has role '${newRole}'`)
      }
    } else {
      results.push(`No user account found for '${calling.person_name}' — they will need to be invited or sign up`)
    }

    if (calling.replaces_person_name) {
      const { data: oldUser } = await supabase
        .from("users")
        .select("id, role, full_name")
        .ilike("full_name", calling.replaces_person_name)
        .limit(1)
        .single()

      if (oldUser) {
        await supabase
          .from("users")
          .update({ role: "viewer" })
          .eq("id", oldUser.id)
        results.push(`Revoked '${oldUser.role}' from ${calling.replaces_person_name} (now viewer)`)
      } else {
        results.push(`No user account found for replaced person '${calling.replaces_person_name}'`)
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 })
  }
}
