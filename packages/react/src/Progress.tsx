"use client";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import { ProgressDots } from "./ProgressDots.js";

type ProgressNativeProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "children" | "role" | "aria-valuemin" | "aria-valuemax" | "aria-valuenow"
>;
export type ProgressProps = ProgressNativeProps & {
  /** Omit for indeterminate activity. Nonfinite values are also indeterminate. */
  value?: number;
  /** Positive finite maximum; defaults to 100 for missing or invalid values. */
  max?: number;
} & (
    | { decorative: true; label?: never }
    | { decorative?: false; label: string }
  );
export type ProgressRingProps = ProgressProps & {
  size?: "small" | "medium" | "large";
};

/** One normalized value feeds both the visual and accessibility representations. */
function progressState(value: number | undefined, maximum: number) {
  const max = Number.isFinite(maximum) && maximum > 0 ? maximum : 100;
  const current =
    value !== undefined && Number.isFinite(value)
      ? Math.min(max, Math.max(0, value))
      : undefined;
  return {
    max,
    current,
    fraction: current === undefined ? undefined : current / max,
  };
}
function progressAttributes(
  decorative: boolean,
  label: string | undefined,
  state: ReturnType<typeof progressState>,
) {
  return {
    role: decorative ? undefined : "progressbar",
    "aria-label": decorative ? undefined : label,
    "aria-hidden": decorative ? true : undefined,
    "aria-valuemin": decorative ? undefined : 0,
    "aria-valuemax": decorative ? undefined : state.max,
    "aria-valuenow": decorative ? undefined : state.current,
    "data-indeterminate": state.current === undefined || undefined,
  } as const;
}
export const Progress = forwardRef<HTMLSpanElement, ProgressProps>(
  function Progress(
    { value, max = 100, decorative = false, label, className = "", ...props },
    ref,
  ) {
    const state = progressState(value, max);
    return (
      <span
        {...props}
        {...progressAttributes(decorative, label, state)}
        aria-hidden={decorative ? true : props["aria-hidden"]}
        ref={ref}
        className={`wp-progress ${className}`}
      >
        {state.fraction === undefined ? (
          <ProgressDots decorative />
        ) : (
          <span className="wp-progress-track" aria-hidden="true">
            <span
              className="wp-progress-fill"
              style={{ width: `${state.fraction * 100}%` }}
            />
          </span>
        )}
      </span>
    );
  },
);
export const ProgressRing = forwardRef<HTMLSpanElement, ProgressRingProps>(
  function ProgressRing(
    {
      value,
      max = 100,
      decorative = false,
      label,
      size = "medium",
      className = "",
      ...props
    },
    ref,
  ) {
    const state = progressState(value, max);
    return (
      <span
        {...props}
        {...progressAttributes(decorative, label, state)}
        aria-hidden={decorative ? true : props["aria-hidden"]}
        ref={ref}
        className={`wp-progress-ring ${className}`}
        data-size={size}
      >
        <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          {state.fraction === undefined ? (
            [0, 1, 2, 3, 4].map((index) => (
              <g
                className="wp-ring-orbit"
                key={index}
                style={{ "--wp-orbit-index": index } as CSSProperties}
              >
                <circle cx="24" cy="5" r="2" fill="currentColor" />
              </g>
            ))
          ) : (
            <>
              <circle
                className="wp-ring-track"
                cx="24"
                cy="24"
                r="20"
                fill="none"
                strokeWidth="3"
              />
              <circle
                className="wp-ring-value"
                cx="24"
                cy="24"
                r="20"
                fill="none"
                strokeWidth="3"
                pathLength="100"
                strokeDasharray={`${state.fraction * 100} 100`}
                transform="rotate(-90 24 24)"
              />
            </>
          )}
        </svg>
      </span>
    );
  },
);
