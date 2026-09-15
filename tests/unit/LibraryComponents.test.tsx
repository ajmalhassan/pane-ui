import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Theme,
  Tile,
  TileLink,
  TileGrid,
  RevealTile,
  LiveTile,
  Pressable,
  AppBar,
  AppBarAction,
} from "../../packages/react/src/index";

beforeEach(() => {
  vi.mocked(window.matchMedia).mockImplementation(
    (query) =>
      ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
});
afterEach(() => {
  vi.useRealTimers();
});

describe("library consumer contracts", () => {
  it("keeps navigation a native anchor with attributes and a ref", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <TileLink label="Explore" href="/explore" target="_blank" ref={ref}>
        Projects
      </TileLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/explore");
    expect(ref.current).toBe(screen.getByRole("link"));
  });
  it("does not accidentally submit forms and disables commands", async () => {
    const submit = vi.fn((event) => event.preventDefault());
    const click = vi.fn();
    render(
      <form onSubmit={submit}>
        <Pressable>Press</Pressable>
        <AppBar>
          <AppBarAction label="Save" icon="+" disabled onClick={click} />
        </AppBar>
      </form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Press" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(submit).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });
  it("reveals via keyboard, preserves focus, and allows event cancellation", async () => {
    const { rerender } = render(
      <RevealTile label="Details" front="Front" back="Back" />,
    );
    const button = screen.getByRole("button", { name: /Details/ });
    button.focus();
    await userEvent.keyboard(" ");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveFocus();
    expect(screen.getByText("Front").closest("[aria-hidden]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    rerender(
      <RevealTile
        label="Details"
        front="Front"
        back="Back"
        onClick={(event) => event.preventDefault()}
      />,
    );
    await userEvent.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
  it("treats controlled reveal state as the owner", () => {
    const change = vi.fn();
    render(
      <RevealTile
        label="Details"
        front="Front"
        back="Back"
        revealed={false}
        onRevealedChange={change}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(change).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });
  it("cycles live content while keeping a stable accessible label and an explicit pause control", () => {
    vi.useFakeTimers();
    render(
      <LiveTile
        label="News"
        accessibleLabel="News: First and Second"
        items={["First", "Second"]}
        intervalMs={1000}
      />,
    );
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("Second")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause News" }));
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByLabelText("News: First and Second")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume News" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("First")).toBeInTheDocument();
  });
  it("holds live content under reduced motion and allows deliberate manual advancement", () => {
    vi.useFakeTimers();
    vi.mocked(window.matchMedia).mockImplementation(
      (query) =>
        ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );
    render(
      <LiveTile
        label="News"
        accessibleLabel="Both stories"
        items={["First", "Second"]}
        intervalMs={1000}
      />,
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("First")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next News" }));
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
  it("composes theme roots, static tiles and arbitrary grid children without global side effects", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Theme mode="dark" accent="violet">
        <Theme mode="light" accent="green" ref={ref}>
          <TileGrid>
            <section>
              <Tile label="Content">Hello</Tile>
            </section>
          </TileGrid>
        </Theme>
      </Theme>,
    );
    expect(ref.current).toHaveAttribute("data-mode", "light");
    expect(ref.current).toHaveAttribute("data-accent", "green");
    expect(document.documentElement).not.toHaveAttribute("data-mode");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});

describe("live lifecycle", () => {
  it("stops while focus is inside, resumes on leaving, and clears clocks on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <LiveTile
        label="News"
        accessibleLabel="Both"
        items={["First", "Second"]}
        intervalMs={1000}
      />,
    );
    fireEvent.focus(screen.getByRole("button", { name: "Next News" }));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText("First")).toBeInTheDocument();
    fireEvent.blur(screen.getByRole("button", { name: "Next News" }), {
      relatedTarget: document.body,
    });
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("Second")).toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("reacts immediately to motion preference changes and removes subscriptions", () => {
    vi.useFakeTimers();
    const media = new EventTarget();
    Object.assign(media, { matches: false });
    const remove = vi.spyOn(media, "removeEventListener");
    vi.mocked(window.matchMedia).mockReturnValue(
      media as unknown as MediaQueryList,
    );
    const { unmount } = render(
      <LiveTile
        label="News"
        accessibleLabel="Both"
        items={["First", "Second"]}
        intervalMs={1000}
      />,
    );
    act(() => {
      Object.assign(media, { matches: true });
      media.dispatchEvent(new Event("change"));
    });
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("First")).toBeInTheDocument();
    unmount();
    expect(remove).toHaveBeenCalledWith("change", expect.any(Function));
  });
  it("holds controlled pause state and safely handles content shrinking to empty", () => {
    vi.useFakeTimers();
    const change = vi.fn();
    const { rerender } = render(
      <LiveTile
        label="News"
        accessibleLabel="Both"
        paused
        onPausedChange={change}
        items={["First", "Second"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Resume News" }));
    expect(change).toHaveBeenCalledWith(false);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByText("First")).toBeInTheDocument();
    rerender(<LiveTile label="News" accessibleLabel="Empty" items={[]} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByLabelText("Empty")).toBeInTheDocument();
  });
});

describe("contact-point press feedback", () => {
  function box(element: HTMLElement) {
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    } as DOMRect);
  }
  it.each(["button", "link"])(
    "tilts a %s at touch contact, avoids touch hover, and releases on cancellation",
    (kind) => {
      render(
        kind === "button" ? (
          <Pressable>Press</Pressable>
        ) : (
          <TileLink href="/" label="Press" />
        ),
      );
      const target = screen.getByRole(kind);
      box(target);
      fireEvent.pointerMove(target, {
        pointerType: "touch",
        clientX: 75,
        clientY: 25,
      });
      expect(target.style.getPropertyValue("--wp-press-rotate-x")).toBe("");
      fireEvent.pointerDown(target, {
        pointerType: "touch",
        clientX: 75,
        clientY: 25,
      });
      expect(target.style.getPropertyValue("--wp-press-rotate-x")).toBe("1deg");
      expect(target.style.getPropertyValue("--wp-press-rotate-y")).toBe("1deg");
      fireEvent.pointerCancel(target);
      expect(target.style.getPropertyValue("--wp-press-rotate-x")).toBe("");
    },
  );
  it("honors consumer cancellation and clears when disabled during a press", () => {
    const { rerender } = render(
      <Pressable onPointerDown={(event) => event.preventDefault()}>
        Press
      </Pressable>,
    );
    const target = screen.getByRole("button");
    box(target);
    fireEvent.pointerDown(target, {
      pointerType: "mouse",
      clientX: 75,
      clientY: 25,
    });
    expect(target.style.getPropertyValue("--wp-press-rotate-x")).toBe("");
    rerender(<Pressable>Press</Pressable>);
    fireEvent.pointerDown(target, {
      pointerType: "mouse",
      clientX: 75,
      clientY: 25,
    });
    expect(target.style.getPropertyValue("--wp-press-rotate-x")).toBe("1deg");
    rerender(<Pressable disabled>Press</Pressable>);
    expect(target.style.getPropertyValue("--wp-press-rotate-x")).toBe("");
    fireEvent.pointerMove(target, {
      pointerType: "mouse",
      clientX: 75,
      clientY: 25,
    });
    expect(target.style.getPropertyValue("--wp-press-rotate-x")).toBe("");
  });
  it("clears immediately on motion preference changes and still calls consumer handlers", () => {
    const media = new EventTarget();
    Object.assign(media, { matches: false });
    vi.mocked(window.matchMedia).mockReturnValue(
      media as unknown as MediaQueryList,
    );
    const callback = vi.fn();
    render(<Pressable onPointerDown={callback}>Press</Pressable>);
    const target = screen.getByRole("button");
    box(target);
    fireEvent.pointerDown(target, {
      pointerType: "mouse",
      clientX: 75,
      clientY: 25,
    });
    expect(target.style.getPropertyValue("--wp-press-rotate-x")).toBe("1deg");
    act(() => {
      Object.assign(media, { matches: true });
      media.dispatchEvent(new Event("change"));
    });
    expect(target.style.getPropertyValue("--wp-press-rotate-x")).toBe("");
    fireEvent.pointerDown(target, {
      pointerType: "mouse",
      clientX: 75,
      clientY: 25,
    });
    expect(target.style.getPropertyValue("--wp-press-rotate-x")).toBe("");
    expect(callback).toHaveBeenCalledTimes(2);
  });
  it("keeps reveal naming stable and changes only the active face description", () => {
    render(<RevealTile label="Details" front="Summary" back="Full story" />);
    const target = screen.getByRole("button", { name: "Details" });
    expect(target).toHaveAccessibleDescription("Summary");
    fireEvent.click(target);
    expect(target).toHaveAccessibleName("Details");
    expect(target).toHaveAccessibleDescription("Full story");
  });
});

it("resumes live cycling after focused controls disappear and return", () => {
  vi.useFakeTimers();
  const ref = createRef<HTMLDivElement>();
  const { rerender } = render(
    <LiveTile
      ref={ref}
      label="News"
      accessibleLabel="Both"
      items={["First", "Second"]}
      intervalMs={1000}
    />,
  );
  act(() => screen.getByRole("button", { name: "Next News" }).focus());
  expect(ref.current).toContainElement(document.activeElement as HTMLElement);
  rerender(
    <LiveTile
      ref={ref}
      label="News"
      accessibleLabel="Both"
      items={["First"]}
      intervalMs={1000}
    />,
  );
  expect(document.activeElement).toBe(document.body);
  rerender(
    <LiveTile
      ref={ref}
      label="News"
      accessibleLabel="Both"
      items={["First", "Second"]}
      intervalMs={1000}
    />,
  );
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByText("Second")).toBeInTheDocument();
});
