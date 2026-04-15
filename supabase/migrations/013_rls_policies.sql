-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE callings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadership_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE calling_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stake_conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE welfare_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_reliance_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE missionary_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE full_time_missionaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_missionary_efforts ENABLE ROW LEVEL SECURITY;
ALTER TABLE convert_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_history_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE priesthood_advancements ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE handbook_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_music ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's stake_id
CREATE OR REPLACE FUNCTION get_user_stake_id()
RETURNS UUID AS $$
  SELECT stake_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION check_user_role(required_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = required_role
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user has elevated role
CREATE OR REPLACE FUNCTION has_elevated_role()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('stake_president', 'counselor', 'clerk')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Stakes policies
CREATE POLICY "Users can view their own stake"
  ON stakes FOR SELECT
  USING (id = get_user_stake_id());

CREATE POLICY "Stake presidents can update their stake"
  ON stakes FOR UPDATE
  USING (check_user_role('stake_president'));

-- Users policies
CREATE POLICY "Users can view users in their stake"
  ON users FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Audit logs - only accessible by stake presidents and clerks
CREATE POLICY "Elevated roles can view audit logs"
  ON audit_logs FOR SELECT
  USING (has_elevated_role());

-- Generic policy function for stake-scoped tables
CREATE OR REPLACE FUNCTION stake_scoped_policy()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND stake_id IN (
      SELECT stake_id FROM current_table_stake()
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Callings policies
CREATE POLICY "Users can view callings in their stake"
  ON callings FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can insert callings"
  ON callings FOR INSERT
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can update callings"
  ON callings FOR UPDATE
  USING (has_elevated_role() AND stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can delete callings"
  ON callings FOR DELETE
  USING (has_elevated_role() AND stake_id = get_user_stake_id());

-- Leadership positions policies
CREATE POLICY "Users can view leadership positions in their stake"
  ON leadership_positions FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage leadership positions"
  ON leadership_positions FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Training records policies
CREATE POLICY "Users can view their own training records"
  ON training_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view training records in their stake"
  ON training_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = training_records.user_id
      AND u.stake_id = get_user_stake_id()
    )
  );

CREATE POLICY "Elevated roles can manage training records"
  ON training_records FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Meetings policies
CREATE POLICY "Users can view meetings in their stake"
  ON meetings FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage meetings"
  ON meetings FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Meeting agendas policies
CREATE POLICY "Users can view agendas for meetings in their stake"
  ON meeting_agendas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_agendas.meeting_id
      AND m.stake_id = get_user_stake_id()
    )
  );

CREATE POLICY "Elevated roles can manage agendas"
  ON meeting_agendas FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Meeting minutes policies
CREATE POLICY "Users can view minutes for meetings in their stake"
  ON meeting_minutes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_minutes.meeting_id
      AND m.stake_id = get_user_stake_id()
    )
  );

CREATE POLICY "Elevated roles can manage minutes"
  ON meeting_minutes FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Stake conferences policies
CREATE POLICY "Users can view conferences in their stake"
  ON stake_conferences FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage conferences"
  ON stake_conferences FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Conference speakers policies
CREATE POLICY "Users can view speakers for conferences in their stake"
  ON conference_speakers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stake_conferences sc
      WHERE sc.id = conference_speakers.conference_id
      AND sc.stake_id = get_user_stake_id()
    )
  );

CREATE POLICY "Elevated roles can manage speakers"
  ON conference_speakers FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Welfare cases policies (restricted access)
CREATE POLICY "Only stake presidents and counselors can view welfare cases"
  ON welfare_cases FOR SELECT
  USING (
    check_user_role('stake_president') OR check_user_role('counselor')
    AND stake_id = get_user_stake_id()
  );

CREATE POLICY "Only stake presidents and counselors can manage welfare cases"
  ON welfare_cases FOR ALL
  USING (
    (check_user_role('stake_president') OR check_user_role('counselor'))
    AND stake_id = get_user_stake_id()
  )
  WITH CHECK (
    (check_user_role('stake_president') OR check_user_role('counselor'))
    AND stake_id = get_user_stake_id()
  );

-- Self-reliance participants policies
CREATE POLICY "Users can view self-reliance participants in their stake"
  ON self_reliance_participants FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage self-reliance participants"
  ON self_reliance_participants FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Employment services policies
CREATE POLICY "Users can view employment services in their stake"
  ON employment_services FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage employment services"
  ON employment_services FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Missionary applications policies
CREATE POLICY "Users can view missionary applications in their stake"
  ON missionary_applications FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage missionary applications"
  ON missionary_applications FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Full-time missionaries policies
CREATE POLICY "Users can view missionaries in their stake"
  ON full_time_missionaries FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage missionaries"
  ON full_time_missionaries FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Member missionary efforts policies
CREATE POLICY "Users can view member missionary efforts in their stake"
  ON member_missionary_efforts FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage member missionary efforts"
  ON member_missionary_efforts FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Convert integration policies
CREATE POLICY "Users can view convert integration in their stake"
  ON convert_integration FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage convert integration"
  ON convert_integration FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Temple attendance policies
CREATE POLICY "Users can view temple attendance in their stake"
  ON temple_attendance FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage temple attendance"
  ON temple_attendance FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Temple interviews policies (restricted)
