'use strict';
/* =====================================================================
   Library of Limu · new offy v4 — home · learn · stage road · insights
   (these views are new in v4 and written in both languages with L(th, en))
   ===================================================================== */
const YR = LANG === 'en' ? 0 : 543;
const dateLong = d => LANG === 'en' ? d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : `${TH_DAY_FULL[d.getDay()]} ${d.getDate()} ${TH_MONTH[d.getMonth()]} ${d.getFullYear() + 543}`;
const dm = d => `${d.getDate()} ${TH_MONTH[d.getMonth()]}`;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const stageLabel = (l, n) => `HSK ${l} · ${L('ด่าน', 'Stage')} ${n}`;
const isGame = m => typeof MG !== 'undefined' && !!MG[m];
const sessLabel = s => s.kind === 'stage' && s.lvl && s.stage ? (s.mode === 'dict' ? '听写 · ' : isGame(s.mode) ? gameName(s.mode) + ' · ' : '') + stageLabel(s.lvl, s.stage) : (isGame(s.mode) && s.label && !s.label.startsWith(gameName(s.mode)) ? `${gameName(s.mode)} · ${s.label}` : s.label);
const modeName = k => ASK_NAME[k] || ANS_NAME[k] || (GAME_BY_ID[k] ? GAME_BY_ID[k].name : k);
const secs = ms => (ms / 1000).toFixed(1) + L(' วิ', ' s');

