import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import {
  Checkbox,
  Switch,
  RadioGroup,
} from "../../packages/react/src/Selection.js";

it("serializes native checkbox and switch values and resets default state", async () => {
  const user = userEvent.setup();
  const ref = createRef<HTMLInputElement>();
  render(
    <form aria-label="settings">
      <Checkbox ref={ref} label="Updates" name="updates" defaultChecked />
      <Switch label="Sync" name="sync" value="enabled" />
      <Checkbox label="Locked" name="locked" disabled defaultChecked />
      <button type="reset">Reset</button>
    </form>,
  );
  const form = screen.getByRole("form") as HTMLFormElement;
  expect(Object.fromEntries(new FormData(form))).toEqual({ updates: "on" });
  await user.click(screen.getByRole("switch", { name: "Sync" }));
  expect(Object.fromEntries(new FormData(form))).toEqual({
    updates: "on",
    sync: "enabled",
  });
  expect(ref.current).toBe(screen.getByRole("checkbox", { name: "Updates" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByRole("switch")).not.toBeChecked();
});

it("keeps controlled selection owned by the caller and associates errors", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const view = render(
    <Checkbox
      label="Terms"
      checked={false}
      onChange={change}
      error="Accept the terms"
      required
    />,
  );
  const box = screen.getByRole("checkbox", { name: "Terms" });
  await user.click(box);
  expect(change).toHaveBeenCalledTimes(1);
  expect(box).not.toBeChecked();
  expect(box).toBeRequired();
  expect(box).toHaveAccessibleDescription("Accept the terms");
  view.rerender(<Checkbox label="Terms" checked onChange={change} />);
  expect(box).toBeChecked();
  expect(box).not.toHaveAttribute("aria-invalid", "true");
});

const options = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "off", label: "Off", disabled: true },
];
it("uses a named fieldset and native radio values, including reset", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <form aria-label="preferences">
      <RadioGroup
        label="Frequency"
        name="frequency"
        options={options}
        defaultValue="daily"
        onValueChange={change}
      />
      <button type="reset">Reset</button>
    </form>,
  );
  expect(screen.getByRole("group", { name: "Frequency" })).toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: "Weekly" }));
  expect(change).toHaveBeenCalledWith("weekly");
  expect(
    new FormData(screen.getByRole("form") as HTMLFormElement).get("frequency"),
  ).toBe("weekly");
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByRole("radio", { name: "Daily" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Off" })).toBeDisabled();
});

it("honors controlled radio state, consumer cancellation and external form ownership", () => {
  const change = vi.fn();
  render(
    <>
      <form id="external" aria-label="external" />
      <RadioGroup
        label="Frequency"
        name="frequency"
        form="external"
        options={options}
        value="daily"
        onValueChange={change}
        onChange={(event) => event.preventDefault()}
      />
    </>,
  );
  fireEvent.click(screen.getByRole("radio", { name: "Weekly" }));
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByRole("radio", { name: "Daily" })).toBeChecked();
  expect(
    new FormData(screen.getByRole("form") as HTMLFormElement).get("frequency"),
  ).toBe("daily");
});

it("server renders named selection controls and distinct associations", () => {
  const html = renderToString(
    <>
      <Checkbox label="News" description="Occasional updates" />
      <Switch label="Sync" defaultChecked />
      <RadioGroup
        label="Frequency"
        name="frequency"
        options={options}
        defaultValue="daily"
      />
    </>,
  );
  expect(html).toContain('type="checkbox"');
  expect(html).toContain('role="switch"');
  expect(html).toContain("<legend");
  expect(html).toContain('checked=""');
  render(
    <>
      <Checkbox label="One" description="First hint" />
      <Checkbox label="Two" description="Second hint" />
    </>,
  );
  const [one, two] = screen.getAllByRole("checkbox");
  expect(one.id).not.toBe(two.id);
  expect(one).toHaveAccessibleDescription("First hint");
  expect(two).toHaveAccessibleDescription("Second hint");
});
