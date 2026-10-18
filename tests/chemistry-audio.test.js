import test from 'node:test';
import assert from 'node:assert/strict';
import { audioFixture, deferred } from './audio-fixture.mjs';
import { bySymbol } from '../dist/elements.js';

test('chemistry navigation cancels a pending audio unlock and closes its context',async t=>{
  const gate=deferred();const {contexts,nodes}=audioFixture(t,{resume:()=>gate.promise});
  const audio=await import('../dist/audio.js?navigation');
  const enabling=audio.enableAudio();audio.disposeAudio();gate.resolve();await assert.rejects(enabling,/closed/);
  audio.playElement(bySymbol.O);assert.equal(nodes.length,0);assert.equal(contexts[0].state,'closed');
});
test('backgrounding during chemistry unlock does not schedule a row or produce notes',async t=>{
  const gate=deferred();const {contexts,nodes}=audioFixture(t,{resume:()=>gate.promise});
  const audio=await import('../dist/audio.js?background');
  let notes=0;const playing=audio.playSequence([bySymbol.H,bySymbol.O],'families',()=>notes++,()=>{});
  await audio.suspendAudio();gate.resolve();await playing;
  assert.equal(contexts[0].state,'suspended');assert.equal(nodes.length,0);assert.equal(notes,0);audio.disposeAudio();
});

for(const interrupt of ['none','background','navigation'])test(`deferred chemistry suspension reconciles enable (${interrupt})`,async t=>{
  const gate=deferred();let resumes=0;
  const {contexts,nodes}=audioFixture(t,{suspend:()=>gate.promise,resume:()=>{resumes++;return Promise.resolve();}});
  const audio=await import(`../dist/audio.js?deferred-${interrupt}`);
  await audio.enableAudio();
  const suspending=audio.suspendAudio();
  assert.equal(contexts[0].state,'running','suspend has not settled yet');
  let settled=false;
  const enabling=audio.enableAudio().then(value=>{settled=true;return value;});
  // Resume must be requested in the gesture, before any suspension await.
  assert.equal(resumes,2);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(settled,false,'must not report enabled before suspension settles');
  if(interrupt==='background')audio.suspendAudio();
  if(interrupt==='navigation')audio.disposeAudio();
  gate.resolve();await suspending;
  assert.equal(await enabling,interrupt==='none');
  assert.equal(contexts[0].state,interrupt==='none'?'running':interrupt==='navigation'?'closed':'suspended');
  assert.equal(resumes,interrupt==='none'?3:2,'cancelled activation must not resume again');
  audio.playElement(bySymbol.O);
  assert.equal(nodes.length,interrupt==='none'?1:0);
  audio.disposeAudio();
});

test('an older cancelled unlock cannot suspend a newer successful activation',async t=>{
  const gate=deferred();let resumes=0;
  const {contexts}=audioFixture(t,{resume:()=>++resumes===1?gate.promise:Promise.resolve()});
  const audio=await import('../dist/audio.js?newer-activation');
  const older=audio.enableAudio();
  await audio.suspendAudio();
  assert.equal(await audio.enableAudio(),true);
  gate.resolve();
  assert.equal(await older,false);
  assert.equal(contexts[0].state,'running');
  audio.disposeAudio();
});

test('backgrounding cancels overlapping unlocks even when the oldest resumes last',async t=>{
  const gates=[deferred(),deferred()];let resumes=0;
  const {contexts,nodes}=audioFixture(t,{resume:()=>gates[resumes++].promise});
  const audio=await import('../dist/audio.js?overlapping-background');
  const older=audio.enableAudio(),newer=audio.enableAudio();
  await audio.suspendAudio();
  gates[1].resolve();assert.equal(await newer,false);
  gates[0].resolve();assert.equal(await older,false);
  assert.equal(contexts[0].state,'suspended');
  audio.playElement(bySymbol.O);assert.equal(nodes.length,0);
  audio.disposeAudio();
});
