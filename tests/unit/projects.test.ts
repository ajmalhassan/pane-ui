import { expect, it } from "vitest";
import {
  getProject,
  type Project,
  validateProjects,
} from "@/lib/content/projects";

/**
 * A minimal valid project. Every test below breaks exactly one thing about it,
 * so a failure names the rule that fired rather than the fixture.
 */
function project(overrides: Partial<Project> = {}): Project {
  return {
    slug: "valid",
    title: "Valid title",
    summary: "Valid summary",
    status: "concept",
    accent: "ink",
    sections: [],
    tileSize: "large",
    tileRole: "navigation",
    tileLabel: "valid",
    tileHeadline: "Valid headline",
    ...overrides,
  };
}

it("rejects duplicate slugs", () => {
  const duplicate = project({ slug: "same" });

  expect(() =>
    validateProjects([duplicate, { ...duplicate, title: "Two" }]),
  ).toThrow("Duplicate project slug: same");
});

it("returns a known project and undefined for an unknown slug", () => {
  expect(getProject("metro-revival")?.title).toMatch(/Metro|Lumia/);
  expect(getProject("missing")).toBeUndefined();
});

it.each([
  ["slug", { slug: "" }],
  ["title", { title: "  " }],
  ["summary", { summary: "" }],
  ["tileLabel", { tileLabel: " " }],
  ["tileHeadline", { tileHeadline: "" }],
])("rejects an empty %s", (field, override) => {
  expect(() => validateProjects([project(override)])).toThrow(
    `Project ${field} is required`,
  );
});

it("rejects a tile size the grid has no place for", () => {
  expect(() =>
    // `small` is a real TileSize but not a project one: a 1x1 tile is 67px
    // square on a phone, which is a glyph, not a case-study destination.
    validateProjects([project({ tileSize: "small" as Project["tileSize"] })]),
  ).toThrow("unsupported tileSize: small");
});

it("rejects a tile role other than navigation", () => {
  expect(() =>
    validateProjects([project({ tileRole: "live" as Project["tileRole"] })]),
  ).toThrow("unsupported tileRole: live");
});

/*
 * The budgets are measured px capacities turned into character counts
 * (`lib/content/projects.ts`), and they are the only thing standing between a
 * long string and a tile that silently clips it. Each of these is one character
 * over its size's budget.
 */
it.each([
  [
    "tileLabel",
    "large",
    { tileLabel: "x".repeat(22) },
    "a large tile holds 21",
  ],
  [
    "tileHeadline",
    "large",
    { tileHeadline: "x".repeat(24) },
    "a large tile holds 23",
  ],
  [
    "tileHeadline",
    "wide",
    { tileSize: "wide" as const, tileHeadline: "x".repeat(31) },
    "a wide tile holds 30",
  ],
  [
    "tileHeadline",
    "hero",
    { tileSize: "hero" as const, tileHeadline: "x".repeat(47) },
    "a hero tile holds 46",
  ],
  [
    "tileClaim",
    "large",
    { tileClaim: "x".repeat(31) },
    "a large tile holds 30",
  ],
  [
    "metric",
    "large",
    { metric: "x".repeat(7), showsMetric: true as const },
    "a large tile holds 6",
  ],
])("rejects a %s over the %s budget", (field, _size, override, message) => {
  expect(() => validateProjects([project(override)])).toThrow(
    new RegExp(`${field} is \\d+ characters; ${message}`),
  );
});

/*
 * A `wide` tile is one grid unit tall and paints no body line at any width, so
 * a claim written for one is not truncated -- it is never drawn at all. That is
 * an authoring mistake, and it fails loudly rather than disappearing.
 */
it("rejects a supporting claim on a tile that paints no body line", () => {
  expect(() =>
    validateProjects([
      project({ tileSize: "wide", tileClaim: "Never painted." }),
    ]),
  ).toThrow("sets tileClaim on a wide tile, which paints no body line");
});

/*
 * The numeral on a face is the project's own `metric`, painted rather than
 * re-authored -- `showsMetric` only says whether the face shows it. So the one
 * way to get it wrong is to ask for a numeral the project does not have.
 */
it("rejects a face numeral with no metric behind it", () => {
  expect(() => validateProjects([project({ showsMetric: true })])).toThrow(
    "Project valid sets showsMetric, so metric is required",
  );

  expect(() =>
    validateProjects([project({ showsMetric: true, metric: "  " })]),
  ).toThrow("Project valid sets showsMetric, so metric is required");
});

/*
 * A claim and a numeral on one face was accepted by the validator and refused
 * only by a test over the shipped array. The arithmetic it breaks: the numeral
 * is budgeted the whole copy region and the title takes another 46% of it, so a
 * `hero` at 320 asked for all three needs 134.2px of a 100px region.
 */
it("rejects a face that asks for a claim and a numeral at once", () => {
  expect(() =>
    validateProjects([
      project({
        metric: "12",
        showsMetric: true,
        tileClaim: "Both at once.",
      }),
    ]),
  ).toThrow(
    "Project valid sets both tileClaim and showsMetric; a face carries a claim or a numeral, never both",
  );
});

/*
 * A `wide` tile is one grid unit tall and `tileHeadline` is required on every
 * size, so a numeral there would have to share a 34px region with a headline
 * that is itself budgeted all of it -- 63.3px of copy at 320. The budget is
 * zero, and the same zero-budget branch that rejects a `wide` claim rejects
 * this, with the reason the size actually has.
 */
it("rejects a numeral on a tile with no room above its headline", () => {
  expect(() =>
    validateProjects([
      project({ tileSize: "wide", metric: "12", showsMetric: true }),
    ]),
  ).toThrow(
    "sets metric on a wide tile, which has no room for a numeral above its headline",
  );
});

/*
 * Draft-ness is encoded in the title and again in the caption, and the caption
 * is the half a reader meets on the Start screen. They have to agree in both
 * directions.
 */
it.each([
  [
    "a draft title without a draft caption",
    { title: "Draft example — Thing", tileLabel: "thing" },
  ],
  [
    "a draft caption without a draft title",
    { title: "Shipped thing", tileLabel: "thing · draft" },
  ],
])("rejects %s", (_case, override) => {
  expect(() => validateProjects([project(override)])).toThrow(
    /disagrees about being a draft: title ".*" and caption ".*"/,
  );
});

/*
 * The one approved public number, and the one project cleared to carry it. The
 * check reads every string in the project, however deeply nested, because the
 * place it would most plausibly leak into is a case-study section body.
 */
it.each([
  ["a face numeral", { showsMetric: true as const, metric: "₹1Cr+" }],
  // The scan is case-insensitive: a lowercased copy of the token is the same
  // published claim.
  ["a lowercased summary", { summary: "Contributed ₹1cr+ in revenue." }],
  ["a summary", { summary: "Contributed ₹1Cr+ in revenue." }],
  [
    "a section body",
    { sections: [{ heading: "Outcome", body: "Draft example: ₹1Cr+." }] },
  ],
])(
  "keeps the approved metric off every other project (%s)",
  (_where, override) => {
    expect(() => validateProjects([project(override)])).toThrow(
      "Project valid claims ₹1Cr+, which is approved for lead-platform only",
    );
  },
);
