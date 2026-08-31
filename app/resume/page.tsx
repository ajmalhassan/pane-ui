import { profile } from "@/content/profile";
import styles from "./resume.module.css";

export default function Resume() {
  const links = Object.values(profile.links);

  return (
    <main className={styles.resume}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Résumé</p>
        <h1>{profile.name}</h1>
        <p className={styles.headline}>{profile.headline}</p>
        <p className={styles.bio}>{profile.bio}</p>
      </header>

      <section aria-labelledby="leadership-heading" className={styles.section}>
        <h2 id="leadership-heading">Leadership and system building</h2>
        <ul>
          {profile.leadership.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="selected-work-heading" className={styles.section}>
        <h2 id="selected-work-heading">Selected work</h2>
        <div className={styles.workList}>
          {profile.selectedExperience.map((experience) => (
            <article key={experience.title}>
              <h3>{experience.title}</h3>
              <p>{experience.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className={styles.reviewNote}>
        Detailed employment chronology is available through{" "}
        <a href={profile.links.linkedin.href} rel="noreferrer" target="_blank">
          LinkedIn
        </a>{" "}
        until the portfolio content review is complete.
      </aside>

      <section aria-labelledby="profiles-heading" className={styles.section}>
        <h2 id="profiles-heading">Public profiles</h2>
        <ul className={styles.links}>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} rel="noreferrer" target="_blank">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
