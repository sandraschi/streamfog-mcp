import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: "http://127.0.0.1:10995",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "uv run python -m streamfog_mcp --serve --port 10994",
    port: 10994,
    cwd: "../",
    timeout: 30000,
    reuseExistingServer: true,
  },
});
