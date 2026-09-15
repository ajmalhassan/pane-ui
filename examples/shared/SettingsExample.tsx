"use client";
import { useId, useState } from "react";
import {
  Button,
  Checkbox,
  Field,
  MessageBanner,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Theme,
  type ThemeProps,
} from "@windows-phone/react";
import { validateForm } from "./formValidation";
import styles from "./Examples.module.css";

type Preferences = {
  name: string;
  email: string;
  mode: NonNullable<ThemeProps["mode"]>;
  accent: NonNullable<ThemeProps["accent"]>;
  notifications: boolean;
  digest: boolean;
};
const defaults: Preferences = {
  name: "Alex Morgan",
  email: "alex@example.com",
  mode: "dark",
  accent: "blue",
  notifications: true,
  digest: false,
};

export function SettingsExample() {
  const id = useId();
  const [saved, setSaved] = useState(defaults);
  const [draft, setDraft] = useState(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  function change<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setNotice("");
  }
  return (
    <Theme mode={draft.mode} accent={draft.accent} className={styles.example}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>PERSONAL / PREFERENCES</p>
        <h2 className={styles.title}>make it yours</h2>
        <p className={styles.intro}>
          A little more you. Choose how your workspace looks and keeps in touch.
        </p>
      </header>
      <form
        aria-label="Personal settings"
        noValidate
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          const nextErrors = validateForm(event.currentTarget);
          setErrors(nextErrors);
          if (Object.keys(nextErrors).length) {
            setNotice("");
            return;
          }
          const next = {
            ...draft,
            name: draft.name.trim(),
            email: draft.email.trim(),
          };
          setSaved(next);
          setDraft(next);
          setNotice(`Settings saved for ${next.name}.`);
        }}
        onReset={(event) => {
          event.preventDefault();
          setDraft({ ...saved });
          setErrors({});
          setNotice("Changes reset to your last saved settings.");
        }}
      >
        <section className={styles.section} aria-labelledby={`${id}-profile`}>
          <h3 id={`${id}-profile`}>
            01 <span>your profile</span>
          </h3>
          <div className={styles.columns}>
            <Field label="Display name" required error={errors.name}>
              <TextField
                name="name"
                autoComplete="name"
                maxLength={60}
                value={draft.name}
                onChange={(event) => change("name", event.target.value)}
              />
            </Field>
            <Field label="Email address" required error={errors.email}>
              <TextField
                name="email"
                type="email"
                autoComplete="email"
                value={draft.email}
                onChange={(event) => change("email", event.target.value)}
              />
            </Field>
          </div>
        </section>
        <section
          className={styles.section}
          aria-labelledby={`${id}-appearance`}
        >
          <h3 id={`${id}-appearance`}>
            02 <span>look & feel</span>
          </h3>
          <div className={styles.columns}>
            <RadioGroup
              label="Background"
              name={`${id}-mode`}
              value={draft.mode}
              onValueChange={(value) =>
                change("mode", value as Preferences["mode"])
              }
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
                { value: "system", label: "System" },
              ]}
            />
            <Field
              label="Accent color"
              description="Preview changes as you choose."
            >
              <Select
                name="accent"
                value={draft.accent}
                onChange={(event) =>
                  change("accent", event.target.value as Preferences["accent"])
                }
              >
                {["blue", "violet", "magenta", "orange", "green"].map(
                  (color) => (
                    <option key={color} value={color}>
                      {color[0].toUpperCase() + color.slice(1)}
                    </option>
                  ),
                )}
              </Select>
            </Field>
          </div>
        </section>
        <section className={styles.section} aria-labelledby={`${id}-updates`}>
          <h3 id={`${id}-updates`}>
            03 <span>stay in the loop</span>
          </h3>
          <div className={styles.stack}>
            <Switch
              label="Desktop notifications"
              description="Save a preference for alerts about new messages."
              checked={draft.notifications}
              onChange={(event) =>
                change("notifications", event.target.checked)
              }
            />
            <Checkbox
              label="Weekly email digest"
              description="Save a preference for a weekly activity summary."
              checked={draft.digest}
              onChange={(event) => change("digest", event.target.checked)}
            />
          </div>
        </section>
        <div className={styles.actions}>
          <Button type="submit" variant="accent">
            Save changes
          </Button>
          <Button type="reset">Reset changes</Button>
          <span className={styles.muted}>
            {dirty ? "Unsaved changes" : "Up to date"}
          </span>
        </div>
        {notice && (
          <MessageBanner tone="success" announcement="polite">
            {notice}
          </MessageBanner>
        )}
        <p className={styles.note}>
          Demo preferences live in this page session. No email or desktop alerts
          are sent.
        </p>
      </form>
    </Theme>
  );
}
