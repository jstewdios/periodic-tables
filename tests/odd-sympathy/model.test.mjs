import test from 'node:test';
import assert from 'node:assert/strict';
import { Field, DEFAULTS } from '../../dist/instruments/odd-sympathy/model.mjs';
import { SETUPS, loadSetup } from '../../dist/instruments/odd-sympathy/setups.mjs';
import { noteName } from '../../dist/instruments/odd-sympathy/render.mjs';
import { originalField } from './original.mjs';

const W = 1000, H = 800, DT = 0.016;
function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }
function setup(name, { eps, seconds, script = () => {} } = {}) {
  const fires = [];
  const field = new Field({ eps, onFire: (r, t, f, accent) => fires.push({ id: r.id, t, f, accent }) });
  loadSetup(field, name, W, H, seeded(7));
  for (let T = DT; T < seconds; T += DT) { script(field, T); field.advance(T); }
  return { field, fires };
}
const times = (fires, id, from = 0, to = Infinity) => fires.filter(x => x.id === id && x.t >= from && x.t < to).map(x => x.t);
// Where ring B fires within ring A's current lap, folded to 0..0.5 of a period.
function lags(fires, a, b, from, to) {
  const ta = times(fires, a), out = [];
  for (const t of times(fires, b, from, to)) {
    const prev = ta.filter(x => x <= t);
    if (prev.length < 2) continue;
    const period = prev.at(-1) - prev.at(-2), lag = ((t - prev.at(-1)) / period) % 1;
    out.push(Math.min(lag, 1 - lag));
  }
  return out;
}
const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
const rate = (fires, id, from, to) => { const t = times(fires, id, from, to); return (t.length - 1) / (t.at(-1) - t[0]); };

test('the extracted model and setups reproduce the preserved original prototype exactly', () => {
  // Same arrangements, the same player edits at the same moments, identical fire times and pitches.
  const edits = (f, T, rings) => {
    if (Math.abs(T - 8.0) < DT / 2) rings[0].x += 40;
    if (Math.abs(T - 12.0) < DT / 2) rings[1].r *= 1.2;
    if (Math.abs(T - 16.0) < DT / 2) f.P.eps = 0.4;
  };
  for (const name of Object.keys(SETUPS)) {
    const original = originalField({ W, H });
    const random = Math.random; Math.random = seeded(7);
    try { original.clearField(); original.SETUPS[name](); } finally { Math.random = random; }
    const fires = [];
    const field = new Field({ onFire: (r, t, f, accent) => fires.push({ t, f, accent }) });
    loadSetup(field, name, W, H, seeded(7));
    assert.deepEqual(field.rings.map(r => [r.x, r.y, r.r, r.phi]), original.rings.map(r => [r.x, r.y, r.r, r.phi]), `${name} geometry`);
    for (let T = DT; T < 30; T += DT) {
      edits(original, T, original.rings); edits(field, T, field.rings);
      if (Math.abs(T - 20.0) < DT / 2) { original.fire(original.rings[0], 1); field.strike(field.rings[0], 1); }
      original.advance(T); field.advance(T);
    }
    assert.ok(fires.length > 20, `${name} fires`);
    assert.deepEqual(fires, original.fires.map(({ t, f, accent }) => ({ t, f, accent })), `${name} fire trace`);
  }
});

test('two strangers lock one-to-one with a small steady flam', () => {
  const { fires } = setup('strangers', { seconds: 40 });
  const settled = lags(fires, 1, 2, 15, 40);
  assert.ok(Math.max(...settled) < 0.04, `lag ${Math.max(...settled)}`);
  assert.ok(Math.max(...settled) - Math.min(...settled) < 0.002, 'the lock holds');
  assert.ok(mean(lags(fires, 1, 2, 0, 5)) > mean(settled), 'the flam closes');
});

test('identical rings half a ripple-period apart trade beats', () => {
  for (const eps of [0.12, 0.22, 0.4]) {
    const settled = lags(setup('trading', { eps, seconds: 40 }).fires, 1, 2, 15, 40);
    assert.ok(Math.abs(mean(settled) - 0.5) < 0.005, `eps ${eps}: lag ${mean(settled)}`);
  }
});

test('a size ratio of 1.52 locks to a 3:2 rhythm that sounds as a fifth', () => {
  const { fires } = setup('fifth', { seconds: 90 });
  const ratio = rate(fires, 1, 50, 90) / rate(fires, 2, 50, 90);
  assert.ok(Math.abs(ratio - 1.5) < 0.002, `rate ratio ${ratio}`);
  // Pitch follows kept tempo, so the sounded interval sits near 702 cents rather than the size ratio's 725.
  const pitch = id => mean(fires.filter(x => x.id === id && x.t > 50).map(x => x.f));
  const cents = 1200 * Math.log2(pitch(1) / pitch(2));
  assert.ok(Math.abs(cents - 702) < 8, `interval ${cents.toFixed(1)} cents`);
  assert.ok(Math.abs(1200 * Math.log2(1.52) - 702) > 20, 'the size ratio alone would be out of tune');
});

