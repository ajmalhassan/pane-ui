import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { usePanoramaMotion } from "@/components/metro/usePanoramaMotion";
import { PIVOT_IDS, type PivotId } from "@/lib/content/pivots";

let frames: Map<number, FrameRequestCallback>;
let now: number;
let nextFrame: number;
let changeMotion: () => void;
let reduced: boolean;
function tick(time: number) {
  now = time;
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(time));
  });
}
function Harness({
  active = "me",
  commit = () => {},
}: {
  active?: PivotId;
  commit?: (id: PivotId) => void;
}) {
  const motion = usePanoramaMotion({ active, onGestureCommit: commit });
  return (
    <main ref={motion.shellRef}>
      <span ref={motion.headingTrackRef}>
        {PIVOT_IDS.map((id) => (
          <a key={id} data-heading-pivot={id}>
            {id}
          </a>
        ))}
      </span>
      <div
        data-testid="surface"
        data-motion-ready={motion.ready}
        ref={motion.surfaceRef}
        data-motion-state={motion.phase}
        {...motion.handlers}
      >
        {PIVOT_IDS.map((id) => (
          <section
            key={id}
            data-pivot={id}
            data-painted={motion.visualPivots.includes(id)}
          >
            {id}
          </section>
        ))}
        <a href="#tile" data-tile-role="project">
          Tile
        </a>
        <input aria-label="Editable" />
      </div>
      <button onClick={() => motion.select("projects")}>Projects</button>
      <button onClick={() => motion.select("photography")}>Photography</button>
    </main>
  );
}
function surface() {
  return screen.getByTestId("surface");
}
function pointer(
  type: string,
  x: number,
  y = 0,
  target: Element = surface(),
  extra = {},
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    isPrimary: { value: true },
    pointerType: { value: "touch" },
    ...Object.fromEntries(
      Object.entries(extra).map(([key, value]) => [key, { value }]),
    ),
  });
  fireEvent(target, event);
}
function position() {
  return Number(surface().style.getPropertyValue("--panorama-position"));
}

