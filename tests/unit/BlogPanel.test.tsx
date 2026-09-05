import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { BlogPanel } from "@/components/portfolio/BlogPanel";
import { statusLabel } from "@/components/portfolio/postMeta";
import type { PostStatus, PostSummary } from "@/lib/content/posts";

afterEach(cleanup);

/*
 * Three notes, newest first, exactly as `getPostSummaries` sorts them. Two
 * statuses, taken from the content layer's own union rather than from a
 * duplicate of it here: a fourth status added there fails to compile in this
 * file instead of quietly going untested.
 */
const STATUSES: readonly PostStatus[] = ["draft-example", "published"];

const NEWEST: PostSummary = {
  slug: "narrower-job",
  title: "Why AI assessment needs a narrower job",
  summary:
    "A field note on grounding, gap interviews, and learning from an over-broad assessment experiment.",
  date: "2026-08-31",
  status: STATUSES[0],
  readingMinutes: 2,
};

const SECOND: PostSummary = {
  slug: "capability-graphs",
  title: "Capability graphs as learning infrastructure",
  summary:
    "A draft field note on connecting curriculum, evidence, learning materials, assessment, and placement.",
  date: "2026-08-24",
  status: STATUSES[0],
  readingMinutes: 3,
};

const THIRD: PostSummary = {
  slug: "shipped-note",
  title: "A finished note about shipping",
  summary: "The one note in this fixture that is not a draft example.",
  date: "2026-08-01",
  status: STATUSES[1],
  readingMinutes: 5,
};

const POSTS = [NEWEST, SECOND, THIRD] as const;

function featureTile(): HTMLElement {
  const tiles = document.querySelectorAll<HTMLElement>("[data-tile-role]");
  expect(tiles).toHaveLength(1);
  return tiles[0];
}

function rows(): HTMLAnchorElement[] {
  return [...document.querySelectorAll<HTMLAnchorElement>("ol li > a")];
}

/*
 * The accessible name of a link with no `aria-label` is its flattened text, so
 * this is that name -- and the panel deliberately gives no link an ARIA label,
 * because a tile whose name is not the copy on its face is a tile whose face
 * and announcement can drift.
 */
function accessibleName(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

it("leads with the newest note as the one navigation tile", () => {
  render(<BlogPanel posts={POSTS} />);

  const tile = featureTile();
  expect(tile).toHaveAttribute("data-tile-role", "navigation");
  expect(tile).toHaveAttribute("data-tile-size", "hero");
  expect(tile).toHaveAttribute("href", `/blog/${NEWEST.slug}`);
  expect(within(tile).getByText(NEWEST.title)).toBeVisible();
  expect(within(tile).getByText(NEWEST.summary)).toBeVisible();

  // Date, reading time and draft status ride the tile's caption: they are the
  // note's own facts, and the newest note appears nowhere else on the pivot.
  // The status leads this line and no other on the site: a caption is one
  // clipped line, so whatever is first is what cannot be lost. The rows below
  // have room for all three and lead with the date, like `/blog` -- pinned in
  // the next test, because an unpinned order is how the two swap silently.
  const caption = tile.lastElementChild as HTMLElement;
  expect(caption.textContent).toBe("Draft example · 2026-08-31 · 2 min read");
});

it("gives the remaining notes one full-row link each", () => {
  render(<BlogPanel posts={POSTS} />);

  const list = rows();
  expect(list.map((row) => row.getAttribute("href"))).toEqual([
    `/blog/${SECOND.slug}`,
    `/blog/${THIRD.slug}`,
  ]);

  for (const [index, post] of [SECOND, THIRD].entries()) {
    const row = list[index];
    const where = post.slug;

    // One interactive owner: the row IS the link, and holds no second control.
    expect(row.querySelectorAll("a"), where).toHaveLength(0);
    expect(row.querySelector("button"), where).toBeNull();

    /*
     * The row's own order: date, then status, then reading time. It is the
     * order `/blog`'s index uses, and the one the hero's caption deliberately
     * does not -- so it is asserted rather than assumed.
     */
    const meta = row.firstElementChild as HTMLElement;
    expect(
      [...meta.children].map((part) => part.textContent),
      where,
    ).toEqual([
      post.date,
      statusLabel(post.status),
      `${post.readingMinutes} min read`,
    ]);

    expect(within(row).getByText(post.title), where).toBeVisible();
    expect(within(row).getByText(post.summary), where).toBeVisible();
    expect(
      within(row).getByText(`${post.readingMinutes} min read`),
      where,
    ).toBeVisible();
    const date = within(row).getByText(post.date);
    expect(date.tagName, where).toBe("TIME");
    expect(date, where).toHaveAttribute("datetime", post.date);
  }

  expect(within(list[0]).getByText("Draft example")).toBeVisible();
  expect(within(list[1]).getByText("Published")).toBeVisible();
});

it("shows the newest note once, on the tile and not again in the list", () => {
  render(<BlogPanel posts={POSTS} />);

  expect(screen.getAllByText(NEWEST.title)).toHaveLength(1);
  expect(
    screen.getAllByRole("link", { name: new RegExp(NEWEST.title, "i") }),
  ).toHaveLength(1);
});

it("gives every destination on the hub its own accessible name", () => {
  render(<BlogPanel posts={POSTS} />);

  const names = screen.getAllByRole("link").map(accessibleName);

  expect(names).toHaveLength(POSTS.length + 1); // the notes, and the index link
  expect(new Set(names).size).toBe(names.length);
  expect(names.every((name) => name.length > 0)).toBe(true);
});

it("keeps a real link to the note index and no button anywhere", () => {
  const { container } = render(<BlogPanel posts={POSTS} />);

  expect(screen.getByRole("link", { name: "Browse the blog" })).toHaveAttribute(
    "href",
    "/blog",
  );
  expect(container.querySelector("button")).toBeNull();
  // Nothing on the reading pivot cycles: a live tile is the only thing here
  // that would move on its own, and there is none.
  expect(container.querySelector("[data-live-index]")).toBeNull();
});

it("repeats no heading of its own over the panorama's", () => {
  render(<BlogPanel posts={POSTS} />);

  expect(screen.queryByRole("heading", { name: /blog/i })).toBeNull();
  expect(screen.queryAllByRole("heading")).toEqual([]);
});

/*
 * One note is not no notes. The tile above the empty state carries the first
 * field note, so telling a reader who can see it that the first one is coming
 * is telling them something they can see is untrue.
 */
it("keeps the empty state when the feature tile is the only note", () => {
  render(<BlogPanel posts={[NEWEST]} />);

  expect(featureTile()).toHaveAttribute("href", `/blog/${NEWEST.slug}`);
  expect(rows()).toHaveLength(0);
  expect(
    screen.getByText("More field notes are being prepared."),
  ).toBeVisible();
});

it("falls back to the empty state with no notes at all", () => {
  const { container } = render(<BlogPanel posts={[]} />);

  expect(container.querySelector("[data-tile-role]")).toBeNull();
  expect(rows()).toHaveLength(0);
  expect(
    screen.getByText("First field notes are being prepared."),
  ).toBeVisible();
  expect(screen.getByRole("link", { name: "Browse the blog" })).toBeVisible();
});
