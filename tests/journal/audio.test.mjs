import test from 'node:test';
import assert from 'node:assert/strict';
import { JournalAudio } from '../../dist/journal/hushpod/audio.mjs';
import { Experiment } from '../../dist/journal/hushpod/experiment.mjs';
const contexts=[];
class Context {
 constructor(){this.state='suspended';this.currentTime=0;this.audioWorklet={addModule:async()=>{}};contexts.push(this);}
 async resume(){this.state='running';}
 async close(){this.state='closed';}
 createGain(){return {gain:{value:0,setTargetAtTime(){}},connect(){},disconnect(){}};}
}
class Node {
 constructor(){this.messages=[];this.port={postMessage:d=>this.messages.push(d),close(){}};}
 connect(){} disconnect(){}
}
test('opt-in, state transfer, explicit close, interruption and retry',async()=>{
 globalThis.AudioContext=Context;globalThis.AudioWorkletNode=Node;
 const a=new JournalAudio(()=>{},()=>{}),s=new Experiment().snapshot();const count=contexts.length;
 assert.equal(contexts.length,count);assert.equal(await a.start(s),true);assert.deepEqual(a.node.messages[0],{type:'restore',state:s});
 const ctx=a.ctx;a.stop();assert.equal(ctx.state,'closed');assert.equal(a.node,null);
 await a.start(s);const second=a.ctx;second.state='suspended';second.onstatechange();assert.equal(second.state,'closed');assert.equal(a.ctx,null);
 await a.start(s);a.stop();
});
test('cancellation during worklet loading never starts or leaks audio',async()=>{
 let loaded;globalThis.AudioContext=class extends Context{constructor(){super();this.audioWorklet.addModule=()=>new Promise(r=>loaded=r);}};
 const a=new JournalAudio(()=>{},()=>{}),pending=a.start(new Experiment().snapshot());const ctx=a.ctx;a.stop();loaded();assert.equal(await pending,false);assert.equal(ctx.state,'closed');assert.equal(a.node,null);
});
test('worklet failure closes context; unavailable audio reports a useful error',async()=>{
 globalThis.AudioContext=class extends Context{constructor(){super();this.audioWorklet.addModule=async()=>{throw Error('module failed');};}};
 const a=new JournalAudio(()=>{},()=>{});await assert.rejects(a.start(new Experiment().snapshot()),/module failed/);assert.equal(contexts.at(-1).state,'closed');
 globalThis.AudioContext=undefined;await assert.rejects(a.start(new Experiment().snapshot()),/silent experiment/);
});
