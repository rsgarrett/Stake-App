"use client"

import type * as Y from "yjs"
import { useBoundYText } from "@/lib/collab/use-bound-y-text"

type Props = {
  yText: Y.Text | null
  /** Seed Y.Text once when the shared doc is empty (legacy plain-text row). */
  seedText?: string
  /** Wait for Yjs persistence restore before seeding legacy text. */
  ready?: boolean
  readOnly?: boolean
  className?: string
  placeholder?: string
  rows?: number
  /** Plain-text mirror for legacy columns / autosave badges. */
  onPlainText?: (value: string) => void
}

/**
 * Plain textarea bound to a Y.Text — concurrent typing merges like Docs.
 */
export function CollaborativeTextarea({
  yText,
  seedText = "",
  ready = true,
  readOnly = false,
  className,
  placeholder,
  rows = 8,
  onPlainText,
}: Props) {
  const { value, commit, inputRef } = useBoundYText(yText, seedText, ready, onPlainText)

  return (
    <textarea
      ref={(el) => {
        inputRef.current = el
      }}
      rows={rows}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        if (readOnly) return
        commit(e.target.value)
      }}
    />
  )
}
