import type { Metadata } from "next";
import Link from "next/link";
import { DetailSurface } from "@/components/portfolio/DetailSurface";
import detail from "@/components/portfolio/detailSurface.module.css";
import { statusLabel } from "@/components/portfolio/postMeta";
import { getPostSummaries } from "@/lib/content/posts";
import styles from "./article.module.css";

export const metadata: Metadata = {
  title: "Field notes — Ajmal Hassan",
  description:
    "Draft field notes on AI product boundaries and connected learning systems.",
};

export default async function BlogPage() {
  const posts = await getPostSummaries();

  return (
    <DetailSurface
      // The hub this index belongs to is the Blog pivot, so that is what the
      // way back is called. "Portfolio" is the résumé's way back, to `/`, and
      // one word cannot name two destinations across the application's bars.
      back={{ label: "Blog", href: "/portfolio?view=blog" }}
    >
      <header className={detail.header}>
        <h1 className={detail.title}>Field notes</h1>
        <p className={detail.summary}>
          Working notes on grounded AI assessment and the connective systems
          behind learning. Sample drafts are labeled explicitly.
        </p>
      </header>

      <ol className={styles.noteList}>
        {posts.map((post) => (
          <li key={post.slug}>
            <article className={styles.noteRow}>
              <p className={styles.noteMeta}>
                <time dateTime={post.date}>{post.date}</time>
                <span>{statusLabel(post.status)}</span>
                <span>{post.readingMinutes} min read</span>
              </p>
              <h2 className={styles.noteTitle}>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className={styles.noteSummary}>{post.summary}</p>
            </article>
          </li>
        ))}
      </ol>
    </DetailSurface>
  );
}
