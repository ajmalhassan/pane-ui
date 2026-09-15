"use client";
import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Transition } from "./Transition.js";

export type DialogCloseReason = "escape" | "backdrop" | "native";
export interface DialogProps
  extends Omit<
    ComponentPropsWithoutRef<"dialog">,
    "open" | "title" | "role" | "aria-label" | "aria-labelledby" | "aria-modal"
  > {
  open: boolean;
  onOpenChange: (open: boolean, reason: DialogCloseReason) => void;
  title: ReactNode;
  description?: string;
  dismissOnEscape?: boolean;
  dismissOnBackdrop?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Optional surviving focus destination, otherwise native opener restoration applies. */
  finalFocusRef?: RefObject<HTMLElement | null>;
  duration?: number;
}
export type AlertDialogProps = Omit<
  DialogProps,
  "dismissOnBackdrop" | "description"
> & { description: string };
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
const locks = new WeakMap<
  Document,
  { count: number; value: string; priority: string }
>();
function lockScroll(document: Document) {
  let lock = locks.get(document);
  if (!lock) {
    const style = document.documentElement.style;
    lock = {
      count: 0,
      value: style.getPropertyValue("overflow"),
      priority: style.getPropertyPriority("overflow"),
    };
    locks.set(document, lock);
    style.setProperty("overflow", "hidden");
  }
  lock.count++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--lock.count === 0) {
      const style = document.documentElement.style;
      if (lock.value) style.setProperty("overflow", lock.value, lock.priority);
      else style.removeProperty("overflow");
      locks.delete(document);
    }
  };
}
/** Native tab order within the light-DOM modal, including radio group ownership. */
function tabStops(root: HTMLDialogElement) {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href],area[href],button,input,select,textarea,iframe,object,summary,[tabindex],[contenteditable="true"],audio[controls],video[controls]',
    ),
  ).filter(
    (element) =>
      (element.tabIndex >= 0 ||
        (element.isContentEditable && !element.hasAttribute("tabindex"))) &&
      !element.matches(":disabled") &&
      !element.closest("[inert]") &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility === "visible",
  );
  return candidates
    .filter((element) => {
      if (
        !(element instanceof HTMLInputElement) ||
        element.type !== "radio" ||
        !element.name
      )
        return true;
      const group = candidates.filter(
        (item): item is HTMLInputElement =>
          item instanceof HTMLInputElement &&
          item.type === "radio" &&
          item.name === element.name &&
          item.form === element.form,
      );
      return element === (group.find((item) => item.checked) ?? group[0]);
    })
    .sort(
      (a, b) =>
        (a.tabIndex > 0 ? a.tabIndex : Infinity) -
        (b.tabIndex > 0 ? b.tabIndex : Infinity),
    );
}
const Modal = forwardRef<HTMLDialogElement, DialogProps & { alert?: boolean }>(
  function Modal(
    {
      open,
      onOpenChange,
      title,
      description,
      dismissOnEscape = true,
      dismissOnBackdrop = true,
      initialFocusRef,
      finalFocusRef,
      duration = 220,
      alert = false,
      children,
      className = "",
      onCancel,
      onClose,
      onPointerDown,
      onPointerCancel,
      onClick,
      onKeyDown,
      ...props
    },
    forwardedRef,
  ) {
    const node = useRef<HTMLDialogElement>(null);
    const opener = useRef<HTMLElement | null>(null);
    const release = useRef<(() => void) | null>(null);
    const backdropStart = useRef(false);
    const [revision, setRevision] = useState(0);
    const id = useId();
    const latest = useRef({ open, onOpenChange, finalFocusRef });
    useBrowserLayoutEffect(() => {
      latest.current = { open, onOpenChange, finalFocusRef };
    });
    useImperativeHandle(forwardedRef, () => node.current!, []);
    const close = () => {
      const element = node.current;
      if (!element) return;
      const active = element.ownerDocument.activeElement;
      const hadFocus =
        element.contains(active) || active === element.ownerDocument.body;
      if (element.open) element.close();
      release.current?.();
      release.current = null;
      if (hadFocus)
        (latest.current.finalFocusRef?.current ?? opener.current)?.focus({
          preventScroll: true,
        });
    };
    useBrowserLayoutEffect(() => {
      const element = node.current;
      if (element && open && !element.open) {
        const active = element.ownerDocument.activeElement;
        if (active instanceof HTMLElement && !element.contains(active))
          opener.current = active;
        element.showModal();
        release.current ??= lockScroll(element.ownerDocument);
      }
      if (element && open) {
        // Reopening an in-flight exit keeps the native modal, but renews focus.
        (initialFocusRef?.current ?? tabStops(element)[0])?.focus({
          preventScroll: true,
        });
      }
    }, [open, revision, initialFocusRef]);
    useBrowserLayoutEffect(() => {
      const element = node.current;
      return () => {
        if (element?.open) {
          const active = element.ownerDocument.activeElement;
          const restore =
            element.contains(active) || active === element.ownerDocument.body;
          element.close();
          if (restore)
            (latest.current.finalFocusRef?.current ?? opener.current)?.focus({
              preventScroll: true,
            });
        }
        release.current?.();
        release.current = null;
      };
    }, []);
    const outside = (
      event:
        | React.MouseEvent<HTMLDialogElement>
        | React.PointerEvent<HTMLDialogElement>,
    ) => {
      if (event.target !== event.currentTarget) return false;
      const box = event.currentTarget.getBoundingClientRect();
      return (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      );
    };
    return (
      <dialog
        {...props}
        ref={node}
        className={`wp-dialog ${className}`}
        role={alert ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={
          [
            description ? `${id}-description` : undefined,
            props["aria-describedby"],
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Tab") return;
          const stops = tabStops(event.currentTarget);
          const active = event.currentTarget.ownerDocument.activeElement;
          if (!open || stops.length === 0) {
            event.preventDefault();
            return;
          }
          const first = stops[0],
            last = stops[stops.length - 1];
          if (
            event.shiftKey
              ? active === first || !stops.includes(active as HTMLElement)
              : active === last || !stops.includes(active as HTMLElement)
          ) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
          }
        }}
        onCancel={(event) => {
          onCancel?.(event);
          const prevented = event.defaultPrevented;
          event.preventDefault();
          if (!prevented && dismissOnEscape && open)
            onOpenChange(false, "escape");
        }}
        onClose={(event) => {
          onClose?.(event);
          // Ignore a delayed close event if the dialog has already reopened.
          if (!event.currentTarget.open && latest.current.open) {
            const active = event.currentTarget.ownerDocument.activeElement;
            if (
              active === opener.current ||
              active === event.currentTarget.ownerDocument.body
            )
              latest.current.finalFocusRef?.current?.focus({
                preventScroll: true,
              });
            latest.current.onOpenChange(false, "native");
            setRevision((value) => value + 1);
          }
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          backdropStart.current =
            !event.defaultPrevented && event.button === 0 && outside(event);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          backdropStart.current = false;
        }}
        onClick={(event) => {
          onClick?.(event);
          const beganOutside = backdropStart.current;
          backdropStart.current = false;
          if (
            !event.defaultPrevented &&
            beganOutside &&
            outside(event) &&
            !alert &&
            dismissOnBackdrop &&
            open
          )
            onOpenChange(false, "backdrop");
        }}
      >
        <Transition
          show={open}
          preset="continuum"
          duration={duration}
          className="wp-dialog-panel"
          onExited={() => {
            if (!latest.current.open) close();
          }}
        >
          <h2 className="wp-dialog-title" id={`${id}-title`}>
            {title}
          </h2>
          {description && (
            <p className="wp-dialog-description" id={`${id}-description`}>
              {description}
            </p>
          )}
          {children}
        </Transition>
      </dialog>
    );
  },
);
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(
  function Dialog(props, ref) {
    return <Modal {...props} ref={ref} />;
  },
);
export const AlertDialog = forwardRef<HTMLDialogElement, AlertDialogProps>(
  function AlertDialog(props, ref) {
    return <Modal {...props} ref={ref} alert dismissOnBackdrop={false} />;
  },
);
