/**
 * Wraps a Supabase query with a timeout so pages don't hang
 * if tables don't exist or the database is unreachable.
 */
export async function safeQuery<T>(
  queryPromise: PromiseLike<{ data: T | null; error: any }>,
  timeoutMs = 3000
): Promise<{ data: T | null; error: string | null }> {
  try {
    const result = await Promise.race([
      queryPromise,
      new Promise<{ data: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: "Query timed out" } }), timeoutMs)
      ),
    ])

    if (result.error) {
      console.warn("Supabase query error:", result.error)
      return { data: null, error: result.error.message || "Query failed" }
    }

    return { data: result.data, error: null }
  } catch (err: any) {
    console.warn("Supabase query exception:", err)
    return { data: null, error: err.message || "Query failed" }
  }
}

/**
 * Wraps a Supabase count query with a timeout.
 */
export async function safeCount(
  queryPromise: PromiseLike<{ count: number | null; error: any }>,
  timeoutMs = 3000
): Promise<number> {
  try {
    const result = await Promise.race([
      queryPromise,
      new Promise<{ count: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ count: null, error: { message: "Query timed out" } }), timeoutMs)
      ),
    ])

    if (result.error) {
      console.warn("Supabase count error:", result.error)
      return 0
    }

    return result.count || 0
  } catch (err: any) {
    console.warn("Supabase count exception:", err)
    return 0
  }
}
