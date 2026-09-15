import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { getPostSummaries } from "../../lib/content/posts";

/*
 * ===========================================================================
 * The committed axe scan
 * ===========================================================================
 *
 * The spec names what this has to cover: "axe scans include Me, Projects,
 * Blog, Photography, one project detail, one blog detail, and open Contact".
 * Until now it stopped at the four pivots plus `/blog` and `/resume` on one
 * viewport, which left three of those seven unscanned -- the two detail routes
 * a reader reaches from a tile, and the panel that is the only overlay in the
 * application.
 *
 * Three axes, and each one has caught something real in this project:
 *
 *  - ROUTE. A detail route is a different document with a different heading
 *    hierarchy and its own links; the contact panel is a fixed overlay with a
 *    close button and a focus contract.
 *  - PROJECT. `chromium` and `mobile` differ by more than width: the mobile
 *    project is a Pixel 5 with a touch pointer and a 2.75 device pixel ratio,
 *    and coarse-pointer media queries change which controls are painted (the
 *    application bar drops its overflow command below 48rem).
 *  - FRAME. 320x568 and 1440x900 are two of the four required review frames,
 *    and the layout is genuinely different at each: at 320 the app bar keeps
 *    its labels and the tile grid is four columns; at 1440 it is eight and the
 *    supporting note lines are painted.
 *
 * That is 9 routes x 2 projects x 2 frames = 36 scans, in about 20 seconds.
 * The matrix is the point: a violation that only exists on a narrow mobile
 * detail route is exactly the kind this suite used to miss.
 *
 * WHAT THIS CANNOT SEE. axe abstains from `color-contrast` wherever it cannot
 * resolve the backdrop, and every pivot of this application paints a CSS
 * background image (the per-pivot atmosphere) behind its type, so tile copy
 * comes back as an *incomplete* rather than a pass. Those abstentions are not
 * failures and are not asserted here; the replacement is the glyph-accurate
 * sweep in `portfolio.spec.ts` ("every line clears 4.5:1, ground and tile
 * alike"), which screenshots each text node against its real painted backdrop
 * and measures the worst inked pixel. Read the two together: this file says
 * the semantics are sound, that one says the type is legible.
 */

const FRAMES = [
  { width: 320, height: 568 },
  { width: 1440, height: 900 },
] as const;

/**
 * The newest note's own page, derived the way `portfolio.spec.ts` derives it
 * rather than pinned to a slug: the drafts are placeholders and the one at the
 * top of the list changes when the content does. A hard-coded slug here would
 * turn a content edit into a failing accessibility suite pointing at a 404.
 */
let newestHref = "";

test.beforeAll(async () => {
  const posts = await getPostSummaries();

  expect(
    posts.length,
    "the blog needs at least one note to scan",
  ).toBeGreaterThan(0);

  newestHref = `/blog/${posts[0].slug}`;
});

/**
 * Opens the contact panel the way a reader does -- the app bar's own command --
 * and waits for the state the panel itself publishes rather than for a
 * timeout. `#contact[data-open="true"]` is what turns the in-flow section into
 * the fixed overlay, so scanning before it flips would be scanning the closed
 * panel and calling it the open one.
 */
async function openContact(page: Page): Promise<void> {
  await page.getByRole("link", { name: "Contact" }).click();
  await expect(page.locator("#contact")).toHaveAttribute("data-open", "true");
  await expect(
    page.getByRole("button", { name: "Close contact" }),
  ).toBeVisible();
}

const ROUTES: readonly {
  name: string;
  path: () => string;
  prepare?: (page: Page) => Promise<void>;
}[] = [
  { name: "Me", path: () => "/portfolio" },
  { name: "Projects", path: () => "/portfolio?view=projects" },
  { name: "Blog", path: () => "/portfolio?view=blog" },
  { name: "Photography", path: () => "/portfolio?view=photography" },
  { name: "a project detail", path: () => "/projects/lead-platform" },
  { name: "a note", path: () => newestHref },
  { name: "the note index", path: () => "/blog" },
  { name: "the résumé", path: () => "/resume" },
  { name: "open Contact", path: () => "/portfolio", prepare: openContact },
];

for (const frame of FRAMES) {
  for (const route of ROUTES) {
    test(`${route.name} has no serious accessibility violations at ${frame.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(frame);
      await page.goto(route.path());
      await route.prepare?.(page);

      const results = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = results.violations.filter((item) =>
        ["serious", "critical"].includes(item.impact ?? ""),
      );

      /*
       * The rule id and the first failing node, not just the count: a bare
       * `toEqual([])` on a violation object prints several screens of axe's own
       * DOM snapshots and says nothing a reader can act on.
       */
      expect(
        seriousOrCritical.map((item) => ({
          id: item.id,
          impact: item.impact,
          node: item.nodes[0]?.target.join(" "),
        })),
      ).toEqual([]);
    });
  }
}
