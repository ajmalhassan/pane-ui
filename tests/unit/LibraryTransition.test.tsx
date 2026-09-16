import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Transition } from "../../packages/react/src/Transition";
import { Stagger } from "../../packages/react/src/Stagger";

type Run = {
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
  cancel: ReturnType<typeof vi.fn>;
  finish(): void;
};
let runs: Run[];
let reduced: boolean;
let listeners: Set<() => void>;
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
        addEventListener: (_: string, listener: () => void) =>
          listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) =>
          listeners.delete(listener),
      }) as unknown as MediaQueryList,
  );
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value: vi.fn((frames, options) => {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const cancel = vi.fn();
      runs.push({ frames, options, finish, cancel });
      return { finished, cancel };
    }),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  delete (Element.prototype as Partial<Element>).animate;
});

it("renders readable initial and server content without entrance animation", () => {
  const entered = vi.fn();
  render(
    <StrictMode>
      <Transition show onEntered={entered}>
        <button>Read</button>
      </Transition>
    </StrictMode>,
  );
  expect(screen.getByRole("button")).toBeVisible();
  expect(screen.getByRole("button").parentElement).toHaveAttribute(
    "data-state",
    "entered",
  );
  expect(runs).toHaveLength(0);
  expect(entered).not.toHaveBeenCalled();
  expect(
    renderToString(<Transition show>Server content</Transition>),
  ).toContain("Server content");
  expect(
    renderToString(<Transition show={false}>Hidden content</Transition>),
  ).not.toContain("Hidden content");
});

it("retains an inert exit until completion then unmounts children", async () => {
  const exited = vi.fn();
  const view = render(
    <Transition show onExited={exited}>
      <button>Read</button>
    </Transition>,
  );
  view.rerender(
    <Transition show={false} onExited={exited}>
      <button>Read</button>
    </Transition>,
  );
  const parent = screen.getByText("Read").parentElement!;
  expect(parent).toHaveAttribute("data-state", "exiting");
  expect(parent).toHaveAttribute("inert");
  expect(parent).toHaveAttribute("aria-hidden", "true");
  expect(screen.queryByRole("button")).toBeNull();
  await act(async () => runs[0].finish());
  expect(screen.queryByText("Read")).toBeNull();
  expect(parent).toHaveAttribute("data-state", "exited");
  expect(exited).toHaveBeenCalledTimes(1);
});

it("enters on show and uses the selected duration and direction", async () => {
  const entered = vi.fn();
  const view = render(<Transition show={false}>Content</Transition>);
  view.rerender(
    <Transition
      show
      preset="slide"
      direction="backward"
      duration={123}
      onEntered={entered}
    >
      Content
    </Transition>,
  );
  expect(screen.getByText("Content")).toHaveAttribute("data-state", "entering");
  expect(runs[0].options.duration).toBe(123);
  expect(runs[0].frames[0].transform).toContain("-48px");
  await act(async () => runs[0].finish());
  expect(screen.getByText("Content")).toHaveAttribute("data-state", "entered");
  expect(entered).toHaveBeenCalledTimes(1);
});

it("reverses from the displayed frame and ignores stale completion", async () => {
  const exited = vi.fn();
  const entered = vi.fn();
  const view = render(
    <Transition show onExited={exited} onEntered={entered}>
      Content
    </Transition>,
  );
  view.rerender(
    <Transition show={false} onExited={exited} onEntered={entered}>
      Content
    </Transition>,
  );
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    opacity: "0.4",
    transform: "matrix(1, 0, 0, 1, 12, 0)",
  } as CSSStyleDeclaration);
  view.rerender(
    <Transition show onExited={exited} onEntered={entered}>
      Content
    </Transition>,
  );
  expect(runs[0].cancel).toHaveBeenCalled();
  expect(runs[1].frames[0]).toMatchObject({
    opacity: "0.4",
    transform: "matrix(1, 0, 0, 1, 12, 0)",
  });
  expect(screen.getByText("Content")).not.toHaveAttribute("inert");
  await act(async () => runs[0].finish());
  expect(exited).not.toHaveBeenCalled();
  expect(screen.getByText("Content")).toHaveAttribute("data-state", "entering");
  await act(async () => runs[1].finish());
  expect(entered).toHaveBeenCalledTimes(1);
});

it("settles immediately when reduced motion turns on during exit", async () => {
  const exited = vi.fn();
  const view = render(
    <Transition show onExited={exited}>
      Content
    </Transition>,
  );
  view.rerender(
    <Transition show={false} onExited={exited}>
      Content
    </Transition>,
  );
  act(() => {
    reduced = true;
    listeners.forEach((listener) => listener());
  });
  expect(screen.queryByText("Content")).toBeNull();
  expect(exited).toHaveBeenCalledTimes(1);
  expect(runs[0].cancel).toHaveBeenCalled();
  await act(async () => runs[0].finish());
  expect(exited).toHaveBeenCalledTimes(1);
});

