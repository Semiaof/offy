'use strict';
/* =====================================================================
   Library of Limu · new offy v3 — play
   flashcard game on the card table · 听写 dictation · writing pad · answer sheet
   ===================================================================== */

/* ---------------------------------------------------------------------
   Flashcards   phases: deal → ask → (peek) → reveal → move → … → end
   --------------------------------------------------------------------- */
const Game = {
  s: null, raf: 0,

  start(cfg) {
    const words = (cfg.words || []).filter(Boolean);
    if (!words.length) { toast('ไม่มีคำศัพท์ให้เล่น'); return; }
    const st = S();
    this.teardown();
    let ask = cfg.ask || st.ask || 'zh';
    if (ask === 'listen' && !TTS.ok) { ask = 'zh'; toast('เบราว์เซอร์นี้อ่านออกเสียงไม่ได้ จึงเปลี่ยนเป็นโจทย์ตัวอักษร', { icon: 'info' }); }
    this.s = {
      cfg: { ...cfg, words }, title: cfg.title || 'Flashcards', kind: cfg.kind || 'custom', back: cfg.back || '/home',
      answer: cfg.answer || st.answer, ask, timer: cfg.timer || st.timer, sec: +(cfg.sec || st.sec) || 10,
      deck: shuffle(words), idx: 0, results: [], phase: 'deal', paused: false, finished: false, saved: false,
      ts: Date.now(), total: 0, cardMs: 0, mounted: false, backs: [], card: null, opts: null, chosen: null, combo: 0, bestCombo: 0, auto: 0, lastTick: 0
    };
    if (location.hash === '#/play') this.mount(); else Router.go('/play');
  },
  alive(s) { return this.s === s && !!s; },
  cur() { const s = this.s; return s ? s.deck[s.idx] : null; },
  onShow() {
    if (!this.s) { Router.replace('/home'); return; }
    if (!this.s.mounted) this.mount();
  },
  teardown() {
    cancelAnimationFrame(this.raf); this.raf = 0; TTS.stop();
    if (this.s) clearTimeout(this.s.auto);
    $$('#gStage .pcard').forEach(e => e.remove());
    const r = $('#gResult'); if (r) { r.hidden = true; r.innerHTML = ''; }
  },

  /* ---------- layout ---------- */
  mount() {
    const s = this.s; s.mounted = true;
    this.teardown();
    $('#gTitle').textContent = s.title;
    this.setPile('L', 0, false); this.setPile('R', 0, false);
    $('#gTimer').classList.toggle('watch', s.timer !== 'countdown'); $('#gTimer').classList.remove('done');
    $('#gPause use').setAttribute('href', '#i-pause'); $('#gPause').setAttribute('aria-label', 'พัก');
    $('#gSwipe').innerHTML = s.answer === 'self' ? 'ปัดซ้าย ยังไม่รู้ · ปัดขวา รู้แล้ว' : '';
    $('#gAnswer').innerHTML = ''; $('#gCombo').className = 'combo';
    this.updateHeader(); this._lastTimerTxt = null;
    requestAnimationFrame(() => { if (!this.alive(s)) return; this.fit(); this.loop(); this.deal(); });
  },
  /** size the card so it never covers the two piles, on any screen */
  fit() {
    const t = $('#gStage'); if (!t) return;
    const r = t.getBoundingClientRect(); if (!r.width) return;
    const pileW = r.width < 420 ? 52 : r.width < 720 ? 68 : 84;
    t.style.setProperty('--pw', pileW + 'px');
    const cw = clamp(Math.min(r.width - 2 * (pileW + 28), (r.height * 0.78) / 1.42), 150, 380);
    t.style.setProperty('--cw', Math.round(cw) + 'px');
    t.classList.toggle('compact', cw < 215);     // small cards drop the secondary example lines
  },
  setPile(side, n, bump = true) {
    const p = $('#pile' + side); p.querySelector('b').textContent = n;
    if (bump) { p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); setTimeout(() => p.classList.remove('bump'), 260); }
  },
  updateHeader() {
    const s = this.s; if (!s) return;
    const total = s.deck.length, done = s.results.length;
    $('#gProg').textContent = `การ์ด ${Math.min(done + (s.finished ? 0 : 1), total)} / ${total}`;
    $('#gBar').style.width = (done / total * 100) + '%';
    $('#gDeck').textContent = s.finished ? '' : `เหลือ ${Math.max(0, total - s.idx - (s.phase === 'deal' ? 0 : 1))} ใบ`;
  },
  setCombo(n) {
    const s = this.s, el = $('#gCombo'); s.combo = n; s.bestCombo = Math.max(s.bestCombo, n);
    if (n >= 2) { el.textContent = `ต่อเนื่อง ×${n}`; el.classList.add('show'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    else el.classList.remove('show', 'bump');
  },

  /* ---------- timer loop ---------- */
  loop() {
    cancelAnimationFrame(this.raf);
    let last = performance.now();
    const step = now => {
      const s = this.s; if (!s) return;
      const dt = Math.min(now - last, 250); last = now;
      if (!s.paused && !s.finished && s.phase !== 'deal' && !document.hidden) {
        s.total += dt;
        if (s.phase === 'ask') {
          s.cardMs += dt;
          if (s.timer === 'countdown' && s.cardMs >= s.sec * 1000) this.timeout();
        }
      }
      this.drawTimer();
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  },
  drawTimer() {
    const s = this.s; if (!s) return; const chip = $('#gTimer');
    let txt, frac;
    if (s.timer === 'countdown') {
      const lim = s.sec * 1000, rem = s.phase === 'ask' || s.phase === 'deal' ? Math.max(0, lim - s.cardMs) : (s._remFrozen ?? lim);
      if (s.phase === 'ask') {
        s._remFrozen = rem;
        const sec = Math.ceil(rem / 1000);
        if (sec <= 3 && sec > 0 && sec !== s.lastTick && !s.paused) { s.lastTick = sec; sfx('tick'); }
      }
      frac = rem / lim; txt = String(Math.ceil(rem / 1000));
    } else { frac = 1; txt = fmtClock(s.total); }
    if (txt === this._lastTimerTxt && Math.abs(frac - (this._lastFrac || 0)) < 0.004) return;
    this._lastTimerTxt = txt; this._lastFrac = frac;
    $('#gTime').textContent = txt;
    $('#gArc').style.strokeDashoffset = String(113.1 * (1 - frac));
    const cd = s.timer === 'countdown';
    chip.classList.toggle('mid', cd && frac <= 2 / 3 && frac > 1 / 3);
    chip.classList.toggle('low', cd && frac <= 1 / 3 && s.phase === 'ask');
  },

  /* ---------- dealing & drawing ---------- */
  async deal() {
    const s = this.s, table = $('#gStage');
    s.phase = 'deal'; s.backs = [];
    const n = Math.min(s.deck.length, 12);
    const rect = table.getBoundingClientRect();
    const dist = Math.max(rect.width, rect.height) * 1.1;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div'); el.className = 'pcard back';
      const rot = Math.random() * 22 - 11, dx = Math.random() * 16 - 8, dy = Math.random() * 12 - 6;
      const final = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
      el.dataset.t = final; el.style.transform = final; el.style.zIndex = 2 + i;
      table.appendChild(el); s.backs.push(el);
      const ang = Math.PI * (0.15 + Math.random() * 0.7);
      if (el.animate) el.animate([{ transform: `translate(${(Math.cos(ang) * dist).toFixed(0)}px,${(-Math.sin(ang) * dist).toFixed(0)}px) rotate(${(rot * 6).toFixed(0)}deg)` }, { transform: final }], { duration: 560, delay: i * 55, easing: 'cubic-bezier(.2,.85,.25,1)', fill: 'backwards' });
      if (i < 7) setTimeout(() => { if (this.alive(s)) sfx('deal'); }, i * 55 + 240);
    }
    await sleep(n * 55 + 520);
    if (!this.alive(s)) return;
    this.draw();
  },
  draw() {
    const s = this.s, w = s.deck[s.idx], table = $('#gStage');
    const remainingAfter = s.deck.length - s.idx - 1;
    let fromT = 'translate(0px,0px) rotate(0deg)';
    const top = s.backs[s.backs.length - 1];
    if (top) {
      fromT = top.dataset.t;
      if (s.backs.length > remainingAfter) { s.backs.pop(); top.style.opacity = '0'; setTimeout(() => top.remove(), 60); }
    }
    const card = this.cardEl(w); card.style.zIndex = 60; table.appendChild(card); s.card = card;
    s.phase = 'ask'; s.cardMs = 0; s._remFrozen = null; s.chosen = null; s.lastTick = 0; s.opts = s.answer === 'quiz' ? this.options(w) : null;
    if (card.animate) card.animate([{ transform: fromT + ' scale(.96)' }, { transform: 'translate(0px,0px) rotate(0deg) scale(1)' }], { duration: 380, easing: 'cubic-bezier(.3,1.3,.5,1)' });
    this.bindCard(card);
    this.renderAnswer(); this.updateHeader();
    if (s.ask === 'listen') setTimeout(() => { if (this.alive(s) && s.card === card && s.phase === 'ask' && !s.paused) speakWord(w); }, 260);
  },
  cardEl(w) {
    const s = this.s, el = document.createElement('div'); el.className = 'pcard live';
    const ex = w.ex_zh ? `<div class="ex"><div class="expy pyx">${esc(w.ex_py)}</div><div class="exzh">${esc(w.ex_zh)}</div><div class="exth lang-th">${esc(w.ex_th)}</div><div class="exen lang-en">${esc(w.ex_en)}</div></div>` : '';
    let front;
    if (s.ask === 'mean') { const th = S().showTh && w.th; front = `<div class="q-mean">${esc(th ? w.th : (w.en || w.th))}</div>${th && S().showEn && w.en ? `<div class="q-en">${esc(w.en)}</div>` : ''}`; }
    else if (s.ask === 'listen') front = `<button class="q-spk" data-say aria-label="ฟังอีกครั้ง">${ic('vol')}</button>`;
    else front = hzFront(w.zh);
    const tap = s.answer === 'self' ? 'แตะการ์ดเพื่อพลิกดูคำตอบ' : s.ask === 'listen' ? 'แตะลำโพงเพื่อฟังอีกครั้ง' : '';
    el.innerHTML = `<div class="flip">
      <div class="face front">${front}${tap ? `<div class="tap">${tap}</div>` : ''}</div>
      <div class="face back"><div class="top">${lvlBadge(w.lvl)}<button class="spk" data-say aria-label="ฟังเสียง">${ic('vol')}</button></div>
        <div class="py pyx">${esc(w.py)}</div><div class="zh">${esc(w.zh)}</div><div class="pos">${posBadge(w)}</div>
        <div class="th lang-th">${esc(w.th)}</div><div class="en lang-en">${esc(w.en)}</div>${ex}</div>
    </div><div class="stamp"></div><div class="tint"></div>`;
    return el;
  },
  /** 1 correct + 3 distractors with different meanings, preferring same level & part of speech */
  options(w) {
    const used = new Set([meaningText(w)]), out = [w];
    const tiers = [levelWords(w.lvl).filter(x => x._pk === w._pk), levelWords(w.lvl), WORDS.filter(x => x._pk === w._pk), WORDS];
    for (const t of tiers) {
      for (const x of shuffle(t)) {
        if (out.length >= 4) break;
        if (x.id === w.id || out.some(o => o.zh === x.zh)) continue;
        const m = meaningText(x); if (!m || used.has(m)) continue;
        used.add(m); out.push(x);
      }
      if (out.length >= 4) break;
    }
    return shuffle(out);
  },

  /* ---------- input: tap / swipe ---------- */
  bindCard(card) {
    let sx = 0, sy = 0, dx = 0, dragging = false, moved = false, pid = null;
    const tint = card.querySelector('.tint');
    const reset = () => { card.style.transition = 'transform .45s cubic-bezier(.3,1.4,.5,1)'; card.style.transform = ''; tint.style.opacity = '0'; setTimeout(() => { card.style.transition = ''; }, 460); };
    card.addEventListener('pointerdown', e => {
      if (e.target.closest('[data-say]') || !this.s || this.s.paused || !['ask', 'peek', 'reveal'].includes(this.s.phase)) return;
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; dx = 0; dragging = true; moved = false; card.style.transition = '';
      try { card.setPointerCapture(pid); } catch (err) { }
    });
    card.addEventListener('pointermove', e => {
      if (!dragging || e.pointerId !== pid) return;
      dx = e.clientX - sx; const dy = e.clientY - sy;
      if (!moved && Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      moved = true;
      const k = this.canSwipe() ? 1 : 0.18;
      card.style.transform = `translate(${dx * k}px,${dy * k * 0.35}px) rotate(${dx * k / 18}deg)`;
      if (this.canSwipe() && this.s.phase !== 'reveal') { tint.style.opacity = String(Math.min(0.32, Math.abs(dx) / 320)); tint.style.background = dx > 0 ? 'var(--good)' : 'var(--bad)'; }
    });
    const end = (e, cancelled) => {
      if (!dragging || e.pointerId !== pid) return; dragging = false;
      if (!cancelled && moved && this.canSwipe() && Math.abs(dx) > 84) { tint.style.opacity = '0'; this.swipe(dx > 0); return; }
      reset();
      if (!cancelled && !moved) this.tapCard();
    };
    card.addEventListener('pointerup', e => end(e, false));
    card.addEventListener('pointercancel', e => end(e, true));
    $$('[data-say]', card).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this.holdAuto(); speakWord(this.cur()); }));
  },
  canSwipe() { const s = this.s; return !!s && !s.paused && ((s.answer === 'self' && (s.phase === 'ask' || s.phase === 'peek')) || s.phase === 'reveal'); },
  swipe(right) { const s = this.s; if (s.phase === 'reveal') this.next(); else this.grade(right); },
  /** stop the automatic jump to the next card (the learner wants to read the answer) */
  holdAuto() { const s = this.s; if (s && s.auto) { clearTimeout(s.auto); s.auto = 0; } },
  tapCard() {
    const s = this.s;
    if (s.phase === 'ask' && s.answer === 'self') this.peek();
    else if (s.phase === 'ask') { if (s.ask === 'listen') { speakWord(this.cur()); return; } s.card.animate && s.card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }], { duration: 260 }); toast('เลือกคำตอบจากตัวเลือก', { ms: 1500 }); }
    else if (s.phase === 'peek' || s.phase === 'reveal') { this.holdAuto(); s.card.classList.toggle('flipped'); sfx('flip'); }
  },

  /* ---------- answering ---------- */
  flip(show = true) { const s = this.s; s.card.classList.toggle('flipped', show); sfx('flip'); if (show && S().autoSpeak) setTimeout(() => { if (this.alive(s) && s.card) speakWord(this.cur()); }, 180); },
  stamp(ok) {
    const card = this.s.card, st = card.querySelector('.stamp');
    st.className = 'stamp ' + (ok ? 'good' : 'bad'); st.textContent = ok ? 'ถูกต้อง' : 'ยังไม่ถูก';
    card.classList.add(ok ? 'res-ok' : 'res-no'); requestAnimationFrame(() => st.classList.add('show'));
  },
  feedback(ok) {
    const s = this.s;
    if (ok) { this.setCombo(s.combo + 1); sfx('correct', s.combo); buzz(14); }
    else { this.setCombo(0); sfx('wrong'); buzz([24, 50, 24]); }
  },
  record(ok) { const s = this.s; s.results.push({ id: this.cur().id, ok, ms: Math.round(s.cardMs) }); this.updateHeader(); },
  peek() { const s = this.s; if (s.phase !== 'ask') return; s.phase = 'peek'; this.flip(true); this.renderAnswer(); },
  choose(id) {
    const s = this.s; if (s.phase !== 'ask' || s.answer !== 'quiz') return;
    const w = this.cur(), ok = id === w.id;
    s.chosen = id; this.record(ok); s.phase = 'reveal';
    this.flip(true); this.stamp(ok); if (id !== null) this.feedback(ok); this.renderAnswer();
    if (ok && S().autoNext) s.auto = setTimeout(() => { s.auto = 0; if (this.alive(s) && s.phase === 'reveal' && !s.paused) this.next(); }, 1250);
  },
  grade(ok) {
    const s = this.s; if (s.answer !== 'self' || !(s.phase === 'ask' || s.phase === 'peek')) return;
    this.record(ok); this.stamp(ok); this.feedback(ok); this.fly(ok);
  },
  timeout() {
    const s = this.s; if (s.phase !== 'ask') return;
    s._remFrozen = 0; this.setCombo(0); sfx('timeout'); buzz([24, 50, 24]);
    toast('หมดเวลา', { icon: 'clock', ms: 1400 });
    if (s.answer === 'quiz') { this.choose(null); return; }
    this.record(false); s.phase = 'reveal'; this.flip(true); this.stamp(false); this.renderAnswer();
  },
  next() { const s = this.s; if (s.phase !== 'reveal') return; this.holdAuto(); const r = s.results[s.results.length - 1]; this.fly(r ? r.ok : false); },
  async fly(ok) {
    const s = this.s; s.phase = 'move'; TTS.stop(); sfx('swoosh');
    const card = s.card, table = $('#gStage').getBoundingClientRect(), pile = $(ok ? '#pileR' : '#pileL').getBoundingClientRect();
    const cx = table.left + table.width / 2, cy = table.top + table.height * 0.45;
    const tx = pile.left + pile.width / 2 - cx, ty = pile.top + pile.height / 2 - cy;
    const cur = card.style.transform || 'translate(0px,0px) rotate(0deg)';
    card.style.transition = '';
    $('#gAnswer').innerHTML = '';
    if (card.animate) {
      const a = card.animate([{ transform: cur, opacity: 1 }, { transform: `translate(${tx * .5}px,${ty * .3 - 26}px) rotate(${ok ? 9 : -9}deg) scale(.7)`, opacity: 1, offset: .5 }, { transform: `translate(${tx}px,${ty}px) rotate(${ok ? 16 : -16}deg) scale(.26)`, opacity: 0.15 }], { duration: 430, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
      await a.finished.catch(() => { });
    } else await sleep(10);
    if (!this.alive(s)) return;
    card.remove(); s.card = null;
    const ups = s.results.filter(r => r.ok).length;
    this.setPile(ok ? 'R' : 'L', ok ? ups : s.results.length - ups);
    s.idx++;
    if (s.idx < s.deck.length) this.draw(); else this.end();
  },

  /* ---------- answer area ---------- */
  choiceHTML(o, revealed) {
    if (this.s.ask === 'mean') return `<span class="hz">${esc(o.zh)}</span><small class="pyx" ${revealed ? '' : 'style="visibility:hidden"'}>${esc(o.py)}</small>`;
    if (S().showTh && o.th) return `<span>${esc(o.th)}</span>${S().showEn && o.en ? `<small>${esc(o.en)}</small>` : ''}`;
    return `<span>${esc(o.en || o.th)}</span>`;
  },
  renderAnswer() {
    const s = this.s, w = this.cur(), box = $('#gAnswer');
    const nextRow = `<div class="ans-row"><button class="btn fix" data-act="say" aria-label="ฟังเสียง">${ic('vol')}</button><button class="btn primary" data-act="next">ถัดไป${ic('arrow-r')}</button></div>`;
    const hint = s.answer === 'quiz' ? '1–4 เลือกคำตอบ · Enter ถัดไป · Esc พัก' : 'Space พลิก · ← ยังไม่รู้ · → รู้แล้ว · Esc พัก';
    let html = '';
    if (s.answer === 'quiz') {
      const rev = s.phase !== 'ask';
      html = `<div class="choices">${s.opts.map((o, i) => {
        const cls = rev ? (o.id === w.id ? 'correct' : (o.id === s.chosen ? 'wrong' : 'dim')) : '';
        return `<button class="choice ${cls}" style="--i:${i}" data-opt="${esc(o.id)}" ${rev ? 'disabled' : ''}><kbd>${i + 1}</kbd>${this.choiceHTML(o, rev)}</button>`;
      }).join('')}</div>`;
      // the row under the choices is always there, so the table never changes size mid-card
      html += s.phase === 'reveal' ? nextRow : `<div class="ans-row"><button class="btn ghost skip" data-act="skip">ไม่รู้ · ดูเฉลย</button></div>`;
    } else if (s.phase === 'ask') {
      html = `<div class="ans-row"><button class="btn bad" data-act="no">${ic('x')}ยังไม่รู้</button><button class="btn" data-act="peek">${ic('eye')}พลิกดู</button><button class="btn good" data-act="yes">${ic('check')}รู้แล้ว</button></div>`;
    } else if (s.phase === 'peek') {
      html = `<div class="ans-row"><button class="btn bad" data-act="no">${ic('x')}จำไม่ได้</button><button class="btn good" data-act="yes">${ic('check')}จำได้</button></div>`;
    } else if (s.phase === 'reveal') html = nextRow;
    box.innerHTML = html + `<div class="kbd-hint">${hint}</div>`;
  },
  onAnswerClick(e) {
    const s = this.s; if (!s || s.paused) return;
    const o = e.target.closest('[data-opt]'); if (o) { this.choose(o.dataset.opt); return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'next') this.next();
    else if (a === 'say') { this.holdAuto(); speakWord(this.cur()); }
    else if (a === 'peek') this.peek();
    else if (a === 'skip') { if (s.phase === 'ask') { this.setCombo(0); sfx('wrong'); this.choose(null); } }
    else if (a === 'yes') this.grade(true);
    else if (a === 'no') this.grade(false);
  },
  key(e) {
    const s = this.s; if (!s || modalOpen()) return;
    if (e.key === 'Escape' || e.key === 'p') { e.preventDefault(); if (!s.finished) this.pause(); return; }
    if (s.paused || s.finished) return;
    if (s.answer === 'quiz' && s.phase === 'ask' && /^[1-4]$/.test(e.key)) { const o = s.opts[+e.key - 1]; if (o) this.choose(o.id); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (s.phase === 'reveal') this.next(); else if (s.phase === 'ask' && s.answer === 'self') this.peek(); else if (s.phase === 'peek') { s.card.classList.toggle('flipped'); sfx('flip'); }
      return;
    }
    if (e.key === 'r' || e.key === 'R') { this.holdAuto(); if (s.phase !== 'ask' || s.ask === 'listen') speakWord(this.cur()); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { if (s.phase === 'reveal') this.next(); else if (s.answer === 'self' && (s.phase === 'ask' || s.phase === 'peek')) this.grade(e.key === 'ArrowRight'); }
  },

  /* ---------- pause / quit ---------- */
  /** top-left button: pause while playing, close once the round is over */
  topButton() { const s = this.s; if (!s) return; if (s.finished) { const back = s.back; this.teardown(); this.s = null; Router.up(back); } else this.pause(); },
  async pause() {
    const s = this.s; if (!s || s.finished || s.paused) return;
    s.paused = true; TTS.stop(); const hadAuto = !!s.auto; this.holdAuto();
    const btns = [{ label: 'เล่นต่อ', cls: 'primary', icon: 'play', value: 'resume' }, { label: 'เริ่มรอบนี้ใหม่', icon: 'retry', value: 'restart' }];
    if (s.results.length) btns.push({ label: `บันทึก ${s.results.length} การ์ดที่ทำแล้ว และออก`, icon: 'down', value: 'save' });
    btns.push({ label: 'ออกโดยไม่บันทึก', cls: 'danger', value: 'quit' });
    const v = await modal({ title: 'พักเกม', msg: `${s.title} · ทำไปแล้ว ${s.results.length}/${s.deck.length} การ์ด เวลาหยุดเดินอยู่`, buttons: btns, dismiss: 'resume' });
    if (!this.alive(s)) return;
    if (v === 'restart') this.start(s.cfg);
    else if (v === 'save') this.quit(true);
    else if (v === 'quit') this.quit(false);
    else { s.paused = false; if (hadAuto && s.phase === 'reveal') s.auto = setTimeout(() => { s.auto = 0; if (this.alive(s) && s.phase === 'reveal') this.next(); }, 700); }
  },
  quit(save) {
    const s = this.s; if (!s) return;
    if (save && s.results.length && !s.saved) { this.save(true); toast('บันทึกผลแล้ว', { icon: 'check' }); }
    const back = s.back; this.teardown(); this.s = null;
    Router.up(back);
  },
  save(partial) {
    const s = this.s; if (s.saved) return null;
    const total = s.results.length, correct = s.results.filter(r => r.ok).length;
    const sess = { mode: 'flash', kind: s.kind, label: s.title, lvl: s.cfg.lvl, stage: s.cfg.stage, ts: s.ts, dur: Math.round(s.total), total, correct, stars: Stats.starsFor(correct, total), words: s.results.map(r => [r.id, r.ok]), ask: s.ask };
    if (partial) sess.partial = true;
    s.saved = true;
    return Stats.record(sess);
  },

  /* ---------- end of round ---------- */
  async end() {
    const s = this.s; s.phase = 'end'; s.finished = true; this.updateHeader(); this.setCombo(0);
    $('#gAnswer').innerHTML = ''; $('#gTimer').classList.add('done');
    $('#gPause use').setAttribute('href', '#i-x'); $('#gPause').setAttribute('aria-label', 'ปิด');
    const best = this.save(false);
    // the cards from both piles fly back to the middle
    const table = $('#gStage'), rect = table.getBoundingClientRect();
    const n = Math.min(s.results.length, 10), anims = [];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div'); el.className = 'pcard done';
      const r = s.results[s.results.length - n + i]; const pile = $(r.ok ? '#pileR' : '#pileL').getBoundingClientRect();
      const fx = pile.left + pile.width / 2 - (rect.left + rect.width / 2), fy = pile.top + pile.height / 2 - (rect.top + rect.height * 0.45);
      const rot = Math.random() * 26 - 13;
      el.style.zIndex = 10 + i; el.style.transform = `translate(${(Math.random() * 18 - 9).toFixed(0)}px,${(Math.random() * 14 - 7).toFixed(0)}px) rotate(${rot.toFixed(0)}deg)`;
      if (i === n - 1) el.innerHTML = `<div class="face front" style="box-shadow:none">${hzFront(BY_ID.get(r.id)?.zh || '')}</div>`;
      table.appendChild(el);
      if (el.animate) anims.push(el.animate([{ transform: `translate(${fx}px,${fy}px) scale(.26) rotate(0deg)`, opacity: .3 }, { transform: el.style.transform, opacity: 1 }], { duration: 460, delay: i * 45, easing: 'cubic-bezier(.2,.85,.25,1)', fill: 'backwards' }).finished.catch(() => { }));
    }
    this.setPile('L', 0, false); this.setPile('R', 0, false); sfx('swoosh');
    for (let i = 0; i < Math.min(n, 8); i++) setTimeout(() => { if (this.alive(s)) sfx('gather', i); }, 150 + i * 60);
    await Promise.all(anims); await sleep(260);
    if (!this.alive(s)) return;
    this.showResult(best);
  },
  showResult(best) {
    const s = this.s, total = s.results.length, correct = s.results.filter(r => r.ok).length, wrong = total - correct;
    const pct = total ? Math.round(correct / total * 100) : 0, stars = Stats.starsFor(correct, total);
    const head = pct === 100 ? 'สมบูรณ์แบบ' : pct >= 70 ? 'เก่งมาก' : pct >= 30 ? 'สู้ต่อไป' : 'ลองอีกครั้งนะ';
    const nextStage = s.kind === 'stage' && s.cfg.stage < stageCount(s.cfg.lvl) ? s.cfg.stage + 1 : null;
    let bestTag = '';
    if (best && best.first) bestTag = '<span class="newbest">ผ่านด่านนี้ครั้งแรก</span>';
    else if (best && best.improved) bestTag = `<span class="newbest">สถิติใหม่ · เดิม ${best.prevPct}%</span>`;
    const avg = total ? (s.results.reduce((a, r) => a + r.ms, 0) / total / 1000).toFixed(1) : '0';
    const words = s.results.map(r => { const w = BY_ID.get(r.id); return w ? `<button class="wchip ${r.ok ? 'ok' : 'no'}" data-speak="${esc(w.id)}" title="${esc(w.py)} · ${esc(meaningText(w))}"><span class="hz">${esc(w.zh)}</span><small class="pyx">${esc(w.py)}</small></button>` : ''; }).join('');
    const toMap = s.kind === 'stage' || String(s.back).startsWith('/level');
    const res = $('#gResult');
    res.innerHTML = `<div class="panel" role="dialog" aria-label="ผลการเล่น">
      <div class="res-stars">${[0, 1, 2].map(i => `<i class="${i < stars ? 'on' : ''}" style="--i:${i}"></i>`).join('')}</div>
      ${bestTag}
      <div class="res-title">${head}</div>
      <div class="res-sub">${esc(s.title)}${s.bestCombo >= 3 ? ` · ต่อเนื่องสูงสุด ×${s.bestCombo}` : ''}</div>
      <div class="res-stats">
        <div><b style="color:var(--good)">${correct}</b><span>จำได้</span></div>
        <div><b style="color:var(--bad)">${wrong}</b><span>จำไม่ได้</span></div>
        <div><b>${pct}%</b><span>แม่นยำ</span></div>
        <div><b>${fmtClock(s.total)}</b><span>${avg} วิ/ใบ</span></div>
      </div>
      <div class="wchips">${words}</div>
      <div class="res-acts">
        ${nextStage ? `<button class="btn primary wide lg" data-r="next">ด่านถัดไป (${nextStage})${ic('arrow-r')}</button>` : ''}
        ${wrong ? `<button class="btn ${nextStage ? '' : 'primary'}" data-r="wrong">${ic('repeat')}ฝึกคำที่ผิด (${wrong})</button>` : ''}
        <button class="btn" data-r="again">${ic('retry')}เล่นอีกครั้ง</button>
        <button class="btn" data-r="back">${toMap ? 'กลับแผนที่ด่าน' : 'กลับ'}</button>
        <button class="btn ghost" data-r="home">หน้าแรก</button>
      </div></div>`;
    res.hidden = false;
    for (let i = 0; i < stars; i++) setTimeout(() => { if (this.alive(s)) sfx('star', i); }, 380 + i * 220);
    setTimeout(() => { if (!this.alive(s)) return; if (stars === 3) { sfx('complete'); Fx.confetti(); buzz([18, 40, 18, 40, 30]); } else if (stars === 0) sfx('fail'); }, 380 + stars * 220 + 80);
    res.onclick = e => {
      const sp = e.target.closest('[data-speak]'); if (sp) { speakWord(BY_ID.get(sp.dataset.speak)); return; }
      const b = e.target.closest('[data-r]'); if (!b) return;
      const r = b.dataset.r, cfg = s.cfg;
      if (r === 'wrong') this.start({ ...cfg, words: s.results.filter(x => !x.ok).map(x => BY_ID.get(x.id)).filter(Boolean), title: 'ฝึกคำที่ผิด · ' + s.title.replace(/^ฝึกคำที่ผิด · /, ''), kind: 'retry', lvl: undefined, stage: undefined });
      else if (r === 'again') this.start(cfg);
      else if (r === 'next') Level.play(cfg.lvl, nextStage);
      else if (r === 'back') { const back = s.back; this.teardown(); this.s = null; Router.up(back); }
      else if (r === 'home') { this.teardown(); this.s = null; Router.up('/home'); }
    };
  }
};

/* ---------------------------------------------------------------------
   听写 Dictation — listen → write on screen / type pinyin / paper,
   then one answer sheet for the whole round
   --------------------------------------------------------------------- */
const Dicta = {
  s: null, clock: 0,
  start(cfg) {
    const words = (cfg.words || []).filter(Boolean);
    if (!words.length) { toast('ไม่มีคำศัพท์'); return; }
    this.stop();
    this.s = {
      cfg: { ...cfg, words }, title: cfg.title || '听写', ans: cfg.ans || 'draw', repeat: clamp(+cfg.repeat || 2, 1, 3), rate: +cfg.rate || S().rate,
      meanHint: cfg.meanHint !== false, strict: cfg.strict !== false, back: cfg.back || '/practice', kind: cfg.kind || 'custom',
      words: shuffle(words), idx: 0, items: [], ts: Date.now(), ms: 0, mounted: false, done: false, saved: false
    };
    this.s.items = this.s.words.map(w => ({ id: w.id, ok: null, img: null, typed: '', hint: false, revealed: false }));
    if (location.hash === '#/dictation') this.mount(); else Router.go('/dictation');
  },
  stop() { clearInterval(this.clock); this.clock = 0; TTS.stop(); },
  onShow() { if (!this.s || this.s.done) { Router.replace('/home'); return; } if (!this.s.mounted) this.mount(); },
  mount() {
    const s = this.s; s.mounted = true;
    $('#dTitle').textContent = s.title;
    this.stop();
    let last = Date.now();
    this.clock = setInterval(() => { const now = Date.now(); if (!document.hidden && !modalOpen()) s.ms += Math.min(now - last, 2000); last = now; $('#dClock').textContent = fmtClock(s.ms); }, 500);
    $('#dClock').textContent = fmtClock(0);
    const noVoice = !TTS.ok || (TTS.loaded && !TTS.voices.length);
    $('#dNotice').innerHTML = noVoice ? `<div class="notice">${ic('info')}<div>${TTS.ok ? 'ไม่พบเสียงภาษาจีนในเครื่องนี้ ระบบจะลองอ่านด้วยเสียงเริ่มต้น ถ้าไม่มีเสียงให้กดคำใบ้พินอินแทน' : 'เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง ใช้คำใบ้พินอินหรือความหมายแทนได้'}</div></div>` : '';
    this.renderWord();
  },
  cur() { return this.s.words[this.s.idx]; },
  item() { return this.s.items[this.s.idx]; },
  renderWord() {
    const s = this.s, w = this.cur(), it = this.item();
    $('#dProg').textContent = `คำที่ ${s.idx + 1} / ${s.words.length}`;
    $('#dBar').style.width = (s.idx / s.words.length * 100) + '%';
    $('#dStatus').textContent = 'กำลังเตรียม…';
    this.renderHints();
    const work = $('#dWork');
    if (s.ans === 'draw') {
      work.innerHTML = `<div class="pad-wrap"><div class="pad-cells" id="padCells"></div>
        <div class="pad-tools"><button class="btn sm" id="padUndo">${ic('undo')}ย้อน</button><button class="btn sm" id="padClear">${ic('trash')}ล้าง</button><span class="sp"></span><button class="btn sm danger" id="dGive">ข้าม</button><button class="btn sm primary" id="dCheck">${ic('check')}ตรวจคำตอบ</button></div></div><div id="dReveal"></div>`;
      Pad.mount($('#padCells'), w._len);
      $('#padUndo').onclick = () => Pad.undo(); $('#padClear').onclick = () => Pad.clear();
      $('#dCheck').onclick = () => this.reveal(); $('#dGive').onclick = () => this.reveal(true);
    } else if (s.ans === 'type') {
      work.innerHTML = `<div class="pad-wrap"><h3 class="ct">พิมพ์พินอินของคำที่ได้ยิน</h3>
        <div class="type-row"><input class="input" id="dType" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="ni3hao3 หรือ nǐhǎo" enterkeyhint="done"><button class="btn primary" id="dCheck">ตรวจ</button></div>
        <div class="row" style="margin-top:12px"><small class="muted" style="flex:1;font-size:12.5px">${s.strict ? 'ตรวจวรรณยุกต์ด้วย ใช้ตัวเลข 1–4 หรือเครื่องหมายก็ได้ · ü พิมพ์เป็น v' : 'ตรวจเฉพาะตัวสะกด ไม่ตรวจวรรณยุกต์'}</small><button class="btn sm danger" id="dGive">ข้าม</button></div></div><div id="dReveal"></div>`;
      const inp = $('#dType');
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); this.reveal(); } };
      $('#dCheck').onclick = () => this.reveal(); $('#dGive').onclick = () => this.reveal(true);
      setTimeout(() => { if (matchMedia('(hover:hover)').matches) inp.focus(); }, 60);
    } else {
      work.innerHTML = `<div class="pad-wrap" style="text-align:center"><div class="paper-n">${s.idx + 1}</div>
        <p class="judge">เขียนคำที่ได้ยินลงกระดาษเป็นข้อ ${s.idx + 1} แล้วตรวจรวมทีเดียวตอนจบ</p>
        <div class="ans-row"><button class="btn fix" id="dPrevP" ${s.idx ? '' : 'disabled'} aria-label="ก่อนหน้า">${ic('chev-l')}</button><button class="btn primary" id="dNextP">${s.idx + 1 < s.words.length ? `คำถัดไป${ic('arrow-r')}` : 'จบ แล้วไปใบตรวจ'}</button></div></div>`;
      $('#dNextP').onclick = () => this.next();
      $('#dPrevP').onclick = () => { if (s.idx > 0) { s.idx--; this.renderWord(); } };
    }
    if (it.revealed) this.showReveal();
    this.autoPlay();
  },
  renderHints() {
    const s = this.s, w = this.cur(), it = this.item();
    const showMean = s.meanHint || it.showMean;
    $('#dHints').innerHTML =
      `<span class="hint shown">${w._len} ตัวอักษร</span>` +
      (showMean ? `<span class="hint shown">${esc(meaningText(w))}</span>` : `<button class="hint" data-h="mean">${ic('bulb')}ดูความหมาย</button>`) +
      (it.showPy ? `<span class="hint shown" style="font-family:var(--pinyin)">${esc(w.py)}</span>` : (s.ans === 'type' ? '' : `<button class="hint" data-h="py">${ic('bulb')}ดูพินอิน</button>`));
  },
  async autoPlay() { const s = this.s, idx = s.idx; await sleep(380); if (this.s === s && s.mounted && s.idx === idx && !this.item().revealed) this.play(); },
  async play(slow = false) {
    const s = this.s; if (!s) return;
    const w = this.cur(), idx = s.idx, btn = $('#dSpeak'), st = $('#dStatus');
    const tok = (this._ptok = (this._ptok || 0) + 1);
    const n = slow ? 1 : s.repeat; let failed = false;
    btn.classList.add('talking');
    for (let i = 0; i < n; i++) {
      st.textContent = TTS.ok ? `กำลังอ่าน${slow ? 'ช้า ๆ' : ''}${n > 1 ? ` (${i + 1}/${n})` : ''}` : 'อ่านออกเสียงไม่ได้ในเบราว์เซอร์นี้';
      const ok = await TTS.speak(w.zh, slow ? Math.max(0.45, s.rate * 0.6) : s.rate);
      if (tok !== this._ptok || !this.s || this.s.idx !== idx) return;
      if (!ok) { failed = true; st.textContent = TTS.ok ? 'เล่นเสียงไม่สำเร็จ แตะปุ่มอีกครั้งหรือดูคำใบ้' : 'ใช้คำใบ้แทนเสียง'; break; }
      if (i < n - 1) await sleep(900);
      if (tok !== this._ptok || !this.s || this.s.idx !== idx) return;
    }
    btn.classList.remove('talking');
    if (!failed) st.textContent = 'แตะปุ่มเพื่อฟังอีกครั้ง';
  },
  hint(kind) {
    const it = this.item();
    if (kind === 'mean') it.showMean = true;
    if (kind === 'py') { it.showPy = true; it.hint = true; }
    sfx('pop'); this.renderHints();
  },
  reveal(giveUp = false) {
    const s = this.s, it = this.item(), w = this.cur();
    if (it.revealed) return;
    if (s.ans === 'draw') {
      if (!giveUp && Pad.isEmpty()) { toast('เขียนคำตอบในช่องก่อน หรือกดข้าม'); return; }
      it.img = Pad.isEmpty() ? null : Pad.snapshot();
      it.ok = giveUp ? false : null;
      if (giveUp) sfx('wrong'); else sfx('flip');
    } else if (s.ans === 'type') {
      const v = $('#dType').value.trim();
      if (!giveUp && !v) { toast('พิมพ์พินอินก่อน หรือกดข้าม'); return; }
      it.typed = v;
      const r = giveUp ? { ok: false, letters: false } : pyCompare(v, w.py, s.strict);
      it.ok = r.ok; it.near = !r.ok && r.letters;
      $('#dType').disabled = true;
      if (r.ok) { sfx('correct', 1); buzz(14); } else { sfx('wrong'); buzz([24, 50, 24]); }
    }
    it.revealed = true;
    $$('#dWork .pad-tools .btn, #dCheck, #dGive').forEach(b => b.disabled = true);
    this.showReveal();
    TTS.stop(); this._ptok = (this._ptok || 0) + 1; $('#dSpeak').classList.remove('talking');
  },
  showReveal() {
    const s = this.s, it = this.item(), w = this.cur(), box = $('#dReveal'); if (!box) return;
    const ans = `<div class="ans-zh">${esc(w.zh)}</div><div class="ans-py">${esc(w.py)}</div><div style="font-size:14px">${esc(meaningText(w))}</div>`;
    let html = '';
    if (s.ans === 'draw') {
      html = `<div class="cmp"><div><small>ลายมือของคุณ</small>${it.img ? `<img src="${it.img}" alt="ลายมือของคุณ">` : '<div class="muted" style="padding:18px 0">ไม่ได้เขียน</div>'}</div><div><small>เฉลย</small>${ans}</div></div>`;
      html += it.ok === false && !it.img ? `<div class="verdict bad">${ic('x')}ข้ามคำนี้</div><button class="btn primary block" data-d="next">ถัดไป${ic('arrow-r')}</button>`
        : `<p class="judge">เทียบลายมือกับเฉลย แล้วตัดสินเอง</p><div class="ans-row"><button class="btn bad" data-d="no">${ic('x')}เขียนผิด</button><button class="btn good" data-d="yes">${ic('check')}เขียนถูก</button></div>`;
    } else {
      const verdict = it.ok ? `<div class="verdict good">${ic('check')}ถูกต้อง</div>` : it.typed ? `<div class="verdict bad">${ic('x')}${it.near ? 'ตัวสะกดถูก แต่วรรณยุกต์ไม่ตรง' : 'ยังไม่ถูก'}</div>` : `<div class="verdict bad">${ic('x')}ข้ามคำนี้</div>`;
      html = `<div class="cmp"><div><small>คุณพิมพ์</small><div class="ans-typed">${esc(it.typed || '—')}</div></div><div><small>เฉลย</small>${ans}</div></div>${verdict}
        <div class="ans-row">${it.typed ? `<button class="btn" data-d="flip" style="flex:0 1 auto">${it.ok ? 'นับว่าผิด' : 'นับว่าถูก'}</button>` : ''}<button class="btn primary" data-d="next">ถัดไป${ic('arrow-r')}</button></div>`;
    }
    box.innerHTML = `<div class="reveal">${html}</div>`;
    setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  },
  onRevealClick(e) {
    const b = e.target.closest('[data-d]'); if (!b || !this.s) return;
    const it = this.item(), a = b.dataset.d;
    if (a === 'yes') { it.ok = true; sfx('correct', 1); buzz(14); this.next(); }
    else if (a === 'no') { it.ok = false; sfx('wrong'); this.next(); }
    else if (a === 'flip') { it.ok = !it.ok; sfx('pop'); this.showReveal(); }
    else if (a === 'next') this.next();
  },
  next() {
    const s = this.s; TTS.stop();
    if (s.ans === 'draw' && this.item().revealed && this.item().ok === null) { toast('เลือกว่าเขียนถูกหรือผิดก่อน'); return; }
    if (s.idx + 1 < s.words.length) { s.idx++; this.renderWord(); $('.d-body').scrollTo({ top: 0, behavior: 'smooth' }); }
    else this.finish();
  },
  finish() {
    const s = this.s; s.done = true; this.stop();
    $('#dBar').style.width = '100%';
    Router.replace('/dsheet');
  },
  async quitAsk() {
    const s = this.s; if (!s) return;
    const answered = s.ans === 'paper' ? s.idx + 1 : s.items.filter(i => i.revealed).length;
    const btns = [{ label: 'ทำต่อ', cls: 'primary', icon: 'play', value: 'stay' }];
    if (answered) btns.push({ label: 'จบตอนนี้ แล้วไปใบตรวจ', icon: 'file', value: 'sheet' });
    btns.push({ label: 'ออกโดยไม่บันทึก', cls: 'danger', value: 'quit' });
    const v = await modal({ title: 'ออกจาก 听写?', msg: `ทำไปแล้ว ${s.idx}/${s.words.length} คำ`, buttons: btns, dismiss: 'stay' });
    if (!this.s) return;
    if (v === 'sheet') {
      // keep only the words already reached
      const upto = s.ans === 'paper' ? s.idx + 1 : (s.items[s.idx] && s.items[s.idx].revealed && s.items[s.idx].ok !== null ? s.idx + 1 : s.idx);
      if (!upto) { toast('ยังไม่มีคำที่ตรวจแล้ว'); return; }
      s.words = s.words.slice(0, upto); s.items = s.items.slice(0, upto);
      this.finish();
    } else if (v === 'quit') { const back = s.back; this.stop(); this.s = null; Router.up(back); }
  },
  key(e) {
    if (!this.s || modalOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); this.quitAsk(); return; }
    if (e.target.matches && e.target.matches('input')) return;
    if (e.key === 'r' || e.key === 'R') this.play();
    if (e.key === 'Enter') { const it = this.item(); if (this.s.ans === 'paper') this.next(); else if (it.revealed && (this.s.ans === 'type' || it.ok !== null)) this.next(); else if (!it.revealed) this.reveal(); }
  }
};

