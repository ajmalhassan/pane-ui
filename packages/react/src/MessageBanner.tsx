"use client";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { IconButton } from "./Button.js";
export type MessageBannerProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "role" | "aria-live" | "aria-atomic"
> & {
  tone?: "info" | "success" | "warning" | "error";
  heading?: ReactNode;
  /** Announcements are opt-in, independent of visual tone. */
  announcement?: "off" | "polite" | "assertive";
  actions?: ReactNode;
} & (
    | { onDismiss: () => void; dismissLabel: string }
    | { onDismiss?: never; dismissLabel?: never }
  );
/** Persistent feedback. The owner manages visibility and any focus restoration on removal. */
export const MessageBanner = forwardRef<HTMLDivElement, MessageBannerProps>(
  function MessageBanner(
    {
      tone = "info",
      heading,
      announcement = "off",
      actions,
      onDismiss,
      dismissLabel,
      children,
      className = "",
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={`wp-message-banner ${className}`}
        data-tone={tone}
      >
        <span className="wp-message-symbol" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            focusable="false"
          >
            {tone === "info" && (
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            )}
            <path
              d={
                {
                  info: "M12 11v6M12 7v.5",
                  success: "m5 12 4 4L19 6",
                  warning: "M12 5v9M12 18v1",
                  error: "m6 6 12 12M18 6 6 18",
                }[tone]
              }
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        </span>
        <div className="wp-message-main">
          <div
            role={
              announcement === "assertive"
                ? "alert"
                : announcement === "polite"
                  ? "status"
                  : undefined
            }
            aria-atomic={announcement === "off" ? undefined : true}
          >
            {heading && <div className="wp-message-heading">{heading}</div>}
            <div className="wp-message-content">{children}</div>
          </div>
          {actions && <div className="wp-message-actions">{actions}</div>}
        </div>
        {onDismiss && (
          <IconButton
            className="wp-message-dismiss"
            variant="subtle"
            label={dismissLabel}
            onClick={onDismiss}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            }
          />
        )}
      </div>
    );
  },
);
