import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

export type PostStatus = "draft-example" | "published";

export type PostSummary = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  status: PostStatus;
  readingMinutes: number;
};

export type Post = PostSummary & {
  html: string;
};

type PostMeta = Pick<PostSummary, "title" | "summary" | "date" | "status">;

const postsDirectory = path.join(process.cwd(), "content/posts");
const metadataKeys = ["date", "status", "summary", "title"];

function invalidMetadata(filename: string): never {
  throw new Error(`Invalid post metadata: ${filename}`);
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function validatePostMeta(filename: string, data: unknown): PostMeta {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    invalidMetadata(filename);
  }

  const record = data as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  if (
    keys.length !== metadataKeys.length ||
    keys.some((key, index) => key !== metadataKeys[index])
  ) {
    invalidMetadata(filename);
  }

  const { title, summary, date, status } = record;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof summary !== "string" ||
    !summary.trim() ||
    typeof date !== "string" ||
    !isIsoDate(date) ||
    (status !== "draft-example" && status !== "published")
  ) {
    invalidMetadata(filename);
  }

  return {
    title: title.trim(),
    summary: summary.trim(),
    date,
    status,
  };
}

export function estimateReadingMinutes(markdown: string): number {
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(wordCount / 220));
}

export async function renderPostMarkdown(markdown: string): Promise<string> {
  const rendered = await remark().use(remarkHtml).process(markdown);
  const html = rendered.toString();

  /*
   * `.prose pre { overflow-x: auto }` makes a scrollable region, and a
   * scrollable region with no focusable inside it is unreachable by keyboard
   * (axe `scrollable-region-focusable`). CSS cannot add `tabindex`, so it is
   * added here, on the string this function already returns -- and it has to
   * happen after `remark-html` has run, not as a `rehype` step before it:
   * `remark-html` sanitizes through `hast-util-sanitize` by default, whose
   * schema does not allow `tabindex`, so an attribute added earlier in the
   * pipeline would be stripped before this function ever saw it. The
   * negative lookahead makes the replacement idempotent against a `<pre>`
   * that already carries one.
   */
  return html.replace(/<pre(?![^>]*\btabindex=)/g, '<pre tabindex="0"');
}

async function postFilenames(): Promise<string[]> {
  return (await readdir(postsDirectory)).filter((filename) =>
    filename.endsWith(".md"),
  );
}

async function readPost(filename: string): Promise<Post> {
  const source = await readFile(path.join(postsDirectory, filename), "utf8");
  let parsed: matter.GrayMatterFile<string>;

  try {
    parsed = matter(source);
  } catch {
    invalidMetadata(filename);
  }

  const metadata = validatePostMeta(filename, parsed.data);
  const html = await renderPostMarkdown(parsed.content);

  return {
    slug: filename.replace(/\.md$/, ""),
    ...metadata,
    readingMinutes: estimateReadingMinutes(parsed.content),
    html,
  };
}

export async function getPostSummaries(): Promise<PostSummary[]> {
  const posts = await Promise.all((await postFilenames()).map(readPost));

  return posts
    .map(({ html: _html, ...summary }) => summary)
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) ||
        left.slug.localeCompare(right.slug),
    );
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const filename = (await postFilenames()).find(
    (candidate) => candidate.replace(/\.md$/, "") === slug,
  );

  return filename ? readPost(filename) : undefined;
}
