// User and Auth Types
export type UserRole = 
  | "stake_president"
  | "counselor"
  | "clerk"
  | "high_council"
  | "bishop"
  | "auxiliary_leader"
  | "viewer"

export interface User {
  id: string
  role: UserRole
  stake_id: string
  created_at: string
  updated_at: string
}

export interface Stake {
  id: string
  name: string
  created_at: string
  updated_at: string
}

// Leadership Module Types
export interface Calling {
  id: string
  person_name: string
  calling_name: string
  organization: string
  stake_id: string
  ward_id?: string
  extended_date?: string
  released_date?: string
  status: "active" | "released" | "pending"
  notes?: string
  created_at: string
  updated_at: string
}

export interface LeadershipPosition {
  id: string
  position_type: "bishopric" | "high_council" | "auxiliary"
  organization?: string
  stake_id: string
  ward_id?: string
  created_at: string
  updated_at: string
}

export interface TrainingRecord {
  id: string
  user_id: string
  training_type: string
  completed_date?: string
  status: "completed" | "in_progress" | "not_started"
  notes?: string
  created_at: string
  updated_at: string
}

// Meetings Module Types
export interface Meeting {
  id: string
  title: string
  meeting_type: string
  scheduled_date: string
  end_date?: string | null
  location?: string | null
  stake_id?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  is_all_day?: boolean | null
  recurrence_type?: string | null
  recurrence_interval?: number | null
  recurrence_end_date?: string | null
  recurrence_days_of_week?: number[] | null
  viewable_by_roles?: string[] | null
  editable_by_roles?: string[] | null
  color?: string | null
  description?: string | null
}

export interface MeetingAgenda {
  id: string
  meeting_id: string
  item_order: number
  title: string
  description?: string
  assigned_to?: string
  duration_minutes?: number
  created_at: string
  updated_at: string
}

