"use client";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { ProgressDots } from "./ProgressDots.js";
import { usePressTilt } from "./usePressTilt.js";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "outlined" | "accent" | "subtle";
  /** Keeps focus and the accessible name while blocking repeated activation. */
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      type = "button",
      variant = "outlined",
      loading = false,
      disabled,
      className = "",
      children,
      onClick,
      ...props
    },
    ref,
  ) {
    const tilt = usePressTilt<HTMLButtonElement>(props, disabled || loading);
    return (
      <button
        {...props}
        {...tilt}
        ref={ref}
        type={type}
        disabled={disabled}
        className={`wp-pressable wp-button ${className}`}
        data-variant={variant}
        data-loading={loading || undefined}
        aria-busy={loading || props["aria-busy"]}
        aria-disabled={loading || props["aria-disabled"]}
        onClick={(event) => {
          if (loading) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClick?.(event);
        }}
      >
        {children}
        {loading && <ProgressDots decorative className="wp-button-progress" />}
      </button>
    );
  },
);
export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  label: string;
  icon: ReactNode;
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, icon, className = "", ...props }, ref) {
    return (
      <Button
        {...props}
        ref={ref}
        className={`wp-icon-button ${className}`}
        aria-label={props["aria-label"] ?? label}
        title={props.title ?? label}
      >
        <span aria-hidden="true">{icon}</span>
      </Button>
    );
  },
);
