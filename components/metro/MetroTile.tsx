"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { applyPressTilt, clearPressTilt, Pressable } from "./Pressable";
import type { TileSize } from "./TileGrid";
import { useDocumentVisible } from "./useDocumentVisible";
import { useLiveCycle } from "./useLiveCycle";
import { useReducedMotion } from "./useReducedMotion";
import styles from "./MetroTile.module.css";

export type TileAccent = "cyan" | "blue" | "ink" | "photo";

type BaseTileProps = {
  /**
   * The small caption along the tile's bottom edge -- a Windows Phone tile
   * name. On a navigation tile it names the destination.
   */
  label: string;
  size?: TileSize;
  accent?: TileAccent;
  className?: string;
};

export type DisplayTileProps = BaseTileProps & {
  role: "display";
  children: ReactNode;
};

export type NavigationTileProps = BaseTileProps & {
  role: "navigation";
  href: string;
  children: ReactNode;
};

export type RevealTileProps = BaseTileProps & {
  role: "reveal";
  front: ReactNode;
  back: ReactNode;
};

export type LiveTileProps = BaseTileProps & {
  role: "live";
  items: readonly ReactNode[];
  /**
   * One stable summary of every claim the tile cycles through. Automatic
   * changes are silent (`aria-live="off"`), so this is what a screen reader
   * user gets -- it must stand alone.
   */
  accessibleLabel: string;
  intervalMs?: number;
};

/**
 * A tile declares exactly one role, and each role brings its own required
 * props. The union makes `href` on a display tile, or `front` on a live one, a
 * type error at the call site rather than a silently ignored prop.
 */
export type MetroTileProps =
  | DisplayTileProps
  | NavigationTileProps
  | RevealTileProps
  | LiveTileProps;

/**
 * The line budgets tile copy has to live inside. A tile clips whatever exceeds
 * them, so consumer content declares which budget it is asking for.
 *
 * The *sizes* of these three are not fixed: inside a `TileGrid` each one is
 * derived from the grid's own unit and capped at the design's absolute step,
 * so copy shrinks with its tile instead of spilling out of it. What is fixed
 * is the line count each budget promises, which is what the strings below have
 * to be written against.
 */
export const tileTextClass = {
  /**
   * Secondary copy under a title, clamped to 2 lines (3 on `large` and `hero`
   * from 48rem).
   *
   * **It is painted on `large` and `hero` only.** A `small` or `wide` tile is
   * one grid unit tall -- 67px at 320px, and 81px at 768px, where the grid
   * doubles to eight columns -- which is a headline and a caption and nothing
   * else. A consumer that needs a second line on a one-unit tile must ask for
   * `value` instead, which is never clamped and never hidden.
   */
  body: styles.body,
  /** The tile's own headline, clamped to 2 lines (1 on `small`). */
  title: styles.title,
  /**
   * One large numeral or short token -- the evidence a small tile exists to
   * carry. Never clamped and never hidden: always a single line, ellipsised
   * rather than wrapped when it overflows, so the budget is a *width* and the
   * consumer owns it. Measured inner widths at the two tightest frames (320,
   * then 768 where the grid doubles to eight columns): `small` 51.5 / 49.3px,
   * `wide` 125 / 138.6px, `large` 117 / 138.6px, `hero` 264 / 317.3px.
   */
  value: styles.value,
} as const;

const LIVE_INTERVAL_MS = 6000;

function rootClass(
  size: TileSize,
  accent: TileAccent,
  roleClass: string,
  className?: string,
): string {
  return [styles.tile, styles[size], styles[accent], roleClass, className]
    .filter(Boolean)
    .join(" ");
}

/** Every role ends with the same bottom-aligned caption. */
function Caption({ id, label }: { id?: string; label: string }): ReactNode {
  return (
    <span className={styles.label} id={id}>
      {label}
    </span>
  );
}

/**
 * A display tile owns no interaction and carries no name of its own, so its
 * root is a plain `<div>`: an unnamed `<article>` would add a landmark-shaped
 * entry to every screen reader's element list for no reader benefit.
 */
function DisplayShell({
  accent = "ink",
  children,
  className,
  label,
  size = "small",
}: DisplayTileProps): ReactNode {
  return (
    <div
      className={rootClass(size, accent, "", className)}
      data-tile-role="display"
      data-tile-size={size}
    >
      <span className={styles.content}>{children}</span>
      <Caption label={label} />
    </div>
  );
}

