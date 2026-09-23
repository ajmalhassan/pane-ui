"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Theme, TileSequence, Transition, BackButton } from "@pane-ui/react";
import { FlipArtwork, TileMotion } from "@/components/tiles/TileArtwork";
import { Glyph } from "@/components/site/Glyph";
import { Mark } from "@/components/site/Mark";
import { PeopleArtwork } from "./StartArtwork";
import { StartAppViews, appNames, type StartApp } from "./StartAppViews";
import s from "./start.module.css";

type Phase =
  | "start-mount"
  | "start"
  | "start-exit"
  | "app-mount"
  | "app-enter"
  | "app"
  | "app-exit"
  | "start-enter";
function parseApp(): StartApp | null {
  const value = new URL(location.href).searchParams.get("app");
  return value && Object.prototype.hasOwnProperty.call(appNames, value)
    ? (value as StartApp)
    : null;
}
export function StartDesktop() {
  const [phase, setPhase] = useState<Phase>("start-mount");
  const [desired, setDesired] = useState<StartApp | null>(null);
  const [current, setCurrent] = useState<StartApp | null>(null);
  const [quiet, setQuiet] = useState(true);
  const [volume, setVolume] = useState(65);
  const target = useRef<StartApp | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLAnchorElement | null>(null);
  const returnApp = useRef<StartApp | null>(null);
  const update = (app: StartApp | null) => {
    target.current = app;
    setDesired(app);
  };
  useEffect(() => {
    const sync = () => {
      const legacy = new URL(location.href).searchParams.get("app");
      if (legacy === "docs" || legacy === "examples") {
        location.replace(
          legacy === "docs" ? "/docs/installation" : "/examples",
        );
        return;
      }
      const app = parseApp();
      if (app) returnApp.current = app;
      update(app);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    if (phase === "start-mount") {
      const id = requestAnimationFrame(() => setPhase("start-enter"));
      return () => cancelAnimationFrame(id);
    }
    if (phase === "start" && desired) setPhase("start-exit");
    if (phase === "app" && desired !== current) setPhase("app-exit");
    if (phase === "app-mount") {
      const id = requestAnimationFrame(() => setPhase("app-enter"));
      return () => cancelAnimationFrame(id);
    }
  }, [phase, desired, current]);
  useEffect(() => {
    if (phase !== "start" || !returnApp.current) return;
    const href =
      trigger.current?.getAttribute("href") ?? `/?app=${returnApp.current}`;
    const id = requestAnimationFrame(() => {
      const link = Array.from(
        root.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [],
      ).find((node) => node.getAttribute("href") === href);
      link?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [phase]);
  function open(event: MouseEvent<HTMLAnchorElement>, app: StartApp) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (phase !== "start" && phase !== "start-enter") return;
    trigger.current = event.currentTarget;
    // A second activation during entrance updates the pending destination,
    // without inserting an app the visitor never saw into the Back journey.
    if (phase === "start-enter" && target.current) {
      history.replaceState({ paneStart: true }, "", `/?app=${app}`);
    } else {
      history.pushState({ paneStart: true }, "", `/?app=${app}`);
    }
    returnApp.current = app;
    update(app);
  }
  function back() {
    if (phase !== "app") return;
    if (history.state?.paneStart) {
      history.back();
    } else {
      history.replaceState(null, "", "/");
      update(null);
    }
  }
  function startExited() {
    if (phase !== "start-exit") return;
    setCurrent(target.current);
    setPhase(target.current ? "app-mount" : "start-enter");
  }
  function appExited() {
    if (phase !== "app-exit") return;
    if (target.current) {
      setCurrent(target.current);
      setPhase("app-mount");
    } else setPhase("start-enter");
  }
  function tile(
    app: StartApp | "docs" | "examples",
    className: string,
    body: React.ReactNode,
    label: string = app in appNames ? appNames[app as StartApp] : app,
  ) {
    return (
      <a
        href={
          app === "docs"
            ? "/docs/installation"
            : app === "examples"
              ? "/examples"
              : `/?app=${app}`
        }
        className={`${s.tile} ${className}`}
        onClick={
          app === "docs" || app === "examples"
            ? undefined
            : (event) => open(event, app)
        }
        aria-describedby={
          app === "people" || app === "photos" || app === "music"
            ? "everyday-caption"
            : "build-caption"
        }
        aria-label={`Open ${label}`}
      >
        {body}
        <span className={s.tileLabel}>{label}</span>
      </a>
    );
  }
  const tiles = [
    {
      id: "people",
      content: tile("people", s.people, <PeopleArtwork />),
      size: "large" as const,
    },
    {
      id: "photos",
      content: tile(
        "photos",
        s.photos,
        <FlipArtwork
          front={<span className={s.football} />}
          back={<span className={s.weddingTile} />}
          delay={2}
          duration={17}
        />,
      ),
      size: "wide" as const,
    },
    {
      id: "music",
      content: tile(
        "music",
        s.music,
        <>
          <span className={s.musicArt} />
          <div className={s.track}>
            <strong>Everything at Once</strong>
            <span>Lenka</span>
          </div>
          <span className={s.playIcon} aria-hidden="true">
            ▷
          </span>
        </>,
        "music",
      ),
      size: "wide" as const,
    },
    ...(
      [
        ["motion", "motion", "arrow", "Motion"],
        ["theme", "theme", "sun", "Themes"],
        ["buttons", "buttons", "code", "Buttons"],
        ["accessibility", "accessibility-support", "people", "Accessibility"],
      ] as const
    ).map(([id, path, icon, label]) => ({
      id,
      size: "small" as const,
      content: (
        <a
          href={`/docs/${path}`}
          className={`${s.tile} ${s.shortcut}`}
          data-shortcut={id}
          aria-label={`Open ${label}`}
          title={label}
        >
          <Glyph name={icon} size={36} />
        </a>
      ),
    })),
    {
      id: "docs",
      content: tile(
        "docs",
        s.docs,
        <>
          <Glyph name="code" size={64} />
          <strong className={s.word}>build something.</strong>
        </>,
        "docs",
      ),
      size: "wide" as const,
    },
    {
      id: "components",
      content: tile(
        "components",
        s.components,
        <div className={s.miniSquares}>
          <i />
          <i />
          <i />
          <i />
        </div>,
      ),
      size: "wide" as const,
    },
    {
      id: "examples",
      content: tile(
        "examples",
        s.examples,
        <>
          <Glyph name="mail" size={54} />
        </>,
      ),
      size: "wide" as const,
    },
    {
      id: "phone",
      content: tile(
        "phone",
        s.phone,
        <>
          <span className={s.miniPhone}>
            <span>NOKIA</span>
            <i />
            <b>⊞</b>
          </span>
          <div className={s.phoneText}>
            Lumia 520<small>cyan. of course.</small>
          </div>
        </>,
      ),
      size: "wide" as const,
    },
  ];
  const startContent = (
    <div className={s.startGrid}>
      <h2 id="everyday-caption" className={s.everydayCaption}>
        everyday
      </h2>
      <h2 id="build-caption" className={s.buildCaption}>
        build
      </h2>
      <TileSequence
        className={s.sequence}
        items={tiles}
        show={phase === "start" || phase === "start-enter"}
        duration={phase === "start-enter" ? 300 : undefined}
        direction={phase === "start-exit" ? "forward" : "backward"}
        onExited={startExited}
        onEntered={() => {
          if (phase === "start-enter") {
            setPhase("start");
          }
        }}
      />
    </div>
  );
  return (
    <Theme mode="dark" accent="blue" className={s.desktop} ref={root}>
      <header className={s.header}>
        <Link href="/" className={s.brand}>
          <Mark />
          Pane UI
        </Link>
        <nav aria-label="Quick links">
          <a href="https://github.com/ajmalhassan/pane-ui">GitHub ↗</a>
          <Link href="/docs" className={s.docsLink}>
            Docs ↗
          </Link>
        </nav>
      </header>
      <main id="main" className={s.main}>
        <TileMotion className={s.motion}>
          <div
            hidden={
              !["start-mount", "start", "start-exit", "start-enter"].includes(
                phase,
              )
            }
          >
            <header className={s.startIntro}>
              <h1 className={s.startHeading}>start</h1>
              <p className={s.intro}>
                A React component library inspired by Windows Phone.
              </p>
            </header>
            {startContent}
          </div>
          <Transition
            show={phase === "app-enter" || phase === "app"}
            direction={phase === "app-exit" ? "backward" : "forward"}
            onEntered={() => {
              if (phase === "app-enter") {
                setPhase("app");
                heading.current?.focus({ preventScroll: true });
              }
            }}
            onExited={appExited}
            className={s.app}
          >
            <div className={s.appHeading}>
              <BackButton
                onClick={back}
                label="Back to Start"
                disabled={phase !== "app"}
              />
              <h1 tabIndex={-1} ref={heading}>
                {current ? appNames[current] : ""}
              </h1>
            </div>
            <StartAppViews
              app={current}
              quiet={quiet}
              onQuietChange={setQuiet}
              volume={volume}
              onVolumeChange={setVolume}
            />
          </Transition>
        </TileMotion>
      </main>
      <footer className={s.footer}>
        <span>Built with the components you’re exploring.</span>
        <Link href="/about">About Pane UI →</Link>
        <span>0.1 / alpha</span>
      </footer>
    </Theme>
  );
}
