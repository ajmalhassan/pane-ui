"use client";

import { Mark } from "@/components/site/Mark";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AppBar,
  AppBarAction,
  LiveTile,
  Pressable,
  RevealTile,
  Stagger,
  Theme,
  Tile,
  TileGrid,
  TileLink,
  Transition,
  type ThemeProps,
  type TransitionPreset,
} from "@pane-ui/react";
import styles from "./library.module.css";
import { ListsWorkshop } from "./ListsWorkshop";
import { FloatingWorkshop } from "./FloatingWorkshop";
import { DialogsWorkshop } from "./DialogsWorkshop";
import { FeedbackWorkshop } from "./FeedbackWorkshop";
import { AdjustmentsWorkshop } from "./AdjustmentsWorkshop";
import { SelectionWorkshop } from "./SelectionWorkshop";
import { FieldsWorkshop } from "./FieldsWorkshop";
import { CommandsWorkshop } from "./CommandsWorkshop";
import { NavigationWorkshop } from "./NavigationWorkshop";

type IconName =
  | "arrow"
  | "back"
  | "play"
  | "sun"
  | "mail"
  | "music"
  | "plus"
  | "code";
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    back: <path d="M19 12H5m6-6-6 6 6 6" />,
    play: <path d="m9 5 11 7-11 7Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
      </>
    ),
    mail: (
      <>
        <path d="M3 5h18v14H3z" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),
    music: (
      <>
        <path d="M9 17V5l11-2v12M9 8l11-2" />
        <ellipse cx="6" cy="18" rx="3" ry="2" />
        <ellipse cx="17" cy="16" rx="3" ry="2" />
      </>
    ),
    plus: <path d="M12 4v16M4 12h16" />,
    code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const PRESETS: { id: TransitionPreset; title: string; description: string }[] =
  [
    {
      id: "turnstile",
      title: "Turnstile",
      description:
        "A surface turns around its leading edge. The movement gives departure and arrival a shared direction.",
    },
    {
      id: "slide",
      title: "Slide",
      description:
        "A quiet horizontal shift preserves the sense of adjacent spaces. Use it for lightweight changes in context.",
    },
    {
      id: "continuum",
      title: "Continuum",
      description:
        "A surface moves through depth as it enters or leaves. This preset suggests continuity without requiring a router.",
    },
    {
      id: "fade",
      title: "Fade",
      description:
        "A simple change in opacity, for moments when the content matters more than the movement.",
    },
  ];
const COLORS = ["blue", "violet", "magenta", "orange", "green"] as const;

