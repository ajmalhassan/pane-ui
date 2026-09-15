"use client";

import {
  Children,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
} from "react";

export interface StaggerProps extends HTMLAttributes<HTMLDivElement> {
  show: boolean;
  /** Entrance spacing in milliseconds; cumulative delay is capped at 240ms. */
  interval?: number;
}

/** Keyed wrappers preserve child identity. Hiding is immediate; entrances stagger. */
export const Stagger = forwardRef<HTMLDivElement, StaggerProps>(
  function Stagger(
    { show, interval = 35, children, className, ...props },
    ref,
  ) {
    const spacing = Number.isFinite(interval) ? Math.max(0, interval) : 35;
    return (
      <div
        {...props}
        ref={ref}
        className={["wp-stagger", className].filter(Boolean).join(" ")}
        data-show={show}
        hidden={!show || props.hidden}
        inert={!show || props.inert}
        aria-hidden={!show ? true : props["aria-hidden"]}
      >
        {Children.toArray(children).map((child, index) => (
          <div
            key={isValidElement(child) ? child.key : index}
            className="wp-stagger-item"
            style={
              {
                "--wp-stagger-delay": `${Math.min(index * spacing, 240)}ms`,
              } as CSSProperties
            }
          >
            {child}
          </div>
        ))}
      </div>
    );
  },
);
