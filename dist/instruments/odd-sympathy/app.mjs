import { Field } from './model.mjs';
import { Sound } from './audio.mjs';
import { Renderer, noteName } from './render.mjs';
import { SETUPS, loadSetup } from './setups.mjs';

const $ = id => document.getElementById(id);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const stage = $('stage'), canvas = $('field'), targetLayer = $('ring-targets');
const drawer = $('drawer'), tuneBtn = $('tune-btn'), soundBtn = $('sound-btn'), hintEl = $('hint'), intro = $('intro');
const MAX_RINGS = 40, EDGE = 22, LA = 0.035; // audio lookahead, seconds

// ---------- field ----------
const renderer = new Renderer(canvas);
const drags = new Map(); // pointerId -> gesture in progress
let W = 0, H = 0;
function measure() {
  const b = stage.getBoundingClientRect();
  if (b.width !== W || b.height !== H) {
    cancelDrags();
    // Rotation or browser chrome changed the field: keep every ring and ripple in
    // the same relative place so none is left outside the visible stage.
    if (W > 0 && H > 0 && b.width > 0 && b.height > 0) remap(b.width / W, b.height / H);
  }
  W = b.width; H = b.height;
  renderer.resize(W, H, window.devicePixelRatio || 1);
}
function remap(sx, sy) {
  for (const r of field.rings) { r.x *= sx; r.y *= sy; }
  for (const p of field.pulses) { p.x *= sx; p.y *= sy; }
}
measure();
// Lengths scale with the screen once, at load, so a phone and a desk hold similar fields.
const u = clamp(Math.min(W, H) / 640, 0.55, 1.5);
const minR = () => 12 * u;
const maxR = () => Math.min(270 * u, Math.min(W, H) * 0.47);

// Simulation time runs on the audio clock while sound is running and on the page
// clock otherwise; `base` maps simulation seconds to whichever clock is in use.
let source = null, base = 0, running = false;
const field = new Field({
  u,
  onFire: (r, t, f, accent) => sound.pluck(t + base, f, (r.x / W) * 1.6 - 0.8, accent),
  onLock: () => onLock(),
});
field.addRing(W / 2, H / 2, 57 * u, 0.2);

const sound = new Sound((status, error) => {
  const label = { idle: ['Sound off', 'Start sound'], starting: ['Waking…', 'Sound is starting'], paused: ['Sound paused', 'Resume sound'], error: ['No sound', 'Try sound again'] }[status]
    ?? (sound.muted ? ['Muted', 'Unmute sound'] : ['Sound on', 'Mute sound']);
  soundBtn.textContent = label[0]; soundBtn.setAttribute('aria-label', label[1]);
  soundBtn.classList.toggle('on', status === 'running' && !sound.muted);
  soundBtn.disabled = status === 'starting';
  if (error) { $('audio-error-text').textContent = error; $('audio-error').hidden = false; }
  else if (status !== 'error') $('audio-error').hidden = true;
  if (status === 'paused' && running && !document.hidden) setHint('Sound is resting. Tap the field or Resume sound.', 5000);
});
function ensureSound() {
  // Only ever called from a user action. A failure stays visible with a retry button.
  if (document.hidden) return Promise.resolve();
  return sound.start().catch(() => {});
}

// ---------- frame loop ----------
let frameId = null;
function frame() {
  frameId = requestAnimationFrame(frame);
  if (running) {
    const audio = sound.running, raw = audio ? sound.ctx.currentTime : performance.now() / 1000, src = audio ? 'audio' : 'page';
    if (src !== source) { source = src; base = raw + LA - field.t; }
    let T = raw + LA - base;
    // After a pause (a background tab, a stalled frame) time stands still: no catch-up.
    if (T - field.t > 0.3) { base += T - field.t - 0.02; T = field.t + 0.02; }
    else if (T < field.t) { base = raw + LA - field.t; T = field.t; }
    if (T > field.t) field.advance(T);
    field.prune();
  }
  syncTargets();
  renderer.draw(field, view());
}
function startFrames() { if (frameId === null && !document.hidden) frameId = requestAnimationFrame(frame); }
function stopFrames() { cancelAnimationFrame(frameId); frameId = null; }

