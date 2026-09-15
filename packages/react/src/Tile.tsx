"use client";
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useImperativeHandle,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { usePressTilt } from "./usePressTilt.js";
import { Pressable } from "./Pressable.js";
import { useEnvironment } from "./useEnvironment.js";
export interface TileAppearance {
  label: ReactNode;
  size?: "small" | "wide" | "large" | "hero";
  accent?: "accent" | "subtle" | "strong";
}
export interface TileProps
  extends ComponentPropsWithoutRef<"div">,
    TileAppearance {}
export interface TileLinkProps
  extends ComponentPropsWithoutRef<"a">,
    TileAppearance {}
const tileClass = (className: string) => `wp-tile ${className}`;
function TileContent({
  label,
  children,
}: {
  label: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <span className="wp-tile-content">{children}</span>{" "}
      <span className="wp-tile-label">{label}</span>
    </>
  );
}
export const Tile = forwardRef<HTMLDivElement, TileProps>(function Tile(
  {
    label,
    size = "small",
    accent = "accent",
    children,
    className = "",
    ...props
  },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={tileClass(className)}
      data-size={size}
      data-accent={accent}
    >
      <TileContent label={label}>{children}</TileContent>
    </div>
  );
});
export const TileLink = forwardRef<HTMLAnchorElement, TileLinkProps>(
  function TileLink(
    {
      label,
      size = "small",
      accent = "accent",
      children,
      className = "",
      ...props
    },
    ref,
  ) {
    const tilt = usePressTilt<HTMLAnchorElement>(props);
    return (
      <a
        {...props}
        {...tilt}
        ref={ref}
        className={tileClass(`wp-pressable ${className}`)}
        data-size={size}
        data-accent={accent}
      >
        <TileContent label={label}>{children}</TileContent>
      </a>
    );
  },
);
export interface RevealTileProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children">,
    TileAppearance {
  front: ReactNode;
  back: ReactNode;
  revealed?: boolean;
  defaultRevealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
}
/** Faces must contain presentational content, because the owner is a native button. */
export const RevealTile = forwardRef<HTMLButtonElement, RevealTileProps>(
  function RevealTile(
    {
      label,
      size = "small",
      accent = "accent",
      front,
      back,
      revealed,
      defaultRevealed = false,
      onRevealedChange,
      onClick,
      className = "",
      ...props
    },
    ref,
  ) {
    const [internal, setInternal] = useState(defaultRevealed);
    const open = revealed ?? internal;
    const id = useId();
    return (
      <Pressable
        {...props}
        ref={ref}
        className={tileClass(`wp-reveal-tile ${className}`)}
        data-size={size}
        data-accent={accent}
        data-revealed={open}
        aria-pressed={open}
        aria-labelledby={
          props["aria-labelledby"] ??
          (props["aria-label"] ? undefined : `${id}-label`)
        }
        aria-describedby={[
          `${id}-${open ? "back" : "front"}`,
          props["aria-describedby"],
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          if (revealed === undefined) setInternal(!open);
          onRevealedChange?.(!open);
        }}
      >
        <span className="wp-reveal-faces">
          <span
            id={`${id}-front`}
            className="wp-reveal-front"
            aria-hidden={open}
          >
            {front}
          </span>
          <span
            id={`${id}-back`}
            className="wp-reveal-back"
            aria-hidden={!open}
          >
            {back}
          </span>
        </span>{" "}
        <span id={`${id}-label`} className="wp-tile-label">
          {label}
        </span>
      </Pressable>
    );
  },
);
export interface LiveTileProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children">,
    TileAppearance {
  items: readonly ReactNode[];
  accessibleLabel: string;
  intervalMs?: number;
  paused?: boolean;
  defaultPaused?: boolean;
  onPausedChange?: (paused: boolean) => void;
}
/** Provide a stable summary in accessibleLabel. Items are decorative; use plain presentational content. */
export const LiveTile = forwardRef<HTMLDivElement, LiveTileProps>(
  function LiveTile(
    {
      label,
      size = "wide",
      accent = "accent",
      items,
      accessibleLabel,
      intervalMs = 5000,
      paused,
      defaultPaused = false,
      onPausedChange,
      className = "",
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) {
    const [internalPaused, setInternalPaused] = useState(defaultPaused);
    const [index, setIndex] = useState(0);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const { reduced, hidden } = useEnvironment();
    const stopped = paused ?? internalPaused;
    const count = items.length;
    const root = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => root.current!, []);
    useEffect(() => {
      // Removing a focused control does not reliably emit blur.
      setFocused(Boolean(root.current?.contains(document.activeElement)));
    }, [count]);
    const current = count ? index % count : 0;
    const controlName = typeof label === "string" ? label : accessibleLabel;
    const delay = Number.isFinite(intervalMs)
      ? Math.max(1000, intervalMs)
      : 5000;
    useEffect(() => {
      if (stopped || reduced || hidden || hovered || focused || count < 2)
        return;
      const timer = window.setInterval(
        () => setIndex((value) => (value + 1) % count),
        delay,
      );
      return () => window.clearInterval(timer);
    }, [stopped, reduced, hidden, hovered, focused, count, delay]);
    return (
      <div
        {...props}
        ref={root}
        className={tileClass(`wp-live-tile ${className}`)}
        data-size={size}
        data-accent={accent}
        data-paused={stopped || reduced || hidden || hovered || focused}
        onMouseEnter={(event) => {
          onMouseEnter?.(event);
          setHovered(true);
        }}
        onMouseLeave={(event) => {
          onMouseLeave?.(event);
          setHovered(false);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          setFocused(true);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocused(false);
        }}
      >
        <div className="wp-live-visual" role="img" aria-label={accessibleLabel}>
          <span aria-hidden="true" className="wp-live-frame" key={current}>
            {items[current]}
          </span>
        </div>
        <div className="wp-live-footer">
          <span className="wp-tile-label">{label}</span>
          {count > 1 && (
            <div className="wp-live-controls">
              <Pressable
                aria-label={`${stopped ? "Resume" : "Pause"} ${controlName}`}
                aria-pressed={stopped}
                onClick={() => {
                  if (paused === undefined) setInternalPaused(!stopped);
                  onPausedChange?.(!stopped);
                }}
              >
                {stopped ? "▶" : "Ⅱ"}
              </Pressable>
              <Pressable
                aria-label={`Next ${controlName}`}
                onClick={() => setIndex((value) => (value + 1) % count)}
              >
                →
              </Pressable>
            </div>
          )}
        </div>
      </div>
    );
  },
);
