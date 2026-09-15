import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailSurface } from "@/components/portfolio/DetailSurface";
import detail from "@/components/portfolio/detailSurface.module.css";
import { statusLabel } from "@/components/portfolio/postMeta";
import { getPost, getPostSummaries } from "@/lib/content/posts";
import styles from "../article.module.css";

type SlugProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getPostSummaries()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: SlugProps): Promise<Metadata> {
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

  return (
    <DetailSurface back={{ label: "Field notes", href: "/blog" }}>
      <header className={detail.header}>
        <p className={detail.marker}>{statusLabel(post.status)}</p>
        <h1 className={detail.title}>{post.title}</h1>
        <p className={detail.summary}>{post.summary}</p>
        <p className={detail.meta}>
          <time dateTime={post.date}>{post.date}</time>
          <span>{post.readingMinutes} min read</span>
        </p>
      </header>

      <article
        className={styles.prose}
        // HTML is generated from repository-owned Markdown with raw HTML disabled.
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </DetailSurface>
  );
}
