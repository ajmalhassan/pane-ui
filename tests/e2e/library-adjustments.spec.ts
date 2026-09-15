import { pressTab } from "./keyboard";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.use({ hasTouch: true });
test("select and slider submit native values and reset the live readout", async ({
  page,
}) => {
  await page.goto("/library#adjustments");
  const form = page.getByRole("form", { name: "Display settings preview" });
  const select = form.getByRole("combobox", {
    name: "Appearance",
    exact: true,
  });
  await select.selectOption("dark");
  const slider = form.getByRole("slider", { name: "Brightness", exact: true });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("65");
  await expect(slider).toHaveAttribute("aria-valuetext", "65 percent");
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0");
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("100");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("100");
  await form
    .getByRole("button", { name: "Save display settings", exact: true })
    .click();
  await expect(form.locator('p[role="status"]')).toHaveText(
    "Saved: dark appearance, 100% brightness.",
  );
  await form
    .getByRole("button", { name: "Reset display settings", exact: true })
    .click();
  await expect(select).toHaveValue("system");
  await expect(slider).toHaveValue("60");
  await expect(form.locator("output")).toHaveText("60 %");
});
test("slider responds to touch and narrow themes remain accessible", async ({
  page,
}) => {
  await page.goto("/library#adjustments");
  await page.setViewportSize({ width: 320, height: 800 });
  const slider = page.getByRole("slider", { name: "Brightness", exact: true });
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  await page.touchscreen.tap(
    box!.x + box!.width * 0.8,
    box!.y + box!.height / 2,
  );
  expect(Number(await slider.inputValue())).toBeGreaterThanOrEqual(75);
  for (const mode of ["Light", "Dark"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    expect(
      (await new AxeBuilder({ page }).include("#adjustments").analyze())
        .violations,
    ).toEqual([]);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("slider", { name: "Automatic level", exact: true }),
  ).toBeDisabled();
});

test("invalid slider retains a distinct keyboard focus indicator", async ({
  page,
}) => {
  await page.goto("/library#adjustments");
  const slider = page.getByRole("slider", { name: "Brightness", exact: true });
  await slider.evaluate((element) =>
    element.setAttribute("aria-invalid", "true"),
  );
  await expect(slider).toHaveCSS("outline-style", "dashed");
  await pressTab(page);
  await slider.focus();
  await expect(slider).toHaveCSS("outline-style", "solid");
  await expect(slider).toHaveCSS("outline-offset", "4px");
});
