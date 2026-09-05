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

/** How often the two-tile log below reads the pair. */
const SAMPLE_MS = 100;

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

/*
 * A zero interval has no schedule to keep: the pre-fix catch-up loop
 * (`while (due <= now) due += intervalMs`) never clears when the step is
 * zero, so the effect must bail before reaching it rather than hang.
 */
it("never schedules a cycle for a zero interval", () => {
  const { result } = renderHook(() =>
    useLiveCycle(3, { ...RUNNING, intervalMs: 0 }),
  );

  expect(vi.getTimerCount()).toBe(0);
  advanceBy(30_000);
  expect(result.current.index).toBe(0);
});

/*
 * `NaN` clears the same loop instantly -- `due <= now` is always false -- but
 * then reaches `setInterval(step, NaN)`, which fires at frame rate. The guard
 * that stops the zero case stops this one too, for the same reason.
 */
it("never schedules a cycle for a NaN interval", () => {
  const { result } = renderHook(() =>
    useLiveCycle(3, { ...RUNNING, intervalMs: NaN }),
  );

  expect(vi.getTimerCount()).toBe(0);
  advanceBy(30_000);
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

/*
 * ---------------------------------------------------------------------------
 * The initial phase
 * ---------------------------------------------------------------------------
 *
 * Two live tiles on one screen changing together read as a screen that blinks.
 * `offsetMs` is the phase the second one starts at: it delays only the FIRST
 * change, after which the tile keeps the same interval as everything else, so
 * the gap between the two is constant forever rather than drifting.
 */
it("delays only the first change by the offset and keeps the interval after it", () => {
  const { result } = renderHook(() =>
    useLiveCycle(3, { ...RUNNING, offsetMs: 3000 }),
  );

  advanceBy(6000);
  expect(result.current.index).toBe(0);
  advanceBy(2999);
  expect(result.current.index).toBe(0);
  advanceBy(1);
  expect(result.current.index).toBe(1);

  // From here it is an ordinary six-second cycle: the offset is spent.
  advanceBy(6000);
  expect(result.current.index).toBe(2);
  advanceBy(6000);
  expect(result.current.index).toBe(0);
});

/*
 * A tile held paused from its very first render has no grid yet: the phase is
 * measured from the moment it comes alive, not from a mount it spent frozen.
 */
it("phases a tile that spent its whole mount paused from the moment it starts", () => {
  const { rerender, result } = renderHook(
    ({ paused }: { paused: boolean }) =>
      useLiveCycle(3, { ...RUNNING, offsetMs: 3000, paused }),
    { initialProps: { paused: true } },
  );

  advanceBy(30_000);
  expect(result.current.index).toBe(0);

  rerender({ paused: false });
  advanceBy(6000);
  expect(result.current.index).toBe(0);
  advanceBy(3000);
  expect(result.current.index).toBe(1);
});

/*
 * A hand advance is the one thing that legitimately moves an offset tile's
 * grid, and it moves it to the reader: the claim they just asked for is theirs
 * for a whole interval, not for an interval plus a phase they never saw.
 */
it("gives a hand-advanced offset tile a whole interval, not a second phase", () => {
  const { result } = renderHook(() =>
    useLiveCycle(3, { ...RUNNING, offsetMs: 3000 }),
  );

  act(() => {
    result.current.advance();
  });
  expect(result.current.index).toBe(1);

  advanceBy(5999);
  expect(result.current.index).toBe(1);
  advanceBy(1);
  expect(result.current.index).toBe(2);
});

/*
 * A pause that outlasts a deadline owes the reader no fresh interval on
 * release: the claim they were holding is already a beat old, so the tile
 * rejoins its own grid at the next moment on it -- 5000ms after this release,
 * not the 6000 a rebuilt-from-scratch timer would serve.
 */
it("rejoins its grid promptly when a pause outlasts a deadline", () => {
  const { rerender, result } = renderHook(
    ({ paused }: { paused: boolean }) =>
      useLiveCycle(3, { ...RUNNING, paused }),
    { initialProps: { paused: false } },
  );

  advanceBy(5000);
  rerender({ paused: true });
  // The 6000ms deadline passes while the reader is holding the tile still.
  advanceBy(2000);
  expect(result.current.index).toBe(0);

  rerender({ paused: false });
  advanceBy(4999);
  expect(result.current.index).toBe(0);
  advanceBy(1);
  expect(result.current.index).toBe(1);
});

/*
 * The fault the epoch exists to prevent, reproduced whole: two tiles three
 * seconds apart, a reader who hovers ONE of them and lets go, and 25 seconds of
 * changes afterwards.
 *
 * A phase applied to the first wait of every RUN of the effect -- and a pause
 * is a new run -- re-anchors the paused tile to the moment the hover ended.
 * Released at t = 3500 against a six-second beat that leaves the two tiles
 * changing 500ms apart for the rest of the session; released on a multiple of
 * the interval, in the same instant.
 */
it("holds the phase between two tiles when a reader pauses one of them", () => {
  const { rerender, result } = renderHook(
    ({ paused }: { paused: boolean }) => ({
      assessment: useLiveCycle(3, { ...RUNNING, offsetMs: 3000, paused }),
      evidence: useLiveCycle(3, RUNNING),
    }),
    { initialProps: { paused: false } },
  );

  const seen = { assessment: 0, evidence: 0 };
  const changes: { at: number; tile: keyof typeof seen }[] = [];
  let now = 0;

  function log(until: number) {
    while (now < until) {
      advanceBy(SAMPLE_MS);
      now += SAMPLE_MS;
      for (const tile of ["evidence", "assessment"] as const) {
        if (result.current[tile].index === seen[tile]) continue;
        seen[tile] = result.current[tile].index;
        changes.push({ at: now, tile });
      }
    }
  }

  log(1000);
  rerender({ paused: true });
  log(3500);
  rerender({ paused: false });
  log(28_500);

  const trace = changes
    .map((change) => `${change.tile}@${change.at}`)
    .join(" ");
  const gaps = changes.slice(1).map((change, i) => change.at - changes[i].at);

  // Both tiles turned over, so the gaps below are measuring something.
  expect(new Set(changes.map((change) => change.tile)).size, trace).toBe(2);
  expect(changes.length, trace).toBeGreaterThanOrEqual(8);
  // Never in the same second, and not merely clear of each other: the two are
  // still exactly the phase apart, a lap and a half after the hover.
  expect(Math.min(...gaps), trace).toBeGreaterThanOrEqual(1000);
  for (const gap of gaps) expect(gap, trace).toBe(3000);
});

it("leaves no timer behind when an offset tile unmounts mid-phase", () => {
  const { unmount } = renderHook(() =>
    useLiveCycle(3, { ...RUNNING, offsetMs: 3000 }),
  );

  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("runs unphased when no offset is asked for", () => {
  const { result } = renderHook(() => useLiveCycle(3, RUNNING));

  advanceBy(6000);
  expect(result.current.index).toBe(1);
});