/* ---------- HOME ---------- */
const Home = {
  rand: null,
  /** pull the home screen down: the sun / moon rises with your finger; let go past the line for a fresh random word */
  initPull() {
    const ind = document.createElement('div'); ind.id = 'ptr'; ind.innerHTML = `<span class="seal hz">文</span>`; document.body.appendChild(ind);
    const view = $('#v-home'), max = 120, line = 78;
    let y0 = null, dy = 0, live = false;
    const set = (d, anim) => {
      const k = clamp(d / line, 0, 1.4);
      view.style.transition = anim ? 'transform .4s var(--spring)' : 'none'; view.style.transform = d ? `translateY(${d}px)` : '';
      ind.style.transition = anim ? 'transform .4s var(--spring), opacity .3s' : 'none';
      ind.style.opacity = String(clamp(k, 0, 1)); ind.style.transform = `translate(-50%, ${d * .55 - 40}px) rotate(${k * 200 - 8}deg) scale(${.6 + Math.min(k, 1) * .4})`;
      ind.classList.toggle('ready', k >= 1);
      Scene.pull = clamp(k, 0, 1.2); if (reducedMotion()) Scene.draw();
    };
    document.addEventListener('touchstart', e => {
      if (currentView !== 'v-home' || scrollY > 2 || e.touches.length > 1 || modalOpen() || Sheet.isOpen() || e.target.closest('.nav, input')) { y0 = null; return; }
      y0 = e.touches[0].clientY; dy = 0; live = false;
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      if (y0 === null) return;
      const raw = e.touches[0].clientY - y0;
      if (raw <= 0) { if (live) set(0); live = false; return; }
      live = true; dy = max * (1 - Math.exp(-raw / (max * 1.6)));     // rubber band: the further you pull, the heavier it gets
      set(dy);
    }, { passive: true });
    const end = () => {
      if (y0 === null) return; y0 = null; if (!live) return; live = false;
      if (dy >= line) {
        sfx('flip'); buzz(12);
        const pool = RAW_WORDS.filter(w => w.lvl === (Store.d.last && Store.d.last.lvl) ) ; const src = pool.length ? pool : RAW_WORDS;
        this.rand = src[Math.floor(Math.random() * src.length)];
        ind.classList.add('spin');
        setTimeout(() => { Fx.quiet ? Fx.quiet(() => this.show()) : this.show(); ind.classList.remove('spin'); set(0, true); setTimeout(() => { Scene.pull = 0; }, 400); const card = $('#wod'); if (card && card.animate) card.animate([{ transform: 'scale(.94)', opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.2)' }); }, 380);
      } else { set(0, true); setTimeout(() => { Scene.pull = 0; }, 400); }
    };
    document.addEventListener('touchend', end, { passive: true });
    document.addEventListener('touchcancel', end, { passive: true });
  },
  show() {
    Gami.ensure();
    const now = new Date(), s = S(), d = Store.d, days = Stats.days(), t = days[ymd()] || { ms: 0, cards: 0 }, st = Stats.streak(days), rv = Stats.reviewIds().length;
    $('#hDate').textContent = dateLong(now);
    const h = now.getHours(), greet = h < 5 ? L('ดึกแล้ว ยังขยันอยู่เลย', 'Still up and studying') : h < 12 ? L('อรุณสวัสดิ์', 'Good morning') : h < 17 ? L('สวัสดีตอนบ่าย', 'Good afternoon') : h < 21 ? L('สวัสดีตอนเย็น', 'Good evening') : L('ค่ำคืนนี้อ่านอะไรดี', 'A quiet night to study');
    const last = d.last, lvl = last && levelWords(last.lvl).length ? last.lvl : LEVELS.find(l => levelWords(l).length);
    const next = Stats.suggestStage(lvl), rec = Stats.stage(lvl, next), started = Object.keys(d.stages).length > 0, rk = Gami.rank();
    $('#homeHero').innerHTML = `<div class="hero4"><canvas id="scene" aria-hidden="true"></canvas>
      <div class="hero4-in">
        <p class="h4-k">${greet}</p>
        <h2 class="h4-t">${started ? L('เรียนต่อ', 'Continue') : L('เริ่มต้นที่', 'Begin with')} ${stageLabel(lvl, next)}</h2>
        <p class="h4-s">${stageWords(lvl, next).length} ${L('คำ', 'words')} · ${rec && rec.plays ? `${L('คะแนนดีที่สุด', 'best score')} ${rec.pct}%` : L('ยังไม่เคยเล่น', 'not played yet')}</p>
        <button class="btn primary lg" id="heroBtn">${ic('play')}${L('เริ่มเลย', 'Start')}</button>
      </div>
      <button class="rankbox" id="rankBtn" aria-label="${L('ดูเส้นทางบัณฑิต', 'See the scholar\'s road')}">
        <span class="sealx fill" style="--sz:52px">${rk.cur.zh}</span>
        <span class="rk-t"><b>${esc(L(rk.cur.th, rk.cur.en))}</b><small>${fmtNum(d.xp)} XP${rk.next ? ` · ${L('อีก', '')} ${fmtNum(rk.next.xp - d.xp)} ${L('ถึง', 'to')} ${rk.next.zh}` : ''}</small><span class="xpbar"><i data-w="${rk.pct}%"></i></span></span>
      </button></div>`;
    $('#heroBtn').onclick = () => Level.play(lvl, next);
    $('#rankBtn').onclick = () => Gami.openRanks();
    Scene.mount($('#scene'), rk.i);

    const goal = s.goal || 30, gp = clamp(t.cards / goal, 0, 1);
    $('#homeTrio').innerHTML = `
      <div class="stat" style="--c:var(--accent)">${Fx.ring(gp)}<span class="k">${ic('target')}${L('เป้าหมายวันนี้', 'Today\'s goal')}</span><b class="v"><span data-count="${t.cards}">0</span><small>/${goal}</small></b><span class="s">${gp >= 1 ? L('ครบเป้าแล้ว', 'Goal reached') : `${L('การ์ด', 'cards')} · ${Math.round(t.ms / 60000)} ${L('นาที', 'min')}`}</span></div>
      <div class="stat" style="--c:var(--seal)"><span class="k">${ic('flame')}${L('เรียนต่อเนื่อง', 'Streak')}</span><b class="v"><span data-count="${st.cur}">0</span><small>${L('วัน', st.cur === 1 ? 'day' : 'days')}</small></b><span class="s">${st.today ? L('วันนี้เรียนแล้ว', 'Done for today') : st.cur ? L('เรียนวันนี้เพื่อรักษาสถิติ', 'Study today to keep it') : `${L('สูงสุด', 'best')} ${st.best} ${L('วัน', 'days')}`}</span></div>
      <button class="stat" style="--c:var(--bad)" data-go="/practice/review"><span class="k">${ic('repeat')}${L('รอทบทวน', 'To review')}</span><b class="v" ${rv ? 'style="color:var(--bad)"' : ''}><span data-count="${rv}">0</span><small>${L('คำ', 'words')}</small></b><span class="s">${rv ? L('แตะเพื่อทบทวน', 'Tap to review') : L('ไม่มีคำค้าง', 'Nothing due')}</span></button>`;

    const qs = Gami.quests(), qd = qs.filter(q => q.done).length;
    $('#homeQuests').innerHTML = `<div class="ch"><div><h3>${L('ภารกิจประจำวัน', 'Daily quests')}</h3><div class="cap">${L(`สำเร็จ ${qd} จาก ${qs.length} · ภารกิจละ 60 XP`, `${qd} of ${qs.length} done · 60 XP each`)}</div></div></div>
      ${qs.map(q => `<div class="quest ${q.done ? 'done' : ''}"><span class="q-ic">${q.done ? ic('check') : ''}</span><div class="q-m"><b>${esc(q.text)}</b><span class="bar"><i data-w="${pct(q.v, q.n)}%"></i></span></div><span class="q-n">${q.v}/${q.n}</span></div>`).join('')}`;

    const wk = []; for (let i = 6; i >= 0; i--) { const x = addDays(dayStart(), -i); wk.push({ d: x, v: days[ymd(x)] || { cards: 0, ms: 0 } }); }
    const mx = Math.max(goal, ...wk.map(x => x.v.cards)), sumC = wk.reduce((a, x) => a + x.v.cards, 0), sumM = wk.reduce((a, x) => a + x.v.ms, 0);
    $('#homeWeek').innerHTML = `<div class="ch"><div><h3>${L('7 วันล่าสุด', 'Last 7 days')}</h3><div class="cap">${fmtNum(sumC)} ${L('การ์ด', 'cards')} · ${fmtDur(sumM)}</div></div></div>
      <div class="week">${wk.map((x, i) => `<div class="wd ${x.v.cards ? 'on' : ''} ${i === 6 ? 'today' : ''}" data-tip="${dm(x.d)} · ${x.v.cards} ${L('การ์ด', 'cards')}"><i data-h="${Math.round(8 + x.v.cards / mx * 58)}px"></i><span>${TH_DAY[x.d.getDay()]}</span></div>`).join('')}</div>`;

    const w = this.rand || RAW_WORDS[(Math.floor(dayStart().getTime() / DAY) * 7919) % RAW_WORDS.length];
    $('#homeWord').innerHTML = `<div class="card wod" id="wod" role="button" tabindex="0" aria-label="${L('คำประจำวัน', 'Word of the day')} ${esc(w.zh)}">
      <svg class="grid-bg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width=".8"><rect x="10" y="10" width="80" height="80" rx="6"/><path d="M50 10v80M10 50h80" stroke-dasharray="3 3"/><path d="M10 10l80 80M90 10 10 90" stroke-dasharray="2 4"/></svg>
      <span class="k">${this.rand ? L('คำสุ่ม', 'Random word') : L('คำประจำวัน', 'Word of the day')} ${lvlBadge(w.lvl)}</span>
      <span class="wod-zh hz">${esc(w.zh)}</span><span class="wod-py pyx">${esc(w.py)}</span><span class="wod-m">${meanHTML(w)}</span>
      <button class="ibtn" data-speak="${esc(w.id)}" aria-label="${L('ฟังเสียง', 'Listen')}">${ic('vol')}</button></div>`;
    const wod = $('#wod');
    wod.onclick = e => { if (e.target.closest('[data-speak]')) { speakWord(w); return; } Dict.detail(w.id); };
    wod.onkeydown = e => { if (e.key === 'Enter' && e.target === wod) Dict.detail(w.id); };

    const got = SEALS.filter(x => d.seals[x[0]]).sort((a, b) => d.seals[b[0]] - d.seals[a[0]]);
    const nextSeal = SEALS.find(x => !d.seals[x[0]]);
    $('#homeSeals').innerHTML = `<div class="ch"><div><h3>${L('ตราประทับ', 'Seals')}</h3><div class="cap">${L(`สะสมแล้ว ${got.length} จาก ${SEALS.length} ดวง`, `${got.length} of ${SEALS.length} collected`)}</div></div><button class="btn sm" id="sealsBtn">${L('ดูทั้งหมด', 'See all')}</button></div>
      <div class="seal-row">${got.slice(0, 5).map(x => Gami.sealHTML(x, 56)).join('')}${nextSeal ? `<span class="seal-next">${Gami.sealHTML(nextSeal, 56, 'off')}<small>${L('ถัดไป: ', 'Next: ')}${esc(L(nextSeal[4], nextSeal[5]))}</small></span>` : ''}</div>`;
    $('#sealsBtn').onclick = () => Gami.openSeals();
    Fx.settle($('#v-home'));
  }
};

/* ---------- LEARN: level select ---------- */
const Learn = {
  show() {
    $('#lvGrid').innerHTML = LEVELS.map((l, i) => {
      const n = levelWords(l).length; if (!n) return '';
      const s = Stats.levelSummary(l);
      return `<a class="lv" href="#/level/${l}" style="--c:${lvlColor(l)};--i:${i}">
        <span class="lv-n hz">${'一二三四五六七八九'[l - 1]}</span>
        <span class="lv-t"><b>HSK ${l}</b><small>${fmtNum(n)} ${L('คำ', 'words')} · ${s.stages} ${L('ด่าน', 'stages')}</small></span>
        <span class="lv-pct">${s.pct}<small>%</small></span>
        <span class="bar"><i data-w="${s.pct}%"></i></span>
        <span class="lv-m"><span>${starsHTML(1, 13, 1)}${s.stars}/${s.maxStars}</span><span>${ic('mastered')}${L('จำแม่น', 'mastered')} ${fmtNum(s.mastered)}</span>${s.review ? `<span style="color:var(--bad)">${ic('repeat')}${L('ทบทวน', 'review')} ${s.review}</span>` : ''}</span>
      </a>`;
    }).join('') + `<div class="lv off" style="--c:var(--muted)"><span class="lv-n hz">七</span><span class="lv-t"><b>HSK 7–9</b><small>${L('กำลังเตรียมคำศัพท์', 'Vocabulary in preparation')}</small></span><span class="lv-pct"></span></div>`;
    Fx.settle($('#lvGrid'));
  }
};

/* ---------- LEVEL: the stage road ---------- */
const Level = {
  lvl: 1, per: 0,
  show(arg) {
    const l = parseInt(arg, 10);
    if (!levelWords(l).length) { Router.replace('/learn'); return; }
    this.lvl = l;
    const s = Stats.levelSummary(l), next = Stats.suggestStage(l), n = s.stages;
    $('#v-level').style.setProperty('--c', lvlColor(l));
    $('#lvEyebrow').textContent = `${fmtNum(s.words)} ${L('คำ', 'words')} · ${n} ${L(`ด่าน ด่านละ ${STAGE_SIZE} คำ`, `stages of ${STAGE_SIZE} words`)}`;
    $('#lvTitle').textContent = `HSK ${l}`; document.title = `HSK ${l} · Library of Limu`;
    $('#lvSummary').innerHTML = `
      <div class="stat" style="--c:${lvlColor(l)}">${Fx.ring(s.pct / 100)}<span class="k">${L('ความคืบหน้า', 'Progress')}</span><b class="v"><span data-count="${s.pct}">0</span><small>%</small></b><span class="s">${fmtNum(s.known)}/${fmtNum(s.words)} ${L('คำ', 'words')}</span></div>
      <div class="stat"><span class="k">${L('ดาวที่เก็บได้', 'Stars')}</span><b class="v"><span data-count="${s.stars}">0</span><small>/${s.maxStars}</small></b><span class="s">${L('ผ่านแล้ว', 'cleared')} ${s.cleared}/${n}</span></div>
      <div class="stat"><span class="k">${L('จำแม่นแล้ว', 'Mastered')}</span><b class="v"><span data-count="${s.mastered}">0</span><small>${L('คำ', 'words')}</small></b><span class="s">${L('กำลังเรียน', 'learning')} ${s.learning + s.review}</span></div>`;
    const rv = Store.d.review.filter(id => BY_ID.get(id) && BY_ID.get(id).lvl === l);
    $('#lvActions').innerHTML = `<button class="btn primary" id="stNext">${ic('play')}${L('ด่านแนะนำ', 'Suggested stage')} (${next})</button>
      <button class="btn" id="stRand">${ic('shuffle')}${L('สุ่ม 20 คำ', 'Random 20')}</button>
      ${rv.length ? `<button class="btn danger" id="stRev">${ic('repeat')}${L('ทบทวนคำผิด', 'Review mistakes')} (${rv.length})</button>` : ''}`;
    $('#stNext').onclick = () => this.open(next);
    $('#stRand').onclick = () => Game.start({ words: shuffle(levelWords(l)).slice(0, 20), title: `HSK ${l} · ${L('สุ่ม 20 คำ', 'Random 20')}`, kind: 'random', back: `/level/${l}` });
    if (rv.length) $('#stRev').onclick = () => Game.start({ words: rv.map(id => BY_ID.get(id)), title: `HSK ${l} · ${L('ทบทวนคำผิด', 'Review mistakes')}`, kind: 'review', back: `/level/${l}` });
    this.drawMap();
    $('#stageMap').onclick = e => { const b = e.target.closest('[data-stage]'); if (b) this.open(+b.dataset.stage); };
    Fx.settle($('#lvSummary'));
  },
  /** stages snake left-to-right, then right-to-left, joined by one inked road */
  drawMap() {
    const l = this.lvl, n = stageCount(l), next = Stats.suggestStage(l), box = $('#stageMap');
    const per = this.per = clamp(Math.floor((box.clientWidth || innerWidth - 60) / 88), 4, 10);
    let rows = '';
    for (let r = 0; r * per < n; r++) {
      let cells = '';
      for (let i = r * per + 1; i <= (r + 1) * per; i++) {
        if (i > n) { cells += '<span class="pm-node ghost"></span>'; continue; }
        const st = Stats.stage(l, i), cls = st && st.plays ? (st.stars === 3 ? 'gold' : 'done') : 'fresh';
        cells += `<button class="pm-node ${cls} ${i === next ? 'next' : ''}" style="--i:${i}" data-stage="${i}" aria-label="${L('ด่าน', 'Stage')} ${i}"><b>${i}</b>${starsHTML(st ? st.stars : 0, 9)}</button>`;
      }
      rows += `<div class="pm-row ${r % 2 ? 'rev' : ''}">${cells}</div>`;
    }
    box.innerHTML = `<svg class="pm-line" aria-hidden="true"></svg>${rows}`;
    requestAnimationFrame(() => this.layout());
  },
  /** the road between the stages is a trail of dots that only runs in the gaps (never across a stage): in the level's
      colour up to every stage that has been played, faint grey further on; the coloured dots ripple on towards the last stage */
  layout() {
    const box = $('#stageMap'); if (!box || !box.isConnected) return;
    if (clamp(Math.floor((box.clientWidth || 0) / 88), 4, 10) !== this.per) { this.drawMap(); return; }
    const r0 = box.getBoundingClientRect(), pts = $$('.pm-node[data-stage]', box).map(b => { const r = b.getBoundingClientRect(); return { x: r.left - r0.left + r.width / 2, y: r.top - r0.top + r.height / 2, half: b.offsetWidth / 2 * (b.classList.contains('next') ? 1.1 : 1), done: !b.classList.contains('fresh') }; });
    if (!pts.length) return;
    const GAP = 7, PAD = 5, D = 2.6, STEP = .09;
    // one stretch of the road: straight along a row, a bow out past the end of the row to the next one
    const curve = (a, b) => {
      if (Math.abs(a.y - b.y) < 2) return t => [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t];
      const right = a.x > r0.width / 2, room = right ? r0.width - a.x : a.x, out = (right ? 1 : -1) * clamp((room - 6) / .75, 46, 80);      // the bow peaks at 3/4 of "out", kept inside the card
      const c1 = [a.x + out, a.y], c2 = [b.x + out, b.y];
      return t => { const u = 1 - t; return [u * u * u * a.x + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b.x, u * u * u * a.y + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b.y]; };
    };
    const inside = (p, n) => Math.max(Math.abs(p[0] - n.x), Math.abs(p[1] - n.y)) < n.half + PAD;      // nodes are (rounded) squares
    let dots = '', k = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], at = curve(a, b), N = 80, smp = [];
      let len = 0, prev = at(0);
      for (let s = 0; s <= N; s++) { const p = at(s / N); len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; smp.push({ p, len, free: !inside(p, a) && !inside(p, b) }); }
      const free = smp.filter(s => s.free); if (!free.length) continue;
      const s0 = free[0].len, s1 = free[free.length - 1].len, cnt = Math.max(1, Math.floor((s1 - s0) / GAP) + 1), off = (s1 - s0 - (cnt - 1) * GAP) / 2;
      for (let j = 0; j < cnt; j++) {
        const want = s0 + off + j * GAP, q = smp.find(s => s.len >= want) || smp[smp.length - 1];
        dots += b.done
          ? `<circle class="pd on" cx="${q.p[0].toFixed(1)}" cy="${q.p[1].toFixed(1)}" r="2.4" style="animation-delay:${((k * STEP) % D - D).toFixed(2)}s"/>`
          : `<circle class="pd" cx="${q.p[0].toFixed(1)}" cy="${q.p[1].toFixed(1)}" r="2.1"/>`;
        k++;
      }
    }
    const svg = $('.pm-line', box); svg.setAttribute('viewBox', `0 0 ${r0.width} ${box.scrollHeight}`); svg.style.height = box.scrollHeight + 'px';
    svg.innerHTML = dots;
  },
  open(n) {
    const l = this.lvl, words = stageWords(l, n), st = Stats.stage(l, n);
    let game = GAME_BY_ID[S().stageGame] ? S().stageGame : 'flash';
    const body = `<div class="sheet-h"><div><h3>${stageLabel(l, n)}</h3><p>${st && st.plays ? L(`เล่นแล้ว ${st.plays} ครั้ง · ดีที่สุด ${st.pct}%`, `played ${st.plays}× · best ${st.pct}%`) : L('ยังไม่เคยเล่น', 'Not played yet')}</p></div>${starsHTML(st ? st.stars : 0, 20)}</div>
      <h4 class="sh-sub">${L('เล่นด่านนี้ด้วย', 'Play this stage as')}</h4>${gamePickerHTML(game)}
      <h4 class="sh-sub">${L('คำในด่าน', 'Words in this stage')}</h4>${words.map(w => wordRowHTML(w)).join('')}`;
    const label = () => `${ic('play')}${L('เล่น', 'Play')} ${gameName(game)}`;
    Sheet.open(body, `<button class="btn primary wide" id="shPlay">${label()}</button>`);
    $('#shPlay').onclick = () => { Sheet.close(); this.play(l, n, game); };
    $('#sheetBody').onclick = e => {
      const g = e.target.closest('[data-game]');
      if (g) { game = g.dataset.game; S().stageGame = game; Store.save(); $$('#sheetBody .gp').forEach(b => { b.classList.toggle('on', b === g); b.setAttribute('aria-checked', b === g); }); $('#shPlay').innerHTML = label(); sfx('pop'); return; }
      const b = e.target.closest('[data-speak]'); if (b) speakWord(BY_ID.get(b.dataset.speak));
    };
  },
  /** play a stage with the chosen game (the one picked last time when none is given) */
  play(l, n, game) {
    const words = stageWords(l, n); if (!words.length) return;
    playGame(game || (GAME_BY_ID[S().stageGame] ? S().stageGame : 'flash'), { words, title: stageLabel(l, n), kind: 'stage', lvl: l, stage: n, back: `/level/${l}` });
  }
};

/* ---------- INSIGHTS (the dashboard) ----------
   Five tabs. Everything is computed from the saved rounds: each round keeps every answer
   (word, right/wrong and — from v4 on — the seconds it took), so the numbers can be cut any way. */
const ASK_NAME = { zh: L('字 → ความหมาย', '字 → meaning'), mean: L('ความหมาย → 字', 'Meaning → 字'), listen: L('ฟัง → ความหมาย', 'Listening') };
const ANS_NAME = { quiz: L('4 ตัวเลือก', 'Multiple choice'), self: L('พลิกตรวจเอง', 'Self-check'), draw: L('听写 เขียนบนจอ', 'Dictation · handwriting'), type: L('听写 พิมพ์พินอิน', 'Dictation · typed pinyin'), paper: L('听写 กระดาษ', 'Dictation · paper') };
const BOX_NAME = [L('ต้องทวน', 'Relearn'), L('1 วัน', '1 day'), L('3 วัน', '3 days'), L('7 วัน', '7 days'), L('14 วัน', '14 days'), L('30 วัน', '30 days')];
const StatsView = {
  range: 30, tab: 'over', pmode: 'line', hidden: new Set(), day: null, histMode: 'all', histN: 15, openLv: null, _bk: null, _c: null,
  init() {
    $('#stRange').addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (!b) return; this.range = +b.dataset.r; this.show(); });
    $('#stTabs').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; this.tab = b.dataset.v; this.show(); scrollTo({ top: 0 }); });
    $('#stBody').addEventListener('click', e => {
      const q = sel => e.target.closest(sel);
      let x;
      if ((x = q('[data-speak]'))) { speakWord(BY_ID.get(x.dataset.speak)); return; }
      if ((x = q('#stPmode [data-v]'))) { this.pmode = x.dataset.v; this.drawProgress(); return; }
      if ((x = q('[data-lv]'))) { const l = +x.dataset.lv; if (this.hidden.has(l)) this.hidden.delete(l); else this.hidden.add(l); this.drawProgress(); return; }
      if ((x = q('[data-day]'))) { this.day = this.day === x.dataset.day ? null : x.dataset.day; this.renderDay(); return; }
      if ((x = q('[data-sg]'))) { const [l, n] = x.dataset.sg.split('-').map(Number); Level.lvl = l; Level.open(n); return; }
      if ((x = q('[data-openlv]'))) { const l = +x.dataset.openlv; this.openLv = this.openLv === l ? null : l; this.show(true); return; }
      if ((x = q('[data-word]'))) { Dict.detail(x.dataset.word); return; }
      if ((x = q('#stHmode [data-v]'))) { this.histMode = x.dataset.v; this.histN = 15; this.show(true); return; }
      if ((x = q('#stMore'))) { this.histN += 20; this.show(true); return; }
      if ((x = q('#stHard'))) { Game.start({ words: this._c.hard.map(h => h.w), title: L('ฝึกคำที่พลาดบ่อย', 'Most-missed words'), kind: 'review', back: '/stats' }); return; }
      if ((x = q('.sess .h'))) x.parentElement.classList.toggle('open');
    });
  },
  buckets(R) {
    const today = dayStart(), out = [];
    if (R === 7 || R === 30) for (let i = R - 1; i >= 0; i--) { const d = addDays(today, -i); out.push({ label: R === 7 ? TH_DAY[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`, full: dm(d), from: d.getTime(), to: addDays(d, 1).getTime() }); }
    else if (R === 90) for (let i = 12; i >= 0; i--) { const to = addDays(today, 1 - i * 7), from = addDays(to, -7); out.push({ label: `${from.getDate()}/${from.getMonth() + 1}`, full: `${dm(from)} – ${dm(addDays(to, -1))}`, from: from.getTime(), to: to.getTime() }); }
    else for (let i = 11; i >= 0; i--) { const m = new Date(today.getFullYear(), today.getMonth() - i, 1), e = new Date(today.getFullYear(), today.getMonth() - i + 1, 1); out.push({ label: TH_MONTH[m.getMonth()], full: `${TH_MONTH[m.getMonth()]} ${m.getFullYear() + YR}`, from: m.getTime(), to: e.getTime() }); }
    return out;
  },
  /** every answer ever saved, oldest first, with the memory box the word sat in beforehand */
  answers() {
    const box = {}, out = [], mast = {};
    [...Store.d.sessions].sort((a, b) => a.ts - b.ts).forEach(s => {
      if (s.lg) return;
      (s.words || []).forEach(([id, ok, ms]) => {
        if (ok === null || ok === undefined) return;
        const w = BY_ID.get(id); if (!w) return;
        out.push({ id, w, ok: !!ok, ms: ms || 0, ts: s.ts, mode: s.mode, ask: s.mode === 'dict' ? null : isGame(s.mode) ? s.mode : (s.ask || 'zh'), ans: s.mode === 'dict' ? (s.sub || 'draw') : isGame(s.mode) ? s.mode : (s.answer || 'quiz'), box: box[id] || 0, first: !(id in box) });
        box[id] = ok ? Math.min(5, (box[id] || 0) + 1) : 0;
        if (box[id] === 2 && ok) mast[id] = s.ts; else if (!ok) delete mast[id];
      });
    });
    return { list: out, mast };
  },
  agg(list) { const n = list.length, ok = list.filter(a => a.ok).length, timed = list.filter(a => a.ms > 0); return { n, ok, acc: pct(ok, n), ms: timed.length ? timed.reduce((a, x) => a + x.ms, 0) / timed.length : 0, fresh: list.filter(a => a.first).length }; },
  /** "+12%" against the period before */
  delta(cur, prev, { pp = false, lowGood = false } = {}) {
    if (!this.range || prev === null || prev === undefined || (!prev && !cur)) return '';
    if (!pp && !prev) return `<em class="dl up">${L('เพิ่งเริ่ม', 'new')}</em>`;      // nothing in the period before: a percentage would mean nothing
    const dv = pp ? cur - prev : Math.round((cur - prev) / prev * 100);
    if (!dv) return `<em class="dl">${L('เท่าเดิม', 'no change')}</em>`;
    const good = lowGood ? dv < 0 : dv > 0;
    return `<em class="dl ${good ? 'up' : 'down'}">${dv > 0 ? '+' : '−'}${Math.abs(dv)}${pp ? L(' จุด', ' pts') : '%'}</em>`;
  },
  compute() {
    const d = Store.d, R = this.range, bk = this._bk = this.buckets(R), since = R ? bk[0].from : -Infinity, span = R * DAY, prevFrom = since - span, days = Stats.days();
    const { list, mast } = this.answers(), inR = list.filter(a => a.ts >= since), inP = R ? list.filter(a => a.ts >= prevFrom && a.ts < since) : [];
    let ms = 0, pms = 0, active = 0, sessN = 0;
    bk.forEach(b => { b.cards = 0; b.correct = 0; b.ms = 0; });
    Object.entries(days).forEach(([k, v]) => {
      const ts = new Date(k + 'T00:00:00').getTime(), b = bk.find(x => ts >= x.from && ts < x.to);
      if (b) { b.cards += v.cards; b.correct += v.correct; b.ms += v.ms; }
      if (ts >= since) { ms += v.ms; sessN += v.sessions; if (v.sessions > 0 || v.cards > 0) active++; } else if (R && ts >= prevFrom) pms += v.ms;
    });
    const sess = d.sessions.filter(s => s.ts >= since), psess = R ? d.sessions.filter(s => s.ts >= prevFrom && s.ts < since) : [];
    const sum = (a, k) => a.reduce((x, s) => x + (s[k] || 0), 0);
    const tot = { cards: sum(sess, 'total'), correct: sum(sess, 'correct'), pcards: sum(psess, 'total'), pcorrect: sum(psess, 'correct') };
    // per-word totals for the tables
    const per = {};
    list.forEach(a => { const p = per[a.id] || (per[a.id] = { w: a.w, n: 0, bad: 0, ms: 0, tn: 0, last: 0 }); p.n++; if (!a.ok) p.bad++; if (a.ms > 0 && a.ok) { p.ms += a.ms; p.tn++; } p.last = a.ts; });
    const words = Object.values(per);
    const hard = words.filter(p => p.bad > 0).sort((a, b) => b.bad - a.bad || a.n - b.n).slice(0, 15);
    const slow = words.filter(p => p.tn >= 2).map(p => ({ ...p, avg: p.ms / p.tn })).sort((a, b) => b.avg - a.avg).slice(0, 10);
    return this._c = { d, R, bk, since, days, list, mast, inR, inP, cur: this.agg(inR), prev: this.agg(inP), ms, pms, active, sessN, sess, tot, hard, slow, streak: Stats.streak(days), rangeName: R ? L(`${R} วันล่าสุด`, `last ${R} days`) : L('ทั้งหมด', 'all time'), unit: R === 7 || R === 30 ? L('วัน', 'day') : R === 90 ? L('สัปดาห์', 'week') : L('เดือน', 'month') };
  },
  show(keepScroll) {
    segSet($('#stRange'), this.range); segSet($('#stTabs'), this.tab);
    const d = Store.d, body = $('#stBody'), y = scrollY;
    if (!d.sessions.length && !Object.keys(d.legacy.days || {}).length && !Object.keys(d.stages).length) {
      body.innerHTML = `<div class="card">${emptyHTML('chart', L('ยังไม่มีข้อมูล', 'Nothing to show yet'), L('เล่นแฟลชการ์ดหรือ 听写 สักรอบ แล้วสถิติจะขึ้นที่นี่', 'Play a round of flashcards or dictation and your numbers appear here'), `<br><a class="btn primary" href="#/learn">${ic('play')}${L('เริ่มเรียน', 'Start learning')}</a>`)}</div>`;
      return;
    }
    // a long history takes a moment to add up: show the shape of the page first (shimmering cards), fill it in a frame later
    if (!keepScroll && !this._skel) {
      const n = d.sessions.reduce((a, x) => a + (x.words ? x.words.length : 0), 0);
      if (n > 1500) {
        body.innerHTML = `<div class="skel-grid">${'<div class="skel s1"></div>'.repeat(6)}</div><div class="skel-grid two"><div class="skel s2"></div><div class="skel s2"></div></div>`;
        this._skel = true; setTimeout(() => { if (currentView === 'v-stats') this.show(); this._skel = false; }, 60); return;
      }
    }
    const c = this.compute(), eb = $('#v-stats .eyebrow');
    if (eb) eb.textContent = L(`จาก ${fmtNum(c.list.length)} คำตอบ · ${fmtNum(d.sessions.length)} รอบที่บันทึกไว้`, `${fmtNum(c.list.length)} answers · ${fmtNum(d.sessions.length)} rounds on record`);
    body.innerHTML = this['tab_' + this.tab](c);
    this['after_' + this.tab] && this['after_' + this.tab](c);
    Fx.settle(body);
    if (keepScroll) scrollTo(0, y);
  },
  card(title, cap, inner, cls = '', extra = '') { return `<div class="card ${cls}"><div class="ch"><div><h3>${title}</h3>${cap ? `<div class="cap">${cap}</div>` : ''}</div>${extra}</div>${inner}</div>`; },

  /* ----- 1 · overview ----- */
  tab_over(c) {
    const { cur, prev, tot, R } = c, rv = Stats.reviewIds().length;
    const kpi = (icon, color, label, value, sub, dl = '') => `<div class="stat" style="--c:${color}"><span class="k">${ic(icon)}${label}</span><b class="v">${value}</b><span class="s">${sub}</span>${dl}</div>`;
    let h = rv ? `<button class="cta-rv" data-go="/practice/review"><span class="li-ic">${ic('repeat')}</span><span class="li-t"><b>${rv} ${L('คำรอทบทวน', 'words to review')}</b><small>${L('คำที่ตอบผิดและคำที่ถึงรอบทบทวน แตะเพื่อเริ่ม', 'Missed words and words whose interval is up — tap to start')}</small></span>${ic('chev-r')}</button>` : '';
    h += `<div class="kpis six">
      ${kpi('clock', 'var(--hsk5)', L('เวลาเรียน', 'Study time'), `<span class="vt">${fmtDur(c.ms)}</span>`, c.rangeName, this.delta(Math.round(c.ms / 60000), R ? Math.round(c.pms / 60000) : null))}
      ${kpi('cards', 'var(--hsk6)', L('การ์ดที่ตอบ', 'Cards answered'), `<span data-count="${tot.cards}">0</span>`, `${fmtNum(c.sessN)} ${L('รอบ', 'rounds')}`, this.delta(tot.cards, R ? tot.pcards : null))}
      ${kpi('target', 'var(--good)', L('ความแม่นยำ', 'Accuracy'), tot.cards ? `<span data-count="${pct(tot.correct, tot.cards)}">0</span><small>%</small>` : '—', `${fmtNum(tot.correct)}/${fmtNum(tot.cards)}`, tot.cards && tot.pcards ? this.delta(pct(tot.correct, tot.cards), pct(tot.pcorrect, tot.pcards), { pp: true }) : '')}
      ${kpi('plus', 'var(--accent)', L('คำใหม่ที่ได้เจอ', 'New words met'), `<span data-count="${cur.fresh}">0</span>`, L('เจอครั้งแรกในช่วงนี้', 'seen for the first time'), this.delta(cur.fresh, R ? prev.fresh : null))}
      ${kpi('bolt', 'var(--gold)', L('เวลาต่อการ์ด', 'Time per card'), cur.ms ? `<span class="vt">${secs(cur.ms)}</span>` : '—', cur.ms ? L('เฉลี่ยเฉพาะที่จับเวลาไว้', 'average of timed answers') : L('เริ่มเก็บตั้งแต่รุ่นนี้', 'recorded from this version on'), cur.ms && prev.ms ? this.delta(Math.round(cur.ms / 100), Math.round(prev.ms / 100), { lowGood: true }) : '')}
      ${kpi('flame', 'var(--seal)', L('เรียนต่อเนื่อง', 'Streak'), `<span data-count="${c.streak.cur}">0</span><small>${L('วัน', 'd')}</small>`, `${L('สูงสุด', 'best')} ${c.streak.best} · ${L('เข้าเรียน', 'active')} ${c.active}${R ? '/' + R : ''} ${L('วัน', 'd')}`)}
    </div>`;
    const ins = this.insights(c);
    h += '<div class="st-grid">';
    if (ins.length) h += this.card(L('ข้อสังเกตจากข้อมูลของคุณ', 'What your data says'), L('คำนวณจากคำตอบทุกข้อที่บันทึกไว้', 'worked out from every answer you have saved'), `<ul class="ins">${ins.map(x => `<li>${ic(x[0])}<span>${x[1]}</span></li>`).join('')}</ul>`, 'span2');
    h += this.card(L(`การ์ดต่อ${c.unit}`, `Cards per ${c.unit}`), L('เขียว = ตอบถูก · แดง = ตอบผิด · แตะแท่งเพื่อดูตัวเลข', 'green = right · red = wrong · tap a bar for numbers'), '<div class="chart" id="cCards"></div>');
    h += this.card(L(`เวลาเรียนต่อ${c.unit}`, `Minutes per ${c.unit}`), c.R ? c.rangeName : L('12 เดือนล่าสุด', 'last 12 months'), '<div class="chart" id="cMins"></div>');
    h += this.card(L('ความแม่นยำ', 'Accuracy'), L(`ราย${c.unit} · เฉพาะช่วงที่มีการเล่น`, `per ${c.unit} · only where you played`), '<div class="chart" id="cAcc"></div>');
    h += this.card(L('วันและเวลาที่เรียน', 'When you study'), L('สีเข้ม = เรียนนานกว่า · แตะช่องเพื่อดูนาทีและความแม่นยำ', 'darker = more minutes · tap a cell for minutes and accuracy'), `<div id="stMatrix"></div>`);
    h += this.card(L('ปฏิทินการเรียน', 'Study calendar'), L('26 สัปดาห์ล่าสุด · แตะวันเพื่อดูรายละเอียดของวันนั้น', 'last 26 weeks · tap a day for its details'), `<div class="heat-wrap" id="stHeat"></div><div id="stDay"></div>`, 'span2');
    return h + '</div>';
  },
  insights(c) {
    const out = [], { inR, list } = c, src = inR.length >= 30 ? inR : list;
    if (src.length < 20) return out;
    const slot = ['00–04', '04–08', '08–12', '12–16', '16–20', '20–24'], bySlot = slot.map(() => []);
    src.forEach(a => bySlot[Math.floor(new Date(a.ts).getHours() / 4)].push(a));
    const sl = bySlot.map((x, i) => ({ i, ...this.agg(x) })).filter(x => x.n >= 15).sort((a, b) => b.acc - a.acc);
    if (sl.length >= 2 && sl[0].acc - sl[sl.length - 1].acc >= 4) out.push(['clock', L(`คุณแม่นที่สุดช่วง <b>${slot[sl[0].i]} น.</b> (${sl[0].acc}%) และพลาดมากสุดช่วง ${slot[sl[sl.length - 1].i]} น. (${sl[sl.length - 1].acc}%)`, `You are sharpest at <b>${slot[sl[0].i]}</b> (${sl[0].acc}%) and weakest at ${slot[sl[sl.length - 1].i]} (${sl[sl.length - 1].acc}%)`)]);
    const pos = {}; src.forEach(a => (pos[a.w._pk] = pos[a.w._pk] || []).push(a));
    const ps = Object.entries(pos).map(([k, x]) => ({ k, ...this.agg(x) })).filter(x => x.n >= 15).sort((a, b) => a.acc - b.acc);
    if (ps.length >= 2 && ps[ps.length - 1].acc - ps[0].acc >= 5) out.push(['info', L(`<b>${POS_NAME[ps[0].k] || ps[0].k}</b> เป็นชนิดคำที่พลาดบ่อยสุด (${ps[0].acc}%) ส่วน ${POS_NAME[ps[ps.length - 1].k]} แม่นสุด (${ps[ps.length - 1].acc}%)`, `<b>${POS_NAME[ps[0].k] || ps[0].k}</b> trips you up most (${ps[0].acc}%); ${POS_NAME[ps[ps.length - 1].k]} is your strongest (${ps[ps.length - 1].acc}%)`)]);
    const len = {}; src.forEach(a => { const k = Math.min(3, a.w._len); (len[k] = len[k] || []).push(a); });
    const l1 = len[1] && this.agg(len[1]), l2 = len[2] && this.agg(len[2]);
    if (l1 && l2 && l1.n >= 15 && l2.n >= 15 && Math.abs(l1.acc - l2.acc) >= 5) out.push(['cards', l1.acc < l2.acc ? L(`คำตัวเดียวยากกว่าคำ 2 ตัวสำหรับคุณ (${l1.acc}% เทียบกับ ${l2.acc}%) เพราะไม่มีตัวข้างเคียงช่วยเดา`, `Single characters are harder for you than two-character words (${l1.acc}% vs ${l2.acc}%) — no neighbour to lean on`) : L(`คำ 2 ตัวยากกว่าคำตัวเดียวสำหรับคุณ (${l2.acc}% เทียบกับ ${l1.acc}%)`, `Two-character words are harder for you than single characters (${l2.acc}% vs ${l1.acc}%)`)]);
    const first = this.agg(src.filter(a => a.first)), rev = this.agg(src.filter(a => !a.first && a.box >= 2));
    if (first.n >= 15 && rev.n >= 15) out.push(['mastered', L(`คำที่จำแม่นแล้ว เมื่อกลับมาเจออีกครั้งคุณยังตอบถูก <b>${rev.acc}%</b> (เจอครั้งแรกตอบถูก ${first.acc}%)`, `Words you had mastered still come back right <b>${rev.acc}%</b> of the time (first sight: ${first.acc}%)`)]);
    const lv = c.d.last && c.d.last.lvl;
    if (lv && levelWords(lv).length) {
      const tl = Stats.timeline([Date.now() - 14 * DAY, Date.now()]), gain = tl[1][lv] - tl[0][lv], left = levelWords(lv).length - tl[1][lv];
      if (gain > 0 && left > 0) out.push(['line', L(`14 วันที่ผ่านมาคุณผ่านคำ HSK ${lv} เพิ่ม ${gain} คำ ถ้ารักษาจังหวะนี้จะจบระดับในอีกราว <b>${Math.ceil(left / (gain / 14))} วัน</b>`, `You cleared ${gain} more HSK ${lv} words in the last 14 days — at this pace the level is done in about <b>${Math.ceil(left / (gain / 14))} days</b>`)]);
    }
    const tomorrow = dayStart(addDays(new Date(), 2)).getTime(), dueT = Object.entries(c.d.ws).filter(([id, w]) => w.b >= 1 && w.t && Stats.dueAt(w) > Date.now() && Stats.dueAt(w) < tomorrow && BY_ID.has(id)).length;
    if (dueT) out.push(['cal', L(`พรุ่งนี้จะมีคำถึงรอบทบทวนอีก <b>${dueT} คำ</b>`, `<b>${dueT} words</b> come due for review tomorrow`)]);
    return out.slice(0, 5);
  },
  after_over(c) {
    const bk = c.bk;
    Charts.stacked($('#cCards'), bk.map(b => ({ label: b.label, tip: b.cards ? `${b.full} · ${b.cards} ${L('การ์ด', 'cards')} · ${L('ถูก', 'right')} ${b.correct} (${pct(b.correct, b.cards)}%)` : '' })), [{ color: 'var(--good)', values: bk.map(b => b.correct) }, { color: 'var(--bad)', values: bk.map(b => b.cards - b.correct) }], { h: 170, minStep: 17 });
    Charts.bars($('#cMins'), bk.map(b => ({ label: b.label, v: Math.round(b.ms / 60000), tip: `${b.full} · ${fmtDur(b.ms)}` })), { h: 170, color: 'var(--hsk5)', minStep: 17 });
    Charts.lines($('#cAcc'), bk.map(b => ({ label: b.label, tip: b.cards ? `${b.full} · ${pct(b.correct, b.cards)}% (${b.correct}/${b.cards})` : '' })), [{ color: 'var(--accent)', values: bk.map(b => b.cards ? pct(b.correct, b.cards) : null) }], { h: 170, max: 100, suffix: '%', area: true, minStep: 17 });
    // weekday × time-of-day
    const slot = ['00', '04', '08', '12', '16', '20'], m = Array.from({ length: 7 }, () => slot.map(() => ({ ms: 0, n: 0, ok: 0 })));
    c.sess.filter(s => !s.lg).forEach(s => { const dt = new Date(s.ts), x = m[dt.getDay()][Math.floor(dt.getHours() / 4)]; x.ms += s.dur || 0; x.n += s.total || 0; x.ok += s.correct || 0; });
    const mx = Math.max(1, ...m.flat().map(x => x.ms));
    $('#stMatrix').innerHTML = `<div class="mx"><span></span>${slot.map(x => `<span class="mx-h">${x}</span>`).join('')}${[1, 2, 3, 4, 5, 6, 0].map(dw => `<span class="mx-d">${TH_DAY[dw]}</span>` + m[dw].map((x, i) => `<i style="--o:${x.ms ? (.18 + .82 * x.ms / mx).toFixed(2) : 0}" data-tip="${TH_DAY_FULL[dw]} ${slot[i]}:00–${pad2(+slot[i] + 4)}:00 · ${x.ms ? `${fmtDur(x.ms)} · ${pct(x.ok, x.n)}%` : L('ไม่ได้เรียน', 'no study')}"></i>`).join('')).join('')}</div>`;
    this.heatmap($('#stHeat'), c.days); this.renderDay();
  },
  heatmap(el, days) {
    const today = dayStart(), weeks = 26, first = addDays(today, -((weeks - 1) * 7 + today.getDay()));
    let cells = '';
    for (let i = 0; i < weeks * 7; i++) {
      const dd = addDays(first, i);
      if (dd > today) { cells += '<i class="pad"></i>'; continue; }
      const k = ymd(dd), v = days[k], min = v ? v.ms / 60000 : 0, act = v && (v.sessions || v.cards), lv = !act ? 0 : min < 5 ? 1 : min < 15 ? 2 : min < 30 ? 3 : 4;
      cells += `<i class="${lv ? 'l' + lv : ''} ${k === ymd(today) ? 'today' : ''} ${k === this.day ? 'sel' : ''}" data-day="${k}" data-tip="${dm(dd)} ${dd.getFullYear() + YR} · ${act ? `${Math.round(min)} ${L('นาที', 'min')} · ${v.cards} ${L('การ์ด', 'cards')}` : L('ไม่ได้เรียน', 'no study')}"></i>`;
    }
    const cell = clamp(Math.floor(((el.clientWidth || 400) - 25 * 3) / 26), 11, 18);
    el.innerHTML = `<div class="heat" style="--hc:${cell}px">${cells}</div>`; el.scrollLeft = el.scrollWidth;
  },
  renderDay() {
    const box = $('#stDay'); if (!box) return;
    $$('#stHeat i').forEach(i => i.classList.toggle('sel', i.dataset.day === this.day));
    if (!this.day) { box.innerHTML = ''; return; }
    const list = Store.d.sessions.filter(s => ymd(new Date(s.ts)) === this.day).sort((a, b) => a.ts - b.ts), dt = new Date(this.day + 'T00:00:00');
    const n = list.reduce((a, s) => a + (s.total || 0), 0), ok = list.reduce((a, s) => a + (s.correct || 0), 0), ms = list.reduce((a, s) => a + (s.dur || 0), 0);
    box.innerHTML = `<div class="daybox"><div class="row"><b>${dateLong(dt)}</b><span class="muted">${list.length ? `${n} ${L('การ์ด', 'cards')} · ${pct(ok, n)}% · ${fmtDur(ms)}` : L('ไม่ได้เรียนวันนี้', 'no study that day')}</span></div>${list.map(s => this.sessHTML(s)).join('')}</div>`;
  },
  sessHTML(s) {
    const p = pct(s.correct, s.total), icn = s.mode === 'dict' ? 'brush' : isGame(s.mode) ? GAME_BY_ID[s.mode].icon : s.kind === 'review' || s.kind === 'retry' ? 'repeat' : s.kind === 'stage' ? 'learn' : 'cards';
    const det = (s.words || []).map(([id, ok, ms]) => { const w = BY_ID.get(id); return w ? `<span class="wchip ${ok ? 'ok' : 'no'}"><span class="hz">${esc(w.zh)}</span>${ms ? `<small>${(ms / 1000).toFixed(1)}</small>` : ''}</span>` : ''; }).join('');
    const tags = [s.mode === 'dict' ? ANS_NAME[s.sub] : isGame(s.mode) ? gameName(s.mode) : s.mode === 'flash' && !s.lg ? ASK_NAME[s.ask || 'zh'] : '', s.mc >= 3 ? `${L('ต่อเนื่อง', 'streak')} ×${s.mc}` : '', s.xp ? `+${s.xp} XP` : ''].filter(Boolean).join(' · ');
    return `<div class="sess"><button class="h"><span class="s-ic">${ic(icn)}</span><span class="m"><b>${esc(sessLabel(s))}${s.partial ? ` <span class="badge">${L('ไม่จบรอบ', 'unfinished')}</span>` : ''}${s.lg ? ` <span class="badge">${L('เวอร์ชันเก่า', 'old version')}</span>` : ''}</b><small>${fmtDate(s.ts)}${s.dur ? ' · ' + fmtClock(s.dur) : ''}${tags ? ' · ' + tags : ''}</small></span>
      <span class="sc"><b>${s.correct}/${s.total}</b>${s.stars ? starsHTML(s.stars, 11) : `<small>${p}%</small>`}</span></button><div class="det">${det || `<small class="muted">${L('ไม่มีรายละเอียดคำ', 'no word details')}</small>`}</div></div>`;
  },

  /* ----- 2 · levels ----- */
  tab_levels(c) {
    const tl = Stats.timeline([Date.now() - 14 * DAY, Date.now()]);
    let h = '<div class="st-grid">';
    h += this.card(L('ระดับ HSK', 'HSK levels'), L('แตะระดับเพื่อกางดูทุกด่าน · สีเข้ม = คะแนนดีที่สุดของด่านนั้นสูง', 'tap a level to unfold its stages · darker = higher best score'),
      LEVELS.filter(l => levelWords(l).length).map(l => {
        const s = Stats.levelSummary(l), gain = tl[1][l] - tl[0][l], left = s.words - s.known, open = this.openLv === l;
        let grid = '';
        if (open) for (let i = 1; i <= s.stages; i++) { const st = Stats.stage(l, i); grid += `<i class="${st && st.stars === 3 ? 'gold' : ''} ${st && st.plays && st.pct >= 55 ? 'hi' : ''}" style="--o:${st && st.plays ? (.15 + .85 * st.pct / 100).toFixed(2) : 0}" data-sg="${l}-${i}" data-tip="${L('ด่าน', 'Stage')} ${i} · ${st && st.plays ? `${st.pct}% · ${st.stars}/3 · ${L('เล่น', 'played')} ${st.plays}×` : L('ยังไม่เล่น', 'not played')}">${i}</i>`; }
        return `<div class="lp ${open ? 'open' : ''}" style="--c:${lvlColor(l)}"><button class="lp-top" data-openlv="${l}"><div class="lp-h"><b>HSK ${l}</b><span>${fmtNum(s.known)} / ${fmtNum(s.words)}<em>${s.pct}%</em></span>${ic('chev-d')}</div><span class="bar"><i data-w="${s.pct}%"></i></span>
          <div class="lp-m"><span>${starsHTML(1, 12, 1)}${s.stars}/${s.maxStars}</span><span>${ic('mastered')}${L('จำแม่น', 'mastered')} ${fmtNum(s.mastered)}</span><span>${L('ผ่าน', 'cleared')} ${s.cleared}/${s.stages}</span>${gain > 0 && left > 0 ? `<span>${L('จบในราว', 'done in ~')} ${Math.ceil(left / (gain / 14))} ${L('วัน', 'days')}</span>` : ''}</div></button>${open ? `<div class="sg">${grid}</div>` : ''}</div>`;
      }).join('') + `<div class="lp off"><div class="lp-h"><b>HSK 7–9</b><span><em>${L('ยังไม่มีคำศัพท์', 'no vocabulary yet')}</em></span></div></div>`);
    // accuracy by level
    const by = {}; c.inR.forEach(a => (by[a.w.lvl] = by[a.w.lvl] || []).push(a));
    h += this.card(L('ความแม่นยำแยกตามระดับ', 'Accuracy by level'), c.rangeName, this.breakdown(Object.entries(by).map(([k, x]) => [lvlName(k === 'C' ? 'C' : +k), x, lvlColor(k === 'C' ? 'C' : +k)])));
    // twelve months of columns want the full width
    h += this.card(L('ความคืบหน้ารายเดือน', 'Progress by month'), '<span id="stPcap"></span>', '<div class="chart" id="cProg"></div><div class="legend" id="stPleg"></div>', 'span2', `<div class="seg sm" id="stPmode"><button data-v="line" aria-label="${L('กราฟเส้น', 'Line chart')}">${ic('line')}</button><button data-v="bar" aria-label="${L('กราฟแท่ง', 'Bar chart')}">${ic('chart')}</button></div>`);
    return h + '</div>';
  },
  after_levels() { this.drawProgress(); },
  drawProgress() {
    const el = $('#cProg'); if (!el) return;
    segSet($('#stPmode'), this.pmode);
    // always the last 12 months, month by month, whatever range the rest of the page shows: progress through a level is a long story
    const bk = this.buckets(0).map(b => { const d = new Date(b.from); return { ...b, label: `${d.getMonth() + 1}/${d.getFullYear() + YR}` }; });
    const now = Date.now(), cuts = [bk[0].from - 1].concat(bk.map(b => Math.min(b.to - 1, now))), tl = Stats.timeline(cuts), fin = tl[tl.length - 1];
    const size = l => levelWords(l).length, lv = LEVELS.filter(l => size(l) && fin[l] > 0), vis = lv.filter(l => !this.hidden.has(l));
    const words = (i, l) => Math.max(0, tl[i + 1][l] - tl[i][l]), gain = (i, l) => words(i, l) / size(l) * 100;      // what a month added to a level: words, and their share of the level
    const pf = v => (v >= 10 || !v ? Math.round(v) : Math.round(v * 10) / 10) + '%';
    // legend: where each level stands today; tap one to hide it
    $('#stPleg').innerHTML = lv.map(l => `<button class="${this.hidden.has(l) ? 'off' : ''}" data-lv="${l}" style="--c:${lvlColor(l)}"><i></i>HSK ${l} <b>${Math.round(fin[l] / size(l) * 100)}%</b></button>`).join('');
    const cap = L('12 เดือนล่าสุด · % ของระดับที่ผ่านเพิ่มในแต่ละเดือน', 'last 12 months · % of each level newly cleared per month');
    if (!lv.length) { $('#stPcap').textContent = cap; el.innerHTML = `<div class="empty" style="padding:30px 10px">${L('เล่นด่านในหน้าเรียนสักรอบ แล้วกราฟจะเริ่มขึ้นที่นี่', 'Play a stage and this chart starts to grow')}</div>`; return; }
    // the axis follows the data (a month that added 14% is not flattened against 100%), in five even steps
    const peak = Math.max(0, ...vis.flatMap(l => bk.map((_, i) => gain(i, l)))), top = [5, 10, 20, 50, 100].find(x => peak <= x) || 100, ticks = [0, .2, .4, .6, .8, 1];
    const k = Math.max(1, vis.length), step = Math.max(68, k * 11 + (k - 1) * 3 + 24);      // both views share the month width, so switching keeps every month in place
    // pointing at / tapping a point or a column names just that level and its share: "HSK 2 · 24%"
    const ser = vis.map(l => ({ color: lvlColor(l), name: `HSK ${l}`, values: bk.map((_, i) => gain(i, l)), notes: bk.map((_, i) => pf(gain(i, l))) }));
    if (this.pmode === 'line') Charts.lines(el, bk, ser, { h: 240, max: top, suffix: '%', dots: true, minStep: step, ticks, pick: true });
    else Charts.grouped(el, bk, ser, { h: 240, max: top, suffix: '%', minStep: step, ticks });
    $('#stPcap').innerHTML = esc(cap) + (el.querySelector('.ch-scroll[tabindex]') ? `<span class="ch-hint">${L('เลื่อนซ้าย–ขวาเพื่อดูเดือนอื่น', 'scroll sideways for other months')}</span>` : '');
  },
  /** rows of: label · attempts · accuracy bar · average time */
  breakdown(rows) {
    rows = rows.map(([name, list, color]) => ({ name, color, ...this.agg(list) })).filter(r => r.n > 0);
    if (!rows.length) return `<div class="empty" style="padding:16px">${L('ยังไม่มีคำตอบในช่วงนี้', 'No answers in this period yet')}</div>`;
    return `<div class="brk"><div class="brk-h"><span></span><span>${L('ตอบ', 'answers')}</span><span>${L('แม่นยำ', 'accuracy')}</span><span>${L('เวลา', 'time')}</span></div>${rows.map(r => `<div class="brk-r" ${r.color ? `style="--c:${r.color}"` : ''}><b>${esc(r.name)}</b><span class="tn">${fmtNum(r.n)}</span><span class="brk-b"><span class="bar"><i data-w="${r.acc}%"></i></span><em>${r.acc}%</em></span><span class="tn">${r.ms ? secs(r.ms) : '—'}</span></div>`).join('')}</div>`;
  },

  /* ----- 3 · memory ----- */
  tab_memory(c) {
    const ws = c.d.ws, hsk = WORDS.filter(w => w.lvl !== 'C'), box = [0, 0, 0, 0, 0, 0]; let seen = 0;
    hsk.forEach(w => { const x = ws[w.id]; if (x && x.s) { seen++; box[clamp(x.b || 0, 0, 5)]++; } });
    const mem = { mastered: 0, learning: 0, review: 0, new: 0 }; hsk.forEach(w => { mem[Stats.status(w.id)]++; });
    let h = `<div class="kpis">
      <div class="stat" style="--c:var(--good)"><span class="k">${ic('mastered')}${L('จำแม่นแล้ว', 'Mastered')}</span><b class="v"><span data-count="${mem.mastered}">0</span></b><span class="s">${pct(mem.mastered, hsk.length)}% ${L('ของคลัง', 'of the bank')}</span></div>
      <div class="stat" style="--c:var(--gold)"><span class="k">${ic('learn')}${L('กำลังเรียน', 'Learning')}</span><b class="v"><span data-count="${mem.learning}">0</span></b><span class="s">${L('ตอบถูกแล้ว 1 ครั้ง', 'right once so far')}</span></div>
      <div class="stat" style="--c:var(--bad)"><span class="k">${ic('repeat')}${L('ต้องทวน', 'To relearn')}</span><b class="v"><span data-count="${mem.review}">0</span></b><span class="s">${L('ตอบผิดครั้งล่าสุด', 'missed last time')}</span></div>
      <div class="stat"><span class="k">${ic('cards')}${L('ยังไม่เคยเจอ', 'Not met yet')}</span><b class="v"><span data-count="${mem.new}">0</span></b><span class="s">${L('จาก', 'of')} ${fmtNum(hsk.length)} ${L('คำ', 'words')}</span></div></div><div class="st-grid">`;
    h += this.card(L('คำอยู่ในช่วงทบทวนไหน', 'Where your words sit'), L('ตอบถูกหนึ่งครั้งคำจะขยับไปช่วงที่ห่างขึ้น ตอบผิดจะกลับมาเริ่มใหม่', 'each right answer moves a word to a longer interval; a miss sends it back'), '<div class="chart" id="cBox"></div>');
    h += this.card(L('คำที่จะถึงรอบทบทวน', 'Reviews coming up'), L('14 วันข้างหน้า · แท่งแรกรวมคำที่เลยกำหนดแล้ว', 'next 14 days · the first bar includes overdue words'), '<div class="chart" id="cDue"></div>');
    const rev = c.list.filter(a => !a.first), by = [1, 2, 3, 4, 5].map(b => [BOX_NAME[b], rev.filter(a => a.box === b)]);
    h += this.card(L('จำได้จริงแค่ไหนเมื่อกลับมาเจอ', 'How well it sticks'), L('ความแม่นยำตอนทบทวน แยกตามช่วงที่คำนั้นอยู่ก่อนตอบ', 'accuracy on review, by the interval the word was in beforehand'), this.breakdown([[L('เจอครั้งแรก', 'First sight'), c.list.filter(a => a.first)], [L('หลังตอบผิด', 'After a miss'), rev.filter(a => a.box === 0)], ...by]));
    h += this.card(L('ความจำแยกตามระดับ', 'Memory by level'), '', LEVELS.filter(l => levelWords(l).length).map(l => { const m = { mastered: 0, learning: 0, review: 0, new: 0 }; levelWords(l).forEach(w => { m[Stats.status(w.id)]++; }); return `<div class="lp" style="--c:${lvlColor(l)}"><div class="lp-h"><b>HSK ${l}</b><span>${m.mastered}<em>${L('จำแม่น', 'mastered')}</em></span></div><div class="mem">${['mastered', 'learning', 'review', 'new'].map(k => m[k] ? `<i class="c-${k}" style="flex:0 1 0" data-flex="${m[k]}" data-tip="${STATUS_NAME[k]} ${m[k]}"></i>` : '').join('')}</div></div>`; }).join('') + `<div class="legend"><span><i class="c-mastered"></i>${STATUS_NAME.mastered}</span><span><i class="c-learning"></i>${STATUS_NAME.learning}</span><span><i class="c-review"></i>${STATUS_NAME.review}</span><span><i class="c-new"></i>${STATUS_NAME.new}</span></div>`);
    this._box = box;
    return h + '</div>';
  },
  after_memory(c) {
    Charts.bars($('#cBox'), this._box.map((v, i) => ({ label: BOX_NAME[i], v, tip: `${BOX_NAME[i]} · ${v} ${L('คำ', 'words')}` })), { h: 170 });
    const t0 = dayStart().getTime(), due = Array(14).fill(0);
    Object.entries(c.d.ws).forEach(([id, w]) => { if (!BY_ID.has(id) || !w.s) return; const k = c.d.review.includes(id) ? 0 : (w.b >= 1 ? clamp(Math.floor((Stats.dueAt(w) - t0) / DAY), 0, 99) : 0); if (k < 14) due[k]++; });
    Charts.bars($('#cDue'), due.map((v, i) => { const dd = addDays(new Date(t0), i); return { label: i === 0 ? L('วันนี้', 'today') : `${dd.getDate()}/${dd.getMonth() + 1}`, v, tip: `${i === 0 ? L('วันนี้', 'Today') : dm(dd)} · ${v} ${L('คำ', 'words')}` }; }), { h: 170, color: 'var(--gold)' });
  },

  /* ----- 4 · words ----- */
  tab_words(c) {
    const grp = (list, key) => { const o = {}; list.forEach(a => { const k = key(a); if (k !== null && k !== undefined) (o[k] = o[k] || []).push(a); }); return o; };
    const src = c.inR, order = Object.keys(POS_NAME);
    let h = '<div class="st-grid">';
    h += this.card(L('แยกตามชนิดของคำ', 'By part of speech'), c.rangeName, this.breakdown(Object.entries(grp(src, a => a.w._pk)).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])).map(([k, x]) => [POS_NAME[k] || k, x])));
    h += this.card(L('แยกตามความยาวคำ', 'By word length'), c.rangeName, this.breakdown(Object.entries(grp(src, a => Math.min(4, a.w._len))).map(([k, x]) => [L(`${k} ตัวอักษร${k === '4' ? 'ขึ้นไป' : ''}`, `${k}${k === '4' ? '+' : ''} character${k === '1' ? '' : 's'}`), x])));
    h += this.card(L('แยกตามรูปแบบโจทย์', 'By question type'), c.rangeName, this.breakdown(Object.entries(grp(src, a => a.ask)).map(([k, x]) => [modeName(k), x])));
    h += this.card(L('แยกตามวิธีตอบ', 'By way of answering'), c.rangeName, this.breakdown(Object.entries(grp(src, a => a.ans)).map(([k, x]) => [modeName(k), x])));
    h += this.card(L('คำที่พลาดบ่อยที่สุด', 'Most-missed words'), L('ตลอดการใช้งาน · แตะแถวเพื่อเปิดดูคำนั้น', 'all time · tap a row to open the word'), c.hard.length ? `<div class="wt"><div class="wt-h"><span>${L('คำ', 'word')}</span><span>${L('ผิด/เจอ', 'missed/seen')}</span><span>${L('แม่นยำ', 'accuracy')}</span><span>${L('ล่าสุด', 'last')}</span></div>${c.hard.map(p => { const dt = new Date(p.last); return `<button class="wt-r" data-word="${esc(p.w.id)}"><span class="wt-w"><b class="hz">${esc(p.w.zh)}</b><span><small class="pyx">${esc(p.w.py)}</small><small>${esc(meaningText(p.w))}</small></span></span><span class="tn">${p.bad}/${p.n}</span><span class="tn">${pct(p.n - p.bad, p.n)}%</span><span class="tn">${dt.getDate()}/${dt.getMonth() + 1}</span></button>`; }).join('')}</div><button class="btn soft block" id="stHard" style="margin-top:14px">${ic('play')}${L(`ฝึกคำเหล่านี้ (${c.hard.length} คำ)`, `Practise these ${c.hard.length} words`)}</button>` : `<div class="empty" style="padding:16px">${L('ยังไม่มีคำที่ตอบผิด', 'No missed words yet')}</div>`, 'span2');
    h += this.card(L('คำที่ใช้เวลาคิดนานที่สุด', 'Words you think longest about'), L('เฉลี่ยเวลาของครั้งที่ตอบถูก · เก็บตั้งแต่รุ่นนี้', 'average time of right answers · recorded from this version on'), c.slow.length ? `<div class="wchips">${c.slow.map(p => `<button class="wchip" data-word="${esc(p.w.id)}"><span class="hz">${esc(p.w.zh)}</span><small>${secs(p.avg)}</small></button>`).join('')}</div>` : `<div class="empty" style="padding:16px">${L('เล่นอีกสักหน่อย แล้วรายการนี้จะขึ้น', 'Play a little more and this fills in')}</div>`);
    const mast = Object.entries(c.mast).filter(([id]) => BY_ID.has(id) && Stats.status(id) === 'mastered').sort((a, b) => b[1] - a[1]).slice(0, 14);
    h += this.card(L('คำที่เพิ่งจำแม่น', 'Recently mastered'), L('ตอบถูกติดกันครบ 2 ครั้งล่าสุด', 'most recent words answered right twice in a row'), mast.length ? `<div class="wchips">${mast.map(([id]) => { const w = BY_ID.get(id); return `<button class="wchip ok" data-word="${esc(id)}"><span class="hz">${esc(w.zh)}</span><small class="pyx">${esc(w.py)}</small></button>`; }).join('')}</div>` : `<div class="empty" style="padding:16px">${L('ยังไม่มี', 'None yet')}</div>`);
    return h + '</div>';
  },

  /* ----- 5 · history ----- */
  tab_history(c) {
    const d = c.d, days = Object.entries(c.days), real = d.sessions.filter(s => !s.lg);
    const bestDay = days.reduce((a, [k, v]) => v.cards > a[1] ? [k, v.cards] : a, ['', 0]), longDay = days.reduce((a, [k, v]) => v.ms > a[1] ? [k, v.ms] : a, ['', 0]);
    const dstr = k => k ? dm(new Date(k + 'T00:00:00')) : '—', firstTs = d.sessions.length ? Math.min(...d.sessions.map(s => s.ts).filter(Boolean)) : 0;
    const rec = (label, value, sub) => `<div class="rec"><span>${label}</span><b>${value}</b><small>${sub}</small></div>`;
    let h = `<div class="card"><div class="ch"><div><h3>${L('สถิติสูงสุดของคุณ', 'Your records')}</h3><div class="cap">${L('ตลอดการใช้งาน', 'all time')}</div></div></div><div class="recs">
      ${rec(L('เรียนต่อเนื่องนานสุด', 'Longest streak'), `${c.streak.best} ${L('วัน', 'days')}`, `${L('ตอนนี้', 'now')} ${c.streak.cur}`)}
      ${rec(L('วันที่ทำการ์ดมากสุด', 'Most cards in a day'), fmtNum(bestDay[1]), dstr(bestDay[0]))}
      ${rec(L('วันที่เรียนนานสุด', 'Longest study day'), fmtDur(longDay[1]), dstr(longDay[0]))}
      ${rec(L('ตอบถูกติดกันสูงสุด', 'Best run in a round'), '×' + real.reduce((a, s) => Math.max(a, s.mc || 0), 0), L('ในรอบเดียว', 'one round'))}
      ${rec(L('ด่าน 3 ดาว', 'Three-star stages'), Object.values(d.stages).filter(s => s.stars === 3).length, `${L('จาก', 'of')} ${LEVELS.reduce((a, l) => a + stageCount(l), 0)}`)}
      ${rec(L('เวลาเรียนรวม', 'Total study time'), fmtDur(days.reduce((a, [, v]) => a + v.ms, 0)), `${days.filter(([, v]) => v.sessions || v.cards).length} ${L('วันที่เรียน', 'study days')}`)}
      ${rec(L('การ์ดทั้งหมด', 'Cards answered'), fmtNum(d.sessions.reduce((a, s) => a + (s.total || 0), 0)), `${fmtNum(d.sessions.length)} ${L('รอบ', 'rounds')}`)}
      ${rec('XP', fmtNum(d.xp || 0), Gami.rank().cur.zh + (firstTs ? ` · ${L('เริ่ม', 'since')} ${dm(new Date(firstTs))}` : ''))}
    </div></div>`;
    const list = [...c.sess].filter(s => this.histMode === 'all' || s.mode === this.histMode || (this.histMode === 'games' && isGame(s.mode))).sort((a, b) => b.ts - a.ts);
    h += this.card(L('ทุกรอบที่เล่น', 'Every round'), `${c.rangeName} · ${fmtNum(list.length)} ${L('รอบ · แตะเพื่อดูทุกคำและเวลาที่ใช้', 'rounds · tap one for every word and its time')}`,
      (list.length ? list.slice(0, this.histN).map(s => this.sessHTML(s)).join('') : `<div class="empty" style="padding:16px">${L('ไม่มีการเล่นในช่วงนี้', 'No rounds in this period')}</div>`) + (list.length > this.histN ? `<div class="center-row"><button class="btn sm" id="stMore">${L('แสดงเพิ่ม', 'Show more')} (${list.length - this.histN})</button></div>` : ''), '',
      `<div class="seg sm" id="stHmode"><button data-v="all">${L('ทั้งหมด', 'All')}</button><button data-v="flash">${L('การ์ด', 'Cards')}</button><button data-v="dict"><span class="hz">听写</span></button><button data-v="games">${L('มินิเกม', 'Games')}</button></div>`);
    return h;
  },
  after_history() { segSet($('#stHmode'), this.histMode); }
};

boot();
