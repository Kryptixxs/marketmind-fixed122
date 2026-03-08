import path from "node:path";
import { chromium } from "playwright";

const OUT_DIR = path.resolve("screenshots/full-app-capture");
const DASHBOARD_URL = "http://localhost:3004/dashboard";

const functionTargets = ["DES", "FA", "HP", "WEI", "YAS", "OVME", "PORT", "NEWS", "CAL", "SEC", "MKT", "INTEL"];
const execTabTargets = ["PRIMARY", "MICROSTRUCTURE", "FACTORS", "EVENTS", "ESC"];

const saved = [];
const missed = [];

function escapeRe(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function settle(page, ms = 650) {
  await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function saveShot(page, fileName) {
  await page.screenshot({ path: path.join(OUT_DIR, fileName), fullPage: true });
  saved.push(fileName);
}

async function clickExactButton(page, label) {
  const re = new RegExp(`^\\s*${escapeRe(label)}\\s*$`, "i");
  const locator = page.locator("button").filter({ hasText: re }).first();
  if ((await locator.count()) === 0) return false;

  const domClicked = await page.evaluate((wanted) => {
    const norm = (s) => s.replace(/\s+/g, " ").trim().toUpperCase();
    const target = norm(wanted);
    const node = Array.from(document.querySelectorAll("button")).find((b) => norm(b.textContent || "") === target);
    if (!node) return false;
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  }, label);

  if (!domClicked) {
    try {
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await locator.click({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  await settle(page, 450);
  return true;
}

async function clickContainsButton(page, text) {
  const locator = page.locator("button").filter({ hasText: new RegExp(escapeRe(text), "i") }).first();
  if ((await locator.count()) === 0) return false;

  const domClicked = await page.evaluate((wanted) => {
    const node = Array.from(document.querySelectorAll("button")).find((b) =>
      (b.textContent || "").toUpperCase().includes(wanted.toUpperCase()),
    );
    if (!node) return false;
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  }, text);

  if (!domClicked) {
    try {
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await locator.click({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  await settle(page, 450);
  return true;
}

async function runCommand(page, command) {
  const input = page.locator("#terminal-command-input");
  if ((await input.count()) === 0) return false;
  await input.focus();

  const valueSet = await page.evaluate((cmd) => {
    const node = document.getElementById("terminal-command-input");
    if (!(node instanceof HTMLInputElement)) return false;
    node.value = cmd;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }, command);
  if (!valueSet) return false;

  try {
    await input.press("Enter");
  } catch {
    if (!(await clickExactButton(page, "GO"))) return false;
  }

  await settle(page, 900);
  return true;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(DASHBOARD_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#terminal-command-input", { timeout: 20000 });
  await page.waitForFunction(() => {
    const labels = new Set(Array.from(document.querySelectorAll("button")).map((b) => (b.textContent || "").trim().toUpperCase()));
    return labels.has("EXEC") && labels.has("DES") && labels.has("MKT");
  }, undefined, { timeout: 30000 });
  await settle(page, 1000);

  for (const fn of functionTargets) {
    const ok = await runCommand(page, `AAPL US ${fn} GO`);
    if (!ok) {
      missed.push(`dashboard-fn-${fn}.png`);
      continue;
    }
    await saveShot(page, `dashboard-fn-${fn}.png`);
  }

  await runCommand(page, "AAPL US EXEC GO");
  for (const tab of execTabTargets) {
    if (!(await clickExactButton(page, tab))) {
      missed.push(`dashboard-exec-tab-${tab}.png`);
      continue;
    }
    await saveShot(page, `dashboard-exec-tab-${tab}.png`);
  }

  if (!(await runCommand(page, "AAPL US MKT GO"))) {
    missed.push("dashboard-mkt-expanded.png");
  } else {
    const toggled = (await clickContainsButton(page, "D DEEP")) || (await clickContainsButton(page, "D "));
    if (!toggled) {
      missed.push("dashboard-mkt-expanded.png");
    } else {
      await settle(page, 700);
      await saveShot(page, "dashboard-mkt-expanded.png");
    }
  }

  await browser.close();
  console.log(JSON.stringify({ saved, missed }, null, 2));
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
