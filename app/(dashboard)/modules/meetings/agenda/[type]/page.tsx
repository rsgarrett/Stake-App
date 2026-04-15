"use client"

import { useParams, useSearchParams } from "next/navigation"
import { MeetingAgenda, AgendaConfig } from "@/components/meetings/MeetingAgenda"

const WARDS = [
  "8th Ward", "12th Ward", "17th Ward", "18th Ward", "19th Ward", "22nd Ward", "23rd Ward",
]

const AGENDA_CONFIGS: Record<string, AgendaConfig> = {
  "high-council": {
    meetingType: "high_council",
    title: "High Council Meeting",
    defaultPresiding: "President Garrett",
    defaultConducting: "President Chandler",
    defaultTime: "6:00 AM",
    calendarKeywords: ["high council", "high_council"],
    sections: ["calendar", "opening", "action_items", "training", "discussion", "closing", "general_notes"],
  },
  "stake-council": {
    meetingType: "stake_council",
    title: "Stake Council Meeting",
    defaultPresiding: "President Garrett",
    defaultConducting: "President Garrett",
    defaultTime: "6:00 AM",
    calendarKeywords: ["stake council", "stake_council"],
    sections: ["calendar", "opening", "action_items", "training", "discussion", "closing", "general_notes"],
  },
  "missionary-coordination": {
    meetingType: "missionary_coordination",
    title: "Missionary Coordination Meeting",
    defaultPresiding: "President Garrett",
    defaultConducting: "John Bates",
    defaultTime: "8:00 AM",
    calendarKeywords: ["missionary"],
    defaultAttendees: WARDS.flatMap((w) => [`${w} WML`, `${w} EQ`, `${w} RS`]),
    sections: ["calendar", "opening", "attendees", "action_items", "training", "discussion", "closing", "general_notes"],
  },
  "temple-family-history": {
    meetingType: "temple_family_history",
    title: "Temple & Family History Coordination Meeting",
    defaultPresiding: "President Garrett",
    defaultConducting: "Gaylan Colledge",
    defaultTime: "8:00 AM",
    calendarKeywords: ["temple", "family history"],
    defaultAttendees: WARDS.flatMap((w) => [`${w} T&FHL`, `${w} EQ`, `${w} RS`, `${w} Primary`]),
    sections: ["calendar", "opening", "attendees", "action_items", "training", "discussion", "closing", "general_notes"],
  },
  "relief-society-coordination": {
    meetingType: "relief_society_coordination",
    title: "Relief Society Coordination Meeting",
    defaultPresiding: "President Garrett",
    defaultConducting: "",
    defaultTime: "8:00 AM",
    calendarKeywords: ["relief society"],
    defaultAttendees: WARDS.map((w) => `${w} RS President`),
    sections: ["calendar", "opening", "attendees", "action_items", "training", "discussion", "closing", "general_notes"],
  },
  "stake-presidency": {
    meetingType: "stake_presidency",
    title: "Stake Presidency Meeting",
    defaultPresiding: "President Garrett",
    defaultConducting: "President Garrett",
    defaultTime: "8:00 PM",
    calendarKeywords: ["stake presidency", "stake_presidency"],
    sections: ["calendar", "opening", "action_items", "training", "discussion", "closing", "general_notes"],
  },
}

export default function AgendaPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const type = params.type as string
  const date = searchParams.get("date") || undefined

  const config = AGENDA_CONFIGS[type]

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unknown Agenda Type</h2>
          <p className="text-gray-500">No agenda template found for &quot;{type}&quot;.</p>
        </div>
      </div>
    )
  }

  return <MeetingAgenda config={config} initialDate={date} />
}
