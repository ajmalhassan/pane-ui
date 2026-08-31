import type { Project } from "@/lib/content/projects";

export const projects = [
  {
    slug: "metro-revival",
    title: "Lumia Metro Revival",
    summary:
      "An in-progress design-system concept giving Lumia's interaction spirit a second life on the modern web.",
    status: "in-progress",
    accent: "cyan",
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
  {
    slug: "capability-graph",
    title: "Draft example — Capability graph",
    summary:
      "An anonymized dummy case study about connecting learning capabilities across a product organization.",
    status: "concept",
    accent: "blue",
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
        body: "Draft example: model capabilities as reusable relationships that product, learning, and assessment workflows can reference.",
      },
      {
        heading: "Important decisions and trade-offs",
        body: "Draft example: prefer a small shared vocabulary and gradual adoption over a comprehensive ontology delivered all at once.",
      },
      {
        heading: "Outcome and evidence",
        body: "Draft example: outcome details require approval before publication; no internal metrics are claimed here.",
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
    slug: "live-ai-assessment",
    title: "Draft example — Live AI assessment",
    summary:
      "An anonymized dummy case study about finding a useful, evidence-grounded role for live AI assessment.",
    status: "concept",
    accent: "ink",
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
        body: "Draft example: constrain the live AI interaction around observable evidence and clear escalation paths rather than broad judgment.",
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
        body: "Draft example: rejected assumptions and revised model boundaries will be documented only when disclosure is approved.",
      },
      {
        heading: "Lessons and next questions",
        body: "Draft example: what evidence should a live AI system be allowed to interpret, and when should it defer to a person?",
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
        body: "Draft example: bring lead collection, URL shortening, and CRM-connected workflows into one product surface.",
      },
      {
        heading: "Important decisions and trade-offs",
        body: "Draft example: prioritize dependable end-to-end business flow over speculative platform abstraction.",
      },
      {
        heading: "Outcome and evidence",
        body: "Draft example: the approved public outcome is ₹1Cr+ associated revenue. No additional internal metric is claimed.",
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
] satisfies Project[];
