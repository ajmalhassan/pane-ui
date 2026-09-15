"use client";
import {
  forwardRef,
  useId,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { usePressTilt } from "./usePressTilt.js";
import { Button } from "./Button.js";
import { Pressable } from "./Pressable.js";
export type AppBarProps = ComponentPropsWithoutRef<"div">;
export const AppBar = forwardRef<HTMLDivElement, AppBarProps>(function AppBar(
  { className = "", ...props },
  ref,
) {
  return <div {...props} ref={ref} className={`wp-app-bar ${className}`} />;
});
export interface AppBarActionProps extends ComponentPropsWithoutRef<"button"> {
  icon: ReactNode;
  label: string;
}
export const AppBarAction = forwardRef<HTMLButtonElement, AppBarActionProps>(
  function AppBarAction({ icon, label, className = "", ...props }, ref) {
    return (
      <Pressable
        {...props}
        ref={ref}
        className={`wp-app-bar-action ${className}`}
      >
        <span className="wp-app-bar-icon" aria-hidden="true">
          {icon}
        </span>
        <span>{label}</span>
      </Pressable>
    );
  },
);

export interface AppBarLinkProps
  extends Omit<ComponentPropsWithoutRef<"a">, "children"> {
  href: string;
  icon: ReactNode;
  label: string;
}
export const AppBarLink = forwardRef<HTMLAnchorElement, AppBarLinkProps>(
  function AppBarLink({ icon, label, className = "", ...props }, ref) {
    const tilt = usePressTilt<HTMLAnchorElement>(props);
    return (
      <a
        {...props}
        {...tilt}
        ref={ref}
        className={`wp-pressable wp-app-bar-action wp-app-bar-link ${className}`}
      >
        <span className="wp-app-bar-icon" aria-hidden="true">
          {icon}
        </span>
        <span>{label}</span>
      </a>
    );
  },
);

export interface AppBarOverflowProps extends ComponentPropsWithoutRef<"div"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  label?: string;
}
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
/** An inline disclosure of commands. Ordinary Tab order; no popup-menu semantics. */
export const AppBarOverflow = forwardRef<HTMLDivElement, AppBarOverflowProps>(
  function AppBarOverflow(
    {
      open: controlled,
      defaultOpen = false,
      onOpenChange,
      label = "More commands",
      children,
      className = "",
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const [internal, setInternal] = useState(defaultOpen);
    const open = controlled ?? internal;
    const id = useId();
    const trigger = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const wasOpen = useRef(open);
    const focusedInside = useRef(false);
    useBrowserLayoutEffect(() => {
      const active = document.activeElement;
      // Hiding a focused panel can move focus to body before this effect runs.
      // Never reclaim it from an outside control, even after a child is removed
      // without dispatching blur and leaves our last-focus flag stale.
      const canRestore =
        panel.current?.contains(active) ||
        (focusedInside.current && active === document.body);
      if (wasOpen.current && !open && canRestore)
        trigger.current?.focus({ preventScroll: true });
      wasOpen.current = open;
    }, [open]);
    const change = (next: boolean) => {
      if (controlled === undefined) setInternal(next);
      onOpenChange?.(next);
    };
    return (
      <div
        {...props}
        ref={ref}
        className={`wp-app-bar-overflow ${className}`}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented && event.key === "Escape" && open) {
            event.preventDefault();
            change(false);
          }
        }}
      >
        <Button
          ref={trigger}
          className="wp-app-bar-more"
          variant="subtle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => change(!open)}
        >
          <span aria-hidden="true">•••</span>
          <span>{label}</span>
        </Button>
        <div
          ref={panel}
          id={id}
          className="wp-app-bar-extra"
          hidden={!open}
          onFocusCapture={() => {
            focusedInside.current = true;
          }}
          onBlurCapture={(event) => {
            focusedInside.current = event.currentTarget.contains(
              event.relatedTarget as Node | null,
            );
          }}
        >
          {children}
        </div>
      </div>
    );
  },
);
