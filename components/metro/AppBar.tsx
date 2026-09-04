"use client";

import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";
import styles from "./AppBar.module.css";

export type AppAction = {
  label: string;
  href?: string;
  icon: ReactNode;
  onSelect?: (event: MouseEvent<HTMLElement>) => void;
};

type Props = {
  actions: readonly AppAction[];
};

export function AppBar({ actions }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav
      aria-label="Page actions"
      className={styles.bar}
      data-expanded={expanded}
      data-testid="app-bar"
    >
      <div className={styles.actions}>
        {actions.map((action) => {
          const content = (
            <>
              <span aria-hidden="true" className={styles.icon}>
                {action.icon}
              </span>
              <span className={styles.label}>{action.label}</span>
            </>
          );

          if (action.href) {
            return (
              <a
                className={styles.action}
                href={action.href}
                key={action.label}
                onClick={(event) => {
                  if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  ) {
                    return;
                  }

                  action.onSelect?.(event);
                }}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              className={styles.action}
              key={action.label}
              onClick={action.onSelect}
              type="button"
            >
              {content}
            </button>
          );
        })}
      </div>
      <button
        aria-expanded={expanded}
        aria-label="Show app bar labels"
        className={styles.action}
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <span aria-hidden="true" className={styles.icon}>
          …
        </span>
      </button>
    </nav>
  );
}
