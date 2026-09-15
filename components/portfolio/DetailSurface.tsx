import type { ReactNode } from "react";
import { AppBar, type AppAction } from "@/components/metro/AppBar";
import { AppBarDock } from "@/components/metro/AppBarDock";
import { StatusBar } from "@/components/metro/StatusBar";
import { APP_IDENTITY } from "./identity";
import styles from "./detailSurface.module.css";

/** Where a surface came from, and what to call the way back to it. */
type BackCommand = {
  /**
   * The hub this document belongs to, named rather than called "back": the
   * glyph already says "back", and this is what a screen reader reads out, so
   * it says where the command goes instead of repeating the arrow.
   */
  label: string;
  href: string;
};

/**
 * The two commands this application keeps primary everywhere, in the order the
 * panorama's own bar carries them. A reader who reaches a case study or a note
 * from a search result meets the same two offers a reader who arrived at the
 * front door does, which is what stops a detail route from being a dead end.
 *
 * `/portfolio#contact` rather than `#contact`: on a detail route the panel lives one
 * navigation away, on the panorama, so the fragment needs the page in front of
 * it. The panorama's own Contact command keeps the bare hash it can act on.
 */
const RESUME: AppAction = {
  label: "Résumé",
  href: "/resume",
  icon: "arrow-northeast",
};
const CONTACT: AppAction = {
  label: "Contact",
  href: "/portfolio#contact",
  icon: "mail",
};

type Props = {
  back: BackCommand;
  /** Marks the existing reading column and its serializable return command. */
  projectReading?: boolean;
  /**
   * Whether the résumé is offered as a command. Every detail surface offers it
   * except the résumé itself, which would be a command pointing at the page the
   * reader is already reading.
   */
  showResume?: boolean;
  children: ReactNode;
};

/**
 * A page of this application that is not the panorama.
 *
 * Four documents render through here -- a case study, a field note, the note
 * index, the résumé -- and this is what makes them one application rather than
 * four pages that share a palette: the same identity line above the column, the
 * same reading column, and the same application bar docked below it, with the
 * way back drawn as a command instead of typed as a bordered web button.
 *
 * The bar's contents are not a parameter either. Every surface's way back is
 * the same command with a different destination, so the glyph is decided here
 * and a caller cannot pick another one; and résumé and contact stay primary
 * commands on every surface that is not one of them, so a caller cannot drop
 * them. What a caller decides is where "back" goes, and whether the résumé is
 * this page.
 *
 * Imports reach past `components/metro/index.ts` on purpose: the barrel also
 * exports the panorama's client components, and a server-rendered document has
 * no use for a tile grid in its bundle.
 */
export function DetailSurface({
  back,
  projectReading = false,
  showResume = true,
  children,
}: Props) {
  return (
    <main className={styles.page}>
      <StatusBar label={APP_IDENTITY} />
      <div
        className={styles.column}
        {...(projectReading ? { "data-project-reading": "true" } : {})}
      >
        {children}
      </div>
      <AppBarDock>
        <AppBar
          actions={[
            {
              label: back.label,
              href: back.href,
              icon: "back",
              projectReturn: projectReading,
            },
            ...(showResume ? [RESUME] : []),
            CONTACT,
          ]}
        />
      </AppBarDock>
    </main>
  );
}
