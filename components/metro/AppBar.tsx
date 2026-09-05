"use client";

import type { MouseEvent, Ref } from "react";
import { useState } from "react";
import { MetroIcon, type MetroIconName } from "./MetroIcon";
import { applyPressTilt, clearPressTilt } from "./Pressable";
import styles from "./AppBar.module.css";

type CommandBase = {
  label: string;
  icon: MetroIconName;
  onSelect?: (event: MouseEvent<HTMLElement>) => void;
};

/**
 * A command is either a destination or a pure action, and the two carry
 * different capabilities. Only the link branch renders an element an owner can
 * hold, so `ref` is offered there and forbidden on the button branch -- the
 * union makes that a type error at the call site instead of a ref this
 * component silently drops.
 */
export type AppAction =
  | (CommandBase & {
      href: string;
      /**
       * Lets an owner focus the command it declared instead of hunting for it
       * with a selector over markup this component is free to change.
       */
      ref?: Ref<HTMLAnchorElement>;
    })
  | (CommandBase & { href?: undefined; ref?: never });

type Props = {
  /**
   * 1-4 primary commands (Windows Phone caps the bar at four); the bar has no
   * overflow strategy for more. The bar has no inline inset and no position of
   * its own; `AppBarDock` owns the horizontal inset, the left/right safe areas
   * and the fixed strip, for every surface at once.
   */
  actions: readonly AppAction[];
};

type FaceProps = {
  icon: MetroIconName;
  label?: string;
};

/**
 * The ring carries the glyph and the label sits under it. The label span is
 * rendered even when a command has no name -- the overflow ellipsis does not --
 * so every ring keeps the same baseline in the bar.
 */
function CommandFace({ icon, label }: FaceProps) {
  return (
    <>
      <span aria-hidden="true" className={styles.ring}>
        <MetroIcon name={icon} />
      </span>
      <span className={styles.label}>{label}</span>
    </>
  );
}

/** One command, one interactive owner: an anchor when it has a destination. */
function AppBarCommand({ action }: { action: AppAction }) {
  const face = <CommandFace icon={action.icon} label={action.label} />;

  if (action.href) {
    return (
      <a
        className={styles.command}
        href={action.href}
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
        onPointerLeave={clearPressTilt}
        onPointerMove={applyPressTilt}
        ref={action.ref}
      >
        {face}
      </a>
    );
  }

  return (
    <button
      className={styles.command}
      onClick={action.onSelect}
      onPointerLeave={clearPressTilt}
      onPointerMove={applyPressTilt}
      type="button"
    >
      {face}
    </button>
  );
}

export function AppBar({ actions }: Props) {
  // Rings-with-labels is the approved look, so the bar opens named: a hiring
  // manager reads "résumé" without touching anything, at every width. Wide
  // layouts can still collapse to rings on demand; phones never can, because
  // their labels are always painted (see the stylesheet's media queries).
  const [expanded, setExpanded] = useState(true);

  return (
    <nav
      aria-label="Page actions"
      className={styles.bar}
      data-expanded={expanded}
      data-testid="app-bar"
    >
      <div className={styles.actions}>
        {actions.map((action) => (
          <AppBarCommand action={action} key={action.label} />
        ))}
      </div>
      <button
        aria-expanded={expanded}
        // Names the state the press produces, so the command never claims to
        // show labels that are already showing.
        aria-label={expanded ? "Hide app bar labels" : "Show app bar labels"}
        className={`${styles.command} ${styles.overflow}`}
        onClick={() => setExpanded((current) => !current)}
        onPointerLeave={clearPressTilt}
        onPointerMove={applyPressTilt}
        type="button"
      >
        <CommandFace icon="ellipsis" />
      </button>
    </nav>
  );
}