function NavigationShell({
  accent = "ink",
  children,
  className,
  href,
  label,
  size = "small",
}: NavigationTileProps): ReactNode {
  return (
    <Link
      className={rootClass(size, accent, styles.navigation, className)}
      data-tile-role="navigation"
      data-tile-size={size}
      href={href}
      onPointerLeave={clearPressTilt}
      onPointerMove={applyPressTilt}
    >
      <span className={styles.content}>{children}</span>
      <Caption label={label} />
    </Link>
  );
}

function RevealShell({
  accent = "ink",
  back,
  className,
  front,
  label,
  size = "small",
}: RevealTileProps): ReactNode {
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  // Reduced motion swaps the mechanism, not just the duration: the idle face
  // is taken out of the paint instead of being rotated out of view.
  const idle = reduced ? styles.faceHidden : styles.faceAway;
  const base = useId();
  const captionId = `${base}caption`;
  const frontId = `${base}front`;
  const backId = `${base}back`;

  return (
    <Pressable
      /*
       * The caption is the name and the exposed face is the description. Left
       * to compute its name from its own contents the button would be renamed
       * by every press -- a control whose name changes under the reader is a
       * different control to them -- so the stable half and the changing half
       * are separated: `aria-labelledby` never moves, `aria-describedby`
       * follows the face on show, and `aria-pressed` says which that is.
       */
      aria-describedby={flipped ? backId : frontId}
      aria-labelledby={captionId}
      aria-pressed={flipped}
      className={rootClass(size, accent, styles.action, className)}
      data-motion={reduced ? "reduced" : "full"}
      data-tile-role="reveal"
      data-tile-size={size}
      onClick={() => setFlipped((current) => !current)}
      type="button"
    >
      <span className={styles.content}>
        <span
          aria-hidden={flipped}
          className={`${styles.face} ${flipped ? idle : ""}`}
          data-face="front"
          id={frontId}
        >
          {front}
        </span>
        <span
          aria-hidden={!flipped}
          className={`${styles.face} ${flipped ? "" : idle}`}
          data-face="back"
          id={backId}
        >
          {back}
        </span>
      </span>
      <Caption id={captionId} label={label} />
    </Pressable>
  );
}

function LiveShell({
  accent = "ink",
  accessibleLabel,
  className,
  intervalMs = LIVE_INTERVAL_MS,
  items,
  label,
  size = "small",
}: LiveTileProps): ReactNode {
  const reduced = useReducedMotion();
  const visible = useDocumentVisible();
  // Hover and focus are tracked apart so a pointer leaving a still-focused
  // tile does not restart the cycle under the reader's cursor.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { advance, index } = useLiveCycle(items.length, {
    enabled: visible,
    intervalMs,
    paused: hovered || focused,
  });

  return (
    <Pressable
      // The one interactive owner, and the one stable name: activation advances
      // the tile, so no second control is needed to make the cycle reachable.
      aria-label={accessibleLabel}
      className={rootClass(size, accent, styles.action, className)}
      data-live-index={index}
      data-motion={reduced ? "reduced" : "full"}
      data-tile-role="live"
      data-tile-size={size}
      onBlur={() => setFocused(false)}
      onClick={advance}
      onFocus={() => setFocused(true)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      type="button"
    >
      <span className={styles.content}>
        <span
          aria-hidden="true"
          // Automatic changes must never interrupt a screen reader; the button's
          // own label already carries every claim.
          aria-live="off"
          className={`${styles.liveItem} ${reduced ? "" : styles.liveItemAnimated}`}
          key={index}
        >
          {items[index]}
        </span>
      </span>
      <Caption label={label} />
    </Pressable>
  );
}

export function MetroTile(props: MetroTileProps): ReactNode {
  switch (props.role) {
    case "navigation":
      return <NavigationShell {...props} />;
    case "reveal":
      return <RevealShell {...props} />;
    case "live":
      /*
       * A single claim never cycles, so the button would be a control that does
       * nothing: pressing it advances to the item already on screen. One claim
       * is static evidence, and static evidence is the display role -- the
       * claim becomes the content and the caption stays the caption. The
       * stable summary in `accessibleLabel` is not carried over: a display
       * tile has no name of its own, only content, so a live tile with one
       * item should have text content that stands alone.
       */
      return props.items.length <= 1 ? (
        <DisplayShell
          accent={props.accent}
          className={props.className}
          label={props.label}
          role="display"
          size={props.size}
        >
          {props.items[0] ?? null}
        </DisplayShell>
      ) : (
        <LiveShell {...props} />
      );
    default:
      return <DisplayShell {...props} />;
  }
}
