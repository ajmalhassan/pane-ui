import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const directory = resolve(".superpowers/library-review");
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  await page.goto(
    process.env.ARTIFACT_BASE_URL
      ? `${process.env.ARTIFACT_BASE_URL}/library`
      : "http://127.0.0.1:3101/library",
  );
  await page.getByRole("heading", { name: "alive by design." }).waitFor();
  await page.getByRole("button", { name: "Pause a little life" }).click();
  await page.locator(".wp-live-frame").evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${directory}/desktop.png`, fullPage: true });
  await page
    .locator("#navigation")
    .screenshot({ path: `${directory}/navigation-desktop.png` });
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.screenshot({ path: `${directory}/light.png`, fullPage: true });
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.locator("#motion").scrollIntoViewIfNeeded();
  await page
    .getByRole("button", { name: "Exit stage", exact: true })
    .evaluate((button) => {
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        const animation = original.apply(this, args);
        animation.pause();
        animation.currentTime =
          Number(animation.effect.getTiming().duration) * 0.5;
        return animation;
      };
      button.click();
    });
  await page.getByTestId("motion-surface").evaluate(async (element) => {
    const animation = element.getAnimations()[0];
    if (!animation)
      throw new Error("Motion stage did not create a browser animation");
    animation.pause();
    animation.currentTime = Number(animation.effect.getTiming().duration) * 0.5;
  });
  await page
    .locator("#motion")
    .screenshot({ path: `${directory}/motion-midpoint.png` });
  await page
    .getByTestId("motion-surface")
    .evaluate((element) =>
      element.getAnimations().forEach((animation) => animation.finish()),
    );
  await page.getByRole("button", { name: "Enter stage", exact: true }).click();
  for (const width of [393, 320]) {
    await page.setViewportSize({ width, height: 851 });
    await page
      .locator("#navigation")
      .screenshot({ path: `${directory}/navigation-${width}.png` });
    await page.screenshot({
      path: `${directory}/mobile-${width}.png`,
      fullPage: true,
    });
  }
  console.log(directory);
} finally {
  await browser.close();
}
