import type { PropsWithChildren } from "react";
import styles from "./TileGrid.module.css";

/** Start-screen ratios in grid units: 1x1, 2x1, 2x2 and 4x2. */
export type TileSize = "small" | "wide" | "large" | "hero";

/**
 * The wrapper exists to be a container-query container: the grid inside it
 * derives its row height from the wrapper's own inline size, which is the only
 * way square units survive every viewport without measuring in JavaScript.
 */
export function TileGrid({ children }: PropsWithChildren) {
  return (
    <div className={styles.frame}>
      <div className={styles.grid} data-tile-grid>
        {children}
      </div>
    </div>
  );
}