test('the triangle settles into two together and one trading, at every pull tried', () => {
  // The original drawer said the triangle could never settle. This model shows it does.
  for (const eps of [0.12, 0.22, 0.4]) {
    const { fires } = setup('triangle', { eps, seconds: 120 });
    const pairs = [lags(fires, 1, 2, 60, 120), lags(fires, 1, 3, 60, 120)].map(mean).sort();
    assert.ok(pairs[0] < 0.01 && Math.abs(pairs[1] - 0.5) < 0.01, `eps ${eps}: ${pairs}`);
  }
});

test('pulling a locked pair apart makes it start trading beats', () => {
  const fires = [];
  const field = new Field({ onFire: (r, t) => fires.push({ id: r.id, t }) });
  field.addRing(300, 400, 50, 0); const b = field.addRing(401, 400, 50, 0.02);
  const far = 0.5 * (2 * Math.PI * 50 / DEFAULTS.v) * DEFAULTS.c;
  let T = DT;
  for (; T < 15; T += DT) field.advance(T);
  assert.ok(mean(lags(fires, 1, 2, 10, 15)) < 0.01, 'together first');
  for (const t0 = T; T < t0 + 20; T += DT) { b.x = 401 + far * (T - t0) / 20; field.advance(T); }
  const t1 = T;
  for (; T < t1 + 30; T += DT) field.advance(T);
  assert.ok(Math.abs(mean(lags(fires, 1, 2, t1 + 15, t1 + 30)) - 0.5) < 0.01, 'trading after the drag');
});

test('with no pull every ring keeps its own natural time and pitch', () => {
  const fires = [];
  const field = new Field({ eps: 0, onFire: (r, t, f) => fires.push({ id: r.id, t, f }) });
  const rings = [field.addRing(200, 300, 40, 0.1), field.addRing(260, 300, 30, 0.6), field.addRing(500, 500, 90, 0.3)];
  for (let T = DT; T < 20; T += DT) field.advance(T);
  for (const r of rings) {
    const t = times(fires, r.id);
    for (let i = 1; i < t.length; i++) assert.ok(Math.abs(t[i] - t[i - 1] - field.period(r)) < 1e-9);
    assert.ok(Math.abs(r.corr - 1) < 1e-12);
    assert.ok(Math.abs(fires.find(x => x.id === r.id).f - 256 / field.period(r)) < 1e-9);
  }
});

test('a crowded field at the strongest pull stays finite, ordered and bounded', () => {
  const fires = [];
  const field = new Field({ eps: 0.6, onFire: (r, t, f) => fires.push({ id: r.id, t, f }) });
  loadSetup(field, 'crowd', W, H, seeded(3));
  // Pack in a few extra overlapping rings to provoke contact chains.
  for (let i = 0; i < 8; i++) field.addRing(480 + i * 9, 400, 30 + i, i / 8);
  for (let T = DT; T < 60; T += DT) field.advance(T);
  assert.ok(fires.every((x, i) => Number.isFinite(x.t) && Number.isFinite(x.f) && x.f > 0 && (i === 0 || x.t >= fires[i - 1].t)));
  for (const r of field.rings) {
    assert.ok(r.corr >= 0.85 && r.corr <= 1.18);
    const count = times(fires, r.id).length;
    assert.ok(count <= 60 / field.period(r) * 1.3 + 3, `ring ${r.id}: ${count} fires`);
  }
  // Spent ripples and threads are dropped by the renderer each frame, as in the original;
  // the model itself only caps ripples.
  assert.ok(field.pulses.length <= 500);
});

test('removing a ring stops it firing and prunes it after its fade', () => {
  const fires = [];
  const field = new Field({ onFire: (r, t) => fires.push({ id: r.id, t }) });
  const a = field.addRing(200, 200, 40, 0), b = field.addRing(600, 200, 40, 0.5);
  field.advance(2); field.remove(a); const removedAt = field.t;
  field.advance(5); field.prune();
  assert.ok(!fires.some(x => x.id === a.id && x.t > removedAt));
  assert.deepEqual(field.rings, [b]);
});

test('note names follow equal temperament with cents shown only when they matter', () => {
  assert.equal(noteName(440), 'A4');
  assert.equal(noteName(261.6256), 'C4');
  assert.equal(noteName(256), 'C4 −38');
  assert.equal(noteName(466.1638), 'B♭4');
});
