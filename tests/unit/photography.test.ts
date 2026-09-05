import { expect, it } from "vitest";
import {
  photography,
  PHOTO_TILE_SIZE,
  PHOTOGRAPHY_UNITS,
  validatePhotography,
  type PhotoItem,
} from "@/lib/content/photography";
import { TILE_COPY_BUDGET } from "@/lib/content/tileBudget";

/**
 * A minimal valid frame of each kind. Every test below breaks exactly one thing
 * about one of them, so a failure names the rule that fired rather than the
 * fixture.
 */
function image(
  overrides: Partial<Extract<PhotoItem, { kind: "image" }>> = {},
): PhotoItem {
  return {
    id: "valid",
    kind: "image",
    title: "Valid title",
    note: "A valid note.",
    src: "/portrait.jpg",
    alt: "A described photograph, written for this hub.",
    width: 752,
    height: 648,
    focus: "center",
    ...overrides,
  };
}

function pending(
  overrides: Partial<Extract<PhotoItem, { kind: "pending" }>> = {},
): PhotoItem {
  return {
    id: "valid-pending",
    kind: "pending",
    title: "streets / transit",
    note: "Selection in progress",
    ...overrides,
  };
}

it("accepts the shipped collection and returns it unchanged", () => {
  expect(validatePhotography(photography)).toEqual([...photography]);
  expect(photography.length).toBeGreaterThan(0);
});

it("rejects duplicate ids", () => {
  expect(() =>
    validatePhotography([image({ id: "same" }), pending({ id: "same" })]),
  ).toThrow("Duplicate photo id: same");
});

it.each([
  ["id", image({ id: " " })],
  ["title", image({ title: "" })],
  ["note", image({ note: "  " })],
  ["title", pending({ title: "" })],
  ["note", pending({ note: " " })],
])("rejects an empty %s", (field, item) => {
  expect(() => validatePhotography([item])).toThrow(
    `Photo ${field} is required`,
  );
});

/*
 * The union stops a `pending` entry from carrying an `alt` it has not been
 * given. It cannot stop an approved photograph from carrying an empty one, and
 * an `<img alt="">` on a picture tile is a tile with no description at all --
 * it renders in silence, which is exactly the state this file exists for.
 */
it("rejects an approved photograph with no alt", () => {
  expect(() => validatePhotography([image({ alt: "" })])).toThrow(
    "Photo valid has no alt; an image's alt is the only description of a picture tile there is",
  );
});

it("rejects a src that is not rooted at the public directory", () => {
  expect(() => validatePhotography([image({ src: "portrait.jpg" })])).toThrow(
    "Photo valid src must be rooted at the public directory: portrait.jpg",
  );

  expect(() => validatePhotography([image({ src: "" })])).toThrow(
    "src must be rooted at the public directory: (empty)",
  );
});

/*
 * `width`/`height` are what `next/image` reserves the box with, so a zero pair
 * is a layout shift waiting for the image to arrive -- and it type-checks.
 */
it.each([
  ["width", { width: 0 }],
  ["height", { height: -1 }],
])("rejects a non-positive %s", (field, override) => {
  expect(() => validatePhotography([image(override)])).toThrow(
    new RegExp(
      `Photo valid ${field} must be a positive number of source pixels; got -?\\d+`,
    ),
  );
});

/*
 * The caption is the tile `label` on both spans, and the note is the body on a
 * `large` picture tile and the headline on a `wide` plate. Each of these is one
 * character over the budget of the face it lands on.
 */
it.each([
  [
    "title",
    "large",
    image({ title: "x".repeat(TILE_COPY_BUDGET.large.label + 1) }),
    TILE_COPY_BUDGET.large.label,
  ],
  [
    "note",
    "large",
    image({ note: "x".repeat(TILE_COPY_BUDGET.large.claim + 1) }),
    TILE_COPY_BUDGET.large.claim,
  ],
  [
    "title",
    "wide",
    pending({ title: "x".repeat(TILE_COPY_BUDGET.wide.label + 1) }),
    TILE_COPY_BUDGET.wide.label,
  ],
  [
    "note",
    "wide",
    pending({ note: "x".repeat(TILE_COPY_BUDGET.wide.headline + 1) }),
    TILE_COPY_BUDGET.wide.headline,
  ],
])("rejects a %s over the %s budget", (field, size, item, allowed) => {
  expect(() => validatePhotography([item])).toThrow(
    `${field} is ${allowed + 1} characters; a ${size} tile holds ${allowed}`,
  );
});

/*
 * The shipped caption `streets / in transit` is 20 of 21, which is the slack
 * this tripwire exists to hold: one more character and the tile ellipsises it,
 * and a caption behind an ellipsis is not a caption.
 */
it("holds the shipped captions inside the caption budget", () => {
  for (const item of photography) {
    expect(item.title.length, item.id).toBeLessThanOrEqual(
      TILE_COPY_BUDGET[PHOTO_TILE_SIZE[item.kind]].label,
    );
  }
});

/*
 * The unit total the picture hub packs to, summed from the collection rather
 * than written down beside it. `tests/e2e/portfolio.spec.ts` asserts the
 * rendered grid against this number.
 */
it("sums the grid units the collection spends", () => {
  expect(PHOTOGRAPHY_UNITS).toBe(8); // 4 (large) + 2 + 2 (wide)
  expect(PHOTOGRAPHY_UNITS % 4).toBe(0); // hole-free at four columns, and eight
});
