import test from 'node:test';
import assert from 'node:assert/strict';
import { Experiment } from '../../dist/journal/hushpod/experiment.mjs';
let Processor;
globalThis.AudioWorkletProcessor=class{constructor(){this.port={postMessage:s=>{this.lastState=s;}};}};
globalThis.registerProcessor=(_name,constructor)=>{Processor=constructor;};
await import('../../dist/journal/hushpod/worklet.mjs');
for(const rate of [44100,48000])test('real processor: silent preset, release, pause and reset at '+rate,()=>{
 globalThis.sampleRate=rate;const p=new Processor();const e=new Experiment();e.running=true;
 p.port.onmessage({data:{type:'restore',state:e.snapshot()}});
 const render=seconds=>{let peak=0;for(let n=0;n<Math.ceil(seconds*rate/128);n++){const out=[new Float32Array(128),new Float32Array(128)];p.process([],[out]);assert.deepEqual(out[0],out[1]);for(const x of out[0]){assert.ok(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));}}return peak;};
 assert.ok(render(.5)<1e-10);assert.ok(p.lastState.N>.4);
 p.port.onmessage({data:{type:'waist',value:.2}});assert.ok(render(1)>.05);
 p.port.onmessage({data:{type:'run',value:false}});const time=p.experiment.pod.time;assert.equal(render(.2),0);assert.equal(p.experiment.pod.time,time);
 p.port.onmessage({data:{type:'reset',degrees:0}});assert.equal(p.experiment.snapshot().N,.5);assert.equal(p.experiment.snapshot().P,1);
});
