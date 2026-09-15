"use client";
import { useRef, useState, useLayoutEffect } from "react";
import { Button, Field, TextField, TextArea } from "@pane-ui/react";
import styles from "./fieldsWorkshop.module.css";
export function FieldsWorkshop() {
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [result, setResult] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const invalidTarget = useRef<"name" | "email" | null>(null);
  useLayoutEffect(() => {
    if (invalidTarget.current) {
      (invalidTarget.current === "name" ? nameRef : emailRef).current?.focus();
      invalidTarget.current = null;
    }
  }, [errors]);
  return (
    <section
      id="fields"
      className={styles.section}
      aria-labelledby="fields-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>05 / WORDS INTO ACTION</p>
          <h2 id="fields-title">room for your words.</h2>
        </div>
        <p>
          Labels that stay with you. Help where you need it. A clear way to put
          things right.
        </p>
      </div>
      <div className={styles.layout}>
        <form
          aria-label="Profile preview"
          noValidate
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const values = new FormData(form);
            const next = {
              name: String(values.get("name") ?? "").trim()
                ? undefined
                : "Enter your name to continue.",
              email: emailRef.current?.validity.valid
                ? undefined
                : "Enter a valid email address, such as you@example.com.",
            };
            setErrors(next);
            if (next.name || next.email) {
              setResult("Check the highlighted fields.");
              invalidTarget.current = next.name ? "name" : "email";
              return;
            }
            setResult(
              `Profile ready for ${String(values.get("name"))}. This preview stays in your browser.`,
            );
          }}
          onReset={() => {
            setErrors({});
            setResult("");
          }}
        >
          <p className={styles.kicker}>PROFILE / TRY THE FORM</p>
          <Field
            label="Your name"
            description="The name you would like people to see."
            required
            error={errors.name}
            controlId="profile-name"
          >
            <TextField
              ref={nameRef}
              name="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
            />
          </Field>
          <Field
            label="Email address"
            description="For this preview, nothing is sent."
            required
            error={errors.email}
            controlId="profile-email"
          >
            <TextField
              ref={emailRef}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field
            label="A little about you"
            description="Optional. Up to 240 characters."
            controlId="profile-bio"
          >
            <TextArea
              name="bio"
              maxLength={240}
              placeholder="What are you working on?"
            />
          </Field>
          <div className={styles.actions}>
            <Button type="submit" variant="accent">
              Save profile
            </Button>
            <Button type="reset">Reset form</Button>
          </div>
          <p role="status" className={styles.status}>
            {result}
          </p>
        </form>
        <aside className={styles.states} aria-label="Field states">
          <p className={styles.kicker}>THE DETAILS / EVERY STATE</p>
          <h3>Make the state clear.</h3>
          <Field
            label="Read-only address"
            description="You can focus and copy this value."
          >
            <TextField readOnly value="hello@windowsphone.example" />
          </Field>
          <Field
            label="Unavailable field"
            description="Disabled controls are excluded from form submission."
            disabled
          >
            <TextField defaultValue="Not available yet" />
          </Field>
          <Field label="A longer note">
            <TextArea
              defaultValue={"A little space to think.\nA clear place to begin."}
              rows={3}
            />
          </Field>
        </aside>
      </div>
    </section>
  );
}
