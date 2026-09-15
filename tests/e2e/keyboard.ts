import type { Page } from "@playwright/test";

/** macOS WebKit uses Option-Tab for all controls when OS keyboard navigation is off.
 * Do not mutate the contributor's system preference or change production tabIndex.
 */
export async function pressTab(page: Page, reverse = false) {
  const allControls =
    process.platform === "darwin" &&
    page.context().browser()?.browserType().name() === "webkit";
  await page.keyboard.press(
    `${allControls ? "Alt+" : ""}${reverse ? "Shift+" : ""}Tab`,
  );
}
