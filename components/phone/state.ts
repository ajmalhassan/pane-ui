export type Screen =
  | "start"
  | "apps"
  | "people"
  | "messages"
  | "conversation"
  | "compose"
  | "photos"
  | "photo"
  | "settings";
interface Entry {
  screen: Screen;
  focus?: string;
}
export interface Navigation {
  screen: Screen;
  phase: "idle" | "exiting" | "mounting" | "entering";
  history: Entry[];
  pending?: Entry;
  nextHistory?: Entry[];
  focus?: string;
  direction: "forward" | "backward";
}
export type NavigationAction =
  | { type: "open"; screen: Screen; trigger?: string }
  | { type: "back" | "home" | "exited" | "mounted" | "entered" };
export const initialNavigation: Navigation = {
  screen: "start",
  phase: "idle",
  history: [],
  direction: "forward",
};
export function navigationReducer(
  s: Navigation,
  a: NavigationAction,
): Navigation {
  if (a.type === "entered")
    return s.phase === "entering" ? { ...s, phase: "idle" } : s;
  if (a.type === "mounted")
    return s.phase === "mounting" ? { ...s, phase: "entering" } : s;
  if (a.type === "exited")
    return s.phase === "exiting" && s.pending
      ? {
          ...s,
          ...s.pending,
          focus: s.pending.focus,
          history: s.nextHistory ?? s.history,
          pending: undefined,
          nextHistory: undefined,
          phase: "mounting",
        }
      : s;
  if (a.type === "back" && s.phase === "exiting")
    return {
      ...s,
      pending: undefined,
      focus: s.direction === "forward" ? s.nextHistory?.at(-1)?.focus : s.focus,
      nextHistory: undefined,
      phase: "entering",
      direction: "backward",
    };
  if (a.type === "open") {
    if (s.phase !== "idle" || a.screen === s.screen) return s;
    return {
      ...s,
      phase: "exiting",
      pending: { screen: a.screen },
      nextHistory: [...s.history, { screen: s.screen, focus: a.trigger }].slice(
        -12,
      ),
      direction: "forward",
    };
  }
  if (a.type === "home") {
    if (s.screen === "start")
      return {
        ...s,
        pending: undefined,
        nextHistory: undefined,
        phase: s.phase === "idle" ? "idle" : "entering",
        history: [],
      };
    return {
      ...s,
      phase: "exiting",
      pending: { screen: "start" },
      nextHistory: [],
      direction: "backward",
    };
  }
  if (a.type === "back" && s.history.length)
    return {
      ...s,
      phase: "exiting",
      pending: s.history[s.history.length - 1],
      nextHistory: s.history.slice(0, -1),
      direction: "backward",
    };
  return s;
}
export function createMessage(recipient: string, text: string) {
  const clean = { recipient: recipient.trim(), text: text.trim() };
  return clean.recipient && clean.text ? clean : null;
}
