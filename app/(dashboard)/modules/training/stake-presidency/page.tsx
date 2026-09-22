"use client"

import { RoleTrainingRegimen } from "@/components/training/role-training-regimen"
import { STAKE_PRESIDENCY_CURRICULUM } from "@/lib/training/curricula"

export default function StakePresidencyTrainingPage() {
  return <RoleTrainingRegimen curriculum={STAKE_PRESIDENCY_CURRICULUM} />
}
