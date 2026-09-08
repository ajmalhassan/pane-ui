import { describe, expect, it } from "vitest";
import { profile } from "@/content/profile";
/*
 * The same walker the shipped approved-metric tripwire uses
 * (`lib/content/projects.ts`), so this guard and the one that runs in
 * production cannot disagree about what "every string in this value" means.
 * It closes the forbidden-fact rules below over the whole `start` object
 * rather than a hand-maintained field list: a new field on `StartScreen` is
 * in the set the moment it exists.
 */
import { everyString } from "@/lib/content/strings";

const { start } = profile;
const LIVE_TILES = [start.evidence, start.assessment] as const;

/**
 * Every string the Me Start screen can paint or announce. The rules below are
 * about the whole surface -- an unapproved fact is unapproved wherever it is
 * written -- so they are asserted against the set, not one field at a time.
 * This also picks up `start.portrait.src` ("/portrait.jpg"), which a
 * hand-maintained list would have no reason to include; it does not trip any
 * forbidden pattern below (no year, percentage, employer name, and so on).
 */
const EVERY_STRING: readonly string[] = [profile.bio, ...everyString(start)];

describe("the visible proposition", () => {
  /*
   * The launch blocker this task exists to clear: Me led with career intent and
   * never said what Ajmal actually builds. Career intent may support the
   * proposition; it may not stand in for it.
   */
  it("connects AI-native systems to learning, assessment, and business outcomes", () => {
    expect(profile.bio).toMatch(/ai-native/i);
    expect(profile.bio).toMatch(/learning/i);
    expect(profile.bio).toMatch(/assessment/i);
    expect(profile.bio).toMatch(/business outcomes/i);
  });
});

describe("the cycled evidence", () => {
  it("keeps the two approved evidence labels stable and in reading order", () => {
    expect(start.evidence.claims.map((entry) => entry.claim)).toEqual([
      "5 frontend engineers",
      "5 learning squads",
      "AI-native systems",
    ]);
  });

  /*
   * A live tile's automatic changes are silent, so the one stable accessible
   * summary is the whole of what a screen reader gets. It has to carry every
   * claim the tile can show, in the order it shows them.
   */
  it("summarises every claim of every live tile in cycle order", () => {
    for (const tile of LIVE_TILES) {
      let cursor = -1;

      for (const { claim } of tile.claims) {
        const summary = tile.summary.toLowerCase();
        expect(summary, tile.label).toContain(claim.toLowerCase());
        const at = summary.indexOf(claim.toLowerCase());
        expect(at, `${tile.label}: ${claim}`).toBeGreaterThan(cursor);
        cursor = at;
      }
    }
  });

  it("reads the evidence summary as engineers, then squads, then the proposition", () => {
    expect(start.evidence.summary).toMatch(
      /5 frontend engineers.*5 learning squads.*AI-native systems/i,
    );
  });
});

describe("the reporting-line precision", () => {
  const teamCopy = [start.team.label, start.team.note].join(" ");
  const squadCopy = [start.squads.label, start.squads.note].join(" ");

  it("claims direct reports only for the frontend team", () => {
    expect(teamCopy).toMatch(/direct/i);
    expect(squadCopy).not.toMatch(/direct report/i);
  });

  /*
   * The squads are an engineering-ownership claim, not a headcount claim. The
   * copy has to say so out loud rather than leaving a reader to infer that
   * five squads of engineers report to Ajmal.
   */
  it("says out loud that the squad engineers do not all report to Ajmal", () => {
    expect(start.squads.note).toMatch(/not all report to me/i);
    expect(squadCopy).toMatch(/owner|ownership/i);
  });

  it("gives the two five-person claims distinct copy", () => {
    expect(start.team.label).not.toBe(start.squads.label);
    expect(start.team.note).not.toBe(start.squads.note);
  });
});

/*
 * Three facts the spec names explicitly, each of which has to survive on a
 * tile's own painted face -- not only in the supporting line, which is
 * unpainted below 84rem, and not only in the accessibility tree.
 */
