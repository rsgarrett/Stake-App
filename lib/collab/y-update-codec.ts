/** Base64 codec matching @supabase-labs/y-supabase (encodeUpdate / decodeUpdate). */

export function encodeYUpdate(update: Uint8Array): string {
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < update.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(update.subarray(i, i + chunkSize)))
  }
  return btoa(binary)
}

export function decodeYUpdate(encoded: string): Uint8Array {
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
