import { chromium } from 'file:///C:/Users/anves/Downloads/DairyPro/node_modules/playwright-core/index.mjs';

async function testFooterParticles() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll to footer
  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const footerLogo = footer.locator('svg[viewBox="0 0 1076 856"]').first();
  const box = await footerLogo.boundingBox();
  console.log('Footer logo bounding box:', box);

  if (box) {
    // 1. Static state before hover
    await footer.screenshot({ path: 'C:/Users/anves/.gemini/antigravity/brain/2fd40270-60ab-4bf6-a15d-6c30aba2c4e2/footer_logo_1_static.png' });
    console.log('Saved footer_logo_1_static.png');

    // 2. Hover over logo to trigger swarm scatter
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(180); // mid-scatter swarm state
    await footer.screenshot({ path: 'C:/Users/anves/.gemini/antigravity/brain/2fd40270-60ab-4bf6-a15d-6c30aba2c4e2/footer_logo_2_swarm.png' });
    console.log('Saved footer_logo_2_swarm.png');

    // 3. Move mouse away and wait for magnetic gathering
    await page.mouse.move(box.x - 200, box.y - 200);
    await page.waitForTimeout(800); // magnetic attract completion
    await footer.screenshot({ path: 'C:/Users/anves/.gemini/antigravity/brain/2fd40270-60ab-4bf6-a15d-6c30aba2c4e2/footer_logo_3_gathered.png' });
    console.log('Saved footer_logo_3_gathered.png');
  }

  await browser.close();
  console.log('Footer particle test completed!');
}

testFooterParticles().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
