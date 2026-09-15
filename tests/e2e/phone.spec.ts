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
