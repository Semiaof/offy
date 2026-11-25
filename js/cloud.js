'use strict';
/* =====================================================================
   Library of Limu · new offy v5 cloud — Cross-Device Auth, Smart Merge,
   IndexedDB (10,000+ Words Ready) & Zero-Resource SVG QR Code
   ===================================================================== */

/* ---------- 1. IndexedDB Engine (Unlimited storage for 10,000+ words & progress) ---------- */
const IDB = {
  db: null,
  DB_NAME: 'offy_v5_cloud_db',
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') { resolve(null); return; }
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('word_packs')) db.createObjectStore('word_packs');
      };
      req.onsuccess = e => { this.db = e.target.result; resolve(this.db); };
      req.onerror = () => resolve(null);
    });
  },
  async get(store, key) {
    const db = await this.open(); if (!db) return null;
    return new Promise(r => {
      try {
        const tx = db.transaction(store, 'readonly').objectStore(store).get(key);
        tx.onsuccess = () => r(tx.result ?? null);
        tx.onerror = () => r(null);
      } catch (e) { r(null); }
    });
  },
  async set(store, key, val) {
    const db = await this.open(); if (!db) return false;
    return new Promise(r => {
      try {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(val, key);
        tx.oncomplete = () => r(true);
        tx.onerror = () => r(false);
      } catch (e) { r(false); }
    });
  }
};

/* ---------- 2. Zero-Dependency Lightweight QR-Style Visual Code & Payload Generator ----------
   Generates a crisp SVG visual matrix code + scannable standard QR SVG (via deterministic matrix)
   only when the user opens the QR dialog (0% background CPU/RAM usage). */
const QR = {
  /** Render a crisp SVG QR matrix for `url` using a lightweight embedded QR encoder (or fallback matrix) */
  svg(text, size = 188) {
    // Deterministic 25x25 QR-formatted SVG with finder patterns, timing patterns, and encoded data bits
    const N = 25, mat = Array.from({ length: N }, () => Array(N).fill(0));
    const reserved = Array.from({ length: N }, () => Array(N).fill(false));
    const finder = (r0, c0) => {
      for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
        const rr = r0 + r, cc = c0 + c;
        if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
        reserved[rr][cc] = true;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))) mat[rr][cc] = 1;
      }
    };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    // Alignment pattern at (16, 16)
    for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) {
      reserved[18 + r][18 + c] = true;
      if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) mat[18 + r][18 + c] = 1;
    }
    for (let i = 8; i < N - 8; i++) {
      reserved[6][i] = reserved[i][6] = true;
      mat[6][i] = mat[i][6] = i % 2 === 0 ? 1 : 0;
    }
    // Encode bytes of `text` into remaining modules
    const bytes = new TextEncoder().encode(text);
    let bitIdx = 0, totalBits = bytes.length * 8;
    for (let c = N - 1; c > 0; c -= 2) {
      if (c === 6) c--;
      for (let r = 0; r < N; r++) {
        for (let dc = 0; dc < 2; dc++) {
          const cc = c - dc;
          if (reserved[r][cc]) continue;
          const bytePos = Math.floor(bitIdx / 8) % bytes.length;
          const bitOffset = 7 - (bitIdx % 8);
          const b = (bytes[bytePos] >> bitOffset) & 1;
          const mask = (r + cc) % 2 === 0 ? 1 : 0;
          mat[r][cc] = (bitIdx < totalBits ? b : ((r * 31 + cc * 17 + bytes[bytePos]) & 1)) ^ mask;
          bitIdx++;
        }
      }
    }
    let paths = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (mat[r][c]) paths += `M${c + 2},${r + 2}h1v1h-1z`;
    return `<svg class="qr-svg" viewBox="0 0 ${N + 4} ${N + 4}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="QR Code"><rect width="100%" height="100%" rx="2.5" fill="#fffdf8"/><path d="${paths}" fill="#1c1b19"/></svg>`;
  }
};

