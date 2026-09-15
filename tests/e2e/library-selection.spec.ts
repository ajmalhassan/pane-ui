import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("native selection keyboard behavior, submission and reset", async ({
  page,
}) => {
  await page.goto("/library#selection");
  const form = page.getByRole("form", { name: "Preference preview" });
  const updates = form.getByRole("checkbox", {
    name: "Send me product updates",
    exact: true,
  });
  await updates.focus();
  await page.keyboard.press("Space");
  await expect(updates).not.toBeChecked();
  const sync = form.getByRole("switch", {
    name: "Sync across devices",
    exact: true,
  });
  await sync.focus();
  await page.keyboard.press("Space");
  await expect(sync).not.toBeChecked();
  await form.getByRole("radio", { name: "Weekly", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    form.getByRole("radio", { name: "Monthly", exact: true }),
  ).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(
    form.getByRole("radio", { name: "Daily", exact: true }),
  ).toBeChecked();
  await form
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  await expect(form.getByRole("status")).toHaveText(
    "Saved: updates off, sync off, delivery daily.",
  );
  await form
    .getByRole("button", { name: "Reset preferences", exact: true })
    .click();
  await expect(updates).toBeChecked();
  await expect(sync).toBeChecked();
  await expect(
    form.getByRole("radio", { name: "Weekly", exact: true }),
  ).toBeChecked();
});

test("selection controls fit 320px with readable themes and reduced motion", async ({
  page,
}) => {
  await page.goto("/library#selection");
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const mode of ["Light", "Dark"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    expect(
      (await new AxeBuilder({ page }).include("#selection").analyze())
        .violations,
    ).toEqual([]);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const control = page.getByRole("switch", {
    name: "Sync across devices",
    exact: true,
  });
  await control.click();
  await expect(control).not.toBeChecked();
  const animation = await control.evaluate(
    (el) =>
      getComputedStyle(el.nextElementSibling!, "::after").transitionDuration,
  );
  expect(animation).toBe("0s");
});
