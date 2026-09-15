import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { ProgressDots } from "../../packages/react/src/ProgressDots.js";
import { Button } from "../../packages/react/src/Button.js";

it("exposes named indeterminate progress without inventing a percentage", () => {
  const ref = createRef<HTMLSpanElement>();
  render(<ProgressDots label="Syncing collection" ref={ref} id="sync" />);
  const progress = screen.getByRole("progressbar", {
    name: "Syncing collection",
  });
  expect(ref.current).toBe(progress);
  expect(progress).not.toHaveAttribute("aria-valuenow");
  expect(progress.children).toHaveLength(5);
  expect(renderToString(<ProgressDots label="Loading" />)).toContain(
    'role="progressbar"',
  );
});

it("uses decorative dots in buttons without changing the label or adding a progress control", () => {
  render(<Button loading>Save collection</Button>);
  expect(
    screen.getByRole("button", { name: "Save collection" }),
  ).toHaveAttribute("aria-busy", "true");
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(document.querySelector(".wp-button-progress")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(
    document.querySelectorAll(".wp-button-progress .wp-progress-dot"),
  ).toHaveLength(5);
});
