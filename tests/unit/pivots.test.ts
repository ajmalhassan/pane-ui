import { describe, expect, it } from "vitest";
import { parsePivot, pivotHref } from "@/lib/content/pivots";

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