export function Workshop() {
  const [mode, setMode] = useState<ThemeProps["mode"]>("dark");
  const [accent, setAccent] = useState<ThemeProps["accent"]>("blue");
  const [preset, setPreset] = useState<TransitionPreset>("turnstile");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [show, setShow] = useState(true);
  const [replay, setReplay] = useState(false);
  const [duration, setDuration] = useState(420);
  const [reduced, setReduced] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detail, setDetail] = useState(false);
  const [screenVisible, setScreenVisible] = useState(true);
  const pendingDetail = useRef(false);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  function replayTransition() {
    if (!show) {
      setShow(true);
      return;
    }
    setReplay(true);
    setShow(false);
  }

  function openDetail(next: boolean) {
    pendingDetail.current = next;
    setScreenVisible(false);
  }

  return (
    <Theme
      mode={mode}
      accent={accent}
      className={styles.workshop}
      data-workshop
    >
      <a className={styles.skip} href="#tiles">
        Skip to components
      </a>
      <div className={styles.container}>
        <header className={styles.header}>
          <a
            href="#"
            className={styles.wordmark}
            aria-label="Pane UI workshop home"
          >
            <Mark />
            <span>
              pane ui
              <span className={styles.wordmarkSub}>
                REACT COMPONENT LIBRARY
              </span>
            </span>
          </a>
          <span className={styles.alpha}>
            <span /> 0.1.0 / local alpha
          </span>
        </header>
        <nav className={styles.nav} aria-label="Workshop sections">
          <a href="#tiles">
            <span>01</span> tiles
          </a>
          <a href="#motion">
            <span>02</span> motion
          </a>
          <a href="#navigation">
            <span>03</span> navigation
          </a>
          <a href="#commands">
            <span>04</span> commands
          </a>
          <a href="#fields">
            <span>05</span> fields
          </a>
          <a href="#selection">
            <span>06</span> selection
          </a>
          <a href="#adjustments">
            <span>07</span> adjustments
          </a>
          <a href="#feedback">
            <span>08</span> feedback
          </a>
          <a href="#dialogs">
            <span>09</span> dialogs
          </a>
          <a href="#floating">
            <span>10</span> menus &amp; popovers
          </a>
          <a href="#lists">
            <span>11</span> lists
          </a>
          <a href="#foundations">
            <span>12</span> foundations
          </a>
          <a href="#start">
            <span>13</span> use it
          </a>
        </nav>
        <main>
          <section className={styles.hero} aria-labelledby="hero-title">
            <div>
              <p className={styles.eyebrow}>
                A FAMILIAR FEELING. A NEW BEGINNING.
              </p>
              <h1 id="hero-title">
                alive by
                <br />
                <span>design.</span>
              </h1>
              <p className={styles.intro}>
                Big type. Living tiles. Motion with meaning.
                <br />
                The spirit of Windows Phone, built for React.
              </p>
              <a className={styles.heroLink} href="#motion">
                Feel the motion <Icon name="arrow" />
              </a>
            </div>
            <div className={styles.heroPreview}>
              <div className={styles.previewCaption}>
                <span>THE START SCREEN, REIMAGINED</span>
                <span>INTERACTIVE ↓</span>
              </div>
              <TileGrid className={styles.heroGrid}>
                <Tile
                  size="large"
                  label="a little more human"
                  className={styles.helloTile}
                >
                  <span className={styles.hello}>hello.</span>
                  <span className={styles.tileAside}>
                    a system with personality
                  </span>
                </Tile>
                <Tile size="small" label="mail">
                  <span className={styles.heroIcon}>
                    <Icon name="mail" />
                  </span>
                  <span className={styles.count}>3</span>
                </Tile>
                <Tile size="small" label="weather" accent="subtle">
                  <span className={styles.heroIcon}>
                    <Icon name="sun" />
                  </span>
                  <span className={styles.count}>24°</span>
                </Tile>
                <Tile size="wide" label="made to move" accent="strong">
                  <span className={styles.music}>
                    <Icon name="music" />
                    <span>
                      less chrome.
                      <br />
                      more character.
                    </span>
                  </span>
                </Tile>
                <TileLink
                  size="wide"
                  href="#tiles"
                  label="explore the components"
                  accent="subtle"
                >
                  <span className={styles.exploreTile}>
                    start here <Icon name="arrow" />
                  </span>
                </TileLink>
                <TileLink
                  size="wide"
                  href="#foundations"
                  label="the details matter"
                >
                  <span className={styles.exploreTile}>
                    your color. <Icon name="plus" />
                  </span>
                </TileLink>
              </TileGrid>
            </div>
          </section>
          <div className={styles.manifesto}>
            <span>CONTENT FIRST</span>
            <span>SQUARE BY NATURE</span>
            <span>BUILT TO RESPOND</span>
            <span>REACT + CSS</span>
          </div>

          <section
            id="tiles"
            className={styles.section}
            aria-labelledby="tiles-title"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>01 / THE BUILDING BLOCKS</p>
                <h2 id="tiles-title">
                  small surfaces.
                  <br />
                  real personality.
                </h2>
              </div>
              <p>
                A tile can be a destination, a changing piece of information, or
                a second side to a story. Try each one.
              </p>
            </div>
            <div className={styles.specimens}>
              <article className={styles.specimen}>
                <div className={styles.specimenCanvas}>
                  <Tile label="clear by default" size="large">
                    <span className={styles.bigNumber}>Aa</span>
                    <span>content takes the lead.</span>
                  </Tile>
                </div>
                <h3>01 / Tile</h3>
                <p>A quiet surface for type, numbers, and whatever matters.</p>
                <code>{'<Tile label="…">'}</code>
              </article>
              <article className={styles.specimen}>
                <div className={styles.specimenCanvas}>
                  <TileLink
                    label="into the next chapter"
                    size="large"
                    href="#motion"
                    accent="strong"
                  >
                    <span className={styles.destination}>
                      onward
                      <br />
                      <Icon name="arrow" />
                    </span>
                  </TileLink>
                </div>
                <h3>02 / TileLink</h3>
                <p>
                  A real link. Press feedback follows your point of contact.
                </p>
                <code>{'<TileLink href="…">'}</code>
              </article>
              <article className={styles.specimen}>
                <div className={styles.specimenCanvas}>
                  <RevealTile
                    label="a different perspective"
                    size="large"
                    front={
                      <span className={styles.revealCopy}>
                        there’s
                        <br />
                        another side.
                        <span className={styles.hint}>tap to discover ↗</span>
                      </span>
                    }
                    back={
                      <span className={styles.revealCopy}>
                        good design
                        <br />
                        goes deeper.
                        <span className={styles.hint}>tap to return ↙</span>
                      </span>
                    }
                  />
                </div>
                <h3>03 / RevealTile</h3>
                <p>
                  One stable control, two faces. Click, tap, or press Space.
                </p>
                <code>{"<RevealTile front={…} back={…} />"}</code>
              </article>
              <article className={styles.specimen}>
                <div className={styles.specimenCanvas}>
                  <LiveTile
                    label="a little life"
                    size="large"
                    accessibleLabel="Design principles: be bold, stay human, keep moving"
                    intervalMs={5000}
                    items={[
                      <span className={styles.revealCopy} key="bold">
                        be bold.
                        <span className={styles.hint}>
                          01 / a design principle
                        </span>
                      </span>,
                      <span className={styles.revealCopy} key="human">
                        stay human.
                        <span className={styles.hint}>
                          02 / a design principle
                        </span>
                      </span>,
                      <span className={styles.revealCopy} key="move">
                        keep moving.
                        <span className={styles.hint}>
                          03 / a design principle
                        </span>
                      </span>,
                    ]}
                  />
                </div>
                <h3>04 / LiveTile</h3>
                <p>
                  Changes quietly. Pauses for focus, hover, and reduced motion.
                </p>
                <code>{"<LiveTile items={…} />"}</code>
              </article>
            </div>
          </section>

          <section
            id="motion"
            className={styles.section}
            aria-labelledby="motion-title"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>02 / THE PART YOU FEEL</p>
                <h2 id="motion-title">
                  nothing just
                  <br />
                  appears.
                </h2>
              </div>
              <p>
                A surface arrives, leaves, and responds. Try an exit, reverse it
                mid-flight, or give it a slower tempo.
              </p>
            </div>
            <div className={styles.motionLab}>
              <div className={styles.motionControls}>
                <fieldset>
                  <legend>Transition</legend>
                  <div className={styles.presetList}>
                    {PRESETS.map((item, i) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={item.title}
                        aria-pressed={preset === item.id}
                        onClick={() => setPreset(item.id)}
                      >
                        <span>0{i + 1}</span>
                        {item.title}
                        <span aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <p className={styles.presetDescription}>
                  {PRESETS.find((item) => item.id === preset)?.description}
                </p>
                <fieldset>
                  <legend>Direction</legend>
                  <div className={styles.segment}>
                    {(["forward", "backward"] as const).map((value) => (
                      <button
                        type="button"
                        key={value}
                        aria-pressed={direction === value}
                        onClick={() => setDirection(value)}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className={styles.rangeLabel} htmlFor="duration">
                  Duration <output>{duration} ms</output>
                </label>
                <input
                  className={styles.range}
                  id="duration"
                  type="range"
                  min="160"
                  max="1200"
                  step="20"
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                />
                <p className={styles.motionPreference}>
                  {reduced
                    ? "Reduced motion is active"
                    : "Respects your system’s motion preference"}
                </p>
              </div>
              <div className={styles.stageOuter}>
                <div className={styles.stageMeta}>
                  <span>LIVE MOTION STAGE</span>
                  <span>
                    {preset} / {direction}
                  </span>
                </div>
                <div className={styles.stage}>
                  <span className={styles.stageEmpty} aria-hidden="true">
                    space to move.
                  </span>
                  <Transition
                    data-testid="motion-surface"
                    show={show}
                    preset={preset}
                    direction={direction}
                    duration={duration}
                    className={styles.motionSurface}
                    onExited={() => {
                      if (replay) {
                        setReplay(false);
                        setShow(true);
                      }
                    }}
                  >
                    <span className={styles.surfaceEyebrow}>
                      PURPOSEFUL MOTION
                    </span>
                    <span className={styles.surfaceTitle}>
                      make
                      <br />
                      an entrance.
                    </span>
                    <span className={styles.surfaceFoot}>
                      a little confidence goes a long way. <Icon name="arrow" />
                    </span>
                  </Transition>
                </div>
                <AppBar
                  className={styles.stageBar}
                  aria-label="Transition controls"
                >
                  <AppBarAction
                    icon={<Icon name="play" />}
                    label="Replay transition"
                    onClick={replayTransition}
                  />
                  <AppBarAction
                    icon={<Icon name={show ? "back" : "arrow"} />}
                    label={show ? "Exit stage" : "Enter stage"}
                    onClick={() => {
                      setReplay(false);
                      setShow((value) => !value);
                    }}
                  />
                </AppBar>
              </div>
            </div>
            <div className={styles.motionNotes}>
              <p>
                <strong>Interruptible</strong>Change direction without waiting
                for a timeline to finish.
              </p>
              <p>
                <strong>Accessible by design</strong>Exiting content is inert.
                Reduced motion settles immediately.
              </p>
              <p>
                <strong>Yours to compose</strong>Bring your router. The
                transition owns presence, not navigation.
              </p>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="flow-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>IN CONTEXT / A SMALL JOURNEY</p>
                <h2 id="flow-title">
                  from a glance
                  <br />
                  to a closer look.
                </h2>
              </div>
              <p>
                A composed example: turn the overview away, bring the detail in,
                then return with keyboard focus where you left it.
              </p>
            </div>
            <div className={styles.journey}>
              <Transition
                show={screenVisible}
                preset="turnstile"
                direction={pendingDetail.current ? "forward" : "backward"}
                duration={320}
                onExited={() => {
                  setDetail(pendingDetail.current);
                  setScreenVisible(true);
                }}
                onEntered={() => {
                  if (detail)
                    detailHeading.current?.focus({ preventScroll: true });
                  else openButton.current?.focus({ preventScroll: true });
                }}
              >
                {detail ? (
                  <div className={styles.journeyDetail}>
                    <p className={styles.eyebrow}>A CLOSER LOOK</p>
                    <h3 ref={detailHeading} tabIndex={-1}>
                      the beauty is
                      <br />
                      in the details.
                    </h3>
                    <p>
                      A readable hierarchy. A deliberate rhythm. A surface that
                      responds to your hand. The small decisions are the design.
                    </p>
                    <AppBar>
                      <AppBarAction
                        label="Back to overview"
                        icon={<Icon name="back" />}
                        onClick={() => openDetail(false)}
                      />
                      <AppBarAction
                        label={saved ? "Saved" : "Save idea"}
                        aria-pressed={saved}
                        icon={<Icon name="plus" />}
                        onClick={() => setSaved((value) => !value)}
                      />
                    </AppBar>
                  </div>
                ) : (
                  <div className={styles.journeyOverview}>
                    <div>
                      <p className={styles.eyebrow}>YOUR COLLECTION</p>
                      <h3>
                        ideas worth
                        <br />
                        opening.
                      </h3>
                      <p>One interaction, from start to finish.</p>
                      <Pressable
                        ref={openButton}
                        className={styles.openIdea}
                        onClick={() => openDetail(true)}
                      >
                        Open the idea <Icon name="arrow" />
                      </Pressable>
                    </div>
                    <Stagger show={screenVisible} className={styles.miniTiles}>
                      <Tile label="notice the little things">
                        <span>Aa</span>
                      </Tile>
                      <Tile label="find your rhythm" accent="strong">
                        <Icon name="music" />
                      </Tile>
                      <Tile label="leave some space" accent="subtle">
                        <Icon name="plus" />
                      </Tile>
                    </Stagger>
                  </div>
                )}
              </Transition>
            </div>
          </section>

          <NavigationWorkshop />
          <CommandsWorkshop />
          <FieldsWorkshop />
          <SelectionWorkshop />
          <AdjustmentsWorkshop />
          <FeedbackWorkshop />
          <DialogsWorkshop />
          <FloatingWorkshop />
          <ListsWorkshop />
          <section
            id="foundations"
            className={styles.section}
            aria-labelledby="foundations-title"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>
                  12 / ONE LANGUAGE, YOUR EXPRESSION
                </p>
                <h2 id="foundations-title">set the tone.</h2>
              </div>
              <p>
                Scoped themes, five accents, and ordinary CSS custom properties.
                The whole workshop is your preview.
              </p>
            </div>
            <div className={styles.foundations}>
              <fieldset>
                <legend>Color mode</legend>
                <div className={styles.segment}>
                  {(["dark", "light", "system"] as const).map((value) => (
                    <button
                      type="button"
                      aria-pressed={mode === value}
                      onClick={() => setMode(value)}
                      key={value}
                    >
                      {value[0].toUpperCase() + value.slice(1)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Accent</legend>
                <div className={styles.swatches}>
                  {COLORS.map((color) => (
                    <button
                      className={styles.swatch}
                      data-color={color}
                      aria-label={`${color} accent`}
                      aria-pressed={accent === color}
                      type="button"
                      onClick={() => setAccent(color)}
                      key={color}
                    >
                      <span aria-hidden="true">
                        {accent === color ? "✓" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className={styles.typeSample}>
                <span>Aa</span>
                <p>
                  Type does the talking.
                  <br />
                  Your system font, beautifully at home.
                </p>
              </div>
            </div>
          </section>

          <section
            id="start"
            className={`${styles.section} ${styles.getStarted}`}
            aria-labelledby="start-title"
          >
            <div>
              <p className={styles.eyebrow}>
                13 / BUILD SOMETHING WITH FEELING
              </p>
              <h2 id="start-title">
                a little code.
                <br />a lot of character.
              </h2>
              <p>
                This is a local alpha. Build and pack the library from this
                repository to try it in your own React app.
              </p>
              <code className={styles.install}>
                npm run build:library
                <br />
                npm pack ./packages/react
              </code>
            </div>
            <div className={styles.codePanel}>
              <div>
                <span>your-first-tile.tsx</span>
                <Icon name="code" />
              </div>
              <pre>
                <code>{`import { Theme, TileLink } from\n  "@pane-ui/react";\nimport "@pane-ui/react/styles.css";\n\nexport function Start() {\n  return (\n    <Theme mode="dark" accent="blue">\n      <TileLink href="/hello" label="say hello">\n        hello, world.\n      </TileLink>\n    </Theme>\n  );\n}`}</code>
              </pre>
            </div>
          </section>
        </main>
        <footer className={styles.footer}>
          <span>pane ui / react</span>
          <p>
            An independent tribute to a distinctive design language.
            <br />
            Not affiliated with Microsoft. Open-source release in preparation.
          </p>
          <a href="#">back to top ↑</a>
        </footer>
      </div>
    </Theme>
  );
}
