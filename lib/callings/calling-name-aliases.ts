/**
 * Normalize LCR / tracker calling titles so "Stake High Councilor" and
 * "High Councilor" filter the same Replaces list.
 */

const CANONICAL: Record<string, string> = {
  "stake high councilor": "high councilor",
  "high councilor": "high councilor",
  "stake presidency first counselor": "first counselor in the stake presidency",
  "first counselor in the stake presidency": "first counselor in the stake presidency",
  "stake presidency second counselor": "second counselor in the stake presidency",
  "second counselor in the stake presidency": "second counselor in the stake presidency",
  "stake assistant clerk": "assistant stake clerk",
  "assistant stake clerk": "assistant stake clerk",
  "stake assistant clerk--membership": "assistant stake clerk — membership",
  "stake assistant clerk—membership": "assistant stake clerk — membership",
  "assistant stake clerk — membership": "assistant stake clerk — membership",
  "stake assistant clerk--finance": "assistant stake clerk — finance",
  "stake assistant clerk—finance": "assistant stake clerk — finance",
  "assistant stake clerk — finance": "assistant stake clerk — finance",
  "stake assistant executive secretary": "assistant stake executive secretary",
  "assistant stake executive secretary": "assistant stake executive secretary",
  "stake clerk": "stake clerk",
  "stake executive secretary": "stake executive secretary",
}

export function canonicalCallingName(name: string | null | undefined): string {
  const n = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/--/g, "—")
  if (!n) return ""
  return CANONICAL[n] ?? n
}

export function sameCallingTitle(a: string | null | undefined, b: string | null | undefined): boolean {
  const ca = canonicalCallingName(a)
  const cb = canonicalCallingName(b)
  return ca.length > 0 && ca === cb
}
