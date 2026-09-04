import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { METRO_ICON_NAMES, MetroIcon } from "@/components/metro/MetroIcon";

function renderEveryIcon() {
  return render(
    <>
      {METRO_ICON_NAMES.map((name) => (
        <MetroIcon key={name} name={name} />
      ))}
    </>,
  );
}

it("draws every supported command as a controlled inline SVG", () => {
  const { container } = renderEveryIcon();

  expect(METRO_ICON_NAMES).toHaveLength(6);
  expect(container.querySelectorAll("svg")).toHaveLength(6);
});

it("shares one view box, fill, stroke, and joinery contract across the icon set", () => {
  const { container } = renderEveryIcon();
  const svgs = [...container.querySelectorAll("svg")];

  for (const svg of svgs) {
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("stroke-linecap", "square");
    expect(svg).toHaveAttribute("stroke-linejoin", "miter");
    expect(svg).toHaveAttribute("stroke-width", "1.75");
  }
});

it("never falls back to placeholder unicode glyphs", () => {
  const { container } = renderEveryIcon();

  expect(screen.queryByText("↗")).not.toBeInTheDocument();
  expect(screen.queryByText("✉")).not.toBeInTheDocument();
  expect(screen.queryByText("…")).not.toBeInTheDocument();
  expect(container.textContent).not.toMatch(/[↗✉…]/);
});

it("names a titled standalone icon for assistive technology", () => {
  const { container } = render(<MetroIcon name="mail" title="Contact" />);

  expect(within(container).getByRole("img", { name: "Contact" })).toBeInTheDocument();
});

it("hides an untitled decorative icon from assistive technology", () => {
  const { container } = render(<MetroIcon name="back" />);
  const svg = container.querySelector("svg");

  expect(svg).toHaveAttribute("aria-hidden", "true");
  expect(svg).toHaveAttribute("focusable", "false");
  expect(svg).not.toHaveAttribute("role");
  expect(within(container).queryByRole("img")).not.toBeInTheDocument();
});
