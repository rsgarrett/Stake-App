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
  interview_type: "temple_recommend" | "calling" | "worthiness"
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

