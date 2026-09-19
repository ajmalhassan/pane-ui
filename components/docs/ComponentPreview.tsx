"use client";

import { useId, useRef, useState } from "react";
import {
  Theme,
  Tile,
  TileLink,
  TileGrid,
  RevealTile,
  LiveTile,
  Pressable,
  Button,
  IconButton,
  BackButton,
  AppBar,
  AppBarAction,
  AppBarLink,
  AppBarOverflow,
  Transition,
  Stagger,
  Pivot,
  PivotList,
  PivotTrigger,
  PivotPanel,
  Panorama,
  TileSequence,
  ProgressDots,
  Field,
  Label,
  FieldDescription,
  FieldError,
  TextField,
  TextArea,
  Select,
  Slider,
  Checkbox,
  Switch,
  RadioGroup,
  Progress,
  ProgressRing,
  MessageBanner,
  Dialog,
  AlertDialog,
  Menu,
  Popover,
  List,
  ListItem,
  SectionHeader,
  EmptyState,
} from "@pane-ui/react";
import styles from "./ComponentPreview.module.css";

function PlusIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export const previewNames = [
  "theme",
  "tiles",
  "reveal-tile",
  "live-tile",
  "pressable",
  "buttons",
  "app-bar",
  "transition",
  "pivot",
  "panorama",
  "tile-sequence",
  "progress-dots",
  "fields",
  "select-slider",
  "selection",
  "progress",
  "message-banner",
  "dialog",
  "floating",
  "list",
] as const;
export type PreviewName = (typeof previewNames)[number];

/** Each preview owns its state; the scoped Theme is independent of the docs shell. */
export function ComponentPreview({ name }: { name: PreviewName }) {
  return (
    <div className={styles.frame} data-component-preview={name}>
      <div className={styles.caption}>
        Interactive example <span>React 19 · local alpha</span>
      </div>
      <Theme mode="dark" accent="blue" className={styles.surface}>
        <PreviewContent name={name} />
      </Theme>
    </div>
  );
}

