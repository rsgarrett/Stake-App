/**
 * English title case for dropdown / select labels: principal words capitalized,
 * hyphen and slash compounds handled, short org acronyms preserved (SP, HC, …).
 */
const ACRONYMS = new Set([
  "sp",
  "hc",
  "mp",
  "lcr",
  "rs",
  "ym",
  "yw",
  "eq",
  "fsy",
  "tbd",
  "usa",
  "lds",
  "es",
  "pmg",
])

function titleCaseHyphenPart(part: string): string {
  if (!part) return part
  const lower = part.toLowerCase()
  if (ACRONYMS.has(lower)) return lower.toUpperCase()
  if (/^\d+$/.test(part)) return part
  if (/^\d+[a-z]{1,3}$/i.test(part)) {
    return part.charAt(0) + part.slice(1).toLowerCase()
  }
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
}

function titleCaseWord(word: string): string {
  const paren = word.match(/^\(([^)]+)\)\s*$/)
  if (paren) {
    const inner = paren[1].trim()
    if (!inner) return word
    return `(${titleCaseSegment(inner)})`
  }
  if (word.includes("/") && !word.includes(" ")) {
    return word.split("/").map(titleCaseHyphenPart).join("/")
  }
  return word.split("-").map(titleCaseHyphenPart).join("-")
}

function titleCaseSegment(segment: string): string {
  return segment
    .split(/\s+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ")
}

/** Title-case a menu string; supports "/", em dash, and en dash between phrases. */
export function englishMenuTitleCase(input: string): string {
  if (input == null || input === "") return input
  const trimmed = input.trim()
  if (!trimmed) return input

  if (trimmed.includes("/")) {
    return trimmed
      .split(/\s*\/\s*/)
      .map((s) => englishMenuTitleCase(s.trim()))
      .join(" / ")
  }
  if (trimmed.includes("—")) {
    return trimmed
      .split(/\s*—\s*/)
      .map((s) => englishMenuTitleCase(s.trim()))
      .join(" — ")
  }
  if (trimmed.includes("–")) {
    return trimmed
      .split(/\s*–\s*/)
      .map((s) => englishMenuTitleCase(s.trim()))
      .join(" – ")
  }
  return titleCaseSegment(trimmed)
}