CREATE POLICY "Users can view temple interviews they conducted or were interviewed for"
  ON temple_interviews FOR SELECT
  USING (
    interviewer_id = auth.uid()
    OR stake_id = get_user_stake_id()
  );

CREATE POLICY "Elevated roles can manage temple interviews"
  ON temple_interviews FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Temple assignments policies
CREATE POLICY "Users can view temple assignments in their stake"
  ON temple_assignments FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage temple assignments"
  ON temple_assignments FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Family history activities policies
CREATE POLICY "Users can view family history activities in their stake"
  ON family_history_activities FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage family history activities"
  ON family_history_activities FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Youth programs policies
CREATE POLICY "Users can view youth programs in their stake"
  ON youth_programs FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage youth programs"
  ON youth_programs FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Youth conferences policies
CREATE POLICY "Users can view youth conferences in their stake"
  ON youth_conferences FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage youth conferences"
  ON youth_conferences FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Priesthood advancements policies
CREATE POLICY "Users can view priesthood advancements in their stake"
  ON priesthood_advancements FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage priesthood advancements"
  ON priesthood_advancements FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Youth activities policies
CREATE POLICY "Users can view youth activities in their stake"
  ON youth_activities FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage youth activities"
  ON youth_activities FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Announcements policies
CREATE POLICY "Users can view announcements in their stake"
  ON announcements FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage announcements"
  ON announcements FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Messages policies
CREATE POLICY "Users can view messages sent to or from them"
  ON messages FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update messages sent to them"
  ON messages FOR UPDATE
  USING (to_user_id = auth.uid());

-- Newsletters policies
CREATE POLICY "Users can view newsletters in their stake"
  ON newsletters FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage newsletters"
  ON newsletters FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Training modules policies (public read, elevated write)
CREATE POLICY "Anyone authenticated can view training modules"
  ON training_modules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Elevated roles can manage training modules"
  ON training_modules FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Training completions policies
CREATE POLICY "Users can view their own training completions"
  ON training_completions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view training completions in their stake"
  ON training_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = training_completions.user_id
      AND u.stake_id = get_user_stake_id()
    )
  );

CREATE POLICY "Users can manage their own training completions"
  ON training_completions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Handbook sections policies (public read)
CREATE POLICY "Anyone authenticated can view handbook sections"
  ON handbook_sections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Elevated roles can manage handbook sections"
  ON handbook_sections FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Policy updates policies
CREATE POLICY "Users can view policy updates"
  ON policy_updates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Elevated roles can manage policy updates"
  ON policy_updates FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Events policies
CREATE POLICY "Users can view events in their stake"
  ON events FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage events"
  ON events FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Event attendees policies
CREATE POLICY "Users can view attendees for events in their stake"
  ON event_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_attendees.event_id
      AND e.stake_id = get_user_stake_id()
    )
  );

CREATE POLICY "Users can manage their own event attendance"
  ON event_attendees FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Calendar conflicts policies
CREATE POLICY "Users can view conflicts for events in their stake"
  ON calendar_conflicts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id IN (calendar_conflicts.event1_id, calendar_conflicts.event2_id)
      AND e.stake_id = get_user_stake_id()
    )
  );

CREATE POLICY "Elevated roles can manage conflicts"
  ON calendar_conflicts FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Interviews policies (restricted)
CREATE POLICY "Users can view interviews they conducted or were interviewed for"
  ON interviews FOR SELECT
  USING (
    interviewer_id = auth.uid()
    OR stake_id = get_user_stake_id()
  );

CREATE POLICY "Elevated roles can manage interviews"
  ON interviews FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Interview schedules policies
CREATE POLICY "Users can view schedules for interviews in their stake"
  ON interview_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      WHERE i.id = interview_schedules.interview_id
      AND i.interviewer_id = auth.uid()
    )
  );

CREATE POLICY "Elevated roles can manage interview schedules"
  ON interview_schedules FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Interview notes policies (highly restricted)
CREATE POLICY "Only interviewers can view their interview notes"
  ON interview_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      WHERE i.id = interview_notes.interview_id
      AND i.interviewer_id = auth.uid()
    )
  );

CREATE POLICY "Only interviewers can manage their interview notes"
  ON interview_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      WHERE i.id = interview_notes.interview_id
      AND i.interviewer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews i
      WHERE i.id = interview_notes.interview_id
      AND i.interviewer_id = auth.uid()
    )
  );

-- Special events policies
CREATE POLICY "Users can view special events in their stake"
  ON special_events FOR SELECT
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles can manage special events"
  ON special_events FOR ALL
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());

-- Event speakers policies
CREATE POLICY "Users can view speakers for events in their stake"
  ON event_speakers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM special_events se
      WHERE se.id = event_speakers.event_id
      AND se.stake_id = get_user_stake_id()
    )
  );

CREATE POLICY "Elevated roles can manage event speakers"
  ON event_speakers FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());

-- Event music policies
CREATE POLICY "Users can view music for events in their stake"
  ON event_music FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM special_events se
      WHERE se.id = event_music.event_id
      AND se.stake_id = get_user_stake_id()
    )
  );

CREATE POLICY "Elevated roles can manage event music"
  ON event_music FOR ALL
  USING (has_elevated_role())
  WITH CHECK (has_elevated_role());