it("settles without animation APIs and with initial reduced motion", () => {
  delete (Element.prototype as Partial<Element>).animate;
  const entered = vi.fn();
  const view = render(<Transition show={false}>Content</Transition>);
  view.rerender(
    <Transition show onEntered={entered}>
      Content
    </Transition>,
  );
  expect(screen.getByText("Content")).toHaveAttribute("data-state", "entered");
  expect(entered).toHaveBeenCalledTimes(1);
  reduced = true;
  view.rerender(<Transition show={false}>Content</Transition>);
  expect(screen.queryByText("Content")).toBeNull();
});

it("cancels on unmount without completion callbacks or subscriptions", async () => {
  const exited = vi.fn();
  const view = render(<Transition show>Content</Transition>);
  view.rerender(
    <Transition show={false} onExited={exited}>
      Content
    </Transition>,
  );
  view.unmount();
  expect(runs[0].cancel).toHaveBeenCalled();
  expect(listeners.size).toBe(0);
  await act(async () => runs[0].finish());
  expect(exited).not.toHaveBeenCalled();
});

it("stagger preserves child identity on reorder and caps entrance delays", () => {
  const view = render(
    <Stagger show interval={200}>
      {["a", "b", "c"].map((key) => (
        <input key={key} aria-label={key} defaultValue={key} />
      ))}
    </Stagger>,
  );
  const first = screen.getByRole("textbox", { name: "a" });
  view.rerender(
    <Stagger show interval={200}>
      {["c", "b", "a"].map((key) => (
        <input key={key} aria-label={key} defaultValue={key} />
      ))}
    </Stagger>,
  );
  expect(screen.getByRole("textbox", { name: "a" })).toBe(first);
  expect(
    first.parentElement?.style.getPropertyValue("--wp-stagger-delay"),
  ).toBe("240ms");
  view.rerender(
    <Stagger show={false}>
      <button>Hidden</button>
    </Stagger>,
  );
  expect(screen.queryByRole("button")).toBeNull();
});

it("uses the latest completion callback without restarting an active animation", async () => {
  const oldEntered = vi.fn();
  const newEntered = vi.fn();
  const view = render(
    <StrictMode>
      <Transition show={false}>Content</Transition>
    </StrictMode>,
  );
  view.rerender(
    <StrictMode>
      <Transition show onEntered={oldEntered}>
        Content
      </Transition>
    </StrictMode>,
  );
  view.rerender(
    <StrictMode>
      <Transition show onEntered={newEntered}>
        Content
      </Transition>
    </StrictMode>,
  );
  expect(runs).toHaveLength(1);
  await act(async () => runs[0].finish());
  expect(oldEntered).not.toHaveBeenCalled();
  expect(newEntered).toHaveBeenCalledTimes(1);
});

it("settles if animation setup throws and honors zero duration", () => {
  vi.mocked(Element.prototype.animate).mockImplementation(() => {
    throw new Error("Unsupported effect");
  });
  const entered = vi.fn();
  const view = render(<Transition show={false}>Content</Transition>);
  view.rerender(
    <Transition show onEntered={entered}>
      Content
    </Transition>,
  );
  expect(screen.getByText("Content")).toHaveAttribute("data-state", "entered");
  expect(entered).toHaveBeenCalledTimes(1);
  const exited = vi.fn();
  view.rerender(
    <Transition show={false} duration={0} onExited={exited}>
      Content
    </Transition>,
  );
  expect(screen.queryByText("Content")).toBeNull();
  expect(exited).toHaveBeenCalledTimes(1);
});

it("does not start spatial motion when reduced motion is already enabled", () => {
  reduced = true;
  const view = render(<Transition show={false}>Content</Transition>);
  view.rerender(<Transition show>Content</Transition>);
  expect(screen.getByText("Content")).toHaveAttribute("data-state", "entered");
  expect(runs).toHaveLength(0);
});

it("forwards native attributes and refs through hidden and visible states", () => {
  let element: HTMLDivElement | null = null;
  const view = render(
    <Transition
      show={false}
      id="panel"
      ref={(node) => {
        element = node;
      }}
      className="custom"
    >
      Content
    </Transition>,
  );
  expect(element).toHaveAttribute("id", "panel");
  expect(element).toHaveClass("custom", "wp-transition");
  view.rerender(
    <Transition
      show
      duration={0}
      id="panel"
      ref={(node) => {
        element = node;
      }}
    >
      Content
    </Transition>,
  );
  expect(element).toBe(screen.getByText("Content"));
});

