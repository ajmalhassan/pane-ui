import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import { HeroTiles } from "@/components/site/HeroTiles";
import { PhoneIcon } from "@/components/phone/PhoneIcons";
import { Glyph } from "@/components/site/Glyph";
import { LandingMotion } from "@/components/site/LandingMotion";
import {
  TypeSpecimen,
  TileSpecimen,
  MotionSpecimen,
} from "@/components/site/DesignSpecimens";
import { ComponentStudio } from "@/components/site/ComponentStudio";
import polish from "@/components/site/landing.module.css";
import styles from "@/components/site/site.module.css";
export const metadata = pageMetadata(
  "/",
  "Pane UI \u2014 React components with live tiles and motion",
);
export default function Home() {
  return (
    <LandingMotion className={`${styles.site} ${polish.landing}`}>
      <SiteHeader />
      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title" data-hero>
          <div className={styles.heroCopy} data-hero-copy>
            <p className={styles.eyebrow} data-intro>
              <span /> A DIFFERENT RHYTHM FOR THE WEB
            </p>
            <h1 id="hero-title" data-intro>
              Software that
              <br />
              <em>feels alive.</em>
            </h1>
            <p className={styles.lede} data-intro>
              Big type. Living tiles. Motion with a purpose.
              <br />
              The spirit of Windows Phone, reimagined for the web.
            </p>
            <div className={styles.actions} data-intro>
              <Link className={styles.primaryLink} href="/docs">
                Read the docs <span aria-hidden="true">→</span>
              </Link>
              <Link className={styles.secondaryLink} href="/phone">
                Explore the phone <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <p className={styles.note}>
              React 19 · TypeScript · Yours to build with
            </p>
          </div>
          <HeroTiles />
        </section>
        <div
          className={styles.marquee}
          aria-label="Library foundations"
          data-foundations
        >
          <span>native at heart</span>
          <i />
          <span>motion by design</span>
          <i />
          <span>accessible foundations</span>
          <i />
          <span>zero framework lock-in</span>
        </div>
        <section
          className={styles.section}
          aria-labelledby="design-title"
          data-language
        >
          <div className={styles.sectionHead} data-reveal>
            <p className={styles.eyebrow}>01 / THE DESIGN LANGUAGE</p>
            <h2 id="design-title">
              Less chrome.
              <br />
              More character.
            </h2>
            <p>
              A design language that puts your content first. Every component
              speaks the same language, from a quiet checkbox to a screen full
              of living tiles.
            </p>
          </div>
          <div className={styles.principles}>
            <article data-reveal>
              <span className={styles.index}>01</span>
              <TypeSpecimen />
              <h3>Let the type do the talking.</h3>
              <p>
                Confident headings, generous space, clear hierarchy. Your
                content sets the tone.
              </p>
              <Link href="/docs/theme">
                Explore the foundations <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article data-reveal>
              <span className={styles.index}>02</span>
              <TileSpecimen />
              <h3>A little life on every surface.</h3>
              <p>
                Tiles reveal, update, and open into something more. Small
                windows into your app.
              </p>
              <Link href="/docs/tiles">
                Meet the tiles <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article data-reveal>
              <span className={styles.index}>03</span>
              <MotionSpecimen />
              <h3>Movement that connects.</h3>
              <p>
                Turnstiles, panoramas, and layered transitions preserve a sense
                of place.
              </p>
              <Link href="/docs/motion">
                Get a feel for motion <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </section>
        <ComponentStudio />
        <section
          className={styles.phoneFeature}
          aria-labelledby="phone-title"
          data-phone-story
          data-reveal
        >
          <div>
            <p className={styles.eyebrow}>03 / THE PHONE THAT STARTED IT</p>
            <h2 id="phone-title">
              Remember
              <br />
              this feeling?
            </h2>
            <p>
              A cyan Nokia Lumia 520. My first smartphone. Its live tiles and
              impossible-to-forget transitions stayed with me. Pane UI is an ode
              to that feeling, made for the web.
            </p>
            <Link className={styles.primaryLink} href="/phone">
              Meet your new old phone <span aria-hidden="true">↗</span>
            </Link>
            <span className={styles.note}>
              A working web demo. No downloads, no accounts.
            </span>
          </div>
          <Link
            href="/phone"
            className={styles.phoneDrawing}
            aria-label="Open the interactive cyan Nokia Lumia 520 replica"
          >
            <div className={styles.earpiece} />
            <span className={styles.drawBrand}>NOKIA</span>
            <div className={styles.drawScreen}>
              <span>09:41</span>
              <strong>start</strong>
              <div>
                <i>
                  <Glyph name="people" />
                  people
                </i>
                <i>
                  <Glyph name="mail" />
                  mail
                </i>
                <i>
                  24°<small>sunny</small>
                </i>
                <i>
                  <Glyph name="photo" />
                  photos
                </i>
                <i>
                  <Glyph name="music" />
                  music
                </i>
              </div>
            </div>
            <div className={styles.drawKeys} aria-hidden="true">
              <PhoneIcon name="back" />
              <PhoneIcon name="start" />
              <PhoneIcon name="search" />
            </div>
          </Link>
        </section>
        <section
          className={styles.section}
          aria-labelledby="example-title"
          data-examples
          data-reveal
        >
          <div className={styles.rowHeading}>
            <div>
              <p className={styles.eyebrow}>04 / BUILD SOMETHING REAL</p>
              <h2 id="example-title">
                A starting point,
                <br />
                not a blank screen.
              </h2>
            </div>
            <Link href="/examples" className={styles.textLink}>
              All examples <span aria-hidden="true">→</span>
            </Link>
          </div>
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
              <span className={styles.eyebrow}>FORMS + FEEDBACK</span>
              <h3>A place for preferences.</h3>
              <p>
                Validation, selection, saving, and the little details in
                between.
              </p>
              <span className={styles.cardArrow} aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link href="/examples/inbox">
              <div className={styles.inboxPreview} aria-hidden="true">
                <span>your people.</span>
                {["Maya Chen", "Alex Rivera", "Studio notes"].map((n, i) => (
                  <div key={n}>
                    <i>{n[0]}</i>
                    <b>
                      {n}
                      <small>
                        {i === 0
                          ? "Coffee tomorrow?"
                          : "A small moment worth sharing."}
                      </small>
                    </b>
                  </div>
                ))}
              </div>
              <span className={styles.eyebrow}>LISTS + DIALOGS</span>
              <h3>A quieter kind of inbox.</h3>
              <p>Find a conversation, read a message, write something back.</p>
              <span className={styles.cardArrow} aria-hidden="true">
                ↗
              </span>
            </Link>
          </div>
        </section>
        <section
          className={styles.install}
          aria-labelledby="install-title"
          data-install
          data-reveal
        >
          <div>
            <p className={styles.eyebrow}>05 / YOUR NEXT PROJECT</p>
            <h2 id="install-title">
              Make it
              <br />
              <em>your own.</em>
            </h2>
            <p>
              The component package is independent of Next.js and Tailwind.
              Start with the runnable React example, or install the alpha from
              npm into your own app.
            </p>
            <Link className={styles.primaryLink} href="/docs/installation">
              Start building <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.installCode}>
            <div>
              <span>PUBLIC ALPHA</span>
              <span>terminal</span>
            </div>
            <pre>
              <code>
                <span>01</span> npm install @pane-ui/react@alpha
              </code>
            </pre>
            <p>
              Requires React 19. APIs may change during alpha.
              <br />
              <Link href="/docs/installation">
                See the complete setup guide →
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </LandingMotion>
  );
}
