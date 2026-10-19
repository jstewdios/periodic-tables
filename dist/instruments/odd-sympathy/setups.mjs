// The six ready-made arrangements from the original prototype's Tune drawer.
// Geometry is unchanged; each one clears the field first.
import { DEFAULTS } from './model.mjs';

function pair(field, W, H, a, b, gap, pa, pb) {
  const { u } = field, span = (2 * a + gap + 2 * b) * u, x0 = W / 2 - span / 2;
  field.addRing(x0 + a * u, H / 2, a * u, pa);
  field.addRing(x0 + (2 * a + gap + b) * u, H / 2, b * u, pb);
}

export const SETUPS = {
  // Similar rings close together: they find each other.
  strangers: { label: 'Two strangers', build(field, W, H) { pair(field, W, H, 57, 54, 6, 0.0, 0.5); } },
  // A size ratio of 1.52 falls into a 3:2 rhythm, which is also a fifth.
  fifth: { label: 'Near a fifth', build(field, W, H) { pair(field, W, H, 56, 56 * 1.52, 8, 0.0, 0.3); } },
  // Identical rings half a period of ripple travel apart trade beats.
  trading: { label: 'Trading', build(field, W, H) {
    const r = 50, per = 2 * Math.PI * r / DEFAULTS.v, gap = 0.5 * per * DEFAULTS.c;
    pair(field, W, H, r, r, gap, 0.0, 0.1);
  } },
  // Three rings that each want to alternate with both neighbours.
  triangle: { label: 'Triangle', build(field, W, H) {
    const { u } = field, r = 40, per = 2 * Math.PI * r / DEFAULTS.v, side = 2 * r + 0.5 * per * DEFAULTS.c, R = side / Math.sqrt(3);
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 3;
      field.addRing(W / 2 + R * u * Math.cos(a), H / 2 + R * u * Math.sin(a) + 10 * u, r * u, i * 0.21 + 0.05);
    }
  } },
  // A descending row, primed near the top: one tap can run down it.
  cascade: { label: 'Cascade', build(field, W, H) {
    const { u } = field, radii = [48, 43, 38, 34, 30, 27, 24], gap = 4;
    const total = radii.reduce((s, r) => s + 2 * r, 0) + gap * (radii.length - 1);
    const k = Math.min(1, (W - 40) / (total * u));
    let x = W / 2 - total * u * k / 2;
    radii.forEach((r, i) => { const rr = r * u * k; field.addRing(x + rr, H / 2, rr, 0.7 + i * 0.03); x += 2 * rr + gap * u * k; });
  } },
  // Up to fourteen random rings that do not overlap.
  crowd: { label: 'A crowd', build(field, W, H, random = Math.random) {
    const { u } = field, placed = [];
    for (let tries = 0; placed.length < 14 && tries < 600; tries++) {
      const r = (18 + random() * 52) * u, x = r + 12 + random() * (W - 2 * r - 24), y = r + 64 + random() * (H - 2 * r - 140);
      if (placed.every(p => Math.hypot(p.x - x, p.y - y) > p.r + r + 6)) { placed.push({ x, y, r }); field.addRing(x, y, r, random()); }
    }
  } },
};

export function loadSetup(field, name, W, H, random) {
  const setup = SETUPS[name];
  if (!setup) throw Error(`unknown setup ${name}`);
  field.clear();
  setup.build(field, W, H, random);
}
