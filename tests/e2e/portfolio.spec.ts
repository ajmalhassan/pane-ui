import { expect, type Locator, type Page, test } from "@playwright/test";
import { getPostSummaries } from "../../lib/content/posts";
import { PHOTOGRAPHY_UNITS } from "../../lib/content/photography";
import { TILE_COPY_BUDGET } from "../../lib/content/tileBudget";

const VIEWS = ["me", "projects", "blog", "photography"] as const;
// The panorama heading is the navigation, so each pivot's tab is its heading.
const HEADINGS = {
  me: "technical leader / builder",
  projects: "projects",
  blog: "blog",
  photography: "photography",
} as const;
const NARROW_FRAMES = [
  { width: 320, height: 568 },
  { width: 393, height: 851 },
] as const;
const APP_BAR = 'nav[aria-label="Page actions"]';

/**
 * Every way a tile can silently lose the copy it was given, measured on a whole
 * grid at one frame. Runs inside the page (`locator.evaluate(tileCopyFaults)`),
 * so it closes over nothing and reads no module scope.
 *
 * Four faults, and each of them is invisible from the outside:
 *  - copy painted outside its own tile;
 *  - a line the `-webkit-line-clamp` cut off, which looks like a shorter
 *    sentence rather than a truncated one;
 *  - a single-line box showing an ellipsis, measured with a `Range` rather than
 *    `scrollWidth`, because a caption overflowing by half a pixel is already
 *    ellipsised and `scrollWidth` is an integer;
 *  - copy another layer of the tile is painted *over*: laid out at full size,
 *    unclipped, and simply not visible. That is what the `media` slot made
 *    possible -- a layer at `z-index: 0` outranks an unpositioned caption -- and
 *    the first three checks all measure a rectangle, which occlusion does not
 *    change.
 *
 * The clamp check tolerates one pixel and no more. It used to allow half a
 * line-height, which absorbed the very fault it exists to name: with the type
 * derivation switched off, a `wide` headline at 768 loses the bottom 7px of its
 * second line and 7 is under `lineHeight * 0.5`. The tolerance was there for
 * `.value`, whose glyph box exceeds its `line-height: 1` box by ~7px at 40px
 * type -- so that class of element is skipped by what actually makes it
 * single-line, `white-space: nowrap`, and it is still covered by the `Range`
 * ellipsis check below.
 *
 * Both Start screens use it -- Me and Projects -- so a size or budget change in
 * MetroTile is caught on both at once.
 */
function tileCopyFaults(root: Element): string[] {
  const found: string[] = [];

  for (const tile of root.querySelectorAll<HTMLElement>("[data-tile-role]")) {
    // Centre the tile before measuring anything: a grid taller than the
    // viewport otherwise leaves most of its tiles off-screen, and the hit
    // test below skips a point it cannot see.
    tile.scrollIntoView({ block: "center" });
    const box = tile.getBoundingClientRect();
    // A grid holds two `large` tiles and two `wide` ones, so the size alone
    // cannot say which tile a fault came from. The destination, or failing that
    // the caption, can.
    const which =
      tile.getAttribute("href") ??
      (tile.lastElementChild?.textContent ?? "").trim();
    const name = `${tile.dataset.tileSize} tile${which ? ` (${which})` : ""}`;

    for (const child of tile.querySelectorAll<HTMLElement>("*")) {
      // An SVG's own geometry is decoration and is clipped by its viewport.
      if (child.closest("svg")) continue;

      const style = getComputedStyle(child);
      const rect = child.getBoundingClientRect();
      /*
       * Deliberately clipped: copy kept in the accessibility tree, unpainted.
       * Selected by the rectangle every visually-hidden technique leaves
       * behind rather than by the one this codebase happens to use today --
       * `clip-path: inset(50%)` is `.tileNote`'s current implementation, and
       * Task 10 extracts a shared utility that may well use another.
       */
      if (rect.width <= 1 && rect.height <= 1) continue;

      const text = (child.textContent ?? "").slice(0, 30);

      if (
        rect.width > 0 &&
        rect.height > 0 &&
        (rect.left < box.left - 0.5 ||
          rect.right > box.right + 0.5 ||
          rect.top < box.top - 0.5 ||
          rect.bottom > box.bottom + 0.5)
      ) {
        found.push(`${name}: "${text}" outside its tile`);
      }

      if (style.overflow !== "visible" && style.whiteSpace !== "nowrap") {
        if (child.scrollHeight > child.clientHeight + 1) {
          found.push(`${name}: "${text}" lost a line to its clamp`);
        }
      }

      if (child.childElementCount === 0 && (child.textContent ?? "").trim()) {
        const range = document.createRange();
        range.selectNodeContents(child);
        if (range.getBoundingClientRect().width > rect.width + 0.1) {
          found.push(`${name}: "${text}" is ellipsised`);
        }

        /*
         * ...and copy that is painted over. Hit-test the centre of the node's
         * own box: the topmost element there has to be the node, something
         * inside it, or something it is inside.
         *
         * Only occluders *within the tile* count. A tile centred under the
         * fixed app bar is hit-tested to the app bar, which is page chrome
         * doing its job rather than a tile hiding its own copy, and is a
         * different question from the one this sweep asks.
         *
         * What this exempts, precisely: boxes with no area (the reveal
         * tile's away-facing side is rotated edge-on), anything
         * `visibility: hidden` (that is the reduced-motion mechanism, not an
         * accident), an SVG's own geometry (skipped above, before this loop
         * body runs), a node still outside the viewport after its tile has
         * been centred (a box taller than the viewport can still poke past
         * both edges), and a hit the fixed app bar owns.
         *
         * `!hit.contains(child)` also exempts an occluder that is an
         * *ancestor* of the text node: a pseudo-element hit-tests as its
         * originating element, so a future `.content::after` scrim would
         * occlude the copy and still be reported clean here.
         */
        const centre = {
          x: Math.min(
            Math.max(rect.left + rect.width / 2, box.left + 0.5),
            box.right - 0.5,
          ),
          y: Math.min(
            Math.max(rect.top + rect.height / 2, box.top + 0.5),
            box.bottom - 0.5,
          ),
        };

        if (
          rect.width > 1 &&
          rect.height > 1 &&
          style.visibility === "visible" &&
          centre.x >= 0 &&
          centre.y >= 0 &&
          centre.x < document.documentElement.clientWidth &&
          centre.y < document.documentElement.clientHeight
        ) {
          const hit = document.elementFromPoint(centre.x, centre.y);

          if (
            hit &&
            tile.contains(hit) &&
            hit !== child &&
            !child.contains(hit) &&
            !hit.contains(child)
          ) {
            const over = `${hit.tagName.toLowerCase()}.${hit.getAttribute("class") ?? ""}`;
            found.push(`${name}: "${text}" is painted over by ${over}`);
          }
        }
      }
    }
  }

  return found;
}

/**
 * Two destinations whose rectangles overlap are one destination a reader can
 * miss, and the failure mode the Projects panel was rebuilt out of: it used to
 * lay a "View <project>" link over a full-tile button. Runs inside the page, so
 * it closes over nothing.
 */
function linkOverlaps(root: Element): string[] {
  const boxes = [...root.querySelectorAll("a")].map((link) => ({
    href: link.getAttribute("href") ?? "",
    rect: link.getBoundingClientRect(),
  }));
  const collisions: string[] = [];

  for (const [index, one] of boxes.entries()) {
    for (const other of boxes.slice(index + 1)) {
      const overlapX =
        Math.min(one.rect.right, other.rect.right) -
        Math.max(one.rect.left, other.rect.left);
      const overlapY =
        Math.min(one.rect.bottom, other.rect.bottom) -
        Math.max(one.rect.top, other.rect.top);
      if (overlapX > 0.5 && overlapY > 0.5) {
        collisions.push(`${one.href} overlaps ${other.href}`);
      }
    }
  }

  return collisions;
}

async function tabTo(page: Page, target: Locator, attempts = 24) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await page.keyboard.press("Tab");
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
  }

  throw new Error(`Tab did not reach ${await target.getAttribute("href")}`);
}

