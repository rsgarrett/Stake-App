/**
 * Bishop / bishopric training — aligned with the General Handbook and resources on
 * churchofjesuschrist.org. Not a substitute for the Handbook, area direction, or your
 * stake president’s counsel. The external Google Slides deck you use locally can be
 * mirrored here by stake leaders (Edit) when slide text is pasted or summarized.
 */

export type BishopTopic = {
  id: string
  title: string
  summary: string
  handbookFocus: string[]
  practices: string[]
}

export const BISHOP_OFFICIAL_RESOURCES: { label: string; href: string; description: string }[] = [
  {
    label: "Church of Jesus Christ (home)",
    href: "https://www.churchofjesuschrist.org/?lang=eng",
    description: "Central hub for news, Jesus Christ, General Conference, Come Follow Me, temples, and service.",
  },
  {
    label: "Handbooks and Callings",
    href: "https://www.churchofjesuschrist.org/study/handbooks-and-callings?lang=eng",
    description: "General Handbook, leadership instruction, and calling manuals for ward and stake leaders.",
  },
  {
    label: "General Handbook",
    href: "https://www.churchofjesuschrist.org/study/manual/general-handbook?lang=eng",
    description: "Search “bishop,” “bishopric,” “sacrament,” “finances,” “youth,” “ministering,” and “records.”",
  },
  {
    label: "Handbook 4 — Leadership and councils",
    href: "https://www.churchofjesuschrist.org/study/manual/general-handbook/4-leadership-in-the-church-of-jesus-christ?lang=eng",
    description: "Current direction on bishopric meeting, ward council, and coordinating God’s work in the ward.",
  },
  {
    label: "Serve in the Church",
    href: "https://www.churchofjesuschrist.org/serve?lang=eng",
    description: "Calling overviews, leadership topics, and links to bishop- and ward-focused helps.",
  },
  {
    label: "Come Follow Me",
    href: "https://www.churchofjesuschrist.org/study/come-follow-me?lang=eng",
    description: "Weekly scripture study to teach with power and nourish your own conversion.",
  },
  {
    label: "General Conference",
    href: "https://www.churchofjesuschrist.org/study/general-conference?lang=eng",
    description: "Prophetic teaching on faith, repentance, ministering, and shepherding God’s children.",
  },
  {
    label: "Gospel Library",
    href: "https://www.churchofjesuschrist.org/study/library?lang=eng",
    description: "Scriptures, manuals, videos, and audio for personal and class preparation on mobile or web.",
  },
  {
    label: "Handbook — abuse and cruelty",
    href: "https://www.churchofjesuschrist.org/study/manual/general-handbook/0-introductory-guidelines/21-abuse-and-cruelty?lang=eng",
    description: "Introductory guidelines on abuse and cruelty; follow with area and legal requirements in your jurisdiction.",
  },
]

