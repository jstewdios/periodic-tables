import { Pod, MATERIAL } from '../../instruments/hushpod/model.mjs';
export const VERSION = 'hushpod-journal-1';
export const DT = 1 / 4000;
export const DURATION = 12;
export const INITIAL_ACTION = 0.5;
// A configured presentation, not a second set of equations.
export class Experiment {
  constructor() { this.reset(); }
  reset(degrees = 180) {
    this.pod = new Pod();
    const phase = Math.max(0, Math.min(180, degrees)) * Math.PI / 180;
    this.pod.z.set([.5, 0, 0, 0, .5 * Math.cos(phase), .5 * Math.sin(phase)]);
    this.pod.injected = INITIAL_ACTION;
    this.running = false;
  }
  restore(s) {
    this.pod.z.set(s.z); this.pod.aperture.set(s.aperture); this.pod.target.set(s.target);
    this.pod.time = s.time; this.pod.injected = s.injected; this.pod.lost = s.lost;
    this.running = s.running;
  }
  command(d) {
    if (d.type === 'reset') this.reset(d.degrees);
    if (d.type === 'run') this.running = d.value && this.pod.time < DURATION;
    if (d.type === 'waist') this.pod.waist(0, d.value);
    if (d.type === 'restore') this.restore(d.state);
  }
  step() {
    if (!this.running) return;
    this.pod.step(DT);
    if (this.pod.time >= DURATION - DT / 2) this.running = false;
  }
  snapshot() {
    const s = this.pod.snapshot(), w = MATERIAL.middleWeight;
    const pickup = [s.z[0] + w*s.z[2] + s.z[4], s.z[1] + w*s.z[3] + s.z[5]];
    return { ...s, pickup, P: pickup[0]**2 + pickup[1]**2,
      target: Array.from(this.pod.target), running: this.running };
  }
}
