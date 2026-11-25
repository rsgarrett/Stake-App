/**
 * Builds a Word (.docx) copy of the welcome + conducting sheets.
 *
 * IMPORTANT: this file pulls in the `docx` library, which must only load in the
 * browser. Never import it at the top of a component — load it on demand with
 * `await import("@/lib/conferences/build-conducting-docx")` inside a click handler.
 *
 * The document is deliberately plain so it is easy to change in Word: every
 * line is an ordinary paragraph ("Label:" + Tab + text, no tables or text
 * boxes), and each kind of line uses a named style, so changing a style in
 * Word restyles every sheet at once.
 */

import { AlignmentType, BorderStyle, Document, Packer, Paragraph, Tab, TextRun } from "docx"
import type { ConferenceProgramItem, ConferenceSession } from "@/types"
import type { ConductingSheetEvent } from "@/lib/conferences/conducting-sheet-event"
import { STAKE_VISION_TEXT } from "@/lib/conferences/conducting-sheet-header-quotes"
import { programItemAllowsDuration } from "@/lib/conferences/program-item-duration"
import { programItemFieldConfig } from "@/lib/conferences/program-item-fields"
import { PROGRAM_ITEM_LABELS } from "@/lib/conferences/program-item-labels"
import { isStandardOpeningItemType, sortProgramItemsByOrder } from "@/lib/conferences/standard-opening-block"
import { generateWelcomeScriptDraft } from "@/lib/conferences/welcome-script"

export interface ConductingDocxInput {
  event: ConductingSheetEvent
  /** Sessions that get sheets (leadership / adult / general), in display order. */
  sessions: ConferenceSession[]
  formatTime: (time?: string) => string
  resolveSessionDisplayDateIso: (session: ConferenceSession, ev: ConductingSheetEvent | null) => string | null
  formatSessionDateLong: (iso: string) => string
  formatEventDateRange: (start: string, end: string) => string
}

const FONT = "Times New Roman"
const TWIPS_PER_INCH = 1440
/** Where the text after "Label:" starts, measured from the left margin. */
const LABEL_COLUMN = Math.round(2.25 * TWIPS_PER_INCH)

const STYLE = {
  quote: "SheetQuote",
  kicker: "SheetKicker",
  title: "SheetTitle",
  meta: "SheetMeta",
  rule: "SheetRule",
  line: "ProgramLine",
  detail: "ProgramDetail",
  note: "ProgramNote",
  script: "WelcomeScript",
} as const

function rule(): Paragraph {
  return new Paragraph({ style: STYLE.rule })
}

/** "Label:" in bold, a tab, then the text. Wrapped text lines up under the text, not the label. */
function labelLine(label: string, content: TextRun[]): Paragraph {
  return new Paragraph({
    style: STYLE.line,
    children: [new TextRun({ text: `${label}:`, bold: true }), new TextRun({ children: [new Tab()] }), ...content],
  })
}

/** Text with single line breaks kept (used for multi-line script paragraphs). */
function runsWithLineBreaks(text: string): TextRun[] {
  return text.split(/\r?\n/).map((line, i) => (i === 0 ? new TextRun({ text: line }) : new TextRun({ text: line, break: 1 })))
}

function sheetHeader(opts: { pageBreakBefore: boolean; kicker?: string; title: string; meta: string[] }): Paragraph[] {
  const out: Paragraph[] = [
    new Paragraph({
      style: STYLE.quote,
      pageBreakBefore: opts.pageBreakBefore,
      children: [new TextRun({ text: `\u201C${STAKE_VISION_TEXT}\u201D` })],
    }),
  ]
  if (opts.kicker) out.push(new Paragraph({ style: STYLE.kicker, children: [new TextRun({ text: opts.kicker })] }))
  out.push(new Paragraph({ style: STYLE.title, children: [new TextRun({ text: opts.title })] }))
  for (const line of opts.meta) {
    if (line) out.push(new Paragraph({ style: STYLE.meta, children: [new TextRun({ text: line })] }))
  }
  out.push(rule())
  return out
}

