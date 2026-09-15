import Link from "next/link";
import type { Metadata } from "next";
import { PhoneDemo } from "@/components/phone/PhoneDemo";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import styles from "@/components/site/site.module.css";
export const metadata: Metadata = { title: "The phone" };
export default function PhonePage() {
  return (
    <div className={styles.site}>
      <SiteHeader />
      <main id="main">
        <div className={styles.pageHeading}>
          <p className={styles.eyebrow}>
            A FAMILIAR FEELING, BUILT FROM COMPONENTS
          </p>
          <h1>hello again, phone.</h1>
          <p>
            A little nostalgia. A lot of working React. Pick a tile and make
            yourself at home.
          </p>
        </div>
        <div className={styles.phonePage}>
          <aside>
            <h2>
              Everything starts
              <br />
              with a tile.
            </h2>
            <p>
              This is an interactive web recreation built with Pane UI. Explore the familiar gestures and details that inspired the
              library.
            </p>
            <dl>
              <dt>01 / START</dt>
              <dd>
                Open a tile. Watch the group turn away as its individual tiles
                follow.
              </dd>
              <dt>02 / EXPLORE</dt>
              <dd>
                Meet your people, send a demo message, or browse the photo
                collection.
              </dd>
              <dt>03 / MAKE IT YOURS</dt>
              <dd>
                Open Settings to change your accent and theme. Use the Windows
                key to come home.
              </dd>
            </dl>
            <Link className={styles.textLink} href="/docs/motion">
              Read about the motion →
            </Link>
            <p className={styles.note}>
              All content is local sample data. A browser demo, not an operating
              system emulator.
            </p>
          </aside>
          <div>
            <PhoneDemo />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
