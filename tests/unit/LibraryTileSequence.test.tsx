import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { TileSequence } from "../../packages/react/src/TileSequence.js";

type Run = {
  element: Element;
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
  cancel: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  finish(): void;
  reject(): void;
};
let runs: Run[];
let reduced: boolean;
let listeners: Set<() => void>;
const items = ["a", "b", "c"].map((id) => ({
  id,
  content: <button>{id}</button>,
}));
beforeEach(() => {
  runs = [];
  reduced = false;
  listeners = new Set();
  vi.spyOn(window, "matchMedia").mockImplementation(
    () =>
      ({
        get matches() {
          return reduced;
        },
        addEventListener: (_: string, fn: () => void) => listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) =>
          listeners.delete(fn),
      }) as unknown as MediaQueryList,
  );
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value: vi.fn(function (this: Element, frames, options) {
      let finish!: () => void;
      let reject!: () => void;
      const finished = new Promise<void>((res, rej) => {
        finish = res;
        reject = rej;
      });
      const cancel = vi.fn();
      const pause = vi.fn();
      const play = vi.fn();
      runs.push({
        element: this,
        frames,
        options,
        finish,
        reject,
        cancel,
        pause,
        play,
      });
      return { finished, cancel, pause, play };
    }),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  delete (Element.prototype as Partial<Element>).animate;
});
it("renders initial and server content readably without callbacks", () => {
  const callback = vi.fn();
  const ref = createRef<HTMLDivElement>();
  render(
    <StrictMode>
      <TileSequence
        mode="individual"
        show
        items={items}
        ref={ref}
        id="tiles"
        className="custom"
        onEntered={callback}
      />
    </StrictMode>,
  );
  expect(screen.getAllByRole("button")).toHaveLength(3);
  expect(runs).toHaveLength(0);
  expect(callback).not.toHaveBeenCalled();
  expect(ref.current).toHaveClass("wp-tile-grid", "wp-tile-sequence", "custom");
  expect(ref.current).toHaveAttribute("id", "tiles");
  expect(
    renderToString(<TileSequence mode="individual" show items={items} />),
  ).toContain("<button>a</button>");
  expect(
    renderToString(
      <TileSequence mode="individual" show={false} items={items} />,
    ),
  ).not.toContain("<button>");
});
it("exits selected last, caps delay, and calls back only after terminal DOM commit", async () => {
  const ref = createRef<HTMLDivElement>();
  const exited = vi.fn(() => {
    expect(ref.current).toHaveAttribute("hidden");
    expect(screen.queryByText("a")).toBeNull();
  });
  const view = render(
    <TileSequence mode="individual" show items={items} ref={ref} />,
  );
  view.rerender(
    <TileSequence
      mode="individual"
      show={false}
      items={items}
      selectedId="a"
      interval={200}
      ref={ref}
      onExited={exited}
    />,
  );
  expect(ref.current).toHaveAttribute("inert");
  expect(ref.current).toHaveAttribute("aria-hidden", "true");
  expect(
    runs.map((run) => [run.element.textContent, run.options.delay]),
  ).toEqual([
    ["b", 0],
    ["c", 120],
    ["a", 240],
  ]);
  await act(async () => {
    runs[0].finish();
    runs[1].finish();
  });
  expect(exited).not.toHaveBeenCalled();
  await act(async () => runs[2].finish());
  expect(exited).toHaveBeenCalledTimes(1);
});
it("reverses from sampled wrappers and ignores stale callbacks", async () => {
  const exited = vi.fn();
  const entered = vi.fn();
  const view = render(<TileSequence mode="individual" show items={items} />);
  view.rerender(
    <TileSequence
      mode="individual"
      show={false}
      items={items}
      onExited={exited}
    />,
  );
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    opacity: "0.4",
    transform: "matrix(1, 0, 0, 1, 12, 0)",
    transformOrigin: "0px 100px",
  } as CSSStyleDeclaration);
  view.rerender(
    <TileSequence
      mode="individual"
      show
      items={items}
      direction="backward"
      onEntered={entered}
    />,
  );
  expect(runs[3].frames[0]).toMatchObject({
    opacity: "0.4",
    transform: "matrix(1, 0, 0, 1, 12, 0)",
    transformOrigin: "0px 100px",
  });
  expect(runs[3].options.delay).toBe(0);
  await act(async () => runs.slice(0, 3).forEach((run) => run.finish()));
  expect(exited).not.toHaveBeenCalled();
  expect(entered).not.toHaveBeenCalled();
  await act(async () => runs.slice(3).forEach((run) => run.finish()));
  expect(entered).toHaveBeenCalledTimes(1);
});
it("settles dynamic empty lists and cancels removed item runs", async () => {
  const exited = vi.fn();
  const view = render(<TileSequence mode="individual" show items={items} />);
  view.rerender(
    <TileSequence
      mode="individual"
      show={false}
      items={items}
      onExited={exited}
    />,
  );
  view.rerender(
    <TileSequence
      mode="individual"
      show={false}
      items={[]}
      onExited={exited}
    />,
  );
  expect(exited).toHaveBeenCalledTimes(1);
  expect(runs.every((run) => run.cancel.mock.calls.length)).toBe(true);
  await act(async () => runs.forEach((run) => run.finish()));
  expect(exited).toHaveBeenCalledTimes(1);
});
it("settles reduced motion changes and cleans subscriptions on unmount", async () => {
  const exited = vi.fn();
  const view = render(<TileSequence mode="individual" show items={items} />);
  view.rerender(
    <TileSequence
      mode="individual"
      show={false}
      items={items}
      onExited={exited}
    />,
  );
  act(() => {
    reduced = true;
    listeners.forEach((fn) => fn());
  });
  expect(exited).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("a")).toBeNull();
  expect(listeners.size).toBe(0);
  await act(async () => runs.forEach((run) => run.finish()));
  expect(exited).toHaveBeenCalledTimes(1);
  view.unmount();
});
it("settles rejected animations and uses latest callbacks without restarting for content", async () => {
  const oldCallback = vi.fn();
  const newCallback = vi.fn();
  const view = render(
    <TileSequence mode="individual" show={false} items={items} />,
  );
  view.rerender(
    <TileSequence
      mode="individual"
      show
      items={items}
      onEntered={oldCallback}
    />,
  );
  view.rerender(
    <TileSequence
      mode="individual"
      show
      items={items.map((item) => ({ ...item }))}
      onEntered={newCallback}
    />,
  );
  expect(runs).toHaveLength(3);
  await act(async () => runs.forEach((run) => run.reject()));
  expect(newCallback).toHaveBeenCalledTimes(1);
  expect(oldCallback).not.toHaveBeenCalled();
});
it("preserves keyed children and puts sizing on transform wrappers", () => {
  const view = render(
    <TileSequence
      mode="individual"
      show
      items={[
        {
          id: "a",
          size: "wide",
          content: <input aria-label="entry" defaultValue="value" />,
        },
      ]}
    />,
  );
  const input = screen.getByRole("textbox");
  expect(input.parentElement).toHaveAttribute("data-size", "wide");
  view.rerender(
    <TileSequence
      mode="individual"
      show
      items={[
        { id: "b", content: "new" },
        {
          id: "a",
          size: "large",
          content: <input aria-label="entry" defaultValue="value" />,
        },
      ]}
    />,
  );
  expect(screen.getByRole("textbox")).toBe(input);
  expect(input.parentElement).toHaveAttribute("data-size", "large");
});

