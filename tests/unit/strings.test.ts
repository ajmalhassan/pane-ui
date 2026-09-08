import { expect, it } from "vitest";
import { everyString } from "@/lib/content/strings";

/*
 * The walker three guards used to keep three copies of. What it is for is
 * covered where it is used -- the approved-metric tripwire in
 * `tests/unit/ProjectContent.test.ts`, the forbidden-fact rules in
 * `ProfileContent.test.ts`, the no-invented-copy set in `ResumePage.test.tsx`.
 * What is pinned here is the shape of the walk itself, because those three now
 * share one and a change to it moves all of them at once.
 */

it("reaches a string however deeply it is nested", () => {
  const content = {
    title: "lead platform",
    sections: [{ body: "CRM integration" }, { body: "URL shortening" }],
    tile: { label: { text: "lead platform · shipped" } },
  };

  expect(everyString(content)).toEqual([
    "lead platform",
    "CRM integration",
    "URL shortening",
    "lead platform · shipped",
  ]);
});

/*
 * The case the shipped tripwire had lost. `lib/content/projects.ts` walked
 * strings only, so a fact authored as a number was outside the one guard that
 * enforces where the approved metric may appear.
 */
it("stringifies number and boolean leaves rather than dropping them", () => {
  expect(everyString({ engineers: 5, showsMetric: true })).toEqual([
    "5",
    "true",
  ]);
});

it("walks past the leaves that carry nothing", () => {
  expect(everyString({ metric: undefined, claim: null, tags: [] })).toEqual([]);
});

it("takes a bare value as well as a container", () => {
  expect(everyString("₹1Cr+")).toEqual(["₹1Cr+"]);
  expect(everyString(undefined)).toEqual([]);
});
