import Link from "next/link";
import type { Metadata } from "next";
import { InboxExample } from "@/examples/shared/InboxExample";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import { ExampleSource } from "@/components/site/ExampleSource";
import styles from "@/components/site/site.module.css";
export const metadata: Metadata = { title: "Inbox example" };
export default function ExamplePage() {
  return (
    <div className={styles.site}>
      <SiteHeader />
      <main id="main">
        <div className={styles.pageHeading}>
          <Link href="/examples">← All examples</Link>
          <p className={styles.eyebrow}>THE INBOX EXAMPLE</p>
          <h1>your people.</h1>
          <p>
            A local inbox with search, conversations and a place to write back.
          </p>
        </div>
        <div className={styles.demoSurface}>
          <InboxExample />
        </div>
        <ExampleSource example="inbox" />
      </main>
      <SiteFooter />
    </div>
  );
}
