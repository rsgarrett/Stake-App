import type { SupabaseClient } from "@supabase/supabase-js"
import { MISSION_INTERVIEW_TYPE } from "@/lib/interviews/interview-types"
import { ensureMissionReadyMissionary } from "@/lib/missionary/mission-ready-defaults"

type AppRouter = { push: (href: string) => void }

export type InterviewNavigationPick = {
  id: string
  interview_type: string
  interviewee_name: string
}

/**
 * Mission interviews open the Mission Ready tracker (find-or-create by name).
 * Other types open the interview detail page.
 */
export async function navigateInterviewSelection(
  supabase: SupabaseClient,
  router: AppRouter,
  interview: InterviewNavigationPick
): Promise<void> {
  if (interview.interview_type !== MISSION_INTERVIEW_TYPE) {
    router.push(`/modules/interviews/${interview.id}`)
    return
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    router.push(`/modules/interviews/${interview.id}`)
    return
  }

  const { data: profile } = await supabase.from("users").select("stake_id").eq("id", user.id).single()
  if (!profile?.stake_id) {
    router.push(`/modules/interviews/${interview.id}`)
    return
  }

  try {
    const { id } = await ensureMissionReadyMissionary(supabase, {
      missionaryName: interview.interviewee_name,
      stakeId: profile.stake_id,
    })
    router.push(`/modules/missionary/mission-ready/${id}`)
  } catch (e) {
    console.error(e)
    router.push(`/modules/interviews/${interview.id}`)
  }
}
