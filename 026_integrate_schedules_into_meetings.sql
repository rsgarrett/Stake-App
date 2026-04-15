-- Integrate Stake Meeting Schedule and Presidency Visits into the Meetings Calendar
-- This creates actual meetings entries with pre-populated agenda items
-- so everything shows on the calendar and is clickable for agenda details.

-- Add missing columns if they don't exist
DO $$ BEGIN
  ALTER TABLE meeting_agendas ADD COLUMN IF NOT EXISTS assigned_to TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE meeting_agendas ADD COLUMN IF NOT EXISTS presenter TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE meetings ADD COLUMN IF NOT EXISTS source_type TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE meetings ADD COLUMN IF NOT EXISTS description TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE meetings ADD COLUMN IF NOT EXISTS color TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE meetings ADD COLUMN IF NOT EXISTS viewable_by_roles TEXT[];
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- IMPORT SP MEETINGS INTO CALENDAR
-- Each SP meeting becomes a meetings row with agenda items for
-- prayers, handbook training, etc.
-- ============================================================
DO $$
DECLARE
  v_stake_id UUID;
  rec RECORD;
  v_meeting_id UUID;
  v_scheduled TIMESTAMPTZ;
  v_order INT;
BEGIN
  SELECT id INTO v_stake_id FROM stakes LIMIT 1;

  FOR rec IN
    SELECT * FROM stake_meeting_schedule
    WHERE meeting_type = 'stake_presidency'
    ORDER BY meeting_date
  LOOP
    -- Build scheduled_date timestamp from date + time
    IF rec.meeting_time LIKE '%AM%' THEN
      v_scheduled := (rec.meeting_date || ' 06:00:00')::TIMESTAMPTZ;
    ELSE
      v_scheduled := (rec.meeting_date || ' 20:00:00')::TIMESTAMPTZ;
    END IF;

    INSERT INTO meetings (stake_id, title, meeting_type, scheduled_date, description, color, source_type, viewable_by_roles)
    VALUES (
      v_stake_id,
      'Stake Presidency Meeting',
      'stake_presidency',
      v_scheduled,
      COALESCE('Handbook Topic: ' || rec.handbook_topic, ''),
      '#3b82f6',
      'sp_schedule',
      ARRAY['stake_presidency']
    )
    RETURNING id INTO v_meeting_id;

    v_order := 1;

    -- Opening Prayer (use presenter for names - assigned_to is UUID)
    IF rec.opening_prayer IS NOT NULL THEN
      INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter, duration_minutes)
      VALUES (v_meeting_id, v_order, 'Opening Prayer', rec.opening_prayer, 2);
      v_order := v_order + 1;
    END IF;

    -- Goal / Stake Vision
    IF rec.goal IS NOT NULL THEN
      INSERT INTO meeting_agendas (meeting_id, item_order, title, description, duration_minutes)
      VALUES (v_meeting_id, v_order, 'Goal Review', rec.goal, 5);
      v_order := v_order + 1;
    END IF;

    -- Handbook Training
    IF rec.handbook_trainer IS NOT NULL THEN
      INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter, description, duration_minutes)
      VALUES (v_meeting_id, v_order, 'Handbook Training', rec.handbook_trainer, rec.handbook_topic, 15);
      v_order := v_order + 1;
    END IF;

    -- Closing Prayer
    IF rec.closing_prayer IS NOT NULL THEN
      INSERT INTO meeting_agendas (meeting_id, item_order, title, presenter, duration_minutes)
      VALUES (v_meeting_id, v_order, 'Closing Prayer', rec.closing_prayer, 2);
      v_order := v_order + 1;
    END IF;

  END LOOP;

  RAISE NOTICE 'SP meetings imported into calendar';
END $$;

-- ============================================================
-- IMPORT PRESIDENCY VISITS INTO CALENDAR
-- Each Sunday visit/teaching entry becomes a meetings row
-- ============================================================
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

  FOR rec IN
    SELECT * FROM presidency_visit_schedule
    ORDER BY visit_date
  LOOP
    -- Determine title and color based on entry type
    CASE rec.entry_type
      WHEN 'visit' THEN
        v_title := 'Sunday Ward Visits';
        v_color := '#0891b2';
        v_type := 'ward_visit';
      WHEN 'teaching' THEN
        v_title := 'Sunday Teaching Assignments';
        v_color := '#7c3aed';
        v_type := 'teaching';
      WHEN 'ward_conference' THEN
        v_title := rec.president_assignment;
        v_color := '#d97706';
        v_type := 'ward_conference';
      WHEN 'stake_conference' THEN
        v_title := 'Stake Conference';
        v_color := '#dc2626';
        v_type := 'stake_conference';
      WHEN 'general_conference' THEN
        v_title := 'General Conference';
        v_color := '#16a34a';
        v_type := 'general_conference';
      WHEN 'high_council_meeting' THEN
        v_title := 'High Council Meeting';
        v_color := '#6b7280';
        v_type := 'high_council';
      WHEN 'stake_council_meeting' THEN
        v_title := 'Stake Council Meeting';
        v_color := '#6b7280';
        v_type := 'stake_council';
      ELSE
        v_title := 'Presidency Schedule';
        v_color := '#3b82f6';
        v_type := 'other';
    END CASE;

    INSERT INTO meetings (stake_id, title, meeting_type, scheduled_date, color, source_type, viewable_by_roles)
    VALUES (
      v_stake_id,
      v_title,
      v_type,
      (rec.visit_date || ' 09:00:00')::TIMESTAMPTZ,
      v_color,
      'visit_schedule',
      ARRAY['stake_presidency']
    )
    RETURNING id INTO v_meeting_id;

    -- Add agenda items for visit/teaching entries
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
        v_order := v_order + 1;
      END IF;
    END IF;

  END LOOP;

  RAISE NOTICE 'Presidency visits imported into calendar';
END $$;
