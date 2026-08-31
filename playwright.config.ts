import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  outputDir: ".superpowers/playwright/results",
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    gracefulShutdown: { signal: "SIGTERM", timeout: 1_000 },
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:3100",
  },
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