/* ---------- writing pad: 田字格 cells with a brush-like stroke ----------
   Apple Pencil / stylus pressure sets the stroke width; with a finger or mouse the width follows
   the writing speed (slow = thick, fast = thin). Once a pen is seen, touches are ignored (palm rejection). */
const Pad = {
  cells: [], strokes: [], cur: null, pen: false, host: null, n: 0,
  mount(host, n) {
    this.cells = []; this.strokes = []; this.cur = null; this.host = host; this.n = n;
    const size = this.layout();
    host.innerHTML = Array.from({ length: n }, (_, i) => `<div class="pad-cell" data-i="${i}"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M50 0V100M0 50H100" stroke="#e9b3ab" stroke-width=".8" stroke-dasharray="4 3" fill="none"/><path d="M0 0L100 100M100 0L0 100" stroke="#f2d2cc" stroke-width=".6" stroke-dasharray="3 4" fill="none"/></svg><canvas></canvas></div>`).join('');
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5), res = Math.max(size, 200);
    $$('.pad-cell', host).forEach((cell, i) => {
      const cv = cell.querySelector('canvas'); cv.width = res * dpr; cv.height = res * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1b1b19'; ctx.fillStyle = '#1b1b19';
      const c = { cv, ctx, size: res, i }; this.cells.push(c);
      cv.addEventListener('pointerdown', e => {
        if (e.pointerType === 'pen') this.pen = true;
        if (this.pen && e.pointerType === 'touch') return;
        if (this.cur) return;
        e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) { }
        const p = this.pt(c, e, null);
        this.cur = { cell: i, pts: [p], pid: e.pointerId };
        ctx.beginPath(); ctx.arc(p[0], p[1], p[2] / 2, 0, Math.PI * 2); ctx.fill();
      });
      cv.addEventListener('pointermove', e => {
        const k = this.cur; if (!k || k.pid !== e.pointerId || k.cell !== i) return;
        e.preventDefault();
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        (evs.length ? evs : [e]).forEach(ev => {
          const prev = k.pts[k.pts.length - 1], p = this.pt(c, ev, prev);
          if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) < 0.6) return;
          k.pts.push(p); this.seg(ctx, k.pts, k.pts.length - 1);
        });
      });
      const up = e => { const k = this.cur; if (!k || k.pid !== e.pointerId) return; this.tail(ctx, k.pts); this.strokes.push(k); this.cur = null; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    });
  },
  /** choose a cell size that fits the available width (bigger on tablets) */
  layout() {
    const host = this.host; if (!host) return 150;
    const n = this.n, width = host.clientWidth || 320, gap = 10;
    const per = n <= 2 ? n : width < 430 ? 2 : Math.min(n, 4);
    const size = Math.floor(clamp((width - gap * (per - 1)) / per, 96, 210));
    host.style.setProperty('--cell', size + 'px');
    return size;
  },
  pt(c, e, prev) {
    const r = c.cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * c.size, y = (e.clientY - r.top) / r.height * c.size, base = c.size * 0.052, t = e.timeStamp || performance.now();
    let w;
    if (e.pointerType === 'pen' && e.pressure > 0) w = base * (0.38 + e.pressure * 1.5);
    else if (!prev) w = base * 1.05;
    else { const v = Math.hypot(x - prev[0], y - prev[1]) / Math.max(1, t - prev[3]) / (c.size / 200); w = base * clamp(1.5 - v * 0.75, 0.5, 1.5); }
    if (prev) w = prev[2] * 0.72 + w * 0.28;
    return [x, y, w, t];
  },
  mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; },
  /** draw the smoothed piece of the stroke that ends before point k */
  seg(ctx, pts, k) {
    if (k < 1) return;
    const a = pts[k - 1], b = pts[k];
    ctx.lineWidth = (a[2] + b[2]) / 2; ctx.beginPath();
    if (k === 1) { const m = this.mid(a, b); ctx.moveTo(a[0], a[1]); ctx.lineTo(m[0], m[1]); }
    else { const m0 = this.mid(pts[k - 2], a), m1 = this.mid(a, b); ctx.moveTo(m0[0], m0[1]); ctx.quadraticCurveTo(a[0], a[1], m1[0], m1[1]); }
    ctx.stroke();
  },
  tail(ctx, pts) {
    const n = pts.length; if (n < 2) return;
    const a = pts[n - 2], b = pts[n - 1], m = this.mid(a, b);
    ctx.lineWidth = b[2] * 0.85; ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  },
  redraw(c) {
    const { ctx, size } = c; ctx.clearRect(0, 0, size, size);
    this.strokes.filter(s => s.cell === c.i).forEach(s => {
      const p = s.pts; ctx.beginPath(); ctx.arc(p[0][0], p[0][1], p[0][2] / 2, 0, Math.PI * 2); ctx.fill();
      for (let k = 1; k < p.length; k++) this.seg(ctx, p, k);
      this.tail(ctx, p);
    });
  },
  undo() { const s = this.strokes.pop(); if (s) { this.redraw(this.cells[s.cell]); sfx('tap'); } },
  clear() { this.strokes = []; this.cells.forEach(c => this.redraw(c)); },
  isEmpty() { return !this.strokes.length; },
  /** combine all cells into one small image (with the red grid) for the answer sheet */
  snapshot() {
    const n = this.cells.length, sz = 120, gap = 8;
    const cv = document.createElement('canvas'); cv.width = n * sz + (n - 1) * gap; cv.height = sz;
    const ctx = cv.getContext('2d');
    this.cells.forEach((c, i) => {
      const x = i * (sz + gap);
      ctx.fillStyle = '#fffdf8'; ctx.fillRect(x, 0, sz, sz);
      ctx.strokeStyle = '#d9a59c'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, 1, sz - 2, sz - 2);
      ctx.setLineDash([4, 3]); ctx.strokeStyle = '#e9b3ab'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + sz / 2, 0); ctx.lineTo(x + sz / 2, sz); ctx.moveTo(x, sz / 2); ctx.lineTo(x + sz, sz / 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.drawImage(c.cv, x, 0, sz, sz);
    });
    return cv.toDataURL('image/png');
  }
};

