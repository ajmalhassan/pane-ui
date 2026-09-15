"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  Button,
  Dialog,
  EmptyState,
  Field,
  List,
  ListItem,
  MessageBanner,
  Switch,
  TextArea,
  TextField,
  Theme,
} from "@windows-phone/react";
import { validateForm } from "./formValidation";
import styles from "./Examples.module.css";

type Message = {
  id: number;
  person: string;
  address: string;
  subject: string;
  body: string;
  time: string;
  read: boolean;
  folder: "inbox" | "sent";
};
const initialMessages: Message[] = [
  {
    id: 1,
    person: "Sam Rivera",
    address: "sam@example.com",
    subject: "Saturday by the water",
    body: "The forecast looks lovely for Saturday. Let’s meet by the old boathouse at ten, walk along the water and find somewhere for lunch.\n\nBring your camera — the morning light should be beautiful.\n\nSam",
    time: "9:41 AM",
    read: false,
    folder: "inbox",
  },
  {
    id: 2,
    person: "June Park",
    address: "june@example.com",
    subject: "A few ideas for the studio",
    body: "I sketched a few options for the reading corner: a long shelf, a warm lamp and a place to leave notes.\n\nLet’s choose one together when you’re next in.\n\nJune",
    time: "8:15 AM",
    read: false,
    folder: "inbox",
  },
  {
    id: 3,
    person: "Northside Library",
    address: "hello@example.com",
    subject: "Your book is ready",
    body: "The book you reserved is waiting at the front desk. We’ll hold it through Friday.\n\nOur opening hours are 9 AM to 6 PM. See you soon!",
    time: "Yesterday",
    read: true,
    folder: "inbox",
  },
];
const emptyDraft = { to: "", subject: "", body: "" };

