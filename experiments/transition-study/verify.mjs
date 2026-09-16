import { chromium, firefox, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const output = new URL("./.local/verification/", import.meta.url);
await mkdir(output, { recursive: true });
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1120, height: 1050 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:3102");
    await page.waitForFunction(() => window.study);
    assert.equal(await page.locator("#play").textContent(), "Play");
    await page.locator("#next").click();
    assert.equal(await page.locator("#time").textContent(), "4.242 s");
    await page.locator("#previous").click();
    assert.equal(await page.locator("#time").textContent(), "4.200 s");
    const initial = await page
      .locator("#proposed .tile")
      .first()
      .evaluate((el) => getComputedStyle(el).transform);
    await page.evaluate(() => window.study.seek(4616.667));
    const turned = await page
      .locator("#proposed .tile")
      .first()
      .evaluate((el) => getComputedStyle(el).transform);
    assert.notEqual(initial, turned);
    await page.screenshot({
      path: new URL(`${name}-turn.png`, output).pathname,
    });
    await page.evaluate(() => window.study.seek(4741.667));
    assert.equal(
      await page
        .locator("#proposed .app")
        .evaluate((el) => getComputedStyle(el).visibility),
      "visible",
    );
    assert.equal(
      await page
        .locator("#proposed .world")
        .evaluate((el) => getComputedStyle(el).visibility),
      "hidden",
    );
    await page.evaluate(() => window.study.seek(5300));
    await page.screenshot({
      path: new URL(`${name}-settled.png`, output).pathname,
    });
    await page.locator("#reset").click();
    assert.equal(
      await page
        .locator("#proposed .tile")
        .first()
        .evaluate((el) => getComputedStyle(el).transform),
      initial,
    );
    await page.locator("#artwork").uncheck();
    assert.equal(
      await page
        .locator("#proposed .tile img")
        .first()
        .evaluate((el) => getComputedStyle(el).visibility),
      "hidden",
    );
    await page.locator("#play").click();
    await page.waitForFunction(
      () => Number(document.querySelector("#scrub").value) > 4250,
    );
    await page.locator("#play").click();
    assert.equal(await page.locator("#play").textContent(), "Play");
    await page.setViewportSize({ width: 320, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      `${name}: frame stepping, seek/reverse, app boundary, artwork toggle, playback/pause, 320px layout, no runtime errors passed.`,
    );
  } finally {
    await browser.close();
  }
}
