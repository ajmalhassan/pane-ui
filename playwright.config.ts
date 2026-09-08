import { defineConfig, devices } from "@playwright/test";

/*
 * `ARTIFACT_BASE_URL` points a run at a server that is already up -- in
 * practice `next start`, for the review artifacts in `tests/e2e/artifacts.spec.ts`.
 *
 * It also has to switch the managed dev server OFF, which is less obvious and
 * was found the hard way: `next dev` and `next start` share `.next`, so
 * starting the dev server rewrites the build directory out from under a
 * production server reading it, and the production server then answers every
 * request with a 500 about a missing `required-server-files.json`. Pointing the
 * tests elsewhere is not enough; the dev server must not run at all.
 */
const external = process.env.ARTIFACT_BASE_URL;

export default defineConfig({
  outputDir: ".superpowers/playwright/results",
  testDir: "./tests/e2e",
  // The artifact capture is opt-in: without a server to point it at, a bare
  // `npx playwright test` would run it against the managed DEV server, whose
  // toolbar sits exactly where the app bar's left inset is.
  testIgnore: external ? [] : ["**/artifacts.spec.ts"],
  webServer: external
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
        gracefulShutdown: { signal: "SIGTERM", timeout: 1_000 },
        reuseExistingServer: false,
        timeout: 120_000,
        url: "http://127.0.0.1:3100",
      },
  use: {
    baseURL: external ?? "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
