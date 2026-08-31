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

test("modified pivot clicks are not intercepted by client navigation", async ({
  page,
}) => {
  await page.goto("/");

  const projects = page.getByRole("tab", { name: "Projects" });
  const wasPrevented = await projects.evaluate((link) => {
    const modifiedClick = new MouseEvent("click", {
      bubbles: true,
      button: 0,
      cancelable: true,
      ctrlKey: true,
    });

    link.dispatchEvent(modifiedClick);
    return modifiedClick.defaultPrevented;
  });

  expect(wasPrevented).toBe(false);
  await expect(page).toHaveURL(/\?view=projects$/);
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
