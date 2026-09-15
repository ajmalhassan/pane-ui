import { expect, test } from "@playwright/test";

test("native hidden removes tiles, app-bar and pivot primitives from layout and focus", async ({
  page,
}) => {
  await page.goto("/library");
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.id = "hidden-contract";
    fixture.className = "wp-theme";
    fixture.innerHTML = `<button id="before-hidden">Before</button>
      <a hidden class="wp-tile" href="#">Private tile</a>
      <div hidden class="wp-tile-grid"><button>Private grid</button></div>
      <div hidden class="wp-app-bar"><button>Private bar</button></div>
      <button hidden class="wp-app-bar-action">Private action</button>
      <a hidden class="wp-app-bar-action wp-app-bar-link" href="#">Private link</a>
      <div hidden class="wp-pivot-list"><button role="tab">Private tab</button></div>
      <button id="after-hidden">After</button>`;
    document.body.append(fixture);
  });
  for (const node of await page.locator("#hidden-contract [hidden]").all()) {
    await expect(node).toHaveCSS("display", "none");
    await expect(node).not.toBeVisible();
    expect(
      await node.evaluate((el) => {
        (el as HTMLElement).focus();
        return (
          el === document.activeElement || el.contains(document.activeElement)
        );
      }),
    ).toBe(false);
  }
});

test("form, feedback and list content reflows with doubled text and expanded spacing", async ({
  page,
}) => {
  await page.goto("/library#fields");
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Apply user text overrides to content, not geometric icons or media.
  const sizes = await page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        "#fields .wp-label, #fields .wp-field-description, #fields .wp-field-error, #fields input, #fields textarea, #fields button, #feedback .wp-message-heading, #feedback .wp-message-content, #lists .wp-list-title, #lists .wp-list-description, #lists .wp-list-meta, #lists .wp-section-header, #lists .wp-section-meta",
      ),
    );
    const before = nodes.map((el) => parseFloat(getComputedStyle(el).fontSize));
    nodes.forEach((el, index) => {
      el.style.fontSize = `${before[index] * 2}px`;
      el.style.lineHeight = "1.5";
      el.style.letterSpacing = "0.12em";
      el.style.wordSpacing = "0.16em";
    });
    return nodes.map((el, index) => ({
      before: before[index],
      after: parseFloat(getComputedStyle(el).fontSize),
    }));
  });
  expect(sizes.length).toBeGreaterThan(10);
  for (const size of sizes) expect(size.after).toBeCloseTo(size.before * 2, 1);
  const overflow = await page
    .locator(
      "#fields .wp-field, #fields .wp-button, #feedback .wp-message-banner, #feedback .wp-message-heading, #feedback .wp-message-content, #lists .wp-list-item, #lists .wp-list-copy, #lists .wp-section-header",
    )
    .evaluateAll((elements) =>
      elements
        .filter(
          (el) =>
            el.getClientRects().length && el.scrollWidth > el.clientWidth + 1,
        )
        .map((el) => ({
          class: el.className,
          width: el.clientWidth,
          scroll: el.scrollWidth,
        })),
    );
  expect(overflow).toEqual([]);
  const name = page.locator("#fields").getByRole("textbox").first();
  await name.fill("A longer collection name");
  await expect(name).toHaveValue("A longer collection name");
});

test("forced colors preserves checkbox state and visible keyboard focus", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "WebKit does not emulate forced-colors; physical high-contrast review is documented separately.",
  );
  await page.goto("/library#selection");
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  expect(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
  ).toBe(true);
  const checkbox = page.getByRole("checkbox", {
    name: "Send me product updates",
    exact: true,
  });
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  const visual = checkbox.locator("+ .wp-selection-visual");
  await expect(visual).toHaveCSS("border-style", "solid");
  expect(
    parseFloat(
      await visual.evaluate((el) => getComputedStyle(el).borderTopWidth),
    ),
  ).toBeGreaterThan(0);
  await expect(visual).toHaveCSS("outline-style", "solid");
  expect(
    parseFloat(
      await visual.evaluate((el) => getComputedStyle(el).outlineWidth),
    ),
  ).toBeGreaterThan(0);
});