export interface MeetingMinutes {
  id: string
  meeting_id: string
  content: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface StakeConference {
  id: string
  title: string
  start_date: string
  end_date: string
  location?: string
  stake_id: string
  status: "planned" | "in_progress" | "completed"
  created_at: string
  updated_at: string
}

export interface ConferenceSpeaker {
  id: string
  conference_id: string
  speaker_name: string
  topic?: string
  session: string
  display_order: number
  created_at: string
  updated_at: string
}

// Welfare Module Types
export interface WelfareCase {
  id: string
  case_number: string
  stake_id: string
  ward_id?: string
  status: "open" | "closed" | "pending"
  case_notes: string // encrypted
  created_by: string
  created_at: string
  updated_at: string
}

export interface SelfRelianceParticipant {
  id: string
  participant_name: string
  course_name: string
  start_date?: string
  completion_date?: string
  status: "enrolled" | "completed" | "dropped"
  stake_id: string
  created_at: string
  updated_at: string
}

export interface EmploymentService {
  id: string
  service_type: string
  description?: string
  stake_id: string
  created_at: string
  updated_at: string
}

// Missionary Module Types
export interface MissionaryApplication {
  id: string
  applicant_name: string
  application_date: string
  status: "pending" | "approved" | "submitted" | "rejected"
  stake_id: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface FullTimeMissionary {
  id: string
  missionary_name: string
  mission_name: string
  start_date: string
  end_date?: string
  stake_id: string
  status: "serving" | "returned" | "released"
  created_at: string
  updated_at: string
}

export interface MemberMissionaryEffort {
  id: string
  member_name: string
  effort_type: string
  description?: string
  date: string
  stake_id: string
  created_at: string
  updated_at: string
}

export interface ConvertIntegration {
  id: string
  convert_name: string
  baptism_date: string
  stake_id: string
  ward_id?: string
  status: "new" | "integrated" | "needs_followup"
  followup_notes?: string
  created_at: string
  updated_at: string
}

// Temple Module Types
export interface TempleAttendance {
  id: string
  event_date: string
  attendance_count: number
  event_type: string
  stake_id: string
  created_at: string
  updated_at: string
}

export interface TempleInterview {
  id: string
  interviewee_name: string
  interview_type: string
  scheduled_date: string
  conducted_date?: string
  interviewer_id: string
  status: "scheduled" | "completed" | "cancelled"
  notes?: string // encrypted
  created_at: string
  updated_at: string
}

export interface TempleAssignment {
  id: string
  assignment_date: string
  assignment_type: string
  assigned_to?: string
  stake_id: string
  created_at: string
  updated_at: string
}

export interface FamilyHistoryActivity {
  id: string
  activity_type: string
  description?: string
  date: string
  stake_id: string
  created_at: string
  updated_at: string
}

// Youth Module Types
export interface YouthProgram {
  id: string
  program_name: string
  program_type: string
  start_date?: string
  end_date?: string
  stake_id: string
  status: "active" | "completed" | "planned"
  created_at: string
  updated_at: string
}

export interface YouthConference {
  id: string
  title: string
  start_date: string
  end_date: string
  location?: string
  stake_id: string
  status: "planned" | "in_progress" | "completed"
  created_at: string
  updated_at: string
}

export interface PriesthoodAdvancement {
  id: string
  youth_name: string
  advancement_type: "deacon" | "teacher" | "priest" | "elder"
  advancement_date: string
  stake_id: string
  ward_id?: string
  created_at: string
  updated_at: string
}

export interface YouthActivity {
  id: string
  activity_name: string
  activity_date: string
  location?: string
  stake_id: string
  created_at: string
  updated_at: string
}

// Communication Module Types
export interface Announcement {
  id: string
  title: string
  content: string
  target_audience: "stake" | "ward" | "leaders" | "youth"
  priority?: "normal" | "high"
  expires_at?: string | null
  publish_date?: string
  stake_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  subject: string
  content: string
  read: boolean
  created_at: string
  updated_at: string
}

export interface Newsletter {
  id: string
  title: string
  content: string
  publish_date?: string
  stake_id: string
  created_by: string
  created_at: string
  updated_at: string
}

// Training Module Types
export interface TrainingModule {
  id: string
  title: string
  description?: string
  module_type: string
  content_url?: string
  created_at: string
  updated_at: string
}

export interface TrainingCompletion {
  id: string
  user_id: string
  module_id: string
  completed_date?: string
  status: "completed" | "in_progress"
  created_at: string
  updated_at: string
}

export interface HandbookSection {
  id: string
  section_number: string
  title: string
  content: string
  category: string
  created_at: string
  updated_at: string
}

export interface PolicyUpdate {
  id: string
  title: string
  description: string
  effective_date: string
  category: string
  created_at: string
  updated_at: string
}

// Calendar Module Types
export interface Event {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  location?: string
  event_type: string
  stake_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface EventAttendee {
  id: string
  event_id: string
  user_id: string
  status: "attending" | "not_attending" | "maybe"
  created_at: string
  updated_at: string
}

export interface CalendarConflict {
  id: string
  event1_id: string
  event2_id: string
  conflict_type: "time" | "location" | "resource"
  resolved: boolean
  created_at: string
  updated_at: string
}

// Interviews Module Types
export interface Interview {
  id: string
  interviewee_name: string
  interview_type: string
  scheduled_date: string
  conducted_date?: string
  interviewer_id: string
  status: "scheduled" | "completed" | "cancelled"
  notes?: string // encrypted
  created_at: string
  updated_at: string
}

export interface InterviewSchedule {
  id: string
  interview_id: string
  time_slot: string
  location?: string
  created_at: string
  updated_at: string
}

export interface InterviewNote {
  id: string
  interview_id: string
  note_content: string // encrypted
  created_by: string
  created_at: string
  updated_at: string
}

// Conferences Module Types
export interface SpecialEvent {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  location?: string
  event_type: string
  stake_id: string
  status: "planned" | "in_progress" | "completed"
  created_at: string
  updated_at: string
}

export interface EventSpeaker {
  id: string
  event_id: string
  speaker_name: string
  topic?: string
  session: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface EventMusic {
  id: string
  event_id: string
  music_type: "hymn" | "special_musical_number" | "choir"
  title: string
  performers?: string
  order: number
  created_at: string
  updated_at: string
}

// Conference Planner Types (session-based program planning)
export type ConferenceSessionType =
  | "ministering_visits"
  | "presidency_meeting"
  | "leadership_session"
  | "dinner"
  | "adult_session"
  | "general_session"
  | "other"

export interface ConferenceSession {
  id: string
  event_id: string
  session_type: ConferenceSessionType
  session_label: string
  session_date?: string
  start_time?: string
  end_time?: string
  broadcast_url?: string
  equipment_notes?: string
  announcements?: string
  dinner_group_invited?: string | null
  dinner_provided_by?: string | null
  dinner_guest_count?: number | null
  display_order: number
  created_at: string
  updated_at: string
  program_items?: ConferenceProgramItem[]
}

export type ProgramItemType =
  | "presiding"
  | "conducting"
  | "organist"
  | "pianist"
  | "music_leader"
  | "prelude_music"
  | "opening_hymn"
  | "closing_hymn"
  | "intermediate_hymn"
  | "invocation"
  | "benediction"
  | "speaker"
  | "speaker_primary"
  | "speaker_youth"
  | "instruction"
  | "testimony"
  | "breakout"
  | "discussion"
  | "closing_remarks"
  | "special_musical_number"
  | "stake_business"
  | "other"

export type InviteStatus = "not_invited" | "invited" | "accepted" | "declined" | "completed"

export interface ConferenceProgramItem {
  id: string
  session_id: string
  item_type: ProgramItemType
  assigned_to?: string
  topic?: string
  hymn_number?: string
  duration_minutes: number
  invite_status: InviteStatus
  notes?: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface ConferenceMinisteringVisit {
  id: string
  event_id: string
  visit_date?: string
  start_time?: string
  end_time?: string
  presidency_member: string
  visitee_name: string
  ward?: string
  notes?: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface ConferenceNote {
  id: string
  event_id: string
  note_type: "general" | "followup" | "feedback"
  content: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ConferenceNameSuggestion {
  id: string
  event_id: string
  suggested_name: string
  suggested_role?: string
  suggested_by?: string
  used: boolean
  notes?: string
  created_at: string
  updated_at: string
}

// Mission Ready Tracker Types
export interface MissionReadyTask {
  id: string
  task_number: number
  task_name: string
  additional_resource?: string
  stake_id?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface MissionReadyMissionary {
  id: string
  missionary_name: string
  stake_id?: string
  status: "preparing" | "papers_submitted" | "call_received" | "set_apart" | "serving" | "completed"
  notes?: string
  created_at: string
  updated_at: string
  progress?: MissionReadyProgress[]
}

export interface MissionReadyProgress {
  id: string
  missionary_id: string
  task_number: number
  task_name: string
  completed: boolean
  completed_date?: string
  notes?: string
  additional_resource?: string
  display_order: number
  created_at: string
  updated_at: string
}

// High Council Communication Types
export interface HighCouncilMember {
  id: string
  member_name: string
  email?: string
  stake_id?: string
  assigned_wards?: string
  stewardships?: string
  /** Spreadsheet Column A — presidency steward for this assignment row. */
  presidency_oversight?: string | null
  /** ALC, YLC, ALC/YLC, etc. */
  program_assignment?: string | null
  /** Additional duties (building scheduler, ushering, seminary, …). */
  stewardship_notes?: string | null
  status: "active" | "released"
  called_date?: string
  released_date?: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface HCWeeklyReport {
  id: string
  member_id: string
  reporting_week: string
  meetings_attended?: string
  stewardship_report?: string
  followup_needed?: string
  submitted_at: string
  created_at: string
  updated_at: string
  member?: HighCouncilMember
  responses?: HCReportResponse[]
}

export interface HCReportResponse {
  id: string
  report_id: string
  responder_name?: string
  response_text: string
  created_at: string
  updated_at: string
}

// Stake Meeting Schedule Types
export type MeetingScheduleType = 'stake_presidency' | 'high_council' | 'coordination_council'

export interface StakeMeetingSchedule {
  id: string
  stake_id?: string
  meeting_type: MeetingScheduleType
  meeting_date: string
  meeting_time?: string
  conducting?: string
  opening_prayer?: string
  closing_prayer?: string
  goal?: string
  handbook_trainer?: string
  handbook_topic?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Presidency Visits & Teaching Schedule Types
export type VisitEntryType =
  | 'visit'
  | 'teaching'
  | 'ward_conference'
  | 'stake_conference'
  | 'general_conference'
  | 'high_council_meeting'
  | 'stake_council_meeting'

export interface PresidencyVisitSchedule {
  id: string
  stake_id?: string
  visit_date: string
  week_number?: number
  president_assignment?: string
  first_counselor_assignment?: string
  second_counselor_assignment?: string
  entry_type: VisitEntryType
  notes?: string
  created_at: string
  updated_at: string
}

