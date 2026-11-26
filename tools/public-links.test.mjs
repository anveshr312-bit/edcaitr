import test from 'node:test';
import assert from 'node:assert/strict';

// Start the app locally and set EDC_TEST_ORIGIN when using a different port.
const base = new URL(process.env.EDC_TEST_ORIGIN ?? 'http://127.0.0.1:3000');
const urls = new Set(['/','/about','/events','/team','/contact']);
test('public navigation resolves without streamed not-found pages', async () => {
  const sitemap = await fetch(new URL('/sitemap.xml',base));
  assert.equal(sitemap.status,200);
  for (const [,url] of (await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(new URL(url).pathname);
  for (const pathname of urls) {
    const response = await fetch(new URL(pathname,base));
    assert.equal(response.status,200,pathname);
    const html = await response.text();
    assert.doesNotMatch(html,/NEXT_HTTP_ERROR_FALLBACK;404|<title>Event Not Found/,pathname);
    if (pathname==='/' || pathname==='/events' || pathname==='/team') {
      for (const [,href] of html.matchAll(/href="(\/(?:events|members)\/[^"#?]+)"/g)) urls.add(href);
    }
  }
  assert.match(await (await fetch(new URL('/robots.txt',base))).text(),/Sitemap:/i);
});
test('legacy event links have a detail or program destination', async () => {
  for (const [slug,anchor] of [['fokus-x-e-summit-2026','summit-2026'],['pitchbiz-investment-arena-2026','pitchbiz']]) {
    const response=await fetch(new URL('/events/'+slug,base));
    assert.equal(response.status,200);
    const html=await response.text();
    assert.doesNotMatch(html,/NEXT_HTTP_ERROR_FALLBACK;404/);
    assert.ok(html.includes(anchor)||html.includes('EventStructuredData')||html.includes('schema.org/OfflineEventAttendanceMode'));
  }
});
