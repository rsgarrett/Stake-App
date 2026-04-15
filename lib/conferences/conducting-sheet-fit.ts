/**
 * Per-session "one page" fit logic for conducting sheets.
 * Measures content and computes padding + zoom so each session
 * fits on one US-letter page when printed.
 */

export const CONDUCTING_PAGE_MARGIN_IN = 0.2
const LETTER_WIDTH_IN = 8.5
const LETTER_HEIGHT_IN = 11
const PX_PER_IN = 96

const CONDUCTING_PADDING_CANDIDATES_IN = [
  0.44, 0.40, 0.36, 0.32, 0.28, 0.24, 0.20, 0.16, 0.12, 0.08, 0.03,
]

export interface FitResult {
  paddingIn: number
  zoom: number
}

export function fitConductingSheet(contentEl: HTMLElement): FitResult {
  const pageW = (LETTER_WIDTH_IN - 2 * CONDUCTING_PAGE_MARGIN_IN) * PX_PER_IN
  const pageH = (LETTER_HEIGHT_IN - 2 * CONDUCTING_PAGE_MARGIN_IN) * PX_PER_IN

  for (const padIn of CONDUCTING_PADDING_CANDIDATES_IN) {
    const padPx = padIn * PX_PER_IN * 2
    const innerW = pageW - padPx
    const innerH = pageH - padPx

    contentEl.style.width = `${innerW}px`
    contentEl.style.transform = ""
    contentEl.style.zoom = ""

    const h = contentEl.scrollHeight
    if (h <= innerH) {
      contentEl.style.width = ""
      return { paddingIn: padIn, zoom: 1 }
    }
  }

  const minPad = CONDUCTING_PADDING_CANDIDATES_IN[CONDUCTING_PADDING_CANDIDATES_IN.length - 1]
  const padPx = minPad * PX_PER_IN * 2
  const innerH = pageH - padPx
  const innerW = pageW - padPx

  contentEl.style.width = `${innerW}px`
  contentEl.style.transform = ""
  contentEl.style.zoom = ""

  const naturalH = contentEl.scrollHeight
  const zoom = Math.min(1, innerH / naturalH)

  contentEl.style.width = ""
  return { paddingIn: minPad, zoom }
}
