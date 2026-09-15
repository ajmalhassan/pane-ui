import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { Progress, ProgressRing } from "../../packages/react/src/Progress.js";
import { MessageBanner } from "../../packages/react/src/MessageBanner.js";

for (const Component of [Progress, ProgressRing]) {
  it("shares bounded determinate values and forwards native attributes/ref", () => {
    const ref = createRef<HTMLSpanElement>();
    const { rerender } = render(
      <Component
        label="Download"
        value={30}
        max={60}
        ref={ref}
        aria-valuetext="30 of 60 files"
        id="download"
      />,
    );
    const bar = screen.getByRole("progressbar", { name: "Download" });
    expect(ref.current).toBe(bar);
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(bar).toHaveAttribute("aria-valuemax", "60");
    expect(bar).toHaveAttribute("aria-valuetext", "30 of 60 files");
    rerender(<Component label="Download" value={120} max={60} />);
    expect(bar).toHaveAttribute("aria-valuenow", "60");
    rerender(<Component label="Download" value={-10} max={0} />);
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });
  it("handles unknown/nonfinite values and switches modes without stale percentages", () => {
    const { rerender } = render(<Component label="Download" value={50} />);
    rerender(<Component label="Download" value={Number.NaN} />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuenow",
    );
    rerender(<Component label="Download" value={Infinity} max={Infinity} />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuenow",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "100",
    );
    rerender(<Component label="Download" value={0} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });
  it("renders SSR content and supports decorative and hidden usage", () => {
    expect(renderToString(<Component label="Download" value={25} />)).toContain(
      'aria-valuenow="25"',
    );
    const { container } = render(<Component decorative value={25} />);
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
}
it("keeps announcement policy independent of severity and action controls", () => {
  const { rerender } = render(
    <MessageBanner tone="error" heading="Connection lost">
      Try again.
    </MessageBanner>,
  );
  expect(screen.queryByRole("alert")).toBeNull();
  rerender(
    <MessageBanner
      tone="success"
      announcement="polite"
      heading="Saved"
      actions={<button>Undo</button>}
    >
      All changes saved.
    </MessageBanner>,
  );
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("SavedAll changes saved.");
  expect(status).not.toContainElement(
    screen.getByRole("button", { name: "Undo" }),
  );
  rerender(
    <MessageBanner tone="error" announcement="assertive">
      Connection lost.
    </MessageBanner>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Connection lost.");
});
it("dismissal is a labelled native command; visibility and focus remain owner controlled", () => {
  const onDismiss = vi.fn();
  const ref = createRef<HTMLDivElement>();
  render(
    <MessageBanner
      ref={ref}
      onDismiss={onDismiss}
      dismissLabel="Dismiss saved message"
      heading="Saved"
    >
      Done.
    </MessageBanner>,
  );
  const button = screen.getByRole("button", { name: "Dismiss saved message" });
  expect(button).toHaveAttribute("type", "button");
  button.focus();
  fireEvent.click(button);
  expect(onDismiss).toHaveBeenCalledOnce();
  expect(button).toHaveFocus();
  expect(ref.current).toHaveTextContent("Saved");
});
it("renders persistent messages on the server without timers or focus effects", () => {
  const html = renderToString(
    <MessageBanner heading="Offline" tone="warning">
      Changes stay on this device.
    </MessageBanner>,
  );
  expect(html).toContain("Changes stay on this device.");
  expect(html).not.toContain('role="alert"');
});
