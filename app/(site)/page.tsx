import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import { HeroTiles } from "@/components/site/HeroTiles";
import { Glyph } from "@/components/site/Glyph";
import styles from "@/components/site/site.module.css";
export default function Home() {
  return (
    <div className={styles.site}>
      <SiteHeader />
      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span /> A DIFFERENT KIND OF REACT LIBRARY
            </p>
            <h1 id="hero-title">
              Software that
              <br />
              <em>feels alive.</em>
            </h1>
            <p className={styles.lede}>
              Big type. Living tiles. Motion with a purpose.
              <br />
              The spirit of Windows Phone, reimagined for the web.
            </p>
            <div className={styles.actions}>
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
        <div className={styles.marquee} aria-label="Library foundations">
          <span>native at heart</span>
          <i />
          <span>motion by design</span>
          <i />
          <span>accessible foundations</span>
          <i />
          <span>zero framework lock-in</span>
        </div>
        <section className={styles.section} aria-labelledby="design-title">
          <div className={styles.sectionHead}>
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
            <article>
              <span className={styles.index}>01</span>
              <div className={styles.typeSpecimen} aria-hidden="true">
                Aa<span>light / regular / bold</span>
              </div>
              <h3>Let the type do the talking.</h3>
              <p>
                Confident headings, generous space, clear hierarchy. Your
                content sets the tone.
              </p>
              <Link href="/docs/theme">
                Explore the foundations <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article>
              <span className={styles.index}>02</span>
              <div className={styles.miniGrid} aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
              <h3>A little life on every surface.</h3>
              <p>
                Tiles reveal, update, and open into something more. Small
                windows into your app.
              </p>
              <Link href="/docs/tiles">
                Meet the tiles <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article>
              <span className={styles.index}>03</span>
              <div className={styles.motionSpecimen} aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
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
        <section className={styles.phoneFeature} aria-labelledby="phone-title">
          <div>
            <p className={styles.eyebrow}>02 / SOMETHING FAMILIAR</p>
            <h2 id="phone-title">
              Remember
              <br />
              this feeling?
            </h2>
            <p>
              The Start screen. The People hub. Those impossible-to-forget
              transitions. Step inside an interactive recreation, built with the
              same components you’ll use.
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
            aria-label="Open the interactive Windows Phone replica"
          >
            <div className={styles.earpiece} />
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
            <div className={styles.drawKeys}>
              <span>←</span>
              <span>⊞</span>
              <span>⌕</span>
            </div>
          </Link>
        </section>
        <section className={styles.section} aria-labelledby="example-title">
          <div className={styles.rowHeading}>
            <div>
              <p className={styles.eyebrow}>03 / BUILD SOMETHING REAL</p>
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
        <section className={styles.install} aria-labelledby="install-title">
          <div>
            <p className={styles.eyebrow}>04 / YOUR NEXT PROJECT</p>
            <h2 id="install-title">
              Make it
              <br />
              <em>your own.</em>
            </h2>
            <p>
              The component package is independent of Next.js and Tailwind.
              Start with the runnable React example, or install a local tarball
              into your own app.
            </p>
            <Link className={styles.primaryLink} href="/docs/installation">
              Start building <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.installCode}>
            <div>
              <span>LOCAL ALPHA</span>
              <span>terminal</span>
            </div>
            <pre>
              <code>
                <span>01</span> npm ci{"\n"}
                <span>02</span> npm run build:library{"\n"}
                <span>03</span> npm pack ./packages/react
              </code>
            </pre>
            <p>
              Public npm installation comes after the release review.
              <br />
              <Link href="/docs/installation">
                See the complete setup guide →
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
