import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    /*
     * Ten seconds rather than vitest's default five, and stated rather than
     * inherited. The whole suite runs in about three, so nothing here needs
     * it today; what needs it is the margin. The slowest tests are the
     * `useLiveCycle` ones, which advance fake timers across a 30-second
     * schedule inside a jsdom render, and a cold machine that pushes one of
     * those past five seconds reports a bare timeout with no assertion in it
     * -- a failure that looks like flake and says nothing.
     */
    testTimeout: 10_000,
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
});
