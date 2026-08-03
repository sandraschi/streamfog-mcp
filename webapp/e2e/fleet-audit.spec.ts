import { test, expect } from "@playwright/test";

const BE = "http://127.0.0.1:10994";
const FE = "http://127.0.0.1:10995";

test.describe("Fleet Audit", () => {
  test("Backend health", async ({ request }) => {
    const resp = await request.get(`${BE}/api/health`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).toBe("ok");
    expect(body.tool_count).toBeGreaterThanOrEqual(5);
  });

  test("REST: GET /api/tools returns registered tools", async ({ request }) => {
    const resp = await request.get(`${BE}/api/tools`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const names = body.data.tools.map((t: { name: string }) => t.name);
    for (const n of ["streamfog_status", "streamfog_set_lens", "streamfog_clear_effects", "streamfog_toggle_avatar", "streamfog_list_lenses"]) {
      expect(names).toContain(n);
    }
  });

  test("REST: POST invalid lens returns structured error", async ({ request }) => {
    const resp = await request.post(`${BE}/api/v1/lenses/set`, {
      data: { lens_identifier: "" },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(false);
  });

  test("Frontend loads without crashing", async ({ page }) => {
    await page.goto(FE, { timeout: 15000 });
    await page.waitForTimeout(3000);
    await expect(page.locator("#root")).toBeAttached();
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test("Navigation sidebar walks all pages", async ({ page }) => {
    await page.goto(FE, { timeout: 15000 });
    await page.waitForTimeout(2000);
    const routes: Array<[string, string]> = [
      ["Dashboard", "dashboard"],
      ["Tools", "tools-page"],
      ["Chat", "chat-page"],
      ["Settings", "settings-page"],
      ["Help", "help-page"],
    ];
    for (const [label, testId] of routes) {
      await page.locator(`[data-testid="nav-${label.toLowerCase()}"]`).click();
      await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible({ timeout: 10000 });
    }
  });

  test("No console errors on page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(FE, { timeout: 15000 });
    await page.waitForTimeout(3000);
    expect(errors).toEqual([]);
  });
});