export const BISHOP_TOPICS: BishopTopic[] = [
  {
    id: "keys-ward",
    title: "Priesthood keys in the ward",
    summary:
      "The bishop holds priesthood keys for his ward. He presides, sits on the stand, and is the presiding high priest. Counselors act under his direction.",
    handbookFocus: [
      "Keys authorize ordinances and govern God’s work in the ward; the bishop does not stand alone—counselors, clerks, and auxiliary leaders share the load.",
      "Serious membership matters and certain interviews follow current Handbook procedures.",
    ],
    practices: [
      "Hold regular bishopric meeting; follow up on assignments in writing or task lists.",
      "When uncertain on keys or discipline, counsel with the stake president early.",
    ],
  },
  {
    id: "bishopric-councils",
    title: "Bishopric meeting and ward council",
    summary:
      "Under the current General Handbook, wards no longer hold a separate priesthood executive committee meeting. The bishopric coordinates in bishopric meeting. Ward council unifies Relief Society, elders quorum, auxiliaries, and others to care for individuals and families. Delicate matters may be addressed in an expanded bishopric meeting when the Handbook directs.",
    handbookFocus: [
      "Follow the current General Handbook on bishopric meetings, ward council, and when to include additional participants.",
      "Councils seek revelation together under the bishop’s leadership—focus on salvation, exaltation, and ministering.",
    ],
    practices: [
      "Prepare agendas in advance; leave time for revelation, not only announcements.",
      "Rotate who leads agenda sections; invite brief reports tied to names and needs; end with clear owners and dates.",
    ],
  },
  {
    id: "sacrament-worship",
    title: "Sacrament meeting and Sabbath worship",
    summary:
      "Sacrament is the main meeting; music, prayers, and talks should invite the Spirit. The bishop ensures worthiness and dignity on the stand.",
    handbookFocus: [
      "Speakers and youth speakers are prepared; sacrament is administered reverently.",
      "Fast and testimony meeting is guided by the Spirit; the bishop may gently coach patterns of testimony.",
    ],
    practices: [
      "Meet briefly with the sacrament coordinator and young men leaders regularly.",
      "Thank members publicly for Christ-centered messages.",
    ],
  },
  {
    id: "interviews-worthiness",
    title: "Interviews, worthiness, and confidentiality",
    summary:
      "Annual youth and other interviews are opportunities to teach doctrine, listen, and protect. Confidentiality is sacred.",
    handbookFocus: [
      "Youth interviews: two-deep leadership, parent awareness as outlined in current policy, and focus on discipleship.",
      "Temple recommend and other interviews follow current questions and procedures.",
    ],
    practices: [
      "Begin and end with prayer when appropriate; listen more than you lecture.",
      "Never gossip; clerks see only what the Handbook requires in records.",
    ],
  },
  {
    id: "callings",
    title: "Callings, releases, and sustaining",
    summary:
      "Callings come through revelation. The bishop proposes names to the stake president; after approval, interviews and sustaining follow Handbook timing.",
    handbookFocus: [
      "Releases honor faithful service; new callings are extended as from the Lord.",
      "Aaronic Priesthood quorum presidents work closely with the bishop as quorum presidents.",
    ],
    practices: [
      "Keep a disciplined pipeline with the clerk; avoid “surprise” releases without prayer.",
      "Document next steps after each bishopric meeting.",
    ],
  },
  {
    id: "finances-building",
    title: "Ward budget, fast offerings, and facilities",
    summary:
      "The bishop authorizes expenses within stake guidelines; fast offerings bless the poor. Building representatives and safety matter every week.",
    handbookFocus: [
      "Two signatures, training for finance clerks, and annual audit cooperation.",
      "Protect the Lord’s resources—physical, financial, and digital.",
    ],
    practices: [
      "Review financial statements monthly with a counselor or clerk.",
      "Walk the building with the facilities representative periodically.",
    ],
  },
  {
    id: "youth-children",
    title: "Youth, children, and protection",
    summary:
      "Youth conferences, camps, and activities require trained leaders and current safety resources. Primary and youth need visible support from the bishopric.",
    handbookFocus: [
      "Youth protection training and event approval processes from the stake.",
      "Balance delegation to Young Men and Young Women presidencies with your visible interest.",
    ],
    practices: [
      "Know your Young Women class presidents’ and Aaronic leaders’ names; attend key youth events when possible.",
      "Post and use the Church’s abuse help resources where leaders can find them quickly.",
    ],
  },
  {
    id: "welfare-ministering",
    title: "Welfare, ministering, and the one",
    summary:
      "Bishops coordinate temporal and spiritual relief with the ward council. Ministering companionships report needs without breaking confidence.",
    handbookFocus: [
      "Bishop’s storehouse, fast offerings, and stake welfare specialists support complex cases.",
      "The ward is organized to find and bless the one.",
    ],
    practices: [
      "Keep a short list of families needing extra contact this month; review in ward council.",
      "Pair Relief Society and elders quorum presidents in planning for difficult cases.",
    ],
  },
  {
    id: "stake-line",
    title: "Stake relationship and high council support",
    summary:
      "The stake president holds keys for the stake. Bishops report major concerns, follow stake calendar priorities, and welcome assigned high councilors.",
    handbookFocus: [
      "Stake council decisions flow into ward council agendas.",
      "Temple recommend interviews for stake callings and certain matters follow Handbook routing.",
    ],
    practices: [
      "Send concise, factual questions to the stake president rather than guessing at policy.",
      "Prepare a brief monthly “wins and worries” for your high councilor or coordinating visits.",
    ],
  },
  {
    id: "self-care",
    title: "Family, conversion, and sustainable service",
    summary:
      "You cannot give what you do not have. Protect family evenings, personal scripture study, and sleep where possible.",
    handbookFocus: [
      "Delegate clerical work to trained clerks; share teaching visits with counselors.",
      "The Savior ministered out of His own closeness to the Father.",
    ],
    practices: [
      "Schedule reflection quarterly with your spouse (without confidential details).",
      "Ask the stake president when your plate is full—humility is strength.",
    ],
  },
]

