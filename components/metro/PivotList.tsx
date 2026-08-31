"use client";

import Link from "next/link";
import type { KeyboardEvent } from "react";
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

    onSelect(next.id);
    event.currentTarget.ownerDocument
      .getElementById(pivotTabId(next.id))
      ?.focus();
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
              onClick={() => onSelect(option.id)}
              onKeyDown={(event) => move(event, index)}
              role="tab"
              tabIndex={selected ? 0 : -1}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
