import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { PhotographyPanel } from "@/components/portfolio/PhotographyPanel";
import { photography, type PhotoItem } from "@/lib/content/photography";

afterEach(cleanup);

/*
 * A synthetic collection, not the shipped one. That is the contract this file
 * exists to pin: a final selection has to be able to replace `pending` entries
 * with `image` ones and leave the hub's markup exactly where it is, so the
 * component takes the collection as a prop and every assertion below is about
 * structure rather than about the two working titles that happen to ship.
 */
const IMAGE: Extract<PhotoItem, { kind: "image" }> = {
  id: "sample-frame",
  kind: "image",
  title: "Sample frame",
  note: "One approved frame.",
  src: "/portrait.jpg",
  alt: "A described photograph, written for this hub.",
  width: 752,
  height: 648,
  focus: "center",
};

const PENDING: readonly PhotoItem[] = [
  {
    id: "pending-one",
    kind: "pending",
    title: "streets / in transit",
    note: "Selection in progress",
  },
  {
    id: "pending-two",
    kind: "pending",
    title: "light / geometry",
    note: "Selection in progress",
  },
];

const ITEMS: readonly PhotoItem[] = [IMAGE, ...PENDING];

function tiles(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>("[data-tile-role]")];
}

it("leads the hub with the photograph it was given", () => {
  render(<PhotographyPanel items={ITEMS} />);

  const picture = screen.getByRole("img", { name: IMAGE.alt });
  const tile = picture.closest("[data-tile-role]");

  expect(tile).toHaveAttribute("data-tile-size", "large");
  expect(tile).toHaveAttribute("data-tile-role", "display");
  // The photograph is the tile, not something inside its padded content box.
  expect(
    picture.closest("[data-tile-role]")?.firstElementChild,
  ).toContainElement(picture);
  expect(picture).toHaveAttribute("width", String(IMAGE.width));
  expect(picture).toHaveAttribute("height", String(IMAGE.height));
  expect(screen.getAllByRole("img")).toHaveLength(1);
});

it("marks every unmade selection on the tile face", () => {
  render(<PhotographyPanel items={ITEMS} />);

  const pending = tiles().filter((tile) =>
    /selection in progress/i.test(tile.textContent ?? ""),
  );

  expect(pending).toHaveLength(PENDING.length);
  for (const tile of pending) {
    expect(tile).toHaveAttribute("data-tile-size", "wide");
    expect(tile).toHaveAttribute("data-tile-role", "display");
  }
});

it("captions every frame exactly once", () => {
  render(<PhotographyPanel items={ITEMS} />);

  expect(tiles()).toHaveLength(ITEMS.length);

  for (const item of ITEMS) {
    const caption = screen.getAllByText(item.title);
    expect(caption, item.id).toHaveLength(1);
    // The caption is the tile's own bottom-edge name, so it is the last child
    // of the tile rather than a second block underneath it.
    const tile = caption[0].closest("[data-tile-role]") as HTMLElement;
    expect(tile.lastElementChild, item.id).toBe(caption[0]);
  }

  expect(within(tiles()[0]).getByText(IMAGE.note)).toBeVisible();
});

it("adds no interactive owner to a hub of pictures", () => {
  const { container } = render(<PhotographyPanel items={ITEMS} />);

  expect(container.querySelector("a")).toBeNull();
  expect(container.querySelector("button")).toBeNull();
  expect(screen.queryAllByRole("heading")).toEqual([]);
});

it("lays a hidden photographic backdrop behind the hub", () => {
  const { container } = render(<PhotographyPanel items={ITEMS} />);

  const hub = container.querySelector('[data-backdrop="photo"]');
  expect(hub).not.toBeNull();

  const backdrop = hub?.firstElementChild as HTMLElement;
  expect(backdrop).toHaveAttribute("aria-hidden", "true");
  // The backdrop is atmosphere, never a second copy of the collection: it adds
  // no named image to the tree, which is why `getAllByRole("img")` above is 1.
  expect(backdrop.querySelector("img")).toHaveAttribute("alt", "");
  expect(backdrop.querySelector("img")).toHaveAttribute("loading", "lazy");
  /*
   * `sizes` describes the layer, not the box it covers. All four pivots are on
   * the panorama plane, so this one is fetched on whichever pivot a reader
   * lands on whatever `loading` says; at `100vw` that was a full-width variant
   * of something greyscale, blurred 24px and painted at 12%. The E2E asserts
   * the variant width the browser actually picks from this.
   */
  expect(backdrop.querySelector("img")).toHaveAttribute("sizes", "128px");
});

it("ships a collection of the same shape it renders", () => {
  render(<PhotographyPanel />);

  expect(tiles()).toHaveLength(photography.length);
  expect(photography.filter(({ kind }) => kind === "image")).toHaveLength(1);
  expect(photography.filter(({ kind }) => kind === "pending")).toHaveLength(2);
  // The one approved photograph describes itself differently from Me's portrait
  // tile: the same asset, but there the tile is the person and here it is the
  // photograph.
  const shipped = photography.find(({ kind }) => kind === "image");
  expect(shipped?.kind === "image" && shipped.alt).not.toBe(
    "Portrait of Ajmal Hassan",
  );
});

/*
 * The crop is steered by `focus`, and `object-position` is the only thing that
 * carries it. The map had one shipped value (`center`) and no test at all, so
 * every other branch could be wrong -- forcing the whole map to `0% 100%`
 * passed the suite, and the E2E caught it only because it pins the literal
 * position the one shipped photograph happens to use.
 */
it.each([
  ["top", "50% 0%"],
  ["left", "0% 50%"],
] as const)("crops a %s-focused frame to %s", (focus, position) => {
  render(<PhotographyPanel items={[{ ...IMAGE, focus }]} />);

  expect(screen.getByRole("img", { name: IMAGE.alt })).toHaveStyle({
    objectPosition: position,
  });
});

/*
 * A collection with nothing in it says so. Not reachable from shipped content,
 * which is why it is worth stating: the collection is a prop whose whole design
 * story is that it will be replaced, and the reading pivot already answers the
 * same question the same way.
 */
it("says the selection is unmade when the collection is empty", () => {
  const { container } = render(<PhotographyPanel items={[]} />);

  expect(tiles()).toHaveLength(0);
  expect(container.querySelector("[data-tile-grid]")).toBeNull();
  expect(screen.getByText("Photography selection in progress.")).toBeVisible();
});
