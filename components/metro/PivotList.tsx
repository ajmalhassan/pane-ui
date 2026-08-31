"use client";

import Link from "next/link";
import type { KeyboardEvent, MouseEvent } from "react";
import { pivotHref, type PivotId } from "@/lib/content/pivots";
import styles from "./PivotList.module.css";

export type PivotOption = {
  id: PivotId;
  label: string;
};

type Props = {
  active: PivotId;
  options: readonly PivotOption[];
  onSelect: (id: PivotId) => void;
};

export function pivotTabId(id: PivotId) {
  return `pivot-tab-${id}`;
}

export function pivotPanelId(id: PivotId) {
  return `pivot-panel-${id}`;
}

export function PivotList({ active, options, onSelect }: Props) {
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
    <nav aria-label="Portfolio sections">
      <div
        aria-orientation="horizontal"
        className={styles.tabList}
        role="tablist"
      >
        {options.map((option, index) => {
          const selected = option.id === active;

          return (
            <Link
              aria-controls={pivotPanelId(option.id)}
              aria-selected={selected}
              className={styles.tab}
              href={pivotHref(option.id)}
              id={pivotTabId(option.id)}
              key={option.id}
              onClick={(event) => select(event, option.id)}
              onKeyDown={(event) => move(event, index)}
              role="tab"
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
