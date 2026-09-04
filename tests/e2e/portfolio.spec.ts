import { expect, type Locator, type Page, test } from "@playwright/test";

const PIVOTS = ["Me", "Projects", "Blog", "Photography"] as const;
const VALID_VIEWS = ["me", "projects", "blog", "photography"] as const;

async function tabTo(page: Page, target: Locator, attempts = 24) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await page.keyboard.press("Tab");
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
  }

  throw new Error(`Tab did not reach ${await target.getAttribute("href")}`);
}

test("bare and invalid URLs show Me with one page heading", async ({
  page,
}) => {
  for (const path of ["/", "/?view=invalid"]) {
    await page.goto(path);
    await expect(page.getByRole("tab", { name: "Me" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", { level: 1, name: /technical leader/i }),
    ).toBeVisible();
  }
});

test("Next links update pivot history and back/forward restore selected state", async ({
  page,
}) => {
  await page.goto("/?view=projects");
  await expect(page.getByRole("tab", { name: "Projects" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByRole("tab", { name: "Blog" }).click();
  await expect(page).toHaveURL(/\?view=blog$/);
  await expect(page.getByRole("tab", { name: "Blog" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(/\?view=projects$/);
  await expect(page.getByRole("tab", { name: "Projects" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.goForward();
  await expect(page).toHaveURL(/\?view=blog$/);
  await expect(page.getByRole("tab", { name: "Blog" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("modified pivot clicks open Projects and leave the opener unchanged", async ({
  context,
  page,
}) => {
  await page.goto("/");

  const openerUrl = page.url();
  const newPagePromise = context.waitForEvent("page");
  await page
    .getByRole("tab", { name: "Projects" })
    .click({ modifiers: ["ControlOrMeta"] });
  const newPage = await newPagePromise;
  await newPage.waitForURL(/\?view=projects$/, {
    waitUntil: "domcontentloaded",
  });

  await expect(newPage).toHaveURL(/\?view=projects$/);
  await expect(newPage.getByRole("tab", { name: "Projects" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page).toHaveURL(openerUrl);
  await expect(page.getByRole("tab", { name: "Me" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await newPage.close();
});

test("keyboard reaches pivots, project links, and app-bar actions", async ({
  page,
}) => {
  await page.goto("/?view=projects");

  for (const name of PIVOTS) {
    const pivot = page.getByRole("tab", { name });
    await tabTo(page, pivot);
    await expect(pivot).toBeFocused();
  }

  const project = page
    .getByRole("tabpanel", { name: "Projects" })
    .getByRole("link")
    .first();
  await tabTo(page, project);
  await expect(project).toBeFocused();

  const resume = page.getByRole("link", { name: "Résumé" });
  await tabTo(page, resume);
  await expect(resume).toBeFocused();

  const contact = page.getByRole("link", { name: "Contact" });
  await tabTo(page, contact);
  await expect(contact).toBeFocused();
  await expect(contact).toHaveAttribute("href", "#contact");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator("#contact")).toHaveAttribute("data-open", "true");
});

test("contact follows fragment history and close clears it", async ({ page }) => {
  await page.goto("/?view=me");
  await page.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/#contact$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeHidden();

  await page.getByRole("link", { name: "Contact" }).click();
  await page.getByRole("button", { name: "Close contact" }).click();
  await expect(page).not.toHaveURL(/#contact$/);
  await expect(page.getByRole("link", { name: "Contact" })).toBeFocused();
});

test("direct fragment load opens contact and close keeps the pivot query", async ({
  page,
}) => {
  await page.goto("/?view=projects#contact");
  await expect(page.getByRole("button", { name: "Close contact" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Projects" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByRole("button", { name: "Close contact" }).click();
  await expect(page).toHaveURL(/\/\?view=projects$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeHidden();
  await expect(page.getByRole("link", { name: "Contact" })).toBeFocused();
});

test("pivot navigation while contact is open follows the fragment-less URL", async ({
  page,
}) => {
  await page.goto("/?view=me");
  await page.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/#contact$/);
  expect(
    await page.evaluate(() => window.history.state?.portfolioContact),
  ).toBe(true);

  await page.getByRole("tab", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/\?view=projects$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeHidden();
  await expect(page.getByRole("link", { name: "Contact" })).not.toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(/\/\?view=me#contact$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeVisible();
});

test("arrow keys navigate pivots through their real links", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Me" }).focus();
  await page.keyboard.press("ArrowRight");

  await expect(page).toHaveURL(/\?view=projects$/);
  await expect(page.getByRole("tab", { name: "Projects" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Projects" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("every valid pivot keeps exactly one persistent page heading", async ({
  page,
}) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  const persistentHeading = await heading.elementHandle();
  if (!persistentHeading) throw new Error("Page heading was not rendered");

  for (const view of VALID_VIEWS) {
    await page.getByRole("tab", { name: new RegExp(`^${view}$`, "i") }).click();
    await expect(page).toHaveURL(new RegExp(`\\?view=${view}$`));
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveText(/technical leader \/ builder/i);
    expect(
      await heading.evaluate(
        (currentHeading, originalHeading) => currentHeading === originalHeading,
        persistentHeading,
      ),
    ).toBe(true);
  }
});

test("reduced motion removes panorama transforms", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?view=projects");

  const plane = page.locator('[role="tabpanel"]').first().locator("..");
  await expect(plane).toHaveCSS("transform", "none");
  await expect(plane).toHaveCSS("transition-duration", "0s");
});

test("captures a named review screenshot without a committed baseline", async ({
  page,
}, testInfo) => {
  await page.goto("/?view=projects");
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(
      `portfolio-projects-${testInfo.project.name}.png`,
    ),
  });
});

test("project panorama preserves the leading headline on a compact phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/?view=projects");

  const heading = page.getByRole("heading", {
    level: 1,
    name: /technical leader/i,
  });
  const box = await heading.boundingBox();

  expect(box).not.toBeNull();
  expect(box?.x).toBeGreaterThanOrEqual(0);
});

test("compact project summaries do not collide with their destination links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/?view=projects");

  const tiles = page.getByRole("article");
  for (let index = 0; index < (await tiles.count()); index += 1) {
    const tile = tiles.nth(index);
    const summary = tile.locator("button > span").first().locator("span").last();
    const link = tile.getByRole("link");
    const summaryBox = await summary.boundingBox();
    const linkBox = await link.boundingBox();

    expect(summaryBox).not.toBeNull();
    expect(linkBox).not.toBeNull();
    expect((summaryBox?.y ?? 0) + (summaryBox?.height ?? 0)).toBeLessThanOrEqual(
      linkBox?.y ?? 0,
    );
  }
});

test("résumé uses a white page canvas when printed", async ({ page }) => {
  await page.emulateMedia({ media: "print" });
  await page.goto("/resume");

  const backgrounds = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    html: getComputedStyle(document.documentElement).backgroundColor,
    resume: getComputedStyle(document.querySelector("main")!).backgroundColor,
  }));

  expect(backgrounds).toEqual({
    body: "rgb(255, 255, 255)",
    html: "rgb(255, 255, 255)",
    resume: "rgb(255, 255, 255)",
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("core content, destinations, and every pivot remain keyboard reachable", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /technical leader/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    const expectedHrefs = [
      "/?view=me",
      "/?view=projects",
      "/?view=blog",
      "/?view=photography",
    ];
    for (let index = 0; index < PIVOTS.length; index += 1) {
      const name = PIVOTS[index];
      const pivot = page.getByRole("tab", { name });
      await expect(pivot).toHaveAttribute("href", expectedHrefs[index]);
      await page.keyboard.press("Tab");
      await expect(pivot).toBeFocused();
    }

    await expect(page.getByRole("link", { name: "Résumé" })).toHaveAttribute(
      "href",
      "/resume",
    );
    await expect(page.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "#contact",
    );
  });
});
