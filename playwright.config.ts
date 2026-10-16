import { defineConfig, devices } from "@playwright/test";

const npmCommand = process.platform === "win32" ? "npm.cmd run dev" : "npm run dev";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: npmCommand,
    url: "http://localhost:3000/vi",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_MAP_TILE_PROVIDER: "osm",
      NEXT_PUBLIC_MAPTILER_KEY: "playwright-map-tile-fallback-test-key",
    },
  },
});
