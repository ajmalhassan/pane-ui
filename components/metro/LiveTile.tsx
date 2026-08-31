"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Pressable } from "./Pressable";
import { tileSizeClass, type TileSize } from "./TileGrid";
import styles from "./LiveTile.module.css";

type Props = {
  label: string;
  front: ReactNode;
  back: ReactNode;
  size?: TileSize;
  accent?: "cyan" | "blue" | "ink";
  href: string;
};

export function LiveTile({ label, front, back, size = "medium", accent = "ink", href }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <article className={`${styles.tile} ${styles[accent]} ${tileSizeClass(size)}`}>
      <Pressable
        type="button"
        aria-label={`Show more: ${label}`}
        aria-pressed={flipped}
        className={styles.surface}
        onClick={() => setFlipped((value) => !value)}
      >
        <span className={`${styles.face} ${flipped ? styles.hiddenFront : ""}`}>{front}</span>
        <span aria-hidden={!flipped} className={`${styles.face} ${styles.back} ${flipped ? styles.visibleBack : ""}`}>{back}</span>
      </Pressable>
      <Link className={styles.link} href={href}>View {label}</Link>
    </article>
  );
}
