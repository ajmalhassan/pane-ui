import Image from "next/image";
import { MetroTile, TileGrid, tileTextClass } from "@/components/metro";
import {
  photography,
  PHOTO_TILE_SIZE,
  type PhotoFocus,
  type PhotoItem,
  type PhotoTileSize,
} from "@/lib/content/photography";
import styles from "./PortfolioPanorama.module.css";

type Props = {
  items?: readonly PhotoItem[];
};

/** The named focus as an `object-position`, which is what a crop is steered by. */
const FOCUS_POSITION: Record<PhotoFocus, string> = {
  center: "50% 50%",
  top: "50% 0%",
  bottom: "50% 100%",
  left: "0% 50%",
  right: "100% 50%",
};

/**
 * What a span is worth in viewport width, so the browser picks a variant for
 * the rectangle the tile actually has.
 *
 * This is the tile span expressed a second way, and the two used to be written
 * nine lines apart: the grid is four columns below 48rem and eight above, so a
 * two-column `large` is 50vw and then 25vw. Keyed by the same span the tile is
 * given, so changing one changes both. Only the spans that actually carry an
 * image are listed; a `pending` plate has no source to size.
 */
const SPAN_SIZES = {
  large: "(min-width: 48rem) 25vw, 50vw",
} as const satisfies Partial<Record<PhotoTileSize, string>>;

/**
 * Photography as a picture hub.
 *
 * The one approved photograph leads at 2x2 -- the square span nearest its
 * 752x648 source, so `object-fit: cover` cuts 13.8% of the width and nothing is
 * stretched -- and the two working titles stand beside it as 2x1 tiles that say
 * on their faces that the selection has not been made. 4 + 2 + 2 units pack
 * into two hole-free rows on a phone.
 *
 * The collection is a prop so a final selection replaces `pending` entries with
 * `image` ones and this file does not change: the composition below reads
 * `kind`, never a photograph's name.
 */
export function PhotographyPanel({ items = photography }: Props) {
  return (
    <div className={styles.panelContent}>
      <div className={styles.pictureHub} data-backdrop="photo">
        {/*
         * The approved photographic background: the same portrait, blurred and
         * darkened to atmosphere at 12%. It is clipped to this block, so it
         * never reaches the panorama heading above it or the app bar below --
         * the two surfaces the spec keeps clear of imagery -- and the tiles
         * stay opaque over it.
         *
         * `sizes` describes the layer rather than the box it covers, but a
         * `srcset` candidate is chosen in device pixels, so `sizes` alone
         * still asks for 128px x DPR -- 352px on the E2E's own Pixel 5
         * project, indistinguishable from a 1920px source only at DPR 1.
         * `quality={30}` caps the same layer in device pixels instead: it is
         * greyscale, blurred 24px and taken to 12%, so the drop is invisible
         * at every DPR, and it roughly halves the bytes on top of what
         * `sizes` alone saves. At `100vw` the browser fetched a full-width
         * variant of an invisible layer on every pivot, which on a phone cost
         * several times the bytes of the portrait a reader can actually see.
         */}
        <span aria-hidden="true" className={styles.hubBackdrop}>
          <Image
            alt=""
            height={648}
            loading="lazy"
            quality={30}
            sizes="128px"
            src="/portrait.jpg"
            width={752}
          />
        </span>

        <p className={styles.hubLede}>
          A quiet counterpoint to engineering: travel, light, and fragments of
          place. This collection is still developing.
        </p>

        {items.length ? (
          <TileGrid>
            {items.map((item) =>
              item.kind === "image" ? (
                <MetroTile
                  accent="photo"
                  key={item.id}
                  label={item.title}
                  media={
                    <Image
                      alt={item.alt}
                      height={item.height}
                      sizes={SPAN_SIZES[PHOTO_TILE_SIZE.image]}
                      src={item.src}
                      style={{
                        objectPosition: FOCUS_POSITION[item.focus ?? "center"],
                      }}
                      width={item.width}
                    />
                  }
                  role="display"
                  size={PHOTO_TILE_SIZE.image}
                >
                  <span className={`${tileTextClass.body} ${styles.tileFoot}`}>
                    {item.note}
                  </span>
                </MetroTile>
              ) : (
                <MetroTile
                  accent="ink"
                  key={item.id}
                  label={item.title}
                  role="display"
                  size={PHOTO_TILE_SIZE.pending}
                >
                  <strong className={tileTextClass.title}>{item.note}</strong>
                </MetroTile>
              ),
            )}
          </TileGrid>
        ) : (
          /* The same plate the reading pivot shows for the same reason: a hub
             whose collection is empty says so, rather than drawing a lede over
             a grid with nothing in it. Not reachable from shipped content --
             which is exactly why it is worth stating, since the collection is
             a prop whose whole design story is that it will be replaced. */
          <p className={styles.emptyState}>
            Photography selection in progress.
          </p>
        )}
      </div>
    </div>
  );
}
