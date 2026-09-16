import { expect, test } from "@playwright/test";

test("phone opens a hub, returns to Start and restores focus", async ({
  page,
}) => {
  await page.goto("/phone");
  const phone = page.getByRole("region", {
    name: "Interactive Windows Phone demo",
  });
  const settings = phone.getByRole("button", {
    name: "Open Settings",
    exact: true,
  });
  await settings.click();
  await expect(
    phone.getByRole("heading", { name: "settings", exact: true }),
  ).toBeVisible();
  await phone.getByRole("button", { name: "Phone back", exact: true }).click();
  await expect(settings).toBeVisible();
  await expect(settings).toBeFocused();
  await phone.getByRole("button", { name: "Open People", exact: true }).click();
  await expect(
    phone.getByRole("tab", { name: "together", exact: true }),
  ).toBeVisible();
  await phone.getByRole("tab", { name: "together", exact: true }).click();
  await expect(
    phone.getByRole("tab", { name: "together", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await phone.getByRole("button", { name: "Phone Start", exact: true }).click();
  await expect(settings).toBeVisible();
});

test("phone app search, narrow layout and reduced motion work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/phone");
  const phone = page.getByRole("region", {
    name: "Interactive Windows Phone demo",
  });
  const weather = phone.locator(".wp-live-tile").filter({ hasText: "Weather" });
  const fits = await weather.evaluate((tile) => {
    const bounds = tile.getBoundingClientRect();
    return [
      ...tile.querySelectorAll(
        ".wp-live-footer > span, .wp-live-controls button",
      ),
    ].every((control) => {
      const rect = control.getBoundingClientRect();
      return rect.top >= bounds.top && rect.bottom <= bounds.bottom;
    });
  });
  expect(fits).toBe(true);
  await phone
    .getByRole("button", { name: "Search phone applications", exact: true })
    .click();
  const search = phone.getByRole("textbox", { name: "Search applications" });
  await search.fill("settings");
  await expect(
    phone.getByRole("button", { name: "Settings", exact: true }),
  ).toBeVisible();
  await search.fill("nothing matches this");
  await expect(phone).toContainText(/no apps|no applications|nothing/i);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("whole tile and contact flips have independent motion and a persistent pause", async ({
  page,
}) => {
  await page.goto("/phone");
  const phone = page.getByRole("region", {
    name: "Interactive Windows Phone demo",
  });
  const people = phone.getByRole("button", {
    name: "Open People",
    exact: true,
  });
  const photos = phone.getByRole("button", {
    name: "Open Photos",
    exact: true,
  });
  await expect(people.locator("[data-flip-artwork]")).toHaveCount(6);
  await expect(photos.locator("[data-flip-artwork]")).toHaveCount(1);
  const delays = await people
    .locator("[data-flip-artwork] > div")
    .evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).animationDelay),
    );
  expect(new Set(delays).size).toBe(6);
  // Sample the actual CSS half-turn rather than waiting through a long idle hold.
  const poses = await photos.evaluate((tile) => {
    const animation = tile
      .getAnimations({ subtree: true })
      .find(
        (a) => "animationName" in a && String(a.animationName).includes("flip"),
      )!;
    animation.pause();
    const target = (animation.effect as KeyframeEffect).target as HTMLElement;
    const delay = Number(animation.effect!.getTiming().delay);
    animation.currentTime = delay + 4200;
    const edge = getComputedStyle(target).transform;
    animation.currentTime = delay + 5000;
    return { edge, back: getComputedStyle(target).transform };
  });
  expect(poses.edge).not.toBe("none");
  expect(poses.edge).not.toBe(poses.back);
  await page.getByRole("button", { name: "Pause tile flips" }).click();
  await expect(people.locator("[data-flip-artwork] > div").first()).toHaveCSS(
    "animation-play-state",
    "paused",
  );
  await people.click();
  await phone.getByRole("button", { name: "Phone back", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume tile flips" }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(photos.locator("[data-flip-artwork] > div")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("app back retraces its entrance around the same hinge", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/phone");
  await page.evaluate(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      if (this.matches('.wp-transition[data-preset="turnstile"]')) {
        animation.pause();
        animation.currentTime = 130;
      }
      return animation;
    };
  });
  const phone = page.getByRole("region", {
    name: "Interactive Windows Phone demo",
  });
  await phone
    .getByRole("button", { name: "Open Settings", exact: true })
    .click();
  const app = phone.locator('.wp-transition[data-preset="turnstile"]');
  await expect(app).toHaveAttribute("data-state", "entering");
  const entrance = await app.evaluate((el) =>
    (el.getAnimations()[0].effect as KeyframeEffect).getKeyframes(),
  );
  await app.evaluate((el) => el.getAnimations().forEach((a) => a.finish()));
  await expect(app).toHaveAttribute("data-state", "entered");
  await phone.getByRole("button", { name: "Phone back", exact: true }).click();
  await expect(app).toHaveAttribute("data-state", "exiting");
  const departure = await app.evaluate((el) =>
    (el.getAnimations()[0].effect as KeyframeEffect).getKeyframes(),
  );
  for (const key of ["transform", "transformOrigin", "opacity"] as const) {
    expect(departure[1][key]).toBe(entrance[0][key]);
    expect(departure[0][key]).toBe(entrance[1][key]);
  }
  await app.evaluate((el) => el.getAnimations().forEach((a) => a.finish()));
  await expect(
    phone.getByRole("button", { name: "Open Settings", exact: true }),
  ).toBeFocused();
});
