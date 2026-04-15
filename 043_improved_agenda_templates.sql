-- Improved agenda templates for all meeting types
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
--
-- This replaces existing agendas for HC, SC, SP, and RS meetings with
-- the improved structure that matches the Google Doc templates exactly.

BEGIN;

-- ============================================================================
-- 1. WIPE AND REPOPULATE: HIGH COUNCIL & STAKE COUNCIL MEETINGS
--    13-item agenda matching the perpetual Google Doc template
-- ============================================================================

DELETE FROM meeting_agendas
WHERE meeting_id IN (
  SELECT id FROM meetings WHERE meeting_type IN ('high_council', 'high_council_meeting', 'stake_council', 'stake_council_meeting')
);

INSERT INTO meeting_agendas (meeting_id, item_order, title, duration_minutes, description)
SELECT m.id, items.item_order, items.title, items.duration_minutes, items.description
FROM meetings m
CROSS JOIN (VALUES
  (1,  'Review Calendar',                          5,  NULL),
  (2,  'Opening Hymn',                             3,  NULL),
  (3,  'Opening Prayer',                           2,  NULL),
  (4,  'Stake Vision',                             5,  NULL),
  (5,  'Handbook Training',                        10, NULL),
  (6,  'Action Items',                             10, NULL),
  (7,  'The Work of Salvation & Exaltation',       30, NULL),
  (8,  'Agenda Planning',                          5,  NULL),
  (9,  'Callings & Ordinations',                   10, NULL),
  (10, 'Assignment Reports',                       10, NULL),
  (11, 'Quarterly Report Indicators (ICCG)',       10, NULL),
  (12, 'Closing Thoughts',                         5,  NULL),
  (13, 'Closing Prayer',                           2,  NULL)
) AS items(item_order, title, duration_minutes, description)
WHERE m.meeting_type IN ('high_council', 'high_council_meeting', 'stake_council', 'stake_council_meeting');

-- ============================================================================
-- 2. WIPE AND REPOPULATE: STAKE PRESIDENCY MEETINGS
--    8-item agenda matching the perpetual Google Doc template
-- ============================================================================

DELETE FROM meeting_agendas
WHERE meeting_id IN (
  SELECT id FROM meetings WHERE meeting_type IN ('stake_presidency', 'stake_presidency_meeting')
);

INSERT INTO meeting_agendas (meeting_id, item_order, title, duration_minutes, description)
SELECT m.id, items.item_order, items.title, items.duration_minutes, items.description
FROM meetings m
CROSS JOIN (VALUES
  (1, 'Calendar Review',             5,  NULL),
  (2, 'Opening Prayer',              2,  NULL),
  (3, 'Stake Vision / Goal Review',  5,  NULL),
  (4, 'Handbook Training',           15, NULL),
  (5, 'Action Items',                10, NULL),
  (6, 'Callings & Recommendations',  10, NULL),
  (7, 'Ward & Member Needs',         10, NULL),
  (8, 'Closing Prayer',              2,  NULL)
) AS items(item_order, title, duration_minutes, description)
WHERE m.meeting_type IN ('stake_presidency', 'stake_presidency_meeting');

-- ============================================================================
-- 3. POPULATE: STAKE RELIEF SOCIETY PRESIDENCY MEETINGS (if any exist)
--    8-item agenda
-- ============================================================================

DELETE FROM meeting_agendas
WHERE meeting_id IN (
  SELECT id FROM meetings WHERE meeting_type IN ('stake_relief_society_presidency', 'relief_society_presidency')
);

INSERT INTO meeting_agendas (meeting_id, item_order, title, duration_minutes, description)
SELECT m.id, items.item_order, items.title, items.duration_minutes, items.description
FROM meetings m
CROSS JOIN (VALUES
  (1, 'Opening Prayer',                2,  NULL),
  (2, 'Spiritual Thought',             5,  NULL),
  (3, 'Calendar Review',               5,  NULL),
  (4, 'Ward RS Presidency Reports',    15, NULL),
  (5, 'Ministering Discussion',        10, NULL),
  (6, 'Training / Handbook Topic',     10, NULL),
  (7, 'Action Items',                  10, NULL),
  (8, 'Closing Prayer',                2,  NULL)
) AS items(item_order, title, duration_minutes, description)
WHERE m.meeting_type IN ('stake_relief_society_presidency', 'relief_society_presidency');

COMMIT;
