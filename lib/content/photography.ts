import { photography as photographyData } from "@/content/photography";
import { TILE_COPY_BUDGET, type TileBudgetSize } from "./tileBudget";

/**
 * Which part of a source survives the crop when its ratio is not the tile's.
 * A picture tile fills its rectangle with `object-fit: cover`, so something is
 * always cut off a source that is wider or taller than the span it is given;
 * this says what to keep, not how much to lose.
 */
export type PhotoFocus = "center" | "top" | "bottom" | "left" | "right";

/**
 * One frame of the collection.
 *
 * The union is the whole point of the shape: an approved selection replaces a
 * `pending` entry with an `image` one and the hub's markup does not move. A
 * `pending` entry carries no `src` and no `alt` to invent -- final images and
 * their alt text are a content-approval requirement, and the type makes an
 * unapproved photograph unrepresentable rather than merely discouraged.
 *
 * The type stops at *missing*; `validatePhotography` below is what stops
 * *empty*, which is the distinction `validateProjects` exists because of. An
 * `image` with `alt: ""` and `width: 0` satisfies this union and renders in
 * silence.
 */
export type PhotoItem =
  | {
      id: string;
      kind: "image";
      /** The working title: the tile's caption, and the figure's own name. */
      title: string;
      /** The line under the title -- what the frame is, in the author's words. */
      note: string;
      src: string;
      alt: string;
      width: number;
      height: number;
      focus?: PhotoFocus;
    }
  | {
      id: string;
      kind: "pending";
      title: string;
      /** Painted on the tile face, so the gap is stated rather than implied. */
      note: string;
    };

export type PhotoKind = PhotoItem["kind"];

/**
 * The span each kind is drawn at, and the single place the hub and this
 * validator agree on it: an approved photograph leads at 2x2 (`large`, the
 * square span nearest the shipped source's 1.16:1) and a plate for a selection
 * that has not been made stands beside it at 2x1 (`wide`).
 *
 * `PhotographyPanel` reads the same map for its `size` prop and for the
 * `sizes` attribute that has to agree with it, so a span decision is made once.
 */
export const PHOTO_TILE_SIZE = {
  image: "large",
  pending: "wide",
} as const satisfies Record<PhotoKind, TileBudgetSize>;

export type PhotoTileSize = (typeof PHOTO_TILE_SIZE)[PhotoKind];

/**
 * Grid units a span costs, from `MetroTile.module.css`: `large` is two columns
 * by two rows, `wide` two by one. Only the two spans this collection draws are
 * named -- a third would have to be added here and to `PHOTO_TILE_SIZE`
 * together, which is the point.
 */
const SPAN_UNITS = {
  large: 4,
  wide: 2,
} as const satisfies Record<PhotoTileSize, number>;

/**
 * Which face line a `note` is painted as, per kind, and therefore which budget
 * it is written against.
 *
 * On an `image` the note is `.body` under the photograph (`claim`); on a
 * `pending` plate it *is* the face, painted as `.title` (`headline`). Both
 * happen to be 30 characters today; they are read from the table rather than
 * written down here so they stay whatever the table says.
 */
const NOTE_BUDGET_FIELD = {
  image: "claim",
  pending: "headline",
} as const satisfies Record<
  PhotoKind,
  keyof (typeof TILE_COPY_BUDGET)["large"]
>;

function budgetFor(item: PhotoItem): { label: number; note: number } {
  const budget = TILE_COPY_BUDGET[PHOTO_TILE_SIZE[item.kind]];

  return { label: budget.label, note: budget[NOTE_BUDGET_FIELD[item.kind]] };
}

/**
 * The boundary every content file in this repo comes through: typed at rest,
 * checked at import, with the rejection messages under test.
 *
 * What the union cannot say, and this does:
 *
 * - a required string that is *present and empty* -- `alt: ""` on an approved
 *   photograph is a picture tile with no description at all, and it renders
 *   without complaint;
 * - a `src` that is not rooted, which `next/image` needs to serve a variant;
 * - zero or negative intrinsic dimensions, which are what stop the layout
 *   shifting while the image loads;
 * - two frames under one `id`, which React resolves by dropping one of them;
 * - copy longer than the face it is painted on can hold. The caption is the
 *   tile `label` (21 characters on both spans) and the note is the body or the
 *   headline depending on the kind. `"streets / in transit"` ships at 20 of 21,
 *   which is one character of slack held today by an authoring tripwire rather
 *   than by a seven-frame browser sweep noticing an ellipsis.
 */
export function validatePhotography(items: readonly PhotoItem[]): PhotoItem[] {
  const ids = new Set<string>();

  return items.map((item) => {
    for (const field of ["id", "title", "note"] as const) {
      if (!item[field].trim()) {
        throw new Error(`Photo ${field} is required`);
      }
    }

    if (ids.has(item.id)) {
      throw new Error(`Duplicate photo id: ${item.id}`);
    }

    ids.add(item.id);

    if (item.kind === "image") {
      if (!item.alt.trim()) {
        throw new Error(
          `Photo ${item.id} has no alt; an image's alt is the only description of a picture tile there is`,
        );
      }

      if (!item.src.startsWith("/")) {
        throw new Error(
          `Photo ${item.id} src must be rooted at the public directory: ${item.src || "(empty)"}`,
        );
      }

      for (const field of ["width", "height"] as const) {
        if (!(item[field] > 0)) {
          throw new Error(
            `Photo ${item.id} ${field} must be a positive number of source pixels; got ${item[field]}`,
          );
        }
      }
    }

    const budget = budgetFor(item);
    const size = PHOTO_TILE_SIZE[item.kind];

    for (const [field, text, allowed] of [
      ["title", item.title, budget.label],
      ["note", item.note, budget.note],
    ] as const) {
      if (text.length > allowed) {
        throw new Error(
          `Photo ${item.id} ${field} is ${text.length} characters; a ${size} tile holds ${allowed}`,
        );
      }
    }

    return item;
  });
}

export const photography = validatePhotography(photographyData);

/**
 * The grid units the collection spends, summed from the spans it actually
 * asks for rather than written down beside them.
 *
 * The picture hub packs to two hole-free rows because 4 + 2 + 2 is a multiple
 * of four (the column count on a phone) and of eight. `tests/e2e/portfolio.spec.ts`
 * asserts the rendered grid against this number, so an approved selection that
 * changes the unit total moves the expectation with it instead of leaving the
 * E2E asserting a number the hub no longer draws.
 */
export const PHOTOGRAPHY_UNITS = photography.reduce(
  (total, item) => total + SPAN_UNITS[PHOTO_TILE_SIZE[item.kind]],
  0,
);
