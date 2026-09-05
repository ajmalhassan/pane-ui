/**
 * How much copy a MetroTile face holds, per tile size.
 *
 * It lives in its own module rather than beside the Projects validator that
 * measured it because it is a fact about `MetroTile`, not about projects, and
 * a second content boundary now reads it. Importing it from
 * `lib/content/projects.ts` would have run `validateProjects` over the whole
 * shipped project array as a side effect of validating photography -- and
 * `content/photography.ts` is imported by a client component, so it would also
 * have pulled every case study's prose into the browser bundle.
 */

/** The tile spans a budget is stated for. `small` carries a glyph, not copy. */
export const TILE_BUDGET_SIZES = ["wide", "large", "hero"] as const;
export type TileBudgetSize = (typeof TILE_BUDGET_SIZES)[number];

/**
 * What a face can hold, in characters, per tile size.
 *
 * Every number is measured rather than guessed, at the frame where the size is
 * tightest -- which is 320px for all four budgets, because that is where the
 * grid unit is smallest (67.5px) even though the type steps are smallest at
 * 768px (see MetroTile.module.css). Inner widths there: `hero` 264px, `large`
 * 117px, `wide` 125px.
 *
 * - `label`: one line, never wrapped, ellipsised on overflow. 117px (the
 *   `large` tile, the tightest of the three) over a measured 5.36px per
 *   character = 21.8 -> **21**, and the same number serves every size because
 *   `large` is the binding one.
 * - `headline`: two clamped lines of `--tile-title`. Capacity is inner width x
 *   2: `hero` 528px at 18.4px type, `large` 234px at 16px, `wide` 250px at
 *   13.6px. Word wrap never fills both lines, so the budgets stop short of the
 *   arithmetic maximum: the longest string measured on each size sits at
 *   64%/77%/72% of its capacity. `large` is additionally checked at 768, where
 *   the tile is 138.6px wide at the 20px step -- tighter in characters than
 *   320 is, and the reason its budget is 23 rather than 26. It was 24 until the
 *   worst-case E2E below measured it: 24 characters of this face's own prose
 *   wrap to three lines in a 117px box at 16px and the `-webkit-line-clamp: 2`
 *   eats the third, at 320 and again at 768.
 * - `claim`: two clamped lines of `--tile-body` (three from 48rem, which is
 *   slack). `hero` 528px at 12.8px type, `large` 234px at the same.
 *   Zero on `wide`, which paints no body line at any width -- a claim there
 *   would be invisible, so it is an authoring error rather than a truncation.
 * - `value`: one line, never wrapped, ellipsised on overflow. The type is huge
 *   (40px on `large` at 320), so the budget is small: 117px over a measured
 *   19.38px per character = 6.03 -> **6**.
 *   Zero on `wide`, and not for want of width: a `wide` tile is one grid unit
 *   tall, `tileHeadline` is required on every size, and the numeral and the
 *   headline are each budgeted the *whole* copy region there
 *   (`.small, .wide { --tile-title-budget: var(--tile-copy) }`,
 *   MetroTile.module.css). A numeral above a headline needs 28 + 4 + 31.3 =
 *   63.3px of a 34px region at 320, so it is an authoring error rather than a
 *   truncation.
 *
 * These are budgets for *prose*, and the 5.36px above is an average over site
 * copy rather than a maximum: 21 of the widest lowercase glyph measure 205.8px
 * in that same 117px box. No character count can promise otherwise -- a string
 * of N characters wraps into as many lines as its word breaks demand -- so what
 * these numbers are is a calibrated authoring guard, not a proof.
 *
 * `tests/e2e/portfolio.spec.ts` measures the real rectangles at seven frames,
 * and re-measures these numbers themselves at the two binding frames by
 * stretching each face's own copy to the whole budget on a cloned tile -- so a
 * budget that has gone wrong, or a `--tile-pad` / `--metro-text-label` /
 * column-count change that made it wrong, fails there rather than waiting for
 * real copy to use the slack.
 */
export const TILE_COPY_BUDGET = {
  hero: { label: 21, headline: 46, claim: 66, value: 6 },
  large: { label: 21, headline: 23, claim: 30, value: 6 },
  wide: { label: 21, headline: 30, claim: 0, value: 0 },
} as const satisfies Record<
  TileBudgetSize,
  Record<"label" | "headline" | "claim" | "value", number>
>;
