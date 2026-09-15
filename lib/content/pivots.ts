export const PIVOT_IDS = ["me", "projects", "blog", "photography"] as const;
export type PivotId = (typeof PIVOT_IDS)[number];

export function parsePivot(value: string | string[] | undefined): PivotId {
  if (typeof value !== "string") return "me";
  return PIVOT_IDS.includes(value as PivotId) ? (value as PivotId) : "me";
}

export function pivotHref(pivot: PivotId): string {
  return `/portfolio?view=${pivot}`;
}

/**
 * A pivot's place in the panorama, which is also how far the plane has
 * travelled: the stylesheets multiply it into a translation for the panels and
 * into a slower drift for the ground behind them (`--panorama-index`).
 *
 * It is derived in two places for one good reason -- a custom property only
 * travels downwards, and the two elements that need it are on different
 * branches -- and so it belongs here, next to the other two names the same
 * `PIVOT_IDS` order gives out, rather than as two `indexOf` calls that can
 * drift apart.
 */
export function pivotIndex(id: PivotId): number {
  return PIVOT_IDS.indexOf(id);
}

export function pivotTabId(id: PivotId): string {
  return `pivot-tab-${id}`;
}

export function pivotPanelId(id: PivotId): string {
  return `pivot-panel-${id}`;
}
