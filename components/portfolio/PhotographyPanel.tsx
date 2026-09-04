import Image from "next/image";
import { photography } from "@/content/photography";
import styles from "./PortfolioPanorama.module.css";

export function PhotographyPanel() {
  return (
    <div className={styles.panelContent}>
      <header className={styles.panelIntro}>
        <p className={styles.eyebrow}>Developing collection</p>
        <p>
          A quiet counterpoint to engineering: travel, light, and fragments of
          place. This collection is still developing.
        </p>
      </header>
      <div className={styles.photoGrid}>
        {photography.map((entry) => (
          <figure className={styles.photoTile} key={entry.id}>
            {entry.kind === "image" ? (
              <Image
                alt={entry.alt}
                className={styles.photo}
                height={512}
                sizes="(max-width: 720px) 100vw, 38vw"
                src={entry.src}
                width={512}
              />
            ) : (
              <div className={styles.typeFrame}>
                <span>Photography selection in progress</span>
                <strong>{entry.title}</strong>
              </div>
            )}
            <figcaption>
              <strong>{entry.title}</strong>
              <span>{entry.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
