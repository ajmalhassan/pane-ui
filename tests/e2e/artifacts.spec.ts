import { expect, test, type Page } from "@playwright/test";
import { getPostSummaries } from "../../lib/content/posts";

/*
 * ===========================================================================
 * Exact viewport artifacts
 * ===========================================================================
 *
 * The spec's acceptance list ends with "exact viewport-only screenshots are
 * inspected at all four target frames". This produces them; a person reads
 * them. It asserts nothing about how the pages look, and it should not -- a
 * pixel baseline committed to this repository would fail on the next machine
 * with a different font rasteriser, and the checks that DO have an opinion
 * about layout (the tile-copy sweep, the glyph contrast floor, the collision
 * gates, the app-bar geometry) all live in `portfolio.spec.ts` where a failure
 * names what is wrong.
 *
 * `fullPage: false`, which is the whole point of the exercise. A full-page
 * capture stretches the viewport to the document and answers a question nobody
 * asked: the panorama's peek, the app bar's position over the fold and the
 * amount of a Start screen a reader meets before scrolling are all properties
 * of the frame, and a 320x2100 image shows none of them.
 *
 * Eight routes x four frames = 32 images per project, written to
 * `.superpowers/playwright/phase-2/`, which is git-ignored (`/.superpowers/`
 * in `.gitignore`). They are review material, not fixtures.
 *
 * Not part of `npm run test:e2e`: this file is its own suite, and it has no
 * assertions to gate on and would only slow the gate down. `ARTIFACT_BASE_URL`
 * is what collects it at all -- `playwright.config.ts:22` puts this file in
 * `testIgnore` whenever the variable is unset, so naming it on a bare
 * `npx playwright test tests/e2e/artifacts.spec.ts` reports `No tests found`
 * rather than running it. The variable is the switch, not a convenience.
 *
 * Run it against a PRODUCTION server:
 *
 *   npm run build && npx next start -p 3149 -H 127.0.0.1 &
 *   ARTIFACT_BASE_URL=http://127.0.0.1:3149 \
 *     npx playwright test tests/e2e/artifacts.spec.ts --project=chromium
 *
 * `ARTIFACT_BASE_URL` retargets the base URL and switches the managed dev
 * server off (see `playwright.config.ts`). Both halves matter. The dev server
 * floats Next's own toolbar button over the bottom-left corner, which is
 * exactly where the application bar's left inset is -- a reviewer measuring the
 * bar would be measuring the overlay -- and `next dev` shares `.next` with
 * `next start`, so leaving it on breaks the server these images come from.
 */

const FRAMES = [
  { width: 320, height: 568 },
  { width: 393, height: 851 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const OUT = ".superpowers/playwright/phase-2";

let newestHref = "";
let newestSlug = "";

test.beforeAll(async () => {
  const posts = await getPostSummaries();
  expect(posts.length).toBeGreaterThan(0);
  newestSlug = posts[0].slug;
  newestHref = `/blog/${newestSlug}`;
});

async function openContact(page: Page): Promise<void> {
  await page.getByRole("link", { name: "Contact" }).click();
  await expect(page.locator("#contact")).toHaveAttribute("data-open", "true");
}

type Route = {
  name: string;
  path: string;
  prepare?: (page: Page) => Promise<void>;
};

/*
 * A function rather than a constant: one of these paths is the newest note's,
 * which `beforeAll` reads out of the posts directory.
 */
function routes(): readonly Route[] {
  return [
    { name: "me", path: "/portfolio" },
    { name: "projects", path: "/portfolio?view=projects" },
    { name: "blog", path: "/portfolio?view=blog" },
    { name: "photography", path: "/portfolio?view=photography" },
    { name: "contact-open", path: "/portfolio", prepare: openContact },
    { name: "project-lead-platform", path: "/projects/lead-platform" },
    { name: `blog-${newestSlug}`, path: newestHref },
    { name: "resume", path: "/resume" },
  ];
}

for (const frame of FRAMES) {
  test(`captures every route at ${frame.width}x${frame.height}`, async ({
    page,
  }, testInfo) => {
    test.slow();
    await page.setViewportSize(frame);

    for (const route of routes()) {
      await page.goto(route.path);
      await route.prepare?.(page);

      /*
       * Long enough for the staggered tile entrance (240ms of delay over a
       * 420ms animation) and the first live claim to settle. A capture taken
       * mid-entrance shows tiles at partial opacity and reads as a rendering
       * fault rather than as the screen it is.
       */
      await page.waitForTimeout(1200);

      await page.screenshot({
        animations: "disabled",
        fullPage: false,
        path: `${OUT}/${route.name}-${frame.width}x${frame.height}-${testInfo.project.name}.png`,
      });
    }
  });
}
