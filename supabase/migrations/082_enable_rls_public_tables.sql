-- Close public API access on tables that never got RLS (and any table that
-- still has RLS off). Signed-in stake users keep the same access they have today.
--
-- Fixes Supabase advisors:
--   rls_disabled_in_public
--   sensitive_columns_exposed
--
-- Anon (not logged in) is revoked. The app requires login, so this should not
-- change screens for people who are signed in.

-- 1. Enable RLS on every public table that is missing it.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- 2. Tables that now have RLS but no policies would hide all rows from the app.
--    Add authenticated access: stake-scoped when stake_id exists, otherwise
--    any signed-in user (same as today's open tables).
DO $$
DECLARE
  t record;
  pol_count int;
  has_stake boolean;
  pol_name text;
BEGIN
  FOR t IN
    SELECT c.relname AS name
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
  LOOP
    SELECT count(*) INTO pol_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = t.name;

    IF pol_count > 0 THEN
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t.name
        AND column_name = 'stake_id'
    ) INTO has_stake;

    IF has_stake THEN
      pol_name := t.name || '_authenticated_stake';
      EXECUTE format(
        'CREATE POLICY %I ON public.%I
           FOR ALL TO authenticated
           USING (stake_id IS NULL OR stake_id = public.get_user_stake_id())
           WITH CHECK (stake_id IS NULL OR stake_id = public.get_user_stake_id())',
        pol_name,
        t.name
      );
    ELSE
      pol_name := t.name || '_authenticated_all';
      EXECUTE format(
        'CREATE POLICY %I ON public.%I
           FOR ALL TO authenticated
           USING (true)
           WITH CHECK (true)',
        pol_name,
        t.name
      );
    END IF;
  END LOOP;
END $$;

-- 3. Logged-out visitors should not hit the Data API even if a leftover
--    USING (true) policy exists on an older table.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;
