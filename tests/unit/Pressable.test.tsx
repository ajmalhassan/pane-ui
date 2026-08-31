import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pressable } from "@/components/metro/Pressable";

describe("Pressable", () => {
  afterEach(cleanup);

  it("preserves native button semantics", () => {
    render(<Pressable>Open project</Pressable>);
    expect(screen.getByRole("button", { name: "Open project" })).toBeEnabled();
  });

  it("clears tilt variables when the pointer leaves", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    fireEvent.pointerMove(button, { clientX: 20, clientY: 20 });
    fireEvent.pointerLeave(button);
    expect(button.style.getPropertyValue("--press-rotate-x")).toBe("");
    expect(button.style.getPropertyValue("--press-rotate-y")).toBe("");
  });

  it("still forwards pointer movement when reduced motion disables tilt", () => {
    const onPointerMove = vi.fn();
    vi.mocked(window.matchMedia).mockReturnValueOnce({
      ...window.matchMedia(""),
      matches: true,
    });
    render(
      <Pressable onPointerMove={onPointerMove}>Open project</Pressable>,
    );

    fireEvent.pointerMove(screen.getByRole("button"), {
      clientX: 20,
      clientY: 20,
    });

    expect(onPointerMove).toHaveBeenCalledOnce();
  });
});
