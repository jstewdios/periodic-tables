// Odd Sympathy: the field of ring clocks.
//
// This is the simulation from the October 16, 2026 prototype, moved out of its
// single page so it can be tested and reused. The arithmetic and its order are
// unchanged; tests/odd-sympathy/model.test.mjs replays the preserved original
// (docs/ODD_SYMPATHY_ORIGINAL.html) beside this module and requires identical
// fire times. Nothing here touches the DOM or Web Audio.
//
// The three rules:
// 1. Bead speed is shared, so ring size sets the period; pitch is firing rate x 256.
// 2. Ripples leave the rim and travel slowly, fading to nothing at RANGE.
// 3. A ripple tugs the bead toward the top along the shorter way.

export const DEFAULTS = Object.freeze({ v: 360, c: 240, range: 500, eps: 0.22 });
export const PITCH_SCALE = 256; // a ring firing once a second sounds at 256 Hz
export const MAX_PULSES = 500;
export const MAX_THREADS = 120;
export const THREAD_WINDOW = 0.025; // two rings striking within 25 ms draw a sympathy thread

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export class Field {
  constructor({ u = 1, eps = DEFAULTS.eps, onFire = () => {}, onLock = () => {} } = {}) {
    // u scales every length so the same rules fit a phone or a desk display.
    this.u = u;
    this.P = { v: DEFAULTS.v, c: DEFAULTS.c, range: DEFAULTS.range, eps };
    this.rings = []; this.pulses = []; this.threads = [];
    this.nextId = 1; this.t = 0;
    this.onFire = onFire; this.onLock = onLock;
  }

  period(r) { return 2 * Math.PI * r.r / (this.P.v * this.u); }
  natFreq(r) { return PITCH_SCALE / this.period(r); }
  // Pitch follows the rhythm the ring actually keeps, so locked intervals stay in tune.
  freq(r) { return this.natFreq(r) * r.corr; }
  live() { return this.rings.filter(r => !r.dying); }

  addRing(x, y, r, phi = 0) {
    const ring = { id: this.nextId++, x, y, r, phi, lastFire: -9, accent: 0, tugT: -9, tugFrom: 0, tugTo: 0,
      born: this.t, dying: false, dieT: 0, emaAct: null, emaNat: null, corr: 1 };
    this.rings.push(ring);
    return ring;
  }

  // When (and how strongly) a ripple's front reaches another ring's rim.
  arrival(p, r) {
    const { P, u } = this;
    if (r.id === p.src || r.dying || p.hit.has(r.id)) return null;
    const gap = Math.max(0, Math.hypot(r.x - p.x, r.y - p.y) - p.r0 - r.r);
    if (gap > P.range * u) return null;
    return { t: p.t0 + gap / (P.c * u), s: 1 - gap / (P.range * u) };
  }

  fire(r, accent, ev, T) {
    // Track the rhythm the ring really keeps against the one its size implies.
    if (r.lastFire > -1) {
      const act = this.t - r.lastFire, nat = this.period(r);
      if (act > 0.02) {
        r.emaAct = r.emaAct === null ? act : r.emaAct + 0.2 * (act - r.emaAct);
        r.emaNat = r.emaNat === null ? nat : r.emaNat + 0.2 * (nat - r.emaNat);
        r.corr = clamp(r.emaNat / r.emaAct, 0.85, 1.18);
      }
    }
    r.phi = 0; r.lastFire = this.t; r.accent = accent;
    this.onFire(r, this.t, this.freq(r), accent);
    const p = { x: r.x, y: r.y, r0: r.r, t0: this.t, src: r.id, hit: new Set(), f: this.freq(r) };
    this.pulses.push(p);
    if (ev) {
      for (const o of this.rings) { const a = this.arrival(p, o); if (a && a.t <= T) ev.push({ t: Math.max(a.t, this.t), p, r: o, s: a.s }); }
      ev.sort((a, b) => a.t - b.t);
    }
    for (const o of this.rings) {
      if (o !== r && !o.dying && this.t - o.lastFire < THREAD_WINDOW) { this.threads.push({ a: r, b: o, t: this.t }); this.onLock(r, o); }
    }
    if (this.pulses.length > MAX_PULSES) this.pulses.shift();
    if (this.threads.length > MAX_THREADS) this.threads.shift();
  }

  apply(e, ev, T) {
    const { p, r, s } = e;
    if (p.hit.has(r.id) || r.dying) return;
    p.hit.add(r.id);
    const phi = r.phi;
    // Phase response: pulled back early in the lap, pushed forward late; barely moved just after firing.
    const n = phi + this.P.eps * s * phi * (2 * phi - 1);
    r.tugT = this.t; r.tugFrom = phi; r.tugTo = Math.min(n, 1);
    if (n >= 1) this.fire(r, 0.35 + 0.65 * s, ev, T);
    else r.phi = Math.max(0, n);
  }

  // Event-driven: jump from one fire or ripple contact to the next until time T.
  advance(T) {
    const ev = [];
    for (const p of this.pulses) for (const r of this.rings) {
      const a = this.arrival(p, r);
      if (a && a.t <= T) ev.push({ t: Math.max(a.t, this.t), p, r, s: a.s });
    }
    ev.sort((a, b) => a.t - b.t);
    for (let guard = 0; guard < 20000; guard++) {
      let rf = null, tf = Infinity;
      for (const r of this.rings) {
        if (r.dying) continue;
        const t = this.t + Math.max(0, 1 - r.phi) * this.period(r);
        if (t < tf) { tf = t; rf = r; }
      }
      while (ev.length && (ev[0].p.hit.has(ev[0].r.id) || ev[0].r.dying)) ev.shift();
      const te = ev.length ? ev[0].t : Infinity;
      const tn = Math.min(tf, te);
      if (tn > T) { this.step(T - this.t); this.t = T; break; }
      this.step(tn - this.t); this.t = tn;
      if (tf <= te) this.fire(rf, 0, ev, T); else this.apply(ev.shift(), ev, T);
    }
  }

  step(dt) { if (dt <= 0) return; for (const r of this.rings) if (!r.dying) r.phi += dt / this.period(r); }

  // Player actions. A strike is an immediate fire at full accent.
  strike(r, accent = 1) { if (!r.dying) this.fire(r, accent); }
  remove(r) { r.dying = true; r.dieT = this.t; }
  prune(after = 0.4) {
    for (let i = this.rings.length - 1; i >= 0; i--) if (this.rings[i].dying && this.t - this.rings[i].dieT > after) this.rings.splice(i, 1);
  }
  clear() { this.rings.length = 0; this.pulses.length = 0; this.threads.length = 0; }
}
