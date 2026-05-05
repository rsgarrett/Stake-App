/**
 * Stewardship areas carried directly by stake presidency members in the HC assignment sheet
 * (no dedicated HC roster row). Update when the presidency assignment sheet changes.
 *
 * Clerk-editable alternative: migrate a `stakes.hc_presidency_note` TEXT column later.
 */

export function getHcPresidencyOnlyAssignmentLines(): { title: string; lines: string[] }[] {
  return [
    {
      title: "President Garrett — presidency stewardship",
      lines: [
        "President, High Priests Group",
        "Bishops coordination",
        "Relief Society (stake lead)",
        "First-time temple recommends",
      ],
    },
    {
      title: "President Williams — presidency stewardship",
      lines: ["Audits (financial and membership)", "Military relations"],
    },
  ]
}
