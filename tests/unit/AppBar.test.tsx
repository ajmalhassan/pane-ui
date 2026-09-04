import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AppBar } from "@/components/metro/AppBar";

it("keeps action labels accessible and reveals them visually on demand", async () => {
  const user = userEvent.setup();
  render(
    <AppBar
      actions={[{ label: "Résumé", href: "/resume", icon: "arrow-northeast" }]}
    />,
  );
  expect(screen.getByRole("link", { name: "Résumé" })).toHaveAttribute("href", "/resume");
  await user.click(screen.getByRole("button", { name: "Show app bar labels" }));
  expect(screen.getByTestId("app-bar")).toHaveAttribute("data-expanded", "true");
});

it("enhances ordinary href clicks without intercepting modified clicks", () => {
  const onSelect = vi.fn();
  render(
    <AppBar
      actions={[{ label: "Contact", href: "#contact", icon: "mail", onSelect }]}
    />,
  );
  const contact = screen.getByRole("link", { name: "Contact" });
  contact.addEventListener("click", (event) => event.preventDefault());

  expect(contact).toHaveAttribute("href", "#contact");
  fireEvent.click(contact);
  expect(onSelect).toHaveBeenCalledOnce();
  fireEvent.click(contact, { metaKey: true });
  expect(onSelect).toHaveBeenCalledOnce();
});

it("renders every command with a production SVG icon and no unicode placeholder", () => {
  const { container } = render(
    <AppBar
      actions={[
        { label: "Résumé", href: "/resume", icon: "arrow-northeast" },
        { label: "Contact", href: "#contact", icon: "mail" },
      ]}
    />,
  );
  const bar = within(container);
  const nav = bar.getByTestId("app-bar");

  expect(bar.getByRole("link", { name: "Résumé" }).querySelector("svg")).toBeInTheDocument();
  expect(bar.getByRole("link", { name: "Contact" }).querySelector("svg")).toBeInTheDocument();
  expect(
    bar.getByRole("button", { name: "Show app bar labels" }).querySelector("svg"),
  ).toBeInTheDocument();
  expect(nav.querySelectorAll("svg")).toHaveLength(3);
  expect(nav.textContent).not.toMatch(/[↗✉…]/);
});
