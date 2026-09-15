"use client";

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

export interface PivotProps extends ComponentPropsWithoutRef<"div"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  activationMode?: "automatic" | "manual";
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
}
export type PivotListProps = ComponentPropsWithoutRef<"div">;
export interface PivotTriggerProps
  extends Omit<ComponentPropsWithoutRef<"button">, "value"> {
  value: string;
}
export interface PivotPanelProps extends ComponentPropsWithoutRef<"div"> {
  value: string;
}

type Item = { value: string; disabled: boolean; node?: HTMLButtonElement };
type PivotContextValue = {
  id: string;
  selected: string | undefined;
  tabStop: string | undefined;
  orientation: "horizontal" | "vertical";
  dir: "ltr" | "rtl";
  activationMode: "automatic" | "manual";
  select: (value: string) => void;
  focus: (value: string) => void;
  register: (item: Item) => () => void;
  move: (value: string, key: string) => boolean;
};
const PivotContext = createContext<PivotContextValue | null>(null);
function usePivot() {
  const context = useContext(PivotContext);
  if (!context) throw new Error("Pivot components must be inside a Pivot.");
  return context;
}
const useClientLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Known compound children provide meaningful server-rendered selection before refs mount.
function collectItems(children: ReactNode): Item[] {
  const items: Item[] = [];
  Children.forEach(children, (child) => {
    if (
      !isValidElement<{
        children?: ReactNode;
        value?: string;
        disabled?: boolean;
      }>(child)
    )
      return;
    if (child.type === Pivot) return;
    if (child.type === PivotTrigger && child.props.value !== undefined) {
      items.push({
        value: child.props.value,
        disabled: !!child.props.disabled,
      });
    } else if (child.props.children)
      items.push(...collectItems(child.props.children));
  });
  return items;
}
function tabId(id: string, value: string) {
  return `${id}-tab-${encodeURIComponent(value)}`;
}
function panelId(id: string, value: string) {
  return `${id}-panel-${encodeURIComponent(value)}`;
}

export const Pivot = forwardRef<HTMLDivElement, PivotProps>(function Pivot(
  {
    value,
    defaultValue,
    onValueChange,
    activationMode = "automatic",
    orientation = "horizontal",
    dir = "ltr",
    children,
    className = "",
    ...props
  },
  ref,
) {
  const id = useId();
  const initialItems = collectItems(children);
  const [internalValue, setInternalValue] = useState<string | undefined>(
    defaultValue,
  );
  const [registered, setRegistered] = useState<Item[]>([]);
  const [focused, setFocused] = useState<string>();
  const repairFocus = useRef(false);
  const register = useCallback((item: Item) => {
    setRegistered((current) => [
      ...current.filter((entry) => entry.value !== item.value),
      item,
    ]);
    return () => {
      if (item.node && document.activeElement === item.node)
        repairFocus.current = true;
      setRegistered((current) =>
        current.filter((entry) => entry.node !== item.node),
      );
    };
  }, []);
  const items = registered.length
    ? [...registered].sort((a, b) => {
        if (!a.node || !b.node) return 0;
        return a.node.compareDocumentPosition(b.node) & 2 ? 1 : -1;
      })
    : initialItems;
  const enabled = items.filter((item) => !item.disabled);
  const requested = value === undefined ? internalValue : value;
  const selected =
    enabled.some((item) => item.value === requested) ||
    (registered.length === 0 &&
      requested !== undefined &&
      !items.some((item) => item.value === requested))
      ? requested
      : enabled[0]?.value;
  const tabStop = enabled.some((item) => item.value === focused)
    ? focused
    : selected;
  useClientLayoutEffect(() => {
    // Commit the initial/fallback choice once actual compound children are registered.
    if (
      value === undefined &&
      registered.length > 0 &&
      internalValue !== selected
    ) {
      setInternalValue(selected);
    }
  }, [value, registered.length, internalValue, selected]);
  const select = (next: string) => {
    if (next === selected) return;
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  };
  useClientLayoutEffect(() => {
    if (!repairFocus.current) return;
    if (
      document.activeElement !== document.body &&
      !registered.some((item) => item.node === document.activeElement)
    ) {
      repairFocus.current = false;
      return;
    }
    const node = registered.find(
      (item) => item.value === tabStop && !item.disabled,
    )?.node;
    if (node?.isConnected) {
      repairFocus.current = false;
      node.focus();
    }
  }, [registered, tabStop]);
  const move = (from: string, key: string) => {
    const previousKey =
      orientation === "vertical"
        ? "ArrowUp"
        : dir === "rtl"
          ? "ArrowRight"
          : "ArrowLeft";
    const nextKey =
      orientation === "vertical"
        ? "ArrowDown"
        : dir === "rtl"
          ? "ArrowLeft"
          : "ArrowRight";
    if (![previousKey, nextKey, "Home", "End"].includes(key) || !enabled.length)
      return false;
    const ordered = [...enabled].sort((a, b) =>
      a.node && b.node
        ? a.node.compareDocumentPosition(b.node) & 2
          ? 1
          : -1
        : 0,
    );
    const index = ordered.findIndex((item) => item.value === from);
    const next =
      key === "Home"
        ? ordered[0]
        : key === "End"
          ? ordered[ordered.length - 1]
          : ordered[
              (index + (key === nextKey ? 1 : -1) + ordered.length) %
                ordered.length
            ];
    setFocused(next.value);
    next.node?.focus();
    if (activationMode === "automatic") select(next.value);
    return true;
  };
  return (
    <PivotContext.Provider
      value={{
        id,
        selected,
        tabStop,
        orientation,
        dir,
        activationMode,
        select,
        focus: setFocused,
        register,
        move,
      }}
    >
      <div
        {...props}
        ref={ref}
        dir={dir}
        className={`wp-pivot ${className}`}
        data-orientation={orientation}
      >
        {children}
      </div>
    </PivotContext.Provider>
  );
});

