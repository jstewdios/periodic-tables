import './ring-core.js';
const RC = globalThis.RingCore;
export const { N, DELTA, C } = RC;
export const VERSION = 'ring-journal-1';
export const DT = 1 / 60;            // the same step the archived checks use
export const DURATION = 40;          // seconds, as in check T1
export const STEPS = Math.round(DURATION / DT);
export const PUSH = { voice: 3, cents: 20 };
export const REGISTER = 220;         // A3, the archived page's default octave
export const DWELL = 2;              // seconds the listening window stays on each fifth
export const CURVES = {
  roughness: RC.makeRoughness(REGISTER * Math.SQRT2),
  quadratic: RC.makeQuadratic()
};
const pc = x => ((x % 1200) + 1200) % 1200;
// A configured presentation of the archived ring core, not a second set of equations.
export class Experiment {
  constructor(curve = 'roughness') { this.reset(curve); }
  reset(curve = this.curve, pushed = false) {
    this.curve = curve in CURVES ? curve : 'roughness';
    this.theta = RC.presetET();
    this.steps = 0; this.pushes = 0; this.running = false;
    if (pushed) this.push();
  }
  push() { this.theta[PUSH.voice] += PUSH.cents; this.pushes++; }
  params() {
    // Mutual listening, speed 1, no tuner gate, no pins, no noise: the conditions of check T1.
    return { cost: CURVES[this.curve], lambda: 0.5, rate: 1, gate: null, pinned: null, noise: 0, rand: RC.makeRand(1) };
  }
  run(value) { this.running = !!value && this.steps < STEPS; }
  get time() { return this.steps * DT; }
  get finished() { return this.steps >= STEPS; }
  step() {
    if (!this.running) return;
    RC.step(this.theta, this.params(), DT);
    this.steps++;
    if (this.steps >= STEPS) this.running = false;
  }
  // The two tones the window plays for fifth w: voice w in the A3 octave, and a fifth above it
  // mistuned by that edge's error. Same arithmetic as the archived page.
  dyad(w) {
    const e = RC.errors(this.theta)[w], lower = REGISTER * 2 ** (pc(this.theta[w]) / 1200);
    return [lower, lower * 2 ** ((DELTA + e) / 1200)];
  }
  snapshot() {
    const m = RC.metrics(this.theta, CURVES[this.curve]);
    return { version: VERSION, curve: this.curve, time: this.time, running: this.running, finished: this.finished,
      pushes: this.pushes, eps: Array.from(m.eps), sum: m.sum, wolfEdge: m.wolfEdge, wolfDepth: m.wolfDepth };
  }
}
// The listening window walks the ring one fifth at a time. It only chooses what is heard;
// it never changes the dynamics.
export class ListeningWindow {
  constructor() { this.edge = 0; this.t = 0; }
  advance(dt) { this.t += dt; while (this.t >= DWELL) { this.t -= DWELL; this.edge = (this.edge + 1) % N; } }
  reset() { this.edge = 0; this.t = 0; }
}
