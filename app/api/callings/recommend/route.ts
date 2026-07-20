import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PublicRecommendPayload, RecommendCallingType } from "@/lib/callings/recommend-links"
import { RECOMMEND_WARDS } from "@/lib/callings/recommend-links"

const ALLOWED_TYPES: RecommendCallingType[] = ["Calling", "Assignment", "MP"]

function clean(s: unknown, max = 500): string {
  return String(s ?? "")
    .trim()
    .slice(0, max)
}

/**
 * Public bishop/ward recommendation → pending row on the calling tracker.
 * Uses the service role because recommenders often have no app seat/login.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PublicRecommendPayload

    // Honeypot for bots
    if (clean(body.company_website)) {
      return NextResponse.json({ success: true })
    }

    const person_name = clean(body.person_name, 200)
    const submitter_name = clean(body.submitter_name, 200)
    const calling_name = clean(body.calling_name, 200)
    const ward = clean(body.ward, 40)
    const type = clean(body.type, 40) as RecommendCallingType
    const organization = clean(body.organization, 120) || null
    const current_calling = clean(body.current_calling, 200) || null
    const replaces_person_name = clean(body.replaces_person_name, 200) || null
    const extraNotes = clean(body.notes, 4000) || null

    if (!person_name || !submitter_name || !calling_name || !ward) {
      return NextResponse.json(
        { error: "Person name, your name, ward, and calling are required." },
        { status: 400 }
      )
    }
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid recommendation type." }, { status: 400 })
    }
    if (!(RECOMMEND_WARDS as readonly string[]).includes(ward) && ward !== "Stake") {
      return NextResponse.json({ error: "Please choose a valid ward." }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: stake } = await admin.from("stakes").select("id").order("created_at").limit(1).maybeSingle()
    if (!stake?.id) {
      return NextResponse.json({ error: "Stake is not configured." }, { status: 500 })
    }

    const notes = [
      `Bishop / ward recommendation from: ${submitter_name}`,
      current_calling ? `Current calling: ${current_calling}` : "",
      extraNotes || "",
    ]
      .filter(Boolean)
      .join("\n")

    const { data, error } = await admin
      .from("callings")
      .insert({
        type,
        person_name,
        ward,
        calling_name,
        organization,
        replaces_person_name,
        notes: notes || null,
        stake_id: stake.id,
        status: "pending",
        submitted_by: null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("public recommend insert:", error)
      return NextResponse.json({ error: error.message || "Could not save recommendation." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      message: "Thank you. The stake presidency will review this name in the calling tracker.",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error"
    console.error("public recommend:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
