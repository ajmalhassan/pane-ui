import Link from "next/link";
import type { PostSummary } from "@/lib/content/posts";
import styles from "./PortfolioPanorama.module.css";

type Props = {
  posts: readonly PostSummary[];
};

export function BlogPanel({ posts }: Props) {
  return (
    <div className={styles.panelContent}>
      <header className={styles.panelIntro}>
        <p className={styles.eyebrow}>Field notes / firsthand lessons</p>
        <h2>Blog</h2>
        <p>
          Notes on AI product boundaries, full-stack systems, frontend craft,
          and engineering environments that help teams ship.
        </p>
      </header>
      {posts.length ? (
        <ol className={styles.articleList}>
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`}>
                <time dateTime={post.date}>{post.date}</time>
                <strong>{post.title}</strong>
                <span>{post.summary}</span>
                <small className={styles.articleMeta}>
                  <span>
                    {post.status === "draft-example"
                      ? "Draft example"
                      : "Published"}
                  </span>
                  <span>{post.readingMinutes} min read</span>
                </small>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.emptyState}>
          First field notes are being prepared.
        </p>
      )}
      <Link className={styles.textLink} href="/blog">
        Browse the blog
      </Link>
    </div>
  );
}