beforeEach(() => {
  now = 0;
  nextFrame = 0;
  frames = new Map();
  reduced = false;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const width = this.hasAttribute("data-heading-pivot") ? 100 : 400;
      const height = this.dataset.pivot === "projects" ? 700 : 300;
      return {
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
    },
  );
  vi.mocked(window.matchMedia).mockImplementation(
    (media) =>
      ({
        media,
        get matches() {
          return reduced;
        },
        addEventListener: (_type: string, callback: () => void) => {
          changeMotion = callback;
        },
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("interrupts settling from the displayed position and rejects an old completion", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Projects" }));
  expect(surface()).toHaveAttribute("data-motion-state", "settling");
  tick(100);
  const displayed = position();
  expect(displayed).toBeGreaterThan(0);
  expect(displayed).toBeLessThan(1);
  const obsolete = [...frames.values()][0];
  fireEvent.click(screen.getByRole("button", { name: "Photography" }));
  expect(position()).toBe(displayed);
  act(() => obsolete(1000));
  expect(surface()).toHaveAttribute("data-motion-state", "settling");
  tick(520);
  expect(position()).toBe(3);
  expect(surface()).toHaveAttribute("data-motion-state", "idle");
});

it.each(["pointercancel", "lostpointercapture"])(
  "settles cancellation via %s without a route commit or trailing tile activation",
  (type) => {
    const commit = vi.fn();
    render(<Harness commit={commit} />);
    const tile = screen.getByText("Tile");
    const click = vi.fn();
    tile.addEventListener("click", click);
    pointer("pointerdown", 300, 0, tile);
    pointer("pointermove", 180);
    tick(20);
    expect(position()).toBeCloseTo(0.3);
    pointer(type, 180);
    fireEvent.click(tile, { detail: 1 });
    expect(click).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    tick(440);
    expect(position()).toBe(0);
    expect(surface()).toHaveAttribute("data-motion-state", "idle");
    fireEvent.click(tile, { detail: 1 });
    expect(click).toHaveBeenCalledOnce();
  },
);

it("commits one adjacent section after accepted drag and keeps vertical intent native", () => {
  const commit = vi.fn();
  render(<Harness active="projects" commit={commit} />);
  pointer("pointerdown", 300);
  pointer("pointermove", 290, 50);
  pointer("pointermove", 100, 50);
  pointer("pointerup", 100, 50);
  expect(commit).not.toHaveBeenCalled();
  expect(surface()).toHaveAttribute("data-motion-state", "idle");
  pointer("pointerdown", 300);
  pointer("pointermove", 100);
  tick(30);
  pointer("pointerup", 100);
  expect(commit).toHaveBeenCalledExactlyOnceWith("blog");
  tick(450);
  expect(position()).toBe(2);
});

it("ignores editable elements and nonprimary pointers", () => {
  const commit = vi.fn();
  render(<Harness commit={commit} />);
  pointer("pointerdown", 300, 0, screen.getByLabelText("Editable"));
  pointer("pointermove", 100);
  pointer("pointerup", 100);
  pointer("pointerdown", 300, 0, surface(), { isPrimary: false });
  pointer("pointermove", 100);
  pointer("pointerup", 100);
  expect(commit).not.toHaveBeenCalled();
  expect(frames.size).toBe(0);
});

it("removes motion immediately when reduced motion is enabled during a settle", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Projects" }));
  tick(100);
  act(() => {
    reduced = true;
    changeMotion();
  });
  expect(position()).toBe(1);
  expect(surface()).toHaveAttribute("data-motion-state", "idle");
  expect(frames.size).toBe(0);
});

it("settles resize and releases pending frames on unmount", () => {
  const { unmount } = render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Projects" }));
  tick(100);
  fireEvent(window, new Event("resize"));
  expect(position()).toBe(1);
  expect(surface()).toHaveAttribute("data-motion-state", "idle");
  fireEvent.click(screen.getByRole("button", { name: "Photography" }));
  expect(frames.size).toBe(1);
  unmount();
  expect(frames.size).toBe(0);
});

it("settles external active changes and keeps participating panels painted until complete", () => {
  const { rerender } = render(<Harness />);
  rerender(<Harness active="photography" />);
  expect(surface()).toHaveAttribute("data-motion-state", "settling");
  expect(surface().querySelectorAll('[data-painted="true"]')).toHaveLength(4);
  tick(420);
  expect(position()).toBe(3);
  expect(surface().querySelectorAll('[data-painted="true"]')).toHaveLength(1);
});

it("clears tile tilt on captured cancellation and leaves keyboard activation available", () => {
  render(<Harness />);
  const tile = screen.getByText("Tile");
  tile.style.setProperty("--press-rotate-x", "3deg");
  tile.style.setProperty("--press-rotate-y", "2deg");
  pointer("pointerdown", 300, 0, tile);
  pointer("pointermove", 200);
  tick(20);
  pointer("pointercancel", 200);
  expect(tile.style.getPropertyValue("--press-rotate-x")).toBe("");
  expect(tile.style.getPropertyValue("--press-rotate-y")).toBe("");
  const activation = vi.fn();
  tile.addEventListener("click", activation);
  fireEvent.click(tile, { detail: 0 });
  expect(activation).toHaveBeenCalledOnce();
  fireEvent.click(tile, { detail: 1 });
  expect(activation).toHaveBeenCalledOnce();
});

it("holds participating content height while moving and releases it when settled", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Projects" }));
  expect(surface().style.minHeight).toBe("700px");
  tick(420);
  expect(surface().style.minHeight).toBe("");
});

it("releases text selection only after horizontal intent and prevents native drag ghosts", () => {
  render(<Harness />);
  const tile = screen.getByText("Tile");
  const selection = window.getSelection()!;
  const range = document.createRange();
  range.selectNodeContents(tile);
  selection.addRange(range);
  pointer("pointerdown", 300, 0, tile);
  pointer("pointermove", 298, 30);
  expect(selection.rangeCount).toBe(1);
  pointer("pointerup", 298, 30);
  pointer("pointerdown", 300, 0, tile);
  pointer("pointermove", 200);
  expect(selection.rangeCount).toBe(0);
  const drag = new Event("dragstart", { bubbles: true, cancelable: true });
  fireEvent(tile, drag);
  expect(drag.defaultPrevented).toBe(true);
});

it("marks mounted handlers ready and forgets an unaccepted pointer that leaves", () => {
  const commit = vi.fn();
  render(<Harness commit={commit} />);
  expect(surface()).toHaveAttribute("data-motion-ready", "true");
  pointer("pointerdown", 300);
  pointer("pointerout", 300);
  pointer("pointermove", 100);
  pointer("pointerup", 100);
  expect(commit).not.toHaveBeenCalled();
  expect(surface()).toHaveAttribute("data-motion-state", "idle");
});

it("keeps swipe navigation available with reduced motion without scheduling spatial frames", () => {
  const commit = vi.fn();
  render(<Harness commit={commit} />);
  act(() => {
    reduced = true;
    changeMotion();
  });
  pointer("pointerdown", 300);
  pointer("pointermove", 180);
  expect(frames.size).toBe(0);
  expect(surface().querySelectorAll('[data-painted="true"]')).toHaveLength(1);
  pointer("pointerup", 180);
  expect(commit).toHaveBeenCalledExactlyOnceWith("projects");
  expect(surface()).toHaveAttribute("data-motion-state", "idle");
  expect(frames.size).toBe(0);
});

it("does not let a second pointer remove suppression of an accepted drag", () => {
  render(<Harness />);
  const tile = screen.getByText("Tile");
  const activation = vi.fn();
  tile.addEventListener("click", activation);
  pointer("pointerdown", 300, 0, tile);
  pointer("pointermove", 200);
  pointer("pointerdown", 300, 0, tile, { isPrimary: false, pointerId: 2 });
  pointer("pointercancel", 200);
  fireEvent.click(tile, { detail: 1 });
  expect(activation).not.toHaveBeenCalled();
});
