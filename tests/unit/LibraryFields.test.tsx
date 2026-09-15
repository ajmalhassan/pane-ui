import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import {
  Field,
  Label,
  FieldDescription,
  FieldError,
  TextField,
  TextArea,
} from "../../packages/react/src/Field.js";

it("connects labels, descriptions and errors immediately, including SSR", () => {
  const view = render(
    <Field
      label="Your name"
      description="Use your full name"
      error="Enter a name"
      required
      controlId="name"
    >
      <TextField name="name" aria-describedby="outside" />
    </Field>,
  );
  const input = screen.getByRole("textbox", { name: "Your name" });
  expect(input).toBeRequired();
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAttribute(
    "aria-describedby",
    "outside name-description name-error",
  );
  expect(screen.getByText("Your name").closest("label")).toHaveAttribute(
    "for",
    "name",
  );
  expect(
    renderToString(
      <Field
        label="Email"
        description="Private"
        error="Invalid"
        controlId="email"
      >
        <TextField />
      </Field>,
    ),
  ).toContain('aria-describedby="email-description email-error"');
  view.rerender(
    <Field label="Your name" controlId="name">
      <TextField name="name" />
    </Field>,
  );
  expect(input).not.toHaveAttribute("aria-describedby");
  expect(input).not.toHaveAttribute("aria-invalid", "true");
});

it("keeps instance IDs distinct and honors the field control ID consistently", () => {
  render(
    <>
      <Field label="First">
        <TextField id="conflicting" />
      </Field>
      <Field label="Second">
        <TextArea />
      </Field>
    </>,
  );
  const first = screen.getByRole("textbox", { name: "First" });
  const second = screen.getByRole("textbox", { name: "Second" });
  expect(first.id).not.toBe(second.id);
  expect(first.id).not.toBe("conflicting");
});

it("supports native serialization, reset and disabled field inheritance", async () => {
  const user = userEvent.setup();
  const ref = createRef<HTMLInputElement>();
  render(
    <form aria-label="Profile">
      <Field label="Name">
        <TextField ref={ref} name="name" defaultValue="Ada" />
      </Field>
      <Field label="Bio">
        <TextArea name="bio" defaultValue="Hello" />
      </Field>
      <Field label="Locked" disabled>
        <TextField name="locked" defaultValue="secret" disabled={false} />
      </Field>
      <button type="reset">Reset</button>
    </form>,
  );
  await user.type(screen.getByRole("textbox", { name: "Name" }), " Lovelace");
  const form = screen.getByRole("form") as HTMLFormElement;
  expect(Object.fromEntries(new FormData(form))).toEqual({
    name: "Ada Lovelace",
    bio: "Hello",
  });
  expect(ref.current).toBe(screen.getByRole("textbox", { name: "Name" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(ref.current).toHaveValue("Ada");
});

it("preserves controlled ownership and forwards text area refs and native props", () => {
  const change = vi.fn();
  const ref = createRef<HTMLTextAreaElement>();
  const view = render(
    <Field label="Notes">
      <TextArea
        ref={ref}
        value="Owned"
        onChange={change}
        maxLength={80}
        rows={4}
      />
    </Field>,
  );
  fireEvent.change(ref.current!, { target: { value: "Suggested" } });
  expect(change).toHaveBeenCalledTimes(1);
  expect(ref.current).toHaveValue("Owned");
  view.rerender(
    <Field label="Notes">
      <TextArea ref={ref} value="Accepted" onChange={change} />
    </Field>,
  );
  expect(ref.current).toHaveValue("Accepted");
});

it("supports independent primitives and preserves caller ARIA associations", () => {
  render(
    <>
      <Label htmlFor="custom">Custom</Label>
      <FieldDescription id="hint">Hint</FieldDescription>
      <FieldError id="error">Error</FieldError>
      <TextField
        id="custom"
        aria-describedby="hint error"
        aria-invalid="grammar"
        readOnly
        value="Text"
      />
    </>,
  );
  const input = screen.getByRole("textbox", { name: "Custom" });
  expect(input).toHaveAttribute("aria-invalid", "grammar");
  expect(input).toHaveAccessibleDescription("Hint Error");
  expect(input).toHaveAttribute("readonly");
});
