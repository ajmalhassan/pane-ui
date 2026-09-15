import { expect, test } from "@playwright/test";

test("tile units follow a 288px container inside a wide viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/library");
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.id = "geometry-fixture";
    fixture.className = "wp-theme";
    fixture.style.width = "288px";
    fixture.innerHTML = `<div class="wp-tile-grid">${["small", "small", "small", "small", "wide", "wide", "large", "large", "hero"].map((size) => `<div class="wp-tile" data-size="${size}"><span class="wp-tile-label">a</span></div>`).join("")}</div>`;
    document.body.append(fixture);
  });
  const dimensions = await page
    .locator("#geometry-fixture .wp-tile")
    .evaluateAll((tiles) =>
      tiles.map((tile) => {
        const box = tile.getBoundingClientRect();
        return { width: box.width, height: box.height };
      }),
    );
  expect(dimensions[0].width).toBeCloseTo(63, 0);
  expect(dimensions[0].height).toBeCloseTo(63, 0);
  expect(dimensions[4].width).toBeCloseTo(138, 0);
  expect(dimensions[4].height).toBeCloseTo(63, 0);
  expect(dimensions[6].width).toBeCloseTo(138, 0);
  expect(dimensions[6].height).toBeCloseTo(138, 0);
  expect(dimensions[8].width).toBeCloseTo(288, 0);
  expect(dimensions[8].height).toBeCloseTo(138, 0);
});

test("native link tilts at touch contact and clears when motion preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/library");
  const tile = page.locator("a.wp-tile").first();
  await tile.scrollIntoViewIfNeeded();
  await expect(tile).toHaveAttribute("href", "#tiles");
  await tile.evaluate((element) => {
    const box = element.getBoundingClientRect();
    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerType: "touch",
        button: 0,
        clientX: box.left + box.width * 0.75,
        clientY: box.top + box.height * 0.25,
      }),
    );
  });
  await expect
    .poll(() =>
      tile.evaluate((element) =>
        element.style.getPropertyValue("--wp-press-rotate-x"),
      ),
    )
    .toBe("1deg");
  await expect
    .poll(() =>
      tile.evaluate((element) =>
        element.style.getPropertyValue("--wp-press-rotate-y"),
      ),
    )
    .toBe("1deg");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      tile.evaluate((element) =>
        element.style.getPropertyValue("--wp-press-rotate-x"),
      ),
    )
    .toBe("");
  await expect(tile).toHaveCSS("transform", "none");
});

test("a small live tile keeps its caption and both 44px controls within its grid cell", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/library");
  await page.evaluate(() => {
    const live = document
      .querySelector(".wp-live-tile")!
      .cloneNode(true) as HTMLElement;
    live.dataset.size = "small";
    const fixture = document.createElement("div");
    fixture.id = "live-geometry-fixture";
    fixture.className = "wp-theme";
    fixture.style.width = "320px";
    const grid = document.createElement("div");
    grid.className = "wp-tile-grid";
    grid.append(live);
    fixture.append(grid);
    document.body.append(fixture);
  });
  const tile = page.locator("#live-geometry-fixture .wp-live-tile");
  const bounds = await tile.boundingBox();
  expect(bounds).not.toBeNull();
  const caption = await tile.locator(".wp-tile-label").boundingBox();
  expect(caption!.x).toBeGreaterThanOrEqual(bounds!.x);
  expect(caption!.x + caption!.width).toBeLessThanOrEqual(
    bounds!.x + bounds!.width + 0.5,
  );
  const buttons = tile.getByRole("button");
  await expect(buttons).toHaveCount(2);
  for (const button of await buttons.all()) {
    const box = await button.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(bounds!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      bounds!.x + bounds!.width + 0.5,
    );
    expect(box!.y).toBeGreaterThanOrEqual(caption!.y + caption!.height);
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      bounds!.y + bounds!.height + 0.5,
    );
  }
});