function PreviewContent({ name }: { name: PreviewName }) {
  const id = useId();
  const [count, setCount] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [choice, setChoice] = useState("daily");
  const [text, setText] = useState("Weekend notes");
  const [status, setStatus] = useState("Ready");
  const trigger = useRef<HTMLButtonElement>(null);
  const alertTrigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const reveal = useRef<HTMLButtonElement>(null);
  const stack = (children: React.ReactNode) => (
    <div className={styles.stack}>{children}</div>
  );
  const row = (children: React.ReactNode) => (
    <div className={styles.row}>{children}</div>
  );

  switch (name) {
    case "theme":
      return stack(
        <>
          <Button onClick={() => setEnabled(!enabled)}>
            Use {enabled ? "light" : "dark"} theme
          </Button>
          <Theme
            mode={enabled ? "dark" : "light"}
            accent="violet"
            className={styles.nested}
          >
            <p>A theme belongs to this subtree.</p>
            <Button variant="accent">Violet accent</Button>
          </Theme>
        </>,
      );
    case "tiles":
      return (
        <TileGrid>
          <Tile label="weather">24°</Tile>
          <TileLink href="/examples" label="examples">
            Explore
          </TileLink>
          <Tile label="weekend" size="wide" accent="subtle">
            A little more room.
          </Tile>
        </TileGrid>
      );
    case "reveal-tile":
      return (
        <div className={styles.tile}>
          <RevealTile
            label="forecast"
            front="24°"
            back="Clear skies"
            onRevealedChange={(value) =>
              setStatus(value ? "Forecast revealed" : "Temperature visible")
            }
          />
          <p role="status" className={styles.note}>
            {status}
          </p>
        </div>
      );
    case "live-tile":
      return (
        <TileGrid>
          <LiveTile
            label="weekend"
            accessibleLabel="Weekend plans: walk by the coast, then meet friends for lunch."
            items={["Coastal walk", "Lunch with friends"]}
          />
        </TileGrid>
      );
    case "pressable":
      return stack(
        <>
          <Pressable onClick={() => setCount(count + 1)}>
            Add a moment
          </Pressable>
          <p role="status">{count} moments added</p>
        </>,
      );
    case "buttons":
      return stack(
        <>
          {row(
            <>
              <Button variant="accent" onClick={() => setCount(count + 1)}>
                Add note
              </Button>
              <IconButton
                label="Add another note"
                icon={<PlusIcon />}
                onClick={() => setCount(count + 1)}
              />
              <BackButton
                label="Back to initial state"
                onClick={() => setCount(0)}
              />
              <Button disabled>Unavailable</Button>
            </>,
          )}
          <p role="status">{count} notes added</p>
          <Switch
            label="Show loading state"
            checked={open}
            onChange={(event) => setOpen(event.target.checked)}
          />
          <Button loading={open}>Save notes</Button>
        </>,
      );
    case "app-bar":
      return stack(
        <>
          <AppBar>
            <AppBarAction
              label="add"
              icon={<PlusIcon />}
              onClick={() => setStatus("New item added")}
            />
            <AppBarLink href="/examples" label="examples" icon={<PlusIcon />} />
            <AppBarOverflow open={open} onOpenChange={setOpen}>
              <Button
                onClick={() => {
                  setStatus("Items archived");
                  setOpen(false);
                }}
              >
                Archive
              </Button>
            </AppBarOverflow>
          </AppBar>
          <p role="status">{status}</p>
        </>,
      );
    case "transition":
      return stack(
        <>
          <Button onClick={() => setEnabled(!enabled)}>
            {enabled ? "Hide" : "Show"} content
          </Button>
          <Transition
            show={enabled}
            preset="turnstile"
            onEntered={() => setStatus("Entrance completed")}
            onExited={() => setStatus("Exit completed")}
          >
            <Stagger show>
              <p>Messages</p>
              <p>People</p>
              <p>Photos</p>
            </Stagger>
          </Transition>
          <p role="status">{status}</p>
        </>,
      );
    case "pivot":
      return (
        <Pivot defaultValue="recent">
          <PivotList aria-label="Notes view">
            <PivotTrigger value="recent">recent</PivotTrigger>
            <PivotTrigger value="saved">saved</PivotTrigger>
          </PivotList>
          <PivotPanel value="recent">
            <p>Your latest ideas, together.</p>
          </PivotPanel>
          <PivotPanel value="saved">
            <p>One note saved for later.</p>
          </PivotPanel>
        </Pivot>
      );
    case "panorama":
      return (
        <Panorama
          aria-label="Your day"
          items={[
            {
              id: "today",
              label: "today",
              children: <p>Make time for a walk. The afternoon is yours.</p>,
            },
            {
              id: "people",
              label: "people",
              children: <p>Maya and Sam are meeting for lunch.</p>,
            },
            {
              id: "places",
              label: "places",
              children: <p>The coast, the park, somewhere new.</p>,
            },
          ]}
        />
      );
    case "tile-sequence":
      return stack(
        <>
          <Button onClick={() => setEnabled(!enabled)}>
            {enabled ? "Depart" : "Return"}
          </Button>
          <TileSequence
            show={enabled}
            direction={enabled ? "backward" : "forward"}
            onEntered={() => setStatus("Tiles returned")}
            onExited={() => setStatus("Departure completed")}
            items={[
              { id: "notes", content: <Tile label="notes">3</Tile> },
              {
                id: "photos",
                content: (
                  <Tile label="photos" accent="subtle">
                    12
                  </Tile>
                ),
              },
              {
                id: "day",
                size: "wide",
                content: (
                  <Tile label="today" size="wide">
                    A clear morning
                  </Tile>
                ),
              },
            ]}
          />
          <p role="status">{status}</p>
        </>,
      );
    case "progress-dots":
      return stack(
        <>
          <Switch
            label="Loading"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          {enabled ? (
            <ProgressDots label="Loading your collection" />
          ) : (
            <p>Collection ready.</p>
          )}
        </>,
      );
    case "fields":
      return stack(
        <>
          <Field
            label="Collection name"
            description="Choose a name you will remember."
            error={text.trim() ? undefined : "Enter a collection name."}
            required
          >
            <TextField
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </Field>
          <Field label="Notes">
            <TextArea placeholder="What made this day special?" />
          </Field>
          <div>
            <Label htmlFor={`${id}-custom`}>A custom field</Label>
            <TextField
              id={`${id}-custom`}
              aria-describedby={`${id}-help ${id}-error`}
              aria-invalid="true"
              defaultValue=""
            />
            <FieldDescription id={`${id}-help`}>
              These associations are explicit.
            </FieldDescription>
            <FieldError id={`${id}-error`}>
              Add a short title before continuing.
            </FieldError>
          </div>
        </>,
      );
    case "select-slider":
      return stack(
        <>
          <Field label="View">
            <Select
              value={choice}
              onChange={(event) => setChoice(event.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </Select>
          </Field>
          <Field label={`Volume: ${count}%`}>
            <Slider
              min={0}
              max={100}
              step={5}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </Field>
        </>,
      );
    case "selection":
      return stack(
        <>
          <Checkbox label="Include photos" defaultChecked />
          <Switch label="Sync this collection" defaultChecked />
          <RadioGroup
            label="Delivery"
            name={`${id}-delivery`}
            value={choice}
            onValueChange={setChoice}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
            ]}
          />
          <p role="status">Delivery: {choice}</p>
        </>,
      );
    case "progress":
      return stack(
        <>
          <Field label={`Download: ${count}%`}>
            <Slider
              min={0}
              max={100}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </Field>
          <Progress label="Downloading collection" value={count} />
          {row(
            <>
              <ProgressRing decorative value={count} />
              <ProgressRing label="Finding new photos" size="small" />
            </>,
          )}
        </>,
      );
    case "message-banner":
      return stack(
        <>
          <Button ref={reveal} onClick={() => setEnabled(true)}>
            Show message
          </Button>
          {enabled && (
            <MessageBanner
              tone="success"
              heading="Saved locally"
              onDismiss={() => {
                setEnabled(false);
                reveal.current?.focus();
              }}
              dismissLabel="Dismiss saved message"
            >
              Your sample collection is ready. Nothing was sent to a server.
            </MessageBanner>
          )}
        </>,
      );
    case "dialog":
      return stack(
        <>
          {row(
            <>
              <Button ref={trigger} onClick={() => setOpen(true)}>
                Edit collection
              </Button>
              <Button ref={alertTrigger} onClick={() => setAlertOpen(true)}>
                Delete sample
              </Button>
            </>,
          )}
          <p role="status">{status}</p>
          <Dialog
            open={open}
            onOpenChange={setOpen}
            title="Edit collection"
            description="Change the name of this local sample."
            initialFocusRef={input}
            finalFocusRef={trigger}
          >
            <Field label="Name">
              <TextField
                ref={input}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </Field>
            {row(
              <>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  variant="accent"
                  onClick={() => {
                    setStatus(`Saved: ${text}`);
                    setOpen(false);
                  }}
                >
                  Save
                </Button>
              </>,
            )}
          </Dialog>
          <AlertDialog
            open={alertOpen}
            onOpenChange={setAlertOpen}
            title="Delete sample?"
            description="This only changes the preview status. No files will be removed."
            initialFocusRef={cancel}
            finalFocusRef={alertTrigger}
          >
            {row(
              <>
                <Button ref={cancel} onClick={() => setAlertOpen(false)}>
                  Keep sample
                </Button>
                <Button
                  onClick={() => {
                    setStatus("Sample deleted in this preview");
                    setAlertOpen(false);
                  }}
                >
                  Delete sample
                </Button>
              </>,
            )}
          </AlertDialog>
        </>,
      );
    case "floating":
      return stack(
        <>
          {row(
            <>
              <Menu
                label="Collection actions"
                items={[
                  {
                    id: "save",
                    label: "Save for later",
                    onSelect: () => setStatus("Saved for later"),
                  },
                  {
                    id: "archive",
                    label: "Archive",
                    onSelect: () => setStatus("Collection archived"),
                  },
                  {
                    id: "share",
                    label: "Share",
                    disabled: true,
                    onSelect: () => {},
                  },
                ]}
              />
              <Popover label="Filter collection" title="Your view">
                {({ close }) => (
                  <div className={styles.stack}>
                    <Checkbox label="Only favorites" defaultChecked />
                    <Button onClick={close}>Done</Button>
                  </div>
                )}
              </Popover>
            </>,
          )}
          <p role="status">{status}</p>
        </>,
      );
    case "list":
      return stack(
        <>
          <SectionHeader level={3} id={`${id}-recent`} meta="2 notes">
            recent
          </SectionHeader>
          <List aria-labelledby={`${id}-recent`} animate>
            <ListItem
              title="Coastal walk"
              description="A note from Sunday"
              action={{
                type: "button",
                props: { onClick: () => setStatus("Opened Coastal walk") },
              }}
              actions={
                <IconButton
                  label="Save Coastal walk"
                  icon={<PlusIcon />}
                  onClick={() => setStatus("Saved Coastal walk")}
                />
              }
            />
            <ListItem
              title="Weekend plans"
              meta="Draft"
              action={{
                type: "button",
                props: { onClick: () => setStatus("Opened Weekend plans") },
              }}
            />
          </List>
          <p role="status">{status}</p>
          <EmptyState
            title="No archived notes"
            description="Archived notes will appear here."
            headingLevel={3}
          />
        </>,
      );
  }
}
