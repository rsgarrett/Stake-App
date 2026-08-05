/**
 * Handbook training curriculum for high council / stake council agendas.
 *
 * In addition to rotating WHO trains (see opening-rotation.ts), the TOPIC also
 * rotates through a fixed course of General Handbook chapters chosen by the
 * stake presidency: 1, 2, 3, 4, 6 (especially 6.5), 17, 29, 30, and 31.
 *
 * A whole chapter is far too much for the 5–7 minute training slot, so each
 * chapter is broken into short segments (one to a few adjacent sections) that
 * can realistically be taught in that time. When the last segment is used the
 * rotation wraps back to the beginning.
 *
 * Section numbers and titles follow the current edition of the General
 * Handbook on churchofjesuschrist.org.
 */

export interface HandbookTrainingSegment {
  /** Display reference, e.g. "4.2.1–4.2.2". */
  ref: string
  /** Individual section numbers this segment covers (used to match saved topics). */
  covers: string[]
  /** Short title(s) of the covered sections. */
  title: string
  chapter: number
  chapterTitle: string
  /** URL slug of the chapter on churchofjesuschrist.org. */
  chapterSlug: string
}

interface ChapterDef {
  chapter: number
  chapterTitle: string
  chapterSlug: string
  segments: { ref: string; covers: string[]; title: string }[]
}