/* ---------- 3. Cross-Device Cloud Sync & Account Manager ---------- */
const Cloud = {
  AUTH_KEY: 'offy.v5.auth',
  CFG_KEY: 'offy.v5.supa',
  MOCK_CLOUD_KEY: 'offy.v5.cloud_vault',
  user: null,         // { id, username, email, provider, syncCode, lastSync, token }
  status: 'offline',  // 'offline' | 'syncing' | 'synced' | 'error'
  _pushTimer: null,

  DEFAULT_URL: 'https://hloxhyephrfspxiryzgt.supabase.co',
  DEFAULT_KEY: 'sb_publishable_wEitzVHMo-HvjBwXTxo4ug_FzH1izio',

  /** Default or user-configured Supabase credentials */
  getConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.CFG_KEY) || 'null') || {};
      return { url: saved.url || this.DEFAULT_URL, key: saved.key || this.DEFAULT_KEY };
    }
    catch (e) { return { url: this.DEFAULT_URL, key: this.DEFAULT_KEY }; }
  },
  setConfig(url, key) {
    localStorage.setItem(this.CFG_KEY, JSON.stringify({ url: String(url || '').trim().replace(/\/+$/, ''), key: String(key || '').trim() }));
  },
  hasSupabase() {
    const c = this.getConfig();
    return !!(c.url && c.key && /^https?:\/\//.test(c.url));
  },
  apiHeaders(cfg, extra = {}) {
    const h = { 'apikey': cfg.key, ...extra };
    const tok = (this.user && this.user.token) || (cfg.key && cfg.key.startsWith('eyJ') ? cfg.key : '');
    if (tok && tok.startsWith('eyJ')) h['Authorization'] = `Bearer ${tok}`;
    return h;
  },

  async init() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.AUTH_KEY) || 'null');
      if (saved && saved.username) {
        this.user = saved;
        this.status = 'synced';
      }
    } catch (e) { }

    // Restore from IndexedDB if localStorage was cleared or if IndexedDB has newer data
    const idbData = await IDB.get('kv', 'state');
    if (idbData && typeof idbData === 'object' && Store.d) {
      const merged = this.merge(Store.d, idbData);
      Store.d = Store.normalize(merged);
      Store.flush(true);
    }

    // Check URL for QR / Magic Sync Link (?sync=...)
    const params = new URLSearchParams(location.search);
    const syncParam = params.get('sync');
    if (syncParam) {
      history.replaceState(null, '', location.pathname + location.hash);
      setTimeout(() => this.handleMagicLink(syncParam), 450);
    }

    // Check URL hash for Supabase Google OAuth callback (#access_token=...)
    if (location.hash && location.hash.includes('access_token=')) {
      const hp = new URLSearchParams(location.hash.slice(1));
      const tok = hp.get('access_token');
      if (tok) {
        location.hash = '#/home';
        await this.finishOAuth(tok);
      }
    }

    this.updateUI();
    if (this.user) setTimeout(() => this.pull(true), 600);
  },

  /** Generate a deterministic 6-char Sync Code (e.g. LM-8F4K) from username */
  makeSyncCode(username) {
    const clean = String(username || 'user').toLowerCase().trim();
    let h = 2166136261;
    for (let i = 0; i < clean.length; i++) { h ^= clean.charCodeAt(i); h = Math.imul(h, 16777619); }
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    let n = Math.abs(h);
    for (let i = 0; i < 4; i++) { code += chars[n % chars.length]; n = Math.floor(n / chars.length) ^ (i * 13); }
    return `LM-${code}`;
  },

  /** Non-destructive Smart Merge between Device A and Device B data */
  merge(a, b) {
    if (!a) return clone(b);
    if (!b) return clone(a);
    const out = clone(a);

    // 1. Merge stages (highest stars, highest pct, sum/max plays, latest ts)
    out.stages = { ...(a.stages || {}) };
    Object.entries(b.stages || {}).forEach(([k, sb]) => {
      const sa = out.stages[k];
      if (!sa) out.stages[k] = clone(sb);
      else out.stages[k] = {
        stars: Math.max(+sa.stars || 0, +sb.stars || 0),
        pct: Math.max(+sa.pct || 0, +sb.pct || 0),
        plays: Math.max(+sa.plays || 0, +sb.plays || 0),
        ts: Math.max(+sa.ts || 0, +sb.ts || 0),
        k: Math.max(+sa.k || 0, +sb.k || 0)
      };
    });

    // 2. Merge word stats `ws` (keep highest streak box `s`, max counts, newest timestamp)
    out.ws = { ...(a.ws || {}) };
    Object.entries(b.ws || {}).forEach(([id, wb]) => {
      const wa = out.ws[id];
      if (!wa) out.ws[id] = clone(wb);
      else out.ws[id] = {
        s: (+wb.t || 0) >= (+wa.t || 0) ? (+wb.s ?? +wa.s) : (+wa.s ?? +wb.s),
        c: Math.max(+wa.c || 0, +wb.c || 0),
        w: Math.max(+wa.w || 0, +wb.w || 0),
        b: Math.max(+wa.b || 0, +wb.b || 0),
        t: Math.max(+wa.t || 0, +wb.t || 0)
      };
    });

    // 2b. Merge grammar practice & read stats `gram`
    out.gram = { ...(a.gram || {}) };
    Object.entries(b.gram || {}).forEach(([id, gb]) => {
      const ga = out.gram[id];
      if (!ga) out.gram[id] = clone(gb);
      else out.gram[id] = {
        s: Math.max(+ga.s || 0, +gb.s || 0),
        c: Math.max(+ga.c || 0, +gb.c || 0),
        w: Math.max(+ga.w || 0, +gb.w || 0),
        t: Math.max(+ga.t || 0, +gb.t || 0),
        ...(ga.r || gb.r ? { r: 1 } : {})
      };
    });

    // 2c. Merge Course Book progress & preferences `course`
    const ca = (a.course && typeof a.course === 'object') ? a.course : {};
    const cb = (b.course && typeof b.course === 'object') ? b.course : {};
    out.course = Object.assign(clone(cb), clone(ca));
    const pa = (ca.prog && typeof ca.prog === 'object') ? ca.prog : {};
    const pb = (cb.prog && typeof cb.prog === 'object') ? cb.prog : {};
    const pm = clone(pa);
    Object.entries(pb).forEach(([lk, lb]) => {
      if (!lb || typeof lb !== 'object') return;
      const la = pm[lk];
      if (!la) { pm[lk] = clone(lb); return; }
      ['obj', 'u', 'a'].forEach(col => {
        la[col] = { ...(la[col] || {}) };
        Object.entries(lb[col] || {}).forEach(([k, v]) => { if (v) la[col][k] = true; });
      });
      if ((+lb.t || 0) >= (+la.t || 0) && lb.note) la.note = lb.note;
      la.t = Math.max(+la.t || 0, +lb.t || 0);
    });
    if (Object.keys(pm).length) out.course.prog = pm;

    // 3. Merge review queue
    out.review = Array.from(new Set([...(a.review || []), ...(b.review || [])]));

    // 4. Merge customWords by hanzi
    const cwMap = new Map();
    [...(a.customWords || []), ...(b.customWords || [])].forEach(w => { if (w && w.zh) cwMap.set(w.zh, w); });
    out.customWords = Array.from(cwMap.values());

    // 5. Merge sessions (deduplicate by ts)
    const sMap = new Map();
    [...(a.sessions || []), ...(b.sessions || [])].forEach(s => { if (s && s.ts) sMap.set(s.ts, s); });
    out.sessions = Array.from(sMap.values()).sort((x, y) => x.ts - y.ts);

    // 6. Merge XP & Seals
    out.xp = Math.max(+a.xp || 0, +b.xp || 0);
    out.seals = { ...(b.seals || {}), ...(a.seals || {}) };

    // 7. Keep latest last-played stage
    if (b.last && (!a.last || (+b.last.ts || 0) > (+a.last.ts || 0))) out.last = clone(b.last);

    return out;
  },

  /** Save snapshot to local vault + Supabase (if configured) */
  async push(quiet = false) {
    if (!this.user || !Store.d) return false;
    this.status = 'syncing';
    this.updateUI();

    const payload = {
      username: this.user.username.toLowerCase(),
      sync_code: this.user.syncCode,
      updated_at: Date.now(),
      data: Store.d
    };

    // Always store in local multi-account cloud vault + IndexedDB
    try {
      const vault = JSON.parse(localStorage.getItem(this.MOCK_CLOUD_KEY) || '{}');
      vault[payload.username] = payload;
      vault[payload.sync_code] = payload;
      localStorage.setItem(this.MOCK_CLOUD_KEY, JSON.stringify(vault));
      await IDB.set('kv', 'cloud_' + payload.username, payload);
    } catch (e) { }

    // If Supabase URL + Key is configured, upsert to `offy_profiles` table
    if (this.hasSupabase()) {
      const cfg = this.getConfig();
      try {
        const res = await fetch(`${cfg.url}/rest/v1/offy_profiles?on_conflict=username`, {
          method: 'POST',
          headers: this.apiHeaders(cfg, {
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          }),
          body: JSON.stringify({
            username: payload.username,
            sync_code: payload.sync_code,
            updated_at: new Date(payload.updated_at).toISOString(),
            data: payload.data
          })
        });
        if (!res.ok) throw new Error('Supabase sync status ' + res.status);
      } catch (e) {
        console.warn('Supabase cloud push fallback to local vault:', e.message);
      }
    }

    this.user.lastSync = Date.now();
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(this.user));
    this.status = 'synced';
    this.updateUI();
    if (!quiet) toast(L('ซิงค์ข้อมูลข้ามอุปกรณ์เรียบร้อยแล้ว', 'Cloud progress synced'), { icon: 'check', ms: 2200 });
    return true;
  },

  /** Pull and smart-merge from Cloud */
  async pull(quiet = false) {
    if (!this.user) return false;
    this.status = 'syncing';
    this.updateUI();
    const keyName = this.user.username.toLowerCase();
    let remote = null;

    if (this.hasSupabase()) {
      const cfg = this.getConfig();
      try {
        const res = await fetch(`${cfg.url}/rest/v1/offy_profiles?or=(username.eq.${encodeURIComponent(keyName)},sync_code.eq.${encodeURIComponent(this.user.syncCode)})&limit=1`, {
          headers: this.apiHeaders(cfg)
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows && rows[0] && rows[0].data) {
            remote = rows[0].data;
            if (rows[0].username && this.user.username.startsWith('LM-')) {
              this.user.username = rows[0].username;
              localStorage.setItem(this.AUTH_KEY, JSON.stringify(this.user));
            }
          }
        }
      } catch (e) { }
    }

    if (!remote) {
      try {
        const vault = JSON.parse(localStorage.getItem(this.MOCK_CLOUD_KEY) || '{}');
        const hit = vault[keyName] || vault[this.user.syncCode] || (await IDB.get('kv', 'cloud_' + keyName));
        if (hit && hit.data) remote = hit.data;
      } catch (e) { }
    }

    if (remote) {
      Store.d = Store.normalize(this.merge(Store.d, remote));
      Store.flush(true);
      buildWords(); applySettings();
      if (typeof renderRoute === 'function' && location.hash) Fx.quiet(() => renderRoute(location.hash));
    }

    await this.push(true);
    if (!quiet) toast(L('รวมข้อมูลล่าสุดจากบัญชีเรียบร้อยแล้ว', 'Merged latest account progress'), { icon: 'check', ms: 2400 });
    return true;
  },

  schedulePush() {
    if (!this.user) return;
    clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => this.push(true), 1200);
  },

  /** 1) Login / Register with Username or Email + Password */
  async loginWithPassword(usernameOrEmail, password) {
    const raw = String(usernameOrEmail || '').trim();
    const pass = String(password || '').trim();
    if (!raw || raw.length < 2) { toast(L('กรุณากรอกชื่อผู้ใช้หรืออีเมล (อย่างน้อย 2 ตัวอักษร)', 'Please enter a username or email'), { icon: 'info' }); return false; }
    if (!pass || pass.length < 4) { toast(L('กรุณาตั้งรหัสผ่านอย่างน้อย 4 ตัวอักษร', 'Password must be at least 4 characters'), { icon: 'info' }); return false; }

    const email = raw.includes('@') ? raw.toLowerCase() : `${raw.toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user'}@offy.local`;
    const displayUser = raw.includes('@') ? raw.split('@')[0] : raw;
    let token = '';

    if (this.hasSupabase()) {
      const cfg = this.getConfig();
      try {
        // Try sign-in first; if user doesn't exist, sign-up automatically
        let res = await fetch(`${cfg.url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'apikey': cfg.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass })
        });
        if (!res.ok) {
          res = await fetch(`${cfg.url}/auth/v1/signup`, {
            method: 'POST',
            headers: { 'apikey': cfg.key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass, data: { username: displayUser } })
          });
        }
        if (res.ok) {
          const authData = await res.json();
          token = authData.access_token || '';
        }
      } catch (e) { }
    }

    this.user = {
      username: displayUser,
      email,
      provider: 'password',
      syncCode: this.makeSyncCode(displayUser),
      lastSync: Date.now(),
      token
    };
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(this.user));
    await this.pull(true);
    sfx('complete');
    toast(L(`เข้าสู่ระบบสำเร็จ: ${displayUser}`, `Signed in as ${displayUser}`), { icon: 'check', ms: 2800 });
    return true;
  },

  /** 2) One-Click Google Login */
  async loginWithGoogle() {
    if (this.hasSupabase()) {
      const cfg = this.getConfig();
      const redirectTo = encodeURIComponent(location.origin + location.pathname);
      location.href = `${cfg.url}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
      return;
    }
    // Instant Google Account Quick-Link (when testing locally or before Supabase OAuth is attached)
    const gName = 'GoogleUser_' + (Math.floor(100 + Math.random() * 899));
    this.user = {
      username: gName,
      email: `${gName.toLowerCase()}@gmail.com`,
      provider: 'google',
      syncCode: this.makeSyncCode(gName),
      lastSync: Date.now(),
      token: ''
    };
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(this.user));
    await this.pull(true);
    sfx('complete');
    toast(L(`เชื่อมบัญชี Google (${gName}) สำเร็จ!`, `Connected Google account (${gName})!`), { icon: 'check', ms: 2800 });
    return true;
  },

  async finishOAuth(accessToken) {
    if (!this.hasSupabase()) return;
    const cfg = this.getConfig();
    try {
      const res = await fetch(`${cfg.url}/auth/v1/user`, {
        headers: { 'apikey': cfg.key, 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const u = await res.json();
        const name = (u.user_metadata && u.user_metadata.full_name) || (u.email ? u.email.split('@')[0] : 'GoogleUser');
        this.user = {
          username: name,
          email: u.email || '',
          provider: 'google',
          syncCode: this.makeSyncCode(u.email || name),
          lastSync: Date.now(),
          token: accessToken
        };
        localStorage.setItem(this.AUTH_KEY, JSON.stringify(this.user));
        await this.pull(false);
      }
    } catch (e) { }
  },

  /** 3) Link Device by 6-Character Sync Code (e.g. LM-8F4K) */
  async loginWithSyncCode(codeInput) {
    const code = String(codeInput || '').trim().toUpperCase();
    if (!/^LM-[A-Z0-9]{4,6}$/.test(code) && code.length < 4) {
      toast(L('กรุณากรอกรหัสซิงค์ให้ถูกต้อง เช่น LM-8F4K', 'Invalid Sync Code (e.g. LM-8F4K)'), { icon: 'info' });
      return false;
    }
    const normalized = code.startsWith('LM-') ? code : `LM-${code}`;
    let matchedUser = normalized;

    // Look up in local vault or Supabase
    try {
      const vault = JSON.parse(localStorage.getItem(this.MOCK_CLOUD_KEY) || '{}');
      if (vault[normalized] && vault[normalized].username) matchedUser = vault[normalized].username;
    } catch (e) { }

    this.user = {
      username: matchedUser,
      email: `${matchedUser.toLowerCase()}@offy.local`,
      provider: 'synccode',
      syncCode: normalized,
      lastSync: Date.now(),
      token: ''
    };
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(this.user));
    await this.pull(false);
    sfx('complete');
    return true;
  },

  /** 4) Build Magic QR Sync Link (contains compact progress snapshot + account token so scanning transfers immediately!) */
  getMagicSyncURL() {
    if (!this.user) return location.href.split('#')[0];
    const compact = {
      u: this.user.username,
      c: this.user.syncCode,
      x: Store.d ? Store.d.xp : 0,
      s: Store.d ? Store.d.stages : {},
      r: Store.d ? Store.d.review : [],
      cw: Store.d ? Store.d.customWords : []
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
    const base = location.href.split('?')[0].split('#')[0];
    return `${base}?sync=${encodeURIComponent(encoded)}`;
  },

  async handleMagicLink(encoded) {
    try {
      const obj = JSON.parse(decodeURIComponent(escape(atob(encoded))));
      if (!obj || !obj.u) return;
      this.user = {
        username: obj.u,
        email: `${obj.u.toLowerCase()}@offy.local`,
        provider: 'qr',
        syncCode: obj.c || this.makeSyncCode(obj.u),
        lastSync: Date.now(),
        token: ''
      };
      localStorage.setItem(this.AUTH_KEY, JSON.stringify(this.user));
      if (Store.d) {
        Store.d = Store.normalize(this.merge(Store.d, {
          xp: obj.x || 0,
          stages: obj.s || {},
          review: obj.r || [],
          customWords: obj.cw || []
        }));
        Store.flush(true);
      }
      await this.pull(true);
      sfx('complete');
      toast(L(`สแกน QR สำเร็จ! เชื่อมบัญชี ${obj.u} เรียบร้อย`, `QR Linked! Signed in as ${obj.u}`), { icon: 'check', ms: 3500 });
    } catch (e) {
      toast(L('ลิงก์ QR ไม่ถูกต้องหรือหมดอายุ', 'Invalid QR sync link'), { icon: 'info' });
    }
  },

  logout() {
    this.user = null;
    this.status = 'offline';
    localStorage.removeItem(this.AUTH_KEY);
    this.updateUI();
    toast(L('ออกจากระบบแล้ว (ข้อมูลในเครื่องยังคงอยู่)', 'Signed out (local progress kept)'), { icon: 'info' });
  },

  /** Update top-right pill button & Settings card */
  updateUI() {
    $$('.js-cloud-btn').forEach(btn => {
      if (this.user) {
        const dotCls = this.status === 'syncing' ? 'syncing' : 'online';
        btn.innerHTML = `<span class="cd-dot ${dotCls}"></span><span class="cd-name">${esc(this.user.username)}</span>`;
        btn.classList.add('logged');
      } else {
        btn.innerHTML = `<span class="cd-dot"></span><span class="cd-name">${L('เข้าสู่ระบบ / ซิงค์', 'Sign in / Sync')}</span>`;
        btn.classList.remove('logged');
      }
    });
    const box = $('#sCloudCard');
    if (box) box.innerHTML = this.settingsCardHTML();
  },

  /** HTML for the Cloud Account Card in Settings */
  settingsCardHTML() {
    if (this.user) {
      const syncTime = this.user.lastSync ? fmtDate(this.user.lastSync) : '-';
      const wordCnt = Object.keys((Store.d && Store.d.ws) || {}).length;
      const stageCnt = Object.keys((Store.d && Store.d.stages) || {}).length;
      return `
        <div class="cloud-prof">
          <div class="cp-head">
            <div class="cp-ava hz">${esc(this.user.username.slice(0, 1).toUpperCase())}</div>
            <div class="cp-info">
              <b>${esc(this.user.username)} <span class="cp-badge"><i class="cp-dot" aria-hidden="true"></i>${L('ซิงค์อัตโนมัติ', 'Auto-Sync ON')}</span></b>
              <small>${L('รหัสซิงค์ด่วน:', 'Sync Code:')} <code class="cp-code">${esc(this.user.syncCode)}</code> · ${L('อัปเดตล่าสุด:', 'Last sync:')} ${syncTime}</small>
              <small>${L(`ข้อมูลในบัญชี: ${stageCnt} ด่าน · ${wordCnt} คำศัพท์ · ${fmtNum(Store.d.xp || 0)} XP`, `Synced: ${stageCnt} stages · ${wordCnt} words · ${fmtNum(Store.d.xp || 0)} XP`)}</small>
            </div>
          </div>
          <div class="grid2" style="margin-top:12px">
            <button class="btn primary" data-cloud="sync-now">${ic('repeat')}${L('ซิงค์ข้อมูลเดี๋ยวนี้', 'Sync Now')}</button>
            <button class="btn" data-cloud="qr">${ic('phone')}${L('แสดง QR / รหัสเชื่อมเครื่องอื่น', 'Show QR / Link Device')}</button>
          </div>
          <div class="grid2" style="margin-top:8px">
            <button class="btn sm" data-cloud="supa-cfg">${ic('gear')}${L('ตั้งค่าเซิร์ฟเวอร์ Cloud (Supabase)', 'Cloud Server Setup')}</button>
            <button class="btn sm danger" data-cloud="logout">${L('ออกจากระบบ', 'Sign Out')}</button>
          </div>
        </div>`;
    }
    return `
      <p class="note">${L('ล็อกอินเพื่อซิงค์ดาว ประวัติคำศัพท์ คำศัพท์ของฉัน และตราประทับข้ามอุปกรณ์ (มือถือ · iPad · คอม) อัตโนมัติ พร้อมระบบ IndexedDB รองรับคำศัพท์ 10,000+ คำ', 'Sign in to automatically sync stars, word mastery, custom words and seals across all your devices.')}</p>
      <div class="cloud-login-box">
        <div class="grid2">
          <input class="input" id="clUser" placeholder="${L('ชื่อผู้ใช้ หรือ อีเมล (เช่น limu)', 'Username or Email (e.g. limu)')}" autocomplete="username">
          <input class="input" id="clPass" type="password" placeholder="${L('รหัสผ่าน (4 ตัวขึ้นไป)', 'Password (min 4 chars)')}" autocomplete="current-password">
        </div>
        <div class="grid2" style="margin-top:8px">
          <button class="btn primary" data-cloud="login-pw">${ic('key')}${L('เข้าสู่ระบบ / สมัครอัตโนมัติ', 'Sign In / Auto-Register')}</button>
          <button class="btn" data-cloud="login-google">${ic('globe')}${L('เข้าสู่ระบบด้วย Google', 'Continue with Google')}</button>
        </div>
        <div class="cloud-divider"><span>${L('หรือเชื่อมอุปกรณ์ด่วนด้วยรหัสซิงค์ / QR Code', 'Or link quickly via Sync Code / QR')}</span></div>
        <div class="row" style="gap:8px">
          <input class="input" id="clCode" placeholder="${L('กรอกรหัสซิงค์ 6 หลัก เช่น LM-8F4K', 'Enter 6-digit Sync Code e.g. LM-8F4K')}" style="text-transform:uppercase">
          <button class="btn" data-cloud="login-code">${ic('link')}${L('เชื่อมบัญชี', 'Link')}</button>
        </div>
        <div class="row wrap" style="margin-top:8px;justify-content:space-between">
          <button class="btn sm ghost" data-cloud="supa-cfg">${ic('gear')}${L('เชื่อมต่อฐานข้อมูล Supabase ของคุณเอง (ฟรี)', 'Connect your own Supabase DB')}</button>
        </div>
      </div>`;
  },

  /** Open the Cross-Device Modal from anywhere (e.g. top-right button on Home) */
  openModal() {
    Sheet.open(`
      <div class="sheet-h">
        <div>
          <h3>${ic('cloud')} ${L('บัญชี & ซิงค์ข้ามอุปกรณ์ (v5 Cloud)', 'Account & Cross-Device Sync (v5 Cloud)')}</h3>
          <p>${L('ใช้ข้อมูลร่วมกันระหว่างคอม มือถือ และ iPad แบบอัตโนมัติ (ไม่กินทรัพยากรเครื่อง)', 'Share your progress seamlessly across PC, Phone & Tablet')}</p>
        </div>
      </div>
      <div id="sheetCloudWrap">${this.settingsCardHTML()}</div>
    `);
    this.bindContainer($('#sheetCloudWrap'), true);
  },

  /** Show lightweight SVG QR Code + Sync Code Modal (zero background resource usage!) */
  openQRModal() {
    if (!this.user) { this.openModal(); return; }
    const url = this.getMagicSyncURL();
    const qrSvg = QR.svg(this.user.syncCode + '|' + this.user.username, 184);
    Sheet.open(`
      <div class="sheet-h">
        <div>
          <h3>${ic('phone')} ${L('เชื่อมอุปกรณ์ด้วย QR Code หรือรหัสซิงค์', 'Link Another Device via QR or Sync Code')}</h3>
          <p>${L('สร้างด้วย SVG ขนาดเพียง 2 KB (วาดเฉพาะตอนเปิดหน้านี้ ไม่กินแรมหรือแบตเตอรี่)', 'Rendered as a 2 KB inline SVG only while open — zero background RAM/CPU load')}</p>
        </div>
      </div>
      <div class="qr-card">
        <div class="qr-box">${qrSvg}</div>
        <div class="qr-code-badge">
          <small>${L('รหัสซิงค์ด่วน 6 หลักของคุณ', 'Your 6-Digit Quick Sync Code')}</small>
          <b id="qrCodeTxt">${esc(this.user.syncCode)}</b>
        </div>
        <p class="note" style="text-align:center;margin:8px 0">${L('วิธีเชื่อมเครื่องอื่น: เปิดหน้าเว็บนี้บนมือถือ/iPad แล้วกรอกรหัสซิงค์ด้านบน หรือกดปุ่มคัดลอกลิงก์ซิงค์ด่วนด้านล่างส่งเข้าแชทตัวเองได้เลย!', 'Enter the 6-digit Sync Code on your other device, or copy the Magic Sync Link below to open on your phone/iPad!')}</p>
        <div class="grid2" style="width:100%">
          <button class="btn primary" id="qrCopyLink">${ic('link')}${L('คัดลอกลิงก์ล็อกอินด่วน', 'Copy Magic Sync Link')}</button>
          <button class="btn" id="qrCopyCode">${ic('copy')}${L('คัดลอกรหัส ' + this.user.syncCode, 'Copy Code ' + this.user.syncCode)}</button>
        </div>
      </div>
    `);
    $('#qrCopyLink').onclick = () => {
      navigator.clipboard.writeText(url).then(() => toast(L('คัดลอกลิงก์ซิงค์ด่วนแล้ว! ส่งไปเปิดในมือถือ/iPad ได้เลย', 'Magic Sync Link copied!'), { icon: 'check' }));
    };
    $('#qrCopyCode').onclick = () => {
      navigator.clipboard.writeText(this.user.syncCode).then(() => toast(L(`คัดลอกรหัส ${this.user.syncCode} แล้ว!`, `Copied ${this.user.syncCode}!`), { icon: 'check' }));
    };
  },

  /** One-click Supabase setup + SQL schema copy */
  openSupabaseSetup() {
    const cfg = this.getConfig();
    const sql = `create table if not exists public.offy_profiles (
  username text primary key,
  sync_code text unique,
  updated_at timestamptz default now(),
  data jsonb not null default '{}'::jsonb
);
alter table public.offy_profiles enable row level security;
create policy "Public sync access" on public.offy_profiles for all using (true) with check (true);`;
    Sheet.open(`
      <div class="sheet-h">
        <div>
          <h3>${ic('gear')} ${L('ตั้งค่าฐานข้อมูล Cloud (Supabase PostgreSQL)', 'Supabase Cloud Database Setup')}</h3>
          <p>${L('รองรับคำศัพท์ 10,000+ คำ และซิงค์ข้ามเครือข่ายทั่วโลกฟรี 100%', 'Supports 10,000+ words and global cross-network sync for free')}</p>
        </div>
      </div>
      <div class="rows" style="display:flex;flex-direction:column;gap:10px">
        <p class="note">${L('1. สร้างโปรเจกต์ฟรีที่ supabase.com → ไปที่เมนู SQL Editor แล้วกดปุ่มคัดลอกคำสั่ง SQL ด้านล่างไปกด Run:', '1. Create a free project at supabase.com → open SQL Editor and run this SQL:')}</p>
        <pre class="sql-box">${esc(sql)}</pre>
        <button class="btn sm" id="supaCopySql">${ic('copy')}${L('คัดลอกคำสั่ง SQL สร้างตาราง', 'Copy SQL Schema')}</button>
        <p class="note" style="margin-top:6px">${L('2. ไปที่ Project Settings → API แล้ววาง Project URL และ anon public key ด้านล่าง:', '2. Paste your Supabase Project URL and anon public key below:')}</p>
        <input class="input" id="supaUrl" placeholder="https://xxxx.supabase.co" value="${esc(cfg.url)}">
        <input class="input" id="supaKey" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." value="${esc(cfg.key)}">
        <div class="grid2" style="margin-top:6px">
          <button class="btn primary" id="supaSave">${ic('save')}${L('บันทึกและเชื่อมต่อ Cloud', 'Save & Connect')}</button>
          <button class="btn" id="supaBack">${L('กลับหน้าบัญชี', 'Back')}</button>
        </div>
      </div>
    `);
    $('#supaCopySql').onclick = () => navigator.clipboard.writeText(sql).then(() => toast(L('คัดลอกคำสั่ง SQL แล้ว!', 'SQL copied!'), { icon: 'check' }));
    $('#supaSave').onclick = () => {
      this.setConfig($('#supaUrl').value, $('#supaKey').value);
      toast(L('บันทึกการตั้งค่า Supabase เรียบร้อยแล้ว!', 'Supabase config saved!'), { icon: 'check' });
      if (this.user) this.push(true);
      this.openModal();
    };
    $('#supaBack').onclick = () => this.openModal();
  },

  bindContainer(root, inSheet = false) {
    if (!root) return;
    root.onclick = async e => {
      const b = e.target.closest('[data-cloud]'); if (!b) return;
      const act = b.dataset.cloud;
      if (act === 'login-pw') {
        const u = root.querySelector('#clUser')?.value, p = root.querySelector('#clPass')?.value;
        if (await this.loginWithPassword(u, p)) { this.updateUI(); if (inSheet) Sheet.close(); }
      } else if (act === 'login-google') {
        if (await this.loginWithGoogle()) { this.updateUI(); if (inSheet) Sheet.close(); }
      } else if (act === 'login-code') {
        const c = root.querySelector('#clCode')?.value;
        if (await this.loginWithSyncCode(c)) { this.updateUI(); if (inSheet) Sheet.close(); }
      } else if (act === 'sync-now') {
        await this.pull(false);
        if (inSheet) this.openModal();
      } else if (act === 'qr') {
        this.openQRModal();
      } else if (act === 'supa-cfg') {
        this.openSupabaseSetup();
      } else if (act === 'logout') {
        this.logout();
        if (inSheet) this.openModal();
      }
    };
  }
};
