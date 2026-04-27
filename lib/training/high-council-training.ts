/**
 * High Council training outline — aligned with themes from the General Handbook
 * and public leadership materials on churchofjesuschrist.org.
 * Not a substitute for the Handbook or direction from the stake president.
 */

export type HighCouncilTopic = {
  id: string
  title: string
  summary: string
  handbookFocus: string[]
  practices: string[]
}

export const OFFICIAL_RESOURCES: { label: string; href: string; description: string }[] = [
  {
    label: "Church of Jesus Christ (home)",
    href: "https://www.churchofjesuschrist.org/?lang=eng",
    description: "News, inspiration, General Conference, Come Follow Me, and links to all Church sites.",
  },
  {
    label: "Handbooks and Callings",
    href: "https://www.churchofjesuschrist.org/study/handbooks-and-callings?lang=eng",
    description:
      "Hub for the General Handbook, leadership instruction, and calling manuals (ward/branch, stake/district, mission, and Seminaries & Institutes) from the Church.",
  },
  {
    label: "General Handbook",
    href: "https://www.churchofjesuschrist.org/study/manual/general-handbook?lang=eng",
    description: "Authoritative policies for wards and stakes. Search for “high council,” “stake council,” “ward council,” and assigned organizations.",
  },
  {
    label: "Come Follow Me",
    href: "https://www.churchofjesuschrist.org/study/come-follow-me?lang=eng",
    description: "Weekly scripture study to teach with power and keep your own conversion bright.",
  },
  {
    label: "General Conference",
    href: "https://www.churchofjesuschrist.org/study/general-conference?lang=eng",
    description: "Recent teachings of prophets and apostles on leadership, unity, and ministering.",
  },
  {
    label: "Serve in the Church",
    href: "https://www.churchofjesuschrist.org/serve?lang=eng",
    description: "Ways to serve, leadership topics, and links to calling-specific helps.",
  },
]

export const HIGH_COUNCIL_TOPICS: HighCouncilTopic[] = [
  {
    id: "calling",
    title: "Your calling and sustaining",
    summary:
      "Members of the high council are called by inspiration, interviewed, and sustained in stake conference. They act under the direction of the stake president, who holds priesthood keys for the stake.",
    handbookFocus: [
      "Priesthood keys rest with the stake president; high councilors act under his assignment.",
      "Sustaining is an opportunity for members to support you — live worthy of that trust.",
    ],
    practices: [
      "Meet promptly with the stake president when called; clarify expectations and assignments.",
      "Keep confidential interviews and ward matters private.",
      "Use Handbooks and Callings on churchofjesuschrist.org for calling-specific leadership manuals alongside the General Handbook.",
    ],
  },
  {
    id: "presidency",
    title: "Stake presidency and clerks",
    summary:
      "The high council works closely with the stake presidency. Communication, reliability, and loyalty to counsel strengthen the whole stake.",
    handbookFocus: [
      "Stake meetings, agendas, and follow-through from stake council decisions.",
      "Coordinating with stake clerks for records, releases, and schedules as assigned.",
    ],
    practices: [
      "Prepare short, factual reports when asked; propose solutions, not only problems.",
      "Support stake presidency members in their ward visits and stake assignments.",
    ],
  },
  {
    id: "wards",
    title: "Ward assignments and visits",
    summary:
      "High councilors are typically assigned to specific wards to strengthen bishops, teach, and help implement stake priorities (missionary work, temple and family history, youth, Primary, Melchizedek Priesthood, etc., as the stake president directs).",
    handbookFocus: [
      "Bishops hold keys for their wards; you support, do not preside over the bishop.",
      "Visit on assignment; follow up on previous counsel and stake initiatives.",
    ],
    practices: [
      "Schedule visits with the bishop in advance; respect his calendar and crises.",
      "Praise publicly, counsel privately; build unity between ward and stake.",
    ],
  },
  {
    id: "councils",
    title: "Stake council and ward council",
    summary:
      "Participate in stake council as invited. When assigned to ward council, help the ward focus on salvation, exaltation, and care for individuals and families.",
    handbookFocus: [
      "Councils seek revelation together; come having prayed and observed needs.",
      "Align ward efforts with the stake vision and the Savior’s ministry.",
    ],
    practices: [
      "Listen more than you speak in council; ask clarifying questions.",
      "Document action items you own and report progress.",
    ],
  },
  {
    id: "teaching",
    title: "Speaking and teaching",
    summary:
      "High councilors are often invited to speak in sacrament meeting or teach classes. Messages should testify of Christ and reinforce the bishop’s local priorities.",
    handbookFocus: [
      "Teach doctrine plainly; invite repentance and covenant keeping.",
      "Use Come Follow Me and recent conference talks as preparation anchors.",
    ],
    practices: [
      "Ask the bishop for length, audience, and local needs before preparing talks.",
      "Arrive early, dress modestly, and thank the bishopric publicly when appropriate.",
    ],
  },
  {
    id: "interviews",
    title: "Interviews and sensitive matters",
    summary:
      "When conducting interviews under assignment (for example, related to callings or readiness), prepare spiritually, follow the Handbook, and defer serious discipline questions to the stake president unless explicitly assigned.",
    handbookFocus: [
      "Follow current Handbook sections on interviews, records, and worthiness.",
      "Never gossip about ward or member situations.",
    ],
    practices: [
      "Begin and end interviews with prayer when appropriate.",
      "Document only what the Handbook and stake procedures require.",
    ],
  },
  {
    id: "mission-temple",
    title: "Missionary work and temple & family history",
    summary:
      "Many stakes assign high councilors to coordinate or support full-time missionaries, temple trips, or family history efforts. Exact assignments come from the stake president.",
    handbookFocus: [
      "Missionary standards, member-missionary participation, and convert retention.",
      "Temple recommend interviews are conducted by bishop and stake presidency — know your role if assisting with logistics or training only.",
    ],
    practices: [
      "Know the missionaries’ names and teaching pool (as appropriate).",
      "Celebrate ordinances and family history milestones in ward visits.",
    ],
  },
  {
    id: "personal",
    title: "Personal conversion and family",
    summary:
      "You cannot lift others higher than you are yourself. Guard family time, personal scripture study, temple attendance, and financial honesty.",
    handbookFocus: [
      "Leaders should be examples in Sabbath observance, tithes and offerings, and kindness.",
    ],
    practices: [
      "Review your own calling with your spouse; ask for support during busy stake weekends.",
      "Use ministering brothers and sisters as the Lord’s hands in your own home when needed.",
    ],
  },
]

