import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { BlogPanel } from "@/components/portfolio/BlogPanel";
import type { PostSummary } from "@/lib/content/posts";

it("labels sample posts as draft examples and shows their reading time", () => {
  const post: PostSummary = {
    slug: "sample-note",
    title: "Sample note",
    summary: "A clearly identified sample.",
    date: "2026-08-31",
    status: "draft-example",
    readingMinutes: 3,
  };

  render(<BlogPanel posts={[post]} />);

  expect(screen.getByText("Draft example")).toBeInTheDocument();
  expect(screen.getByText("3 min read")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Sample note/ })).toHaveAttribute(
    "href",
    "/blog/sample-note",
  );
});
