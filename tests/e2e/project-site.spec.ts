import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage connects the project, examples and phone", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "feels alive",
  );
  await page
    .getByRole("link", { name: "Read the docs", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/docs/);
  await expect(page.getByRole("main")).toBeVisible();
  await page.goto("/examples");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "examples",
  );
  await page.goto("/phone");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("phone");
});

test("documentation search finds real component pages", async ({ page }) => {
  await page.goto("/docs");
  if ((await page.viewportSize())!.width < 768)
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  const search = page.getByRole("combobox").filter({ visible: true });
  await search.fill("Panorama");
  await expect(
    page.getByRole("option").filter({ hasText: "Panorama" }).first(),
  ).toBeVisible();
  await page.getByRole("option").first().click();
  await expect(page).toHaveURL(/\/docs\/panorama(?:#.*)?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Panorama");
});

test("project homepage fits a phone viewport with reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("settings validates, saves and restores a real draft", async ({
  page,
}) => {
  await page.goto("/examples/settings");
  const email = page.getByRole("textbox", { name: "Email address" });
  await email.fill("invalid");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toBeFocused();
  await email.fill("mira@example.com");
  const name = page.getByRole("textbox", { name: "Display name" });
  await name.fill("Mira");
  await page.getByRole("radio", { name: "Light", exact: true }).check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Settings saved for Mira",
  );
  await name.fill("Unsaved");
  await page.getByRole("button", { name: "Reset changes" }).click();
  await expect(name).toHaveValue("Mira");
  await expect(
    page.getByRole("radio", { name: "Light", exact: true }),
  ).toBeChecked();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("inbox sends locally through its modal dialog", async ({ page }) => {
  await page.goto("/examples/inbox");
  await page.getByRole("button", { name: "Compose message" }).click();
  const dialog = page.getByRole("dialog", { name: "new message" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("textbox", { name: "To", exact: true })
    .fill("friend@example.com");
  await dialog.getByRole("textbox", { name: "Subject" }).fill("Meet at noon");
  await dialog
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("See you at the station.");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await dialog.getByRole("button", { name: "Send message" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status")).toContainText("Message saved to Sent");
  await page.getByRole("button", { name: /Meet at noon/ }).click();
  await expect(
    page.getByText("See you at the station.", { exact: true }),
  ).toBeVisible();
});

test("docs and gallery pass WCAG checks at narrow widths", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/docs", "/docs/fields", "/examples", "/phone"]) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    // Nextra leaves breadcrumbs/pagination outside main: its non-WCAG
    // landmark advisory is tracked in docs/project-site-verification.md.
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
      ).violations,
      route,
    ).toEqual([]);
  }
  const missing = await page.goto("/docs/does-not-exist");
  expect(missing?.status()).toBe(404);
});
