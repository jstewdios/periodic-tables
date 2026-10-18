// Three coherent resonators. No behavior detectors or scripted transfers live here.
export const MATERIAL = Object.freeze({
  frequency: 220, beta: 16, decay: 0.045, coupling: 4,
  holdDamping: 8, rubGain: 1.65, saturation: 1.6,
  tap: Math.sqrt(0.0125), middleWeight: 0.35,
});

export class Pod {
  constructor(options = {}) {
    this.material = { ...MATERIAL, ...options };
    this.z = new Float64Array(6);
    this.aperture = new Float64Array([1, 1]);
    this.target = new Float64Array([1, 1]);
    this.rub = new Float64Array(3);
    this.hold = new Float64Array(3);
    this.injected = 0;
    this.lost = 0;
    this.time = 0;
  }
  norm() {
    const z = this.z;
    return z[0] ** 2 + z[1] ** 2 + z[2] ** 2 + z[3] ** 2 + z[4] ** 2 + z[5] ** 2;
  }
  clear() {
    this.z.fill(0); this.rub.fill(0); this.hold.fill(0);
    this.aperture.fill(1); this.target.fill(1);
    this.injected = 0; this.lost = 0;
  }
  release() { this.rub.fill(0); this.hold.fill(0); }
  contact(rub, hold) {
    for (let j = 0; j < 3; j++) {
      this.rub[j] = Math.max(0, Math.min(1, Number(rub?.[j]) || 0));
      this.hold[j] = Math.max(0, Math.min(1, Number(hold?.[j]) || 0));
    }
  }
  waist(j, value) {
    if (j === 0 || j === 1) this.target[j] = Math.max(0, Math.min(1, Number(value) || 0));
  }
  impulse(j, strength = 1, carrierPhase = 0) {
    if (!Number.isInteger(j) || j < 0 || j > 2) return;
    const z = this.z, i = j * 2;
    const before = z[i] ** 2 + z[i + 1] ** 2;
    const a = this.material.tap * Math.min(1.8, Math.max(0, strength)) * Math.max(0, 1 - before / this.material.saturation);
    // A velocity impulse: a <- a + iA. Transform it into the rotating frame.
    z[i] -= a * Math.sin(carrierPhase);
    z[i + 1] += a * Math.cos(carrierPhase);
    this.injected += z[i] ** 2 + z[i + 1] ** 2 - before;
  }
  local(dt) {
    const z = this.z, m = this.material;
    for (let j = 0; j < 3; j++) {
      const i = j * 2, x = z[i], y = z[i + 1], n = x*x + y*y;
      if (!n) continue;
      const gain = m.rubGain * this.rub[j] * Math.max(0, 1 - n / m.saturation);
      const loss = m.decay + m.holdDamping * this.hold[j];
      const rate = gain - loss;
      const integral = n * (Math.abs(rate) > 1e-10 ? Math.expm1(2 * rate * dt) / (2 * rate) : dt);
      const rotation = -m.beta * integral;
      const scale = Math.exp(rate * dt), c = Math.cos(rotation) * scale, s = Math.sin(rotation) * scale;
      z[i] = c*x - s*y; z[i + 1] = s*x + c*y;
      this.injected += 2 * gain * integral;
      this.lost += 2 * loss * integral;
    }
  }
  exchange(dt) {
    const z = this.z, l = this.aperture[0] * this.material.coupling, r = this.aperture[1] * this.material.coupling;
    const omega2 = l*l + r*r;
    if (!omega2) return;
    const omega = Math.sqrt(omega2), c = Math.cos(omega * dt), g = Math.sin(omega * dt) / omega;
    const f = -2 * Math.sin(omega * dt / 2) ** 2 / omega2;
    const x = z[0], y = z[1], u = z[2], v = z[3], p = z[4], q = z[5];
    const sx = l*x + r*p, sy = l*y + r*q;
    // Exact exp(-i K dt) for the entire three-node coupling matrix.
    z[0] = x + f*l*sx + g*l*v;
    z[1] = y + f*l*sy - g*l*u;
    z[2] = c*u + g*sy;
    z[3] = c*v - g*sx;
    z[4] = p + f*r*sx + g*r*v;
    z[5] = q + f*r*sy - g*r*u;
  }
  step(dt) {
    const smooth = 1 - Math.exp(-dt / 0.022);
    for (let j = 0; j < 2; j++) {
      this.aperture[j] += (this.target[j] - this.aperture[j]) * smooth;
      if (Math.abs(this.aperture[j] - this.target[j]) < 1e-6) this.aperture[j] = this.target[j];
    }
    this.local(dt / 2);
    this.exchange(dt);
    this.local(dt / 2);
    this.time += dt;
  }
  snapshot() {
    const z = this.z, n = [z[0]**2 + z[1]**2, z[2]**2 + z[3]**2, z[4]**2 + z[5]**2];
    const N = n[0] + n[1] + n[2], w = this.material.middleWeight;
    const pr = z[0] + w*z[2] + z[4], pi = z[1] + w*z[3] + z[5];
    const C = N > 1e-12 ? (pr*pr + pi*pi) / ((2 + w*w) * N) : 0;
    const currents = [0, 1].map(j => {
      const i = 2*j;
      return -2 * this.material.coupling * this.aperture[j] * (z[i]*z[i+3] - z[i+1]*z[i+2]);
    });
    return { z: Array.from(z), n, N, C, currents, aperture: Array.from(this.aperture),
      time: this.time, injected: this.injected, lost: this.lost, balance: N + this.lost - this.injected };
  }
}
