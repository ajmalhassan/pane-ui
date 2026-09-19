import { expect, test } from "@playwright/test";

const origin = "https://pane.ajmalhassan.com";
test("public routes expose canonical and social metadata", async ({ page }) => {
  for (const path of [
    "/",
    "/about",
    "/docs",
    "/docs/tile-sequence",
    "/phone",
    "/examples",
    "/examples/inbox",
    "/examples/settings",
  ]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${origin}${path === "/" ? "" : path}`,
    );
    const title = await page.title();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      title,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `${origin}${path === "/" ? "" : path}`,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    await expect(
      page.locator('meta[property="og:image"]').first(),
    ).toHaveAttribute(
      "content",
      /^https:\/\/pane\.ajmalhassan\.com\/opengraph-image/,
    );
  }
});
test("crawler files cover docs, omit legacy pages, and serve a social image", async ({
  request,
  page,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml).toContain(`${origin}/docs/tile-sequence`);
  expect(xml).not.toContain("/portfolio");
  expect(xml).not.toContain("/blog");
  expect(await (await request.get("/robots.txt")).text()).toContain(
    `Sitemap: ${origin}/sitemap.xml`,
  );
  const image = await request.get("/opengraph-image");
  expect(image.ok()).toBeTruthy();
  expect(image.headers()["content-type"]).toContain("image/png");
  await page.goto("/portfolio");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
