import type { RoleCurriculum } from "@/lib/training/regimen-types"
import { LINKS, STANDARD_DISCLAIMER } from "@/lib/training/curricula/shared-links"

/**
 * Ultimate stake presidency regimen — microlearning + spaced mastery,
 * anchored to General Handbook ch. 1, 3–4, 6, 20–23, 25, 29–32, 34, 38.
 */
export const STAKE_PRESIDENCY_CURRICULUM: RoleCurriculum = {
  key: "stake_presidency",
  title: "Stake Presidency Leadership Academy",
  shortTitle: "Stake Presidency",
  audience: "Stake president and counselors",
  intro:
    "A paced path to lead as the Savior leads: hold keys with meekness, multiply leaders, unify councils, and keep ordinances and covenants at the center of God’s work of salvation and exaltation in the stake.",
  disclaimer: STANDARD_DISCLAIMER,
  designNotes: [
    "Microlearning: each lesson has one objective you can finish in a short sitting.",
    "Spaced phases: Foundation → Core duties → Application rehearsals → Ongoing mastery.",
    "Active practice: decision prompts beat passive reading for busy priesthood leaders.",
    "Completion is tracked in this app so the presidency can see who has finished required lessons—mentoring still happens face to face.",
    "Official videos and Handbook chapters are linked; Church sites remain the source of truth.",
  ],
  cadence: {
    first14Days:
      "Complete all Foundation lessons and Protecting Children. Meet as a presidency to align on vision, ward assignments, and interview cadence.",
    first90Days:
      "Finish Core and Application lessons. After each stake council, pick one practice prompt to rehearse before the next meeting.",
    ongoing:
      "Each quarter revisit one Mastery lesson, review Handbook updates on churchofjesuschrist.org, and renew Protecting Children every three years.",
  },
  officialResources: [
    { label: "General Handbook", href: LINKS.handbook, description: "Authoritative stake and ward policy." },
    { label: "6. Stake Leadership", href: LINKS.hb6, description: "Keys, high council, bishops, stake organizations." },
    { label: "4. Leadership and Councils", href: LINKS.hb4, description: "Christlike leadership and effective councils." },
    { label: "Handbooks and Callings", href: LINKS.handbooksCallings, description: "Calling manuals and leadership instruction hub." },
    { label: "Protecting Children and Youth", href: LINKS.protectingChildrenPage, description: "Required training overview and links." },
    { label: "Protecting Children training (login)", href: LINKS.protectingChildrenTraining, description: "Official online course (~30 minutes)." },
    { label: "Teaching in the Savior’s Way", href: LINKS.teachingSaviorsWay, description: "How leaders teach and invite." },
    { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo, description: "Conference leadership clips on ministering." },
    { label: "General Conference", href: LINKS.generalConference, description: "Current prophetic teaching for leaders." },
    { label: "Life Help / counseling resources", href: LINKS.lifeHelp, description: "Helps for sensitive pastoral needs." },
  ],
  lessons: [
    {
      id: "sp-f1-keys",
      phase: "foundation",
      title: "Priesthood keys for the stake",
      estimatedMinutes: 12,
      objective: "Explain what keys the stake president holds and how counselors serve under those keys.",
      summary:
        "The stake president holds priesthood keys to lead the Church in the stake. Counselors form a presidency with him and act under his direction. High priests quorum presidency responsibilities rest with the stake presidency. Clarity about keys prevents confusion with bishops and high councilors.",
      handbook: [
        { label: "6. Stake Leadership", href: LINKS.hb6 },
        { label: "3. Priesthood Principles", href: LINKS.hb3 },
      ],
      videos: [
        { label: "Handbooks and Callings hub", href: LINKS.handbooksCallings, description: "Start here for official leader instruction linked by the Church." },
      ],
      practice:
        "Write in one sentence how you will describe keys vs. delegated assignments to a newly called high councilor this week.",
      reflectionPrompt: "Where might I be doing work that should be delegated under keys?",
      required: true,
    },
    {
      id: "sp-f2-salvation",
      phase: "foundation",
      title: "God’s work of salvation and exaltation",
      estimatedMinutes: 10,
      objective: "Put ordinances and covenants at the center of stake priorities.",
      summary:
        "Recent Handbook emphasis keeps living the gospel, caring for those in need, inviting all to receive the gospel, and uniting families for eternity organized around ordinances and covenants. Stake goals should serve people coming unto Christ—not programs for their own sake.",
      handbook: [
        { label: "1. Work of Salvation and Exaltation", href: LINKS.hb1 },
        { label: "4. Leadership and Councils", href: LINKS.hb4 },
      ],
      videos: [
        { label: "General Conference talks", href: LINKS.generalConference, description: "Watch a recent talk on covenants or gathering Israel." },
      ],
      practice:
        "List your stake’s top three initiatives. For each, name the ordinance/covenant outcome it should produce.",
      reflectionPrompt: "Which initiative has drifted into administration without a people outcome?",
      required: true,
    },
    {
      id: "sp-f3-handbook",
      phase: "foundation",
      title: "How to find answers in the General Handbook",
      estimatedMinutes: 8,
      objective: "Use the Handbook and Handbooks & Callings hub before inventing local policy.",
      summary:
        "Effective presidencies search the current Handbook online, note section numbers, and teach from it. When unsure, counsel together and verify the latest text—updates (including March 2026) appear on ChurchofJesusChrist.org and in Gospel Library.",
      handbook: [
        { label: "General Handbook home", href: LINKS.handbook },
        { label: "Handbooks and Callings", href: LINKS.handbooksCallings },
      ],
      videos: [
        { label: "Church home — search Handbook", href: LINKS.churchHome },
      ],
      practice:
        "Open chapter 6 and bookmark three sections you will teach high councilors in the next month.",
      reflectionPrompt: "What local ‘tradition’ should I verify against the current Handbook?",
      required: true,
    },
    {
      id: "sp-f4-protect",
      phase: "foundation",
      title: "Protecting Children and Youth (required)",
      estimatedMinutes: 35,
      objective: "Complete or renew official Protecting Children training and plan the annual stake council review.",
      summary:
        "Adults who work with children or youth complete Protecting Children training within one month of being sustained and every three years. Stake presidencies ensure compliance and, at least annually in stake council, review Church policies on preventing and responding to abuse.",
      handbook: [
        { label: "Abuse and cruelty (introductory guidelines)", href: LINKS.abuseIntro },
        { label: "20. Activities — safeguarding principles", href: LINKS.hb20 },
      ],
      videos: [
        {
          label: "Protecting Children and Youth training",
          href: LINKS.protectingChildrenTraining,
          description: "Official Church online training (~30 min). Sign in with Church Account.",
        },
        { label: "Training overview page", href: LINKS.protectingChildrenPage },
      ],
      practice:
        "Confirm who tracks completion for stake callings that work with youth, and schedule this year’s dedicated stake-council abuse-policy discussion.",
      reflectionPrompt: "Are two-deep leadership and transportation patterns clean in our stake events?",
      required: true,
    },
    {
      id: "sp-c1-bishops",
      phase: "core",
      title: "Calling, mentoring, and releasing bishops",
      estimatedMinutes: 15,
      objective: "Follow First Presidency approval pathways and ongoing mentoring of bishoprics.",
      summary:
        "The stake president recommends bishops through Leader and Clerk Resources, receives First Presidency approval, and may call, ordain, and set apart—or release—as authorized. He instructs new bishoprics promptly and continues mentoring through interviews and meetings.",
      handbook: [
        { label: "6. Stake Leadership — bishops", href: LINKS.hb6 },
        { label: "30. Callings in the Church", href: LINKS.hb30 },
      ],
      videos: [
        { label: "Serve in the Church", href: LINKS.serve },
      ],
      practice:
        "Draft a 45-minute outline for a new bishopric’s first training meeting (keys, councils, youth, confidentiality, when to call you).",
      reflectionPrompt: "Which bishop most needs a strengthening interview this month?",
      required: true,
    },
    {
      id: "sp-c2-high-council",
      phase: "core",
      title: "Leading the high council",
      estimatedMinutes: 12,
      objective: "Call, assign, and develop twelve high councilors as an extension of the presidency.",
      summary:
        "The stake presidency calls twelve high priests (ordaining when needed) to the high council. Assignments typically include wards and stake organizations. High councilors act under the stake president’s direction—they do not hold stake keys.",
      handbook: [
        { label: "6. Stake Leadership — high council", href: LINKS.hb6 },
        { label: "4. Delegating and developing others", href: LINKS.hb4 },
      ],
      videos: [
        { label: "Teaching in the Savior’s Way", href: LINKS.teachingSaviorsWay },
      ],
      practice:
        "Map each high councilor to a ward and a stake emphasis; note the next return-and-report date.",
      reflectionPrompt: "Who on the high council needs clearer expectations in writing?",
      required: true,
    },
    {
      id: "sp-c3-stake-council",
      phase: "core",
      title: "Stake council that seeks revelation",
      estimatedMinutes: 12,
      objective: "Run stake council with preparation, equal voice, and covenant-centered outcomes.",
      summary:
        "Councils exist to seek divine guidance for individuals and families. Share agenda topics early, listen more than talk, value women and men’s perspectives, decide with spiritual confirmation, and leave with owners and follow-up—not only announcements.",
      handbook: [
        { label: "4. Councils", href: LINKS.hb4 },
        { label: "29. Meetings in the Church", href: LINKS.hb29 },
      ],
      videos: [
        { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo },
      ],
      practice:
        "For the next stake council, send two discussion questions 48 hours early and reserve 20 minutes for one name-focused need.",
      reflectionPrompt: "Do I share my opinion too early and shut down revelation?",
      required: true,
    },
    {
      id: "sp-c4-interviews",
      phase: "core",
      title: "Interviews and counseling with power",
      estimatedMinutes: 14,
      objective: "Conduct inspired interviews that protect dignity and invite repentance.",
      summary:
        "Handbook 31 guides interviews and counseling. Prepare spiritually, ask authorized questions carefully, protect against misunderstandings (especially with youth), keep confidences, and involve the right helpers—including the abuse help line pathways when required.",
      handbook: [
        { label: "31. Interviews and Counseling", href: LINKS.hb31 },
        { label: "Abuse help resources", href: LINKS.abuseHelp },
      ],
      videos: [
        { label: "Life Help resources", href: LINKS.lifeHelp },
      ],
      practice:
        "Role-play (with a counselor) how you open a sensitive interview and how you end with hope in Christ.",
      reflectionPrompt: "What boundary do I need to tighten for confidentiality in our office?",
      required: true,
    },
    {
      id: "sp-c5-workstreams",
      phase: "core",
      title: "Missionary, temple, and family history coordination",
      estimatedMinutes: 12,
      objective: "Align stake efforts for gathering Israel without overloading wards.",
      summary:
        "Stake leaders coordinate missionary preparation and sharing the gospel, temple recommend worthiness culture, and family history—always through bishops and ward councils. Measure progress by people prepared and ordinances completed, not activity count alone.",
      handbook: [
        { label: "23. Missionary work", href: LINKS.hb23 },
        { label: "25. Temple and family history work", href: LINKS.hb25 },
      ],
      videos: [
        { label: "Media Library — temple & missionary", href: LINKS.mediaLibrary },
      ],
      practice:
        "Choose one metric per workstream for the next quarter and who reports it in stake council.",
      reflectionPrompt: "Where are we launching programs that bishops did not help design?",
      required: true,
    },
    {
      id: "sp-c6-temporal",
      phase: "core",
      title: "Welfare oversight and financial stewardship",
      estimatedMinutes: 12,
      objective: "Oversee temporal needs and stake financial integrity with Handbook discipline.",
      summary:
        "Stake presidencies guide welfare principles and ensure audits and financial controls follow Handbook 34. Bishops remain closest to individual needs; the stake strengthens patterns, training, and exceptional cases.",
      handbook: [
        { label: "22. Temporal needs and self-reliance", href: LINKS.hb22 },
        { label: "34. Finances and audits", href: LINKS.hb34 },
      ],
      videos: [
        { label: "Church safety & related resources", href: LINKS.safety },
      ],
      practice:
        "Review the date of the last stake audit follow-up and the next bishopric finance training touchpoint.",
      reflectionPrompt: "Am I close enough to know if a ward is struggling temporally?",
      required: true,
    },
    {
      id: "sp-a1-crisis",
      phase: "application",
      title: "Scenario: bishop calls after midnight",
      estimatedMinutes: 10,
      objective: "Rehearse calm, Handbook-aligned response to an urgent pastoral crisis.",
      summary:
        "When a bishop reports abuse, danger, or a membership emergency, your first duties are safety, legal reporting pathways, spiritual steadiness, and the correct help lines—not improvising policy. Practice lowers panic.",
      handbook: [
        { label: "Abuse introductory guidelines", href: LINKS.abuseIntro },
        { label: "32. Repentance and membership councils", href: LINKS.hb32 },
      ],
      videos: [
        { label: "Protecting Children overview", href: LINKS.protectingChildrenPage },
        { label: "abuse.ChurchofJesusChrist.org", href: LINKS.abuseHelp },
      ],
      practice:
        "Write your first three questions and first three actions if a bishop reports possible abuse involving a minor.",
      reflectionPrompt: "Do counselors know how to reach me and the Area Seventy channel if I am unavailable?",
      required: true,
    },
    {
      id: "sp-a2-unity",
      phase: "application",
      title: "Scenario: stake council is divided",
      estimatedMinutes: 8,
      objective: "Practice seeking unity without forcing premature decisions.",
      summary:
        "When unsettled feelings remain on an important decision, wise leaders may wait, gather more light, and meet privately as needed. Contention and gossip have no place; oneness with the Lord is the goal.",
      handbook: [{ label: "4. Unity in councils", href: LINKS.hb4 }],
      videos: [
        { label: "General Conference — unity / councils", href: LINKS.generalConference },
      ],
      practice:
        "Script how you will postpone a contested decision while affirming every voice was heard.",
      reflectionPrompt: "Where have I equated speed with spiritual confirmation?",
      required: true,
    },
    {
      id: "sp-a3-overload",
      phase: "application",
      title: "Scenario: the same few members carry everything",
      estimatedMinutes: 8,
      objective: "Widen leadership opportunity and protect families from chronic overload.",
      summary:
        "Calling the same capable people repeatedly can wear them away and deny growth to others. Delegation includes invitation, teaching, trust, support, and accounting (Handbook 4).",
      handbook: [
        { label: "4. Delegating", href: LINKS.hb4 },
        { label: "30. Callings", href: LINKS.hb30 },
      ],
      videos: [
        { label: "Teaching in the Savior’s Way", href: LINKS.teachingSaviorsWay },
      ],
      practice:
        "Name two stake assignments you will redistribute within 60 days and who will be developed to receive them.",
      reflectionPrompt: "Whose family load am I ignoring because they always say yes?",
      required: false,
    },
    {
      id: "sp-m1-balance",
      phase: "mastery",
      title: "Personal discipleship and family balance",
      estimatedMinutes: 8,
      objective: "Sustain spiritual strength so leadership remains joyful, not consuming.",
      summary:
        "Leaders must not neglect their own needs or their families. Seek the Spirit to balance responsibilities. Your example of Sabbath worship, Come Follow Me, and kindness at home teaches more than most stake memos.",
      handbook: [{ label: "4. Leadership — balance", href: LINKS.hb4 }],
      videos: [
        { label: "Come Follow Me", href: LINKS.comeFollowMe },
        { label: "General Conference", href: LINKS.generalConference },
      ],
      practice:
        "Block a weekly non-negotiable family time on your calendar for the next eight weeks.",
      reflectionPrompt: "What will I stop doing this quarter to protect discipleship at home?",
      required: true,
    },
    {
      id: "sp-m2-handbook-updates",
      phase: "mastery",
      title: "Quarterly Handbook and policy refresh",
      estimatedMinutes: 15,
      objective: "Stay current as the First Presidency updates the Handbook.",
      summary:
        "Handbook notices (for example March 2026) adjust language and policy. A quarterly presidency review of updates—and teaching them to bishops and the high council—keeps the stake aligned with living direction.",
      handbook: [
        { label: "General Handbook", href: LINKS.handbook },
        { label: "38. Policies and guidelines", href: LINKS.hb38 },
      ],
      videos: [
        { label: "Church news / home", href: LINKS.churchHome },
      ],
      practice:
        "Schedule a 30-minute presidency ‘Handbook update’ meeting on the next quarter’s calendar.",
      reflectionPrompt: "Which update have we not yet taught to bishops?",
      required: true,
    },
    {
      id: "sp-m3-develop-leaders",
      phase: "mastery",
      title: "Multiplying bishops and high councilors",
      estimatedMinutes: 10,
      objective: "Build a bench of prepared leaders through trust and accountability.",
      summary:
        "The Savior gave disciples real responsibility and asked for accounting. Your lasting legacy is leaders who can preside, counsel, and love as He does when you are released.",
      handbook: [
        { label: "4. Developing leaders", href: LINKS.hb4 },
        { label: "6. Stake Leadership", href: LINKS.hb6 },
      ],
      videos: [
        { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo },
      ],
      practice:
        "Identify three emerging leaders and one stretch assignment each with a mentoring touchpoint.",
      reflectionPrompt: "Am I developing successors or creating dependency on me?",
      required: false,
    },
  ],
}