// ---------- pointer play (unchanged gestures from the prototype) ----------
const isOut = r => r.x < EDGE || r.y < EDGE || r.x > W - EDGE || r.y > H - EDGE;
function view() {
  const drafts = [], labelled = new Set(), removing = new Set();
  for (const d of drags.values()) {
    if (!d.moved) continue;
    if (d.mode === 'create') drafts.push({ x: d.x0, y: d.y0, r: d.r });
    else { labelled.add(d.ring); if (d.mode === 'move' && isOut(d.ring)) removing.add(d.ring); }
  }
  const focusedRing = field.rings.find(r => r.id === focusedId);
  if (focusedRing) labelled.add(focusedRing);
  return { drafts, labelled, removing, focused: focusedRing ?? null, minR: minR(), maxR: maxR() };
}
function pick(x, y) {
  let best = null, bestScore = Infinity;
  for (const r of field.rings) {
    if (r.dying) continue;
    const dc = Math.hypot(x - r.x, y - r.y);
    const tolIn = Math.min(12, r.r * 0.35), tolOut = 16;
    if (dc >= r.r - tolIn && dc <= r.r + tolOut) {
      const sc = Math.abs(dc - r.r);
      if (sc < bestScore) { bestScore = sc; best = { ring: r, mode: 'resize', dc }; }
    } else if (dc < r.r - tolIn) {
      const sc = 10 + r.r; // inside: smallest ring wins, rims win over insides
      if (sc < bestScore) { bestScore = sc; best = { ring: r, mode: 'move', dc }; }
    }
  }
  return best;
}
function point(e) { const b = stage.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }

