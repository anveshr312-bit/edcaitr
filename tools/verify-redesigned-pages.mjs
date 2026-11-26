import { chromium } from 'file:///C:/Users/anves/Downloads/DairyPro/node_modules/playwright-core/index.mjs';

async function verifyRedesignedPages() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to sign in page...');
  await page.goto('http://localhost:3000/account', { waitUntil: 'networkidle' });

  // Sign in with core@ecell-aitr.ac.in
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  
  if (await emailInput.count() > 0) {
    await emailInput.fill('core@ecell-aitr.ac.in');
    await passwordInput.fill('Password@123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
  }

  const pagesToCapture = [
    { url: 'http://localhost:3000/account/profile', name: 'profile_redesigned.png' },
    { url: 'http://localhost:3000/account/mfa', name: 'mfa_redesigned.png' },
    { url: 'http://localhost:3000/portal/certificates', name: 'certificates_redesigned.png' },
    { url: 'http://localhost:3000/portal/registrations', name: 'registrations_redesigned.png' },
    { url: 'http://localhost:3000/alumni/directory', name: 'alumni_directory_redesigned.png' },
    { url: 'http://localhost:3000/alumni/startups', name: 'alumni_startups_redesigned.png' }
  ];

  for (const item of pagesToCapture) {
    console.log(`Navigating to ${item.url}...`);
    await page.goto(item.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const savePath = `C:/Users/anves/.gemini/antigravity/brain/2fd40270-60ab-4bf6-a15d-6c30aba2c4e2/${item.name}`;
    await page.screenshot({ path: savePath, fullPage: true });
    console.log(`Saved screenshot to ${item.name}`);
  }

  await browser.close();
  console.log('Visual verification complete!');
}

verifyRedesignedPages().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
