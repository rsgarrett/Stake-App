/**
 * True when the app is served over HTTP on a typical local dev hostname.
 * Cookie options must avoid Secure / SameSite=None so auth works from a phone
 * on the same Wi‑Fi (http://192.168.x.x:3000, etc.).
 */
export function isHttpDevHost(hostname: string, protocol: string): boolean {
  if (protocol !== "http:") return false
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
    return true
  }
  const octets = hostname.split(".").map((o) => parseInt(o, 10))
  if (octets.length !== 4 || octets.some((n) => Number.isNaN(n))) return false
  const [a, b] = octets
  if (a === undefined || b === undefined) return false
  if (a === 10) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 127) return true
  return false
}