it("cancels on unmount and never delivers a stale completion", async () => {
  const exited = vi.fn();
  const view = render(<TileSequence mode="individual" show items={items} />);
  view.rerender(
    <TileSequence
      mode="individual"
      show={false}
      items={items}
      onExited={exited}
    />,
  );
  view.unmount();
  expect(listeners.size).toBe(0);
  expect(runs.every((run) => run.cancel.mock.calls.length > 0)).toBe(true);
  await act(async () => runs.forEach((run) => run.finish()));
  expect(exited).not.toHaveBeenCalled();
});

it.each(["reduced", "zero", "missing", "throw"])(
  "settles without motion for %s",
  (mode) => {
    const entered = vi.fn();
    const view = render(
      <TileSequence mode="individual" show={false} items={items} />,
    );
    if (mode === "reduced") reduced = true;
    if (mode === "missing")
      delete (Element.prototype as Partial<Element>).animate;
    if (mode === "throw")
      vi.mocked(Element.prototype.animate).mockImplementation(() => {
        throw new Error("Unsupported");
      });
    view.rerender(
      <TileSequence
        mode="individual"
        show
        items={items}
        duration={mode === "zero" ? 0 : 260}
        onEntered={entered}
      />,
    );
    expect(entered).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(runs).toHaveLength(0);
  },
);

