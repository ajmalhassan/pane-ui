import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import {
  List,
  ListItem,
  SectionHeader,
  EmptyState,
} from "../../packages/react/src/List.js";
it("renders direct native list items and forwards refs/attributes", () => {
  const list = createRef<HTMLUListElement>();
  const item = createRef<HTMLLIElement>();
  render(
    <List ref={list} aria-label="Collections">
      <ListItem ref={item} title="Weekend" description="24 photos" />
    </List>,
  );
  expect(list.current).toBe(screen.getByRole("list", { name: "Collections" }));
  expect(item.current?.parentElement).toBe(list.current);
  expect(screen.getByRole("listitem")).toHaveTextContent("Weekend24 photos");
});
it("keeps a row link and secondary commands as separate native controls", () => {
  const action = vi.fn();
  render(
    <List>
      <ListItem
        title="Weekend"
        action={{
          type: "link",
          href: "/collections/weekend",
          props: { target: "_blank", rel: "noreferrer" },
        }}
        actions={<button onClick={action}>Weekend actions</button>}
      />
    </List>,
  );
  const link = screen.getByRole("link", { name: "Weekend" });
  const button = screen.getByRole("button", { name: "Weekend actions" });
  expect(link).toHaveAttribute("href", "/collections/weekend");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).not.toContainElement(button);
  fireEvent.click(button);
  expect(action).toHaveBeenCalledOnce();
});
it("supports disabled primary buttons without disabling independent actions", () => {
  const primary = vi.fn(),
    secondary = vi.fn();
  render(
    <List>
      <ListItem
        title="Syncing"
        action={{ type: "button", props: { disabled: true, onClick: primary } }}
        actions={<button onClick={secondary}>Details</button>}
      />
    </List>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Syncing" }));
  fireEvent.click(screen.getByRole("button", { name: "Details" }));
  expect(primary).not.toHaveBeenCalled();
  expect(secondary).toHaveBeenCalledOnce();
});
it("supports heading levels and a named persistent empty state with recovery actions", () => {
  render(
    <>
      <SectionHeader level={3} meta="2 collections">
        recent
      </SectionHeader>
      <EmptyState
        title="No matches"
        description="Try another search."
        actions={<button>Clear search</button>}
      />
    </>,
  );
  expect(
    screen.getByRole("heading", { name: "recent 2 collections" }).tagName,
  ).toBe("H3");
  const empty = screen.getByRole("region", { name: "No matches" });
  expect(empty).toContainElement(
    screen.getByRole("button", { name: "Clear search" }),
  );
  expect(screen.queryByRole("alert")).toBeNull();
});
it("renders complete list and empty-state content on the server", () => {
  const html = renderToString(
    <>
      <List animate>
        <ListItem title="Weekend" description="24 photos" />
      </List>
      <EmptyState title="Start a collection" />
    </>,
  );
  expect(html).toContain("<ul");
  expect(html).toContain("<li");
  expect(html).toContain("24 photos");
  expect(html).toContain("Start a collection");
});
