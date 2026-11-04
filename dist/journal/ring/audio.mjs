// Two tones, the archived page's six-harmonic timbre. Sound starts only when asked.
export class JournalAudio {
  constructor(onStop) { this.onStop = onStop; this.generation = 0; this.edge = -1; }
  async start() {
    this.stop(); const generation = this.generation;
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) throw Error('Web Audio is unavailable. The silent experiment still works.');
    const ctx = this.ctx = new Audio();
    try {
      await ctx.resume();
      if (generation !== this.generation) return false;
      if (ctx.state !== 'running') throw Error('Sound paused while loading. Enable sound to try again.');
      const real = new Float32Array(7), imag = new Float32Array(7);
      for (let k = 1; k <= 6; k++) imag[k] = 0.88 ** (k - 1);
      const wave = ctx.createPeriodicWave(real, imag);
      this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
      this.voices = [0.5, 0.42].map(level => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.setPeriodicWave(wave); osc.frequency.value = 220; gain.gain.value = level;
        osc.connect(gain); gain.connect(this.master); osc.start();
        return { osc, gain };
      });
      ctx.onstatechange = () => { if (ctx.state !== 'running') this.stop('Sound paused. Enable sound to resume.'); };
      this.master.gain.setTargetAtTime(0.35, ctx.currentTime, 0.06);
      this.edge = -1;
      return true;
    } catch (error) { if (generation !== this.generation) return false; this.stop(); throw error; }
  }
  get playing() { return !!this.voices; }
  // A new fifth jumps to its pitches; the same fifth glides as the ring retunes.
  set(edge, [lower, upper]) {
    if (!this.voices) return;
    const now = this.ctx.currentTime, jump = edge !== this.edge; this.edge = edge;
    [lower, upper].forEach((f, i) => {
      const p = this.voices[i].osc.frequency;
      if (jump) { p.cancelScheduledValues(now); p.setValueAtTime(f, now); } else p.setTargetAtTime(f, now, 0.015);
    });
  }
  stop(message) {
    this.generation++;
    const ctx = this.ctx; this.ctx = null;
    if (ctx) ctx.onstatechange = null;
    for (const v of this.voices || []) { try { v.osc.stop(); } catch {} v.osc.disconnect(); v.gain.disconnect(); }
    this.voices = null; this.master?.disconnect(); this.master = null;
    ctx?.close().catch(() => {});
    if (message) this.onStop(message);
  }
}
