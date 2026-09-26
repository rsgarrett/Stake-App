"use client"

import { RoleTrainingRegimen } from "@/components/training/role-training-regimen"
import { HIGH_COUNCIL_CURRICULUM } from "@/lib/training/curricula"

export default function HighCouncilTrainingPage() {
  return <RoleTrainingRegimen curriculum={HIGH_COUNCIL_CURRICULUM} />
}
