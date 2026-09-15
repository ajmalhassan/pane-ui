"use client";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";

type NativeProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "children" | "role" | "aria-valuenow" | "aria-valuemin" | "aria-valuemax"
>;
export type ProgressDotsProps = NativeProps &
  ({ decorative: true; label?: never } | { decorative?: false; label: string });
/** Indeterminate activity. Decorative mode is for an already-labelled busy control. */
export const ProgressDots = forwardRef<HTMLSpanElement, ProgressDotsProps>(
  function ProgressDots(
    { decorative = false, label, className = "", ...props },
    ref,
  ) {
    return (
      <span
        {...props}
        ref={ref}
        className={`wp-progress-dots ${className}`}
        role={decorative ? undefined : "progressbar"}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative ? true : props["aria-hidden"]}
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className="wp-progress-dot"
            aria-hidden="true"
            style={{ "--wp-dot-index": index } as CSSProperties}
          />
        ))}
      </span>
    );
  },
);
