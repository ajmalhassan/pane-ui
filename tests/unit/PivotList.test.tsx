import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    const projects = screen.getByRole("tab", { name: "Projects" });
    const projectsActivation = vi.fn();
    projects.addEventListener("click", (event) => {
      event.preventDefault();
      projectsActivation();
    });
    me.focus();
    await user.keyboard("{ArrowRight}");
    expect(projectsActivation).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith("projects");
    expect(projects).toHaveFocus();
  });

  it("uses real pivot URLs and keeps every tab in the sequential tab order", async () => {
    const user = userEvent.setup();
    render(
      <PivotList active="projects" options={options} onSelect={vi.fn()} />,
    );

    const me = screen.getByRole("tab", { name: "Me" });
    const projects = screen.getByRole("tab", { name: "Projects" });
    const blog = screen.getByRole("tab", { name: "Blog" });
    const photography = screen.getByRole("tab", { name: "Photography" });

    expect(me).toHaveAttribute("href", "/?view=me");
    expect(projects).toHaveAttribute("aria-selected", "true");

    await user.tab();
    expect(me).toHaveFocus();
    await user.tab();
    expect(projects).toHaveFocus();
    await user.tab();
    expect(blog).toHaveFocus();
    await user.tab();
    expect(photography).toHaveFocus();
  });

  it("leaves modified clicks to the link without selecting in the current page", () => {
    const onSelect = vi.fn();
    render(<PivotList active="me" options={options} onSelect={onSelect} />);
    const projects = screen.getByRole("tab", { name: "Projects" });
    projects.addEventListener("click", (event) => event.preventDefault());

    fireEvent.click(projects, { metaKey: true });

    expect(projects).toHaveAttribute("href", "/?view=projects");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("wraps to the final tab with ArrowLeft", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PivotList active="me" options={options} onSelect={onSelect} />);

    const me = screen.getByRole("tab", { name: "Me" });
    const photography = screen.getByRole("tab", { name: "Photography" });
    photography.addEventListener("click", (event) => event.preventDefault());
    me.focus();
    await user.keyboard("{ArrowLeft}");

    expect(onSelect).toHaveBeenCalledWith("photography");
    expect(photography).toHaveFocus();
  });
});
