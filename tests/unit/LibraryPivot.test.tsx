import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  Pivot,
  PivotList,
  PivotTrigger,
  PivotPanel,
  type PivotProps,
} from "../../packages/react/src/Pivot.js";
function Example(
  props: PivotProps & { disableA?: boolean; removeA?: boolean },
) {
  const { disableA, removeA, ...rest } = props;
  return (
    <Pivot {...rest}>
      <PivotList aria-label="Sections">
        {!removeA && (
          <PivotTrigger value="a" disabled={disableA}>
            Alpha
          </PivotTrigger>
        )}
        <PivotTrigger value="b" disabled>
          Beta
        </PivotTrigger>
        <PivotTrigger value="c">Charlie</PivotTrigger>
      </PivotList>
      <PivotPanel value="a">
        <input aria-label="Draft" />
      </PivotPanel>
      <PivotPanel value="c">Third</PivotPanel>
    </Pivot>
  );
}
describe("Pivot", () => {
  it("links unique native tabs and mounted panels, retaining state", async () => {
    render(
      <>
        <Example />
        <Example />
      </>,
    );
    const lists = screen.getAllByRole("tablist");
    const first = within(lists[0]).getByRole("tab", { name: "Alpha" });
    const other = within(lists[1]).getByRole("tab", { name: "Alpha" });
    expect(first.id).not.toBe(other.id);
    expect(
      document.getElementById(first.getAttribute("aria-controls")!),
    ).toHaveAttribute("aria-labelledby", first.id);
    await userEvent.type(screen.getAllByLabelText("Draft")[0], "preserved");
    await userEvent.click(
      within(lists[0]).getByRole("tab", { name: "Charlie" }),
    );
    expect(
      screen.getAllByLabelText("Draft")[0].closest('[role="tabpanel"]'),
    ).toHaveAttribute("hidden");
    expect(
      screen.getAllByLabelText("Draft")[0].closest('[role="tabpanel"]'),
    ).toHaveAttribute("inert");
    await userEvent.click(first);
    expect(screen.getAllByLabelText("Draft")[0]).toHaveValue("preserved");
  });
  it("skips disabled tabs and supports arrows, wrapping, Home and End", () => {
    render(<Example />);
    const a = screen.getByRole("tab", { name: "Alpha" });
    const c = screen.getByRole("tab", { name: "Charlie" });
    a.focus();
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(c).toHaveFocus();
    expect(c).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(c, { key: "ArrowRight" });
    expect(a).toHaveFocus();
    fireEvent.keyDown(a, { key: "End" });
    expect(c).toHaveFocus();
    fireEvent.keyDown(c, { key: "Home" });
    expect(a).toHaveFocus();
  });
  it("supports RTL and vertical orientation without consuming orthogonal arrows", () => {
    const { rerender } = render(<Example dir="rtl" />);
    let a = screen.getByRole("tab", { name: "Alpha" });
    a.focus();
    fireEvent.keyDown(a, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveFocus();
    rerender(<Example orientation="vertical" />);
    a = screen.getByRole("tab", { name: "Alpha" });
    a.focus();
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(a).toHaveFocus();
    fireEvent.keyDown(a, { key: "ArrowDown" });
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveFocus();
  });
  it("manual activation uses native Enter/Space once and controlled selection stays owner driven", async () => {
    const change = vi.fn();
    render(
      <Example value="a" activationMode="manual" onValueChange={change} />,
    );
    const a = screen.getByRole("tab", { name: "Alpha" }),
      c = screen.getByRole("tab", { name: "Charlie" });
    a.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(c).toHaveFocus();
    expect(change).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    expect(change).toHaveBeenCalledExactlyOnceWith("c");
    expect(a).toHaveAttribute("aria-selected", "true");
    change.mockClear();
    await userEvent.keyboard(" ");
    expect(change).toHaveBeenCalledExactlyOnceWith("c");
  });
  it("repairs selection and a single tab stop when items disable or disappear", () => {
    const { rerender } = render(<Example />);
    rerender(<Example disableA />);
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    rerender(<Example removeA />);
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });
  it("handles all disabled then reenabled and consumer cancellation/ref props", async () => {
    const ref = createRef<HTMLButtonElement>();
    const change = vi.fn();
    const view = (disabled: boolean) => (
      <Pivot onValueChange={change}>
        <PivotList aria-label="Only">
          <PivotTrigger
            value="x"
            disabled={disabled}
            ref={ref}
            onClick={(e) => e.preventDefault()}
          >
            One
          </PivotTrigger>
          <PivotTrigger
            value="y"
            disabled={disabled}
            onKeyDown={(e) => e.preventDefault()}
          >
            Two
          </PivotTrigger>
        </PivotList>
        <PivotPanel value="x">X</PivotPanel>
        <PivotPanel value="y">Y</PivotPanel>
      </Pivot>
    );
    const { rerender } = render(view(true));
    expect(screen.getAllByRole("tab").every((t) => t.tabIndex === -1)).toBe(
      true,
    );
    rerender(view(false));
    expect(ref.current).toHaveAttribute("tabindex", "0");
    await userEvent.click(screen.getByRole("tab", { name: "Two" }));
    change.mockClear();
    await userEvent.click(ref.current!);
    expect(change).not.toHaveBeenCalled();
    const two = screen.getByRole("tab", { name: "Two" });
    two.focus();
    fireEvent.keyDown(two, { key: "Home" });
    expect(two).toHaveFocus();
  });
  it("renders usable initial tab semantics on the server", () => {
    const html = renderToString(<Example />);
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('role="tabpanel"');
  });
  it("keeps nested instances independent and discovers custom trigger wrappers", () => {
    function CustomTrigger() {
      return <PivotTrigger value="wrapped">Wrapped</PivotTrigger>;
    }
    render(
      <Pivot>
        <PivotList aria-label="Outer">
          <CustomTrigger />
          <PivotTrigger value="other">Other</PivotTrigger>
        </PivotList>
        <PivotPanel value="wrapped">
          <Example />
        </PivotPanel>
        <PivotPanel value="other">Other panel</PivotPanel>
      </Pivot>,
    );
    const outer = screen.getByRole("tablist", { name: "Outer" });
    const inner = screen.getByRole("tablist", { name: "Sections" });
    const a = within(inner).getByRole("tab", { name: "Alpha" });
    a.focus();
    fireEvent.keyDown(a, { key: "End" });
    expect(within(outer).getByRole("tab", { name: "Wrapped" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(within(inner).getByRole("tab", { name: "Charlie" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
  it("repairs actual focus when the focused tab is removed", () => {
    const { rerender } = render(<Example />);
    screen.getByRole("tab", { name: "Alpha" }).focus();
    rerender(<Example removeA />);
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveFocus();
  });
  it("uses current visual DOM order after reordering tabs", () => {
    const view = (values: string[]) => (
      <Pivot>
        <PivotList aria-label="Order">
          {values.map((value) => (
            <PivotTrigger key={value} value={value}>
              {value}
            </PivotTrigger>
          ))}
        </PivotList>
      </Pivot>
    );
    const { rerender } = render(view(["a", "b", "c"]));
    rerender(view(["a", "c", "b"]));
    const a = screen.getByRole("tab", { name: "a" });
    a.focus();
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "c" })).toHaveFocus();
  });
  it("automatic controlled arrows request only once and accept owner updates", () => {
    const change = vi.fn();
    const { rerender } = render(<Example value="a" onValueChange={change} />);
    const a = screen.getByRole("tab", { name: "Alpha" });
    a.focus();
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(change).toHaveBeenCalledExactlyOnceWith("c");
    expect(a).toHaveAttribute("aria-selected", "true");
    rerender(<Example value="c" onValueChange={change} />);
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("moves actual focus away from a tab disabled dynamically", () => {
    const { rerender } = render(<Example />);
    screen.getByRole("tab", { name: "Alpha" }).focus();
    rerender(<Example disableA />);
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveFocus();
  });

  it("does not steal focus after all tabs were disabled and focus moved elsewhere", () => {
    const view = (disabled: boolean) => (
      <>
        <input aria-label="Outside" />
        <Pivot>
          <PivotList aria-label="Single">
            <PivotTrigger value="one" disabled={disabled}>
              Single
            </PivotTrigger>
          </PivotList>
          <PivotPanel value="one">Panel</PivotPanel>
        </Pivot>
      </>
    );
    const { rerender } = render(view(false));
    screen.getByRole("tab").focus();
    rerender(view(true));
    screen.getByLabelText("Outside").focus();
    rerender(view(false));
    expect(screen.getByLabelText("Outside")).toHaveFocus();
  });
  it("retains default selection through item reordering", () => {
    const view = (values: string[]) => (
      <Pivot>
        <PivotList aria-label="Reorder">
          {values.map((value) => (
            <PivotTrigger key={value} value={value}>
              {value}
            </PivotTrigger>
          ))}
        </PivotList>
      </Pivot>
    );
    const { rerender } = render(view(["a", "b"]));
    rerender(view(["b", "a"]));
    const b = screen.getByRole("tab", { name: "b" });
    b.focus();
    fireEvent.focus(b);
    expect(screen.getByRole("tab", { name: "a" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
  it("supports an explicit server selection behind custom component boundaries", () => {
    function Custom() {
      return <PivotTrigger value="custom">Custom</PivotTrigger>;
    }
    const html = renderToString(
      <Pivot defaultValue="custom">
        <PivotList aria-label="Wrapped">
          <Custom />
        </PivotList>
        <PivotPanel value="custom">Content</PivotPanel>
      </Pivot>,
    );
    expect(html).toContain('aria-selected="true"');
    expect(html).not.toContain('hidden=""');
  });
});

it("preserves caller hidden and inert on the selected panel", () => {
  const { container, rerender } = render(
    <Pivot value="a">
      <PivotPanel value="a" hidden inert>
        Private
      </PivotPanel>
    </Pivot>,
  );
  const panel = container.querySelector('[role="tabpanel"]')!;
  expect(panel).toHaveAttribute("hidden");
  expect(panel).toHaveAttribute("inert");
  rerender(
    <Pivot value="b">
      <PivotPanel value="a" hidden={false} inert={false}>
        Private
      </PivotPanel>
    </Pivot>,
  );
  expect(panel).toHaveAttribute("hidden");
  expect(panel).toHaveAttribute("inert");
});
