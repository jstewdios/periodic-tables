/* The Ring That Will Not Close — simulation core (Round 4)
 *
 * Twelve voices on a ring. Each voice is told: be a pure fifth (3:2, 701.955 cents)
 * above the voice to your left. Around the ring that demand overshoots the octave by the
 * Pythagorean comma c = 23.46 cents, so the twelve errors eps_i always sum to -c (+1200k).
 *
 * The only rules implemented here:
 *   eps_i      = wrap(theta_{i+1} - theta_i - DELTA)                 error on edge i (cents)
 *   theta_i'   = R * [ (1-lambda) * g_i * F(eps_i)  -  lambda * g_{i-1} * F(eps_{i-1}) ]
 *                 F = D' for the chosen discomfort curve D
 *                 lambda = 1: each voice follows its left neighbour (one-way)
 *                 lambda = 1/2: mutual (gradient descent on sum D(eps_i))
 *                 lambda = 0: each voice follows its right neighbour
 *                 g_i = 1 normally; in tuner mode g_i = gateRate on the sounding edge and 0 elsewhere
 *   pinned voices do not move; optional tiny noise (disclosed, adjustable, can be zero)
 * Nothing else. No special cases.
 */
(function (root) {
  'use strict';
  const N = 12;
  const DELTA = 1200 * Math.log2(1.5);          // 701.955 cents
  const C = N * DELTA - 7 * 1200;               // 23.460 cents
  const SUBDT = 0.004;                           // integration sub-step (s)

  function wrap(x) {                             // into (-600, 600]
    let y = ((x + 600) % 1200 + 1200) % 1200 - 600;
    return y === -600 ? 600 : y;
  }

  function errors(theta, out) {
    out = out || new Float64Array(N);
    for (let i = 0; i < N; i++) out[i] = wrap(theta[(i + 1) % N] - theta[i] - DELTA);
    return out;
  }

  /* ---------- discomfort curves ---------- */

  // Quadratic: D = eps^2/2, F = eps (cents). Convex: spreads the comma.
  function makeQuadratic() {
    return {
      kind: 'quadratic',
      label: 'Quadratic',
      D: (e) => 0.5 * e * e,
      F: (e) => e,
      range: 600
    };
  }

  // Sethares sensory roughness of the actual dyad (two tones with nh harmonics, amplitudes
  // decay^(k-1)), as a function of the fifth's mistuning eps, computed for a lower voice at
  // frequency f0 (we use the middle of the sounding octave). The curve is tabulated on a
  // 0.25-cent grid over the whole sector (-600, 600], lightly smoothed (sigma 0.5 cents) so the
  // V-shaped cusp at the pure fifth has finite stiffness, and its derivative F is normalised so
  // that max |F| within +-60 cents equals FNORM. Parameters after Sethares (1993), from memory.
  function makeRoughness(f0, opts) {
    opts = opts || {};
    const nh = opts.harmonics || 6, decay = opts.decay == null ? 0.88 : opts.decay;
    const step = 0.25, sigma = opts.sigma == null ? 0.5 : opts.sigma, FNORM = opts.fnorm || 12;
    const M = Math.round(1200 / step);          // grid points over (-600, 600]
    const eps = new Float64Array(M), raw = new Float64Array(M);
    const amps = [], freqs = [];
    for (let k = 1; k <= nh; k++) amps.push(Math.pow(decay, k - 1));
    const pair = (f1, f2, a1, a2) => {
      if (f2 < f1) { const t = f1; f1 = f2; f2 = t; const u = a1; a1 = a2; a2 = u; }
      const s = 0.24 / (0.021 * f1 + 19), x = s * (f2 - f1);
      return Math.min(a1, a2) * (Math.exp(-3.5 * x) - Math.exp(-5.75 * x));
    };
    for (let m = 0; m < M; m++) {
      const e = -600 + step * (m + 1);           // (-600, 600]
      eps[m] = e;
      const fh = f0 * Math.pow(2, (DELTA + e) / 1200);
      let tot = 0;
      for (let k = 1; k <= nh; k++) for (let j = 1; j <= nh; j++) tot += pair(f0 * k, fh * j, amps[k - 1], amps[j - 1]);
      raw[m] = tot;
    }
    // Gaussian smoothing (circular in eps, since the sector is a circle)
    const rad = Math.ceil(3 * sigma / step), ker = [];
    let ksum = 0;
    for (let r = -rad; r <= rad; r++) { const w = Math.exp(-0.5 * (r * step / sigma) ** 2); ker.push(w); ksum += w; }
    const D = new Float64Array(M);
    for (let m = 0; m < M; m++) {
      let acc = 0;
      for (let r = -rad; r <= rad; r++) acc += ker[r + rad] * raw[(m + r + M) % M];
      D[m] = acc / ksum;
    }
    const d0 = D[Math.round(600 / step) - 1];   // value at eps = 0
    for (let m = 0; m < M; m++) D[m] -= d0;
    // derivative (central, circular) and normalisation
    const F = new Float64Array(M);
    for (let m = 0; m < M; m++) F[m] = (D[(m + 1) % M] - D[(m - 1 + M) % M]) / (2 * step);
    let fmax = 0;
    for (let m = 0; m < M; m++) if (Math.abs(eps[m]) <= 60 && Math.abs(F[m]) > fmax) fmax = Math.abs(F[m]);
    const scale = FNORM / fmax;
    for (let m = 0; m < M; m++) { F[m] *= scale; D[m] *= scale; }
    const lookup = (tab, e) => {
      const x = (wrap(e) + 600) / step - 1;      // fractional index
      const i0 = Math.floor(x), fr = x - i0;
      const a = tab[(i0 % M + M) % M], b = tab[((i0 + 1) % M + M) % M];
      return a + (b - a) * fr;
    };
    return {
      kind: 'roughness',
      label: 'Roughness (Sethares, this timbre at ' + Math.round(f0) + ' Hz)',
      D: (e) => lookup(D, e),
      F: (e) => lookup(F, e),
      table: { eps, D, F },
      f0, range: 600
    };
  }

  /* ---------- state & dynamics ---------- */

  function thetaFromErrors(epsArr) {             // theta_0 = 0, then cumulative
    const th = new Float64Array(N);
    for (let i = 1; i < N; i++) th[i] = th[i - 1] + DELTA + epsArr[i - 1];
    return th;
  }
  function presetET() { const e = new Float64Array(N).fill(-C / N); return thetaFromErrors(e); }
  function presetWolf(edge) { const e = new Float64Array(N); e[((edge % N) + N) % N] = -C; return thetaFromErrors(e); }
  function presetSplit(e1, e2) { const e = new Float64Array(N); e[e1] = -C / 2; e[e2] = -C / 2; return thetaFromErrors(e); }
  function presetScatter(rand) {                 // random all-negative allocation summing to -C
    const w = new Float64Array(N); let s = 0;
    for (let i = 0; i < N; i++) { w[i] = -Math.log(1 - rand()); s += w[i]; }
    const e = new Float64Array(N);
    for (let i = 0; i < N; i++) e[i] = -C * w[i] / s;
    return thetaFromErrors(e);
  }

  function gaussian(rand) {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // One integration step of length dt (s). params:
  //   cost (from makeQuadratic / makeRoughness), lambda in [0,1], rate R (per s),
  //   gate: null or {edges:[...], rate}, pinned: Uint8Array(12) or null, noise (cents/sqrt s), rand()
  const _eps = new Float64Array(N), _Fe = new Float64Array(N), _g = new Float64Array(N), _v = new Float64Array(N);
  function step(theta, params, dt) {
    const cost = params.cost, lam = params.lambda, R = params.rate;
    const nsub = Math.max(1, Math.ceil(dt / SUBDT)), h = dt / nsub;
    const pinned = params.pinned, noise = params.noise || 0, rand = params.rand || Math.random;
    for (let i = 0; i < N; i++) _g[i] = 1;
    if (params.gate) {
      for (let i = 0; i < N; i++) _g[i] = 0;
      for (const w of params.gate.edges) _g[((w % N) + N) % N] = params.gate.rate;
    }
    for (let s = 0; s < nsub; s++) {
      errors(theta, _eps);
      for (let i = 0; i < N; i++) _Fe[i] = _g[i] * cost.F(_eps[i]);
      for (let i = 0; i < N; i++) {
        const im = (i + N - 1) % N;
        _v[i] = R * ((1 - lam) * _Fe[i] - lam * _Fe[im]);
      }
      for (let i = 0; i < N; i++) {
        if (pinned && pinned[i]) continue;
        let d = _v[i] * h;
        if (d > 2) d = 2; else if (d < -2) d = -2;          // cap: 2 cents per sub-step
        theta[i] += d;
        if (noise > 0) theta[i] += noise * Math.sqrt(h) * gaussian(rand);
      }
    }
  }

  function metrics(theta, cost) {
    const e = errors(theta);
    let sum = 0, total = 0, wolf = 0, meanPitch = 0;
    for (let i = 0; i < N; i++) { sum += e[i]; total += cost.D(e[i]); if (Math.abs(e[i]) > Math.abs(e[wolf])) wolf = i; meanPitch += theta[i]; }
    return { eps: e, sum, cost: total, wolfEdge: wolf, wolfDepth: e[wolf], meanPitch: meanPitch / N };
  }

  // Deterministic PRNG for tests (mulberry32)
  function makeRand(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const api = { N, DELTA, C, wrap, errors, makeQuadratic, makeRoughness, thetaFromErrors,
    presetET, presetWolf, presetSplit, presetScatter, step, metrics, makeRand };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RingCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
