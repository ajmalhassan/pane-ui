import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import BlogPage from "@/app/blog/page";
import ArticlePage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/blog/[slug]/page";

afterEach(cleanup);

it("renders the local field notes as an accessible article list", async () => {
  render(await BlogPage());

  expect(
    screen.getByRole("heading", { level: 1, name: "Field notes" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getAllByText("Draft example")).toHaveLength(2);
  expect(
    screen.getByRole("link", {
      name: /Why AI assessment needs a narrower job/,
    }),
  ).toHaveAttribute("href", "/blog/ai-assessment-needs-a-narrower-job");
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
  render(
    await ArticlePage({
      params: Promise.resolve({ slug: "ai-assessment-needs-a-narrower-job" }),
    }),
  );

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

it("returns the Next.js not-found result for an unknown article", async () => {
  await expect(
    ArticlePage({ params: Promise.resolve({ slug: "missing" }) }),
  ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
});
