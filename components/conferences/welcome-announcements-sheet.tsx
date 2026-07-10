"use client"

import { useState } from "react"
import { Copy, PencilLine, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ConferenceSession } from "@/types"
import type { ConductingSheetEvent } from "@/lib/conferences/conducting-sheet-event"
import { STAKE_VISION_TEXT } from "@/lib/conferences/conducting-sheet-header-quotes"
import { generateWelcomeScriptDraft } from "@/lib/conferences/welcome-script"

interface WelcomeAnnouncementsSheetProps {
  session: ConferenceSession
  event: ConductingSheetEvent
  formatTime: (time?: string) => string
  resolveSessionDisplayDateIso: (session: ConferenceSession, ev: ConductingSheetEvent | null) => string | null
  formatSessionDateLong: (iso: string) => string
  patchSessionField: (sessionId: string, field: string, value: string | null) => Promise<void>
}

export function WelcomeAnnouncementsSheet({
  session,
  event,
  formatTime,
  resolveSessionDisplayDateIso,
  formatSessionDateLong,
  patchSessionField,
}: WelcomeAnnouncementsSheetProps) {
  const draft = generateWelcomeScriptDraft(event, session)
  const script = session.welcome_script?.trim() ? session.welcome_script : draft
  const isCustom = Boolean(session.welcome_script?.trim())

  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState("")
  const [saving, setSaving] = useState(false)

  const dateIso = resolveSessionDisplayDateIso(session, event)
  const metaParts: string[] = []
  if (dateIso) metaParts.push(formatSessionDateLong(dateIso))
  if (session.start_time) metaParts.push(formatTime(session.start_time))

  const startEditing = () => {
    setEditText(script)
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const next = editText.trim()
      await patchSessionField(session.id, "welcome_script", next === draft.trim() || next === "" ? null : next)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const resetToDraft = async () => {
    if (!window.confirm("Replace your edited script with the auto-generated draft?")) return
    setSaving(true)
    try {
      await patchSessionField(session.id, "welcome_script", null)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article
      className="conducting-sheet-page w-full min-w-0 max-w-full overflow-hidden break-words bg-white p-6 text-slate-900 sm:p-10"
      style={{ pageBreakAfter: "always", breakAfter: "page" }}
    >
      <div className="conducting-doc mx-auto w-full max-w-3xl min-w-0 font-serif">
        <header className="text-center">
          <p className="mx-auto max-w-[36rem] text-[12.5px] italic leading-snug text-slate-600">
            &ldquo;{STAKE_VISION_TEXT}&rdquo;
          </p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Welcome &amp; Announcements
          </p>
          <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
            {session.session_label}
          </h1>
          {metaParts.length > 0 ? <p className="mt-1 text-sm text-slate-700">{metaParts.join(" · ")}</p> : null}
        </header>

        <div className="my-4 h-px bg-slate-400" aria-hidden />

        {editing ? (
          <div className="conducting-no-print">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={Math.max(14, editText.split("\n").length + 4)}
              className="w-full rounded-md border border-slate-300 p-3 font-serif text-[0.95rem] leading-relaxed text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save script"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-[0.95rem] leading-relaxed text-slate-900">
            {script.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </div>
        )}

        {!editing ? (
          <div className="conducting-no-print mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-400">
              {isCustom
                ? "Edited script — updates on other tabs won't change this text."
                : "Auto-drafted from this conference's data (presiding, stand seating, music, announcements). Edit to make it yours."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={startEditing}>
                <PencilLine className="mr-2 h-4 w-4" />
                Edit script
              </Button>
              {isCustom ? (
                <Button variant="outline" size="sm" onClick={() => void resetToDraft()} disabled={saving}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to auto-draft
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(script)
                  window.alert("Welcome script copied to the clipboard.")
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy text
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
