import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import { Glyph } from "@/components/site/Glyph";
import styles from "@/components/site/site.module.css";
export const metadata: Metadata = { title: "Examples" };
export default function ExamplesPage() {
  return (
    <div className={styles.site}>
      <SiteHeader />
      <main id="main">
        <div className={styles.pageHeading}>
          <p className={styles.eyebrow}>PATTERNS YOU CAN BUILD ON</p>
          <h1>real little examples.</h1>
          <p>
            Working applications with readable source. See how fields, lists,
            dialogs, and motion fit together, then make them your own.
          </p>
        </div>
        <div className={styles.gallery}>
          <div className={styles.exampleCards}>
            <Link href="/examples/settings">
              <div className={styles.settingPreview} aria-hidden="true">
                <span>make it yours.</span>
                <i />
                <b />
                <i />
                <b />
                <em>save changes</em>
              </div>
              <span className={styles.eyebrow}>SETTINGS</span>
              <h2>A place for preferences.</h2>
              <p>
                Native validation, controlled fields, selection, and useful save
                feedback.
              </p>
              <span className={styles.cardArrow} aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link href="/examples/inbox">
              <div className={styles.inboxPreview} aria-hidden="true">
                <span>your people.</span>
                {["Maya Chen", "Alex Rivera", "Studio notes"].map((n) => (
                  <div key={n}>
                    <i>{n[0]}</i>
                    <b>
                      {n}
                      <small>A small moment worth sharing.</small>
                    </b>
                  </div>
                ))}
              </div>
              <span className={styles.eyebrow}>INBOX</span>
              <h2>A quieter kind of inbox.</h2>
              <p>
                Search, read, compose, and send. A complete local conversation
                flow.
              </p>
              <span className={styles.cardArrow} aria-hidden="true">
                ↗
              </span>
            </Link>
          </div>
          <div className={styles.starter}>
            <Glyph name="code" />
            <div>
              <h2>Plain React. Ready to run.</h2>
              <p>
                The Vite starter in <code>examples/vite</code> uses these same
                example components and the actual library package.
              </p>
            </div>
            <Link href="/docs/installation" className={styles.secondaryLink}>
              Run the starter →
            </Link>
          </div>
          <div className={styles.starter}>
            <Glyph name="people" />
            <div>
              <h2>The bigger picture.</h2>
              <p>
                A Windows Phone recreation: Start, People, Messages, Photos, and
                Settings.
              </p>
            </div>
            <Link href="/phone" className={styles.secondaryLink}>
              Explore the phone ↗
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
