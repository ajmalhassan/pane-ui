import type { PropsWithChildren } from "react";
import styles from "./TileGrid.module.css";

export type TileSize = "small" | "medium" | "wide" | "large";

export function TileGrid({ children }: PropsWithChildren) {
  return <div className={styles.grid}>{children}</div>;
}

export function tileSizeClass(size: TileSize = "medium") {
  return styles[size];
}
