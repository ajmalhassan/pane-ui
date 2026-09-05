import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of [
  "/",
  "/?view=projects",
  "/?view=blog",
  "/?view=photography",
  "/blog",
  "/resume",
]) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter((item) =>
      ["serious", "critical"].includes(item.impact ?? ""),
    );

    expect(seriousOrCritical).toEqual([]);
  });
}
