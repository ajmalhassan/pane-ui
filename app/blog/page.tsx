import type { Metadata } from "next";
import Link from "next/link";
import { statusLabel } from "@/components/portfolio/postMeta";
import { getPostSummaries } from "@/lib/content/posts";

export const metadata: Metadata = {
  title: "Field notes — Ajmal Hassan",
  description:
    "Draft field notes on AI product boundaries and connected learning systems.",
};

export default async function BlogPage() {
  const posts = await getPostSummaries();

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
      <header className="max-w-3xl border-b border-[var(--metro-line)] pb-10">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.15em] text-[var(--metro-cyan)]">
          Lumia / portfolio
        </p>
        <h1 className="mt-3 text-5xl font-light tracking-[-0.06em] text-balance sm:text-7xl">
          Field notes
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--metro-muted)]">
          Working notes on grounded AI assessment and the connective systems
          behind learning. Sample drafts are labeled explicitly.
        </p>
      </header>

      <ol className="m-0 list-none divide-y divide-[var(--metro-line)] p-0">
        {posts.map((post) => (
          <li key={post.slug}>
            <article className="grid gap-4 py-8 sm:grid-cols-[10rem_1fr] sm:py-10">
              <div className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--metro-muted)]">
                <time dateTime={post.date}>{post.date}</time>
                <span className="text-[var(--metro-cyan)]">
                  {statusLabel(post.status)}
                </span>
                <span>{post.readingMinutes} min read</span>
              </div>
              <div>
                <h2 className="m-0 text-2xl font-normal tracking-[-0.035em] sm:text-3xl">
                  <Link
                    className="decoration-[var(--metro-cyan)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                    href={`/blog/${post.slug}`}
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mb-0 mt-3 max-w-2xl leading-7 text-[var(--metro-muted)]">
                  {post.summary}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ol>

      <Link
        className="mt-8 inline-flex min-h-11 items-center border border-[var(--metro-line)] px-4 font-bold no-underline hover:border-[var(--metro-cyan)] hover:text-[var(--metro-cyan)] focus-visible:border-[var(--metro-cyan)] focus-visible:text-[var(--metro-cyan)] focus-visible:outline-none"
        href="/?view=blog"
      >
        Back to portfolio
      </Link>
    </main>
  );
}
