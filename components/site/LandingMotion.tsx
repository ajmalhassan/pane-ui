"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Progressive enhancement: server content is readable before motion attaches. */
export function LandingMotion({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = root.current!;
    if (typeof Element.prototype.animate !== "function") return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const active = new Set<Animation>();
    let intro: Animation[] = [];
    const settle = (animations: Iterable<Animation>) => {
      for (const animation of [...animations]) {
        animation.cancel();
        active.delete(animation);
      }
    };
    const animate = (
      node: Element,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      const animation = node.animate(frames, { ...options, fill: "both" });
      active.add(animation);
      void animation.finished.then(
        () => {
          animation.cancel();
          active.delete(animation);
        },
        () => {},
      );
      return animation;
    };
    const play = () => {
      settle(intro);
      intro = [];
      if (media.matches) return;
      element.querySelectorAll("[data-intro]").forEach((node, index) => {
        intro.push(
          animate(
            node,
            [
              { opacity: 0, transform: "translateY(28px)" },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: 720,
              delay: index * 85,
              easing: "cubic-bezier(.16,1,.3,1)",
            },
          ),
        );
      });
      const grid = element.querySelector<HTMLElement>(
        "[data-intro-tiles] .wp-tile-grid",
      );
      if (grid) {
        const width = grid.clientWidth;
        [...grid.children].forEach((node, index) => {
          const tile = node as HTMLElement;
          const origin = `${-tile.offsetLeft}px ${grid.clientHeight / 2 - tile.offsetTop}px`;
          intro.push(
            animate(
              tile,
              [
                {
                  opacity: 0,
                  transform: `perspective(${width * 2.45}px) translateX(-36px) rotateY(-65deg)`,
                  transformOrigin: origin,
                },
                {
                  opacity: 1,
                  transform: `perspective(${width * 2.45}px) translateX(0px) rotateY(0deg)`,
                  transformOrigin: origin,
                },
              ],
              {
                duration: 760,
                delay: 120 + index * 42,
                easing: "cubic-bezier(.16,1,.3,1)",
              },
            ),
          );
        });
      }
    };
    const replay = element.querySelector<HTMLButtonElement>(
      "[data-replay-intro]",
    );
    const preference = () => {
      if (media.matches) settle(active);
      if (replay) replay.disabled = media.matches;
    };
    const click = (event: Event) => {
      if ((event.target as Element).closest("[data-replay-intro]")) play();
      else if ((event.target as Element).closest("a, button, input"))
        settle(intro);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Tab") settle(intro);
    };
    const visibility = () => {
      // Arriving in another tab should never leave this page half-revealed.
      if (document.hidden) settle(active);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            if (!media.matches)
              animate(
                entry.target,
                [
                  { opacity: 0.15, transform: "translateY(24px)" },
                  { opacity: 1, transform: "none" },
                ],
                { duration: 650, easing: "cubic-bezier(.16,1,.3,1)" },
              );
          }
      },
      { threshold: 0.12 },
    );
    element
      .querySelectorAll("[data-reveal]")
      .forEach((node) => observer.observe(node));
    element.addEventListener("click", click);
    element.addEventListener("keydown", keyboard);
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", preference);
    preference();
    play();
    return () => {
      observer.disconnect();
      settle(active);
      element.removeEventListener("click", click);
      element.removeEventListener("keydown", keyboard);
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", preference);
    };
  }, []);
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
