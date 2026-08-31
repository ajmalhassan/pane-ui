import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { LiveTile } from "@/components/metro/LiveTile";

it("reveals useful secondary content only after activation", async () => {
  const user = userEvent.setup();
  render(<LiveTile label="Capability graph" href="/projects/capability-graph" front={<span>Current system</span>} back={<span>Curriculum to placement</span>} />);
  const tile = screen.getByRole("button", { name: "Show more: Capability graph" });
  const backFace = screen.getByText("Curriculum to placement").parentElement;
  expect(tile).toHaveAttribute("aria-pressed", "false");
  expect(backFace).toHaveAttribute("aria-hidden", "true");
  await user.click(tile);
  expect(tile).toHaveAttribute("aria-pressed", "true");
  expect(backFace).toHaveAttribute("aria-hidden", "false");
});

it("keeps proof and navigation on the front face", () => {
  render(<LiveTile label="Lead platform" href="/projects/lead-platform" front={<span>₹1Cr+ influenced</span>} back={<span>Submission latency reduced</span>} />);
  expect(screen.getByText("₹1Cr+ influenced")).toBeVisible();
  expect(screen.getByRole("link", { name: "View Lead platform" })).toHaveAttribute("href", "/projects/lead-platform");
});
