import { describe, expect, it } from "vitest";
import {
  gestureIntent,
  gestureTarget,
  recentVelocity,
  resistBoundary,
} from "@/components/metro/panoramaMotion";

describe("panorama gesture decisions", () => {
  it.each([
    [1, -20, -0.1, 1],
    [1, -100, -0.1, 2],
    [1, 30, 0.6, 0],
    [1, 10, 0.8, 1],
    [0, 100, 0, 0],
    [3, -100, 0, 3],
  ])(
    "resolves index %s with dx %s and velocity %s to %s",
    (startIndex, dx, velocity, target) => {
      expect(
        gestureTarget({ width: 400, startIndex, count: 4, dx, velocity }),
      ).toBe(target);
    },
  );
  it("requires horizontal intent and lets vertical movement win", () => {
    expect(gestureIntent(7, 0)).toBe("pending");
    expect(gestureIntent(9, 7)).toBe("horizontal");
    expect(gestureIntent(9, 10)).toBe("vertical");
    expect(gestureIntent(0, 9)).toBe("vertical");
  });
  it("uses recent movement, including a pause, rather than the entire drag", () => {
    expect(
      recentVelocity([
        { x: 300, time: 0 },
        { x: 200, time: 500 },
        { x: 160, time: 550 },
      ]),
    ).toBe(-0.8);
    expect(
      recentVelocity([
        { x: 300, time: 0 },
        { x: 200, time: 50 },
        { x: 200, time: 500 },
      ]),
    ).toBe(0);
    expect(
      recentVelocity([
        { x: 30, time: 10 },
        { x: 0, time: 10 },
      ]),
    ).toBe(0);
  });
  it("resists outward movement while preserving inward travel", () => {
    expect(resistBoundary(-0.5, 4)).toBeGreaterThan(-0.5);
    expect(resistBoundary(-0.5, 4)).toBeLessThan(0);
    expect(resistBoundary(3.5, 4)).toBeLessThan(3.5);
    expect(resistBoundary(1.5, 4)).toBe(1.5);
  });
});