const CHAPTERS: ChapterDef[] = [
  {
    chapter: 1,
    chapterTitle: "God’s Plan and Your Role in His Work of Salvation and Exaltation",
    chapterSlug: "1-work-of-salvation-and-exaltation",
    segments: [
      { ref: "1.1–1.2", covers: ["1.1", "1.2"], title: "God’s Plan of Happiness; God’s Work of Salvation and Exaltation" },
      { ref: "1.3", covers: ["1.3"], title: "Ordinances and Covenants Necessary for Salvation and Exaltation" },
      { ref: "1.4.1–1.4.2", covers: ["1.4.1", "1.4.2"], title: "Living the Gospel of Jesus Christ; Caring for Those in Need" },
      { ref: "1.4.3–1.4.4", covers: ["1.4.3", "1.4.4"], title: "Inviting All to Receive the Gospel; Uniting Families for Eternity" },
      { ref: "1.5–1.6", covers: ["1.5", "1.6"], title: "The Purpose of the Church; Your Role in God’s Work" },
    ],
  },
  {
    chapter: 2,
    chapterTitle: "Supporting Individuals and Families in God’s Work of Salvation and Exaltation",
    chapterSlug: "2-supporting-individuals-and-families",
    segments: [
      { ref: "2.1", covers: ["2.1", "2.1.1", "2.1.2", "2.1.3"], title: "The Role of the Family in God’s Plan" },
      { ref: "2.2.1–2.2.2", covers: ["2.2.1", "2.2.2"], title: "A Home Where the Spirit Is Present; Sabbath Observance" },
      { ref: "2.2.3–2.2.5", covers: ["2.2.3", "2.2.4", "2.2.5"], title: "Gospel Study at Home; Home Evening; Supporting Individuals" },
      { ref: "2.3", covers: ["2.3"], title: "The Relationship between the Home and the Church" },
    ],
  },
  {
    chapter: 3,
    chapterTitle: "Priesthood Principles",
    chapterSlug: "3-priesthood-principles",
    segments: [
      { ref: "3.1–3.2", covers: ["3.1", "3.2"], title: "Restoration of the Priesthood; Blessings of the Priesthood" },
      { ref: "3.3", covers: ["3.3", "3.3.1", "3.3.2"], title: "Melchizedek Priesthood and Aaronic Priesthood" },
      { ref: "3.4.1", covers: ["3.4.1"], title: "Priesthood Keys" },
      { ref: "3.4.2–3.4.3", covers: ["3.4.2", "3.4.3"], title: "Priesthood Conferral and Ordination; Delegation of Priesthood Authority to Serve in the Church" },
      { ref: "3.4.4", covers: ["3.4.4"], title: "Exercising Priesthood Authority Righteously" },
      { ref: "3.5.1–3.5.2", covers: ["3.5.1", "3.5.2"], title: "Ordinances; Covenants" },
      { ref: "3.5.3–3.5.4", covers: ["3.5.3", "3.5.4"], title: "Ordinances and Covenants Necessary for Salvation and Exaltation; The Sacrament" },
      { ref: "3.6–3.7", covers: ["3.6", "3.7"], title: "Priesthood Power; The Priesthood and the Home" },
    ],
  },
  {
    chapter: 4,
    chapterTitle: "Leadership and Councils in the Church of Jesus Christ",
    chapterSlug: "4-leadership-in-the-church-of-jesus-christ",
    segments: [
      { ref: "4.1", covers: ["4.1"], title: "The Purpose of Leadership in the Church" },
      { ref: "4.2.1–4.2.2", covers: ["4.2.1", "4.2.2"], title: "Prepare Spiritually; Minister to All of God’s Children" },
      { ref: "4.2.3–4.2.4", covers: ["4.2.3", "4.2.4"], title: "Teach the Gospel of Jesus Christ; Preside in Righteousness" },
      { ref: "4.2.5–4.2.6", covers: ["4.2.5", "4.2.6"], title: "Delegate Responsibility and Ensure Accountability; Prepare Others to Be Leaders and Teachers" },
      { ref: "4.2.7–4.2.8", covers: ["4.2.7", "4.2.8"], title: "Plan Meetings, Lessons, and Activities with Clear Purposes; Evaluating Your Efforts" },
      { ref: "4.3–4.4.1", covers: ["4.3", "4.4.1"], title: "Councils in the Church; Purposes of Councils" },
      { ref: "4.4.2–4.4.3", covers: ["4.4.2", "4.4.3"], title: "Preparation for Council Meetings; Discussion and Decisions" },
      { ref: "4.4.4–4.4.6", covers: ["4.4.4", "4.4.5", "4.4.6"], title: "Unity; Action and Accountability; Confidentiality" },
    ],
  },
  {
    chapter: 6,
    chapterTitle: "Stake Leadership",
    chapterSlug: "6-stake-leadership",
    segments: [
      { ref: "6.1", covers: ["6.1"], title: "Purposes of a Stake" },
      { ref: "6.2.1–6.2.2", covers: ["6.2.1", "6.2.2"], title: "Presiding High Priest; Leading God’s Work of Salvation and Exaltation in the Stake" },
      { ref: "6.2.3–6.2.4", covers: ["6.2.3", "6.2.4"], title: "Common Judge; Records, Finances, and Properties" },
      // 6.5 gets extra depth on purpose — it is the high council's own charter.
      { ref: "6.5", covers: ["6.5"], title: "The High Council (overview)" },
      { ref: "6.5.1", covers: ["6.5.1"], title: "High Councilors Represent the Stake Presidency" },
      { ref: "6.5.2", covers: ["6.5.2"], title: "High Councilors Serve on Stake Councils and Committees" },
      { ref: "6.5.3", covers: ["6.5.3"], title: "High Councilors Serve as Stake Organization Leaders" },
      { ref: "6.7–6.8", covers: ["6.7", "6.8"], title: "Stake Organizations; Stake Specialists" },
    ],
  },
  {
    chapter: 17,
    chapterTitle: "Teaching the Gospel",
    chapterSlug: "17-teaching-the-gospel",
    segments: [
      { ref: "17.1.1–17.1.2", covers: ["17.1.1", "17.1.2"], title: "Love Those You Teach; Teach by the Spirit" },
      { ref: "17.1.3–17.1.4", covers: ["17.1.3", "17.1.4"], title: "Teach the Doctrine; Invite Diligent Learning" },
      { ref: "17.2–17.3", covers: ["17.2", "17.3"], title: "Home-Centered Gospel Learning and Teaching; Leaders’ Responsibilities" },
      { ref: "17.4–17.5", covers: ["17.4", "17.5"], title: "Teacher Council Meetings; Teacher Council Meetings for Parents" },
    ],
  },
  {
    chapter: 29,
    chapterTitle: "Meetings in the Church",
    chapterSlug: "29-meetings-in-the-church",
    segments: [
      { ref: "29.1", covers: ["29.1"], title: "Planning and Conducting Meetings" },
      { ref: "29.2.1–29.2.2", covers: ["29.2.1", "29.2.2"], title: "Sacrament Meeting; Fast and Testimony Meeting" },
      { ref: "29.2.3–29.2.5", covers: ["29.2.3", "29.2.4", "29.2.5"], title: "Ward Conference; Bishopric Meeting; Ward Council Meeting" },
      { ref: "29.3.1–29.3.3", covers: ["29.3.1", "29.3.2", "29.3.3"], title: "Stake Conference; Stake General Priesthood Meeting; Stake Priesthood Leadership Meeting" },
      { ref: "29.3.5–29.3.7", covers: ["29.3.5", "29.3.6", "29.3.7"], title: "Stake Presidency Meeting; High Council Meeting; Stake Council Meeting" },
      { ref: "29.6–29.7", covers: ["29.6", "29.7"], title: "Prayers in Church Meetings; Streaming and Virtual Meetings" },
    ],
  },
  {
    chapter: 30,
    chapterTitle: "Callings in the Church",
    chapterSlug: "30-callings-in-the-church",
    segments: [
      { ref: "30.1.1–30.1.3", covers: ["30.1.1", "30.1.2", "30.1.3"], title: "Determining Whom to Call: General Guidelines; New Members; Those Who Are Not Members" },
      { ref: "30.1.4–30.1.5", covers: ["30.1.4", "30.1.5"], title: "Confidentiality; Recommendations and Approvals for Callings" },
      { ref: "30.2–30.3", covers: ["30.2", "30.3"], title: "Extending a Calling; Sustaining Members in Callings" },
      { ref: "30.4–30.6", covers: ["30.4", "30.5", "30.6"], title: "Setting Apart; Length of Service; Releasing Members from Callings" },
    ],
  },
  {
    chapter: 31,
    chapterTitle: "Interviews and Other Meetings with Leaders",
    chapterSlug: "31-interviews-and-other-meetings-with-leaders",
    segments: [
      { ref: "31.1.1–31.1.4", covers: ["31.1.1", "31.1.2", "31.1.3", "31.1.4"], title: "Prepare Spiritually; Help the Member Feel God’s Love, Draw on the Savior’s Power, and Feel Safe" },
      { ref: "31.1.5–31.1.8", covers: ["31.1.5", "31.1.6", "31.1.7", "31.1.8"], title: "Ask Inspired Questions and Listen; Encourage Self-Reliance; Support Repentance; Respond Appropriately to Abuse" },
      { ref: "31.2.1–31.2.2", covers: ["31.2.1", "31.2.2"], title: "Purposes of Interviews; Types of Interviews" },
      { ref: "31.2.5", covers: ["31.2.5"], title: "Temple Recommend Interviews" },
      { ref: "31.3", covers: ["31.3", "31.3.1", "31.3.2", "31.3.3", "31.3.4", "31.3.5", "31.3.6"], title: "Other Opportunities for Leaders to Meet with Members" },
    ],
  },
]

