"use client";

import type { MouseEvent, Ref } from "react";
import { useState } from "react";
import { MetroIcon, type MetroIconName } from "./MetroIcon";
import { PRESS_TILT } from "./Pressable";
import { useProjectTransition } from "./ProjectTransitionProvider";
import styles from "./AppBar.module.css";
import hidden from "./visuallyHidden.module.css";

type CommandBase = {
  label: string;
  icon: MetroIconName;
  onSelect?: (event: MouseEvent<HTMLElement>) => void;
  /** Serializable opt-in for the Projects return coordinator. */
  projectReturn?: boolean;
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
  /**
   * Whether this label is painted or only spoken. A minimised bar keeps every
   * name in the accessibility tree -- the label is what names its command -- so
   * the clipped state is the shared `visuallyHidden` utility and never
   * `display: none`, which would erase the names along with the paint.
   *
   * It is a class rather than a media query because CSS Modules allows
   * `composes` only on a top-level single-class rule, so a rule already inside
   * `@media` cannot pull the shared utility in. The stylesheet keeps the one
   * condition this component cannot see -- a phone paints its labels in every
   * state -- as its own rule.
   *
   * `labelClipped` rides along with the utility and never without it: it is the
   * local half of `.label.labelClipped`, which settles the one property the two
   * files both declare (`min-height`) by specificity instead of by emission
   * order. See `AppBar.module.css`.
   */
  clipped?: boolean;
};

/**
 * The ring carries the glyph and the label sits under it. The label span is
 * rendered even when a command has no name -- the overflow ellipsis does not --
 * so every ring keeps the same baseline in the bar.
 */
function CommandFace({ icon, label, clipped = false }: FaceProps) {
  return (
    <>
      <span aria-hidden="true" className={styles.ring}>
        <MetroIcon name={icon} />
      </span>
      <span
        className={
          clipped
            ? `${styles.label} ${styles.labelClipped} ${hidden.visuallyHidden}`
            : styles.label
        }
      >
        {label}
      </span>
    </>
  );
}

/** One command, one interactive owner: an anchor when it has a destination. */
function AppBarCommand({
  action,
  clipped,
}: {
  action: AppAction;
  clipped: boolean;
}) {
  const transition = useProjectTransition();
  const face = (
    <CommandFace clipped={clipped} icon={action.icon} label={action.label} />
  );

  if (action.href) {
    return (
      <a
        className={styles.command}
        data-project-return={action.projectReturn || undefined}
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

          if (action.projectReturn && transition) {
            event.preventDefault();
            transition.returnToProjects();
          }
          action.onSelect?.(event);
        }}
        {...PRESS_TILT}
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
      {...PRESS_TILT}
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
          <AppBarCommand
            action={action}
            clipped={!expanded}
            key={action.label}
          />
        ))}
      </div>
      <button
        aria-expanded={expanded}
        // Names the state the press produces, so the command never claims to
        // show labels that are already showing.
        aria-label={expanded ? "Hide app bar labels" : "Show app bar labels"}
        className={`${styles.command} ${styles.overflow}`}
        onClick={() => setExpanded((current) => !current)}
        {...PRESS_TILT}
        type="button"
      >
        <CommandFace clipped={!expanded} icon="ellipsis" />
      </button>
    </nav>
  );
}
