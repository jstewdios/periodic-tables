import test from 'node:test';
import assert from 'node:assert/strict';
import { Sound } from '../../dist/instruments/hushpod/audio.mjs';
import { audioFixture, deferred } from '../audio-fixture.mjs';
const create=()=>new Sound(()=>{},()=>{});

test('missing Web Audio is a visible, retryable failure rather than a silent button',async t=>{
  audioFixture(t);globalThis.AudioContext=undefined;
  let message='';const sound=new Sound(()=>{},(_status,error)=>{message=error??'';});
  await assert.rejects(sound.start(),/Web Audio/);assert.equal(sound.status,'error');assert.match(message,/Web Audio/);
});

test('audio is opt-in; mute preserves the engine and explicit resume restores it',async t=>{
  const {contexts}=audioFixture(t),sound=create();
  assert.equal(contexts.length,0);
  await sound.start();assert.equal(sound.status,'running');
  sound.muted=true;sound.setGain();assert.equal(contexts[0].gains[0].values.at(-1),0);
  await sound.suspend();assert.equal(sound.status,'paused');
  await sound.start();assert.equal(sound.status,'running');assert.equal(sound.muted,true);
  sound.dispose();assert.equal(contexts[0].state,'closed');
});
test('backgrounding during module load discards taps and held input, and stays silent',async t=>{
  const load=deferred();const {contexts,nodes}=audioFixture(t,{moduleLoad:()=>load.promise});const sound=create();
  const start=sound.start();
  sound.send({type:'tap',pocket:0});sound.send({type:'controls',rub:[1,0,0],hold:[0,1,0],waists:[.2,1]});
  await sound.suspend();load.resolve();await start;
  assert.equal(contexts[0].state,'suspended');assert.equal(sound.status,'paused');
  assert.ok(!nodes[0].messages.some(d=>d.type==='tap'));
  assert.deepEqual(nodes[0].messages.find(d=>d.type==='controls').hold,[0,0,0]);
  assert.ok(!contexts[0].gains[0].values.some(v=>v>0));
  await sound.start();assert.equal(sound.status,'running');sound.dispose();
});
test('leaving during module load cannot create an orphaned engine',async t=>{
  const load=deferred();const {contexts,nodes}=audioFixture(t,{moduleLoad:()=>load.promise});const sound=create();
  const start=sound.start();sound.dispose();load.resolve();await start;
  assert.equal(contexts[0].state,'closed');assert.equal(nodes.length,0);assert.equal(sound.ctx,null);
  await sound.start();assert.equal(contexts.length,2);assert.equal(sound.status,'running');sound.dispose();
});
test('a failed module load releases resources and can retry from a fresh context',async t=>{
  let attempts=0;const {contexts}=audioFixture(t,{moduleLoad:()=>++attempts===1?Promise.reject(Error('offline')):Promise.resolve()});const sound=create();
  await assert.rejects(sound.start(),/offline/);
  assert.equal(sound.status,'error');assert.equal(contexts[0].state,'closed');assert.equal(sound.promise,null);
  await sound.start();assert.equal(sound.status,'running');assert.equal(contexts.length,2);sound.dispose();
});
test('processor failure and navigation disconnect nodes, close ports, and cancel reset',async t=>{
  const {contexts,nodes}=audioFixture(t);const sound=create();await sound.start();sound.reset();
  nodes[0].onprocessorerror();
  assert.equal(contexts[0].state,'closed');assert.equal(nodes[0].port.closed,true);assert.equal(nodes[0].disconnected,true);assert.equal(sound.resetTimer,null);
  assert.equal(sound.status,'error');await sound.start();assert.equal(sound.status,'running');sound.dispose();
});
test('an OS interruption does not automatically restore sound',async t=>{
  const {contexts}=audioFixture(t);const sound=create();await sound.start();
  contexts[0].change('interrupted');assert.equal(sound.status,'paused');assert.equal(sound.wantsSound,false);
  contexts[0].change('running');assert.equal(contexts[0].state,'suspended');
  await sound.start();assert.equal(sound.status,'running');sound.dispose();
});
test('suspend wins over an in-flight resume',async t=>{
  let gate=null;const {contexts}=audioFixture(t,{resume:()=>gate?.promise??Promise.resolve()});const sound=create();
  await sound.start();await sound.suspend();gate=deferred();const start=sound.start();await sound.suspend();gate.resolve();await start;
  assert.equal(contexts[0].state,'suspended');assert.equal(sound.status,'paused');sound.dispose();
});
test('a refused resume exposes retry and releases the unusable context',async t=>{
  let refuse=false;const {contexts}=audioFixture(t,{resume:()=>refuse?Promise.reject(Error('interrupted')):Promise.resolve()});const sound=create();
  await sound.start();await sound.suspend();refuse=true;await assert.rejects(sound.start(),/interrupted/);
  assert.equal(sound.status,'error');assert.equal(contexts[0].state,'closed');refuse=false;await sound.start();assert.equal(sound.status,'running');sound.dispose();
});
test('a reset immediately followed by backgrounding still clears the model once',async t=>{
  const {nodes}=audioFixture(t);const sound=create();await sound.start();sound.reset();await sound.suspend();
  assert.equal(sound.resetTimer,null);assert.equal(nodes[0].messages.filter(d=>d.type==='reset').length,1);
  await sound.start();sound.dispose();assert.equal(nodes[0].messages.filter(d=>d.type==='reset').length,1);
});
