"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { Pressable, Theme, Transition } from "@pane-ui/react";
import { AppScreens, type Accent, type Message } from "./AppScreens";
import { StartScreen } from "./StartScreen";
import { PhoneIcon } from "./PhoneIcons";
import { initialNavigation, navigationReducer, type Screen } from "./state";
import { TileMotion } from "../tiles/TileArtwork";
import s from "./phone.module.css";
export function PhoneDemo() {
  const [nav, dispatch] = useReducer(navigationReducer, initialNavigation);
  const [accent, setAccent] = useState<Accent>("blue");
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [messages, setMessages] = useState<Message[]>([]);
  const [person, setPerson] = useState("Maya Chen");
  const [photo, setPhoto] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);
  const visible = nav.phase === "idle" || nav.phase === "entering";
  function open(screen: Screen, trigger?: string) {
    interacted.current = true;
    dispatch({ type: "open", screen, trigger });
  }
  useEffect(() => {
    if (nav.phase === "mounting") {
      if (scroll.current) scroll.current.scrollTop = 0;
      dispatch({ type: "mounted" });
    }
  }, [nav.phase]);
  useEffect(() => {
    if (nav.phase !== "idle" || !interacted.current) return;
    const target = nav.focus
      ? Array.from(
          root.current?.querySelectorAll<HTMLElement>("[data-phone-focus]") ??
            [],
        ).find((el) => el.dataset.phoneFocus === nav.focus)
      : null;
    (
      target ?? root.current?.querySelector<HTMLElement>("[data-phone-heading]")
    )?.focus({ preventScroll: true });
    // Restore the trigger inside the phone without scrolling the hosting page.
    if (target && scroll.current) {
      const control = target.getBoundingClientRect();
      const viewport = scroll.current.getBoundingClientRect();
      if (control.bottom > viewport.bottom)
        scroll.current.scrollTop += control.bottom - viewport.bottom + 8;
      else if (control.top < viewport.top)
        scroll.current.scrollTop -= viewport.top - control.top + 8;
    }
  }, [nav.phase, nav.screen, nav.focus]);
  const back = () => {
    interacted.current = true;
    dispatch({ type: "back" });
  };
  return (
    <TileMotion className={s.presentation}>
      <div
        className={s.device}
        ref={root}
        role="region"
        aria-label="Interactive Windows Phone demo"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            back();
          }
        }}
      >
        <div className={s.bezel}>
          <span className={s.camera} />
          <span className={s.speaker} />
          <span className={s.brand}>WINDOWS PHONE</span>
        </div>
        <Theme mode={mode} accent={accent} className={s.screen}>
          <div
            className={s.status}
            aria-label="Demo status: 9:41, connected, battery full"
          >
            <span className={s.signal}>
              <PhoneIcon name="signal" />
              <PhoneIcon name="wifi" />
            </span>
            <span>
              9:41 <i className={s.battery} />
            </span>
          </div>
          <div
            ref={scroll}
            className={s.viewport}
            data-phone-screen={nav.screen}
          >
            {nav.screen === "start" ? (
              <StartScreen
                show={visible}
                direction={nav.direction}
                onEntered={() => dispatch({ type: "entered" })}
                onExited={() => dispatch({ type: "exited" })}
                open={open}
              />
            ) : (
              <Transition
                key={nav.screen}
                show={visible}
                direction={nav.direction}
                preset="turnstile"
                className={s.app}
                onEntered={() => dispatch({ type: "entered" })}
                onExited={() => dispatch({ type: "exited" })}
              >
                <AppScreens
                  screen={nav.screen}
                  open={open}
                  accent={accent}
                  setAccent={setAccent}
                  mode={mode}
                  setMode={setMode}
                  messages={messages}
                  send={(m) => setMessages((current) => [...current, m])}
                  person={person}
                  setPerson={setPerson}
                  photo={photo}
                  setPhoto={setPhoto}
                />
              </Transition>
            )}
          </div>
        </Theme>
        <nav className={s.hardware} aria-label="Phone navigation">
          <Pressable
            aria-label="Phone back"
            onClick={back}
            disabled={nav.screen === "start" && nav.phase === "idle"}
          >
            <PhoneIcon name="back" />
          </Pressable>
          <Pressable
            aria-label="Phone Start"
            onClick={() => {
              interacted.current = true;
              dispatch({ type: "home" });
            }}
          >
            <PhoneIcon name="start" />
          </Pressable>
          <Pressable
            aria-label="Search phone applications"
            onClick={() => open("apps")}
          >
            <PhoneIcon name="search" />
          </Pressable>
        </nav>
      </div>
      <p className={s.caption}>
        A little familiar. Still a little different.
        <span>Tap a tile to explore · Esc goes back</span>
      </p>
    </TileMotion>
  );
}
export default PhoneDemo;
