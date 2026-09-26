import type { Metadata } from "next"
import { ChurchWebCopyUrl } from "@/components/church-web-copy-url"
import { churchWebProxyPath, parseChurchWebUrl } from "@/lib/church-web-link"

export const metadata: Metadata = {
  title: "Church website · browser",
  robots: { index: false, follow: false },
}

export default function OpenWebPage({
  searchParams,
}: {
  searchParams: { u?: string }
}) {
  const url = parseChurchWebUrl(searchParams.u ?? "")
  const proxySrc = url ? churchWebProxyPath(url) : null

  if (!url || !proxySrc) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Link not allowed</h1>
        <p className="mt-2 text-sm text-slate-600">
          This page only opens official Church websites in your browser, not Gospel Library.
        </p>
      </main>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-100">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-indigo-700">Opening in this browser — not Gospel Library</p>
          <p className="truncate text-[11px] text-slate-500" title={url}>
            {url}
          </p>
        </div>
        <ChurchWebCopyUrl url={url} />
      </header>
      <iframe
        title="Church website"
        src={proxySrc}
        className="min-h-0 w-full flex-1 border-0 bg-white"
        sandbox="allow-scripts allow-forms allow-downloads"
        referrerPolicy="no-referrer"
        allow="fullscreen"
      />
    </div>
  )
}
