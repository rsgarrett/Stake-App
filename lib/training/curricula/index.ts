import type { CurriculumKey, RoleCurriculum } from "@/lib/training/regimen-types"
import { STAKE_PRESIDENCY_CURRICULUM } from "@/lib/training/curricula/stake-presidency"
import { HIGH_COUNCIL_CURRICULUM } from "@/lib/training/curricula/high-council"
import { BISHOPRIC_CURRICULUM } from "@/lib/training/curricula/bishopric"

export { STAKE_PRESIDENCY_CURRICULUM, HIGH_COUNCIL_CURRICULUM, BISHOPRIC_CURRICULUM }

export const ALL_CURRICULA: RoleCurriculum[] = [
  STAKE_PRESIDENCY_CURRICULUM,
  HIGH_COUNCIL_CURRICULUM,
  BISHOPRIC_CURRICULUM,
]

export function getCurriculum(key: CurriculumKey): RoleCurriculum {
  const found = ALL_CURRICULA.find((c) => c.key === key)
  if (!found) throw new Error(`Unknown curriculum: ${key}`)
  return found
}
