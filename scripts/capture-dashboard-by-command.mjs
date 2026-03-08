import path from "node:path";
import { chromium } from "playwright";

const OUT_DIR = path.resolve("screenshots/full-app-capture");
const DASH_URL = "http://localhost:3004/dashboard";
const functionCodes = ["EXEC", "DES", "FA", "HP", "WEI", "YAS", "OVME", "PORT", "NEWS", "CAL", "SEC", "MKT", "INTEL"];
const execTabs = ["PRIMARY", "MICROSTRUCTURE", "FACTORS", "EVENTS", "ESC"];

const saved = [];
const missed = [];

async function wait(page, ms = 500) {
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: true });
  saved.push(name);
}

async function runCommand(page, cmd) {
  const ok = await page.evaluate((command) => {
    const el = document.getElementById("terminal-command-input");
    if (!(el instanceof HTMLInputElement)) return false;
    el.focus();
    el.value = command;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    return true;
  }, cmd);
  if (!ok) return false;
  await wait(page, 700);
  return true;
}

async function clickButtonExact(page, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const b = page.locator("button:visible").filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`, "i") }).first();
  if ((await b.count()) === 0) return false;
  await b.click({ timeout: 3000 }).catch(() => {});
  await wait(page, 500);
  return true;
}

async function clickButtonContains(page, snippet) {
  const escaped = snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const b = page.locator("button:visible").filter({ hasText: new RegExp(escaped, "i") }).first();
  if ((await b.count()) === 0) return false;
  await b.click({ timeout: 3000 }).catch(() => {});
  await wait(page, 500);
  return true;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(DASH_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await wait(page, 1200);

  for (const code of functionCodes) {
    const ok = await runCommand(page, `AAPL US ${code} GO`);
    if (!ok) {
      missed.push(`/dashboard function ${code} command input unavailable`);
      continue;
    }
    await shot(page, `dashboard-fn-${code}.png`);
  }

  await runCommand(page, "AAPL US EXEC GO");
  for (const tab of execTabs) {
    if (!(await clickButtonExact(page, tab))) {
      missed.push(`/dashboard EXEC tab ${tab} not found`);
      continue;
    }
    await shot(page, `dashboard-exec-tab-${tab}.png`);
  }

  await runCommand(page, "AAPL US MKT GO");
  await shot(page, "dashboard-mkt-collapsed.png");
  if (await clickButtonContains(page, "D DEEP")) {
    await shot(page, "dashboard-mkt-expanded.png");
  } else {
    missed.push("/dashboard market deep detail toggle not found");
  }

  await browser.close();
  console.log(JSON.stringify({ totalNew: saved.length, saved, missed }, null, 2));
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});
