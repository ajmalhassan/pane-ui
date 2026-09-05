import { describe, expect, it } from "vitest";
import {
  carriesMetric,
  PROJECT_TILE_ROLES,
  PROJECT_TILE_SIZES,
  projects,
} from "@/lib/content/projects";

/**
 * The Projects Start screen, as content rather than as markup. Importing
 * `projects` already runs `validateProjects`, so these tests are about the
 * composition the spec names and the publication rules a validator cannot
 * express on its own.
 */

/** Grid units per tile size -- what the packing arithmetic below counts in. */
const UNITS = { wide: 2, large: 4, hero: 8 } as const;

const DRAFT_TITLE = /^Draft example/;

it("leads with the system tile and orders the block as it is read", () => {
  expect(projects.map((project) => project.slug)).toEqual([
    "metro-revival",
    "capability-graph",
    "lead-platform",
    "live-ai-assessment",
    "agent-ready-foundations",
  ]);
});

it("gives the prominent tile to the portfolio itself and evidence tiles to the rest", () => {
  expect(projects.map((project) => project.tileSize)).toEqual([
    "hero",
    "large",
    "large",
    "wide",
    "wide",
  ]);
});

/*
 * DOM order is visual order -- the grid uses no dense flow -- so the sizes above
 * have to pack without leaving a hole a later tile would jump over. Twenty units
 * is five complete rows of four on a phone; at eight columns it is two complete
 * rows and a half row under them, and a ragged last row is fine where an
 * interior hole is not. The four-column grid is the one that would open a hole,
 * so it is the one checked here.
 *
 * A band is hole-free when the tiles in it fill the four columns exactly and
 * all stand the same number of rows tall -- a 2x2 beside a 2x1 leaves a 2x1
 * gap under the shorter one that sparse auto-placement will never come back
 * for. `tests/e2e/portfolio.spec.ts` proves the result by measuring the grid's
 * own height at every frame; this is the arithmetic that has to hold first.
 */
it("packs the block without opening a hole at four columns", () => {
  const SPAN = {
    wide: { columns: 2, rows: 1 },
    large: { columns: 2, rows: 2 },
    hero: { columns: 4, rows: 2 },
  } as const;

  expect(
    projects.reduce((total, project) => total + UNITS[project.tileSize], 0),
  ).toBe(20);

  let filled = 0;
  let bandRows: number | null = null;

  for (const project of projects) {
    const span = SPAN[project.tileSize];
    bandRows ??= span.rows;

    expect(span.rows, `${project.slug} is not as tall as its band`).toBe(
      bandRows,
    );
    filled += span.columns;
    expect(filled, `${project.slug} overflows its band`).toBeLessThanOrEqual(4);

    if (filled === 4) {
      filled = 0;
      bandRows = null;
    }
  }

  expect(filled, "the last band is left half full").toBe(0);
});

it("makes every project tile the one link to its own case study", () => {
  for (const project of projects) {
    expect(project.tileRole).toBe("navigation");
    expect(PROJECT_TILE_ROLES).toContain(project.tileRole);
    expect(PROJECT_TILE_SIZES).toContain(project.tileSize);
  }
});

describe("what a face says", () => {
  it("carries evidence on every face, and never only a repeated name", () => {
    for (const project of projects) {
      const at = project.slug;
      expect(project.tileHeadline.trim(), at).not.toBe("");
      expect(project.tileLabel.trim(), at).not.toBe("");

      // Neither says what the other already said. The caption is normally the
      // destination's short name and the headline the evidence; on the
      // capability tile it is the other way round -- the headline carries the
      // name and the caption the framing. What holds on every tile is that
      // neither string contains the other, because the whole tile is one link
      // and its accessible name is both of them read out in order.
      const label = project.tileLabel.toLowerCase();
      const headline = project.tileHeadline.toLowerCase();
      expect(headline, at).not.toBe(label);
      expect(headline.includes(label), at).toBe(false);
      expect(label.includes(headline), at).toBe(false);
    }
  });

  /*
   * A `wide` tile is one grid unit tall and paints no body line, so its whole
   * face is the headline. Only `large` and `hero` may carry a claim, and no
   * size carries a claim and a numeral at once -- the two together do not fit a
   * 141px tile on a phone.
   */
  it("asks for a supporting line only where one is painted", () => {
    for (const project of projects) {
      const at = project.slug;
      if (project.tileSize === "wide") {
        expect(project.tileClaim, at).toBeUndefined();
        expect(project.showsMetric, at).toBeUndefined();
      }

      expect(
        Boolean(project.tileClaim) && Boolean(project.showsMetric),
        at,
      ).toBe(false);
    }
  });

  /*
   * Four of the five case studies are drafts. A reader meets the tile long
   * before the detail page, so the marker has to be on the face -- and in the
   * caption, which is the one slot every size paints at every width.
   */
  it("marks every draft case study on its own tile caption", () => {
    const drafts = projects.filter((project) =>
      DRAFT_TITLE.test(project.title),
    );
    expect(drafts).toHaveLength(4);

    for (const project of drafts) {
      expect(project.tileLabel, project.slug).toMatch(/draft/i);
    }

    for (const project of projects) {
      if (DRAFT_TITLE.test(project.title)) continue;
      expect(project.tileLabel, project.slug).not.toMatch(/draft/i);
    }
  });
});

/*
 * `₹1Cr+` is the one approved public number on this site and it is cleared for
 * one case study. `validateProjects` refuses to build a project that breaks
 * that; this reads the shipped content and says where the number actually is,
 * including inside every section body.
 */
it("prints the approved metric on the lead platform and nowhere else", () => {
  // `carriesMetric` is the validator's own predicate, imported rather than
  // copied, so this measures the shipped rule instead of a second version of it.
  const carriers = projects.filter(carriesMetric);

  expect(carriers.map((project) => project.slug)).toEqual(["lead-platform"]);

  const platform = carriers[0];
  expect(platform.showsMetric).toBe(true);
  expect(platform.metric).toBe("₹1Cr+");
});
