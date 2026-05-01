/** Conferences subtree: fresh HTML shell so phones don’t cling to stale document cache. */
export const dynamic = "force-dynamic"

export default function ConferencesModuleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
