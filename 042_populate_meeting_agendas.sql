-- Populate agenda items for all High Council, Stake Council, and Stake Presidency meetings
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

BEGIN;

-- ============================================================================
-- 1. HIGH COUNCIL & STAKE COUNCIL MEETINGS (19 meetings with no agenda)
--    Agenda structure from "2026 High Council & Stake Council_perpetual" doc
-- ============================================================================

INSERT INTO meeting_agendas (meeting_id, item_order, title, duration_minutes, description)
SELECT m.id, items.item_order, items.title, items.duration_minutes, items.description
FROM meetings m
CROSS JOIN (VALUES
  (1,  'Review Calendar',                          5,  'Review upcoming events and dates'),
  (2,  'Opening Hymn',                             3,  NULL),
  (3,  'Opening Prayer',                           2,  NULL),
  (4,  'Stake Vision',                             5,  NULL),
  (5,  'Handbook Training',                        10, 'Handbook topic discussion'),
  (6,  'Action Items',                             10, 'Assignments with bishoprics, ward councils, and EQ presidencies'),
  (7,  'The Work of Salvation & Exaltation',       30, 'Administration items, decisions, and actions'),
  (8,  'Agenda Planning',                          5,  NULL),
  (9,  'Callings & Ordinations',                   10, NULL),
  (10, 'Assignment Reports',                       10, NULL),
  (11, 'Quarterly Report Indicators (ICCG)',       10, NULL),
  (12, 'Closing Thoughts',                         5,  'President Garrett'),
  (13, 'Closing Prayer',                           2,  NULL)
) AS items(item_order, title, duration_minutes, description)
WHERE m.meeting_type IN ('high_council', 'stake_council')
  AND m.id NOT IN (SELECT DISTINCT meeting_id FROM meeting_agendas);

-- ============================================================================
-- 2. STAKE PRESIDENCY MEETINGS — new meetings with no agenda (3 meetings)
-- ============================================================================

INSERT INTO meeting_agendas (meeting_id, item_order, title, duration_minutes, description)
SELECT m.id, items.item_order, items.title, items.duration_minutes, items.description
FROM meetings m
CROSS JOIN (VALUES
  (1, 'Opening Prayer',            2,  NULL),
  (2, 'Stake Vision / Goal Review', 5,  NULL),
  (3, 'Handbook Training',         15, NULL),
  (4, 'Calendar Review',           5,  NULL),
  (5, 'Action Items',              10, NULL),
  (6, 'Callings & Recommendations', 10, NULL),
  (7, 'Ward & Member Needs',       10, NULL),
  (8, 'Closing Prayer',            2,  NULL)
) AS items(item_order, title, duration_minutes, description)
WHERE m.meeting_type IN ('stake_presidency', 'stake_presidency_meeting')
  AND m.id NOT IN (SELECT DISTINCT meeting_id FROM meeting_agendas);

-- ============================================================================
-- 3. UPDATE EXISTING SP MEETINGS — replace 4-item agendas with full 8-item
--    (Only affects meetings that currently have exactly 4 or fewer items)
-- ============================================================================

-- Delete old sparse agendas for SP meetings that only have ≤4 items
DELETE FROM meeting_agendas
WHERE meeting_id IN (
  SELECT meeting_id
  FROM meeting_agendas
  WHERE meeting_id IN (
    SELECT id FROM meetings WHERE meeting_type IN ('stake_presidency', 'stake_presidency_meeting')
  )
  GROUP BY meeting_id
  HAVING COUNT(*) <= 4
);

-- Re-insert full agenda for those SP meetings
INSERT INTO meeting_agendas (meeting_id, item_order, title, duration_minutes, description)
SELECT m.id, items.item_order, items.title, items.duration_minutes, items.description
FROM meetings m
CROSS JOIN (VALUES
  (1, 'Opening Prayer',            2,  NULL),
  (2, 'Stake Vision / Goal Review', 5,  NULL),
  (3, 'Handbook Training',         15, NULL),
  (4, 'Calendar Review',           5,  NULL),
  (5, 'Action Items',              10, NULL),
  (6, 'Callings & Recommendations', 10, NULL),
  (7, 'Ward & Member Needs',       10, NULL),
  (8, 'Closing Prayer',            2,  NULL)
) AS items(item_order, title, duration_minutes, description)
WHERE m.meeting_type IN ('stake_presidency', 'stake_presidency_meeting')
  AND m.id NOT IN (SELECT DISTINCT meeting_id FROM meeting_agendas);

COMMIT;
