// Deterministic browser-audio boundary for lifecycle race tests, not DSP tests.
export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}
export function audioFixture(t, {moduleLoad=()=>Promise.resolve(),resume=()=>Promise.resolve(),suspend}={}) {
  const contexts=[], nodes=[];
  class Context {
    constructor(){this.state='suspended';this.currentTime=0;this.destination={};this.audioWorklet={addModule:moduleLoad};this.gains=[];contexts.push(this);}
    async resume(){await resume();if(this.state==='closed')throw Error('closed');this.change('running');}
    async suspend(){if(suspend)await suspend();if(this.state!=='closed')this.change('suspended');}
    async close(){this.change('closed');}
    change(state){this.state=state;this.onstatechange?.();}
    createGain(){const values=[];const node={gain:{value:0,cancelScheduledValues(){},setTargetAtTime(v){values.push(v);},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},values,connect(){},disconnect(){node.disconnected=true;}};this.gains.push(node);return node;}
    createOscillator(){const node={frequency:{value:0},setPeriodicWave(){},connect(){},disconnect(){},start(t){node.started=true;node.at=t;},stop(){node.stopped=true;node.onended?.();}};nodes.push(node);this.oscillators=(this.oscillators??[]);this.oscillators.push(node);return node;}
    // Plain synth-graph nodes for instruments that schedule voices on the main thread.
    get sampleRate(){return 48000;}
    param(value=0){return{value,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}};}
    createDynamicsCompressor(){return{threshold:this.param(),knee:this.param(),ratio:this.param(),attack:this.param(),release:this.param(),connect(){},disconnect(){}};}
    createConvolver(){return{buffer:null,connect(){},disconnect(){}};}
    createBuffer(channels,length){const data=Array.from({length:channels},()=>new Float32Array(length));return{getChannelData:i=>data[i]};}
    createPeriodicWave(){return{};}
    createBiquadFilter(){return{type:'',Q:this.param(),frequency:this.param(),connect(){},disconnect(){}};}
    createStereoPanner(){return{pan:this.param(),connect(){},disconnect(){}};}
  }
  class Worklet {
    constructor(){this.messages=[];this.port={postMessage:d=>this.messages.push(structuredClone(d)),close:()=>{this.port.closed=true;}};nodes.push(this);}
    connect(){} disconnect(){this.disconnected=true;}
  }
  const originals=[globalThis.AudioContext,globalThis.AudioWorkletNode];
  globalThis.AudioContext=Context;globalThis.AudioWorkletNode=Worklet;
  t.after(()=>{[globalThis.AudioContext,globalThis.AudioWorkletNode]=originals;});
  return {contexts,nodes};
}
