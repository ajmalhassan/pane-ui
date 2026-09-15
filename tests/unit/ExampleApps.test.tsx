import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, it } from "vitest";
import { SettingsExample } from "../../examples/shared/SettingsExample";
import { InboxExample } from "../../examples/shared/InboxExample";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

it("saves valid settings and resets edits to the last saved snapshot", async () => {
  const user = userEvent.setup();
  render(<SettingsExample />);
  const name = screen.getByRole("textbox", { name: "Display name" });
  await user.clear(name);
  await user.type(name, "Mira");
  await user.click(screen.getByRole("radio", { name: "Light" }));
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Settings saved for Mira",
  );
  await user.clear(name);
  await user.type(name, "Unsaved");
  await user.click(screen.getByRole("radio", { name: "Dark" }));
  await user.click(screen.getByRole("button", { name: "Reset changes" }));
  expect(name).toHaveValue("Mira");
  expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
});

it("blocks invalid settings with an associated error and preserves saved data", async () => {
  const user = userEvent.setup();
  render(<SettingsExample />);
  const email = screen.getByRole("textbox", { name: "Email address" });
  await user.clear(email);
  await user.type(email, "invalid");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(email).toHaveAttribute("aria-invalid", "true");
  expect(email).toHaveAccessibleDescription(/valid email address/);
  expect(screen.queryByText(/Settings saved for/)).not.toBeInTheDocument();
});

it("filters mail, opens a message, marks it read and returns to the inbox", async () => {
  const user = userEvent.setup();
  render(<InboxExample />);
  expect(screen.getByText(/2 unread/)).toBeInTheDocument();
  await user.type(
    screen.getByRole("searchbox", { name: "Search messages" }),
    "Saturday",
  );
  await user.click(
    screen.getByRole("button", { name: /Saturday by the water/ }),
  );
  expect(
    screen.getByRole("heading", { name: "Saturday by the water" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Back to inbox" }));
  expect(screen.getByText(/1 unread/)).toBeInTheDocument();
  expect(
    screen.getByRole("searchbox", { name: "Search messages" }),
  ).toHaveValue("Saturday");
});

it("rejects empty compose, then sends a local message into the sent folder", async () => {
  const user = userEvent.setup();
  render(<InboxExample />);
  await user.click(screen.getByRole("button", { name: "Compose message" }));
  const dialog = screen.getByRole("dialog", { name: "new message" });
  await user.click(
    within(dialog).getByRole("button", { name: "Send message" }),
  );
  expect(within(dialog).getByRole("textbox", { name: "To" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await user.type(
    within(dialog).getByRole("textbox", { name: "To" }),
    "friend@example.com",
  );
  await user.type(
    within(dialog).getByRole("textbox", { name: "Subject" }),
    "Meet at noon",
  );
  await user.type(
    within(dialog).getByRole("textbox", { name: "Message" }),
    "See you at the station.",
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Send message" }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("Message saved to Sent");
  await user.click(screen.getByRole("button", { name: /Meet at noon/ }));
  expect(screen.getByText("See you at the station.")).toBeInTheDocument();
});

it("shows a useful empty search state", () => {
  render(<InboxExample />);
  fireEvent.change(screen.getByRole("searchbox", { name: "Search messages" }), {
    target: { value: "nothing matches this" },
  });
  expect(
    screen.getByRole("heading", { name: "No messages found" }),
  ).toBeInTheDocument();
});
