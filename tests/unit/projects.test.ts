import { expect, it } from "vitest";
import { getProject, validateProjects } from "@/lib/content/projects";

it("rejects duplicate slugs", () => {
  const duplicate = {
    slug: "same",
    title: "One",
    summary: "Summary",
    status: "concept" as const,
    accent: "ink" as const,
    sections: [],
  };

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
])("rejects an empty %s", (field, override) => {
  const project = {
    slug: "valid",
    title: "Valid title",
    summary: "Valid summary",
    status: "concept" as const,
    accent: "ink" as const,
    sections: [],
    ...override,
  };

  expect(() => validateProjects([project])).toThrow(
    `Project ${field} is required`,
  );
});
