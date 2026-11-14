'use strict';
/* =====================================================================
   Library of Limu · new offy v4 — the ink landscape on the home screen
   Layered mountains, drifting mist, sun by day / moon by night.
   It fills in as you rise through the ranks: pavilion, pines, boat, cranes, pagoda.
   ===================================================================== */
const Scene = {
  cv: null, raf: 0, last: 0, t: 0, w: 0, h: 0, d: 1, rank: 0, px: 0, tx: 0,

  mount(cv, rank = 0) {
    this.cv = cv; this.rank = rank; cancelAnimationFrame(this.raf);
    this.resize(); this.draw();
    if (reducedMotion()) return;
    const loop = ts => {
      if (!cv.isConnected) return;
      this.raf = requestAnimationFrame(loop);
      if (document.hidden || ts - this.last < 50) return;     // ~20 fps is plenty for mist
      this.last = ts; this.t = ts / 1000; this.px += (this.tx - this.px) * .06; this.draw();
    };
    this.raf = requestAnimationFrame(loop);
    if (!this._bound) {
      this._bound = true;
      addEventListener('pointermove', e => { this.tx = (e.clientX / innerWidth - .5) * 2; }, { passive: true });
      addEventListener('resize', () => { if (this.cv && this.cv.isConnected) { this.resize(); this.draw(); } });
    }
  },
  resize() {
    const cv = this.cv, r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    this.w = Math.max(10, r.width); this.h = Math.max(10, r.height); this.d = d;
    cv.width = Math.round(this.w * d); cv.height = Math.round(this.h * d);
    // the sun rests in the deepest dip of the skyline on the right, two-thirds risen, and keeps clear of the rank box in the corner
    const W = this.w, H = this.h, r0 = Math.min(W, H) * .11, narrow = W < 600;
    const sky = x => { let m = H; for (let i = 0; i < 4; i++) { const k = i / 4; m = Math.min(m, H * (.5 + k * .34) - H * (.36 - k * .13) * this.ridge(x / W * (1.1 + i * .12) + i * .37, i)); } return m; };
    let best = null;
    for (let x = W * .52; x <= W * .9; x += 6) {
      const top = (narrow || x + r0 > W - 290 ? 92 : 16) + r0, s = sky(x), y = Math.max(s - r0 * .4, top);
      const seen = clamp((s - (y - r0)) / (2 * r0), 0, 1);                 // how much of the disc clears the skyline
      const score = Math.min(seen, .7) * 100 + (x >= W * .62 ? 25 : 0) + s / H * 10;      // the right side keeps it away from the headline
      if (!best || score > best.score) best = { x, y, score };
    }
    this.sun = { x: best.x, y: best.y, r: r0 };
  },
  /** ridge height 0…1 of layer i at horizontal position k (0…1) */
  ridge(k, i) {
    const s = i * 12.7 + 3;
    const a = 1 - Math.abs(Math.sin(k * (1.9 + i * .8) + s)), b = 1 - Math.abs(Math.sin(k * (4.7 + i * 1.6) + s * 1.7)), c = .5 + .5 * Math.sin(k * (12 + i * 3.1) + s * .6);
    return .56 * a * a + .3 * b + .14 * c;
  },
  palette() {
    const dark = document.documentElement.dataset.theme === 'dark', c = S().colors || {};
    const base = Color.ok(c.accent) ? c.accent : '#24507a';
    return dark
      ? { dark, sky0: '#0b1017', sky1: '#172536', far: Color.mix('#172536', Color.bright(base, .3), .34), near: '#05080c', mist: '#1b2b3d', orb: '#f1e6c8', halo: 'rgba(241, 230, 200, .13)' }
      : { dark, sky0: '#f6f0e2', sky1: '#fcf8ee', far: Color.mix('#f6f0e2', base, .2), near: Color.mix(base, '#000000', .58), mist: '#fbf7ec', orb: '#c8432b', halo: 'rgba(200, 67, 43, .1)' };
  },
  draw() {
    const cv = this.cv; if (!cv) return;
    const g = cv.getContext('2d'), W = this.w, H = this.h, p = this.palette(), t = this.t;
    g.setTransform(this.d, 0, 0, this.d, 0, 0);
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, p.sky0); sky.addColorStop(1, p.sky1);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);

    // stars at night
    if (p.dark) { g.fillStyle = 'rgba(255, 255, 255, .7)'; for (let i = 0; i < 46; i++) { const x = (i * 97.3 % 1) * W, y = (i * 57.7 % 1) * H * .5, tw = .5 + .5 * Math.sin(t * 1.3 + i * 2.1); g.globalAlpha = .18 + tw * .5; g.fillRect((x + i * 31) % W, y, 1.3, 1.3); } g.globalAlpha = 1; }
    // sun / moon
    const ox = this.sun.x - this.px * 6, oy = this.sun.y - (this.pull || 0) * this.sun.r * 1.6, or = this.sun.r * (1 + (this.pull || 0) * .12);   // pulling the home screen down raises the sun / moon
    const halo = g.createRadialGradient(ox, oy, or * .6, ox, oy, or * 3.4); halo.addColorStop(0, p.halo); halo.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = halo; g.fillRect(0, 0, W, H);
    g.fillStyle = p.orb; g.globalAlpha = p.dark ? .92 : .86; g.beginPath(); g.arc(ox, oy, or, 0, 6.2832); g.fill(); g.globalAlpha = 1;

    const L = 5;
    for (let i = 0; i < L; i++) {
      const k = i / (L - 1), base = H * (.5 + k * .34), amp = H * (.36 - k * .13), shift = this.px * (4 + i * 7);
      const col = Color.mix(p.far, p.near, Math.pow(k, 1.25));
      const y = x => base - amp * this.ridge((x + shift) / W * (1.1 + i * .12) + i * .37, i);
      g.fillStyle = col; g.beginPath(); g.moveTo(-20, H + 2);
      for (let x = -20; x <= W + 20; x += 6) g.lineTo(x, y(x));
      g.lineTo(W + 20, H + 2); g.closePath(); g.fill();

      if (i === 1 && this.rank >= 5) this.pagoda(g, W * .6 - shift, y(W * .6), H * .16, col);
      if (i === 2 && this.rank >= 1) this.pavilion(g, W * .33 - shift, y(W * .33), H * .1, col);
      if (i === 3 && this.rank >= 2) { this.pine(g, W * .88 - shift, y(W * .88), H * .17, col); this.pine(g, W * .93 - shift, y(W * .93), H * .12, col); this.pine(g, W * .1 - shift, y(W * .1), H * .13, col); }

      // mist pooling at the foot of each range — the unpainted "white space" of ink painting
      if (i < L - 1) {
        const my = base + amp * .12 + Math.sin(t * .18 + i) * 3, mh = H * .2;
        const m = g.createLinearGradient(0, my - mh, 0, my + mh * .55); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(.62, Color.alpha(p.mist, p.dark ? .5 : .78)); m.addColorStop(1, 'rgba(0,0,0,0)');
        g.save(); g.translate(Math.sin(t * .06 + i * 2) * 14, 0); g.fillStyle = m; g.fillRect(-30, my - mh, W + 60, mh * 1.55); g.restore();
      }
    }
    // water line with a boat
    if (this.rank >= 3) this.boat(g, W * .52 + Math.sin(t * .1) * 10, H * .93 + Math.sin(t * .8) * .8, H * .07, p.near);
    // birds (cranes once you are a jinshi)
    const n = this.rank >= 4 ? 7 : 3; g.strokeStyle = p.dark ? 'rgba(255,255,255,.55)' : Color.alpha(p.near, .6); g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const bx = ((t * (9 + i * 2.3) + i * 173) % (W + 120)) - 60, by = H * (.16 + (i * .37 % 1) * .22) + Math.sin(t * .7 + i) * 4, s = (this.rank >= 4 ? 7 : 5) + (i % 3), f = Math.sin(t * 5 + i * 1.7) * s * .45;
      g.lineWidth = 1.3; g.beginPath(); g.moveTo(bx - s, by - f); g.quadraticCurveTo(bx - s * .4, by - s * .5, bx, by); g.quadraticCurveTo(bx + s * .4, by - s * .5, bx + s, by - f); g.stroke();
    }
  },
  pavilion(g, x, y, s, col) {
    g.fillStyle = col; g.beginPath();
    g.moveTo(x - s * .7, y - s * .5); g.quadraticCurveTo(x - s * .3, y - s * .62, x, y - s * 1.05); g.quadraticCurveTo(x + s * .3, y - s * .62, x + s * .7, y - s * .5); g.lineTo(x + s * .52, y - s * .44); g.lineTo(x - s * .52, y - s * .44); g.closePath(); g.fill();
    g.fillRect(x - s * .4, y - s * .46, s * .07, s * .56); g.fillRect(x + s * .33, y - s * .46, s * .07, s * .56); g.fillRect(x - s * .5, y + s * .04, s, s * .08);
  },
  pagoda(g, x, y, s, col) {
    g.fillStyle = col;
    for (let i = 0; i < 4; i++) { const w = s * (.34 - i * .06), yy = y - i * s * .24; g.beginPath(); g.moveTo(x - w * 1.5, yy - s * .13); g.quadraticCurveTo(x, yy - s * .2, x + w * 1.5, yy - s * .13); g.lineTo(x + w, yy - s * .2); g.lineTo(x - w, yy - s * .2); g.closePath(); g.fill(); g.fillRect(x - w * .7, yy - s * .14, w * 1.4, s * .16); }
    g.fillRect(x - s * .012, y - s * 1.12, s * .024, s * .2);
  },
  pine(g, x, y, s, col) {
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(1.2, s * .05); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y + 4); g.quadraticCurveTo(x + s * .08, y - s * .5, x - s * .04, y - s); g.stroke();
    [[-.04, 1, .34], [.1, .78, .3], [-.14, .6, .32], [.08, .42, .26]].forEach(([dx, dy, r]) => { g.beginPath(); g.ellipse(x + dx * s, y - dy * s, r * s, r * s * .34, -.08, 0, 6.2832); g.fill(); });
  },
  boat(g, x, y, s, col) {
    g.fillStyle = col; g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x, y + s * .42, x + s, y); g.lineTo(x + s * .7, y + s * .2); g.lineTo(x - s * .7, y + s * .2); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x - s * .3, y); g.quadraticCurveTo(x, y - s * .5, x + s * .3, y); g.closePath(); g.fill();
    g.strokeStyle = col; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x + s * .55, y - s * .05); g.lineTo(x + s * .95, y - s * .75); g.stroke();
  }
};
