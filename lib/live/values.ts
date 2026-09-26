/** Treat empty form strings and database nulls as the same value. */
export function canonicalLiveValue(value: unknown): unknown {
  if (value == null || value === "") return null
  return value
}

export function liveValuesEqual(a: unknown, b: unknown): boolean {
  const left = canonicalLiveValue(a)
  const right = canonicalLiveValue(b)
  if (Object.is(left, right)) return true
  if (typeof left === "string" && typeof right === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(left) && right.startsWith(left)) return true
    if (/^\d{4}-\d{2}-\d{2}$/.test(right) && left.startsWith(right)) return true
  }
  if (typeof left === "boolean" || typeof right === "boolean") {
    return Boolean(left) === Boolean(right)
  }
  return false
}

/** Keep a date-only form value when the database stores a timestamp on that day. */
export function normalizeLiveValue(current: unknown, remote: unknown): unknown {
  if (typeof current === "string" && /^\d{4}-\d{2}-\d{2}$/.test(current) && typeof remote === "string") {
    return remote.slice(0, 10)
  }
  if ((current === "" || current == null) && (remote == null || remote === "")) {
    return current ?? ""
  }
  return remote
}
