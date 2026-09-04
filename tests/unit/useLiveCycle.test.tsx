import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useLiveCycle } from "@/components/metro/useLiveCycle";

const RUNNING = { intervalMs: 6000, paused: false, enabled: true } as const;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function advanceBy(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

it("never schedules a cycle for a single claim", () => {
  const { result } = renderHook(() => useLiveCycle(1, RUNNING));

  expect(vi.getTimerCount()).toBe(0);
  advanceBy(60_000);
  expect(result.current.index).toBe(0);
});

it("shows one claim per interval and wraps back to the first", () => {
  const { result } = renderHook(() => useLiveCycle(3, RUNNING));

  expect(result.current.index).toBe(0);
  advanceBy(6000);
  expect(result.current.index).toBe(1);
  advanceBy(6000);
  expect(result.current.index).toBe(2);
  advanceBy(6000);
  expect(result.current.index).toBe(0);
});

it("holds the current claim while paused and resumes on release", () => {
  const { rerender, result } = renderHook(
    ({ paused }: { paused: boolean }) =>
      useLiveCycle(3, { ...RUNNING, paused }),
    { initialProps: { paused: true } },
  );

  advanceBy(18_000);
  expect(result.current.index).toBe(0);
  expect(vi.getTimerCount()).toBe(0);

  rerender({ paused: false });
  advanceBy(6000);
  expect(result.current.index).toBe(1);
});

it("stops entirely while the cycle is disabled", () => {
  const { rerender, result } = renderHook(
    ({ enabled }: { enabled: boolean }) =>
      useLiveCycle(3, { ...RUNNING, enabled }),
    { initialProps: { enabled: true } },
  );

  advanceBy(6000);
  expect(result.current.index).toBe(1);

  rerender({ enabled: false });
  expect(vi.getTimerCount()).toBe(0);
  advanceBy(18_000);
  expect(result.current.index).toBe(1);
});

/*
 * A reader who advances the tile by hand has just seen the new claim, so the
 * automatic cycle owes them a whole interval before replacing it -- not
 * whatever remained of the interval that was already running.
 */
it("restarts the interval when a reader advances by hand", () => {
  const { result } = renderHook(() => useLiveCycle(3, RUNNING));

  advanceBy(3000);
  act(() => {
    result.current.advance();
  });
  expect(result.current.index).toBe(1);

  advanceBy(3000);
  expect(result.current.index).toBe(1);
  advanceBy(3000);
  expect(result.current.index).toBe(2);
});

it("wraps a manual advance past the last claim", () => {
  const { result } = renderHook(() => useLiveCycle(2, RUNNING));

  act(() => {
    result.current.advance();
  });
  act(() => {
    result.current.advance();
  });

  expect(result.current.index).toBe(0);
});

it("leaves no timer behind when the tile unmounts", () => {
  const { unmount } = renderHook(() => useLiveCycle(3, RUNNING));

  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("falls back to a real claim when the evidence set shrinks", () => {
  const { rerender, result } = renderHook(
    ({ count }: { count: number }) => useLiveCycle(count, RUNNING),
    { initialProps: { count: 3 } },
  );

  advanceBy(12_000);
  expect(result.current.index).toBe(2);

  rerender({ count: 2 });
  expect(result.current.index).toBe(0);
});
