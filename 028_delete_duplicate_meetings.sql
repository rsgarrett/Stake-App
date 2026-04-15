-- Delete duplicate imported meetings (from multiple runs of 026, 029)
-- Keeps one meeting per unique (source_type, title, meeting_type, date)
-- meeting_agendas cascade automatically

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
