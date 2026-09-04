import { profile } from "@/content/profile";
import { ProfileTiles } from "./ProfileTiles";
import styles from "./PortfolioPanorama.module.css";

/**
 * Me is a personal Start screen: the proposition, then the tiles that evidence
 * it. The panel carries no identity line and no heading of its own -- the
 * status bar already says `AJMAL / PORTFOLIO` and the panorama heading is the
 * pivot's own name, so a third would only repeat them.
 */
export function BioPanel() {
  return (
    <div className={styles.bio}>
      <p className={styles.lede}>{profile.bio}</p>
      <ProfileTiles />
    </div>
  );
}
