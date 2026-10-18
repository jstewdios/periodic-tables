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
