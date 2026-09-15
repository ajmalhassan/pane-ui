import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Menu, Popover } from "../../packages/react/src/Floating.js";
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "showPopover", {
    configurable: true,
    value: function (this: HTMLElement) {
      this.style.display = "block";
    },
  });
});
afterEach(() => {
  cleanup();
  delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
});
it("renders labelled native triggers on the server without opening content", () => {
  const html = renderToString(
    <Menu
      label="Actions"
      items={[{ id: "rename", label: "Rename", onSelect: () => {} }]}
    />,
  );
  expect(html).toContain('type="button"');
  expect(html).toContain('aria-haspopup="menu"');
  expect(html).not.toContain('role="menu"');
});
it("runs enabled commands once, excludes disabled commands and returns the trigger ref", async () => {
  const command = vi.fn();
  const ref = { current: null as HTMLButtonElement | null };
  render(
    <Menu
      ref={ref}
      label="Actions"
      items={[
        { id: "rename", label: "Rename", onSelect: command },
        { id: "move", label: "Move", disabled: true, onSelect: command },
      ]}
    />,
  );
  expect(ref.current).toBe(screen.getByRole("button", { name: "Actions" }));
  fireEvent.click(ref.current!);
  await act(async () => {});
  expect(screen.getByRole("menuitem", { name: "Move" })).toBeDisabled();
  fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
  await act(async () => {});
  expect(command).toHaveBeenCalledOnce();
  expect(screen.queryByRole("menu")).toBeNull();
});
it("controlled popovers request changes while their owner retains state", async () => {
  const change = vi.fn();
  render(
    <Popover
      label="Filters"
      title="Filter photos"
      open={false}
      onOpenChange={change}
    >
      <input aria-label="Query" />
    </Popover>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  await act(async () => {});
  expect(change).toHaveBeenCalledWith(true);
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("popover names its panel, exposes regular controls and allows explicit closure", async () => {
  render(
    <Popover label="Filters" title="Filter photos">
      {({ close }) => (
        <>
          <input aria-label="Query" />
          <button onClick={close}>Done</button>
        </>
      )}
    </Popover>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  await act(async () => {});
  expect(
    screen.getByRole("dialog", { name: "Filter photos" }),
  ).toContainElement(screen.getByRole("textbox"));
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  await act(async () => {});
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("preserves trigger handlers and blocks keyboard opening while loading", async () => {
  const pointer = vi.fn();
  const { rerender } = render(
    <Menu
      label="Actions"
      triggerProps={{ onPointerDown: pointer, loading: true }}
      items={[{ id: "a", label: "Alpha", onSelect: () => {} }]}
    />,
  );
  const trigger = screen.getByRole("button", { name: "Actions" });
  fireEvent.pointerDown(trigger);
  expect(pointer).toHaveBeenCalledOnce();
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  await act(async () => {});
  expect(screen.queryByRole("menu")).toBeNull();
  rerender(
    <Popover
      label="Filters"
      title="Filters"
      triggerProps={{
        onMouseDown: (event) => event.preventDefault(),
        onClick: (event) => event.preventDefault(),
      }}
    >
      Content
    </Popover>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  await act(async () => {});
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("reconciles menu navigation when items are removed", async () => {
  const items = ["Alpha", "Beta", "Gamma", "Delta"].map((label) => ({
    id: label,
    label,
    onSelect: () => {},
  }));
  const { rerender } = render(<Menu label="Actions" items={items} />);
  fireEvent.click(screen.getByRole("button", { name: "Actions" }));
  await act(async () => {});
  rerender(<Menu label="Actions" items={items.slice(0, 2)} />);
  await act(async () => {});
  fireEvent.keyDown(screen.getByRole("menu"), { key: "End" });
  await act(async () => {});
  expect(screen.getByRole("menuitem", { name: "Beta" })).toHaveAttribute(
    "tabindex",
    "0",
  );
});
