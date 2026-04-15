-- Fix calendar meeting titles to use shorter abbreviations
-- so "Ministering" is always visible and not truncated

UPDATE meetings
SET title = REPLACE(title, 'Relief Society Ministering', 'RS Ministering')
WHERE title LIKE '%Relief Society Ministering%';

UPDATE meetings
SET title = REPLACE(title, 'Elders Quorum Ministering', 'EQ Ministering')
WHERE title LIKE '%Elders Quorum Ministering%';

UPDATE meetings
SET title = REPLACE(title, 'Relief Society Presidents', 'RS Presidents Council')
WHERE title LIKE '%Relief Society Presidents%';

UPDATE meetings
SET title = REPLACE(title, 'Elders Quorum Presidents', 'EQ Presidents Council')
WHERE title LIKE '%Elders Quorum Presidents%';
