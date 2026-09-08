import { expect, type Locator, type Page, test } from "@playwright/test";
import { profile } from "../../content/profile";
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
/*
 * The application's identity line. It is `aria-hidden` -- the page's own
 * heading names the page -- so it is located by the text it paints, which is
 * also what makes it usable as the content column's left edge below.
 */
const IDENTITY = "AJMAL / PORTFOLIO";

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
  await expect(
    page.getByRole("tab", { name: HEADINGS.projects }),
  ).toHaveAttribute("aria-selected", "true");

  await page.getByRole("tab", { name: HEADINGS.blog }).click();
  await expect(page).toHaveURL(/\?view=blog$/);
  await expect(page.getByRole("tab", { name: HEADINGS.blog })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(/\?view=projects$/);
  await expect(
    page.getByRole("tab", { name: HEADINGS.projects }),
  ).toHaveAttribute("aria-selected", "true");

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
  await expect(
    newPage.getByRole("tab", { name: HEADINGS.projects }),
  ).toHaveAttribute("aria-selected", "true");
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

test("contact follows fragment history and close clears it", async ({
  page,
}) => {
  await page.goto("/?view=me");
  await page.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(
    page.getByRole("button", { name: "Close contact" }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/#contact$/);
  await expect(
    page.getByRole("button", { name: "Close contact" }),
  ).toBeHidden();

  await page.getByRole("link", { name: "Contact" }).click();
  await page.getByRole("button", { name: "Close contact" }).click();
  await expect(page).not.toHaveURL(/#contact$/);
  await expect(page.getByRole("link", { name: "Contact" })).toBeFocused();
});

test("direct fragment load opens contact and close keeps the pivot query", async ({
  page,
}) => {
  await page.goto("/?view=projects#contact");
  await expect(
    page.getByRole("button", { name: "Close contact" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: HEADINGS.projects }),
  ).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: "Close contact" }).click();
  await expect(page).toHaveURL(/\/\?view=projects$/);
  await expect(
    page.getByRole("button", { name: "Close contact" }),
  ).toBeHidden();
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
  await expect(
    page.getByRole("button", { name: "Close contact" }),
  ).toBeHidden();
  await expect(page.getByRole("link", { name: "Contact" })).not.toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(/\/\?view=me#contact$/);
  await expect(
    page.getByRole("button", { name: "Close contact" }),
  ).toBeVisible();
});

test("arrow keys navigate pivots through their real links", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: HEADINGS.me }).focus();
  await page.keyboard.press("ArrowRight");

  await expect(page).toHaveURL(/\?view=projects$/);
  await expect(
    page.getByRole("tab", { name: HEADINGS.projects }),
  ).toBeFocused();
  await expect(
    page.getByRole("tab", { name: HEADINGS.projects }),
  ).toHaveAttribute("aria-selected", "true");
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
    expect(
      Math.abs((large?.width ?? 0) - (large?.height ?? 1)),
      at,
    ).toBeLessThanOrEqual(1);
    // A 4x2 tile spans three gutters across and one down, so its width is two
    // of its own heights plus the extra gutter -- the 4:2 ratio in a gapped grid.
    expect(
      Math.abs((hero?.width ?? 0) - (2 * (hero?.height ?? 0) + gap)),
      at,
    ).toBeLessThanOrEqual(2);
    expect(
      Math.abs((hero?.height ?? 0) - (large?.height ?? 1)),
      at,
    ).toBeLessThanOrEqual(1);
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

    /*
     * The reading list does not move. Not "moves less" -- a list that
     * re-shuffled itself under a reader mid-sentence is the opposite of what
     * this pivot is for -- so the assertion is on the list itself and it is
     * zero at every moment, including the frames right after the pivot is
     * selected, when the tile above it is running its entrance.
     */
    expect(
      await panel.evaluate((root) => {
        const list = root.querySelector("ol");
        return list ? list.getAnimations({ subtree: true }).length : -1;
      }),
      at,
    ).toBe(0);

    /*
     * And once the hub has arrived, nothing on it moves at all: Me owns the
     * one live cycle on the site, and the entrance stagger is an arrival, not
     * a state -- it leaves the animation registry when it is done rather than
     * parking a filled animation on every tile forever.
     */
    await expect
      .poll(
        () =>
          panel.evaluate(
            (root) => root.getAnimations({ subtree: true }).length,
          ),
        { message: at },
      )
      .toBe(0);

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

  // The waveform is the tile's own animation, beside the entrance every tile
  // on the panel shares -- and it is the only one of the two still running.
  expect(first.animated).toContain("waveDrift");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .querySelector('[data-pivot="me"]')
            ?.getAnimations({ subtree: true })
            .filter((animation) => animation.playState === "running").length,
      ),
    )
    .toBe(1);

  /*
   * The capability graph is a state, not an animation: it carries the shared
   * entrance and nothing of its own. Naming what is absent rather than
   * asserting `none` is what survived the entrance arriving -- a bare `none`
   * would have failed on a tile that is simply arriving with its panel.
   */
  const graph = page.locator('[data-pivot="me"] [data-tile-size="hero"]');
  await expect(graph).toHaveCSS("animation-name", "metroTileRise");

  /*
   * ...and it stops when the reader leaves. Me's panel is still in the document
   * on every other pivot, `visibility: hidden` behind the plane, and the wave
   * kept drifting there for nobody. Paused rather than cancelled, so coming
   * back to Me picks the wave up where it was instead of restarting it.
   */
  const waveStates = () =>
    page.evaluate(() =>
      (document.querySelector('[data-pivot="me"]') as HTMLElement)
        .getAnimations({ subtree: true })
        .filter((animation) =>
          String(
            (animation as Animation & { animationName?: string })
              .animationName ?? "",
          ).includes("waveDrift"),
        )
        .map((animation) => animation.playState),
    );

  await page.getByRole("tab", { name: HEADINGS.projects }).click();
  await expect.poll(waveStates).toEqual(["paused"]);

  await page.getByRole("tab", { name: HEADINGS.me }).click();
  await expect.poll(waveStates).toEqual(["running"]);
  const resumed = await shiftOf();
  await page.waitForTimeout(1000);
  expect((await shiftOf()).shift).not.toBe(resumed.shift);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const stilled = await shiftOf();
  await page.waitForTimeout(800);

  // The wave is gone from the tile's animation list; the opacity-only entrance
  // is what is left, and the drift it drove stands still.
  expect(stilled.animated).not.toContain("waveDrift");
  expect(stilled.animated).toBe("metroTileFade");
  expect(stilled.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
  expect((await shiftOf()).shift).toBe(stilled.shift);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
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

/*
 * Every surface that docks an application bar, and the commands each one
 * carries. One dock draws all of them (`components/metro/AppBarDock`), so a
 * change to the strip is measured on the panorama and on all four detail
 * routes at once -- which is the whole point of there being one of it.
 *
 * A function rather than a constant because one of those paths is the newest
 * note's, which `beforeAll` fills in from the posts directory. The titles below
 * are built from `name`, which is fixed, so the suite lists the same cases
 * whatever is published, and each test re-reads its own row once the path is
 * known.
 */
function dockedSurfaces() {
  return [
    { name: "/?view=me", path: "/?view=me", commands: 2 },
    { name: LEAD_PLATFORM, path: LEAD_PLATFORM, commands: 3 },
    /*
     * Back plus the two primaries, and the widest bar this application draws:
     * `field notes` is the longest back label at 56px -- against `projects` 43,
     * `portfolio` 45, `blog` 23 -- which puts the article's command row at
     * 176.06px where the case study's is 164, on a bar that is 288px wide at
     * 320. Nothing else can see that row overflow: the dock is `position:
     * fixed`, and fixed overflow does not extend document scroll, so the
     * `rowEnd <= barRight` assertion inside this loop is the whole guard.
     */
    { name: "/blog/<newest>", path: newestHref, commands: 3 },
    { name: "/blog", path: "/blog", commands: 3 },
    { name: "/resume", path: "/resume", commands: 2 },
  ] as const;
}

const DOCK_FRAMES = [
  { width: 320, height: 568 },
  { width: 393, height: 851 },
  // Straddles the single `48rem` breakpoint: 767 must be a phone and 768 must
  // not, which is only true while the two media queries tile the axis exactly.
  { width: 767, height: 800 },
  { width: 768, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

for (const [index, listed] of dockedSurfaces().entries()) {
  test(`app-bar commands keep circular rings and 44px targets on ${listed.name}`, async ({
    page,
  }) => {
    // Read once `beforeAll` has resolved the newest note into a real path.
    const surface = dockedSurfaces()[index];
    await page.goto(surface.path);

    for (const frame of DOCK_FRAMES) {
      await page.setViewportSize(frame);
      const commands = page.locator(`${APP_BAR} :is(a, button)`);
      const label = `${surface.path} ${frame.width}x${frame.height}`;
      await expect(commands, label).toHaveCount(surface.commands + 1);

      // The overflow command is the last one and is a no-op at phone widths --
      // labels are unconditional there -- so it is not painted and has no box
      // to measure. The named commands are always drawn.
      const painted =
        frame.width < 768 ? surface.commands : surface.commands + 1;
      const overflow = page.getByRole("button", { name: /app bar labels/ });

      if (painted > surface.commands) {
        await expect(overflow, label).toBeVisible();
      } else {
        await expect(overflow, label).toBeHidden();
      }

      // The bar is the height the page shell reserves for it, from the one
      // token both read.
      const barBox = await page.locator(APP_BAR).boundingBox();
      expect(barBox?.height ?? 0, label).toBeCloseTo(72, 1);

      /*
       * The dock indents to the content column, not to the viewport: the first
       * command starts exactly where the identity line does. That is one
       * measurement rather than two because the dock and the page shell take
       * their inset from the same pair of custom properties -- if either is
       * edited alone, this is what says so.
       */
      const identity = await page.getByText(IDENTITY).boundingBox();
      const first = await commands.first().boundingBox();
      expect(identity, label).not.toBeNull();
      expect(first?.x ?? -1, label).toBeCloseTo(identity?.x ?? -1, 1);

      let previousRight = -Infinity;

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
        expect(ringBox?.width ?? 0, at).toBeCloseTo(34, 1);
        expect(
          Math.abs((ringBox?.width ?? 0) - (ringBox?.height ?? 1)),
          at,
        ).toBeLessThanOrEqual(0.5);
        await expect(ring, at).toHaveCSS("border-radius", "50%");
        await expect(ring, at).toHaveCSS("border-top-width", "2px");
        await expect(command, at).toHaveCSS("border-radius", "0px");

        /*
         * Three commands on a 288px bar is the case the row can break, and it
         * breaks by overflowing rather than by clipping. A label's own box
         * cannot say so: `.command` is `flex: none` and `.label` has no width
         * constraint, so every label span is shrink-to-fit and its
         * `scrollWidth` equals its `clientWidth` by construction -- one
         * measured 307/307 while hanging 139px outside the bar. The two
         * assertions that can fail are here and just below: no command starts
         * before its neighbour ended, and the row ends inside the bar.
         */
        expect(commandBox?.x ?? 0, `${at} overlap`).toBeGreaterThanOrEqual(
          previousRight,
        );
        previousRight = (commandBox?.x ?? 0) + (commandBox?.width ?? 0);
      }

      // ...and the whole row stays inside the bar it is docked in.
      expect(previousRight, `${label} bar overflow`).toBeLessThanOrEqual(
        (barBox?.x ?? 0) + (barBox?.width ?? 0) + 0.5,
      );

      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollWidth, label).toBe(clientWidth);
    }
  });
}

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
  await expect(
    page.getByRole("link", { name: "Contact" }),
  ).toHaveAccessibleName("Contact");
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

  /*
   * "In every state" includes the state a phone cannot reach on its own.
   * Minimizing is a class the component adds, and the component cannot see a
   * viewport -- so a bar minimized on a wide window and then narrowed would
   * arrive here with its labels clipped and no visible control to restore
   * them. The stylesheet's phone rule is what stops that, and this is the
   * only thing that exercises it.
   */
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Hide app bar labels" }).click();
  // Measured, not `toBeHidden`: a clipped label keeps a 1x1 box, and Playwright
  // counts any non-empty box as visible (see the wide-layout test above).
  expect(
    (await labels.first().boundingBox())?.height ?? 99,
  ).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 393, height: 851 });
  for (const label of [labels.first(), labels.last()]) {
    expect((await label.boundingBox())?.height ?? 0).toBeGreaterThan(1);
  }
  await expect(labels).toHaveText(["Résumé", "Contact"]);
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

