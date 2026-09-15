"use client";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
export type TileGridProps = ComponentPropsWithoutRef<"div">;
/** CSS grid accepts any direct layout child; wrappers may use data-size for spanning. */
export const TileGrid = forwardRef<HTMLDivElement, TileGridProps>(
  function TileGrid({ className = "", ...props }, ref) {
    return <div {...props} ref={ref} className={`wp-tile-grid ${className}`} />;
  },
);
