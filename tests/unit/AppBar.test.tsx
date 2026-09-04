import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { expect, it, vi } from "vitest";
import { AppBar, type AppAction } from "@/components/metro/AppBar";

const PRIMARY: readonly AppAction[] = [
  { label: "Résumé", href: "/resume", icon: "arrow-northeast" },
  { label: "Contact", href: "#contact", icon: "mail" },
];

function command(label: string) {
  return screen.getByRole("link", { name: label });
}

/**
 * jsdom never lays anything out, so every `getBoundingClientRect()` is all
 * zeros and `applyPressTilt`'s zero-size guard would return before any
 * pointer-type check runs. Giving the element a real box is the only way a
 * unit test can see past that guard.
 */
function stubBox(
  element: Element,
  { width, height }: { width: number; height: number },
) {
  const box: DOMRect = {
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width,
    height,
    right: width,
    bottom: height,
    toJSON: () => ({}),
  };

  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(box);
}

it("keeps action labels accessible and hides them only on demand", async () => {
  const user = userEvent.setup();
  render(
    <AppBar
      actions={[{ label: "Résumé", href: "/resume", icon: "arrow-northeast" }]}
    />,
  );
  expect(screen.getByRole("link", { name: "Résumé" })).toHaveAttribute("href", "/resume");
  expect(screen.getByTestId("app-bar")).toHaveAttribute("data-expanded", "true");
  await user.click(screen.getByRole("button", { name: "Hide app bar labels" }));
  expect(screen.getByTestId("app-bar")).toHaveAttribute("data-expanded", "false");
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
  const { container } = render(<AppBar actions={PRIMARY} />);
  const bar = within(container);
  const nav = bar.getByTestId("app-bar");

  expect(bar.getByRole("link", { name: "Résumé" }).querySelector("svg")).toBeInTheDocument();
  expect(bar.getByRole("link", { name: "Contact" }).querySelector("svg")).toBeInTheDocument();
  expect(
    bar.getByRole("button", { name: "Hide app bar labels" }).querySelector("svg"),
  ).toBeInTheDocument();
  expect(nav.querySelectorAll("svg")).toHaveLength(3);
  expect(nav.textContent).not.toMatch(/[↗✉…]/);
});

it("builds each command from exactly one hidden icon ring and one label", () => {
  render(<AppBar actions={PRIMARY} />);

  for (const label of ["Résumé", "Contact"]) {
    const children = [...command(label).children];

    expect(children).toHaveLength(2);
    expect(children[0]).toHaveAttribute("aria-hidden", "true");
    expect(children[0].querySelectorAll("svg")).toHaveLength(1);
    expect(children[1]).not.toHaveAttribute("aria-hidden");
    expect(children[1]).toHaveTextContent(label);
  }
});

it("gives the overflow command the same ring anatomy and the ellipsis glyph", () => {
  render(<AppBar actions={PRIMARY} />);
  const toggle = screen.getByRole("button", { name: "Hide app bar labels" });
  const ring = toggle.firstElementChild;

  expect(ring).toHaveAttribute("aria-hidden", "true");
  expect(ring?.querySelectorAll("svg")).toHaveLength(1);
  expect(ring?.querySelectorAll("circle")).toHaveLength(3);
});

it("lowercases command labels visually while keeping their accessible names", () => {
  render(<AppBar actions={PRIMARY} />);

  expect(command("Résumé")).toHaveAccessibleName("Résumé");
  expect(command("Contact")).toHaveAccessibleName("Contact");
  expect(getComputedStyle(screen.getByText("Résumé")).textTransform).toBe("lowercase");
});

it("names the overflow command for the state its activation produces", async () => {
  const user = userEvent.setup();
  render(<AppBar actions={PRIMARY} />);

  // Default shows labels: rings-with-labels is the approved non-negotiable look; collapse is opt-in on wide layouts.
  const hide = screen.getByRole("button", { name: "Hide app bar labels" });
  expect(hide).toHaveAttribute("aria-expanded", "true");

  await user.click(hide);
  const show = screen.getByRole("button", { name: "Show app bar labels" });
  expect(show).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.queryByRole("button", { name: "Hide app bar labels" }),
  ).not.toBeInTheDocument();

  await user.click(show);
  expect(
    screen.getByRole("button", { name: "Hide app bar labels" }),
  ).toHaveAttribute("aria-expanded", "true");
});

