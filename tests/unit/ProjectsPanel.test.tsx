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
    expect(
      within(tile).getByText(project.title, { selector: "strong" }),
    ).toBeVisible();
    // Present on every tile; whether it is painted is the size's line budget,
    // which the layout tests measure at real widths.
    expect(within(tile).getByText(project.summary)).toBeInTheDocument();
    expect(tile.querySelector("a")).toBeNull();
  });

  expect(container.querySelector("button")).toBeNull();
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
  ).toEqual(["hero", "large", "large", "wide"]);
});
