"use client";
import { useState } from "react";
import { Button, Checkbox, Switch, RadioGroup } from "@windows-phone/react";
import styles from "./fieldsWorkshop.module.css";
export function SelectionWorkshop() {
  const [summary, setSummary] = useState("Your preferences, your pace.");
  return (
    <section
      id="selection"
      className={styles.section}
      aria-labelledby="selection-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>06 / MAKE IT YOURS</p>
          <h2 id="selection-title">a choice that feels right.</h2>
        </div>
        <p>
          A clear yes. A single choice. A switch that responds to your touch.
        </p>
      </div>
      <form
        className={styles.layout}
        aria-label="Preference preview"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSummary(
            `Saved: updates ${data.has("updates") ? "on" : "off"}, sync ${data.has("sync") ? "on" : "off"}, delivery ${data.get("delivery")}.`,
          );
        }}
        onReset={() => setSummary("Preferences reset.")}
      >
        <div className={styles.form}>
          <p className={styles.kicker}>CHECKBOXES / CHOOSE WHAT MATTERS</p>
          <Checkbox
            label="Send me product updates"
            description="Occasional news about the things you use."
            name="updates"
            defaultChecked
          />
          <Checkbox
            label="Include preview features"
            description="Try ideas while they are still taking shape."
            name="previews"
          />
          <Checkbox
            label="Organization settings"
            description="Managed by your organization."
            disabled
            defaultChecked
            name="managed"
          />
          <Switch
            label="Sync across devices"
            description="Keep your collection with you."
            name="sync"
            defaultChecked
          />
          <Switch
            label="Offline mode"
            description="Unavailable in this preview."
            disabled
            name="offline"
          />
        </div>
        <div className={styles.form}>
          <p className={styles.kicker}>RADIO GROUP / ONE AT A TIME</p>
          <RadioGroup
            label="Delivery frequency"
            name="delivery"
            defaultValue="weekly"
            required
            description="Choose one schedule."
            options={[
              {
                value: "daily",
                label: "Daily",
                description: "A short update each day.",
              },
              {
                value: "weekly",
                label: "Weekly",
                description: "A little more space between updates.",
              },
              {
                value: "monthly",
                label: "Monthly",
                description: "Only the highlights.",
              },
              { value: "instant", label: "Instant", disabled: true },
            ]}
          />
          <div className={styles.actions}>
            <Button type="submit" variant="accent">
              Save preferences
            </Button>
            <Button type="reset">Reset preferences</Button>
          </div>
          <p className={styles.status} role="status">
            {summary}
          </p>
        </div>
      </form>
    </section>
  );
}
