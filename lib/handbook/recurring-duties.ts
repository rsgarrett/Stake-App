export type DutyCadence = "monthly" | "quarterly" | "semiannual" | "annual"

export type RecurringDuty = {
  key: string
  label: string
  cadence: DutyCadence
  /** 1–12; used for semiannual/annual windows */
  months?: number[]
}

/** Handbook-aligned recurring stake president duties (General Handbook 6, 22, 34). */
export const RECURRING_DUTIES: RecurringDuty[] = [
  { key: "financial-statement", label: "Review stake financial statement", cadence: "monthly" },
  {
    key: "bishop-interviews",
    label: "Bishop interviews (incl. fast offering review, 22.9.1.1)",
    cadence: "monthly",
  },
  { key: "quarterly-reports", label: "Review each ward Quarterly Report", cadence: "quarterly" },
  { key: "budget-allocations", label: "Review budget allocations", cadence: "quarterly" },
  {
    key: "financial-audits",
    label: "Financial audits (twice yearly)",
    cadence: "semiannual",
    months: [6, 12],
  },
  {
    key: "membership-audits",
    label: "Membership record audits (due Jun 15 / Dec 15)",
    cadence: "semiannual",
    months: [6, 12],
  },
  {
    key: "patriarch-review",
    label: "Meet with patriarch; review his blessings (6.6.4)",
    cadence: "semiannual",
    months: [6, 12],
  },
  {
    key: "tithing-declaration",
    label: "Tithing declaration in every ward",
    cadence: "annual",
    months: [11, 12, 1],
  },
  { key: "stake-budget", label: "Stake budget planning", cadence: "annual", months: [10, 11, 12] },
  { key: "ward-conferences", label: "Ward conferences (schedule & follow-up)", cadence: "annual" },
  {
    key: "sacred-funds-training",
    label: '"Sacred Funds" training for bishoprics',
    cadence: "annual",
    months: [1, 2],
  },
]

function isQuarterEndMonth(month: number): boolean {
  return month === 3 || month === 6 || month === 9 || month === 12
}

/** Duties that should appear on the presidency checklist for the given calendar month. */
export function dutiesDueInMonth(year: number, month: number): RecurringDuty[] {
  return RECURRING_DUTIES.filter((duty) => {
    switch (duty.cadence) {
      case "monthly":
        return true
      case "quarterly":
        return isQuarterEndMonth(month)
      case "semiannual":
      case "annual":
        return duty.months?.includes(month) ?? duty.cadence === "annual"
      default:
        return false
    }
  })
}

export function periodKeyForMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })
}
