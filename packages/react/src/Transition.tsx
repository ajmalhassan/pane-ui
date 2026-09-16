"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";

export type TransitionPreset = "turnstile" | "slide" | "continuum" | "fade";
export type TransitionDirection = "forward" | "backward";
export interface TransitionProps extends HTMLAttributes<HTMLDivElement> {
  show: boolean;
  preset?: TransitionPreset;
  direction?: TransitionDirection;
  /** Duration in milliseconds. Zero disables motion. */
  duration?: number;
  onEntered?: () => void;
  onExited?: () => void;
}

type Phase = "entering" | "entered" | "exiting" | "exited";
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function endpoint(
  preset: TransitionPreset,
  direction: TransitionDirection,
  entering: boolean,
): Keyframe {
  const sign = (direction === "forward" ? 1 : -1) * (entering ? 1 : -1);
  switch (preset) {
    case "turnstile":
      return {
        opacity: 0,
        transform: `perspective(1200px) rotateY(${sign * 78}deg)`,
      };
    case "slide":
      return { opacity: 0, transform: `translateX(${sign * 48}px)` };
    case "continuum":
      return {
        opacity: 0,
        transform: `translateY(${sign * 32}px) scale(${sign > 0 ? 0.92 : 1.06})`,
      };
    case "fade":
      return { opacity: 0, transform: "none" };
  }
}

/** Router-independent presence. Initial visible content is immediately readable. */
export const Transition = forwardRef<HTMLDivElement, TransitionProps>(
  function Transition(
    {
      show,
      preset = "turnstile",
      direction = "forward",
      duration = 260,
      onEntered,
      onExited,
      children,
      className,
      ...props
    },
    forwardedRef,
  ) {
    const node = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<{ target: boolean; phase: Phase }>(
      () => ({ target: show, phase: show ? "entered" : "exited" }),
    );
    // Synchronize during render so a closing subtree becomes inert in the same commit.
    if (state.target !== show)
      setState({ target: show, phase: show ? "entering" : "exiting" });
    const { phase } = state;
    const snapshot = useRef<Keyframe | null>(null);
    const completion = useRef<{ target: boolean; phase: Phase } | null>(null);
    const callbacks = useRef({ onEntered, onExited });
    useBrowserLayoutEffect(() => {
      callbacks.current = { onEntered, onExited };
    });
    useImperativeHandle(forwardedRef, () => node.current!, []);

    useBrowserLayoutEffect(() => {
      const pending = completion.current;
      completion.current = null;
      if (pending?.target !== show || pending.phase !== phase) return;
      (phase === "entered"
        ? callbacks.current.onEntered
        : callbacks.current.onExited)?.();
    }, [phase, show]);

    useBrowserLayoutEffect(() => {
      const element = node.current;
      if (!element || (phase !== "entering" && phase !== "exiting")) return;
      let current = true;
      let completed = false;
      let animation: Animation | undefined;
      const entering = phase === "entering";
      const preference =
        typeof window.matchMedia === "function"
          ? window.matchMedia("(prefers-reduced-motion: reduce)")
          : null;
      const settle = () => {
        if (!current || completed) return;
        completed = true;
        snapshot.current = null;
        // Retain the final frame until the hidden/entered DOM commit.
        // The layout-effect cleanup then releases fill ownership safely.
        const finalState = {
          target: show,
          phase: entering ? ("entered" as const) : ("exited" as const),
        };
        completion.current = finalState;
        setState(finalState);
      };
      const onPreferenceChange = () => {
        if (preference?.matches) settle();
      };
      preference?.addEventListener?.("change", onPreferenceChange);
      const milliseconds = Number.isFinite(duration)
        ? Math.max(0, duration)
        : 260;
      if (
        preference?.matches ||
        milliseconds === 0 ||
        typeof element.animate !== "function"
      ) {
        settle();
      } else {
        const visible: Keyframe = { opacity: 1, transform: "none" };
        const from =
          snapshot.current ??
          (entering ? endpoint(preset, direction, true) : visible);
        // Own the origin in the effect so a direction attribute change cannot
        // move an interrupted turnstile before its displayed frame is sampled.
        const transformOrigin =
          from.transformOrigin ??
          ((direction === "forward") === entering
            ? "left center"
            : "right center");
        snapshot.current = null;
        try {
          animation = element.animate(
            [
              { ...from, transformOrigin },
              {
                ...(entering ? visible : endpoint(preset, direction, false)),
                transformOrigin,
              },
            ],
            {
              duration: milliseconds,
              easing: entering
                ? "cubic-bezier(0.15, 0.7, 0.25, 1)"
                : "cubic-bezier(0.75, 0, 0.85, 0.3)",
              fill: "both",
            },
          );
          // Rejection (including external cancellation) must not strand presence.
          void animation.finished.then(settle, settle);
        } catch {
          settle();
        }
      }
      return () => {
        current = false;
        preference?.removeEventListener?.("change", onPreferenceChange);
        if (animation) {
          if (!completed) {
            // Read while the previous animation still owns the displayed frame.
            const displayed = window.getComputedStyle(element);
            snapshot.current = {
              opacity: displayed.opacity,
              transform: displayed.transform,
              transformOrigin: displayed.transformOrigin,
            };
          }
          animation.cancel();
        }
      };
    }, [phase, show, preset, direction, duration]);

    const unavailable = !show || phase === "exited";
    return (
      <div
        {...props}
        ref={node}
        className={["wp-transition", className].filter(Boolean).join(" ")}
        data-state={phase}
        data-preset={preset}
        data-direction={direction}
        hidden={phase === "exited" || props.hidden}
        inert={unavailable || props.inert}
        aria-hidden={unavailable ? true : props["aria-hidden"]}
      >
        {phase !== "exited" ? children : null}
      </div>
    );
  },
);
