"use client"

import { useEffect, useRef, useState } from "react"
import type * as Y from "yjs"
import { applyTextChange } from "@/lib/collab/apply-text-change"

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
  const [value, setValue] = useState("")
  const taRef = useRef<HTMLTextAreaElement>(null)
  const applyingRemote = useRef(false)
  const seededRef = useRef(false)
  const onPlainTextRef = useRef(onPlainText)
  onPlainTextRef.current = onPlainText

  useEffect(() => {
    seededRef.current = false
  }, [yText])

  useEffect(() => {
    if (!yText || !ready) return
    if (seededRef.current) return
    seededRef.current = true
    if (yText.length === 0 && seedText) {
      yText.insert(0, seedText)
    }
  }, [yText, seedText, ready])

  useEffect(() => {
    if (!yText) {
      setValue("")
      return
    }

    const syncFromY = () => {
      const next = yText.toString()
      applyingRemote.current = true
      setValue(next)
      onPlainTextRef.current?.(next)

      const el = taRef.current
      if (el && document.activeElement === el) {
        const start = el.selectionStart
        const end = el.selectionEnd
        requestAnimationFrame(() => {
          if (!taRef.current) return
          const len = taRef.current.value.length
          taRef.current.setSelectionRange(Math.min(start, len), Math.min(end, len))
          applyingRemote.current = false
        })
      } else {
        applyingRemote.current = false
      }
    }

    syncFromY()
    yText.observe(syncFromY)
    return () => {
      yText.unobserve(syncFromY)
    }
  }, [yText])

  return (
    <textarea
      ref={taRef}
      rows={rows}
      value={value}
      readOnly={readOnly || !yText}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        if (readOnly || !yText || applyingRemote.current) return
        const next = e.target.value
        setValue(next)
        applyTextChange(yText, next)
        onPlainTextRef.current?.(next)
      }}
    />
  )
}
