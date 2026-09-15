import { expect, type Page, test } from "@playwright/test";

const PANORAMA = "[data-panorama]";
const SURFACE = "[data-panorama-surface]";
const PROJECT_MOTION = "[data-project-motion]";

async function panoramaReady(page: Page) {
  await expect(page.locator(SURFACE)).toHaveAttribute(
    "data-motion-ready",
    "true",
  );
  await expect(page.locator(PANORAMA)).toHaveAttribute(
    "data-motion-state",
    "idle",
  );
}

async function projectMotionReady(page: Page) {
  await expect(page.locator(PROJECT_MOTION)).toHaveAttribute(
    "data-project-motion-ready",
    "true",
  );
  await expect(page.locator(PROJECT_MOTION)).toHaveAttribute(
    "data-project-motion",
    "idle",
  );
}

async function nativeTouch(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  end: "touchEnd" | "touchCancel" = "touchEnd",
) {
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [from],
  });

  for (let step = 1; step <= 12; step += 1) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: from.x + ((to.x - from.x) * step) / 12,
          y: from.y + ((to.y - from.y) * step) / 12,
        },
      ],
    });
    // Gesture velocity is part of the contract, so these are input samples,
    // not a sleep used to guess when an animation has finished.
    await page.waitForTimeout(20);
  }

  await session.send("Input.dispatchTouchEvent", {
    type: end,
    touchPoints: [],
  });
  await session.detach();
}

async function horizontalMouseDrag(page: Page, distance: number) {
  const surface = page.locator(SURFACE);
  const active = page.locator('[data-pivot][data-active="true"]');
  const surfaceBox = await surface.boundingBox();
  const panelBox = await active.boundingBox();
  if (!surfaceBox || !panelBox) throw new Error("Panorama has no geometry");

  const x = surfaceBox.x + surfaceBox.width / 2;
  const y = panelBox.y + 20;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + distance, y, { steps: 6 });
  await page.mouse.up();
}

test("native touch capture handover commits one adjacent pivot and one history entry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  const before = await page.evaluate(() => history.length);

  // These coordinates begin on the child span which receives Chromium's
  // implicit touch capture. Horizontal acceptance transfers capture to the
  // surface and bubbles the child's lostpointercapture through that surface.
  await nativeTouch(page, { x: 300, y: 270 }, { x: 145, y: 270 });

  await expect(page).toHaveURL(/\?view=blog$/);
  await panoramaReady(page);
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
});

test("a native short touch drag settles without adding history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  const before = await page.evaluate(() => history.length);

  await nativeTouch(page, { x: 300, y: 270 }, { x: 282, y: 270 });

  await panoramaReady(page);
  await expect(page).toHaveURL(/\?view=projects$/);
  expect(await page.evaluate(() => history.length)).toBe(before);
});

test("a short horizontal drag settles without navigating", async ({ page }) => {
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  const before = await page.evaluate(() => history.length);

  await horizontalMouseDrag(page, -18);

  await panoramaReady(page);
  await expect(page).toHaveURL(/\?view=projects$/);
  expect(await page.evaluate(() => history.length)).toBe(before);
});

test("an accepted drag beginning on a project link suppresses its trailing click", async ({
  page,
}) => {
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  const tile = page.locator('[data-project-tile="true"]').first();
  const box = await tile.boundingBox();
  if (!box) throw new Error("Project tile has no geometry");
  const before = await page.evaluate(() => history.length);
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width * 0.7, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.35, y, { steps: 8 });
  await page.mouse.up();

  await expect(page).toHaveURL(/\?view=blog$/);
  await panoramaReady(page);
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
  await expect(page.locator("[data-project-reading]")).toHaveCount(0);
});

test("native vertical touch scroll stays native and leaves the pivot selected", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto("/portfolio?view=me");
  await panoramaReady(page);

  await nativeTouch(page, { x: 180, y: 650 }, { x: 180, y: 350 });

  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await expect(page).toHaveURL(/\?view=me$/);
  await expect(
    page.getByRole("tab", { name: "technical leader / builder" }),
  ).toHaveAttribute("aria-selected", "true");
});