it("restarts structural changes from surviving frames and waits for new items", async () => {
  const exited = vi.fn();
  const view = render(<TileSequence mode="individual" show items={items} />);
  view.rerender(
    <TileSequence
      mode="individual"
      show={false}
      items={items}
      selectedId="missing"
      onExited={exited}
    />,
  );
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    opacity: "0.7",
    transform: "matrix(1, 0, 0, 1, 3, 0)",
  } as CSSStyleDeclaration);
  view.rerender(
    <TileSequence
      mode="individual"
      show={false}
      items={[items[1], { id: "d", content: <button>d</button> }]}
      selectedId="missing"
      onExited={exited}
    />,
  );
  expect(runs).toHaveLength(5);
  expect(runs[3].frames[0].opacity).toBe("0.7");
  await act(async () => runs.slice(0, 4).forEach((run) => run.finish()));
  expect(exited).not.toHaveBeenCalled();
  await act(async () => runs[4].finish());
  expect(exited).toHaveBeenCalledTimes(1);
});

it("keeps the selected tile strictly last even when the stagger reaches its cap", () => {
  const many = Array.from({ length: 12 }, (_, index) => ({
    id: String(index),
    content: String(index),
  }));
  const view = render(<TileSequence mode="individual" show items={many} />);
  view.rerender(
    <TileSequence
      mode="individual"
      show={false}
      items={many}
      selectedId="0"
      interval={40}
    />,
  );
  const selected = runs.find((run) => run.element.textContent === "0")!;
  const others = runs.filter((run) => run !== selected);
  expect(selected.options.delay).toBeLessThanOrEqual(240);
  expect(
    others.every(
      (run) => Number(run.options.delay) < Number(selected.options.delay),
    ),
  ).toBe(true);
});

it("turns the entire grid as one surface in group mode on exit and return", async () => {
  const ref = createRef<HTMLDivElement>();
  const exited = vi.fn();
  const entered = vi.fn();
  const view = render(
    <TileSequence mode="group" show items={items} ref={ref} />,
  );
  view.rerender(
    <TileSequence
      mode="group"
      show={false}
      items={items}
      ref={ref}
      onExited={exited}
    />,
  );
  expect(runs).toHaveLength(1);
  expect(runs[0].element).toBe(ref.current);
  expect(runs[0].options.delay).toBe(0);
  await act(async () => runs[0].finish());
  expect(exited).toHaveBeenCalledTimes(1);
  view.rerender(
    <TileSequence
      mode="group"
      show
      items={items}
      ref={ref}
      direction="backward"
      onEntered={entered}
    />,
  );
  expect(runs).toHaveLength(2);
  expect(runs[1].element).toBe(ref.current);
  await act(async () => runs[1].finish());
  expect(entered).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole("button")).toHaveLength(3);
});

it("reverses a group from its displayed frame and settles reduced motion", async () => {
  const exited = vi.fn();
  const entered = vi.fn();
  const view = render(<TileSequence mode="group" show items={items} />);
  view.rerender(
    <TileSequence mode="group" show={false} items={items} onExited={exited} />,
  );
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    opacity: "0.4",
    transform: "matrix(1, 0, 0, 1, 12, 0)",
    transformOrigin: "0px 100px",
  } as CSSStyleDeclaration);
  view.rerender(
    <TileSequence
      mode="group"
      show
      items={items}
      direction="backward"
      onEntered={entered}
    />,
  );
  expect(runs).toHaveLength(2);
  expect(runs[1].frames[0]).toMatchObject({
    opacity: "0.4",
    transformOrigin: "0px 100px",
  });
  await act(async () => runs[0].finish());
  expect(exited).not.toHaveBeenCalled();
  act(() => {
    reduced = true;
    listeners.forEach((fn) => fn());
  });
  expect(entered).toHaveBeenCalledTimes(1);
});

it("turns a reverse-order wave around one measured camera without moving the root", async () => {
  const ref = createRef<HTMLDivElement>();
  const exited = vi.fn();
  const view = render(<TileSequence show items={items} ref={ref} />);
  view.rerender(
    <TileSequence
      show={false}
      items={items}
      ref={ref}
      duration={220}
      interval={35}
      onExited={exited}
    />,
  );
  expect(runs).toHaveLength(3);
  expect(runs.some((run) => run.element === ref.current)).toBe(false);
  const tiles = runs;
  expect(
    tiles.map((run) => [run.element.textContent, run.options.delay]),
  ).toEqual([
    ["c", 0],
    ["b", 35],
    ["a", 70],
  ]);
  expect(tiles[0].frames.at(-1)!.transform).toContain("rotateY(-88deg)");
  await act(async () => tiles[0].finish());
  expect(exited).not.toHaveBeenCalled();
  await act(async () => tiles.forEach((run) => run.finish()));
  expect(exited).toHaveBeenCalledTimes(1);
});

