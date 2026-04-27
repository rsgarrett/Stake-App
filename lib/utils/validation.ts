import { z } from "zod"

// User validation schemas
export const userRoleSchema = z.enum([
  "stake_president",
  "counselor",
  "clerk",
  "high_council",
  "bishop",
  "auxiliary_leader",
  "viewer",
])

// Calling schemas
export const callingSchema = z.object({
  person_name: z.string().min(1),
  calling_name: z.string().min(1),
  organization: z.string().optional(),
  stake_id: z.string().uuid(),
  ward_id: z.string().uuid().optional(),
  extended_date: z.string().optional(),
  released_date: z.string().optional(),
  status: z.enum(["active", "released", "pending"]),
  notes: z.string().optional(),
})

// Meeting schemas
export const meetingSchema = z.object({
  title: z.string().min(1),
  meeting_type: z.string().min(1),
  scheduled_date: z.string().datetime(),
  location: z.string().optional(),
  stake_id: z.string().uuid(),
})

// Welfare case schemas
export const welfareCaseSchema = z.object({
  case_number: z.string().min(1),
  stake_id: z.string().uuid(),
  ward_id: z.string().uuid().optional(),
  status: z.enum(["open", "closed", "pending"]),
  case_notes: z.string().optional(),
})

// Missionary application schemas
export const missionaryApplicationSchema = z.object({
  applicant_name: z.string().min(1),
  application_date: z.string().date(),
  status: z.enum(["pending", "approved", "submitted", "rejected"]),
  stake_id: z.string().uuid(),
  notes: z.string().optional(),
})

// Temple interview schemas
export const templeInterviewSchema = z.object({
  interviewee_name: z.string().min(1),
  interview_type: z.string().min(1),
  scheduled_date: z.string().datetime(),
  conducted_date: z.string().datetime().optional(),
  interviewer_id: z.string().uuid(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
  notes: z.string().optional(),
})

// Event schemas
export const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  location: z.string().optional(),
  event_type: z.string().min(1),
  stake_id: z.string().uuid(),
})

// Announcement schemas
export const announcementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  target_audience: z.enum(["stake", "ward", "leaders", "youth"]),
  publish_date: z.string().datetime().optional(),
  stake_id: z.string().uuid(),
})


