"use client";

import Link from "next/link";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { PRESS_TILT, Pressable } from "./Pressable";
import type { TileSize } from "./types";
import { useDocumentVisible } from "./useDocumentVisible";
import { useLiveCycle } from "./useLiveCycle";
import { useReducedMotion } from "./useReducedMotion";
import styles from "./MetroTile.module.css";

export type TileAccent = "cyan" | "blue" | "ink" | "photo";

type BaseTileProps = {
  /**
   * The small caption along the tile's bottom edge -- a Windows Phone tile
   * name. On a navigation tile it names the destination.
   *
   * A node rather than a string, and for exactly one reason: the Blog hero's
   * caption carries the note's date, and a date a machine can read is a
   * `<time dateTime>` -- which is what the list rows under it and `/blog` both
   * render. It is still ONE clipped line; the slot is for marking that line up,
   * not for putting block content on the tile.
   */
  label: ReactNode;
  /**
   * Imagery, and anything else that belongs *behind* the copy rather than
   * beside it: it is rendered on the tile ROOT, before `.content`, so it fills
   * the whole rectangle instead of the padded content box. That distinction is
   * the whole point of the slot -- a picture tile whose photo stops at the ink
   * padding is a framed photo, not a Windows Phone picture tile.
   *
   * The slot adds no `aria-hidden` of its own. An image's `alt` is the only
   * description a reader gets of a picture tile, so hiding the layer wholesale
   * would delete it; decoration inside the slot (a wash, a scrim) carries its
   * own `aria-hidden`, exactly as it would anywhere else.
   *
   * That reaches the reader on `display` and `navigation`, whose names are
   * computed from their contents. It does NOT on `reveal` or `live`: those
   * shells set `aria-labelledby` and `aria-label` respectively, and an
   * authoritative name source excludes contained content -- an `alt` in the
   * slot is still in the tree as an image, but it is not part of the button's
   * name. A picture that has to be announced *as the control's name* belongs on
   * one of the first two roles.
   */
  media?: ReactNode;
  size?: TileSize;
  accent?: TileAccent;
  className?: string;
  /**
   * This tile's 0-based place in the grid that laid it out, in DOM order.
   *
   * A consumer never writes it: `TileGrid` numbers its own tiles on the way
   * through, because the grid is the only thing that sees all of them at once.
   * The tile publishes it twice -- `data-tile-index` for anything reading the
   * DOM (Phase 3's transition engine, the E2E suite) and `--tile-index` for the
   * stylesheet, which turns it into the entrance delay that staggers a panel's
   * tiles in after its pivot is selected.
   *
   * Outside a grid it is absent, and the stylesheet's own `var(--tile-index, 0)`
   * fallback makes that a zero-delay tile.
   */
  index?: number;
};

export type DisplayTileProps = BaseTileProps & {
  role: "display";
  /**
   * Optional, because a picture tile's content is its `media` and its caption:
   * a Windows Phone photo tile writes no copy across the image. Every other
   * display tile passes children.
   */
  children?: ReactNode;
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
  /**
   * Must be a positive finite number for the tile to cycle -- zero,
   * negative, or `NaN` disables cycling (see `useLiveCycle`).
   */
  intervalMs?: number;
  /**
   * The phase this tile cycles on: how far its own grid of change moments sits
   * behind an unphased tile's. Two live tiles on one screen sharing a beat
   * change together, which reads as a blink rather than as liveliness. The
   * phase is spent on the first change and holds for every one after it -- see
   * `useLiveCycle`.
   */
  offsetMs?: number;
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

type TileStyle = CSSProperties & { "--tile-index"?: number };

/**
 * The place-in-the-grid props, spread by every role so no shell can quietly
 * drop half of the pair.
 *
 * Zero is a real index -- the leading tile's -- so the test is for `undefined`
 * rather than for truthiness; and an unnumbered tile gets neither the attribute
 * nor the property, which is what leaves the stylesheet's own fallback in
 * charge instead of putting `--tile-index: undefined` on the element.
 */
function tilePlace(index?: number): {
  "data-tile-index"?: number;
  style?: TileStyle;
} {
  return index === undefined
    ? {}
    : { "data-tile-index": index, style: { "--tile-index": index } };
}

/**
 * The layer beneath the copy. It is a sibling of `.content`, not a child, so
 * its containing block is the tile itself and `inset: 0` means the tile's own
 * rectangle -- padding included.
 *
 * Nothing is rendered at all when the slot is empty, so a tile without imagery
 * keeps exactly the box tree it had before the slot existed.
 */
function Media({ media }: { media?: ReactNode }): ReactNode {
  return media ? <span className={styles.media}>{media}</span> : null;
}

/**
 * Every role ends with the same bottom-aligned caption.
 *
 * The leading space is load-bearing, not formatting. A navigation tile's
 * accessible name is computed from its contents, and Chromium concatenates
 * adjacent inline boxes with nothing between them: without it, the lead
 * platform tile is announced as "Revenue contributionlead platform". The
 * fragment costs no layout -- an anonymous flex item holding only white space
 * is not rendered (CSS Flexbox 4), and both `.tile` and `.content` are flex
 * containers -- so the caption's own box is unchanged.
 */
function Caption({ id, label }: { id?: string; label: ReactNode }): ReactNode {
  return (
    <>
      {" "}
      <span className={styles.label} id={id}>
        {label}
      </span>
    </>
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
  index,
  label,
  media,
  size = "small",
}: DisplayTileProps): ReactNode {
  return (
    <div
      className={rootClass(size, accent, "", className)}
      data-tile-role="display"
      data-tile-size={size}
      {...tilePlace(index)}
    >
      <Media media={media} />
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
  index,
  label,
  media,
  size = "small",
}: NavigationTileProps): ReactNode {
  return (
    <Link
      className={rootClass(size, accent, styles.navigation, className)}
      data-tile-role="navigation"
      data-tile-size={size}
      href={href}
      {...tilePlace(index)}
      {...PRESS_TILT}
    >
      <Media media={media} />
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
  index,
  label,
  media,
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
      {...tilePlace(index)}
    >
      <Media media={media} />
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
  index: place,
  intervalMs = LIVE_INTERVAL_MS,
  items,
  label,
  media,
  offsetMs,
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
    offsetMs,
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
      {...tilePlace(place)}
    >
      <Media media={media} />
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
          index={props.index}
          label={props.label}
          media={props.media}
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
