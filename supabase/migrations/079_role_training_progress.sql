-- Server-side completion for role training regimens
-- (stake presidency, high council, bishopric).

CREATE TABLE IF NOT EXISTS public.role_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stake_id UUID REFERENCES public.stakes(id) ON DELETE SET NULL,
  curriculum_key TEXT NOT NULL CHECK (
    curriculum_key IN ('stake_presidency', 'high_council', 'bishopric')
  ),
  lesson_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress')),
  reflection_note TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, curriculum_key, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_role_training_progress_user
  ON public.role_training_progress (user_id, curriculum_key);

CREATE INDEX IF NOT EXISTS idx_role_training_progress_stake
  ON public.role_training_progress (stake_id, curriculum_key);

DROP TRIGGER IF EXISTS role_training_progress_updated_at ON public.role_training_progress;
CREATE TRIGGER role_training_progress_updated_at
  BEFORE UPDATE ON public.role_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.role_training_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_training_progress_select_own_or_elevated" ON public.role_training_progress;
CREATE POLICY "role_training_progress_select_own_or_elevated"
  ON public.role_training_progress FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      public.has_elevated_role()
      AND stake_id IS NOT DISTINCT FROM public.get_user_stake_id()
    )
  );

DROP POLICY IF EXISTS "role_training_progress_insert_own" ON public.role_training_progress;
CREATE POLICY "role_training_progress_insert_own"
  ON public.role_training_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "role_training_progress_update_own" ON public.role_training_progress;
CREATE POLICY "role_training_progress_update_own"
  ON public.role_training_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "role_training_progress_delete_own" ON public.role_training_progress;
CREATE POLICY "role_training_progress_delete_own"
  ON public.role_training_progress FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
