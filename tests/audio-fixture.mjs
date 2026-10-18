// Deterministic browser-audio boundary for lifecycle race tests, not DSP tests.
export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}
export function audioFixture(t, {moduleLoad=()=>Promise.resolve(),resume=()=>Promise.resolve()}={}) {
  const contexts=[], nodes=[];
  class Context {
    constructor(){this.state='suspended';this.currentTime=0;this.destination={};this.audioWorklet={addModule:moduleLoad};this.gains=[];contexts.push(this);}
    async resume(){await resume();if(this.state==='closed')throw Error('closed');this.change('running');}
    async suspend(){if(this.state!=='closed')this.change('suspended');}
    async close(){this.change('closed');}
    change(state){this.state=state;this.onstatechange?.();}
    createGain(){const values=[];const node={gain:{value:0,cancelScheduledValues(){},setTargetAtTime(v){values.push(v);},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},values,connect(){},disconnect(){node.disconnected=true;}};this.gains.push(node);return node;}
    createOscillator(){const node={frequency:{},connect(){},disconnect(){},start(){node.started=true;},stop(){node.stopped=true;node.onended?.();}};nodes.push(node);return node;}
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
