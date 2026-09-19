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
  /*
   * Failure traces are the only debugging output this suite produces, so they
   * land on the default path a contributor already knows to look in and
   * `.gitignore` names. They used to be written under `.superpowers/`, an
   * ignored tree nothing else in the repo reads from -- `artifacts.spec.ts`
   * still writes its review screenshots there, deliberately, because those are
   * review artifacts rather than debugging output.
   */
  outputDir: "test-results/",
  testDir: "./tests/e2e",
  /*
   * CI only. Locally a retry hides a flake from the person who just wrote it;
   * on a shared runner the same flake lands as a hard red build with nothing to
   * separate it from a regression. About ten tests here depend on wall-clock
   * time, and `forbidOnly` is the matching guard: a `.only` that reaches CI
   * silently reduces the suite to one test.
   */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The artifact capture is opt-in: without a server to point it at, a bare
  // `npx playwright test` would run it against the managed DEV server, whose
  // toolbar sits exactly where the app bar's left inset is.
  testIgnore: external ? [] : ["**/artifacts.spec.ts"],
  webServer: external
    ? undefined
    : {
        command: process.env.LIBRARY_PRODUCTION
          ? "npm run start -- --hostname 127.0.0.1 --port 3100"
          : "npm run dev -- --hostname 127.0.0.1 --port 3100",
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
    ...(process.env.LIBRARY_CROSS_BROWSER
      ? [
          {
            name: "firefox",
            testMatch: /(library.*|project-site|start|phone|seo)\.spec\.ts/,
            use: { ...devices["Desktop Firefox"] },
          },
          {
            name: "webkit",
            testMatch: /(library.*|project-site|start|phone|seo)\.spec\.ts/,
            use: { ...devices["Desktop Safari"] },
          },
        ]
      : []),
  ],
});
