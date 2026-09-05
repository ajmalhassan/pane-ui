import type { ReactNode } from "react";
import styles from "./AppBarDock.module.css";

type Props = {
  /** The `AppBar` this dock pins to the bottom of the page. */
  children: ReactNode;
};

/**
 * Pins an application bar to the bottom of the content column.
 *
 * The bar itself is a plain strip with no inset and no position -- see
 * `AppBar`'s `Props` docblock -- and this is the one thing that gives it both,
 * so every surface docks its bar in the same place. A page that renders this
 * also composes `dockedPage` from the stylesheet beside it, which reserves the
 * bar's height at the foot of the page.
 *
 * A new docked surface therefore has two halves, and the second one is silent
 * when it is missing: a mistyped `composes` source resolves to the literal
 * string `"undefined"`, builds clean, and drops the reserve so the page's last
 * line sits under the bar. `tests/unit/AppBarDock.test.tsx` keeps the list of
 * surfaces that compose it -- add the new one there.
 */
export function AppBarDock({ children }: Props) {
  return <div className={styles.dock}>{children}</div>;
}
