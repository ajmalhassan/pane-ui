"use client";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  gestureIntent,
  gestureTarget,
  recentVelocity,
  resistBoundary,
  type MotionSample,
} from "./panoramaMotion.js";
import { useEnvironment } from "./useEnvironment.js";
export interface PanoramaItem {
  id: string;
  label: string;
  children: ReactNode;
}
export interface PanoramaProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  items: readonly PanoramaItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  duration?: number;
  dir?: "ltr" | "rtl";
}
type Gesture = {
  id: number;
  x: number;
  y: number;
  position: number;
  startIndex: number;
  intent: "pending" | "horizontal" | "vertical";
  samples: MotionSample[];
};
/** Finite spatial tabs. Supply aria-label or aria-labelledby to name the tablist. */
export const Panorama = forwardRef<HTMLDivElement, PanoramaProps>(
  function Panorama(
    {
      items,
      value,
      defaultValue,
      onValueChange,
      duration = 420,
      dir = "ltr",
      className = "",
      ...props
    },
    ref,
  ) {
    const [internal, setInternal] = useState(defaultValue ?? items[0]?.id);
    const selected = items.some((item) => item.id === (value ?? internal))
      ? value ?? internal
      : items[0]?.id;
    const index = Math.max(
      0,
      items.findIndex((item) => item.id === selected),
    );
    const [phase, setPhase] = useState<"idle" | "dragging" | "settling">(
      "idle",
    );
    const root = useRef<HTMLDivElement>(null);
    const headings = useRef<HTMLDivElement>(null);
    const surface = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => root.current!, []);
    const uid = useId();
    const initialPosition = useRef(index);
    const position = useRef(index);
    const frame = useRef<number | null>(null);
    const gesture = useRef<Gesture | null>(null);
    const suppress = useRef(false);
    const width = useRef(0);
    const stops = useRef<number[]>([]);
    const { reduced, hidden } = useEnvironment();
    const settings = useRef({
      index,
      reduced,
      hidden,
      duration,
      dir,
      count: items.length,
    });
    settings.current = {
      index,
      reduced,
      hidden,
      duration,
      dir,
      count: items.length,
    };
    const cancel = useCallback(() => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    }, []);
    const release = useCallback(() => {
      const current = gesture.current;
      gesture.current = null;
      if (current && root.current?.hasPointerCapture?.(current.id))
        root.current.releasePointerCapture(current.id);
    }, []);
    const measure = useCallback(() => {
      width.current = surface.current?.getBoundingClientRect().width ?? 0;
      const nodes = Array.from(
        headings.current?.children ?? [],
      ) as HTMLElement[];
      const first = nodes[0];
      stops.current = nodes.map((_, index) => {
        const previous = nodes[index - 1];
        if (!first || !previous) return 0;
        // Keep the trailing part of the previous heading inside the clipped
        // viewport as a real click target. Measure from the reading edge in RTL.
        const previousStart =
          settings.current.dir === "rtl"
            ? first.offsetLeft +
              first.offsetWidth -
              previous.offsetLeft -
              previous.offsetWidth
            : previous.offsetLeft - first.offsetLeft;
        const peek = Math.min(
          previous.offsetWidth,
          Math.max(32, Math.min(64, previous.offsetWidth * 0.42)),
        );
        return Math.max(0, previousStart + previous.offsetWidth - peek);
      });
    }, []);
    const paint = useCallback(() => {
      root.current?.style.setProperty(
        "--wp-panorama-position",
        String(position.current),
      );
      const values = stops.current;
      const i = Math.max(
        0,
        Math.min(values.length - 2, Math.floor(position.current)),
      );
      const offset =
        (values[i] ?? 0) +
        ((values[i + 1] ?? values[i] ?? 0) - (values[i] ?? 0)) *
          (position.current - i);
      headings.current?.style.setProperty(
        "transform",
        `translate3d(${(settings.current.dir === "rtl" ? 1 : -1) * offset}px,0,0)`,
      );
    }, []);
    const finish = useCallback(
      (target: number) => {
        cancel();
        position.current = target;
        paint();
        setPhase("idle");
      },
      [cancel, paint],
    );
    const settle = useCallback(
      (target: number) => {
        cancel();
        measure();
        const s = settings.current;
        const ms = Number.isFinite(s.duration) ? Math.max(0, s.duration) : 420;
        if (
          s.reduced ||
          s.hidden ||
          !ms ||
          !width.current ||
          Math.abs(position.current - target) < 0.0001
        ) {
          finish(target);
          return;
        }
        const from = position.current;
        const start = performance.now();
        setPhase("settling");
        const tick = (time: number) => {
          const t = Math.min(1, Math.max(0, (time - start) / ms));
          position.current = from + (target - from) * (1 - (1 - t) ** 3);
          paint();
          if (t === 1) finish(target);
          else frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
      },
      [cancel, measure, finish, paint],
    );
    const itemKey = JSON.stringify(items.map((item) => item.id));
    const previous = useRef({ index, key: itemKey, dir });
    useLayoutEffect(() => {
      const p = previous.current;
      previous.current = { index, key: itemKey, dir };
      measure();
      if (p.key !== itemKey || p.dir !== dir) {
        release();
        finish(index);
      } else if (p.index !== index) {
        release();
        settle(index);
      } else paint();
    }, [index, itemKey, dir, measure, release, finish, settle, paint]);
    useEffect(() => {
      if (reduced || hidden) {
        release();
        finish(settings.current.index);
      }
    }, [reduced, hidden, release, finish]);
    useEffect(() => {
      const resize = () => {
        release();
        measure();
        finish(settings.current.index);
      };
      window.addEventListener("resize", resize);
      let previousWidth = width.current;
      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => {
              const next = surface.current?.getBoundingClientRect().width ?? 0;
              if (next !== previousWidth) {
                previousWidth = next;
                resize();
              }
            });
      if (surface.current) observer?.observe(surface.current);
      return () => {
        window.removeEventListener("resize", resize);
        observer?.disconnect();
        release();
        cancel();
      };
    }, [release, measure, finish, cancel]);
    function select(next: number) {
      const id = items[next]?.id;
      if (id === undefined) return;
      if (value === undefined) setInternal(id);
      if (id !== selected) onValueChange?.(id);
      settle(value === undefined ? next : index);
    }
    function down(event: PointerEvent<HTMLDivElement>) {
      if (!event.isPrimary) {
        release();
        settle(index);
        return;
      }
      // A new physical press cannot be the synthetic click trailing the prior drag.
      // Clear before skipping headings, form controls, or modified link presses.
      suppress.current = false;
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey ||
        items.length < 2
      )
        return;
      if (
        (event.target as Element).closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="tablist"]',
        )
      )
        return;
      measure();
      if (!width.current) return;
      gesture.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        position: position.current,
        startIndex: index,
        intent: "pending",
        samples: [{ x: event.clientX, time: performance.now() }],
      };
    }
    function move(event: PointerEvent<HTMLDivElement>) {
      const g = gesture.current;
      if (!g || g.id !== event.pointerId || g.intent === "vertical") return;
      const dx = event.clientX - g.x;
      if (g.intent === "pending") {
        g.intent = gestureIntent(dx, event.clientY - g.y);
        if (g.intent !== "horizontal") return;
        g.position = position.current;
        cancel();
        root.current?.setPointerCapture?.(event.pointerId);
        suppress.current = true;
        setPhase("dragging");
      }
      event.preventDefault();
      const time = performance.now();
      g.samples = [
        ...g.samples.filter((s) => time - s.time <= 100),
        { x: event.clientX, time },
      ];
      if (!settings.current.reduced) {
        position.current = resistBoundary(
          g.position - (dx / width.current) * (dir === "rtl" ? -1 : 1),
          items.length,
        );
        paint();
      }
    }
    function end(event: PointerEvent<HTMLDivElement>, cancelled = false) {
      const g = gesture.current;
      if (!g || g.id !== event.pointerId) return;
      release();
      if (g.intent !== "horizontal") return;
      const sign = dir === "rtl" ? -1 : 1;
      const target = cancelled
        ? index
        : gestureTarget({
            width: width.current,
            count: items.length,
            startIndex: g.startIndex,
            dx: (event.clientX - g.x) * sign,
            velocity:
              recentVelocity([
                ...g.samples,
                { x: event.clientX, time: performance.now() },
              ]) * sign,
          });
      if (cancelled) settle(index);
      else select(target);
    }
    return (
      <div
        {...props}
        ref={root}
        dir={dir}
        className={`wp-panorama ${className}`}
        style={
          {
            ...props.style,
            "--wp-panorama-position": initialPosition.current,
          } as CSSProperties
        }
        data-motion-state={phase}
        onClick={(e) => {
          props.onClick?.(e);
          if (e.defaultPrevented) return;
          const i = Array.from(headings.current?.children ?? []).indexOf(
            e.target as Element,
          );
          if (i >= 0) select(i);
        }}
        onKeyDown={(e) => {
          props.onKeyDown?.(e);
          if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
          const i = Array.from(headings.current?.children ?? []).indexOf(
            e.target as Element,
          );
          if (i < 0) return;
          let next = i;
          if (e.key === "Home") next = 0;
          else if (e.key === "End") next = items.length - 1;
          else if (e.key === "ArrowRight")
            next = (i + (dir === "rtl" ? -1 : 1) + items.length) % items.length;
          else if (e.key === "ArrowLeft")
            next = (i + (dir === "rtl" ? 1 : -1) + items.length) % items.length;
          else return;
          e.preventDefault();
          e.stopPropagation();
          (headings.current?.children[next] as HTMLElement)?.focus({
            preventScroll: true,
          });
          select(next);
        }}
        onPointerDown={(e) => {
          props.onPointerDown?.(e);
          if (!e.defaultPrevented) down(e);
        }}
        onPointerMove={(e) => {
          props.onPointerMove?.(e);
          if (!e.defaultPrevented) move(e);
        }}
        onPointerUp={(e) => {
          props.onPointerUp?.(e);
          end(e, e.defaultPrevented);
        }}
        onPointerCancel={(e) => {
          props.onPointerCancel?.(e);
          end(e, true);
        }}
        onLostPointerCapture={(e) => {
          props.onLostPointerCapture?.(e);
          if (e.target === e.currentTarget) end(e, true);
        }}
        onPointerLeave={(e) => {
          props.onPointerLeave?.(e);
          if (gesture.current?.intent !== "horizontal") release();
        }}
        onDragStart={(e) => {
          props.onDragStart?.(e);
          if (gesture.current && gesture.current.intent !== "vertical")
            e.preventDefault();
        }}
        onClickCapture={(e) => {
          props.onClickCapture?.(e);
          if (suppress.current && e.detail !== 0) {
            suppress.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div className="wp-panorama-heading-viewport">
          <div
            ref={headings}
            className="wp-panorama-headings"
            role="tablist"
            aria-label={props["aria-label"]}
            aria-labelledby={props["aria-labelledby"]}
            aria-orientation="horizontal"
          >
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${uid}-tab-${encodeURIComponent(item.id)}`}
                aria-controls={`${uid}-panel-${encodeURIComponent(item.id)}`}
                aria-selected={i === index}
                tabIndex={i === index ? 0 : -1}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div
          ref={surface}
          data-panorama-surface=""
          className="wp-panorama-surface"
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              className="wp-panorama-panel"
              id={`${uid}-panel-${encodeURIComponent(item.id)}`}
              role="tabpanel"
              aria-labelledby={`${uid}-tab-${encodeURIComponent(item.id)}`}
              aria-hidden={i !== index}
              inert={i !== index}
              hidden={phase === "idle" && i !== index}
              tabIndex={i === index ? 0 : -1}
              style={{ "--wp-panorama-index": i } as CSSProperties}
            >
              {item.children}
            </div>
          ))}
        </div>
      </div>
    );
  },
);
