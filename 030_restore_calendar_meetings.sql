-- Restore calendar meetings, visits, and trainings
-- Run this if the calendar is empty (e.g., after RLS fix or data loss)
-- Prerequisites: 024, 025 must have been run (creates stake_meeting_schedule, presidency_visit_schedule with data)
-- This applies 027 RLS fix, clears schedule imports, and re-imports from 026 + 029

-- Step 1: Ensure meetings are visible when auth is disabled (anon key)
DROP POLICY IF EXISTS "Users can view meetings in their stake" ON meetings;
CREATE POLICY "Users can view meetings in their stake"
  ON meetings FOR SELECT
  USING (
    stake_id = get_user_stake_id()
    OR get_user_stake_id() IS NULL
  );

DROP POLICY IF EXISTS "Users can view agendas for meetings in their stake" ON meeting_agendas;
CREATE POLICY "Users can view agendas for meetings in their stake"
  ON meeting_agendas FOR SELECT
  USING (
    get_user_stake_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_agendas.meeting_id
      AND m.stake_id = get_user_stake_id()
    )
  );

-- Step 2: Clear schedule-sourced meetings (so we can re-import without duplicates)
DELETE FROM meeting_agendas WHERE meeting_id IN (
  SELECT id FROM meetings WHERE source_type IN ('sp_schedule', 'visit_schedule', 'thursday_schedule')
);
DELETE FROM meetings WHERE source_type IN ('sp_schedule', 'visit_schedule', 'thursday_schedule');

-- Step 3: Re-import SP meetings from stake_meeting_schedule (026 logic)
DO $$
DECLARE
  v_stake_id UUID;
  rec RECORD;
  v_meeting_id UUID;
  v_scheduled TIMESTAMPTZ;
  v_order INT;
BEGIN
  SELECT id INTO v_stake_id FROM stakes LIMIT 1;
  IF v_stake_id IS NULL THEN RAISE EXCEPTION 'No stake found. Create a stake first.'; END IF;

  FOR rec IN
    SELECT * FROM stake_meeting_schedule
    WHERE meeting_type = 'stake_presidency'
    ORDER BY meeting_date
  LOOP
    IF rec.meeting_time LIKE '%AM%' THEN
      v_scheduled := (rec.meeting_date || ' 06:00:00')::TIMESTAMPTZ;
    ELSE
      v_scheduled := (rec.meeting_date || ' 20:00:00')::TIMESTAMPTZ;
    END IF;

    INSERT INTO meetings (stake_id, title, meeting_type, scheduled_date, description, color, source_type, viewable_by_roles)
    VALUES (
      v_stake_id, 'Stake Presidency Meeting', 'stake_presidency', v_scheduled,
      COALESCE('Handbook Topic: ' || rec.handbook_topic, ''),
      '#3b82f6', 'sp_schedule', ARRAY['stake_presidency']
    )
    RETURNING id INTO v_meeting_id;

    v_order := 1;
    IF rec.opening_prayer IS NOT NULL THEN
      INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter, duration_minutes)
      VALUES (v_meeting_id, v_order, 'Opening Prayer', rec.opening_prayer, 2);
      v_order := v_order + 1;
    END IF;
    IF rec.goal IS NOT NULL THEN
      INSERT INTO meeting_agendas (meeting_id, item_order, title, description, duration_minutes)
      VALUES (v_meeting_id, v_order, 'Goal Review', rec.goal, 5);
      v_order := v_order + 1;
    END IF;
    IF rec.handbook_trainer IS NOT NULL THEN
      INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter, description, duration_minutes)
      VALUES (v_meeting_id, v_order, 'Handbook Training', rec.handbook_trainer, rec.handbook_topic, 15);
      v_order := v_order + 1;
    END IF;
    IF rec.closing_prayer IS NOT NULL THEN
      INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter, duration_minutes)
      VALUES (v_meeting_id, v_order, 'Closing Prayer', rec.closing_prayer, 2);
    END IF;
  END LOOP;
  RAISE NOTICE 'SP meetings restored';
END $$;

-- Step 4: Re-import Presidency visits from presidency_visit_schedule (026 logic)
DO $$
DECLARE
  v_stake_id UUID;
  rec RECORD;
  v_meeting_id UUID;
  v_title TEXT;
  v_color TEXT;
  v_type TEXT;
  v_order INT;