canvas.addEventListener('pointerdown', e => {
  if (!running || (e.pointerType === 'mouse' && e.button !== 0)) return;
  if (sound.status === 'idle' || sound.status === 'paused') ensureSound();
  closeDrawer(false);
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  const { x, y } = point(e), hit = pick(x, y);
  if (hit) drags.set(e.pointerId, { mode: hit.mode, ring: hit.ring, x0: x, y0: y, ox: hit.ring.x - x, oy: hit.ring.y - y, dr: hit.ring.r - hit.dc, t0: performance.now(), moved: false });
  else drags.set(e.pointerId, { mode: 'create', x0: x, y0: y, r: 0, t0: performance.now(), moved: false });
});
canvas.addEventListener('pointermove', e => {
  const d = drags.get(e.pointerId); if (!d) return;
  const { x, y } = point(e);
  if (!d.moved && Math.hypot(x - d.x0, y - d.y0) > 7) d.moved = true;
  if (!d.moved) return;
  if (d.mode === 'create') d.r = Math.hypot(x - d.x0, y - d.y0);
  else if (d.mode === 'move') { d.ring.x = clamp(x + d.ox, 0, W); d.ring.y = clamp(y + d.oy, 0, H); touched('move'); }
  else if (d.mode === 'resize') { d.ring.r = clamp(Math.hypot(x - d.ring.x, y - d.ring.y) + d.dr, minR(), maxR()); touched('resize'); }
});
function endDrag(e) {
  const d = drags.get(e.pointerId); if (!d) return;
  drags.delete(e.pointerId);
  if (d.mode === 'create') {
    if (field.live().length >= MAX_RINGS) { setHint('The field is full. Fling a ring off the edge to make room.'); return; }
    const rr = d.moved ? clamp(d.r, minR(), maxR()) : 50 * u;
    if (!d.moved && performance.now() - d.t0 > 600) return;
    const r = field.addRing(d.x0, d.y0, rr, 0);
    field.fire(r, 0.6);
    created();
  } else if (!d.moved && performance.now() - d.t0 < 400) {
    field.strike(d.ring, 1); touched('strike');
  } else if (d.mode === 'move' && isOut(d.ring)) {
    field.remove(d.ring); touched('remove');
  }
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', e => drags.delete(e.pointerId));
canvas.addEventListener('lostpointercapture', e => drags.delete(e.pointerId));
canvas.addEventListener('contextmenu', e => e.preventDefault());
function cancelDrags() {
  for (const id of drags.keys()) { try { canvas.releasePointerCapture(id); } catch {} }
  drags.clear();
}

// ---------- keyboard play: one focusable button per ring ----------
let focusedId = null, lastTargetSync = 0;
const targets = new Map();
function ringLabel(r, i) { return `Ring ${i + 1}, ${noteName(field.freq(r)).split(' ')[0]}`; }
function syncTargets(force = false) {
  if (!running) return; // nothing is focusable behind the intro
  const now = performance.now();
  if (!force && now - lastTargetSync < 120) return;
  lastTargetSync = now;
  const live = field.live();
  for (const [id, el] of targets) if (!live.some(r => r.id === id)) { el.remove(); targets.delete(id); }
  live.forEach((r, i) => {
    let el = targets.get(r.id);
    if (!el) {
      el = document.createElement('button'); el.className = 'ring-target'; el.dataset.ring = String(r.id);
      el.addEventListener('focus', () => { focusedId = r.id; });
      el.addEventListener('blur', () => { if (focusedId === r.id) focusedId = null; });
      el.addEventListener('keydown', e => ringKey(e, r));
      // Enter, Space and screen-reader activation all arrive as a click.
      el.addEventListener('click', () => strikeRing(r));
      targetLayer.append(el); targets.set(r.id, el);
    }
    const s = Math.max(r.r, 22);
    Object.assign(el.style, { left: `${r.x - s}px`, top: `${r.y - s}px`, width: `${2 * s}px`, height: `${2 * s}px` });
    const label = ringLabel(r, i);
    if (el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
  });
}
function ringKey(e, r) {
  if (!running || r.dying) return;
  const step = e.shiftKey ? 3 : 12;
  if (e.key === 'Enter' || e.key === ' ') {
    if (e.repeat) e.preventDefault(); // one strike per press; the button's click does the rest
    return;
  } else if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    const [dx, dy] = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    r.x = clamp(r.x + dx * step, EDGE, W - EDGE); r.y = clamp(r.y + dy * step, EDGE, H - EDGE); touched('move');
  } else if (['+', '=', '-', '_', '−'].includes(e.key)) {
    e.preventDefault();
    const grow = e.key === '+' || e.key === '=';
    r.r = clamp(r.r * (1 + (grow ? 1 : -1) * (e.shiftKey ? 0.01 : 0.05)), minR(), maxR()); touched('resize');
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    const live = field.live(), i = live.indexOf(r);
    field.remove(r); touched('remove');
    const next = live[i + 1] ?? live[i - 1];
    syncTargets(true);
    ((next && targets.get(next.id)) || tuneBtn).focus();
  } else return;
  syncTargets(true);
}
function strikeRing(r) {
  if (!running || r.dying) return;
  ensureSoundForKey(); field.strike(r, 1); touched('strike');
}
function ensureSoundForKey() { if (sound.status === 'idle' || sound.status === 'paused') ensureSound(); }
function addRing() {
  if (!running) return;
  if (field.live().length >= MAX_RINGS) { setHint('The field is full. Remove a ring to make room.'); return; }
  ensureSoundForKey();
  const rr = 50 * u;
  let x = W / 2, y = H / 2;
  for (let tries = 0; tries < 200; tries++) {
    const cx = rr + 24 + Math.random() * Math.max(1, W - 2 * rr - 48), cy = rr + 64 + Math.random() * Math.max(1, H - 2 * rr - 128);
    if (field.live().every(o => Math.hypot(o.x - cx, o.y - cy) > o.r + rr + 8)) { x = cx; y = cy; break; }
  }
  const r = field.addRing(x, y, rr, 0);
  field.fire(r, 0.6); created(); syncTargets(true);
  targets.get(r.id)?.focus();
}

// ---------- hints (the prototype's gentle sequence) ----------
let hintTimer = null, stageNo = 0;
const timers = new Set();
function later(fn, ms) { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); }
function setHint(text, ms = 0) {
  hintEl.textContent = text; hintEl.classList.add('on');
  clearTimeout(hintTimer);
  if (ms) hintTimer = setTimeout(() => hintEl.classList.remove('on'), ms);
}
function created() {
  if (stageNo === 0) { stageNo = 1; setHint('Watch the bead lurch when a ripple reaches it. Give them a few seconds.'); later(() => { if (stageNo === 1) toStage2(); }, 9000); }
}
function onLock() { if (stageNo === 1) later(toStage2, 2500); }
function toStage2() { if (stageNo !== 1) return; stageNo = 2; setHint('Drag a ring to move it. Drag its rim to resize. Tap it to strike.'); }
const did = new Set();
function touched(kind) {
  did.add(kind);
  if (stageNo === 2 && (did.has('move') || did.has('resize'))) { stageNo = 3; later(() => setHint('Pull two rings apart and they start trading beats. Fling one at the edge to remove it.', 9000), 1800); }
}

