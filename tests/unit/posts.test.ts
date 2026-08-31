import { expect, it } from "vitest";
import {
  estimateReadingMinutes,
  getPost,
  getPostSummaries,
  renderPostMarkdown,
  validatePostMeta,
} from "@/lib/content/posts";

it("returns draft-example posts newest first with required metadata", async () => {
  const posts = await getPostSummaries();

  expect(posts.length).toBeGreaterThanOrEqual(2);
  expect(posts[0]).toEqual(
    expect.objectContaining({
      slug: expect.any(String),
      title: expect.any(String),
      summary: expect.any(String),
      date: expect.any(String),
      status: "draft-example",
      readingMinutes: expect.any(Number),
    }),
  );
  expect(posts.every(({ readingMinutes }) => readingMinutes >= 1)).toBe(true);
  expect(new Date(posts[0].date).getTime()).toBeGreaterThanOrEqual(
    new Date(posts[1].date).getTime(),
  );
});

it("renders Markdown to HTML and returns undefined for unknown posts", async () => {
  expect((await getPost("ai-assessment-needs-a-narrower-job"))?.html).toContain(
    "<p>",
  );
  expect(await getPost("missing")).toBeUndefined();
});

it("starts a second reading minute only after the 220-word boundary", () => {
  expect(estimateReadingMinutes("word ".repeat(220))).toBe(1);
  expect(estimateReadingMinutes("word ".repeat(221))).toBe(2);
});

it("does not pass dangerous raw HTML through Markdown rendering", async () => {
  const html = await renderPostMarkdown(
    "Safe copy.\n\n<script>window.exposed = true</script>",
  );

  expect(html).toContain("<p>Safe copy.</p>");
  expect(html).not.toContain("<script");
  expect(html).not.toContain("window.exposed");
});

it("accepts only the exact post metadata schema", () => {
  expect(
    validatePostMeta("valid.md", {
      title: "A field note",
      summary: "A precise summary.",
      date: "2026-08-31",
      status: "draft-example",
    }),
  ).toEqual({
    title: "A field note",
    summary: "A precise summary.",
    date: "2026-08-31",
    status: "draft-example",
  });

  for (const data of [
    { title: "Missing fields" },
    {
      title: "Wrong status",
      summary: "Summary",
      date: "2026-08-31",
      status: "draft",
    },
    {
      title: "Impossible date",
      summary: "Summary",
      date: "2026-02-30",
      status: "published",
    },
    {
      title: "Unexpected metadata",
      summary: "Summary",
      date: "2026-08-31",
      status: "published",
      author: "Not in the schema",
    },
  ]) {
    expect(() => validatePostMeta("broken.md", data)).toThrow(
      "Invalid post metadata: broken.md",
    );
  }
});