it("reverses the shared-camera wave from displayed frames with no stale completion", async () => {
  const exited = vi.fn();
  const entered = vi.fn();
  const ref = createRef<HTMLDivElement>();
  const view = render(<TileSequence show items={items} ref={ref} />);
  view.rerender(
    <TileSequence show={false} items={items} ref={ref} onExited={exited} />,
  );
  vi.spyOn(window, "getComputedStyle").mockImplementation(
    (element) =>
      ({
        opacity: "0.7",
        transform:
          element === ref.current
            ? "matrix(1, 0, 0, 1, 10, 0)"
            : "matrix(1, 0, 0, 1, 20, 0)",
        transformOrigin: "0px 100px",
      }) as CSSStyleDeclaration,
  );
  view.rerender(
    <TileSequence
      show
      items={items}
      ref={ref}
      direction="backward"
      onEntered={entered}
    />,
  );
  expect(runs).toHaveLength(6);
  for (const run of runs.slice(3)) {
    expect(run.options.delay).toBe(0);
    expect(run.frames[0].transform).toBe(
      run.element === ref.current
        ? "matrix(1, 0, 0, 1, 10, 0)"
        : "matrix(1, 0, 0, 1, 20, 0)",
    );
  }
  await act(async () => runs.slice(0, 3).forEach((run) => run.finish()));
  expect(exited).not.toHaveBeenCalled();
  act(() => {
    reduced = true;
    listeners.forEach((fn) => fn());
  });
  expect(entered).toHaveBeenCalledTimes(1);
});

it("anchors different tile origins to a single camera and scales projection with the grid", () => {
  const ref = createRef<HTMLDivElement>();
  const view = render(<TileSequence show items={items} ref={ref} />);
  Object.defineProperties(ref.current!, {
    clientWidth: { value: 400 },
    clientHeight: { value: 600 },
  });
  const children = Array.from(ref.current!.children);
  children.forEach((child, index) =>
    Object.defineProperties(child, {
      offsetLeft: { value: index * 100 },
      offsetTop: { value: index * 150 },
    }),
  );
  view.rerender(<TileSequence show={false} items={items} ref={ref} />);
  for (const run of runs) {
    const index = children.indexOf(run.element);
    expect(index).toBeGreaterThanOrEqual(0);
    const [x, y] = String(run.frames[0].transformOrigin)
      .split(" ")
      .map(parseFloat);
    expect(x + index * 100).toBe(0);
    expect(y + index * 150).toBe(300);
    expect(
      parseFloat(String(run.frames[0].transform).split("perspective(")[1]),
    ).toBeCloseTo(980);
    expect(run.frames.at(-1)!.transform).toContain("translateX(-43.2px)");
  }
});

it.each(["layered", "group", "individual"] as const)(
  "%s keeps the exit frame until React has hidden or removed its surface",
  async (mode) => {
    const ref = createRef<HTMLDivElement>();
    const view = render(
      <TileSequence mode={mode} show items={items} ref={ref} />,
    );
    view.rerender(
      <TileSequence mode={mode} show={false} items={items} ref={ref} />,
    );
    const releasedWhileVisible: boolean[] = [];
    for (const run of runs) {
      run.cancel.mockImplementation(() => {
        releasedWhileVisible.push(
          run.element.isConnected && !ref.current!.hidden,
        );
      });
    }
    await act(async () => runs.forEach((run) => run.finish()));
    expect(ref.current).toHaveAttribute("data-state", "exited");
    expect(releasedWhileVisible.every((visible) => !visible)).toBe(true);
    expect(releasedWhileVisible).toHaveLength(runs.length);
  },
);