test("gesture styles preserve vertical scrolling and do not cancel wheel or touch events", async ({
  page,
}) => {
  await page.goto("/portfolio?view=me");
  await panoramaReady(page);

  const behavior = await page.evaluate(() => {
    const surface = document.querySelector<HTMLElement>(
      "[data-panorama-surface]",
    );
    const panorama = document.querySelector<HTMLElement>("[data-panorama]");
    const main = document.querySelector("main");
    if (!surface || !panorama || !main) throw new Error("Missing panorama");
    const wheel = new WheelEvent("wheel", { bubbles: true, cancelable: true });
    const touch = new Event("touchmove", { bubbles: true, cancelable: true });
    surface.dispatchEvent(wheel);
    surface.dispatchEvent(touch);

    return {
      surface: getComputedStyle(surface).touchAction,
      panorama: getComputedStyle(panorama).touchAction,
      main: getComputedStyle(main).touchAction,
      body: getComputedStyle(document.body).touchAction,
      html: getComputedStyle(document.documentElement).touchAction,
      wheelCancelled: wheel.defaultPrevented,
      touchCancelled: touch.defaultPrevented,
    };
  });

  expect(behavior).toEqual({
    surface: "pan-y pinch-zoom",
    panorama: "auto",
    main: "auto",
    body: "auto",
    html: "auto",
    wheelCancelled: false,
    touchCancelled: false,
  });
});

test("outward drags resist both finite panorama edges without adding history", async ({
  page,
}) => {
  for (const [view, distance] of [
    ["me", 240],
    ["photography", -240],
  ] as const) {
    await page.goto(`/portfolio?view=${view}`);
    await panoramaReady(page);
    const before = await page.evaluate(() => history.length);
    await horizontalMouseDrag(page, distance);
    await panoramaReady(page);
    await expect(page).toHaveURL(new RegExp(`\\?view=${view}$`));
    expect(await page.evaluate(() => history.length)).toBe(before);
  }
});

test("a second navigation interrupts the displayed panorama run", async ({
  page,
}) => {
  await page.goto("/portfolio?view=me");
  await panoramaReady(page);

  await page.getByRole("tab", { name: "photography" }).click();
  await expect(page.locator(PANORAMA)).toHaveAttribute(
    "data-motion-state",
    "settling",
  );
  await page.getByRole("tab", { name: "projects" }).click();

  await expect(page).toHaveURL(/\?view=projects$/);
  await panoramaReady(page);
  await expect(page.locator('[data-pivot="projects"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  const alignment = await page.locator(SURFACE).evaluate((surface) => {
    const active = surface.querySelector<HTMLElement>(
      '[data-pivot="projects"][data-active="true"]',
    );
    if (!active) throw new Error("Projects panel is not active");
    return Math.abs(
      active.getBoundingClientRect().left -
        surface.getBoundingClientRect().left,
    );
  });
  expect(alignment).toBeLessThanOrEqual(1);
});

test("native pointer cancellation settles the accepted gesture without navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  const before = await page.evaluate(() => history.length);

  await nativeTouch(
    page,
    { x: 300, y: 270 },
    { x: 145, y: 270 },
    "touchCancel",
  );

  await panoramaReady(page);
  await expect(page).toHaveURL(/\?view=projects$/);
  expect(await page.evaluate(() => history.length)).toBe(before);
});

test("loss of the surface's own pointer capture cancels the drag", async ({
  page,
}) => {
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  const surface = page.locator(SURFACE);
  const box = await surface.boundingBox();
  if (!box) throw new Error("Panorama surface has no geometry");
  const before = await page.evaluate(() => history.length);
  const x = box.x + box.width / 2;
  const y = box.y + 20;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - box.width * 0.3, y, { steps: 6 });
  await expect(page.locator(PANORAMA)).toHaveAttribute(
    "data-motion-state",
    "dragging",
  );
  await surface.evaluate((node) =>
    (node as HTMLElement).releasePointerCapture(1),
  );
  await page.mouse.up();

  await panoramaReady(page);
  await expect(page).toHaveURL(/\?view=projects$/);
  expect(await page.evaluate(() => history.length)).toBe(before);
});

test("resize finishes an interrupted panorama at its canonical destination", async ({
  page,
}) => {
  await page.goto("/portfolio?view=me");
  await panoramaReady(page);
  await page.getByRole("tab", { name: "photography" }).click();
  await expect(page.locator(PANORAMA)).toHaveAttribute(
    "data-motion-state",
    "settling",
  );

  await page.setViewportSize({ width: 900, height: 700 });

  await panoramaReady(page);
  await expect(page).toHaveURL(/\?view=photography$/);
  await expect(page.locator('[data-pivot="photography"]')).toHaveAttribute(
    "data-active",
    "true",
  );
});

