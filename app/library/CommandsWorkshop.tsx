"use client";
import { useState } from "react";
import {
  AppBar,
  AppBarAction,
  AppBarLink,
  AppBarOverflow,
  Button,
  IconButton,
  ProgressDots,
} from "@windows-phone/react";
import styles from "./commandsWorkshop.module.css";

function Glyph({ kind }: { kind: "add" | "save" | "help" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {kind === "add" ? (
        <path d="M12 4v16M4 12h16" />
      ) : kind === "save" ? (
        <>
          <path d="M4 3h13l3 3v15H4z" />
          <path d="M8 3v6h8V3M8 21v-8h8v8" />
        </>
      ) : (
        <>
          <path d="M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4" />
          <path d="M12 17v1" />
        </>
      )}
    </svg>
  );
}
export function CommandsWorkshop() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [message, setMessage] = useState("Ready when you are.");
  return (
    <section
      id="commands"
      className={styles.section}
      aria-labelledby="commands-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>04 / EVERYDAY ACTIONS</p>
          <h2 id="commands-title">make your move.</h2>
        </div>
        <p>
          Clear labels, a familiar touch, and the right action exactly where you
          need it.
        </p>
      </div>
      <div className={styles.examples}>
        <div className={styles.example}>
          <p className={styles.kicker}>BUTTONS / TOUCH AND KEYBOARD</p>
          <h3>Small actions. Clear intent.</h3>
          <div className={styles.row}>
            <Button
              variant="accent"
              onClick={() => {
                setCount(count + 1);
                setMessage("Item added.");
              }}
            >
              Add an item
            </Button>
            <Button
              onClick={() => {
                setCount(0);
                setMessage("Collection cleared.");
              }}
            >
              Clear collection
            </Button>
            <IconButton
              label="Add one more item"
              icon={<Glyph kind="add" />}
              onClick={() => {
                setCount(count + 1);
                setMessage("Item added.");
              }}
            />
            <Button disabled>Publish</Button>
          </div>
          <p className={styles.counter}>
            <strong>{count.toString().padStart(2, "0")}</strong> items in your
            collection
          </p>
        </div>
        <div className={styles.example}>
          <p className={styles.kicker}>PENDING / KEEP YOUR PLACE</p>
          <h3>A moment, without a jump.</h3>
          <div style={{ minHeight: 12 }}>
            <ProgressDots label="Loading animation preview" hidden={!loading} />
          </div>
          <p>
            Start saving to see the pending state. Complete the preview to make
            the action available again.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setLoading(true);
              setMessage("Saving preview started.");
            }}
          >
            <div className={styles.row}>
              <Button type="submit" loading={loading}>
                Save collection
              </Button>
              <Button
                variant="subtle"
                disabled={!loading}
                onClick={() => {
                  setLoading(false);
                  setMessage("Collection saved.");
                }}
              >
                Complete preview
              </Button>
            </div>
          </form>
        </div>
      </div>
      <div className={styles.barExample}>
        <p className={styles.kicker}>APP BAR / A PLACE FOR COMMANDS</p>
        <AppBar aria-label="Collection commands" className={styles.bar}>
          <AppBarAction
            icon={<Glyph kind="add" />}
            label="add"
            onClick={() => {
              setCount(count + 1);
              setMessage("Item added.");
            }}
          />
          <AppBarAction
            icon={<Glyph kind="save" />}
            label="save"
            onClick={() => setMessage("Collection saved.")}
          />
          <AppBarLink
            icon={<Glyph kind="help" />}
            label="get started"
            href="#start"
          />
          <AppBarOverflow open={overflow} onOpenChange={setOverflow}>
            <Button
              variant="subtle"
              onClick={() => {
                setMessage("Collection archived.");
                setOverflow(false);
              }}
            >
              Archive collection
            </Button>
            <Button
              variant="subtle"
              onClick={() => {
                setCount(0);
                setMessage("Collection cleared.");
                setOverflow(false);
              }}
            >
              Clear all items
            </Button>
          </AppBarOverflow>
        </AppBar>
        <p className={styles.status} role="status">
          {message}
        </p>
      </div>
    </section>
  );
}