export const FIRST_NINETY_DAYS_CHECKLIST: { id: string; label: string }[] = [
  { id: "d1", label: "Complete High Council 101 modules above; bookmark two slides to revisit this month" },
  { id: "d2", label: "Confirm your meeting calendar (high council, stake council, ward assignments) with the stake clerk" },
  { id: "d3", label: "Read General Handbook 6.5 and sections your stake president highlights for high council" },
  { id: "d4", label: "Meet your assigned bishop; ask how you can help and what success looks like this quarter" },
  { id: "d5", label: "Set up reliable habits: check email, texts, and Living app Circles before Thursday meetings" },
  { id: "d6", label: "Complete youth protection and any stake-required training modules" },
  { id: "d7", label: "Prayerfully set one personal spiritual goal for your service this year" },
]

export type OfficialResourceRow = {
  id: string
  label: string
  href: string
  description: string
}

/** In-app “slide deck” (not an embedded Google Slides link). Editable in Stake App. */
export type HighCouncilSlide = {
  id: string
  title: string
  /** Main bullet points or paragraphs; one line = one bullet when rendered. */
  body: string
}

export type HighCouncilSlidePresentation = {
  /** Deck title shown above the slide list. */
  title: string
  /** Short framing text (e.g. when to use this in stake meeting). */
  intro: string
  slides: HighCouncilSlide[]
}

export type HighCouncilTrainingPayload = {
  intro: string
  disclaimer: string
  topics: HighCouncilTopic[]
  checklist: { id: string; label: string }[]
  officialResources: OfficialResourceRow[]
  studyRhythm: {
    weekly: string
    monthly: string
    quarterly: string
  }
  /** Stake orientation deck — same content you might keep in an internal presentation; edit here. */
  slidePresentation: HighCouncilSlidePresentation
}

const DEFAULT_INTRO = `Welcome to High Council 101 — your stake’s onboarding path. This mirrors the stake presidency’s orientation deck: how you return and report, speak and serve, keep confidences, prepare for meetings, extend releases and callings, and organize your week. Everything below is editable by stake leaders so you can align wording with your president’s expectations. Pair this path with the General Handbook and Handbooks and Callings on churchofjesuschrist.org.`

