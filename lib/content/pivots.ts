export const PIVOT_IDS = ["me", "projects", "blog", "photography"] as const;
export type PivotId = (typeof PIVOT_IDS)[number];

export function parsePivot(value: string | string[] | undefined): PivotId {
  if (typeof value !== "string") return "me";
  return PIVOT_IDS.includes(value as PivotId) ? (value as PivotId) : "me";
}

export function pivotHref(pivot: PivotId): string {
  return `/?view=${pivot}`;
}

export function pivotTabId(id: PivotId): string {
  return `pivot-tab-${id}`;
}

export function pivotPanelId(id: PivotId): string {
  return `pivot-panel-${id}`;
}
