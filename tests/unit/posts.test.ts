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

/*
 * The boundary itself, not a number near it. 220 words is one minute because
 * the estimate is `ceil(words / 220)`, and the first word past it is what buys
 * the second minute -- an off-by-one in either direction is caught here and
 * nowhere else.
 */
it("starts a second reading minute only after the 220-word boundary", () => {
  expect(estimateReadingMinutes("word ".repeat(219))).toBe(1);
  expect(estimateReadingMinutes("word ".repeat(220))).toBe(1);
  expect(estimateReadingMinutes("word ".repeat(221))).toBe(2);
  expect(estimateReadingMinutes("word ".repeat(440))).toBe(2);
  expect(estimateReadingMinutes("word ".repeat(441))).toBe(3);
  expect(estimateReadingMinutes("   ")).toBe(1);
});

it("does not pass dangerous raw HTML through Markdown rendering", async () => {
  const html = await renderPostMarkdown(
    [
      "Safe copy.",
      "<script>window.exposed = true</script>",
      '<img src="x" onerror="window.exposed = true">',
      'Inline <b onclick="window.exposed = true">markup</b> too.',
    ].join("\n\n"),
  );

  expect(html).toContain("<p>Safe copy.</p>");
  expect(html).not.toContain("<script");
  expect(html).not.toContain("onerror");
  expect(html).not.toContain("onclick");
  expect(html).not.toContain("window.exposed");
  // The raw markup is dropped; the words inside it are not.
  expect(html).toContain("markup");
});

/*
 * `remark-html` sanitizes by default -- it runs `hast-util-sanitize` unless a
 * caller opts out with `sanitize: false` -- and `renderPostMarkdown` never
 * passes that option. These cases pin the behaviour the shipped call actually
 * gets rather than the behaviour the dependency documents, so an upgrade that
 * flips the default, or an option added upstream in `renderPostMarkdown`, fails
 * here instead of in production.
 *
 * Measured against remark-html 16: a `javascript:` or `data:` href is dropped
 * and the anchor is left with none, while `https:`, `mailto:` and same-origin
 * relative hrefs survive untouched. No explicit schema is configured, because
 * none is needed to get that result.
 */
it("strips unsafe link protocols and keeps the safe ones", async () => {
  const html = await renderPostMarkdown(
    [
      "[script link](javascript:alert(1))",
      "[data link](data:text/html,alert(1))",
      "[safe link](https://example.com/notes)",
      "[local link](/blog/a-note)",
      "[mail link](mailto:someone@example.com)",
      "![poisoned image](javascript:alert(2))",
    ].join("\n\n"),
  );

  expect(html).not.toMatch(/javascript:/i);
  expect(html).not.toMatch(/data:/i);
  expect(html).toContain('<a href="https://example.com/notes">safe link</a>');
  expect(html).toContain('<a href="/blog/a-note">local link</a>');
  expect(html).toContain('<a href="mailto:someone@example.com">mail link</a>');
  // The unsafe destinations lose the href and keep the text: nothing to click,
  // nothing silently deleted from the page either.
  expect(html).toContain("<a>script link</a>");
  expect(html).toContain("<a>data link</a>");
  expect(html).toContain('<img alt="poisoned image">');
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
