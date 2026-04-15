import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function CommunicationPage() {
  const supabase = await createClient()
  // Authentication temporarily disabled for testing
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // Fetch recent announcements
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  // Fetch unread messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("to_user_id", user.id)
    .eq("read", false)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communication</h1>
          <p className="mt-2 text-gray-600">Send announcements and manage messaging</p>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href="/modules/communication/messages">Messages</Link>
          </Button>
          <Button asChild>
            <Link href="/modules/communication/new-announcement">New Announcement</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription>Latest stake announcements</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements && announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border-b pb-3">
                    <div className="font-medium">{announcement.title}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      Target: {announcement.target_audience}
                    </div>
                    {announcement.publish_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(announcement.publish_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No announcements found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unread Messages</CardTitle>
            <CardDescription>Messages requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="border-b pb-3">
                    <div className="font-medium">{message.subject}</div>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(message.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No unread messages</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

