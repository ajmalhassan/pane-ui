"use client";
import { useRef, useState } from "react";
import {
  List,
  ListItem,
  SectionHeader,
  EmptyState,
  Button,
  Menu,
  Popover,
  Field,
  TextField,
  Switch,
  Dialog,
  AlertDialog,
  Tile,
  TileGrid,
} from "@windows-phone/react";
import styles from "./fieldsWorkshop.module.css";
import collectionStyles from "./listsWorkshop.module.css";
type Collection = {
  id: string;
  name: string;
  photos: number;
  group: "recent" | "earlier";
  favorite: boolean;
  color: string;
};
const samples: Collection[] = [
  {
    id: "coast",
    name: "A quieter coast",
    photos: 24,
    group: "recent",
    favorite: true,
    color: "#087c91",
  },
  {
    id: "city",
    name: "City after dark",
    photos: 18,
    group: "recent",
    favorite: false,
    color: "#6138b1",
  },
  {
    id: "weekend",
    name: "Weekend wanderings",
    photos: 32,
    group: "earlier",
    favorite: true,
    color: "#a84400",
  },
  {
    id: "rain",
    name: "After the rain",
    photos: 12,
    group: "earlier",
    favorite: false,
    color: "#087546",
  },
];
function Cover({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path fill={color} d="M0 0h64v64H0z" />
      <circle cx="46" cy="18" r="8" fill="white" opacity=".85" />
      <path d="m0 48 20-20 17 16 12-10 15 14v16H0z" fill="white" opacity=".3" />
      <path d="M0 53h64" stroke="white" opacity=".5" />
    </svg>
  );
}
export function ListsWorkshop() {
  const [collections, setCollections] = useState(samples);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(false);
  const [message, setMessage] = useState(
    "Four collections, a few moments worth keeping.",
  );
  const [detail, setDetail] = useState<Collection | null>(null);
  const [edit, setEdit] = useState<Collection | "new" | null>(null);
  const [draft, setDraft] = useState("");
  const [remove, setRemove] = useState<Collection | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const returnTarget = useRef<HTMLElement | null>(null);
  const menuNodes = useRef(new Map<string, HTMLButtonElement>());
  const sequence = useRef(0);
  const visible = collections.filter(
    (item) =>
      (!favorites || item.favorite) &&
      item.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const restore = () => {
    setCollections(samples);
    setQuery("");
    setFavorites(false);
    setMessage("Sample collections restored.");
    search.current?.focus();
  };
  return (
    <section
      id="lists"
      className={styles.section}
      aria-labelledby="lists-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>11 / MOMENTS, IN ORDER</p>
          <h2 id="lists-title">a place for everything.</h2>
        </div>
        <p>Browse a little. Find a favorite. Keep the moments that matter.</p>
      </div>
      <div className={collectionStyles.panel}>
        <div className={collectionStyles.toolbar}>
          <Field label="Find a collection">
            <TextField
              ref={search}
              type="search"
              value={query}
              placeholder="Search your collections"
              onChange={(event) => setQuery(event.target.value)}
            />
          </Field>
          <div className={styles.actions}>
            <Popover label="Collection list filters" title="show me">
              <Switch
                label="Only favorite collections"
                checked={favorites}
                onChange={(event) => setFavorites(event.target.checked)}
              />
            </Popover>
            <Button
              variant="accent"
              onClick={(event) => {
                returnTarget.current = event.currentTarget;
                setDraft("");
                setEdit("new");
              }}
            >
              New collection
            </Button>
          </div>
        </div>
        {collections.length === 0 ? (
          <EmptyState
            title="your story starts here."
            description="Make a collection for a place, a person, or a day worth remembering."
            actions={
              <>
                <Button
                  variant="accent"
                  onClick={(event) => {
                    returnTarget.current = search.current;
                    setDraft("");
                    setEdit("new");
                  }}
                >
                  Create your first collection
                </Button>
                <Button onClick={restore}>Restore sample collections</Button>
              </>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="nothing here just yet."
            description="No collections match these filters. Try another name or show all your collections."
            actions={
              <Button
                onClick={() => {
                  setQuery("");
                  setFavorites(false);
                  search.current?.focus();
                }}
              >
                Clear collection filters
              </Button>
            }
          />
        ) : (
          (["recent", "earlier"] as const).map((group) => {
            const items = visible.filter((item) => item.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <SectionHeader
                  level={3}
                  id={`collection-group-${group}`}
                  meta={`${items.length} ${items.length === 1 ? "collection" : "collections"}`}
                >
                  {group === "recent" ? "recently added" : "a little earlier"}
                </SectionHeader>
                <List animate aria-labelledby={`collection-group-${group}`}>
                  {items.map((item) => (
                    <ListItem
                      key={item.id}
                      title={item.name}
                      description={`${item.photos} photos${item.favorite ? " · favorite" : ""}`}
                      leading={<Cover color={item.color} />}
                      action={{
                        type: "button",
                        props: {
                          "aria-label": `Open ${item.name}`,
                          onClick: (event) => {
                            returnTarget.current = event.currentTarget;
                            setDetail(item);
                          },
                        },
                      }}
                      actions={
                        <Menu
                          label={`Actions for ${item.name}`}
                          ref={(node) => {
                            if (node) menuNodes.current.set(item.id, node);
                            else menuNodes.current.delete(item.id);
                          }}
                          triggerProps={{
                            className: collectionStyles.rowMenu,
                            "aria-label": `Actions for ${item.name}`,
                          }}
                          items={[
                            {
                              id: "rename",
                              label: "Rename",
                              onSelect: () => {
                                returnTarget.current =
                                  menuNodes.current.get(item.id) ??
                                  search.current;
                                setDraft(item.name);
                                setEdit(item);
                              },
                            },
                            {
                              id: "favorite",
                              label: item.favorite
                                ? "Remove from favorites"
                                : "Add to favorites",
                              onSelect: () => {
                                setCollections((current) =>
                                  current.map((value) =>
                                    value.id === item.id
                                      ? { ...value, favorite: !value.favorite }
                                      : value,
                                  ),
                                );
                                setMessage(
                                  `Favorites updated for ${item.name}.`,
                                );
                                if (favorites && item.favorite)
                                  search.current?.focus();
                              },
                            },
                            {
                              id: "delete",
                              label: "Delete collection",
                              destructive: true,
                              onSelect: () => {
                                returnTarget.current =
                                  menuNodes.current.get(item.id) ??
                                  search.current;
                                setRemove(item);
                              },
                            },
                          ]}
                        />
                      }
                    />
                  ))}
                </List>
              </div>
            );
          })
        )}
        <div className={collectionStyles.footer}>
          <p role="status" className={styles.status}>
            {message}
          </p>
          <Button
            variant="subtle"
            onClick={() => {
              setCollections([]);
              setMessage("Empty-library preview.");
            }}
          >
            Try empty library
          </Button>
        </div>
      </div>
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        title={detail?.name ?? "collection"}
        description="A few illustrated moments from this demo collection."
        finalFocusRef={returnTarget}
      >
        {detail?.photos === 0 && (
          <EmptyState
            title="nothing in here yet."
            description="This new collection is ready for its first photos."
          />
        )}
        {detail && detail.photos > 0 && (
          <TileGrid>
            <Tile label="the light">
              <Cover color={detail.color} />
            </Tile>
            <Tile label="the journey">
              <Cover color={detail.color} />
            </Tile>
            <Tile label="the moment">
              <Cover color={detail.color} />
            </Tile>
          </TileGrid>
        )}
        <Button
          className={collectionStyles.close}
          onClick={() => setDetail(null)}
        >
          Back to collections
        </Button>
      </Dialog>
      <Dialog
        open={edit !== null}
        onOpenChange={(open) => {
          if (!open) setEdit(null);
        }}
        title={edit === "new" ? "a new collection" : "a new name"}
        initialFocusRef={nameInput}
        finalFocusRef={returnTarget}
      >
        <form
          className={collectionStyles.form}
          onSubmit={(event) => {
            event.preventDefault();
            const name = draft.trim();
            if (!name) return;
            if (edit === "new") {
              const id = `new-${++sequence.current}`;
              setCollections((current) => [
                ...current,
                {
                  id,
                  name,
                  photos: 0,
                  group: "recent",
                  favorite: false,
                  color: "#0063b1",
                },
              ]);
              setQuery("");
              setFavorites(false);
            } else if (edit) {
              if (!name.toLowerCase().includes(query.trim().toLowerCase()))
                returnTarget.current = search.current;
              setCollections((current) =>
                current.map((item) =>
                  item.id === edit.id ? { ...item, name } : item,
                ),
              );
            }
            setMessage(`Collection saved: ${name}.`);
            setEdit(null);
          }}
        >
          <Field label="Name your collection" required>
            <TextField
              ref={nameInput}
              value={draft}
              maxLength={80}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>
          <div className={styles.actions}>
            <Button type="submit" variant="accent" disabled={!draft.trim()}>
              Save collection name
            </Button>
            <Button onClick={() => setEdit(null)}>
              Cancel collection name
            </Button>
          </div>
        </form>
      </Dialog>
      <AlertDialog
        open={remove !== null}
        onOpenChange={(open) => {
          if (!open) setRemove(null);
        }}
        title="delete this collection?"
        description={`Remove ${remove?.name ?? "this collection"} from the demo? Your original photos are untouched.`}
        initialFocusRef={keep}
        finalFocusRef={returnTarget}
      >
        <div className={styles.actions}>
          <Button ref={keep} onClick={() => setRemove(null)}>
            Keep this collection
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              if (!remove) return;
              setCollections((current) =>
                current.filter((item) => item.id !== remove.id),
              );
              setMessage(`Removed ${remove.name} from the demo.`);
              returnTarget.current = search.current;
              setRemove(null);
            }}
          >
            Delete from demo
          </Button>
        </div>
      </AlertDialog>
    </section>
  );
}
