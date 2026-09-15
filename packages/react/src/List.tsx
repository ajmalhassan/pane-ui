"use client";
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

export interface ListProps extends ComponentPropsWithoutRef<"ul"> {
  /** Opt-in entrance using the shared stagger motion, capped at 240ms delay. */
  animate?: boolean;
}
export const List = forwardRef<HTMLUListElement, ListProps>(function List(
  { animate = false, className = "", ...props },
  ref,
) {
  return (
    <ul
      {...props}
      ref={ref}
      role={props.role ?? "list"}
      className={`wp-list ${className}`}
      data-animate={animate || undefined}
    />
  );
});
export type ListItemAction =
  | {
      type: "link";
      href: string;
      props?: Omit<ComponentPropsWithoutRef<"a">, "children" | "href">;
    }
  | {
      type: "button";
      props?: Omit<ComponentPropsWithoutRef<"button">, "children">;
    };
export interface ListItemProps
  extends Omit<ComponentPropsWithoutRef<"li">, "children" | "title"> {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  meta?: ReactNode;
  action?: ListItemAction;
  actions?: ReactNode;
}
/** Main action and secondary controls are siblings: never nest interactive elements. */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  function ListItem(
    {
      title,
      description,
      leading,
      meta,
      action,
      actions,
      className = "",
      ...props
    },
    ref,
  ) {
    const content = (
      <>
        {leading && <span className="wp-list-leading">{leading}</span>}
        <span className="wp-list-copy">
          <span className="wp-list-title">{title}</span>
          {description && (
            <span className="wp-list-description">{description}</span>
          )}
          {meta && <span className="wp-list-meta">{meta}</span>}
        </span>
      </>
    );
    return (
      <li {...props} ref={ref} className={`wp-list-item ${className}`}>
        {action?.type === "link" ? (
          <a
            {...action.props}
            href={action.href}
            className={`wp-list-primary wp-list-interactive ${action.props?.className ?? ""}`}
          >
            {content}
          </a>
        ) : action?.type === "button" ? (
          <button
            {...action.props}
            type={action.props?.type ?? "button"}
            className={`wp-list-primary wp-list-interactive ${action.props?.className ?? ""}`}
          >
            {content}
          </button>
        ) : (
          <div className="wp-list-primary">{content}</div>
        )}
        {actions && <div className="wp-list-actions">{actions}</div>}
      </li>
    );
  },
);
export interface SectionHeaderProps extends ComponentPropsWithoutRef<"h2"> {
  level?: 2 | 3 | 4;
  meta?: ReactNode;
}
export const SectionHeader = forwardRef<HTMLHeadingElement, SectionHeaderProps>(
  function SectionHeader(
    { level = 2, meta, children, className = "", ...props },
    ref,
  ) {
    const Heading = level === 2 ? "h2" : level === 3 ? "h3" : "h4";
    return (
      <Heading
        {...props}
        ref={ref}
        className={`wp-section-header ${className}`}
      >
        <span>{children}</span>{" "}
        {meta && <span className="wp-section-meta">{meta}</span>}
      </Heading>
    );
  },
);
export interface EmptyStateProps
  extends Omit<ComponentPropsWithoutRef<"section">, "title" | "children"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  headingLevel?: 2 | 3 | 4;
}
export const EmptyState = forwardRef<HTMLElement, EmptyStateProps>(
  function EmptyState(
    {
      title,
      description,
      actions,
      icon,
      headingLevel = 3,
      className = "",
      ...props
    },
    ref,
  ) {
    const id = useId();
    const Heading =
      headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : "h4";
    return (
      <section
        {...props}
        ref={ref}
        aria-labelledby={props["aria-labelledby"] ?? id}
        className={`wp-empty-state ${className}`}
      >
        {icon && (
          <div className="wp-empty-icon" aria-hidden="true">
            {icon}
          </div>
        )}
        <Heading id={id}>{title}</Heading>
        {description && (
          <div className="wp-empty-description">{description}</div>
        )}
        {actions && <div className="wp-empty-actions">{actions}</div>}
      </section>
    );
  },
);
