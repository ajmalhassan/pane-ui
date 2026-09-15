import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("command buttons submit once while loading and keep their footprint", async ({
  page,
}) => {
  await page.goto("/library#commands");
  const save = page.locator("#commands").getByRole("button", {
    name: "Save collection",
    exact: true,
  });
  const before = await save.boundingBox();
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(save).toBeFocused();
  await expect(save).toHaveAttribute("aria-busy", "true");
  const after = await save.boundingBox();
  expect(after!.width).toBeCloseTo(before!.width, 0);
  expect(after!.height).toBeCloseTo(before!.height, 0);
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "Saving preview started." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Complete preview", exact: true })
    .click();
  await expect(save).not.toHaveAttribute("aria-busy", "true");
  await expect(
    page.getByRole("status").filter({ hasText: "Collection saved." }),
  ).toBeVisible();
});

test("app-bar overflow supports Escape and command focus restoration", async ({
  page,
}) => {
  await page.goto("/library#commands");
  const more = page.getByRole("button", { name: "More commands", exact: true });
  await more.click();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Archive collection", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  await page
    .getByRole("button", { name: "Archive collection", exact: true })
    .click();
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  const link = page.getByRole("link", { name: "get started", exact: true });
  await expect(link).toHaveAttribute("href", "#start");
  await link.click();
  await expect(page).toHaveURL(/#start$/);
});

test("command controls fit narrow layouts and retain contrast in both themes", async ({
  page,
}) => {
  await page.goto("/library#commands");
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "More commands", exact: true })
    .click();
  for (const mode of ["Light", "Dark"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    const violations = (
      await new AxeBuilder({ page }).include("#commands").analyze()
    ).violations;
    expect(violations).toEqual([]);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const icon = page.getByRole("button", {
    name: "Add one more item",
    exact: true,
  });
  const box = await icon.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test("streaming dots slow in the middle and become static with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/library#commands");
  await page
    .locator("#commands")
    .getByRole("button", { name: "Save collection", exact: true })
    .click();
  const progress = page.getByRole("progressbar", {
    name: "Loading animation preview",
  });
  await progress.scrollIntoViewIfNeeded();
  const speeds = await progress.evaluate((el) => {
    const dot = el.firstElementChild as HTMLElement;
    const animation = dot.getAnimations()[0];
    animation.pause();
    const position = (time: number) => {
      animation.currentTime = time;
      return dot.getBoundingClientRect().x;
    };
    const first = position(0),
      arrival = position(520),
      departure = position(1950),
      last = position(2470);
    return {
      in: (arrival - first) / 520,
      middle: (departure - arrival) / 1430,
      out: (last - departure) / 520,
    };
  });
  expect(speeds.middle).toBeLessThan(speeds.in / 2);
  expect(speeds.middle).toBeLessThan(speeds.out / 2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await progress.evaluate((el) => el.getAnimations({ subtree: true }).length),
  ).toBe(0);
  const dots = await progress.evaluate((el) =>
    Array.from(el.children).map((child) => child.getBoundingClientRect().x),
  );
  expect(new Set(dots).size).toBe(5);
});
