import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ComponentPreview } from "@/components/docs/ComponentPreview";

describe("documentation preview journeys", () => {
  it("keeps staggered content painted until the owning transition exits", async () => {
    const user = userEvent.setup();
    const previous = Object.getOwnPropertyDescriptor(
      Element.prototype,
      "animate",
    );
    let finish!: () => void;
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value: vi.fn(() => ({
        finished: new Promise<void>((resolve) => {
          finish = resolve;
        }),
        cancel: vi.fn(),
      })),
    });
    try {
      const { container } = render(<ComponentPreview name="transition" />);
      await user.click(screen.getByRole("button", { name: "Hide content" }));
      const transition = container.querySelector(".wp-transition");
      const stagger = container.querySelector(".wp-stagger");
      expect(transition).toHaveAttribute("data-state", "exiting");
      expect(transition).toHaveAttribute("inert");
      expect(transition).toHaveAttribute("aria-hidden", "true");
      expect(stagger).not.toHaveAttribute("hidden");
      expect(screen.getByText("Messages")).toBeVisible();
      await act(async () => finish());
      expect(transition).toHaveAttribute("data-state", "exited");
      expect(screen.queryByText("Messages")).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Exit completed");
    } finally {
      if (previous)
        Object.defineProperty(Element.prototype, "animate", previous);
      else delete (Element.prototype as Partial<Element>).animate;
    }
  });

  it("keeps preview state isolated between examples", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ComponentPreview name="pressable" />
        <ComponentPreview name="buttons" />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Add a moment" }));
    expect(screen.getByText("1 moments added")).toBeInTheDocument();
    expect(screen.getByText("0 notes added")).toBeInTheDocument();
  });

  it("connects the editable field to its error as a user clears it", async () => {
    const user = userEvent.setup();
    render(<ComponentPreview name="fields" />);
    const input = screen.getByRole("textbox", { name: "Collection name" });
    await user.clear(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Choose a name you will remember. Enter a collection name.",
    );
    await user.type(input, "Coast");
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("restores focus to a surviving action when feedback is dismissed", async () => {
    const user = userEvent.setup();
    render(<ComponentPreview name="message-banner" />);
    await user.click(
      screen.getByRole("button", { name: "Dismiss saved message" }),
    );
    expect(screen.queryByText("Saved locally")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show message" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Show message" }));
    expect(screen.getByText("Saved locally")).toBeInTheDocument();
  });

  it("accepts radio selection and scopes a theme change to its own subtree", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <ComponentPreview name="selection" />
        <ComponentPreview name="theme" />
      </>,
    );
    await user.click(screen.getByRole("radio", { name: "Weekly" }));
    expect(screen.getByRole("radio", { name: "Weekly" })).toBeChecked();
    expect(screen.getByText("Delivery: weekly")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use light theme" }));
    expect(
      container.querySelector(
        '[data-component-preview="theme"] [data-mode="light"]',
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(
        '[data-component-preview="selection"] > [data-mode="dark"]',
      ),
    ).toBeTruthy();
  });
});
