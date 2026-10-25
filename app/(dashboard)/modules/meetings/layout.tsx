export default function MeetingsModuleLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col [&>*]:min-w-0 [&>*]:max-w-full">{children}</div>
}