export function InboxExample() {
  const id = useId();
  const [messages, setMessages] = useState(initialMessages);
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [dark, setDark] = useState(true);
  const composeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const recipientRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLHeadingElement>(null);
  const previousSelected = useRef<number | null>(null);
  useEffect(() => {
    if (selected !== null) detailRef.current?.focus();
    else if (previousSelected.current !== null) searchRef.current?.focus();
    previousSelected.current = selected;
  }, [selected]);
  const message = messages.find((item) => item.id === selected);
  const unread = messages.filter(
    (item) => item.folder === "inbox" && !item.read,
  ).length;
  const visible = messages.filter(
    (item) =>
      item.folder === folder &&
      `${item.person} ${item.address} ${item.subject} ${item.body}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  function updateDraft(key: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }
  return (
    <Theme mode={dark ? "dark" : "light"} className={styles.example}>
      <header className={styles.header}>
        <div className={styles.topline}>
          <p className={styles.eyebrow}>OUTLOOK / LOCAL DEMO</p>
          <Switch
            label="Dark theme"
            checked={dark}
            onChange={(event) => setDark(event.target.checked)}
          />
        </div>
        <h2 className={styles.title}>good things arrive</h2>
        <p className={styles.intro}>
          A quieter place for your everyday conversations.
        </p>
      </header>
      <div className={styles.toolbar}>
        <div className={styles.folderButtons} aria-label="Message folders">
          <Button
            variant={folder === "inbox" ? "accent" : "subtle"}
            aria-pressed={folder === "inbox"}
            onClick={() => {
              setFolder("inbox");
              setSelected(null);
            }}
          >
            Inbox
          </Button>
          <Button
            variant={folder === "sent" ? "accent" : "subtle"}
            aria-pressed={folder === "sent"}
            onClick={() => {
              setFolder("sent");
              setSelected(null);
            }}
          >
            Sent
          </Button>
        </div>
        <Button
          ref={composeRef}
          onClick={() => {
            setNotice("");
            setComposing(true);
          }}
        >
          Compose message
        </Button>
      </div>
      {notice && (
        <MessageBanner
          className={styles.notice}
          tone="success"
          announcement="polite"
        >
          {notice}
        </MessageBanner>
      )}
      {message ? (
        <article className={styles.detail} aria-labelledby={`${id}-subject`}>
          <Button onClick={() => setSelected(null)}>Back to inbox</Button>
          <p className={styles.eyebrow}>
            {message.folder === "sent" ? "TO" : "FROM"} {message.address}
          </p>
          <h3 ref={detailRef} tabIndex={-1} id={`${id}-subject`}>
            {message.subject}
          </h3>
          <p className={styles.muted}>
            {message.person} · {message.time}
          </p>
          <div className={styles.messageBody}>{message.body}</div>
        </article>
      ) : (
        <section
          aria-label={folder === "inbox" ? "Inbox messages" : "Sent messages"}
        >
          <div className={styles.search}>
            <Field label="Search messages">
              <TextField
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="People, subjects, words…"
              />
            </Field>
            <p className={styles.muted}>
              {folder === "inbox"
                ? `${unread} unread`
                : `${messages.filter((item) => item.folder === "sent").length} sent`}{" "}
              · {visible.length} shown
            </p>
          </div>
          {visible.length ? (
            <List>
              {visible.map((item) => (
                <ListItem
                  key={item.id}
                  className={styles.messageRow}
                  data-unread={!item.read || undefined}
                  leading={
                    <span className={styles.avatar} aria-hidden="true">
                      {item.person
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  }
                  title={item.subject}
                  description={item.person}
                  meta={`${!item.read ? "Unread · " : ""}${item.time}`}
                  action={{
                    type: "button",
                    props: {
                      onClick: () => {
                        setSelected(item.id);
                        setMessages((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, read: true }
                              : entry,
                          ),
                        );
                      },
                    },
                  }}
                />
              ))}
            </List>
          ) : (
            <EmptyState
              title={query ? "No messages found" : "No sent messages yet"}
              description={
                query
                  ? "Try a person’s name or another word."
                  : "Compose a message to start a conversation."
              }
              actions={
                query ? (
                  <Button
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                  >
                    Clear search
                  </Button>
                ) : (
                  <Button onClick={() => setComposing(true)}>
                    Compose message
                  </Button>
                )
              }
            />
          )}
        </section>
      )}
      <p className={styles.note}>
        Original sample conversations. Messages stay in this page session and
        are never delivered.
      </p>
      <Dialog
        open={composing}
        onOpenChange={setComposing}
        title="new message"
        description="Save a message to your local Sent folder."
        initialFocusRef={recipientRef}
        finalFocusRef={composeRef}
      >
        <form
          className={styles.compose}
          aria-label="Compose message"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const nextErrors = validateForm(event.currentTarget);
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length) return;
            setMessages((current) => [
              {
                id: Math.max(...current.map((item) => item.id), 0) + 1,
                person: draft.to.trim(),
                address: draft.to.trim(),
                subject: draft.subject.trim(),
                body: draft.body.trim(),
                time: "Just now",
                read: true,
                folder: "sent",
              },
              ...current,
            ]);
            setDraft(emptyDraft);
            setComposing(false);
            setFolder("sent");
            setSelected(null);
            setQuery("");
            setNotice("Message saved to Sent. This demo does not send email.");
          }}
        >
          <Field label="To" required error={errors.to}>
            <TextField
              ref={recipientRef}
              name="to"
              type="email"
              value={draft.to}
              onChange={(event) => updateDraft("to", event.target.value)}
              placeholder="friend@example.com"
            />
          </Field>
          <Field label="Subject" required error={errors.subject}>
            <TextField
              name="subject"
              maxLength={160}
              value={draft.subject}
              onChange={(event) => updateDraft("subject", event.target.value)}
            />
          </Field>
          <Field label="Message" required error={errors.body}>
            <TextArea
              name="body"
              rows={5}
              maxLength={4000}
              value={draft.body}
              onChange={(event) => updateDraft("body", event.target.value)}
            />
          </Field>
          <div className={styles.actions}>
            <Button type="submit" variant="accent">
              Send message
            </Button>
            <Button onClick={() => setComposing(false)}>
              Keep draft & close
            </Button>
          </div>
        </form>
      </Dialog>
    </Theme>
  );
}
