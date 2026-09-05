import {
  Children,
  cloneElement,
  isValidElement,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";
import { MetroTile, type MetroTileProps } from "./MetroTile";
import styles from "./TileGrid.module.css";

function isTile(node: ReactNode): node is ReactElement<MetroTileProps> {
  return isValidElement(node) && node.type === MetroTile;
}

/**
 * Whether a child the grid is about to pass through untouched has a tile
 * buried inside it, at any depth.
 *
 * `Children` sees a Fragment or a wrapper as one opaque child, so the walk has
 * to be done by hand: an element's own `children` prop is as far as anything
 * outside React can see, which is exactly as far as the numbering would need
 * to reach.
 */
function hidesATile(node: ReactNode): boolean {
  if (isTile(node)) return true;
  if (!isValidElement<{ children?: ReactNode }>(node)) return false;
  return Children.toArray(node.props.children).some(hidesATile);
}

/**
 * Refuses, in development, a grid whose tiles are not its own children.
 *
 * `Children.map` hands the grid a Fragment as ONE child and never looks
 * inside, so a tile grouped in one is not merely left unnumbered: the tiles
 * after it take its place in the count, and the delay meant for the leading
 * tile lands on the third one. That is a wrong stagger rather than an absent
 * one, and nothing about it is visible from the outside.
 *
 * Numbering across an arbitrary tree is a bigger promise than this component
 * needs to make -- so it makes the small one loudly instead, in the idiom its
 * sibling `Panorama.assertPanels` already uses: a development-only throw where
 * the shape of the children is part of the contract.
 */
function assertTilesAreOwnChildren(children: ReactNode): void {
  for (const child of Children.toArray(children)) {
    if (isTile(child) || !hidesATile(child)) continue;

    throw new Error(
      "TileGrid numbers only the <MetroTile> children it is given directly. A tile inside a Fragment or a wrapper is skipped, and the tiles after it inherit its entrance delay.",
    );
  }
}

/**
 * The wrapper exists to be a container-query container: the grid inside it
 * derives its row height from the wrapper's own inline size, which is the only
 * way square units survive every viewport without measuring in JavaScript.
 *
 * It also numbers its tiles. A tile's entrance delay is its place in the grid,
 * and a tile cannot know its own place -- a consumer writes tiles in content
 * order and never numbers them, and the same `<MetroTile>` appears in four
 * different grids across the panorama. The grid is the one thing that sees all
 * of them at once, so it hands each one its 0-based DOM position on the way
 * through and `MetroTile` publishes it (`data-tile-index`, `--tile-index`).
 *
 * Only tiles are numbered, and only tiles are cloned: a caption or a rule
 * between two tiles is passed through exactly as written, and does not push the
 * tile after it out by one place. `Children.map` flattens the arrays a
 * `.map()`ing consumer produces, so a mapped grid numbers in the order it was
 * written.
 *
 * What it flattens is arrays and nothing else. A tile grouped inside a Fragment
 * or any other wrapper is invisible to the numbering, and in development that
 * throws rather than staggering the grid wrongly -- see
 * `assertTilesAreOwnChildren`.
 */
export function TileGrid({ children }: PropsWithChildren) {
  if (process.env.NODE_ENV !== "production")
    assertTilesAreOwnChildren(children);

  let place = 0;

  return (
    <div className={styles.frame}>
      <div className={styles.grid} data-tile-grid>
        {Children.map(children, (child) =>
          isTile(child) ? cloneElement(child, { index: place++ }) : child,
        )}
      </div>
    </div>
  );
}
