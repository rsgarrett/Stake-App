"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export type ConfirmDeleteDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  pending?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, pending, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Dismiss"
        disabled={pending}
        onClick={() => {
          if (!pending) onCancel()
        }}
      />
      <div
        role="alertdialog"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        className="relative z-[101] w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h2 id="confirm-delete-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p id="confirm-delete-desc" className="mt-3 text-sm text-gray-600">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
