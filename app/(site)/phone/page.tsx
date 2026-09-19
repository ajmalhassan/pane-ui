import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { PhoneDemo } from "@/components/phone/PhoneDemo";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import styles from "@/components/site/site.module.css";
export const metadata = pageMetadata(
  "/phone",
  "Nokia Lumia 520 — the inspiration — Pane UI",
  "Explore an interactive cyan Nokia Lumia 520 recreation, built with Pane UI live tiles, People hub, and Windows Phone-inspired transitions.",
);
export default function PhonePage() {
  return (
    <div className={styles.site}>
      <SiteHeader />
      <main id="main">
        <div className={styles.pageHeading}>
          <p className={styles.eyebrow}>NOKIA LUMIA 520 / CYAN</p>
          <h1>hello again, Lumia.</h1>
          <p>
            An ode to my first smartphone: the cyan Nokia Lumia 520. This is
            where Pane UI began.
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
              The cyan shell. The live tiles. The way every page moved. This
              interactive recreation is a tribute to the phone that inspired
              Pane UI. Pick a tile and make yourself at home.
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
