import type { PostStatus } from "@/lib/content/posts";

/**
 * How a note's status is written, in the one place that decides it.
 *
 * A reader meets the same note on the Blog pivot, on the index and on the
 * article page, and a draft that says "Draft example" on two of the three and
 * something else on the last is a draft a reader can miss. Both callers ask
 * here, so they cannot disagree.
 *
 * It lives beside the panels rather than in `lib/content/posts.ts` because the
 * Blog pivot is inside a client component: importing a *value* from that module
 * would pull `node:fs` and `gray-matter` into the browser bundle, where the
 * existing `import type` costs nothing because it is erased.
 */
export function statusLabel(status: PostStatus): string {
  return status === "draft-example" ? "Draft example" : "Published";
}
