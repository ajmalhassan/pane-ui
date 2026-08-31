"use client";

import type { ButtonHTMLAttributes, PointerEvent } from "react";
import styles from "./Pressable.module.css";

type TiltStyle = CSSStyleDeclaration & {
  "--press-rotate-x"?: string;
  "--press-rotate-y"?: string;
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  intensity?: number;
};

export function Pressable({ intensity = 4, className = "", onPointerMove, onPointerLeave, ...props }: Props) {
  function move(event: PointerEvent<HTMLButtonElement>) {
    onPointerMove?.(event);
    if (event.pointerType === "touch" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    const style = event.currentTarget.style as TiltStyle;
    style.setProperty("--press-rotate-x", `${-y * intensity}deg`);
    style.setProperty("--press-rotate-y", `${x * intensity}deg`);
  }

  function leave(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.removeProperty("--press-rotate-x");
    event.currentTarget.style.removeProperty("--press-rotate-y");
    onPointerLeave?.(event);
  }

  return <button {...props} className={`${styles.pressable} ${className}`} onPointerMove={move} onPointerLeave={leave} />;
}
