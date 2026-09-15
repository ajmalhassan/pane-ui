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
  /** Layer group motion with a tile wave by default. */
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
      duration = 260,
      interval = 40,
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
      // Separate identities prevent an item named "group" from sharing a snapshot
      // with the parent surface. Each layer owns its cancellation and transform.
      const tracks = [
        ...(mode !== "individual" && ids.length
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
        animations.forEach(({ animation }) => animation.cancel());
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
        : 260;
      const spacing = Math.min(
        Number.isFinite(interval) ? Math.max(0, interval) : 40,
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
            (mode !== "individual" || entering ? 1 : -1);
          const hidden: Keyframe = {
            opacity: layered && group ? 1 : 0,
            transform:
              layered && group
                ? `perspective(1200px) translateX(${sign * -8}%) rotateY(${sign * 10}deg)`
                : `perspective(1200px) rotateY(${sign * 78}deg)`,
          };
          const from = sampled ?? (entering ? hidden : visible);
          const transformOrigin =
            from.transformOrigin ??
            (direction === "forward" ? "left center" : "right center");
          try {
            const animation = element.animate(
              [
                { ...from, transformOrigin },
                { ...(entering ? visible : hidden), transformOrigin },
              ],
              {
                duration:
                  milliseconds +
                  (layered && group
                    ? spacing * Math.max(0, tileOrder.length - 1)
                    : 0),
                // Interrupted frames move immediately; replaying their old stagger
                // would freeze partially turned tiles at the reversal point.
                delay: sampled || group ? 0 : Math.min(240, index * spacing),
                easing:
                  layered && !entering
                    ? "cubic-bezier(0.55, 0, 0.85, 0.35)"
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