export const HANDBOOK_TRAINING_CURRICULUM: HandbookTrainingSegment[] = CHAPTERS.flatMap(
  (ch) =>
    ch.segments.map((s) => ({
      ...s,
      chapter: ch.chapter,
      chapterTitle: ch.chapterTitle,
      chapterSlug: ch.chapterSlug,
    }))
)

/** The text stored on the agenda item, e.g. "6.5.1 — High Councilors Represent the Stake Presidency". */
export function segmentTopicText(seg: HandbookTrainingSegment): string {
  return `${seg.ref} — ${seg.title}`
}

export function segmentHandbookUrl(seg: HandbookTrainingSegment): string {
  return `https://www.churchofjesuschrist.org/study/manual/general-handbook/${seg.chapterSlug}?lang=eng`
}

/** Which meeting types follow the handbook curriculum (high council template family). */
export function usesHandbookCurriculum(meetingType: string | null | undefined): boolean {
  const slug = (meetingType ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_")
  return (
    slug === "high_council" ||
    slug === "high_council_meeting" ||
    slug === "stake_council" ||
    slug === "stake_council_meeting"
  )
}

/**
 * Finds the curriculum segment a saved topic refers to by matching the section
 * numbers in the text (e.g. "4.2.3 — Teach the Gospel..." or just "4.2.3").
 * Returns null when the topic doesn't reference any curriculum section.
 */
export function findCurriculumSegment(topic: string | null | undefined): HandbookTrainingSegment | null {
  const raw = (topic ?? "").trim()
  if (!raw) return null
  const tokens = raw.match(/\d+(?:\.\d+)+|\b\d+\b/g) ?? []

  // Exact section match wins (so "6.5.3" hits its own segment, not the "6.5" overview).
  for (const token of tokens) {
    for (const seg of HANDBOOK_TRAINING_CURRICULUM) {
      if (seg.covers.includes(token)) return seg
    }
  }
  // Topic is deeper than any covered section: pick the segment whose covered
  // section is the longest prefix (e.g. "3.3.1" → the "3.3" segment).
  for (const token of tokens) {
    let best: { seg: HandbookTrainingSegment; len: number } | null = null
    for (const seg of HANDBOOK_TRAINING_CURRICULUM) {
      for (const c of seg.covers) {
        if (token.startsWith(c + ".") && (!best || c.length > best.len)) {
          best = { seg, len: c.length }
        }
      }
    }
    if (best) return best.seg
  }
  // Topic is broader than the segments (e.g. "1.4"): first segment inside it.
  for (const token of tokens) {
    for (const seg of HANDBOOK_TRAINING_CURRICULUM) {
      if (seg.covers.some((c) => c.startsWith(token + "."))) return seg
    }
  }
  return null
}

/**
 * The segment that should be taught after `prevTopic`. Wraps back to the start
 * of the plan after the last segment; starts at the beginning when the
 * previous topic is empty or unrecognized.
 */
export function nextCurriculumSegment(prevTopic: string | null | undefined): HandbookTrainingSegment {
  const prev = findCurriculumSegment(prevTopic)
  if (!prev) return HANDBOOK_TRAINING_CURRICULUM[0]
  const idx = HANDBOOK_TRAINING_CURRICULUM.indexOf(prev)
  return HANDBOOK_TRAINING_CURRICULUM[(idx + 1) % HANDBOOK_TRAINING_CURRICULUM.length]
}
