import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it } from "vitest";
import { MetroTile } from "@/components/metro/MetroTile";
import { TileGrid } from "@/components/metro/TileGrid";

afterEach(cleanup);

function tiles(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>("[data-tile-role]")];
}

/*
 * The entrance stagger is a delay per tile, and the delay is the tile's own
 * place in the grid. Nothing about that place is knowable from inside a tile --
 * a consumer writes tiles in content order and never numbers them -- so the
 * grid, which is the only thing that sees all of them at once, hands each one
 * its index on the way through.
 */
it("numbers its tiles in DOM order, from zero", () => {
  const { container } = render(
    <TileGrid>
      <MetroTile label="first" role="display">
        <span>a</span>
      </MetroTile>
      <MetroTile href="/b" label="second" role="navigation">
        <span>b</span>
      </MetroTile>
      <MetroTile
        accessibleLabel="third evidence"
        items={[<span key="c">c</span>, <span key="d">d</span>]}
        label="third"
        role="live"
      />
      <MetroTile
        back={<span>f</span>}
        front={<span>e</span>}
        label="fourth"
        role="reveal"
      />
    </TileGrid>,
  );

  const found = tiles(container);
  expect(found.map((tile) => tile.dataset.tileIndex)).toEqual([
    "0",
    "1",
    "2",
    "3",
  ]);
  expect(
    found.map((tile) => tile.style.getPropertyValue("--tile-index")),
  ).toEqual(["0", "1", "2", "3"]);
});

it("numbers tiles a consumer produced with a map, in the order they were written", () => {
  const { container } = render(
    <TileGrid>
      {["one", "two", "three"].map((label) => (
        <MetroTile key={label} label={label} role="display">
          <span>{label}</span>
        </MetroTile>
      ))}
    </TileGrid>,
  );

  expect(tiles(container).map((tile) => tile.dataset.tileIndex)).toEqual([
    "0",
    "1",
    "2",
  ]);
});

/*
 * A grid is not required to hold only tiles, and anything else in it is left
 * exactly as written -- no cloned props, no index, no counted place. The
 * counter is a tile counter, so a caption between two tiles does not push the
 * second one's delay out by 40ms.
 */
it("leaves every other child untouched and out of the numbering", () => {
  const { container } = render(
    <TileGrid>
      <p data-testid="aside">a note between tiles</p>
      <MetroTile label="first" role="display">
        <span>a</span>
      </MetroTile>
      <p>another</p>
      <MetroTile label="second" role="display">
        <span>b</span>
      </MetroTile>
      {null}
    </TileGrid>,
  );

  expect(tiles(container).map((tile) => tile.dataset.tileIndex)).toEqual([
    "0",
    "1",
  ]);
  const aside = screen.getByTestId("aside");
  expect(aside).not.toHaveAttribute("data-tile-index");
  expect(aside.style.getPropertyValue("--tile-index")).toBe("");
});

/*
 * `index` is the grid's to give. A tile that already carries one -- from a
 * consumer, or from a second grid it was somehow nested in -- is renumbered by
 * the grid it is actually laid out in, because that is the order a reader sees.
 */
it("renumbers a tile that arrived with an index of its own", () => {
  const { container } = render(
    <TileGrid>
      <MetroTile index={7} label="first" role="display">
        <span>a</span>
      </MetroTile>
    </TileGrid>,
  );

  expect(tiles(container)[0].dataset.tileIndex).toBe("0");
});

/*
 * `Children.map` hands the grid a Fragment as ONE child and never looks inside
 * it. Measured before this guard existed, `<><a/><b/></><c/>` numbered
 * `(none), (none), "0"`: the first two tiles arrive with no delay at all and
 * the third takes the leading tile's, so the stagger is wrong rather than
 * missing, in production and in silence.
 *
 * Grouping tiles in a Fragment is ordinary React -- this file's own sibling
 * `ProfileTiles.claimFaces` does it -- so the grid says what it can number
 * instead of guessing.
 */
it("refuses tiles grouped inside a Fragment in development", () => {
  expect(() =>
    renderToStaticMarkup(
      <TileGrid>
        <>
          <MetroTile label="first" role="display">
            <span>a</span>
          </MetroTile>
          <MetroTile label="second" role="display">
            <span>b</span>
          </MetroTile>
        </>
        <MetroTile label="third" role="display">
          <span>c</span>
        </MetroTile>
      </TileGrid>,
    ),
  ).toThrow(/given directly/i);
});

it("refuses a tile buried in a wrapper, however deep", () => {
  expect(() =>
    renderToStaticMarkup(
      <TileGrid>
        <div>
          <p>
            <MetroTile label="first" role="display">
              <span>a</span>
            </MetroTile>
          </p>
        </div>
      </TileGrid>,
    ),
  ).toThrow(/TileGrid/);
});

/* A grid of ordinary children is not a grid to complain about. */
it("passes a grid whose non-tile children hold no tiles", () => {
  expect(() =>
    renderToStaticMarkup(
      <TileGrid>
        <p>a note between tiles</p>
        <MetroTile label="first" role="display">
          <span>a</span>
        </MetroTile>
      </TileGrid>,
    ),
  ).not.toThrow();
});