/* ---------- answer sheet ---------- */
const DSheet = {
  show() {
    const s = Dicta.s; if (!s || !s.done) { Router.replace('/home'); return; }
    $('#dsHint').textContent = s.ans === 'paper' ? 'ตรวจกับกระดาษของคุณ แล้วแตะถูกหรือผิดให้ครบทุกข้อ' : 'แตะเครื่องหมายเพื่อแก้ผลการตรวจได้';
    $('#dsAllOk').hidden = s.ans !== 'paper';
    this.render();
  },
  render() {
    const s = Dicta.s;
    $('#dsBody').innerHTML = s.items.map((it, i) => {
      const w = BY_ID.get(it.id); if (!w) return '';
      const yours = s.ans === 'draw' ? (it.img ? `<img src="${it.img}" alt="">` : '<span class="muted">—</span>') : s.ans === 'type' ? `<b class="ans-typed" style="font-size:17px">${esc(it.typed || '—')}</b>` : `<span class="muted">กระดาษ ข้อ ${i + 1}</span>`;
      return `<tr><td class="muted tn">${i + 1}</td><td>${yours}${it.hint ? '<small>ใช้คำใบ้พินอิน</small>' : ''}</td>
        <td><div class="row" style="gap:6px"><span class="a-zh">${esc(w.zh)}</span><button class="ibtn sm" data-speak="${esc(w.id)}" aria-label="ฟังเสียง">${ic('vol')}</button></div><small class="pyx">${esc(w.py)}</small><small>${esc(meaningText(w))}</small></td>
        <td class="c"><button class="mark ${it.ok === true ? 'ok' : ''}" data-mk="${i}" data-v="1" aria-label="ถูก">${ic('check')}</button> <button class="mark ${it.ok === false ? 'no' : ''}" data-mk="${i}" data-v="0" aria-label="ผิด">${ic('x')}</button></td></tr>`;
    }).join('');
    const ok = s.items.filter(i => i.ok === true).length, marked = s.items.filter(i => i.ok !== null).length;
    $('#dsScore').textContent = `ถูก ${ok} / ${s.items.length}${marked < s.items.length ? ` · เหลือตรวจ ${s.items.length - marked}` : ''}`;
  },
  click(e) {
    const s = Dicta.s; if (!s) return;
    const sp = e.target.closest('[data-speak]'); if (sp) { speakWord(BY_ID.get(sp.dataset.speak)); return; }
    const b = e.target.closest('[data-mk]'); if (!b) return;
    s.items[+b.dataset.mk].ok = b.dataset.v === '1'; sfx(b.dataset.v === '1' ? 'pop' : 'tap'); this.render();
  },
  allOk() { Dicta.s.items.forEach(i => { if (i.ok === null) i.ok = true; }); this.render(); },
  save() {
    const s = Dicta.s; if (!s || s.saved) return;
    const pending = s.items.filter(i => i.ok === null).length;
    if (pending) { toast(`ยังไม่ได้ตรวจอีก ${pending} ข้อ`, { icon: 'info' }); return; }
    const total = s.items.length, correct = s.items.filter(i => i.ok).length;
    Stats.record({ mode: 'dict', kind: s.kind, label: s.title, lvl: s.cfg.lvl, stage: s.cfg.stage, ts: s.ts, dur: Math.round(s.ms), total, correct, stars: Stats.starsFor(correct, total), words: s.items.map(i => [i.id, i.ok]), sub: s.ans });
    s.saved = true; sfx('save');
    if (total && correct === total) Fx.confetti(80);
    const wrong = s.items.filter(i => !i.ok).map(i => BY_ID.get(i.id)).filter(Boolean);
    const back = s.back;
    toast(`บันทึกแล้ว · ถูก ${correct}/${total} (${total ? Math.round(correct / total * 100) : 0}%)`, { icon: 'check' });
    if (wrong.length) {
      modal({ title: 'ฝึกคำที่เขียนผิดต่อไหม?', msg: `${wrong.length} คำถูกเพิ่มเข้ารายการทบทวนแล้ว`, buttons: [{ label: `听写 คำที่ผิดอีกรอบ (${wrong.length})`, cls: 'primary', icon: 'repeat', value: 'again' }, { label: 'เสร็จแล้ว', cls: 'ghost', value: 'done' }], dismiss: 'done' })
        .then(v => { const cfg = s.cfg; Dicta.s = null; if (v === 'again') { Router.replace(back); setTimeout(() => Dicta.start({ ...cfg, words: wrong, title: '听写 · คำที่ผิด', kind: 'retry', lvl: undefined, stage: undefined }), 40); } else Router.replace(back); });
    } else { Dicta.s = null; Router.replace(back); }
  },
  async discard() {
    if (!(await confirmDlg('ทิ้งผลการตรวจ?', 'ผลรอบนี้จะไม่ถูกบันทึก', 'ทิ้งผล', true))) return;
    const back = Dicta.s ? Dicta.s.back : '/home'; Dicta.s = null; Router.replace(back);
  }
};
