import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3004";
const OUT_DIR = path.resolve("screenshots/full-app-capture");

const routes = [
  "/",
  "/dashboard",
  "/portfolio",
  "/confluences",
  "/news",
  "/tools",
  "/tools/futures",
  "/tools/options",
  "/tools/forex",
  "/calendar",
  "/account",
  "/charts",
  "/screener",
  "/algo",
  "/login",
  "/register",
  "/billing",
  "/entity/AAPL",
];

const functionCodes = [
  "EXEC",
  "DES",
  "FA",
  "HP",
  "WEI",
  "YAS",
  "OVME",
  "PORT",
  "NEWS",
  "CAL",
  "SEC",
  "MKT",
  "INTEL",
];

const execTabs = ["PRIMARY", "MICROSTRUCTURE", "FACTORS", "EVENTS", "ESC"];

const missed = [];
const saved = [];

function slugFromRoute(route) {
  if (route === "/") return "home";
  return route.replace(/^\//, "").replace(/\//g, "-").toLowerCase();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function waitForRender(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function saveFullPage(page, fileName) {
  const fullPath = path.join(OUT_DIR, fileName);
  await page.screenshot({ path: fullPath, fullPage: true });
  saved.push(fileName);
}

function normalized(text) {
  return text.replace(/\s+/g, " ").trim().toUpperCase();
}

async function clickByText(page, text) {
  const target = normalized(text);
  const buttons = page.locator("button:visible");
  const total = await buttons.count();

  for (let i = 0; i < total; i += 1) {
    const btn = buttons.nth(i);
    const label = normalized((await btn.innerText().catch(() => "")) || "");
    if (label === target || label.includes(` ${target}`) || label.startsWith(`${target} `)) {
      try {
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click({ timeout: 3000 });
        await page.waitForTimeout(800);
        return true;
      } catch {
        // Continue trying other matching visible buttons
      }
    }
  }

  const fallback = [
    page.getByRole("button", { name: new RegExp(`\\b${text}\\b`, "i") }).first(),
    page.getByText(new RegExp(`\\b${text}\\b`, "i")).first(),
  ];
  for (const loc of fallback) {
    try {
      if ((await loc.count()) > 0) {
        await loc.scrollIntoViewIfNeeded().catch(() => {});
        await loc.click({ timeout: 2500 });
        await page.waitForTimeout(800);
        return true;
      }
    } catch {
      // Try next strategy
    }
  }

  return false;
}

async function captureRoutes(page) {
  for (const route of routes) {
    const file = `route-${slugFromRoute(route)}.png`;
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await waitForRender(page);
      await saveFullPage(page, file);
    } catch (err) {
      missed.push(`${route} (route capture failed: ${String(err)})`);
    }
  }
}

async function captureFunctionCodes(page) {
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForRender(page);

  for (const code of functionCodes) {
    const file = `dashboard-fn-${code}.png`;
    try {
      const clicked = await clickByText(page, code);
      if (!clicked) {
        missed.push(`/dashboard function ${code} (not found/clickable)`);
        continue;
      }
      await waitForRender(page);
      await saveFullPage(page, file);
    } catch (err) {
      missed.push(`/dashboard function ${code} (capture failed: ${String(err)})`);
    }
  }
}

async function captureExecTabs(page) {
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForRender(page);

  const execSelected = await clickByText(page, "EXEC");
  if (!execSelected) {
    for (const tab of execTabs) {
      missed.push(`/dashboard EXEC tab ${tab} (EXEC function unavailable)`);
    }
    return;
  }
  await waitForRender(page);

  for (const tab of execTabs) {
    const file = `dashboard-exec-tab-${tab}.png`;
    try {
      const clicked = await clickByText(page, tab);
      if (!clicked) {
        missed.push(`/dashboard EXEC tab ${tab} (not found/clickable)`);
        continue;
      }
      await waitForRender(page);
      await saveFullPage(page, file);
    } catch (err) {
      missed.push(`/dashboard EXEC tab ${tab} (capture failed: ${String(err)})`);
    }
  }
}

async function clickToggleByKeywords(page, includeWords) {
  const regex = new RegExp(includeWords.join("|"), "i");
  const buttons = page.locator("button:visible");
  const total = await buttons.count();
  for (let i = 0; i < total; i += 1) {
    const btn = buttons.nth(i);
    const label = (await btn.innerText().catch(() => "")) || "";
    if (regex.test(label)) {
      try {
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click({ timeout: 3000 });
        await page.waitForTimeout(700);
        return true;
      } catch {
        // Continue
      }
    }
  }
  return false;
}

async function captureMarketToggle(page) {
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForRender(page);

  const mktSelected = await clickByText(page, "MKT");
  if (!mktSelected) {
    missed.push("/dashboard market deep detail (MKT function unavailable)");
    return;
  }
  await waitForRender(page);

  try {
    await saveFullPage(page, "dashboard-mkt-collapsed.png");
  } catch (err) {
    missed.push(`/dashboard market collapsed (capture failed: ${String(err)})`);
  }

  const toggled =
    (await clickToggleByKeywords(page, ["D\\s*DEEP", "DEEP", "DETAIL", "ON", "OFF"])) ||
    (await clickByText(page, "D DEEP OFF")) ||
    (await clickByText(page, "D DEEP ON"));

  if (!toggled) {
    missed.push("/dashboard market expanded (toggle not found/clickable)");
    return;
  }

  await waitForRender(page);
  try {
    await saveFullPage(page, "dashboard-mkt-expanded.png");
  } catch (err) {
    missed.push(`/dashboard market expanded (capture failed: ${String(err)})`);
  }
}

async function main() {
  await ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    await captureRoutes(page);
    await captureFunctionCodes(page);
    await captureExecTabs(page);
    await captureMarketToggle(page);
  } finally {
    await browser.close();
  }

  const result = {
    outDir: OUT_DIR,
    total: saved.length,
    files: saved.sort(),
    missed,
  };

  const resultPath = path.join(OUT_DIR, "capture-report.json");
  await fs.writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((err) => {
  process.stderr.write(`capture failed: ${String(err)}\n`);
  process.exit(1);
});
