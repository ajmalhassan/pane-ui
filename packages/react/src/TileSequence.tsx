"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type { TileAppearance } from "./Tile.js";

export interface TileSequenceItem {
  /** Stable, unique identity, preserved when tiles reorder. */
  id: string;
  content: ReactNode;
  size?: TileAppearance["size"];
}
export interface TileSequenceProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  items: readonly TileSequenceItem[];
  show: boolean;
  /** A tile wave in a shared perspective by default. */
  mode?: "layered" | "group" | "individual";
  /** Used only by individual mode. */
  selectedId?: string;
  duration?: number;
  interval?: number;
  direction?: "forward" | "backward";
  onEntered?: () => void;
  onExited?: () => void;
}
type Phase = "entered" | "entering" | "exiting" | "exited";
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
const visible: Keyframe = { opacity: 1, transform: "none" };

/** Coordinated presence; focus and navigation remain controlled by the owner. */
export const TileSequence = forwardRef<HTMLDivElement, TileSequenceProps>(
  function TileSequence(
    {
      items,
      show,
      selectedId,
      mode = "layered",
      duration = mode === "layered" ? 220 : 260,
      interval = mode === "layered" ? 33 : 40,
      direction = "forward",
      onEntered,
      onExited,
      className,
      ...props
    },
    forwardedRef,
  ) {
    const root = useRef<HTMLDivElement>(null);
    const nodes = useRef(new Map<string, HTMLDivElement>());
    const snapshots = useRef(new Map<string, Keyframe>());
    const [state, setState] = useState<{ target: boolean; phase: Phase }>(
      () => ({ target: show, phase: show ? "entered" : "exited" }),
    );
    if (state.target !== show)
      setState({ target: show, phase: show ? "entering" : "exiting" });
    const { phase } = state;
    const completion = useRef<{ target: boolean; phase: Phase } | null>(null);
    const callbacks = useRef({ onEntered, onExited });
    // Content-only renders do not restart a run. Structural changes do, using
    // sampled frames for surviving wrappers and fresh frames for new ones.
    const identities = JSON.stringify(items.map((item) => item.id));
    useImperativeHandle(forwardedRef, () => root.current!, []);
    useBrowserLayoutEffect(() => {
      callbacks.current = { onEntered, onExited };
    });
    useBrowserLayoutEffect(() => {
      const pending = completion.current;
      completion.current = null;
      if (pending?.target !== show || pending.phase !== phase) return;
      (phase === "entered"
        ? callbacks.current.onEntered
        : callbacks.current.onExited)?.();
    }, [phase, show]);
    useBrowserLayoutEffect(() => {
      if (phase !== "entering" && phase !== "exiting") return;
      const entering = phase === "entering";
      const ids: string[] = JSON.parse(identities);
      const tileOrder = entering
        ? ids
        : mode === "layered"
          ? [...ids].reverse()
          : [
              ...ids.filter((id) => id !== selectedId),
              ...ids.filter((id) => id === selectedId),
            ];
      // Group-only mode owns the root. Layered mode projects each tile through
      // the same camera without moving the upper rows ahead of their wave.
      const tracks = [
        ...(mode === "group" && ids.length
          ? [{ key: "group", element: root.current, index: 0, group: true }]
          : []),
        ...(mode !== "group"
          ? tileOrder.map((id, index) => ({
              key: `tile:${id}`,
              element: nodes.current.get(id),
              index,
              group: false,
            }))
          : []),
      ];
      // Layout coordinates are unaffected by in-flight transforms. The positioned
      // root is the offset parent, so every leaf can address one camera.
      const width = Math.max(1, root.current?.clientWidth ?? 0);
      const height = root.current?.clientHeight ?? 0;
      const perspective = width * 2.45;
      const travel = width * 0.108;
      const animations: {
        id: string;
        element: HTMLDivElement;
        animation: Animation;
      }[] = [];
      let current = true;
      let completed = false;
      const preference =
        typeof window.matchMedia === "function"
          ? window.matchMedia("(prefers-reduced-motion: reduce)")
          : null;
      const settle = () => {
        if (!current || completed) return;
        completed = true;
        snapshots.current.clear();
        // Keep fill ownership until the terminal DOM commit. Canceling here
        // exposes the resting tiles while React is still scheduling that commit.
        // The layout-effect cleanup releases the animations after it is safe.
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
        : mode === "layered"
          ? 220
          : 260;
      const spacing = Math.min(
        Number.isFinite(interval)
          ? Math.max(0, interval)
          : mode === "layered"
            ? 33
            : 40,
        240 / Math.max(1, tileOrder.length - 1),
      );
      if (!tracks.length || preference?.matches || milliseconds === 0) settle();
      else {
        const promises: Promise<unknown>[] = [];
        for (const { key: id, element, index, group } of tracks) {
          if (!element || typeof element.animate !== "function") continue;
          const sampled = snapshots.current.get(id);
          const layered = mode === "layered";
          const sign =
            (direction === "forward" ? 1 : -1) *
            (layered
              ? entering
                ? -1
                : 1
              : mode !== "individual" || entering
                ? 1
                : -1);
          const hidden: Keyframe = {
            opacity: 0,
            transform: layered
              ? `perspective(${perspective}px) translateX(${-sign * travel}px) rotateY(${-sign * 88}deg)`
              : `perspective(1200px) rotateY(${sign * 78}deg)`,
          };
          // Keep matching transform lists at both endpoints. Interpolating from
          // "none" can take a different matrix decomposition path across engines.
          const resting: Keyframe = layered
            ? {
                opacity: 1,
                transform: `perspective(${perspective}px) translateX(0px) rotateY(0deg)`,
              }
            : visible;
          const from = sampled ?? (entering ? hidden : resting);
          const transformOrigin =
            from.transformOrigin ??
            (layered
              ? `${(sign > 0 ? 0 : width) - element.offsetLeft}px ${height / 2 - element.offsetTop}px`
              : direction === "forward"
                ? "left center"
                : "right center");
          try {
            const animation = element.animate(
              [
                { ...from, transformOrigin },
                { ...(entering ? resting : hidden), transformOrigin },
              ],
              {
                duration: milliseconds,
                // Interrupted frames move immediately; replaying their old stagger
                // would freeze partially turned tiles at the reversal point.
                delay: sampled || group ? 0 : Math.min(240, index * spacing),
                easing: layered
                  ? entering
                    ? "cubic-bezier(0, 0, 0.58, 1)"
                    : "cubic-bezier(0.42, 0, 1, 1)"
                  : "cubic-bezier(0.15, 0.7, 0.25, 1)",
                fill: "both",
              },
            );
            animations.push({ id, element, animation });
            promises.push(animation.finished.catch(() => undefined));
          } catch {
            /* Unsupported effects settle along with the remaining group. */
          }
        }
        snapshots.current.clear();
        if (promises.length) void Promise.all(promises).then(settle);
        else settle();
      }
      return () => {
        current = false;
        preference?.removeEventListener?.("change", onPreferenceChange);
        const next = new Map<string, Keyframe>();
        animations.forEach(({ id, element, animation }) => {
          if (!completed) {
            const displayed = window.getComputedStyle(element);
            next.set(id, {
              opacity: displayed.opacity,
              transform: displayed.transform,
              transformOrigin: displayed.transformOrigin,
            });
          }
          animation.cancel();
        });
        snapshots.current = next;
      };
    }, [
      phase,
      show,
      identities,
      selectedId,
      duration,
      interval,
      direction,
      mode,
    ]);
    const unavailable = !show || phase === "exited";
    return (
      <div
        {...props}
        ref={root}
        className={["wp-tile-grid wp-tile-sequence", className]
          .filter(Boolean)
          .join(" ")}
        data-state={phase}
        data-mode={mode}
        data-direction={direction}
        hidden={phase === "exited" || props.hidden}
        inert={unavailable || props.inert}
        aria-hidden={unavailable ? true : props["aria-hidden"]}
      >
        {phase !== "exited"
          ? items.map((item) => (
              <div
                key={item.id}
                ref={(element) => {
                  if (element) nodes.current.set(item.id, element);
                  else nodes.current.delete(item.id);
                }}
                className="wp-tile-sequence-item"
                data-size={item.size ?? "small"}
              >
                {item.content}
              </div>
            ))
          : null}
      </div>
    );
  },
);
