import type * as Y from "yjs"

/**
 * Apply a textarea-style string change to a Y.Text using a longest common
 * prefix/suffix diff so concurrent remote edits merge instead of last-write-wins.
 */
export function applyTextChange(yText: Y.Text, next: string) {
  const prev = yText.toString()
  if (prev === next) return

  let start = 0
  const minLen = Math.min(prev.length, next.length)
  while (start < minLen && prev.charCodeAt(start) === next.charCodeAt(start)) {
    start += 1
  }

  let prevEnd = prev.length
  let nextEnd = next.length
  while (
    prevEnd > start &&
    nextEnd > start &&
    prev.charCodeAt(prevEnd - 1) === next.charCodeAt(nextEnd - 1)
  ) {
    prevEnd -= 1
    nextEnd -= 1
  }

  yText.doc?.transact(() => {
    if (prevEnd > start) yText.delete(start, prevEnd - start)
    if (nextEnd > start) yText.insert(start, next.slice(start, nextEnd))
  }, "local")
}
