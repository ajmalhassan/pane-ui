"use client";
import { useState } from "react";
import { RevealTile, Theme, TileSequence } from "@pane-ui/react";
import s from "./landing.module.css";

export function TypeSpecimen() {
  const [weight, setWeight] = useState(300);
  return (
    <div className={s.specimen}>
      <span
        className={s.letterform}
        style={{ fontWeight: weight }}
        aria-hidden="true"
      >
        Aa
      </span>
      <div
        className={s.weightOptions}
        role="group"
        aria-label="Try a type weight"
      >
        {[
          [300, "Light"],
          [400, "Regular"],
          [700, "Bold"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={weight === value}
            onClick={() => setWeight(Number(value))}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
export function TileSpecimen() {
  return (
    <Theme mode="dark" className={`${s.specimen} ${s.tileSpecimen}`}>
      <RevealTile
        aria-label="Reveal the other side"
        label="tap to reveal"
        front={<span className={s.tileGreeting}>hello.</span>}
        back={<span className={s.tileGreeting}>again.</span>}
      />
      <span className={s.specimenHint}>
        A little more
        <br />
        beneath the surface.
      </span>
    </Theme>
  );
}
export function MotionSpecimen() {
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);
  return (
    <div className={s.specimen}>
      <div className={s.motionWindow}>
        <TileSequence
          className={s.sampleSequence}
          show={visible}
          direction={visible ? "backward" : "forward"}
          duration={300}
          interval={50}
          onExited={() => setVisible(true)}
          onEntered={() => setBusy(false)}
          items={["01", "02", "03", "04"].map((id) => ({
            id,
            content: <span>{id}</span>,
          }))}
        />
      </div>
      <button
        className={s.motionReplay}
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setVisible(false);
        }}
      >
        Replay the turn <span aria-hidden="true">↺</span>
      </button>
    </div>
  );
}
