import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Panorama } from "../../packages/react/src/Panorama";
const items = [
  {
    id: "a / special",
    label: "People",
    children: <a href="#friend">Friend</a>,
  },
  {
    id: "b",
    label: "Photos",
    children: <input aria-label="Caption" defaultValue="Keep" />,
  },
  { id: "c", label: "Music", children: "Songs" },
];
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 400,
    height: 200,
    x: 0,
    y: 0,
    left: 0,
    right: 400,
    top: 0,
    bottom: 200,
    toJSON() {},
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("links unique tabs to one semantic panel and retains child state", () => {
  const ref = createRef<HTMLDivElement>();
  render(<Panorama ref={ref} aria-label="Library" items={items} />);
  expect(ref.current).toHaveClass("wp-panorama");
  expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  fireEvent.click(screen.getByRole("tab", { name: "Photos" }));
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Changed" },
  });
  fireEvent.click(screen.getByRole("tab", { name: "People" }));
  fireEvent.click(screen.getByRole("tab", { name: "Photos" }));
  expect(screen.getByRole("textbox")).toHaveValue("Changed");
  expect(screen.getByRole("tabpanel")).toHaveAttribute(
    "id",
    screen.getByRole("tab", { name: "Photos" }).getAttribute("aria-controls"),
  );
});
it("keyboard wraps with RTL and controlled owners may reject", () => {
  const change = vi.fn();
  const { rerender } = render(
    <Panorama items={items} value="b" onValueChange={change} dir="rtl" />,
  );
  fireEvent.keyDown(screen.getByRole("tab", { name: "Photos" }), {
    key: "ArrowRight",
  });
  expect(change).toHaveBeenCalledWith("a / special");
  expect(screen.getByRole("tab", { name: "Photos" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  rerender(<Panorama items={items} dir="rtl" />);
  fireEvent.keyDown(screen.getByRole("tab", { name: "People" }), {
    key: "End",
  });
  expect(screen.getByRole("tab", { name: "Music" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
it("handles empty and removed selections and SSR", () => {
  const { rerender } = render(<Panorama items={items} defaultValue="b" />);
  rerender(<Panorama items={[items[2]]} />);
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Songs");
  rerender(<Panorama items={[]} />);
  expect(screen.queryByRole("tabpanel")).toBeNull();
  expect(renderToString(<Panorama items={items} />)).toContain("Friend");
});
function drag(root: HTMLElement, end: number, cancel = false) {
  fireEvent.pointerDown(root, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: 300,
    clientY: 30,
  });
  fireEvent.pointerMove(root, { pointerId: 1, clientX: end, clientY: 32 });
  fireEvent[cancel ? "pointerCancel" : "pointerUp"](root, {
    pointerId: 1,
    clientX: end,
    clientY: 32,
  });
}
it("commits horizontal swipes, cancels safely, and settles owner rejection", () => {
  const change = vi.fn();
  const { container, rerender } = render(
    <Panorama items={items} value={items[0].id} onValueChange={change} />,
  );
  const root = container.firstElementChild as HTMLElement;
  drag(root, 100);
  expect(change).toHaveBeenCalledWith("b");
  act(() => vi.advanceTimersByTime(500));
  expect(root).toHaveAttribute("data-motion-state", "idle");
  expect(root.style.getPropertyValue("--wp-panorama-position")).toBe("0");
  rerender(<Panorama items={items} />);
  drag(root, 100, true);
  expect(screen.getByRole("tab", { name: "People" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  drag(root, 100);
  expect(screen.getByRole("tab", { name: "Photos" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
it("preserves vertical gestures and cancellable consumer events", () => {
  const { container } = render(
    <Panorama items={items} onPointerMove={(e) => e.preventDefault()} />,
  );
  const root = container.firstElementChild as HTMLElement;
  drag(root, 100);
  expect(screen.getByRole("tab", { name: "People" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

it("server renders a non-first default at its visible position", () => {
  expect(renderToString(<Panorama items={items} defaultValue="b" />)).toContain(
    "--wp-panorama-position:1",
  );
});
it("continues from the painted position when interrupted and settles on resize", () => {
  const { container } = render(<Panorama items={items} />);
  const root = container.firstElementChild as HTMLElement;
  fireEvent.click(screen.getByRole("tab", { name: "Photos" }));
  act(() => vi.advanceTimersByTime(100));
  const pos = Number(root.style.getPropertyValue("--wp-panorama-position"));
  expect(pos).toBeGreaterThan(0);
  expect(pos).toBeLessThan(1);
  fireEvent.click(screen.getByRole("tab", { name: "Music" }));
  expect(Number(root.style.getPropertyValue("--wp-panorama-position"))).toBe(
    pos,
  );
  fireEvent(window, new Event("resize"));
  expect(root).toHaveAttribute("data-motion-state", "idle");
  expect(root.style.getPropertyValue("--wp-panorama-position")).toBe("2");
});

it("calls native handlers once with the root and honors cancellation", () => {
  const click = vi.fn((event) => event.preventDefault());
  const key = vi.fn((event) => event.preventDefault());
  const { container } = render(
    <Panorama items={items} onClick={click} onKeyDown={key} />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Photos" }));
  fireEvent.keyDown(screen.getByRole("tab", { name: "People" }), {
    key: "ArrowRight",
  });
  expect(click).toHaveBeenCalledTimes(1);
  expect(key).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("tab", { name: "People" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(container.firstElementChild).toHaveAttribute(
    "data-motion-state",
    "idle",
  );
});
it("keeps vertical scroll intent uncaptured and captures horizontal intent only after threshold", () => {
  const { container } = render(<Panorama items={items} />);
  const root = container.firstElementChild as HTMLElement;
  const capture = vi.fn();
  root.setPointerCapture = capture;
  fireEvent.pointerDown(root, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: 100,
    clientY: 100,
  });
  fireEvent.pointerMove(root, { pointerId: 1, clientX: 98, clientY: 104 });
  expect(capture).not.toHaveBeenCalled();
  fireEvent.pointerMove(root, { pointerId: 1, clientX: 90, clientY: 180 });
  expect(capture).not.toHaveBeenCalled();
  fireEvent.pointerUp(root, { pointerId: 1, clientX: 90, clientY: 180 });
  expect(screen.getByRole("tab", { name: "People" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  fireEvent.pointerDown(root, {
    pointerId: 2,
    isPrimary: true,
    button: 0,
    clientX: 200,
    clientY: 100,
  });
  fireEvent.pointerMove(root, { pointerId: 2, clientX: 195, clientY: 100 });
  expect(capture).not.toHaveBeenCalled();
  fireEvent.pointerMove(root, { pointerId: 2, clientX: 180, clientY: 100 });
  expect(capture).toHaveBeenCalledWith(2);
});

it.each(["cancel", "resize", "lost capture"])(
  "a new heading click works after drag %s",
  (ending) => {
    const { container } = render(<Panorama items={items} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.pointerDown(root, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 300,
      clientY: 30,
    });
    fireEvent.pointerMove(root, { pointerId: 1, clientX: 100, clientY: 32 });
    if (ending === "resize") fireEvent(window, new Event("resize"));
    else if (ending === "lost capture")
      fireEvent.lostPointerCapture(root, {
        pointerId: 1,
        clientX: 100,
        clientY: 32,
      });
    else
      fireEvent.pointerCancel(root, {
        pointerId: 1,
        clientX: 100,
        clientY: 32,
      });
    const heading = screen.getByRole("tab", { name: "Photos" });
    // Suppress a trailing click from the old gesture, but never this new press.
    fireEvent.click(heading, { detail: 1 });
    expect(heading).toHaveAttribute("aria-selected", "false");
    fireEvent.pointerDown(heading, {
      pointerId: 2,
      isPrimary: true,
      button: 0,
      clientX: 150,
      clientY: 10,
    });
    fireEvent.pointerUp(heading, { pointerId: 2, clientX: 150, clientY: 10 });
    fireEvent.click(heading, { detail: 1 });
    expect(heading).toHaveAttribute("aria-selected", "true");
  },
);
it("a new heading press clears stale suppression without a trailing gesture click", () => {
  const { container } = render(<Panorama items={items} />);
  const root = container.firstElementChild as HTMLElement;
  drag(root, 100, true);
  const heading = screen.getByRole("tab", { name: "Photos" });
  fireEvent.pointerDown(heading, {
    pointerId: 2,
    isPrimary: true,
    button: 0,
    clientX: 150,
    clientY: 10,
  });
  fireEvent.pointerUp(heading, { pointerId: 2, clientX: 150, clientY: 10 });
  fireEvent.click(heading, { detail: 1 });
  expect(heading).toHaveAttribute("aria-selected", "true");
});

it.each(["altKey", "ctrlKey", "metaKey"])(
  "preserves browser navigation with %s",
  (modifier) => {
    render(<Panorama items={items} />);
    const tab = screen.getByRole("tab", { name: "People" });
    for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
      const event = new KeyboardEvent("keydown", {
        key,
        [modifier]: true,
        bubbles: true,
        cancelable: true,
      });
      fireEvent(tab, event);
      expect(event.defaultPrevented).toBe(false);
      expect(tab).toHaveAttribute("aria-selected", "true");
    }
  },
);
