"use client";
import { useRef, useState } from "react";
import {
  Button,
  Progress,
  ProgressRing,
  MessageBanner,
} from "@pane-ui/react";
import styles from "./fieldsWorkshop.module.css";
import feedback from "./feedbackWorkshop.module.css";

export function FeedbackWorkshop() {
  const [value, setValue] = useState(40);
  const [unknown, setUnknown] = useState(false);
  const [result, setResult] = useState<"ready" | "success" | "error">("ready");
  const [notice, setNotice] = useState(true);
  const save = useRef<HTMLButtonElement>(null);
  const restore = useRef<HTMLButtonElement>(null);
  return (
    <section
      id="feedback"
      className={styles.section}
      aria-labelledby="feedback-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>08 / EVERY MOMENT, ACCOUNTED FOR</p>
          <h2 id="feedback-title">a little reassurance.</h2>
        </div>
        <p>Show how far things have come. Make the next step clear.</p>
      </div>
      <div className={styles.layout}>
        <div className={styles.form}>
          <p className={styles.kicker}>PROGRESS / YOUR COLLECTION</p>
          <div className={feedback.readout}>
            <ProgressRing
              label="Collection progress"
              size="large"
              value={unknown ? undefined : value}
            />
            <div>
              <span className={feedback.number}>
                {unknown ? "…" : `${value}%`}
              </span>
              <p className={styles.status}>
                {unknown
                  ? "Finding your photos"
                  : `${value} of 100 photos ready`}
              </p>
            </div>
          </div>
          <Progress decorative value={unknown ? undefined : value} />
          <div className={styles.actions}>
            <Button
              onClick={() => {
                setUnknown(false);
                setValue((v) => Math.min(100, v + 20));
              }}
            >
              Advance progress
            </Button>
            <Button
              onClick={() => setUnknown((v) => !v)}
              aria-pressed={unknown}
            >
              Unknown total
            </Button>
            <Button
              onClick={() => {
                setValue(0);
                setUnknown(false);
              }}
            >
              Reset progress
            </Button>
          </div>
          <p className={styles.status}>
            Try known and unknown totals. The line and ring tell the same story.
          </p>
          <p className={styles.kicker}>RING / THREE SIZES</p>
          <div className={feedback.rings}>
            <ProgressRing label="Small loading indicator" size="small" />
            <ProgressRing label="Medium loading indicator" />
            <ProgressRing label="Large loading indicator" size="large" />
          </div>
        </div>
        <div className={styles.form}>
          <p className={styles.kicker}>MESSAGES / CLEAR NEXT STEPS</p>
          <div className={styles.actions}>
            <Button ref={save} onClick={() => setResult("success")}>
              Save collection
            </Button>
            <Button onClick={() => setResult("error")}>Simulate failure</Button>
          </div>
          <MessageBanner
            tone={
              result === "error"
                ? "error"
                : result === "success"
                  ? "success"
                  : "info"
            }
            announcement="polite"
            heading={
              result === "error"
                ? "Couldn't save your collection"
                : result === "success"
                  ? "Collection saved"
                  : "Ready when you are"
            }
            actions={
              result === "error" ? (
                <Button
                  onClick={() => {
                    setResult("success");
                    save.current?.focus();
                  }}
                >
                  Retry saving
                </Button>
              ) : undefined
            }
          >
            {result === "error"
              ? "Your photos are still here. Try saving again."
              : result === "success"
                ? "Everything is up to date. You're good to go."
                : "Save your collection to see a confirmation here."}
          </MessageBanner>
          {notice && (
            <MessageBanner
              tone="warning"
              heading="You're offline"
              onDismiss={() => {
                setNotice(false);
                restore.current?.focus();
              }}
              dismissLabel="Dismiss offline message"
            >
              Changes stay on this device until you reconnect.
            </MessageBanner>
          )}
          <Button ref={restore} onClick={() => setNotice(true)}>
            Show offline message
          </Button>
        </div>
      </div>
    </section>
  );
}
