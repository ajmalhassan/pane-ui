export type ProfileLink = {
  label: string;
  href: string;
};

export type SelectedExperience = {
  title: string;
  summary: string;
};

/** One claim a live tile can show, plus the line it grows into on a wide canvas. */
export type ProfileClaim = {
  /** The claim on the tile face: tile-safe, no sentence, no trailing stop. */
  claim: string;
  /** One supporting line, painted only where the tile has room for it. */
  note: string;
};

type BaseTileCopy = {
  /** The tile's own caption: lowercase, and short enough for one clipped line. */
  label: string;
};

/**
 * A live tile's copy. `summary` is the single stable accessible name: automatic
 * changes are silent, so it has to carry every claim, in cycle order, on its
 * own.
 */
export type LiveTileCopy = BaseTileCopy & {
  summary: string;
  claims: readonly ProfileClaim[];
};

/** A tile led by a headline, with a supporting line beneath it. */
export type TitleTileCopy = BaseTileCopy & {
  title: string;
  note: string;
};

/** A tile whose content is one numeral, the way a Start-screen tile carries one. */
export type NumeralTileCopy = BaseTileCopy & {
  value: string;
  note: string;
};

export type PortraitTileCopy = BaseTileCopy & {
  src: string;
  alt: string;
};

/** A tile whose content is a glyph, and the text that says what the glyph means. */
export type MotifTileCopy = BaseTileCopy & {
  equivalent: string;
};

/**
 * The Me pivot is a personal Start screen, and this is everything it says. Only
 * approved facts live here: no employer, no dates, no location, no
 * availability, and no metric -- the one approved number, the lead platform's
 * revenue contribution, belongs to Projects, not to Me.
 */
export type StartScreen = {
  capabilityGraph: TitleTileCopy;
  portrait: PortraitTileCopy;
  evidence: LiveTileCopy;
  team: NumeralTileCopy;
  squads: NumeralTileCopy;
  assessment: LiveTileCopy;
  craft: MotifTileCopy;
  lumia: NumeralTileCopy;
  leadership: TitleTileCopy;
};

export type Profile = {
  name: string;
  headline: string;
  /** The visible proposition. Career intent supports it; it never replaces it. */
  bio: string;
  leadership: readonly string[];
  links: {
    linkedin: ProfileLink;
    github: ProfileLink;
    dev: ProfileLink;
    codepen: ProfileLink;
    instagram: ProfileLink;
  };
  selectedExperience: readonly SelectedExperience[];
  start: StartScreen;
};