function welcomeSheet(input: ConductingDocxInput, session: ConferenceSession, pageBreakBefore: boolean): Paragraph[] {
  const { event, formatTime, resolveSessionDisplayDateIso, formatSessionDateLong } = input
  const script = session.welcome_script?.trim() ? session.welcome_script : generateWelcomeScriptDraft(event, session)

  const metaParts: string[] = []
  const dateIso = resolveSessionDisplayDateIso(session, event)
  if (dateIso) metaParts.push(formatSessionDateLong(dateIso))
  if (session.start_time) metaParts.push(formatTime(session.start_time))

  const out = sheetHeader({
    pageBreakBefore,
    kicker: "Welcome & Announcements",
    title: session.session_label,
    meta: [metaParts.join(" \u00B7 ")],
  })
  for (const para of script.split(/\n\s*\n/)) {
    if (!para.trim()) continue
    out.push(new Paragraph({ style: STYLE.script, children: runsWithLineBreaks(para.trim()) }))
  }
  return out
}

function programItemParagraphs(item: ConferenceProgramItem): Paragraph[] {
  const label = PROGRAM_ITEM_LABELS[item.item_type] || item.item_type
  const fields = programItemFieldConfig(item.item_type)
  const hymnNumber = fields.hymnNumber ? (item.hymn_number ?? "").trim() : ""
  const name = fields.name ? (item.assigned_to ?? "").trim() : ""
  const topic = fields.topic ? (item.topic ?? "").trim() : ""
  const showMinutes =
    programItemAllowsDuration(item.item_type) &&
    !isStandardOpeningItemType(item.item_type) &&
    item.item_type !== "closing_hymn" &&
    item.item_type !== "benediction" &&
    item.duration_minutes > 0

  // Same arrangement as the on-screen sheet: the name sits on the label line and
  // the topic / hymn title goes on its own italic line. When there is no name
  // (e.g. a congregational hymn), the topic takes the label line instead:
  // "Opening Hymn:  #2 — The Spirit of God".
  const topicOnOwnLine = Boolean(fields.name && fields.topic && name)
  const mainParts: string[] = []
  if (hymnNumber) mainParts.push(`#${hymnNumber}`)
  if (name) mainParts.push(name)
  if (!topicOnOwnLine && topic) mainParts.push(topic)

  const content: TextRun[] = []
  if (mainParts.length > 0) content.push(new TextRun({ text: mainParts.join(" \u2014 ") }))
  if (showMinutes) {
    content.push(new TextRun({ text: `${mainParts.length > 0 ? "  " : ""}(${item.duration_minutes} min)` }))
  }

  const out: Paragraph[] = [labelLine(label, content)]
  if (topicOnOwnLine && topic) {
    out.push(new Paragraph({ style: STYLE.detail, children: [new TextRun({ text: topic })] }))
  }
  if (item.notes?.trim()) {
    out.push(new Paragraph({ style: STYLE.note, children: runsWithLineBreaks(item.notes.trim()) }))
  }
  return out
}

function conductingSheet(input: ConductingDocxInput, session: ConferenceSession): Paragraph[] {
  const { event, formatTime, resolveSessionDisplayDateIso, formatSessionDateLong, formatEventDateRange } = input
  const items = sortProgramItemsByOrder(session.program_items || [])

  const dateIso = resolveSessionDisplayDateIso(session, event)
  const dateLabel = dateIso ? formatSessionDateLong(dateIso) : formatEventDateRange(event.start_date, event.end_date)
  const timeLabel =
    session.start_time && session.end_time
      ? `${formatTime(session.start_time)} \u2014 ${formatTime(session.end_time)}`
      : ""

  const out = sheetHeader({
    pageBreakBefore: true,
    title: session.session_label,
    meta: [
      [event.title, dateLabel].filter(Boolean).join(" \u00B7 "),
      timeLabel ? [timeLabel, event.location || ""].filter(Boolean).join(" \u00B7 ") : "",
    ],
  })

  const attendedBy = (session.attended_by ?? "").trim()
  const materials = (session.equipment_notes ?? "").trim()
  out.push(labelLine("Attended by", attendedBy ? [new TextRun({ text: attendedBy })] : []))
  out.push(labelLine("Materials requested", materials ? [new TextRun({ text: materials })] : []))
  if (event.presiding_authority) {
    out.push(labelLine("Presiding authority", [new TextRun({ text: event.presiding_authority })]))
  }
  if (event.theme) {
    out.push(labelLine("Theme", [new TextRun({ text: event.theme, italics: true })]))
  }
  out.push(rule())

  const firstOpeningHymnId = items.find((i) => i.item_type === "opening_hymn")?.id
  for (const item of items) {
    if (item.id === firstOpeningHymnId) {
      out.push(
        labelLine("Welcome / Announcements", [new TextRun({ text: "(see welcome sheet)", italics: true, color: "475569" })])
      )
    }
    out.push(...programItemParagraphs(item))
  }

  if (session.broadcast_url) {
    out.push(rule())
    out.push(
      new Paragraph({
        style: STYLE.note,
        indent: { left: 0 },
        children: [new TextRun({ text: "Broadcast: ", bold: true }), new TextRun({ text: session.broadcast_url })],
      })
    )
  }
  return out
}