const DEFAULT_STUDY = {
  weekly:
    "One Come Follow Me lesson and one conference talk tied to your next ward assignment.",
  monthly:
    "Re-read the Handbook sections your president emphasizes; note one question to bring to stake council.",
  quarterly: "Review this page and your checklist with the Lord in prayer; adjust personal goals.",
}

const DEFAULT_DISCLAIMER = `This module summarizes common high council responsibilities. It does not replace the General Handbook, instructions from Area Seventies, or assignments from your stake president. When in doubt, ask him.`

/**
 * Default orientation deck — synthesized from stake “HC 101” onboarding material.
 * Stake leaders can edit every title and line; content is stored in-app (not linked to external files).
 */
const DEFAULT_SLIDE_PRESENTATION: HighCouncilSlidePresentation = {
  title: "High Council 101 — orientation path",
  intro:
    "Work through the modules in order, or use the quick navigation to jump where you need a refresher. Each card is one focused topic—edit dates, meeting times, and vision/mission language for your stake.",
  slides: [
    {
      id: "hc101-01",
      title: "Start here — High Council 101",
      body:
        "You were called because of your testimony and prior faithful service.\nMembers know you serve on the high council; your kindness and integrity matter in every setting.\nThis path aligns you with the stake presidency before you represent them in wards.",
    },
    {
      id: "hc101-02",
      title: "Return and report",
      body:
        "Like temple worship, return and report is a pattern for covenant disciples.\nThe stake presidency and high council use it consistently—expect clarity, follow-through, and honest updates.\nWhen you commit to something in council, own it and report progress.",
    },
    {
      id: "hc101-03",
      title: "Speaking in sacrament meeting",
      body:
        "Drop the phrase “dry council” from your vocabulary—you are an emissary of the Savior’s work.\nPlan on roughly six sacrament talks per year across assigned wards.\nSmile; let members get to know you; deliver the assigned topic; always close by testifying of Christ and His Atonement so the Holy Ghost can witness.",
    },
    {
      id: "hc101-04",
      title: "Fulfilling assignments",
      body:
        "Do everything you can to complete what you accept; asking clarifying questions is a strength, not weakness.\nWhen you delegate to ward leaders, check in regularly—encourage and support without micromanaging.\nReport progress and completion back to the stake presidency.",
    },
    {
      id: "hc101-05",
      title: "Keeping confidences",
      body:
        "You will learn strengths, struggles, and sensitive needs—those stay in the room.\nCalling discussions (approved, declined, or not yet sustained) are never casual conversation.\nYou may share spiritual experiences with a spouse, but not confidential council or calling information—there is no “pillow talk” exception.",
    },
    {
      id: "hc101-06",
      title: "Communication, agendas, and notes",
      body:
        "Watch email, texts, Living app Circles, and agendas before meetings—you may be asked to come prepared to discuss specific items.\nParticipate vocally; your inspiration can change direction for good.\nTake your own notes: clerks capture minutes; the Spirit may prompt you with personal action items unrelated to the agenda—record them and follow through.",
    },
    {
      id: "hc101-07",
      title: "Stay present in council",
      body:
        "Sometimes an agenda item seems unrelated to you.\nAsk: “Does this apply to me?” “Does it apply to my assigned ward or organization?”\nBeing mentally present often surfaces one insight you can act on this month.",
    },
    {
      id: "hc101-08",
      title: "Releases and callings — spirit of the visit",
      body:
        "You represent the presidency when extending releases and callings—make the appointment a moment of genuine love for the member and spouse.\nAlways invite the spouse when scheduling.\nPrayerfully prepare; ask the member being released or called to open with prayer.",
    },
    {
      id: "hc101-09",
      title: "Extending a release",
      body:
        "Invite the member to reflect on how the calling strengthened their testimony of the Savior.\nInvite the spouse to share how the calling affected their home.\nExtend the release with heartfelt gratitude for sacrifice and service.\nBear testimony of Christ and His restored gospel; close with prayer.",
    },
    {
      id: "hc101-10",
      title: "Extending a call",
      body:
        "Know the calling: meetings, time, expectations—use the General Handbook, ChurchofJesusChrist.org (Serve), and your leaders.\nBegin conversationally: work, children, life context before the formal invitation.\nExplain that the name was discussed and prayed over with the stake presidency and high council.\nExtend the call as from the Lord; explain practical nuances; ask if they will accept and if the spouse will support.\nIf they decline, show increased love—turning down a call is not sin; seek to understand concerns.\nAsk them to keep the call confidential until sustained.\nClose with testimony and prayer.",
    },
    {
      id: "hc101-11",
      title: "After sustaining and set apart",
      body:
        "Schedule setting apart with family present and another priesthood holder to witness.\nNotify the stake clerk when the call is extended (paperwork for sustaining) and again after the member is set apart.",
    },
    {
      id: "hc101-12",
      title: "Stake vision, mission, and goal (edit for your stake)",
      body:
        "Vision example: Love God and love neighbor as ourselves (Matthew 22:36–40).\nMission example: Living the gospel; caring for those in need; inviting all to receive the gospel; uniting families for eternity.\nGoal example: Zion — one heart and one mind, righteousness, no poor among them (Moses 7:18).\nReplace this slide’s bullets with your stake president’s exact language.",
    },
    {
      id: "hc101-13",
      title: "Meet with the bishop",
      body:
        "If assigned to a ward, meet the bishop regularly—not only in crisis.\nAsk how you can help and what he expects; share your observations with humility.\nThink of yourself as a trusted “third counselor” and resource—some of your richest leadership training will come from those conversations.",
    },
    {
      id: "hc101-14",
      title: "Weekly personal cadence",
      body:
        "Between busy Thursdays it is easy to lose track of stake meeting notes.\nBlock even 20 minutes on Friday to review notes and pick one action that moves the Lord’s work forward this week.\nSmall, consistent follow-through magnifies your calling.",
    },
    {
      id: "hc101-15",
      title: "How the high council is organized",
      body:
        "Training focus splits between Melchizedek Priesthood support and Aaronic Priesthood support.\nTypically seven high councilors are paired with specific wards; five carry organization portfolios (elders quorum, missionaries, temple and family history, stake Young Men, stake Sunday School—exact assignments follow the president).\nDeepen your understanding with General Handbook section 6.5 and your president’s current letter.",
    },
    {
      id: "hc101-16",
      title: "Meetings you are expected to attend (customize times)",
      body:
        "High council meeting — weekly; confirm start times (example pattern: 8:00 p.m. 1st & 3rd Thursdays; 6:30 p.m. 2nd & 4th) and location.\nStake Youth Leadership Committee — example: second Thursday 8:00–9:30 p.m., stake center chapel.\nStake council — example: fourth Thursday 7:00–8:00 p.m., high council room.\nStake Adult Leadership Committee — example: fourth Thursday 8:00–9:30 p.m., stake center chapel.\nBishopric meeting and ward council for assigned wards — be first on ward council agenda with stake updates.\nAssigned ward sacrament meeting most Sundays (fast Sunday in your home ward unless directed otherwise).\nElders quorum presidency meetings and occasional visits with the presidency on member visits.\nWard activities — attend with your spouse when possible as a visible example of covenant marriage.\nStake audit committee — if called, complete training before audits (typically twice per year per ward).",
    },
    {
      id: "hc101-17",
      title: "Priorities when life gets crowded",
      body:
        "Pattern emphasized in area training: (1) God, (2) spouse if married, (3) children, (4) providing for family, (5) calling.\nMeetings will sometimes reorder a night—when conflicts stack up, counsel early with the stake presidency.",
    },
    {
      id: "hc101-18",
      title: "On the stand in sacrament meeting",
      body:
        "Sit with the bishopric during sacrament meeting when you are assigned there—signal support and be available for questions.\nWhen a member of the stake presidency attends, he typically sits next to the bishop; if space is tight, sit as close as practical.",
    },
    {
      id: "hc101-19",
      title: "You represent the Lord and the presidency",
      body:
        "A stake mirrors the Church’s pattern: three presiding high priests and a quorum of twelve high priests who carry the presidency’s trust everywhere.\nBe a high priest in private life and public ministry—strength and kindness in every contact.\nHeavenly Father and Jesus Christ know you personally; act worthy of that knowledge.",
    },
    {
      id: "hc101-20",
      title: "Reflection and discussion",
      body:
        "How does communication flow through Circles or other channels in our stake?\nWhat is the procedure for suggesting stake callings?\nWhat is my role on assigned ward council? With the elders quorum president?\nHow do budget approvals and reimbursements work here?\nHigh council discussion is often about spiritual confirmation more than debating biographical details—how can I prepare spiritually before each meeting?",
    },
  ],
}

