// End-to-end checks for the landing page.
// Run: npx http-server -p 5100 . (or any static server), then: node tests/site.test.cjs
// Needs Playwright: npm i -D playwright && npx playwright install chromium
const { chromium } = require('playwright');
const URL = process.env.SITE_URL || 'http://127.0.0.1:5100/';
const WA = '6281214799020';
const fail = (m) => { throw new Error(m); };

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle' });

  // Every WhatsApp link must reach the real number (the old site mixed in a placeholder).
  const waLinks = await page.$$eval('a[href*="wa.me"]', (as) => as.map((a) => a.href));
  if (!waLinks.length) fail('No WhatsApp links');
  const wrong = waLinks.filter((h) => !h.includes(`wa.me/${WA}`));
  if (wrong.length) fail(`WhatsApp links with another number: ${wrong.join(', ')}`);

  // Calculator: open trip = Rp250.000 x people, DP Rp50.000 x people.
  await page.locator('#calc-people').fill('4');
  await page.locator('#calc-people').dispatchEvent('input');
  if ((await page.textContent('#calc-total')) !== 'Rp1.000.000') fail('Open trip total wrong');
  if ((await page.textContent('#calc-dp')) !== 'Rp200.000') fail('Open trip DP wrong');
  await page.locator('#calc-people').fill('99');
  await page.locator('#calc-people').dispatchEvent('input');
  if ((await page.inputValue('#calc-people')) !== '20') fail('Open trip should cap at 20 people');

  // Private: guide + porter Rp1.000.000/day matches the price table (old calculator added porter + guide).
  await page.locator('label:has(input[value="private"])').click();
  await page.locator('#calc-days').fill('3');
  await page.locator('#calc-days').dispatchEvent('input');
  if ((await page.textContent('#calc-total')) !== 'Rp3.000.000') fail('Private total wrong');
  if ((await page.textContent('#calc-dp')) !== 'Rp900.000') fail('Private DP wrong');
  const send = decodeURIComponent(await page.getAttribute('#calc-send', 'href'));
  if (!send.includes('Durasi: 3 hari') || !send.includes('Rp3.000.000')) fail('WhatsApp message missing calculator details');

  // Gallery: filter, and the lightbox opens the same photo as the thumbnail.
  await page.locator('.filters button[data-filter="porter"]').click();
  const shown = await page.$$eval('#gallery li:not([hidden])', (lis) => lis.map((li) => li.dataset.cat));
  if (!shown.length || shown.some((c) => c !== 'porter')) fail('Gallery filter failed');
  await page.locator('.filters button[data-filter="all"]').click();
  const first = page.locator('#gallery li button').first();
  const thumbAlt = await first.locator('img').getAttribute('alt');
  await first.click();
  if (!(await page.locator('#lightbox').isVisible())) fail('Lightbox did not open');
  if ((await page.getAttribute('#lightbox-img', 'alt')) !== thumbAlt) fail('Lightbox shows a different photo');
  await page.keyboard.press('ArrowRight');
  if ((await page.textContent('#lightbox-count')) !== '2 / 16') fail('Lightbox navigation failed');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Lihat poster' }).click();
  if (!(await page.locator('#poster-dialog').isVisible())) fail('Poster dialog did not open');
  await page.keyboard.press('Escape');

  // Mobile: no overflow, and the menu fills the screen after scrolling (blurred nav must not trap it).
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (overflow > 0) fail(`Mobile overflows by ${overflow}px`);
  await page.evaluate(() => scrollTo({ top: 2000, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.locator('#menu-toggle').click();
  await page.locator('.nav.is-open .nav-links').waitFor({ state: 'visible' });
  const h = await page.locator('#nav-links').evaluate((el) => el.getBoundingClientRect().height);
  if (h < 600) fail(`Mobile menu collapsed to ${h}px`);

  if (errors.length) fail(`Page errors: ${errors.join('; ')}`);
  console.log('Site checks passed');
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