BEGIN
  SELECT id INTO v_stake_id FROM stakes LIMIT 1;

  FOR rec IN SELECT * FROM presidency_visit_schedule ORDER BY visit_date
  LOOP
    CASE rec.entry_type
      WHEN 'visit' THEN v_title := 'Sunday Ward Visits'; v_color := '#0891b2'; v_type := 'ward_visit';
      WHEN 'teaching' THEN v_title := 'Sunday Teaching Assignments'; v_color := '#7c3aed'; v_type := 'teaching';
      WHEN 'ward_conference' THEN v_title := rec.president_assignment; v_color := '#d97706'; v_type := 'ward_conference';
      WHEN 'stake_conference' THEN v_title := 'Stake Conference'; v_color := '#dc2626'; v_type := 'stake_conference';
      WHEN 'general_conference' THEN v_title := 'General Conference'; v_color := '#16a34a'; v_type := 'general_conference';
      WHEN 'high_council_meeting' THEN v_title := 'High Council Meeting'; v_color := '#6b7280'; v_type := 'high_council';
      WHEN 'stake_council_meeting' THEN v_title := 'Stake Council Meeting'; v_color := '#6b7280'; v_type := 'stake_council';
      ELSE v_title := 'Presidency Schedule'; v_color := '#3b82f6'; v_type := 'other';
    END CASE;

    INSERT INTO meetings (stake_id, title, meeting_type, scheduled_date, color, source_type, viewable_by_roles)
    VALUES (v_stake_id, v_title, v_type, (rec.visit_date || ' 09:00:00')::TIMESTAMPTZ, v_color, 'visit_schedule', ARRAY['stake_presidency'])
    RETURNING id INTO v_meeting_id;

    IF rec.entry_type IN ('visit', 'teaching') THEN
      v_order := 1;
      IF rec.president_assignment IS NOT NULL THEN
        INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter)
        VALUES (v_meeting_id, v_order, 'President Garrett — ' || rec.president_assignment, 'President Garrett');
        v_order := v_order + 1;
      END IF;
      IF rec.first_counselor_assignment IS NOT NULL THEN
        INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter)
        VALUES (v_meeting_id, v_order, 'President Chandler — ' || rec.first_counselor_assignment, 'President Chandler');
        v_order := v_order + 1;
      END IF;
      IF rec.second_counselor_assignment IS NOT NULL THEN
        INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter)
        VALUES (v_meeting_id, v_order, 'President Williams — ' || rec.second_counselor_assignment, 'President Williams');
      END IF;
    END IF;
  END LOOP;
  RAISE NOTICE 'Presidency visits restored';
END $$;

-- Step 5: Re-import Thursday schedule (029 logic)
DELETE FROM meeting_agendas WHERE meeting_id IN (SELECT id FROM meetings WHERE source_type = 'thursday_schedule');
DELETE FROM meetings WHERE source_type = 'thursday_schedule';
DROP TABLE IF EXISTS thursday_ministering_schedule CASCADE;
DROP TABLE IF EXISTS thursday_schedule CASCADE;

CREATE TABLE thursday_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  ward TEXT NOT NULL,
  meeting_type TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  slot INT,
  pg_attendee TEXT,
  pc_attendee TEXT,
  pw_attendee TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_thursday_schedule_stake ON thursday_schedule(stake_id);
CREATE INDEX IF NOT EXISTS idx_thursday_schedule_date ON thursday_schedule(visit_date);
DROP TRIGGER IF EXISTS update_thursday_schedule_updated_at ON thursday_schedule;
CREATE TRIGGER update_thursday_schedule_updated_at
  BEFORE UPDATE ON thursday_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Import Thursday schedule data
