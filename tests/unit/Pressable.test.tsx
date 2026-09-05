import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Pressable } from "@/components/metro/Pressable";

/**
 * jsdom never lays anything out, so every `getBoundingClientRect()` is all
 * zeros and the tilt maths would divide by zero unobserved. Giving the element
 * a real box is the only way a unit test can see the helper *write*.
 */
function stubBox(
  element: Element,
  {
    width,
    height,
    left = 0,
    top = 0,
  }: { width: number; height: number; left?: number; top?: number },
) {
  const box: DOMRect = {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  };

  return vi.spyOn(element, "getBoundingClientRect").mockReturnValue(box);
}

function setReducedMotion(reduced: boolean) {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: reduced && query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

function tiltOf(element: HTMLElement) {
  return {
    x: element.style.getPropertyValue("--press-rotate-x"),
    y: element.style.getPropertyValue("--press-rotate-y"),
  };
}

const CLEARED = { x: "", y: "" };

describe("Pressable", () => {
  beforeEach(() => setReducedMotion(false));
  afterEach(() => {
    setReducedMotion(false);
    cleanup();
  });

  it("preserves native button semantics", () => {
    render(<Pressable>Open project</Pressable>);
    expect(screen.getByRole("button", { name: "Open project" })).toBeEnabled();
  });

  it("clears tilt variables when the pointer leaves", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerMove(button, { clientX: 20, clientY: 20 });
    fireEvent.pointerLeave(button);

    expect(tiltOf(button)).toEqual(CLEARED);
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

    const { x: rotateX, y: rotateY } = tiltOf(button);

    expect(rotateX).toMatch(/^\d+(\.\d+)?deg$/);
    expect(rotateY).toMatch(/^\d+(\.\d+)?deg$/);
    expect(Number.parseFloat(rotateX)).toBeGreaterThan(0);
    expect(Number.parseFloat(rotateY)).toBeGreaterThan(0);

    fireEvent.pointerLeave(button);
    expect(tiltOf(button)).toEqual(CLEARED);
  });

  it("writes nothing at all when the surface measures zero", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 0, height: 0 });

    fireEvent.pointerMove(button, { clientX: 75, clientY: 12.5 });

    // Without the guard this reads "-Infinitydeg": a non-empty, invalid value.
    expect(tiltOf(button)).toEqual(CLEARED);
  });

  /*
   * ---------------------------------------------------------------------------
   * Touch parity
   * ---------------------------------------------------------------------------
   *
   * A finger presses a tile at a point, and that point is the tilt. What touch
   * does NOT have is a hover phase, so a moving touch pointer -- which is a
   * scroll in progress, not a press -- still writes nothing.
   */
  it("tilts from the press point on a touch pointer", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerDown(button, {
      clientX: 75,
      clientY: 12.5,
      pointerType: "touch",
    });

    const { x: rotateX, y: rotateY } = tiltOf(button);
    expect(Number.parseFloat(rotateX)).toBeGreaterThan(0);
    expect(Number.parseFloat(rotateY)).toBeGreaterThan(0);
  });

  it("leaves a dragging touch pointer alone so a scroll is never a tilt", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerMove(button, {
      clientX: 75,
      clientY: 12.5,
      pointerType: "touch",
    });

    expect(tiltOf(button)).toEqual(CLEARED);
  });

  it("tilts from the press point on a mouse pointer too", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerDown(button, {
      clientX: 25,
      clientY: 37.5,
      pointerType: "mouse",
    });

    // Lower-left quadrant, so both axes invert against the upper-right case.
    const { x: rotateX, y: rotateY } = tiltOf(button);
    expect(Number.parseFloat(rotateX)).toBeLessThan(0);
    expect(Number.parseFloat(rotateY)).toBeLessThan(0);
  });

  it.each(["pointerUp", "pointerCancel", "pointerLeave"] as const)(
    "releases the tilt on %s",
    (release) => {
      render(<Pressable>Open project</Pressable>);
      const button = screen.getByRole("button");
      stubBox(button, { width: 100, height: 50 });

      fireEvent.pointerDown(button, {
        clientX: 75,
        clientY: 12.5,
        pointerType: "touch",
      });
      expect(tiltOf(button).x).toMatch(/deg$/);

      fireEvent[release](button);
      expect(tiltOf(button)).toEqual(CLEARED);
    },
  );

  /*
   * The rectangle is measured when a press or a hover begins and reused for
   * every move inside it: `getBoundingClientRect` forces layout, and a tilt
   * that costs a reflow per mouse move is a tilt that drops frames.
   */
  it("measures the surface once per hover rather than once per move", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    const measure = stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerEnter(button, { clientX: 10, clientY: 10 });
    measure.mockClear();

    fireEvent.pointerMove(button, { clientX: 75, clientY: 12.5 });
    fireEvent.pointerMove(button, { clientX: 60, clientY: 20 });
    fireEvent.pointerMove(button, { clientX: 30, clientY: 40 });

    expect(measure).not.toHaveBeenCalled();
    expect(tiltOf(button).x).toMatch(/deg$/);
  });

  it("measures again for the next press after a release dropped the cache", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    const measure = stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerEnter(button, { clientX: 10, clientY: 10 });
    fireEvent.pointerLeave(button);
    measure.mockClear();

    fireEvent.pointerMove(button, { clientX: 75, clientY: 12.5 });

    expect(measure).toHaveBeenCalledOnce();
    expect(tiltOf(button).x).toMatch(/deg$/);
  });

  /*
   * The other half of the cache's contract, and the reason a press measures
   * instead of reading it: a pointer that never left keeps its entry, and the
   * page can scroll out from under it. The box is what the tilt is a fraction
   * of, so a stale one does not merely shift the lean -- it inverts it.
   */
  it("measures again on a press, never against a box the page scrolled away", () => {
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerEnter(button, { clientX: 50, clientY: 25 });
    // 200px of scroll under the hovering pointer: the same surface, 200px
    // further down the viewport than the hover measured it.
    stubBox(button, { width: 100, height: 50, top: 200 });

    fireEvent.pointerDown(button, {
      clientX: 75,
      clientY: 212.5,
      pointerType: "mouse",
    });

    // Upper-right of the tile where it actually sits, so both axes read +1deg.
    // Against the cached box the press is 3.75 box-heights below centre and
    // this reads -15deg.
    const { x: rotateX, y: rotateY } = tiltOf(button);
    expect(Number.parseFloat(rotateX)).toBeCloseTo(1, 5);
    expect(Number.parseFloat(rotateY)).toBeCloseTo(1, 5);
  });

  /*
   * ---------------------------------------------------------------------------
   * The helpers gate the style writes, never the consumer's own callbacks
   * ---------------------------------------------------------------------------
   *
   * A live tile pauses its cycle from `onPointerEnter` / `onPointerLeave` and a
   * consumer may track movement for reasons that have nothing to do with tilt.
   * Both opt-outs below stop the tilt from being *written*; neither is allowed
   * to swallow an event the consumer asked for.
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
    expect(tiltOf(button)).toEqual(CLEARED);
  });

  it("still forwards a touch press even though tilt is written for it", () => {
    const onPointerDown = vi.fn();
    render(<Pressable onPointerDown={onPointerDown}>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerDown(button, {
      clientX: 75,
      clientY: 12.5,
      pointerType: "touch",
    });

    expect(onPointerDown).toHaveBeenCalledOnce();
  });

  it("still forwards every pointer callback when reduced motion disables tilt", () => {
    setReducedMotion(true);
    const calls = {
      onPointerCancel: vi.fn(),
      onPointerDown: vi.fn(),
      onPointerEnter: vi.fn(),
      onPointerLeave: vi.fn(),
      onPointerMove: vi.fn(),
      onPointerUp: vi.fn(),
    };
    render(<Pressable {...calls}>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerEnter(button, { clientX: 20, clientY: 20 });
    fireEvent.pointerDown(button, { clientX: 20, clientY: 20 });
    fireEvent.pointerMove(button, { clientX: 30, clientY: 20 });
    fireEvent.pointerUp(button, { clientX: 30, clientY: 20 });
    fireEvent.pointerCancel(button);
    fireEvent.pointerLeave(button);

    for (const [name, spy] of Object.entries(calls)) {
      expect(spy, name).toHaveBeenCalledOnce();
    }
    expect(tiltOf(button)).toEqual(CLEARED);
  });

  it("writes no tilt at all under reduced motion, on either pointer type", () => {
    setReducedMotion(true);
    render(<Pressable>Open project</Pressable>);
    const button = screen.getByRole("button");
    stubBox(button, { width: 100, height: 50 });

    fireEvent.pointerDown(button, {
      clientX: 75,
      clientY: 12.5,
      pointerType: "touch",
    });
    expect(tiltOf(button)).toEqual(CLEARED);

    fireEvent.pointerMove(button, {
      clientX: 75,
      clientY: 12.5,
      pointerType: "mouse",
    });
    expect(tiltOf(button)).toEqual(CLEARED);
  });
});