export const BISHOP_FIRST_DAYS_CHECKLIST: { id: string; label: string }[] = [
  { id: "b1", label: "Walk the orientation modules on this page with your counselors once" },
  { id: "b2", label: "Confirm ward council and bishopric calendars; assign who owns agendas" },
  { id: "b3", label: "Read Handbook sections your stake president highlights for new bishops" },
  { id: "b4", label: "Meet the Relief Society president and elders quorum president for joint priorities" },
  { id: "b5", label: "Review youth protection status for all who work with youth and children" },
  { id: "b6", label: "Review ward budget and fast-offering trends with the ward clerk" },
  { id: "b7", label: "Set one personal spiritual goal for your first year as bishop" },
]

export type BishopOfficialResourceRow = {
  id: string
  label: string
  href: string
  description: string
}

export type BishopSlide = {
  id: string
  title: string
  body: string
}

export type BishopSlidePresentation = {
  title: string
  intro: string
  slides: BishopSlide[]
}

export type BishopTrainingPayload = {
  intro: string
  disclaimer: string
  topics: BishopTopic[]
  checklist: { id: string; label: string }[]
  officialResources: BishopOfficialResourceRow[]
  studyRhythm: {
    weekly: string
    monthly: string
    quarterly: string
  }
  slidePresentation: BishopSlidePresentation
}

const DEFAULT_INTRO = `Bishop orientation for your stake—structured like an onboarding path. Defaults follow current General Handbook themes (including post–May 2024 council adjustments) and public materials on churchofjesuschrist.org. Replace wording to match your stake president’s emphasis; nothing here is synced from Google automatically.`

const DEFAULT_STUDY = {
  weekly: "One Come Follow Me block and one General Conference message tied to a current ward need.",
  monthly: "Skim the General Handbook sections your stake president assigns; bring one question to bishopric meeting.",
  quarterly: "Re-read this page with the Lord; adjust delegation between you, counselors, and clerks.",
}

const DEFAULT_DISCLAIMER = `This module summarizes common bishop and bishopric duties. It does not replace the General Handbook, area policies, or personal direction from your stake president. Follow the current General Handbook for bishopric meeting, ward council, and expanded bishopric meeting (wards no longer hold a separate ward priesthood executive committee meeting). For abuse reporting, use current Church channels and civil requirements in your jurisdiction.`

