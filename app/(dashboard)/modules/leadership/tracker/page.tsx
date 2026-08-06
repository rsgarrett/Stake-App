import { redirect } from "next/navigation"

/** Legacy URL — keep the route so bookmarks still work, but always use the real tracker. */
export default function CallingTrackerRedirectPage() {
  redirect("/modules/leadership")
}
