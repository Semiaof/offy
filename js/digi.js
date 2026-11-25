'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — 汉字进化图鉴 · Hanzi Evolution Star Map
   2-Level Star Map & True Etymological Genealogy Engine:
     Level 1 · Sky Map (ท้องฟ้ากลุ่มดาวรากศัพท์):
       All active Kangxi radicals clustered into 5 semantic nebulae
       (Nature · People & Body · Home & Life · Animals · Motion & Forms).
       Tap any star or search any character to enter its real genealogy.
     Level 2 · Constellation Focus (สายเลือดวิวัฒนาการจริง):
       ZERO fake sibling lines. Every link A → B is a real structural/etymological
       parent → child relationship with transitive reduction (e.g. 木 → 林 → 森,
       木 → 相 → 想/箱, 又 → 双 → 叒 → 叕, 土 → 圭 → 垚/街/鞋):
         STACK     Reduplication / stacked evolution spine (木→林→森, 又→双→叒→叕)
         BRANCH    Multi-generation parent → child → grandchild chains (木→相→想/箱)
         ARMOR     Sound component (声旁)
         CHAMPION  Meaning component (形旁)
         ULTIMATE  Ideogrammatic compound (会意)
         VARIANT   Other structural link (指事 / radical)
         PART      Parent components of the focused character
       Includes curated BONUS_STACK non-HSK stacked characters (dashed grey border)
       so famous reduplication chains are complete.
   ===================================================================== */
