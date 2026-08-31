import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PivotList } from "@/components/metro/PivotList";

const options = [
  { id: "me" as const, label: "Me" },
  { id: "projects" as const, label: "Projects" },
  { id: "blog" as const, label: "Blog" },
  { id: "photography" as const, label: "Photography" },
];

afterEach(cleanup);

describe("PivotList", () => {
  it("uses tabs and advances with ArrowRight", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PivotList active="me" options={options} onSelect={onSelect} />);
    const me = screen.getByRole("tab", { name: "Me" });
    me.focus();
    await user.keyboard("{ArrowRight}");
    expect(onSelect).toHaveBeenCalledWith("projects");
    expect(screen.getByRole("tab", { name: "Projects" })).toHaveFocus();
  });

  it("uses real pivot URLs and exposes only the selected tab in the tab order", () => {
    render(
      <PivotList active="projects" options={options} onSelect={vi.fn()} />,
    );

    expect(screen.getByRole("tab", { name: "Me" })).toHaveAttribute(
      "href",
      "/?view=me",
    );
    expect(screen.getByRole("tab", { name: "Me" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("tab", { name: "Projects" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Projects" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("wraps to the final tab with ArrowLeft", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PivotList active="me" options={options} onSelect={onSelect} />);

    screen.getByRole("tab", { name: "Me" }).focus();
    await user.keyboard("{ArrowLeft}");

    expect(onSelect).toHaveBeenCalledWith("photography");
    expect(screen.getByRole("tab", { name: "Photography" })).toHaveFocus();
  });
});
