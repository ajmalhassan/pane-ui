"use client";
import { useRef, useState } from "react";
import {
  Menu,
  Popover,
  Button,
  Field,
  TextField,
  Select,
  Switch,
  Dialog,
  AlertDialog,
  MessageBanner,
} from "@pane-ui/react";
import styles from "./fieldsWorkshop.module.css";
export function FloatingWorkshop() {
  const [name, setName] = useState("City after dark");
  const [draft, setDraft] = useState(name);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState("newest");
  const [draftSort, setDraftSort] = useState(sort);
  const [favorites, setFavorites] = useState(false);
  const [draftFavorites, setDraftFavorites] = useState(false);
  const [message, setMessage] = useState(
    "Choose an action or narrow down your collection.",
  );
  const input = useRef<HTMLInputElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const actions = useRef<HTMLButtonElement>(null);
  return (
    <section
      id="floating"
      className={styles.section}
      aria-labelledby="floating-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>10 / CLOSE AT HAND</p>
          <h2 id="floating-title">right where you are.</h2>
        </div>
        <p>A few useful actions. A little room to refine the view.</p>
      </div>
      <div className={styles.layout}>
        <div className={styles.form}>
          <p className={styles.kicker}>MENU / COLLECTION ACTIONS</p>
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
            18 photos · light, reflections, and the way home
          </p>
          <div className={styles.actions}>
            <Menu
              ref={actions}
              label="Collection actions"
              items={[
                {
                  id: "rename",
                  label: "Rename",
                  onSelect: () => {
                    setDraft(name);
                    setEditing(true);
                  },
                },
                {
                  id: "move",
                  label: "Move to favorites",
                  onSelect: () =>
                    setMessage(
                      "Collection moved to favorites in this preview.",
                    ),
                },
                {
                  id: "archive",
                  label: "Archive",
                  disabled: true,
                  onSelect: () => {},
                },
                {
                  id: "delete",
                  label: "Delete collection",
                  destructive: true,
                  onSelect: () => setDeleting(true),
                },
              ]}
            />
            <Button
              onClick={() => setMessage("Collection opened in this preview.")}
            >
              Open collection
            </Button>
          </div>
          <p className={styles.status}>
            Try the arrow keys, Home, End, or type the start of an action.
          </p>
        </div>
        <div className={styles.form}>
          <p className={styles.kicker}>POPOVER / FIND YOUR VIEW</p>
          <div className={styles.actions}>
            <Popover
              label="Filter collection"
              title="your view"
              open={filtersOpen}
              onOpenChange={(open) => {
                if (open) {
                  setDraftSort(sort);
                  setDraftFavorites(favorites);
                }
                setFiltersOpen(open);
              }}
            >
              {({ close }) => (
                <>
                  <Field label="Sort photos">
                    <Select
                      value={draftSort}
                      onChange={(event) => setDraftSort(event.target.value)}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="name">By name</option>
                    </Select>
                  </Field>
                  <Switch
                    label="Favorites only"
                    checked={draftFavorites}
                    onChange={(event) =>
                      setDraftFavorites(event.target.checked)
                    }
                  />
                  <div className={styles.actions}>
                    <Button
                      variant="accent"
                      onClick={() => {
                        setSort(draftSort);
                        setFavorites(draftFavorites);
                        setMessage("Collection filters updated.");
                        close();
                      }}
                    >
                      Apply filters
                    </Button>
                    <Button onClick={close}>Cancel filters</Button>
                  </div>
                </>
              )}
            </Popover>
            <Button
              onClick={() => {
                setSort("newest");
                setFavorites(false);
                setMessage("Collection filters reset.");
              }}
            >
              Reset filters
            </Button>
          </div>
          <p className={styles.status}>
            {sort === "newest"
              ? "Newest first"
              : sort === "oldest"
                ? "Oldest first"
                : "By name"}{" "}
            · {favorites ? "favorites only" : "all photos"}
          </p>
          <MessageBanner heading="Collection preview" announcement="polite">
            {message}
          </MessageBanner>
        </div>
      </div>
      <Dialog
        open={editing}
        onOpenChange={setEditing}
        title="rename this collection"
        initialFocusRef={input}
        finalFocusRef={actions}
      >
        <form
          style={{ display: "grid", gap: 24 }}
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) {
              setName(draft.trim());
              setMessage("Collection renamed.");
              setEditing(false);
            }
          }}
        >
          <Field label="New collection name" required>
            <TextField
              ref={input}
              value={draft}
              maxLength={80}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>
          <div className={styles.actions}>
            <Button type="submit" variant="accent" disabled={!draft.trim()}>
              Save new name
            </Button>
            <Button onClick={() => setEditing(false)}>Cancel rename</Button>
          </div>
        </form>
      </Dialog>
      <AlertDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="remove this collection?"
        description="Your original photos stay on your device. This action is a preview."
        initialFocusRef={cancel}
        finalFocusRef={actions}
      >
        <div className={styles.actions}>
          <Button ref={cancel} onClick={() => setDeleting(false)}>
            Keep these photos
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              setDeleting(false);
              setMessage("Deletion preview confirmed. No photos were removed.");
            }}
          >
            Confirm removal
          </Button>
        </div>
      </AlertDialog>
    </section>
  );
}