/*
 * There is ONE gap above the application bar, not two.
 *
 * Two things on this site have to clear the fixed bar, and they used to
 * disagree: a docked page padded its end by the bar's height plus one content
 * inset (24px), while the contact panel offset its bottom edge by the bar's
 * height plus `--metro-gap-title` (8px) -- a typographic token borrowed for a
 * layout reserve. An open panel therefore sat 16px closer to the bar than every
 * page end on the site, which is the kind of difference nobody can name and
 * everybody can see.
 *
 * Measured rather than read off the stylesheet: the panel's own bottom edge
 * against the bar's own top edge, and the page's bottom padding against the
 * same number. Both frames, because the reserve carries an `env()` term that
 * only a device with a safe area fills in.
 */
for (const frame of [
  { width: 320, height: 568 },
  { width: 1440, height: 900 },
] as const) {
  test(`the contact panel and the page end clear the bar by the same gap at ${frame.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(frame);
    await page.goto("/");
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page.locator("#contact")).toHaveAttribute("data-open", "true");

    const bar = await page.locator(APP_BAR).boundingBox();
    const panel = await page.locator("#contact").boundingBox();
    expect(bar).not.toBeNull();
    expect(panel).not.toBeNull();

    // The dock is the bar plus nothing, so the bar's top edge is where the
    // reserve has to end.
    const gap = (bar?.y ?? 0) - ((panel?.y ?? 0) + (panel?.height ?? 0));
    const reserve = await page.evaluate(() =>
      Number.parseFloat(
        getComputedStyle(document.querySelector("main")!).paddingBottom,
      ),
    );
    const barHeight = await page.evaluate(
      (selector) =>
        Number.parseFloat(
          getComputedStyle(document.querySelector(selector)!).minHeight,
        ),
      APP_BAR,
    );

    // 72px bar + 24px inset, and the panel's gap is what is left over the bar.
    expect(reserve, `${frame.width} page reserve`).toBeCloseTo(
      barHeight + 24,
      1,
    );
    expect(gap, `${frame.width} panel gap`).toBeCloseTo(24, 1);
  });
}

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

  // Black ink on that white canvas, on the root the sheet inherits from.
  await expect(page.locator("main")).toHaveCSS("color", "rgb(0, 0, 0)");

  /*
   * Screen chrome does not print. The phone's status line and its application
   * bar are the application around the document, not the document: a fixed
   * strip would repeat on every sheet, and a clock is not part of a résumé.
   */
  const chrome = await page.evaluate((identity) => {
    const line = [...document.querySelectorAll<HTMLElement>("div")].find(
      (node) => node.textContent?.startsWith(identity),
    );
    const bar = document.querySelector('nav[aria-label="Page actions"]');

    return {
      identityFound: Boolean(line),
      identity: line ? getComputedStyle(line).display : null,
      barFound: Boolean(bar),
      dock: bar ? getComputedStyle(bar.parentElement!).display : null,
    };
  }, IDENTITY);

  expect(chrome).toEqual({
    identityFound: true,
    identity: "none",
    barFound: true,
    dock: "none",
  });

  // The reserve goes with the bar: 96px of white at the end of the last sheet
  // is the reserve for a strip that is not printed.
  await expect(page.locator("main")).toHaveCSS("padding-bottom", "0px");

  // Every link still prints where it points, so a paper résumé is usable.
  await expect(page.locator("main a").first()).toHaveCSS(
    "break-inside",
    "auto",
  );
  const printedHref = await page.evaluate(() => {
    const link = document.querySelector<HTMLAnchorElement>("main a[href]")!;
    return {
      content: getComputedStyle(link, "::after").content,
      href: link.getAttribute("href"),
    };
  });
  expect(printedHref.content).toContain(printedHref.href);

  // Nothing on the sheet is set in anything but ink -- neither the words nor
  // the rules, fills and markers drawn around them.
  expect(await page.evaluate(nonBlackPrintedText)).toEqual([]);
  expect(await page.evaluate(nonInkPrintedBoxes)).toEqual([]);
});

/*
 * Every visible word inside `<main>`, and the colour it would be printed in.
 * Runs in the page, so it closes over nothing.
 *
 * Text nodes rather than elements: a heading's colour is set on the heading and
 * a `<time>` inherits from the row, so walking elements finds the containers
 * and misses which of them actually paint ink. `offsetParent === null` drops
 * the chrome that hides itself in print -- the identity line and the whole dock
 * -- along with anything else `display: none` removes, which is exactly the set
 * that reaches no sheet.
 */
function nonBlackPrintedText(): string[] {
  const walker = document.createTreeWalker(
    document.querySelector("main")!,
    NodeFilter.SHOW_TEXT,
  );
  const found: string[] = [];

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = (node.textContent ?? "").trim();
    const parent = node.parentElement;
    if (!text || !parent || parent.offsetParent === null) continue;

    const color = getComputedStyle(parent).color;
    if (color !== "rgb(0, 0, 0)") found.push(`${text.slice(0, 40)} → ${color}`);
  }

  return found;
}

/*
 * The rest of the sheet: every visible box's fill, its four border colours, and
 * whatever its pseudo-elements paint. The walk above sees ink only where there
 * are words, which leaves a cyan rule, a filled panel or a hairline free to
 * print itself onto white paper with nothing failing -- and the résumé's list
 * markers are `background` on a `::before`, so the one decoration this document
 * language actually draws is invisible to a text walk by construction.
 *
 * Paper is transparent or white, because the canvas underneath is the sheet;
 * ink is black. A pseudo-element may be black *background* as well -- that is
 * what a 6px square marker is -- while an element's own fill may not, because a
 * black box is not a printed word.
 */
function nonInkPrintedBoxes(): string[] {
  const PAPER = ["rgba(0, 0, 0, 0)", "rgb(255, 255, 255)"];
  const INK = "rgb(0, 0, 0)";
  const SIDES = ["Top", "Right", "Bottom", "Left"] as const;
  const found: string[] = [];

  for (const element of document.querySelectorAll("main *")) {
    // An SVG has no `offsetParent` to test, and its glyphs are `currentColor`
    // strokes inside chrome that does not print at all.
    if (element.closest("svg")) continue;
    if ((element as HTMLElement).offsetParent === null) continue;

    const style = getComputedStyle(element);
    const name = `${element.tagName.toLowerCase()}.${
      (element.getAttribute("class") ?? "—").split(/\s+/)[0]
    }`;

    if (!PAPER.includes(style.backgroundColor)) {
      found.push(`${name} background → ${style.backgroundColor}`);
    }

    for (const side of SIDES) {
      const width = style[`border${side}Width` as "borderTopWidth"];
      const color = style[`border${side}Color` as "borderTopColor"];
      if (parseFloat(width) > 0 && color !== INK && !PAPER.includes(color)) {
        found.push(`${name} border-${side.toLowerCase()} → ${color}`);
      }
    }

    /*
     * A replaced element renders no pseudo-elements, so a reading taken from
     * one describes a box that is never drawn -- but Chromium does answer, and
     * the answer is wrong in a way this walker would otherwise report.
     * `next/image` writes `color: transparent` INLINE on every `<img>`, which
     * no print stylesheet can reach, and `::marker` inherits it.
     *
     * Measured with the tile images forced back onto the sheet: exactly two
     * findings, both spurious, both `::marker`, on `/` and on
     * `/?view=photography` --
     * `img.PortfolioPanorama_portrait__…::marker colour → rgba(0, 0, 0, 0)`
     * and `img.—::marker colour → rgba(0, 0, 0, 0)` -- and none on `/resume`,
     * which has no `<img>` at all. That is the whole of what this suppresses.
     *
     * As the tree stands it suppresses nothing, because no `<img>` reaches the
     * paper: `MetroTile.module.css`'s print block hides `.media`, so the
     * `offsetParent` test above has already dropped every one of them. The
     * skip stays for the next image that does print -- an illustration in an
     * article, say -- and an `<img>`'s own fill and rules are still checked
     * above either way.
     */
    if (element.tagName === "IMG") continue;

    for (const pseudo of ["::before", "::after", "::marker"] as const) {
      const drawn = getComputedStyle(element, pseudo);
      if (drawn.content === "none") continue;

      if (![...PAPER, INK].includes(drawn.backgroundColor)) {
        found.push(`${name}${pseudo} background → ${drawn.backgroundColor}`);
      }
      if (drawn.color !== INK) {
        found.push(`${name}${pseudo} colour → ${drawn.color}`);
      }
    }
  }

  return found;
}

/*
 * The other three sheets. The résumé is the document anyone would print, but
 * the shared surface turns all four white, and a white sheet a route did not
 * ask for is worse than no print treatment at all: an article's section
 * headings are `--metro-text`, which is 1.10:1 on paper.
 *
 * Two assertions carry it -- every visible text node computes black, and every
 * visible box is white paper with black rules on it -- because between them
 * they are what a reader sees, and what a new colour anywhere in these
 * stylesheets breaks, whether the colour is set on a tag Markdown produced or
 * on a class one of these routes added.
 */
for (const route of [
  { path: LEAD_PLATFORM, name: "a case study" },
  { path: "/blog", name: "the note index" },
  { path: "", name: "an article" },
]) {
  test(`${route.name} prints black on the white sheet too`, async ({
    page,
  }) => {
    await page.emulateMedia({ media: "print" });
    await page.goto(route.path || newestHref);

    const canvas = await page.evaluate(() => ({
      html: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      main: getComputedStyle(document.querySelector("main")!).backgroundColor,
    }));

    expect(canvas, route.path).toEqual({
      html: "rgb(255, 255, 255)",
      body: "rgb(255, 255, 255)",
      main: "rgb(255, 255, 255)",
    });
    await expect(page.locator("main"), route.path).toHaveCSS(
      "color",
      "rgb(0, 0, 0)",
    );
    await expect(page.locator("main"), route.path).toHaveCSS(
      "padding-bottom",
      "0px",
    );

    // The application around the document does not print: the status line and
    // the dock take themselves out from their own stylesheets.
    const chrome = await page.evaluate((identity) => {
      const line = [...document.querySelectorAll<HTMLElement>("div")].find(
        (node) => node.textContent?.startsWith(identity),
      );
      const bar = document.querySelector('nav[aria-label="Page actions"]');

      return {
        identity: line ? getComputedStyle(line).display : null,
        dock: bar ? getComputedStyle(bar.parentElement!).display : null,
      };
    }, IDENTITY);

    expect(chrome, route.path).toEqual({ identity: "none", dock: "none" });
    expect(await page.evaluate(nonBlackPrintedText), route.path).toEqual([]);
    expect(await page.evaluate(nonInkPrintedBoxes), route.path).toEqual([]);
  });
}

/*
 * The fifth sheet: the panorama, which had no print treatment at all.
 *
 * Printing the Start screen produced a blank page. Browsers drop background
 * colours by default, so the shell's `--metro-ink` never reached the paper --
 * while `--metro-text`, #f2f4f5, did, at 1.06:1 on white. The page came out
 * empty with a ghost where the heading was.
 *
 * The first repair traded that for the opposite failure. It turned the ground
 * white and asked the tiles to keep their fills (`print-color-adjust: exact`),
 * and set `color: #000` on the shell alone -- which reaches only the type that
 * inherits, and almost none of the panorama's does. Measured: about half the
 * sheet in saturated ink, three tiles solid black, and the `<h1>` still at
 * 1.10:1. The sheet was expensive AND unreadable, and `toBeVisible` could not
 * see it, because Playwright's visibility is box-based and white-on-white has a
 * box.
 *
 * So the assertions are now what a reader actually gets, measured rather than
 * described: white ground, outlined white tiles, every visible word black, no
 * atmosphere, no screen chrome, and no `print-color-adjust: exact` left
 * anywhere. `nonBlackPrintedText` and `nonInkPrintedBoxes` are the same two
 * walkers the four document sheets are held to; between them they are what a
 * reader sees, which is why they carry this test too.
 *
 * One test over eight page loads rather than eight tests: the sheet is one
 * treatment, and the four pivots share a DOM (the panorama renders all four
 * panels and slides between them), so what differs per route is which tab is
 * selected -- and the selected tab is the `<h1>`, the exact element that was
 * invisible.
 */
test("the panorama prints as a legible black-on-white sheet", async ({
  page,
}) => {
  await page.emulateMedia({ media: "print" });

  for (const frame of [
    { width: 1440, height: 900 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(frame);

    for (const view of ["me", "projects", "blog", "photography"]) {
      const where = `${view} @ ${frame.width}`;
      await page.goto(`/?view=${view}`);

      const shell = page.locator("main");
      await expect(shell, where).toHaveCSS(
        "background-color",
        "rgb(255, 255, 255)",
      );
      await expect(shell, where).toHaveCSS("color", "rgb(0, 0, 0)");
      await expect(page.locator("body"), where).toHaveCSS(
        "background-color",
        "rgb(255, 255, 255)",
      );

      const sheet = await page.evaluate((identity) => {
        const colourOf = (selector: string) => {
          const node = document.querySelector(selector);
          return node ? getComputedStyle(node).color : null;
        };
        const line = [...document.querySelectorAll<HTMLElement>("div")].find(
          (node) => node.textContent?.startsWith(identity),
        );
        const bar = document.querySelector('nav[aria-label="Page actions"]');
        const tiles = [...document.querySelectorAll("[data-tile-role]")];

        return {
          // The atmosphere is a pseudo-element that exists only to carry a
          // pattern, so on paper it does not exist.
          atmosphere: getComputedStyle(
            document.querySelector("main")!,
            "::before",
          ).content,
          // Screen chrome takes itself out from its own stylesheets.
          identity: line ? getComputedStyle(line).display : null,
          dock: bar ? getComputedStyle(bar.parentElement!).display : null,
          // The four surfaces the old test could not see: the selected pivot
          // (which IS the h1's own anchor), a tile headline, a tile caption,
          // and one of the contact panel's profile links.
          selectedTab: colourOf('h1 a[aria-selected="true"]'),
          tileTitle: colourOf("[data-tile-role] strong"),
          tileCaption: colourOf("[data-tile-role] > span:last-child"),
          contactLink: colourOf("#contact a[href]"),
          tiles: tiles.length,
          // A printed tile is a white block with a black hairline, and it no
          // longer asks the printer for its screen fill.
          fills: [
            ...new Set(tiles.map((t) => getComputedStyle(t).backgroundColor)),
          ],
          rules: [
            ...new Set(
              tiles.map((t) => {
                const style = getComputedStyle(t);
                return `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`;
              }),
            ),
          ],
          forcedInk: [...document.querySelectorAll("main, main *")].filter(
            (node) =>
              getComputedStyle(node).getPropertyValue("print-color-adjust") ===
              "exact",
          ).length,
        };
      }, IDENTITY);

      const { tiles, ...paper } = sheet;

      // The evidence is still on the sheet; how many tiles carry it is the
      // content's business, not this test's.
      expect(tiles, where).toBeGreaterThan(4);
      expect(paper, where).toEqual({
        atmosphere: "none",
        identity: "none",
        dock: "none",
        selectedTab: "rgb(0, 0, 0)",
        tileTitle: "rgb(0, 0, 0)",
        tileCaption: "rgb(0, 0, 0)",
        contactLink: "rgb(0, 0, 0)",
        fills: ["rgb(255, 255, 255)"],
        rules: ["1px solid rgb(0, 0, 0)"],
        forcedInk: 0,
      });

      expect(await page.evaluate(nonBlackPrintedText), where).toEqual([]);
      expect(await page.evaluate(nonInkPrintedBoxes), where).toEqual([]);

      /*
       * No tile photograph reaches the paper. Structural rather than
       * photometric, and it is the walkers' blind spot: `nonBlackPrintedText`
       * asks a text node for its colour and `nonInkPrintedBoxes` skips
       * `<img>`, so a caption printed in black directly over a photograph --
       * which is what `.media ~ .label` does once the screen's veil is
       * dropped, measured at 1.05:1 -- passed both of them.
       *
       * Measured by the rectangle rather than by `offsetParent` or the class,
       * so a future change that hides the image some other way (zero size,
       * `visibility`, a `<picture>` swap) is still judged on what reaches the
       * sheet. `alt` is the identity a failure needs: it names which
       * photograph printed.
       *
       * The photography hub's backdrop is not in scope and does not need to
       * be -- it sits outside every tile and is already 0px wide here.
       */
      const printedTileImages = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("[data-tile-role] img")]
          .filter((img) => img.getBoundingClientRect().width > 0)
          .map((img) => (img as HTMLImageElement).alt.slice(0, 40)),
      );
      expect(printedTileImages, where).toEqual([]);
    }
  }
});

/*
 * The résumé's sections survive a page break rather than being split across
 * one. Asserted on the screen canvas because `break-inside` is a paged
 * property whose computed value is the same either way, and it is the value a
 * print stylesheet can silently drop.
 */
test("résumé sections ask not to be split across sheets", async ({ page }) => {
  await page.emulateMedia({ media: "print" });
  await page.goto("/resume");

  const sections = page.locator("main section, main header, main aside");
  await expect(sections).toHaveCount(5);

  for (let index = 0; index < 5; index += 1) {
    await expect(sections.nth(index)).toHaveCSS("break-inside", "avoid");
  }
});

/*
 * The four surfaces that are not the panorama. They are long-form documents --
 * a case study, a field note, the note index, the résumé -- and they are pages
 * of the same application: identity line at the top, one heading, and the way
 * back drawn as an application-bar command rather than typed as a bordered web
 * button. `back` is derived per route rather than listed once, because the
 * command's destination is the one thing that differs between them.
 */
const DETAIL_FRAMES = [
  { width: 320, height: 568 },
  { width: 1440, height: 900 },
] as const;

function detailRoutes() {
  return [
    {
      path: LEAD_PLATFORM,
      back: "Projects",
      href: "/?view=projects",
      resume: true,
    },
    { path: newestHref, back: "Field notes", href: "/blog", resume: true },
    // `Blog` and not `Portfolio`: the résumé's way back is `Portfolio` → `/`,
    // and one label cannot name two destinations.
    { path: "/blog", back: "Blog", href: "/?view=blog", resume: true },
    // The one surface that drops the Résumé command, because it is the résumé.
    { path: "/resume", back: "Portfolio", href: "/", resume: false },
  ] as const;
}

for (const frame of DETAIL_FRAMES) {
  test(`detail routes read as one application at ${frame.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(frame);

    // The column every surface indents to, taken from the panorama rather than
    // recomputed here: the detail routes have to agree with it, not with an
    // arithmetic copy of it.
    await page.goto("/");
    const column = (await page.getByText(IDENTITY).boundingBox())?.x ?? -1;
    expect(column, "panorama identity line").toBeGreaterThan(0);

    for (const route of detailRoutes()) {
      await page.goto(route.path);
      const at = `${route.path} @ ${frame.width}`;

      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading, at).toHaveCount(1);
      await expect(heading, at).toBeVisible();

      /*
       * The tab, the bookmark and the history entry. The identity line is
       * `aria-hidden` and the h1 names the document rather than the site, so
       * `<title>` is what carries both -- and the résumé, the one of these four
       * most likely to be opened in its own tab and sent to someone, says what
       * kind of document it is before it says whose.
       */
      const title = await page.title();
      expect(title, at).toContain("Ajmal Hassan");
      if (route.path === "/resume") expect(title, at).toMatch(/^Résumé/);

      const identity = page.getByText(IDENTITY);
      await expect(identity, at).toHaveCount(1);
      const line = await identity.boundingBox();
      expect(line?.x ?? -1, at).toBeCloseTo(column, 1);

      const back = page.getByRole("link", { name: route.back });
      await expect(back, at).toHaveAttribute("href", route.href);
      await expect(back.locator("svg"), at).toHaveCount(1);
      expect(
        await back.evaluate((node) =>
          Boolean(node.closest('nav[aria-label="Page actions"]')),
        ),
        at,
      ).toBe(true);

      /*
       * Résumé and contact stay primary commands wherever they are not the
       * page itself, so a reader who arrived on a case study or a note from
       * outside is one command from either -- which is what the panorama's own
       * bar promises, kept on the routes the panorama links to.
       */
      const contact = page.locator(`${APP_BAR} a[href="/#contact"]`);
      await expect(contact, at).toHaveCount(1);
      await expect(contact, at).toHaveAccessibleName("Contact");

      const resume = page.locator(`${APP_BAR} a[href="/resume"]`);
      await expect(resume, at).toHaveCount(route.resume ? 1 : 0);
      if (route.resume) {
        await expect(resume, at).toHaveAccessibleName("Résumé");
      }

      // Conventional vertical reading: a long-form page scrolls down and never
      // sideways, whatever the panorama does one route away.
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollWidth, at).toBe(clientWidth);

      // The way back is reachable from the keyboard, and it is the ring that
      // shows where focus is.
      await tabTo(page, back);
      await expect(back, at).toBeFocused();
      await expect(back, at).toHaveCSS("outline-color", "rgb(242, 244, 245)");
      await expect(back, at).toHaveCSS("outline-width", "3px");
      await expect(back, at).toHaveCSS("outline-offset", "3px");
    }
  });
}

/*
 * The Metro ring reaches every link on these pages, not only the commands in
 * the dock -- the dock's own already draw it from `.pressable`, so the shared
 * rule is only proved by a link the dock does not own. And a link inside the
 * reading copy says it is one: cyan, and underlined.
 */
test("every link on a detail route draws the Metro ring", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });

  for (const path of ["/blog", "/resume"]) {
    await page.goto(path);
    /*
     * The reading column only. `main > div a` also matched the dock -- the
     * status line, the column and the dock are all direct `div` children of
     * `main` -- so the guard below could never fail: every route has a back
     * command. Scoped to the column, "needs a link outside the dock" is again
     * a thing that can be untrue.
     */
    const inCopy = page.locator('main > div[class*="column"] a');
    const count = await inCopy.count();
    expect(count, `${path} needs a link outside the dock`).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const link = inCopy.nth(index);
      const at = `${path} link ${index}`;
      await link.focus();
      await expect(link, at).toHaveCSS("outline-color", "rgb(242, 244, 245)");
      await expect(link, at).toHaveCSS("outline-width", "3px");
      await expect(link, at).toHaveCSS("outline-offset", "3px");

      // The ring is painted in full at the column's own left edge: 3px of ring
      // plus 3px of offset, on a page that clips nothing.
      const ring = await link.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.left - 6;
      });
      expect(ring, at).toBeGreaterThanOrEqual(0);
    }
  }

  // The links the résumé sends a reader out on, and the treatment the article's
  // Markdown links share with them from the same declarations.
  await page.goto("/resume");
  const linkedin = page.getByRole("link", { name: "LinkedIn" }).first();
  await expect(linkedin).toHaveCSS("color", "rgb(0, 164, 239)");
  await expect(linkedin).toHaveCSS("text-decoration-line", "underline");
});

/*
 * EVERY focusable thing, on every route, at the narrowest frame.
 *
 * The two tests above check the surfaces someone thought to name -- the dock's
 * back command, the links inside a reading column. This one enumerates the
 * document instead, so a control that arrives later is inside the guarantee
 * without anyone remembering to add it. The spec asks for exactly this
 * coverage: "focus rings meet contrast requirements on cyan, blue, black, and
 * photographic surfaces", and the surfaces are what vary between these routes.
 *
 * It is the test that found the last hole. The open contact panel's two profile
 * links and its close button set `outline: none` and showed focus as a 1px
 * border turning cyan -- the only three focusable surfaces in the application
 * that did not draw the 3px ring. Deleting the `outline: none` and composing
 * the shared ring is what makes this pass.
 *
 * ONE exception, asserted rather than skipped: `PanoramaNav`'s heading tabs
 * draw the ring at `-3px`. Their track clips (the next heading peeking past the
 * right edge IS the affordance), so an outset ring on the tallest tab would be
 * sliced. Same width, same colour, pulled inside -- and the test says so, so
 * a tab that quietly stopped drawing a ring at all still fails.
 *
 * 320 because a narrow frame is where a ring runs out of room: it is the width
 * at which the panorama's clip box, the app bar's command row and the reading
 * column are all tightest.
 */
test("every focusable surface on every route draws the Metro ring", async ({
  page,
}) => {
  test.slow();
  await page.setViewportSize({ width: 320, height: 568 });

  const routes = [
    { name: "me", path: "/" },
    { name: "projects", path: "/?view=projects" },
    { name: "blog", path: "/?view=blog" },
    { name: "photography", path: "/?view=photography" },
    { name: "contact", path: "/", open: true },
    { name: "case study", path: LEAD_PLATFORM },
    { name: "note", path: newestHref },
    { name: "note index", path: "/blog" },
    { name: "résumé", path: "/resume" },
  ];

  for (const route of routes) {
    await page.goto(route.path);

    if (route.open) {
      /*
       * Opened from the keyboard, and it matters. `:focus-visible` follows the
       * last input modality, so a mouse click on the Contact command puts the
       * document in pointer mode and every programmatic focus after it stops
       * matching -- the panel would report no ring anywhere and the test would
       * be measuring Chromium's heuristic instead of this application's CSS.
       */
      await page.getByRole("link", { name: "Contact" }).focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("#contact")).toHaveAttribute(
        "data-open",
        "true",
      );
    }

    /*
     * Everything a keyboard can land on, in document order, minus what is
     * genuinely unreachable: a control inside the panel a pivot is not showing
     * (`inert`) and anything explicitly taken out of the tab order.
     *
     * Rooted at `<main>`, which is the application: the dev server injects its
     * own toolbar button into `<body>`, and a ring on Next's overlay is not
     * something this project draws or should assert.
     */
    const focusables = page.locator(
      ["a[href]", "button:not([disabled])", "[tabindex]:not([tabindex='-1'])"]
        .map((selector) => `main ${selector}:not([inert] *):not([inert])`)
        .join(", "),
    );
    const matched = await focusables.count();
    let asserted = 0;

    for (let index = 0; index < matched; index += 1) {
      const target = focusables.nth(index);
      if (!(await target.isVisible())) continue;
      asserted += 1;

      const at = `${route.name} #${index} <${await target.evaluate((node) =>
        node.tagName.toLowerCase(),
      )}> "${((await target.textContent()) ?? "").trim().slice(0, 24)}"`;

      await target.focus();
      /*
       * A programmatic focus matches `:focus-visible` in Chromium as long as
       * the document has not been put into pointer mode, which is why nothing
       * above this loop clicks anything with a mouse.
       */
      await expect(target, at).toHaveCSS("outline-width", "3px");
      await expect(target, at).toHaveCSS("outline-color", "rgb(242, 244, 245)");
      await expect(target, at).toHaveCSS("outline-style", "solid");

      const isTab = await target.evaluate(
        (node) => node.getAttribute("role") === "tab",
      );
      await expect(target, at).toHaveCSS(
        "outline-offset",
        isTab ? "-3px" : "3px",
      );
    }

    /*
     * The guard is on what was ASSERTED, not on what was matched: the loop
     * skips anything invisible, so a route whose controls stopped being
     * painted would sweep zero of them and still have matched a document full
     * of links.
     *
     * Exactly one match per route is invisible at 320, and it is always the
     * same one -- the app bar's overflow command, which is `display: none`
     * below 48rem and stays in the markup so the component never branches on
     * viewport width. Measured matched/asserted at 320: me 11/10, projects
     * 14/13, blog 13/12, photography 9/8, contact 12/11, case study 4/3,
     * note 4/3, note index 7/6, résumé 9/8.
     *
     * So `matched - 1` is the real floor, and it is exact on six of the nine
     * routes. The absolute floor stays too, because `asserted >= matched - 1`
     * is also satisfied by a route that matched nothing.
     */
    expect(
      asserted,
      `${route.name} swept ${asserted} of ${matched} focusable surfaces`,
    ).toBeGreaterThanOrEqual(matched - 1);
    expect(
      asserted,
      `${route.name} has focusable content`,
    ).toBeGreaterThanOrEqual(3);
  }
});

/*
 * The primary commands are not decoration on a detail route: contact from a
 * case study lands on the panorama with the panel open, which is the whole
 * point of carrying it there. `/#contact` and not `#contact`, because the panel
 * is a page away.
 */
test("contact from a case study opens the panorama's own panel", async ({
  page,
}) => {
  await page.goto(LEAD_PLATFORM);
  await page.getByRole("link", { name: "Contact" }).click();

  await expect(page).toHaveURL(/\/#contact$/);
  await expect(page.locator("#contact")).toHaveAttribute("data-open", "true");
  await expect(
    page.getByRole("button", { name: "Close contact" }),
  ).toBeVisible();

  // And the résumé command is the résumé, from the same bar.
  await page.goto(LEAD_PLATFORM);
  await page.getByRole("link", { name: "Résumé" }).click();
  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

/*
 * The status a surface carries is written where a reader meets it. A draft note
 * says so on its own page, and a case study says what stage its work is at --
 * the same labels the hubs print, on the pages the hubs link to.
 */
test("detail routes label their own status", async ({ page }) => {
  await page.goto(LEAD_PLATFORM);
  await expect(page.getByText("Status: shipped")).toBeVisible();

  await page.goto(newestHref);
  await expect(page.getByText("Draft example")).toBeVisible();
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

  /*
   * The other half of "no-JavaScript navigation and content access continue to
   * work", and the half nothing was checking: the tests above read `href`
   * attributes off the hubs and stopped there. An attribute is a promise; this
   * follows it.
   *
   * Both destinations are server-rendered routes, so the only thing that could
   * break them is the hub -- a tile whose whole rectangle is a `<button>` with
   * an `onClick` router push looks identical in a screenshot and is a dead end
   * without script. That is the failure mode the spec's "the whole navigation
   * tile opens its case study" exists to prevent, and it is invisible until
   * somebody turns script off and clicks.
   *
   * `getByRole("link")` rather than a CSS selector, because what has to be true
   * is that the destination is a LINK: a `<button>` is not a link to the
   * accessibility tree and is not one to a browser with no script either.
   */
  test("a project tile and a note row still navigate", async ({ page }) => {
    await page.goto("/?view=projects");
    const tile = page
      .getByRole("tabpanel", { name: HEADINGS.projects })
      .getByRole("link", { name: /lead/i })
      .first();
    await expect(tile).toHaveAttribute("href", LEAD_PLATFORM);
    await tile.click();

    await expect(page).toHaveURL(new RegExp(`${LEAD_PLATFORM}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Status: shipped")).toBeVisible();

    // And back out of the document the same way, through the bar's own command.
    await page.getByRole("link", { name: "projects" }).click();
    await expect(page).toHaveURL(/\/\?view=projects$/);
    await expect(
      page.getByRole("tab", { name: HEADINGS.projects }),
    ).toHaveAttribute("aria-selected", "true");

    await page.goto("/?view=blog");
    // The panel's tiles arrive on a staggered entrance capped at 240ms and
    // running for 420; a click during it is a click at a moving target.
    await page.waitForTimeout(900);
    const row = page
      .getByRole("tabpanel", { name: HEADINGS.blog })
      .getByRole("link")
      .first();
    const href = await row.getAttribute("href");
    expect(href, "the Blog pivot leads with a real destination").toMatch(
      /^\/blog\//,
    );
    await row.click();

    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

/*
 * ===========================================================================
 * Phase 2 motion, and the atmosphere behind it
 * ===========================================================================
 *
 * The whole of the motion policy, measured rather than described: a tile
 * entrance staggered by its place in the grid, two live tiles that never change
 * in the same second, one continuous waveform, a ground that differs per pivot
 * and moves with the plane, a reduced-motion mode with no spatial movement left
 * in it, and native scrolling nobody has trapped.
 */

/** 40ms per tile, capped at 240ms -- the tokens in `app/globals.css`. */
const TILE_STAGGER_MS = 40;
const TILE_STAGGER_CAP_MS = 240;
/** `--metro-tile-lift`: the whole spatial part of the entrance. */
const TILE_LIFT_PX = 8;
/** The alpha no background stop is allowed to exceed. */
const BACKGROUND_ALPHA_CEILING = 0.08;

/** The delay each tile of the active panel is running its entrance on. */
function entranceDelays(
  root: Element,
): { index: string; delay: string; name: string }[] {
  return [...root.querySelectorAll<HTMLElement>("[data-tile-role]")].map(
    (tile) => {
      const style = getComputedStyle(tile);
      return {
        index: tile.dataset.tileIndex ?? "",
        // The last item of the list, because the one tile that also drifts a
        // waveform puts that first: the entrance is what this reads.
        delay: style.animationDelay.split(", ").at(-1) ?? "",
        name: style.animationName,
      };
    },
  );
}

test("tiles arrive staggered by their place in the grid, capped", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?view=me");

  const me = page.locator('[data-pivot="me"]');
  const meDelays = await me.evaluate(entranceDelays);

  // Me lays out nine tiles, so the cap is what stops the last one arriving a
  // third of a second after the first.
  expect(meDelays.map((tile) => tile.index)).toEqual([
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
  ]);
  expect(meDelays.map((tile) => tile.delay)).toEqual([
    "0s",
    "0.04s",
    "0.08s",
    "0.12s",
    "0.16s",
    "0.2s",
    "0.24s",
    "0.24s",
    "0.24s",
  ]);
  for (const [index, tile] of meDelays.entries()) {
    const expected = Math.min(index * TILE_STAGGER_MS, TILE_STAGGER_CAP_MS);
    expect(Number.parseFloat(tile.delay) * 1000, `tile ${index}`).toBeCloseTo(
      expected,
      3,
    );
  }

  // The one tile with a second animation composes them: the wave is not
  // replaced by the entrance, and the entrance is not swallowed by the wave.
  expect(meDelays[ASSESSMENT].name).toMatch(/waveDrift/);
  expect(meDelays[ASSESSMENT].name).toMatch(/metroTileRise$/);
  // Every other tile runs the entrance alone.
  for (const [index, tile] of meDelays.entries()) {
    if (index !== ASSESSMENT)
      expect(tile.name, `tile ${index}`).toBe("metroTileRise");
  }

  /*
   * Selecting a pivot is what starts the entrance, so the tiles of the panel
   * that has just arrived are the ones running -- and they are the ONLY things
   * running on it.
   */
  await page.getByRole("tab", { name: HEADINGS.projects }).click();
  const projects = page.locator('[data-pivot="projects"]');

  /*
   * The spatial half of the entrance, read while it is still happening. The
   * delays above pin when each tile arrives and the names pin what it runs;
   * neither notices an entrance that has stopped moving, and an opacity-only
   * fade passes every one of them.
   *
   * Three things at once. The tiles are lifted, by no more than the half grid
   * step `--metro-tile-lift` allows. They are lifted by the `translate`
   * PROPERTY -- and `transform`, which the press tilt owns, reads exactly what
   * it reads at rest, which is the composition the entrance was written this
   * way for. `backwards` fill puts even a tile still inside its delay on the
   * `from` frame, so every tile of the panel is lifted at this moment.
   */
  const positions = (root: Element) =>
    [...root.querySelectorAll<HTMLElement>("[data-tile-role]")].map((tile) => {
      const style = getComputedStyle(tile);
      return { transform: style.transform, translate: style.translate };
    });
  const rising = await projects.evaluate(positions);
  const lifted = rising.filter((tile) => tile.translate !== "none");
  expect(lifted.length, JSON.stringify(rising)).toBeGreaterThan(0);
  for (const tile of lifted) {
    // Computed as a pair, "0px 8px", however the keyframe wrote it.
    const y = Math.abs(Number.parseFloat(tile.translate.split(" ")[1] ?? "0"));
    expect(y, tile.translate).toBeGreaterThan(0);
    expect(y, tile.translate).toBeLessThanOrEqual(TILE_LIFT_PX);
  }

  const running = await projects.evaluate((root) =>
    root
      .getAnimations({ subtree: true })
      .map((animation) => [
        (animation as CSSAnimation).animationName,
        (animation.effect as KeyframeEffect | null)?.target?.getAttribute(
          "data-tile-role",
        ),
      ]),
  );
  expect(running).toHaveLength(PROJECT_TILES);
  for (const [name, role] of running) {
    expect(name).toBe("metroTileRise");
    expect(role).toBe("navigation");
  }

  const projectDelays = await projects.evaluate(entranceDelays);
  expect(projectDelays.map((tile) => tile.delay)).toEqual([
    "0s",
    "0.04s",
    "0.08s",
    "0.12s",
    "0.16s",
  ]);

  // Nothing outside the tiles moves: not the panorama heading, not the reading
  // list one pivot away, not the picture hub's backdrop.
  const elsewhere = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("*")]
      .filter((node) => {
        const name = getComputedStyle(node).animationName;
        return name !== "none" && !node.hasAttribute("data-tile-role");
      })
      .map(
        (node) =>
          `${node.tagName}.${node.className}:${getComputedStyle(node).animationName}`,
      ),
  );
  // The live tile's own claim fade is the one exception, and it is inside a
  // tile rather than beside one.
  expect(elsewhere.filter((entry) => !/tileClaimIn/.test(entry))).toEqual([]);

  // And it settles: an entrance is an arrival, not a state a tile stays in.
  await expect
    .poll(() =>
      projects.evaluate((root) => root.getAnimations({ subtree: true }).length),
    )
    .toBe(0);

  // Settled means the lift is spent and the tilt's transform is where it was
  // all along: the two properties never touched each other.
  const settled = await projects.evaluate(positions);
  expect(settled.map((tile) => tile.translate)).toEqual(
    rising.map(() => "none"),
  );
  expect(settled.map((tile) => tile.transform)).toEqual(
    rising.map((tile) => tile.transform),
  );
});

/*
 * Two live tiles on one Start screen changing together read as a blink. The
 * phase between them is the whole claim, so it is measured over three laps
 * rather than asserted from the stylesheet -- and measured after a reader has
 * touched one of the two, which is the only thing on this page that can spend
 * the phase.
 *
 * A hover pauses a tile, and a paused tile rebuilds its timer on release. A
 * phase carried by the timer rather than by a schedule is therefore re-applied
 * from the moment the hover ended: the 2.5s hold below releases mid-beat,
 * which leaves the two tiles a second apart for the rest of the session, and a
 * release on a multiple of the interval leaves them changing in the same
 * instant. What is measured after it is 20 seconds of the pair, untouched.
 */
test("the two Me evidence tiles never change in the same second", async ({
  page,
}) => {
  test.slow();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?view=me");
  await page.waitForTimeout(500);

  // The second live tile is the phased one, so it is the one to disturb.
  const assessment = page
    .locator('[data-pivot="me"] [data-tile-role="live"]')
    .nth(1);
  await assessment.hover();
  await page.waitForTimeout(2500);
  await page.mouse.move(4, 4);

  const changes = await page.evaluate(async () => {
    const tiles = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-pivot="me"] [data-tile-role="live"]',
      ),
    ];
    const seen = tiles.map((tile) => tile.dataset.liveIndex);
    const log: { at: number; tile: number }[] = [];
    const started = performance.now();

    await new Promise<void>((resolve) => {
      const poll = setInterval(() => {
        const now = performance.now() - started;
        tiles.forEach((tile, i) => {
          if (tile.dataset.liveIndex !== seen[i]) {
            seen[i] = tile.dataset.liveIndex;
            log.push({ at: now, tile: i });
          }
        });
        if (now > 20_000) {
          clearInterval(poll);
          resolve();
        }
      }, 100);
    });

    return log;
  });

  // Both tiles turned over inside the window, so the gap below is measuring
  // something rather than passing over an empty log.
  const trace = changes
    .map((change) => `${change.tile}@${Math.round(change.at)}`)
    .join(" ");
  expect(new Set(changes.map((change) => change.tile)).size, trace).toBe(2);
  expect(changes.length, trace).toBeGreaterThanOrEqual(5);

  for (const [index, change] of changes.entries()) {
    const previous = changes[index - 1];
    if (!previous) continue;
    expect(
      change.at - previous.at,
      `${previous.tile}@${Math.round(previous.at)} then ${change.tile}@${Math.round(change.at)}`,
    ).toBeGreaterThan(1000);
  }
});

/*
 * The live tile's two promises to the person reading it, in a real browser.
 *
 * The spec asks for both and names them separately: the cycle "pauses on hover
 * and keyboard focus", and "direct activation advances it intentionally". The
 * unit tests drive `useLiveCycle` with fake timers and the test above pauses a
 * tile with the pointer, so what was missing is the KEYBOARD half -- a reader
 * who tabs onto the tile to read the claim and has it replaced under them
 * three seconds later -- and the activation half, which is the whole reason the
 * tile is a `<button>` at all.
 *
 * Seven seconds is the wait, against a six-second cycle: long enough that an
 * unpaused tile would certainly have turned over, short enough not to spend the
 * suite's budget twice. The press is checked immediately after, because
 * "intentionally" means now and not on the next tick of a timer.
 *
 * A negative assertion over a fixed wait cannot fail on a slow machine, it can
 * only stop proving anything -- so the wait carries a POSITIVE CONTROL. Me
 * renders two live tiles and only the first is focused; the second is left
 * alone, and it has to turn over on its own while the first does not. Without
 * it, hydration landing a couple of seconds later than usual would leave a
 * green test that never demonstrated the pause at all.
 *
 * The control is polled rather than read at the seven-second mark, and the
 * reason is a real number: `useLiveCycle` spends the phase ONCE, as
 * `now + intervalMs + offsetMs`, so the second tile's first turn is at mount
 * + 9000ms (6000 + the 3000ms `ASSESSMENT_OFFSET_MS`), not at 3000ms. Measured
 * here: first tile focused 593ms after `goto`, control turned over 8501ms into
 * the hold. Polling with its own budget on top of the seven seconds keeps the
 * control honest on a slow machine instead of turning it into the flake the
 * fixed wait was.
 */
test("a focused live tile holds its claim, and a press advances it", async ({
  page,
}) => {
  test.slow();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?view=me");
  await page.waitForTimeout(500);

  const live = page.locator('[data-pivot="me"] [data-tile-role="live"]');
  await expect(live).toHaveCount(2);
  const tile = live.first();
  const control = live.nth(1);
  await expect(tile).toHaveAttribute("data-live-index", /\d+/);

  // Focus, not hover: the pointer path is covered above, and a keyboard reader
  // has no way to ask a moving tile to wait.
  await tile.focus();
  await expect(tile).toBeFocused();
  const held = await tile.getAttribute("data-live-index");
  const claim = await tile.locator('[aria-live="off"]').innerText();
  const heldControl = await control.getAttribute("data-live-index");

  await page.waitForTimeout(7000);
  expect(
    await tile.getAttribute("data-live-index"),
    "focused tile advanced",
  ).toBe(held);
  expect(await tile.locator('[aria-live="off"]').innerText()).toBe(claim);

  // The control: nothing was done to this tile, so it must move. If it has
  // not, the seven seconds above proved nothing about the pause.
  await expect
    .poll(() => control.getAttribute("data-live-index"), {
      message: "the unfocused live tile never advanced",
      timeout: 8000,
    })
    .not.toBe(heldControl);
  expect(
    await tile.getAttribute("data-live-index"),
    "focused tile advanced while its unfocused neighbour cycled",
  ).toBe(held);

  /*
   * And the press. The tile is its own interactive owner -- one button, no
   * overlaid link -- so this is a reader asking for the next claim, and the
   * answer has to arrive without waiting out the rest of the interval.
   */
  await tile.click();
  await expect(tile).not.toHaveAttribute("data-live-index", held ?? "");
  await expect(tile.locator('[aria-live="off"]')).not.toHaveText(claim);

  /*
   * `aria-live="off"` throughout, focused or not: the tile's own accessible
   * name is what a screen reader is given, and it does not change every six
   * seconds.
   */
  await expect(tile.locator('[aria-live="off"]').first()).toHaveAttribute(
    "aria-live",
    "off",
  );
  await expect(tile).toHaveAccessibleName(/\S/);
});

/**
 * The 8px cells of the viewport that nothing but the shell's own ground paints.
 *
 * Runs inside the page. `elementFromPoint` alone cannot answer this: the
 * panorama's plane and its four panels cover the page and are perfectly
 * transparent, so the element under any open point is one of them and never
 * `<main>`. Ground means that nothing between the cell and the shell inks
 * anything -- no background, no border, no outline, no glyph, no image -- so
 * what a screenshot finds there is the ink and whatever the atmosphere drew on
 * it. Painted boxes are grown by 6px first, which keeps antialiasing, focus
 * rings and the odd sub-pixel edge out of the sample.
 */
function groundCells(): [number, number][] {
  const main = document.querySelector("main") as HTMLElement;
  const bounds = main.getBoundingClientRect();
  const painted: [number, number, number, number][] = [];

  for (const el of main.querySelectorAll<HTMLElement>("*")) {
    const style = getComputedStyle(el);
    const inks =
      style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
      style.backgroundImage !== "none" ||
      style.borderTopWidth !== "0px" ||
      style.borderBottomWidth !== "0px" ||
      style.borderLeftWidth !== "0px" ||
      style.borderRightWidth !== "0px" ||
      style.outlineStyle !== "none" ||
      el.matches("svg, img, canvas, video, hr") ||
      [...el.childNodes].some(
        (node) => node.nodeType === 3 && node.textContent?.trim(),
      );
    if (!inks) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) continue;
    painted.push([box.left - 6, box.top - 6, box.right + 6, box.bottom + 6]);
  }

  const cells: [number, number][] = [];
  const size = 8;
  for (let y = 0; y + size <= window.innerHeight; y += size) {
    for (let x = 0; x + size <= window.innerWidth; x += size) {
      if (x < bounds.left || y < bounds.top) continue;
      if (x + size > bounds.right || y + size > bounds.bottom) continue;
      const clear = painted.every(
        ([left, top, right, bottom]) =>
          x >= right || x + size <= left || y >= bottom || y + size <= top,
      );
      if (clear) cells.push([x, y]);
    }
  }
  return cells;
}

/**
 * What the ground actually paints, as the per-channel spread of every pixel on
 * it -- 0 where the whole ground is one flat colour.
 *
 * The computed-style assertions beside this one read the layer's declarations,
 * and a layer can be declared perfectly and still be invisible: `.shell` paints
 * its own opaque ink in the positioned-auto layer, so without the shell's
 * `isolation: isolate` the pattern's `z-index: -1` puts it under the page
 * rather than behind its content, with every declaration intact. Only pixels
 * can tell those apart.
 *
 * The whole ground rather than one window of it, because the patterns repeat at
 * 88 to 120px and a 64px window can sit between two rules and read flat while
 * the layer paints perfectly. `scale: "css"` keeps the image in the cells' own
 * coordinates on a device-pixel-ratio the mobile project doubles.
 */
async function groundSpread(
  page: Page,
): Promise<{ cells: number; spread: number }> {
  const cells = await page.evaluate(groundCells);
  const shot = (await page.screenshot({ scale: "css" })).toString("base64");

  return page.evaluate(
    async ([data, sample]) => {
      const image = await new Promise<HTMLImageElement>((resolve) => {
        const loaded = new Image();
        loaded.onload = () => resolve(loaded);
        loaded.src = `data:image/png;base64,${data}`;
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, image.width, image.height).data;
      const scale = image.width / window.innerWidth;
      const low = [255, 255, 255];
      const high = [0, 0, 0];

      for (const [cellX, cellY] of sample) {
        const x0 = Math.round(cellX * scale);
        const y0 = Math.round(cellY * scale);
        const side = Math.round(8 * scale);
        for (let y = y0; y < y0 + side; y += 1) {
          for (let x = x0; x < x0 + side; x += 1) {
            const at = (y * image.width + x) * 4;
            for (let channel = 0; channel < 3; channel += 1) {
              low[channel] = Math.min(low[channel], pixels[at + channel]);
              high[channel] = Math.max(high[channel], pixels[at + channel]);
            }
          }
        }
      }

      return {
        cells: sample.length,
        spread: Math.max(...high.map((value, i) => value - low[i])),
      };
    },
    [shot, cells] as [string, [number, number][]],
  );
}

/** Every alpha in a computed `background-image`, as numbers. */
function gradientAlphas(image: string): number[] {
  return [...image.matchAll(/rgba?\(([^)]*)\)/g)].map((match) => {
    const parts = match[1].split(",").map((part) => Number.parseFloat(part));
    return parts.length > 3 ? parts[3] : 1;
  });
}

for (const frame of [
  { width: 320, height: 568 },
  { width: 1440, height: 900 },
] as const) {
  test(`each pivot paints its own low-contrast ground at ${frame.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(frame);
    const seen = new Map<string, { image: string; position: string }>();

    for (const [index, view] of VIEWS.entries()) {
      await page.goto(`/?view=${view}`);
      await page.waitForTimeout(700);
      const at = `${view}@${frame.width}`;

      // The shell publishes the pivot, and the layer is selected by it.
      await expect(page.locator("main"), at).toHaveAttribute(
        "data-active-pivot",
        view,
      );

      const layer = await page.evaluate(() => {
        const main = document.querySelector("main") as HTMLElement;
        const style = getComputedStyle(main, "::before");
        return {
          image: style.backgroundImage,
          position: style.backgroundPosition,
          zIndex: style.zIndex,
          pointerEvents: style.pointerEvents,
          index: getComputedStyle(main)
            .getPropertyValue("--panorama-index")
            .trim(),
        };
      });

      expect(layer.index, at).toBe(String(index));
      // Behind the content, and never in the way of it.
      expect(Number.parseInt(layer.zIndex, 10), at).toBeLessThan(0);
      expect(layer.pointerEvents, at).toBe("none");

      // Atmosphere, not decoration: nothing is allowed past the approved alpha.
      for (const alpha of gradientAlphas(layer.image)) {
        expect(alpha, `${at} ${layer.image}`).toBeLessThanOrEqual(
          BACKGROUND_ALPHA_CEILING,
        );
      }

      // Photography stands its ground down: its own blurred backdrop is the
      // atmosphere there, and two on one pivot is one too many.
      if (view === "photography") expect(layer.image, at).toBe("none");
      else expect(layer.image, at).toContain("gradient");

      /*
       * And it reaches the glass. Measured on the ground pixels themselves:
       * three pivots draw something there, and the fourth is one flat ink.
       * The floor is the noise the compositor leaves on a flat surface (1 per
       * channel, measured on Photography at both frames); the patterned pivots
       * read 8 to 28 against it.
       */
      const ground = await groundSpread(page);
      expect(ground.cells, `${at} ground cells`).toBeGreaterThan(20);
      if (view === "photography")
        expect(ground.spread, `${at} flat ground`).toBeLessThanOrEqual(2);
      else
        expect(ground.spread, `${at} patterned ground`).toBeGreaterThanOrEqual(
          3,
        );

      seen.set(view, { image: layer.image, position: layer.position });

      // The layer never adds a horizontal scrollbar, at any width.
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
        at,
      ).toBe(0);
    }

    // Four pivots, four grounds -- and four positions, because the shared
    // ground shifts a little with the plane.
    const images = [...seen.values()].map((entry) => entry.image);
    const positions = [...seen.values()].map((entry) => entry.position);
    expect(new Set(images).size, "one ground per pivot").toBe(VIEWS.length);
    expect(new Set(positions).size, "one offset per pivot").toBe(VIEWS.length);
    // Me leads at zero and every pivot after it is further left.
    const x = positions.map((position) =>
      Number.parseFloat(position.split(" ")[0]),
    );
    expect(x[0]).toBe(0);
    for (let i = 1; i < x.length; i += 1) expect(x[i]).toBeLessThan(x[i - 1]);
  });
}

/*
 * Glyph-accurate contrast for every line of copy on a pivot -- the copy on the
 * atmosphere and the copy on the tiles alike.
 *
 * Each element is shot twice, visible then hidden, and only the pixels its
 * glyphs actually inked are measured. That is the difference between "this box
 * is over a pattern" and "a reader meets this pattern behind this letter", and
 * it is the only method that catches a thin graphic crossing one line of a
 * paragraph: the Me hero's capability graph put a lit cyan ring through the
 * second line of its own body copy and read 2.40:1 there while the box around
 * it averaged out fine.
 *
 * Tile copy is in scope because nothing else covers it. axe's `color-contrast`
 * rule abstains the moment it finds a background image it cannot resolve, and
 * the shell's ground is one -- so on Me at 1440 it returns `incomplete` for 36
 * nodes, 24 of them tile copy on tiles the pattern cannot even reach. Those
 * abstentions are why the hero's fault survived three reviews.
 */

/**
 * The frames the sweep runs at.
 *
 * 320 and 1440 are two of the four required review frames, and the widest and
 * narrowest layouts this application has. 768 is here because the fault the
 * sweep was built for was worst there and the sweep could not see it: the Me
 * hero's body copy measured 2.40:1 at 768 against 3.90 at 900 and above,
 * because that is the width where the graph motif and the copy were closest to
 * the same band. It is also the 48rem step itself -- the tile grid goes from
 * four columns to eight across it -- so it is the width where a type step and
 * a box size change at the same time.
 */
const SWEEP_FRAMES = [
  { width: 320, height: 568 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;

/**
 * What the sweep is supposed to be looking at, per pivot and per frame.
 *
 * All three frames agree today, and the table is written per frame anyway.
 * Nothing on these pivots is painted at one width and dropped at another --
 * the supporting note a narrow tile cannot show is clipped, not removed, and
 * the 84rem threshold that paints it is above every frame here. Keeping the
 * shape per frame is what lets a future width answer differently without
 * anyone having to notice that the constant had been a single number all
 * along.
 *
 * Exact rather than a floor, and deliberately brittle. The bounds they replace
 * (`> 2` ground, `> 0` tile) sat so far below the real counts that the
 * collector could have lost nine subjects in ten and the sweep would still have
 * passed, measuring almost nothing and reporting green. Copy that moves these
 * numbers is copy that moved the coverage, and it should be a deliberate edit.
 */
const SWEEP_SUBJECTS: Record<
  (typeof VIEWS)[number],
  Record<number, { ground: number; tile: number }>
> = {
  me: {
    320: { ground: 14, tile: 24 },
    768: { ground: 14, tile: 24 },
    1440: { ground: 14, tile: 24 },
  },
  projects: {
    320: { ground: 13, tile: 13 },
    768: { ground: 13, tile: 13 },
    1440: { ground: 13, tile: 13 },
  },
  blog: {
    320: { ground: 25, tile: 3 },
    768: { ground: 25, tile: 3 },
    1440: { ground: 25, tile: 3 },
  },
  photography: {
    320: { ground: 14, tile: 6 },
    768: { ground: 14, tile: 6 },
    1440: { ground: 14, tile: 6 },
  },
};

/** Whichever claim each live tile is showing has to be one of its own. */
const LIVE_CLAIMS: Record<"evidence" | "assessment", string[]> = {
  evidence: profile.start.evidence.claims.map((claim) => claim.claim),
  assessment: profile.start.assessment.claims.map((claim) => claim.claim),
};

/** Publishes the sweep's subjects on `window.__nodes`, and counts them. */
function contrastSubjects(): {
  ground: number;
  tile: number;
  live: string[];
} {
  const out: HTMLElement[] = [];
  const live: string[] = [];
  let ground = 0;
  let tile = 0;
  for (const el of document.querySelectorAll<HTMLElement>("main *")) {
    // Only the panel a reader is actually on.
    const panel = el.closest<HTMLElement>('[role="tabpanel"]');
    if (panel && panel.dataset.active !== "true") continue;
    /*
     * A reveal tile's turned-away face: `aria-hidden` and rotated edge-on, so
     * for the length of the flip it paints its old claim through the new one.
     * The face on show is the one a reader is reading, and it is measured.
     *
     * Only this one thing is skipped for being hidden -- NOT `aria-hidden`
     * broadly. A live tile wraps its visible claim in `aria-hidden` (the
     * button's own label already carries every claim), and so does the status
     * line, which is decoration in the phone's idiom rather than content.
     * Skipping the attribute outright would drop the identity line on all four
     * pivots and both of Me's live claims -- the copy closest to the one moving
     * graphic on the site -- which is most of what this sweep is for.
     */
    if (el.closest('[data-face][aria-hidden="true"]')) continue;
    // A `<text>` element inside a motif is a drawing, not a line of copy.
    if (el.closest("svg")) continue;
    const text = [...el.childNodes]
      .filter((node) => node.nodeType === 3)
      .map((node) => node.textContent)
      .join("")
      .trim();
    if (!text) continue;
    const box = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (box.width < 1 || box.height < 1) continue;
    /*
     * Copy with no pixels cannot be measured -- and one thing on this page is
     * invisible only briefly: the pause rule parks an inactive panel's
     * `tileClaimIn` on its `from` frame, so a live claim that turned over
     * off-screen sits at opacity 0 for the ~420ms its fade takes on return.
     * The caller waits for both faces to reach 1 before collecting, which is
     * what keeps this skip a guard against genuinely hidden copy instead of
     * the thing that silently drops the two claims closest to the only moving
     * graphic on the site.
     */
    if (style.visibility === "hidden" || style.opacity === "0") continue;
    if (el.closest("[data-tile-role]")) tile += 1;
    else ground += 1;
    if (el.closest('[aria-live="off"]')) live.push(text);
    out.push(el);
  }
  (window as unknown as { __nodes: HTMLElement[] }).__nodes = out;
  return { ground, tile, live };
}

/**
 * Holds every live tile on its current claim for the rest of the test.
 *
 * The sweep below takes two screenshots per subject and there are up to 38 of
 * them, so it runs for several seconds -- long enough for a six-second claim to
 * turn over underneath it and leave a measured element detached from the
 * document. `useDocumentVisible` reads `document.hidden`, and a live tile with
 * no reader stops spending timers, so this is the product's own pause rather
 * than a lever invented for the test: nothing about layout or paint changes,
 * only the timer stops.
 */
async function freezeLiveTiles(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  // Whatever claim was arriving when the timer stopped still has to land.
  await page.waitForTimeout(600);
}

/**
 * The worst contrast ratio among the pixels subject `index` inked, or `null`
 * where it inked none (a clipped line, a subject smaller than its own clip).
 *
 * The element's colour is composited through its whole opacity chain before it
 * is compared, because `--metro-white` at `opacity: 0.86` is not white.
 */
async function glyphContrast(
  page: Page,
  index: number,
): Promise<{ name: string; inTile: boolean; ratio: number } | null> {
  const meta = await page.evaluate((i) => {
    const el = (window as unknown as { __nodes: HTMLElement[] }).__nodes[i];
    el.scrollIntoView({ block: "center" });
    const box = el.getBoundingClientRect();
    let alpha = 1;
    for (
      let node: HTMLElement | null = el;
      node && node !== document.body;
      node = node.parentElement
    )
      alpha *= Number.parseFloat(getComputedStyle(node).opacity || "1");
    const x = Math.max(0, Math.floor(box.x) - 2);
    const y = Math.max(0, Math.floor(box.y) - 2);
    return {
      name: (el.textContent ?? "").replace(/\s+/g, " ").slice(0, 30),
      inTile: Boolean(el.closest("[data-tile-role]")),
      color: getComputedStyle(el).color,
      alpha,
      clip: {
        x,
        y,
        width: Math.min(Math.ceil(box.width) + 4, window.innerWidth - x),
        height: Math.min(Math.ceil(box.height) + 4, window.innerHeight - y),
      },
    };
  }, index);
  if (meta.clip.width < 2 || meta.clip.height < 2) return null;

  const inked = (await page.screenshot({ clip: meta.clip })).toString("base64");
  await page.evaluate(
    (i) =>
      ((window as unknown as { __nodes: HTMLElement[] }).__nodes[
        i
      ].style.visibility = "hidden"),
    index,
  );
  const bare = (await page.screenshot({ clip: meta.clip })).toString("base64");
  await page.evaluate(
    (i) =>
      ((window as unknown as { __nodes: HTMLElement[] }).__nodes[
        i
      ].style.visibility = ""),
    index,
  );

  const measured = await page.evaluate(
    async ([inked, bare, color, alpha]) => {
      const load = (data: string) =>
        new Promise<HTMLImageElement>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = `data:image/png;base64,${data}`;
        });
      const pixels = (image: HTMLImageElement) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d") as CanvasRenderingContext2D;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
      };
      const [a, b] = await Promise.all([load(inked), load(bare)]);
      const on = pixels(a);
      const off = pixels(b);
      const channel = (value: number) => {
        const x = value / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      };
      const luminance = ([r, g, bl]: number[]) =>
        0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(bl);
      const parsed = (color as string).match(/[\d.]+/g)?.map(Number) ?? [];
      const [cr, cg, cb, ca = 1] = parsed;
      const opacity = ca * (alpha as number);
      let worst = Infinity;
      let glyphs = 0;
      for (let i = 0; i < on.length; i += 4) {
        const delta =
          Math.abs(on[i] - off[i]) +
          Math.abs(on[i + 1] - off[i + 1]) +
          Math.abs(on[i + 2] - off[i + 2]);
        if (delta < 90) continue;
        glyphs += 1;
        const ground = [off[i], off[i + 1], off[i + 2]];
        const ink = [
          cr * opacity + ground[0] * (1 - opacity),
          cg * opacity + ground[1] * (1 - opacity),
          cb * opacity + ground[2] * (1 - opacity),
        ];
        const high = Math.max(luminance(ink), luminance(ground));
        const low = Math.min(luminance(ink), luminance(ground));
        const ratio = (high + 0.05) / (low + 0.05);
        if (ratio < worst) worst = ratio;
      }
      return { glyphs, worst };
    },
    [inked, bare, meta.color, meta.alpha] as const,
  );

  if (!measured.glyphs) return null;
  return { name: meta.name, inTile: meta.inTile, ratio: measured.worst };
}

test.describe("every line clears 4.5:1, ground and tile alike", () => {
  for (const frame of SWEEP_FRAMES) {
    for (const view of VIEWS) {
      test(`${view} keeps every line above 4.5:1 at ${frame.width}px`, async ({
        page,
      }) => {
        test.slow();
        await page.setViewportSize(frame);
        await page.goto(`/?view=${view}`);
        await page.waitForTimeout(900);
        await freezeLiveTiles(page);

        /*
         * Both live faces are fully in before anything is collected. Their fade
         * is the one thing on the page that holds real copy at opacity 0, and
         * the collector skips what it cannot measure -- so this wait is what
         * makes the two live claims subjects of the sweep rather than an
         * accident of two unrelated timings.
         */
        const faces = page.locator(
          '[role="tabpanel"][data-active="true"] [data-tile-role="live"] [aria-live="off"]',
        );
        for (let face = 0; face < (await faces.count()); face += 1)
          await expect(faces.nth(face)).toHaveCSS("opacity", "1");

        // A pivot whose copy the collector missed would pass this vacuously,
        // and both halves have to be there: the ground carries the heading and
        // the identity line, and every pivot has tiles.
        const subjects = await page.evaluate(contrastSubjects);
        const at = `${view}@${frame.width}`;
        const expected = SWEEP_SUBJECTS[view][frame.width];
        expect(subjects.ground, `${at} ground subjects`).toBe(expected.ground);
        expect(subjects.tile, `${at} tile subjects`).toBe(expected.tile);
        // Me's two live claims are in the sweep by name, whichever pair of them
        // the cycle happens to be holding.
        if (view === "me") {
          expect(
            subjects.live.filter((text) => LIVE_CLAIMS.evidence.includes(text)),
            `${at} evidence claim`,
          ).toHaveLength(1);
          expect(
            subjects.live.filter((text) =>
              LIVE_CLAIMS.assessment.includes(text),
            ),
            `${at} assessment claim`,
          ).toHaveLength(1);
        } else {
          expect(subjects.live, `${at} live claims`).toEqual([]);
        }

        for (let i = 0; i < subjects.ground + subjects.tile; i += 1) {
          const measured = await glyphContrast(page, i);
          if (!measured) continue;
          expect(
            measured.ratio,
            `${at} ${measured.inTile ? "tile" : "ground"} "${measured.name}"`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }
});

/*
 * Reduced motion takes the movement out and leaves the evidence in. Nothing
 * spatial survives -- no tilt, no press scale, no rise, no plane slide, no
 * travelling ground -- and no tile is ever held invisible waiting for a delay.
 */
test("reduced motion removes every spatial transform and hides no evidence", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const view of VIEWS) {
    await page.goto(`/?view=${view}`);
    await page.waitForTimeout(400);
    const at = `${view} reduced`;

    const tiles = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          '[data-active="true"] [data-tile-role]',
        ),
      ].map((tile) => {
        const style = getComputedStyle(tile);
        return {
          name: style.animationName,
          delay: style.animationDelay,
          translate: style.translate,
          transform: style.transform,
          opacity: style.opacity,
          rotateX: style.getPropertyValue("--press-rotate-x").trim(),
        };
      }),
    );

    expect(tiles.length, at).toBeGreaterThan(0);
    for (const tile of tiles) {
      // Opacity only, and instantly: no rise, and no delay to be hidden by.
      expect(tile.name, at).toBe("metroTileFade");
      expect(tile.delay, at).toBe("0s");
      expect(tile.translate, at).toBe("none");
      expect(tile.transform, at).toBe("none");
      expect(tile.opacity, at).toBe("1");
      expect(tile.rotateX, at).toBe("");
    }

    // The ground still differs per pivot -- that is a state, not a movement --
    // but it stops travelling to get there.
    await expect(page.locator("main"), at).toHaveAttribute(
      "data-active-pivot",
      view,
    );
    expect(
      await page.evaluate(
        () =>
          getComputedStyle(
            document.querySelector("main") as HTMLElement,
            "::before",
          ).transitionProperty,
      ),
      at,
    ).toBe("none");

    // Nothing at all is animating, on any pivot.
    expect(await page.evaluate(() => document.getAnimations().length), at).toBe(
      0,
    );
  }
});

/*
 * The handoff kept native vertical scrolling, and Phase 2 does not get to take
 * it. No wheel or touch listener is installed, nothing declares a `touch-action`
 * lock or an `overscroll-behavior` trap, and the page moves under a real wheel.
 */
test("the page still scrolls natively and traps no gesture", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 851 });

  /*
   * Catch the listeners a trapping implementation would have to add, from
   * before any of this page's own scripts have run.
   *
   * What is recorded is the ones that could actually cancel a gesture:
   * `passive: true` listeners cannot call `preventDefault()` at all, and both
   * React's own root delegation and Next's development overlay register
   * several of those. A non-passive `wheel` or `touchmove` handler is the
   * thing this page must never grow. (Measured on the production build: zero
   * listeners of either kind, passive included.)
   */
  await page.addInitScript(() => {
    const trapped: string[] = [];
    (window as unknown as { __trapped: string[] }).__trapped = trapped;
    const add = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function patched(
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) {
      const cancellable =
        typeof options !== "object" || options.passive !== true;
      if (["wheel", "touchstart", "touchmove"].includes(type) && cancellable) {
        const node = this as Partial<Element>;
        trapped.push(`${type} on ${node.tagName ?? String(this)}`);
      }
      return add.call(this, type, listener, options);
    } as typeof add;
  });

  await page.goto("/?view=me");
  await page.waitForTimeout(600);

  expect(
    await page.evaluate(
      () => (window as unknown as { __trapped: string[] }).__trapped,
    ),
  ).toEqual([]);

  const locks = await page.evaluate(() => {
    const of = (node: Element) => {
      const style = getComputedStyle(node);
      return {
        touchAction: style.touchAction,
        overscroll: style.overscrollBehavior,
      };
    };
    return {
      html: of(document.documentElement),
      body: of(document.body),
      main: of(document.querySelector("main") as HTMLElement),
      panorama: of(document.querySelector("[data-panorama]") as HTMLElement),
    };
  });
  for (const [where, style] of Object.entries(locks)) {
    expect(style.touchAction, where).toBe("auto");
    expect(style.overscroll, where).toBe("auto");
  }

  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});

/*
 * The press, in the browser that actually composes it.
 *
 * jsdom can assert which custom properties a handler wrote; only a real engine
 * can say what the two rules that read them add up to. The three claims here
 * are the ones a unit test cannot make: a touch press leans the surface exactly
 * as a mouse press does, `:active` composes its scale WITH that lean instead of
 * replacing it, and reduced motion leaves no spatial transform at all.
 */
test("a press leans the tile it is on, and the release scale composes with the lean", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?view=projects");
  await page.waitForTimeout(700);

  const tile = page
    .locator('[data-active="true"] [data-tile-role="navigation"]')
    .first();
  const box = await tile.boundingBox();
  if (!box) throw new Error("the lead project tile has no box to press");

  const state = () =>
    tile.evaluate((node) => ({
      x: node.style.getPropertyValue("--press-rotate-x"),
      y: node.style.getPropertyValue("--press-rotate-y"),
      scale: getComputedStyle(node).getPropertyValue("--press-scale").trim(),
      transform: getComputedStyle(node).transform,
    }));

  const IDENTITY =
    /^matrix3d\(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, [-\d.e]+, 0, 0, 0, 1\)$/;
  expect(
    (await state()).transform,
    "a tile at rest carries only its perspective",
  ).toMatch(IDENTITY);

  /*
   * Touch parity. A dispatched pointer event rather than `touchscreen.tap`,
   * because the claim is about the pointer TYPE reaching the handler -- and a
   * tap gives no moment in the middle to measure.
   */
  await tile.evaluate(
    (node, at) => {
      for (const type of ["pointerover", "pointerenter", "pointerdown"]) {
        node.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            clientX: at.x,
            clientY: at.y,
            isPrimary: true,
            pointerId: 1,
            pointerType: "touch",
          }),
        );
      }
    },
    { x: box.x + box.width * 0.75, y: box.y + box.height * 0.25 },
  );
  await page.waitForTimeout(250);

  const touched = await state();
  // Upper-right quadrant: a quarter of the way out on both axes, at the
  // 4-degree intensity, is one degree each -- and both read positive there.
  expect(Number.parseFloat(touched.x)).toBeCloseTo(1, 5);
  expect(Number.parseFloat(touched.y)).toBeCloseTo(1, 5);
  expect(
    touched.transform,
    "a touch press must actually lean the tile",
  ).not.toMatch(IDENTITY);

  await tile.evaluate((node) =>
    node.dispatchEvent(
      new PointerEvent("pointercancel", {
        bubbles: true,
        pointerId: 1,
        pointerType: "touch",
      }),
    ),
  );
  await page.waitForTimeout(250);
  expect(await state()).toMatchObject({ x: "", y: "" });

  // The mouse path, and the composition. Held down, so `:active` applies.
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.25);
  await page.waitForTimeout(120);
  const hovered = await state();
  expect(Number.parseFloat(hovered.x)).toBeCloseTo(1, 5);

  await page.mouse.down();
  await page.waitForTimeout(250);
  const pressed = await state();
  expect(pressed.scale, "the press depression").toBe("0.985");
  // Still leaning: the rotation survived the press rather than being replaced
  // by the scale, which is the whole point of composing them.
  expect(Number.parseFloat(pressed.x)).toBeCloseTo(1, 1);
  const scaled = pressed.transform.match(/^matrix3d\(([-\d.e]+)/);
  expect(scaled, pressed.transform).not.toBeNull();
  // A pure rotation of one degree leaves m11 at 0.9998; a composed
  // rotate-then-scale takes it to ~0.985. A replaced transform would be
  // exactly 0.985 with no rotation left in the other cells.
  expect(Number.parseFloat(scaled?.[1] ?? "1")).toBeLessThan(0.99);
  expect(pressed.transform).not.toMatch(
    /^matrix3d\(0.985, 0, 0, 0, 0, 0.985, 0, 0/,
  );

  // Released away from the tile, so the anchor is not followed.
  await page.mouse.move(2, 2);
  await page.mouse.up();
});

test("reduced motion leaves a pressed tile with no transform at all", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?view=projects");
  await page.waitForTimeout(400);

  const tile = page
    .locator('[data-active="true"] [data-tile-role="navigation"]')
    .first();
  const box = await tile.boundingBox();
  if (!box) throw new Error("the lead project tile has no box to press");

  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.25);
  await page.mouse.down();
  await page.waitForTimeout(200);

  expect(
    await tile.evaluate((node) => ({
      x: node.style.getPropertyValue("--press-rotate-x"),
      transform: getComputedStyle(node).transform,
    })),
  ).toEqual({ x: "", transform: "none" });

  await page.mouse.move(2, 2);
  await page.mouse.up();
});
