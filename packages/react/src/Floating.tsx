"use client";
import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import {
  autoUpdate,
  flip,
  shift,
  offset,
  size,
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  useListNavigation,
  useTypeahead,
  useMergeRefs,
  FloatingFocusManager,
  type Placement,
} from "@floating-ui/react";
import { Button, type ButtonProps } from "./Button.js";

type Ownership =
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      defaultOpen?: never;
    }
  | {
      open?: never;
      defaultOpen?: boolean;
      onOpenChange?: (open: boolean) => void;
    };
type PopupProps = Ownership & {
  label: string;
  placement?: Placement;
  triggerProps?: Omit<
    ButtonProps,
    "children" | "aria-haspopup" | "aria-expanded" | "aria-controls"
  >;
};
export interface MenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  destructive?: boolean;
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void;
}
export type MenuProps = PopupProps & { items: MenuItem[] };
export type PopoverProps = PopupProps & {
  title: string;
  children: ReactNode | ((controls: { close: () => void }) => ReactNode);
};

function usePopup(props: PopupProps) {
  const [internal, setInternal] = useState(props.defaultOpen ?? false);
  const open = props.open ?? internal;
  const change = (next: boolean) => {
    if (props.open === undefined) setInternal(next);
    props.onOpenChange?.(next);
  };
  const floating = useFloating({
    open,
    onOpenChange: change,
    placement: props.placement ?? "bottom-start",
    strategy: "fixed",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, availableWidth, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.max(0, availableHeight)}px`,
            maxWidth: `${Math.max(0, availableWidth)}px`,
          });
        },
      }),
    ],
  });
  const setFloating = useCallback(
    (node: HTMLDivElement | null) => {
      // Top-layer placement escapes clipping while preserving DOM theme inheritance.
      if (node && !node.matches(":popover-open")) node.showPopover();
      floating.refs.setFloating(node);
    },
    [floating.refs],
  );
  return { ...floating, open, change, setFloating };
}
function triggerAttributes(
  trigger: PopupProps["triggerProps"],
  reference: Record<string, unknown>,
) {
  const result: Record<string, unknown> = { ...trigger, ...reference };
  for (const [key, handler] of Object.entries(reference)) {
    const consumer = trigger?.[key as keyof typeof trigger];
    if (
      key.startsWith("on") &&
      typeof handler === "function" &&
      typeof consumer === "function"
    ) {
      result[key] = (event: React.SyntheticEvent<HTMLButtonElement>) => {
        (consumer as (event: React.SyntheticEvent<HTMLButtonElement>) => void)(
          event,
        );
        if (!event.defaultPrevented) handler(event);
      };
    }
  }
  return result as ButtonProps;
}
export const Menu = forwardRef<HTMLButtonElement, MenuProps>(function Menu(
  { items, ...props },
  ref,
) {
  const popup = usePopup(props);
  const [active, setActive] = useState<number | null>(null);
  const list = useRef<Array<HTMLElement | null>>([]);
  const labels = useRef<Array<string | null>>([]);
  const previousItems = useRef(items);
  const useCommittedEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;
  useCommittedEffect(() => {
    list.current.length = items.length;
    if (previousItems.current !== items) {
      previousItems.current = items;
      setActive((current) => {
        if (current === null) return null;
        const focused = list.current.findIndex(
          (node) => node === document.activeElement,
        );
        if (focused >= 0 && !items[focused]?.disabled) return focused;
        if (!items[current] || items[current].disabled)
          return items.findIndex((item) => !item.disabled) < 0
            ? null
            : items.findIndex((item) => !item.disabled);
        return current;
      });
    }
  }, [items]);
  labels.current = items.map((item) => (item.disabled ? null : item.label));
  const click = useClick(popup.context, {
    enabled: !props.triggerProps?.disabled && !props.triggerProps?.loading,
  });
  const dismiss = useDismiss(popup.context);
  const role = useRole(popup.context, { role: "menu" });
  const navigation = useListNavigation(popup.context, {
    enabled: !props.triggerProps?.disabled && !props.triggerProps?.loading,
    listRef: list,
    activeIndex: active,
    onNavigate: setActive,
    loop: true,
    disabledIndices: items.flatMap((item, index) =>
      item.disabled ? [index] : [],
    ),
  });
  const typeahead = useTypeahead(popup.context, {
    enabled: !props.triggerProps?.disabled && !props.triggerProps?.loading,
    listRef: labels,
    activeIndex: active,
    onMatch: setActive,
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, role, navigation, typeahead],
  );
  const triggerRef = useMergeRefs([popup.refs.setReference, ref]);
  return (
    <>
      <Button
        {...triggerAttributes(props.triggerProps, getReferenceProps())}
        ref={triggerRef}
      >
        {props.label}
      </Button>
      {popup.open && (
        <FloatingFocusManager
          context={popup.context}
          modal={false}
          restoreFocus
        >
          <div
            {...getFloatingProps()}
            ref={popup.setFloating}
            popover="manual"
            style={popup.floatingStyles}
            className="wp-floating wp-menu"
            aria-label={props.label}
            data-placement={popup.placement}
          >
            <div className="wp-floating-content">
              {items.map((item, index) => (
                <button
                  {...getItemProps()}
                  key={item.id}
                  type="button"
                  role="menuitem"
                  ref={(node) => {
                    list.current[index] = node;
                  }}
                  tabIndex={active === index ? 0 : -1}
                  disabled={item.disabled}
                  data-destructive={item.destructive || undefined}
                  className="wp-menu-item"
                  onClick={(event) => {
                    item.onSelect(event);
                    if (!event.defaultPrevented) popup.change(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
});
export const Popover = forwardRef<HTMLButtonElement, PopoverProps>(
  function Popover({ title, children, ...props }, ref) {
    const popup = usePopup(props);
    const click = useClick(popup.context, {
      enabled: !props.triggerProps?.disabled && !props.triggerProps?.loading,
    });
    const dismiss = useDismiss(popup.context);
    const role = useRole(popup.context, { role: "dialog" });
    const { getReferenceProps, getFloatingProps } = useInteractions([
      click,
      dismiss,
      role,
    ]);
    const triggerRef = useMergeRefs([popup.refs.setReference, ref]);
    return (
      <>
        <Button
          {...triggerAttributes(props.triggerProps, getReferenceProps())}
          ref={triggerRef}
        >
          {props.label}
        </Button>
        {popup.open && (
          <FloatingFocusManager
            context={popup.context}
            modal={false}
            restoreFocus
          >
            <div
              {...getFloatingProps()}
              ref={popup.setFloating}
              popover="manual"
              style={popup.floatingStyles}
              className="wp-floating wp-popover"
              aria-label={title}
              data-placement={popup.placement}
            >
              <div className="wp-floating-content wp-popover-content">
                <h3 className="wp-popover-title">{title}</h3>
                {typeof children === "function"
                  ? children({ close: () => popup.change(false) })
                  : children}
              </div>
            </div>
          </FloatingFocusManager>
        )}
      </>
    );
  },
);
