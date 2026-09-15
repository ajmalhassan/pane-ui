import Link from "next/link";
import type { Metadata } from "next";
import { SettingsExample } from "@/examples/shared/SettingsExample";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import { ExampleSource } from "@/components/site/ExampleSource";
import styles from "@/components/site/site.module.css";
export const metadata: Metadata = { title: "Settings example" };
export default function ExamplePage() {
  return (
    <div className={styles.site}>
      <SiteHeader />
      <main id="main">
        <div className={styles.pageHeading}>
          <Link href="/examples">← All examples</Link>
          <p className={styles.eyebrow}>THE SETTINGS EXAMPLE</p>
          <h1>make it yours.</h1>
          <p>
            A practical settings form, built from native controls and clear
            feedback.
          </p>
        </div>
        <div className={styles.demoSurface}>
          <SettingsExample />
        </div>
        <ExampleSource example="settings" />
      </main>
      <SiteFooter />
    </div>
  );
}