export const profile = {
  name: "Ajmal Hassan",
  headline: "technical leader / builder / systems thinker",
  bio: "I build AI-native systems where learning, assessment, and business outcomes share one model, and I lead the engineers who ship them.",
  leadership: [
    "I directly lead five frontend engineers while staying close to implementation.",
    "I hold cross-functional engineering ownership across five learning squads; that ownership does not imply direct reporting relationships across the squads.",
    "My growth has moved from deep frontend craft toward broader full-stack ownership.",
  ],
  links: {
    linkedin: {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/ajmalhassankn/",
    },
    github: { label: "GitHub", href: "https://github.com/ajmalhassan" },
    dev: { label: "DEV", href: "https://dev.to/ajmalhassan" },
    codepen: { label: "CodePen", href: "https://codepen.io/ajmalhassankn" },
    instagram: {
      label: "Instagram",
      href: "https://www.instagram.com/_ajmalhassan",
    },
  },
  selectedExperience: [
    {
      title: "Frontend leadership",
      summary:
        "Hands-on leadership for a five-person frontend team, with a focus on clear engineering decisions and delivery.",
    },
    {
      title: "Learning systems",
      summary:
        "Cross-functional engineering ownership across five learning squads, described without disclosing employer, product, or internal details.",
    },
    {
      title: "Expanding product ownership",
      summary:
        "A progression from frontend craft into broader full-stack product and system-building work.",
    },
  ],
  start: {
    capabilityGraph: {
      label: "current work",
      title: "capability graph",
      note: "Curriculum, rubrics, and job-market signal joined for assessment and placement.",
    },
    portrait: {
      label: "ajmal hassan",
      src: "/portrait.jpg",
      alt: "Portrait of Ajmal Hassan",
    },
    evidence: {
      label: "evidence",
      summary:
        "Evidence: 5 frontend engineers reporting directly to me, 5 learning squads under engineering ownership rather than a reporting line, and AI-native systems joining learning, assessment, and business outcomes.",
      claims: [
        { claim: "5 frontend engineers", note: "Reporting directly to me." },
        {
          claim: "5 learning squads",
          note: "Engineering ownership, not a reporting line.",
        },
        {
          claim: "AI-native systems",
          note: "Learning, assessment, and business outcomes.",
        },
      ],
    },
    /*
     * The two fives are deliberately not the same claim. One is a reporting
     * line; the other is engineering ownership over squads whose engineers do
     * not all report to Ajmal, and the copy says so rather than leaving a
     * reader to assume a headcount.
     */
    team: {
      label: "direct reports",
      value: "5",
      note: "Frontend engineers I lead hands-on, close to the code.",
    },
    squads: {
      label: "learning squads",
      value: "5",
      note: "Engineering owner across the squads; their engineers do not all report to me.",
    },
    assessment: {
      label: "ai assessment",
      summary:
        "Live AI assessment: real-time spoken English on Gemini Live, role play and profile work, and a targeted gap interview after generic assignment grading needed more grounding evidence.",
      claims: [
        {
          claim: "Real-time spoken English",
          note: "Gemini Live carries the session.",
        },
        {
          claim: "Role play and profile work",
          // Only approved words: the note names LinkedIn, which the claim does
          // not, and invents no activity the platform was not described as.
          note: "LinkedIn and profile work.",
        },
        {
          claim: "Targeted gap interview",
          note: "Generic grading needed more grounding.",
        },
      ],
    },
    craft: {
      /*
       * The caption carries the fact, not the tile's name: under the SVG arrow
       * the tile reads `-> full stack` at every width, which is the half of
       * the progression a reader cannot infer from an arrow alone.
       *
       * Two words, and the hyphen is the reason. Measured with a Range at the
       * caption's own 11.2px lowercase step, `full-stack` is 50.47px against a
       * 1x1 tile's 49.31px inner width at 768 -- the tightest frame there is,
       * where the grid doubles to eight columns and a unit halves. It would be
       * ellipsised there by 1.16px. `full stack` is 48.34px and clears it, and
       * clears 51.50px at 320 and 69.75px at 393 with room to spare.
       */
      label: "full stack",
      equivalent: "Frontend craft, now full-stack.",
    },
    lumia: {
      /*
       * A 1x1 tile paints a numeral and a caption and nothing else, and its
       * inner width is 51.50px at 320, 69.75px at 393 and 49.31px at 768.
       * `first phone` is 57.56px and `my first phone` 76.48px, so neither
       * clears 320 or 768; `520 cyan` is 49.16px, which clears 768 by 0.15px
       * and only restates the numeral. So the face makes the Lumia and the
       * cyan (the tile's own fill is the colour claim) and the note carries
       * `first smartphone` -- painted from the desktop threshold, and in the
       * accessibility tree at every width.
       */
      label: "lumia",
      value: "520",
      note: "Cyan, and my first smartphone.",
    },
    leadership: {
      /*
       * All three notions the spec asks this tile to express have to be on the
       * face, not only in the supporting line -- the line is unpainted below
       * the desktop threshold. The budget is a 2x1 tile's two title lines at
       * 320: 125px of inner width at 13.6px, which is 31px of a 31px box.
       * Measured, `Hands-on, product, team enablement` takes exactly those two
       * lines; `Hands-on, product-minded, enabling teams` and
       * `Ships code, shapes product, grows teams` each need a third and lose a
       * line to the clamp. The fuller sentence stays as the note.
       */
      label: "how i lead",
      title: "Hands-on, product, team enablement",
      note: "Hands-on engineering, product judgment, and team enablement.",
    },
  },
} as const satisfies Profile;
