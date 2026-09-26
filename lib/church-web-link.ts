/** Hosts Gospel Library claims via Universal Links. */
const CHURCH_WEB_ROOTS = ["churchofjesuschrist.org", "lds.org"] as const

export function isChurchWebHost(hostname: string): boolean {
  const host = hostname.replace(/\.$/, "").toLowerCase()
  return CHURCH_WEB_ROOTS.some((root) => host === root || host.endsWith(`.${root}`))
}

/** Canonical https Church URL, or null if it must not be opened. */
export function parseChurchWebUrl(raw: string): string | null {
  if (!raw || raw.length > 2048) return null
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }
  if (parsed.protocol !== "https:") return null
  if (parsed.username || parsed.password) return null
  if (parsed.port && parsed.port !== "443") return null
  if (!isChurchWebHost(parsed.hostname)) return null
  return parsed.href
}

export function isChurchWebUrl(raw: string): boolean {
  return parseChurchWebUrl(raw) !== null
}

/**
 * Same-origin hop. Direct Church hrefs (and iframe src) are Universal Links and
 * open Gospel Library, which then dumps content as file:// Safari windows.
 */
export function churchWebBounceHref(href: string): string | null {
  const canonical = parseChurchWebUrl(href)
  if (!canonical) return null
  return `/open-web?u=${encodeURIComponent(canonical)}`
}

/** Browser-facing path whose document is fetched server-side (no Universal Link). */
export function churchWebProxyPath(href: string): string | null {
  const canonical = parseChurchWebUrl(href)
  if (!canonical) return null
  const u = new URL(canonical)
  return `/church-web/${u.host}${u.pathname}${u.search}`
}

export function churchWebTargetFromProxySegments(segments: string[], search: string): string | null {
  if (!segments.length) return null
  const host = segments[0]
  if (!isChurchWebHost(host)) return null
  if (host.includes("/") || host.includes("\\") || host.includes("@")) return null
  if (segments.some((s) => s === "." || s === ".." || s.includes("\\"))) return null
  const rest = segments.slice(1).join("/")
  const path = rest ? `/${rest}` : "/"
  return parseChurchWebUrl(`https://${host}${path}${search}`)
}
