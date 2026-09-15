"use client";
import { useState } from "react";
import { Button, Field, Select, Slider } from "@pane-ui/react";
import styles from "./fieldsWorkshop.module.css";
export function AdjustmentsWorkshop() {
  const [brightness, setBrightness] = useState(60);
  const [message, setMessage] = useState("Set things the way you like them.");
  return (
    <section
      id="adjustments"
      className={styles.section}
      aria-labelledby="adjustments-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>07 / FIND YOUR SETTING</p>
          <h2 id="adjustments-title">just the right amount.</h2>
        </div>
        <p>
          Choose a mode. Set a level. Familiar controls, with room for the
          details.
        </p>
      </div>
      <form
        aria-label="Display settings preview"
        className={styles.layout}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setMessage(
            `Saved: ${data.get("appearance")} appearance, ${data.get("brightness")}% brightness.`,
          );
        }}
        onReset={() => {
          setBrightness(60);
          setMessage("Display settings reset.");
        }}
      >
        <div className={styles.form}>
          <p className={styles.kicker}>SELECT / CHOOSE A DIRECTION</p>
          <Field
            label="Appearance"
            description="Choose a display preference for this preview."
            controlId="settings-appearance"
          >
            <Select name="appearance" defaultValue="system">
              <option value="system">Follow the system</option>
              <optgroup label="Choose a mode">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="adaptive" disabled>
                  Adaptive — coming later
                </option>
              </optgroup>
            </Select>
          </Field>
          <Field
            label="Region"
            description="Native pickers keep familiar keyboard and touch behavior."
          >
            <Select name="region" defaultValue="automatic">
              <option value="automatic">Automatic</option>
              <option value="americas">Americas</option>
              <option value="europe">Europe</option>
              <option value="asia">Asia Pacific</option>
            </Select>
          </Field>
          <Field
            label="Managed preference"
            description="This setting is unavailable in the preview."
            disabled
          >
            <Select defaultValue="managed">
              <option value="managed">Managed by your organization</option>
            </Select>
          </Field>
        </div>
        <div className={styles.form}>
          <p className={styles.kicker}>SLIDER / MAKE A SMALL ADJUSTMENT</p>
          <Field
            label="Brightness"
            description="0 to 100 percent, in steps of 5. Try the arrow keys, Home, or End."
            controlId="settings-brightness"
          >
            <Slider
              name="brightness"
              min={0}
              max={100}
              step={5}
              value={brightness}
              onChange={(event) =>
                setBrightness(event.currentTarget.valueAsNumber)
              }
              aria-valuetext={`${brightness} percent`}
            />
            <output
              htmlFor="settings-brightness"
              aria-live="off"
              style={{
                fontSize: 48,
                fontWeight: 300,
                lineHeight: 1,
                color: "var(--wp-accent-text)",
              }}
            >
              {brightness}
              <span style={{ fontSize: 20 }}> %</span>
            </output>
          </Field>
          <Field
            label="Automatic level"
            description="A disabled slider still shows its current setting."
            disabled
          >
            <Slider min={0} max={100} defaultValue={35} />
          </Field>
          <div className={styles.actions}>
            <Button type="submit" variant="accent">
              Save display settings
            </Button>
            <Button type="reset">Reset display settings</Button>
          </div>
          <p role="status" className={styles.status}>
            {message}
          </p>
        </div>
      </form>
    </section>
  );
}
