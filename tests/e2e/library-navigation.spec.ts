import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Pivot changes panels through a single keyboard tab stop", async ({
  page,
}) => {
  await page.goto("/library#navigation");
  const list = page.getByRole("tablist", { name: "Library priorities" });
  const first = list.getByRole("tab", { name: "signature" });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(list.getByRole("tab", { name: "everyday" })).toBeFocused();
  await expect(list.getByRole("tab", { name: "everyday" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByRole("tabpanel", { name: "everyday", exact: true }),
  ).toBeVisible();
  await expect(list.locator('[tabindex="0"]')).toHaveCount(1);
});

test("Panorama commits a drag and keyboard navigation with one active panel", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/library#navigation");
  const panorama = page.getByTestId("panorama-demo");
  const surface = panorama.locator("[data-panorama-surface]");
  await surface.scrollIntoViewIfNeeded();
  const box = await surface.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * 0.75, box!.y + 40);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.25, box!.y + 42, { steps: 10 });
  await page.mouse.up();
  await expect(
    panorama.getByRole("tab", { name: "people", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(panorama).toHaveAttribute("data-motion-state", "idle");
  await expect(panorama.getByRole("tabpanel")).toHaveCount(1);
  await panorama.getByRole("tab", { name: "people", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    panorama.getByRole("tab", { name: "places", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});

test("selected tile sequence opens a detail and returns focus", async ({
  page,
}) => {
  await page.goto("/library#navigation");
  await page
    .getByRole("button", { name: "Open a small discovery", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "a small discovery", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Back to discoveries", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Open a small discovery", exact: true }),
  ).toBeFocused();
});

test("navigation examples remain accessible at 320px with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/library#navigation");
  await expect(
    page.getByRole("heading", { name: "a sense of place.", exact: true }),
  ).toBeVisible();
  const violations = (
    await new AxeBuilder({ page }).include("#navigation").analyze()
  ).violations;
  expect(violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("Panorama accepts native touch swipes and leaves vertical page scrolling alone", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto("/library#navigation");
  const panorama = page.getByTestId("panorama-demo");
  const surface = panorama.locator("[data-panorama-surface]");
  await surface.scrollIntoViewIfNeeded();
  let box = (await surface.boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const touch = (type: string, x = 0, y = 0) =>
    cdp.send("Input.dispatchTouchEvent", {
      type: type as "touchStart" | "touchMove" | "touchEnd",
      touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }],
    });
  try {
    const x = box.x + box.width * 0.8;
    const y = box.y + 60;
    await touch("touchStart", x, y);
    for (let i = 1; i <= 8; i++)
      await touch("touchMove", x - (box.width * 0.6 * i) / 8, y + 1);
    await touch("touchEnd");
    await expect(
      panorama.getByRole("tab", { name: "people", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(panorama).toHaveAttribute("data-motion-state", "idle");
    await surface.scrollIntoViewIfNeeded();
    box = (await surface.boundingBox())!;
    const scrollBefore = await page.evaluate(() => scrollY);
    const startY = Math.min(box.y + 200, 700);
    await touch("touchStart", box.x + box.width / 2, startY);
    for (let i = 1; i <= 8; i++)
      await touch("touchMove", box.x + box.width / 2 + 1, startY - i * 15);
    await touch("touchEnd");
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeGreaterThan(scrollBefore + 30);
    await expect(
      panorama.getByRole("tab", { name: "people", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
  } finally {
    await cdp.detach();
  }
});

test("Panorama retains a clickable previous-heading fragment", async ({
  page,
}) => {
  await page.goto("/library#navigation");
  const panorama = page.getByTestId("panorama-demo");
  await panorama.getByRole("tab", { name: "people", exact: true }).click();
  await expect(panorama).toHaveAttribute("data-motion-state", "idle");
  const viewport = await panorama
    .locator(".wp-panorama-heading-viewport")
    .boundingBox();
  const previous = await panorama
    .getByRole("tab", { name: "today", exact: true })
    .boundingBox();
  const overlap =
    Math.min(viewport!.x + viewport!.width, previous!.x + previous!.width) -
    Math.max(viewport!.x, previous!.x);
  expect(overlap).toBeGreaterThanOrEqual(32);
  expect(overlap).toBeLessThan(previous!.width);
  await page.mouse.click(
    viewport!.x + overlap / 2,
    previous!.y + previous!.height / 2,
  );
  await expect(
    panorama.getByRole("tab", { name: "today", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});

test("discovery exit and return layer a tile wave inside group motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/library#navigation");
  await page.evaluate(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      if (this.matches(".wp-tile-sequence, .wp-tile-sequence-item")) {
        animation.pause();
        animation.currentTime = 160;
      }
      return animation;
    };
  });
  const group = page.getByTestId("sequence-demo");
  const source = page.getByRole("button", {
    name: "Open a small discovery",
    exact: true,
  });
  await source.click();
  await expect(group).toHaveAttribute("data-state", "exiting");
  const checkSurface = async () => {
    expect(
      await group.evaluate((el) => {
        // Ignore ordinary button feedback; inspect the parent and tile wrappers
        // at the same elapsed time so staggered phases remain visible.
        const animations = el.getAnimations({ subtree: true }).filter((a) => {
          const target = (a.effect as KeyframeEffect).target;
          return target === el || target?.parentElement === el;
        });
        return {
          count: animations.length,
          onGroup: animations.filter(
            (a) => (a.effect as KeyframeEffect).target === el,
          ).length,
          onTiles: animations.filter(
            (a) => (a.effect as KeyframeEffect).target?.parentElement === el,
          ).length,
          distinctTileFrames: new Set(
            Array.from(el.children).map(
              (child) => getComputedStyle(child).transform,
            ),
          ).size,
          childTransforms: Array.from(el.children).map(
            (child) => getComputedStyle(child).transform,
          ),
        };
      }),
    ).toEqual({
      count: 5,
      onGroup: 1,
      onTiles: 4,
      distinctTileFrames: 4,
      childTransforms: expect.arrayContaining([
        expect.stringMatching(/^matrix3d/),
      ]),
    });
    expect(
      await group.evaluate((el) => {
        const bounds = el.getBoundingClientRect();
        return (
          bounds.width <= el.offsetWidth + 1 &&
          bounds.height <= el.offsetHeight + 1
        );
      }),
    ).toBe(true);
    await group.evaluate((el) =>
      el.getAnimations({ subtree: true }).forEach((a) => a.finish()),
    );
  };
  await checkSurface();
  await expect(
    page.getByRole("heading", { name: "a small discovery", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Back to discoveries", exact: true })
    .click();
  await expect(group).toHaveAttribute("data-state", "entering");
  await checkSurface();
  await expect(source).toBeFocused();
});
