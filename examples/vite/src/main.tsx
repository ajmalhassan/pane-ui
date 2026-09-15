import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, Theme } from "@pane-ui/react";
import "@pane-ui/react/styles.css";
import { SettingsExample } from "../../shared/SettingsExample";
import { InboxExample } from "../../shared/InboxExample";
import styles from "./Starter.module.css";

function App() {
  const [example, setExample] = useState<"settings" | "inbox">("settings");
  return (
    <Theme mode="dark" className={styles.shell}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p>PANE UI</p>
          <h1>Everyday, reimagined.</h1>
          <p>Two small applications. One independent React library.</p>
        </header>
        <nav aria-label="Choose an example" className={styles.navigation}>
          <Button
            aria-pressed={example === "settings"}
            variant={example === "settings" ? "accent" : "outlined"}
            onClick={() => setExample("settings")}
          >
            Settings
          </Button>
          <Button
            aria-pressed={example === "inbox"}
            variant={example === "inbox" ? "accent" : "outlined"}
            onClick={() => setExample("inbox")}
          >
            Inbox
          </Button>
        </nav>
        <div hidden={example !== "settings"}>
          <SettingsExample />
        </div>
        <div hidden={example !== "inbox"}>
          <InboxExample />
        </div>
        <footer className={styles.footer}>
          React 19 + Vite · Local alpha · No account needed
        </footer>
      </main>
    </Theme>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
