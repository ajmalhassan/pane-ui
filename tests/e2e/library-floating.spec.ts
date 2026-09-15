import { pressTab } from "./keyboard";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("menu navigation skips disabled items, supports typeahead and hands focus to dialogs", async ({
  page,
}) => {
  await page.goto("/library#floating");
  const section = page.locator("#floating");
  const trigger = section.getByRole("button", {
    name: "Collection actions",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu", { name: "Collection actions" });
  await expect(menu).toBeVisible();
  expect(await menu.evaluate((el) => el.matches(":popover-open"))).toBe(true);
  await expect(
    menu.getByRole("menuitem", { name: "Rename", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    menu.getByRole("menuitem", { name: "Delete collection", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(
    menu.getByRole("menuitem", { name: "Move to favorites" }),
  ).toBeFocused();
  await page.keyboard.press("r");
  await expect(
    menu.getByRole("menuitem", { name: "Rename", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "rename this collection" });
  await expect(dialog.getByRole("textbox")).toBeFocused();
  await dialog.getByRole("textbox").fill("Morning light");
  await dialog.getByRole("button", { name: "Save new name" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(section).toContainText("Morning light");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
test("popover applies form values, returns focus and allows Tab or outside dismissal", async ({
  page,
}) => {
  await page.goto("/library#floating");
  const section = page.locator("#floating");
  const reset = section.getByRole("button", { name: "Reset filters" });
  // Establish this platform's native pointer-focus behavior with no overlay.
  await reset.click();
  const pointerFocusesButton = await reset.evaluate(
    (el) => el === document.activeElement,
  );
  const trigger = section.getByRole("button", {
    name: "Filter collection",
    exact: true,
  });
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "your view" });
  await expect(panel.getByRole("combobox")).toBeFocused();
  await panel.getByRole("combobox").selectOption("oldest");
  await pressTab(page);
  await expect(panel.getByRole("switch")).toBeFocused();
  await page.keyboard.press("Space");
  await panel.getByRole("button", { name: "Apply filters" }).click();
  await expect(panel).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(section).toContainText("Oldest first · favorites only");
  await trigger.click();
  await panel.getByRole("button", { name: "Cancel filters" }).focus();
  await pressTab(page);
  await expect(
    section.getByRole("button", { name: "Reset filters" }),
  ).toBeFocused();
  await expect(panel).not.toBeVisible();
  await trigger.click();
  await section.getByRole("button", { name: "Reset filters" }).click();
  await expect(panel).not.toBeVisible();
  // Outside dismissal must not steal focus back. Safari does not focus clicked buttons.
  if (!pointerFocusesButton) {
    await expect(page.locator("body")).toBeFocused();
  } else {
    await expect(
      section.getByRole("button", { name: "Reset filters" }),
    ).toBeFocused();
  }
});
test("panels flip at the viewport edge, escape clipping and retain light dark RTL themes", async ({
  page,
}) => {
  await page.goto("/library#floating");
  await page.setViewportSize({ width: 320, height: 640 });
  const section = page.locator("#floating");
  const trigger = section.getByRole("button", {
    name: "Collection actions",
    exact: true,
  });
  for (const mode of ["Light", "Dark"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    await trigger.evaluate((el) => {
      const parent = el.parentElement!;
      parent.style.transform = "translateZ(0)";
      parent.style.overflow = "hidden";
      parent.style.height = "44px";
      parent.dir = "rtl";
      el.scrollIntoView({ block: "end" });
    });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toHaveAttribute("data-placement", /^top/);
    const box = await menu.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(7);
    expect(box!.x + box!.width).toBeLessThanOrEqual(313);
    expect(box!.y).toBeGreaterThanOrEqual(7);
    expect(await menu.evaluate((el) => getComputedStyle(el).direction)).toBe(
      "rtl",
    );
    expect(
      (await new AxeBuilder({ page }).include(".wp-floating").analyze())
        .violations,
    ).toEqual([]);
    await page.keyboard.press("Escape");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await section
    .getByRole("button", { name: "Filter collection", exact: true })
    .click();
  const panel = page.getByRole("dialog", { name: "your view" });
  expect(
    (await new AxeBuilder({ page }).include(".wp-floating").analyze())
      .violations,
  ).toEqual([]);
  await expect(panel.locator(".wp-floating-content")).toHaveCSS(
    "animation-name",
    "none",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
