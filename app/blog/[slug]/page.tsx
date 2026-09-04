import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPostSummaries } from "@/lib/content/posts";

type SlugProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getPostSummaries()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: SlugProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} — Ajmal Hassan`,
    description: post.summary,
  };
}

export default async function ArticlePage({ params }: SlugProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const statusLabel =
    post.status === "draft-example" ? "Draft example" : "Published";

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-8 sm:py-16">
      <header className="border-b border-[var(--metro-line)] pb-10 sm:pb-14">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.15em] text-[var(--metro-cyan)]">
          Lumia / field notes
        </p>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--metro-cyan)]">
          {statusLabel}
        </p>
        <h1 className="mt-3 max-w-[15ch] text-4xl font-light leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl">
          {post.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--metro-muted)]">
          {post.summary}
        </p>
        <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--metro-muted)]">
          <time dateTime={post.date}>{post.date}</time>
          <span>{post.readingMinutes} min read</span>
        </p>
      </header>

      <article
        className="py-7 leading-8 text-[var(--metro-muted)] [&_a]:text-[var(--metro-cyan)] [&_a]:underline [&_a]:underline-offset-4 [&_em]:text-[var(--metro-text)] [&_h2]:mb-0 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-normal [&_h2]:tracking-[-0.035em] [&_p]:mb-0 [&_p]:mt-4 [&_strong]:text-[var(--metro-text)]"
        // HTML is generated from repository-owned Markdown with raw HTML disabled.
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      <Link
        className="mt-5 inline-flex min-h-11 items-center border border-[var(--metro-line)] px-4 font-bold no-underline hover:border-[var(--metro-cyan)] hover:text-[var(--metro-cyan)] focus-visible:border-[var(--metro-cyan)] focus-visible:text-[var(--metro-cyan)] focus-visible:outline-none"
        href="/blog"
      >
        Back to field notes
      </Link>
    </main>
  );
}
