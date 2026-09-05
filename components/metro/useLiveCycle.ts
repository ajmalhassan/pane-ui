"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  /**
   * Milliseconds a claim stays on screen before the next one replaces it.
   * Must be a positive finite number for the tile to cycle -- zero,
   * negative, or `NaN` disables cycling instead of scheduling a timer.
   */
  intervalMs: number;
  /** True while a reader is looking at this tile -- hover or keyboard focus. */
  paused: boolean;
  /** False while nothing can be seen, e.g. a backgrounded document. */
  enabled: boolean;
  /**
   * The tile's phase: how far its own grid of change moments sits behind an
   * unphased tile's.
   *
   * Two live tiles on one screen sharing a beat change together, and a screen
   * whose evidence all turns over at once reads as a screen that blinks.
   * Giving the second tile a phase is what makes the same two changes read as
   * liveliness instead.
   *
   * It is spent once, on the first deadline, and never applied again. Every
   * deadline after it is that first one plus a whole number of intervals, so
   * the gap to the unphased tile is constant for as long as both tiles are
   * left alone -- through a hover, a backgrounded tab, or any other pause,
   * because a pause takes time out of the tile's timeline without moving the
   * grid underneath it.
   */
  offsetMs?: number;
};

type LiveCycle = {
  index: number;
  advance: () => void;
};

/**
 * Timing for a live tile, and nothing else: no markup, no motion, no media
 * queries. The tile decides what "paused" and "enabled" mean; this hook only
 * decides when the index moves.
 */
export function useLiveCycle(
  itemCount: number,
  { intervalMs, paused, enabled, offsetMs = 0 }: Options,
): LiveCycle {
  const [index, setIndex] = useState(0);
  // Bumping this restarts the interval effect. A reader who advanced the tile
  // by hand has just seen the new claim, so they are owed a whole interval
  // before it is replaced -- not whatever was left of the running one.
  const [restarts, setRestarts] = useState(0);

  /*
   * The absolute moment the next claim is due -- the schedule itself, which
   * the timers below only ever chase.
   *
   * A timer lives no longer than one run of the effect, and a hover tears one
   * down and builds another; a schedule that starts with the timer therefore
   * re-phases the tile every time a reader touches it, which is exactly how
   * two tiles three seconds apart end up changing in the same instant. Holding
   * the deadline across runs makes a pause a gap in this tile's timeline
   * rather than a new beginning for it.
   *
   * `null` until the tile first cycles: a tile that mounts paused, hidden or
   * holding a single claim starts its grid when it starts moving.
   */
  const deadline = useRef<number | null>(null);

  const advance = useCallback(() => {
    setIndex((current) => (itemCount > 0 ? (current + 1) % itemCount : 0));
    // The one thing that legitimately moves the grid: the reader is looking at
    // a claim they asked for, and is owed a whole interval of it.
    deadline.current = Date.now() + intervalMs;
    setRestarts((current) => current + 1);
  }, [intervalMs, itemCount]);

  useEffect(() => {
    // One claim cannot cycle, a tile nobody can see must not burn a timer,
    // and an interval that isn't a positive finite number has no schedule to
    // keep: zero or negative never clears the catch-up loop below, and `NaN`
    // clears it instantly only to hand `setInterval` a `NaN` delay, which
    // fires at frame rate. Leave the index exactly where it is instead.
    if (itemCount <= 1 || paused || !enabled || !(intervalMs > 0)) {
      return;
    }

    const now = Date.now();
    // The phase, spent exactly once: a whole interval away, plus whatever this
    // tile trails the others by.
    let due = deadline.current ?? now + intervalMs + offsetMs;
    // Deadlines a pause, a hidden document or a hand advance carried the tile
    // past. It rejoins its own grid at the next moment on it -- `<=` rather
    // than `<` so a release landing exactly on a deadline does not replace the
    // claim in the same instant the reader let go of it.
    while (due <= now) due += intervalMs;
    deadline.current = due;

    const step = () => {
      due += intervalMs;
      deadline.current = due;
      setIndex((current) => (current + 1) % itemCount);
    };

    // One timeout on to the deadline handing over to one interval, rather than
    // an interval that keeps re-applying the phase and drifts.
    let cycle: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(() => {
      step();
      cycle = setInterval(step, intervalMs);
    }, due - now);

    return () => {
      clearTimeout(first);
      if (cycle !== undefined) clearInterval(cycle);
    };
  }, [enabled, intervalMs, itemCount, offsetMs, paused, restarts]);

  // A shorter evidence set must not leave the tile pointing past its own end,
  // and it must not cost a render to correct.
  return { advance, index: itemCount > 0 ? index % itemCount : 0 };
}
