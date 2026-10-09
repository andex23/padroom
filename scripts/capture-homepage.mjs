import { chromium } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";

mkdirSync("docs/screenshots", { recursive: true });
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
const browser = await chromium.launch({ executablePath });
try {
  for (const [width, height] of [
    [390, 844],
    [1280, 800],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const response = await page.goto(
      process.env.PADROOM_SCREENSHOT_URL || "http://localhost:3000",
      { waitUntil: "networkidle" },
    );
    if (response?.status() !== 200)
      throw new Error("The running homepage did not return HTTP 200.");
    await page.evaluate(() => document.fonts.ready);
    const path = `docs/screenshots/home-${width}.png`;
    await page.screenshot({ path });
    console.log(`${width}×${height}: ${path}`);
    await page.close();
  }
} finally {
  await browser.close();
}
