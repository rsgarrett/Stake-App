"use client"

import { RoleTrainingRegimen } from "@/components/training/role-training-regimen"
import { BISHOPRIC_CURRICULUM } from "@/lib/training/curricula"

export default function BishopricTrainingPage() {
  return <RoleTrainingRegimen curriculum={BISHOPRIC_CURRICULUM} />
}
