"use client"

import { useEffect, useRef, useState } from "react"
import type * as Y from "yjs"
import { applyTextChange } from "@/lib/collab/apply-text-change"

/**
 * Bind a React string to a Y.Text. Remote CRDT updates re-render; local
 * commits merge with a prefix/suffix diff so two people can type at once.
 */
export function useBoundYText(
  yText: Y.Text | null,
  seedText: string,
  ready: boolean,
  onPlainText?: (value: string) => void
) {
  const [value, setValue] = useState("")
  const applyingRemote = useRef(false)
  const seededRef = useRef(false)
  const onPlainTextRef = useRef(onPlainText)
  onPlainTextRef.current = onPlainText
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

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
      setValue((prev) => prev || seedText || "")
      return
    }

    const syncFromY = () => {
      const next = yText.toString()
      applyingRemote.current = true
      setValue(next)
      onPlainTextRef.current?.(next)

      const el = inputRef.current
      if (el && document.activeElement === el) {
        const start = el.selectionStart ?? next.length
        const end = el.selectionEnd ?? next.length
        requestAnimationFrame(() => {
          if (!inputRef.current) return
          const len = inputRef.current.value.length
          inputRef.current.setSelectionRange(Math.min(start, len), Math.min(end, len))
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

  const commit = (next: string) => {
    if (applyingRemote.current) return
    setValue(next)
    if (yText) applyTextChange(yText, next)
    onPlainTextRef.current?.(next)
  }

  return { value, commit, inputRef, applyingRemote, hasYText: Boolean(yText) }
}
