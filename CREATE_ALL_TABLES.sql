-- ============================================================
-- STAKE APP: Create All Tables
-- Run this in your Supabase SQL Editor (supabase.com > your project > SQL Editor)
-- This creates all tables needed for the app to work.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS stakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEADERSHIP MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS callings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT,
  person_name TEXT NOT NULL,
  ward TEXT,
  ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
  calling_name TEXT NOT NULL,
  organization TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  submitted_by UUID,
  workflow_status TEXT DEFAULT 'submitted',
  status TEXT DEFAULT 'pending',
  bishop_approval BOOLEAN DEFAULT FALSE,
  bishop_approval_date TIMESTAMPTZ,
  bishop_approval_by UUID,
  presidency_approval BOOLEAN DEFAULT FALSE,
  presidency_approval_date TIMESTAMPTZ,
  presidency_approval_by UUID,
  high_council_approval BOOLEAN DEFAULT FALSE,
  high_council_approval_date TIMESTAMPTZ,
  high_council_approval_by UUID,
  calling_extended BOOLEAN DEFAULT FALSE,
  previous_release_verified BOOLEAN DEFAULT FALSE,
  assigned_to_extend TEXT,
  sustained_date DATE,
  set_apart_date DATE,
  updated_in_lcr BOOLEAN DEFAULT FALSE,
  ratified_in_stake_conference BOOLEAN DEFAULT FALSE,
  protecting_children_training_complete BOOLEAN DEFAULT FALSE,
  stake_training_complete BOOLEAN DEFAULT FALSE,
  submitted_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calling_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  person_name TEXT NOT NULL,
  ward TEXT,
  calling_name TEXT NOT NULL,
  organization TEXT,
  status TEXT DEFAULT 'pending',
  submitted_date TIMESTAMPTZ DEFAULT NOW(),
  submitted_by UUID,
  notes TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calling_workflow_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calling_id UUID REFERENCES callings(id) ON DELETE CASCADE,
  recommendation_id UUID,
  action TEXT NOT NULL,
  performed_by UUID,
  new_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calling_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  calling_id UUID REFERENCES callings(id) ON DELETE CASCADE,
  recommendation_id UUID,
  notification_type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  action_url TEXT,
  priority TEXT DEFAULT 'normal',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leadership_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  position_type TEXT NOT NULL,
  organization TEXT,
  person_name TEXT,
  user_id UUID,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  training_type TEXT NOT NULL,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEETINGS MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  color TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  recurrence_type TEXT,
  recurrence_interval INTEGER,
  recurrence_end_date DATE,
  recurrence_days_of_week INTEGER[],
  viewable_by_roles TEXT[],
  editable_by_roles TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_agendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  item_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  presenter TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS standard_meeting_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  meeting_type TEXT,
  default_duration INTEGER,
  default_agenda JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WELFARE MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS welfare_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  case_number TEXT,
  person_name TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  case_type TEXT,
  notes TEXT,
  confidential_notes TEXT,
  assigned_to UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS self_reliance_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  course TEXT NOT NULL,
  status TEXT DEFAULT 'enrolled',
  start_date DATE,
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MISSIONARY MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS missionary_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  application_date DATE,
  status TEXT DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS full_time_missionaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  missionary_name TEXT NOT NULL,
  mission_name TEXT,
  start_date DATE,
  expected_return DATE,
  status TEXT DEFAULT 'serving',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS convert_integration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  convert_name TEXT NOT NULL,
  baptism_date DATE,
  ward TEXT,
  status TEXT DEFAULT 'active',
  mentor_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEMPLE MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS temple_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  event_type TEXT,
  event_date DATE NOT NULL,
  attendee_count INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_history_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  participant_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS temple_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  assignment_type TEXT,
  assignment_date DATE,
  shift TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- YOUTH MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS youth_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  program_type TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planned',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS priesthood_advancements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  youth_name TEXT NOT NULL,
  advancement_type TEXT NOT NULL,
  advancement_date DATE NOT NULL,
  ward TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS youth_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  activity_type TEXT,
  activity_date DATE NOT NULL,
  location TEXT,
  description TEXT,
  attendee_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMMUNICATION MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT[],
  priority TEXT DEFAULT 'normal',
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID,
  to_user_id UUID,
  subject TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRAINING MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  module_type TEXT DEFAULT 'optional',
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'completed',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS handbook_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_number TEXT,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  effective_date DATE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CALENDAR MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INTERVIEWS MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  interviewee_name TEXT NOT NULL,
  interview_type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  interviewer_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONFERENCES MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS special_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'planned',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES special_events(id) ON DELETE CASCADE,
  speaker_name TEXT NOT NULL,
  topic TEXT,
  duration_minutes INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_music (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES special_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  performer TEXT,
  music_type TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DONE! All tables created.
-- ============================================================