DO $$
DECLARE v_stake_id UUID;
BEGIN
  SELECT id INTO v_stake_id FROM stakes LIMIT 1;
  INSERT INTO thursday_schedule (stake_id, visit_date, ward, meeting_type, start_time, end_time, slot, pg_attendee, pc_attendee, pw_attendee, notes) VALUES
    (v_stake_id, '2026-01-08', '8th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-01-08', '12th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-01-15', '17th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-01-15', '18th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-01-22', '8th Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-01-22', 'Coordinating Council', 'Coordinating Council', '6:00 PM', '10:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-01-29', '19th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, 'Dana Anderson', 'Mary Ann Treasure', 'Laura Brotxman', NULL),
    (v_stake_id, '2026-01-29', 'Bishops Council', 'Bishops Council', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-02-05', '22nd Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, 'Mitch Newey', NULL, 'Scott Hicken', 'PC Out of Town'),
    (v_stake_id, '2026-02-05', 'Elders Quorum Council', 'Elders Quorum Presidents', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, 'PC Out of Town'),
    (v_stake_id, '2026-02-12', '23rd Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, 'Nathan Anderson', 'Barry Pewtress', 'Linda Stabb', NULL),
    (v_stake_id, '2026-02-12', 'Relief Society Council', 'Relief Society Presidents', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-02-19', '18th Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL, 'JD Jessup', 'Griffith?', NULL, NULL),
    (v_stake_id, '2026-02-26', '17th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-02-26', '12th Ward', 'Elders Quorum Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-03-05', '22nd Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-03-05', '23rd Ward', 'Elders Quorum Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-03-12', '8th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-03-12', '12th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-03-19', '19th Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-03-26', '17th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-03-26', '18th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-04-02', '19th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-04-02', '22nd Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-04-09', '23rd Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-04-09', '8th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-04-16', '12th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-04-16', '17th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-04-23', 'Coordinating Council', 'Coordinating Council', '6:00 PM', '10:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-04-30', 'Bishops Council', 'Bishops Council', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-05-07', '18th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-05-07', 'Elders Quorum Council', 'Elders Quorum Presidents', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-05-14', '19th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-05-14', 'Relief Society Council', 'Relief Society Presidents', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-05-21', '22nd Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-05-21', '23rd Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-05-28', '8th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-05-28', '12th Ward', 'Elders Quorum Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-06-04', '17th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-06-04', '19th Ward', 'Elders Quorum Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-06-11', '18th Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-06-25', '22nd Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-06-25', '23rd Ward', 'Elders Quorum Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-07-02', '8th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-07-02', '12th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-07-09', '17th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-07-09', '18th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-07-16', '19th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-07-16', '22nd Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-07-23', '23rd Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-07-23', '8th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-07-30', '12th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-07-30', '17th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-08-06', '18th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-08-06', '19th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-08-13', '22nd Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-08-13', '23rd Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-08-20', '17th Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-08-20', 'Coordinating Council', 'Coordinating Council', '6:00 PM', '10:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-08-27', '8th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-08-27', 'Bishops Council', 'Bishops Council', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-09-03', '12th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-09-03', 'Elders Quorum Council', 'Elders Quorum Presidents', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-09-10', '22nd Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-09-24', '18th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-09-24', 'Relief Society Council', 'Relief Society Presidents', '7:00 PM', '8:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-10-01', '19th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-10-01', '8th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-10-08', '12th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-10-08', '17th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-10-15', '18th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-10-15', '19th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-10-22', '22nd Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-10-22', '23rd Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-10-29', 'Coordinating Council', 'Coordinating Council', '6:00 PM', '10:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-11-05', '23rd Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-11-12', '8th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-11-12', 'Bishops Council', 'Bishops Council', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-11-19', '12th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-11-19', 'Elders Quorum Council', 'Elders Quorum Presidents', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-12-03', '17th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-12-03', 'Relief Society Council', 'Relief Society Presidents', '7:00 PM', '9:00 PM', NULL, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-12-10', '18th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-12-10', '19th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-12-17', '22nd Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', 1, NULL, NULL, NULL, NULL),
    (v_stake_id, '2026-12-17', '23rd Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', 2, NULL, NULL, NULL, NULL);
  RAISE NOTICE 'Thursday schedule data imported';
END $$;

-- Integrate Thursday schedule into meetings
DO $$
DECLARE
  v_stake_id UUID;
  rec RECORD;
  v_meeting_id UUID;
  v_hour INT;
  v_min INT;
  v_title TEXT;
  v_color TEXT;
  v_desc TEXT;
BEGIN
  SELECT id INTO v_stake_id FROM stakes LIMIT 1;

  FOR rec IN SELECT * FROM thursday_schedule ORDER BY visit_date, start_time
  LOOP
    v_hour := 18; v_min := 0;
    IF rec.start_time IS NOT NULL THEN
      IF rec.start_time LIKE '6:30%' OR rec.start_time = '6:30' THEN v_hour := 18; v_min := 30;
      ELSIF rec.start_time LIKE '7:%' THEN v_hour := 19; v_min := 0;
      ELSIF rec.start_time LIKE '6:%' THEN v_hour := 18; v_min := 0;
      END IF;
    END IF;

    v_title := rec.ward || ' — ' ||
      CASE
        WHEN rec.meeting_type = 'Relief Society Ministering' THEN 'RS Ministering'
        WHEN rec.meeting_type = 'Relief Society Presidents' THEN 'RS Presidents Council'
        WHEN rec.meeting_type = 'Elders Quorum Ministering' THEN 'EQ Ministering'
        WHEN rec.meeting_type = 'Elders Quorum Presidents' THEN 'EQ Presidents Council'
        WHEN rec.meeting_type = 'Bishopric Ministering' THEN 'Bishopric Ministering'
        ELSE rec.meeting_type
      END;
    v_desc := COALESCE(rec.start_time || COALESCE(' - ' || rec.end_time, ''), '');
    IF rec.pg_attendee IS NOT NULL OR rec.pc_attendee IS NOT NULL OR rec.pw_attendee IS NOT NULL THEN
      v_desc := v_desc || E'\nPG: ' || COALESCE(rec.pg_attendee, '—') || ' | PC: ' || COALESCE(rec.pc_attendee, '—') || ' | PW: ' || COALESCE(rec.pw_attendee, '—');
    END IF;
    IF rec.notes IS NOT NULL THEN v_desc := v_desc || E'\n' || rec.notes; END IF;

    IF rec.meeting_type = 'Coordinating Council' OR rec.meeting_type = 'Bishops Council' THEN v_color := '#6b7280';
    ELSIF rec.meeting_type LIKE '%Elders Quorum%' OR rec.meeting_type = 'Elders Quorum Presidents' THEN v_color := '#2563eb';
    ELSIF rec.meeting_type LIKE '%Relief Society%' OR rec.meeting_type = 'Relief Society Presidents' THEN v_color := '#dc2626';
    ELSE v_color := '#0d9488';
    END IF;

    INSERT INTO meetings (stake_id, title, meeting_type, scheduled_date, description, color, source_type, viewable_by_roles)
    VALUES (
      v_stake_id, v_title,
      CASE
        WHEN rec.meeting_type LIKE 'Bishopric%' THEN 'bishopric_ministering'
        WHEN rec.meeting_type LIKE 'Elders Quorum%' OR rec.meeting_type = 'Elders Quorum Presidents' THEN 'eq_ministering'
        WHEN rec.meeting_type LIKE 'Relief Society%' OR rec.meeting_type = 'Relief Society Presidents' THEN 'rs_ministering'
        WHEN rec.meeting_type = 'Coordinating Council' THEN 'coordinating_council'
        WHEN rec.meeting_type = 'Bishops Council' THEN 'bishops_council'
        ELSE 'thursday_ministering'
      END,
      (rec.visit_date || ' ' || lpad(v_hour::text, 2, '0') || ':' || lpad(v_min::text, 2, '0') || ':00')::TIMESTAMPTZ,
      v_desc, v_color, 'thursday_schedule', ARRAY['stake_presidency', 'stake_council']
    )
    RETURNING id INTO v_meeting_id;

    INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter, description)
    VALUES (v_meeting_id, 1, rec.ward || ' — ' || rec.meeting_type, NULL,
      COALESCE(rec.start_time || COALESCE(' - ' || rec.end_time, ''), '') ||
      CASE WHEN rec.pg_attendee IS NOT NULL THEN E'\nPG: ' || rec.pg_attendee ELSE '' END ||
      CASE WHEN rec.pc_attendee IS NOT NULL THEN E'\nPC: ' || rec.pc_attendee ELSE '' END ||
      CASE WHEN rec.pw_attendee IS NOT NULL THEN E'\nPW: ' || rec.pw_attendee ELSE '' END ||
      CASE WHEN rec.notes IS NOT NULL THEN E'\nNote: ' || rec.notes ELSE '' END
    );
  END LOOP;
  RAISE NOTICE 'Calendar restored: SP meetings, presidency visits, Thursday ministering';
END $$;

-- Step 6: Eliminate any duplicates (keeps one per source_type, title, meeting_type, date)
DELETE FROM meeting_agendas
WHERE meeting_id IN (
  SELECT id FROM meetings
  WHERE source_type IN ('sp_schedule', 'visit_schedule', 'thursday_schedule')
  AND id NOT IN (
    SELECT id FROM (
      SELECT id,
        ROW_NUMBER() OVER (
          PARTITION BY source_type, title, meeting_type, (scheduled_date::date)
          ORDER BY id
        ) AS rn
      FROM meetings
      WHERE source_type IN ('sp_schedule', 'visit_schedule', 'thursday_schedule')
    ) sub
    WHERE rn = 1
  )
);
DELETE FROM meetings
WHERE source_type IN ('sp_schedule', 'visit_schedule', 'thursday_schedule')
AND id NOT IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY source_type, title, meeting_type, (scheduled_date::date)
        ORDER BY id
      ) AS rn
    FROM meetings
    WHERE source_type IN ('sp_schedule', 'visit_schedule', 'thursday_schedule')
  ) sub
  WHERE rn = 1
);
