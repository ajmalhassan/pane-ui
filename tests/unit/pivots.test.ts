import { describe, expect, it } from "vitest";
import {
  PIVOT_IDS,
  parsePivot,
  pivotHref,
  pivotIndex,
} from "@/lib/content/pivots";

describe("parsePivot", () => {
  it.each([undefined, "", "unknown", ["blog", "projects"]])(
    "falls back to me for %j",
    (value) => expect(parsePivot(value)).toBe("me"),
  );

  it.each(["me", "projects", "blog", "photography"] as const)(
    "accepts %s",
    (value) => expect(parsePivot(value)).toBe(value),
  );
});

it("creates canonical pivot URLs", () => {
  expect(pivotHref("me")).toBe("/?view=me");
  expect(pivotHref("projects")).toBe("/?view=projects");
});

/*
 * The plane's travel, and the ground's, are the same number read from the same
 * order -- the panorama sets it on its own root and the shell sets it again on
 * `<main>`, because a custom property only travels downwards.
 */
describe("pivotIndex", () => {
  it("numbers the pivots in the order the panorama lays them out", () => {
    expect(PIVOT_IDS.map(pivotIndex)).toEqual([0, 1, 2, 3]);
  });

  it("gives the leading pivot zero", () => {
    expect(pivotIndex("me")).toBe(0);
  });
});
