import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("workshop exposes real tile interactions and scoped themes", async ({
  page,
}) => {
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: "alive by design." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("[data-workshop]")).toHaveAttribute(
    "data-mode",
    "light",
  );
  const reveal = page.getByRole("button", { name: "a different perspective" });
  await reveal.click();
  await expect(reveal).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Pause a little life" }).click();
  await expect(
    page.getByRole("button", { name: "Resume a little life" }),
  ).toBeVisible();
  await reveal.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("transition stage exits and reenters without leaving a stale layer", async ({
  page,
}) => {
  await page.goto("/library#motion");
  await page.getByRole("button", { name: "Slide", exact: true }).click();
  await page.getByRole("button", { name: "Exit stage" }).click();
  await expect(page.getByTestId("motion-surface")).toHaveAttribute(
    "data-state",
    "exited",
  );
  await page.getByRole("button", { name: "Enter stage" }).click();
  await expect(page.getByTestId("motion-surface")).toHaveAttribute(
    "data-state",
    "entered",
  );
  await page.getByRole("button", { name: "Replay transition" }).click();
  await expect(page.getByTestId("motion-surface")).toHaveAttribute(
    "data-state",
    "entered",
  );
});

test("reduced motion and narrow layouts remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/library");
  await expect(
    page.getByText("Reduced motion is active", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Exit stage" }).click();
  await expect(page.getByTestId("motion-surface")).toHaveAttribute(
    "data-state",
    "exited",
  );
  await page.getByRole("button", { name: "Enter stage" }).click();
  await expect(page.getByTestId("motion-surface")).toHaveAttribute(
    "data-state",
    "entered",
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});

test("overview and detail restore keyboard focus after their transitions", async ({
  page,
}) => {
  await page.goto("/library");
  await page.getByRole("button", { name: "Open the idea" }).click();
  const heading = page.getByRole("heading", {
    name: "the beauty is in the details.",
  });
  await expect(heading).toBeFocused();
  await page.getByRole("button", { name: "Back to overview" }).click();
  await expect(
    page.getByRole("button", { name: "Open the idea" }),
  ).toBeFocused();
});

for (const mode of ["Dark", "Light"] as const) {
  test(`all five accents are accessible in ${mode.toLowerCase()} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/library");
    await page.getByRole("button", { name: mode, exact: true }).click();
    for (const accent of ["blue", "violet", "magenta", "orange", "green"]) {
      await page
        .getByRole("button", { name: `${accent} accent`, exact: true })
        .click();
      const violations = (await new AxeBuilder({ page }).analyze()).violations;
      expect(violations, `${mode} / ${accent}`).toEqual([]);
    }
  });
}

test("turnstile direction reversal preserves the displayed browser frame", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/library#motion");
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    let calls = 0;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (this.getAttribute("data-testid") === "motion-surface") {
        animation.pause();
        animation.currentTime =
          calls++ === 0
            ? Number(animation.effect!.getTiming().duration) / 2
            : 0;
      }
      return animation;
    };
  });
  await page.getByRole("button", { name: "Exit stage", exact: true }).click();
  const surface = page.getByTestId("motion-surface");
  await expect(surface).toHaveAttribute("data-state", "exiting");
  const before = await surface.boundingBox();
  await page.getByRole("button", { name: "backward", exact: true }).click();
  const after = await surface.boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs(before!.x - after!.x)).toBeLessThan(0.1);
  expect(Math.abs(before!.width - after!.width)).toBeLessThan(0.1);
  await surface.evaluate((element) =>
    element.getAnimations().forEach((animation) => animation.finish()),
  );
  await expect(surface).toHaveAttribute("data-state", "exited");
});
