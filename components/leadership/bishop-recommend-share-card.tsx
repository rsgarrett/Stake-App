"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, ExternalLink, Link2 } from "lucide-react"
import { BISHOP_GOOGLE_FORM_URL, PUBLIC_RECOMMEND_PATH } from "@/lib/callings/recommend-links"

/**
 * Shareable bishop recommendation entry points for the Callings module.
 * The public link writes straight into the tracker; the Google Form is the
 * longer intake bishops already know (manual copy if used).
 */
export function BishopRecommendShareCard() {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const publicUrl = `${origin}${PUBLIC_RECOMMEND_PATH}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copy this link for bishops:", publicUrl)
    }
  }

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-sky-950 flex items-center gap-1.5">
            <Link2 className="h-4 w-4 shrink-0" aria-hidden />
            Calling submission form
          </p>
          <p className="text-xs text-sky-900/80">
            Share the link with others — they do not need an app seat. Submissions appear as pending
            names in this tracker for presidency discussion.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button type="button" size="sm" variant="secondary" onClick={() => void copyLink()}>
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy public link
              </>
            )}
          </Button>
          <a
            href={PUBLIC_RECOMMEND_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-900 hover:bg-sky-50"
          >
            Open form <ExternalLink className="ml-1.5 h-3 w-3" />
          </a>
          <a
            href={BISHOP_GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-transparent px-3 py-1.5 text-xs font-medium text-sky-800 hover:underline"
            title="Longer Google Form — responses are not imported automatically"
          >
            Google Form <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
      <p className="mt-2 truncate font-mono text-[11px] text-sky-800/70" title={publicUrl}>
        {publicUrl || PUBLIC_RECOMMEND_PATH}
      </p>
    </div>
  )
}
