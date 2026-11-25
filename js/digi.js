'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — 汉字进化图鉴 · Hanzi Digivolution (a chapter of VOL 04 部首)
   Idea: hanzi_digivolution_tree.html (the user's). Every clan is computed from data/tree.js (tools/build_tree.py):
     ROOKIE    the starting component
     ARMOR     it gives the SOUND   (声旁, Make Me a Hanzi)               清 = 氵 + 青
     CHAMPION  it gives the MEANING (形旁, or it is the radical)           杯 = 木 + 不
     ULTIMATE  fusion: 会意, or the same part repeated                      林 森 · 从 众
     VARIANT   指事, or it is the radical without a recorded role           旦 果
   Characters where a part only appears by shape (人 inside 火) are left out.

   Two views (one button):
   - รอบตัว (default, like Obsidian's local graph): the focus in the middle; ring 1 = what evolves from it,
     grouped in sectors by stage; ring 2 = the next generation; the parts it is made of sit in their own sector.
     Tapping any character or part moves it to the middle (smooth tween) — walk up and down the family; a trail
     leads back.
   - ด้านขวา: the clan as a left-to-right tree, up to 3 generations (for big clans).
   简 / 繁: simplified by default, never both mixed (setting S().hzTrad, shared with the character tree).
   ===================================================================== */
const OffyDigi = (() => {
  const SRC = 'data/tree.js?v=6';
  const CLANS = ['青', '木', '日', '人', '口', '女', '心', '工', '方', '包', '马', '白'];
  const STAGES = {
    ROOKIE: { th: 'อักษรตั้งต้น', sh: 'ตั้งต้น', zh: '基', d: 'จุดเริ่มต้นของตระกูลอักษรนี้' },
    ARMOR: { th: 'ใช้เป็นส่วนบอกเสียง', sh: 'เสียง', zh: '声', d: 'ตัวตั้งต้นเป็นส่วนบอกเสียง (声旁) ประกอบกับส่วนบอกความหมาย' },
    CHAMPION: { th: 'ใช้เป็นส่วนบอกความหมาย', sh: 'ความหมาย', zh: '形', d: 'ตัวตั้งต้นเป็นส่วนบอกความหมาย (形旁) อีกส่วนบอกเสียง' },
    ULTIMATE: { th: 'อักษรผสมความหมาย', sh: 'ผสม', zh: '会', d: 'รวมความหมายของส่วนประกอบ (会意) หรือซ้อนตัวเดิม' },
    VARIANT: { th: 'ความสัมพันธ์อื่น', sh: 'อื่น ๆ', zh: '其', d: 'อักษรชี้บอก (指事) หรือมีตัวตั้งต้นเป็นหมวดนำโดยไม่ระบุบทบาท' },
    PART: { th: 'ส่วนประกอบ', sh: 'ประกอบ', zh: '件', d: 'ส่วนที่ประกอบขึ้นเป็นตัวนี้' }
  };
  const ORDER = ['PART', 'ARMOR', 'CHAMPION', 'ULTIMATE', 'VARIANT'];
  const COLW = 210, ROWH = 114, NODE = 92, PAD = 40;
  const st = { base: '青', trail: ['青'], sel: null, open: {}, stageFilter: null, tx: 0, ty: 0, k: 1, fitted: false };
  let D = null, host = null, rad = null, formsOf = null, radOfGlyph = null, tree = null, cur = new Map(), anim = 0;

  Object.assign(window.OFFY_EN || {}, {
    'สายวิวัฒนาการ': 'Character families', 'สายวิวัฒนาการอักษร': 'Character families', 'อักษรตั้งต้น': 'Base character', 'ใช้เป็นส่วนบอกเสียง': 'As sound part', 'ใช้เป็นส่วนบอกความหมาย': 'As meaning part', 'อักษรผสมความหมาย': 'Meaning compound', 'ความสัมพันธ์อื่น': 'Other link', 'ส่วนประกอบ': 'Component',
    'จุดเริ่มต้นของตระกูลอักษรนี้': 'Where this family starts', 'การประกอบอักษร': 'How it is built', 'ดูการประกอบอักษร': 'See how it is built', 'รูปเขียนตามภูมิภาค': 'Regional forms', 'ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้': 'No HSK character builds on this one', 'บอกความหมาย': 'meaning', 'บอกเสียง': 'sound', 'เล่นอีกครั้ง': 'Play again',
    'ตระกูล': 'Clan', 'ค้นหาตระกูลจากส่วนประกอบ': 'Find a clan by component', 'ทั้งหมด': 'All', 'รอบตัว': 'Radial', 'กริด': 'Grid', 'ด้านขวา': 'Tree', 'ขวา': 'Tree', 'ดูทั้งหมดในโหมดกริด': 'See all in Grid',
    'ส่วนที่เพิ่ม': 'Added part', 'โครงสร้าง': 'Structure',
    'คำที่ใช้ตัวนี้': 'Words with it', 'แตะตัวไหนก็ได้เพื่อย้ายมาไว้ตรงกลาง': 'Tap any character to bring it to the centre',
    'ลากเพื่อเลื่อน · หมุนล้อหรือบีบเพื่อซูม': 'Drag to pan · wheel or pinch to zoom',
    'ไต้หวัน': 'Taiwan', 'ญี่ปุ่น': 'Japanese', 'เพิ่มอีก': 'more', 'หมวดนำ': 'Radical'
  });

  /* ---------- simplified / traditional ---------- */
  const trad = () => !!S().hzTrad;
  const radG = r => trad() || D.c[r[1]] ? r[1] : ((r[8].find(f => f[1] === 'ตัวย่อ') || r[8].find(f => D.c[f[0]]) || [])[0] || r[1]);
  /* look-alike forms of different radicals come tagged from the data: 阝@170 (left · 阜) vs 阝@163 (right · 邑), 月@130 (⺼ flesh) … */
  const base = c => String(c).split('@')[0];
  const side = c => { const [g, no] = String(c).split('@'); if (!no) return ''; const r = rad.get(+no); if (!r) return '';
    const hl = typeof HzKit !== 'undefined' ? HzKit.lang() : LANG;
    const rn = ({ th: r[4], en: r[5], vi: r[6], ja: r[7] }[hl]) || r[4] || r[5];
    return `${g === '阝' ? (no === '170' ? T('ซ้าย') + ' ' : T('ขวา') + ' ') : ''}${r[1]} · ${rn}`; };
  const show = c => { const x = D.c[c]; if (x) return trad() && x[8] ? x[8] : c; const r = radOfGlyph.get(c); return r && base(c) === r[1] ? radG(r) : base(c); };
  const viewMode = () => S().digiView || 'radial';
  const radial = () => viewMode() === 'radial';
  const isGrid = () => viewMode() === 'grid';

  /* ---------- relations ---------- */
  function stageOf(c, p) {
    const x = D.c[c] || [], parts = x[4] || [], six = x[6] || '', forms = formsOf(p), fb = new Set([...forms].map(base));
    if (parts.length > 1 && parts.every(q => forms.has(q))) return 'ULTIMATE';             // 林 森 从 众 晶
    if (x[12] && fb.has(x[12])) return 'ARMOR';                                       // p = sound part
    if (x[11] && fb.has(x[11])) return 'CHAMPION';                                    // p = meaning part
    if (six.startsWith('会意')) return 'ULTIMATE';                                        // every part carries meaning
    const r = x[3] && rad.get(x[3]), isRad = !!r && (fb.has(r[1]) || r[8].some(f => fb.has(f[0])));
    if (six === '形声') return isRad ? 'CHAMPION' : null;      // p only sits inside another part: no real role
    if (six === '指事' || isRad) return 'VARIANT';
    return null;                                               // shape only (火 / 茶 inside 人)
  }
  const catalyst = (c, p) => { const forms = formsOf(p), parts = (D.c[c] || [])[4] || []; const rest = parts.filter(q => !forms.has(q)); return rest.length ? rest : parts.slice(1); };
  const kidsOf = (p, except) => Object.keys(D.c).filter(c => c !== p && !except.has(c) && lvOk(D.c[c][1]) && (D.c[c][4] || []).some(q => formsOf(p).has(q)) && stageOf(c, p))
    .sort((a, b) => ORDER.indexOf(stageOf(a, p)) - ORDER.indexOf(stageOf(b, p)) || D.c[a][1] - D.c[b][1]);
  // a pictograph (象形 马 木 人) is a drawing, not assembled from parts: no origin sector for it
  const partsOf = f => (D.c[f] || [])[6] === '象形' ? [] : [...new Set((D.c[f] || [])[4] || [])].filter(q => !formsOf(f).has(q) && (D.c[q] || D.cc[q] || radOfGlyph.get(q)));

  /* ---------- radial layout: focus in the middle ---------- */
  /* an ellipse with an arc-length table: points can be spaced evenly along it, however long and flat it is */
  function oval(A, B) {
    const M = 720, ss = [0]; let px = A, py = 0, acc = 0;
    for (let i = 1; i <= M; i++) { const t = i / M * 2 * Math.PI, x = A * Math.cos(t), y = B * Math.sin(t); acc += Math.hypot(x - px, y - py); ss.push(acc); px = x; py = y; }
    const P = acc;
    const tAt = s0 => { const s1 = ((s0 % P) + P) % P; let lo = 1, hi = M; while (lo < hi) { const m = (lo + hi) >> 1; if (ss[m] < s1) lo = m + 1; else hi = m; }
      const seg = ss[lo] - ss[lo - 1] || 1; return (lo - 1 + (s1 - ss[lo - 1]) / seg) / M * 2 * Math.PI; };
    const sAt = t => { const u = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI) * M, i = Math.floor(u); return ss[i] + (ss[Math.min(M, i + 1)] - ss[i]) * (u - i); };
    return { A, B, P, tAt, sAt, pt: t => [A * Math.cos(t), B * Math.sin(t)] };
  }
  // the shape of the graph area: a wide screen gets a wide oval, a tall phone a tall one (small families stay round)
  const viewAspect = () => { const v = host && host.querySelector('.dg-view'); return v && v.clientWidth && v.clientHeight ? v.clientWidth / v.clientHeight : 1; };
  function layoutRadial(f) {
    const nodes = [{ key: f, c: f, x: 0, y: 0, ring: 0, stage: stageForFocus(f) }], links = [];
    const parts = partsOf(f).map(q => ({ c: q, stage: 'PART' }));
    const except = new Set([f, ...parts.map(p => p.c)]);
    let kids = kidsOf(f, except).map(c => ({ c, stage: stageOf(c, f) }));
    const mobile = innerWidth < 700;
    const defaultCap = mobile ? Math.max(8, 12 - parts.length) : innerWidth < 1100 ? 24 : 30;
    // On mobile/tablet big clans, pick the lowest-HSK (most useful) characters first so the radial graph stays crisp & readable
    if (!st.open[f] && kids.length > defaultCap) {
      kids = kids.slice().sort((a, b) => ((D.c[a.c] || [])[1] || 9) - ((D.c[b.c] || [])[1] || 9) || ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage));
    }
    const cap = st.open[f] ? 999 : defaultCap, more = Math.max(0, kids.length - cap);
    kids = kids.slice(0, cap).sort((a, b) => ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage) || ((D.c[a.c] || [])[1] || 9) - ((D.c[b.c] || [])[1] || 9));
    const ring1 = parts.concat(kids), n1 = Math.max(ring1.length, 1);
    // Multi-ring radial layout: 1 ring (<=14), 2 staggered rings (15..40), 3 staggered rings (>40) — no crushing radius cap so boxes NEVER overlap!
    const layers = n1 > 40 ? 3 : n1 > 14 ? 2 : 1;
    const SG = layers === 3 ? 146 : 150;
    const GAP = layers === 3 ? 56 : layers === 2 ? 80 : 140;
    const asp = Math.max(.84, Math.min(2.2, viewAspect() * .94)), k = 1 + (asp - 1) * Math.max(0, Math.min(1, (n1 - 6) / 14));
    const unit = oval(Math.max(k, 1), Math.max(1 / k, 1)).P;
    const minShort = layers === 3 ? 250 : layers === 2 ? 215 : 172;
    const short = Math.max(minShort, n1 * GAP / unit);
    const A1 = short * Math.max(k, 1), B1 = short * Math.max(1 / k, 1), E1 = oval(A1, B1);
    const ds = E1.P / n1, top = E1.sAt(-Math.PI / 2), s0 = top - (parts.length ? parts.length * ds / 2 : 0) + ds / 2;
    kids.forEach(k2 => except.add(k2.c));
    const g2cap = layers > 1 ? 0 : kids.length <= 8 ? 4 : 2;
    const A2 = A1 + 150, B2 = B1 + 150, E2 = g2cap ? oval(A2, B2) : null;
    const tOf = [];
    ring1.forEach((it, i) => {
      const t = E1.tAt(s0 + i * ds); tOf.push(t);
      let [x, y] = E1.pt(t);
      let off = 0;
      if (layers === 2) off = i % 2 ? SG : (n1 % 2 && i === n1 - 1 ? SG * .5 : 0);
      else if (layers === 3) off = (i % 3) * SG;
      if (off) { const d = Math.hypot(x, y) || 1; x += x / d * off; y += y / d * off; }
      nodes.push({ key: it.c, c: it.c, x, y, ring: 1, stage: it.stage, a: Math.atan2(y, x) });
      links.push({ from: it.stage === 'PART' ? it.c : f, to: it.stage === 'PART' ? f : it.c, stage: it.stage });
      if (it.stage === 'PART' || !g2cap) return;
      const g = kidsOf(it.c, except).slice(0, g2cap); g.forEach(c => except.add(c));
      const mid = E2.sAt(t), span = Math.min(E2.P / n1 * .92, g.length * .34 * (A2 + B2) / 2);
      g.forEach((c, j) => {
        const [gx, gy] = E2.pt(E2.tAt(mid - span / 2 + (g.length > 1 ? j * span / (g.length - 1) : span / 2)));
        nodes.push({ key: c, c, x: gx, y: gy, ring: 2, stage: stageOf(c, it.c) });
        links.push({ from: it.c, to: c, stage: stageOf(c, it.c) });
      });
    });
    const has2 = nodes.some(n => n.ring === 2);
    const maxOff = (layers - 1) * SG;
    const lab = layers > 1 ? maxOff + 114 : has2 ? 244 : 114;
    const edge = layers > 1 ? maxOff + 106 : has2 ? 150 + 106 : 106;
    const sectors = ORDER.map(s2 => { const idx = ring1.map((it, i) => it.stage === s2 ? i : -1).filter(i => i >= 0); if (!idx.length) return null;
      const t = E1.tAt(s0 + (idx[0] + idx[idx.length - 1]) / 2 * ds);
      return { s: s2, n: idx.length, x: (A1 + lab) * Math.cos(t), y: (B1 + lab) * Math.sin(t) + (Math.sin(t) > .3 ? 18 : 0) }; }).filter(Boolean);
    return { nodes, links, A1, B1, A2: layers > 1 ? A1 + SG : A2, B2: layers > 1 ? B1 + SG : B2,
      A3: layers === 3 ? A1 + SG * 2 : 0, B3: layers === 3 ? B1 + SG * 2 : 0,
      sectors, more, has2: has2 || layers > 1, layers,
      outerX: A1 + edge, outerY: B1 + edge, labelY: B1 + lab, asp: viewAspect() };
  }
  function stageForFocus(f) {
    const prev = st.trail[st.trail.length - 2];
    return prev && D.c[f] && stageOf(f, prev) ? stageOf(f, prev) : 'ROOKIE';
  }

  /* ---------- tree layout (left → right, 3 generations) ---------- */
  function build(base) {
    const seen = new Set([base]);
    const node = (c, p, depth) => {
      const n = { c, p, depth, stage: p ? stageOf(c, p) : 'ROOKIE', kids: [], more: 0 };
      if (depth < 3) {
        let ks = kidsOf(c, seen); ks.forEach(k => seen.add(k));
        const cap = st.open[c] ? 999 : depth === 0 ? 24 : 8;
        n.more = Math.max(0, ks.length - cap); ks = ks.slice(0, cap);
        n.kids = ks.map(k => node(k, c, depth + 1));
      }
      return n;
    };
    const root = node(base, null, 0);
    let y = 0;
    const place = n => {
      n.x = PAD + n.depth * COLW;
      if (!n.kids.length) { n.y = PAD + y * ROWH; y += 1; } else { n.kids.forEach(place); n.y = (n.kids[0].y + n.kids[n.kids.length - 1].y) / 2; }
      if (n.more) { n.moreY = PAD + y * ROWH; y += .7; }
    };
    place(root);
    const all = []; (function walk(n) { all.push(n); n.kids.forEach(walk); })(root);
    const deep = Math.max(...all.map(n => n.depth + (n.more ? 1 : 0)));
    return { root, all, w: PAD * 2 + deep * COLW + NODE + (all.some(n => n.more) ? 60 : 0), h: PAD * 2 + Math.max(1, y) * ROWH };
  }

  /* ---------- pieces ---------- */
  const esc2 = s => esc(s == null ? '' : s);
  const lvOk = l => typeof HzLv === 'undefined' || HzLv.has(l);      // the HSK levels picked on the อักษร page (7 = the 7–9 band)
  const lvTxt = c => { const x = D.c[c]; return x ? 'HSK ' + (x[1] === 7 ? '7-9' : x[1]) : T('หมวดนำ'); };
  // meaning in the flashcard language (checks our 5-lang/Thai WORDS dictionary first via HzKit)
  const mLang = () => typeof HzKit !== 'undefined' ? HzKit.lang() : LANG;
  const meanOf = c => typeof HzKit !== 'undefined' ? HzKit.charMean(c, D, radOfGlyph) : { t: '', fb: false };
  const shortM = s => typeof HzKit !== 'undefined' ? HzKit.short(s, 11) : String(s || '').slice(0, 11);
  const lvC = c => { const x = D.c[c]; return ` style="--lc:var(--hsk${x ? x[1] : 'C'})"`; };      // outside HSK (radicals, parts): grey     // every character wears its HSK level colour
  const lvQ = l => `<i class="lvq" style="--c:var(--hsk${l})">${l === 7 ? '7–9' : l}</i>`;
  /* Pinyin ABOVE the box, character square in MIDDLE, translated meaning BELOW */
  const nodeInner = (c, stage) => {
    const dot = typeof HzKit !== 'undefined' ? HzKit.dotHtml(c) : '';
    const sd = side(c);
    const pyTxt = D.c[c] ? D.c[c][0] : (radOfGlyph.get(c) || [])[3] || '';
    const topLbl = sd
      ? `<span class="dg-side-tag" title="${esc2(sd)}">${esc2(sd.split(' · ')[0])}</span>`
      : `<span class="pyx">${esc2(pyTxt)}</span>`;
    const m = meanOf(c);
    return `${topLbl}<i class="dg-hex"${lvC(c)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(c))}${dot}</i>${m.t ? `<small class="dg-m${m.fb ? ' fb' : ''}" lang="${m.fb ? 'en' : mLang()}">${esc2(shortM(m.t))}</small>` : ''}`;
  };
  function cardHTML(c, stage, parent) {
    const x = D.c[c], stg = STAGES[stage] || STAGES.ROOKIE, g = show(c);
    const rr = x ? x[3] && rad.get(x[3]) : radOfGlyph.get(c);
    const words = (D.cw[c] || []).slice(0, 8).map(i => {
      const w = D.w[i];
      const gl = typeof HzKit !== 'undefined' ? HzKit.wordGloss(w[0], w[3], !!w[4]) : { t: w[3], fb: !w[4] };
      return `<li><button type="button" class="dg-wbtn" data-dgword="${esc2(w[0])}">${lvQ(w[2])}<b lang="zh-Hans">${esc2(w[0])}</b><span class="pyx">${esc2(w[1])}</span><span class="dg-wgl">${gl.fb ? '<em>EN</em>' : ''}${esc2(gl.t)}</span></button><button type="button" class="tr-say" data-say="${esc2(w[0])}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></li>`;
    }).join('');
    const cat = parent && x && stageOf(c, parent) ? catalyst(c, parent) : [];
    const parts = x ? (x[4] || []).map(q => `<button class="dg-part${parent && formsOf(parent).has(q) ? ' base' : ''}" data-dgo="${esc2(q)}" lang="zh-Hans">${esc2(show(q))}${side(q) ? `<small>${esc2(side(q))}</small>` : ''}</button>`).join('<i>+</i>') : '';
    const mo = meanOf(c), meaning = mo.t + (mo.fb || mLang() === 'en' || !x || !x[10] ? '' : ` · ${x[10]}`);
    const reg = x ? [[T('ไต้หวัน'), x[8], 'zh-Hant'], [T('ญี่ปุ่น'), x[13], 'ja']].filter(f => f[1]) : [];
    const twins = side(c) ? ((D.amb || {})[base(c)] || []).filter(no => `${base(c)}@${no}` !== c).map(no => `${base(c)}@${no}`) : [];
    const xbar = typeof HzKit !== 'undefined' ? HzKit.crossBar(c, 'digi') : '';
    return `<div class="dg-card s-${stage}">
      <div class="dg-ch"><span class="dg-stage">${esc2(T(stg.th))} <b>${stg.zh}</b></span><span class="dg-id">#${esc2((c.codePointAt(0) || 0).toString(16).toUpperCase())}</span></div>
      <div class="dg-hero"><div class="dg-big" lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(g)}</div>
        <div><p class="dg-py"><span class="pyx">${esc2(x ? x[0] : rr ? rr[3] : '')}</span><button class="dg-say" data-say="${esc2(base(c))}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></p>
          ${meaning ? `<p class="dg-mean">${esc2(meaning)}</p>` : ''}<p class="dg-sd">${esc2(stg.d)}</p></div></div>
      ${xbar}
      ${x ? `<dl class="dg-stats"><div><dt>HSK</dt><dd>${x[1] === 7 ? '7-9' : x[1]}</dd></div><div><dt>${T('ขีด')}</dt><dd>${esc2(x[2])}</dd></div>${rr ? `<div><dt>部首</dt><dd lang="zh-Hans">${esc2(radG(rr))}</dd></div>` : ''}${x[6] ? `<div><dt>六书</dt><dd lang="zh-Hans">${esc2(x[6])}</dd></div>` : ''}</dl>` : ''}
      ${parts ? `<p class="dg-row"><span>${T('โครงสร้าง')}</span>${parts}</p>` : ''}
      ${twins.length ? `<p class="dg-row"><span>${T('หน้าตาเหมือน แต่คนละตัว')}</span>${twins.map(q => `<button class="dg-part" data-dgo="${esc2(q)}" lang="zh-Hans">${esc2(base(q))}<small>${esc2(side(q))}</small></button>`).join('')}</p>` : ''}
      ${cat.length ? `<p class="dg-row"><span>${T('ส่วนที่เพิ่ม')}</span>${cat.map(q => `<b class="dg-cat" lang="zh-Hans">${esc2(show(q))}</b>`).join(' ')}</p>` : ''}
      ${reg.length ? `<p class="dg-row"><span>${T('รูปเขียนตามภูมิภาค')}</span>${reg.map(([k, v, l]) => `<b class="dg-reg" lang="${l}">${esc2(v)}<small>${k}</small></b>`).join('')}</p>` : ''}
      ${words ? `<p class="dg-wt">${T('คำที่ใช้ตัวนี้')} <small>${T('แตะเพื่อดู 5 ภาษา')}</small></p><ul class="dg-ws">${words}</ul>` : ''}
      ${x && (x[4] || []).length > 1 ? `<button class="dg-go" data-evolve="${esc2(c)}">${ic('bolt')}${T('ดูการประกอบอักษร')}</button>` : ''}
    </div>`;
  }
  const trailHTML = () => st.trail.map((c, i) => `<button class="${i === st.trail.length - 1 ? 'on' : ''}" data-trail="${i}" lang="zh-Hans">${esc2(show(c))}</button>`).join('<i>›</i>');

  /* ---------- paint (frame) ---------- */
  function paint() {
    if (!host) return;
    cancelAnimationFrame(anim); cur = new Map();
    st.stageFilter = null;
    const focus = st.trail[st.trail.length - 1], vm = viewMode();
    host.innerHTML = `<div class="dg${vm === 'radial' ? ' is-radial' : ''}${vm === 'grid' ? ' is-grid' : ''}">
      <div class="dg-top">
        <label class="dg-q">${ic('search')}<input maxlength="2" placeholder="${T('ค้นหาตระกูล เช่น 青, 木, 马…')}" value="${CLANS.includes(st.trail[0]) ? '' : esc2(st.trail[0])}"><button class="q-pen" data-handpad=".dg-q input" aria-label="${T('เขียนค้นหา')}">${ic('pen')}</button></label>
      </div>
      <div class="dg-clans">${CLANS.map(c => `<button class="${st.trail[0] === c ? 'on' : ''}" data-base="${c}" lang="zh-Hans">${esc2(show(c))}</button>`).join('')}</div>
      <div class="dg-subbar">
        <div class="dg-tg dg-vw" role="tablist">
          <span class="${vm === 'radial' ? 'on' : ''}" data-view="radial">${T('รอบตัว')}</span>
          <span class="${vm === 'grid' ? 'on' : ''}" data-view="grid">${T('กริด')}</span>
          <span class="${vm === 'tree' ? 'on' : ''}" data-view="tree">${T('ขวา')}</span>
        </div>
        <div class="dg-legend">${ORDER.map(k => `<button type="button" class="s-${k}" data-stage="${k}" aria-pressed="false"><i></i><b lang="zh-Hans">${STAGES[k].zh}</b><span>${LANG === 'en' ? T(STAGES[k].th) : STAGES[k].sh}</span><em class="dg-cnt"></em></button>`).join('')}</div>
      </div>
      <nav class="dg-trail" aria-label="trail"${st.trail.length > 1 ? '' : ' hidden'}>${trailHTML()}</nav>
      <div class="dg-body">
        ${vm === 'grid'
          ? `<div class="dg-grid-wrap"></div>`
          : `<div class="dg-view" tabindex="0" aria-label="${T('ลากเพื่อเลื่อน · หมุนล้อหรือบีบเพื่อซูม')}">
              <div class="dg-world"></div>
              <div class="dg-zoom"><button data-zoom="1" aria-label="zoom in">+</button><button data-zoom="-1" aria-label="zoom out">−</button><button data-zoom="0" aria-label="fit">${ic('repeat')}</button></div>
              <div class="dg-more-bar"></div>
              <p class="dg-hint">${radial() ? T('แตะตัวไหนก็ได้เพื่อย้ายมาไว้ตรงกลาง') : T('ลากเพื่อเลื่อน · หมุนล้อหรือบีบเพื่อซูม')}</p>
            </div>`}
        <aside class="dg-side"></aside>
      </div>
      <div class="dg-fx" hidden></div></div>`;
    if (vm === 'radial') { st.fitted = false; drawRadial(focus, false); watchShape(); }
    else if (vm === 'grid') drawGrid(focus);
    else { drawTree(); watchShape(); }
  }

  /* ---------- grid view (clean mobile-first grouped tiles for big clans) ---------- */
  function drawGrid(f) {
    const wrap = host.querySelector('.dg-grid-wrap'); if (!wrap) return;
    const parts = partsOf(f).map(q => ({ c: q, stage: 'PART' }));
    const except = new Set([f, ...parts.map(p => p.c)]);
    const kids = kidsOf(f, except).map(c => ({ c, stage: stageOf(c, f) }));
    const all = parts.concat(kids);
    const byStage = new Map();
    ORDER.forEach(s => byStage.set(s, []));
    all.forEach(it => { if (byStage.has(it.stage)) byStage.get(it.stage).push(it); });
    // Sort each group by HSK level ascending
    byStage.forEach(arr => arr.sort((a, b) => ((D.c[a.c] || [])[1] || 9) - ((D.c[b.c] || [])[1] || 9)));

    host.querySelectorAll('.dg-legend [data-stage]').forEach(el => {
      const n = (byStage.get(el.dataset.stage) || []).length;
      el.querySelector('.dg-cnt').textContent = n ? n : '';
      el.classList.toggle('none', !n);
    });

    const tr = host.querySelector('.dg-trail');
    if (tr) { tr.innerHTML = trailHTML(); tr.hidden = st.trail.length <= 1; }
    host.querySelectorAll('.dg-clans [data-base]').forEach(b => b.classList.toggle('on', b.dataset.base === st.trail[0]));

    const secs = ORDER.map(s => {
      const arr = byStage.get(s) || [];
      if (!arr.length) return '';
      if (st.stageFilter && st.stageFilter !== s) return '';
      return `<section class="dg-gsec s-${s}">
        <h4 class="dg-gsh"><i></i><b lang="zh-Hans">${STAGES[s].zh}</b><span>${T(STAGES[s].th)}</span><small>${arr.length}</small></h4>
        <div class="dg-glist">${arr.map(it => {
          const c = it.c, x = D.c[c], m = meanOf(c);
          const dot = typeof HzKit !== 'undefined' ? HzKit.dotHtml(c) : '';
          const sd = side(c);
          const py = sd ? sd.split(' · ')[0] : (x ? x[0] : (radOfGlyph.get(c) || [])[3] || '');
          return `<button type="button" class="dg-gtile${it.stage === 'PART' ? ' is-part' : ''}"${lvC(c)} data-n="${esc2(c)}">
            ${dot}<span class="pyx">${esc2(py)}</span>
            <b lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(c))}</b>
            ${m.t ? `<small class="${m.fb ? 'fb' : ''}">${esc2(shortM(m.t))}</small>` : ''}
          </button>`;
        }).join('')}</div>
      </section>`;
    }).join('');

    wrap.innerHTML = secs || `<p class="tr-empty">${T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้')} (${typeof HzLv === 'undefined' ? '' : HzLv.label()})</p>`;
    const card = host.querySelector('.dg-side');
    card.innerHTML = cardHTML(f, stageForFocus(f), st.trail[st.trail.length - 2]);
    writeBig(f);
  }

  /* ---------- radial drawing + tween ---------- */
  let lay = null;
  function drawRadial(f, tween) {
    const world = host.querySelector('.dg-world'); if (!world) return;
    st.stageFilter = null;
    world.classList.remove('sf-on');
    host.querySelectorAll('.dg-legend [data-stage].on').forEach(el => { el.classList.remove('on'); el.setAttribute('aria-pressed', 'false'); });
    const next = layoutRadial(f), prev = cur, from = new Map();
    lay = next;
    // rings + sector labels
    let svg = world.querySelector('svg.dg-svg');
    if (!svg) { svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'dg-svg'); svg.setAttribute('width', '1'); svg.setAttribute('height', '1'); world.prepend(svg); }
    // nodes (keyed: kept ones glide, new ones grow out of their parent, old ones fade into the middle)
    const keep = new Set(next.nodes.map(n => n.key));
    [...world.querySelectorAll('.dg-n')].forEach(el => { if (!keep.has(el.dataset.n)) { el.classList.add('out'); setTimeout(() => el.remove(), 380); } });
    world.querySelectorAll('.dg-more, .dg-sec').forEach(el => el.remove());
    next.nodes.forEach(n => {
      let el = world.querySelector(`.dg-n[data-n="${CSS.escape(n.key)}"]`);
      const old = prev.get(n.key);
      if (!el) {
        el = document.createElement('button'); el.dataset.n = n.key; world.appendChild(el);
        const link = next.links.find(l => l.to === n.key || (n.stage === 'PART' && l.from === n.key));
        const src = link && (prev.get(link.from === n.key ? link.to : link.from) || next.nodes.find(m => m.key === (link.from === n.key ? link.to : link.from)));
        from.set(n.key, old || (src ? { x: src.x, y: src.y } : { x: 0, y: 0 }));
      } else from.set(n.key, old || { x: n.x, y: n.y });
      el.className = `dg-n r${n.ring} s-${n.stage}${n.ring === 0 ? ' on' : ''}`;
      el.setAttribute('aria-label', `${show(n.c)} ${T(STAGES[n.stage].th)}`);
      el.innerHTML = nodeInner(n.c, n.stage);
    });
    world.querySelectorAll('.dg-none').forEach(el => el.remove());
    if (!next.nodes.some(n => n.ring === 1 && n.stage !== 'PART')) world.insertAdjacentHTML('beforeend', `<p class="dg-none r" style="transform:translate(-50%,0) translate(0px,${next.B1 * .45 + 40}px)">${T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้')} (${typeof HzLv === 'undefined' ? '' : HzLv.label()})</p>`);
    const moreBar = host.querySelector('.dg-more-bar');
    if (moreBar) {
      moreBar.innerHTML = next.more
        ? (innerWidth < 700
          ? `<button type="button" class="dg-more-pill" data-view="grid">+${next.more} ${T('เพิ่มอีก')} · ${T('ดูทั้งหมดในโหมดกริด')} →</button>`
          : `<button type="button" class="dg-more-pill" data-more="${esc2(f)}">+${next.more} ${T('เพิ่มอีก')}</button>`)
        : '';
    }
    host.querySelectorAll('.dg-legend [data-stage]').forEach(el => { const n = (next.sectors.find(x => x.s === el.dataset.stage) || {}).n || 0; el.querySelector('.dg-cnt').textContent = n ? n : ''; el.classList.toggle('none', !n && el.dataset.stage !== 'ROOKIE'); });
    if (false) next.sectors.forEach(s => {
      const x = s.x, y = s.y;                                                       // outside the node labels
      world.insertAdjacentHTML('beforeend', `<span class="dg-sec s-${s.s}" style="transform:translate(-50%,-50%) translate(${x}px,${y}px)">${T(STAGES[s.s].th)} · ${s.n}</span>`);
    });
    // each node starts a little after the one before it (inner ring first, then the outer), new ones overshoot slightly
    const born = new Set(next.nodes.filter(n => !prev.has(n.key)).map(n => n.key)), delay = new Map();
    let i1 = 0, i2 = 0;
    next.nodes.forEach(n => delay.set(n.key, n.ring === 0 ? 0 : n.ring === 1 ? 40 + 16 * i1++ : 260 + 7 * i2++));
    const back = t => { const c = 1.55; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, out3 = t => 1 - Math.pow(1 - t, 3);
    const NODE_MS = 520, TOTAL = NODE_MS + Math.max(0, ...delay.values());
    const frame = ms => {
      const pos = new Map(), prog = new Map(), g = Math.min(1, ms / 420);
      next.nodes.forEach(n => {
        const t = Math.max(0, Math.min(1, (ms - delay.get(n.key)) / NODE_MS)), isNew = born.has(n.key), e = isNew ? back(t) : out3(t), a = from.get(n.key) || n;
        pos.set(n.key, { x: a.x + (n.x - a.x) * e, y: a.y + (n.y - a.y) * e }); prog.set(n.key, t);
        const el = world.querySelector(`.dg-n[data-n="${CSS.escape(n.key)}"]`), p = pos.get(n.key);
        if (!el) return;
        const s = isNew ? .35 + .65 * Math.min(1, out3(t) * 1.05) : 1;
        el.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%, var(--hy)) scale(${s.toFixed(3)})`;   // the square's centre sits on the point
        el.style.opacity = isNew && t < 1 ? Math.min(1, t * 2.2).toFixed(2) : '';
      });
      const rr = .82 + .18 * out3(g);
      svg.innerHTML = `<ellipse class="dg-ring1" rx="${(next.A1 * rr).toFixed(1)}" ry="${(next.B1 * rr).toFixed(1)}" style="opacity:${g.toFixed(2)}"/>${next.has2 ? `<ellipse class="dg-ring2" rx="${(next.A2 * rr).toFixed(1)}" ry="${(next.B2 * rr).toFixed(1)}" style="opacity:${g.toFixed(2)}"/>` : ''}${next.A3 ? `<ellipse class="dg-ring2" rx="${(next.A3 * rr).toFixed(1)}" ry="${(next.B3 * rr).toFixed(1)}" style="opacity:${g.toFixed(2)}"/>` : ''}`
        + next.links.map(l => { const a = pos.get(l.from), b = pos.get(l.to); if (!a || !b) return '';
          const mx = (a.x + b.x) / 2 * .92, my = (a.y + b.y) / 2 * .92, far = l.stage === 'PART' ? l.from : l.to;
          const p = born.has(far) ? out3(prog.get(far) || 0) : 1, part = l.stage === 'PART';
          const draw = p < 1 && !part ? ` pathLength="1" stroke-dasharray="1" stroke-dashoffset="${(1 - p).toFixed(3)}"` : part && p < 1 ? ` style="opacity:${p.toFixed(2)}"` : '';
          return `<path class="dg-l s-${l.stage}${part ? ' part' : ''}" data-a="${esc2(l.from)}" data-b="${esc2(l.to)}" d="M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}"${draw}/>`; }).join('');
      cur = pos;
    };
    const card = host.querySelector('.dg-side'); card.innerHTML = cardHTML(f, next.nodes[0].stage, st.trail[st.trail.length - 2]);
    const tr = host.querySelector('.dg-trail'); if (tr) { tr.innerHTML = trailHTML(); tr.hidden = st.trail.length <= 1; }
    host.querySelectorAll('.dg-clans [data-base]').forEach(b => b.classList.toggle('on', b.dataset.base === st.trail[0]));
    writeBig(f);
    if (!tween || matchMedia('(prefers-reduced-motion: reduce)').matches) { frame(TOTAL + 1); fitRadial(); arrive(world); return; }
    const t0 = performance.now();
    cancelAnimationFrame(anim);
    const tick = now => { const ms = now - t0; frame(ms); if (ms < TOTAL) anim = requestAnimationFrame(tick); else { frame(TOTAL + 1); arrive(world); } };
    anim = requestAnimationFrame(tick);
    glideTo();
  }
  // the character that just reached the middle settles with a small bounce and a ring in its level colour
  function arrive(world) {
    const el = world.querySelector('.dg-n.r0'); if (!el) return;
    el.classList.remove('arrive'); void el.offsetWidth; el.classList.add('arrive');
  }
  function ripple(key) {
    const world = host.querySelector('.dg-world'), p = cur.get(key), el = world && world.querySelector(`.dg-n[data-n="${CSS.escape(key)}"] .dg-hex`);
    if (!world || !p || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = document.createElement('span'); r.className = 'dg-ripple';
    r.style.cssText = `transform:translate(${p.x}px,${p.y}px) translate(-50%,-50%);--lc:${el ? getComputedStyle(el).getPropertyValue('--lc') || 'var(--ink)' : 'var(--ink)'}`;
    world.appendChild(r); setTimeout(() => r.remove(), 750);
  }
  // pointing at a character lights its own links and neighbours, the rest steps back
  function hover(key) {
    const world = host.querySelector('.dg-world'); if (!world || !lay) return;
    world.querySelectorAll('.hl').forEach(x => x.classList.remove('hl'));
    if (!key) { world.classList.remove('hov'); return; }
    const near = new Set([key]);
    lay.links.forEach(l => { if (l.from === key || l.to === key) { near.add(l.from); near.add(l.to); } });
    world.querySelectorAll('.dg-l').forEach(p => { if (p.dataset.a === key || p.dataset.b === key) p.classList.add('hl'); });
    world.querySelectorAll('.dg-n').forEach(n => { if (near.has(n.dataset.n)) n.classList.add('hl'); });
    const el = world.querySelector(`.dg-n[data-n="${CSS.escape(key)}"] .dg-hex`);
    world.style.setProperty('--hlc', el ? getComputedStyle(el).getPropertyValue('--lc') || 'var(--ink)' : 'var(--ink)');
    world.classList.add('hov');
  }
  // the big character in the card writes itself stroke by stroke (hanzi-writer, when online); tap it to write again
  let hwTok = 0;
  async function writeBig(c) {
    const box = host.querySelector('.dg-side .dg-big'), tok = ++hwTok, g = show(c);
    if (!box || !D.c[c] || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try { if (!window.HanziWriter) await Fx.script('https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js'); } catch (e) { return; }
    if (tok !== hwTok || !box.isConnected || !window.HanziWriter) return;
    const size = box.clientWidth - 8, ink = getComputedStyle(box).color, line = getComputedStyle(box).getPropertyValue('--line') || '#ddd';
    if (size < 20) return;
    const holder = document.createElement('div'); holder.className = 'dg-hw';
    let w;
    try {
      w = HanziWriter.create(holder, g, { width: size, height: size, padding: 6, showOutline: true, showCharacter: false, strokeColor: ink, outlineColor: line.trim() || '#ddd',
        strokeAnimationSpeed: 1.6, delayBetweenStrokes: 70,
        onLoadCharDataSuccess: () => { if (tok !== hwTok || !box.isConnected) return; box.classList.add('writing'); box.appendChild(holder); w.animateCharacter({ onComplete: () => box.classList.remove('writing') }); },
        onLoadCharDataError: () => { } });
    } catch (e) { return; }
    box.onclick = () => { if (w && box.contains(holder)) { box.classList.add('writing'); w.animateCharacter({ onComplete: () => box.classList.remove('writing') }); } };
  }
  // the graph area changed shape (full screen, window, iPad turned): lay the oval out again for the new proportions
  let ro = null, roT = 0;
  function watchShape() {
    if (typeof ResizeObserver === 'undefined') return;
    const v = host.querySelector('.dg-view'); if (!v) return;
    if (ro) ro.disconnect();
    ro = new ResizeObserver(() => { clearTimeout(roT); roT = setTimeout(() => {
      if (!host || !host.isConnected || !radial() || !lay || !v.isConnected) return;
      if (Math.abs(viewAspect() - lay.asp) > .1) drawRadial(st.trail[st.trail.length - 1], false); else fitRadial();
    }, 160); });
    ro.observe(v);
  }
  // zoom so the whole multi-ring oval (including top pinyin & bottom meanings) fits cleanly inside the viewport
  const fitK = (vw, vh) => Math.max(.14, Math.min(1.12, vw / (2 * (lay.outerX + 36)), vh / (2 * (lay.outerY + 44))));
  function fitRadial() {
    const v = host.querySelector('.dg-view'); if (!v || !lay) return;
    const vw = v.clientWidth || 600, vh = v.clientHeight || 480;
    st.k = fitK(vw, vh);
    st.tx = vw / 2; st.ty = vh / 2; apply(); st.fitted = true;
  }
  function glideTo() {                                         // pan smoothly back to the middle (and refit) on every recentre
    const v = host.querySelector('.dg-view'); if (!v || !lay) return;
    const vw = v.clientWidth, vh = v.clientHeight;
    const k1 = fitK(vw, vh), a = { tx: st.tx, ty: st.ty, k: st.k }, b = { tx: vw / 2, ty: vh / 2, k: k1 };
    const t0 = performance.now();
    const step = now => { const t = Math.min(1, (now - t0) / 560), e = 1 - Math.pow(1 - t, 3);
      st.tx = a.tx + (b.tx - a.tx) * e; st.ty = a.ty + (b.ty - a.ty) * e; st.k = a.k + (b.k - a.k) * e; apply(); if (t < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function focusOn(c) {
    if (!D.c[c] && !D.cc[c] && !radOfGlyph.get(c)) return;
    const i = st.trail.indexOf(c);
    if (i >= 0) st.trail = st.trail.slice(0, i + 1); else st.trail.push(c);
    if (st.trail.length > 12) st.trail = st.trail.slice(-12);
    tone([[660, 990, 0, .09, 'square'], [990, 1480, .06, .12, 'sine']]);
    if (isGrid()) drawGrid(c);
    else drawRadial(c, true);
  }

  /* ---------- tree drawing ---------- */
  function drawTree() {
    const base = st.trail[st.trail.length - 1];
    tree = build(base);
    const world = host.querySelector('.dg-world');
    world.style.width = tree.w + 'px'; world.style.height = tree.h + 'px';
    let links = '';
    tree.all.forEach(n => n.kids.forEach(k => { const x1 = n.x + NODE, y1 = n.y + 48, x2 = k.x, y2 = k.y + 48, mx = (x1 + x2) / 2;
      links += `<path class="dg-l s-${k.stage}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/>`; }));
    world.innerHTML = `<svg class="dg-svg tree" width="${tree.w}" height="${tree.h}" aria-hidden="true">${links}</svg>`
      + tree.all.map(n => `<button class="dg-n t s-${n.stage}${(st.sel || base) === n.c ? ' on' : ''}" data-n="${esc2(n.c)}" style="left:${n.x}px;top:${n.y}px">${nodeInner(n.c, n.stage)}</button>`).join('')
      + tree.all.filter(n => n.more).map(n => `<button class="dg-more t" data-more="${esc2(n.c)}" style="left:${n.x + COLW}px;top:${n.moreY}px">+${n.more} ${T('เพิ่มอีก')}</button>`).join('');
    const sel = tree.all.find(n => n.c === (st.sel || base)) || tree.root;
    host.querySelector('.dg-side').innerHTML = cardHTML(sel.c, sel.stage, sel.p);
    if (!tree.root.kids.length) world.insertAdjacentHTML('beforeend', `<p class="dg-none">${T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้')}</p>`);
    const v = host.querySelector('.dg-view'), vw = v.clientWidth || 600, vh = v.clientHeight || 480;
    st.k = Math.max(.35, Math.min(1.1, vw / tree.w, vh / tree.h * 1.6));
    st.tx = Math.max(8, (vw - tree.w * st.k) / 2); st.ty = Math.max(8, Math.min(20, (vh - tree.h * st.k) / 2));
    if (tree.h * st.k > vh) st.ty = vh / 2 - (tree.root.y + NODE / 2) * st.k;
    apply();
  }
  function apply() { const w = host && host.querySelector('.dg-world'); if (w) w.style.transform = `translate(${st.tx}px,${st.ty}px) scale(${st.k})`; }
  function zoomAt(f, cx, cy) { const k = Math.max(.14, Math.min(2.6, st.k * f)); st.tx = cx - (cx - st.tx) * (k / st.k); st.ty = cy - (cy - st.ty) * (k / st.k); st.k = k; apply(); }

  /* ---------- sound (synthesised; follows the app's sound setting) ---------- */
  let ac = null;
  function tone(seq) {
    const s = S(); if (s.sfx === false || !s.vol) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = ac.currentTime, vol = .05 * (s.vol / 60);
      seq.forEach(([f1, f2, at, dur, type]) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine';
        o.frequency.setValueAtTime(f1, t0 + at); o.frequency.exponentialRampToValueAtTime(f2, t0 + at + dur);
        g.gain.setValueAtTime(0, t0 + at); g.gain.linearRampToValueAtTime(vol, t0 + at + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + at + dur);
        o.connect(g).connect(ac.destination); o.start(t0 + at); o.stop(t0 + at + dur + .05); });
    } catch (e) { }
  }

  /* ---------- ฉากประกอบอักษร: the parts fly in from where they really sit and lock into the character ----------
     Layout from the character's IDS (data/compose.js, the composer's data): ⿰ left|right, ⿱ top/bottom, ⿲ ⿳ thirds,
     ⿴…⿺ an outer part around an inner one, ⿻ overlaid. Each part says what it does: 形旁 meaning / 声旁 sound
     (Make Me a Hanzi, x[11] x[12]); in a 会意 character every part carries meaning. */
  const CELLS = {
    '⿰': (p0) => [[0, 0, p0, 1], [p0, 0, 1 - p0, 1]], '⿱': () => [[0, 0, 1, .46], [0, .46, 1, .54]],
    '⿲': () => [[0, 0, .33, 1], [.33, 0, .34, 1], [.67, 0, .33, 1]], '⿳': () => [[0, 0, 1, .33], [0, .33, 1, .34], [0, .67, 1, .33]],
    '⿴': () => [[0, 0, 1, 1], [.27, .27, .46, .46]], '⿵': () => [[0, 0, 1, 1], [.25, .36, .5, .56]], '⿶': () => [[0, 0, 1, 1], [.25, .06, .5, .56]],
    '⿷': () => [[0, 0, 1, 1], [.34, .2, .6, .6]], '⿸': () => [[0, 0, 1, 1], [.34, .34, .62, .62]], '⿹': () => [[0, 0, 1, 1], [.04, .34, .6, .62]],
    '⿺': () => [[0, 0, 1, 1], [.34, .04, .62, .62]], '⿻': () => [[0, 0, 1, 1], [0, 0, 1, 1]], '⿼': () => [[0, 0, 1, 1], [.34, .2, .6, .6]], '⿽': () => [[0, 0, 1, 1], [.04, .04, .6, .6]]
  };
  const NARROW = /^[亻氵讠扌忄纟钅饣犭礻衤冫彳阝口日月木火王石目禾米足车贝马女土山弓舟虫鱼鸟]$/;
  let CMP = null;
  async function idsOf(c) {
    if (!CMP) { try { if (!window.OFFY_COMPOSE) await Fx.script('data/compose.js?v=1'); CMP = window.OFFY_COMPOSE.ids; } catch (e) { CMP = {}; } }
    return CMP[c] || null;
  }
  function roleOf(c, q) {
    const x = D.c[c] || [], g = base(q), six = x[6] || '';
    if (x[11] && x[11] === g) return ['m', T('บอกความหมาย')];
    if (x[12] && x[12] === g) return ['s', T('บอกเสียง')];
    if (six.startsWith('会意')) return ['m', T('บอกความหมาย')];
    return ['p', T('ส่วนประกอบ')];
  }
  async function evolve(c) {
    if (!D.c[c]) return;
    const row = await idsOf(c), x = D.c[c], fx = host.querySelector('.dg-fx');
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const parts = row ? row.slice(1) : (x[4] || []).slice(0, 2), idc = row ? row[0] : '⿰';
    const p0 = NARROW.test(base(parts[0] || '')) && idc === '⿰' ? .4 : .5;
    const cells = (CELLS[idc] || CELLS['⿰'])(p0);
    const S = Math.min(220, Math.round(innerWidth * .46)), lv = `var(--hsk${x[1]})`;
    const label = q => { const m = meanOf(base(q)); return /^[⿰-⿿]/.test(q) ? '' : (D.c[base(q)] ? D.c[base(q)][0] : '') || shortM(m.t || ''); };
    fx.hidden = false;
    fx.innerHTML = `<div class="dg-asm${rm ? ' rm' : ''}" role="dialog" aria-label="${T('การประกอบอักษร')}" style="--lc:${lv};--S:${S}px">
      <p class="dg-asm-t">${T('การประกอบอักษร')}${x[6] ? ` · <span lang="zh-Hans">${esc2(x[6])}</span>` : ''}</p>
      <div class="dg-asm-stage">
        <div class="dg-asm-box"></div>
        ${parts.map((q, i) => { const [k, role] = roleOf(c, q); return `<div class="dg-asm-p r-${k}" data-i="${i}"><b lang="zh-Hans">${esc2(show(base(q)).replace(/[⿰-⿿]/g, ''))}</b>
          <span class="dg-asm-l">${esc2(role)}${label(q) ? ` · ${esc2(label(q))}` : ''}</span></div>`; }).join('')}
        <div class="dg-asm-r" lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(c))}</div>
      </div>
      <p class="dg-asm-f" lang="zh-Hans">${parts.map(q => esc2(show(base(q)).replace(/[⿰-⿿]/g, ''))).join(' + ')} = ${esc2(show(c))}</p>
      <p class="dg-asm-n"><span class="pyx">${esc2(x[0])}</span> ${esc2(meanOf(c).t)}</p>
      <div class="dg-asm-a"><button class="dg-asm-again" data-evolve="${esc2(c)}">${ic('retry')}${T('เล่นอีกครั้ง')}</button></div>
      <button class="dg-x" data-close aria-label="${T('ปิด')}">${ic('x')}</button></div>`;
    const stage = fx.querySelector('.dg-asm-stage'), box = fx.querySelector('.dg-asm-box'), res = fx.querySelector('.dg-asm-r');
    const els = [...fx.querySelectorAll('.dg-asm-p')];
    const W = stage.clientWidth, H = stage.clientHeight, ox = (W - S) / 2, oy = (H - S) / 2;
    // where each part ends (its cell, squeezed to fit) and where it starts (pushed outward from the middle, full size)
    const plan = els.map((el, i) => {
      const [cx, cy, cw, ch] = cells[Math.min(i, cells.length - 1)], g = el.querySelector('b');
      const big = Math.max(cw, ch), fs = S * big * .86;
      g.style.fontSize = fs + 'px';
      const tx = ox + (cx + cw / 2) * S, ty = oy + (cy + ch / 2) * S;
      let dx = (cx + cw / 2) - .5, dy = (cy + ch / 2) - .5;
      if (Math.hypot(dx, dy) < .05) { dx = i ? .5 : 0; dy = i ? .25 : -.35; }                  // enclosed/overlaid: the inner one comes from below-right
      // start: pushed out from the middle, at a readable size, but always whole inside the frame (label included)
      const n = Math.hypot(dx, dy) || 1, push = S * .55, ls = Math.min(1, (S * .4) / fs), half = Math.max(fs * ls, 140) / 2 + 8;
      const sx = Math.max(half, Math.min(W - half, tx + dx / n * push)), sy = Math.max(fs * ls / 2 + 6, Math.min(H - fs * ls / 2 - 34, ty + dy / n * push * .8));
      const sq = `scale(${(cw / big).toFixed(3)}, ${(ch / big).toFixed(3)})`, loose = `scale(${ls.toFixed(3)})`;
      return { el, g, tx, ty, sx, sy, sq, loose };
    });
    const at = (p, x, y, t) => `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    plan.forEach(p => { p.el.style.transform = at(p, p.sx, p.sy); p.g.style.transform = p.loose; });
    const done = () => { res.classList.add('on'); fx.querySelector('.dg-asm-f').classList.add('on'); fx.querySelector('.dg-asm-n').classList.add('on'); fx.querySelector('.dg-asm-a').classList.add('on'); };
    if (rm || !Element.prototype.animate) {
      plan.forEach(p => { p.el.style.opacity = 0; }); box.classList.add('on'); done(); setTimeout(() => TTS.speak(c), 200); return;
    }
    const ease = 'cubic-bezier(.3, 1.35, .45, 1)';
    // 1 · each part arrives with its role
    plan.forEach((p, i) => {
      p.el.animate([{ opacity: 0, transform: at(p, p.sx, p.sy + 24) }, { opacity: 1, transform: at(p, p.sx, p.sy) }], { duration: 420, delay: 120 + i * 160, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
      p.el.querySelector('.dg-asm-l').animate([{ opacity: 0, transform: 'translate(-50%, 6px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 360, delay: 380 + i * 160, fill: 'both' });
    });
    const T1 = 1500 + plan.length * 120;
    // 2 · they slide into their places and squeeze to fit; the square draws itself in the level colour
    plan.forEach((p, i) => {
      p.el.animate([{ transform: at(p, p.sx, p.sy) }, { transform: at(p, p.tx, p.ty) }], { duration: 720, delay: T1 + i * 70, easing: ease, fill: 'forwards' });
      p.g.animate([{ transform: p.loose }, { transform: p.sq }], { duration: 720, delay: T1 + i * 70, easing: ease, fill: 'forwards' });
      p.el.querySelector('.dg-asm-l').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: T1, fill: 'forwards' });
      setTimeout(() => tone([[520 + i * 130, 780 + i * 160, 0, .07, 'triangle']]), T1 + 520 + i * 70);
    });
    setTimeout(() => box.classList.add('on'), T1 + 200);
    // 3 · the pieces become the real character
    const T2 = T1 + 900 + plan.length * 70;
    plan.forEach(p => p.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, delay: T2, fill: 'forwards' }));
    setTimeout(() => { done(); tone([[523, 1046, 0, .22], [784, 1568, .08, .4]]); }, T2);
    setTimeout(() => TTS.speak(c), T2 + 350);
  }

  /* ---------- events ---------- */
  function setBase(g) { const A = (D.amb || {})[g]; if (A && !radOfGlyph.get(g)) g = `${g}@${A[A.length - 1]}`;   // typed 阝 → the left one first; its partner is a tap away
    if (!D.cc[g] && !D.c[g] && !radOfGlyph.get(g)) return false; st.trail = [g]; st.sel = null; st.open = {}; st.stageFilter = null;
    if (radial()) { tone([[440, 880, 0, .12, 'square']]); drawRadial(g, true); }
    else if (isGrid()) { tone([[440, 880, 0, .1, 'square']]); drawGrid(g); }
    else paint();
    return true; }
  function bind() {
    let drag = null; const pts = new Map(); let pinch = 0;
    host.addEventListener('click', e => {
      const b = e.target.closest('button, [data-view]'); if (!b || (drag && drag.moved)) return;
      const d = b.dataset;
      if (d.close !== undefined) { const fx = host.querySelector('.dg-fx'); fx.hidden = true; fx.innerHTML = ''; return; }
      if (d.view) { if (viewMode() !== d.view) { S().digiView = d.view; Store.save(); paint(); } return; }
      if (d.n) {
        if (radial()) { ripple(d.n); hover(null); focusOn(d.n); }
        else if (isGrid()) { focusOn(d.n); }
        else { st.sel = d.n; host.querySelectorAll('.dg-n').forEach(x => x.classList.toggle('on', x.dataset.n === d.n)); const n = tree.all.find(m => m.c === d.n); host.querySelector('.dg-side').innerHTML = cardHTML(n.c, n.stage, n.p); tone([[880, 1320, 0, .08, 'square']]); }
        if (matchMedia('(max-width: 999px)').matches && !radial() && !isGrid()) host.querySelector('.dg-side').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      if (d.dgo) { if (radial() || isGrid()) focusOn(d.dgo); else setBase(d.dgo); return; }
      if (d.trail !== undefined) { focusOn(st.trail[+d.trail]); return; }
      if (d.base) { setBase(d.base); return; }
      if (d.more) { st.open[d.more] = true; if (radial()) drawRadial(st.trail[st.trail.length - 1], true); else paint(); return; }
      if (d.trad !== undefined) { S().hzTrad = !trad(); Store.save(); paint(); if (typeof OffyTree !== 'undefined' && OffyTree.refresh) OffyTree.refresh(); return; }
      if (d.zoom !== undefined) { const v = host.querySelector('.dg-view'); if (d.zoom === '0') { if (radial()) glideTo(); else drawTree(); } else zoomAt(d.zoom === '1' ? 1.2 : 1 / 1.2, v.clientWidth / 2, v.clientHeight / 2); return; }
      if (d.dgword) { if (typeof HzKit !== 'undefined') HzKit.openWord(d.dgword); else TTS.speak(d.dgword); return; }
      if (d.stage && b.closest('.dg-legend')) {
        if (b.classList.contains('none')) return;
        st.stageFilter = st.stageFilter === d.stage ? null : d.stage;
        host.querySelectorAll('.dg-legend [data-stage]').forEach(el => {
          const on = el.dataset.stage === st.stageFilter;
          el.classList.toggle('on', on); el.setAttribute('aria-pressed', on);
        });
        if (isGrid()) { drawGrid(st.trail[st.trail.length - 1]); return; }
        const world = host.querySelector('.dg-world');
        if (world) {
          world.classList.toggle('sf-on', !!st.stageFilter);
          world.querySelectorAll('.dg-n, .dg-l').forEach(el => {
            el.classList.toggle('sf-hi', !st.stageFilter || el.classList.contains('r0') || el.classList.contains('s-' + st.stageFilter));
          });
        }
        return;
      }
      if (d.say) { TTS.speak(d.say); return; }
      if (d.evolve) evolve(d.evolve);
    });
    host.addEventListener('keydown', e => { if (e.key === 'Escape') { const fx = host.querySelector('.dg-fx'); if (fx && !fx.hidden) { fx.hidden = true; fx.innerHTML = ''; } } });
    host.addEventListener('change', e => {
      if (!e.target.matches('.dg-q input')) return;
      const g = Array.from(e.target.value.trim())[0];
      if (g && !setBase(g)) toast(`${T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้')}`, { icon: 'info' });
    });
    host.addEventListener('pointerdown', e => {
      const v = e.target.closest('.dg-view'); if (!v || e.target.closest('.dg-zoom')) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, tx: st.tx, ty: st.ty, moved: false };
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
    });
    host.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      const v = host.querySelector('.dg-view'), r = v.getBoundingClientRect();
      if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoomAt(d / pinch, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); pinch = d; if (drag) drag.moved = true; return; }
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) { drag.moved = true; v.setPointerCapture && v.setPointerCapture(e.pointerId); }
      if (drag.moved) { st.tx = drag.tx + dx; st.ty = drag.ty + dy; apply(); }
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (!pts.size) setTimeout(() => { drag = null; }, 0); };
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    host.addEventListener('pointerover', e => { if (e.pointerType === 'touch' || !radial()) return; const n = e.target.closest('.dg-n'); hover(n ? n.dataset.n : null); });
    host.addEventListener('pointerleave', () => hover(null));
    host.addEventListener('wheel', e => { const v = e.target.closest('.dg-view'); if (!v) return; e.preventDefault(); const r = v.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  }

  return {
    async mount(el) {
      host = el; if (!host) return;
      host.innerHTML = `<p class="tr-empty">${T('กำลังโหลดต้นไม้…')}</p>`;
      if (!window.OFFY_TREE) { try { await Fx.script(SRC); } catch (e) { host.innerHTML = `<p class="tr-empty">${T('โหลดเนื้อหาเล่มนี้ไม่ได้ ลองเปิดใหม่อีกครั้ง')}</p>`; return; } }
      if (host !== el) return;
      D = window.OFFY_TREE; rad = new Map(D.r.map(r => [r[0], r]));
      const AMB = D.amb || {}, key = (g, no) => AMB[g] ? `${g}@${no}` : g;
      radOfGlyph = new Map(); D.r.forEach(r => { [r[1], ...r[8].map(f => f[0])].forEach(g => { radOfGlyph.set(key(g, r[0]), r); if (!AMB[g] || g === r[1]) radOfGlyph.set(g, r); }); });
      const fc = new Map();                                                                            // 水 氵 氺 count as one
      formsOf = g => { if (!fc.has(g)) { const r = radOfGlyph.get(g); fc.set(g, new Set(r ? [r[1], ...r[8].map(f => f[0])].map(f => key(f, r[0])).concat(AMB[r[1]] ? [] : [r[1]]) : [g])); } return fc.get(g); };
      bind(); paint();
    },
    refresh() { if (host && host.isConnected && D) paint(); },
    focus(c) { if (D && host && host.isConnected) { if (!setBase(c)) toast(T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้'), { icon: 'info' }); } }
  };
})();
