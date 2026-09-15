import { useId, useState } from "react";
import {
  AppBar,
  AppBarAction,
  Button,
  Field,
  Panorama,
  Pressable,
  RadioGroup,
  TextArea,
  TextField,
} from "@windows-phone/react";
import { Landscape, PhoneIcon, Portrait, type IconName } from "./PhoneIcons";
import { createMessage, type Screen } from "./state";
import s from "./phone.module.css";
export type Accent = "blue" | "violet" | "magenta" | "orange" | "green";
export interface Message {
  recipient: string;
  text: string;
}
export interface AppScreensProps {
  screen: Screen;
  open: (screen: Screen, trigger?: string) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  mode: "dark" | "light";
  setMode: (mode: "dark" | "light") => void;
  messages: Message[];
  send: (message: Message) => void;
  person: string;
  setPerson: (person: string) => void;
  photo: number;
  setPhoto: (index: number) => void;
}
const people = [
  "Maya Chen",
  "Leo Martinez",
  "Aisha Patel",
  "Sam Rivera",
  "Noah Kim",
  "Ella Brooks",
];
const photos = ["Golden hour", "By the water", "Quiet dunes", "Into the green"];
const apps: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: "messages", label: "Messaging", icon: "messages" },
  { screen: "people", label: "People", icon: "people" },
  { screen: "photos", label: "Photos", icon: "photos" },
  { screen: "settings", label: "Settings", icon: "settings" },
];
function Heading({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <header className={s.appHeader}>
      {eyebrow && <p>{eyebrow}</p>}
      <h2 tabIndex={-1} data-phone-heading>
        {title}
      </h2>
    </header>
  );
}
export function AppScreens(p: AppScreensProps) {
  const [query, setQuery] = useState("");
  const [recipient, setRecipient] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const id = useId();
  function submit(to: string) {
    const message = createMessage(to, draft);
    if (!message) {
      setError("Add a name and a message first.");
      return;
    }
    p.send(message);
    setDraft("");
    setError("");
    p.setPerson(message.recipient);
    if (p.screen === "compose") p.open("conversation", "compose-new");
  }
  if (p.screen === "apps")
    return (
      <>
        <Heading title="applications" />
        <div className={s.appBody}>
          <TextField
            aria-label="Search applications"
            placeholder="search applications"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={s.appList}>
            {apps
              .filter((a) =>
                a.label.toLowerCase().includes(query.toLowerCase()),
              )
              .map((a) => (
                <Pressable
                  key={a.screen}
                  data-phone-focus={`app-${a.screen}`}
                  onClick={() => p.open(a.screen, `app-${a.screen}`)}
                >
                  <span>
                    <PhoneIcon name={a.icon} />
                  </span>
                  {a.label}
                </Pressable>
              ))}
            {apps.every(
              (a) => !a.label.toLowerCase().includes(query.toLowerCase()),
            ) && <p>No applications found.</p>}
          </div>
        </div>
      </>
    );
  if (p.screen === "people")
    return (
      <>
        <Heading title="people" />
        <Panorama
          aria-label="People sections"
          className={s.panorama}
          items={[
            {
              id: "all",
              label: "all",
              children: (
                <div className={s.peopleList}>
                  <p className={s.sectionNote}>
                    A little closer to your people.
                  </p>
                  {people.map((name, i) => (
                    <Pressable
                      key={name}
                      data-phone-focus={`person-${i}`}
                      onClick={() => {
                        p.setPerson(name);
                        p.open("conversation", `person-${i}`);
                      }}
                    >
                      <Portrait index={i} />
                      <span>
                        {name}
                        <small>{i % 2 ? "Available" : "On the move"}</small>
                      </span>
                    </Pressable>
                  ))}
                </div>
              ),
            },
            {
              id: "together",
              label: "together",
              children: (
                <div className={s.together}>
                  <div className={s.groupPortraits}>
                    {[0, 1, 2, 3].map((i) => (
                      <Portrait index={i} key={i} />
                    ))}
                  </div>
                  <h3>The weekend crew</h3>
                  <p>Small adventures. Good company.</p>
                  <Button
                    onClick={() => {
                      p.setPerson("Maya Chen");
                      p.open("conversation");
                    }}
                  >
                    message Maya
                  </Button>
                </div>
              ),
            },
            {
              id: "new",
              label: "what’s new",
              children: (
                <div className={s.updates}>
                  <Portrait index={2} />
                  <h3>Aisha Patel</h3>
                  <p>
                    Found a quiet corner of the city. Sometimes the best plan is
                    no plan.
                  </p>
                  <Landscape variant={3} />
                  <small>12 minutes ago · sample update</small>
                </div>
              ),
            },
          ]}
        />
      </>
    );
  if (p.screen === "messages")
    return (
      <>
        <Heading title="messaging" eyebrow="MESSAGES" />
        <div className={s.appBody}>
          <p className={s.pivotLabel}>threads</p>
          {[
            ...new Set([
              ...p.messages.map((m) => m.recipient),
              ...people.slice(0, 3),
            ]),
          ].map((name) => {
            const sampleIndex = Math.max(0, people.indexOf(name));
            const last = p.messages.filter((m) => m.recipient === name).at(-1);
            return (
              <Pressable
                key={name}
                className={s.thread}
                data-phone-focus={`thread-${name}`}
                onClick={() => {
                  p.setPerson(name);
                  p.open("conversation", `thread-${name}`);
                }}
              >
                <span>
                  {name}
                  <time>
                    {last ? "now" : sampleIndex === 0 ? "09:37" : "yesterday"}
                  </time>
                </span>
                <p>
                  {last?.text ??
                    [
                      "Coffee at the usual place?",
                      "That light was incredible.",
                      "See you this weekend!",
                    ][sampleIndex % 3]}
                </p>
                <small>{last ? "You · local demo" : "Mobile"}</small>
              </Pressable>
            );
          })}
        </div>
        <AppBar className={s.appBar}>
          <AppBarAction
            data-phone-focus="compose-new"
            icon={<PhoneIcon name="add" />}
            label="new"
            onClick={() => {
              setRecipient("");
              p.open("compose", "compose-new");
            }}
          />
        </AppBar>
      </>
    );
  if (p.screen === "conversation")
    return (
      <>
        <Heading
          title={p.person.split(" ")[0].toLowerCase()}
          eyebrow="MESSAGING"
        />
        <div className={`${s.appBody} ${s.conversation}`}>
          <p className={s.conversationDate}>TODAY</p>
          <div className={s.received}>
            Coffee at the usual place?<small>09:37</small>
          </div>
          <div className={s.sent}>
            Sounds good. I’ll bring the camera.<small>09:38</small>
          </div>
          <div className={s.received}>
            Perfect. See you there.<small>09:39</small>
          </div>
          {p.messages
            .filter((m) => m.recipient === p.person)
            .map((m, i) => (
              <div key={i} className={s.sent}>
                {m.text}
                <small>now · saved in this demo</small>
              </div>
            ))}
        </div>
        <form
          className={s.reply}
          onSubmit={(e) => {
            e.preventDefault();
            submit(p.person);
          }}
        >
          <TextField
            aria-label={`Message ${p.person}`}
            placeholder="type a message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
          />
          <Button
            type="submit"
            aria-label="Send message"
            disabled={!draft.trim()}
          >
            <PhoneIcon name="send" />
          </Button>
        </form>
      </>
    );
  if (p.screen === "compose")
    return (
      <>
        <Heading title="new message" />
        <form
          className={`${s.appBody} ${s.compose}`}
          onSubmit={(e) => {
            e.preventDefault();
            submit(recipient);
          }}
        >
          <Field label="To" controlId={`${id}-to`}>
            <TextField
              id={`${id}-to`}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="name"
              maxLength={80}
              required
            />
          </Field>
          <Field label="Message" controlId={`${id}-message`}>
            <TextArea
              id={`${id}-message`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="say hello"
              rows={5}
              maxLength={1000}
              required
            />
          </Field>
          {error && <p role="alert">{error}</p>}
          <Button type="submit" variant="accent">
            send message
          </Button>
          <p className={s.sectionNote}>
            Messages stay in this demo. Nothing is sent externally.
          </p>
        </form>
      </>
    );
  if (p.screen === "photos")
    return (
      <>
        <Heading title="photos" />
        <div className={s.appBody}>
          <p className={s.pivotLabel}>camera roll</p>
          <div className={s.photoGrid}>
            {[0, 1, 2, 3, 1, 0].map((variant, i) => (
              <Pressable
                key={i}
                aria-label={`View ${photos[variant]} photo ${i + 1}`}
                data-phone-focus={`photo-${i}`}
                onClick={() => {
                  p.setPhoto(variant);
                  p.open("photo", `photo-${i}`);
                }}
              >
                <Landscape variant={variant} />
              </Pressable>
            ))}
          </div>
          <p className={s.sectionNote}>6 moments · original demo artwork</p>
        </div>
      </>
    );
  if (p.screen === "photo")
    return (
      <>
        <Heading title={photos[p.photo].toLowerCase()} eyebrow="CAMERA ROLL" />
        <div className={s.photoDetail}>
          <Landscape variant={p.photo} />
          <p>
            {photos[p.photo]}
            <small>September 15 · Original vector artwork</small>
          </p>
        </div>
        <AppBar className={s.appBar}>
          <AppBarAction
            icon={<PhoneIcon name="back" />}
            label="previous"
            onClick={() => p.setPhoto((p.photo + 3) % 4)}
          />
          <AppBarAction
            icon={<PhoneIcon name="arrow" />}
            label="next"
            onClick={() => p.setPhoto((p.photo + 1) % 4)}
          />
        </AppBar>
      </>
    );
  return (
    <>
      <Heading title="settings" />
      <div className={`${s.appBody} ${s.settings}`}>
        <p className={s.pivotLabel}>theme</p>
        <RadioGroup
          label="Background"
          name={`${id}-background`}
          value={p.mode}
          onValueChange={(v) => p.setMode(v as "dark" | "light")}
          options={[
            { value: "dark", label: "dark" },
            { value: "light", label: "light" },
          ]}
        />
        <RadioGroup
          label="Accent color"
          name={`${id}-accent`}
          value={p.accent}
          onValueChange={(v) => p.setAccent(v as Accent)}
          options={(
            ["blue", "violet", "magenta", "orange", "green"] as const
          ).map((color) => ({
            value: color,
            label: (
              <span className={s.colorOption}>
                <i data-color={color} />
                {color}
              </span>
            ),
          }))}
        />
        <p className={s.sectionNote}>
          Your colors carry through every app and tile. Settings last until you
          reload.
        </p>
      </div>
    </>
  );
}