const OffyDigi = (() => {
  const SRC = 'data/tree.js?v=6';

  /* Curated non-HSK stacked/reduplicated Hanzi to complete iconic evolution spines */
  const BONUS = {
    '叒': { py: 'ruò',  th: 'คล้อยตาม/เชื่อฟัง', en: 'obedient; agree',         vi: 'thuận theo',       ja: '従う',           parent: '双', parts: ['又', '双'],       strokes: 6,  rep: 3 },
    '叕': { py: 'zhuó', th: 'เชื่อมต่อกัน',       en: 'connected; linked',       vi: 'nối liền',         ja: '連なる',         parent: '叒', parts: ['双', '双'],       strokes: 8,  rep: 4 },
    '沝': { py: 'zhuǐ', th: 'น้ำสองสาย',         en: 'two rivers',              vi: 'hai dòng nước',    ja: '二つの川',       parent: '水', parts: ['水', '水'],       strokes: 8,  rep: 2 },
    '淼': { py: 'miǎo', th: 'น้ำกว้างใหญ่ไพศาล', en: 'vast expanse of water',   vi: 'mênh mông',        ja: '広大な水',       parent: '沝', parts: ['水', '沝'],       strokes: 12, rep: 3 },
    '焱': { py: 'yàn',  th: 'เปลวไฟโชติช่วง',    en: 'blazing flames; sparks',  vi: 'tia lửa rực cháy', ja: '燃え上がる炎',   parent: '炎', parts: ['火', '炎'],       strokes: 12, rep: 3 },
    '圭': { py: 'guī',  th: 'แผ่นหยก/ดินซ้อน',   en: 'jade tablet',             vi: 'ngọc khuê',        ja: '玉の礼器',       parent: '土', parts: ['土', '土'],       strokes: 6,  rep: 2 },
    '垚': { py: 'yáo',  th: 'เนินดินสูงตระหง่าน',en: 'high earthen mound',      vi: 'gò đất cao',       ja: '高い土山',       parent: '圭', parts: ['土', '圭'],       strokes: 9,  rep: 3 },
    '鑫': { py: 'xīn',  th: 'มั่งคั่งรุ่งเรือง',  en: 'prosperous; wealthy',     vi: 'hưng thịnh',       ja: '繁栄・豊か',     parent: '金', parts: ['金', '金', '金'], strokes: 24, rep: 3 },
    '吅': { py: 'xuān', th: 'เสียงดัง/ตะโกน',    en: 'clamor; shout',           vi: 'hò hét',           ja: '大声で叫ぶ',     parent: '口', parts: ['口', '口'],       strokes: 6,  rep: 2 },
    '㗊': { py: 'jí',   th: 'เสียงอึกทึกจอแจ',   en: 'loud hubbub',             vi: 'ồn ào náo nhiệt',  ja: '騒がしい',       parent: '品', parts: ['吅', '吅'],       strokes: 12, rep: 4 },
    '昍': { py: 'xuān', th: 'สว่างไสว',          en: 'bright; luminous',        vi: 'sáng rực',         ja: '明るい',         parent: '日', parts: ['日', '日'],       strokes: 8,  rep: 2 },
    '砳': { py: 'lè',   th: 'เสียงหินกระทบกัน',  en: 'clatter of stones',       vi: 'tiếng đá va nhau', ja: '石のぶつかる音', parent: '石', parts: ['石', '石'],       strokes: 10, rep: 2 },
    '奻': { py: 'nuán', th: 'ทะเลาะถกเถียง',     en: 'quarrel; dispute',        vi: 'cãi vã',           ja: '口論する',       parent: '女', parts: ['女', '女'],       strokes: 6,  rep: 2 },
    '姦': { py: 'jiān', th: 'ทุจริต/เจ้าเล่ห์',   en: 'treacherous; wicked',     vi: 'gian tà',          ja: 'よこしま',       parent: '奻', parts: ['女', '奻'],       strokes: 9,  rep: 3 },
    '犇': { py: 'bēn',  th: 'วัววิ่งกรู/ทะยาน',  en: 'stampede; rush',          vi: 'chạy ùa đi',       ja: '牛が走る・奔走', parent: '牛', parts: ['牛', '牛', '牛'], strokes: 12, rep: 3 },
    '羴': { py: 'shān', th: 'ฝูงแกะ/กลิ่นแพะ',   en: 'herd of sheep; rank',     vi: 'đàn dê; mùi gây',  ja: '羊の群れ',       parent: '羊', parts: ['羊', '羊', '羊'], strokes: 18, rep: 3 },
    '骉': { py: 'biāo', th: 'ม้าหลายตัวห้อตะบึง',en: 'galloping horses',        vi: 'đàn ngựa phi',     ja: '馬が駆ける',     parent: '马', parts: ['马', '马', '马'], strokes: 9,  rep: 3, trad: '驫' },
    '猋': { py: 'biāo', th: 'สุนัขวิ่งกรู/ลมหมุน',en: 'dogs running; whirlwind', vi: 'chó chạy; gió lốc',ja: 'つむじ風',       parent: '犬', parts: ['犬', '犬', '犬'], strokes: 12, rep: 3 },
    '鱻': { py: 'xiān', th: 'ปลาสดใหม่',         en: 'fresh fish (archaic 鲜)', vi: 'cá tươi',          ja: '新鮮な魚',       parent: '鱼', parts: ['鱼', '鱼', '鱼'], strokes: 24, rep: 3 },
    '皛': { py: 'xiǎo', th: 'ขาวสว่างจ้า',       en: 'bright white',            vi: 'trắng sáng',       ja: '白く輝く',       parent: '白', parts: ['白', '白', '白'], strokes: 15, rep: 3 },
    '惢': { py: 'suǒ',  th: 'ลังเล/ขี้ระแวง',    en: 'hesitant; suspicious',    vi: 'do dự; đa nghi',   ja: '疑い深い',       parent: '心', parts: ['心', '心', '心'], strokes: 12, rep: 3 },
    '掱': { py: 'pá',   th: 'มือไว/ล้วงกระเป๋า', en: 'pickpocket',              vi: 'móc túi',          ja: 'スリ',           parent: '手', parts: ['手', '手', '手'], strokes: 12, rep: 3 },
    '畾': { py: 'léi',  th: 'ทุ่งนาเรียงราย',    en: 'connected fields',        vi: 'ruộng đồng nối',   ja: '連なる田畑',     parent: '田', parts: ['田', '田', '田'], strokes: 15, rep: 3 },
    '毳': { py: 'cuì',  th: 'ขนสัตว์อ่อนนุ่ม',   en: 'fine down; soft fur',     vi: 'lông tơ mịn',      ja: '柔らかなうぶ毛', parent: '毛', parts: ['毛', '毛', '毛'], strokes: 12, rep: 3 }
  };

  /* Stack multiplicity hints (×2 / ×3 / ×4) for HSK stacked characters */
  const HSK_REP = {
    '林': 2, '森': 3, '从': 2, '众': 3, '双': 2, '炎': 2, '昌': 2, '晶': 3,
    '品': 3, '磊': 3, '多': 2, '朋': 2, '哥': 2, '羽': 2, '二': 2, '竹': 2,
    '赫': 2, '矗': 3, '棘': 2, '辨': 2, '兢': 2, '轰': 3
  };

  /* Featured reduplication chains for Sky Map previews & quick shortcuts */
  const STACK_PREVIEWS = {
    '木': '林→森', '人': '从→众', '又': '双→叒→叕', '水': '沝→淼', '火': '炎→焱',
    '土': '圭→垚', '口': '吅→品→㗊', '日': '昍→晶', '石': '砳→磊', '金': '鑫',
    '女': '奻→姦', '牛': '犇', '羊': '羴', '马': '骉', '犬': '猋', '鱼': '鱻',
    '车': '轰', '白': '皛', '心': '惢', '手': '掱', '田': '畾', '毛': '毳', '月@74': '朋', '夕': '多'
  };
  const QUICK_CHAINS = [
    ['木', '木 → 林 → 森'],
    ['人', '人 → 从 → 众'],
    ['又', '又 → 双 → 叒 → 叕'],
    ['水', '水 → 沝 → 淼'],
    ['火', '火 → 炎 → 焱'],
    ['土', '土 → 圭 → 垚'],
    ['口', '口 → 吅 → 品 → 㗊'],
    ['日', '日 → 昍 → 晶'],
    ['石', '石 → 砳 → 磊'],
    ['金', '金 → 鑫']
  ];

  /* Preferred simplified radical display glyphs (when !trad()) */
  const RAD_SIMP = {
    '艸': '艹', '辵': '辶', '攴': '攵', '糸': '纟', '貝': '贝', '車': '车',
    '馬': '马', '門': '门', '鳥': '鸟', '魚': '鱼', '龍': '龙', '頁': '页',
    '見': '见', '戶': '户', '靑': '青'
  };

  /* 5 Semantic Sky Nebulae (grouped by Kangxi radical number) */
  const ZONES = [
    { id: 'nature', icon: '🌿', th: 'ธรรมชาติ',        en: 'Nature',
      rads: [75, 85, 86, 32, 72, 74, 46, 112, 167, 96, 140, 115, 118, 119, 102, 173, 15, 36, 116, 27, 174, 84, 182, 150, 97, 151, 199, 200, 161, 170, 163, 47, 99, 100, 139, 180, 186, 201, 203, 155] },
    { id: 'human',  icon: '🧍', th: 'คน & ร่างกาย',    en: 'People & Body',
      rads: [9, 61, 64, 30, 149, 38, 109, 157, 29, 37, 181, 44, 104, 41, 76, 39, 117, 128, 19, 49, 10, 135, 147, 107, 82, 87, 125, 88, 33, 158, 130, 132, 176, 185, 188, 143, 209, 211, 131, 78, 80, 83, 92, 190, 194] },
    { id: 'life',   icon: '🏠', th: 'สิ่งของ & ชีวิต', en: 'Home & Life',
      rads: [40, 169, 63, 53, 159, 137, 18, 120, 154, 145, 184, 50, 108, 164, 57, 69, 62, 111, 122, 48, 70, 113, 16, 31, 166, 21, 22, 98, 121, 206, 207, 68, 56, 110, 178, 177, 165, 127, 134, 146, 210] },
    { id: 'animal', icon: '🐾', th: 'สัตว์',            en: 'Animals',
      rads: [187, 94, 93, 123, 196, 172, 195, 142, 212, 124, 141, 198, 208, 213, 148, 152, 153, 183, 205] },
    { id: 'form',   icon: '✨', th: 'กิริยา & รูปทรง', en: 'Motion & Forms',
      rads: [162, 60, 156, 77, 66, 79, 1, 7, 24, 12, 42, 106, 67, 25, 51, 138, 160, 175, 81, 8, 14, 20, 28, 26, 59, 55] }
  ];
  const ZONE_OF_NO = new Map();
  ZONES.forEach(z => z.rads.forEach(no => ZONE_OF_NO.set(no, z.id)));
  const zoneOfNo = no => ZONE_OF_NO.get(no) || 'form';

  const STAGES = {
    ROOKIE:   { th: 'อักษรตั้งต้น',          sh: 'ตั้งต้น',   zh: '基', d: 'จุดเริ่มต้นของตระกูลอักษรนี้' },
    STACK:    { th: 'ซ้ำร่างวิวัฒนาการ',     sh: 'ซ้ำร่าง',   zh: '叠', d: 'ซ้อนอักษรตัวเดิม 2–4 ตัวเพื่อขยายความหมาย (เช่น 木→林→森 · 又→双→叒→叕)' },
    ARMOR:    { th: 'ใช้เป็นส่วนบอกเสียง',   sh: 'เสียง',     zh: '声', d: 'ตัวตั้งต้นเป็นส่วนบอกเสียง (声旁) ประกอบกับส่วนบอกความหมาย' },
    CHAMPION: { th: 'ใช้เป็นส่วนบอกความหมาย', sh: 'ความหมาย', zh: '形', d: 'ตัวตั้งต้นเป็นส่วนบอกความหมาย (形旁) อีกส่วนบอกเสียง' },
    ULTIMATE: { th: 'อักษรผสมความหมาย',      sh: 'ผสม',      zh: '会', d: 'รวมความหมายของส่วนประกอบ (会意) เข้าด้วยกัน' },
    VARIANT:  { th: 'ความสัมพันธ์อื่น',       sh: 'อื่น ๆ',    zh: '其', d: 'อักษรชี้บอก (指事) หรือมีตัวตั้งต้นเป็นหมวดนำ' },
    PART:     { th: 'ส่วนประกอบ',            sh: 'ประกอบ',   zh: '件', d: 'ส่วนที่ประกอบขึ้นเป็นตัวนี้' }
  };
  const ORDER = ['STACK', 'ARMOR', 'CHAMPION', 'ULTIMATE', 'VARIANT', 'PART'];
  const COLW = 210, ROWH = 114, NODE = 92, PAD = 40;

  const st = {
    mode: 'sky',        // 'sky' = Level 1 Radical Star Map | 'focus' = Level 2 True Evolution Constellation
    skyZone: 'all',     // 'all' or zone id
    skyAll: false,      // false = major ~82 stars | true = all active ~193 stars
    trail: ['木'],
    sel: null,
    open: {},           // per-focus expansion of single-step satellites
    stageFilter: null,
    tx: 0, ty: 0, k: 1, fitted: false
  };
  let D = null, host = null, rad = null, formsOf = null, radOfGlyph = null, tree = null;
  let cur = new Map(), anim = 0, lay = null, skyLay = null;

  Object.assign(window.OFFY_EN || {}, {
    'สายวิวัฒนาการ': 'Character families', 'สายวิวัฒนาการอักษร': 'Character families',
    'อักษรตั้งต้น': 'Base character', 'ซ้ำร่างวิวัฒนาการ': 'Reduplicated evolution',
    'ใช้เป็นส่วนบอกเสียง': 'As sound part', 'ใช้เป็นส่วนบอกความหมาย': 'As meaning part',
    'อักษรผสมความหมาย': 'Meaning compound', 'ความสัมพันธ์อื่น': 'Other link', 'ส่วนประกอบ': 'Component',
    'จุดเริ่มต้นของตระกูลอักษรนี้': 'Where this family starts',
    'การประกอบอักษร': 'How it is built', 'ดูการประกอบอักษร': 'See how it is built',
    'รูปเขียนตามภูมิภาค': 'Regional forms',
    'ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้': 'No HSK character builds on this one',
    'บอกความหมาย': 'meaning', 'บอกเสียง': 'sound', 'เล่นอีกครั้ง': 'Play again',
    'ทั้งหมด': 'All', 'กลุ่มดาว': 'Star map', 'รอบตัว': 'Constellation', 'กริด': 'Grid', 'ขวา': 'Tree',
    'ท้องฟ้าทั้งหมด': 'All constellations', 'ดูทั้งหมดในโหมดกริด': 'See all in Grid',
    'ส่วนที่เพิ่ม': 'Added part', 'โครงสร้าง': 'Structure', 'คำที่ใช้ตัวนี้': 'Words with it',
    'แตะตัวไหนก็ได้เพื่อย้ายมาไว้ตรงกลาง': 'Tap any star to explore its real lineage',
    'แตะรากศัพท์เพื่อเจาะเข้ากลุ่มดาว · ลากหรือซูมได้': 'Tap any radical star to explore · drag or pinch to zoom',
    'ลากเพื่อเลื่อน · หมุนล้อหรือบีบเพื่อซูม': 'Drag to pan · wheel or pinch to zoom',
    'ไต้หวัน': 'Taiwan', 'ญี่ปุ่น': 'Japanese', 'เพิ่มอีก': 'more', 'หมวดนำ': 'Radical',
    'นอก HSK': 'Outside HSK', 'ดาวบริวารอีก': 'more satellites',
    'ซ่อนดาวบริวาร (เหลือเฉพาะสายหลัก)': 'Show main chains only',
    'แสดงรากทั้งหมด': 'Show all radicals', 'แสดงเฉพาะรากหลัก': 'Major radicals only',
    'ค้นหาอักษรหรือราก เช่น 木, 森, 想, 叒…': 'Search char or radical e.g. 木, 森, 想, 叒…',
    'ท้องฟ้ากลุ่มดาวรากศัพท์': 'Radical Constellation Sky',
    'สายซ้ำร่างเด่น': 'Iconic Reduplication Chains'
  });

  /* ---------- simplified / traditional / helpers ---------- */
  const trad = () => !!S().hzTrad;
  const base = c => String(c || '').split('@')[0];
  const radG = r => {
    if (!r) return '';
    if (trad()) return r[1];
    if (RAD_SIMP[r[1]]) return RAD_SIMP[r[1]];
    if (D.c[r[1]]) return r[1];
    return ((r[8].find(f => f[1] === 'ตัวย่อ') || r[8].find(f => D.c[f[0]]) || [])[0] || r[1]);
  };
  const side = c => {
    const [g, no] = String(c).split('@'); if (!no) return '';
    const r = rad.get(+no); if (!r) return '';
    const hl = typeof HzKit !== 'undefined' ? HzKit.lang() : LANG;
    const rn = ({ th: r[4], en: r[5], vi: r[6], ja: r[7] }[hl]) || r[4] || r[5];
    return `${g === '阝' ? (no === '170' ? T('ซ้าย') + ' ' : T('ขวา') + ' ') : ''}${r[1]} · ${rn}`;
  };
  const show = c => {
    if (BONUS[c]) return trad() && BONUS[c].trad ? BONUS[c].trad : c;
    const x = D.c[c];
    if (x) return trad() && x[8] ? x[8] : c;
    const r = radOfGlyph.get(c);
    return r && base(c) === r[1] ? radG(r) : base(c);
  };
  const viewMode = () => S().digiView || 'radial';
  const radial = () => viewMode() === 'radial';
  const isGrid = () => viewMode() === 'grid';
  const isSky = () => st.mode === 'sky';

  const esc2 = s => esc(s == null ? '' : s);
  const lvOk = l => typeof HzLv === 'undefined' || HzLv.has(l);
  const mLang = () => typeof HzKit !== 'undefined' ? HzKit.lang() : LANG;
  const shortM = s => typeof HzKit !== 'undefined' ? HzKit.short(s, 11) : String(s || '').slice(0, 11);
  const lvC = c => {
    if (BONUS[c]) return '';
    const x = D.c[c] || (c === '月@74' ? D.c['月'] : null);
    return ` style="--lc:var(--hsk${x ? x[1] : 'C'})"`;
  };
  const lvQ = l => `<i class="lvq" style="--c:var(--hsk${l})">${l === 7 ? '7–9' : l}</i>`;
  const meanOf = c => {
    if (BONUS[c]) {
      const b = BONUS[c], L = mLang();
      return { t: b[L] || b.en || b.th, fb: false };
    }
    return typeof HzKit !== 'undefined' ? HzKit.charMean(c, D, radOfGlyph) : { t: '', fb: false };
  };
  const pyOf = c => {
    if (BONUS[c]) return BONUS[c].py;
    if (D.c[c]) return D.c[c][0];
    const r = radOfGlyph.get(c);
    return r ? r[3] : '';
  };
  const partsRaw = c => {
    if (BONUS[c]) return BONUS[c].parts;
    return (D.c[c] && D.c[c][4]) || [];
  };

  /* ---------- True Etymological Relations (HSK + BONUS_STACK + Transitive Reduction) ---------- */
  function isStackedChild(c, p) {
    const fs = formsOf(p);
    if (c === '轰') return fs.has('车') || fs.has('車');
    if (BONUS[c]) return BONUS[c].parent === p || fs.has(BONUS[c].parent);
    const ps = partsRaw(c);
    if (ps.length >= 2 && ps.every(q => fs.has(q))) return true;
    // e.g. 森 = ['木', '林'] when p === '林', 众 = ['人', '从'] when p === '从',
    // 品 = ['口', '吅'] when p === '吅', 晶 = ['日', '昍'] when p === '昍', 磊 = ['石', '砳'] when p === '砳'
    if (HSK_REP[c] && HSK_REP[c] >= 3 && ps.some(q => fs.has(q))) {
      // Ensure p is itself a 2x stacked form of the same base (林, 从, 吅, 昍, 砳)
      if (BONUS[p] || (HSK_REP[p] && HSK_REP[p] === 2)) return true;
    }
    return false;
  }

  function stageOf(c, p) {
    if (!p) return 'ROOKIE';
    if (isStackedChild(c, p)) return 'STACK';
    if (BONUS[c]) return null;
    const x = D.c[c] || [], parts = x[4] || [], six = x[6] || '', forms = formsOf(p), fb = new Set([...forms].map(base));
    if (x[12] && fb.has(x[12])) return 'ARMOR';
    if (x[11] && fb.has(x[11])) return 'CHAMPION';
    if (six.startsWith('会意')) return 'ULTIMATE';
    const r = x[3] && rad.get(x[3]), isRad = !!r && (fb.has(r[1]) || r[8].some(f => fb.has(f[0])));
    if (six === '形声') return isRad ? 'CHAMPION' : null;
    if (six === '指事' || isRad) return 'VARIANT';
    // Allow bonus component parents (like 圭 → 佳/挂/街/鞋, 吅 → 哭/骂/器, 叒 → 桑/叠, 叕 → 缀, 㗊 → 噩)
    if (BONUS[p] && parts.some(q => fsHas(forms, q))) return 'ULTIMATE';
    return null;
  }
  const fsHas = (fs, q) => fs.has(q) || fs.has(base(q));

  const catalyst = (c, p) => {
    const forms = formsOf(p), parts = partsRaw(c);
    const rest = parts.filter(q => !forms.has(q));
    return rest.length ? rest : parts.slice(1);
  };

  /* All real structural children of p (HSK matching lvOk + BONUS_STACK) */
  function rawKidsOf(p, except) {
    const fs = formsOf(p), out = [];
    for (const c of Object.keys(D.c)) {
      if (c === p || except.has(c) || !lvOk(D.c[c][1])) continue;
      const ps = D.c[c][4] || [];
      if (ps.some(q => fs.has(q)) && stageOf(c, p)) out.push(c);
    }
    for (const [bc, info] of Object.entries(BONUS)) {
      if (bc === p || except.has(bc)) continue;
      if (info.parent === p || fs.has(info.parent)) out.push(bc);
    }
    return out;
  }

  /* Transitive Reduction: if child C contains ANOTHER child B of p in its parts (or BONUS parent is B),
     attach C under B (p → B → C) instead of shortcutting directly from p → C!
     Automatically turns 木→森 into 木→林→森, 木→棵 into 木→果→棵, 人→众 into 人→从→众,
     口→品 into 口→吅→品→㗊, 日→晶 into 日→昍→晶, 石→磊 into 石→砳→磊! */
  function directKidsOf(p, except) {
    const raw = rawKidsOf(p, except);
    const rawSet = new Set(raw);
    const direct = raw.filter(c => {
      if (BONUS[c] && rawSet.has(BONUS[c].parent)) return false;
      const ps = partsRaw(c);
      for (const q of ps) {
        if (q !== c && rawSet.has(q)) return false;
      }
      return true;
    });
    return direct.sort((a, b) => {
      const sa = stageOf(a, p), sb = stageOf(b, p);
      if (sa === 'STACK' && sb !== 'STACK') return -1;
      if (sb === 'STACK' && sa !== 'STACK') return 1;
      const la = BONUS[a] ? 9 : (D.c[a] ? D.c[a][1] : 9);
      const lb = BONUS[b] ? 9 : (D.c[b] ? D.c[b][1] : 9);
      return la - lb || ORDER.indexOf(sa) - ORDER.indexOf(sb);
    });
  }

  const partsOf = f => {
    if (BONUS[f]) return [...new Set(BONUS[f].parts)].filter(q => q !== f);
    if ((D.c[f] || [])[6] === '象形') return [];
    return [...new Set((D.c[f] || [])[4] || [])].filter(q => !formsOf(f).has(q) && (D.c[q] || D.cc[q] || radOfGlyph.get(q) || BONUS[q]));
  };

  function stageForFocus(f) {
    const prev = st.trail[st.trail.length - 2];
    return prev && stageOf(f, prev) ? stageOf(f, prev) : 'ROOKIE';
  }

  /* ---------- Fast deterministic hash & AABB zero-overlap solver ---------- */
  const viewAspect = () => { const v = host && host.querySelector('.dg-view'); return v && v.clientWidth && v.clientHeight ? v.clientWidth / v.clientHeight : 1; };
  const hash01 = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };

  function relaxOverlap(nodes, pinFirst, minW = 104, minH = 114, minW0 = 126, minH0 = 132, passes = 24) {
    for (let pass = 0; pass < passes; pass++) {
      let moved = false;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const isPin = pinFirst && i === 0;
          const rw = isPin ? minW0 : minW, rh = isPin ? minH0 : minH;
          const dx = b.x - a.x, dy = b.y - a.y;
          const ox = rw - Math.abs(dx), oy = rh - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            moved = true;
            const sgnX = dx >= 0 ? 1 : -1, sgnY = dy >= 0 ? 1 : -1;
            if (ox < oy) {
              const push = ox * 0.52 + 0.6;
              if (isPin) b.x += sgnX * push * 2;
              else { a.x -= sgnX * push; b.x += sgnX * push; }
            } else {
              const push = oy * 0.52 + 0.6;
              if (isPin) b.y += sgnY * push * 2;
              else { a.y -= sgnY * push; b.y += sgnY * push; }
            }
          }
        }
      }
      if (!moved) break;
    }
  }

  /* =====================================================================
     LEVEL 1 · SKY MAP LAYOUT (5 Semantic Radical Constellations)
     ===================================================================== */
  let skyCache = null;
  function buildSkyCatalog() {
    if (skyCache) return skyCache;
    const AMB = D.amb || {};
    const items = [];
    for (const r of D.r) {
      const no = r[0], orig = r[1];
      const key = AMB[orig] ? `${orig}@${no}` : (D.c[orig] ? orig : (RAD_SIMP[orig] && D.c[RAD_SIMP[orig]] ? RAD_SIMP[orig] : orig));
      const fs = formsOf(key);
      let cnt = 0;
      for (const c of Object.keys(D.c)) {
        if (c === key) continue;
        if ((D.c[c][4] || []).some(q => fs.has(q))) cnt++;
      }
      const hasBonus = !!STACK_PREVIEWS[key] || !!STACK_PREVIEWS[orig];
      if (cnt === 0 && !hasBonus) continue;
      // Curated ~52 iconic core radicals on default Sky Map for large, readable stars (+ button reveals all 197)
      const major = cnt >= 27 || hasBonus || [74, 93, 195, 196, 174, 82, 173, 212, 169, 145, 184, 15, 36, 142, 159].includes(no);
      items.push({
        no, key, r, cnt, major,
        zone: zoneOfNo(no),
        preview: STACK_PREVIEWS[key] || STACK_PREVIEWS[orig] || ''
      });
    }
    items.sort((a, b) => b.cnt - a.cnt || a.no - b.no);
    skyCache = items;
    return items;
  }

  function layoutSky() {
    const allItems = buildSkyCatalog();
    const list = st.skyAll ? allItems : allItems.filter(it => it.major);
    const byZone = new Map(ZONES.map(z => [z.id, []]));
    list.forEach(it => { (byZone.get(it.zone) || byZone.get('form')).push(it); });

    const asp = Math.max(.68, Math.min(1.8, viewAspect()));
    const portrait = asp < 0.92;
    const GOLDEN = 2.39996323;

    // Place each zone's stars in an organic golden-angle star cluster
    const zoneClusters = new Map();
    for (const z of ZONES) {
      const arr = byZone.get(z.id) || [];
      arr.sort((a, b) => (b.preview ? 1 : 0) - (a.preview ? 1 : 0) || b.cnt - a.cnt);
      const local = arr.map((it, i) => {
        const ang = i * GOLDEN + hash01(it.key) * 0.4;
        const radDist = i === 0 ? 0 : 90 * Math.sqrt(i) + (hash01(it.key + 'r') - 0.5) * 14;
        const tier = it.cnt >= 70 ? 0 : it.cnt >= 25 ? 1 : 2;
        return {
          key: it.key, r: it.r, no: it.no, cnt: it.cnt, zone: z.id, tier, preview: it.preview,
          x: Math.cos(ang) * radDist * (portrait ? 0.94 : 1.12),
          y: Math.sin(ang) * radDist * (portrait ? 1.06 : 0.92)
        };
      });
      relaxOverlap(local, false, 96, 106, 96, 106, 18);
      let minX = 0, maxX = 0, minY = 0, maxY = 0;
      local.forEach(n => { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x); minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y); });
      const w = (maxX - minX) + 128, h = (maxY - minY) + 148;
      const cx0 = (minX + maxX) / 2, cy0 = (minY + maxY) / 2;
      local.forEach(n => { n.x -= cx0; n.y -= cy0; });
      zoneClusters.set(z.id, { z, nodes: local, w, h });
    }

    // Arrange the 5 semantic nebulae cleanly with generous breathing space
    const cN = zoneClusters.get('nature'), cH = zoneClusters.get('human'),
          cL = zoneClusters.get('life'), cA = zoneClusters.get('animal'), cF = zoneClusters.get('form');
    const gap = 64;
    let offsets;
    if (portrait) {
      // 3-row constellation chart for portrait iPad / iPhone (exact non-overlapping row spacing)
      const r1H = Math.max(cN.h, cH.h), r2H = Math.max(cL.h, cA.h);
      const y1 = 0, y2 = r1H / 2 + r2H / 2 + gap, y3 = y2 + r2H / 2 + cF.h / 2 + gap;
      offsets = {
        nature: [-(cN.w / 2 + gap * .45), y1],
        human:  [+(cH.w / 2 + gap * .45), y1],
        life:   [-(cL.w / 2 + gap * .45), y2],
        animal: [+(cA.w / 2 + gap * .45), y2],
        form:   [0, y3]
      };
    } else {
      // Wide 2-row astronomical sky chart for landscape iPad / desktop
      const topH = Math.max(cN.h, cH.h);
      const botH = Math.max(cA.h, cF.h, cL.h);
      const yTop = -(topH / 2 + gap * .45);
      const yBot = +(botH / 2 + gap * .45);
      offsets = {
        nature: [-(cN.w / 2 + gap * .55), yTop],
        human:  [+(cH.w / 2 + gap * .55), yTop],
        animal: [-(cF.w / 2 + cA.w / 2 + gap * .9), yBot],
        form:   [0, yBot + 20],
        life:   [+(cF.w / 2 + cL.w / 2 + gap * .9), yBot]
      };
    }

    const nodes = [], links = [], labels = [], zoneBoxes = {};
    for (const z of ZONES) {
      const cl = zoneClusters.get(z.id);
      if (!cl.nodes.length) continue;
      const [ox, oy] = offsets[z.id];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      cl.nodes.forEach(n => {
        n.x += ox; n.y += oy;
        nodes.push(n);
        minX = Math.min(minX, n.x - 58); maxX = Math.max(maxX, n.x + 58);
        minY = Math.min(minY, n.y - 68); maxY = Math.max(maxY, n.y + 62);
      });
      // Prim's Minimum Spanning Tree inside each semantic nebula (delicate constellation chart lines)
      const conn = [0], rem = new Set(cl.nodes.map((_, i) => i).slice(1));
      while (rem.size) {
        let bestU = 0, bestV = 0, bestD = Infinity;
        for (const u of conn) {
          for (const v of rem) {
            const d = Math.hypot(cl.nodes[u].x - cl.nodes[v].x, cl.nodes[u].y - cl.nodes[v].y);
            if (d < bestD) { bestD = d; bestU = u; bestV = v; }
          }
        }
        links.push({ from: cl.nodes[bestU], to: cl.nodes[bestV], zone: z.id });
        conn.push(bestV); rem.delete(bestV);
      }
      labels.push({ id: z.id, icon: z.icon, title: LANG === 'en' ? z.en : z.th, count: cl.nodes.length, x: (minX + maxX) / 2, y: minY - 26 });
      zoneBoxes[z.id] = { minX: minX - 24, maxX: maxX + 24, minY: minY - 62, maxY: maxY + 24 };
    }

    // Center whole sky at (0, 0)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => { minX = Math.min(minX, n.x - 62); maxX = Math.max(maxX, n.x + 62); minY = Math.min(minY, n.y - 74); maxY = Math.max(maxY, n.y + 64); });
    labels.forEach(l => { minY = Math.min(minY, l.y - 26); });
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    nodes.forEach(n => { n.x -= cx; n.y -= cy; });
    labels.forEach(l => { l.x -= cx; l.y -= cy; });
    Object.values(zoneBoxes).forEach(b => { b.minX -= cx; b.maxX -= cx; b.minY -= cy; b.maxY -= cy; });

    return {
      nodes, links, labels, zoneBoxes,
      totalActive: allItems.length, shown: nodes.length,
      box: { minX: minX - cx - 28, maxX: maxX - cx + 28, minY: minY - cy - 28, maxY: maxY - cy + 48 },
      asp
    };
  }

  /* =====================================================================
     LEVEL 2 · TRUE GENEALOGY CONSTELLATION LAYOUT (ZERO FAKE LINES!)
     ===================================================================== */
  function layoutConstellation(f) {
    const nodes = [{ key: f, c: f, x: 0, y: 0, ring: 0, kind: 'root', stage: stageForFocus(f) }];
    const links = [];
    const used = new Set([f]);

    // 1. Parent parts of f (for compound chars like 相 → 木+目, 想 → 相+心)
    const parts = partsOf(f).map(q => ({ c: q, stage: 'PART' }));
    parts.forEach(p => used.add(p.c));

    // 2. Direct children via Transitive Reduction (true parent→child only!)
    const direct = directKidsOf(f, used);

    // 3. Classify direct children into STACK (reduplication), BRANCH (has real kids), LEAF (single-step)
    const stackRoots = [], branchItems = [], leafItems = [];
    for (const c of direct) {
      const stg = stageOf(c, f);
      if (stg === 'STACK') {
        stackRoots.push({ c, stage: 'STACK' });
      } else {
        const gTest = directKidsOf(c, new Set([f, c]));
        if (gTest.length > 0) branchItems.push({ c, stage: stg, gCount: gTest.length });
        else leafItems.push({ c, stage: stg });
      }
    }

    // Sort branches: richest multi-gen chains first (果, 相, 采, 某...), then lower HSK level
    branchItems.sort((a, b) => b.gCount - a.gCount || ((D.c[a.c] || [])[1] || 9) - ((D.c[b.c] || [])[1] || 9));
    // Sort leaves: HSK 1–2 brightest stars first
    leafItems.sort((a, b) => ((D.c[a.c] || [])[1] || 9) - ((D.c[b.c] || [])[1] || 9) || ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage));

    const mobile = innerWidth < 700, tablet = innerWidth >= 700 && innerWidth < 1100;
    const isExpanded = !!st.open[f];
    const hasHeroChains = stackRoots.length > 0 || branchItems.length > 0;

    // Caps keep focus razor-sharp on STACK + multi-gen BRANCHES, while showing top HSK satellites
    const maxBranches = isExpanded ? branchItems.length : (mobile ? 4 : tablet ? 7 : 9);
    const maxGPerBranch = isExpanded ? 6 : (mobile ? 4 : 5);
    const maxLeaves = isExpanded
      ? leafItems.length
      : (hasHeroChains ? (mobile ? 5 : tablet ? 8 : 10) : (mobile ? 14 : tablet ? 24 : 32));

    const pickedBranches = branchItems.slice(0, maxBranches);
    const pickedLeaves = leafItems.slice(0, maxLeaves);
    const more = (branchItems.length - pickedBranches.length) + (leafItems.length - pickedLeaves.length);

    // Pre-reserve picked top-level nodes so grandchildren never steal a primary node
    stackRoots.forEach(s => used.add(s.c));
    pickedBranches.forEach(b => used.add(b.c));
    pickedLeaves.forEach(l => used.add(l.c));

    // Trace each STACK spine deeply (e.g. 木 → 林 → 森, 又 → 双 → 叒 → 叕, 口 → 吅 → 品 → 㗊)
    // Plus real side-children off each spine step (e.g. 林 → 梦, 禁, 麻, 楚, 焚; 圭 → 街, 鞋, 挂, 佳)
    const stackChains = stackRoots.map(sr => {
      const spine = [];
      let curC = sr.c, depth = 1;
      while (curC && depth <= 4) {
        const kids = directKidsOf(curC, used);
        // Find next pure stacked continuation on this spine
        let nextSpine = kids.find(k => stageOf(k, curC) === 'STACK');
        // Non-stack real children off this spine node (e.g. 林 → 梦/禁/麻/楚/焚, 炎 → 谈/淡/毯)
        const sideKids = kids.filter(k => k !== nextSpine).slice(0, isExpanded ? 6 : (mobile ? 3 : 5));
        if (nextSpine) used.add(nextSpine);
        sideKids.forEach(k => used.add(k));
        spine.push({ c: curC, depth, sideKids: sideKids.map(k => ({ c: k, stage: stageOf(k, curC) || 'ULTIMATE' })) });
        curC = nextSpine;
        depth++;
      }
      return spine;
    });

    // Gather grandchildren for each picked BRANCH (e.g. 相 → 想, 箱, 厢, 霜; 果 → 课, 棵, 颗, 裹, 裸)
    const branchTrees = pickedBranches.map(b => {
      const gk = directKidsOf(b.c, used).slice(0, maxGPerBranch);
      gk.forEach(k => used.add(k));
      return { ...b, kids: gk.map(k => ({ c: k, stage: stageOf(k, b.c) || 'CHAMPION' })) };
    });

    /* ---------- Spatial Placement: Hero Spine UP, Parts UPPER-LEFT, Branches & Leaves Around ---------- */
    // A. Place STACK spine straight UP at 12 o'clock (-π/2)
    const nSpines = stackChains.length;
    stackChains.forEach((spine, si) => {
      const xBase = nSpines > 1 ? (si - (nSpines - 1) / 2) * 168 : 0;
      let prevKey = f;
      spine.forEach((step, idx) => {
        const x = xBase + (idx > 0 ? (si === 0 && nSpines > 1 ? -16 : si > 0 ? 16 : 0) : 0);
        const y = -(158 + idx * 146);
        const nd = { key: step.c, c: step.c, x, y, ring: idx === 0 ? 1 : 2, kind: 'stack', stage: 'STACK' };
        nodes.push(nd);
        links.push({ from: prevKey, to: step.c, stage: 'STACK', kind: 'stack' });

        // Fan real side-children cleanly to left & right of this spine node (e.g. 林 → 梦, 禁, 麻, 楚)
        const sk = step.sideKids;
        sk.forEach((child, ci) => {
          const onRight = ci % 2 === 0;
          const rank = Math.floor(ci / 2);
          const dir = onRight ? 1 : -1;
          const sx = x + dir * (138 + rank * 78);
          const sy = y - 24 + (rank % 2 === 0 ? -36 : 44) - idx * 8;
          nodes.push({ key: child.c, c: child.c, x: sx, y: sy, ring: 2, kind: 'branch-leaf', stage: child.stage });
          links.push({ from: step.c, to: child.c, stage: child.stage, kind: 'branch' });
        });
        prevKey = step.c;
      });
    });

    // B. Place PART components (parents of f) on upper-left arc if present
    if (parts.length) {
      const startA = -Math.PI * 0.88, spanA = Math.min(0.85, parts.length * 0.34);
      parts.forEach((p, i) => {
        const a = startA + (parts.length > 1 ? (i / (parts.length - 1)) * spanA : spanA / 2);
        const r = 164;
        nodes.push({ key: p.c, c: p.c, x: Math.cos(a) * r, y: Math.sin(a) * r, ring: 1, kind: 'part', stage: 'PART' });
        links.push({ from: p.c, to: f, stage: 'PART', kind: 'part' });
      });
    }

    // C. Allocate remaining angular arc cleanly to BRANCHES (multi-gen) + LEAVES (satellites)
    // Reserve top wedge around -π/2 if STACK exists, and upper-left wedge if PART exists
    const topReserve = nSpines ? (stackChains.some(sp => sp.some(s => s.sideKids.length > 0)) ? 1.15 : 0.62) : 0;
    const partReserve = parts.length ? 0.85 : 0;

    // Available sweep starts just clockwise of top reserve (-π/2 + topReserve/2) and wraps around to (-π/2 - topReserve/2 - partReserve)
    const aStart = -Math.PI / 2 + topReserve / 2 + 0.14;
    const aEnd = Math.PI * 1.5 - topReserve / 2 - partReserve - 0.14;
    const totalArc = Math.max(1.2, aEnd - aStart);

    // Split arc between BRANCH arms (higher weight so grandchildren fan cleanly) and LEAF satellites
    const hasExpandedLeaves = isExpanded && pickedLeaves.length > 16;
    const branchWeight = branchTrees.reduce((sum, b) => sum + 1.15 + Math.min(4, b.kids.length) * 0.42, 0);
    const leafArcCount = hasExpandedLeaves ? Math.min(18, pickedLeaves.length) : pickedLeaves.length;
    const leafWeight = leafArcCount * 0.56;
    const totalWeight = Math.max(1, branchWeight + leafWeight);

    // Place BRANCHES first (flanking right/bottom/left symmetrically around the star)
    let cursor = aStart;
    const branchArcTotal = totalArc * (branchWeight / totalWeight);
    const leafArcTotal = totalArc - branchArcTotal;

    // Interleave branches on right & left sides if leaves are in the middle bottom, or sweep cleanly clockwise
    const bCount = branchTrees.length;
    const rightHalf = Math.ceil(bCount / 2);
    const leftBranches = branchTrees.slice(rightHalf);
    const rightBranches = branchTrees.slice(0, rightHalf);

    const placeBranch = (b, ang, slotArc) => {
      const r1 = bCount > 6 ? 196 : 174;
      const bx = Math.cos(ang) * r1, by = Math.sin(ang) * r1;
      nodes.push({ key: b.c, c: b.c, x: bx, y: by, ring: 1, kind: 'branch', stage: b.stage });
      links.push({ from: f, to: b.c, stage: b.stage, kind: 'branch' });

      const gk = b.kids;
      const fanSpread = Math.min(Math.max(slotArc * 1.15, 0.42), gk.length > 3 ? 1.38 : 0.95);
      gk.forEach((g, gi) => {
        const off = gk.length > 1 ? ((gi / (gk.length - 1)) - 0.5) * fanSpread : 0;
        const ga = ang + off;
        const r2 = 142 + (gk.length > 4 && gi % 2 === 1 ? 36 : 0);
        const gx = bx + Math.cos(ga) * r2, gy = by + Math.sin(ga) * r2;
        nodes.push({ key: g.c, c: g.c, x: gx, y: gy, ring: 2, kind: 'branch-leaf', stage: g.stage });
        links.push({ from: b.c, to: g.c, stage: g.stage, kind: 'branch' });
      });
    };

    // Right-side branches
    rightBranches.forEach(b => {
      const w = 1.15 + Math.min(4, b.kids.length) * 0.42;
      const slot = branchWeight ? branchArcTotal * (w / branchWeight) : 0;
      placeBranch(b, cursor + slot / 2, slot);
      cursor += slot;
    });

    // Leaves sit cleanly in the dedicated quiet bottom sky arc (between right & left branches)
    // EVERY SINGLE LEAF connects strictly to center f — ZERO fake sibling lines!
    if (pickedLeaves.length) {
      const leafStart = cursor, leafSpan = Math.max(0.55, leafArcTotal);
      if (!hasExpandedLeaves) {
        // Neat organic single/double arc of brightest HSK satellites
        const perArc = Math.max(4, Math.floor((leafSpan * 185) / 118));
        let idx = 0, layer = 0;
        while (idx < pickedLeaves.length) {
          const r = 164 + layer * 126;
          const cap = Math.max(perArc, Math.floor((leafSpan * r) / 114));
          const take = Math.min(pickedLeaves.length - idx, cap);
          for (let j = 0; j < take; j++) {
            const lf = pickedLeaves[idx + j];
            const t = take > 1 ? (j + 0.5) / take : 0.5;
            const ang = leafStart + t * leafSpan;
            const jit = (hash01(lf.c) - 0.5) * 18;
            nodes.push({ key: lf.c, c: lf.c, x: Math.cos(ang) * (r + jit), y: Math.sin(ang) * (r + jit), ring: 1, kind: 'leaf', stage: lf.stage });
            links.push({ from: f, to: lf.c, stage: lf.stage, kind: 'leaf' });
          }
          idx += take; layer++;
        }
      } else {
        // Expanded satellite halo: clean outer arcs wrapping around the whole constellation,
        // every satellite linked with a soft direct ray to f (never fake sibling-to-sibling!)
        let idx = 0, ringR = 395;
        while (idx < pickedLeaves.length) {
          const circ = 2 * Math.PI * ringR;
          const cap = Math.max(12, Math.floor(circ / 122));
          const take = Math.min(pickedLeaves.length - idx, cap);
          for (let j = 0; j < take; j++) {
            const lf = pickedLeaves[idx + j];
            const ang = Math.PI / 2 + ((j + 0.5) / take - 0.5) * Math.PI * 1.92;
            const jit = (hash01(lf.c) - 0.5) * 20;
            nodes.push({ key: lf.c, c: lf.c, x: Math.cos(ang) * (ringR + jit), y: Math.sin(ang) * (ringR + jit), ring: 1, kind: 'leaf', stage: lf.stage });
            links.push({ from: f, to: lf.c, stage: lf.stage, kind: 'leaf-far' });
          }
          idx += take; ringR += 132;
        }
      }
      cursor += leafArcTotal;
    }

    // Left-side branches
    leftBranches.forEach(b => {
      const w = 1.15 + Math.min(4, b.kids.length) * 0.42;
      const slot = branchWeight ? branchArcTotal * (w / branchWeight) : 0;
      placeBranch(b, cursor + slot / 2, slot);
      cursor += slot;
    });

    // D. Guaranteed Zero-Overlap AABB Relaxation (center f stays pinned at (0,0))
    relaxOverlap(nodes, true, 104, 114, 128, 134, 28);

    // Exact bounding box for framing cleanly above the +more pill
    let minX = -150, maxX = 150, minY = -150, maxY = 150;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x - 64); maxX = Math.max(maxX, n.x + 64);
      minY = Math.min(minY, n.y - 72); maxY = Math.max(maxY, n.y + 66);
    });

    // Stage counts across visible nodes (excluding center root)
    const sectors = ORDER.map(s2 => {
      const n = nodes.filter(nd => nd.ring > 0 && nd.stage === s2).length;
      return n ? { s: s2, n } : null;
    }).filter(Boolean);

    return {
      nodes, links, sectors, more, isExpanded,
      hasMoreToggle: more > 0 || (isExpanded && (leafItems.length > (hasHeroChains ? 8 : 20) || branchItems.length > 7)),
      box: { minX: minX - 24, maxX: maxX + 24, minY: minY - 24, maxY: maxY + 24 },
      asp: viewAspect()
    };
  }

  /* ---------- tree layout (left → right, 3 generations, with transitive reduction + BONUS) ---------- */
  function build(baseChar) {
    const seen = new Set([baseChar]);
    const node = (c, p, depth) => {
      const n = { c, p, depth, stage: p ? (stageOf(c, p) || 'CHAMPION') : 'ROOKIE', kids: [], more: 0 };
      if (depth < 3) {
        let ks = directKidsOf(c, seen); ks.forEach(k => seen.add(k));
        const cap = st.open[c] ? 999 : depth === 0 ? 24 : 8;
        n.more = Math.max(0, ks.length - cap); ks = ks.slice(0, cap);
        n.kids = ks.map(k => node(k, c, depth + 1));
      }
      return n;
    };
    const root = node(baseChar, null, 0);
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

  /* ---------- node & card rendering ---------- */
  const repBadge = (c, stage) => {
    const rep = (BONUS[c] && BONUS[c].rep) || (stage === 'STACK' && HSK_REP[c]);
    return rep ? `<em class="dg-rep">×${rep}</em>` : '';
  };

  /* Pinyin ABOVE box · character square MIDDLE · meaning BELOW */
  const nodeInner = (c, stage) => {
    const dot = !BONUS[c] && typeof HzKit !== 'undefined' ? HzKit.dotHtml(c) : '';
    const sd = side(c);
    const pyTxt = pyOf(c);
    const topLbl = sd
      ? `<span class="dg-side-tag" title="${esc2(sd)}">${esc2(sd.split(' · ')[0])}</span>`
      : `<span class="pyx">${esc2(pyTxt)}</span>`;
    const m = meanOf(c);
    const rep = repBadge(c, stage);
    return `${topLbl}<i class="dg-hex"${lvC(c)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(c))}${dot}${rep}</i>${m.t ? `<small class="dg-m${m.fb ? ' fb' : ''}" lang="${m.fb ? 'en' : mLang()}">${esc2(shortM(m.t))}</small>` : ''}`;
  };

  function skyNodeInner(n) {
    const r = n.r, py = pyOf(n.key) || r[3] || '';
    const m = meanOf(n.key);
    const sub = n.preview ? `<em class="dg-sky-ch" lang="zh-Hans">${esc2(n.preview)}</em>` : `${esc2(shortM(m.t))} · ${n.cnt}`;
    return `<span class="pyx">${esc2(py)}</span><i class="dg-hex"${lvC(n.key)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(n.key))}</i><small class="dg-m">${sub}</small>`;
  }

  function skyGuideHTML() {
    const items = QUICK_CHAINS.map(([ch, label]) =>
      `<button type="button" class="dg-qchain" data-base="${esc2(ch)}"><span lang="zh-Hans">${esc2(label)}</span></button>`).join('');
    return `<div class="dg-card dg-sky-card">
      <div class="dg-ch"><span class="dg-stage s-STACK">${T('ท้องฟ้ากลุ่มดาวรากศัพท์')}</span><span class="dg-id">214 部首</span></div>
      <p class="dg-sky-lead">${LANG === 'en'
        ? 'Tap any radical star on the sky map or search any Hanzi above to explore its real parent → child evolution.'
        : 'แตะดาวรากศัพท์บนท้องฟ้า หรือพิมพ์ค้นหาตัวอักษรใดก็ได้ด้านบน เพื่อดูสายเลือดวิวัฒนาการจริง (แม่ → ลูก → หลาน)'}</p>
      <ul class="dg-sky-key">
        <li><i class="k-stack"></i><span><b>${T('ซ้ำร่างวิวัฒนาการ')}</b> · ${LANG === 'en' ? 'Same char stacked ×2–×4 (木→林→森, 又→双→叒→叕)' : 'ตัวเดิมซ้ำร่าง ×2–×4 เช่น 木→林→森 · 又→双→叒→叕'}</span></li>
        <li><i class="k-branch"></i><span><b>${LANG === 'en' ? 'Branching lineage' : 'สายแตกกิ่งลูก→หลาน'}</b> · ${LANG === 'en' ? 'Real multi-gen chains (木→相→想/箱)' : 'ต่อยอดจริงหลายรุ่น เช่น 木→相→想/箱 · 木→果→课/棵/颗'}</span></li>
        <li><i class="k-leaf"></i><span><b>${LANG === 'en' ? 'Direct satellites' : 'ดาวบริวารชั้นเดียว'}</b> · ${LANG === 'en' ? 'Direct children linked cleanly to center' : 'ลูกชั้นเดียวเชื่อมตรงกับตัวแม่ (ไม่มีเส้นเชื่อมมั่วระหว่างพี่น้อง)'}</span></li>
        <li><i class="k-bonus"></i><span><b>${T('นอก HSK')}</b> · ${LANG === 'en' ? 'Dashed grey border for iconic non-HSK stacked chars' : 'กรอบประสีเทาสำหรับอักษรซ้ำร่างชื่อดังนอก HSK (叒 叕 淼 焱 垚)'}</span></li>
      </ul>
      <p class="dg-wt">${T('สายซ้ำร่างเด่น')}</p>
      <div class="dg-qchains">${items}</div>
    </div>`;
  }

  function cardHTML(c, stage, parent) {
    const b = BONUS[c], x = D.c[c], stg = STAGES[stage] || STAGES.ROOKIE, g = show(c);
    const rr = x ? x[3] && rad.get(x[3]) : radOfGlyph.get(c);
    const words = x ? (D.cw[c] || []).slice(0, 8).map(i => {
      const w = D.w[i];
      const gl = typeof HzKit !== 'undefined' ? HzKit.wordGloss(w[0], w[3], !!w[4]) : { t: w[3], fb: !w[4] };
      return `<li><button type="button" class="dg-wbtn" data-dgword="${esc2(w[0])}">${lvQ(w[2])}<b lang="zh-Hans">${esc2(w[0])}</b><span class="pyx">${esc2(w[1])}</span><span class="dg-wgl">${gl.fb ? '<em>EN</em>' : ''}${esc2(gl.t)}</span></button><button type="button" class="tr-say" data-say="${esc2(w[0])}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></li>`;
    }).join('') : '';
    const cat = parent && (x || b) && stageOf(c, parent) ? catalyst(c, parent) : [];
    const parts = partsRaw(c).map(q => `<button class="dg-part${parent && formsOf(parent).has(q) ? ' base' : ''}" data-dgo="${esc2(q)}" lang="zh-Hans">${esc2(show(q))}${side(q) ? `<small>${esc2(side(q))}</small>` : ''}</button>`).join('<i>+</i>');
    const mo = meanOf(c), meaning = mo.t + (mo.fb || mLang() === 'en' || !x || !x[10] ? '' : ` · ${x[10]}`);
    const reg = x ? [[T('ไต้หวัน'), x[8], 'zh-Hant'], [T('ญี่ปุ่น'), x[13], 'ja']].filter(f => f[1]) : (b && b.trad ? [[T('ตัวเต็ม'), b.trad, 'zh-Hant']] : []);
    const twins = side(c) ? ((D.amb || {})[base(c)] || []).filter(no => `${base(c)}@${no}` !== c).map(no => `${base(c)}@${no}`) : [];
    const xbar = !b && typeof HzKit !== 'undefined' ? HzKit.crossBar(c, 'digi') : '';
    const bonusBadge = b ? `<span class="dg-bonus-tag">${T('นอก HSK')} · ×${b.rep}</span>` : '';
    return `<div class="dg-card s-${stage}${b ? ' is-bonus' : ''}">
      <div class="dg-ch"><span class="dg-stage">${esc2(T(stg.th))} <b>${stg.zh}</b></span>${bonusBadge || `<span class="dg-id">#${esc2((c.codePointAt(0) || 0).toString(16).toUpperCase())}</span>`}</div>
      <div class="dg-hero"><div class="dg-big${b ? ' is-bonus' : ''}"${lvC(c)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(g)}</div>
        <div><p class="dg-py"><span class="pyx">${esc2(pyOf(c))}</span><button class="dg-say" data-say="${esc2(base(c))}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></p>
          ${meaning ? `<p class="dg-mean">${esc2(meaning)}</p>` : ''}<p class="dg-sd">${esc2(stg.d)}</p></div></div>
      ${xbar}
      ${x ? `<dl class="dg-stats"><div><dt>HSK</dt><dd>${x[1] === 7 ? '7-9' : x[1]}</dd></div><div><dt>${T('ขีด')}</dt><dd>${esc2(x[2])}</dd></div>${rr ? `<div><dt>部首</dt><dd lang="zh-Hans">${esc2(radG(rr))}</dd></div>` : ''}${x[6] ? `<div><dt>六书</dt><dd lang="zh-Hans">${esc2(x[6])}</dd></div>` : ''}</dl>`
        : b ? `<dl class="dg-stats"><div><dt>HSK</dt><dd>${T('นอก HSK')}</dd></div><div><dt>${T('ขีด')}</dt><dd>${b.strokes}</dd></div><div><dt>六书</dt><dd lang="zh-Hans">会意</dd></div><div><dt>${T('ซ้ำร่าง')}</dt><dd>×${b.rep}</dd></div></dl>` : ''}
      ${parts ? `<p class="dg-row"><span>${T('โครงสร้าง')}</span>${parts}</p>` : ''}
      ${twins.length ? `<p class="dg-row"><span>${T('หน้าตาเหมือน แต่คนละตัว')}</span>${twins.map(q => `<button class="dg-part" data-dgo="${esc2(q)}" lang="zh-Hans">${esc2(base(q))}<small>${esc2(side(q))}</small></button>`).join('')}</p>` : ''}
      ${cat.length ? `<p class="dg-row"><span>${T('ส่วนที่เพิ่ม')}</span>${cat.map(q => `<b class="dg-cat" lang="zh-Hans">${esc2(show(q))}</b>`).join(' ')}</p>` : ''}
      ${reg.length ? `<p class="dg-row"><span>${T('รูปเขียนตามภูมิภาค')}</span>${reg.map(([k, v, l]) => `<b class="dg-reg" lang="${l}">${esc2(v)}<small>${k}</small></b>`).join('')}</p>` : ''}
      ${words ? `<p class="dg-wt">${T('คำที่ใช้ตัวนี้')} <small>${T('แตะเพื่อดู 5 ภาษา')}</small></p><ul class="dg-ws">${words}</ul>` : ''}
      ${x && (x[4] || []).length > 1 ? `<button class="dg-go" data-evolve="${esc2(c)}">${ic('bolt')}${T('ดูการประกอบอักษร')}</button>` : ''}
    </div>`;
  }

  const trailHTML = () => `<button type="button" class="dg-sky-back" data-skyback>✦ ${T('ท้องฟ้าทั้งหมด')}</button>`
    + st.trail.map((c, i) => `<i>›</i><button class="${i === st.trail.length - 1 ? 'on' : ''}" data-trail="${i}" lang="zh-Hans">${esc2(show(c))}</button>`).join('');

  /* ---------- paint (frame) ---------- */
  function paint() {
    if (!host) return;
    cancelAnimationFrame(anim); cur = new Map();
    st.stageFilter = null;
    const focus = st.trail[st.trail.length - 1], vm = viewMode(), sky = isSky();

    const zoneBar = sky
      ? `<div class="dg-zones">
          <button type="button" class="${st.skyZone === 'all' ? 'on' : ''}" data-zone="all">✦ ${T('ทั้งหมด')}</button>
          ${ZONES.map(z => `<button type="button" class="${st.skyZone === z.id ? 'on' : ''}" data-zone="${z.id}">${z.icon} ${LANG === 'en' ? z.en : z.th}</button>`).join('')}
        </div>`
      : `<div class="dg-subbar">
          <div class="dg-tg dg-vw" role="tablist">
            <span class="${vm === 'radial' ? 'on' : ''}" data-view="radial">${T('กลุ่มดาว')}</span>
            <span class="${vm === 'grid' ? 'on' : ''}" data-view="grid">${T('กริด')}</span>
            <span class="${vm === 'tree' ? 'on' : ''}" data-view="tree">${T('ขวา')}</span>
          </div>
          <div class="dg-legend">${ORDER.map(k => `<button type="button" class="s-${k}" data-stage="${k}" aria-pressed="false"><i></i><b lang="zh-Hans">${STAGES[k].zh}</b><span>${LANG === 'en' ? T(STAGES[k].th) : STAGES[k].sh}</span><em class="dg-cnt"></em></button>`).join('')}</div>
        </div>
        <nav class="dg-trail" aria-label="trail">${trailHTML()}</nav>`;

    host.innerHTML = `<div class="dg${sky ? ' is-sky is-radial' : (vm === 'radial' ? ' is-radial' : '')}${!sky && vm === 'grid' ? ' is-grid' : ''}">
      <div class="dg-top">
        <label class="dg-q">${ic('search')}<input maxlength="4" placeholder="${T('ค้นหาอักษรหรือราก เช่น 木, 森, 想, 叒…')}" value=""><button class="q-pen" data-handpad=".dg-q input" aria-label="${T('เขียนค้นหา')}">${ic('pen')}</button></label>
      </div>
      ${zoneBar}
      <div class="dg-body">
        ${!sky && vm === 'grid'
          ? `<div class="dg-grid-wrap"></div>`
          : `<div class="dg-view" tabindex="0" aria-label="${T('ลากเพื่อเลื่อน · หมุนล้อหรือบีบเพื่อซูม')}">
              <div class="dg-world"></div>
              <div class="dg-zoom"><button data-zoom="1" aria-label="zoom in">+</button><button data-zoom="-1" aria-label="zoom out">−</button><button data-zoom="0" aria-label="fit">${ic('repeat')}</button></div>
              <div class="dg-more-bar"></div>
              <p class="dg-hint">${sky ? T('แตะรากศัพท์เพื่อเจาะเข้ากลุ่มดาว · ลากหรือซูมได้') : radial() ? T('แตะตัวไหนก็ได้เพื่อย้ายมาไว้ตรงกลาง') : T('ลากเพื่อเลื่อน · หมุนล้อหรือบีบเพื่อซูม')}</p>
            </div>`}
        <aside class="dg-side"></aside>
      </div>
      <div class="dg-fx" hidden></div></div>`;

    if (sky) { drawSky(); watchShape(); }
    else if (vm === 'radial') { st.fitted = false; drawRadial(focus, false); watchShape(); }
    else if (vm === 'grid') drawGrid(focus);
    else { drawTree(); watchShape(); }
    if (typeof HanziView !== 'undefined' && HanziView.fit) setTimeout(HanziView.fit, 35);
  }

  /* ---------- Level 1 Sky Map drawing ---------- */
  function drawSky() {
    const world = host.querySelector('.dg-world'); if (!world) return;
    skyLay = layoutSky();
    lay = null;
    const svg = `<svg class="dg-svg sky" width="1" height="1" aria-hidden="true">${skyLay.links.map(l =>
      `<line class="dg-sky-l" data-zone="${l.zone}" x1="${l.from.x.toFixed(1)}" y1="${l.from.y.toFixed(1)}" x2="${l.to.x.toFixed(1)}" y2="${l.to.y.toFixed(1)}"/>`
    ).join('')}</svg>`;
    const labels = skyLay.labels.map(lb =>
      `<button type="button" class="dg-sky-lbl" data-zone="${lb.id}" style="transform:translate(${lb.x.toFixed(1)}px,${lb.y.toFixed(1)}px) translate(-50%,-50%)">${lb.icon} <span>${esc2(lb.title)}</span><em>${lb.count}</em></button>`
    ).join('');
    const stars = skyLay.nodes.map(n =>
      `<button type="button" class="dg-n dg-sky-n t${n.tier}${n.preview ? ' has-st' : ''}" data-sky="${esc2(n.key)}" data-zone="${n.zone}" style="transform:translate(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px) translate(-50%,var(--hy))" aria-label="${esc2(show(n.key))}">${skyNodeInner(n)}</button>`
    ).join('');
    world.innerHTML = svg + labels + stars;

    const moreBar = host.querySelector('.dg-more-bar');
    if (moreBar) {
      moreBar.innerHTML = st.skyAll
        ? `<button type="button" class="dg-more-pill" data-skyall>${T('แสดงเฉพาะรากหลัก')}</button>`
        : `<button type="button" class="dg-more-pill" data-skyall>+ ${T('แสดงรากทั้งหมด')} (${skyLay.totalActive})</button>`;
    }
    const card = host.querySelector('.dg-side');
    if (card) card.innerHTML = skyGuideHTML();
    applySkyZone(false);
  }

  function applySkyZone(animate) {
    const world = host && host.querySelector('.dg-world');
    if (!world || !skyLay) return;
    const z = st.skyZone;
    world.classList.toggle('z-dim', z !== 'all');
    world.querySelectorAll('[data-zone]').forEach(el => el.classList.toggle('z-hi', z === 'all' || el.dataset.zone === z));
    host.querySelectorAll('.dg-zones [data-zone]').forEach(b => b.classList.toggle('on', b.dataset.zone === z));
    const box = (z !== 'all' && skyLay.zoneBoxes[z]) || skyLay.box;
    fitBox(box, animate, true);
  }

  /* ---------- Grid view (with STACK + BONUS + grouped HSK tiles) ---------- */
  function drawGrid(f) {
    const wrap = host.querySelector('.dg-grid-wrap'); if (!wrap) return;
    const parts = partsOf(f).map(q => ({ c: q, stage: 'PART' }));
    const used = new Set([f, ...parts.map(p => p.c)]);
    const direct = directKidsOf(f, used);
    const all = parts.slice();
    // Collect stack chains deeply + direct kids
    for (const c of direct) {
      const stg = stageOf(c, f) || 'CHAMPION';
      all.push({ c, stage: stg });
      used.add(c);
      if (stg === 'STACK') {
        let curC = c;
        for (let d = 0; d < 3; d++) {
          const nxt = directKidsOf(curC, used).find(k => stageOf(k, curC) === 'STACK');
          if (!nxt) break;
          all.push({ c: nxt, stage: 'STACK' });
          used.add(nxt);
          curC = nxt;
        }
      }
    }
    const byStage = new Map(ORDER.map(s => [s, []]));
    all.forEach(it => { if (byStage.has(it.stage)) byStage.get(it.stage).push(it); });
    byStage.forEach((arr, k) => {
      if (k !== 'STACK') arr.sort((a, b) => ((D.c[a.c] || [])[1] || 9) - ((D.c[b.c] || [])[1] || 9));
    });

    host.querySelectorAll('.dg-legend [data-stage]').forEach(el => {
      const n = (byStage.get(el.dataset.stage) || []).length;
      el.querySelector('.dg-cnt').textContent = n ? n : '';
      el.classList.toggle('none', !n);
    });
    const tr = host.querySelector('.dg-trail');
    if (tr) tr.innerHTML = trailHTML();

    const secs = ORDER.map(s => {
      const arr = byStage.get(s) || [];
      if (!arr.length || (st.stageFilter && st.stageFilter !== s)) return '';
      return `<section class="dg-gsec s-${s}">
        <h4 class="dg-gsh"><i></i><b lang="zh-Hans">${STAGES[s].zh}</b><span>${T(STAGES[s].th)}</span><small>${arr.length}</small></h4>
        <div class="dg-glist">${arr.map(it => {
          const c = it.c, m = meanOf(c), isB = !!BONUS[c];
          const dot = !isB && typeof HzKit !== 'undefined' ? HzKit.dotHtml(c) : '';
          const sd = side(c);
          const py = sd ? sd.split(' · ')[0] : pyOf(c);
          const rep = repBadge(c, it.stage);
          return `<button type="button" class="dg-gtile${it.stage === 'PART' ? ' is-part' : ''}${isB ? ' is-bonus' : ''}"${lvC(c)} data-n="${esc2(c)}">
            ${dot}${rep}<span class="pyx">${esc2(py)}</span>
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

  /* ---------- Level 2 Constellation drawing + tween ---------- */
  function drawRadial(f, tween) {
    const world = host.querySelector('.dg-world'); if (!world) return;
    st.stageFilter = null;
    world.classList.remove('sf-on', 'z-dim');
    host.querySelectorAll('.dg-legend [data-stage].on').forEach(el => { el.classList.remove('on'); el.setAttribute('aria-pressed', 'false'); });
    const next = layoutConstellation(f), prev = cur, from = new Map();
    lay = next; skyLay = null;
    let svg = world.querySelector('svg.dg-svg');
    if (!svg) { svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'dg-svg'); svg.setAttribute('width', '1'); svg.setAttribute('height', '1'); world.prepend(svg); }
    else svg.setAttribute('class', 'dg-svg');
    world.querySelectorAll('.dg-sky-n, .dg-sky-lbl, .dg-more, .dg-sec, .dg-none').forEach(el => el.remove());

    const keep = new Set(next.nodes.map(n => n.key));
    [...world.querySelectorAll('.dg-n')].forEach(el => { if (!keep.has(el.dataset.n)) { el.classList.add('out'); setTimeout(() => el.remove(), 340); } });

    next.nodes.forEach(n => {
      let el = world.querySelector(`.dg-n[data-n="${CSS.escape(n.key)}"]`);
      const old = prev.get(n.key);
      if (!el) {
        el = document.createElement('button'); el.dataset.n = n.key; world.appendChild(el);
        const link = next.links.find(l => l.to === n.key || (n.stage === 'PART' && l.from === n.key));
        const parentKey = link ? (link.from === n.key ? link.to : link.from) : null;
        const src = parentKey && (prev.get(parentKey) || next.nodes.find(m => m.key === parentKey));
        from.set(n.key, old || (src ? { x: src.x, y: src.y } : { x: 0, y: 0 }));
      } else from.set(n.key, old || { x: n.x, y: n.y });
      el.className = `dg-n r${n.ring} k-${n.kind} s-${n.stage}${n.ring === 0 ? ' on' : ''}${BONUS[n.c] ? ' is-bonus' : ''}`;
      el.setAttribute('aria-label', `${show(n.c)} ${T(STAGES[n.stage].th)}`);
      el.innerHTML = nodeInner(n.c, n.stage);
    });

    if (!next.nodes.some(n => n.ring > 0 && n.stage !== 'PART')) {
      world.insertAdjacentHTML('beforeend', `<p class="dg-none r" style="transform:translate(-50%,0) translate(0px,110px)">${T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้')} (${typeof HzLv === 'undefined' ? '' : HzLv.label()})</p>`);
    }

    const moreBar = host.querySelector('.dg-more-bar');
    if (moreBar) {
      if (next.more > 0) {
        moreBar.innerHTML = innerWidth < 620
          ? `<button type="button" class="dg-more-pill" data-more="${esc2(f)}">+${next.more} ${T('ดาวบริวารอีก')}</button><button type="button" class="dg-more-pill alt" data-view="grid">${T('กริด')} →</button>`
          : `<button type="button" class="dg-more-pill" data-more="${esc2(f)}">+${next.more} ${T('ดาวบริวารอีก')}</button>`;
      } else if (next.isExpanded && next.hasMoreToggle) {
        moreBar.innerHTML = `<button type="button" class="dg-more-pill alt" data-less="${esc2(f)}">${T('ซ่อนดาวบริวาร (เหลือเฉพาะสายหลัก)')}</button>`;
      } else moreBar.innerHTML = '';
    }

    host.querySelectorAll('.dg-legend [data-stage]').forEach(el => {
      const n = (next.sectors.find(x => x.s === el.dataset.stage) || {}).n || 0;
      el.querySelector('.dg-cnt').textContent = n ? n : '';
      el.classList.toggle('none', !n && el.dataset.stage !== 'ROOKIE');
    });

    const born = new Set(next.nodes.filter(n => !prev.has(n.key)).map(n => n.key)), delay = new Map();
    let i1 = 0, i2 = 0;
    next.nodes.forEach(n => delay.set(n.key, n.ring === 0 ? 0 : n.ring === 1 ? 35 + 14 * i1++ : 200 + 10 * i2++));
    const back = t => { const c = 1.45; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, out3 = t => 1 - Math.pow(1 - t, 3);
    const NODE_MS = 460, TOTAL = NODE_MS + Math.max(0, ...delay.values());

    const frame = ms => {
      const pos = new Map(), prog = new Map();
      next.nodes.forEach(n => {
        const t = Math.max(0, Math.min(1, (ms - delay.get(n.key)) / NODE_MS)), isNew = born.has(n.key), e = isNew ? back(t) : out3(t), a = from.get(n.key) || n;
        pos.set(n.key, { x: a.x + (n.x - a.x) * e, y: a.y + (n.y - a.y) * e }); prog.set(n.key, t);
        const el = world.querySelector(`.dg-n[data-n="${CSS.escape(n.key)}"]`), p = pos.get(n.key);
        if (!el) return;
        const s = isNew ? .38 + .62 * Math.min(1, out3(t) * 1.04) : 1;
        el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%, var(--hy)) scale(${s.toFixed(3)})`;
        el.style.opacity = isNew && t < 1 ? Math.min(1, t * 2.2).toFixed(2) : '';
      });
      svg.innerHTML = next.links.map(l => {
        const a = pos.get(l.from), b = pos.get(l.to); if (!a || !b) return '';
        const far = l.stage === 'PART' ? l.from : l.to;
        const p = born.has(far) ? out3(prog.get(far) || 0) : 1, part = l.stage === 'PART';
        const draw = p < 1 && !part ? ` pathLength="1" stroke-dasharray="1" stroke-dashoffset="${(1 - p).toFixed(3)}"` : part && p < 1 ? ` style="opacity:${p.toFixed(2)}"` : '';
        return `<line class="dg-l lk-${l.kind} s-${l.stage}${part ? ' part' : ''}" data-a="${esc2(l.from)}" data-b="${esc2(l.to)}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"${draw}/>`;
      }).join('');
      cur = pos;
    };

    const card = host.querySelector('.dg-side');
    card.innerHTML = cardHTML(f, next.nodes[0].stage, st.trail[st.trail.length - 2]);
    const tr = host.querySelector('.dg-trail');
    if (tr) tr.innerHTML = trailHTML();
    writeBig(f);

    if (!tween || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      frame(TOTAL + 1); fitBox(next.box, false, next.hasMoreToggle); arrive(world); return;
    }
    const t0 = performance.now();
    cancelAnimationFrame(anim);
    const tick = now => { const ms = now - t0; frame(ms); if (ms < TOTAL) anim = requestAnimationFrame(tick); else { frame(TOTAL + 1); arrive(world); } };
    anim = requestAnimationFrame(tick);
    fitBox(next.box, true, next.hasMoreToggle);
  }

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
  function hover(key) {
    const world = host.querySelector('.dg-world'); if (!world || !lay) return;
    world.querySelectorAll('.hl').forEach(x => x.classList.remove('hl'));
    // Never dim the constellation when hovering the center focus star (r0)
    if (!key || (lay.nodes[0] && lay.nodes[0].key === key)) { world.classList.remove('hov'); return; }
    const near = new Set([key]);
    lay.links.forEach(l => { if (l.from === key || l.to === key) { near.add(l.from); near.add(l.to); } });
    world.querySelectorAll('.dg-l').forEach(p => { if (p.dataset.a === key || p.dataset.b === key) p.classList.add('hl'); });
    world.querySelectorAll('.dg-n').forEach(n => { if (near.has(n.dataset.n)) n.classList.add('hl'); });
    const el = world.querySelector(`.dg-n[data-n="${CSS.escape(key)}"] .dg-hex`);
    world.style.setProperty('--hlc', el ? getComputedStyle(el).getPropertyValue('--lc') || 'var(--ink)' : 'var(--ink)');
    world.classList.add('hov');
  }

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

  /* ---------- Camera Framing (works for both Sky Map & Level 2 Constellation) ---------- */
  let ro = null, roT = 0;
  function watchShape() {
    if (typeof ResizeObserver === 'undefined') return;
    const v = host.querySelector('.dg-view'); if (!v) return;
    if (ro) ro.disconnect();
    ro = new ResizeObserver(() => { clearTimeout(roT); roT = setTimeout(() => {
      if (!host || !host.isConnected || !v.isConnected) return;
      if (isSky() && skyLay) {
        if (Math.abs(viewAspect() - skyLay.asp) > .14) drawSky();
        else applySkyZone(false);
      } else if (radial() && lay) {
        if (Math.abs(viewAspect() - lay.asp) > .14) drawRadial(st.trail[st.trail.length - 1], false);
        else fitBox(lay.box, false, lay.hasMoreToggle);
      }
    }, 160); });
    ro.observe(v);
  }

  let camAnim = 0;
  function fitBox(box, animate, padBottom) {
    const v = host && host.querySelector('.dg-view'); if (!v || !box) return;
    const vw = v.clientWidth || 600, vh = v.clientHeight || 480;
    const pb = padBottom ? 44 : 12;
    const bw = Math.max(180, box.maxX - box.minX), bh = Math.max(180, box.maxY - box.minY);
    const k1 = Math.max(.14, Math.min(1.12, (vw - 24) / bw, (vh - pb - 16) / bh));
    const cx = (box.minX + box.maxX) / 2, cy = (box.minY + box.maxY) / 2;
    const tx1 = vw / 2 - cx * k1, ty1 = (vh - pb) / 2 - cy * k1;
    cancelAnimationFrame(camAnim);
    if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      st.tx = tx1; st.ty = ty1; st.k = k1; apply(); st.fitted = true; return;
    }
    const a = { tx: st.tx, ty: st.ty, k: st.k }, t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / 480), e = 1 - Math.pow(1 - t, 3);
      st.tx = a.tx + (tx1 - a.tx) * e; st.ty = a.ty + (ty1 - a.ty) * e; st.k = a.k + (k1 - a.k) * e;
      apply();
      if (t < 1) camAnim = requestAnimationFrame(step);
    };
    camAnim = requestAnimationFrame(step);
  }

  function focusOn(c) {
    if (!D.c[c] && !D.cc[c] && !radOfGlyph.get(c) && !BONUS[c]) return;
    const wasSky = isSky();
    st.mode = 'focus';
    const i = st.trail.indexOf(c);
    if (i >= 0) st.trail = st.trail.slice(0, i + 1); else st.trail.push(c);
    if (st.trail.length > 12) st.trail = st.trail.slice(-12);
    tone([[660, 990, 0, .09, 'square'], [990, 1480, .06, .12, 'sine']]);
    if (wasSky) paint();
    else if (isGrid()) drawGrid(c);
    else if (radial()) drawRadial(c, true);
    else paint();
  }

  /* ---------- tree drawing (left → right) ---------- */
  function drawTree() {
    const bChar = st.trail[st.trail.length - 1];
    tree = build(bChar);
    const world = host.querySelector('.dg-world');
    world.style.width = tree.w + 'px'; world.style.height = tree.h + 'px';
    let links = '';
    tree.all.forEach(n => n.kids.forEach(k => {
      const x1 = n.x + NODE, y1 = n.y + 48, x2 = k.x, y2 = k.y + 48, mx = (x1 + x2) / 2;
      links += `<path class="dg-l lk-${k.stage === 'STACK' ? 'stack' : 'branch'} s-${k.stage}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/>`;
    }));
    world.innerHTML = `<svg class="dg-svg tree" width="${tree.w}" height="${tree.h}" aria-hidden="true">${links}</svg>`
      + tree.all.map(n => `<button class="dg-n t s-${n.stage}${(st.sel || bChar) === n.c ? ' on' : ''}${BONUS[n.c] ? ' is-bonus' : ''}" data-n="${esc2(n.c)}" style="left:${n.x}px;top:${n.y}px">${nodeInner(n.c, n.stage)}</button>`).join('')
      + tree.all.filter(n => n.more).map(n => `<button class="dg-more t" data-more="${esc2(n.c)}" style="left:${n.x + COLW}px;top:${n.moreY}px">+${n.more} ${T('เพิ่มอีก')}</button>`).join('');
    const sel = tree.all.find(n => n.c === (st.sel || bChar)) || tree.root;
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

  /* ---------- sound ---------- */
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

  /* ---------- ฉากประกอบอักษร (assembly animation) ---------- */
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
    const plan = els.map((el, i) => {
      const [cx, cy, cw, ch] = cells[Math.min(i, cells.length - 1)], g = el.querySelector('b');
      const big = Math.max(cw, ch), fs = S * big * .86;
      g.style.fontSize = fs + 'px';
      const tx = ox + (cx + cw / 2) * S, ty = oy + (cy + ch / 2) * S;
      let dx = (cx + cw / 2) - .5, dy = (cy + ch / 2) - .5;
      if (Math.hypot(dx, dy) < .05) { dx = i ? .5 : 0; dy = i ? .25 : -.35; }
      const n = Math.hypot(dx, dy) || 1, push = S * .55, ls = Math.min(1, (S * .4) / fs), half = Math.max(fs * ls, 140) / 2 + 8;
      const sx = Math.max(half, Math.min(W - half, tx + dx / n * push)), sy = Math.max(fs * ls / 2 + 6, Math.min(H - fs * ls / 2 - 34, ty + dy / n * push * .8));
      const sq = `scale(${(cw / big).toFixed(3)}, ${(ch / big).toFixed(3)})`, loose = `scale(${ls.toFixed(3)})`;
      return { el, g, tx, ty, sx, sy, sq, loose };
    });
    const at = (p, x, y) => `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    plan.forEach(p => { p.el.style.transform = at(p, p.sx, p.sy); p.g.style.transform = p.loose; });
    const done = () => { res.classList.add('on'); fx.querySelector('.dg-asm-f').classList.add('on'); fx.querySelector('.dg-asm-n').classList.add('on'); fx.querySelector('.dg-asm-a').classList.add('on'); };
    if (rm || !Element.prototype.animate) {
      plan.forEach(p => { p.el.style.opacity = 0; }); box.classList.add('on'); done(); setTimeout(() => TTS.speak(c), 200); return;
    }
    const ease = 'cubic-bezier(.3, 1.35, .45, 1)';
    plan.forEach((p, i) => {
      p.el.animate([{ opacity: 0, transform: at(p, p.sx, p.sy + 24) }, { opacity: 1, transform: at(p, p.sx, p.sy) }], { duration: 420, delay: 120 + i * 160, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
      p.el.querySelector('.dg-asm-l').animate([{ opacity: 0, transform: 'translate(-50%, 6px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 360, delay: 380 + i * 160, fill: 'both' });
    });
    const T1 = 1500 + plan.length * 120;
    plan.forEach((p, i) => {
      p.el.animate([{ transform: at(p, p.sx, p.sy) }, { transform: at(p, p.tx, p.ty) }], { duration: 720, delay: T1 + i * 70, easing: ease, fill: 'forwards' });
      p.g.animate([{ transform: p.loose }, { transform: p.sq }], { duration: 720, delay: T1 + i * 70, easing: ease, fill: 'forwards' });
      p.el.querySelector('.dg-asm-l').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: T1, fill: 'forwards' });
      setTimeout(() => tone([[520 + i * 130, 780 + i * 160, 0, .07, 'triangle']]), T1 + 520 + i * 70);
    });
    setTimeout(() => box.classList.add('on'), T1 + 200);
    const T2 = T1 + 900 + plan.length * 70;
    plan.forEach(p => p.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, delay: T2, fill: 'forwards' }));
    setTimeout(() => { done(); tone([[523, 1046, 0, .22], [784, 1568, .08, .4]]); }, T2);
    setTimeout(() => TTS.speak(c), T2 + 350);
  }

  /* ---------- events ---------- */
  function setBase(g) {
    if (!g) return false;
    const A = (D.amb || {})[g];
    if (A && !radOfGlyph.get(g) && !BONUS[g]) g = `${g}@${A[A.length - 1]}`;
    if (!D.cc[g] && !D.c[g] && !radOfGlyph.get(g) && !BONUS[g]) return false;
    const wasSky = isSky();
    st.mode = 'focus';
    st.trail = [g]; st.sel = null; st.open = {}; st.stageFilter = null;
    tone([[440, 880, 0, .12, 'square']]);
    if (wasSky) paint();
    else if (radial()) drawRadial(g, true);
    else if (isGrid()) drawGrid(g);
    else paint();
    return true;
  }

  function backToSky() {
    st.mode = 'sky';
    st.stageFilter = null;
    tone([[580, 440, 0, .09, 'sine']]);
    paint();
  }

  function bind() {
    let drag = null; const pts = new Map(); let pinch = 0;
    host.addEventListener('click', e => {
      const b = e.target.closest('button, [data-view]'); if (!b || (drag && drag.moved)) return;
      const d = b.dataset;
      if (d.close !== undefined) { const fx = host.querySelector('.dg-fx'); fx.hidden = true; fx.innerHTML = ''; return; }
      if (d.skyback !== undefined) { backToSky(); return; }
      if (d.sky) { setBase(d.sky); return; }
      if (d.skyall !== undefined) { st.skyAll = !st.skyAll; st.skyZone = 'all'; drawSky(); return; }
      if (d.zone) { st.skyZone = st.skyZone === d.zone && d.zone !== 'all' ? 'all' : d.zone; applySkyZone(true); return; }
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
      if (d.less) { delete st.open[d.less]; if (radial()) drawRadial(st.trail[st.trail.length - 1], true); else paint(); return; }
      if (d.trad !== undefined) { S().hzTrad = !trad(); Store.save(); paint(); if (typeof OffyTree !== 'undefined' && OffyTree.refresh) OffyTree.refresh(); return; }
      if (d.zoom !== undefined) {
        const v = host.querySelector('.dg-view');
        if (d.zoom === '0') {
          if (isSky()) { st.skyZone = 'all'; applySkyZone(true); }
          else if (radial() && lay) fitBox(lay.box, true, lay.hasMoreToggle);
          else drawTree();
        } else zoomAt(d.zoom === '1' ? 1.24 : 1 / 1.24, v.clientWidth / 2, v.clientHeight / 2);
        return;
      }
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
    host.addEventListener('keydown', e => {
      if (e.key === 'Escape') { const fx = host.querySelector('.dg-fx'); if (fx && !fx.hidden) { fx.hidden = true; fx.innerHTML = ''; } }
      if (e.key === 'Enter' && e.target.matches('.dg-q input')) {
        const g = Array.from(e.target.value.trim())[0];
        if (g && !setBase(g)) toast(`${T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้')}`, { icon: 'info' });
        else if (g) e.target.value = '';
      }
    });
    host.addEventListener('change', e => {
      if (!e.target.matches('.dg-q input')) return;
      const g = Array.from(e.target.value.trim())[0];
      if (g && !setBase(g)) toast(`${T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้')}`, { icon: 'info' });
      else if (g) e.target.value = '';
    });
    host.addEventListener('pointerdown', e => {
      const v = e.target.closest('.dg-view'); if (!v || e.target.closest('.dg-zoom, .dg-more-bar')) return;
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
    host.addEventListener('pointerover', e => { if (e.pointerType === 'touch' || isSky() || !radial()) return; const n = e.target.closest('.dg-n'); hover(n ? n.dataset.n : null); });
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
      radOfGlyph = new Map();
      D.r.forEach(r => {
        [r[1], ...r[8].map(f => f[0])].forEach(g => {
          radOfGlyph.set(key(g, r[0]), r);
          if (!AMB[g] || g === r[1]) radOfGlyph.set(g, r);
        });
      });
      const fc = new Map();
      formsOf = g => {
        if (!fc.has(g)) {
          const r = radOfGlyph.get(g);
          fc.set(g, new Set(r ? [r[1], ...r[8].map(f => f[0])].map(f => key(f, r[0])).concat(AMB[r[1]] ? [] : [r[1]]) : [g]));
        }
        return fc.get(g);
      };
      skyCache = null;
      bind(); paint();
    },
    refresh() { if (host && host.isConnected && D) paint(); },
    focus(c) { if (D && host && host.isConnected) { if (!setBase(c)) toast(T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้'), { icon: 'info' }); } }
  };
})();