test("turning reduced motion on during movement removes spatial animation immediately", async ({
  page,
}) => {
  await page.goto("/portfolio?view=me");
  await panoramaReady(page);
  await page.getByRole("tab", { name: "projects" }).click();
  await expect(page.locator(PANORAMA)).toHaveAttribute(
    "data-motion-state",
    "settling",
  );

  await page.emulateMedia({ reducedMotion: "reduce" });

  await panoramaReady(page);
  await expect(page.locator(`${SURFACE} > div`)).toHaveCSS("transform", "none");
  await expect(page).toHaveURL(/\?view=projects$/);
});

test("a reduced-motion native swipe still commits without spatial frames", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  const before = await page.evaluate(() => history.length);

  await nativeTouch(page, { x: 300, y: 270 }, { x: 145, y: 270 });

  await panoramaReady(page);
  await expect(page).toHaveURL(/\?view=blog$/);
  await expect(page.locator(`${SURFACE} > div`)).toHaveCSS("transform", "none");
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
});

test("ordinary project activation completes the turnstile and focuses the article", async ({
  page,
}) => {
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  await projectMotionReady(page);
  const tile = page.locator('[data-project-tile="true"]').first();
  const href = await tile.getAttribute("href");
  if (!href) throw new Error("Project tile has no destination");

  await tile.click();

  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await projectMotionReady(page);
  await expect(page.locator("[data-project-reading] h1")).toBeFocused();
});

test("keyboard project activation follows the same turnstile path", async ({
  page,
}) => {
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  await projectMotionReady(page);
  const tile = page.locator('[data-project-tile="true"]').nth(1);
  const href = await tile.getAttribute("href");
  if (!href) throw new Error("Project tile has no destination");
  await tile.focus();

  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await projectMotionReady(page);
  await expect(page.locator("[data-project-reading] h1")).toBeFocused();
});

test("the Projects return restores source scroll and tile focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 568 });
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  await projectMotionReady(page);
  const tile = page.locator('[data-project-tile="true"]').last();
  await tile.scrollIntoViewIfNeeded();
  const sourceScroll = await page.evaluate(() => scrollY);
  const href = await tile.getAttribute("href");
  if (!href) throw new Error("Project tile has no destination");

  // Preserve the exact scroll position being tested. Locator.click scrolls a
  // target before dispatching, which would replace this source snapshot.
  await tile.evaluate((node) => (node as HTMLElement).click());
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await projectMotionReady(page);
  await page.getByRole("link", { name: "Projects" }).click();

  await expect(page).toHaveURL(/\?view=projects$/);
  await panoramaReady(page);
  await projectMotionReady(page);
  await expect(tile).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(sourceScroll);
});

test("a direct-entry project command falls back to the real Projects URL", async ({
  page,
}) => {
  await page.goto("/projects/lead-platform");
  await projectMotionReady(page);

  await page.getByRole("link", { name: "Projects" }).click();

  await expect(page).toHaveURL(/\/portfolio\?view=projects$/);
  await panoramaReady(page);
  await projectMotionReady(page);
});

test("browser Back and Forward preserve project history and readable destinations", async ({
  page,
}) => {
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  await projectMotionReady(page);
  const tile = page.locator('[data-project-tile="true"]').first();
  const href = await tile.getAttribute("href");
  if (!href) throw new Error("Project tile has no destination");
  await tile.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await projectMotionReady(page);

  await page.goBack();
  await expect(page).toHaveURL(/\?view=projects$/);
  await panoramaReady(page);
  await projectMotionReady(page);
  await expect(tile).toBeFocused();

  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await projectMotionReady(page);
  await expect(page.locator("[data-project-reading] h1")).toBeVisible();
});

test("reduced motion keeps project open and return navigation immediately usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/portfolio?view=projects");
  await panoramaReady(page);
  await projectMotionReady(page);
  const tile = page.locator('[data-project-tile="true"]').first();
  const href = await tile.getAttribute("href");
  if (!href) throw new Error("Project tile has no destination");

  await tile.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await projectMotionReady(page);
  await expect(page.locator("[data-project-reading]")).toHaveCSS(
    "transform",
    "none",
  );

  await page.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\?view=projects$/);
  await panoramaReady(page);
  await projectMotionReady(page);
});
