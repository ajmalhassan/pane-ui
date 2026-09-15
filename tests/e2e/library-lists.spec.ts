import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("collection rows open independently of their menus and restore focus", async ({
  page,
}) => {
  await page.goto("/library#lists");
  const section = page.locator("#lists");
  const row = section.getByRole("button", {
    name: "Open A quieter coast",
    exact: true,
  });
  await row.click();
  const dialog = page.getByRole("dialog", {
    name: "A quieter coast",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Back to collections" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(row).toBeFocused();
  const menu = section.getByRole("button", {
    name: "Actions for A quieter coast",
    exact: true,
  });
  await menu.click();
  await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
  const rename = page.getByRole("dialog", { name: "a new name", exact: true });
  await rename.getByRole("textbox").fill("Coastal mornings");
  await rename.getByRole("button", { name: "Save collection name" }).click();
  await expect(rename).not.toBeVisible();
  await expect(
    section.getByRole("button", {
      name: "Actions for Coastal mornings",
      exact: true,
    }),
  ).toBeFocused();
  await section
    .getByRole("button", { name: "Actions for Coastal mornings", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Delete collection", exact: true })
    .click();
  const alert = page.getByRole("alertdialog", {
    name: "delete this collection?",
    exact: true,
  });
  await expect(
    alert.getByRole("button", { name: "Keep this collection" }),
  ).toBeFocused();
  await alert.getByRole("button", { name: "Delete from demo" }).click();
  await expect(alert).not.toBeVisible();
  await expect(section.getByRole("searchbox")).toBeFocused();
  await expect(
    section.getByRole("button", { name: "Open Coastal mornings", exact: true }),
  ).toHaveCount(0);
});
test("filter recovery and empty-library creation are usable without losing focus", async ({
  page,
}) => {
  await page.goto("/library#lists");
  const section = page.locator("#lists");
  const search = section.getByRole("searchbox");
  await search.fill("no such collection");
  await expect(
    section.getByRole("region", { name: "nothing here just yet." }),
  ).toBeVisible();
  await section
    .getByRole("button", { name: "Clear collection filters" })
    .click();
  await expect(search).toBeFocused();
  await expect(section.getByRole("listitem")).toHaveCount(4);
  await section
    .getByRole("button", { name: "Collection list filters" })
    .click();
  await page.getByRole("switch", { name: "Only favorite collections" }).click();
  await page.keyboard.press("Escape");
  await expect(section.getByRole("listitem")).toHaveCount(2);
  await section.getByRole("button", { name: "Try empty library" }).click();
  await expect(
    section.getByRole("region", { name: "your story starts here." }),
  ).toBeVisible();
  await section
    .getByRole("button", { name: "Create your first collection" })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "a new collection",
    exact: true,
  });
  await dialog.getByRole("textbox").fill("First light");
  await dialog.getByRole("button", { name: "Save collection name" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(section.getByRole("listitem")).toHaveCount(1);
  await expect(search).toBeFocused();
});
test("lists retain native semantics, readable narrow themes and reduced motion", async ({
  page,
}) => {
  await page.goto("/library#lists");
  await page.setViewportSize({ width: 320, height: 720 });
  const section = page.locator("#lists");
  for (const mode of ["Light", "Dark"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    expect(
      (await new AxeBuilder({ page }).include("#lists").analyze()).violations,
    ).toEqual([]);
  }
  expect(
    await section
      .locator(".wp-list")
      .first()
      .evaluate((el) =>
        Array.from(el.children).every((item) => item.tagName === "LI"),
      ),
  ).toBe(true);
  await section.evaluate((el) => el.setAttribute("dir", "rtl"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(section.locator(".wp-list-item").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  const primary = section.getByRole("button", {
    name: "Open A quieter coast",
    exact: true,
  });
  const secondary = section.getByRole("button", {
    name: "Actions for A quieter coast",
    exact: true,
  });
  await primary.focus();
  await page.keyboard.press("Tab");
  await expect(secondary).toBeFocused();
  for (const control of [primary, secondary]) {
    const box = await control.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
});

test("rename that no longer matches the search returns focus to the search field", async ({
  page,
}) => {
  await page.goto("/library#lists");
  const section = page.locator("#lists");
  const search = section.getByRole("searchbox");
  await search.fill("coast");
  await section
    .getByRole("button", { name: "Actions for A quieter coast", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "a new name", exact: true });
  await dialog.getByRole("textbox").fill("Beach");
  await dialog.getByRole("button", { name: "Save collection name" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(search).toBeFocused();
  await expect(
    section.getByRole("region", { name: "nothing here just yet." }),
  ).toBeVisible();
});
