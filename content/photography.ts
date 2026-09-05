import type { PhotoItem } from "@/lib/content/photography";

/**
 * The collection as it stands: one approved photograph, and two working titles
 * whose selections have not been made. The two placeholders are deliberate --
 * a picture hub that quietly showed two decorative stock frames would be
 * claiming a body of work that does not exist yet.
 *
 * The portrait's alt is written for *this* hub. Me's portrait tile keeps
 * "Portrait of Ajmal Hassan", which is what that tile is for; here the picture
 * is the content, so the description is of the photograph.
 *
 * `width`/`height` are the source's own intrinsic pixels, and they do two
 * jobs: `next/image` reserves the box with them so nothing shifts as the image
 * arrives, and a human reads them to choose the span. Nothing derives the span
 * from them -- `PHOTO_TILE_SIZE` in `lib/content/photography.ts` says an
 * `image` is drawn `large`, and 752x648 is 1.16:1 against that square, so
 * `object-fit: cover` cuts 13.8% of the width. A source with a materially
 * different ratio is a span decision to make by hand, not one this file makes.
 *
 * Every entry is checked at import by `validatePhotography`; this file is the
 * data and `lib/content/photography.ts` is the boundary.
 */
export const photography = [
  {
    id: "portrait",
    kind: "image",
    title: "Portrait",
    note: "A face behind the systems.",
    src: "/portrait.jpg",
    alt: "Ajmal Hassan in profile, black and white: curly hair, glasses, and a plain dark shirt against an out-of-focus outdoor background.",
    width: 752,
    height: 648,
    focus: "center",
  },
  {
    id: "streets-in-transit",
    kind: "pending",
    title: "streets / in transit",
    note: "Selection in progress",
  },
  {
    id: "light-and-geometry",
    kind: "pending",
    title: "light / geometry",
    note: "Selection in progress",
  },
] satisfies PhotoItem[];
