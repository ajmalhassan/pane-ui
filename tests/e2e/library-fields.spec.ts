import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("profile validation links errors, focuses the first invalid field, and resets native values", async ({
  page,
}) => {
  await page.goto("/library#fields");
  const form = page.getByRole("form", { name: "Profile preview" });
  const name = form.getByRole("textbox", { name: "Your name", exact: true });
  const email = form.getByRole("textbox", {
    name: "Email address",
    exact: true,
  });
  await form.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAccessibleDescription(/Enter your name to continue/);
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await name.fill("Ada Lovelace");
  await email.fill("ada@example.com");
  await form
    .getByRole("textbox", { name: "A little about you", exact: true })
    .fill("Building something thoughtful.");
  await form.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(form.getByRole("status")).toContainText(
    "Profile ready for Ada Lovelace",
  );
  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  await form.getByRole("button", { name: "Reset form", exact: true }).click();
  await expect(name).toHaveValue("");
  await expect(email).toHaveValue("");
});

test("field labels focus controls and error states fit narrow themes", async ({
  page,
}) => {
  await page.goto("/library#fields");
  await page.setViewportSize({ width: 320, height: 800 });
  const form = page.getByRole("form", { name: "Profile preview" });
  await form.locator('label[for="profile-name"]').click();
  await expect(
    form.getByRole("textbox", { name: "Your name", exact: true }),
  ).toBeFocused();
  await form.getByRole("button", { name: "Save profile", exact: true }).click();
  for (const mode of ["Light", "Dark"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    expect(
      (await new AxeBuilder({ page }).include("#fields").analyze()).violations,
    ).toEqual([]);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("textbox", { name: "Unavailable field", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("textbox", { name: "Read-only address", exact: true }),
  ).toHaveAttribute("readonly");
});
