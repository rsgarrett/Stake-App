-- Seat succession for high councilors: when a new councilor replaces a
-- released one, the new member's row records who they replaced. The Return &
-- Report history view follows this chain so the seat's report history stays
-- intact under the current holder (each report still labeled with its author).

ALTER TABLE public.high_council_members
  ADD COLUMN IF NOT EXISTS replaced_member_id UUID
    REFERENCES public.high_council_members(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.high_council_members.replaced_member_id IS
  'The released councilor this member replaced (set by the calling tracker); links seat history across holders.';
