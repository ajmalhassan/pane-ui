"use client";

import { useCallback, useEffect, useState } from "react";

type Options = {
  /** Milliseconds a claim stays on screen before the next one replaces it. */
  intervalMs: number;
  /** True while a reader is looking at this tile -- hover or keyboard focus. */
  paused: boolean;
  /** False while nothing can be seen, e.g. a backgrounded document. */
  enabled: boolean;
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
  { intervalMs, paused, enabled }: Options,
): LiveCycle {
  const [index, setIndex] = useState(0);
  // Bumping this restarts the interval effect. A reader who advanced the tile
  // by hand has just seen the new claim, so they are owed a whole interval
  // before it is replaced -- not whatever was left of the running one.
  const [restarts, setRestarts] = useState(0);

  const advance = useCallback(() => {
    setIndex((current) => (itemCount > 0 ? (current + 1) % itemCount : 0));
    setRestarts((current) => current + 1);
  }, [itemCount]);

  useEffect(() => {
    // One claim cannot cycle, and a tile nobody can see must not burn a timer.
    if (itemCount <= 1 || paused || !enabled) {
      return;
    }

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % itemCount);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, intervalMs, itemCount, paused, restarts]);

  // A shorter evidence set must not leave the tile pointing past its own end,
  // and it must not cost a render to correct.
  return { advance, index: itemCount > 0 ? index % itemCount : 0 };
}
