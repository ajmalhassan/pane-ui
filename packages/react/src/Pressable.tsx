"use client";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { usePressTilt } from "./usePressTilt.js";
export type PressableProps = ComponentPropsWithoutRef<"button">;
/** Native button: keyboard activation, form ownership, and disabled semantics stay native. */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  function Pressable({ type = "button", className = "", ...props }, ref) {
    const tilt = usePressTilt<HTMLButtonElement>(props, props.disabled);
    return (
      <button
        {...props}
        {...tilt}
        type={type}
        ref={ref}
        className={`wp-pressable ${className}`}
      />
    );
  },
);
