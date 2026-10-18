import { Pod } from './model.mjs';

class HushpodProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pod = new Pod();
    this.previous = new Float64Array(6);
    this.next = new Float64Array(6);
    this.clock = 0;
    this.dt = 1 / 4000;
    this.phase = 0;
    this.phaseStep = 2 * Math.PI * this.pod.material.frequency / sampleRate;
    this.sinceContact = Infinity;
    this.reportClock = 0;
    this.sampleCount = 0;
    this.sumSquares = 0;
    this.peak = 0;
    this.port.onmessage = ({ data: d }) => {
      if (d.type === 'controls') {
        this.pod.contact(d.rub, d.hold);
        this.pod.waist(0, d.waists?.[0]); this.pod.waist(1, d.waists?.[1]);
        this.sinceContact = 0;
      } else if (d.type === 'tap') {
        this.pod.impulse(d.pocket, d.strength ?? 1, this.phase);
        this.previous.set(this.pod.z); this.next.set(this.pod.z);
      } else if (d.type === 'release') {
        this.pod.release(); this.sinceContact = Infinity;
      } else if (d.type === 'reset') {
        this.pod.clear(); this.previous.fill(0); this.next.fill(0);
      }
    };
  }
  process(_inputs, outputs) {
    const channels = outputs[0];
    if (!channels?.length) return true;
    const left = channels[0], right = channels[1];
    const sampleTime = 1 / sampleRate, w = this.pod.material.middleWeight;
    for (let s = 0; s < left.length; s++) {
      if (this.clock <= 0) {
        this.previous.set(this.next);
        if (this.sinceContact > 0.35) this.pod.release();
        this.pod.step(this.dt);
        this.next.set(this.pod.z);
        this.clock += this.dt;
        this.sinceContact += this.dt;
      }
      const t = 1 - this.clock / this.dt;
      const pr = this.previous[0] + w*this.previous[2] + this.previous[4];
      const pi = this.previous[1] + w*this.previous[3] + this.previous[5];
      const nr = this.next[0] + w*this.next[2] + this.next[4];
      const ni = this.next[1] + w*this.next[3] + this.next[5];
      const real = pr + (nr-pr)*t, imag = pi + (ni-pi)*t;
      const pickup = real*Math.cos(this.phase) + imag*Math.sin(this.phase);
      // A fixed post-pickup soft saturation. Zero stays zero; no AGC or extra voices.
      const value = 0.78 * Math.tanh(1.4 * pickup);
      left[s] = value;
      if (right) right[s] = value;
      this.phase += this.phaseStep;
      if (this.phase >= Math.PI * 2) this.phase -= Math.PI * 2;
      this.clock -= sampleTime;
      this.sumSquares += value*value; this.peak = Math.max(this.peak, Math.abs(value)); this.sampleCount++;
    }
    this.reportClock += left.length / sampleRate;
    if (this.reportClock >= 1/30) {
      this.port.postMessage({ type: 'state', ...this.pod.snapshot(), rms: Math.sqrt(this.sumSquares / this.sampleCount), peak: this.peak });
      this.reportClock = 0; this.sumSquares = 0; this.peak = 0; this.sampleCount = 0;
    }
    return true;
  }
}
registerProcessor('hushpod-processor', HushpodProcessor);
