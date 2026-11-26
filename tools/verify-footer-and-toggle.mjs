import { chromium } from 'playwright-core';
import fs from 'node:fs';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Capture footer
const footer = await page.$('footer');
if (footer) {
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const targetDir = 'A:/EDC-AITR-Stabilization/docs/stabilization';
  fs.mkdirSync(targetDir, { recursive: true });
  await footer.screenshot({ path: `${targetDir}/footer_verified.png` });
  console.log('Saved footer_verified.png');
}

// Check stats
const stats = await page.$$eval('.rolling-stat', els => els.map(el => el.textContent.trim()));
console.log('Rolling stats values rendered:', stats);

// Test theme toggle button
const toggleBtn = await page.$('button[aria-label*="theme" i], button[aria-label*="mode" i]');
console.log('Theme toggle button found:', !!toggleBtn);
if (toggleBtn) {
  await toggleBtn.click();
  await page.waitForTimeout(800);
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log('Theme changed to dark:', isDark);
}

// Capture fullpage
await page.screenshot({ path: 'A:/EDC-AITR-Stabilization/docs/stabilization/fullpage_1440_after_fixes.png', fullPage: true });
console.log('Saved fullpage_1440_after_fixes.png');

await browser.close();
