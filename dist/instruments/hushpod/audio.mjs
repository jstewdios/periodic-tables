export class Sound {
  constructor(onState, onStatus) {
    this.onState = onState; this.onStatus = onStatus;
    this.ctx = null; this.node = null; this.gain = null;
    this.promise = null; this.queue = []; this.pendingControls = null; this.volume = .55; this.muted = false;
    this.ready = false; this.resetTimer = null; this.status = 'idle';
    this.wantsSound = false; this.generation = 0;
  }
  async start() {
    this.wantsSound = true;
    const generation = this.generation;
    if (this.ready) {
      const ctx = this.ctx;
      try { if (ctx.state !== 'running') await ctx.resume(); }
      catch (error) {
        if (ctx !== this.ctx) return;
        this.dispose(); this.status = 'error'; this.onStatus('error', 'Sound could not resume. Choose “Try sound again” to restart it.'); throw error;
      }
      if (ctx !== this.ctx) return;
      if (!this.wantsSound) { await ctx.suspend(); this.emitStatus(); return; }
      this.setGain(); this.emitStatus(); return;
    }
    if (this.promise) return this.promise;
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) {
      const error = new Error('This browser does not support Web Audio. Try a recent Chrome, Firefox, or Safari.');
      this.wantsSound = false; this.status = 'error'; this.onStatus('error', error.message); throw error;
    }
    this.ctx ??= new Audio({ latencyHint: 'interactive' });
    const ctx = this.ctx;
    // Resume synchronously in the user gesture, before fetching the worklet module.
    const resumed = ctx.resume();
    this.status = 'starting'; this.onStatus('starting');
    this.promise = (async () => {
      try {
        if (!ctx.audioWorklet) { await resumed; throw new Error('Audio needs HTTPS or localhost and AudioWorklet support. Open this page over HTTPS in a current browser.'); }
        await Promise.all([resumed, ctx.audioWorklet.addModule(new URL('./worklet.mjs', import.meta.url))]);
        // Navigation may close this context while the module is still loading.
        if (ctx !== this.ctx) return;
        this.node = new AudioWorkletNode(ctx, 'hushpod-processor', {
          numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2],
        });
        this.gain = this.ctx.createGain(); this.gain.gain.value = 0;
        this.node.port.onmessage = ({data}) => { if (data.type === 'state') this.onState(data); };
        this.node.onprocessorerror = () => {
          this.dispose();
          this.status = 'error'; this.onStatus('error', 'The sound engine was interrupted. Choose “Try sound again” to restart it.');
        };
        this.node.connect(this.gain); this.gain.connect(this.ctx.destination);
        this.ready = true;
        this.ctx.onstatechange = () => {
          if (ctx.state !== 'running') { this.wantsSound = false; this.release(); this.setGain(); }
          // An interruption must not restore sound until another user gesture.
          if (ctx.state === 'running' && !this.wantsSound) ctx.suspend().catch(()=>{});
          this.emitStatus();
        };
        if (this.pendingControls) this.node.port.postMessage(this.pendingControls);
        if (!this.wantsSound || generation !== this.generation) {
          this.wantsSound = false; this.queue = []; await ctx.suspend();
        } else {
          this.setGain();
          for (const data of this.queue.splice(0)) this.node.port.postMessage(data);
        }
        this.emitStatus();
      } catch (error) {
        if (ctx !== this.ctx) return;
        this.dispose(); this.status = 'error';
        this.onStatus('error', error.message); throw error;
      }
    })();
    return this.promise;
  }
  emitStatus() {
    if (this.status === 'error' && this.ready) return;
    this.status = this.ready && this.ctx.state === 'running' ? 'running' : this.ready ? 'paused' : this.status;
    this.onStatus(this.status);
  }
  setGain() {
    if (!this.gain) return;
    const t = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setTargetAtTime(this.muted || !this.wantsSound ? 0 : this.volume, t, .018);
  }
  send(data) {
    if (data.type === 'controls') this.pendingControls = data;
    if (this.node && this.ready) this.node.port.postMessage(data);
    else if (data.type === 'tap' && this.wantsSound && this.queue.length < 12) this.queue.push(data);
  }
  reset() {
    this.release();
    if (!this.ready) return;
    clearTimeout(this.resetTimer);
    const t = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(t); this.gain.gain.setTargetAtTime(0, t, .006);
    this.send({type:'release'});
    this.resetTimer = setTimeout(() => { this.resetTimer = null; this.send({type:'reset'}); this.setGain(); }, 45);
  }
  async suspend() {
    this.generation++; this.wantsSound = false; this.release(); this.setGain();
    if (this.ctx && this.ctx.state !== 'closed') await this.ctx.suspend();
    this.emitStatus();
  }
  release() {
    // A reset requested just before suspension must still clear the model.
    if (this.resetTimer !== null) this.node?.port.postMessage({type:'reset'});
    clearTimeout(this.resetTimer); this.resetTimer = null; this.queue = [];
    if (this.pendingControls) this.pendingControls = {...this.pendingControls, rub:[0,0,0], hold:[0,0,0]};
    this.node?.port.postMessage({type:'release'});
  }
  dispose() {
    this.generation++; this.wantsSound = false; this.release();
    const ctx = this.ctx;
    if (ctx) ctx.onstatechange = null;
    if (this.node) { this.node.onprocessorerror = null; this.node.port.onmessage = null; this.node.port.close(); this.node.disconnect(); }
    this.gain?.disconnect();
    this.ctx = null; this.node = null; this.gain = null; this.promise = null; this.ready = false;
    this.status = 'idle'; this.onStatus('idle');
    ctx?.close().catch(()=>{});
  }
}
