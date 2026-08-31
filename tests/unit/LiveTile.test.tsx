import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { LiveTile } from "@/components/metro/LiveTile";

it("reveals useful secondary content only after activation", async () => {
  const user = userEvent.setup();
  render(<LiveTile label="Capability graph" href="/projects/capability-graph" front={<span>Current system</span>} back={<span>Curriculum to placement</span>} />);
  const tile = screen.getByRole("button", { name: "Show more: Capability graph" });
  expect(tile).toHaveAttribute("aria-pressed", "false");
  await user.click(tile);
  expect(tile).toHaveAttribute("aria-pressed", "true");
});

it("keeps proof and navigation on the front face", () => {
  render(<LiveTile label="Lead platform" href="/projects/lead-platform" front={<span>₹1Cr+ influenced</span>} back={<span>Submission latency reduced</span>} />);
  expect(screen.getByText("₹1Cr+ influenced")).toBeVisible();
  expect(screen.getByRole("link", { name: "View Lead platform" })).toHaveAttribute("href", "/projects/lead-platform");
});
