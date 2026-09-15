import { readFile } from "node:fs/promises";
import path from "node:path";
import styles from "./site.module.css";
const files = {
  settings: "SettingsExample.tsx",
  inbox: "InboxExample.tsx",
} as const;
export async function ExampleSource({
  example,
}: {
  example: keyof typeof files;
}) {
  const source = await readFile(
    path.join(process.cwd(), "examples/shared", files[example]),
    "utf8",
  );
  return (
    <details className={styles.source} id="source">
      <summary>Read the source · {files[example]}</summary>
      <pre>
        <code>{source}</code>
      </pre>
      <p>
        Shared with the runnable Vite starter in <code>examples/vite</code>.
      </p>
    </details>
  );
}
