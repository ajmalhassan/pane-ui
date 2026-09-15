import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("feedback journeys preserve values, announcements and focus", async ({
  page,
}) => {
  await page.goto("/library#feedback");
  const section = page.locator("#feedback");
  const progress = section.getByRole("progressbar", {
    name: "Collection progress",
  });
  await expect(progress).toHaveAttribute("aria-valuenow", "40");
  await section.getByRole("button", { name: "Advance progress" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "60");
  await section.getByRole("button", { name: "Unknown total" }).click();
  await expect(progress).not.toHaveAttribute("aria-valuenow");
  await section.getByRole("button", { name: "Reset progress" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await section.getByRole("button", { name: "Simulate failure" }).click();
  await expect(section.getByRole("status")).toContainText("Couldn't save");
  const retry = section.getByRole("button", { name: "Retry saving" });
  await retry.click();
  await expect(
    section.getByRole("button", { name: "Save collection", exact: true }),
  ).toBeFocused();
  await expect(section.getByRole("status")).toContainText("Collection saved");
  await section
    .getByRole("button", { name: "Dismiss offline message" })
    .click();
  await expect(
    section.getByRole("button", { name: "Show offline message" }),
  ).toBeFocused();
  await expect(section.getByText("You're offline")).toHaveCount(0);
  await section.getByRole("button", { name: "Show offline message" }).click();
  await expect(section.getByText("You're offline")).toBeVisible();
});
test("feedback supports narrow themes, RTL, hidden and reduced motion", async ({
  page,
}) => {
  await page.goto("/library#feedback");
  await page.setViewportSize({ width: 320, height: 800 });
  const section = page.locator("#feedback");
  for (const mode of ["Light", "Dark"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    expect(
      (await new AxeBuilder({ page }).include("#feedback").analyze())
        .violations,
    ).toEqual([]);
  }
  await section.evaluate((el) => el.setAttribute("dir", "rtl"));
  const track = section.locator(".wp-progress-track");
  const fill = section.locator(".wp-progress-fill");
  const trackBox = await track.boundingBox();
  const fillBox = await fill.boundingBox();
  expect(
    Math.abs(trackBox!.x + trackBox!.width - fillBox!.x - fillBox!.width),
  ).toBeLessThan(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(section.locator(".wp-ring-orbit").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(fill).toHaveCSS("transition-duration", "0s");
  const ring = section.getByRole("progressbar", {
    name: "Collection progress",
  });
  await ring.evaluate((el) => el.setAttribute("hidden", ""));
  await expect(ring).toBeHidden();
  await page.emulateMedia({ forcedColors: "active" });
  await expect(
    section.getByRole("button", { name: "Advance progress" }),
  ).toBeVisible();
});

test("native hidden survives command and field layout styling", async ({
  page,
}) => {
  await page.goto("/library");
  for (const selector of [
    ".wp-button",
    ".wp-field",
    ".wp-label",
    ".wp-text-field",
    ".wp-select",
    ".wp-slider",
  ]) {
    const control = page.locator(selector).first();
    await control.evaluate((el) => el.setAttribute("hidden", ""));
    await expect(control).toHaveCSS("display", "none");
    await control.evaluate((el) => el.removeAttribute("hidden"));
  }
});
