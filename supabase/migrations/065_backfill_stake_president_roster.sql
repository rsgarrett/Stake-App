-- Seat existing stake presidents on stake_permission_roster when the presidency row is still vacant.
-- (users.role was set before roster UI migration 064 / never assigned via Settings.)

UPDATE public.stake_permission_roster spr
SET
  assigned_user_id = pres.id,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (u.stake_id)
    u.stake_id,
    u.id
  FROM public.users u
  WHERE u.stake_id IS NOT NULL
    AND u.role::text = 'stake_president'
  ORDER BY u.stake_id, u.created_at ASC NULLS LAST, u.id ASC
) AS pres
WHERE spr.stake_id = pres.stake_id
  AND spr.office_slug = 'stake_president'
  AND spr.assigned_user_id IS NULL;
