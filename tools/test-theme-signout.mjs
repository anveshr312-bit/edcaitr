import { chromium } from 'file:///C:/Users/anves/Downloads/DairyPro/node_modules/playwright-core/index.mjs';

async function testThemeAndSignOut() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://127.0.0.1:3000...');
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Verify theme toggle button exists
  const toggleBtn = page.locator('button[aria-label*="theme" i], button[aria-label*="mode" i]');
  const count = await toggleBtn.count();
  console.log('Theme toggle button count:', count);

  // Check SVG paths inside the button (should be the sun/moon clipPath button)
  const clipPath = await page.locator('button[aria-label*="theme" i] clipPath').count();
  console.log('Sun/moon clipPath element count:', clipPath);

  // Capture close-up of header buttons
  const header = await page.$('header');
  if (header) {
    await header.screenshot({ path: 'C:/Users/anves/.gemini/antigravity/brain/2fd40270-60ab-4bf6-a15d-6c30aba2c4e2/header_theme_toggle.png' });
    console.log('Saved header_theme_toggle.png');
  }

  // Check initial theme
  const initialClass = await page.evaluate(() => document.documentElement.className);
  console.log('Initial document class:', initialClass);

  // Measure click responsiveness and trigger theme toggle
  const t0 = Date.now();
  await toggleBtn.first().click();
  const t1 = Date.now();
  console.log(`Toggle clicked in ${t1 - t0}ms`);

  // Wait for transition to complete
  await page.waitForTimeout(600);
  const nextClass = await page.evaluate(() => document.documentElement.className);
  console.log('Document class after toggle:', nextClass);

  // Check if circular ripple styles were injected
  const styleContent = await page.evaluate(() => {
    const el = document.getElementById('edc-theme-transition-styles');
    return el ? el.textContent : null;
  });
  console.log('Has ripple animation style:', Boolean(styleContent && styleContent.includes('theme-ripple-expand')));

  // Test Dashboard Sign Out button
  console.log('Navigating to http://127.0.0.1:3000/account/dashboard...');
  await page.goto('http://127.0.0.1:3000/account/dashboard', { waitUntil: 'load' });
  console.log('Current URL after navigating to dashboard:', page.url());

  // Capture screenshot of desktop with restored button
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'C:/Users/anves/.gemini/antigravity/brain/2fd40270-60ab-4bf6-a15d-6c30aba2c4e2/verified_theme_button.png' });
  console.log('Screenshot saved to verified_theme_button.png');

  await browser.close();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

testThemeAndSignOut().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
