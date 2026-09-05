"use client";

import {
  useMemo,
  type ButtonHTMLAttributes,
  type PointerEvent,
  type PointerEventHandler,
} from "react";
import { REDUCED_MOTION_QUERY } from "./useReducedMotion";
import styles from "./Pressable.module.css";

type TiltStyle = CSSStyleDeclaration & {
  "--press-rotate-x"?: string;
  "--press-rotate-y"?: string;
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  intensity?: number;
};

/**
 * The six pointer handlers a tilting surface needs, typed against `HTMLElement`
 * so one bundle serves a `<button>`, an `<a>` and a Next `<Link>` alike -- a
 * handler taking the wider event is assignable wherever the narrower one is
 * asked for.
 */
export type PressTiltHandlers = {
  onPointerCancel: PointerEventHandler<HTMLElement>;
  onPointerDown: PointerEventHandler<HTMLElement>;
  onPointerEnter: PointerEventHandler<HTMLElement>;
  onPointerLeave: PointerEventHandler<HTMLElement>;
  onPointerMove: PointerEventHandler<HTMLElement>;
  onPointerUp: PointerEventHandler<HTMLElement>;
};

/** Degrees of tilt at the far edge of a pressed surface. */
export const PRESS_TILT_INTENSITY = 4;

/**
 * The rectangle each tilting surface is currently measured against.
 *
 * A tilt is a point expressed as a fraction of a box, so every write needs the
 * box -- and `getBoundingClientRect()` forces layout. Measuring on every mouse
 * move made the cheapest gesture on the site the most expensive one, so the box
 * is taken once when a hover or a press *begins* and reused until it ends.
 *
 * A WeakMap rather than a dataset field or an expando: the entry disappears
 * with the element, so a surface React unmounted mid-press leaks nothing, and
 * nothing about the cache is visible in the DOM.
 */
const pressBoxes = new WeakMap<Element, DOMRect>();

function prefersReducedMotion(): boolean {
  return matchMedia(REDUCED_MOTION_QUERY).matches;
}

function measure(target: HTMLElement): DOMRect {
  const box = target.getBoundingClientRect();
  pressBoxes.set(target, box);
  return box;
}

function writeTilt<T extends HTMLElement>(
  event: PointerEvent<T>,
  intensity: number,
  box: DOMRect,
): void {
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

/**
 * Releases the tilt and drops the cached box.
 *
 * Exported because it is the one half of the contract a consumer sometimes has
 * to call by hand; the rest reaches surfaces through `pressTiltHandlers`.
 */
export function clearPressTilt<T extends HTMLElement>(
  event: PointerEvent<T>,
): void {
  pressBoxes.delete(event.currentTarget);
  event.currentTarget.style.removeProperty("--press-rotate-x");
  event.currentTarget.style.removeProperty("--press-rotate-y");
}

/**
 * The tilt contract, as the props a surface spreads.
 *
 * Written once and shared by every surface that presses -- `Pressable`, the
 * application bar's anchor and button commands, and the navigation tile, which
 * is a real `<Link>` and so cannot be a `Pressable`. There is deliberately no
 * second copy of the maths anywhere.
 *
 * The model:
 *
 *  - **`pointerdown` tilts for every pointer type, touch included.** A finger
 *    presses a tile at a point and the tile leans away from that point, exactly
 *    as a mouse press does. This is the parity the previous version lacked: it
 *    declined touch outright, so half the readers of a phone-shaped design got
 *    no press feedback at all.
 *  - **`pointermove` tilts for mouse and pen only.** Those pointers have a
 *    hover phase, so the surface can lean under a cursor that has not pressed
 *    anything. A touch pointer that is moving is a scroll in progress; tilting
 *    under it would fight the gesture.
 *  - **`pointerenter` measures and caches**, so the hover moves that follow
 *    cost no layout.
 *  - **`pointerup`, `pointercancel` and `pointerleave` release**, and drop the
 *    cached box with the tilt. A mouse still hovering re-tilts on its very next
 *    move.
 *
 * Reduced motion gates the *style writes* and nothing else: a consumer's own
 * `onPointerDown` / `onPointerMove` / `onPointerEnter` -- a live tile pausing
 * its cycle, say -- has nothing to do with tilt and still runs on the touch and
 * reduced-motion paths. `Pressable` composes those; a surface that spreads this
 * bundle directly has none to compose.
 */
export function pressTiltHandlers(
  intensity: number = PRESS_TILT_INTENSITY,
): PressTiltHandlers {
  return {
    onPointerCancel: clearPressTilt,
    onPointerDown(event) {
      if (prefersReducedMotion()) return;
      // Measured fresh rather than read from the cache a hover may have left:
      // the page can have scrolled under a still-hovering pointer, and a tilt
      // computed against yesterday's rectangle leans the wrong way.
      writeTilt(event, intensity, measure(event.currentTarget));
    },
    onPointerEnter(event) {
      if (event.pointerType === "touch" || prefersReducedMotion()) return;
      measure(event.currentTarget);
    },
    onPointerLeave: clearPressTilt,
    onPointerMove(event) {
      if (event.pointerType === "touch" || prefersReducedMotion()) return;
      const target = event.currentTarget;
      writeTilt(event, intensity, pressBoxes.get(target) ?? measure(target));
    },
    onPointerUp: clearPressTilt,
  };
}

/**
 * The default-intensity bundle, built once. Every surface but a `Pressable`
 * with a custom `intensity` spreads this exact object, so the handlers are
 * referentially stable across renders.
 */
export const PRESS_TILT = pressTiltHandlers();

/**
 * Runs the consumer's handler first, then ours. Consumer-first is the ordering
 * that matters: whatever the tilt decides -- including deciding to write
 * nothing -- the callback the consumer asked for has already run.
 */
function compose<E>(
  consumer: ((event: E) => void) | undefined,
  own: (event: E) => void,
): (event: E) => void {
  if (!consumer) return own;

  return (event: E) => {
    consumer(event);
    own(event);
  };
}

export function Pressable({
  intensity = PRESS_TILT_INTENSITY,
  className = "",
  onPointerCancel,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  onPointerUp,
  ...props
}: Props) {
  // Six closures per render for a prop no consumer passes yet: the singleton
  // covers the default, and the memo covers whatever asks for its own lean.
  const tilt = useMemo(
    () =>
      intensity === PRESS_TILT_INTENSITY
        ? PRESS_TILT
        : pressTiltHandlers(intensity),
    [intensity],
  );

  return (
    <button
      {...props}
      className={`${styles.pressable} ${className}`}
      onPointerCancel={compose(onPointerCancel, tilt.onPointerCancel)}
      onPointerDown={compose(onPointerDown, tilt.onPointerDown)}
      onPointerEnter={compose(onPointerEnter, tilt.onPointerEnter)}
      onPointerLeave={compose(onPointerLeave, tilt.onPointerLeave)}
      onPointerMove={compose(onPointerMove, tilt.onPointerMove)}
      onPointerUp={compose(onPointerUp, tilt.onPointerUp)}
    />
  );
}
