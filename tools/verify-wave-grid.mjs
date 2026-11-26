import { chromium } from 'file:///C:/Users/anves/Downloads/DairyPro/node_modules/playwright-core/index.mjs';

async function verifyWaveGrid() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Verify canvas element exists
  const canvasCount = await page.locator('canvas').count();
  console.log('Canvas elements found on page:', canvasCount);

  // Move mouse across the center to generate ripples
  for (let i = 0; i < 10; i++) {
    await page.mouse.move(200 + i * 80, 300 + (i % 2) * 50);
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(500);

  // Capture screenshot
  const savePath = 'C:/Users/anves/.gemini/antigravity/brain/2fd40270-60ab-4bf6-a15d-6c30aba2c4e2/wave_grid_desktop.png';
  await page.screenshot({ path: savePath });
  console.log('Screenshot saved to wave_grid_desktop.png');

  // Toggle theme to dark and capture
  const toggleBtn = page.locator('button[aria-label*="theme" i], button[aria-label*="mode" i]').first();
  if (await toggleBtn.count() > 0) {
    await toggleBtn.click();
    await page.waitForTimeout(800);
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(200 + i * 80, 300 + (i % 2) * 50);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'C:/Users/anves/.gemini/antigravity/brain/2fd40270-60ab-4bf6-a15d-6c30aba2c4e2/wave_grid_dark.png' });
    console.log('Screenshot saved to wave_grid_dark.png');
  }

  await browser.close();
  console.log('Wave grid verification complete!');
}

verifyWaveGrid().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