describe("the facts that must be on a face", () => {
  it("says full stack on the craft tile's own caption", () => {
    expect(start.craft.label).toMatch(/full stack/i);
    /*
     * Two words, not one hyphenated one. At the caption's 11.2px lowercase
     * step `full-stack` is 50.47px and a 1x1 tile is 49.31px wide inside its
     * padding at 768 -- the tightest frame -- so the hyphenated form is
     * ellipsised there. `full stack` is 48.34px. The E2E fit sweep is what
     * proves it at the real widths; this keeps the copy from drifting back.
     */
    expect(start.craft.label).not.toMatch(/-/);
    expect(start.craft.equivalent).toMatch(/full-stack/i);
  });

  it("names hands-on work, product and team enablement on the leadership face", () => {
    expect(start.leadership.title).toMatch(/hands-on/i);
    expect(start.leadership.title).toMatch(/product/i);
    expect(start.leadership.title).toMatch(/team/i);
    // The measured budget: a 2x1 tile's two title lines at 320 are 125px wide
    // at 13.6px, which is 34 characters of this copy and no more.
    expect(start.leadership.title.length).toBeLessThanOrEqual(34);
  });

  it("keeps the Lumia tile's own colour claim on the tile, not in a caption", () => {
    // `first phone` is 57.56px against a 49.31px 1x1 caption at 768, so the
    // face carries the numeral and the note carries the rest.
    expect(start.lumia.value).toBe("520");
    expect(start.lumia.note).toMatch(/first smartphone/i);
    expect(start.lumia.note).toMatch(/cyan/i);
  });
});

describe("the approved-facts boundary", () => {
  /*
   * Nothing on Me may invent an employer, a date, a location, an availability
   * signal, or a metric. `₹1Cr+` is a real approved number, but it belongs to
   * the lead-collection platform on Projects -- it is not a Me claim.
   */
  const FORBIDDEN: readonly [RegExp, string][] = [
    [/\b(19|20)\d{2}\b/, "a year"],
    [/\b\d+\+?\s*(years?|yrs?|months?)\b/i, "a duration"],
    [/\bentri\b/i, "an employer name"],
    [
      /\b(available|hiring|open to work|freelance|notice period)\b/i,
      "availability",
    ],
    [/\b(india|kerala|kochi|bangalore|bengaluru|remote)\b/i, "a location"],
    [/₹|\bcr\b|\blakh\b|\brevenue\b/i, "a revenue metric"],
    [/\b\d+\s*%/, "a percentage"],
  ];

  it.each(FORBIDDEN)("never writes %s (%s) anywhere on Me", (pattern) => {
    for (const value of EVERY_STRING) {
      expect(value).not.toMatch(pattern);
    }
  });

  /*
   * The AI assessment tile describes a real platform, and the approved
   * description is specific: Gemini Live for spoken English, role play,
   * LinkedIn/profile work, assessment experimentation, and the learning that
   * generic assignment grading needed more grounding evidence. Anything that
   * reads as a nearby-but-different product claim is invented.
   */
  it.each([
    [/interview practice/i, "interview practice"],
    [/drill/i, "drills"],
    [/mock\b/i, "mock interviews"],
    [/coach/i, "coaching"],
    [/coding (test|round)/i, "coding tests"],
  ])("never claims %s (%s) on the AI assessment tile", (pattern) => {
    const copy = [
      start.assessment.summary,
      ...start.assessment.claims.flatMap((claim) => [claim.claim, claim.note]),
    ].join(" ");

    expect(copy).not.toMatch(pattern);
  });

  it("names LinkedIn where the approved description does", () => {
    const notes = start.assessment.claims.map((claim) => claim.note).join(" ");

    expect(notes).toMatch(/linkedin/i);
  });

  it("keeps the only approved numerals on Me to the two fives and the Lumia", () => {
    const numerals = EVERY_STRING.join(" ").match(/\d+/g) ?? [];

    expect([...new Set(numerals)].sort()).toEqual(["5", "520"]);
  });
});

describe("the tile copy budgets", () => {
  /*
   * A tile clips what will not fit, and the caption is a single ellipsised
   * line on a 1x1 tile that is 67px wide at 320px. These are the budgets the
   * layout tests then prove at real widths.
   */
  it("keeps every caption short enough for a tile's one caption line", () => {
    const captions = [
      start.capabilityGraph.label,
      start.portrait.label,
      start.evidence.label,
      start.team.label,
      start.squads.label,
      start.assessment.label,
      start.craft.label,
      start.lumia.label,
      start.leadership.label,
    ];

    for (const caption of captions) {
      expect(caption.length).toBeLessThanOrEqual(15);
      expect(caption).toBe(caption.toLowerCase());
    }
  });

  it("keeps every cycled claim inside a wide tile's two title lines", () => {
    for (const tile of LIVE_TILES) {
      expect(tile.claims.length).toBeGreaterThan(1);
      for (const { claim } of tile.claims) {
        expect(claim.length).toBeLessThanOrEqual(28);
      }
    }
  });

  it("keeps every numeral inside a small tile's value budget", () => {
    for (const value of [
      start.team.value,
      start.squads.value,
      start.lumia.value,
    ]) {
      expect(value).toMatch(/^\d{1,3}$/);
    }
  });
});
