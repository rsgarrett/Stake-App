-- Align Thursday calendar events with Stake Presidency Trainings and Visits
-- tab gid 1215946628 (full-year Thursday Schedule).

DELETE FROM public.meeting_agendas
WHERE meeting_id IN (
  SELECT id FROM public.meetings WHERE source_type = 'thursday_schedule'
);
DELETE FROM public.meetings WHERE source_type = 'thursday_schedule';
DELETE FROM public.thursday_schedule WHERE stake_id = (SELECT id FROM public.stakes LIMIT 1);

INSERT INTO public.thursday_schedule (
  stake_id, visit_date, ward, meeting_type, start_time, end_time, slot,
  pg_attendee, pc_attendee, pw_attendee, notes
)
SELECT s.id, t.visit_date::date, t.ward, t.meeting_type, t.start_time, t.end_time, t.slot,
       t.pg_attendee, t.pc_attendee, t.pw_attendee, t.notes
FROM (SELECT id FROM public.stakes LIMIT 1) AS s
CROSS JOIN (
  VALUES
    ('2026-01-08'::date, '8th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-01-08'::date, '12th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-01-15'::date, '17th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-01-15'::date, '18th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-01-22'::date, '8th Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL::int, NULL, NULL, NULL, NULL),
    ('2026-01-22'::date, 'Coordinating Council', 'Coordinating Council', '6:00 PM', '10:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-01-29'::date, '19th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, 'Dana Anderson', 'Mary Ann Treasure', 'Laura Brotxman', NULL),
    ('2026-01-29'::date, 'Bishops Council', 'Bishops Council', '7:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-02-05'::date, '22nd Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, 'Mitch Newey', 'Absent', 'Scott Hicken', 'PC Out of Town'),
    ('2026-02-05'::date, 'Elders Quorum Council', 'Elders Quorum Presidents', '7:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, 'PC Out of Town'),
    ('2026-02-12'::date, '23rd Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, 'Nathan Anderson', 'Barry Pewtress', 'Linda Stabb', NULL),
    ('2026-02-12'::date, 'Relief Society Council', 'Relief Society Presidents', '7:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-02-19'::date, '18th Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL::int, 'JD Jessup', 'Lynn Bybee', NULL, NULL),
    ('2026-02-26'::date, '17th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', NULL::int, 'Steven Salas', NULL, 'Tim Strong', NULL),
    ('2026-02-26'::date, '12th Ward', 'Elders Quorum Ministering', '7:00 PM', '7:45 PM', NULL::int, 'Fahy Robinson', 'Christopher Grawrock', 'Spencer Pleub', NULL),
    ('2026-03-05'::date, '22nd Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', NULL::int, 'Evan Bulauski', 'Mark Willerton', 'Burke Valentine', NULL),
    ('2026-03-05'::date, '23rd Ward', 'Elders Quorum Ministering', '7:00 PM', '7:45 PM', NULL::int, 'Nathan Anderson', NULL, NULL, NULL),
    ('2026-03-12'::date, '8th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, 'Alicia Clark', 'Becca Thiel', 'Ashlyn Jones', NULL),
    ('2026-03-12'::date, '12th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', NULL::int, 'Jessica Follett', 'Tonya Palmer', 'Michelle Tubbs', NULL),
    ('2026-03-19'::date, '19th Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL::int, NULL, NULL, NULL, NULL),
    ('2026-03-26'::date, '17th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, 'Non-member investigator', NULL, NULL),
    ('2026-03-26'::date, '18th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, 'Janet Gordon', NULL, NULL),
    ('2026-04-02'::date, '19th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, 'Dawn McDonald', 'Lynette Johnson', 'Treasure', NULL),
    ('2026-04-02'::date, '22nd Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', NULL::int, 'Ward Naegle', 'Leann Allen', 'Lowe', NULL),
    ('2026-04-09'::date, '23rd Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, 'Talin Gunnell', 'Alec Ragan', 'Shannon Dewsnup', NULL),
    ('2026-04-09'::date, '8th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, 'Thomas Braden', 'Edris Glad', 'Edris Glad', NULL),
    ('2026-04-16'::date, '12th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-04-16'::date, '17th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-04-23'::date, '22nd Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, 'Clyde Burton', NULL, 'Michael Dyer', 'Rick Smith'),
    ('2026-04-23'::date, '23rd Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, 'Chris Herrod', NULL, NULL, 'Kent Jensen is covering'),
    ('2026-05-07'::date, 'Coordinating Council', 'Coordinating Council', '6:00 PM', '10:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-05-14'::date, '19th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-05-14'::date, 'Elders Quorum Council', 'Elders Quorum Presidents', '7:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-05-21'::date, '18th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-05-21'::date, 'Relief Society Council', 'Relief Society Presidents', '7:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-05-28'::date, '8th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-05-28'::date, '12th Ward', 'Elders Quorum Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-05-28'::date, 'Bishops Council', 'Bishops Council', '7:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-06-04'::date, '17th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-06-04'::date, '19th Ward', 'Elders Quorum Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-06-11'::date, '23rd Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL::int, NULL, NULL, NULL, NULL),
    ('2026-06-25'::date, '22nd Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, 'Travel to Florida', NULL, NULL),
    ('2026-06-25'::date, '18th Ward', 'Elders Quorum Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, 'Travel to Florida', NULL, NULL),
    ('2026-07-02'::date, '8th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-07-02'::date, '12th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-07-09'::date, '17th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-07-09'::date, '18th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-07-16'::date, '19th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, 'Travel to California', NULL, NULL),
    ('2026-07-16'::date, '22nd Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, 'Travel to California', NULL, NULL),
    ('2026-07-23'::date, '23rd Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-07-23'::date, '8th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-07-30'::date, '12th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-07-30'::date, '17th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-08-06'::date, '18th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, 'Layne & Cynthia Hill', NULL, NULL),
    ('2026-08-06'::date, '19th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, 'Olivia Hernandez', NULL, NULL),
    ('2026-08-13'::date, '22nd Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-08-13'::date, '23rd Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-08-20'::date, '17th Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL::int, NULL, NULL, NULL, NULL),
    ('2026-08-27'::date, '8th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-08-27'::date, '12th Ward', 'Elders Quorum Ministering', '7:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-09-03'::date, 'Coordinating Council', 'Coordinating Council', '6:00 PM', '10:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-09-10'::date, '22nd Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL::int, NULL, NULL, NULL, NULL),
    ('2026-09-10'::date, 'Bishops Council', 'Bishops Council', '8:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-09-24'::date, '18th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-09-24'::date, 'Relief Society Council', 'Relief Society Presidents', '7:00 PM', '8:00 PM', NULL::int, NULL, 'On Vacation', NULL, NULL),
    ('2026-10-01'::date, '19th Ward', 'Elders Quorum Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-10-01'::date, 'Elders Quorum Council', 'Elders Quorum Presidents', '7:00 PM', '8:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-10-01'::date, '8th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-10-01'::date, '12th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-10-08'::date, '17th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-10-08'::date, '18th Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-10-15'::date, '19th Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-10-15'::date, '22nd Ward', 'Relief Society Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-10-22'::date, '23rd Ward', 'Relief Society Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-10-29'::date, 'Coordinating Council', 'Coordinating Council', '6:00 PM', '10:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-11-05'::date, '12th Ward Blitz', 'Elders Quorum Ministering', '6:30 PM', NULL, NULL::int, NULL, NULL, NULL, NULL),
    ('2026-11-12'::date, '8th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-11-12'::date, 'Bishops Council', 'Bishops Council', '7:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-11-19'::date, '12th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-11-19'::date, 'Elders Quorum Council', 'Elders Quorum Presidents', '7:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-12-03'::date, '17th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-12-03'::date, 'Relief Society Council', 'Relief Society Presidents', '7:00 PM', '9:00 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-12-10'::date, '18th Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-12-10'::date, '19th Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-12-17'::date, '22nd Ward', 'Bishopric Ministering', '6:00 PM', '6:45 PM', NULL::int, NULL, NULL, NULL, NULL),
    ('2026-12-17'::date, '23rd Ward', 'Bishopric Ministering', '7:00 PM', '7:45 PM', NULL::int, NULL, NULL, NULL, NULL)
) AS t(visit_date, ward, meeting_type, start_time, end_time, slot, pg_attendee, pc_attendee, pw_attendee, notes);

DO $$
DECLARE
  v_stake_id UUID;
  rec RECORD;
  v_meeting_id UUID;
  v_scheduled TIMESTAMPTZ;
  v_title TEXT;
  v_color TEXT;
  v_desc TEXT;
BEGIN
  SELECT id INTO v_stake_id FROM public.stakes LIMIT 1;
  FOR rec IN SELECT * FROM public.thursday_schedule ORDER BY visit_date, start_time NULLS LAST, ward
  LOOP
    IF rec.start_time IS NOT NULL THEN
      v_scheduled := to_timestamp(to_char(rec.visit_date, 'YYYY-MM-DD') || ' ' || rec.start_time, 'YYYY-MM-DD HH12:MI AM') AT TIME ZONE 'America/Denver';
    ELSE
      v_scheduled := (rec.visit_date::timestamp + interval '18 hours 30 minutes') AT TIME ZONE 'America/Denver';
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
    INSERT INTO public.meetings (stake_id, title, meeting_type, scheduled_date, description, color, source_type, viewable_by_roles)
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
      v_scheduled, v_desc, v_color, 'thursday_schedule', ARRAY['stake_presidency', 'stake_council']::text[]
    ) RETURNING id INTO v_meeting_id;
    INSERT INTO public.meeting_agendas (meeting_id, item_order, title, presenter, description)
    VALUES (v_meeting_id, 1, rec.ward || ' — ' || rec.meeting_type, NULL,
      COALESCE(rec.start_time || COALESCE(' - ' || rec.end_time, ''), '') ||
      CASE WHEN rec.pg_attendee IS NOT NULL THEN E'\nPG: ' || rec.pg_attendee ELSE '' END ||
      CASE WHEN rec.pc_attendee IS NOT NULL THEN E'\nPC: ' || rec.pc_attendee ELSE '' END ||
      CASE WHEN rec.pw_attendee IS NOT NULL THEN E'\nPW: ' || rec.pw_attendee ELSE '' END ||
      CASE WHEN rec.notes IS NOT NULL THEN E'\nNote: ' || rec.notes ELSE '' END);
  END LOOP;
END $$;
