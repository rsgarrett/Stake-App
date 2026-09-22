"use client"

import type * as Y from "yjs"
import { useBoundYText } from "@/lib/collab/use-bound-y-text"

type Props = {
  yText: Y.Text | null
  seedText?: string
  ready?: boolean
  readOnly?: boolean
  className?: string
  placeholder?: string
  list?: string
  type?: string
  onPlainText?: (value: string) => void
}

/** Single-line input bound to a Y.Text — concurrent typing merges like Docs. */
export function CollaborativeInput({
  yText,
  seedText = "",
  ready = true,
  readOnly = false,
  className,
  placeholder,
  list,
  type = "text",
  onPlainText,
}: Props) {
  const { value, commit, inputRef } = useBoundYText(yText, seedText, ready, onPlainText)

  return (
    <input
      ref={(el) => {
        inputRef.current = el
      }}
      type={type}
      list={list}
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