export function buildConductingSheetsDocument(input: ConductingDocxInput): Document {
  const children: Paragraph[] = []
  input.sessions.forEach((session, index) => {
    children.push(...welcomeSheet(input, session, index > 0))
    children.push(...conductingSheet(input, session))
  })

  const centered = { alignment: AlignmentType.CENTER }
  return new Document({
    title: `${input.event.title} \u2014 Conducting Sheets`,
    description: "Welcome and conducting sheets exported from the Stake App.",
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 23, color: "0F172A" },
          paragraph: { spacing: { after: 0, line: 264 } },
        },
      },
      paragraphStyles: [
        {
          id: STYLE.quote,
          name: "Sheet Quote",
          basedOn: "Normal",
          quickFormat: true,
          run: { italics: true, size: 19, color: "475569" },
          paragraph: { ...centered, indent: { left: 900, right: 900 }, spacing: { after: 160 } },
        },
        {
          id: STYLE.kicker,
          name: "Sheet Kicker",
          basedOn: "Normal",
          quickFormat: true,
          run: { bold: true, allCaps: true, size: 17, color: "64748B", characterSpacing: 50 },
          paragraph: { ...centered, spacing: { after: 40 } },
        },
        {
          id: STYLE.title,
          name: "Sheet Title",
          basedOn: "Normal",
          quickFormat: true,
          run: { bold: true, size: 36 },
          paragraph: { ...centered, spacing: { after: 60 } },
        },
        {
          id: STYLE.meta,
          name: "Sheet Details",
          basedOn: "Normal",
          quickFormat: true,
          run: { size: 21, color: "334155" },
          paragraph: { ...centered },
        },
        {
          id: STYLE.rule,
          name: "Sheet Divider",
          basedOn: "Normal",
          quickFormat: true,
          run: { size: 8 },
          paragraph: {
            spacing: { before: 100, after: 160 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "94A3B8", space: 1 } },
          },
        },
        {
          id: STYLE.line,
          name: "Program Line",
          basedOn: "Normal",
          quickFormat: true,
          paragraph: {
            leftTabStop: LABEL_COLUMN,
            indent: { left: LABEL_COLUMN, hanging: LABEL_COLUMN },
            spacing: { before: 70 },
          },
        },
        {
          id: STYLE.detail,
          name: "Program Detail",
          basedOn: "Normal",
          quickFormat: true,
          run: { italics: true, color: "334155" },
          paragraph: { indent: { left: LABEL_COLUMN } },
        },
        {
          id: STYLE.note,
          name: "Program Note",
          basedOn: "Normal",
          quickFormat: true,
          run: { size: 18, color: "64748B" },
          paragraph: { indent: { left: LABEL_COLUMN } },
        },
        {
          id: STYLE.script,
          name: "Welcome Script",
          basedOn: "Normal",
          quickFormat: true,
          run: { size: 24 },
          paragraph: { spacing: { after: 200, line: 320 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 8.5 * TWIPS_PER_INCH, height: 11 * TWIPS_PER_INCH },
            margin: {
              top: 0.75 * TWIPS_PER_INCH,
              bottom: 0.75 * TWIPS_PER_INCH,
              left: 0.9 * TWIPS_PER_INCH,
              right: 0.9 * TWIPS_PER_INCH,
            },
          },
        },
        children,
      },
    ],
  })
}

export async function buildConductingSheetsDocx(input: ConductingDocxInput): Promise<Blob> {
  return Packer.toBlob(buildConductingSheetsDocument(input))
}

/** "April 2026 Stake Conference" → "April-2026-Stake-Conference-conducting-sheets.docx" */
export function conductingDocxFilename(eventTitle: string): string {
  const slug = eventTitle
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80)
  return `${slug || "conference"}-conducting-sheets.docx`
}
