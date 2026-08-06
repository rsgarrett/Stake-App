-- One-time secure claim links for app seats. When a calling is set apart and
-- the new holder has no login, the app can mint a link you send them. They
-- choose email + password; the token is single-use and expires.

CREATE TABLE IF NOT EXISTS public.seat_claim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id UUID NOT NULL REFERENCES public.stakes(id) ON DELETE CASCADE,
  roster_row_id UUID NOT NULL REFERENCES public.stake_permission_roster(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seat_claim_tokens_roster_idx
  ON public.seat_claim_tokens (roster_row_id)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS seat_claim_tokens_hash_idx
  ON public.seat_claim_tokens (token_hash);

COMMENT ON TABLE public.seat_claim_tokens IS
  'One-time tokens for first-time seat claim (email + password). Hash only stored.';

ALTER TABLE public.seat_claim_tokens ENABLE ROW LEVEL SECURITY;

-- Leaders can see unused tokens for their stake (to know a link exists); raw token is never stored.
DROP POLICY IF EXISTS seat_claim_tokens_select ON public.seat_claim_tokens;
CREATE POLICY seat_claim_tokens_select ON public.seat_claim_tokens
  FOR SELECT TO authenticated
  USING (
    public.has_elevated_role()
    AND stake_id IN (SELECT stake_id FROM public.users WHERE id = auth.uid())
  );

-- Inserts/updates/deletes go through the service-role API only.
DROP POLICY IF EXISTS seat_claim_tokens_no_client_write ON public.seat_claim_tokens;
CREATE POLICY seat_claim_tokens_no_client_write ON public.seat_claim_tokens
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);
