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

export interface BackButtonProps
  extends Omit<IconButtonProps, "icon" | "label" | "variant"> {
  /** Localize or describe the destination. Defaults to "Back". */
  label?: string;
}
/** Circular navigation command. The application owns history and navigation. */
export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
  function BackButton({ label = "Back", className = "", ...props }, ref) {
    return (
      <IconButton
        {...props}
        ref={ref}
        label={label}
        className={`wp-back-button ${className}`}
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            focusable="false"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M17.5 11.2H8.9l3.5-3.5-1.1-1.1L5.9 12l5.4 5.4 1.1-1.1-3.5-3.5h8.6v-1.6Z"
              fill="currentColor"
            />
          </svg>
        }
      />
    );
  },
);
