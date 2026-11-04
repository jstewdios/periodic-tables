// Optional development check for /journal/ring/. Install Playwright separately; no browser
// package is shipped to visitors. PLAYWRIGHT_MODULE, CHROMIUM_PATH and CHROMIUM_ARGS (space
// separated) select installed tools; SCREENSHOT_DIR saves evidence. A fresh browser is launched
// per case so single-process Chromium builds work too. Two full 40 s runs make this take ~2 min.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve('dist'), output = process.env.SCREENSHOT_DIR;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    let path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (path !== root && !path.startsWith(root + '/')) throw Error('path');
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    res.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream'); res.end(await readFile(path));
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const launch = () => chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: process.env.CHROMIUM_ARGS ? process.env.CHROMIUM_ARGS.split(' ') : undefined });
const errors = [], pause = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(check, message, tries = 100) { for (let i = 0; i < tries; i++) { if (await check()) return; await pause(100); } throw Error(message); }
const measurements = page => page.evaluate(() => JSON.parse(document.getElementById('measurements').textContent.split('\n').slice(1).join('\n')));
async function shot(target, name) { if (output) { await mkdir(output, { recursive: true }); await target.screenshot({ path: join(output, name + '.png') }); } }
async function open(width, height, reduce = false) {
  const browser = await launch();
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 900, isMobile: width < 900, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  await context.addInitScript(() => { window.testContexts = []; const Native = window.AudioContext; window.AudioContext = class extends Native { constructor(...a) { super(...a); window.testContexts.push(this); } }; });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(origin)) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(origin + '/journal/ring/'); await page.locator('#run:enabled').waitFor();
  return { browser, page };
}
try {
  for (const [width, height, reduce] of [[1440, 1000, false], [390, 844, false], [320, 568, false], [390, 844, true]]) {
    const { browser, page } = await open(width, height, reduce), tag = `ring-${width}${reduce ? '-reduced' : ''}`;
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow');
    assert.equal(await page.evaluate(() => testContexts.length), 0, 'no audio context before opt-in');
    assert.equal(await page.locator('#sum').textContent(), '−23.46 ¢');
    await page.locator('#push').click();
    const wide = await page.evaluate(() => { const r = document.querySelectorAll('#bars .bar-set rect')[2], vb = document.getElementById('bars').viewBox.baseVal; return { y: +r.getAttribute('y'), h: +r.getAttribute('height'), top: vb.y }; });
    assert.ok(wide.y >= wide.top && wide.h > 75, 'the +18-cent fifth is drawn in full: ' + JSON.stringify(wide));
    await page.locator('#run').click();
    await waitFor(async () => (await measurements(page)).time > 6, 'ring evolves');
    const m = await measurements(page); assert.equal(m.sumCents, -23.46); assert.ok(m.errorsCents[3] < -15, 'roughness keeps the narrowed fifth deep');
    await page.locator('#run').click(); const held = await page.locator('#clock').textContent(); await pause(300);
    assert.equal(await page.locator('#clock').textContent(), held, 'pause holds');
    await page.locator('#sound').click();
    await waitFor(() => page.evaluate(() => testContexts[0]?.state === 'running'), 'real audio opt-in');
    const first = (await measurements(page)).heard.fifth;
    await waitFor(async () => (await measurements(page)).heard.fifth !== first, 'window walks while sound is on', 40);
    await shot(page.locator('#experiment'), tag);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => page.evaluate(() => testContexts[0].state === 'closed'), 'hiding closes audio');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); });
    await page.locator('input[value=quadratic]').check();
    const q = await measurements(page); assert.equal(q.curve, 'quadratic'); assert.equal(q.pushesOfVoice3, 1); assert.equal(q.time, 0);
    await browser.close();
  }
  for (const curve of ['roughness', 'quadratic']) {   // the archived push check T1, run to the end in the page
    const { browser, page } = await open(1440, 1000);
    if (curve === 'roughness') await page.locator('#push').click(); else await page.locator('input[value=quadratic]').check();
    await page.locator('#run').click();
    await waitFor(async () => (await page.locator('#run').textContent()) === 'Run again', 'run reaches 40 s', 900);
    const m = await measurements(page);
    if (curve === 'roughness') { assert.equal(m.largestError.fifth, 3); assert.ok(Math.abs(m.largestError.cents + 19.61) < .01); m.errorsCents.forEach((e, i) => i === 3 || assert.ok(Math.abs(e + .35) < .01)); }
    else m.errorsCents.forEach(e => assert.ok(e <= -1.945 && e >= -1.965));
    await shot(page.locator('#experiment'), `ring-${curve}-40s`);
    await browser.close();
  }
  { // the full Ring beside the page opens and plays
    const { browser, page } = await open(390, 844);
    await page.locator('.full-instrument').click(); await page.waitForURL('**/journal/ring/full.html'); await page.locator('#ring').waitFor();
    await page.locator('#btnSound').click(); await waitFor(() => page.evaluate(() => testContexts[0]?.state === 'running'), 'full Ring audio');
    await browser.close();
  }
  assert.deepEqual(errors, [], 'no page errors or failed local assets');
  console.log('Ring journal browser checks passed.');
} finally { server.close(); }
