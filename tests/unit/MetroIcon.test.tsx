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

it("draws every supported name as its own controlled inline SVG", () => {
  const { container } = renderEveryIcon();
  const glyphs = [...container.querySelectorAll("svg")].map(
    (svg) => svg.innerHTML,
  );

  // The craft tile's motif: an SVG arrow, never a Unicode one.
  expect(METRO_ICON_NAMES).toContain("arrow-east");
  expect(glyphs).toHaveLength(METRO_ICON_NAMES.length);
  // Every name draws something, and no two names draw the same thing.
  expect(glyphs.filter(Boolean)).toHaveLength(METRO_ICON_NAMES.length);
  expect(new Set(glyphs).size).toBe(METRO_ICON_NAMES.length);
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

  expect(
    within(container).getByRole("img", { name: "Contact" }),
  ).toBeInTheDocument();
});

it("hides an untitled decorative icon from assistive technology", () => {
  const { container } = render(<MetroIcon name="back" />);
  const svg = container.querySelector("svg");

  expect(svg).toHaveAttribute("aria-hidden", "true");
  expect(svg).toHaveAttribute("focusable", "false");
  expect(svg).not.toHaveAttribute("role");
  expect(within(container).queryByRole("img")).not.toBeInTheDocument();
});
