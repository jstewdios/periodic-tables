// Odd Sympathy sound: one plucked voice per ring fire, scheduled on the audio clock.
// The voice, reverb and limiter are the original prototype's; this module adds the
// collection's lifecycle rules (gesture-only start, visible retry, background
// suspension without automatic recovery, and a full close on navigation).

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const MAX_VOICES = 42;

export class Sound {
  constructor(onStatus = () => {}) {
    this.onStatus = onStatus;
    this.ctx = null; this.master = null; this.comp = null; this.out = null; this.wet = null; this.conv = null; this.wave = null;
    this.voices = 0; this.muted = false; this.wantsSound = false; this.generation = 0;
    this.promise = null; this.status = 'idle';
  }
  get running() { return !!this.ctx && this.ctx.state === 'running' && this.status === 'running'; }

  // Must be called from a user gesture. Resolves once sound is running or has failed visibly.
  async start() {
    this.wantsSound = true;
    const generation = ++this.generation;
    if (this.ctx) {
      const ctx = this.ctx;
      this.setStatus('starting');
      try { if (ctx.state !== 'running') await ctx.resume(); }
      catch (error) {
        if (ctx !== this.ctx) return;
        this.dispose(); this.fail('Sound could not resume. Choose “Try sound again” to restart it.'); throw error;
      }
      if (ctx !== this.ctx) return;
      if (!this.wantsSound || generation !== this.generation) { await ctx.suspend(); this.emitStatus(); return; }
      this.setGain(); this.emitStatus(); return;
    }
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) {
      const error = new Error('This browser does not support Web Audio. The rings still play silently; try a recent Chrome, Firefox, or Safari for sound.');
      this.wantsSound = false; this.fail(error.message); throw error;
    }
    let ctx;
    try { ctx = new Audio({ latencyHint: 'interactive' }); }
    catch (error) { this.wantsSound = false; this.fail('Sound could not start in this browser. Choose “Try sound again” to retry.'); throw error; }
    this.ctx = ctx;
    // Resume synchronously inside the gesture, before anything else can await.
    const resumed = ctx.resume();
    this.setStatus('starting');
    this.promise = (async () => {
      try {
        this.build(ctx);
        await resumed;
        if (ctx !== this.ctx) return;
        ctx.onstatechange = () => {
          if (ctx !== this.ctx) return;
          if (ctx.state !== 'running') { this.wantsSound = false; this.setGain(); }
          // An interruption must not restore sound until another user gesture.
          if (ctx.state === 'running' && !this.wantsSound) ctx.suspend().catch(() => {});
          this.emitStatus();
        };
        if (!this.wantsSound || generation !== this.generation) { this.wantsSound = false; await ctx.suspend(); }
        else this.setGain();
        this.emitStatus();
      } catch (error) {
        if (ctx !== this.ctx) return;
        this.dispose(); this.fail(error?.message || 'Sound could not start. Choose “Try sound again” to retry.');
        throw error;
      } finally { if (ctx === this.ctx) this.promise = null; }
    })();
    return this.promise;
  }

  // The original prototype's signal chain: voices -> master -> limiter, plus a
  // shared noise-burst reverb fed from every voice.
  build(ctx) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.25;
    const out = ctx.createGain(); out.gain.value = 0; // mute and lifecycle gate, after the limiter
    const master = ctx.createGain(); master.gain.value = 0.85;
    master.connect(comp); comp.connect(out); out.connect(ctx.destination);
    const conv = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.6), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4); }
    conv.buffer = buf;
    const wet = ctx.createGain(); wet.gain.value = 0.3; wet.connect(conv); conv.connect(master);
    const real = new Float32Array([0, 1, 0.42, 0.2, 0.1, 0.05, 0.025]);
    this.wave = ctx.createPeriodicWave(real, new Float32Array(real.length));
    Object.assign(this, { comp, out, master, conv, wet });
  }

  // t is an audio-clock time. pan is -0.8..0.8. Silently skipped unless sound is running.
  pluck(t, f, pan, accent) {
    const ac = this.ctx;
    if (!this.running || this.muted || this.voices >= MAX_VOICES || !(f > 0)) return false;
    t = Math.max(t, ac.currentTime + 0.002);
    const amp = (0.13 + 0.2 * accent) * Math.min(1.9, Math.pow(260 / f, 0.35));
    const dec = clamp(1.5 * Math.pow(220 / f, 0.6), 0.35, 3.2);
    const o = ac.createOscillator(); o.setPeriodicWave(this.wave); o.frequency.value = f;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(Math.min(f * (6 + 6 * accent), 14000), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.4, 160), t + dec * 0.7);
    const gn = ac.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(amp, t + 0.004);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    o.connect(lp); lp.connect(gn);
    let out = gn;
    if (ac.createStereoPanner) { const pn = ac.createStereoPanner(); pn.pan.value = clamp(pan, -0.8, 0.8); gn.connect(pn); out = pn; }
    out.connect(this.master); out.connect(this.wet);
    o.start(t); o.stop(t + dec + 0.05);
    this.voices++;
    o.onended = () => { this.voices = Math.max(0, this.voices - 1); try { o.disconnect(); lp.disconnect(); gn.disconnect(); if (out !== gn) out.disconnect(); } catch {} };
    return true;
  }

  setGain() {
    if (!this.out || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(this.muted || !this.wantsSound ? 0 : 1, t, 0.012);
  }
  setMuted(value) { this.muted = !!value; this.setGain(); }

  async suspend() {
    this.generation++; this.wantsSound = false; this.setGain();
    if (this.ctx && this.ctx.state !== 'closed') { try { await this.ctx.suspend(); } catch {} }
    this.emitStatus();
  }

  dispose() {
    this.generation++; this.wantsSound = false;
    const ctx = this.ctx;
    if (ctx) ctx.onstatechange = null;
    for (const node of [this.out, this.comp, this.master, this.wet, this.conv]) { try { node?.disconnect(); } catch {} }
    this.ctx = null; this.out = this.comp = this.master = this.wet = this.conv = this.wave = null;
    this.voices = 0; this.promise = null;
    this.setStatus('idle');
    ctx?.close().catch(() => {});
  }

  emitStatus() {
    if (this.status === 'error' && !this.ctx) return;
    this.setStatus(this.ctx && this.ctx.state === 'running' && this.wantsSound ? 'running' : this.ctx ? 'paused' : 'idle');
  }
  setStatus(status, error) { this.status = status; this.onStatus(status, error); }
  fail(message) { this.status = 'error'; this.onStatus('error', message); }
}
