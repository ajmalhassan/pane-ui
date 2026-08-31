import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { AppBar } from "@/components/metro/AppBar";

it("keeps action labels accessible and reveals them visually on demand", async () => {
  const user = userEvent.setup();
  render(<AppBar actions={[{ label: "Résumé", href: "/resume", icon: "↗" }]} />);
  expect(screen.getByRole("link", { name: "Résumé" })).toHaveAttribute("href", "/resume");
  await user.click(screen.getByRole("button", { name: "Show app bar labels" }));
  expect(screen.getByTestId("app-bar")).toHaveAttribute("data-expanded", "true");
});