// The wide-layout collapse lives in a `min-width` query jsdom never evaluates,
// so it is pinned by the Playwright suite instead; this guards the base rule.
it("paints command labels with a base rule that never reaches for display:none", () => {
  render(<AppBar actions={PRIMARY} />);

  for (const label of ["Résumé", "Contact"]) {
    const text = screen.getByText(label);

    expect(text, label).toBeInTheDocument();
    expect(text, label).not.toHaveAttribute("aria-hidden");
    expect(getComputedStyle(text).display, label).not.toBe("none");
    expect(getComputedStyle(text).visibility, label).not.toBe("hidden");
  }
});

it("keeps href commands as real anchors and every other command a button", () => {
  const onSelect = vi.fn();
  render(
    <AppBar
      actions={[
        { label: "Résumé", href: "/resume", icon: "arrow-northeast" },
        { label: "Notes", icon: "notes", onSelect },
      ]}
    />,
  );

  const resume = command("Résumé");
  expect(resume.tagName).toBe("A");
  expect(resume).toHaveAttribute("href", "/resume");

  const notes = screen.getByRole("button", { name: "Notes" });
  expect(notes.tagName).toBe("BUTTON");
  expect(notes).toHaveAttribute("type", "button");
  fireEvent.click(notes);
  expect(onSelect).toHaveBeenCalledOnce();
});

it("hands the owner a ref to the anchor it rendered for a command", () => {
  const contact = createRef<HTMLAnchorElement>();
  render(
    <AppBar
      actions={[{ label: "Contact", href: "#contact", icon: "mail", ref: contact }]}
    />,
  );

  expect(contact.current).toBe(command("Contact"));
});

it("writes the shared press tilt onto the anchor command it rendered", () => {
  render(<AppBar actions={PRIMARY} />);
  const resume = command("Résumé");

  // jsdom lays nothing out, so the anchor needs a real box before the shared
  // helper has any geometry to turn into degrees.
  stubBox(resume, { width: 100, height: 50 });

  fireEvent.pointerMove(resume, { clientX: 75, clientY: 12.5 });
  expect(resume.style.getPropertyValue("--press-rotate-x")).toMatch(/deg$/);

  fireEvent.pointerLeave(resume);
  expect(resume.style.getPropertyValue("--press-rotate-x")).toBe("");
});

it("presses the command itself and keeps touch free of pointer tilt", () => {
  render(<AppBar actions={PRIMARY} />);
  const contact = command("Contact");

  expect(contact.querySelectorAll("a, button")).toHaveLength(0);

  // Give the anchor a real, measurable box first so a touch decline is a
  // deliberate opt-out and not just the zero-size guard returning early.
  stubBox(contact, { width: 100, height: 50 });

  fireEvent.pointerMove(contact, { clientX: 30, clientY: 10, pointerType: "touch" });
  expect(contact.style.getPropertyValue("--press-rotate-x")).toBe("");
  expect(contact.style.getPropertyValue("--press-rotate-y")).toBe("");

  // Control: the same measurable box and the same coordinates, but a mouse
  // pointer -- the variables should now be written, proving the touch result
  // above was an opt-out rather than an unmeasurable surface.
  fireEvent.pointerMove(contact, { clientX: 30, clientY: 10, pointerType: "mouse" });
  expect(contact.style.getPropertyValue("--press-rotate-x")).toMatch(/deg$/);
  expect(contact.style.getPropertyValue("--press-rotate-y")).toMatch(/deg$/);

  fireEvent.pointerLeave(contact);
  expect(contact.style.getPropertyValue("--press-rotate-x")).toBe("");
  expect(contact.style.getPropertyValue("--press-rotate-y")).toBe("");
});