export const PivotList = forwardRef<HTMLDivElement, PivotListProps>(
  function PivotList({ className = "", ...props }, ref) {
    const context = usePivot();
    return (
      <div
        {...props}
        ref={ref}
        role="tablist"
        aria-orientation={context.orientation}
        className={`wp-pivot-list ${className}`}
      />
    );
  },
);

export const PivotTrigger = forwardRef<HTMLButtonElement, PivotTriggerProps>(
  function PivotTrigger(
    {
      value,
      disabled = false,
      className = "",
      onClick,
      onKeyDown,
      onFocus,
      ...props
    },
    forwardedRef,
  ) {
    const context = usePivot();
    const nodeRef = useRef<HTMLButtonElement | null>(null);
    const { register } = context;
    useClientLayoutEffect(
      () => register({ value, disabled, node: nodeRef.current! }),
      [register, value, disabled],
    );
    const ref = useCallback(
      (node: HTMLButtonElement | null) => {
        nodeRef.current = node;
        if (typeof forwardedRef === "function") return forwardedRef(node);
        if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );
    return (
      <button
        {...props}
        ref={ref}
        type={props.type ?? "button"}
        role="tab"
        id={tabId(context.id, value)}
        aria-controls={panelId(context.id, value)}
        aria-selected={context.selected === value}
        disabled={disabled}
        tabIndex={!disabled && context.tabStop === value ? 0 : -1}
        className={`wp-pivot-trigger ${className}`}
        onFocus={(event) => {
          onFocus?.(event);
          if (!event.defaultPrevented) context.focus(value);
        }}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && !disabled) context.select(value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            !event.defaultPrevented &&
            !disabled &&
            event.target === event.currentTarget &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            context.move(value, event.key)
          )
            event.preventDefault();
        }}
      />
    );
  },
);

export const PivotPanel = forwardRef<HTMLDivElement, PivotPanelProps>(
  function PivotPanel({ value, className = "", ...props }, ref) {
    const context = usePivot();
    const active = context.selected === value;
    return (
      <div
        {...props}
        ref={ref}
        role="tabpanel"
        id={panelId(context.id, value)}
        aria-labelledby={tabId(context.id, value)}
        tabIndex={props.tabIndex ?? 0}
        hidden={!active || props.hidden}
        inert={!active || props.inert}
        className={`wp-pivot-panel ${className}`}
      />
    );
  },
);
