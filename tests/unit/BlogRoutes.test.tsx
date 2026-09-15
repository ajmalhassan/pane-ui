import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import BlogPage from "@/app/(legacy)/blog/page";
import ArticlePage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/(legacy)/blog/[slug]/page";
import articleStyles from "@/app/(legacy)/blog/article.module.css";
import detailStyles from "@/components/portfolio/detailSurface.module.css";
import { getPost, getPostSummaries } from "@/lib/content/posts";

afterEach(cleanup);

const DRAFT = "ai-assessment-needs-a-narrower-job";
const PUBLISHED = "5-simple-javascript-performance-wins";

/*
 * Counts come from the content layer, not from this file. The index renders
 * one `<article>` per note and one status label per note, so publishing a
 * note is a change to `content/posts/` alone -- and the labels are still
 * counted per status, which is what keeps "every note says which kind it is"
 * an assertion rather than a total.
 */
it("renders the local field notes as an accessible article list", async () => {
  const posts = await getPostSummaries();
  const drafts = posts.filter(({ status }) => status === "draft-example");
  const published = posts.filter(({ status }) => status === "published");

  render(await BlogPage());

  expect(
    screen.getByRole("heading", { level: 1, name: "Field notes" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(posts.length);
  expect(drafts.length).toBeGreaterThan(0);
  expect(screen.getAllByText("Draft example")).toHaveLength(drafts.length);
  // The `published` branch of `statusLabel` reaches a reader here: the site
  // shipped for months with no post that could render it.
  expect(published.length).toBeGreaterThan(0);
  expect(screen.getAllByText("Published")).toHaveLength(published.length);
  expect(
    screen.getByRole("link", {
      name: /Why AI assessment needs a narrower job/,
    }),
  ).toHaveAttribute("href", "/blog/ai-assessment-needs-a-narrower-job");
});

it("lists every repository-owned note on the index", async () => {
  const posts = await getPostSummaries();
  render(await BlogPage());

  expect(posts.length).toBeGreaterThan(0);
  for (const post of posts) {
    expect(
      screen.getByRole("link", { name: new RegExp(post.title) }),
    ).toHaveAttribute("href", `/blog/${post.slug}`);
  }
});

it("provides static params and metadata for repository-owned posts", async () => {
  await expect(generateStaticParams()).resolves.toContainEqual({
    slug: "ai-assessment-needs-a-narrower-job",
  });
  await expect(
    generateMetadata({
      params: Promise.resolve({ slug: "ai-assessment-needs-a-narrower-job" }),
    }),
  ).resolves.toEqual(
    expect.objectContaining({
      title: "Why AI assessment needs a narrower job — Ajmal Hassan",
    }),
  );
});

it("renders an article with an unmistakable draft-example label", async () => {
  render(await ArticlePage({ params: Promise.resolve({ slug: DRAFT }) }));

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Why AI assessment needs a narrower job",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("Draft example")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", {
      level: 2,
      name: "The useful question is narrower",
    }),
  ).toBeInTheDocument();
});

/*
 * The other half of the same label, on the route that carries it. The article
 * that restored the `published` status is a 2024 dev.to piece, so it is also
 * the one note whose body uses tags the drafts never did -- a thematic break
 * and fenced code -- and `<hr>` and `<pre tabindex="0">` are asserted here
 * because a rule the stylesheet does not dress is a rule preflight strips.
 */
it("renders a published article with its status and Markdown furniture", async () => {
  const post = await getPost(PUBLISHED);
  render(await ArticlePage({ params: Promise.resolve({ slug: PUBLISHED }) }));

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "5 Simple JavaScript Performance Wins",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("Published")).toBeInTheDocument();
  expect(screen.queryByText("Draft example")).toBeNull();
  expect(post?.html).toContain("<hr>");
  expect(post?.html).toContain('<pre tabindex="0">');
});

/*
 * Both blog routes are pages of the application, not documents beside it: the
 * identity line opens each of them, one heading names each of them, and the way
 * back out of each is an application-bar command drawn with the `back` glyph
 * rather than a bordered web button.
 */
it("opens an article on the application identity line and one heading", async () => {
  render(await ArticlePage({ params: Promise.resolve({ slug: DRAFT }) }));

  expect(screen.getByText("AJMAL / PORTFOLIO")).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});

it("returns from an article to the note index through the app bar", async () => {
  const { container } = render(
    await ArticlePage({ params: Promise.resolve({ slug: DRAFT }) }),
  );

  const back = screen.getByRole("link", { name: "Field notes" });

  expect(back).toHaveAttribute("href", "/blog");
  expect(back.querySelector("svg")).toBeInTheDocument();
  expect(back.closest('nav[aria-label="Page actions"]')).not.toBeNull();
  expect(screen.queryByText(/^back to/i)).toBeNull();
  expect(container.querySelector('[class*="returnLink"]')).toBeNull();
});

it("opens the note index on the identity line and returns to its pivot", async () => {
  render(await BlogPage());

  expect(screen.getByText("AJMAL / PORTFOLIO")).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

  /*
   * The index belongs to the Blog pivot and says so. It used to say
   * "Portfolio", which is the résumé's way back to `/` -- one word for two
   * destinations, in two bars of the same application.
   */
  const back = screen.getByRole("link", { name: "Blog" });

  expect(back).toHaveAttribute("href", "/portfolio?view=blog");
  expect(back.querySelector("svg")).toBeInTheDocument();
  expect(back.closest('nav[aria-label="Page actions"]')).not.toBeNull();
  expect(screen.queryByText(/^back to/i)).toBeNull();
  expect(screen.queryByRole("link", { name: "Portfolio" })).toBeNull();
});

/*
 * Résumé and contact are the application's primary commands, so they are on
 * every surface that is not one of them: a reader who lands on a note from a
 * search result is one command away from the two things the portfolio is for,
 * not two navigations.
 */
it.each([
  ["the note index", async () => render(await BlogPage())],
  [
    "an article",
    async () =>
      render(await ArticlePage({ params: Promise.resolve({ slug: DRAFT }) })),
  ],
])("keeps résumé and contact primary on %s", async (_name, mount) => {
  await mount();

  const resume = screen.getByRole("link", { name: "Résumé" });
  const contact = screen.getByRole("link", { name: "Contact" });

  expect(resume).toHaveAttribute("href", "/resume");
  expect(contact).toHaveAttribute("href", "/portfolio#contact");
  for (const command of [resume, contact]) {
    expect(command.querySelector("svg")).toBeInTheDocument();
    expect(command.closest('nav[aria-label="Page actions"]')).not.toBeNull();
  }
});

/*
 * A note that links out gets the reading copy's own link treatment -- cyan and
 * underlined -- and gets it from the file that decides it for every surface.
 * The repository's notes carry no links yet, so nothing rendered would notice
 * if this stopped resolving: a mistyped `composes` source builds clean and
 * quietly drops the declarations it names.
 */
it("draws Markdown links from the shared reading-copy treatment", () => {
  expect(detailStyles.markdownLinks).toBeTruthy();
  expect(articleStyles.prose.split(" ")).toContain(detailStyles.markdownLinks);
});

it("returns the Next.js not-found result for an unknown article", async () => {
  await expect(
    ArticlePage({ params: Promise.resolve({ slug: "missing" }) }),
  ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
});