const DEFAULT_SLIDE_PRESENTATION: BishopSlidePresentation = {
  title: "Bishop orientation — learning modules",
  intro:
    "Use these modules in bishopric training, ward council kickoffs, or new-bishop orientation. Stake leaders can edit titles and bullets so the app matches your slide deck.",
  slides: [
    {
      id: "bp-01",
      title: "Welcome — the bishop’s sacred trust",
      body:
        "You preside over the ward as a common judge and shepherd under the stake president.\nYour counselors extend your reach; clerks protect records and time.\nSuccess is measured in converted hearts, not tasks checked.",
    },
    {
      id: "bp-02",
      title: "Priesthood keys and the stand",
      body:
        "Keys authorize saving work in the ward; counselors act under your assignment.\nThe sacrament table and stand signal order and reverence—coach youth and leaders kindly.\nWhen a stake leader visits, coordinate seating and support as your president directs.",
    },
    {
      id: "bp-03",
      title: "Bishopric meeting that actually moves the work",
      body:
        "Start on time; spiritual thought; review last week’s assignments by name.\nAgenda: individuals at risk, callings pipeline, finances flag, calendar conflicts.\nEnd with who does what by when; clerk captures minutes.",
    },
    {
      id: "bp-04",
      title: "Bishopric meeting and ward council — revelation in councils",
      body:
        "Current General Handbook: priesthood and relief work are led in bishopric meeting and ward council (wards no longer hold a separate ward priesthood executive committee meeting).\nBishopric meeting: coordinate callings, ministering, calendars, finances, and confidential matters appropriate to that setting.\nWard council: align Relief Society, elders quorum, Young Women, Primary, Sunday School, and others to bless individuals and families—keep focus on people, not only programs.\nSensitive situations: use an expanded bishopric meeting when the Handbook directs; route less-sensitive coordination through ward council.\nInvite brief, factual updates; pray for those discussed.",
    },
    {
      id: "bp-05",
      title: "Sacrament meeting — the ward’s heartbeat",
      body:
        "Music, prayers, and messages should invite the Spirit and witness of Christ.\nPrepare speakers; coach length and testimony patterns where needed.\nYouth speakers deserve coaching and gratitude.",
    },
    {
      id: "bp-06",
      title: "Interviews — listen, teach, protect",
      body:
        "Annual youth interviews: teach doctrine; follow current two-deep and parent communication policy.\nTemple recommend and other interviews: use current questions; document only as required.\nIf someone discloses abuse, follow Church and legal reporting lines immediately—know them before you need them.",
    },
    {
      id: "bp-07",
      title: "Callings and releases with heaven’s view",
      body:
        "Releases: gratitude, reflection on growth, prayer.\nNew callings: explain expectations, time, meetings; extend as from the Lord; spouse support.\nConfidential until sustained; coordinate dates with the clerk for paperwork.",
    },
    {
      id: "bp-08",
      title: "Finances, fast offerings, and audits",
      body:
        "Authorize expenses within stake policy; train clerks on categories and receipts.\nFast offerings are sacred—use them promptly for the poor.\nWelcome audits as a blessing; fix findings quickly.",
    },
    {
      id: "bp-09",
      title: "Youth, Primary, and safety culture",
      body:
        "Approve activities only with trained leaders and current safety checklists.\nAttend key youth events; know class and quorum presidencies by name.\nModel boundaries and kindness—your presence teaches.",
    },
    {
      id: "bp-10",
      title: "Welfare and ministering — finding the one",
      body:
        "Pair Relief Society and elders quorum in planning; use fast offerings and stake resources wisely.\nMinistering interviews should produce names and dates, not vague good intentions.\nComplex cases: early stake welfare specialist or president involvement.",
    },
    {
      id: "bp-11",
      title: "Records, boundaries, and membership moves",
      body:
        "Clerks keep membership accurate; you certify spiritual readiness for moves when required.\nNew move-ins: welcome interview soon; move-outs: blessing and records promptly.\nConfidential membership notes follow Handbook limits.",
    },
    {
      id: "bp-12",
      title: "Stake alignment and high council support",
      body:
        "Carry stake council themes into ward council within two weeks.\nHigh councilors support, not replace, you—give them specific asks and feedback.\nEscalate discipline questions you are not authorized to conclude alone.",
    },
    {
      id: "bp-13",
      title: "Your family and your own conversion",
      body:
        "Guard date night and family scripture; delegate clerical load.\nYou teach best when you are nourished by the temple and Come Follow Me.\nAsk the stake president when you need breathing room—pride prolongs pain.",
    },
    {
      id: "bp-14",
      title: "Discussion prompts (customize for your stake)",
      body:
        "How do we route emergency welfare after hours?\nWhat is our pattern for youth temple trips and interviews?\nHow should bishops request stake resources or legal questions?\nWhich General Handbook chapters will we study together this quarter?",
    },
  ],
}

function parseTopic(x: unknown): BishopTopic | null {
  if (!x || typeof x !== "object") return null
  const o = x as Record<string, unknown>
  if (typeof o.id !== "string" || typeof o.title !== "string" || typeof o.summary !== "string") return null
  const hf = Array.isArray(o.handbookFocus)
    ? o.handbookFocus.filter((l): l is string => typeof l === "string")
    : []
  const pr = Array.isArray(o.practices) ? o.practices.filter((l): l is string => typeof l === "string") : []
  return { id: o.id, title: o.title, summary: o.summary, handbookFocus: hf, practices: pr }
}

function parseResource(x: unknown): BishopOfficialResourceRow | null {
  if (!x || typeof x !== "object") return null
  const o = x as Record<string, unknown>
  if (typeof o.label !== "string" || typeof o.href !== "string" || typeof o.description !== "string") return null
  const id = typeof o.id === "string" ? o.id : `res-${Math.random().toString(36).slice(2, 11)}`
  return { id, label: o.label, href: o.href, description: o.description }
}

