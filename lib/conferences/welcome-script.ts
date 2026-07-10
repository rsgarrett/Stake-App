/**
 * Auto-drafted Welcome & Announcements script for conference sessions.
 *
 * Covers what the conductor does before the meeting begins (Handbook 29.2):
 * welcome, recognition of the presiding authority and those on the stand,
 * appreciation for the musicians, announcements, and the transition into the
 * opening hymn and invocation. The draft is a starting point — the conductor
 * can edit and save their own wording on the Welcome sheet.
 */

import type { ConferenceProgramItem, ConferenceSession } from "@/types"
import { sortProgramItemsByOrder } from "@/lib/conferences/standard-opening-block"
import { RECORDING_NOTICE_TEXT } from "@/lib/conferences/conducting-sheet-header-quotes"

export interface WelcomeScriptEvent {
  title: string
  presiding_authority?: string | null
  theme?: string | null
  stand_seating?: string | null
}

function timeOfDayGreeting(startTime?: string): string {
  if (!startTime) return "good day"
  const hour = parseInt(startTime.split(":")[0] ?? "", 10)
  if (Number.isNaN(hour)) return "good day"
  if (hour < 12) return "good morning"
  if (hour < 17) return "good afternoon"
  return "good evening"
}

function findRow(items: ConferenceProgramItem[], type: string): ConferenceProgramItem | undefined {
  return items.find((i) => i.item_type === type && (i.assigned_to || "").trim())
}

/** "Spencer Lauber (12th)" and "Spencer Lauber" are the same person. */
function samePerson(a?: string | null, b?: string | null): boolean {
  const norm = (s?: string | null) => (s || "").replace(/\([^)]*\)/g, "").trim().toLowerCase()
  const na = norm(a)
  const nb = norm(b)
  return na.length > 0 && na === nb
}

/** "Elder J. Kimo Esplin" → likely a visiting General/Area officer (adds the recording notice). */
function presidingLooksLikeVisitingAuthority(presiding: string): boolean {
  const p = presiding.toLowerCase()
  return p.startsWith("elder ") || p.includes("seventy") || p.includes("authority") || p.includes("bishopric")
}

export function generateWelcomeScriptDraft(
  event: WelcomeScriptEvent,
  session: ConferenceSession
): string {
  const items = sortProgramItemsByOrder(session.program_items || [])
  const greeting = timeOfDayGreeting(session.start_time)
  const sessionName = (session.session_label || "session").trim()
  const paragraphs: string[] = []

  paragraphs.push(
    `Brothers and sisters, ${greeting}, and welcome to the ${sessionName} of the ${event.title.trim()}. We are grateful for each of you and for the spirit you bring as we gather to worship together.`
  )

  const presiding = (event.presiding_authority || "").trim()
  const standLines = (event.stand_seating || "")
    .split(/\r?\n/)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean)
    .filter((line) => !samePerson(line, presiding))
  if (presiding || standLines.length > 0) {
    const parts: string[] = []
    if (presiding) parts.push(`We are honored to have ${presiding} presiding at this session.`)
    if (standLines.length > 0) {
      parts.push(`We also acknowledge those seated on the stand: ${standLines.join("; ")}.`)
    }
    paragraphs.push(parts.join(" "))
  }

  const organist = findRow(items, "organist") ?? findRow(items, "pianist")
  const musicLeader = findRow(items, "music_leader")
  const prelude = findRow(items, "prelude_music")
  const musicParts: string[] = []
  if (organist) {
    musicParts.push(
      `We express appreciation to ${organist.assigned_to} at the ${organist.item_type === "pianist" ? "piano" : "organ"}`
    )
  }
  if (musicLeader) {
    musicParts.push(
      `${organist ? "and to" : "We express appreciation to"} ${musicLeader.assigned_to}, who will lead the music`
    )
  }
  if (musicParts.length > 0) {
    let sentence = `${musicParts.join(" ")}.`
    if (prelude && !samePerson(prelude.assigned_to, organist?.assigned_to)) {
      sentence += ` We are also grateful to ${prelude.assigned_to} for the prelude music.`
    }
    paragraphs.push(sentence)
  }

  if (event.theme?.trim()) {
    paragraphs.push(`The theme of this conference is: "${event.theme.trim()}"`)
  }

  const announcements = (session.announcements || "").trim()
  if (announcements) {
    paragraphs.push(`We share the following announcements:\n${announcements}`)
  } else {
    paragraphs.push(`We share the following announcements:\n(Add announcements on the Sessions tab, or edit this script.)`)
  }

  if (presiding && presidingLooksLikeVisitingAuthority(presiding)) {
    paragraphs.push(RECORDING_NOTICE_TEXT)
  }

  const openingHymn = items.find((i) => i.item_type === "opening_hymn")
  const invocation = findRow(items, "invocation")
  const hymnNumber = openingHymn?.hymn_number?.trim()
  const hymnName = openingHymn?.topic?.trim()
  const closingParts: string[] = []
  if (hymnNumber || hymnName) {
    closingParts.push(
      `We will begin this meeting by singing ${hymnNumber ? `hymn number ${hymnNumber}` : "the opening hymn"}${hymnName ? `, "${hymnName}"` : ""}.`
    )
  } else {
    closingParts.push("We will begin this meeting with the opening hymn.")
  }
  closingParts.push(
    invocation
      ? `Following the hymn, the invocation will be offered by ${invocation.assigned_to}.`
      : "Following the hymn, the invocation will be offered."
  )
  paragraphs.push(closingParts.join(" "))

  return paragraphs.join("\n\n")
}
