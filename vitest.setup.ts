import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Testing Library only auto-registers cleanup when a global afterEach exists; Vitest runs without globals here.
afterEach(cleanup);

// jsdom runs without layout, so it ships no scrollIntoView; components that
// bring a focused element into view need the method to exist.
Element.prototype.scrollIntoView = function scrollIntoView() {};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
