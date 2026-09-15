"use client";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
export interface ThemeProps extends ComponentPropsWithoutRef<"div"> {
  mode?: "dark" | "light" | "system";
  accent?: "blue" | "violet" | "magenta" | "orange" | "green";
}
export const Theme = forwardRef<HTMLDivElement, ThemeProps>(function Theme(
  { mode = "dark", accent = "blue", className = "", ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={`wp-theme ${className}`}
      data-mode={mode}
      data-accent={accent}
    />
  );
});
