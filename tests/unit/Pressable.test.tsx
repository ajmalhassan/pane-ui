import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pressable } from "@/components/metro/Pressable";

/**
 * jsdom never lays anything out, so every `getBoundingClientRect()` is all
 * zeros and the tilt maths would divide by zero unobserved. Giving the element
 * a real box is the only way a unit test can see the helper *write*.
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

  /*
   * Upper-right quadrant: the pointer sits right of centre (x = +0.25) and above
   * it (y = -0.25). `--press-rotate-y` is `x * intensity`, so it is positive;
   * `--press-rotate-x` is `-y * intensity`, which negates a negative y, so it is
   * positive too. Both axes therefore read positive for this one corner, and a
   * sign flip in either formula fails here.
   */
  it("writes positive tilt on both axes for a pointer above and right of centre", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerMove(button, { clientX: 75, clientY: 12.5 });

    const rotateX = button.style.getPropertyValue("--press-rotate-x");
    const rotateY = button.style.getPropertyValue("--press-rotate-y");

    expect(rotateX).toMatch(/^\d+(\.\d+)?deg$/);
    expect(rotateY).toMatch(/^\d+(\.\d+)?deg$/);
    expect(Number.parseFloat(rotateX)).toBeGreaterThan(0);
    expect(Number.parseFloat(rotateY)).toBeGreaterThan(0);

    fireEvent.pointerLeave(button);
    expect(button.style.getPropertyValue("--press-rotate-x")).toBe("");
    expect(button.style.getPropertyValue("--press-rotate-y")).toBe("");
  });

  it("writes nothing at all when the surface measures zero", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 0, height: 0 });

    fireEvent.pointerMove(button, { clientX: 75, clientY: 12.5 });

    // Without the guard this reads "-Infinitydeg": a non-empty, invalid value.
    expect(button.style.getPropertyValue("--press-rotate-x")).toBe("");
    expect(button.style.getPropertyValue("--press-rotate-y")).toBe("");
  });

  /*
   * Touch is the other tilt opt-out. The helper returns before it writes, but a
   * consumer's own pointer handler -- a live tile pausing its cycle, say -- has
   * nothing to do with tilt and must still run on the touch path.
   */
  it("still forwards pointer movement from a touch pointer", () => {
    const onPointerMove = vi.fn();
    render(<Pressable onPointerMove={onPointerMove}>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerMove(button, {
      clientX: 75,
      clientY: 12.5,
      pointerType: "touch",
    });

    expect(onPointerMove).toHaveBeenCalledOnce();
    expect(button.style.getPropertyValue("--press-rotate-x")).toBe("");
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