it("returns along the forward departure path with reversed timing", async () => {
  const ref = createRef<HTMLDivElement>();
  const view = render(<TileSequence show items={items} ref={ref} />);
  Object.defineProperties(ref.current!, {
    clientWidth: { value: 400 },
    clientHeight: { value: 600 },
  });
  view.rerender(
    <TileSequence show={false} direction="forward" items={items} ref={ref} />,
  );
  const departure = [...runs];
  await act(async () => departure.forEach((run) => run.finish()));
  view.rerender(
    <TileSequence show direction="backward" items={items} ref={ref} />,
  );
  const returning = runs.slice(departure.length);
  for (const back of returning) {
    const out = departure.find(
      (run) => run.element.textContent === back.element.textContent,
    )!;
    expect(back.frames[0]).toMatchObject({
      transform: out.frames.at(-1)!.transform,
      transformOrigin: out.frames.at(-1)!.transformOrigin,
    });
    // Preparation uses alpha below one display step instead of exact zero.
    expect(Number(back.frames[0].opacity)).toBeCloseTo(
      Number(out.frames.at(-1)!.opacity),
      2,
    );
    expect(back.frames.at(-1)).toEqual(out.frames[0]);
    expect(Number(back.options.delay) + Number(out.options.delay)).toBe(66);
    expect(back.options.duration).toBe(out.options.duration);
    expect(back.options.easing).toBe("cubic-bezier(0, 0, 0.58, 1)");
  }
});

it("measures every tile before starting the wave to avoid repeated forced layouts", () => {
  const ref = createRef<HTMLDivElement>();
  const view = render(<TileSequence show items={items} ref={ref} />);
  const operations: string[] = [];
  for (const child of Array.from(ref.current!.children)) {
    Object.defineProperties(child, {
      offsetLeft: {
        get: () => {
          operations.push("measure");
          return 0;
        },
      },
      offsetTop: {
        get: () => {
          operations.push("measure");
          return 0;
        },
      },
    });
  }
  const animate = vi.mocked(Element.prototype.animate).getMockImplementation()!;
  vi.mocked(Element.prototype.animate).mockImplementation(function (
    this: Element,
    frames,
    options,
  ) {
    operations.push("animate");
    return animate.call(this, frames, options);
  });
  view.rerender(<TileSequence show={false} items={items} ref={ref} />);
  expect(
    operations.filter((operation) => operation === "measure"),
  ).toHaveLength(6);
  expect(operations.lastIndexOf("measure")).toBeLessThan(
    operations.indexOf("animate"),
  );
});

function controlPreparationFrames() {
  let id = 0;
  const pending = new Map<number, FrameRequestCallback>();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    pending.set(++id, callback);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((frame) => {
    pending.delete(frame);
  });
  return () => {
    const callbacks = [...pending.values()];
    pending.clear();
    act(() => callbacks.forEach((callback) => callback(0)));
  };
}

it("prepares a fresh layered entrance before starting its staggered playback", async () => {
  const frame = controlPreparationFrames();
  const entered = vi.fn();
  const view = render(<TileSequence show={false} items={items} />);
  view.rerender(<TileSequence show items={items} onEntered={entered} />);
  expect(runs).toHaveLength(3);
  for (const run of runs) {
    expect(run.pause).toHaveBeenCalledOnce();
    expect(run.play).not.toHaveBeenCalled();
    // Nonzero, subpixel alpha lets the compositor rasterize the waiting tiles.
    expect(Number(run.frames[0].opacity)).toBeGreaterThan(0);
    expect(Number(run.frames[0].opacity)).toBeLessThan(1 / 255);
  }
  frame();
  expect(runs.every((run) => run.play.mock.calls.length === 0)).toBe(true);
  frame();
  expect(runs.every((run) => run.play.mock.calls.length === 1)).toBe(true);
  expect(runs.map((run) => run.options.delay)).toEqual([0, 33, 66]);
  expect(entered).not.toHaveBeenCalled();
  await act(async () => runs.forEach((run) => run.finish()));
  expect(entered).toHaveBeenCalledOnce();
});

it.each(["hide", "unmount", "reduce"])(
  "does not start a prepared entrance after %s interrupts it",
  async (interrupt) => {
    const frame = controlPreparationFrames();
    const entered = vi.fn();
    const view = render(<TileSequence show={false} items={items} />);
    view.rerender(<TileSequence show items={items} onEntered={entered} />);
    const entrance = [...runs];
    expect(entrance.every((run) => run.pause.mock.calls.length === 1)).toBe(
      true,
    );
    frame();
    if (interrupt === "hide")
      view.rerender(<TileSequence show={false} items={items} />);
    if (interrupt === "unmount") view.unmount();
    if (interrupt === "reduce")
      act(() => {
        reduced = true;
        listeners.forEach((listener) => listener());
      });
    frame();
    expect(entrance.every((run) => run.play.mock.calls.length === 0)).toBe(
      true,
    );
    expect(entrance.every((run) => run.cancel.mock.calls.length === 1)).toBe(
      true,
    );
    await act(async () => entrance.forEach((run) => run.finish()));
    expect(entered).toHaveBeenCalledTimes(interrupt === "reduce" ? 1 : 0);
  },
);
