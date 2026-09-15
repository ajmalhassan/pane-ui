import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { Dialog, AlertDialog } from "../../packages/react/src/Dialog.js";
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});
afterEach(() => {
  cleanup();
  delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
  delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
  vi.restoreAllMocks();
});
it("keeps SSR closed and names dialogs with stable heading and description IDs", () => {
  const html = renderToString(
    <Dialog
      open
      title="Edit"
      description="Change the name"
      onOpenChange={() => {}}
    >
      Form
    </Dialog>,
  );
  expect(html).not.toMatch(/<dialog[^>]* open/);
  const ref = createRef<HTMLDialogElement>();
  render(
    <Dialog
      ref={ref}
      open
      title="Edit"
      description="Change the name"
      onOpenChange={() => {}}
    >
      Form
    </Dialog>,
  );
  const dialog = screen.getByRole("dialog", { name: "Edit" });
  expect(dialog).toHaveAccessibleDescription("Change the name");
  expect(ref.current).toBe(dialog);
});
it("requests Escape dismissal and lets the consumer cancel it", () => {
  const change = vi.fn();
  const { rerender } = render(
    <Dialog open title="Edit" onOpenChange={change}>
      Form
    </Dialog>,
  );
  const dialog = screen.getByRole("dialog");
  const event = new Event("cancel", { cancelable: true });
  fireEvent(dialog, event);
  expect(event.defaultPrevented).toBe(true);
  expect(change).toHaveBeenCalledWith(false, "escape");
  change.mockClear();
  rerender(
    <Dialog
      open
      title="Edit"
      onOpenChange={change}
      onCancel={(event) => event.preventDefault()}
    >
      Form
    </Dialog>,
  );
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(change).not.toHaveBeenCalled();
});
it("closes after exit and balances scroll ownership through StrictMode and nested instances", async () => {
  document.documentElement.style.overflow = "scroll";
  const { rerender, unmount } = render(
    <StrictMode>
      <Dialog open title="One" onOpenChange={() => {}}>
        One
      </Dialog>
      <AlertDialog
        open
        title="Two"
        description="Confirm"
        onOpenChange={() => {}}
      >
        Two
      </AlertDialog>
    </StrictMode>,
  );
  expect(document.documentElement.style.overflow).toBe("hidden");
  rerender(
    <StrictMode>
      <Dialog open={false} title="One" onOpenChange={() => {}}>
        One
      </Dialog>
      <AlertDialog
        open
        title="Two"
        description="Confirm"
        onOpenChange={() => {}}
      >
        Two
      </AlertDialog>
    </StrictMode>,
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(document.documentElement.style.overflow).toBe("hidden");
  unmount();
  expect(document.documentElement.style.overflow).toBe("scroll");
  document.documentElement.style.removeProperty("overflow");
});

it("honors explicit final focus on native close and unmount without taking another control focus", () => {
  const target = document.createElement("button");
  document.body.append(target);
  const ref = createRef<HTMLDialogElement>();
  const change = vi.fn();
  const { unmount } = render(
    <Dialog
      ref={ref}
      open
      title="Edit"
      onOpenChange={change}
      finalFocusRef={{ current: target }}
    >
      <button>Inside</button>
    </Dialog>,
  );
  screen.getByRole("button", { name: "Inside" }).focus();
  ref.current!.close();
  document.body.tabIndex = -1;
  document.body.focus();
  fireEvent(ref.current!, new Event("close"));
  expect(target).toHaveFocus();
  expect(change).toHaveBeenCalledWith(false, "native");
  screen.getByRole("button", { name: "Inside" }).focus();
  unmount();
  expect(target).toHaveFocus();
  target.remove();
  document.body.removeAttribute("tabindex");
});
