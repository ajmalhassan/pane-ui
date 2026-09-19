import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import {
  Button,
  IconButton,
  BackButton,
} from "../../packages/react/src/Button.js";
import { AppBarLink, AppBarOverflow } from "../../packages/react/src/AppBar.js";

it("preserves form submission, native disabled behavior, and button refs", async () => {
  const user = userEvent.setup();
  const submit = vi.fn((e) => e.preventDefault());
  const ref = createRef<HTMLButtonElement>();
  render(
    <form onSubmit={submit}>
      <Button ref={ref}>Cancel</Button>
      <Button type="submit" name="action" value="save">
        Save
      </Button>
      <Button disabled>Unavailable</Button>
    </form>,
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(submit).not.toHaveBeenCalled();
  expect(ref.current).toBe(screen.getByText("Cancel").closest("button"));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(submit).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
});

it("keeps a loading button focused and named while blocking activation and submit", async () => {
  const user = userEvent.setup();
  const click = vi.fn();
  const submit = vi.fn((e) => e.preventDefault());
  const view = render(
    <form onSubmit={submit}>
      <Button type="submit" onClick={click}>
        Save
      </Button>
    </form>,
  );
  const button = screen.getByRole("button", { name: "Save" });
  button.focus();
  view.rerender(
    <form onSubmit={submit}>
      <Button type="submit" loading onClick={click}>
        Save
      </Button>
    </form>,
  );
  expect(button).toHaveFocus();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(button).toHaveAttribute("aria-disabled", "true");
  await user.keyboard("{Enter} ");
  await user.click(button);
  expect(click).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
  expect(button).toHaveAccessibleName("Save");
});

it("preserves consumer cancellation and icon button naming", async () => {
  const user = userEvent.setup();
  const submit = vi.fn((e) => e.preventDefault());
  render(
    <form onSubmit={submit}>
      <IconButton
        label="Add item"
        icon={
          <svg>
            <title>Decorative plus</title>
          </svg>
        }
        type="submit"
        onClick={(e) => e.preventDefault()}
      />
    </form>,
  );
  await user.click(screen.getByRole("button", { name: "Add item" }));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByRole("button")).toHaveAttribute("title", "Add item");
});

it("renders real app-bar destinations and forwards anchor attributes and cancellation", () => {
  const ref = createRef<HTMLAnchorElement>();
  const click = vi.fn((e) => e.preventDefault());
  render(
    <AppBarLink
      ref={ref}
      label="Documentation"
      icon={<span>?</span>}
      href="/docs"
      target="_blank"
      rel="noreferrer"
      onClick={click}
    />,
  );
  const link = screen.getByRole("link", { name: "Documentation" });
  expect(ref.current).toBe(link);
  expect(link).toHaveAttribute("href", "/docs");
  expect(link).toHaveAttribute("target", "_blank");
  fireEvent.click(link, { ctrlKey: true });
  expect(click).toHaveBeenCalledTimes(1);
});

it("expands commands, uses normal Tab order, and restores focus on Escape", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <AppBarOverflow onOpenChange={change}>
      <Button>Archive</Button>
      <a href="#help">Help</a>
    </AppBarOverflow>,
  );
  const trigger = screen.getByRole("button", { name: "More commands" });
  expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  await user.tab();
  expect(screen.getByRole("button", { name: "Archive" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(change.mock.calls).toEqual([[true], [false]]);
});

it("allows controlled overflow ownership and consumer Escape cancellation", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const view = render(
    <AppBarOverflow
      open
      onOpenChange={change}
      onKeyDown={(e) => e.preventDefault()}
    >
      <Button>Archive</Button>
    </AppBarOverflow>,
  );
  const archive = screen.getByRole("button", { name: "Archive" });
  archive.focus();
  await user.keyboard("{Escape}");
  expect(change).not.toHaveBeenCalled();
  view.rerender(
    <AppBarOverflow open onOpenChange={change}>
      <Button>Archive</Button>
    </AppBarOverflow>,
  );
  await user.keyboard("{Escape}");
  expect(change).toHaveBeenCalledWith(false);
  expect(archive).toHaveFocus();
  view.rerender(
    <AppBarOverflow open={false} onOpenChange={change}>
      <Button>Archive</Button>
    </AppBarOverflow>,
  );
  expect(screen.getByRole("button", { name: "More commands" })).toHaveFocus();
});

it("server renders commands and does not notify on initial overflow state", () => {
  const change = vi.fn();
  render(
    <AppBarOverflow defaultOpen onOpenChange={change}>
      Commands
    </AppBarOverflow>,
  );
  expect(change).not.toHaveBeenCalled();
  const html = renderToString(
    <>
      <Button loading>Save</Button>
      <IconButton icon="+" label="Add" />
      <AppBarLink href="/docs" label="Docs" icon="?" />
      <AppBarOverflow defaultOpen>Extra</AppBarOverflow>
    </>,
  );
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain('href="/docs"');
  expect(html).toContain('aria-expanded="true"');
});

it("does not steal focus when the owner closes overflow after focus moves outside", async () => {
  const user = userEvent.setup();
  const view = render(
    <>
      <AppBarOverflow open>
        <Button>Archive</Button>
      </AppBarOverflow>
      <Button>Outside</Button>
    </>,
  );
  screen.getByRole("button", { name: "Archive" }).focus();
  await user.click(screen.getByRole("button", { name: "Outside" }));
  view.rerender(
    <>
      <AppBarOverflow open={false}>
        <Button>Archive</Button>
      </AppBarOverflow>
      <Button>Outside</Button>
    </>,
  );
  expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
});

it("does not reclaim external focus after the focused command was removed", () => {
  const view = render(
    <>
      <AppBarOverflow open>
        <Button>Archive</Button>
      </AppBarOverflow>
      <Button>Outside</Button>
    </>,
  );
  screen.getByRole("button", { name: "Archive" }).focus();
  view.rerender(
    <>
      <AppBarOverflow open>Nothing to archive</AppBarOverflow>
      <Button>Outside</Button>
    </>,
  );
  const outside = screen.getByRole("button", { name: "Outside" });
  outside.focus();
  view.rerender(
    <>
      <AppBarOverflow open={false}>Nothing to archive</AppBarOverflow>
      <Button>Outside</Button>
    </>,
  );
  expect(outside).toHaveFocus();
});

it("BackButton preserves native keyboard, ref, naming and disabled contracts", async () => {
  const user = userEvent.setup();
  const back = vi.fn();
  const submit = vi.fn((event) => event.preventDefault());
  const ref = createRef<HTMLButtonElement>();
  const { rerender } = render(
    <form onSubmit={submit}>
      <BackButton ref={ref} label="Back to Start" onClick={back} />
    </form>,
  );
  const button = screen.getByRole("button", { name: "Back to Start" });
  expect(ref.current).toBe(button);
  button.focus();
  await user.keyboard("{Enter}");
  expect(back).toHaveBeenCalledTimes(1);
  expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  rerender(<BackButton disabled onClick={back} />);
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(back).toHaveBeenCalledTimes(1);
});
