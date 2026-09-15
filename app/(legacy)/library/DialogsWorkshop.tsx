"use client";
import { useRef, useState } from "react";
import {
  Dialog,
  AlertDialog,
  Button,
  Field,
  TextField,
  MessageBanner,
} from "@windows-phone/react";
import styles from "./fieldsWorkshop.module.css";
export function DialogsWorkshop() {
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  const [name, setName] = useState("Weekend wanderings");
  const [draft, setDraft] = useState(name);
  const [message, setMessage] = useState(
    "Your collection is ready to explore.",
  );
  const input = useRef<HTMLInputElement>(null);
  const editTrigger = useRef<HTMLButtonElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <section
      id="dialogs"
      className={styles.section}
      aria-labelledby="dialogs-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>09 / A MOMENT TO DECIDE</p>
          <h2 id="dialogs-title">one thing at a time.</h2>
        </div>
        <p>
          A quiet space to make a change. A clear choice before saying goodbye.
        </p>
      </div>
      <div className={styles.layout}>
        <div className={styles.form}>
          <p className={styles.kicker}>DIALOG / MAKE IT YOURS</p>
          <h3
            style={{
              fontSize: 32,
              fontWeight: 300,
              margin: 0,
              overflowWrap: "anywhere",
            }}
          >
            {name}
          </h3>
          <p className={styles.status}>
            24 photos · a collection of small discoveries
          </p>
          <div className={styles.actions}>
            <Button
              variant="accent"
              ref={editTrigger}
              onClick={() => {
                setDraft(name);
                setEdit(true);
              }}
            >
              Edit collection
            </Button>
            <Button ref={deleteTrigger} onClick={() => setRemove(true)}>
              Delete collection
            </Button>
          </div>
        </div>
        <div className={styles.form}>
          <p className={styles.kicker}>YOUR LAST CHANGE</p>
          <MessageBanner heading="Collection preview" announcement="polite">
            {message}
          </MessageBanner>
          <p className={styles.status}>
            Try Escape, Tab, and clicking outside. Deletion is a preview; your
            collection stays here.
          </p>
        </div>
      </div>
      <Dialog
        open={edit}
        onOpenChange={setEdit}
        title="edit collection"
        description="Give these moments a name of their own."
        initialFocusRef={input}
        finalFocusRef={editTrigger}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            setName(draft.trim());
            setMessage(`Renamed to ${draft.trim()}.`);
            setEdit(false);
          }}
          style={{ display: "grid", gap: 24 }}
        >
          <Field label="Collection name" required>
            <TextField
              ref={input}
              name="name"
              value={draft}
              maxLength={80}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>
          <div className={styles.actions}>
            <Button type="submit" variant="accent" disabled={!draft.trim()}>
              Save changes
            </Button>
            <Button onClick={() => setEdit(false)}>Cancel editing</Button>
          </div>
        </form>
      </Dialog>
      <AlertDialog
        open={remove}
        onOpenChange={setRemove}
        title="delete collection?"
        description={`This would remove “${name}” from your collections. Your original photos would stay on your device.`}
        initialFocusRef={cancel}
        finalFocusRef={deleteTrigger}
      >
        <div className={styles.actions}>
          <Button ref={cancel} onClick={() => setRemove(false)}>
            Keep collection
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              setMessage(
                `Deletion preview confirmed for ${name}. No photos were removed.`,
              );
              setRemove(false);
            }}
          >
            Confirm deletion
          </Button>
        </div>
      </AlertDialog>
    </section>
  );
}
