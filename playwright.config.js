import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    channel: "msedge",
    headless: true,
    screenshot: "only-on-failure",
    // Existing workflow tests start after today's notice has been acknowledged.
    // service-notice.spec.js explicitly starts with empty storage to test the dialog.
    storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:5173', localStorage: [
      { name: 'triz-service-notice-hidden-date', value: new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date()) }
    ] }] },
  },
  webServer: {
    command: process.platform === "win32" ? "npm.cmd run dev" : "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
