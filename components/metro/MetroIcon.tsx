import { useId, type ReactElement, type ReactNode } from "react";
import styles from "./MetroIcon.module.css";

export const METRO_ICON_NAMES = [
  "arrow-northeast",
  "mail",
  "ellipsis",
  "camera",
  "notes",
  "back",
] as const;

export type MetroIconName = (typeof METRO_ICON_NAMES)[number];

// One weight for the whole set, and the only place it is declared. Ring
// geometry has its own token (`--metro-command-stroke`); this is not it.
const STROKE_WIDTH = 1.75;

// Hand-authored on the shared 24x24 optical grid, strokes kept inside x/y 3-21
// so every glyph reads at the same visual weight. Square caps and miter joins
// keep the geometry sharp; Metro has no rounded corners.
const GLYPHS: Record<MetroIconName, ReactNode> = {
  // Windows Phone "open externally": a diagonal shaft ending in an L-shaped head.
  "arrow-northeast": (
    <>
      <path d="M5 19 19 5" />
      <path d="M9 5h10v10" />
    </>
  ),
  // Envelope: closed body with the flap crease meeting both top corners.
  mail: (
    <>
      <path d="M3 5.5h18v13H3z" />
      <path d="M3 5.5 12 12.5 21 5.5" />
    </>
  ),
  // Overflow: three solid dots on the optical centre line.
  ellipsis: (
    <>
      <circle cx="6" cy="12" fill="currentColor" r="1.5" stroke="none" />
      <circle cx="12" cy="12" fill="currentColor" r="1.5" stroke="none" />
      <circle cx="18" cy="12" fill="currentColor" r="1.5" stroke="none" />
    </>
  ),
  // Camera: body with a viewfinder step, concentric lens on the body centre.
  camera: (
    <>
      <path d="M3 8h4.5L9 5.5h6L16.5 8H21v11H3z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  // Notes: a portrait page carrying three ranged rules.
  notes: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 9h6" />
      <path d="M9 12.5h6" />
      <path d="M9 16h4" />
    </>
  ),
  // Windows Phone back: a full-width shaft with an open arrowhead, not a chevron.
  back: (
    <>
      <path d="M20 12H5" />
      <path d="M10 7 5 12l5 5" />
    </>
  ),
};

type Props = {
  name: MetroIconName;
  /**
   * Names the icon for assistive technology when it stands alone. Omit it for
   * decoration next to a visible label; the SVG then hides itself.
   */
  title?: string;
};

export function MetroIcon({ name, title }: Props): ReactElement {
  const titleId = useId();

  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-labelledby={title ? titleId : undefined}
      className={styles.icon}
      fill="none"
      focusable="false"
      height="1em"
      role={title ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="miter"
      strokeWidth={STROKE_WIDTH}
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {GLYPHS[name]}
    </svg>
  );
}
