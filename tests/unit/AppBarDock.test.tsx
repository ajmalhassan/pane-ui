import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AppBar } from "@/components/metro/AppBar";
import { AppBarDock } from "@/components/metro/AppBarDock";
import dockStyles from "@/components/metro/AppBarDock.module.css";
import detailStyles from "@/components/portfolio/detailSurface.module.css";
import panoramaStyles from "@/components/portfolio/PortfolioPanorama.module.css";

/*
 * The dock is the fixed strip the application bar sits in, and there is one of
 * it. These tests pin what a consumer relies on -- that the bar it hands over
 * is rendered inside the docked element, and that the reserve the element's
 * stylesheet publishes is on every page that carries one -- because the
 * panorama and the four detail surfaces all reach for it and a second
 * implementation is exactly what the extraction exists to prevent.
 */
it("renders the application bar inside the fixed dock", () => {
  render(
    <AppBarDock>
      <AppBar
        actions={[{ label: "Projects", href: "/portfolio?view=projects", icon: "back" }]}
      />
    </AppBarDock>,
  );

  const bar = screen.getByTestId("app-bar");
  const dock = bar.parentElement;

  expect(dock).not.toBeNull();
  expect(dock).toHaveClass(dockStyles.dock);
  expect(dock?.tagName).toBe("DIV");
});

/*
 * The page shell reserves the bar's height from the same module that draws the
 * bar's box, so the reserve and the bar can never be changed apart. Exported as
 * a class the consumers' own stylesheets compose, which is what this asserts
 * exists at all -- a typo in a `composes` source silently resolves to
 * `undefined` and takes the reserve with it.
 */
it("publishes the docked-page class its consumers compose", () => {
  expect(dockStyles.dockedPage).toBeTruthy();
  expect(dockStyles.dock).toBeTruthy();
  expect(dockStyles.dockedPage).not.toBe(dockStyles.dock);
});

/*
 * And every page that carries a bar actually composes it. This is the assertion
 * a `composes` line needs: a typo in the class name resolves to nothing, builds
 * clean, and takes the app bar's reserve off the page it names -- the failure
 * looks like 96px of copy under a bar, three routes away from the edit.
 */
it("is the one reserve every docked page composes", () => {
  for (const [surface, className] of [
    ["the panorama", panoramaStyles.shell],
    ["the detail surfaces", detailStyles.page],
  ] as const) {
    expect(className, surface).toBeTruthy();
    expect(className.split(" "), surface).toContain(dockStyles.dockedPage);
  }
});
