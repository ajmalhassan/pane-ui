import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`Start screen opens and retraces app navigation (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    const music = page.getByRole("link", { name: "Open music", exact: true });
    await music.click();
    await expect(page).toHaveURL(/app=music/);
    await expect(
      page.getByRole("heading", { name: "music", exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole("link", { name: /Listen on YouTube/ }),
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=eE9tV1WGTgE");
    await page.getByRole("button", { name: "Back to Start" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(music).toBeFocused();
    await page.getByRole("link", { name: "Open people", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "people", exact: true }),
    ).toBeFocused();
    await page.goBack();
    await expect(music).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open people", exact: true }),
    ).toBeFocused();
    await page.goForward();
    await expect(
      page.getByRole("heading", { name: "people", exact: true }),
    ).toBeFocused();
  });
}
test("Direct music URL and small-screen accessibility", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?app=music");
  await expect(
    page.getByRole("heading", { name: "music", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Back to Start" }).click();
  await expect(
    page.getByRole("link", { name: "Open music", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page
    .getByRole("link", { name: "Open components", exact: true })
    .click();
  await expect(page.getByRole("switch", { name: "Quiet hours" })).toBeVisible();
});

test("Start has a single launcher and useful direct destinations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "start", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Open docs", exact: true }),
  ).toHaveAttribute("href", "/docs/installation");
  await expect(
    page.getByRole("link", { name: "Open examples", exact: true }),
  ).toHaveAttribute("href", "/examples");
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  for (const width of [320, 390, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("link", { name: /GitHub/ })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Docs ↗", exact: true }),
    ).toBeVisible();
    const peopleBox = await page
      .getByRole("link", { name: "Open people", exact: true })
      .boundingBox();
    const musicBox = await page
      .getByRole("link", { name: "Open music", exact: true })
      .boundingBox();
    const photosBox = await page
      .getByRole("link", { name: "Open photos", exact: true })
      .boundingBox();
    expect(Math.abs(peopleBox!.width - peopleBox!.height)).toBeLessThan(2);
    expect(Math.abs(musicBox!.width - photosBox!.width)).toBeLessThan(2);
    expect(Math.abs(musicBox!.height - photosBox!.height)).toBeLessThan(2);

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page
    .getByRole("link", { name: "Open components", exact: true })
    .click();
  const quiet = page.getByRole("switch", { name: "Quiet hours" });
  await expect(quiet).toBeChecked();
  await quiet.focus();
  await page.keyboard.press("Space");
  await expect(quiet).not.toBeChecked();
  const slider = page.getByRole("slider", { name: "Sound level" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("66");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole("button", { name: "Back to Start" }).click();
  const tile = page.getByRole("link", { name: "Open components", exact: true });
  await expect(tile).toBeFocused();
  await tile.click();
  await expect(quiet).not.toBeChecked();
  await expect(slider).toHaveValue("66");
});
test("Deep links return focus and old menu links reach their destinations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?app=photos");
  await expect(
    page.getByRole("heading", { name: "photos", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Back to Start" }).click();
  await expect(
    page.getByRole("link", { name: "Open photos", exact: true }),
  ).toBeFocused();
  await page.goto("/?app=docs");
  await expect(page).toHaveURL(/\/docs\/installation$/);
  await page.goto("/?app=examples");
  await expect(page).toHaveURL(/\/examples$/);
});

test("Rapid entrance activation keeps one Back journey", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator('.wp-tile-sequence[data-state="entering"]').waitFor();
  const before = await page.evaluate(() => history.length);
  await page.evaluate(() => {
    document
      .querySelector<HTMLAnchorElement>('a[aria-label="Open people"]')!
      .click();
    document
      .querySelector<HTMLAnchorElement>('a[aria-label="Open music"]')!
      .click();
  });
  await expect(
    page.getByRole("heading", { name: "music", exact: true }),
  ).toBeFocused();
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
  await page.getByRole("button", { name: "Back to Start" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("link", { name: "Open music", exact: true }),
  ).toBeFocused();
});

test("Old Start URLs redirect and the original landing page lives at About", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/start?app=music");
  await expect(page).toHaveURL(/\/\?app=music$/);
  await expect(
    page.getByRole("heading", { name: "music", exact: true }),
  ).toBeFocused();
  await page.goto("/start");
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("link", { name: "Docs ↗", exact: true }),
  ).toHaveAttribute("href", "/docs");
  await page
    .getByRole("link", { name: "About Pane UI →", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole("heading", { name: /Software that feels alive/ }),
  ).toBeVisible();
});