function parseChecklistItem(x: unknown): { id: string; label: string } | null {
  if (!x || typeof x !== "object") return null
  const o = x as Record<string, unknown>
  if (typeof o.label !== "string") return null
  const id = typeof o.id === "string" ? o.id : `c-${Math.random().toString(36).slice(2, 11)}`
  return { id, label: o.label }
}

function parseSlide(x: unknown): BishopSlide | null {
  if (!x || typeof x !== "object") return null
  const o = x as Record<string, unknown>
  if (typeof o.title !== "string" || typeof o.body !== "string") return null
  const id = typeof o.id === "string" ? o.id : `slide-${Math.random().toString(36).slice(2, 11)}`
  return { id, title: o.title, body: o.body }
}

/** Saved stakes may still have pre–Handbook-update text in Supabase; detect and replace. */
function slideIsLegacyPecWardSlide(s: BishopSlide): boolean {
  if (/\bPEC\s+and\s+ward\b/i.test(s.title)) return true
  if (/^\s*PEC\s*:/m.test(s.body)) return true
  if (s.id === "bp-04" && /\bPEC\b/i.test(s.title + s.body)) return true
  return false
}

function patchLegacyPecSlides(saved: BishopSlide[], defaultSlides: BishopSlide[]): BishopSlide[] {
  const defBp04 = defaultSlides.find((x) => x.id === "bp-04")
  return saved.map((s) => {
    if (!slideIsLegacyPecWardSlide(s)) return s
    return defBp04 ? structuredClone(defBp04) : s
  })
}

function topicHasStaleCouncilLanguage(t: BishopTopic): boolean {
  const blob = `${t.title}\n${t.summary}\n${t.handbookFocus.join("\n")}\n${t.practices.join("\n")}`
  if (t.id === "bishopric-pec") return true
  if (/\bPEC\s+focuses\b/i.test(blob)) return true
  if (/\bPEC\s*,\s*and\s+ward\s+council\b/i.test(t.title)) return true
  if (t.id === "bishopric-councils" && /\bPEC\s+focuses\b/i.test(blob)) return true
  if (/\bPEC\b/i.test(t.title) && /(bishopric|ward council)/i.test(t.title)) return true
  return false
}

function patchLegacyBishopTopics(saved: BishopTopic[], defaultTopics: BishopTopic[]): BishopTopic[] {
  const councilsDefault = defaultTopics.find((t) => t.id === "bishopric-councils")
  if (!councilsDefault) return saved

  let councilsEmitted = false
  const out: BishopTopic[] = []

  for (const t of saved) {
    if (t.id === "bishopric-pec" || topicHasStaleCouncilLanguage(t)) {
      if (!councilsEmitted) {
        out.push(structuredClone(councilsDefault))
        councilsEmitted = true
      }
      continue
    }
    if (t.id === "bishopric-councils") {
      out.push(t)
      councilsEmitted = true
      continue
    }
    out.push(t)
  }

  if (!councilsEmitted) {
    const keysIdx = out.findIndex((x) => x.id === "keys-ward")
    const insertAt = keysIdx >= 0 ? keysIdx + 1 : 0
    out.splice(insertAt, 0, structuredClone(councilsDefault))
  }

  return out
}

function patchLegacyIntroAndDisclaimer(intro: string, disclaimer: string, dIntro: string, dDisclaimer: string) {
  let nextIntro = intro
  let nextDisclaimer = disclaimer
  if (/\bPEC\s*,\s*and\s+ward\b/i.test(intro) || /\bPEC\s+and\s+ward\b/i.test(intro)) {
    nextIntro = dIntro
  }
  if (
    /\bPEC\s+focuses\b/i.test(disclaimer) ||
    /Ward priesthood executive committee \(PEC\) meetings are not held/i.test(disclaimer)
  ) {
    nextDisclaimer = dDisclaimer
  }
  return { intro: nextIntro, disclaimer: nextDisclaimer }
}