// ---------- drawer ----------
for (const [name, setup] of Object.entries(SETUPS)) {
  const btn = document.createElement('button'); btn.dataset.setup = name; btn.textContent = setup.label;
  btn.addEventListener('click', () => {
    loadSetup(field, name, W, H); stageNo = Math.max(stageNo, 3); hintEl.classList.remove('on'); closeDrawer(true); syncTargets(true);
  });
  $('setups').append(btn);
}
function openDrawer(focusAbout = false) {
  drawer.hidden = false; tuneBtn.setAttribute('aria-expanded', 'true'); cancelDrags();
  if (focusAbout) { const d = $('about').querySelector('details'); d.open = true; d.querySelector('summary').focus(); }
}
function closeDrawer(returnFocus) {
  if (drawer.hidden) return;
  drawer.hidden = true; tuneBtn.setAttribute('aria-expanded', 'false');
  if (returnFocus && drawer.contains(document.activeElement)) tuneBtn.focus();
}
tuneBtn.addEventListener('click', () => drawer.hidden ? openDrawer() : closeDrawer(true));
const pull = $('pull'), pullOut = $('pull-out');
pull.addEventListener('input', () => { field.P.eps = parseFloat(pull.value); pullOut.textContent = field.P.eps.toFixed(2); });
$('notes-btn').addEventListener('click', () => { renderer.showNotes = !renderer.showNotes; $('notes-btn').setAttribute('aria-pressed', String(renderer.showNotes)); });
$('add-btn').addEventListener('click', () => { closeDrawer(false); addRing(); });
$('clear-btn').addEventListener('click', () => { field.clear(); syncTargets(true); closeDrawer(true); setHint('Drag on empty space to draw a ring.', 6000); });

// ---------- sound controls ----------
function toggleSound() {
  if (sound.status === 'running') { sound.setMuted(!sound.muted); sound.emitStatus(); setHint(sound.muted ? 'Muted. The clocks keep time.' : 'Listening again.', 1800); }
  else if (sound.status !== 'starting') ensureSound();
}
soundBtn.addEventListener('click', toggleSound);
$('retry-btn').addEventListener('click', () => ensureSound());

// ---------- start ----------
let begun = false;
function begin() {
  if (begun) return; begun = true;
  $('begin').disabled = true;
  const go = () => { if (!running) launch(); };
  ensureSound().then(go, go);
  later(go, 600); // never wait long for a slow audio device
}
function launch() {
  intro.hidden = true;
  for (const el of document.querySelectorAll('[data-until-launch]')) el.inert = false;
  source = null; running = true;
  for (const r of field.rings) { r.born = field.t; r.lastFire = -9; }
  if (field.rings.length === 1) field.fire(field.rings[0], 0.5);
  setHint(field.rings.length > 1 ? 'Drag a ring to move it. Drag its rim to resize. Tap it to strike.' : 'Drag on empty space to draw a second ring.');
  if (field.rings.length > 1) stageNo = 2;
  syncTargets(true);
}
$('begin').addEventListener('click', begin);

window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.key === 'Escape') { if (!drawer.hidden) { e.preventDefault(); closeDrawer(true); } return; }
  if (!intro.hidden) return;
  const k = e.key.toLowerCase();
  if (k === 'n') { e.preventDefault(); addRing(); }
  else if (k === 'm') { e.preventDefault(); toggleSound(); }
  else if (k === 't') { e.preventDefault(); drawer.hidden ? openDrawer() : closeDrawer(true); }
  else if (e.key === '?') { e.preventDefault(); openDrawer(true); }
});

// ---------- lifecycle ----------
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
renderer.reducedMotion = reducedMotion.matches;
reducedMotion.addEventListener?.('change', e => { renderer.reducedMotion = e.matches; });
const observer = new ResizeObserver(measure);
observer.observe(stage);
window.addEventListener('blur', cancelDrags);
window.addEventListener('orientationchange', cancelDrags);
document.addEventListener('visibilitychange', () => {
  // Hidden: release held input, stop drawing, suspend sound. Returning needs a fresh gesture for sound.
  if (document.hidden) { cancelDrags(); stopFrames(); sound.suspend().catch(() => {}); }
  else {
    measure(); startFrames();
    if (running && sound.status === 'paused') setHint('Sound is resting. Tap the field or Resume sound.', 5000);
  }
});
// Each instrument is its own document. Close the engine even when the browser keeps
// this page in its back/forward cache; a restored page is silent until touched.
window.addEventListener('pagehide', () => {
  cancelDrags(); stopFrames(); observer.disconnect(); closeDrawer(false);
  for (const id of timers) clearTimeout(id); timers.clear(); clearTimeout(hintTimer);
  sound.dispose();
});
window.addEventListener('pageshow', e => {
  if (!e.persisted) return;
  observer.observe(stage); measure(); source = null; startFrames();
});
startFrames();
