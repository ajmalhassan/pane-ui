"use client";

import Link from "next/link";
import {
  Fragment,
  useEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  pivotHref,
  pivotPanelId,
  pivotTabId,
  type PivotId,
} from "@/lib/content/pivots";
import styles from "./PanoramaNav.module.css";

export type PivotOption = {
  id: PivotId;
  label: string;
};

type Props = {
  active: PivotId;
  options: readonly PivotOption[];
  onSelect: (id: PivotId) => void;
};

export function PanoramaNav({ active, options, onSelect }: Props) {
  const trackRef = useRef<HTMLSpanElement>(null);
  const activeIndex = Math.max(
    options.findIndex((option) => option.id === active),
    0,
  );
  // The selected heading leads and the rest follow cyclically, the way a
  // Windows Phone pivot header wraps. Ordering in the markup rather than with
  // a measured transform keeps the server response, the no-JavaScript page,
  // and the sequential tab order all showing the same thing.
  const ordered = [
    ...options.slice(activeIndex),
    ...options.slice(0, activeIndex),
  ];

  // A keyboard walk scrolls the track sideways to reach the clipped headings,
  // so the selected one leads again as soon as the selection moves on.
  useEffect(() => {
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }, [active]);

  // ...and as soon as focus leaves the headings behind.
  function restoreTrack(event: FocusEvent<HTMLElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }

  // Chrome declines to scroll a focused element into view inside a clipped
  // track, so a keyboard walk past the visible headings asks for it directly.
  function revealTab(event: FocusEvent<HTMLAnchorElement>) {
    event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function move(event: KeyboardEvent<HTMLAnchorElement>, currentIndex: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + options.length) % options.length;
    const next = options[nextIndex];
    if (!next) return;

    const nextLink = event.currentTarget.ownerDocument.getElementById(
      pivotTabId(next.id),
    ) as HTMLAnchorElement | null;
    nextLink?.focus();
    nextLink?.click();
  }

  function select(event: MouseEvent<HTMLAnchorElement>, id: PivotId) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    onSelect(id);
  }

  return (
    <nav
      aria-label="Portfolio sections"
      className={styles.nav}
      onBlur={restoreTrack}
    >
      {/*
       * The heading is the tablist's container, not its sibling: a heading
       * between a tablist and its tabs would break the tablist's required
       * children. The h1 borrows its accessible name from the selected tab, so
       * one persistent heading keeps naming the page while its visible text
       * follows the pivot. Only phrasing content may sit inside it.
       */}
      <h1 aria-labelledby={pivotTabId(active)} className={styles.heading}>
        <span
          aria-orientation="horizontal"
          className={styles.track}
          ref={trackRef}
          role="tablist"
        >
          {ordered.map((option, position) => (
            <Fragment key={option.id}>
              {position > 0 ? " " : null}
              <Link
                aria-controls={pivotPanelId(option.id)}
                aria-selected={option.id === active}
                className={styles.tab}
                // The heading immediately after the selected one is the peek
                // beyond the right edge; Phase 3 hangs its motion off this hook.
                data-peek={position === 1 ? "true" : undefined}
                href={pivotHref(option.id)}
                id={pivotTabId(option.id)}
                onClick={(event) => select(event, option.id)}
                onFocus={revealTab}
                onKeyDown={(event) =>
                  move(event, (activeIndex + position) % options.length)
                }
                role="tab"
              >
                {option.label}
              </Link>
            </Fragment>
          ))}
        </span>
      </h1>
    </nav>
  );
}
