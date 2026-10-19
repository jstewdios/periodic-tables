// Canvas drawing for Odd Sympathy. Everything drawn comes from the model's real
// state: ripple fronts, bead phases, tugs and near-simultaneous fires.
// Reduced motion keeps the beads (they are the clocks) but drops expanding
// ripples, flare glows and lurch trails in favour of a brief rim brightening.

const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
export function noteName(f) {
  const m = 69 + 12 * Math.log2(f / 440), n = Math.round(m), c = Math.round((m - n) * 100);
  return NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1) + (Math.abs(c) >= 2 ? (c > 0 ? ' +' : ' −') + Math.abs(c) : '');
}
// Octave-equivalent colour: rings an octave apart share a hue.
export const hue = f => (42 + ((Math.log2(f / 256) % 1 + 1) % 1) * 360) % 360;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.g = canvas.getContext('2d');
    this.W = 0; this.H = 0; this.DPR = 1; this.vignette = null;
    this.reducedMotion = false; this.showNotes = false;
  }
  resize(W, H, dpr) {
    this.DPR = Math.min(dpr || 1, 2); this.W = W; this.H = H;
    this.canvas.width = Math.round(W * this.DPR); this.canvas.height = Math.round(H * this.DPR);
    const g = this.g;
    g.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    this.vignette = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.hypot(W, H) * 0.62);
    this.vignette.addColorStop(0, 'rgba(22,30,34,0.0)');
    this.vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  }

  // view: { drafts: [{x,y,r}], labelled: Set<ring>, removing: Set<ring>, focused: ring|null, minR, maxR }
  draw(field, view) {
    const { g, W, H } = this, simT = field.t, u = field.u;
    g.fillStyle = '#0b0f12'; g.fillRect(0, 0, W, H);
    g.fillStyle = this.vignette; g.fillRect(0, 0, W, H);
    const RU = field.P.range * u;

    // Ripples. Spent ones are dropped here, as in the original.
    for (let i = field.pulses.length - 1; i >= 0; i--) {
      const p = field.pulses[i], travel = (simT - p.t0) * field.P.c * u;
      if (travel > RU) { field.pulses.splice(i, 1); continue; }
      if (travel < 0 || this.reducedMotion) continue;
      const a = 0.3 * (1 - travel / RU);
      g.strokeStyle = `hsla(${hue(p.f)},55%,72%,${a.toFixed(3)})`;
      g.lineWidth = 1.1;
      g.beginPath(); g.arc(p.x, p.y, p.r0 + travel, 0, Math.PI * 2); g.stroke();
    }

    // Sympathy threads: two rings striking within 25 ms.
    for (let i = field.threads.length - 1; i >= 0; i--) {
      const th = field.threads[i], age = simT - th.t;
      if (age > 0.45 || th.a.dying || th.b.dying || !field.rings.includes(th.a) || !field.rings.includes(th.b)) { field.threads.splice(i, 1); continue; }
      if (age < 0) continue;
      g.strokeStyle = `rgba(226,191,110,${(0.42 * (1 - age / 0.45)).toFixed(3)})`;
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(th.a.x, th.a.y); g.lineTo(th.b.x, th.b.y); g.stroke();
    }

    for (const r of field.rings) this.drawRing(field, r, view);

    // A ring being drawn.
    for (const d of view.drafts) {
      const rr = Math.max(view.minR, Math.min(view.maxR, d.r));
      g.setLineDash([4, 6]); g.strokeStyle = 'rgba(236,230,213,0.55)'; g.lineWidth = 1.2;
      g.beginPath(); g.arc(d.x, d.y, rr, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      this.label(d.x, d.y + rr, noteName(256 / (2 * Math.PI * rr / (field.P.v * u))), 0.8);
    }
  }

  label(x, y, text, a) {
    const g = this.g;
    g.font = '500 12px "DM Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillStyle = `rgba(236,230,213,${a})`;
    g.fillText(text, x, y + 9);
  }

  drawRing(field, r, view) {
    const { g } = this, simT = field.t, u = field.u;
    const f = field.freq(r), h = hue(f);
    let alpha = Math.min(1, (simT - r.born) / 0.25 + 0.3);
    if (r.dying) alpha = Math.max(0, 1 - (simT - r.dieT) / 0.35);
    const removing = view.removing.has(r);
    const fl = Math.exp(-Math.max(0, simT - r.lastFire) / 0.14) * (simT >= r.lastFire ? 1 : 0);
    const acc = r.accent;
    const ta = simT - r.tugT, tugged = ta >= 0 && ta < 0.3 && Math.abs(r.tugTo - r.tugFrom) > 0.002;
    g.save(); g.globalAlpha = alpha;
    if (removing) g.setLineDash([3, 5]);
    if (fl > 0.02 && !this.reducedMotion) {
      g.strokeStyle = `hsla(${h},70%,70%,${(0.16 * fl * (1 + acc)).toFixed(3)})`;
      g.lineWidth = 7 * fl * (1 + acc);
      g.beginPath(); g.arc(r.x, r.y, r.r, 0, Math.PI * 2); g.stroke();
    }
    // In reduced motion a tug shows as a brief brightening instead of a moving trail.
    const tugGlow = this.reducedMotion && tugged ? 0.35 * (1 - ta / 0.3) : 0;
    g.strokeStyle = removing ? 'rgba(220,110,90,0.8)' : `hsla(${h},45%,${62 + 18 * Math.max(fl, tugGlow)}%,${(0.36 + 0.5 * Math.max(fl, tugGlow)).toFixed(3)})`;
    g.lineWidth = 1.3 + 1.2 * fl;
    g.beginPath(); g.arc(r.x, r.y, r.r, 0, Math.PI * 2); g.stroke();
    g.setLineDash([]);
    // Keyboard focus: a quiet dashed halo just outside the rim.
    if (view.focused === r) {
      g.setLineDash([2, 5]); g.strokeStyle = 'rgba(226,191,110,0.9)'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(r.x, r.y, r.r + 9, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    }
    // The striker at the top.
    const tk = 5 + 3 * fl;
    g.strokeStyle = `hsla(${h},50%,80%,${(0.5 + 0.5 * fl).toFixed(3)})`; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(r.x, r.y - r.r - tk); g.lineTo(r.x, r.y - r.r + tk); g.stroke();
    // Lurch trail when a ripple tugs the bead.
    if (tugged && !this.reducedMotion) {
      const a1 = -Math.PI / 2 + 2 * Math.PI * r.tugFrom, a2 = -Math.PI / 2 + 2 * Math.PI * r.tugTo;
      g.strokeStyle = `hsla(${h},80%,82%,${(0.7 * (1 - ta / 0.3)).toFixed(3)})`; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.arc(r.x, r.y, r.r, a1, a2, a2 < a1); g.stroke(); g.lineCap = 'butt';
    }
    // Bead.
    const ang = -Math.PI / 2 + 2 * Math.PI * Math.min(1, r.phi);
    const bx = r.x + r.r * Math.cos(ang), by = r.y + r.r * Math.sin(ang);
    const br = 3 + 1.2 * u;
    g.fillStyle = `hsla(${h},80%,75%,0.18)`;
    g.beginPath(); g.arc(bx, by, br * 3.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = `hsl(${h},85%,88%)`;
    g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    if (this.showNotes || view.labelled.has(r)) this.label(r.x, r.y + r.r, noteName(f), 0.75);
    g.restore();
  }
}
