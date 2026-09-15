import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PhoneDemo } from "../../components/phone/PhoneDemo";
afterEach(() => vi.restoreAllMocks());
it("opens apps, restores tile focus on back, and changes theme across screens", async () => {
  const { container } = render(<PhoneDemo />);
  fireEvent.click(screen.getByRole("button", { name: "Open Settings" }));
  expect(
    await screen.findByRole("heading", { name: "settings" }),
  ).toHaveFocus();
  fireEvent.click(screen.getByLabelText("light"));
  fireEvent.click(screen.getByLabelText("orange"));
  expect(container.querySelector(".wp-theme")).toHaveAttribute(
    "data-mode",
    "light",
  );
  expect(container.querySelector(".wp-theme")).toHaveAttribute(
    "data-accent",
    "orange",
  );
  fireEvent.click(screen.getByRole("button", { name: "Phone back" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Open Settings" })).toHaveFocus(),
  );
  fireEvent.click(screen.getByRole("button", { name: "all apps" }));
  fireEvent.change(
    await screen.findByRole("textbox", { name: "Search applications" }),
    { target: { value: "ph" } },
  );
  expect(screen.getByRole("button", { name: "Photos" })).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "People" }),
  ).not.toBeInTheDocument();
});
it("composes a local message and keeps it in the conversation and inbox", async () => {
  render(<PhoneDemo />);
  fireEvent.click(screen.getByRole("button", { name: "Open Messaging" }));
  fireEvent.click(await screen.findByRole("button", { name: "new" }));
  fireEvent.change(await screen.findByRole("textbox", { name: "To" }), {
    target: { value: "Robin" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
    target: { value: "Meet at noon" },
  });
  fireEvent.click(screen.getByRole("button", { name: "send message" }));
  expect(await screen.findByRole("heading", { name: "robin" })).toBeVisible();
  expect(screen.getByText("Meet at noon")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Phone Start" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Open Messaging" }),
  );
  expect(await screen.findByText("Meet at noon")).toBeVisible();
});
it("does not swap the Start screen before real animation completion and reverses rapid Back", async () => {
  const completions: (() => void)[] = [];
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value: vi.fn(() => ({
      finished: new Promise<void>((resolve) => completions.push(resolve)),
      cancel: vi.fn(),
    })),
  });
  try {
    const { container } = render(<PhoneDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Open People" }));
    expect(container.querySelector("[data-phone-screen]")).toHaveAttribute(
      "data-phone-screen",
      "start",
    );
    expect(container.querySelector(".wp-tile-sequence")).toHaveAttribute(
      "data-state",
      "exiting",
    );
    fireEvent.click(screen.getByRole("button", { name: "Phone back" }));
    await act(async () => {
      completions.forEach((resolve) => resolve());
    });
    expect(container.querySelector("[data-phone-screen]")).toHaveAttribute(
      "data-phone-screen",
      "start",
    );
    expect(screen.getByRole("button", { name: "Open People" })).toBeVisible();
  } finally {
    delete (Element.prototype as unknown as { animate?: unknown }).animate;
  }
});
it("navigates People panorama and photo detail using real public components", async () => {
  render(<PhoneDemo />);
  fireEvent.click(screen.getByRole("button", { name: "Open People" }));
  fireEvent.click(await screen.findByRole("tab", { name: "together" }));
  expect(screen.getByText("The weekend crew")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Phone Start" }));
  fireEvent.click(await screen.findByRole("button", { name: "Open Photos" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "View Golden hour photo 1" }),
  );
  expect(
    await screen.findByRole("heading", { name: "golden hour" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "next" }));
  expect(screen.getByRole("heading", { name: "by the water" })).toBeVisible();
  fireEvent.keyDown(
    screen.getByRole("region", { name: "Interactive Windows Phone demo" }),
    { key: "Escape" },
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "View Golden hour photo 1" }),
    ).toHaveFocus(),
  );
});
it("restores the same recipient after sending reorders the thread list", async () => {
  render(<PhoneDemo />);
  fireEvent.click(screen.getByRole("button", { name: "Open Messaging" }));
  fireEvent.click(await screen.findByRole("button", { name: /Leo Martinez/ }));
  fireEvent.change(
    await screen.findByRole("textbox", { name: "Message Leo Martinez" }),
    { target: { value: "See you soon" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  fireEvent.click(screen.getByRole("button", { name: "Phone back" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /Leo Martinez/ })).toHaveFocus(),
  );
  expect(screen.getByRole("button", { name: /Maya Chen/ })).toHaveTextContent(
    "Coffee at the usual place?",
  );
});
