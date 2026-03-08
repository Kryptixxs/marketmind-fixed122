import path from "node:path";
import { chromium } from "playwright";

const OUT_DIR = path.resolve("screenshots/full-app-capture");
const URL = "http://localhost:3004/dashboard";
const functionCodes = ["EXEC", "DES", "FA", "HP", "WEI", "YAS", "OVME", "PORT", "NEWS", "CAL", "SEC", "MKT", "INTEL"];
const execTabs = ["PRIMARY", "MICROSTRUCTURE", "FACTORS", "EVENTS", "ESC"];

const saved = [];
const missed = [];

async function wait(page, ms = 700) {
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: true });
  saved.push(name);
}

async function clickButtonByExactText(page, label) {
  return page.evaluate((target) => {
    const norm = (s) => s.replace(/\s+/g, " ").trim().toUpperCase();
    const wanted = norm(target);
    const buttons = Array.from(document.querySelectorAll("button"));
    const hit = buttons.find((b) => norm(b.textContent || "") === wanted);
    if (!hit) return false;
    hit.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  }, label);
}

async function clickButtonContains(page, snippet) {
  return page.evaluate((token) => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const hit = buttons.find((b) => (b.textContent || "").toUpperCase().includes(token.toUpperCase()));
    if (!hit) return false;
    hit.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  }, snippet);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await wait(page, 1200);

  for (const code of functionCodes) {
    if (!(await clickButtonByExactText(page, code))) {
      missed.push(`/dashboard function ${code} not found`);
      continue;
    }
    await wait(page);
    await shot(page, `dashboard-fn-${code}.png`);
  }

  await clickButtonByExactText(page, "EXEC");
  await wait(page);
  for (const tab of execTabs) {
    if (!(await clickButtonByExactText(page, tab))) {
      missed.push(`/dashboard EXEC tab ${tab} not found`);
      continue;
    }
    await wait(page);
    await shot(page, `dashboard-exec-tab-${tab}.png`);
  }

  if (await clickButtonByExactText(page, "MKT")) {
    await wait(page);
    await shot(page, "dashboard-mkt-collapsed.png");
    if (await clickButtonContains(page, "D DEEP")) {
      await wait(page);
      await shot(page, "dashboard-mkt-expanded.png");
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
