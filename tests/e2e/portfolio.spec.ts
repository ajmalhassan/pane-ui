import { expect, type Locator, type Page, test } from "@playwright/test";

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

test("every project tile owns one destination and keeps its copy inside", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/?view=projects");

  const tiles = page
    .getByRole("tabpanel", { name: HEADINGS.projects })
    .getByRole("link");
  const count = await tiles.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const tile = tiles.nth(index);
    const at = `project tile ${index}`;

    // One interactive owner: the tile is the link, and holds no second one.
    expect(await tile.locator("a").count(), at).toBe(0);
    expect(await tile.locator("button").count(), at).toBe(0);

    // Line budgets, not luck: nothing a tile paints may leave its rectangle.
    const spilling = await tile.evaluate((root) => {
      const box = root.getBoundingClientRect();

      return Array.from(root.querySelectorAll("*"))
        .filter((child) => {
          const rect = child.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;

          return (
            rect.left < box.left - 0.5 ||
            rect.right > box.right + 0.5 ||
            rect.top < box.top - 0.5 ||
            rect.bottom > box.bottom + 0.5
          );
        })
        .map(
          (child) => `${child.tagName}: ${child.textContent?.slice(0, 40) ?? ""}`,
        );
    });

    expect(spilling, at).toEqual([]);
  }
});

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

    /*
     * Nothing a tile paints may leave its rectangle, lose a line to a clamp, or
     * be ellipsised away. The last one is measured with a Range rather than
     * `scrollWidth`: a caption that overflows its box by half a pixel is
     * already showing an ellipsis, and `scrollWidth` is an integer.
     */
    const faults = await panel.evaluate((root) => {
      const found: string[] = [];

      for (const tile of root.querySelectorAll<HTMLElement>(
        "[data-tile-role]",
      )) {
        const box = tile.getBoundingClientRect();
        const name = `${tile.dataset.tileSize} tile`;

        for (const child of tile.querySelectorAll<HTMLElement>("*")) {
          // An SVG's own geometry is decoration and is clipped by its viewport.
          if (child.closest("svg")) continue;

          const style = getComputedStyle(child);
          // Deliberately clipped: copy kept in the accessibility tree, unpainted.
          if (style.clipPath === "inset(50%)") continue;

          const rect = child.getBoundingClientRect();
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

          if (style.overflow !== "visible") {
            const line = Number.parseFloat(style.lineHeight) || 0;
            if (child.scrollHeight > child.clientHeight + line * 0.5) {
              found.push(`${name}: "${text}" lost a line to its clamp`);
            }
          }

          if (
            child.childElementCount === 0 &&
            (child.textContent ?? "").trim()
          ) {
            const range = document.createRange();
            range.selectNodeContents(child);
            if (range.getBoundingClientRect().width > rect.width + 0.1) {
              found.push(`${name}: "${text}" is ellipsised`);
            }
          }
        }
      }

      return found;
    });

    expect(faults, at).toEqual([]);

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
