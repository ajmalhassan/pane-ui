"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { PIVOT_IDS, pivotIndex, type PivotId } from "@/lib/content/pivots";
import {
  gestureIntent,
  gestureTarget,
  recentVelocity,
  resistBoundary,
  type MotionSample,
} from "./panoramaMotion";
import { useReducedMotion } from "./useReducedMotion";

export type PanoramaPhase = "idle" | "dragging" | "settling";
type Options = { active: PivotId; onGestureCommit: (id: PivotId) => void };
type Heading = {
  element: HTMLElement;
  index: number;
  width: number;
  origin: number;
};
type Gesture = {
  id: number;
  x: number;
  y: number;
  position: number;
  startIndex: number;
  intent: "pending" | "horizontal" | "vertical";
  samples: MotionSample[];
  target: Element;
};

export function usePanoramaMotion({ active, onGestureCommit }: Options) {
  const shellRef = useRef<HTMLElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const headingTrackRef = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<PanoramaPhase>("idle");
  const [headingPivot, setHeadingPivot] = useState(active);
  const [visualPivots, setVisualPivots] = useState<readonly PivotId[]>([
    active,
  ]);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const commitRef = useRef(onGestureCommit);
  commitRef.current = onGestureCommit;
  const position = useRef(pivotIndex(active));
  const destination = useRef(active);
  const phaseRef = useRef<PanoramaPhase>("idle");
  const width = useRef(0);
  const headings = useRef<Heading[]>([]);
  const headingStops = useRef<number[]>([]);
  const gap = useRef(0);
  const frame = useRef<number | null>(null);
  const generation = useRef(0);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);

  const changePhase = useCallback((next: PanoramaPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const cancelFrame = useCallback(() => {
    generation.current++;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const releasePointer = useCallback(() => {
    const current = gesture.current;
    gesture.current = null;
    if (!current) return;
    // Pressable owns its transform. Clear only its press channel when capture
    // moves away from a tile, including on cancel/lost capture and resize.
    const pressable = current.target.closest<HTMLElement>(
      "[data-tile-role], button, a",
    );
    for (const property of ["--press-rotate-x", "--press-rotate-y"])
      pressable?.style.removeProperty(property);
    const surface = surfaceRef.current;
    if (surface?.hasPointerCapture?.(current.id))
      surface.releasePointerCapture(current.id);
  }, []);

  const measure = useCallback(() => {
    width.current = surfaceRef.current?.getBoundingClientRect().width ?? 0;
    const track = headingTrackRef.current;
    if (!track) return;
    track.scrollLeft = 0;
    gap.current = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const elements = [
      ...track.querySelectorAll<HTMLElement>("[data-heading-pivot]"),
    ];
    const origin = Math.min(...elements.map((element) => element.offsetLeft));
    headings.current = elements.map((element) => ({
      element,
      index: pivotIndex(element.dataset.headingPivot as PivotId),
      width: element.getBoundingClientRect().width,
      origin: element.offsetLeft - origin,
    }));
    const stops = [0];
    for (let index = 0; index < PIVOT_IDS.length; index++) {
      stops.push(
        stops[index] +
          (headings.current.find((heading) => heading.index === index)?.width ??
            0) +
          gap.current,
      );
    }
    headingStops.current = stops;
  }, []);

  const paint = useCallback(() => {
    const value = String(position.current);
    surfaceRef.current?.style.setProperty("--panorama-position", value);
    shellRef.current?.style.setProperty("--panorama-position", value);
    const stops = headingStops.current;
    if (stops.length < 5 || reducedRef.current) return;
    const index = Math.max(0, Math.min(2, Math.floor(position.current)));
    const offset =
      stops[index] +
      (stops[index + 1] - stops[index]) * (position.current - index);
    for (const heading of headings.current) {
      let x = stops[heading.index] - offset;
      // Wrap only after the real heading has fully left the clipping box.
      // The final React reorder therefore has the same visible geometry.
      if (x + heading.width + gap.current <= 0) x += stops[4];
      heading.element.style.transform = `translate3d(${x - heading.origin}px, 0, 0)`;
    }
  }, []);

  const finish = useCallback(
    (id: PivotId) => {
      cancelFrame();
      position.current = pivotIndex(id);
      destination.current = id;
      paint();
      surfaceRef.current?.style.removeProperty("min-height");
      setVisualPivots([id]);
      setHeadingPivot(id);
      changePhase("idle");
    },
    [cancelFrame, changePhase, paint],
  );

  const select = useCallback(
    (id: PivotId) => {
      if (destination.current === id && phaseRef.current === "settling") return;
      releasePointer();
      cancelFrame();
      destination.current = id;
      measure();
      const target = pivotIndex(id);
      if (
        reducedRef.current ||
        width.current <= 0 ||
        position.current === target
      ) {
        finish(id);
        return;
      }
      const low = Math.max(0, Math.floor(Math.min(position.current, target)));
      const high = Math.min(3, Math.ceil(Math.max(position.current, target)));
      setVisualPivots(PIVOT_IDS.slice(low, high + 1));
      changePhase("settling");
      const from = position.current;
      const start = performance.now();
      const run = generation.current;
      const advance = (time: number) => {
        if (generation.current !== run) return;
        frame.current = null;
        const elapsed = Math.min(1, Math.max(0, (time - start) / 420));
        position.current = from + (target - from) * (1 - (1 - elapsed) ** 3);
        paint();
        if (elapsed === 1) finish(id);
        else frame.current = requestAnimationFrame(advance);
      };
      frame.current = requestAnimationFrame(advance);
    },
    [cancelFrame, changePhase, finish, measure, paint, releasePointer],
  );

  useLayoutEffect(() => {
    if (phase === "idle") {
      for (const heading of headings.current)
        heading.element.style.removeProperty("transform");
      if (headingTrackRef.current) headingTrackRef.current.scrollLeft = 0;
      return;
    }
    // All participating real panels have been uncollapsed by this render.
    // Freeze the tallest height until settlement so a shorter incoming pivot
    // cannot pull the outgoing content out from under a gesture.
    const panels = surfaceRef.current?.querySelectorAll<HTMLElement>(
      '[data-pivot][data-painted="true"]',
    );
    if (panels) {
      const height = Math.max(
        0,
        ...[...panels].map((panel) =>
          Math.max(panel.scrollHeight, panel.getBoundingClientRect().height),
        ),
      );
      surfaceRef.current?.style.setProperty("min-height", `${height}px`);
    }
  }, [phase, headingPivot, visualPivots]);

  const previousActive = useRef(active);
  useLayoutEffect(() => {
    if (previousActive.current === active) return;
    previousActive.current = active;
    select(active);
  }, [active, select]);

  useLayoutEffect(() => {
    if (!reduced) return;
    releasePointer();
    finish(destination.current);
  }, [reduced, finish, releasePointer]);

  useEffect(() => {
    setReady(true);
    const resize = () => {
      releasePointer();
      measure();
      finish(destination.current);
    };
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      releasePointer();
      cancelFrame();
    };
  }, [cancelFrame, finish, measure, releasePointer]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    // Clear an unused suppression before a new physical click; keyboard clicks
    // remain available even while a trailing pointer click is suppressed.
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    if (gesture.current?.intent === "horizontal") return;
    suppressClick.current = false;
    const target = event.target as Element;
    if (
      target.closest(
        "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
      )
    )
      return;
    measure();
    if (width.current <= 0) return;
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      position: position.current,
      startIndex: pivotIndex(destination.current),
      intent: "pending",
      target,
      samples: [{ x: event.clientX, time: performance.now() }],
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (
      !current ||
      current.id !== event.pointerId ||
      current.intent === "vertical"
    )
      return;
    const dx = event.clientX - current.x;
    if (current.intent === "pending") {
      current.intent = gestureIntent(dx, event.clientY - current.y);
      if (current.intent !== "horizontal") return;
      // A settling plane may have moved since pointerdown. Rebase on what is
      // actually displayed when intent wins, with no interruption jump.
      current.position = position.current;
      cancelFrame();
      surfaceRef.current?.setPointerCapture?.(event.pointerId);
      suppressClick.current = true;
      window.getSelection()?.removeAllRanges();
      setVisualPivots(reducedRef.current ? [destination.current] : PIVOT_IDS);
      changePhase("dragging");
    }
    event.preventDefault();
    const time = performance.now();
    current.samples = [
      ...current.samples.filter((sample) => time - sample.time <= 100),
      { x: event.clientX, time },
    ];
    if (reducedRef.current) return;
    const next = resistBoundary(
      current.position - dx / width.current,
      PIVOT_IDS.length,
    );
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const run = generation.current;
    frame.current = requestAnimationFrame(() => {
      if (generation.current !== run) return;
      frame.current = null;
      position.current = next;
      paint();
    });
  }

  function endGesture(event: PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const accepted = current.intent === "horizontal";
    const samples = [
      ...current.samples,
      { x: event.clientX, time: performance.now() },
    ];
    const target = cancelled
      ? current.startIndex
      : gestureTarget({
          width: width.current,
          startIndex: current.startIndex,
          count: PIVOT_IDS.length,
          dx: event.clientX - current.x,
          velocity: recentVelocity(samples),
        });
    releasePointer();
    if (!accepted) return;
    const id = PIVOT_IDS[target];
    select(id);
    if (!cancelled && target !== current.startIndex) commitRef.current(id);
  }

  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClick.current || event.detail === 0) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  return {
    ready,
    shellRef,
    surfaceRef,
    headingTrackRef,
    phase,
    headingPivot,
    visualPivots,
    select,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerLeave: () => {
        if (gesture.current?.intent !== "horizontal") releasePointer();
      },
      onDragStart: (event: DragEvent<HTMLDivElement>) => {
        if (gesture.current && gesture.current.intent !== "vertical")
          event.preventDefault();
      },
      onPointerUp: (event: PointerEvent<HTMLDivElement>) =>
        endGesture(event, false),
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) =>
        endGesture(event, true),
      onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) endGesture(event, true);
      },
      onClickCapture,
    },
  };
}

export type PanoramaMotion = ReturnType<typeof usePanoramaMotion>;
