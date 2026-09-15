"use client";
import { useEffect, useState } from "react";
/** Start paused for hydration; only start the clock after reading client preferences. */
export function useEnvironment() {
  const [environment, setEnvironment] = useState({
    reduced: true,
    hidden: true,
  });
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () =>
      setEnvironment({
        reduced: media?.matches ?? false,
        hidden: document.hidden,
      });
    update();
    media?.addEventListener?.("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      media?.removeEventListener?.("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return environment;
}
