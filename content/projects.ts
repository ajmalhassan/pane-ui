import type { Project } from "@/lib/content/projects";

/*
 * Reading order is packing order. The grid places tiles in DOM order without
 * dense flow, so these five sizes fill 20 units: five complete rows of four on
 * a phone, and at eight columns two complete rows with a half row under them --
 * a ragged last row is fine, an interior hole is not.
 *
 * Every face carries its own evidence, so a reader never has to open a case
 * study to learn why the project matters. The budgets those faces are written
 * against are measured, and enforced by `validateProjects` in
 * `lib/content/projects.ts`.
 *
 * Four of the five case studies are drafts, and each says so on its face -- the
 * caption carries a `draft` marker at every frame, not only on the detail page.
 */
export const projects = [
  {
    slug: "metro-revival",
    title: "Lumia Metro Revival",
    summary:
      "An in-progress design-system concept giving Lumia's interaction spirit a second life on the modern web.",
    status: "in-progress",
    accent: "cyan",
    tileSize: "hero",
    tileRole: "navigation",
    tileLabel: "metro revival",
    tileHeadline: "A Lumia application containing a portfolio",
    tileClaim:
      "In progress — the proving ground for this interaction language.",
    sections: [
      {
        heading: "Problem and users",
        body: "Modern portfolios often flatten personality into familiar templates. This concept explores a memorable, usable alternative for hiring managers, founders, clients, and developers.",
      },
      {
        heading: "Role and team context",
        body: "I am designing and implementing the system as a personal product and frontend craft study.",
      },
      {
        heading: "Constraints and risks",
        body: "The experience must evoke Windows Phone without becoming a replica, while remaining accessible, responsive, fast, and useful without JavaScript.",
      },
      {
        heading: "System or product approach",
        body: "A small repo-local Metro layer supplies pivots, panoramas, live tiles, press feedback, status atmosphere, and app-bar actions to portfolio compositions.",
      },
      {
        heading: "Important decisions and trade-offs",
        body: "Content and native navigation stay primary. Motion explains spatial changes, and reduced-motion users receive immediate state changes rather than decorative choreography.",
      },
      {
        heading: "Outcome and evidence",
        body: "In progress: the portfolio is the proving ground for the interaction language before any open-source extraction is considered.",
      },
      {
        heading: "What failed or changed",
        body: "The direction moved away from a novelty phone frame toward a responsive web panorama that keeps the Lumia character without constraining the content.",
      },
      {
        heading: "Lessons and next questions",
        body: "The key question is how much nostalgia can strengthen a contemporary interface before it begins to compete with the evidence it should present.",
      },
    ],
  },
  /*
   * This tile inverts the usual headline/caption roles on purpose: the
   * headline carries the project name ("Capability graph") and the caption
   * carries the framing plus the draft marker ("current work · draft"),
   * because the natural pairing doesn't fit -- `capability graph · draft`
   * measures 121.05px against this tile's 117px caption box at 320, over the
   * 21-character budget by three. Putting the name on the headline and the
   * "current work" framing on the caption is what both the spec ("capability
   * graph as current work") and the character budget can hold at once.
   */
  {
    slug: "capability-graph",
    title: "Draft example — Capability graph",
    summary:
      "An anonymized dummy case study about connecting learning capabilities across a product organization.",
    /*
     * Accepted contradiction: the case-study header prints "Status: in
     * progress" above a `Draft example` heading. "Current work" is the
     * approved fact about this project and the tile caption says it, so the
     * status stays -- unlike `agent-ready-foundations`, which is a concept and
     * had no such claim behind it.
     */
    status: "in-progress",
    accent: "blue",
    tileSize: "large",
    tileRole: "navigation",
    tileLabel: "current work · draft",
    tileHeadline: "Capability graph",
    tileClaim: "Curriculum to placement.",
    sections: [
      {
        heading: "Problem and users",
        body: "Draft example: teams need a shared way to describe capabilities across learning journeys, assessments, and product surfaces.",
      },
      {
        heading: "Role and team context",
        body: "Draft example: engineering ownership spans five multidisciplinary learning squads; this does not imply direct reporting across those squads.",
      },
      {
        heading: "Constraints and risks",
        body: "Draft example: inconsistent terminology, evolving product needs, and sensitive organizational context limit what can be published.",
      },
      {
        heading: "System or product approach",
        body: "Draft example: an organization-level capability graph built from curriculum, assignment rubrics, and job-market corpus, connecting course creation, learning materials, assessment, placement, and future adaptive learning.",
      },
      {
        heading: "Important decisions and trade-offs",
        body: "Draft example: prefer a small shared vocabulary and gradual adoption over a comprehensive ontology delivered all at once.",
      },
      {
        heading: "Outcome and evidence",
        body: "Draft example: this is current work. Outcome details require approval before publication; no internal metrics are claimed here.",
      },
      {
        heading: "What failed or changed",
        body: "Draft example: early assumptions and iteration details will be added only after they can be safely disclosed.",
      },
      {
        heading: "Lessons and next questions",
        body: "Draft example: how can shared capability language remain precise without slowing product teams down?",
      },
    ],
  },
  {
    slug: "lead-platform",
    title: "Draft example — Lead platform",
    summary:
      "An anonymized dummy case study about a full-stack lead platform connecting acquisition and business workflows.",
    status: "shipped",
    metric: "₹1Cr+",
    accent: "cyan",
    tileSize: "large",
    tileRole: "navigation",
    tileLabel: "lead platform · draft",
    tileHeadline: "Revenue contribution",
    showsMetric: true,
    sections: [
      {
        heading: "Problem and users",
        body: "Draft example: fragmented lead capture and handoffs made it harder for business teams to connect acquisition activity to follow-up.",
      },
      {
        heading: "Role and team context",
        body: "Draft example: hands-on product engineering ownership connected frontend experience with expanding full-stack delivery.",
      },
      {
        heading: "Constraints and risks",
        body: "Draft example: reliability, attribution, integration boundaries, and safe handling of business data shaped delivery.",
      },
      {
        heading: "System or product approach",
        body: "Draft example: an internal lead-collection forms platform built end to end — CRM integration, URL shortening, fast forms, and near-zero platform-side submission-to-agent latency.",
      },
      {
        heading: "Important decisions and trade-offs",
        body: "Draft example: prioritize dependable end-to-end business flow over speculative platform abstraction.",
      },
      {
        heading: "Outcome and evidence",
        body: "Draft example: the approved public outcome is ₹1Cr+ associated revenue contribution. No additional internal metric is claimed.",
      },
      {
        heading: "What failed or changed",
        body: "Draft example: implementation revisions and operational lessons require approval before publication.",
      },
      {
        heading: "Lessons and next questions",
        body: "Draft example: where should a lead platform stay product-specific, and where does shared infrastructure earn its cost?",
      },
    ],
  },
  {
    slug: "live-ai-assessment",
    title: "Draft example — Live AI assessment",
    summary:
      "An anonymized dummy case study about finding a useful, evidence-grounded role for live AI assessment.",
    status: "concept",
    accent: "ink",
    tileSize: "wide",
    tileRole: "navigation",
    tileLabel: "ai assessment · draft",
    tileHeadline: "A gap interview, not a grader",
    sections: [
      {
        heading: "Problem and users",
        body: "Draft example: learners need timely assessment feedback without treating a generative model as an unquestionable evaluator.",
      },
      {
        heading: "Role and team context",
        body: "Draft example: the work joins AI product thinking, full-stack delivery, learning design, and assessment expertise.",
      },
      {
        heading: "Constraints and risks",
        body: "Draft example: latency, model variability, learner trust, evidence quality, and privacy require careful product boundaries.",
      },
      {
        heading: "System or product approach",
        body: "Draft example: a real-time assessment platform using Gemini Live for spoken English, role play, and profile work, with assessment experimentation alongside it.",
      },
      {
        heading: "Important decisions and trade-offs",
        body: "Draft example: narrower automation can be more useful and trustworthy than a feature that attempts to assess everything.",
      },
      {
        heading: "Outcome and evidence",
        body: "Draft example: outcome details require approval before publication; this entry makes no performance or learner-impact claim.",
      },
      {
        heading: "What failed or changed",
        body: "Draft example: generic assignment grading needed more grounding evidence than it had, so the AI was repositioned as a targeted gap interview and drill-down layer rather than a general evaluator.",
      },
      {
        heading: "Lessons and next questions",
        body: "Draft example: what evidence should a live AI system be allowed to interpret, and when should it defer to a person?",
      },
    ],
  },
  {
    slug: "agent-ready-foundations",
    title: "Draft example — Agent-ready harness",
    summary:
      "An anonymized dummy case study about agent-ready engineering harnesses: standards, stop hooks, and strategically triggered skills.",
    status: "concept",
    accent: "blue",
    tileSize: "wide",
    tileRole: "navigation",
    tileLabel: "agent harness · draft",
    tileHeadline: "Standards, stop hooks, skills",
    sections: [
      {
        heading: "Problem and users",
        body: "Draft example: cross-disciplinary contributors need engineering harnesses that hold work to shared standards; the specific context requires approval before publication.",
      },
      {
        heading: "Role and team context",
        body: "Draft example: role and team details require approval before publication.",
      },
      {
        heading: "Constraints and risks",
        body: "Draft example: constraints and risks require approval before publication.",
      },
      {
        heading: "System or product approach",
        body: "Draft example: agent-ready engineering harnesses carrying explicit standards, stop hooks, and strategically triggered skills.",
      },
      {
        heading: "Important decisions and trade-offs",
        body: "Draft example: decisions and trade-offs require approval before publication.",
      },
      {
        heading: "Outcome and evidence",
        body: "Draft example: the reported effect is improved cross-disciplinary contribution and turnaround time. No metric is claimed here, and further outcome detail requires approval before publication.",
      },
      {
        heading: "What failed or changed",
        body: "Draft example: what failed or changed requires approval before publication.",
      },
      {
        heading: "Lessons and next questions",
        body: "Draft example: which parts of an engineering standard are worth encoding as a harness, and which are better left to a person?",
      },
    ],
  },
] satisfies Project[];
