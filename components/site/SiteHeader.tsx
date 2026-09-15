import Link from "next/link";
import { Mark } from "./Mark";
import styles from "./site.module.css";
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link
        className={styles.brand}
        href="/"
        aria-label="Pane UI home"
      >
        <Mark />
        <span>
          pane<small>ui</small>
        </span>
      </Link>
      <nav aria-label="Project navigation">
        <Link href="/docs">Documentation</Link>
        <Link href="/examples">Examples</Link>
        <Link href="/phone">
          The phone <span aria-hidden="true">↗</span>
        </Link>
      </nav>
      <span className={styles.alpha}>0.1 / local alpha</span>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Link href="/" className={styles.brand}>
        <Mark />
        Pane UI
      </Link>
      <p>An independent tribute to a different way of thinking.</p>
      <div>
        <Link href="/docs/accessibility-support">Accessibility</Link>
        <Link href="/library">Component workshop</Link>
        <Link href="/docs/installation">Get started</Link>
      </div>
      <small>
        Inspired by Windows Phone. Built for the web. Not affiliated with
        Microsoft.
      </small>
    </footer>
  );
}
