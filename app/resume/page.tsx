import type { Metadata } from "next";
import { DetailSurface } from "@/components/portfolio/DetailSurface";
import detail from "@/components/portfolio/detailSurface.module.css";
import { profile } from "@/content/profile";
import styles from "./resume.module.css";

/*
 * The tab, the bookmark, the shared link. This is the one document on the site
 * most likely to be opened on its own and sent to someone, and the only detail
 * route that was still inheriting the root layout's generic title -- so the
 * page said "Ajmal Hassan — Technical Leader & Builder" where the other three
 * say what kind of document they are. The identity line above the column is
 * `aria-hidden` and the h1 is the person's name, which leaves `<title>` as the
 * only place that can say "this is a résumé".
 *
 * The description is `profile.bio` rather than a sentence written here: the
 * launch constraint is that this page says nothing the approved profile does
 * not, and a meta description is still the page talking.
 */
export const metadata: Metadata = {
  title: "Résumé — Ajmal Hassan",
  description: profile.bio,
};

export default function Resume() {
  const links = Object.values(profile.links);

  return (
    <DetailSurface
      back={{ label: "Portfolio", href: "/" }}
      // Résumé and contact are the portfolio's two primary commands, and this
      // is the résumé: the way back to the portfolio takes the first slot and
      // contact keeps the second, as a real link to the panorama's own panel.
      // The résumé command itself is dropped rather than pointed at this page.
      showResume={false}
    >
      <header className={`${detail.header} ${styles.header}`}>
        <p className={detail.marker}>Résumé</p>
        <h1 className={detail.title}>{profile.name}</h1>
        <p className={styles.headline}>{profile.headline}</p>
        <p className={detail.summary}>{profile.bio}</p>
      </header>

      <div className={detail.divided}>
        <section
          aria-labelledby="leadership-heading"
          className={`${detail.section} ${styles.block}`}
        >
          <h2 className={detail.heading} id="leadership-heading">
            Leadership and system building
          </h2>
          <ul className={styles.highlights}>
            {profile.leadership.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="selected-work-heading"
          className={`${detail.section} ${styles.block}`}
        >
          <h2 className={detail.heading} id="selected-work-heading">
            Selected work
          </h2>
          <div className={styles.workList}>
            {profile.selectedExperience.map((experience) => (
              <article key={experience.title}>
                <h3>{experience.title}</h3>
                <p>{experience.summary}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Why a chronology a résumé usually carries is not on this one, and
            where the reader can find it instead. An `aside` is a
            `complementary` landmark whatever it holds, and the three sections
            beside it are all named, so a reader cycling landmarks would
            otherwise reach one anonymous region on the page. */}
        <aside
          aria-label="Employment chronology"
          className={`${detail.section} ${styles.reviewNote}`}
        >
          <p className={styles.reviewBody}>
            Detailed employment chronology is available through{" "}
            <a
              className={detail.link}
              href={profile.links.linkedin.href}
              rel="noreferrer"
              target="_blank"
            >
              LinkedIn
            </a>{" "}
            until the portfolio content review is complete.
          </p>
        </aside>

        <section
          aria-labelledby="profiles-heading"
          className={`${detail.section} ${styles.block}`}
        >
          <h2 className={detail.heading} id="profiles-heading">
            Public profiles
          </h2>
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  className={detail.link}
                  href={link.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DetailSurface>
  );
}