function mergeSlidePresentation(raw: unknown, defaults: BishopSlidePresentation): BishopSlidePresentation {
  if (!raw || typeof raw !== "object") return structuredClone(defaults)
  const o = raw as Record<string, unknown>
  const title = typeof o.title === "string" ? o.title : defaults.title
  const intro = typeof o.intro === "string" ? o.intro : defaults.intro
  const slidesRaw = Array.isArray(o.slides) ? o.slides.map(parseSlide).filter(Boolean) as BishopSlide[] : []
  let slides = slidesRaw.length > 0 ? slidesRaw : structuredClone(defaults.slides)
  slides = patchLegacyPecSlides(slides, defaults.slides)
  return { title, intro, slides }
}

export function getDefaultBishopPayload(): BishopTrainingPayload {
  return {
    intro: DEFAULT_INTRO,
    disclaimer: DEFAULT_DISCLAIMER,
    topics: structuredClone(BISHOP_TOPICS),
    checklist: structuredClone(BISHOP_FIRST_DAYS_CHECKLIST),
    officialResources: BISHOP_OFFICIAL_RESOURCES.map((r, i) => ({
      id: `bor-${i}`,
      label: r.label,
      href: r.href,
      description: r.description,
    })),
    studyRhythm: { ...DEFAULT_STUDY },
    slidePresentation: structuredClone(DEFAULT_SLIDE_PRESENTATION),
  }
}

export function mergeBishopPayload(raw: unknown): BishopTrainingPayload {
  const d = getDefaultBishopPayload()
  if (!raw || typeof raw !== "object") return d
  const o = raw as Record<string, unknown>

  const topicsRaw = Array.isArray(o.topics) ? o.topics.map(parseTopic).filter(Boolean) as BishopTopic[] : null
  let topics = topicsRaw && topicsRaw.length > 0 ? patchLegacyBishopTopics(topicsRaw, d.topics) : d.topics

  const checklistRaw = Array.isArray(o.checklist)
    ? o.checklist.map(parseChecklistItem).filter(Boolean) as { id: string; label: string }[]
    : null
  const resourcesRaw = Array.isArray(o.officialResources)
    ? o.officialResources.map(parseResource).filter(Boolean) as BishopOfficialResourceRow[]
    : null

  const mergedResources = (() => {
    const saved = resourcesRaw && resourcesRaw.length > 0 ? resourcesRaw : []
    const defaults = d.officialResources
    if (saved.length === 0) return defaults
    const hrefs = new Set(saved.map((r) => r.href))
    const out = [...saved]
    for (const def of defaults) {
      if (hrefs.has(def.href)) continue
      out.push({
        ...def,
        id: `bor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
      })
    }
    return out
  })()

  let study = d.studyRhythm
  if (o.studyRhythm && typeof o.studyRhythm === "object") {
    const s = o.studyRhythm as Record<string, unknown>
    study = {
      weekly: typeof s.weekly === "string" ? s.weekly : d.studyRhythm.weekly,
      monthly: typeof s.monthly === "string" ? s.monthly : d.studyRhythm.monthly,
      quarterly: typeof s.quarterly === "string" ? s.quarterly : d.studyRhythm.quarterly,
    }
  }

  const slidePresentation = mergeSlidePresentation(o.slidePresentation, d.slidePresentation)

  const introRaw = typeof o.intro === "string" ? o.intro : d.intro
  const disclaimerRaw = typeof o.disclaimer === "string" ? o.disclaimer : d.disclaimer
  const { intro: introPatched, disclaimer: disclaimerPatched } = patchLegacyIntroAndDisclaimer(
    introRaw,
    disclaimerRaw,
    d.intro,
    d.disclaimer
  )

  return {
    intro: introPatched,
    disclaimer: disclaimerPatched,
    topics,
    checklist: checklistRaw && checklistRaw.length > 0 ? checklistRaw : d.checklist,
    officialResources: mergedResources,
    studyRhythm: study,
    slidePresentation,
  }
}

/** Same elevated stake roles as high council training — one stake-wide curriculum. */
export const BISHOP_TRAINING_EDIT_ROLES = ["stake_president", "counselor", "clerk"] as const

export function canEditBishopTraining(role: string | null | undefined): boolean {
  if (!role) return false
  return (BISHOP_TRAINING_EDIT_ROLES as readonly string[]).includes(role)
}