test("bare and invalid URLs show Me with one page heading", async ({
  page,
}) => {
  for (const path of ["/", "/?view=invalid"]) {
    await page.goto(path);
    await expect(page.getByRole("tab", { name: HEADINGS.me })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveAccessibleName(HEADINGS.me);
    await expect(heading).toBeVisible();
  }
});

test("Next links update pivot history and back/forward restore selected state", async ({
  page,
}) => {
  await page.goto("/?view=projects");
  await expect(page.getByRole("tab", { name: HEADINGS.projects })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByRole("tab", { name: HEADINGS.blog }).click();
  await expect(page).toHaveURL(/\?view=blog$/);
  await expect(page.getByRole("tab", { name: HEADINGS.blog })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(/\?view=projects$/);
  await expect(page.getByRole("tab", { name: HEADINGS.projects })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.goForward();
  await expect(page).toHaveURL(/\?view=blog$/);
  await expect(page.getByRole("tab", { name: HEADINGS.blog })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("modified pivot clicks open Projects and leave the opener unchanged", async ({
  context,
  page,
}) => {
  await page.goto("/");

  const openerUrl = page.url();
  const newPagePromise = context.waitForEvent("page");
  await page
    .getByRole("tab", { name: HEADINGS.projects })
    .click({ modifiers: ["ControlOrMeta"] });
  const newPage = await newPagePromise;
  await newPage.waitForURL(/\?view=projects$/, {
    waitUntil: "domcontentloaded",
  });

  await expect(newPage).toHaveURL(/\?view=projects$/);
  await expect(newPage.getByRole("tab", { name: HEADINGS.projects })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page).toHaveURL(openerUrl);
  await expect(page.getByRole("tab", { name: HEADINGS.me })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await newPage.close();
});

test("keyboard reaches pivots, project links, and app-bar actions", async ({
  page,
}) => {
  await page.goto("/?view=projects");

  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(VIEWS.length);
  for (let index = 0; index < VIEWS.length; index += 1) {
    const pivot = tabs.nth(index);
    await tabTo(page, pivot);
    await expect(pivot).toBeFocused();
  }

  const project = page
    .getByRole("tabpanel", { name: HEADINGS.projects })
    .getByRole("link")
    .first();
  await tabTo(page, project);
  await expect(project).toBeFocused();

  const resume = page.getByRole("link", { name: "Résumé" });
  await tabTo(page, resume);
  await expect(resume).toBeFocused();

  const contact = page.getByRole("link", { name: "Contact" });
  await tabTo(page, contact);
  await expect(contact).toBeFocused();
  await expect(contact).toHaveAttribute("href", "#contact");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator("#contact")).toHaveAttribute("data-open", "true");
});

test("contact follows fragment history and close clears it", async ({ page }) => {
  await page.goto("/?view=me");
  await page.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/#contact$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeHidden();

  await page.getByRole("link", { name: "Contact" }).click();
  await page.getByRole("button", { name: "Close contact" }).click();
  await expect(page).not.toHaveURL(/#contact$/);
  await expect(page.getByRole("link", { name: "Contact" })).toBeFocused();
});

test("direct fragment load opens contact and close keeps the pivot query", async ({
  page,
}) => {
  await page.goto("/?view=projects#contact");
  await expect(page.getByRole("button", { name: "Close contact" })).toBeVisible();
  await expect(page.getByRole("tab", { name: HEADINGS.projects })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByRole("button", { name: "Close contact" }).click();
  await expect(page).toHaveURL(/\/\?view=projects$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeHidden();
  await expect(page.getByRole("link", { name: "Contact" })).toBeFocused();
});

test("pivot navigation while contact is open follows the fragment-less URL", async ({
  page,
}) => {
  await page.goto("/?view=me");
  await page.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/#contact$/);
  expect(
    await page.evaluate(() => window.history.state?.portfolioContact),
  ).toBe(true);

  await page.getByRole("tab", { name: HEADINGS.projects }).click();
  await expect(page).toHaveURL(/\/\?view=projects$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeHidden();
  await expect(page.getByRole("link", { name: "Contact" })).not.toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(/\/\?view=me#contact$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeVisible();
});

test("arrow keys navigate pivots through their real links", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: HEADINGS.me }).focus();
  await page.keyboard.press("ArrowRight");

  await expect(page).toHaveURL(/\?view=projects$/);
  await expect(page.getByRole("tab", { name: HEADINGS.projects })).toBeFocused();
  await expect(page.getByRole("tab", { name: HEADINGS.projects })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("every valid pivot keeps exactly one persistent page heading", async ({
  page,
}) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  const persistentHeading = await heading.elementHandle();
  if (!persistentHeading) throw new Error("Page heading was not rendered");

  for (const view of VIEWS) {
    await page.getByRole("tab", { name: HEADINGS[view], exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`\\?view=${view}$`));
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveAccessibleName(HEADINGS[view]);
    expect(
      await heading.evaluate(
        (currentHeading, originalHeading) => currentHeading === originalHeading,
        persistentHeading,
      ),
    ).toBe(true);
  }
});

test("reduced motion removes panorama transforms", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?view=projects");

  const plane = page.locator('[role="tabpanel"]').first().locator("..");
  await expect(plane).toHaveCSS("transform", "none");
  await expect(plane).toHaveCSS("transition-duration", "0s");
});

test("captures a named review screenshot without a committed baseline", async ({
  page,
}, testInfo) => {
  await page.goto("/?view=projects");
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(
      `portfolio-projects-${testInfo.project.name}.png`,
    ),
  });
});

test("a direct query load leads with that pivot's own heading", async ({
  page,
}) => {
  for (const view of VIEWS) {
    await page.goto(`/?view=${view}`);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading, view).toHaveCount(1);
    await expect(heading, view).toHaveAccessibleName(HEADINGS[view]);

    const leading = page.getByRole("tab").first();
    await expect(leading, view).toHaveAccessibleName(HEADINGS[view]);
    await expect(leading, view).toHaveAttribute("aria-selected", "true");
  }
});

for (const frame of NARROW_FRAMES) {
  test(`every panorama heading fits a ${frame.width}px frame and keeps its peek`, async ({
    page,
  }) => {
    await page.setViewportSize(frame);

    for (const view of VIEWS) {
      await page.goto(`/?view=${view}`);
      const tabs = page.getByRole("tab");
      const tablist = page.getByRole("tablist");
      const leading = tabs.first();
      const at = `${view} at ${frame.width}px`;

      await expect(leading, at).toHaveAccessibleName(HEADINGS[view]);
      const box = await leading.boundingBox();
      const tablistBox = await tablist.boundingBox();
      expect(box, at).not.toBeNull();
      expect(tablistBox, at).not.toBeNull();
      expect(box?.x ?? -1, at).toBeGreaterThanOrEqual(0);
      // The clip boundary is the tablist's own clipped box, not the viewport
      // edge -- there can be inset between the two.
      expect((box?.x ?? 0) + (box?.width ?? 0), at).toBeLessThanOrEqual(
        (tablistBox?.x ?? 0) + (tablistBox?.width ?? 0),
      );

      const peek = await tabs.nth(1).boundingBox();
      expect(peek, at).not.toBeNull();
      expect(peek?.x ?? frame.width, at).toBeLessThan(frame.width);

      const tabCount = await tabs.count();
      for (let index = 0; index < tabCount; index += 1) {
        const tabAt = `${at} tab ${index}`;
        const tabBox = await tabs.nth(index).boundingBox();
        expect(tabBox, tabAt).not.toBeNull();
        expect(tabBox?.width ?? 0, tabAt).toBeGreaterThanOrEqual(44);
      }
    }
  });
}

/*
 * Projects is five evidence tiles over 20 grid units: five complete rows of
 * four on a phone, and at eight columns two complete rows plus a half row. A
 * ragged last row is fine; a hole in the middle is not, and asserting the
 * grid's own height is what proves there is none -- a hole would push the block
 * onto another row.
 *
 * Extending this grid: the sizes have to keep filling each four-column band
 * exactly, with every tile in a band the same number of rows tall
 * (`tests/unit/ProjectContent.test.ts` owns that arithmetic). Both
 * `PROJECT_TILES` and `PROJECT_UNITS` move together, or this fails on purpose.
 */
const PROJECT_TILES = 5;
const PROJECT_UNITS = 20;
/** The `large` tile that carries the one approved public number. */
const LEAD_PLATFORM = "/projects/lead-platform";

for (const frame of [
  { width: 320, height: 568 },
  { width: 393, height: 851 },
  // The tightest frame: the grid doubles to eight columns at 48rem, so a unit
  // is 81px here -- half of what it is one pixel below the breakpoint.
  { width: 768, height: 1024 },
  { width: 900, height: 700 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const) {
  test(`every project tile owns one destination and keeps its copy inside at ${frame.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(frame);
    await page.goto("/?view=projects");

    const at = `${frame.width}px`;
    const panel = page.getByRole("tabpanel", { name: HEADINGS.projects });
    const grid = panel.locator("[data-tile-grid]");
    const tiles = panel.getByRole("link");

    await expect(tiles).toHaveCount(PROJECT_TILES);
    await expect(panel.locator("[data-tile-role]")).toHaveCount(PROJECT_TILES);
    // Every tile is a navigation tile: the rectangle is the destination.
    await expect(panel.locator('[data-tile-role="navigation"]')).toHaveCount(
      PROJECT_TILES,
    );

    // One interactive owner per tile, and no second one inside it.
    expect(await panel.locator("a a").count(), at).toBe(0);
    expect(await panel.locator("button").count(), at).toBe(0);

    const packing = await grid.evaluate((node, units) => {
      const style = getComputedStyle(node);
      const columns = style.gridTemplateColumns.split(" ").length;
      const gap = Number.parseFloat(style.columnGap);
      const unit = Number.parseFloat(style.gridAutoRows);
      // 20 units over 8 columns is two full rows and a half one: the last row
      // is ragged by design, so the row count rounds up rather than dividing.
      const rows = Math.ceil(units / columns);

      return {
        columns,
        rows,
        height: node.getBoundingClientRect().height,
        expected: rows * unit + (rows - 1) * gap,
      };
    }, PROJECT_UNITS);

    expect(packing.columns, at).toBe(frame.width < 768 ? 4 : 8);
    expect(packing.rows, at).toBe(frame.width < 768 ? 5 : 3);
    expect(Math.abs(packing.height - packing.expected), at).toBeLessThanOrEqual(
      1,
    );

    // Nothing a tile paints may leave its rectangle, lose a line to a clamp, or
    // be ellipsised away -- the same sweep the Me Start screen runs.
    expect(await panel.evaluate(tileCopyFaults), at).toEqual([]);

    /*
     * The step is *derived* from the grid unit, not read off the absolute
     * ladder. The wide headline is where the two disagree most: eight columns
     * make a unit 81px here, and two title lines of the 0.95rem absolute step
     * would not fit its 27.9px copy region. Without this the whole derivation
     * could be switched off and every Projects frame would still pass -- the
     * shortened copy on these faces fits the absolute steps too, so only Me
     * would notice a mechanism this screen is now the largest consumer of.
     */
    if (frame.width === 768) {
      const wideTitle = await panel
        .locator('[data-tile-size="wide"] strong')
        .first()
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

      expect(wideTitle, at).toBeLessThan(13);
    }

    /*
     * The budget model, not the copy that happens to be in it.
     *
     * MetroTile.module.css proves its 0.46/0.54 split by arithmetic -- "when
     * neither step is at its ceiling the two shares add back up to exactly
     * --tile-copy" -- and nothing measured that proof: the shipped strings wrap
     * to fewer lines than their clamps allow, so an overspending split is
     * absorbed by slack. This asserts the model instead: a tile that paints a
     * title and a body must fit the maximum lines its clamps allow, and a
     * one-unit tile's title alone must fit the single (`small`) or double
     * (`wide`) line its own clamp allows.
     *
     * Every size compares against `content.getBoundingClientRect().height`, a
     * fractional value, rather than the integer `clientHeight`/`scrollHeight`:
     * a one-unit tile's copy region is 27.875px at 768, and rounding that to
     * the integer 28 hides a clip of up to ~1.6px on a 28px tile -- exactly
     * the margin `--tile-title-min` spends down to 0.28px in
     * MetroTile.module.css:186-195.
     *
     * The constants mirror MetroTile.module.css and have to move with it:
     * 1.15 is `.title`'s line-height (also `.small .title`'s and `.wide
     * .title`'s), 1.4 is `.body`'s, 2 is `.title`'s `-webkit-line-clamp` on
     * `large`/`hero` (1 for `.small .title`, 2 for `.wide .title`), and
     * `.body`'s clamp is 2 below 48rem and 3 from it.
     */
    const overspend = await panel.evaluate(
      (root, wideLayout) =>
        [...root.querySelectorAll<HTMLElement>("[data-tile-size]")].flatMap(
          (tile) => {
            const size = tile.dataset.tileSize;
            const content = tile.firstElementChild as HTMLElement;
            const have = content.getBoundingClientRect().height;

            if (size === "small" || size === "wide") {
              const title = content.querySelector("strong");
              if (!title) return [];

              const lines = size === "small" ? 1 : 2; // `.small .title` clamps to 1
              const t = Number.parseFloat(getComputedStyle(title).fontSize);
              const need = lines * 1.15 * t;

              return need <= have + 0.5
                ? []
                : [
                    `${size} (${tile.getAttribute("href")}): needs ${need.toFixed(1)} of ${have.toFixed(1)}`,
                  ];
            }

            if (size !== "large" && size !== "hero") return [];

            const title = content.querySelector("strong");
            // The face is `[value] <strong> [body]`, so the body is the span
            // after the headline -- structure rather than a hashed class name.
            const after = title ? [...content.children].indexOf(title) + 1 : 0;
            const body = [...content.children]
              .slice(after)
              .find((node): node is HTMLElement => node.tagName === "SPAN");
            if (!title || !body || getComputedStyle(body).display === "none") {
              return [];
            }

            const t = Number.parseFloat(getComputedStyle(title).fontSize);
            const b = Number.parseFloat(getComputedStyle(body).fontSize);
            const gap = Number.parseFloat(getComputedStyle(content).rowGap);
            const need = 2 * 1.15 * t + gap + (wideLayout ? 3 : 2) * 1.4 * b;

            return need <= have + 0.5
              ? []
              : [
                  `${size} (${tile.getAttribute("href")}): needs ${need.toFixed(1)} of ${have.toFixed(1)}`,
                ];
          },
        ),
      frame.width >= 768,
    );

    expect(overspend, at).toEqual([]);

    expect(await panel.evaluate(linkOverlaps), at).toEqual([]);

    /*
     * The one approved public number, on the face of the one project cleared to
     * carry it -- painted, inside its own tile, and not ellipsised, at every
     * frame. It is the single strongest piece of evidence on this screen, so it
     * is asserted by itself rather than left to the sweep above.
     */
    const platform = panel.locator(`a[href="${LEAD_PLATFORM}"]`);
    const metric = platform.getByText("₹1Cr+");
    await expect(metric).toBeVisible();

    const fits = await metric.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);

      return {
        drawn: range.getBoundingClientRect().width,
        box: node.getBoundingClientRect().width,
      };
    });

    expect(fits.drawn, at).toBeGreaterThan(0);
    expect(fits.drawn, at).toBeLessThanOrEqual(fits.box + 0.1);

    /*
     * Four of the five case studies are drafts, and a reader meets the tile
     * long before the detail page. The marker has to be legible on the face at
     * every frame -- present in the DOM behind an ellipsis is not legible --
     * so each caption is measured against its own box with a `Range`.
     *
     * The same pass reads each link's text, which is what Chromium
     * concatenates when it computes the link's accessible name: it joins
     * adjacent inline boxes with nothing between them, so a missing space node
     * here is a tile announced as "Revenue contributionlead platform".
     */
    const captions = await panel.evaluate((root) =>
      [...root.querySelectorAll("a")].map((link) => {
        const caption = link.lastElementChild as HTMLElement;
        const range = document.createRange();
        range.selectNodeContents(caption);

        return {
          href: link.getAttribute("href") ?? "",
          text: caption.textContent ?? "",
          linkText: link.textContent ?? "",
          drawn: range.getBoundingClientRect().width,
          box: caption.getBoundingClientRect().width,
        };
      }),
    );

    expect(
      captions.filter((caption) => /draft/.test(caption.text)).length,
      at,
    ).toBe(4);

    for (const caption of captions) {
      const where = `${at} ${caption.href}`;
      expect(caption.drawn, where).toBeGreaterThan(0);
      expect(caption.drawn, where).toBeLessThanOrEqual(caption.box + 0.1);
      expect(caption.linkText.endsWith(` ${caption.text}`), where).toBe(true);
    }

    expect(
      captions.find((caption) => caption.href === LEAD_PLATFORM)?.linkText,
      at,
    ).toBe("₹1Cr+ Revenue contribution lead platform · draft");
  });
}

/*
 * The character budgets are measured px capacities frozen into numbers, and
 * they were tested only for *enforcement*: a string one character over throws.
 * Nothing measured whether the numbers themselves are still right. If
 * `--tile-pad`, `--metro-text-label`, a `--tile-*-max` or the 48rem column
 * count moved, every budget would quietly become wrong and the suite would stay
 * green until real copy happened to use the slack -- the shipped strings sit at
 * 64-77% of capacity.
 *
 * So: clone one tile of every face shape on the screen and stretch each slot's
 * own copy to the whole budget for that slot, then run the same sweep on the
 * clones. The clones go into the real grid, so they take the real unit.
 *
 * Each slot is filled with its *own* text repeated, not with a run of the
 * widest glyph. That is deliberate and it is the honest limit of a character
 * budget: 21 of the widest lowercase glyph measure 205.8px in the 117px box
 * this budget calls 21 characters, and no character count can promise
 * otherwise, because a string of N characters wraps into as many lines as its
 * word breaks demand. Cycling the face's own prose keeps the alphabet and the
 * word lengths the budgets were calibrated over and stretches them to the
 * number, which is what makes a shrunken box or a grown type step fail here.
 * It found one: `large.headline` was 24 and 24 characters of this prose wrap to
 * three lines under a two-line clamp, at 320 and again at 768.
 *
 * 320 and 768 are the two binding frames -- the smallest unit and the tightest
 * type step -- which are the two the budget doc block is written against.
 */
for (const frame of [
  { width: 320, height: 568 },
  { width: 768, height: 1024 },
] as const) {
  test(`a face still fits copy stretched to the whole character budget at ${frame.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(frame);
    await page.goto("/?view=projects");

    const at = `${frame.width}px`;
    const panel = page.getByRole("tabpanel", { name: HEADINGS.projects });
    const grid = panel.locator("[data-tile-grid]");

    const filled = await grid.evaluate((root, budgets) => {
      // The slot's own text, repeated with its space and cut to exactly the
      // budget -- so the filler wraps the way real copy does.
      const stretch = (text: string | null, count: number) =>
        count <= 0 || !text
          ? ""
          : (text + " ")
              .repeat(Math.ceil(count / (text.length + 1)) + 1)
              .slice(0, count);

      const seen = new Set<string>();
      const made: string[] = [];

      for (const tile of root.querySelectorAll<HTMLElement>(
        "[data-tile-size]",
      )) {
        const size = tile.dataset.tileSize ?? "";
        const budget = budgets[size as keyof typeof budgets];
        if (!budget) continue;

        const clone = tile.cloneNode(true) as HTMLElement;
        const content = clone.firstElementChild as HTMLElement;
        const caption = clone.lastElementChild as HTMLElement;
        const headline = content.querySelector("strong");
        /*
         * The face is `[value] <strong> [body]` (ProjectsPanel.tsx), so the
         * numeral is the span before the headline and the claim the span after
         * it -- structure rather than a hashed CSS-module class name.
         */
        const slots = [...content.children];
        const lead = headline ? slots.indexOf(headline) : slots.length;
        const value = slots
          .slice(0, lead)
          .find((node): node is HTMLElement => node.tagName === "SPAN");
        const body = slots
          .slice(lead + 1)
          .find((node): node is HTMLElement => node.tagName === "SPAN");

        // One clone per face *shape*, not merely per size: the two `large`
        // tiles differ, and only one of them paints a numeral.
        const shape = [size, value ? "value" : "", body ? "claim" : ""].join(
          ":",
        );
        if (seen.has(shape)) continue;
        seen.add(shape);

        caption.textContent = stretch(caption.textContent, budget.label);
        if (headline) {
          headline.textContent = stretch(headline.textContent, budget.headline);
        }
        if (value) value.textContent = stretch(value.textContent, budget.value);
        if (body) body.textContent = stretch(body.textContent, budget.claim);

        clone.dataset.worstCase = shape;
        root.append(clone);
        made.push(shape);
      }

      return made;
    }, TILE_COPY_BUDGET);

    // Every non-zero budget used by the shipped face shapes is exercised: a
    // hero and a large headline with a claim under it, a large numeral over a
    // headline, a wide headline on its own, and the caption budget on all
    // four. `TILE_COPY_BUDGET.hero.value` (6) is not exercised here -- no
    // hero on this screen carries a numeral.
    expect(filled, at).toEqual([
      "hero::claim",
      "large::claim",
      "large:value:",
      "wide::",
    ]);

    const faults = await grid.evaluate(tileCopyFaults);

    await grid.evaluate((root) => {
      for (const clone of root.querySelectorAll("[data-worst-case]")) {
        clone.remove();
      }
    });

    expect(faults, at).toEqual([]);
  });
}

for (const frame of [
  { width: 320, height: 568 },
  { width: 1440, height: 900 },
] as const) {
  test(`tile units stay square on a ${frame.width}px canvas`, async ({
    page,
  }) => {
    await page.setViewportSize(frame);
    await page.goto("/?view=projects");

    const panel = page.getByRole("tabpanel", { name: HEADINGS.projects });
    const gap = await panel
      .locator("[data-tile-grid]")
      .evaluate((grid) => Number.parseFloat(getComputedStyle(grid).columnGap));
    const large = await panel
      .locator('[data-tile-size="large"]')
      .first()
      .boundingBox();
    const hero = await panel
      .locator('[data-tile-size="hero"]')
      .first()
      .boundingBox();
    const at = `${frame.width}px`;

    expect(large, at).not.toBeNull();
    expect(hero, at).not.toBeNull();
    expect(gap, at).toBeGreaterThan(0);

    // A 2x2 tile is square, so the grid's rows really are unit-high.
    expect(Math.abs((large?.width ?? 0) - (large?.height ?? 1)), at)
      .toBeLessThanOrEqual(1);
    // A 4x2 tile spans three gutters across and one down, so its width is two
    // of its own heights plus the extra gutter -- the 4:2 ratio in a gapped grid.
    expect(
      Math.abs((hero?.width ?? 0) - (2 * (hero?.height ?? 0) + gap)),
      at,
    ).toBeLessThanOrEqual(2);
    expect(Math.abs((hero?.height ?? 0) - (large?.height ?? 1)), at)
      .toBeLessThanOrEqual(1);
  });
}

/*
 * ---------------------------------------------------------------------------
 * The content hubs
 * ---------------------------------------------------------------------------
 *
 * Blog and Photography are one tile block each over eight grid units, and both
 * pack into two rows at four columns and at eight: Blog's 4x2 hero, and
 * Photography's 2x2 picture beside two stacked 2x1 plates. Nothing about that
 * is a coincidence of the current copy -- Blog's total is the one tile it
 * draws, and Photography's is summed from its own collection in
 * `lib/content/photography.ts`, so a frame added there moves the expectation
 * and the packing together.
 */
const HUB_FRAMES = [
  { width: 320, height: 568 },
  { width: 393, height: 851 },
  // The tightest frame: the grid doubles to eight columns at 48rem, so a unit
  // is 81px here -- half of what it is one pixel below the breakpoint.
  { width: 768, height: 1024 },
  { width: 900, height: 700 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

/** One `hero` tile: four columns by two rows. */
const BLOG_UNITS = 8;
const HUB_ROWS = 2;

/*
 * The newest note, read from the content layer at run time instead of pinned
 * here.
 *
 * `lib/content/posts.ts` reads the `posts/` directory with `node:fs/promises`
 * and parses front matter -- both fine in Playwright's own Node process, which
 * is where this runs -- so "publish a newer note" is no longer a red build in
 * three places that have nothing to do with the change.
 *
 * The teeth are kept explicitly: the loops below assert that the newest note is
 * on the tile and is NOT one of the list rows, which means nothing without a
 * second note to be in the list, so the guard fails loudly rather than passing
 * over an empty list.
 */
let newestHref = "";
let newestTitle = "";
let newestSummary = "";

test.beforeAll(async () => {
  const posts = await getPostSummaries();

  expect(
    posts.length,
    "the blog hub needs a newest note on the tile and at least one more in the list",
  ).toBeGreaterThan(1);

  newestHref = `/blog/${posts[0].slug}`;
  newestTitle = posts[0].title;
  newestSummary = posts[0].summary;
});

/*
 * The grid's own height, which is what proves there is no hole in it; its unit
 * total, which is what the hub's own unit count claims; and its width against
 * the panorama
 * plane, which is what makes the unit the same number every other pivot draws.
 *
 * That last one is the contract a `max-width` around a `TileGrid` breaks
 * silently: the tiles still pack, the ratios still hold, and the whole Start
 * screen module is drawn a quarter smaller than it is one pivot to the left.
 */
async function hubPacking(grid: Locator, rows: number) {
  return grid.evaluate((node, expectedRows) => {
    const style = getComputedStyle(node);
    const gap = Number.parseFloat(style.columnGap);
    const unit = Number.parseFloat(style.gridAutoRows);
    const spans: Record<string, number> = {
      small: 1,
      wide: 2,
      large: 4,
      hero: 8,
    };
    const panel = node.closest('[role="tabpanel"]') as HTMLElement;
    const plane = panel.parentElement as HTMLElement;
    const planeStyle = getComputedStyle(plane);

    return {
      columns: style.gridTemplateColumns.split(" ").length,
      height: node.getBoundingClientRect().height,
      expected: expectedRows * unit + (expectedRows - 1) * gap,
      unit,
      width: node.getBoundingClientRect().width,
      planeWidth:
        plane.getBoundingClientRect().width -
        Number.parseFloat(planeStyle.paddingLeft) -
        Number.parseFloat(planeStyle.paddingRight),
      units: [...node.querySelectorAll<HTMLElement>("[data-tile-size]")].reduce(
        (total, tile) => total + (spans[tile.dataset.tileSize ?? ""] ?? 0),
        0,
      ),
    };
  }, rows);
}

for (const frame of HUB_FRAMES) {
  test(`Blog leads with one note tile over full-row list links at ${frame.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(frame);
    await page.goto("/?view=blog");

    const at = `${frame.width}px`;
    const panel = page.getByRole("tabpanel", { name: HEADINGS.blog });
    const grid = panel.locator("[data-tile-grid]");

    /*
     * One tile, and it is the newest note's whole destination. The rest of the
     * pivot is prose: a wall of note tiles is exactly what this pivot was
     * rebuilt out of.
     */
    const tiles = panel.locator("[data-tile-role]");
    await expect(tiles).toHaveCount(1);
    await expect(tiles).toHaveAttribute("data-tile-role", "navigation");
    await expect(tiles).toHaveAttribute("data-tile-size", "hero");
    await expect(tiles).toHaveAttribute("href", newestHref);
    expect(await panel.locator(`a[href="${newestHref}"]`).count(), at).toBe(1);

    expect(await panel.locator("a a").count(), at).toBe(0);
    expect(await panel.locator("button").count(), at).toBe(0);

    const packing = await hubPacking(grid, HUB_ROWS);
    expect(packing.columns, at).toBe(frame.width < 768 ? 4 : 8);
    expect(packing.units, at).toBe(BLOG_UNITS);
    expect(Math.abs(packing.height - packing.expected), at).toBeLessThanOrEqual(
      1,
    );

    /*
     * The hub draws the tile system at the plane's own unit, like every other
     * pivot. The reading measure caps the prose below; it does not reach the
     * grid, and if it ever does again this is the number that moves first.
     */
    expect(
      Math.abs(packing.width - packing.planeWidth),
      `${at} grid ${packing.width} vs plane ${packing.planeWidth}`,
    ).toBeLessThanOrEqual(1);

    // Nothing the tile paints may leave its rectangle, lose a line to a clamp,
    // or be ellipsised away -- the same sweep both Start screens run.
    expect(await panel.evaluate(tileCopyFaults), at).toEqual([]);

    /*
     * The newest note appears nowhere else on the pivot, so its date, reading
     * time and draft marker have to be legible on this one face. They ride the
     * caption, which is the only line left once the title and a three-line
     * summary have taken the copy region -- so it is measured against its own
     * box with a `Range`, not merely asserted to exist.
     *
     * The status leads *this* line and no other. A caption is one clipped
     * line, so whatever ends up first is the part that cannot be lost; the
     * rows below and `/blog` have room for all three facts and lead with the
     * date, which is the order the row assertions further down pin.
     */
    const face = await tiles.evaluate((tile) => {
      const caption = tile.lastElementChild as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(caption);

      return {
        caption: caption.textContent ?? "",
        drawn: range.getBoundingClientRect().width,
        box: caption.getBoundingClientRect().width,
        linkText: (tile.textContent ?? "").replace(/\s+/g, " ").trim(),
      };
    });

    expect(face.caption, at).toMatch(
      /^Draft example · \d{4}-\d{2}-\d{2} · \d+ min read$/,
    );
    expect(face.drawn, at).toBeGreaterThan(0);
    expect(face.drawn, at).toBeLessThanOrEqual(face.box + 0.1);
    /*
     * The whole face, against the note the content layer says is newest: the
     * title, then the summary, then the caption, and nothing else. Derived
     * rather than pinned, so it says "the tile carries this note's own copy"
     * instead of "the tile carries these words".
     */
    expect(face.linkText, at).toBe(
      `${newestTitle} ${newestSummary} ${face.caption}`
        .replace(/\s+/g, " ")
        .trim(),
    );

    /*
     * The budget model behind that face, not the copy that happens to be in it.
     *
     * This tile asks MetroTile for a three-line secondary budget at every width
     * (`--tile-body-lead` on `.featureTile`), which below 48rem is one line more
     * than the default. Without that the derived step stays on its 0.8rem
     * ceiling and the same three lines need 100.08px of a 99.56px copy region at
     * 320 -- a half-pixel clip, invisible to the eye and to the fault sweep,
     * which is exactly the kind of overspend that rots. The invariant is the
     * arbiter: what the face paints has to fit what the tile has.
     *
     * The constants mirror the stylesheets and move with them: 1.15 is
     * `.title`'s line-height, 1.4 is `.featureSummary`'s, 2 is `.title`'s clamp
     * on a hero, and 3 is `.featureSummary`'s own.
     */
    const overspend = await tiles.evaluate((tile) => {
      const content = tile.firstElementChild as HTMLElement;
      const title = content.querySelector("strong") as HTMLElement;
      const summary = title.nextElementSibling as HTMLElement;
      const step = (node: Element) =>
        Number.parseFloat(getComputedStyle(node).fontSize);

      return {
        need:
          2 * 1.15 * step(title) +
          Number.parseFloat(getComputedStyle(content).rowGap) +
          3 * 1.4 * step(summary),
        have: content.getBoundingClientRect().height,
      };
    });

    expect(
      overspend.need,
      `${at} needs ${overspend.need.toFixed(2)} of ${overspend.have.toFixed(2)}`,
    ).toBeLessThanOrEqual(overspend.have + 0.5);

    /*
     * Every remaining note is one row, and the row is the whole width of the
     * list: a headline that is a link over a summary that is not is the
     * half-target this list exists to avoid.
     */
    const rows = await panel.evaluate((root) => {
      const list = root.querySelector("ol");
      if (!list) return [];
      const listBox = list.getBoundingClientRect();

      return [...list.querySelectorAll<HTMLAnchorElement>("li > a")].map(
        (row) => {
          const rect = row.getBoundingClientRect();

          return {
            href: row.getAttribute("href") ?? "",
            share: rect.width / listBox.width,
            pitch: rect.height,
            inside:
              rect.left >= listBox.left - 0.5 &&
              rect.right <= listBox.right + 0.5,
            nested: row.querySelectorAll("a, button, input, select, textarea")
              .length,
            text: (row.textContent ?? "").replace(/\s+/g, " ").trim(),
          };
        },
      );
    });

    expect(rows.length, at).toBeGreaterThan(0);
    for (const row of rows) {
      const where = `${at} ${row.href}`;
      expect(row.nested, where).toBe(0);
      expect(row.share, where).toBeGreaterThanOrEqual(0.95);
      expect(row.inside, where).toBe(true);
      // The Windows Phone list pitch, floored: `.noteRow`'s own 5.5rem.
      expect(row.pitch, where).toBeGreaterThanOrEqual(88);
      expect(row.href, where).not.toBe(newestHref);
      /*
       * All three facts, in the row's own order: date, then status, then
       * reading time -- the order `/blog`'s index uses. It is asserted rather
       * than assumed because the hero's caption leads with the status instead,
       * and an unpinned order is how the two silently swapped roles.
       */
      expect(row.text, where).toMatch(
        /^\d{4}-\d{2}-\d{2}\s*(Draft example|Published)\s*\d+ min read/,
      );
    }

    // Two destinations whose rectangles overlap are one a reader can miss.
    expect(await panel.evaluate(linkOverlaps), at).toEqual([]);

    // Every destination on the hub answers to a name of its own.
    const names = await panel.evaluate((root) =>
      [...root.querySelectorAll("a")].map((link) =>
        (link.textContent ?? "").replace(/\s+/g, " ").trim(),
      ),
    );
    expect(new Set(names).size, at).toBe(names.length);

    // The reading list does not move, and neither does the tile above it: Me
    // owns the one live cycle on the site.
    expect(
      await panel.evaluate(
        (root) => root.getAnimations({ subtree: true }).length,
      ),
      at,
    ).toBe(0);

    await expect(
      panel.getByRole("link", { name: "Browse the blog" }),
    ).toHaveAttribute("href", "/blog");
  });
}

for (const frame of HUB_FRAMES) {
  test(`Photography fills its picture tile edge to edge at ${frame.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(frame);
    await page.goto("/?view=photography");

    const at = `${frame.width}px`;
    const panel = page.getByRole("tabpanel", { name: HEADINGS.photography });
    const grid = panel.locator("[data-tile-grid]");

    await expect(panel.locator("[data-tile-role]")).toHaveCount(3);
    await expect(panel.locator('[data-tile-role="display"]')).toHaveCount(3);
    // A photograph is not a destination, and neither is a selection that has
    // not been made: the hub owns no interaction at all.
    expect(await panel.locator("a").count(), at).toBe(0);
    expect(await panel.locator("button").count(), at).toBe(0);

    const packing = await hubPacking(grid, HUB_ROWS);
    expect(packing.columns, at).toBe(frame.width < 768 ? 4 : 8);
    expect(packing.units, at).toBe(PHOTOGRAPHY_UNITS);
    expect(Math.abs(packing.height - packing.expected), at).toBeLessThanOrEqual(
      1,
    );
    expect(
      Math.abs(packing.width - packing.planeWidth),
      `${at} grid ${packing.width} vs plane ${packing.planeWidth}`,
    ).toBeLessThanOrEqual(1);

    expect(await panel.evaluate(tileCopyFaults), at).toEqual([]);

    /*
     * The picture tile's whole point. `cover` is the promise that a 752x648
     * source in a square span is cropped rather than stretched, and the rect
     * equality is the promise that it is cropped to the tile the grid laid down
     * rather than to the padded content box inside it -- the difference between
     * a Windows Phone picture tile and a framed photograph.
     *
     * `naturalRatio` is the source ratio as the browser actually receives it,
     * which is what "photo tiles respect their source aspect ratios" is about.
     * It is asserted as a ratio and not as 752x648 because `next/image` serves
     * a resized variant per frame -- 141x121 at 1440, 196x169 at 393 -- so the
     * literal pixel counts change while the ratio must not: a `sizes`, `width`
     * or `height` edit that silently squashed the source would move it.
     */
    const SOURCE_RATIO = 752 / 648;
    const picture = await panel.evaluate((root) => {
      const img = [...root.querySelectorAll("img")].find(
        (candidate) => candidate.alt !== "",
      ) as HTMLImageElement;
      const tile = img.closest("[data-tile-role]") as HTMLElement;
      const image = img.getBoundingClientRect();
      const box = tile.getBoundingClientRect();
      const style = getComputedStyle(img);

      return {
        alt: img.alt,
        size: tile.dataset.tileSize,
        objectFit: style.objectFit,
        objectPosition: style.objectPosition,
        // The media layer is a child of the tile root, ahead of `.content`.
        inMediaLayer: tile.firstElementChild?.contains(img) ?? false,
        contentIsSecond:
          tile.firstElementChild?.nextElementSibling?.contains(img) ?? true,
        delta: [
          Math.abs(image.x - box.x),
          Math.abs(image.y - box.y),
          Math.abs(image.width - box.width),
          Math.abs(image.height - box.height),
        ],
        naturalRatio: img.naturalWidth / img.naturalHeight,
      };
    });

    expect(picture.size, at).toBe("large");
    expect(picture.objectFit, at).toBe("cover");
    expect(
      Math.abs(picture.naturalRatio - SOURCE_RATIO),
      `${at} natural ratio ${picture.naturalRatio}`,
    ).toBeLessThan(0.02);
    expect(picture.objectPosition, at).toBe("50% 50%");
    expect(picture.inMediaLayer, at).toBe(true);
    expect(picture.contentIsSecond, at).toBe(false);
    expect(picture.alt, at).not.toBe("Portrait of Ajmal Hassan");
    for (const delta of picture.delta) {
      expect(delta, `${at} bleed`).toBeLessThanOrEqual(1);
    }

    /*
     * The veil and the anchor, which are one guarantee and were held by
     * nothing.
     *
     * White copy printed on a photograph is legible or not depending on the
     * photograph; `.photo .media::after` is what makes it a promise, and it is
     * a promise only where two numbers agree. The gradient is opaque from the
     * bottom up to a stop, so it covers the lower `100 - stop` percent of the
     * tile; the note is pushed to the bottom by `.tileFoot`, so it starts at
     * some percent down the tile. The copy is backed exactly when the first
     * number is no larger than the second, and the stop is read out of the
     * computed gradient rather than restated here.
     *
     * Both halves failed silently before this: lowering the stop to 30% and
     * dropping `.tileFoot` each put the note back on the blurred highlight
     * behind the subject's head at 2.29:1, with every gate green.
     *
     * The 40% floor is the second half, and it is the design's own: the veil is
     * drawn for the tightest frame on the site and applied at every frame, so
     * the copy band must not climb above the ceiling that frame set. Measured
     * band tops are 53.72% at 320 rising to 84.23% at 1920.
     */
    const veil = await panel.evaluate((root) => {
      const img = [...root.querySelectorAll("img")].find(
        (candidate) => candidate.alt !== "",
      ) as HTMLImageElement;
      const tile = img.closest("[data-tile-role]") as HTMLElement;
      const media = tile.firstElementChild as HTMLElement;
      const note = (media.nextElementSibling as HTMLElement)
        .firstElementChild as HTMLElement;
      const box = tile.getBoundingClientRect();
      const gradient = getComputedStyle(media, "::after").backgroundImage;
      /*
       * Chromium serialises the stop list as `rgba(r, g, b, a) <position>`.
       * The veil's opaque ceiling is the last stop whose colour is not fully
       * transparent -- read that way rather than by index, so adding a stop
       * does not quietly change which number this reads.
       */
      const stops = [
        ...gradient.matchAll(/(rgba?\([^)]*\))\s+([\d.]+)(%|px)/g),
      ];
      const opaque = stops.filter(([, colour]) => !/,\s*0\)$/.test(colour));
      const last = opaque[opaque.length - 1];

      return {
        gradient,
        stop: last && last[3] === "%" ? Number.parseFloat(last[2]) : Number.NaN,
        band: (note.getBoundingClientRect().top - box.top) / box.height,
        note: (note.textContent ?? "").trim(),
      };
    });

    expect(veil.note, at).not.toBe("");
    expect(
      veil.band * 100,
      `${at} the note starts ${(veil.band * 100).toFixed(2)}% down its tile`,
    ).toBeGreaterThanOrEqual(40);
    expect(Number.isFinite(veil.stop), `${at} ${veil.gradient}`).toBe(true);
    expect(
      100 - veil.stop,
      `${at} veil opaque over the lower ${(100 - veil.stop).toFixed(2)}%, copy from ${(veil.band * 100).toFixed(2)}%`,
    ).toBeLessThanOrEqual(veil.band * 100);

    /*
     * The photographic ground: present, behind everything, and nowhere near the
     * two surfaces the spec keeps clear of imagery.
     */
    const backdrop = await page.evaluate(() => {
      const layer = document.querySelector(
        '[data-pivot="photography"] [data-backdrop="photo"] > span[aria-hidden="true"]',
      ) as HTMLElement;
      const image = layer.querySelector("img") as HTMLImageElement;
      const style = getComputedStyle(layer);
      const imageStyle = getComputedStyle(image);
      const box = layer.getBoundingClientRect();
      const hits = (selector: string) => {
        const other = document.querySelector(selector)!.getBoundingClientRect();

        return (
          Math.min(box.right, other.right) - Math.max(box.left, other.left) >
            0.5 &&
          Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top) >
            0.5
        );
      };

      return {
        alt: image.alt,
        /*
         * The variant the browser actually chose, in device pixels, from the
         * `w=` `next/image` puts in the URL (falling back to what it decoded).
         */
        variant:
          Number.parseInt(
            new URL(
              image.currentSrc || image.src,
              document.baseURI,
            ).searchParams.get("w") ?? "",
            10,
          ) || image.naturalWidth,
        dpr: window.devicePixelRatio,
        opacity: Number.parseFloat(imageStyle.opacity),
        blurred: /blur\(/.test(imageStyle.filter),
        pointerEvents: style.pointerEvents,
        zIndex: style.zIndex,
        hitsNav: hits('nav[aria-label="Portfolio sections"]'),
        hitsAppBar: hits('nav[aria-label="Page actions"]'),
      };
    });

    expect(backdrop.alt, at).toBe("");
    /*
     * What the layer costs, which is the number that matters -- not the
     * `loading="lazy"` attribute this used to assert. That attribute reads as a
     * guarantee the layer is deferred and is not one: all four pivots are laid
     * out on the panorama plane, so the hidden Photography section is inside
     * the lazy threshold and the backdrop is fetched on whichever pivot a
     * reader lands on. At `sizes="100vw"` it was a 1920px variant at 1440 and a
     * 640px one at 393 -- 3.3x the bytes of the portrait a reader can see, for
     * a layer that is greyscale, blurred 24px and painted at 12%.
     *
     * 384 is a device-pixel ceiling, not a CSS-pixel one: a `srcset` candidate
     * is chosen in device pixels, so a `devicePixelRatio`-scaled ceiling would
     * pass whatever the layer asked for and assert nothing. 384 is the
     * largest of `next/image`'s own `imageSizes`, one step above the 352
     * device pixels the 128px layer asks for on the Pixel 5 project (DPR
     * 2.75), which absorbs the browser rounding that candidate up; on the
     * Desktop Chrome project (DPR 1) the same layer asks for 128 outright.
     */
    expect(backdrop.variant, at).toBeGreaterThan(0);
    expect(
      backdrop.variant,
      `${at} backdrop variant ${backdrop.variant}px at DPR ${backdrop.dpr}`,
    ).toBeLessThanOrEqual(384);
    expect(backdrop.opacity, at).toBeLessThanOrEqual(0.12);
    expect(backdrop.blurred, at).toBe(true);
    expect(backdrop.pointerEvents, at).toBe("none");
    expect(Number.parseFloat(backdrop.zIndex), at).toBeLessThan(0);
    expect(backdrop.hitsNav, at).toBe(false);
    expect(backdrop.hitsAppBar, at).toBe(false);

    /*
     * Captions stay visible and useful: the two working titles are the only
     * thing on those tiles that says which unmade selection they stand for, and
     * a caption behind an ellipsis is not a caption.
     */
    const captions = await panel.evaluate((root) =>
      [...root.querySelectorAll<HTMLElement>("[data-tile-role]")].map(
        (tile) => {
          const caption = tile.lastElementChild as HTMLElement;
          const range = document.createRange();
          range.selectNodeContents(caption);

          return {
            text: caption.textContent ?? "",
            drawn: range.getBoundingClientRect().width,
            box: caption.getBoundingClientRect().width,
            // Children are `[media?, content, caption]`, so the face is always
            // the one before the caption, media layer or no media layer.
            face: (
              tile.children[tile.children.length - 2]?.textContent ?? ""
            ).trim(),
          };
        },
      ),
    );

    expect(
      captions.map((caption) => caption.text),
      at,
    ).toEqual(["Portrait", "streets / in transit", "light / geometry"]);
    expect(
      captions.filter((caption) => /Selection in progress/.test(caption.face))
        .length,
      at,
    ).toBe(2);
    for (const caption of captions) {
      const where = `${at} ${caption.text}`;
      expect(caption.drawn, where).toBeGreaterThan(0);
      expect(caption.drawn, where).toBeLessThanOrEqual(caption.box + 0.1);
    }
  });
}

/*
 * Me is a Start screen of nine tiles over 24 grid units: six complete rows of
 * four on a phone, three complete rows of eight on a wide canvas. Asserting the
 * grid's own height is what proves the packing -- a hole anywhere in the middle
 * would push the block onto another row.
 *
 * Extending this grid: a future tile must keep the unit total (`ME_UNITS`) a
 * multiple of both 8 (hole-free at eight columns) and 4 (hole-free at four),
 * and must keep the 4-wide hero on a row boundary (it is what forces the hero
 * to lead at both column counts -- see the ordering note in ProfileTiles.tsx).
 * Both `ME_TILES` and `ME_UNITS` have to be updated together, or this test
 * fails on purpose: a tile count with no matching unit count is exactly the
 * kind of drift this packing test exists to catch.
 */
const ME_TILES = 9;
const ME_UNITS = 24;
/*
 * Named positions into the Me tile list, in the same DOM/visual order
 * `ProfileTiles.test.tsx`'s `APPROVED_GRID` pins. Only the four this file
 * addresses are named here.
 */
const HERO = 0; // capability graph
const ASSESSMENT = 5; // live AI assessment
const CRAFT = 6; // the craft arrow, captioned `full stack`
const LEADERSHIP = 8; // leadership method
/*
 * Where a tile's supporting line starts being painted (84rem). The number is
 * measured -- below 1278px a note loses a line to its clamp -- and it is
 * deliberately not 1440: a browser with a classic 15-17px scrollbar lays a
 * 1440 window out at 1423-1425, so a threshold of 90rem hid every supporting
 * line on the exact frame the spec requires.
 */
const ME_NOTE_PAINT = 1344;

for (const frame of [
  { width: 320, height: 568 },
  { width: 393, height: 851 },
  // The tightest frame of all: the grid doubles to eight columns at 48rem, so
  // a tile is 81px here -- half of what it is one pixel below the breakpoint.
  { width: 768, height: 1024 },
  // The 8-column band where a unit is large but no note is painted yet (48rem–84rem):
  // the widest a `value` gets before --unit-note claws its budget back. 900 sits
  // inside the band that used to ellipsise the Lumia numeral; 1024 clears it by 0.13px.
  { width: 900, height: 700 },
  { width: 1024, height: 768 },
  // A 1440 window in a browser that reserves 17px for a scrollbar. Headless
  // Chromium's overlay scrollbar hides this frame, which is exactly why it is
  // stated: every supporting line has to survive it.
  { width: 1423, height: 900 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const) {
  test(`Me packs its Start screen and keeps every word inside a tile at ${frame.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(frame);
    await page.goto("/?view=me");

    const panel = page.getByRole("tabpanel", { name: HEADINGS.me });
    const grid = panel.locator("[data-tile-grid]");
    await expect(panel.locator("[data-tile-role]")).toHaveCount(ME_TILES);
    // Résumé and contact are app-bar commands; the grid does not repeat them.
    await expect(panel.getByRole("link")).toHaveCount(0);

    const packing = await grid.evaluate((node, units) => {
      const style = getComputedStyle(node);
      const columns = style.gridTemplateColumns.split(" ").length;
      const gap = Number.parseFloat(style.columnGap);
      const unit = Number.parseFloat(style.gridAutoRows);
      const rows = units / columns;

      return {
        columns,
        rows,
        height: node.getBoundingClientRect().height,
        expected: rows * unit + (rows - 1) * gap,
      };
    }, ME_UNITS);

    const at = `${frame.width}px`;
    expect(packing.columns, at).toBe(frame.width < 768 ? 4 : 8);
    expect(Number.isInteger(packing.rows), at).toBe(true);
    expect(Math.abs(packing.height - packing.expected), at).toBeLessThanOrEqual(
      1,
    );

    // Nothing a tile paints may leave its rectangle, lose a line to a clamp, or
    // be ellipsised away.
    expect(await panel.evaluate(tileCopyFaults), at).toEqual([]);

    /*
     * The facts the spec names for a face -- `full stack`, the three notions of
     * the leadership tile, and the supporting lines -- measured on the tightest
     * box each of them owns; and the two motifs that share a box with copy,
     * measured against that copy. A motif's rectangle may meet the copy's edge
     * but never cross it: at 320 a graph drawn over the whole hero puts a lit
     * cyan ring on the word "assessment", and a fixed-height waveform crosses a
     * claim that has wrapped to two lines.
     */
    const faces = await panel.evaluate(
      (root, indices) => {
        const tiles = [
          ...root.querySelectorAll<HTMLElement>("[data-tile-role]"),
        ];
        const rangeWidth = (node: Element) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return range.getBoundingClientRect().width;
        };
        const inner = (tile: HTMLElement) => {
          const style = getComputedStyle(tile);
          return (
            tile.getBoundingClientRect().width -
            Number.parseFloat(style.paddingLeft) -
            Number.parseFloat(style.paddingRight)
          );
        };
        // A motif and the copy it sits under are siblings, so reading the
        // copy as `previousElementSibling` also asserts that the motif still
        // follows it.
        const crosses = (motif: Element) => {
          const a = motif.getBoundingClientRect();
          const b = (
            motif.previousElementSibling as Element
          ).getBoundingClientRect();

          return (
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5
          );
        };

        const craft = tiles[indices.craft];
        const caption = craft.lastElementChild as HTMLElement;
        const title = tiles[indices.leadership].querySelector(
          "strong",
        ) as HTMLElement;
        const note = title.nextElementSibling as HTMLElement;
        const titleLine = Number.parseFloat(getComputedStyle(title).lineHeight);

        return {
          caption: caption.textContent ?? "",
          captionWidth: rangeWidth(caption),
          captionBox: inner(craft),
          captionEllipsised: caption.scrollWidth > caption.clientWidth,
          title: title.textContent ?? "",
          titleClamped:
            title.scrollHeight > title.clientHeight + titleLine * 0.5,
          notePainted: getComputedStyle(note).position !== "absolute",
          noteWidth: note.getBoundingClientRect().width,
          graphCrossesCopy: crosses(
            tiles[indices.hero].querySelector("svg") as SVGElement,
          ),
          waveCrossesClaim: crosses(
            tiles[indices.assessment].querySelector("svg") as SVGElement,
          ),
        };
      },
      {
        hero: HERO,
        assessment: ASSESSMENT,
        craft: CRAFT,
        leadership: LEADERSHIP,
      },
    );

    // The craft tile's whole claim is its caption, so an ellipsis there is the
    // fact going missing rather than a word being shortened.
    expect(faces.caption, at).toMatch(/full stack/i);
    expect(faces.captionEllipsised, at).toBe(false);
    expect(faces.captionWidth, at).toBeLessThanOrEqual(faces.captionBox);

    expect(faces.title, at).toMatch(/hands-on/i);
    expect(faces.title, at).toMatch(/product/i);
    expect(faces.title, at).toMatch(/team/i);
    expect(faces.titleClamped, at).toBe(false);

    const painted = frame.width >= ME_NOTE_PAINT;
    expect(faces.notePainted, at).toBe(painted);
    expect(faces.noteWidth > 1, at).toBe(painted);

    expect(faces.waveCrossesClaim, at).toBe(false);
    // From 48rem the hero is tall enough for the trace to sit behind its copy
    // again, which is that tile's design; on a phone it is not.
    if (frame.width < 768) expect(faces.graphCrossesCopy, at).toBe(false);
  });
}

/*
 * A minority of tiles move: the two live tiles change claims, and exactly one
 * graphic animates. The capability graph is a state, not an animation, and the
 * waveform stops dead when the reader asks for less motion.
 */
test("Me animates one restrained waveform and stills it for reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?view=me");

  const wave = page.locator('[data-pivot="me"] [data-tile-role="live"] svg g');
  await expect(wave).toHaveCount(1);

  const shiftOf = () =>
    wave.evaluate((node) => ({
      shift: getComputedStyle(
        node.closest("[data-tile-role]") as HTMLElement,
      ).getPropertyValue("--wave-shift"),
      animated: getComputedStyle(
        node.closest("[data-tile-role]") as HTMLElement,
      ).animationName,
      transform: getComputedStyle(node).transform,
    }));

  const first = await shiftOf();
  await page.waitForTimeout(1000);
  const second = await shiftOf();
  expect(first.animated).not.toBe("none");
  // A registered custom property interpolates; an unregistered one would jump.
  expect(second.shift).not.toBe(first.shift);

  // The graph carries no animation of its own, at either motion setting.
  const graph = page.locator('[data-pivot="me"] [data-tile-size="hero"]');
  await expect(graph).toHaveCSS("animation-name", "none");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const stilled = await shiftOf();
  await page.waitForTimeout(800);

  expect(stilled.animated).toBe("none");
  expect(stilled.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
  expect((await shiftOf()).shift).toBe(stilled.shift);
});

/*
 * The panorama clips its inactive panels, and a focus ring is painted outside
 * the element it belongs to -- so the clip edge used to slice the ring on the
 * first and last column of tiles in half. The clip box now bleeds by the ring's
 * full reach while the content column stays put, which is only true if the tile
 * sits strictly inside the clipped rectangle.
 */
test("a focused edge tile keeps its whole focus ring inside the panorama", async ({
  page,
}) => {
  // 3px ring at a 3px outline-offset: the ring's outer edge is 6px out.
  const ringReach = 6;
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/?view=projects");

  const tile = page
    .getByRole("tabpanel", { name: HEADINGS.projects })
    .getByRole("link")
    .first();
  await tabTo(page, tile);
  await expect(tile).toBeFocused();

  const panoramaBox = await page.locator("[data-panorama]").boundingBox();
  const tileBox = await tile.boundingBox();
  expect(panoramaBox).not.toBeNull();
  expect(tileBox).not.toBeNull();

  expect((tileBox?.x ?? 0) - (panoramaBox?.x ?? 0)).toBeGreaterThanOrEqual(
    ringReach,
  );
  expect(
    (panoramaBox?.x ?? 0) +
      (panoramaBox?.width ?? 0) -
      ((tileBox?.x ?? 0) + (tileBox?.width ?? 0)),
  ).toBeGreaterThanOrEqual(ringReach);

  // A wider clip box must not become a wider page.
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const [scrollWidth, innerWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(scrollWidth, `${width}px`).toBe(innerWidth);
  }
});

test("app-bar commands keep circular rings and 44px targets on every frame", async ({
  page,
}) => {
  await page.goto("/?view=me");

  for (const frame of [
    { width: 320, height: 568 },
    // Straddles the single `48rem` breakpoint: 767 must be a phone and 768 must
    // not, which is only true while the two media queries tile the axis exactly.
    { width: 767, height: 800 },
    { width: 768, height: 800 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(frame);
    const commands = page.locator(`${APP_BAR} :is(a, button)`);
    const label = `${frame.width}x${frame.height}`;
    await expect(commands, label).toHaveCount(3);

    // The overflow command is the last of the three and is a no-op at phone
    // widths -- labels are unconditional there -- so it is not painted and has
    // no box to measure. The two real commands are always drawn.
    const painted = frame.width < 768 ? 2 : 3;
    const overflow = page.getByRole("button", { name: /app bar labels/ });

    if (painted === 3) {
      await expect(overflow, label).toBeVisible();
    } else {
      await expect(overflow, label).toBeHidden();
    }

    for (let index = 0; index < painted; index += 1) {
      const command = commands.nth(index);
      const ring = command.locator("span").first();
      const commandBox = await command.boundingBox();
      const ringBox = await ring.boundingBox();
      const at = `${label} command ${index}`;

      expect(commandBox, at).not.toBeNull();
      expect(ringBox, at).not.toBeNull();
      expect(commandBox?.width ?? 0, at).toBeGreaterThanOrEqual(44);
      expect(commandBox?.height ?? 0, at).toBeGreaterThanOrEqual(44);
      expect(ringBox?.width ?? 0, at).toBeGreaterThanOrEqual(34);
      expect(
        Math.abs((ringBox?.width ?? 0) - (ringBox?.height ?? 1)),
        at,
      ).toBeLessThanOrEqual(0.5);
      await expect(ring, at).toHaveCSS("border-radius", "50%");
      await expect(command, at).toHaveCSS("border-radius", "0px");
    }
  }
});

test("a compact phone shows every command label under its ring", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/?view=me");

  const labels = page.locator(`${APP_BAR} a > span:nth-child(2)`);
  await expect(labels).toHaveText(["Résumé", "Contact"]);
  await expect(labels.first()).toBeVisible();
  await expect(labels.last()).toBeVisible();

  const ring = page.locator(`${APP_BAR} a > span:first-child`).first();
  const ringBox = await ring.boundingBox();
  const labelBox = await labels.first().boundingBox();
  expect((ringBox?.y ?? 0) + (ringBox?.height ?? 0)).toBeLessThanOrEqual(
    labelBox?.y ?? 0,
  );
  await expect(
    page.getByRole("button", { name: /app bar labels/ }),
  ).toBeHidden();
});

test("a wide layout ships labelled commands and collapses only on demand", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?view=me");

  const bar = page.locator(APP_BAR);
  const labels = page.locator(`${APP_BAR} a > span:nth-child(2)`);
  await expect(labels).toHaveText(["Résumé", "Contact"]);
  await expect(labels.first()).toBeVisible();
  await expect(labels.last()).toBeVisible();

  const hide = page.getByRole("button", { name: "Hide app bar labels" });
  await expect(hide).toHaveAttribute("aria-expanded", "true");
  const expandedHeight = (await bar.boundingBox())?.height ?? 0;
  expect(expandedHeight).toBeGreaterThan(0);

  await hide.click();
  const show = page.getByRole("button", { name: "Show app bar labels" });
  await expect(show).toHaveAttribute("aria-expanded", "false");

  /*
   * `toBeVisible` cannot express this: the collapsed label keeps a 1x1 box and
   * Playwright counts any non-empty box as visible. So the collapse is measured
   * instead -- the label occupies no readable area -- while the accessible names
   * below prove the text is still there naming its link. Together those pin the
   * behaviour without naming the technique that achieves it, leaving a future
   * task free to swap the hiding mechanism as long as both stay true.
   */
  for (const label of [labels.first(), labels.last()]) {
    const box = await label.boundingBox();
    expect(box?.width ?? 99).toBeLessThanOrEqual(1);
    expect(box?.height ?? 99).toBeLessThanOrEqual(1);
  }

  await expect(page.getByRole("link", { name: "Résumé" })).toHaveAccessibleName(
    "Résumé",
  );
  await expect(page.getByRole("link", { name: "Contact" })).toHaveAccessibleName(
    "Contact",
  );
  expect((await bar.boundingBox())?.height ?? 0).toBeCloseTo(expandedHeight, 1);

  await show.click();
  await expect(labels.first()).toBeVisible();
  expect((await labels.first().boundingBox())?.height ?? 0).toBeGreaterThan(1);
});

test("the phone layout keeps its labels and drops the overflow command", async ({
  page,
}) => {
  // Pixel 5's own frame, so the mobile project runs this at its native size.
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto("/?view=me");

  const labels = page.locator(`${APP_BAR} a > span:nth-child(2)`);
  await expect(labels).toHaveText(["Résumé", "Contact"]);
  await expect(labels.first()).toBeVisible();
  await expect(labels.last()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /app bar labels/ }),
  ).toBeHidden();
});

test("the fixed app bar reserves its height instead of covering the page end", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/?view=projects");
  await page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });

  const bar = await page.locator(APP_BAR).boundingBox();
  const lastLink = await page
    .locator("#contact")
    .getByRole("link")
    .last()
    .boundingBox();

  expect(bar).not.toBeNull();
  expect(lastLink).not.toBeNull();
  expect((lastLink?.y ?? 0) + (lastLink?.height ?? 0)).toBeLessThanOrEqual(
    bar?.y ?? 0,
  );
});

test("résumé uses a white page canvas when printed", async ({ page }) => {
  await page.emulateMedia({ media: "print" });
  await page.goto("/resume");

  const backgrounds = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    html: getComputedStyle(document.documentElement).backgroundColor,
    resume: getComputedStyle(document.querySelector("main")!).backgroundColor,
  }));

  expect(backgrounds).toEqual({
    body: "rgb(255, 255, 255)",
    html: "rgb(255, 255, 255)",
    resume: "rgb(255, 255, 255)",
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("core content, destinations, and every pivot remain keyboard reachable", async ({
    page,
  }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveAccessibleName(HEADINGS.me);
    await expect(heading).toBeVisible();

    for (const view of VIEWS) {
      const pivot = page.getByRole("tab", { name: HEADINGS[view] });
      await expect(pivot).toHaveAttribute("href", `/?view=${view}`);
      await page.keyboard.press("Tab");
      await expect(pivot).toBeFocused();
    }

    await expect(page.getByRole("link", { name: "Résumé" })).toHaveAttribute(
      "href",
      "/resume",
    );
    await expect(page.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "#contact",
    );
  });

  test("server markup already shows the selected pivot's heading", async ({
    page,
  }) => {
    for (const view of VIEWS) {
      await page.goto(`/?view=${view}`);

      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading, view).toHaveCount(1);
      await expect(heading, view).toHaveAccessibleName(HEADINGS[view]);
      await expect(page.getByRole("tab").first(), view).toHaveAccessibleName(
        HEADINGS[view],
      );
    }

    // No script means no measurement: the leading heading has to start at the
    // content inset because the markup order already puts it there.
    await page.goto("/?view=projects");
    const width = page.viewportSize()?.width ?? 0;
    const inset = Math.min(Math.max(16, width * 0.04), 72);
    const box = await page.getByRole("tab").first().boundingBox();

    expect(box).not.toBeNull();
    expect(Math.abs((box?.x ?? 0) - inset)).toBeLessThanOrEqual(1);
  });
});
