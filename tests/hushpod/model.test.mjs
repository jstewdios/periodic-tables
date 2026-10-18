import test from 'node:test';
import assert from 'node:assert/strict';
import { Pod } from '../../dist/instruments/hushpod/model.mjs';
const advance = (p, seconds, fn) => { for (let t = 0; t < seconds - 1e-9; t += 1/4000) { if (fn) fn(t); p.step(1/4000); } };

test('arbitrary changing real couplings conserve undriven norm', () => {
  const p = new Pod({ decay: 0 }); p.z.set([.7,.2,-.3,.1,.1,-.5]);
  const initial = p.norm();
  advance(p, 60, t => { p.waist(0, .5 + .5*Math.sin(t*.7)); p.waist(1, .5+.5*Math.cos(t*.9)); });
  assert.ok(Math.abs(p.norm()/initial-1) < 1e-8);
});
test('natural decay remains exact with nonlinearity and exchange', () => {
  const p = new Pod(); p.z[0] = 1;
  advance(p, 8);
  assert.ok(Math.abs(p.norm()-Math.exp(-2*.045*8)) < 1e-9);
});
test('balanced nonlinear silent mode stays silent under middle damping', () => {
  const p = new Pod(); p.z.set([.7,.2,0,0,-.7,-.2]); p.hold[1] = 1;
  advance(p, 8);
  const s = p.snapshot();
  assert.ok(s.N > .5); assert.ok(s.C < 1e-20); assert.ok(s.n[1] < 1e-20);
});
test('ordinary gentle excitation and hold prepare a hush; a waist recovers it', () => {
  const p = new Pod(); p.impulse(0); const N = p.norm();
  advance(p, .3); p.hold[1] = 1; advance(p, 2); p.hold[1] = 0;
  const hush = p.snapshot();
  assert.ok(hush.C < 1e-3, 'cancellation '+hush.C);
  assert.ok(hush.N/N > .3);
  const injected = p.injected; p.waist(0, .2);
  let peakC = 0; advance(p, 1, () => { peakC = Math.max(peakC, p.snapshot().C); });
  assert.ok(peakC > .03); assert.equal(p.injected, injected);
});
test('closed waist stops exchange exactly without freezing phase', () => {
  const p = new Pod({ decay: 0 }); p.aperture.fill(0); p.target.fill(0); p.z.set([.4,0,.2,0,0,0]);
  const n = p.snapshot().n; advance(p, 2); const s = p.snapshot();
  n.forEach((v,i) => assert.ok(Math.abs(v-s.n[i])<1e-10));
  assert.ok(s.currents.every(v => v === 0)); assert.ok(Math.abs(p.z[1]) > .01);
});
test('local excitation saturates and energy accounting closes', () => {
  const p = new Pod(); p.aperture.fill(0); p.target.fill(0); p.impulse(0); p.rub[0] = 1;
  advance(p, 10); const s = p.snapshot();
  assert.ok(s.n[0] < 1.61 && s.n[0] > 1.4); assert.ok(Math.abs(s.balance)<1e-8);
});
test('gentle sequential ghost pour transfers the actual state', () => {
  const p = new Pod(); p.aperture.set([0,1]); p.target.set([0,1]); p.impulse(0);
  const N = p.norm(); let middle = 0;
  advance(p, 8, t => { const smooth=x=>(1-Math.cos(Math.PI*x))/2;
    p.waist(0, t<4?smooth(t/4):1); p.waist(1,t<4?1:1-smooth((t-4)/4));
    const s=p.snapshot(); middle=Math.max(middle,s.n[1]/s.N);
  });
  const s=p.snapshot();
  assert.ok(s.n[2]/s.N>.9, 'destination share '+s.n[2]/s.N);
  assert.ok(s.n[2]/N>.3); assert.ok(middle<.1,'middle '+middle);
});
