"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import s from "./tileArtwork.module.css";

/** Decorative faces only. The enclosing tile keeps a single, stable action. */
export function FlipArtwork({
  front,
  back,
  delay = 0,
  duration = 12,
}: {
  front: ReactNode;
  back: ReactNode;
  delay?: number;
  duration?: number;
}) {
  return (
    <div className={s.scene} data-flip-artwork aria-hidden="true">
      <div
        className={s.rotor}
        style={
          {
            "--flip-delay": `${delay}s`,
            "--flip-duration": `${duration}s`,
          } as CSSProperties
        }
      >
        <div className={s.front}>{front}</div>
        <div className={s.back}>{back}</div>
      </div>
    </div>
  );
}

/** Pause ownership spans the entire composition, including independently phased cells. */
export function TileMotion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visibility = () => setHidden(document.hidden);
    const preference = () => setReduced(media.matches);
    visibility();
    preference();
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", preference);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", preference);
    };
  }, []);
  return (
    <div
      className={className}
      data-tile-motion
      data-paused={paused || hidden || reduced}
    >
      {children}
      <button
        className={s.toggle}
        type="button"
        disabled={reduced}
        onClick={() => setPaused(!paused)}
      >
        {reduced
          ? "Reduced motion is on"
          : paused
            ? "Resume tile flips"
            : "Pause tile flips"}
      </button>
    </div>
  );
}
