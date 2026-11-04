import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Experiment, ListeningWindow, STEPS, DT, C, N } from '../../dist/journal/ring/experiment.mjs';
const finish = e => { e.run(true); for (let i = 0; i < STEPS + 10; i++) e.step(); return e.snapshot(); };
test('the ring core is the archived file, byte for byte', () => {
  const hash = createHash('sha256').update(readFileSync(new URL('../../dist/journal/ring/ring-core.js', import.meta.url))).digest('hex');
  assert.equal(hash, '20059ee39952e2e7d55b3aab5fe19106931a5dfef985c7e9c1b9ba7541a9ac55');
});
test('the full Ring beside the page is the archived standalone file, byte for byte', () => {
  const hash = createHash('sha256').update(readFileSync(new URL('../../dist/journal/ring/full.html', import.meta.url))).digest('hex');
  assert.equal(hash, '839ddc84b00167e0dbdd61a7c367281351961fd8c59246ae84034cf6f18c7392');
});
test('push from equal temperament: quadratic forgets, roughness keeps a wolf on fifth 3 (archived check T1)', () => {
  const q = new Experiment('quadratic'); q.push(); const a = finish(q);
  for (const e of a.eps) assert.ok(e <= -1.945 && e >= -1.965, 'quadratic fifth ' + e);
  const r = new Experiment('roughness'); r.push(); const b = finish(r);
  assert.equal(b.wolfEdge, 3); assert.ok(Math.abs(b.wolfDepth + 19.61) < .01, 'wolf ' + b.wolfDepth);
  b.eps.forEach((e, i) => { if (i !== 3) assert.ok(Math.abs(e + .35) < .01, 'fifth ' + i + ' ' + e); });
  for (const s of [a, b]) { assert.ok(Math.abs(s.sum + C) < 1e-9); assert.ok(Math.abs(s.time - 40) < 1e-9); assert.equal(s.running, false); }
});
test('the sum of errors never moves, pushed or not, at every step', () => {
  for (const curve of ['roughness', 'quadratic']) {
    const e = new Experiment(curve); e.push(); e.run(true);
    for (let i = 0; i < 600; i++) { e.step(); if (i === 200) e.push(); assert.ok(Math.abs(e.snapshot().sum + C) < 1e-9); }
  }
});
test('equal temperament holds for the 40 s run without a push: no noise on this page', () => {
  // Under roughness ET is a repeller: float rounding (~1e-13 cents) grows to ~1e-3 cents by 40 s.
  const s = finish(new Experiment('roughness'));
  for (const e of s.eps) assert.ok(Math.abs(e + C / N) < .01, 'fifth ' + e);
});
test('reset is exact, pause holds, and switching the curve prepares a pushed, paused ring', () => {
  const e = new Experiment(), fresh = e.snapshot(); e.push(); e.run(true); for (let i = 0; i < 120; i++) e.step();
  e.run(false); const held = e.snapshot(); e.step(); assert.deepEqual(e.snapshot(), held);
  e.reset('roughness'); assert.deepEqual(e.snapshot(), fresh);
  e.reset('quadratic', true); const s = e.snapshot();
  assert.equal(s.curve, 'quadratic'); assert.equal(s.pushes, 1); assert.equal(s.running, false); assert.equal(s.time, 0);
  assert.ok(Math.abs(s.eps[2] - (20 - C / N)) < 1e-9 && Math.abs(s.eps[3] - (-20 - C / N)) < 1e-9);
});
test('the dyad is a fifth mistuned by the heard error, lower voice in the A3 octave', () => {
  const e = new Experiment(); e.push();
  for (let w = 0; w < N; w++) {
    const [lo, hi] = e.dyad(w), cents = 1200 * Math.log2(hi / lo);
    assert.ok(lo >= 220 && lo < 440); assert.ok(Math.abs(cents - (1200 * Math.log2(1.5) + e.snapshot().eps[w])) < 1e-9);
  }
});
test('the window walks one fifth every 2 s and wraps', () => {
  const w = new ListeningWindow(); for (let i = 0; i < 25 * 60; i++) w.advance(DT);
  assert.equal(w.edge, 0); w.advance(2); assert.equal(w.edge, 1);
});
