import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.sampleRate = 48000;
globalThis.AudioWorkletProcessor = class {
  constructor(){ this.messages=[];this.port={postMessage:msg=>this.messages.push(msg),onmessage:null}; }
};
let Processor;
globalThis.registerProcessor = (_name, Class) => Processor=Class;
await import('../../dist/instruments/hushpod/worklet.mjs');
const run=(p,seconds,rate=48000,onBlock)=>{
  const left=new Float32Array(128),right=new Float32Array(128);let peak=0,squares=0,finite=true,last=0,jump=0;
  for(let n=0;n<Math.ceil(seconds*rate/128);n++){
    onBlock?.(n*128/rate);
    p.process([],[[left,right]]);
    for(let i=0;i<128;i++){
      finite&&=Number.isFinite(left[i]);peak=Math.max(peak,Math.abs(left[i]));squares+=left[i]*left[i];jump=Math.max(jump,Math.abs(left[i]-last));last=left[i];
      assert.equal(left[i],right[i]);
    }
  }
  assert.ok(finite);return {peak,rms:Math.sqrt(squares/(Math.ceil(seconds*rate/128)*128)),jump};
};
const message=(p,data)=>p.port.onmessage({data});

test('worklet is silent from rest and produces bounded audio from a real impulse',()=>{
  const p=new Processor();assert.equal(run(p,.2).peak,0);
  message(p,{type:'tap',pocket:0});const sounding=run(p,1);
  assert.ok(sounding.rms>.02);assert.ok(sounding.peak<.2);assert.ok(sounding.jump<.02);
  assert.ok(p.messages.length>=25);
});
test('worklet stops stale contact gain and retains finite output under fast controls',()=>{
  const p=new Processor();message(p,{type:'tap',pocket:0});
  const audio=run(p,4,48000,t=>message(p,{type:'controls',rub:[1,1,1],hold:[0,0,0],waists:[.5+.5*Math.sin(t*23),.5+.5*Math.cos(t*17)]}));
  assert.ok(audio.peak<.78);
  run(p,.5);const n=p.pod.norm();run(p,1);assert.ok(p.pod.norm()<n,'lost pointer cannot keep feeding the pod');
});
test('actual pickup remains silent for balanced retained vibration',()=>{
  const p=new Processor();p.pod.z.set([.7,.2,0,0,-.7,-.2]);p.previous.set(p.pod.z);p.next.set(p.pod.z);
  const audio=run(p,2);assert.ok(audio.peak<1e-12);assert.ok(p.pod.norm()>.8);
  message(p,{type:'controls',rub:[0,0,0],hold:[0,0,0],waists:[.2,1]});
  assert.ok(run(p,1).rms>.02);
});
test('44.1 kHz output is finite and follows the same physical decay',()=>{
  globalThis.sampleRate=44100;const p=new Processor();message(p,{type:'tap',pocket:0});const n=p.pod.norm();
  const a=run(p,2,44100);assert.ok(a.rms>.01);assert.ok(Math.abs(p.pod.norm()/n-Math.exp(-.09*2))<.001);
  globalThis.sampleRate=48000;
});
