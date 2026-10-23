// One authority at a time: the worklet when listening, main-thread Pod otherwise.
export class JournalAudio {
  constructor(onState, onStop) { this.onState=onState; this.onStop=onStop; this.generation=0; }
  async start(state) {
    this.stop(); const generation=this.generation;
    const Audio=globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) throw Error('Web Audio is unavailable. The silent experiment still works.');
    const ctx=this.ctx=new Audio();
    try {
      const resumed=ctx.resume();
      if (!ctx.audioWorklet) { await resumed; throw Error('Sound needs HTTPS or localhost and AudioWorklet support.'); }
      await Promise.all([resumed,ctx.audioWorklet.addModule(new URL('./worklet.mjs',import.meta.url))]);
      if (generation!==this.generation) return false;
      const node=this.node=new AudioWorkletNode(ctx,'hushpod-journal',{outputChannelCount:[2]});
      this.gain=ctx.createGain(); this.gain.gain.value=0;
      node.connect(this.gain); this.gain.connect(ctx.destination);
      node.port.onmessage=({data})=>{ if(generation===this.generation)this.onState(data); };
      node.onprocessorerror=()=>this.stop('Sound was interrupted. Enable sound to try again.');
      ctx.onstatechange=()=>{ if(ctx.state!=='running')this.stop('Sound paused. Enable sound to resume.'); };
      node.port.postMessage({type:'restore',state});
      this.gain.gain.setTargetAtTime(.35,ctx.currentTime,.02);
      return true;
    } catch(error) { if(generation!==this.generation)return false; this.stop(); throw error; }
  }
  send(d) { this.node?.port.postMessage(d); }
  stop(message) {
    this.generation++;
    const ctx=this.ctx; this.ctx=null;
    if(ctx)ctx.onstatechange=null;
    if(this.node){this.node.port.onmessage=null;this.node.onprocessorerror=null;this.node.disconnect();this.node.port.close();}
    this.node=null; this.gain?.disconnect(); this.gain=null;
    ctx?.close().catch(()=>{});
    if(message)this.onStop(message);
  }
}
