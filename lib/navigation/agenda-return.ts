const STORAGE_KEY = "stake-app:agenda-return"

/** Remember which meeting agenda the user came from (same browser tab/session). */
export function setAgendaReturn(path: string) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, path)
  } catch {
    // Storage disabled — query param fallback still works when present.
  }
}

export function getAgendaReturn(): string | null {
  if (typeof window === "undefined") return null
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearAgendaReturn() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
