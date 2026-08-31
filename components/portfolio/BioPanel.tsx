import { profile } from "@/content/profile";
import styles from "./PortfolioPanorama.module.css";

export function BioPanel() {
  return (
    <div className={styles.bio}>
      <p className={styles.eyebrow}>Ajmal Hassan / product engineering</p>
      <h2 className={styles.bioHeading}>{profile.headline}</h2>
      <p className={styles.lede}>{profile.bio}</p>
      <div className={styles.bioGrid}>
        <div>
          <h2>Close to the work</h2>
          <p>{profile.leadership[0]}</p>
          <p>{profile.leadership[2]}</p>
        </div>
        <div>
          <h2>How I build</h2>
          <p>{profile.leadership[1]}</p>
        </div>
      </div>
      <aside className={styles.personalNote}>
        <span aria-hidden="true" className={styles.cyanMark} />
        <div>
          <h2>Lumia note</h2>
          <p>
            This portfolio takes its interaction cues from the Lumia 520 Cyan:
            a reminder that software can feel unmistakably itself.
          </p>
        </div>
      </aside>
    </div>
  );
}
