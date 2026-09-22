import type { RoleCurriculum } from "@/lib/training/regimen-types"
import { LINKS, STANDARD_DISCLAIMER } from "@/lib/training/curricula/shared-links"

/**
 * Ultimate bishopric regimen — current Handbook (no PEC; bishopric + ward council).
 */
export const BISHOPRIC_CURRICULUM: RoleCurriculum = {
  key: "bishopric",
  title: "Bishopric Shepherding Path",
  shortTitle: "Bishopric",
  audience: "Bishops and counselors",
  intro:
    "A practical path to preside and counsel in the Savior’s way: honor the bishop’s keys, run bishopric meeting and ward council (not a separate PEC), protect youth, administer the sacrament with reverence, and help every soul progress along the covenant path.",
  disclaimer: STANDARD_DISCLAIMER,
  designNotes: [
    "Built for early-morning and late-evening study windows.",
    "Foundation first (keys, councils, safeguarding), then core weekly work, then rehearsals for hard days.",
    "Practice prompts simulate interviews, youth moments, and ward council decisions.",
    "Completion tracking helps bishoprics onboard new counselors together.",
    "Always prefer the live Handbook text over memory or older training notes.",
  ],
  cadence: {
    first14Days:
      "Complete Foundation (including Protecting Children). Hold a bishopric meeting that sets interview, youth, and council rhythms.",
    first90Days:
      "Finish Core and Application. After ward council each week, review one practice prompt as a bishopric.",
    ongoing:
      "Quarterly Mastery refresh; renew Protecting Children every three years; review Handbook updates with clerks.",
  },
  officialResources: [
    { label: "7. Bishops and Their Counselors", href: LINKS.hb7 },
    { label: "4. Leadership and Councils", href: LINKS.hb4 },
    { label: "29. Meetings in the Church", href: LINKS.hb29 },
    { label: "31. Interviews and Counseling", href: LINKS.hb31 },
    { label: "30. Callings in the Church", href: LINKS.hb30 },
    { label: "Protecting Children training", href: LINKS.protectingChildrenTraining },
    { label: "Protecting Children overview", href: LINKS.protectingChildrenPage },
    { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo },
    { label: "Teaching in the Savior’s Way", href: LINKS.teachingSaviorsWay },
    { label: "General Handbook", href: LINKS.handbook },
  ],
  lessons: [
    {
      id: "bp-f1-keys",
      phase: "foundation",
      title: "The bishop’s keys and counselors’ roles",
      estimatedMinutes: 12,
      objective: "Clarify who holds keys and how counselors share the load under direction.",
      summary:
        "The bishop holds priesthood keys for the ward as the presiding high priest. Counselors act under his direction, share ministering and administrative load, and preside only when assigned. Unity in the bishopric is felt throughout the ward.",
      handbook: [
        { label: "7. Bishops and Their Counselors", href: LINKS.hb7 },
        { label: "3. Priesthood Principles", href: LINKS.hb3 },
      ],
      videos: [
        { label: "Handbooks and Callings", href: LINKS.handbooksCallings },
      ],
      practice:
        "As a bishopric, list which recurring duties each counselor owns—and one duty to rebalance this month.",
      reflectionPrompt: "Where are we unclear about who decides vs. who recommends?",
      required: true,
    },
    {
      id: "bp-f2-councils",
      phase: "foundation",
      title: "Bishopric meeting and ward council (no PEC)",
      estimatedMinutes: 12,
      objective: "Use current Handbook council patterns—not outdated PEC language.",
      summary:
        "Wards coordinate in bishopric meeting and unify organizations in ward council. A separate priesthood executive committee meeting is not the current pattern. Sensitive matters may use an expanded bishopric meeting when the Handbook directs. Focus councils on people, ordinances, and covenants.",
      handbook: [
        { label: "4. Leadership and Councils", href: LINKS.hb4 },
        { label: "29. Meetings in the Church", href: LINKS.hb29 },
        { label: "7. Bishops and Their Counselors", href: LINKS.hb7 },
      ],
      videos: [
        { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo },
      ],
      practice:
        "Rewrite your next ward council agenda so at least half the time is name-focused ministry, not calendar.",
      reflectionPrompt: "What ‘PEC habit’ do we still need to retire?",
      required: true,
    },
    {
      id: "bp-f3-salvation",
      phase: "foundation",
      title: "Ordinances and covenants at the center",
      estimatedMinutes: 10,
      objective: "Align ward work to God’s work of salvation and exaltation.",
      summary:
        "Help members live the gospel, care for those in need, invite others to receive the gospel, and unite families for eternity—with ordinances and covenants as the organizing center. Programs serve people.",
      handbook: [
        { label: "1. Work of Salvation and Exaltation", href: LINKS.hb1 },
        { label: "4. Leadership", href: LINKS.hb4 },
      ],
      videos: [
        { label: "General Conference", href: LINKS.generalConference },
      ],
      practice:
        "Pick three ward members and identify their next ordinance or covenant step—and who will help.",
      reflectionPrompt: "Which program consumes time without moving anyone toward a covenant?",
      required: true,
    },
    {
      id: "bp-f4-protect",
      phase: "foundation",
      title: "Protecting Children and Youth (required)",
      estimatedMinutes: 35,
      objective: "Complete official training and enforce two-deep leadership.",
      summary:
        "All adults working with children or youth complete Protecting Children training within one month and every three years. At least two responsible adults should be present in classes and activities. Bishops track compliance in Leader and Clerk Resources.",
      handbook: [
        { label: "Protecting Children overview", href: LINKS.protectingChildrenPage },
        { label: "20. Activities", href: LINKS.hb20 },
        { label: "Abuse introductory guidelines", href: LINKS.abuseIntro },
      ],
      videos: [
        {
          label: "Protecting Children online training",
          href: LINKS.protectingChildrenTraining,
          description: "Official Church training (~30 minutes).",
        },
      ],
      practice:
        "Open LCR (or ask the clerk) and list anyone overdue for Protecting Children; assign follow-up this week.",
      reflectionPrompt: "Are our youth interview and transportation patterns Handbook-safe?",
      required: true,
    },
    {
      id: "bp-c1-sacrament",
      phase: "core",
      title: "Sacrament meeting that invites the Spirit",
      estimatedMinutes: 10,
      objective: "Protect the reverence and Christ-centered purpose of sacrament meeting.",
      summary:
        "Sacrament meeting is the main worship meeting. Music, prayers, and messages should invite the Spirit. The bishopric prepares speakers, ensures priesthood ordinances are administered correctly, and gently guides testimony meeting patterns.",
      handbook: [
        { label: "29. Meetings — sacrament", href: LINKS.hb29 },
        { label: "7. Bishops", href: LINKS.hb7 },
      ],
      videos: [
        { label: "Teaching in the Savior’s Way", href: LINKS.teachingSaviorsWay },
      ],
      practice:
        "Review next month’s sacrament topics for Christ-centered focus and youth speaking opportunities.",
      reflectionPrompt: "What distraction have we normalized that we should quietly correct?",
      required: true,
    },
    {
      id: "bp-c2-youth",
      phase: "core",
      title: "Youth: Aaronic Priesthood and Young Women",
      estimatedMinutes: 14,
      objective: "Own the bishopric’s youth responsibilities with counselors and class presidencies.",
      summary:
        "The bishop has unique responsibility for young men and young women. Counselors share assignments. Strengthen class and quorum presidencies, attend key youth moments, and keep parents as partners.",
      handbook: [
        { label: "7. Bishops — youth responsibilities", href: LINKS.hb7 },
        { label: "General Handbook youth chapters via TOC", href: LINKS.handbook },
      ],
      videos: [
        { label: "Protecting Children overview", href: LINKS.protectingChildrenPage },
        { label: "Media Library — youth", href: LINKS.mediaLibrary },
      ],
      practice:
        "As a bishopric, assign which counselor leads YM vs YW coordination and the next presidency touchpoint dates.",
      reflectionPrompt: "Which youth has not had a meaningful interview or conversation recently?",
      required: true,
    },
    {
      id: "bp-c3-interviews",
      phase: "core",
      title: "Interviews, counseling, and confidentiality",
      estimatedMinutes: 14,
      objective: "Conduct authorized interviews that protect against misunderstandings.",
      summary:
        "Handbook 31 guides interviews. Especially with youth, follow protecting-against-misunderstanding principles. Keep confidences, involve parents appropriately, and never improvise worthiness questions beyond authorized direction.",
      handbook: [
        { label: "31. Interviews and Counseling", href: LINKS.hb31 },
        { label: "Abuse guidelines", href: LINKS.abuseIntro },
      ],
      videos: [
        { label: "Life Help", href: LINKS.lifeHelp },
      ],
      practice:
        "Role-play opening and closing a youth interview with warmth, clarity, and proper boundaries.",
      reflectionPrompt: "What interview habit do we need to standardize across the bishopric?",
      required: true,
    },
    {
      id: "bp-c4-callings",
      phase: "core",
      title: "Extending callings the Lord’s way",
      estimatedMinutes: 12,
      objective: "Use Handbook 30 patterns: revelation, dignity, and realistic load.",
      summary:
        "Prayerfully consider who can grow, not only who is already busy. Extend callings properly, set apart, train, and follow up. Avoid repeatedly overloading the same households.",
      handbook: [
        { label: "30. Callings in the Church", href: LINKS.hb30 },
        { label: "4. Developing leaders", href: LINKS.hb4 },
      ],
      videos: [
        { label: "Serve in the Church", href: LINKS.serve },
      ],
      practice:
        "Identify two members to develop in a calling this quarter who have not recently served in leadership.",
      reflectionPrompt: "Whose ‘yes’ have we mistaken for infinite capacity?",
      required: true,
    },
    {
      id: "bp-c5-ministering",
      phase: "core",
      title: "Ministering that reaches the one",
      estimatedMinutes: 10,
      objective: "Lead elders quorum and Relief Society ministering without turning it into a report mill.",
      summary:
        "Ministering is Christlike care coordinated with EQ and RS presidencies. Focus on needs and covenants. Use wisdom when youth companion with adults; two-deep class rules differ from ministering companionship guidance—follow the Handbook.",
      handbook: [
        { label: "21. Ministering", href: LINKS.hb21 },
        { label: "Effective Ministering video page", href: LINKS.effectiveMinisteringVideo },
      ],
      videos: [
        { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo },
      ],
      practice:
        "In ward council, review three ministering companionships that need a change—and why.",
      reflectionPrompt: "Are we measuring ministering by visits tallied or by souls helped?",
      required: true,
    },
    {
      id: "bp-c6-finances",
      phase: "core",
      title: "Finances, fast offerings, and temporal care",
      estimatedMinutes: 12,
      objective: "Administer sacred funds and welfare with Handbook controls and compassion.",
      summary:
        "Bishops oversee ward finances and care for the poor and needy with self-reliance principles. Follow audit and dual-control patterns. Counselors and clerks are partners in integrity.",
      handbook: [
        { label: "34. Finances and audits", href: LINKS.hb34 },
        { label: "22. Temporal needs", href: LINKS.hb22 },
      ],
      videos: [
        { label: "Church resources hub", href: LINKS.churchHome },
      ],
      practice:
        "Walk through your next assistance decision using both compassion and a self-reliance next step.",
      reflectionPrompt: "Where might convenience be weakening a financial control?",
      required: true,
    },
    {
      id: "bp-c7-temple",
      phase: "core",
      title: "Temple recommend interviews and temple culture",
      estimatedMinutes: 10,
      objective: "Conduct authorized recommend interviews that invite worthiness with hope.",
      summary:
        "Temple preparation is pastoral, not merely administrative. Ask authorized questions, teach doctrine of covenants, and help members qualify with Christlike encouragement. Coordinate with the stake presidency as required.",
      handbook: [
        { label: "25. Temple and family history work", href: LINKS.hb25 },
        { label: "31. Interviews", href: LINKS.hb31 },
      ],
      videos: [
        { label: "Media Library — temple", href: LINKS.mediaLibrary },
      ],
      practice:
        "List households who could prepare for a temple ordinance this quarter and assign ministering follow-up.",
      reflectionPrompt: "Do our interviews feel like gatekeeping or inviting?",
      required: true,
    },
    {
      id: "bp-a1-disclosure",
      phase: "application",
      title: "Scenario: abuse disclosure",
      estimatedMinutes: 12,
      objective: "Respond immediately with safety, legal duty, and Church help-line pathways.",
      summary:
        "The Church does not tolerate abuse. Protect the victim, contact legal authorities as required, counsel with the stake president, and use the abuse help line where available. Do not investigate alone or delay.",
      handbook: [
        { label: "Abuse introductory guidelines", href: LINKS.abuseIntro },
        { label: "Protecting Children page", href: LINKS.protectingChildrenPage },
      ],
      videos: [
        { label: "Protecting Children training", href: LINKS.protectingChildrenTraining },
        { label: "abuse.ChurchofJesusChrist.org", href: LINKS.abuseHelp },
      ],
      practice:
        "Write your first five actions after a disclosure involving a minor—before you sleep on it.",
      reflectionPrompt: "Do both counselors know the escalation path if I am unreachable?",
      required: true,
    },
    {
      id: "bp-a2-membership",
      phase: "application",
      title: "Scenario: serious sin and membership councils",
      estimatedMinutes: 12,
      objective: "Know when to counsel with the stake president and follow Handbook 32.",
      summary:
        "Repentance is centered in Jesus Christ. Some matters require membership councils or stake involvement. Do not invent local discipline processes. Seek Handbook 32 and stake presidency counsel early.",
      handbook: [
        { label: "32. Repentance and membership councils", href: LINKS.hb32 },
        { label: "31. Interviews and Counseling", href: LINKS.hb31 },
      ],
      videos: [
        { label: "Life Help", href: LINKS.lifeHelp },
      ],
      practice:
        "List warning signs that a matter is beyond ward-only counseling and requires the stake president.",
      reflectionPrompt: "Have I delayed a hard conversation hoping it would fade?",
      required: true,
    },
    {
      id: "bp-a3-ward-council-conflict",
      phase: "application",
      title: "Scenario: ward council conflict",
      estimatedMinutes: 8,
      objective: "Lead toward unity when organizations collide over calendar or approach.",
      summary:
        "Listen longer than you speak. Refocus on individuals and covenants. Decide with spiritual confirmation. Sometimes postpone. Never let contention linger unaddressed.",
      handbook: [
        { label: "4. Councils", href: LINKS.hb4 },
        { label: "29. Meetings", href: LINKS.hb29 },
      ],
      videos: [
        { label: "Effective Ministering (video)", href: LINKS.effectiveMinisteringVideo },
      ],
      practice:
        "Script a redirect: from program debate back to ‘Which people are we trying to help?’",
      reflectionPrompt: "Do I announce decisions before the council has been heard?",
      required: false,
    },
    {
      id: "bp-m1-self-care",
      phase: "mastery",
      title: "Bishopric health: family, Sabbath, and pacing",
      estimatedMinutes: 8,
      objective: "Lead sustainably so your family feels the joy of the gospel.",
      summary:
        "Do not neglect your own needs or your family. Share the load among counselors. Protect marriage and children with calendar boundaries. A burned-out bishopric cannot bless a ward.",
      handbook: [
        { label: "4. Balance in leadership", href: LINKS.hb4 },
      ],
      videos: [
        { label: "Come Follow Me", href: LINKS.comeFollowMe },
        { label: "General Conference", href: LINKS.generalConference },
      ],
      practice:
        "Each bishopric member shares one boundary the others must help protect for 90 days.",
      reflectionPrompt: "What will we stop doing as a bishopric this quarter?",
      required: true,
    },
    {
      id: "bp-m2-refresh",
      phase: "mastery",
      title: "Quarterly Handbook and policy refresh",
      estimatedMinutes: 15,
      objective: "Stay current when the Handbook is updated.",
      summary:
        "Handbook updates (including March 2026 adjustments) can change local practice. Quarterly, skim update notices and teach clerks and organization leaders what changed.",
      handbook: [
        { label: "General Handbook", href: LINKS.handbook },
        { label: "38. Policies and guidelines", href: LINKS.hb38 },
      ],
      videos: [
        { label: "Church home", href: LINKS.churchHome },
      ],
      practice:
        "Put a recurring quarterly ‘Handbook refresh’ on the bishopric calendar.",
      reflectionPrompt: "Which outdated handout are we still circulating?",
      required: true,
    },
    {
      id: "bp-m3-counselors-grow",
      phase: "mastery",
      title: "Optional: preparing counselors to preside",
      estimatedMinutes: 10,
      objective: "Give counselors real presiding practice under assignment.",
      summary:
        "Counselors grow when trusted with agendas, youth interviews (as authorized), and meeting leadership. Prepare them so releases and absences never stall the ward.",
      handbook: [
        { label: "7. Bishops and Their Counselors", href: LINKS.hb7 },
        { label: "4. Developing leaders", href: LINKS.hb4 },
      ],
      videos: [
        { label: "Teaching in the Savior’s Way", href: LINKS.teachingSaviorsWay },
      ],
      practice:
        "Assign a counselor to conduct next bishopric meeting end-to-end with your coaching notes afterward.",
      reflectionPrompt: "Am I clinging to tasks that would develop my counselors?",
      required: false,
    },
  ],
}
