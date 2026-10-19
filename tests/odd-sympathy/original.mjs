// Runs the simulation section of the preserved original Odd Sympathy page,
// exactly as published, so tests can compare it with dist/instruments/odd-sympathy/model.mjs.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const ORIGINAL_URL = new URL('../../docs/ODD_SYMPATHY_ORIGINAL.html', import.meta.url);
export const ORIGINAL_SHA256 = 'd51648fc8a76ee49f55999f3bceb86f7558ea75649ec63025856ea97f348f9df';

export function originalSource() {
  const bytes = readFileSync(ORIGINAL_URL);
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== ORIGINAL_SHA256) throw Error(`preserved original changed: ${hash}`);
  return bytes.toString('utf8');
}

// The original keeps its rules between two comment markers, using u, W and H
// from the page and calling pluck() and onLock() for sound and hints.
export function originalField({ u = 1, W = 1000, H = 800, eps } = {}) {
  const source = originalSource();
  const start = source.indexOf('// ---------- the three rules ----------');
  const end = source.indexOf('// ---------- sound ----------');
  if (start < 0 || end < start) throw Error('original simulation markers not found');
  const setupsStart = source.indexOf('// ---------- setups ----------');
  const setupsEnd = source.indexOf("document.querySelectorAll('[data-setup]')");
  if (setupsStart < 0 || setupsEnd < setupsStart) throw Error('original setup markers not found');
  const block = source.slice(start, end) + source.slice(setupsStart, setupsEnd);
  const fires = [];
  const build = new Function('u', 'W', 'H', 'pluck', 'onLock', `${block}
    return { P, rings, pulses, threads, makeRing, fire, advance, period, freq, SETUPS, clearField,
      get t() { return simT; }, set t(v) { simT = v; } };`);
  const field = build(u, W, H, (t, f, x, accent) => fires.push({ t, f, x, accent }), () => {});
  if (typeof eps === 'number') field.P.eps = eps;
  field.fires = fires;
  return field;
}
