const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    permissions: ["clipboard-read", "clipboard-write"]
  },
  webServer: {
    command: "node tests/server.cjs",
    url: "http://127.0.0.1:4173/laid.html",
    reuseExistingServer: !process.env.CI
  }
});
