"use client";

import type { ButtonHTMLAttributes, PointerEvent } from "react";
import styles from "./Pressable.module.css";

type TiltStyle = CSSStyleDeclaration & {
  "--press-rotate-x"?: string;
  "--press-rotate-y"?: string;
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  intensity?: number;
};

/** Degrees of tilt at the far edge of a pressed surface. */
export const PRESS_TILT_INTENSITY = 4;

/**
 * Writes the tilt variables that `.pressable` in Pressable.module.css reads.
 * Exported so surfaces that cannot be a `<button>` -- an app-bar command is a
 * real anchor -- share this contract instead of owning a second copy of it.
 * Touch and reduced motion both opt out here, keeping the touch opt-out
 * policy in one place (touch parity itself is Task 9's).
 *
 * Package-internal: shared by Pressable and AppBar; not re-exported from the
 * barrel on purpose.
 */
export function applyPressTilt<T extends HTMLElement>(
  event: PointerEvent<T>,
  intensity: number = PRESS_TILT_INTENSITY,
): void {
  if (
    event.pointerType === "touch" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const box = event.currentTarget.getBoundingClientRect();

  // An unlaid-out or hidden surface measures 0, and dividing by it writes
  // `Infinitydeg` (or `NaNdeg` dead on the origin) into the custom properties --
  // values the browser discards, leaving whatever tilt was there before. A box
  // with no area has no tilt to express, so write nothing.
  if (box.width === 0 || box.height === 0) {
    return;
  }

  const x = (event.clientX - box.left) / box.width - 0.5;
  const y = (event.clientY - box.top) / box.height - 0.5;
  const style = event.currentTarget.style as TiltStyle;
  style.setProperty("--press-rotate-x", `${-y * intensity}deg`);
  style.setProperty("--press-rotate-y", `${x * intensity}deg`);
}

/** Releases the tilt written by `applyPressTilt`. */
export function clearPressTilt<T extends HTMLElement>(event: PointerEvent<T>): void {
  event.currentTarget.style.removeProperty("--press-rotate-x");
  event.currentTarget.style.removeProperty("--press-rotate-y");
}

export function Pressable({
  intensity = PRESS_TILT_INTENSITY,
  className = "",
  onPointerMove,
  onPointerLeave,
  ...props
}: Props) {
  function move(event: PointerEvent<HTMLButtonElement>) {
    onPointerMove?.(event);
    applyPressTilt(event, intensity);
  }

  function leave(event: PointerEvent<HTMLButtonElement>) {
    clearPressTilt(event);
    onPointerLeave?.(event);
  }

  return <button {...props} className={`${styles.pressable} ${className}`} onPointerMove={move} onPointerLeave={leave} />;
}
