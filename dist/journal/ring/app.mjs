import { Experiment, ListeningWindow, DT, DURATION, N, VERSION, PUSH } from './experiment.mjs';
import { JournalAudio } from './audio.mjs';
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const experiment = new Experiment(), win = new ListeningWindow();
let starting = false, last = 0, accumulator = 0, lastDraw = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const status = text => { $('status').textContent = text; };
const audio = new JournalAudio(message => { soundButton(false); status(message); });
const curveName = c => c === 'quadratic' ? 'Quadratic' : 'Roughness';
const cents = (e, d = 1) => (e > 0.0499 ? '+' : e < -0.0499 ? '−' : '') + Math.abs(e).toFixed(d) + ' ¢';

/* ---------- figure: twelve voices on a ring, and the twelve errors as bars ---------- */
const CX = 210, CY = 210, R0 = 148, PAD = 0.17;
const angle = i => -Math.PI / 2 + i * 2 * Math.PI / N;
const at = (a, r) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
const arc = (a0, a1, r) => { const [x0, y0] = at(a0, r), [x1, y1] = at(a1, r); return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
const el = (parent, name, attrs) => { const n = document.createElementNS(NS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };
function mix(a, b, t) { return 'rgb(' + a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(',') + ')'; }
const PURE = [111, 143, 127], WOLF = [239, 199, 142], HOT = [240, 138, 106];
const errColor = e => { const t = Math.min(1, Math.abs(e) / 24); return t < .5 ? mix(PURE, WOLF, t * 2) : mix(WOLF, HOT, (t - .5) * 2); };
const ring = $('ring'), bars = $('bars'), parts = { band: null, edges: [], labels: [], nodes: [], bars: [], barLabels: [] };
parts.band = el(ring.querySelector('.band'), 'path', {});
parts.progress = el(ring.querySelector('.band'), 'path', { class: 'progress' });
for (let i = 0; i < N; i++) {
  const a0 = angle(i) + PAD, a1 = angle(i + 1) - PAD;
  parts.edges.push(el(ring.querySelector('.edges'), 'path', { d: arc(a0, a1, R0) }));
  const [lx, ly] = at((a0 + a1) / 2, R0 - 40);
  parts.labels.push(el(ring.querySelector('.labels'), 'text', { x: lx.toFixed(1), y: (ly + 4).toFixed(1) }));
  const [nx, ny] = at(angle(i), R0), g = el(ring.querySelector('.nodes'), 'g', {});
  el(g, 'circle', { cx: nx.toFixed(1), cy: ny.toFixed(1), r: 14 });
  el(g, 'text', { x: nx.toFixed(1), y: (ny + 4.5).toFixed(1) }).textContent = i;
  parts.nodes.push(g);
  const x = 16 + i * 38;
  parts.bars.push(el(bars.querySelector('.bar-set'), 'rect', { x, y: 40, width: 26, height: 0, rx: 2 }));
  el(bars.querySelector('.bar-axis'), 'text', { x: x + 13, y: 26 }).textContent = i;
}
function draw(s) {
  const e = s.eps, w = win.edge;
  for (let i = 0; i < N; i++) {
    const p = parts.edges[i]; p.style.stroke = errColor(e[i]); p.style.strokeWidth = (5 + Math.min(22, Math.abs(e[i])) * .75).toFixed(1);
    const label = parts.labels[i]; label.textContent = cents(e[i], Math.abs(e[i]) < 9.995 ? 2 : 1).replace(' ¢', ''); label.classList.toggle('hot', Math.abs(e[i]) > 6);
    const sounding = i === w || i === (w + 1) % N; parts.nodes[i].classList.toggle('sounding', sounding && audio.playing);
    const b = parts.bars[i], h = Math.min(24, Math.abs(e[i])) * 6;
    b.setAttribute('y', e[i] < 0 ? 40 : 40 - h); b.setAttribute('height', Math.max(1, h).toFixed(1)); b.style.fill = errColor(e[i]);
    b.classList.toggle('heard', i === w);
  }
  const a0 = angle(w) + PAD - .05, a1 = angle(w + 1) - PAD + .05;
  parts.band.setAttribute('d', arc(a0, a1, R0));
  const frac = Math.min(1, win.t / 2);
  parts.progress.setAttribute('d', frac > .01 ? arc(a0, a0 + (a1 - a0) * frac, R0 + 30) : '');
}

/* ---------- readouts ---------- */
function render() {
  const s = experiment.snapshot(), e = s.eps, w = win.edge;
  $('clock').textContent = s.time.toFixed(1) + ' s / ' + DURATION + ' s';
  $('sum').textContent = cents(s.sum, 2);
  $('heard').textContent = cents(e[w], 2);
  $('heard-meter').value = Math.min(24, Math.abs(e[w]));
  $('heard-which').textContent = 'Fifth ' + w + ', voices ' + w + ' and ' + (w + 1) % N;
  $('wolf').textContent = cents(s.wolfDepth, 2) + ' on fifth ' + s.wolfEdge;
  $('curve-now').textContent = curveName(s.curve);
  $('pushes').textContent = s.pushes;
  $('run').textContent = s.running ? 'Pause' : s.finished ? 'Run again' : s.time > 0 ? 'Resume' : 'Start';
  draw(s);
  $('measurements').textContent = VERSION + '\n' + JSON.stringify({
    time: +s.time.toFixed(3), curve: s.curve, pushesOfVoice3: s.pushes,
    errorsCents: e.map(x => +x.toFixed(3)), sumCents: +s.sum.toFixed(4),
    largestError: { fifth: s.wolfEdge, cents: +s.wolfDepth.toFixed(3) },
    heard: { fifth: w, voices: [w, (w + 1) % N], dyadHz: experiment.dyad(w).map(f => +f.toFixed(2)) }
  }, null, 2);
}

/* ---------- controls ---------- */
function prepare(curve, pushed) {
  experiment.reset(curve, pushed); win.reset(); accumulator = 0;
  $('push').disabled = false;
  render();
}
$('run').onclick = () => {
  if (experiment.finished) prepare(experiment.curve, true);
  experiment.run(!experiment.running);
  status(experiment.running
    ? (experiment.pushes ? 'The ring is relaxing. Watch where the push goes.' : 'Running. Equal temperament holds until something disturbs it. Try pushing voice 3.')
    : 'Paused. The numbers hold for inspection; the window keeps walking if sound is on.');
  render();
};
$('push').onclick = () => {
  experiment.push();
  status('Voice 3 is now ' + PUSH.cents * experiment.pushes + ' cents above where it started. Fifth 2 is wide, fifth 3 is narrow.' + (experiment.running ? '' : ' Press Start.'));
  render();
};
$('reset').onclick = () => { prepare(experiment.curve, false); status('Fresh ring in equal temperament: every fifth 1.96 cents narrow. Nothing pushed yet.'); };
for (const input of document.querySelectorAll('input[name=curve]')) input.onchange = () => {
  prepare(input.value, true);
  status('Fresh, paused ring in equal temperament with ' + curveName(input.value) + ', and voice 3 already pushed 20 cents sharp. Press Start.');
};
function soundButton(on) { $('sound').textContent = on ? 'Disable sound' : 'Enable sound'; $('sound').setAttribute('aria-pressed', String(on)); $('sound').disabled = false; }
$('sound').onclick = async () => {
  if (audio.playing || starting) { audio.stop(); starting = false; soundButton(false); status('Sound off. The ring keeps its state.'); render(); return; }
  starting = true; $('sound').disabled = true; status('Starting sound…');
  try {
    const ok = await audio.start();
    if (!ok) return;
    audio.set(win.edge, experiment.dyad(win.edge));
    soundButton(true);
    status('Sound on: you hear fifth ' + win.edge + '. The window moves on every 2 seconds.');
  } catch (error) { soundButton(false); status(error.message + ' You can continue without sound.'); }
  finally { starting = false; $('sound').disabled = false; }
};
function pauseForLifecycle() { experiment.run(false); audio.stop(); soundButton(false); status('Paused while away. Press Resume; enable sound again if wanted.'); render(); }
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseForLifecycle(); });
window.addEventListener('pagehide', pauseForLifecycle);

/* ---------- loop: fixed model steps, the same 1/60 s the archived checks use ---------- */
function frame(now) {
  const elapsed = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
  if (!document.hidden) {
    if (experiment.running) {
      accumulator += elapsed;
      while (accumulator >= DT && experiment.running) { experiment.step(); accumulator -= DT; }
      if (experiment.finished) status('Forty seconds. Compare the twelve errors with the claim below, or switch the curve.');
    } else accumulator = 0;
    if (experiment.running || audio.playing) win.advance(elapsed);
    if (audio.playing) audio.set(win.edge, experiment.dyad(win.edge));
  }
  if (now - lastDraw > (reduced.matches ? 250 : 33)) { render(); lastDraw = now; }
  requestAnimationFrame(frame);
}
for (const id of ['run', 'push', 'reset', 'sound']) $(id).disabled = false;
for (const input of document.querySelectorAll('input[name=curve]')) input.disabled = false;
status('Ready. Push voice 3, then Start. Sound starts only if you enable it.');
render(); requestAnimationFrame(frame);
