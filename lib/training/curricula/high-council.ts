import type { RoleCurriculum } from "@/lib/training/regimen-types"
import { LINKS, STANDARD_DISCLAIMER } from "@/lib/training/curricula/shared-links"

/**
 * Ultimate high council regimen — distinct from presidency/bishopric paths.
 */
export const HIGH_COUNCIL_CURRICULUM: RoleCurriculum = {
  key: "high_council",
  title: "High Council 101 — Strengthening the Stake",
  shortTitle: "High Council",
  audience: "Stake high councilors",
  intro:
    "You are called as a high priest to serve under the stake president’s keys: strengthen assigned wards, teach with the Spirit, keep confidences, and help the stake move God’s work—without taking the bishop’s place.",
  disclaimer: STANDARD_DISCLAIMER,
  designNotes: [
    "Short lessons fit between ward visits and work.",
    "Phases move from identity → weekly duties → hard scenarios → lifelong habits.",
    "Practice prompts prepare you for real bishop conversations and stake council moments.",
    "Mark lessons complete so the stake presidency can mentor from shared progress.",
    "When Handbook language changes, the linked chapters on churchofjesuschrist.org win.",
  ],
  cadence: {
    first14Days:
      "Finish Foundation lessons, complete Protecting Children, and clarify your ward and organization assignments with the stake presidency.",
    first90Days:
      "Complete Core and Application. After each ward visit, note one follow-up you own.",
    ongoing:
      "Each quarter revisit a Mastery lesson and a recent General Conference talk on ministering or teaching.",
  },
  officialResources: [
    { label: "6. Stake Leadership", href: LINKS.hb6, description: "High council calling and assignments." },
    { label: "4. Leadership and Councils", href: LINKS.hb4, description: "How to counsel, delegate, and teach." },
    { label: "8. Elders Quorum", href: LINKS.hb8, description: "When assigned to instruct EQ presidencies." },
    { label: "General Handbook", href: LINKS.handbook },
    { label: "Handbooks and Callings", href: LINKS.handbooksCallings },
    { label: "Protecting Children training", href: LINKS.protectingChildrenTraining },
    { label: "Teaching in the Savior’s Way", href: LINKS.teachingSaviorsWay },
    { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo },
    { label: "Come Follow Me", href: LINKS.comeFollowMe },
    { label: "General Conference", href: LINKS.generalConference },
  ],
  lessons: [
    {
      id: "hc-f1-calling",
      phase: "foundation",
      title: "Your calling under priesthood keys",
      estimatedMinutes: 10,
      objective: "Describe how a high councilor acts under the stake president’s keys.",
      summary:
        "High councilors are called by the stake presidency and sustained. You do not hold stake keys. Your influence comes from faithfulness, assignment, and unity with the presidency—not independent authority over wards.",
      handbook: [
        { label: "6. Stake Leadership", href: LINKS.hb6 },
        { label: "3. Priesthood Principles", href: LINKS.hb3 },
      ],
      videos: [
        { label: "Handbooks and Callings", href: LINKS.handbooksCallings },
      ],
      practice:
        "Write how you will introduce yourself to a bishop: who you represent and what you will never do (preside over him).",
      reflectionPrompt: "Where might I be tempted to ‘run’ a ward instead of support it?",
      required: true,
    },
    {
      id: "hc-f2-confidential",
      phase: "foundation",
      title: "Confidentiality and trust",
      estimatedMinutes: 8,
      objective: "Protect sacred information learned in interviews, councils, and visits.",
      summary:
        "Bishops and members will only be open if you keep confidences. Share personal information only as the Handbook and stake president direct. Gossip destroys high council effectiveness faster than any skill gap.",
      handbook: [
        { label: "31. Interviews and Counseling", href: LINKS.hb31 },
        { label: "4. Councils — confidentiality", href: LINKS.hb4 },
      ],
      videos: [
        { label: "Life Help", href: LINKS.lifeHelp },
      ],
      practice:
        "List three topics you will never discuss in the hallway after stake council.",
      reflectionPrompt: "Have I repeated a story that was not mine to tell?",
      required: true,
    },
    {
      id: "hc-f3-handbook",
      phase: "foundation",
      title: "Learn duty from the Handbook",
      estimatedMinutes: 8,
      objective: "Make the current Handbook your first reference before offering opinions.",
      summary:
        "Doctrine and Covenants 107:99 invites every man to learn his duty. Search chapters related to your assignments (youth, Primary, EQ, missionary, etc.) and teach from section numbers when you instruct others.",
      handbook: [
        { label: "General Handbook", href: LINKS.handbook },
        { label: "Handbooks and Callings", href: LINKS.handbooksCallings },
      ],
      videos: [
        { label: "Church home", href: LINKS.churchHome },
      ],
      practice:
        "Bookmark two Handbook chapters tied to your current organization assignment.",
      reflectionPrompt: "What advice have I given that I never verified in the Handbook?",
      required: true,
    },
    {
      id: "hc-f4-protect",
      phase: "foundation",
      title: "Protecting Children and Youth (required)",
      estimatedMinutes: 35,
      objective: "Complete official Protecting Children training and apply two-deep leadership.",
      summary:
        "If you work with children or youth—or sit on councils that oversee those organizations—complete Protecting Children training and renew every three years. Model safeguarding at every stake activity you touch.",
      handbook: [
        { label: "Protecting Children page", href: LINKS.protectingChildrenPage },
        { label: "20. Activities", href: LINKS.hb20 },
      ],
      videos: [
        {
          label: "Protecting Children online training",
          href: LINKS.protectingChildrenTraining,
          description: "Official course; sign in with Church Account (~30 minutes).",
        },
      ],
      practice:
        "On your next youth-related stake assignment, verify two responsible adults are present and transportation plans avoid improper one-on-one situations.",
      reflectionPrompt: "What safeguarding gap have I noticed and not raised?",
      required: true,
    },
    {
      id: "hc-c1-ward",
      phase: "core",
      title: "Ward liaison: support, don’t preside",
      estimatedMinutes: 12,
      objective: "Strengthen the bishop while respecting his keys.",
      summary:
        "Assigned high councilors visit and support wards. The bishop holds keys for the ward. Praise publicly, counsel privately, follow through on stake priorities, and never become a shadow bishopric.",
      handbook: [
        { label: "6. Stake Leadership", href: LINKS.hb6 },
        { label: "7. Bishops and Their Counselors", href: LINKS.hb7 },
      ],
      videos: [
        { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo },
      ],
      practice:
        "Schedule your next bishop touchpoint; ask him, ‘What do you need from the stake this month?’ and write his answer.",
      reflectionPrompt: "Do my visits feel like inspections or ministry?",
      required: true,
    },
    {
      id: "hc-c2-stake-council",
      phase: "core",
      title: "Participating in stake council",
      estimatedMinutes: 10,
      objective: "Come prepared, speak briefly, listen carefully, own assignments.",
      summary:
        "Stake council seeks revelation for people. Prepare spiritually, study the agenda, contribute perspectives, avoid dominating, and leave with clear action items you will report.",
      handbook: [
        { label: "4. Councils", href: LINKS.hb4 },
        { label: "29. Meetings", href: LINKS.hb29 },
      ],
      videos: [
        { label: "Teaching in the Savior’s Way", href: LINKS.teachingSaviorsWay },
      ],
      practice:
        "Before the next council, write a three-sentence update that includes one name (with appropriate permission) and one ask.",
      reflectionPrompt: "Do I bring problems without proposed next steps?",
      required: true,
    },
    {
      id: "hc-c3-eq",
      phase: "core",
      title: "Instructing elders quorum presidencies",
      estimatedMinutes: 12,
      objective: "When assigned, teach EQ presidencies from Handbook chapters 1–4 and 8.",
      summary:
        "High councilors assigned to elders quorums help new presidencies learn their duties, including Handbook foundations and quorum purpose. Teach simply, follow up, and connect them to the bishopric and stake priorities.",
      handbook: [
        { label: "8. Elders Quorum", href: LINKS.hb8 },
        { label: "1. Work of Salvation and Exaltation", href: LINKS.hb1 },
        { label: "4. Leadership", href: LINKS.hb4 },
      ],
      videos: [
        { label: "Handbooks and Callings", href: LINKS.handbooksCallings },
      ],
      practice:
        "Outline a 20-minute orientation for a new EQ president using chapters 1, 4, and 8.",
      reflectionPrompt: "Am I training presidencies or only attending their meetings?",
      required: true,
    },
    {
      id: "hc-c4-speak",
      phase: "core",
      title: "Speaking and teaching in wards",
      estimatedMinutes: 10,
      objective: "Deliver Christ-centered messages that serve the bishop’s local needs.",
      summary:
        "Ask for audience, time, and purpose. Teach doctrine plainly from scriptures and living prophets. Invite covenant keeping. Coordinate topics with the bishop so stake messages reinforce ward ministry.",
      handbook: [
        { label: "Teaching in the Savior’s Way", href: LINKS.teachingSaviorsWay },
        { label: "4. Leaders are teachers", href: LINKS.hb4 },
      ],
      videos: [
        { label: "Teaching in the Savior’s Way manual", href: LINKS.teachingSaviorsWay },
        { label: "Come Follow Me", href: LINKS.comeFollowMe },
      ],
      practice:
        "For your next talk, text the bishop three possible focuses and accept his preference.",
      reflectionPrompt: "Do my talks showcase me or the Savior?",
      required: true,
    },
    {
      id: "hc-c5-report",
      phase: "core",
      title: "Return and report with integrity",
      estimatedMinutes: 8,
      objective: "Give short, honest accounts that enable presidency decisions.",
      summary:
        "The Savior asked disciples to report. Good reports include what was done, what was learned, risks, and recommended next steps—without drama or self-promotion.",
      handbook: [
        { label: "4. Accounting for assignments", href: LINKS.hb4 },
        { label: "6. Stake Leadership", href: LINKS.hb6 },
      ],
      videos: [
        { label: "General Conference", href: LINKS.generalConference },
      ],
      practice:
        "Write a six-line return-and-report template you will reuse after every major assignment.",
      reflectionPrompt: "Have I hidden bad news hoping it would resolve itself?",
      required: true,
    },
    {
      id: "hc-c6-work",
      phase: "core",
      title: "Missionary, temple, and youth assignments",
      estimatedMinutes: 10,
      objective: "Execute stake assignments that gather Israel without bypassing wards.",
      summary:
        "Whether you oversee missionary, temple/family history, or youth efforts, work through bishops and organization presidencies. Success is people progressing on the covenant path.",
      handbook: [
        { label: "23. Missionary work", href: LINKS.hb23 },
        { label: "25. Temple and family history", href: LINKS.hb25 },
        { label: "21. Ministering", href: LINKS.hb21 },
      ],
      videos: [
        { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo },
        { label: "Media Library", href: LINKS.mediaLibrary },
      ],
      practice:
        "Identify one ward that needs quiet help in your assignment area and one concrete offer you will make to the bishop.",
      reflectionPrompt: "Am I creating stake events that crowd out ward ministering?",
      required: true,
    },
    {
      id: "hc-a1-tension",
      phase: "application",
      title: "Scenario: disagreement with a bishop",
      estimatedMinutes: 8,
      objective: "Stay unified with the stake presidency when ward and stake views differ.",
      summary:
        "If you and a bishop disagree, do not lobby members. Counsel privately, involve the stake presidency when needed, and support the decision that keys authorize.",
      handbook: [
        { label: "6. Stake Leadership", href: LINKS.hb6 },
        { label: "4. Unity", href: LINKS.hb4 },
      ],
      videos: [
        { label: "General Conference", href: LINKS.generalConference },
      ],
      practice:
        "Script a respectful private conversation opener when you believe a ward pattern conflicts with Handbook direction.",
      reflectionPrompt: "Do I ever triangulate by talking to counselors before the bishop?",
      required: true,
    },
    {
      id: "hc-a2-sensitive",
      phase: "application",
      title: "Scenario: a member shares a crisis with you",
      estimatedMinutes: 10,
      objective: "Respond with compassion and correct escalation paths.",
      summary:
        "Listen with love. Do not promise secrecy that the law or Handbook cannot support. For abuse or danger, help the person engage the bishop/stake president and proper reporting pathways immediately.",
      handbook: [
        { label: "Abuse guidelines", href: LINKS.abuseIntro },
        { label: "31. Interviews and Counseling", href: LINKS.hb31 },
      ],
      videos: [
        { label: "Protecting Children page", href: LINKS.protectingChildrenPage },
        { label: "abuse.ChurchofJesusChrist.org", href: LINKS.abuseHelp },
      ],
      practice:
        "Write the exact sentence you will use to involve the bishop without abandoning the member.",
      reflectionPrompt: "Am I prepared emotionally to stay calm in a disclosure?",
      required: true,
    },
    {
      id: "hc-a3-speak-short",
      phase: "application",
      title: "Scenario: sacrament meeting with 8 minutes left",
      estimatedMinutes: 6,
      objective: "Adapt teaching when time collapses without forcing a full talk.",
      summary:
        "Spirit-led teachers can testify of Christ, invite one simple act of covenant keeping, and sit down. Length is not holiness.",
      handbook: [
        { label: "Teaching in the Savior’s Way", href: LINKS.teachingSaviorsWay },
      ],
      videos: [
        { label: "Come Follow Me", href: LINKS.comeFollowMe },
      ],
      practice:
        "Prepare a 3-minute ‘emergency testimony outline’ you can use anytime.",
      reflectionPrompt: "Do I pad talks when the Spirit says stop?",
      required: false,
    },
    {
      id: "hc-m1-habits",
      phase: "mastery",
      title: "Weekly rhythm of a faithful high councilor",
      estimatedMinutes: 8,
      objective: "Install sustainable weekly habits for prayer, study, and assignment work.",
      summary:
        "Consistency beats intensity. A simple weekly rhythm—personal study, assignment touchpoints, and family time—keeps you useful for years.",
      handbook: [
        { label: "4. Spiritual preparation", href: LINKS.hb4 },
        { label: "Come Follow Me", href: LINKS.comeFollowMe },
      ],
      videos: [
        { label: "General Conference", href: LINKS.generalConference },
      ],
      practice:
        "Block two recurring calendar holds: personal Handbook/scripture study and ward liaison time.",
      reflectionPrompt: "What habit, if done for a year, would most bless my assigned wards?",
      required: true,
    },
    {
      id: "hc-m2-unity",
      phase: "mastery",
      title: "Loyalty and unity with the stake presidency",
      estimatedMinutes: 8,
      objective: "Defend unity publicly and counsel candidly in private channels.",
      summary:
        "High councilors strengthen the presidency’s hands. Ask clarifying questions privately; speak as one voice publicly after decisions are made.",
      handbook: [
        { label: "6. Stake Leadership", href: LINKS.hb6 },
        { label: "4. Councils", href: LINKS.hb4 },
      ],
      videos: [
        { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo },
      ],
      practice:
        "Identify one decision you will champion publicly this month even if you argued another view in council.",
      reflectionPrompt: "Have my side conversations weakened stake unity?",
      required: true,
    },
    {
      id: "hc-m3-deepen",
      phase: "mastery",
      title: "Optional deep dive: organization you oversee",
      estimatedMinutes: 20,
      objective: "Master the Handbook chapter for your assigned organization.",
      summary:
        "Whether Primary, Young Women, Sunday School, or another assignment, become the stake’s most helpful student of that chapter—and a coach, not a critic.",
      handbook: [
        { label: "General Handbook (find your chapter)", href: LINKS.handbook },
        { label: "Handbooks and Callings", href: LINKS.handbooksCallings },
      ],
      videos: [
        { label: "Media Library", href: LINKS.mediaLibrary },
      ],
      practice:
        "Teach a 10-minute orientation to the organization presidency using only Handbook language.",
      reflectionPrompt: "What local tradition in this organization needs Handbook correction?",
      required: false,
    },
  ],
}
