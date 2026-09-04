"use client";

import { useEffect, useState } from "react";

/**
 * True while this document can actually be looked at. A tile in a backgrounded
 * tab has no reader, so it stops spending timers.
 *
 * Package-internal: nothing outside `components/metro` consumes it, so it is
 * deliberately absent from the barrel.
 */
export function useDocumentVisible(): boolean {
  // The server has no visibility state, so the first client render assumes the
  // document is visible -- matching the markup it hydrates -- and corrects
  // itself in the effect below.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sync = () => setVisible(!document.hidden);

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return visible;
}
