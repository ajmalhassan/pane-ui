import Link from "next/link";
import { MetroTile, TileGrid, tileTextClass } from "@/components/metro";
import type { PostSummary } from "@/lib/content/posts";
import { statusLabel } from "./postMeta";
import styles from "./PortfolioPanorama.module.css";

type Props = {
  posts: readonly PostSummary[];
};

/**
 * The newest note's own facts, in the tile's caption.
 *
 * The face has room for the title and the summary and nothing more -- a 4x2
 * hero on a 320px frame is 288x141 and its copy region is 99.56px, which two
 * title lines and three summary lines spend down to 2.7px. The caption is a
 * second line the tile already owns: one clipped line, 264px wide at that
 * frame, and this string draws 214.3px of it. So the date, the reading time
 * and the draft marker are painted at every width rather than dropped at the
 * one that matters most.
 *
 * The status leads *here*, and only here. A caption is one line that is clipped
 * rather than wrapped, so whatever ends up first is the part that cannot be
 * lost -- and this note is on the pivot exactly once, as a whole rectangle a
 * reader can click before reading anything else, so "draft example" is the fact
 * that has to survive the clip. The list rows below and `/blog` lead with the
 * date instead: they have room for all three facts on their own line, and a
 * date-first meta line is what a reading list is read down.
 */
function noteCaption(post: PostSummary): string {
  return `${statusLabel(post.status)} · ${post.date} · ${post.readingMinutes} min read`;
}

/**
 * Blog as a typographic hub rather than a wall of tiles.
 *
 * One tile, because one is what a Start screen uses a tile for: the newest note
 * gets the whole rectangle as its destination and carries its own title,
 * summary and status. Everything after it is a Windows Phone list -- a
 * generous row pitch, a hairline between rows, a light primary line over a
 * muted secondary one -- because a list is what prose wants and a tile is not.
 *
 * Nothing here moves. Me owns the Start screen's one live cycle; a reading
 * list that re-shuffled itself under a reader mid-sentence would be the
 * opposite of what this pivot is for.
 */
export function BlogPanel({ posts }: Props) {
  const [latest, ...rest] = posts;

  return (
    <div className={styles.panelContent}>
      <p className={styles.hubLede}>
        Notes on AI product boundaries, full-stack systems, frontend craft, and
        engineering environments that help teams ship.
      </p>

      {/* Outside the reading measure below, deliberately: the tile system is
          one system across the whole panorama, so this hero is laid out on the
          same plane -- and therefore at the same grid unit -- as every tile on
          Me and Projects. Capping the grid instead of the prose drew it at
          121px against their 158.6px at 1440. */}
      {latest ? (
        <TileGrid>
          <MetroTile
            accent="blue"
            className={styles.featureTile}
            href={`/blog/${latest.slug}`}
            label={noteCaption(latest)}
            role="navigation"
            size="hero"
          >
            <strong className={tileTextClass.title}>{latest.title}</strong>{" "}
            {/* `tileTextClass.body` with one number overridden: this summary is
                budgeted for three lines at every width, not two below 48rem,
                because the shipped summaries need three of them on a 320px
                frame. The tile is told the same thing through
                `--tile-body-lead` on `.featureTile`, so the derived step and
                the painted line count agree. */}
            <span className={`${tileTextClass.body} ${styles.featureSummary}`}>
              {latest.summary}
            </span>
          </MetroTile>
        </TileGrid>
      ) : null}

      <div className={styles.readingHub}>
        {rest.length ? (
          <ol className={styles.noteList}>
            {rest.map((post) => (
              <li key={post.slug}>
                {/* The row is the link -- one interactive owner spanning the
                    whole content width, so there is no "read more" target to
                    miss beside a headline that is not one. */}
                <Link className={styles.noteRow} href={`/blog/${post.slug}`}>
                  {/* Date first, then status, then reading time -- the order
                      `/blog` uses, on a line with room for all three. The
                      hero's caption is the one surface that leads with the
                      status, and only because it is a single clipped line. */}
                  <span className={styles.noteMeta}>
                    <time dateTime={post.date}>{post.date}</time>
                    <span>{statusLabel(post.status)}</span>
                    <span>{post.readingMinutes} min read</span>
                  </span>
                  <span className={styles.noteTitle}>{post.title}</span>
                  <span className={styles.noteSummary}>{post.summary}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          /* Two states, not one. With no notes at all the list has never
             started; with exactly one, it has -- that note is on the tile
             above, and telling a reader who can see it that the first note is
             coming is telling them something they can see is untrue. */
          <p className={styles.emptyState}>
            {latest ? "More" : "First"} field notes are being prepared.
          </p>
        )}

        <Link className={styles.textLink} href="/blog">
          Browse the blog
        </Link>
      </div>
    </div>
  );
}
