import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { ProjectsPanel } from "@/components/portfolio/ProjectsPanel";
import { projects } from "@/lib/content/projects";

it("gives every project exactly one full-tile destination", () => {
  const { container } = render(<ProjectsPanel projects={projects} />);

  const tiles = screen.getAllByRole("link");
  expect(tiles).toHaveLength(projects.length);

  projects.forEach((project, index) => {
    const tile = tiles[index];
    expect(tile).toHaveAttribute("href", `/projects/${project.slug}`);
    expect(tile).toHaveAttribute("data-tile-role", "navigation");
    expect(tile.querySelector("a")).toBeNull();
  });

  expect(container.querySelector("button")).toBeNull();
});

it("keeps project tiles as the grid's direct children while opting them into route motion", () => {
  const { container } = render(<ProjectsPanel projects={projects} />);
  const grid = container.querySelector("[data-tile-grid]");

  expect(grid?.children).toHaveLength(projects.length);
  for (const tile of grid?.children ?? []) {
    expect(tile).toHaveAttribute("data-project-tile", "true");
    expect(tile).toHaveAttribute("data-tile-role", "navigation");
  }
});

/*
 * The panel used to pair a full-tile flip button with a separately positioned
 * "View <project>" link -- two owners over one rectangle, and the collision
 * that came with it. Neither may come back.
 */
it("keeps a second interactive owner out of every tile", () => {
  render(<ProjectsPanel projects={projects} />);

  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.queryByRole("link", { name: /^View / })).toBeNull();
});

it("leads the block with one prominent system tile", () => {
  render(<ProjectsPanel projects={projects} />);

  expect(
    screen.getAllByRole("link").map((tile) => tile.dataset.tileSize),
  ).toEqual(["hero", "large", "large", "wide", "wide"]);
});

/*
 * Evidence-led: the face says why the project matters, so a reader never has to
 * open a case study to find out. It used to print the project's name as the
 * headline AND as the caption, which said nothing twice.
 */
it("puts evidence on every face and the destination's name underneath", () => {
  render(<ProjectsPanel projects={projects} />);
  const tiles = screen.getAllByRole("link");

  projects.forEach((project, index) => {
    const tile = tiles[index];
    const at = project.slug;

    const headline = within(tile).getByText(project.tileHeadline, {
      selector: "strong",
    });
    expect(headline, at).toBeVisible();

    const caption = tile.lastElementChild;
    expect(caption?.textContent, at).toBe(project.tileLabel);
    expect(caption?.textContent, at).not.toBe(project.tileHeadline);

    // The numeral is the project's own `metric`, not a second copy of it.
    if (project.showsMetric && project.metric) {
      expect(within(tile).getByText(project.metric), at).toBeVisible();
    }

    // Present on the sizes that paint one; whether it is drawn is the size's
    // line budget, which the layout tests measure at real widths.
    if (project.tileClaim) {
      expect(within(tile).getByText(project.tileClaim), at).toBeInTheDocument();
    }
  });
});

/*
 * The panorama heading is the only "projects" on the page, and the eyebrow
 * above it is gone for good.
 */
it("adds no second heading and no eyebrow of its own", () => {
  const { container } = render(<ProjectsPanel projects={projects} />);

  expect(screen.queryByRole("heading")).toBeNull();
  expect(container.textContent?.toLowerCase()).not.toContain(
    "selected systems",
  );
  expect(container.textContent?.toLowerCase()).not.toMatch(/^\s*projects\s*$/);
});

/*
 * The whole tile is the link, so its accessible name is everything on the face
 * plus the caption. It has to read as one sentence a screen reader user can act
 * on -- the evidence, then where the tile goes -- and it must not say the name
 * twice, which is what the old face-equals-caption tile did.
 */
it("names each link by its evidence and then its destination", () => {
  render(<ProjectsPanel projects={projects} />);
  const tiles = screen.getAllByRole("link");

  projects.forEach((project, index) => {
    const parts = [
      project.showsMetric ? project.metric : undefined,
      project.tileHeadline,
      project.tileClaim,
      project.tileLabel,
    ].filter(Boolean);

    expect(tiles[index], project.slug).toHaveAccessibleName(parts.join(" "));
    /*
     * And the same string as raw text, which is the assertion that bites.
     * jsdom's name computation inserts a separator between elements whether or
     * not the DOM has one, so it cannot see a missing space -- deleting the
     * space nodes leaves it passing. Chromium does NOT: it concatenates
     * adjacent inline boxes exactly as they are, and announced this tile as
     * "Revenue contributionlead platform". `textContent` is what it joins.
     */
    expect(tiles[index].textContent, project.slug).toBe(parts.join(" "));
  });
});