function parseTopic(x: unknown): HighCouncilTopic | null {
  if (!x || typeof x !== "object") return null
  const o = x as Record<string, unknown>
  if (typeof o.id !== "string" || typeof o.title !== "string" || typeof o.summary !== "string") return null
  const hf = Array.isArray(o.handbookFocus)
    ? o.handbookFocus.filter((l): l is string => typeof l === "string")
    : []
  const pr = Array.isArray(o.practices) ? o.practices.filter((l): l is string => typeof l === "string") : []
  return { id: o.id, title: o.title, summary: o.summary, handbookFocus: hf, practices: pr }
}

function parseResource(x: unknown): OfficialResourceRow | null {
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

function parseSlide(x: unknown): HighCouncilSlide | null {
  if (!x || typeof x !== "object") return null
  const o = x as Record<string, unknown>
  if (typeof o.title !== "string" || typeof o.body !== "string") return null
  const id = typeof o.id === "string" ? o.id : `slide-${Math.random().toString(36).slice(2, 11)}`
  return { id, title: o.title, body: o.body }
}

function mergeSlidePresentation(
  raw: unknown,
  defaults: HighCouncilSlidePresentation
): HighCouncilSlidePresentation {
  if (!raw || typeof raw !== "object") return structuredClone(defaults)
  const o = raw as Record<string, unknown>
  const title = typeof o.title === "string" ? o.title : defaults.title
  const intro = typeof o.intro === "string" ? o.intro : defaults.intro
  const slidesRaw = Array.isArray(o.slides) ? o.slides.map(parseSlide).filter(Boolean) as HighCouncilSlide[] : []
  const slides = slidesRaw.length > 0 ? slidesRaw : structuredClone(defaults.slides)
  return { title, intro, slides }
}

export function getDefaultHighCouncilPayload(): HighCouncilTrainingPayload {
  return {
    intro: DEFAULT_INTRO,
    disclaimer: DEFAULT_DISCLAIMER,
    topics: structuredClone(HIGH_COUNCIL_TOPICS),
    checklist: structuredClone(FIRST_NINETY_DAYS_CHECKLIST),
    officialResources: OFFICIAL_RESOURCES.map((r, i) => ({
      id: `or-${i}`,
      label: r.label,
      href: r.href,
      description: r.description,
    })),
    studyRhythm: { ...DEFAULT_STUDY },
    slidePresentation: structuredClone(DEFAULT_SLIDE_PRESENTATION),
  }
}

/** Merge saved JSON with defaults so new fields never break older rows. */
export function mergeHighCouncilPayload(raw: unknown): HighCouncilTrainingPayload {
  const d = getDefaultHighCouncilPayload()
  if (!raw || typeof raw !== "object") return d
  const o = raw as Record<string, unknown>

  const topicsRaw = Array.isArray(o.topics) ? o.topics.map(parseTopic).filter(Boolean) as HighCouncilTopic[] : null
  const checklistRaw = Array.isArray(o.checklist)
    ? o.checklist.map(parseChecklistItem).filter(Boolean) as { id: string; label: string }[]
    : null
  const resourcesRaw = Array.isArray(o.officialResources)
    ? o.officialResources.map(parseResource).filter(Boolean) as OfficialResourceRow[]
    : null

  /** Keep saved links but add any new default Church URLs (e.g. new hub pages) the stake has not saved yet. */
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
        id: `or-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
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

  return {
    intro: typeof o.intro === "string" ? o.intro : d.intro,
    disclaimer: typeof o.disclaimer === "string" ? o.disclaimer : d.disclaimer,
    topics: topicsRaw && topicsRaw.length > 0 ? topicsRaw : d.topics,
    checklist: checklistRaw && checklistRaw.length > 0 ? checklistRaw : d.checklist,
    officialResources: mergedResources,
    studyRhythm: study,
    slidePresentation,
  }
}

export const HIGH_COUNCIL_TRAINING_EDIT_ROLES = ["stake_president", "counselor", "clerk"] as const

export function canEditHighCouncilTraining(role: string | null | undefined): boolean {
  if (!role) return false
  return (HIGH_COUNCIL_TRAINING_EDIT_ROLES as readonly string[]).includes(role)
}
