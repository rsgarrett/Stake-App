"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, ClipboardList } from "lucide-react"
import {
  dutiesDueInMonth,
  monthLabel,
  periodKeyForMonth,
  type RecurringDuty,
} from "@/lib/handbook/recurring-duties"

function storageKey(stakeId: string, periodKey: string): string {
  return `stake-recurring-duties:${stakeId}:${periodKey}`
}

function readCompleted(stakeId: string, periodKey: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(storageKey(stakeId, periodKey))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [])
  } catch {
    return new Set()
  }
}

function writeCompleted(stakeId: string, periodKey: string, keys: Set<string>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(storageKey(stakeId, periodKey), JSON.stringify([...keys]))
  } catch {
    // Storage disabled — checklist still works for the session via state.
  }
}

type Props = {
  stakeId: string
}

export function RecurringDutiesCard({ stakeId }: Props) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const periodKey = periodKeyForMonth(year, month)
  const due = useMemo(() => dutiesDueInMonth(year, month), [year, month])
  const [completed, setCompleted] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setCompleted(readCompleted(stakeId, periodKey))
  }, [stakeId, periodKey])

  const toggle = (duty: RecurringDuty) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(duty.key)) next.delete(duty.key)
      else next.add(duty.key)
      writeCompleted(stakeId, periodKey, next)
      return next
    })
  }

  if (due.length === 0) return null

  const doneCount = due.filter((d) => completed.has(d.key)).length

  return (
    <Card className="mb-4 border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-indigo-950">
          <ClipboardList className="h-5 w-5 text-indigo-600" />
          Handbook recurring duties — {monthLabel(year, month)}
        </CardTitle>
        <CardDescription>
          {doneCount} of {due.length} marked complete this month (saved on this device).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {due.map((duty) => {
          const done = completed.has(duty.key)
          return (
            <button
              key={duty.key}
              type="button"
              onClick={() => toggle(duty)}
              className="flex w-full items-start gap-3 rounded-md border border-indigo-100 bg-white/80 px-3 py-2 text-left hover:bg-white transition-colors"
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-indigo-300 mt-0.5" />
              )}
              <span className={`text-sm ${done ? "text-gray-500 line-through" : "text-gray-800"}`}>
                {duty.label}
              </span>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
