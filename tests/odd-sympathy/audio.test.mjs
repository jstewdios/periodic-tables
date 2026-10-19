import test from 'node:test';
import assert from 'node:assert/strict';
import { Sound, MAX_VOICES } from '../../dist/instruments/odd-sympathy/audio.mjs';
import { audioFixture, deferred } from '../audio-fixture.mjs';

const pluck = sound => sound.pluck((sound.ctx?.currentTime ?? 0) + 0.05, 256, 0, 0.5);

test('missing Web Audio is a visible failure; the field can keep playing silently', async t => {
  audioFixture(t); globalThis.AudioContext = undefined;
  let message = ''; const sound = new Sound((_status, error) => { message = error ?? message; });
  await assert.rejects(sound.start(), /Web Audio/);
  assert.equal(sound.status, 'error'); assert.match(message, /silently/);
  assert.equal(pluck(sound), false);
});

test('sound is opt-in, plucks only while running, and mute gates the output', async t => {
  const { contexts } = audioFixture(t); const sound = new Sound();
  assert.equal(contexts.length, 0); assert.equal(pluck(sound), false);
  await sound.start();
  assert.equal(sound.status, 'running'); assert.equal(contexts[0].state, 'running');
  assert.equal(pluck(sound), true); assert.equal(contexts[0].oscillators.length, 1);
  sound.setMuted(true);
  assert.equal(contexts[0].gains.find(g => g === sound.out).values.at(-1), 0);
  assert.equal(pluck(sound), false, 'muted voices are not scheduled');
  sound.setMuted(false); assert.equal(sound.out.values.at(-1), 1);
  sound.dispose(); assert.equal(contexts[0].state, 'closed'); assert.equal(pluck(sound), false);
});

test('backgrounding suspends, silences plucks, and only a new start resumes', async t => {
  const { contexts } = audioFixture(t); const sound = new Sound(); await sound.start();
  await sound.suspend();
  assert.equal(sound.status, 'paused'); assert.equal(contexts[0].state, 'suspended'); assert.equal(pluck(sound), false);
  await sound.start(); assert.equal(sound.status, 'running'); assert.equal(contexts.length, 1); sound.dispose();
});

test('an OS interruption does not restore sound on its own', async t => {
  const { contexts } = audioFixture(t); const sound = new Sound(); await sound.start();
  contexts[0].change('interrupted'); assert.equal(sound.status, 'paused'); assert.equal(sound.wantsSound, false);
  contexts[0].change('running'); assert.equal(contexts[0].state, 'suspended');
  await sound.start(); assert.equal(sound.status, 'running'); sound.dispose();
});

test('leaving while sound is still starting leaves no live context behind', async t => {
  const resume = deferred(); const { contexts } = audioFixture(t, { resume: () => resume.promise }); const sound = new Sound();
  const start = sound.start(); sound.dispose(); resume.resolve(); await start;
  assert.equal(contexts[0].state, 'closed'); assert.equal(sound.ctx, null); assert.equal(sound.status, 'idle');
});

test('backgrounding during start keeps the new context suspended and silent', async t => {
  const resume = deferred(); const { contexts } = audioFixture(t, { resume: () => resume.promise }); const sound = new Sound();
  const start = sound.start(); const suspending = sound.suspend(); resume.resolve(); await start; await suspending;
  assert.equal(contexts[0].state, 'suspended'); assert.equal(sound.status, 'paused'); assert.equal(pluck(sound), false);
  sound.dispose();
});

test('a refused resume shows retry and the retry starts from a fresh context', async t => {
  let refuse = false; const { contexts } = audioFixture(t, { resume: () => refuse ? Promise.reject(Error('interrupted')) : Promise.resolve() });
  const sound = new Sound(); await sound.start(); await sound.suspend();
  refuse = true; await assert.rejects(sound.start(), /interrupted/);
  assert.equal(sound.status, 'error'); assert.equal(contexts[0].state, 'closed');
  refuse = false; await sound.start(); assert.equal(sound.status, 'running'); assert.equal(contexts.length, 2); sound.dispose();
});

test('a failed first start is retryable and does not leak the failed context', async t => {
  let attempts = 0; const { contexts } = audioFixture(t, { resume: () => ++attempts === 1 ? Promise.reject(Error('blocked')) : Promise.resolve() });
  const sound = new Sound(); await assert.rejects(sound.start(), /blocked/);
  assert.equal(sound.status, 'error'); assert.equal(contexts[0].state, 'closed'); assert.equal(sound.ctx, null);
  await sound.start(); assert.equal(sound.status, 'running'); sound.dispose();
});

test('a dense field cannot exceed the voice limit, and plucks are never scheduled in the past', async t => {
  const { contexts } = audioFixture(t); const sound = new Sound(); await sound.start();
  contexts[0].currentTime = 10;
  let scheduled = 0; for (let i = 0; i < MAX_VOICES + 20; i++) if (sound.pluck(5, 300, 0, 1)) scheduled++;
  assert.equal(scheduled, MAX_VOICES); assert.equal(sound.voices, MAX_VOICES);
  assert.ok(contexts[0].oscillators.every(o => o.at >= 10));
  sound.dispose(); assert.equal(sound.voices, 0);
});