it("omits conditional empty stagger children without consuming a delay", () => {
  const { container } = render(
    <Stagger show interval={40}>
      {false}
      {null}
      <button>First</button>
      {undefined}
      <button>Second</button>
    </Stagger>,
  );
  expect(container.querySelectorAll(".wp-stagger-item")).toHaveLength(2);
  expect(
    screen
      .getByText("First")
      .parentElement?.style.getPropertyValue("--wp-stagger-delay"),
  ).toBe("0ms");
  expect(
    screen
      .getByText("Second")
      .parentElement?.style.getPropertyValue("--wp-stagger-delay"),
  ).toBe("40ms");
});

it("keeps the displayed transform origin when direction changes during a turnstile", () => {
  const view = render(<Transition show>Content</Transition>);
  view.rerender(
    <Transition show={false} direction="forward">
      Content
    </Transition>,
  );
  expect(runs[0].frames[0].transformOrigin).toBe("right center");
  expect(runs[0].frames[1].transformOrigin).toBe("right center");
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    opacity: "0.5",
    transform: "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)",
    transformOrigin: "240px 100px",
  } as CSSStyleDeclaration);
  view.rerender(
    <Transition show={false} direction="backward">
      Content
    </Transition>,
  );
  expect(runs[1].frames[0].transformOrigin).toBe("240px 100px");
  expect(runs[1].frames[1].transformOrigin).toBe("240px 100px");
});

it("invokes completion after the final DOM and child unmount commit", async () => {
  let observedPhase: string | null = null;
  let observedChild: Element | null = null;
  const view = render(
    <Transition show data-testid="presence">
      <button>Content</button>
    </Transition>,
  );
  view.rerender(
    <Transition
      show={false}
      data-testid="presence"
      onExited={() => {
        observedPhase = screen
          .getByTestId("presence")
          .getAttribute("data-state");
        observedChild = screen.queryByText("Content");
      }}
    >
      <button>Content</button>
    </Transition>,
  );
  await act(async () => runs[0].finish());
  expect(observedPhase).toBe("exited");
  expect(observedChild).toBeNull();
});

it("allows replay from onExited after the previous content is removed", async () => {
  const { useState } = await import("react");
  const phases: string[] = [];
  function Replay() {
    const [show, setShow] = useState(true);
    return (
      <>
        <button onClick={() => setShow(false)}>Replay</button>
        <Transition
          show={show}
          data-testid="replay-panel"
          onExited={() => {
            phases.push(screen.getByTestId("replay-panel").dataset.state!);
            setShow(true);
          }}
        >
          Panel content
        </Transition>
      </>
    );
  }
  render(<Replay />);
  act(() => screen.getByRole("button", { name: "Replay" }).click());
  await act(async () => runs[0].finish());
  expect(phases).toEqual(["exited"]);
  expect(screen.getByTestId("replay-panel")).toHaveAttribute(
    "data-state",
    "entering",
  );
  await act(async () => runs[1].finish());
  expect(screen.getByTestId("replay-panel")).toHaveAttribute(
    "data-state",
    "entered",
  );
});

it.each(["turnstile", "slide", "continuum", "fade"] as const)(
  "%s retraces its forward entrance on backward exit",
  async (preset) => {
    const view = render(
      <Transition show={false} preset={preset}>
        App
      </Transition>,
    );
    view.rerender(
      <Transition show preset={preset} direction="forward">
        App
      </Transition>,
    );
    const entrance = runs[0];
    await act(async () => entrance.finish());
    view.rerender(
      <Transition show={false} preset={preset} direction="backward">
        App
      </Transition>,
    );
    const exit = runs[1];
    expect(exit.frames[0]).toEqual(entrance.frames[1]);
    expect(exit.frames[1]).toEqual(entrance.frames[0]);
    expect(exit.options.easing).toBe("cubic-bezier(0.75, 0, 0.85, 0.3)");
  },
);

it("holds the app's exit frame until its hidden DOM commit", async () => {
  const view = render(<Transition show>App</Transition>);
  const surface = screen.getByText("App");
  view.rerender(<Transition show={false}>App</Transition>);
  const visibleAtRelease: boolean[] = [];
  runs[0].cancel.mockImplementation(() =>
    visibleAtRelease.push(!surface.hidden),
  );
  await act(async () => runs[0].finish());
  expect(visibleAtRelease.every((visible) => !visible)).toBe(true);
});
