import { describe, expect, it } from "vitest";
import {
  initialNavigation,
  navigationReducer,
  createMessage,
} from "../../components/phone/state";
describe("phone navigation", () => {
  it("waits for departure before displaying a destination and arrival before settling", () => {
    let s = navigationReducer(initialNavigation, {
      type: "open",
      screen: "messages",
      trigger: "tile-messages",
    });
    expect(s.screen).toBe("start");
    expect(s.phase).toBe("exiting");
    s = navigationReducer(s, { type: "exited" });
    expect(s.screen).toBe("messages");
    expect(s.phase).toBe("mounting");
    s = navigationReducer(s, { type: "mounted" });
    s = navigationReducer(s, { type: "entered" });
    expect(s.phase).toBe("idle");
    s = navigationReducer(s, { type: "back" });
    s = navigationReducer(s, { type: "exited" });
    expect(s.screen).toBe("start");
    expect(s.focus).toBe("tile-messages");
  });
  it("reverses departure on rapid back and ignores stale exit completions", () => {
    const leaving = navigationReducer(initialNavigation, {
      type: "open",
      screen: "people",
      trigger: "tile-people",
    });
    const reversed = navigationReducer(leaving, { type: "back" });
    expect(reversed.screen).toBe("start");
    expect(reversed.phase).toBe("entering");
    expect(reversed.focus).toBe("tile-people");
    expect(navigationReducer(reversed, { type: "exited" })).toEqual(reversed);
  });
  it("returns directly to Start and clears history", () => {
    let s = navigationReducer(initialNavigation, {
      type: "open",
      screen: "messages",
    });
    for (const type of ["exited", "mounted", "entered"] as const)
      s = navigationReducer(s, { type });
    s = navigationReducer(s, { type: "home" });
    s = navigationReducer(s, { type: "exited" });
    expect(s.screen).toBe("start");
    expect(s.history).toEqual([]);
  });
});
it("requires a recipient and non-whitespace message; trims submitted local content", () => {
  expect(createMessage("", "Hello")).toBeNull();
  expect(createMessage("Maya", "  ")).toBeNull();
  expect(createMessage(" Maya ", " On my way ")).toEqual({
    recipient: "Maya",
    text: "On my way",
  });
});
