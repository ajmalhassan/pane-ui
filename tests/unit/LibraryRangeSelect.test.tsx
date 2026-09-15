import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { Field, Select, Slider } from "../../packages/react/src/Field.js";

it("connects selects and sliders to field labels and descriptions", () => {
  render(
    <>
      <Field
        label="Theme"
        description="Choose a look"
        error="Choose a theme"
        required
      >
        <Select defaultValue="">
          <option value="">Choose</option>
          <option value="dark">Dark</option>
        </Select>
      </Field>
      <Field label="Brightness" description="Adjust the display">
        <Slider defaultValue={60} />
      </Field>
    </>,
  );
  expect(
    screen.getByRole("combobox", { name: "Theme" }),
  ).toHaveAccessibleDescription("Choose a look Choose a theme");
  expect(screen.getByRole("combobox")).toBeRequired();
  expect(
    screen.getByRole("slider", { name: "Brightness" }),
  ).toHaveAccessibleDescription("Adjust the display");
});
it("preserves native form values, reset, option groups and disabled inheritance", async () => {
  const user = userEvent.setup();
  const selectRef = createRef<HTMLSelectElement>();
  const rangeRef = createRef<HTMLInputElement>();
  render(
    <form aria-label="settings">
      <Field label="Theme">
        <Select ref={selectRef} name="theme" defaultValue="dark">
          <optgroup label="Themes">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="custom" disabled>
              Custom
            </option>
          </optgroup>
        </Select>
      </Field>
      <Field label="Brightness">
        <Slider
          ref={rangeRef}
          name="brightness"
          min={0}
          max={100}
          step={10}
          defaultValue={60}
        />
      </Field>
      <Field label="Locked" disabled>
        <Select name="locked">
          <option>Locked</option>
        </Select>
      </Field>
      <button type="reset">Reset</button>
    </form>,
  );
  await user.selectOptions(selectRef.current!, "light");
  fireEvent.change(rangeRef.current!, { target: { value: "80" } });
  expect(
    Object.fromEntries(
      new FormData(screen.getByRole("form") as HTMLFormElement),
    ),
  ).toEqual({ theme: "light", brightness: "80" });
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(selectRef.current).toHaveValue("dark");
  expect(rangeRef.current).toHaveValue("60");
  expect(screen.getByRole("combobox", { name: "Locked" })).toBeDisabled();
});
it("keeps controlled values owned by the caller and forwards callbacks", () => {
  const change = vi.fn();
  const view = render(
    <>
      <Select aria-label="Theme" value="dark" onChange={change}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </Select>
      <Slider aria-label="Brightness" value={40} onChange={change} />
    </>,
  );
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "light" },
  });
  expect(screen.getByRole("combobox")).toHaveValue("dark");
  fireEvent.change(screen.getByRole("slider"), { target: { value: "70" } });
  expect(screen.getByRole("slider")).toHaveValue("40");
  expect(change).toHaveBeenCalledTimes(2);
  view.rerender(
    <Slider aria-label="Brightness" value={70} onChange={change} />,
  );
  expect(screen.getByRole("slider")).toHaveValue("70");
});
it("renders server controls with native values and accessible labels", () => {
  const html = renderToString(
    <>
      <Field label="Theme" controlId="theme">
        <Select defaultValue="dark">
          <option value="dark">Dark</option>
        </Select>
      </Field>
      <Field label="Brightness" controlId="brightness">
        <Slider defaultValue={30} min={10} max={90} step={5} />
      </Field>
    </>,
  );
  expect(html).toContain('for="theme"');
  expect(html).toContain('selected=""');
  expect(html).toContain('type="range"');
  expect(html).toContain('value="30"');
});
