import { profile } from "@/content/profile";
import styles from "./PortfolioPanorama.module.css";

export function BioPanel() {
  return (
    <div className={styles.bio}>
      <p className={styles.eyebrow}>Ajmal Hassan / product engineering</p>
      <h1 className={styles.bioHeading}>{profile.position}</h1>
      <p className={styles.lede}>{profile.statement}</p>
      <div className={styles.bioGrid}>
        <div>
          <h2>Close to the work</h2>
          <p>{profile.focus}</p>
          <p>{profile.leadership}</p>
        </div>
        <div>
          <h2>How I build</h2>
          <p>{profile.philosophy}</p>
          <p>{profile.next}</p>
        </div>
      </div>
      <aside className={styles.personalNote}>
        <span aria-hidden="true" className={styles.cyanMark} />
        <div>
          <h2>Lumia note</h2>
          <p>{profile.personal}</p>
        </div>
      </aside>
    </div>
  );
}
