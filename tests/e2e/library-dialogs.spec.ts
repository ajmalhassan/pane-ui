import { pressTab } from "./keyboard";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("edit modal contains focus, submits and restores the opener", async ({
  page,
}) => {
  await page.goto("/library#dialogs");
  const opener = page.getByRole("button", {
    name: "Edit collection",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "edit collection",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => el.matches(":modal"))).toBe(true);
  const input = dialog.getByRole("textbox", { name: "Collection name" });
  await expect(input).toBeFocused();
  await pressTab(page, true);
  await expect(
    dialog.getByRole("button", { name: "Cancel editing" }),
  ).toBeFocused();
  await pressTab(page);
  await expect(input).toBeFocused();
  await input.fill("Evening walks");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.locator("#dialogs")).toContainText(
    "Renamed to Evening walks.",
  );
  expect(
    await page.evaluate(() => document.documentElement.style.overflow),
  ).not.toBe("hidden");
  await opener.click();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});
test("backdrop dismisses ordinary dialogs but preserves alert decisions", async ({
  page,
}) => {
  await page.goto("/library#dialogs");
  await page
    .getByRole("button", { name: "Edit collection", exact: true })
    .click();
  await page.mouse.click(2, 2);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const opener = page.getByRole("button", {
    name: "Delete collection",
    exact: true,
  });
  await opener.click();
  const alert = page.getByRole("alertdialog");
  await expect(
    alert.getByRole("button", { name: "Keep collection" }),
  ).toBeFocused();
  await page.mouse.click(2, 2);
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: "Confirm deletion" }).click();
  await expect(alert).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.locator("#dialogs")).toContainText(
    "No photos were removed.",
  );
});
test("modal layouts and semantics survive narrow themes and reduced motion", async ({
  page,
}) => {
  await page.goto("/library#dialogs");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const mode of ["Light", "Dark"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    await page
      .getByRole("button", { name: "Edit collection", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    expect(
      (await new AxeBuilder({ page }).include(".wp-dialog[open]").analyze())
        .violations,
    ).toEqual([]);
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    expect(
      await dialog.evaluate((el) => el.getAnimations({ subtree: true }).length),
    ).toBe(0);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  }
});

test("reopening an exiting modal cancels stale closure and restores usable focus", async ({
  page,
}) => {
  await page.goto("/library#dialogs");
  const opener = page.getByRole("button", {
    name: "Edit collection",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".wp-dialog-panel")).toHaveAttribute(
    "data-state",
    "entered",
  );
  await dialog.getByRole("button", { name: "Cancel editing" }).click();
  await opener.evaluate((el) => (el as HTMLButtonElement).click());
  await expect(dialog.locator(".wp-dialog-panel")).toHaveAttribute(
    "data-state",
    "entered",
  );
  expect(await dialog.evaluate((el) => el.matches(":modal"))).toBe(true);
  await expect(dialog.getByRole("textbox")).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});
