import path from "node:path";
import { chromium } from "playwright";

const OUT_DIR = path.resolve("screenshots/full-app-capture");
const BASE_URL = "http://localhost:3004/dashboard";
const functionCodes = ["EXEC", "DES", "FA", "HP", "WEI", "YAS", "OVME", "PORT", "NEWS", "CAL", "SEC", "MKT", "INTEL"];
const execTabs = ["PRIMARY", "MICROSTRUCTURE", "FACTORS", "EVENTS", "ESC"];

const saved = [];
const missed = [];

function norm(s) {
  return s.replace(/\s+/g, " ").trim().toUpperCase();
}

async function waitForRender(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(450);
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: true });
  saved.push(name);
}

async function clickButtonExact(page, label) {
  const escaped = norm(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const candidates = page.locator("button:visible").filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`, "i") });
  if ((await candidates.count()) > 0) {
    const b = candidates.first();
    try {
      await b.scrollIntoViewIfNeeded().catch(() => {});
      await b.click({ timeout: 2500 });
      await page.waitForTimeout(300);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function clickButtonContains(page, snippet) {
  const escaped = snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const candidates = page.locator("button:visible").filter({ hasText: new RegExp(escaped, "i") });
  if ((await candidates.count()) > 0) {
    const b = candidates.first();
    try {
      await b.scrollIntoViewIfNeeded().catch(() => {});
      await b.click({ timeout: 2500 });
      await page.waitForTimeout(300);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForRender(page);

  for (const code of functionCodes) {
    if (!(await clickButtonExact(page, code))) {
      missed.push(`/dashboard function ${code} not found`);
      continue;
    }
    await waitForRender(page);
    await screenshot(page, `dashboard-fn-${code}.png`);
  }

  if (await clickButtonExact(page, "EXEC")) {
    for (const tab of execTabs) {
      if (!(await clickButtonExact(page, tab))) {
        missed.push(`/dashboard EXEC tab ${tab} not found`);
        continue;
      }
      await waitForRender(page);
      await screenshot(page, `dashboard-exec-tab-${tab}.png`);
    }
  } else {
    for (const tab of execTabs) missed.push(`/dashboard EXEC tab ${tab} unavailable (EXEC missing)`);
  }

  if (await clickButtonExact(page, "MKT")) {
    await waitForRender(page);
    await screenshot(page, "dashboard-mkt-collapsed.png");
    if (
      (await clickButtonContains(page, "D DEEP")) ||
      (await clickButtonExact(page, "D DEEP OFF")) ||
      (await clickButtonExact(page, "D DEEP ON"))
    ) {
      await waitForRender(page);
      await screenshot(page, "dashboard-mkt-expanded.png");
    } else {
      missed.push("/dashboard market deep detail toggle not found");
    }
  } else {
    missed.push("/dashboard market mode MKT not found");
  }

  await browser.close();
  console.log(JSON.stringify({ totalNew: saved.length, saved, missed }, null, 2));
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});
