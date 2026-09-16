"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Checkbox, Field, Slider, Switch, Theme } from "@pane-ui/react";
import { Glyph } from "./Glyph";
import s from "./landing.module.css";

export function ComponentStudio() {
  const [quiet, setQuiet] = useState(true);
  const [volume, setVolume] = useState(65);
  const [updates, setUpdates] = useState(true);
  const [saved, setSaved] = useState(false);
  const change = (update: () => void) => {
    update();
    setSaved(false);
  };
  return (
    <section className={s.studio} aria-labelledby="studio-title" data-reveal>
      <div className={s.studioHeading}>
        <p className={s.kicker}>02 / FEEL THE DETAILS</p>
        <h2 id="studio-title">
          Go on.
          <br />
          <em>Make yourself at home.</em>
        </h2>
        <p>
          Not a picture of an interface. The real components, ready for your
          keyboard, your touch, and your next idea.
        </p>
        <Link href="/docs/fields">
          Explore the components <span aria-hidden="true">→</span>
        </Link>
        <div className={s.componentTags}>
          <span>native inputs</span>
          <span>visible focus</span>
          <span>shared tokens</span>
        </div>
      </div>
      <Theme mode="dark" accent="blue" className={s.studioPanel}>
        <div className={s.panelMeta}>
          <span>PERSONAL SETTINGS</span>
          <span className={s.liveLabel}>
            <i /> LIVE PREVIEW
          </span>
        </div>
        <h3>a little more you.</h3>
        <div className={s.studioControls}>
          <Switch
            label="Quiet hours"
            checked={quiet}
            onChange={(e) => change(() => setQuiet(e.target.checked))}
            description="A little space for yourself."
          />
          <Field
            label="Sound level"
            description={`${volume}% · ${volume === 0 ? "A moment of silence." : "Just the way you like it."}`}
          >
            <Slider
              value={volume}
              onChange={(e) => change(() => setVolume(Number(e.target.value)))}
              min={0}
              max={100}
            />
          </Field>
          <Checkbox
            label="Keep me in the loop"
            checked={updates}
            onChange={(e) => change(() => setUpdates(e.target.checked))}
          />
        </div>
        <div className={s.studioFooter}>
          <Button onClick={() => setSaved(true)}>
            {saved ? "Saved" : "Save preferences"}
          </Button>
          <span role="status">
            {saved ? "Saved for this preview." : "Try changing a detail."}
          </span>
        </div>
      </Theme>
      <div className={s.studioRail} aria-hidden="true">
        <Glyph name="code" size={18} />
        <span>One system. From the smallest control to the whole screen.</span>
      </div>
    </section>
  );
}
