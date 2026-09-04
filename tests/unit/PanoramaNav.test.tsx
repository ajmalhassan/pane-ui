import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PanoramaNav, type PivotOption } from "@/components/metro/PanoramaNav";
import {
  PIVOT_IDS,
  pivotHref,
  pivotPanelId,
  pivotTabId,
  type PivotId,
} from "@/lib/content/pivots";

const HEADINGS = {
  me: "technical leader / builder",
  projects: "projects",
  blog: "blog",
  photography: "photography",
} as const;

const options: readonly PivotOption[] = PIVOT_IDS.map((id) => ({
  id,
  label: HEADINGS[id],
}));

function rotated(active: PivotId): readonly PivotId[] {
  const index = PIVOT_IDS.indexOf(active);
  return [...PIVOT_IDS.slice(index), ...PIVOT_IDS.slice(0, index)];
}

afterEach(cleanup);

describe("PanoramaNav", () => {
  it.each(PIVOT_IDS)(
    "names the one page heading after the active %s pivot",
    (active) => {
      render(
        <PanoramaNav active={active} onSelect={vi.fn()} options={options} />,
      );

      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveAccessibleName(HEADINGS[active]);
      expect(headings[0]).toBeVisible();
      expect(screen.getAllByRole("tablist")).toHaveLength(1);

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(PIVOT_IDS.length);
      for (const tab of tabs) expect(headings[0]).toContainElement(tab);
    },
  );

  it("reads the heading as space-separated words while keeping the active pivot's accessible name", () => {
    render(
      <PanoramaNav active="projects" onSelect={vi.fn()} options={options} />,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe(
      rotated("projects")
        .map((id) => HEADINGS[id])
        .join(" "),
    );
    expect(heading).toHaveAccessibleName(HEADINGS.projects);
  });

  it.each(PIVOT_IDS)(
    "leads with the active %s pivot and peeks at the next one",
    (active) => {
      render(
        <PanoramaNav active={active} onSelect={vi.fn()} options={options} />,
      );

      const tabs = screen.getAllByRole("tab");
      const order = rotated(active);
      expect(tabs.map((tab) => tab.id)).toEqual(order.map(pivotTabId));
      expect(tabs.map((tab) => tab.textContent)).toEqual(
        order.map((id) => HEADINGS[id]),
      );
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      for (const tab of tabs.slice(1)) {
        expect(tab).toHaveAttribute("aria-selected", "false");
      }
      expect(
        tabs.filter((tab) => tab.dataset.peek === "true").map((tab) => tab.id),
      ).toEqual([pivotTabId(order[1])]);
    },
  );

  it("keeps every pivot a real shareable link wired to its panel", () => {
    render(
      <PanoramaNav active="projects" onSelect={vi.fn()} options={options} />,
    );

    for (const id of PIVOT_IDS) {
      const tab = screen.getByRole("tab", { name: HEADINGS[id] });
      expect(tab.tagName).toBe("A");
      expect(tab).toHaveAttribute("href", pivotHref(id));
      expect(tab).toHaveAttribute("aria-controls", pivotPanelId(id));
      expect(tab).toHaveAttribute("id", pivotTabId(id));
    }
  });

  it("keeps every pivot in the sequential tab order behind the active one", async () => {
    const user = userEvent.setup();
    render(
      <PanoramaNav active="projects" onSelect={vi.fn()} options={options} />,
    );

    for (const id of rotated("projects")) {
      await user.tab();
      expect(screen.getByRole("tab", { name: HEADINGS[id] })).toHaveFocus();
    }
  });

  it("advances to the next pivot with ArrowRight", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PanoramaNav active="me" onSelect={onSelect} options={options} />);

    const me = screen.getByRole("tab", { name: HEADINGS.me });
    const projects = screen.getByRole("tab", { name: HEADINGS.projects });
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

  it("wraps past the last pivot with ArrowRight", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <PanoramaNav
        active="photography"
        onSelect={onSelect}
        options={options}
      />,
    );

    const photography = screen.getByRole("tab", {
      name: HEADINGS.photography,
    });
    const me = screen.getByRole("tab", { name: HEADINGS.me });
    me.addEventListener("click", (event) => event.preventDefault());
    photography.focus();
    await user.keyboard("{ArrowRight}");

    expect(onSelect).toHaveBeenCalledWith("me");
    expect(me).toHaveFocus();
  });

  it("wraps to the final pivot with ArrowLeft", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PanoramaNav active="me" onSelect={onSelect} options={options} />);

    const me = screen.getByRole("tab", { name: HEADINGS.me });
    const photography = screen.getByRole("tab", {
      name: HEADINGS.photography,
    });
    photography.addEventListener("click", (event) => event.preventDefault());
    me.focus();
    await user.keyboard("{ArrowLeft}");

    expect(onSelect).toHaveBeenCalledWith("photography");
    expect(photography).toHaveFocus();
  });

  it("reveals a focused heading the track has clipped", async () => {
    const user = userEvent.setup();
    const reveal = vi
      .spyOn(HTMLElement.prototype, "scrollIntoView")
      .mockImplementation(() => {});
    render(<PanoramaNav active="me" onSelect={vi.fn()} options={options} />);

    await user.tab();
    await user.tab();

    expect(screen.getByRole("tab", { name: HEADINGS.projects })).toHaveFocus();
    expect(reveal).toHaveBeenCalled();
    reveal.mockRestore();
  });

  it("resets the scrolled track when the active pivot changes", () => {
    const { rerender } = render(
      <PanoramaNav active="me" onSelect={vi.fn()} options={options} />,
    );
    const track = screen.getByRole("tablist");

    track.scrollLeft = 50;
    rerender(
      <PanoramaNav active="projects" onSelect={vi.fn()} options={options} />,
    );

    expect(track.scrollLeft).toBe(0);
  });

  it("resets the scrolled track once focus leaves the navigation entirely", () => {
    render(<PanoramaNav active="me" onSelect={vi.fn()} options={options} />);
    const track = screen.getByRole("tablist");
    const tabs = screen.getAllByRole("tab");

    track.scrollLeft = 50;
    // The reset handler lives on <nav> as onBlur; React implements onBlur via
    // the native, bubbling "focusout" event, so firing it on a tab and
    // letting it bubble is what actually reaches the handler (a bare
    // fireEvent.blur on the tab would not bubble to the nav).
    fireEvent.focusOut(tabs[3], { relatedTarget: document.body });

    expect(track.scrollLeft).toBe(0);
  });

  it("leaves the scrolled track alone when focus only moves between tabs", () => {
    render(<PanoramaNav active="me" onSelect={vi.fn()} options={options} />);
    const track = screen.getByRole("tablist");
    const tabs = screen.getAllByRole("tab");

    track.scrollLeft = 50;
    fireEvent.focusOut(tabs[3], { relatedTarget: tabs[0] });

    expect(track.scrollLeft).toBe(50);
  });

  it("enhances ordinary clicks and leaves modified clicks to the browser", () => {
    const onSelect = vi.fn();
    render(<PanoramaNav active="me" onSelect={onSelect} options={options} />);
    const projects = screen.getByRole("tab", { name: HEADINGS.projects });
    projects.addEventListener("click", (event) => event.preventDefault());

    fireEvent.click(projects, { metaKey: true });
    fireEvent.click(projects, { button: 1 });
    expect(projects).toHaveAttribute("href", "/?view=projects");
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.click(projects);
    expect(onSelect).toHaveBeenCalledWith("projects");
  });
});
