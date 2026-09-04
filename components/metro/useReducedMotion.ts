"use client";

import { useEffect, useState } from "react";

/**
 * The one spelling of the reduced-motion query in this package. `Pressable`
 * asks it imperatively inside a pointer handler and this hook asks it
 * reactively; both must mean the same thing, so neither owns a literal.
 */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reduced motion is read in JavaScript as well as in the stylesheet: the
 * stylesheet keeps no-JS and pre-hydration renders honest, and this lets a
 * component choose a different mechanism -- hiding a face outright instead of
 * rotating it away -- rather than merely neutralising a transform.
 *
 * Package-internal: nothing outside `components/metro` consumes it, so it is
 * deliberately absent from the barrel.
 */
export function useReducedMotion(): boolean {
  // The server cannot know the preference, so the first client render has to
  // agree with the markup it is hydrating and correct itself afterwards.
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduced(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}
