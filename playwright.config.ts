import { defineConfig } from "@playwright/test";

const ci = !!process.env.CI;

export default defineConfig({
  testDir: "e2e",
  reporter: ci ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:5173", trace: ci ? "retain-on-failure" : "off" },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    ...(ci ? [{ name: "webkit", use: { browserName: "webkit" as const } }] : [])
  ],
  webServer: {
    command: "npm run demo -- --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !ci
  }
});
