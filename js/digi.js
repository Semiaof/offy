'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — 汉字进化图鉴 · Hanzi & Word Evolution Star Map
   Dual-Realm 2-Level Star Map Engine:
     Realm 1 · 字 อักษร (Character Evolution):
       - Level 1 Sky Map: 5 semantic radical nebulae (214 Kangxi radicals)
       - Level 2 Focus: 100% real etymological genealogy with transitive reduction
         (STACK reduplication spine 木→林→森, 又→双→叒→叕 + multi-gen BRANCHES
         木→相→想/箱 + single-step LEAVES + 24 curated non-HSK BONUS stacked chars)
     Realm 2 · 词 คำศัพท์ (Shared-Character Word Constellation · 11,000 HSK words):
       - Level 1 Word Sky: 5 semantic nebulae of iconic Chinese morpheme hubs
       - Level 2 Word Focus: Left wing (□字 suffix) · Right wing (字□ prefix) ·
         Top wing (□字□ idioms) · Real 2→3+ syllable sub-chains (大学→大学生,
         电影→电影院) · Learned-status dots · Tap to speak + open 5-lang card +
         1-tap partner-character hopping (学 → 学生 → 生 → 生活 → 活!)
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

  const HSK_REP = {
    '林': 2, '森': 3, '从': 2, '众': 3, '双': 2, '炎': 2, '昌': 2, '晶': 3,
    '品': 3, '磊': 3, '多': 2, '朋': 2, '哥': 2, '羽': 2, '二': 2, '竹': 2,
    '赫': 2, '矗': 3, '棘': 2, '辨': 2, '兢': 2, '轰': 3
  };

  const STACK_PREVIEWS = {
    '木': '林→森', '人': '从→众', '又': '双→叒→叕', '水': '沝→淼', '火': '炎→焱',
    '土': '圭→垚', '口': '吅→品→㗊', '日': '昍→晶', '石': '砳→磊', '金': '鑫',
    '女': '奻→姦', '牛': '犇', '羊': '羴', '马': '骉', '犬': '猋', '鱼': '鱻',
    '车': '轰', '白': '皛', '心': '惢', '手': '掱', '田': '畾', '毛': '毳', '月@74': '朋', '夕': '多'
  };
  const QUICK_CHAINS = [
    ['木', '木 → 林 → 森'], ['人', '人 → 从 → 众'], ['又', '又 → 双 → 叒 → 叕'],
    ['水', '水 → 沝 → 淼'], ['火', '火 → 炎 → 焱'], ['土', '土 → 圭 → 垚'],
    ['口', '口 → 吅 → 品 → 㗊'], ['日', '日 → 昍 → 晶'], ['石', '石 → 砳 → 磊'], ['金', '金 → 鑫']
  ];

  /* Preferred simplified radical display glyphs (when !trad()) */
  const RAD_SIMP = {
    '艸': '艹', '辵': '辶', '攴': '攵', '糸': '纟', '貝': '贝', '車': '车',
    '馬': '马', '門': '门', '鳥': '鸟', '魚': '鱼', '龍': '龙', '頁': '页',
    '見': '见', '戶': '户', '靑': '青'
  };

  /* 5 Semantic Sky Nebulae for Realm 1 (Char Radicals) */
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

  /* 5 Semantic Sky Nebulae for Realm 2 (Word Morpheme Hubs) */
  const WORD_ZONES = [
    { id: 'study',  icon: '🎓', th: 'การเรียน & จิตใจ',   en: 'Study & Mind',
      chars: ['学', '心', '意', '思', '感', '情', '书', '话', '语', '文', '教', '理'] },
    { id: 'daily',  icon: '⚡', th: 'เทคโนโลยี & ชีวิต',  en: 'Tech & Life',
      chars: ['电', '机', '车', '家', '房', '衣', '饭', '菜', '钱', '店', '工', '场'] },
    { id: 'nature', icon: '🌿', th: 'ธรรมชาติ & เวลา',    en: 'Nature & Time',
      chars: ['水', '火', '天', '气', '风', '日', '年', '月', '时', '山', '花', '光'] },
    { id: 'people', icon: '🧍', th: 'คน & ร่างกาย',       en: 'People & Body',
      chars: ['人', '手', '口', '头', '面', '身', '生', '老', '友', '女', '子', '民'] },
    { id: 'core',   icon: '🚀', th: 'กิริยา & คำหลักฮิต', en: 'Core Verbs & Hubs',
      chars: ['大', '小', '高', '好', '新', '动', '发', '出', '行', '力', '用', '成', '公', '自', '无'] }
  ];
  const QUICK_WORD_HUBS = ['学', '电', '心', '水', '生', '手', '大', '高', '气', '机'];

  /* Phonetic Sound Family (声旁) fallback Pinyin & 3 Predictability Nebulae */
  const PHON_PY = { '尧': 'yáo', '佥': 'qiān', '圭': 'guī', '甬': 'yǒng', '亥': 'hài', '咅': 'pǒu', '曷': 'hé', '屯': 'tún' };
  const PHON_ZONES = [
    { id: 'exact', icon: '🟢', th: 'เดาเสียงแม่นมาก', en: 'High Accuracy',
      chars: ['方', '马', '令', '巴', '丁', '交', '青', '包', '羊', '半', '非', '龙', '干', '支', '由', '中', '生', '分'] },
    { id: 'near',  icon: '🟡', th: 'เสียงคล้ายเป็นชุด', en: 'Close Rime Family',
      chars: ['尚', '肖', '占', '艮', '少', '尧', '佥', '甬', '且', '隹', '京', '亥', '屯', '丬', '合', '加'] },
    { id: 'diff',  icon: '🔴', th: 'เสียงเปลี่ยนบ่อย ต้องระวัง', en: 'Watch Out (Shifted)',
      chars: ['者', '工', '白', '莫', '皮', '圭', '各', '欠', '古', '咅', '区', '曷'] }
  ];
  const QUICK_PHON = ['青', '方', '艮', '令', '尚', '肖', '占', '工', '莫', '皮'];
  const PH_META = {
    exact: { th: 'เสียงตรง',              sh: 'ตรง',     d: 'ออกเสียงเหมือนตัวแม่ (เปลี่ยนแค่เสียงวรรณยุกต์)' },
    near:  { th: 'เสียงคล้าย',            sh: 'คล้าย',   d: 'สระหรือพยัญชนะใกล้เคียงกับตัวแม่ พอเดาเสียงได้' },
    diff:  { th: 'เสียงเปลี่ยนต้องระวัง', sh: 'เปลี่ยน', d: 'เสียงอ่านเปลี่ยนไปจากตัวแม่ชัดเจน ต้องจำแยก!' }
  };
  const PH_ORDER = ['exact', 'near', 'diff'];

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
  const W_WINGS = {
    PRE: { th: 'ขึ้นต้นด้วยตัวนี้', sh: 'ขึ้นต้น', zh: '首' },
    SUF: { th: 'ลงท้ายด้วยตัวนี้',  sh: 'ลงท้าย',  zh: '尾' },
    SUB: { th: 'ต่อยอด 3–4 พยางค์', sh: 'ต่อยอด',  zh: '延' },
    MID: { th: 'กลางคำ / สำนวน',    sh: 'กลางคำ',  zh: '中' }
  };
  const W_ORDER = ['SUF', 'PRE', 'SUB', 'MID'];
  const COLW = 210, ROWH = 114, NODE = 92, PAD = 40;

  const st = {
    mode: 'sky',        // 'sky' = Level 1 Sky Map | 'focus' = Level 2 Constellation
    skyZone: 'all',
    skyAll: false,
    wSkyZone: 'all',
    pSkyZone: 'all',
    trail: ['木'],
    wTrail: ['学'],
    pTrail: ['青'],
    charForm: null,     // radical variant form filter (e.g. '氵' or '氺' for 水)
    wSel: null,         // currently selected word in Word Constellation
    pSel: null,         // currently selected char in Phonetic Constellation
    sel: null,
    open: {},           // char focus expanded satellites
    wOpen: {},          // word focus expanded words
    stageFilter: null,
    wFilter: null,
    pFilter: null,
    tx: 0, ty: 0, k: 1, fitted: false
  };
  let D = null, host = null, rad = null, formsOf = null, radOfGlyph = null, tree = null;
  let cur = new Map(), anim = 0, lay = null, skyLay = null, wLay = null, wSkyLay = null, pLay = null, pSkyLay = null;

  Object.assign(window.OFFY_EN || {}, {
    'สายวิวัฒนาการ': 'Character families', 'สายวิวัฒนาการอักษร': 'Character families',
    'อักษรตั้งต้น': 'Base character', 'ซ้ำร่างวิวัฒนาการ': 'Reduplicated evolution',
    'ใช้เป็นส่วนบอกเสียง': 'As sound part', 'ใช้เป็นส่วนบอกความหมาย': 'As meaning part',
    'อักษรผสมความหมาย': 'Meaning compound', 'ความสัมพันธ์อื่น': 'Other link', 'ส่วนประกอบ': 'Component',
    'จุดเริ่มต้นของตระกูลอักษรนี้': 'Where this family starts',
    'การประกอบอักษร': 'How it is built', 'ดูการประกอบอักษร': 'See how it is built',
    'รูปเขียนตามภูมิภาค': 'Regional forms',
    'ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้': 'No HSK character builds on this one',
    'ยังไม่มีคำศัพท์ HSK ที่ใช้ตัวอักษรนี้': 'No HSK compound words with this character',
    'บอกความหมาย': 'meaning', 'บอกเสียง': 'sound', 'เล่นอีกครั้ง': 'Play again',
    'ทั้งหมด': 'All', 'กลุ่มดาว': 'Star map', 'รอบตัว': 'Constellation', 'กริด': 'Grid', 'ขวา': 'Tree',
    'ท้องฟ้าทั้งหมด': 'All constellations', 'ท้องฟ้าคำศัพท์': 'Word hubs sky',
    'ดูทั้งหมดในโหมดกริด': 'See all in Grid', 'ส่วนที่เพิ่ม': 'Added part', 'โครงสร้าง': 'Structure',
    'คำที่ใช้ตัวนี้': 'Words with it', 'อักษร': 'Chars', 'คำศัพท์': 'Words',
    'แตะตัวไหนก็ได้เพื่อย้ายมาไว้ตรงกลาง': 'Tap any star to explore its real lineage',
    'แตะคำเพื่อฟังเสียงและดูรายละเอียด · แตะตัวกลางดูสรุป': 'Tap any word to hear & inspect · hop via partner chars',
    'แตะรากศัพท์เพื่อเจาะเข้ากลุ่มดาว · ลากหรือซูมได้': 'Tap any radical star to explore · drag or pinch to zoom',
    'แตะอักษรแม่คำเพื่อดูกลุ่มดาวคำศัพท์ · ลากหรือซูมได้': 'Tap any morpheme hub to explore its word cluster',
    'ลากเพื่อเลื่อน · หมุนล้อหรือบีบเพื่อซูม': 'Drag to pan · wheel or pinch to zoom',
    'ไต้หวัน': 'Taiwan', 'ญี่ปุ่น': 'Japanese', 'เพิ่มอีก': 'more', 'หมวดนำ': 'Radical',
    'นอก HSK': 'Outside HSK', 'ดาวบริวารอีก': 'more satellites',
    'ซ่อนดาวบริวาร (เหลือเฉพาะสายหลัก)': 'Show main chains only',
    'แสดงรากทั้งหมด': 'Show all radicals', 'แสดงเฉพาะรากหลัก': 'Major radicals only',
    'ค้นหาอักษรหรือราก เช่น 木, 森, 想, 叒…': 'Search char or radical e.g. 木, 森, 想, 叒…',
    'ค้นหาแม่คำ หรือคำศัพท์ เช่น 学, 电, 心, 电影…': 'Search hub char or word e.g. 学, 电, 心, 电影…',
    'ท้องฟ้ากลุ่มดาวรากศัพท์': 'Radical Constellation Sky',
    'ท้องฟ้ากลุ่มดาวคำศัพท์': 'Shared-Char Word Galaxy',
    'สายซ้ำร่างเด่น': 'Iconic Reduplication Chains',
    'แม่คำยอดฮิต': 'Popular Word Hubs',
    'ขึ้นต้นด้วยตัวนี้': 'Starts with char', 'ลงท้ายด้วยตัวนี้': 'Ends with char',
    'ต่อยอด 3–4 พยางค์': '3–4 char extensions', 'กลางคำ / สำนวน': 'Middle / idioms',
    'ขึ้นต้น': 'Prefix', 'ลงท้าย': 'Suffix', 'ต่อยอด': 'Extended', 'กลางคำ': 'Middle',
    'ดูเพิ่มอีก': 'more words', 'ย่อเหลือคำหลัก': 'Show core words',
    'เปิดการ์ด 5 ภาษา': 'Open 5-lang card', 'กระโดดไปกลุ่มดาวคำของ…': 'Hop to partner char…',
    'ดูสายวิวัฒนาการอักษร': 'View char evolution', 'ดูกลุ่มดาวคำของตัวนี้': 'View word constellation',
    'คำ': 'words', 'ยังไม่เรียน': 'New',
    'เสียงพ้อง': 'Sounds', 'ท้องฟ้าแกนเสียง': 'Phonetic Sound Sky',
    'เสียงตรง': 'Exact sound', 'เสียงคล้าย': 'Close sound', 'เสียงเปลี่ยนต้องระวัง': 'Shifted (watch out!)', 'เสียงเปลี่ยน': 'Shifted',
    'ตรง': 'Exact', 'คล้าย': 'Close', 'เปลี่ยน': 'Shifted',
    'แกนเสียงยอดฮิต': 'Top Phonetic Families', 'ดูกลุ่มดาวเสียงพ้อง': 'View sound family',
    'รูปแปลงร่าง': 'Variant forms', 'ยังไม่มีอักษร HSK ที่ใช้แกนเสียงนี้': 'No HSK characters use this phonetic base',
    'ค้นหาแกนเสียง เช่น 青, 方, 艮, 令, 占…': 'Search phonetic base e.g. 青, 方, 艮, 令, 占…',
    'แตะแกนเสียงเพื่อดูความแม่นของเสียงอ่าน · กรอบสียังคงเป็นระดับ HSK': 'Tap any phonetic base · box borders remain HSK levels',
    'แตะอักษรเพื่อเทียบเสียงอ่านและฟังเสียง · กรอบสี = ระดับ HSK': 'Tap any char to compare pronunciation · border = HSK level'
  });

  /* ---------- realm, simplified/traditional & common helpers ---------- */
  const realm = () => (S().digiRealm === 'word' ? 'word' : S().digiRealm === 'phon' ? 'phon' : 'char');
  const isWord = () => realm() === 'word';
  const isPhon = () => realm() === 'phon';
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
  const showWord = zh => {
    if (!trad()) return zh;
    return [...String(zh || '')].map(ch => (D.c[ch] && D.c[ch][8]) ? D.c[ch][8] : ch).join('');
  };
  const markWord = (zh, focusChar) => {
    const f = base(focusChar);
    return [...String(zh || '')].map(ch => {
      const disp = (trad() && D.c[ch] && D.c[ch][8]) ? D.c[ch][8] : ch;
      return ch === f ? `<mark>${esc2(disp)}</mark>` : esc2(disp);
    }).join('');
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
  const lvWordC = lv => ` style="--lc:var(--hsk${lv || 'C'})"`;
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
    if (PHON_PY[c]) return PHON_PY[c];
    const r = radOfGlyph.get(c);
    return r ? r[3] : '';
  };
  const matchPy = (pyA, pyB) => (typeof HzKit !== 'undefined' && HzKit.matchPhonetic) ? HzKit.matchPhonetic(pyA, pyB) : '';
  const pyBadgeHTML = (pyTxt, acc) => acc
    ? `<span class="pyx ph-b ph-${acc}" title="${esc2(T(PH_META[acc].th))}"><i></i>${esc2(pyTxt)}</span>`
    : `<span class="pyx">${esc2(pyTxt)}</span>`;
  const partsRaw = c => {
    if (BONUS[c]) return BONUS[c].parts;
    return (D.c[c] && D.c[c][4]) || [];
  };

  /* ---------- True Etymological Relations (Char Realm) ---------- */
  function isStackedChild(c, p) {
    const fs = formsOf(p);
    if (c === '轰') return fs.has('车') || fs.has('車');
    if (BONUS[c]) return BONUS[c].parent === p || fs.has(BONUS[c].parent);
    const ps = partsRaw(c);
    if (ps.length >= 2 && ps.every(q => fs.has(q))) return true;
    if (HSK_REP[c] && HSK_REP[c] >= 3 && ps.some(q => fs.has(q))) {
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
    if (BONUS[p] && parts.some(q => forms.has(q) || forms.has(base(q)))) return 'ULTIMATE';
    return null;
  }

  const catalyst = (c, p) => {
    const forms = formsOf(p), parts = partsRaw(c);
    const rest = parts.filter(q => !forms.has(q));
    return rest.length ? rest : parts.slice(1);
  };

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

  function directKidsOf(p, except) {
    const raw = rawKidsOf(p, except);
    const rawSet = new Set(raw);
    const direct = raw.filter(c => {
      if (BONUS[c] && rawSet.has(BONUS[c].parent)) return false;
      const ps = partsRaw(c);
      for (const q of ps) if (q !== c && rawSet.has(q)) return false;
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

  /* ---------- Fast deterministic hash & AABB zero-overlap solvers ---------- */
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

  /* Variable-width AABB solver for Word Constellation capsules (2-char vs 3-char vs 4-char idioms) */
  function relaxBoxes(nodes, pinFirst, padX = 16, padY = 12, passes = 30) {
    for (let pass = 0; pass < passes; pass++) {
      let moved = false;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const isPin = pinFirst && i === 0;
          const rw = (a.bw + b.bw) / 2 + padX, rh = (a.bh + b.bh) / 2 + padY;
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
     REALM 1 · LEVEL 1 — RADICAL SKY MAP LAYOUT
     ===================================================================== */
  let skyCache = null;
  function buildSkyCatalog() {
    if (skyCache) return skyCache;
    const AMB = D.amb || {}, items = [];
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
      const major = cnt >= 27 || hasBonus || [74, 93, 195, 196, 174, 82, 173, 212, 169, 145, 184, 15, 36, 142, 159].includes(no);
      items.push({ no, key, r, cnt, major, zone: zoneOfNo(no), preview: STACK_PREVIEWS[key] || STACK_PREVIEWS[orig] || '' });
    }
    items.sort((a, b) => b.cnt - a.cnt || a.no - b.no);
    skyCache = items;
    return items;
  }

  function layoutNebulae(zoneList, byZoneMap, gap = 64) {
    const asp = Math.max(.68, Math.min(1.8, viewAspect()));
    const portrait = asp < 0.92;
    const GOLDEN = 2.39996323;
    const zoneClusters = new Map();

    for (const z of zoneList) {
      const arr = byZoneMap.get(z.id) || [];
      const local = arr.map((it, i) => {
        const ang = i * GOLDEN + hash01(it.key) * 0.4;
        const radDist = i === 0 ? 0 : 90 * Math.sqrt(i) + (hash01(it.key + 'r') - 0.5) * 14;
        return {
          ...it, zone: z.id,
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

    const ids = zoneList.map(z => z.id);
    const offsets = {};
    if (ids.length === 3) {
      const [z0, z1, z2] = ids.map(id => zoneClusters.get(id));
      if (portrait) {
        const y1 = 0, y2 = z0.h / 2 + z1.h / 2 + gap, y3 = y2 + z1.h / 2 + z2.h / 2 + gap;
        offsets[ids[0]] = [0, y1]; offsets[ids[1]] = [0, y2]; offsets[ids[2]] = [0, y3];
      } else {
        const topH = Math.max(z0.h, z1.h), yTop = -(topH / 2 + gap * .45), yBot = +(z2.h / 2 + gap * .45);
        offsets[ids[0]] = [-(z0.w / 2 + gap * .55), yTop];
        offsets[ids[1]] = [+(z1.w / 2 + gap * .55), yTop];
        offsets[ids[2]] = [0, yBot];
      }
    } else {
      const [z0, z1, z2, z3, z4] = ids.map(id => zoneClusters.get(id));
      if (portrait) {
        const r1H = Math.max(z0.h, z1.h), r2H = Math.max(z2.h, z3.h);
        const y1 = 0, y2 = r1H / 2 + r2H / 2 + gap, y3 = y2 + r2H / 2 + z4.h / 2 + gap;
        offsets[ids[0]] = [-(z0.w / 2 + gap * .45), y1];
        offsets[ids[1]] = [+(z1.w / 2 + gap * .45), y1];
        offsets[ids[2]] = [-(z2.w / 2 + gap * .45), y2];
        offsets[ids[3]] = [+(z3.w / 2 + gap * .45), y2];
        offsets[ids[4]] = [0, y3];
      } else {
        const topH = Math.max(z0.h, z1.h), botH = Math.max(z3.h, z4.h, z2.h);
        const yTop = -(topH / 2 + gap * .45), yBot = +(botH / 2 + gap * .45);
        offsets[ids[0]] = [-(z0.w / 2 + gap * .55), yTop];
        offsets[ids[1]] = [+(z1.w / 2 + gap * .55), yTop];
        offsets[ids[3]] = [-(z4.w / 2 + z3.w / 2 + gap * .9), yBot];
        offsets[ids[4]] = [0, yBot + 16];
        offsets[ids[2]] = [+(z4.w / 2 + z2.w / 2 + gap * .9), yBot];
      }
    }

    const nodes = [], links = [], labels = [], zoneBoxes = {};
    for (const z of zoneList) {
      const cl = zoneClusters.get(z.id);
      if (!cl || !cl.nodes.length) continue;
      const [ox, oy] = offsets[z.id];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      cl.nodes.forEach(n => {
        n.x += ox; n.y += oy;
        nodes.push(n);
        minX = Math.min(minX, n.x - 58); maxX = Math.max(maxX, n.x + 58);
        minY = Math.min(minY, n.y - 68); maxY = Math.max(maxY, n.y + 62);
      });
      // Prim's MST inside each semantic nebula (delicate constellation chart strokes)
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
      labels.push({ id: z.id, icon: z.icon, title: LANG === 'en' ? z.en : z.th, count: cl.nodes.length, x: (minX + maxX) / 2, y: minY - 30 });
      zoneBoxes[z.id] = { minX: minX - 24, maxX: maxX + 24, minY: minY - 68, maxY: maxY + 24 };
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => { minX = Math.min(minX, n.x - 62); maxX = Math.max(maxX, n.x + 62); minY = Math.min(minY, n.y - 74); maxY = Math.max(maxY, n.y + 64); });
    labels.forEach(l => { minY = Math.min(minY, l.y - 28); });
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    nodes.forEach(n => { n.x -= cx; n.y -= cy; });
    labels.forEach(l => { l.x -= cx; l.y -= cy; });
    Object.values(zoneBoxes).forEach(b => { b.minX -= cx; b.maxX -= cx; b.minY -= cy; b.maxY -= cy; });
    return { nodes, links, labels, zoneBoxes, box: { minX: minX - cx - 28, maxX: maxX - cx + 28, minY: minY - cy - 28, maxY: maxY - cy + 48 }, asp };
  }

  function layoutSky() {
    const allItems = buildSkyCatalog();
    const list = st.skyAll ? allItems : allItems.filter(it => it.major);
    const byZone = new Map(ZONES.map(z => [z.id, []]));
    list.forEach(it => {
      const tier = it.cnt >= 70 ? 0 : it.cnt >= 25 ? 1 : 2;
      (byZone.get(it.zone) || byZone.get('form')).push({ ...it, tier });
    });
    byZone.forEach(arr => arr.sort((a, b) => (b.preview ? 1 : 0) - (a.preview ? 1 : 0) || b.cnt - a.cnt));
    const res = layoutNebulae(ZONES, byZone, 64);
    return { ...res, totalActive: allItems.length, shown: res.nodes.length };
  }

  /* =====================================================================
     REALM 1 · LEVEL 2 — TRUE GENEALOGY CONSTELLATION LAYOUT
     ===================================================================== */
  function layoutConstellation(f) {
    const nodes = [{ key: f, c: f, x: 0, y: 0, ring: 0, kind: 'root', stage: stageForFocus(f) }];
    const links = [];
    const used = new Set([f]);

    const parts = partsOf(f).map(q => ({ c: q, stage: 'PART' }));
    parts.forEach(p => used.add(p.c));
    let direct = directKidsOf(f, used);

    // Radical variant form filter (e.g. 水 → 水 / 氵 三点水 / 氺 水字底)
    const rObj = radOfGlyph.get(f);
    const formBuckets = (rObj && typeof HzKit !== 'undefined' && HzKit.radFormBuckets)
      ? HzKit.radFormBuckets(direct.filter(c => !!D.c[c]), rObj, D) : [];
    if (st.charForm && !formBuckets.some(b => b.key === st.charForm)) st.charForm = null;
    if (st.charForm) {
      const hit = formBuckets.find(b => b.key === st.charForm);
      const allow = new Set(hit ? hit.chars : []);
      direct = direct.filter(c => allow.has(c));
    }

    const stackRoots = [], branchItems = [], leafItems = [];
    for (const c of direct) {
      const stg = stageOf(c, f);
      if (stg === 'STACK') stackRoots.push({ c, stage: 'STACK' });
      else {
        const gTest = directKidsOf(c, new Set([f, c]));
        if (gTest.length > 0) branchItems.push({ c, stage: stg, gCount: gTest.length });
        else leafItems.push({ c, stage: stg });
      }
    }

    branchItems.sort((a, b) => b.gCount - a.gCount || ((D.c[a.c] || [])[1] || 9) - ((D.c[b.c] || [])[1] || 9));
    leafItems.sort((a, b) => ((D.c[a.c] || [])[1] || 9) - ((D.c[b.c] || [])[1] || 9) || ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage));

    const mobile = innerWidth < 700, tablet = innerWidth >= 700 && innerWidth < 1100;
    const isExpanded = !!st.open[f];
    const hasHeroChains = stackRoots.length > 0 || branchItems.length > 0;

    const maxBranches = isExpanded ? branchItems.length : (mobile ? 4 : tablet ? 7 : 9);
    const maxGPerBranch = isExpanded ? 6 : (mobile ? 4 : 5);
    const maxLeaves = isExpanded
      ? leafItems.length
      : (hasHeroChains ? (mobile ? 5 : tablet ? 8 : 10) : (mobile ? 14 : tablet ? 24 : 32));

    const pickedBranches = branchItems.slice(0, maxBranches);
    const pickedLeaves = leafItems.slice(0, maxLeaves);
    const more = (branchItems.length - pickedBranches.length) + (leafItems.length - pickedLeaves.length);

    stackRoots.forEach(s => used.add(s.c));
    pickedBranches.forEach(b => used.add(b.c));
    pickedLeaves.forEach(l => used.add(l.c));

    const stackChains = stackRoots.map(sr => {
      const spine = [];
      let curC = sr.c, depth = 1;
      while (curC && depth <= 4) {
        const kids = directKidsOf(curC, used);
        let nextSpine = kids.find(k => stageOf(k, curC) === 'STACK');
        const sideKids = kids.filter(k => k !== nextSpine).slice(0, isExpanded ? 6 : (mobile ? 3 : 5));
        if (nextSpine) used.add(nextSpine);
        sideKids.forEach(k => used.add(k));
        spine.push({ c: curC, depth, sideKids: sideKids.map(k => ({ c: k, stage: stageOf(k, curC) || 'ULTIMATE' })) });
        curC = nextSpine;
        depth++;
      }
      return spine;
    });

    const branchTrees = pickedBranches.map(b => {
      const gk = directKidsOf(b.c, used).slice(0, maxGPerBranch);
      gk.forEach(k => used.add(k));
      return { ...b, kids: gk.map(k => ({ c: k, stage: stageOf(k, b.c) || 'CHAMPION' })) };
    });

    const nSpines = stackChains.length;
    stackChains.forEach((spine, si) => {
      const xBase = nSpines > 1 ? (si - (nSpines - 1) / 2) * 168 : 0;
      let prevKey = f;
      spine.forEach((step, idx) => {
        const x = xBase + (idx > 0 ? (si === 0 && nSpines > 1 ? -16 : si > 0 ? 16 : 0) : 0);
        const y = -(158 + idx * 146);
        nodes.push({ key: step.c, c: step.c, x, y, ring: idx === 0 ? 1 : 2, kind: 'stack', stage: 'STACK' });
        links.push({ from: prevKey, to: step.c, stage: 'STACK', kind: 'stack' });

        step.sideKids.forEach((child, ci) => {
          const dir = ci % 2 === 0 ? 1 : -1;
          const rank = Math.floor(ci / 2);
          const sx = x + dir * (138 + rank * 78);
          const sy = y - 24 + (rank % 2 === 0 ? -36 : 44) - idx * 8;
          nodes.push({ key: child.c, c: child.c, x: sx, y: sy, ring: 2, kind: 'branch-leaf', stage: child.stage });
          links.push({ from: step.c, to: child.c, stage: child.stage, kind: 'branch' });
        });
        prevKey = step.c;
      });
    });

    if (parts.length) {
      const startA = -Math.PI * 0.88, spanA = Math.min(0.85, parts.length * 0.34);
      parts.forEach((p, i) => {
        const a = startA + (parts.length > 1 ? (i / (parts.length - 1)) * spanA : spanA / 2);
        nodes.push({ key: p.c, c: p.c, x: Math.cos(a) * 164, y: Math.sin(a) * 164, ring: 1, kind: 'part', stage: 'PART' });
        links.push({ from: p.c, to: f, stage: 'PART', kind: 'part' });
      });
    }

    const topReserve = nSpines ? (stackChains.some(sp => sp.some(s => s.sideKids.length > 0)) ? 1.15 : 0.62) : 0;
    const partReserve = parts.length ? 0.85 : 0;
    const aStart = -Math.PI / 2 + topReserve / 2 + 0.14;
    const aEnd = Math.PI * 1.5 - topReserve / 2 - partReserve - 0.14;
    const totalArc = Math.max(1.2, aEnd - aStart);

    const hasExpandedLeaves = isExpanded && pickedLeaves.length > 16;
    const branchWeight = branchTrees.reduce((sum, b) => sum + 1.15 + Math.min(4, b.kids.length) * 0.42, 0);
    const leafWeight = (hasExpandedLeaves ? Math.min(18, pickedLeaves.length) : pickedLeaves.length) * 0.56;
    const totalWeight = Math.max(1, branchWeight + leafWeight);

    let cursor = aStart;
    const branchArcTotal = totalArc * (branchWeight / totalWeight);
    const leafArcTotal = totalArc - branchArcTotal;
    const bCount = branchTrees.length, rightHalf = Math.ceil(bCount / 2);
    const rightBranches = branchTrees.slice(0, rightHalf), leftBranches = branchTrees.slice(rightHalf);

    const placeBranch = (b, ang, slotArc) => {
      const r1 = bCount > 6 ? 196 : 174;
      const bx = Math.cos(ang) * r1, by = Math.sin(ang) * r1;
      nodes.push({ key: b.c, c: b.c, x: bx, y: by, ring: 1, kind: 'branch', stage: b.stage });
      links.push({ from: f, to: b.c, stage: b.stage, kind: 'branch' });
      const gk = b.kids;
      const fanSpread = Math.min(Math.max(slotArc * 1.15, 0.42), gk.length > 3 ? 1.38 : 0.95);
      gk.forEach((g, gi) => {
        const off = gk.length > 1 ? ((gi / (gk.length - 1)) - 0.5) * fanSpread : 0;
        const ga = ang + off, r2 = 142 + (gk.length > 4 && gi % 2 === 1 ? 36 : 0);
        nodes.push({ key: g.c, c: g.c, x: bx + Math.cos(ga) * r2, y: by + Math.sin(ga) * r2, ring: 2, kind: 'branch-leaf', stage: g.stage });
        links.push({ from: b.c, to: g.c, stage: g.stage, kind: 'branch' });
      });
    };

    rightBranches.forEach(b => {
      const w = 1.15 + Math.min(4, b.kids.length) * 0.42;
      const slot = branchWeight ? branchArcTotal * (w / branchWeight) : 0;
      placeBranch(b, cursor + slot / 2, slot);
      cursor += slot;
    });

    if (pickedLeaves.length) {
      const leafStart = cursor, leafSpan = Math.max(0.55, leafArcTotal);
      if (!hasExpandedLeaves) {
        const perArc = Math.max(4, Math.floor((leafSpan * 185) / 118));
        let idx = 0, layer = 0;
        while (idx < pickedLeaves.length) {
          const r = 164 + layer * 126;
          const cap = Math.max(perArc, Math.floor((leafSpan * r) / 114));
          const take = Math.min(pickedLeaves.length - idx, cap);
          for (let j = 0; j < take; j++) {
            const lf = pickedLeaves[idx + j];
            const ang = leafStart + (take > 1 ? (j + 0.5) / take : 0.5) * leafSpan;
            const jit = (hash01(lf.c) - 0.5) * 18;
            nodes.push({ key: lf.c, c: lf.c, x: Math.cos(ang) * (r + jit), y: Math.sin(ang) * (r + jit), ring: 1, kind: 'leaf', stage: lf.stage });
            links.push({ from: f, to: lf.c, stage: lf.stage, kind: 'leaf' });
          }
          idx += take; layer++;
        }
      } else {
        let idx = 0, ringR = 395;
        while (idx < pickedLeaves.length) {
          const cap = Math.max(12, Math.floor((2 * Math.PI * ringR) / 122));
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

    leftBranches.forEach(b => {
      const w = 1.15 + Math.min(4, b.kids.length) * 0.42;
      const slot = branchWeight ? branchArcTotal * (w / branchWeight) : 0;
      placeBranch(b, cursor + slot / 2, slot);
      cursor += slot;
    });

    relaxOverlap(nodes, true, 104, 114, 128, 134, 28);

    let minX = -150, maxX = 150, minY = -150, maxY = 150;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x - 64); maxX = Math.max(maxX, n.x + 64);
      minY = Math.min(minY, n.y - 72); maxY = Math.max(maxY, n.y + 66);
    });
    const sectors = ORDER.map(s2 => {
      const n = nodes.filter(nd => nd.ring > 0 && nd.stage === s2).length;
      return n ? { s: s2, n } : null;
    }).filter(Boolean);

    return {
      nodes, links, sectors, more, isExpanded, formBuckets,
      hasMoreToggle: more > 0 || (isExpanded && (leafItems.length > (hasHeroChains ? 8 : 20) || branchItems.length > 7)),
      box: { minX: minX - 24, maxX: maxX + 24, minY: minY - 24, maxY: maxY + 24 },
      asp: viewAspect()
    };
  }

  /* =====================================================================
     REALM 3 · PHONETIC SOUND FAMILIES (声旁 · 🟢 เสียงตรง / 🟡 คล้าย / 🔴 เปลี่ยน)
     HSK level colored borders on every box remain 100% UNTOUCHED!
     ===================================================================== */
  function phonKidsOf(f) {
    const b = base(f), fs = formsOf(f), basePy = pyOf(b);
    const out = [];
    for (const [c, x] of Object.entries(D.c)) {
      if (c === b || !lvOk(x[1])) continue;
      const isSound = (x[12] && (x[12] === b || fs.has(x[12]))) || (stageOf(c, f) === 'ARMOR');
      if (!isSound) continue;
      const acc = matchPy(basePy, x[0]) || 'diff';
      out.push({ c, x, acc });
    }
    const ord = { exact: 0, near: 1, diff: 2 };
    out.sort((a, b2) => ord[a.acc] - ord[b2.acc] || a.x[1] - b2.x[1]);
    return out;
  }

  function layoutPhonSky() {
    const byZone = new Map(PHON_ZONES.map(z => [z.id, []]));
    for (const z of PHON_ZONES) {
      const arr = byZone.get(z.id);
      for (const ch of z.chars) {
        const ks = phonKidsOf(ch);
        if (!ks.length) continue;
        const cE = ks.filter(k => k.acc === 'exact').length;
        const cN = ks.filter(k => k.acc === 'near').length;
        const cD = ks.filter(k => k.acc === 'diff').length;
        const tier = ks.length >= 10 ? 0 : ks.length >= 7 ? 1 : 2;
        arr.push({ key: ch, cnt: ks.length, tier, cE, cN, cD });
      }
      arr.sort((a, b) => b.cnt - a.cnt);
    }
    return layoutNebulae(PHON_ZONES, byZone, 66);
  }

  function layoutPhonConstellation(rawFocus) {
    const f = base(rawFocus), basePy = pyOf(f);
    const all = phonKidsOf(f);
    const byAcc = { exact: [], near: [], diff: [] };
    all.forEach(it => byAcc[it.acc].push(it));

    const nodes = [{ key: f, c: f, x: 0, y: 0, ring: 0, acc: 'root', kind: 'root' }];
    const links = [];
    const activeGroups = PH_ORDER.filter(k => byAcc[k].length > 0);

    // Place 🟢 exact at TOP, 🟡 near at BOTTOM-RIGHT, 🔴 diff at BOTTOM-LEFT — labels sit OUTWARD (0 collisions!)
    const sectorPlan = activeGroups.length === 1
      ? [[activeGroups[0], -Math.PI / 2, Math.PI * 1.9]]
      : activeGroups.length === 2
      ? [[activeGroups[0], -Math.PI * 0.5, Math.PI * 0.92], [activeGroups[1], Math.PI * 0.5, Math.PI * 0.92]]
      : [['exact', -Math.PI * 0.5, Math.PI * 0.72], ['near', Math.PI * 0.28, Math.PI * 0.58], ['diff', Math.PI * 0.78, Math.PI * 0.48]];

    for (const [acc, centerA, spanA] of sectorPlan) {
      const list = byAcc[acc];
      if (!list || !list.length) continue;
      let idx = 0, layer = 0;
      while (idx < list.length) {
        const r = 182 + layer * 134;
        const cap = Math.max(4, Math.floor((spanA * r) / 118));
        const take = Math.min(list.length - idx, cap);
        for (let j = 0; j < take; j++) {
          const it = list[idx + j];
          const t = take > 1 ? (j / (take - 1) - 0.5) : 0;
          const ang = centerA + t * Math.min(spanA, (take - 1) * 0.36 + 0.2);
          nodes.push({ key: it.c, c: it.c, x: Math.cos(ang) * r, y: Math.sin(ang) * r, ring: 1, acc, kind: 'phon' });
          links.push({ from: f, to: it.c, acc, kind: 'ph' + acc });
        }
        idx += take; layer++;
      }
    }

    relaxOverlap(nodes, true, 108, 118, 128, 136, 26);

    const groupLabels = [];
    const iconOf = { exact: '🟢', near: '🟡', diff: '🔴' };
    for (const acc of activeGroups) {
      const grp = nodes.filter(n => n.acc === acc);
      if (!grp.length) continue;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, sumY = 0;
      grp.forEach(n => {
        minX = Math.min(minX, n.x - 56); maxX = Math.max(maxX, n.x + 56);
        minY = Math.min(minY, n.y - 62); maxY = Math.max(maxY, n.y + 56);
        sumY += n.y;
      });
      const avgY = sumY / grp.length;
      const ly = avgY <= 10 ? minY - 32 : maxY + 26;
      const lbl = acc === 'diff' ? `${iconOf[acc]} ${T('เสียงเปลี่ยน')} (${grp.length})` : `${iconOf[acc]} ${T(PH_META[acc].th)} (${grp.length})`;
      groupLabels.push({ acc, text: lbl, x: (minX + maxX) / 2, y: ly });
    }

    let minX = -160, maxX = 160, minY = -160, maxY = 160;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x - 66); maxX = Math.max(maxX, n.x + 66);
      minY = Math.min(minY, n.y - 76); maxY = Math.max(maxY, n.y + 66);
    });
    groupLabels.forEach(lb => { minY = Math.min(minY, lb.y - 24); maxY = Math.max(maxY, lb.y + 24); });

    return {
      f, basePy, nodes, links, groupLabels,
      counts: { exact: byAcc.exact.length, near: byAcc.near.length, diff: byAcc.diff.length },
      total: all.length,
      box: { minX: minX - 24, maxX: maxX + 24, minY: minY - 24, maxY: maxY + 24 },
      asp: viewAspect()
    };
  }

  /* =====================================================================
     REALM 2 · LEVEL 1 — WORD HUB SKY MAP (5 Semantic Morpheme Nebulae)
     ===================================================================== */
  function wordsForChar(ch) {
    const f = base(ch), seen = new Set(), out = [];
    for (const idx of (D.cw[f] || [])) {
      const w = D.w[idx];
      if (!w || !lvOk(w[2]) || [...w[0]].length < 2 || seen.has(w[0])) continue;
      seen.add(w[0]);
      out.push(w);
    }
    return out;
  }

  function layoutWordSky() {
    const byZone = new Map(WORD_ZONES.map(z => [z.id, []]));
    for (const z of WORD_ZONES) {
      const arr = byZone.get(z.id);
      for (const ch of z.chars) {
        const ws = wordsForChar(ch);
        if (!ws.length) continue;
        const top2 = ws.slice().sort((a, b) => a[2] - b[2] || a[0].length - b[0].length).slice(0, 2).map(w => showWord(w[0]));
        const tier = ws.length >= 55 ? 0 : ws.length >= 28 ? 1 : 2;
        arr.push({ key: ch, cnt: ws.length, tier, preview: top2.join('·') });
      }
      arr.sort((a, b) => b.cnt - a.cnt);
    }
    return layoutNebulae(WORD_ZONES, byZone, 62);
  }

  /* =====================================================================
     REALM 2 · LEVEL 2 — SHARED-CHAR WORD CONSTELLATION LAYOUT
     Left Wing (□字 suffix) · Right Wing (字□ prefix) · Top Wing (□字□ idioms)
     Real 2-char → 3–4 char Sub-Chains (大学→大学生, 电影→电影院) + Variable AABB!
     ===================================================================== */
  function layoutWordConstellation(rawFocus) {
    const f = base(rawFocus);
    const allWords = wordsForChar(f);
    const byZh = new Map(allWords.map(w => [w[0], w]));

    // Separate 2-char base words vs 3+ char words and attach real 2→3+ sub-chains!
    const twoWords = allWords.filter(w => [...w[0]].length === 2);
    const subMap = new Map();
    const attached = new Set();
    for (const w of allWords) {
      if ([...w[0]].length < 3) continue;
      // Prefer exact prefix match (大学→大学生, 留学→留学生, 电影→电影院) before suffix/substring (电话→打电话)
      let bestP = null, bestScore = -1;
      for (const w2 of twoWords) {
        if (!w[0].includes(w2[0])) continue;
        const score = (w[0].startsWith(w2[0]) ? 100 : 0) + (10 - (w2[2] || 9));
        if (score > bestScore) { bestScore = score; bestP = w2; }
      }
      if (bestP) {
        if (!subMap.has(bestP[0])) subMap.set(bestP[0], []);
        subMap.get(bestP[0]).push(w);
        attached.add(w[0]);
      }
    }
    subMap.forEach(arr => arr.sort((a, b) => a[2] - b[2] || a[0].length - b[0].length));

    // Classify root words (not attached as sub-children) into SUF (left □f), PRE (right f□), MID (top □f□)
    const sufAll = [], preAll = [], midAll = [];
    for (const w of allWords) {
      if (attached.has(w[0])) continue;
      const chars = [...w[0]];
      if (chars[0] === f) preAll.push(w);
      else if (chars[chars.length - 1] === f) sufAll.push(w);
      else midAll.push(w);
    }
    const sortW = (a, b) => ((subMap.get(b[0]) || []).length > 0 ? 1 : 0) - ((subMap.get(a[0]) || []).length > 0 ? 1 : 0)
      || a[2] - b[2] || a[0].length - b[0].length;
    sufAll.sort(sortW); preAll.sort(sortW); midAll.sort(sortW);

    const mobile = innerWidth < 700, tablet = innerWidth >= 700 && innerWidth < 1100;
    const isExpanded = !!st.wOpen[f];
    const baseSide = isExpanded ? 30 : (mobile ? 5 : tablet ? 8 : 10);
    const baseMid = isExpanded ? 10 : (mobile ? 2 : tablet ? 3 : 4);
    const maxSubPerWord = isExpanded ? 4 : (mobile ? 2 : 3);

    // Rebalance surplus slots when one wing is smaller (e.g. 电: 6 SUF vs 23 PRE)
    const sufCap = baseSide + Math.max(0, baseSide - preAll.length);
    const preCap = baseSide + Math.max(0, baseSide - sufAll.length);
    const pickedSuf = sufAll.slice(0, sufCap);
    const pickedPre = preAll.slice(0, preCap);
    const pickedMid = midAll.slice(0, baseMid);

    const shownCount = pickedSuf.length + pickedPre.length + pickedMid.length;
    const totalRootCount = sufAll.length + preAll.length + midAll.length;
    const more = Math.max(0, totalRootCount - shownCount);

    const calcBW = zh => Math.max(92, [...zh].length * 25 + 36);
    const bh = 98;

    const nodes = [{ key: '__root__', c: f, zh: f, x: 0, y: 0, bw: 86, bh: 120, ring: 0, wing: 'ROOT', kind: 'root' }];
    const links = [];

    const addWing = (list, sideDir, wingCode) => {
      if (!list.length) return;
      const perArc = isExpanded ? 10 : (mobile ? 5 : 7);
      let idx = 0, layer = 0;
      while (idx < list.length) {
        const take = Math.min(list.length - idx, perArc + layer * 4);
        const rx = 215 + layer * 165, ry = 185 + layer * 125;
        const maxSpan = Math.min(1.12, 0.35 + take * 0.14);
        for (let j = 0; j < take; j++) {
          const w = list[idx + j];
          const t = take > 1 ? (j / (take - 1) - 0.5) * 2 : 0; // -1..+1
          const ang = (sideDir < 0 ? Math.PI : 0) + t * maxSpan * (sideDir < 0 ? -1 : 1);
          const x = Math.cos(ang) * rx, y = Math.sin(ang) * ry;
          nodes.push({ key: w[0], zh: w[0], w, x, y, bw: calcBW(w[0]), bh, ring: 1, wing: wingCode, side: sideDir, kind: 'word' });
          links.push({ from: '__root__', to: w[0], wing: wingCode, kind: wingCode === 'PRE' ? 'wpre' : 'wsuf' });

          // Real 2→3+ syllable sub-chains extend cleanly outward from their 2-char parent!
          const subs = (subMap.get(w[0]) || []).slice(0, maxSubPerWord);
          subs.forEach((sw, si) => {
            const sOff = subs.length > 1 ? (si - (subs.length - 1) / 2) * 96 : 0;
            const sx = x + sideDir * (calcBW(w[0]) / 2 + calcBW(sw[0]) / 2 + 54);
            const sy = y + sOff + (t * 28);
            nodes.push({ key: sw[0], zh: sw[0], w: sw, x: sx, y: sy, bw: calcBW(sw[0]), bh, ring: 2, wing: 'SUB', side: sideDir, kind: 'wsub' });
            links.push({ from: w[0], to: sw[0], wing: 'SUB', kind: 'wsub' });
          });
        }
        idx += take; layer++;
      }
    };

    // Left wing = □f (suffix), Right wing = f□ (prefix), Top wing = □f□ (middle/idiom)
    addWing(pickedSuf, -1, 'SUF');
    addWing(pickedPre, +1, 'PRE');

    if (pickedMid.length) {
      pickedMid.forEach((w, i) => {
        const row = Math.floor(i / 3), col = i % 3, inRow = Math.min(3, pickedMid.length - row * 3);
        const mx = (col - (inRow - 1) / 2) * 162;
        const my = -(176 + row * 116);
        nodes.push({ key: w[0], zh: w[0], w, x: mx, y: my, bw: calcBW(w[0]), bh, ring: 1, wing: 'MID', side: 0, kind: 'word' });
        links.push({ from: '__root__', to: w[0], wing: 'MID', kind: 'wmid' });
      });
    }

    // Variable-width AABB relaxation — guarantees 0 overlaps across 2-, 3-, and 4-char word capsules!
    relaxBoxes(nodes, true, 18, 12, 32);

    // Floating wing labels positioned cleanly above ALL nodes (including 3-char sub-chains) on each side
    const wingLabels = [];
    const makeWingLabel = (wingCode, sideVal, text) => {
      const grp = nodes.filter(n => n.ring > 0 && n.side === sideVal);
      if (!grp.length) return;
      let minX = Infinity, maxX = -Infinity, minY = Infinity;
      grp.forEach(n => { minX = Math.min(minX, n.x - n.bw / 2); maxX = Math.max(maxX, n.x + n.bw / 2); minY = Math.min(minY, n.y - n.bh / 2); });
      wingLabels.push({ wing: wingCode, text, x: (minX + maxX) / 2, y: minY - 38 });
    };
    const dispF = show(f);
    makeWingLabel('SUF', -1, `□${dispF} · ${T('ลงท้าย')} (${sufAll.length})`);
    makeWingLabel('PRE', +1, `${dispF}□ · ${T('ขึ้นต้น')} (${preAll.length})`);
    makeWingLabel('MID',  0, `□${dispF}□ · ${T('กลางคำ')} (${midAll.length})`);

    let minX = -170, maxX = 170, minY = -150, maxY = 150;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x - n.bw / 2 - 14); maxX = Math.max(maxX, n.x + n.bw / 2 + 14);
      minY = Math.min(minY, n.y - n.bh / 2 - 14); maxY = Math.max(maxY, n.y + n.bh / 2 + 14);
    });
    wingLabels.forEach(lb => { minY = Math.min(minY, lb.y - 24); });

    const counts = {
      SUF: nodes.filter(n => n.wing === 'SUF').length,
      PRE: nodes.filter(n => n.wing === 'PRE').length,
      SUB: nodes.filter(n => n.wing === 'SUB').length,
      MID: nodes.filter(n => n.wing === 'MID').length
    };

    return {
      f, nodes, links, wingLabels, counts, more, isExpanded,
      totalWords: allWords.length, sufTotal: sufAll.length, preTotal: preAll.length, midTotal: midAll.length,
      hasMoreToggle: more > 0 || (isExpanded && totalRootCount > 14),
      byZh,
      box: { minX: minX - 24, maxX: maxX + 24, minY: minY - 24, maxY: maxY + 24 },
      asp: viewAspect()
    };
  }

  /* ---------- tree layout (left → right, Char Realm) ---------- */
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

  const nodeInner = (c, stage, focusPy = '') => {
    const dot = !BONUS[c] && typeof HzKit !== 'undefined' ? HzKit.dotHtml(c) : '';
    const sd = side(c);
    const pyTxt = pyOf(c);
    const phAcc = (stage === 'ARMOR' && focusPy && pyTxt) ? matchPy(focusPy, pyTxt) : '';
    const topLbl = sd
      ? `<span class="dg-side-tag" title="${esc2(sd)}">${esc2(sd.split(' · ')[0])}</span>`
      : pyBadgeHTML(pyTxt, phAcc);
    const m = meanOf(c);
    const rep = repBadge(c, stage);
    return `${topLbl}<i class="dg-hex"${lvC(c)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(c))}${dot}${rep}</i>${m.t ? `<small class="dg-m${m.fb ? ' fb' : ''}" lang="${m.fb ? 'en' : mLang()}">${esc2(shortM(m.t))}</small>` : ''}`;
  };

  function phonNodeInner(n) {
    if (n.ring === 0) return nodeInner(n.c, 'ROOKIE');
    const dot = typeof HzKit !== 'undefined' ? HzKit.dotHtml(n.c) : '';
    const m = meanOf(n.c);
    return `${pyBadgeHTML(pyOf(n.c), n.acc)}<i class="dg-hex"${lvC(n.c)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(n.c))}${dot}</i>${m.t ? `<small class="dg-m${m.fb ? ' fb' : ''}" lang="${m.fb ? 'en' : mLang()}">${esc2(shortM(m.t))}</small>` : ''}`;
  }

  function phonSkyNodeInner(n) {
    const py = pyOf(n.key);
    const mini = `<span class="dg-ph-mini">${n.cE ? `<em class="pe">${n.cE}</em>` : ''}${n.cN ? `<em class="pn">${n.cN}</em>` : ''}${n.cD ? `<em class="pd">${n.cD}</em>` : ''}</span>`;
    return `<span class="pyx">${esc2(py)}</span><i class="dg-hex"${lvC(n.key)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(n.key))}</i>${mini}`;
  }

  function wordNodeInner(n, focusChar) {
    if (n.ring === 0) return nodeInner(n.c, 'ROOKIE');
    const w = n.w;
    const dot = typeof HzKit !== 'undefined' && HzKit.wordDotHtml ? HzKit.wordDotHtml(w[0]) : '';
    const gl = typeof HzKit !== 'undefined' ? HzKit.wordGloss(w[0], w[3], !!w[4]) : { t: w[3], fb: !w[4] };
    return `<span class="pyx">${esc2(w[1])}</span><i class="dg-wpill"${lvWordC(w[2])} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${dot}${markWord(w[0], focusChar)}</i>${gl.t ? `<small class="dg-m${gl.fb ? ' fb' : ''}" lang="${gl.fb ? 'en' : mLang()}">${esc2(shortM(gl.t))}</small>` : ''}`;
  }

  function skyNodeInner(n) {
    const r = n.r, py = pyOf(n.key) || (r && r[3]) || '';
    const m = meanOf(n.key);
    const sub = n.preview ? `<em class="dg-sky-ch" lang="zh-Hans">${esc2(n.preview)}</em>` : `${esc2(shortM(m.t))} · ${n.cnt}`;
    return `<span class="pyx">${esc2(py)}</span><i class="dg-hex"${lvC(n.key)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(n.key))}</i><small class="dg-m">${sub}</small>`;
  }

  function wordSkyNodeInner(n) {
    const py = pyOf(n.key), m = meanOf(n.key);
    return `<span class="pyx">${esc2(py)}</span><i class="dg-hex"${lvC(n.key)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(n.key))}</i><small class="dg-m">${esc2(shortM(m.t))} · <b>${n.cnt}</b></small>`;
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

  function wordSkyGuideHTML() {
    const items = QUICK_WORD_HUBS.map(ch => {
      const cnt = wordsForChar(ch).length;
      return `<button type="button" class="dg-qchain" data-whub="${esc2(ch)}"><span lang="zh-Hans">${esc2(show(ch))}</span><small>${cnt} ${T('คำ')}</small></button>`;
    }).join('');
    return `<div class="dg-card dg-sky-card">
      <div class="dg-ch"><span class="dg-stage s-CHAMPION">${T('ท้องฟ้ากลุ่มดาวคำศัพท์')}</span><span class="dg-id">11,000 词</span></div>
      <p class="dg-sky-lead">${LANG === 'en'
        ? 'Tap any morpheme hub star or search a char/word above to see all HSK compound words sharing that character.'
        : 'แตะอักษรแม่คำบนท้องฟ้า หรือพิมพ์ค้นหาอักษร/คำศัพท์ด้านบน เพื่อดูพวงคำศัพท์ที่ใช้ตัวเดียวกันทั้ง HSK 1–9'}</p>
      <ul class="dg-sky-key">
        <li><i class="k-wsuf"></i><span><b>${T('ลงท้ายด้วยตัวนี้')} (□字)</b> · ${LANG === 'en' ? 'Left wing (e.g. 大学, 小学, 开心, 担心)' : 'ฝั่งซ้าย เช่น 大学 · 小学 · 开心 · 担心'}</span></li>
        <li><i class="k-wpre"></i><span><b>${T('ขึ้นต้นด้วยตัวนี้')} (字□)</b> · ${LANG === 'en' ? 'Right wing (e.g. 学生, 学习, 电话, 电脑)' : 'ฝั่งขวา เช่น 学生 · 学习 · 电话 · 电脑'}</span></li>
        <li><i class="k-stack"></i><span><b>${T('ต่อยอด 3–4 พยางค์')}</b> · ${LANG === 'en' ? 'Real sub-chains (大学→大学生, 电影→电影院)' : 'ต่อสายจริงจากคำ 2 พยางค์ เช่น 大学→大学生 · 电影→电影院'}</span></li>
        <li><i class="k-dot"></i><span><b>${T('จำได้แล้ว')} / ${T('กำลังเรียน')}</b> · ${LANG === 'en' ? 'Green/gold status dot on words you studied' : 'จุดเขียว/เหลืองมุมบนซ้ายบอกคำที่คุณเคยฝึกแล้ว'}</span></li>
      </ul>
      <p class="dg-wt">${T('แม่คำยอดฮิต')}</p>
      <div class="dg-qchains">${items}</div>
    </div>`;
  }

  function phonSkyGuideHTML() {
    const items = QUICK_PHON.map(ch => {
      const cnt = phonKidsOf(ch).length;
      return `<button type="button" class="dg-qchain" data-phub="${esc2(ch)}"><span lang="zh-Hans">${esc2(show(ch))}</span><small>${esc2(pyOf(ch))} · ${cnt}</small></button>`;
    }).join('');
    return `<div class="dg-card dg-sky-card">
      <div class="dg-ch"><span class="dg-stage s-ARMOR">${T('ท้องฟ้าแกนเสียง')}</span><span class="dg-id">265 声旁</span></div>
      <p class="dg-sky-lead">${LANG === 'en'
        ? 'Tap any phonetic component to see which HSK characters keep the exact sound vs shift. Character box borders stay 100% HSK level colors!'
        : 'แตะแกนเสียง (声旁) เพื่อเทียบความแม่นของเสียงอ่าน ช่วยเดาเสียงศัพท์ใหม่ในข้อสอบ HSK — โดยคงสีกรอบตามระดับ HSK ไว้เหมือนเดิมทุกตัว'}</p>
      <ul class="dg-sky-key">
        <li><i class="k-phexact"></i><span><b>🟢 ${T('เสียงตรง')}</b> · ${LANG === 'en' ? 'Same syllable (tone may shift): 方 → 房/防/访' : 'พยัญชนะ+สระตรงเป๊ะ เปลี่ยนแค่วรรณยุกต์ เช่น 方→房/防/访'}</span></li>
        <li><i class="k-phnear"></i><span><b>🟡 ${T('เสียงคล้าย')}</b> · ${LANG === 'en' ? 'Close rime or initial: 艮 → 眼/限 · 青 → 睛/精' : 'สระหรือพยัญชนะใกล้เคียง เช่น 艮→眼/限 · 青→睛/精'}</span></li>
        <li><i class="k-phdiff"></i><span><b>🔴 ${T('เสียงเปลี่ยนต้องระวัง')}</b> · ${LANG === 'en' ? 'Diverged sound — memorize separately: 青 → 猜 cāi' : 'เสียงเปลี่ยนไปเลย ต้องจำแยก เช่น 青→猜 (cāi) · 占→贴 (tiē)'}</span></li>
      </ul>
      <p class="dg-wt">${T('แกนเสียงยอดฮิต')}</p>
      <div class="dg-qchains">${items}</div>
    </div>`;
  }

  function phonCardHTML(f, selChar) {
    const basePy = pyOf(f), kids = phonKidsOf(f);
    const cE = kids.filter(k => k.acc === 'exact').length;
    const cN = kids.filter(k => k.acc === 'near').length;
    const cD = kids.filter(k => k.acc === 'diff').length;
    const hit = selChar ? kids.find(k => k.c === selChar) : null;
    if (hit) {
      const c = hit.c, x = hit.x, acc = hit.acc;
      const mo = meanOf(c), icon = acc === 'exact' ? '🟢' : acc === 'near' ? '🟡' : '🔴';
      const parts = partsRaw(c).map(q => {
        const rv = typeof HzKit !== 'undefined' && HzKit.radVar ? HzKit.radVar(q) : null;
        const sub = side(q) || (rv ? `${rv.zh} ${rv.py}` : '');
        return `<button class="dg-part${base(q) === f ? ' base' : ''}" data-tochar="${esc2(q)}" lang="zh-Hans">${esc2(show(q))}${sub ? `<small>${esc2(sub)}</small>` : ''}</button>`;
      }).join('<i>+</i>');
      const words = (D.cw[c] || []).slice(0, 6).map(i => {
        const w = D.w[i];
        const gl = typeof HzKit !== 'undefined' ? HzKit.wordGloss(w[0], w[3], !!w[4]) : { t: w[3], fb: !w[4] };
        return `<li><button type="button" class="dg-wbtn" data-dgword="${esc2(w[0])}">${lvQ(w[2])}<b lang="zh-Hans">${esc2(showWord(w[0]))}</b><span class="pyx">${esc2(w[1])}</span><span class="dg-wgl">${gl.fb ? '<em>EN</em>' : ''}${esc2(gl.t)}</span></button><button type="button" class="tr-say" data-say="${esc2(w[0])}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></li>`;
      }).join('');
      return `<div class="dg-card dg-pcard">
        <div class="dg-ch"><span class="dg-ph-pill ph-${acc}">${icon} ${T(PH_META[acc].th)}</span><span class="dg-wbadge">${lvQ(x[1])}<span>HSK ${x[1] === 7 ? '7–9' : x[1]}</span></span></div>
        <div class="dg-ph-cmp">
          <div class="dg-ph-box"><b lang="zh-Hans">${esc2(show(f))}</b><span class="pyx">${esc2(basePy)}</span></div>
          <i class="dg-ph-arr">→</i>
          <div class="dg-ph-box on"${lvC(c)}><b lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(c))}</b>${pyBadgeHTML(x[0], acc)}</div>
          <button class="dg-say" data-say="${esc2(c)}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button>
        </div>
        <p class="dg-mean">${esc2(mo.t)}${mo.fb || mLang() === 'en' || !x[10] ? '' : ` · ${esc2(x[10])}`}</p>
        <p class="dg-sd">${esc2(PH_META[acc].d)}</p>
        ${parts ? `<p class="dg-row"><span>${T('โครงสร้าง')}</span>${parts}</p>` : ''}
        <div class="hz-xbar">
          <button type="button" class="hz-xbtn" data-tochar="${esc2(c)}">${ic('bolt')}<span>${T('ดูสายวิวัฒนาการอักษร')} ${esc2(show(c))}</span></button>
          ${wordsForChar(c).length ? `<button type="button" class="hz-xbtn" data-toword="${esc2(c)}">${ic('star')}<span>${T('คำศัพท์')} (${wordsForChar(c).length})</span></button>` : ''}
        </div>
        ${words ? `<p class="dg-wt">${T('คำที่ใช้ตัวนี้')} <small>${T('แตะเพื่อดู 5 ภาษา')}</small></p><ul class="dg-ws">${words}</ul>` : ''}
      </div>`;
    }

    const mo = meanOf(f);
    const pct = kids.length ? Math.round(((cE + cN) / kids.length) * 100) : 0;
    return `<div class="dg-card dg-pcard">
      <div class="dg-ch"><span class="dg-stage s-ARMOR">声旁 · ${T('เสียงพ้อง')}</span><span class="dg-id">${kids.length} ${T('ตัว')} · ${pct}%</span></div>
      <div class="dg-hero"><div class="dg-big"${lvC(f)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(f))}</div>
        <div><p class="dg-py"><span class="pyx">${esc2(basePy)}</span><button class="dg-say" data-say="${esc2(f)}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></p>
          ${mo.t ? `<p class="dg-mean">${esc2(mo.t)}</p>` : ''}<p class="dg-sd">${LANG === 'en' ? 'Tap any star to hear & compare its sound with ' + show(f) : 'แตะอักษรรอบ ๆ เพื่อฟังเสียงและเทียบความแม่นกับ ' + show(f)}</p></div></div>
      <dl class="dg-stats dg-pstats">
        <div class="pe"><dt>🟢 ${T('ตรง')}</dt><dd>${cE}</dd></div>
        <div class="pn"><dt>🟡 ${T('คล้าย')}</dt><dd>${cN}</dd></div>
        <div class="pd"><dt>🔴 ${T('เปลี่ยน')}</dt><dd>${cD}</dd></div>
        <div><dt>${T('ทั้งหมด')}</dt><dd>${kids.length}</dd></div>
      </dl>
      <div class="hz-xbar">
        <button type="button" class="hz-xbtn" data-tochar="${esc2(f)}">${ic('bolt')}<span>${T('ดูสายวิวัฒนาการอักษร')} ${esc2(show(f))}</span></button>
        ${wordsForChar(f).length ? `<button type="button" class="hz-xbtn" data-toword="${esc2(f)}">${ic('star')}<span>${T('คำศัพท์')} (${wordsForChar(f).length})</span></button>` : ''}
      </div>
    </div>`;
  }

  function wordCardHTML(focusChar, selZh) {
    const f = base(focusChar);
    const w = selZh ? (D.cw[f] || []).map(i => D.w[i]).find(x => x && x[0] === selZh) : null;
    if (w) {
      const gl = typeof HzKit !== 'undefined' ? HzKit.wordGloss(w[0], w[3], !!w[4]) : { t: w[3], fb: !w[4] };
      const stCode = typeof HzKit !== 'undefined' && HzKit.wordStatus ? HzKit.wordStatus(w[0]) : '';
      const stPill = stCode === 'mastered'
        ? `<span class="dg-st-pill m">${T('จำได้แล้ว')}</span>`
        : stCode === 'learning'
        ? `<span class="dg-st-pill l">${T('กำลังเรียน')}</span>`
        : `<span class="dg-st-pill">${T('ยังไม่เรียน')}</span>`;
      // Distinct partner characters inside this word so user can hop directly to their word constellation!
      const partners = [...new Set([...w[0]])].filter(ch => ch !== f && (D.cw[ch] || []).length > 0);
      const hopBtns = partners.map(ch => {
        const cnt = wordsForChar(ch).length, m = meanOf(ch);
        return `<button type="button" class="dg-hop" data-whub="${esc2(ch)}"${lvC(ch)}>
          <b lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(ch))}</b>
          <span><em>${esc2(pyOf(ch))}</em>${esc2(shortM(m.t))}</span>
          <small>${cnt} ${T('คำ')} →</small>
        </button>`;
      }).join('');

      return `<div class="dg-card dg-wcard">
        <div class="dg-ch"><span class="dg-wbadge">${lvQ(w[2])}<span>HSK ${w[2] === 7 ? '7–9' : w[2]}</span></span>${stPill}</div>
        <div class="dg-whero">
          <div class="dg-wbig"${lvWordC(w[2])} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${markWord(w[0], f)}</div>
          <div class="dg-wmeta">
            <p class="dg-py"><span class="pyx">${esc2(w[1])}</span><button class="dg-say" data-say="${esc2(w[0])}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></p>
            <p class="dg-mean">${gl.fb ? '<em>EN</em> ' : ''}${esc2(gl.t)}</p>
          </div>
        </div>
        <button type="button" class="dg-go" data-dgword="${esc2(w[0])}">${ic('vocab')}${T('เปิดการ์ด 5 ภาษา')}</button>
        ${hopBtns ? `<p class="dg-wt">${T('กระโดดไปกลุ่มดาวคำของ…')}</p><div class="dg-hops">${hopBtns}</div>` : ''}
        <div class="dg-wfoot">
          <button type="button" class="hz-xbtn" data-tochar="${esc2(f)}">${ic('bolt')}<span>${T('ดูสายวิวัฒนาการอักษร')} ${esc2(show(f))}</span></button>
        </div>
      </div>`;
    }

    // Default Focus Character Summary in Word Mode
    const all = wordsForChar(f);
    const mo = meanOf(f);
    const preCnt = all.filter(x => [...x[0]][0] === f).length;
    const sufCnt = all.filter(x => { const cs = [...x[0]]; return cs[cs.length - 1] === f && cs[0] !== f; }).length;
    const midCnt = all.length - preCnt - sufCnt;
    const topWords = all.slice().sort((a, b) => a[2] - b[2] || a[0].length - b[0].length).slice(0, 8).map(x => {
      const gl = typeof HzKit !== 'undefined' ? HzKit.wordGloss(x[0], x[3], !!x[4]) : { t: x[3], fb: !x[4] };
      return `<li><button type="button" class="dg-wbtn" data-wn="${esc2(x[0])}">${lvQ(x[2])}<b lang="zh-Hans">${esc2(showWord(x[0]))}</b><span class="pyx">${esc2(x[1])}</span><span class="dg-wgl">${gl.fb ? '<em>EN</em>' : ''}${esc2(gl.t)}</span></button><button type="button" class="tr-say" data-say="${esc2(x[0])}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></li>`;
    }).join('');
    return `<div class="dg-card dg-wcard">
      <div class="dg-ch"><span class="dg-stage s-CHAMPION">${T('กลุ่มดาว')} · ${T('คำศัพท์')}</span><span class="dg-id">${all.length} ${T('คำ')}</span></div>
      <div class="dg-hero"><div class="dg-big"${lvC(f)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(f))}</div>
        <div><p class="dg-py"><span class="pyx">${esc2(pyOf(f))}</span><button class="dg-say" data-say="${esc2(f)}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></p>
          ${mo.t ? `<p class="dg-mean">${esc2(mo.t)}</p>` : ''}<p class="dg-sd">${LANG === 'en' ? 'Tap any word star on the map to inspect or hop to partner chars.' : 'แตะคำบนกลุ่มดาวเพื่อฟังเสียง ดูความหมาย หรือกระโดดไปตัวอักษรคู่หู'}</p></div></div>
      <dl class="dg-stats dg-wstats"><div><dt>□${esc2(show(f))}</dt><dd>${sufCnt}</dd></div><div><dt>${esc2(show(f))}□</dt><dd>${preCnt}</dd></div><div><dt>□${esc2(show(f))}□</dt><dd>${midCnt}</dd></div><div><dt>${T('ทั้งหมด')}</dt><dd>${all.length}</dd></div></dl>
      <div class="hz-xbar"><button type="button" class="hz-xbtn" data-tochar="${esc2(f)}">${ic('bolt')}<span>${T('ดูสายวิวัฒนาการอักษร')} ${esc2(show(f))}</span></button></div>
      ${topWords ? `<p class="dg-wt">${T('คำที่ใช้ตัวนี้')} <small>${T('แตะเพื่อเลือก')}</small></p><ul class="dg-ws">${topWords}</ul>` : ''}
    </div>`;
  }

  function cardHTML(c, stage, parent) {
    const b = BONUS[c], x = D.c[c], stg = STAGES[stage] || STAGES.ROOKIE, g = show(c);
    const rr = x ? x[3] && rad.get(x[3]) : radOfGlyph.get(c);
    const wCnt = wordsForChar(c).length;
    const words = x ? (D.cw[c] || []).slice(0, 8).map(i => {
      const w = D.w[i];
      const gl = typeof HzKit !== 'undefined' ? HzKit.wordGloss(w[0], w[3], !!w[4]) : { t: w[3], fb: !w[4] };
      return `<li><button type="button" class="dg-wbtn" data-dgword="${esc2(w[0])}">${lvQ(w[2])}<b lang="zh-Hans">${esc2(showWord(w[0]))}</b><span class="pyx">${esc2(w[1])}</span><span class="dg-wgl">${gl.fb ? '<em>EN</em>' : ''}${esc2(gl.t)}</span></button><button type="button" class="tr-say" data-say="${esc2(w[0])}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></li>`;
    }).join('') : '';
    const cat = parent && (x || b) && stageOf(c, parent) ? catalyst(c, parent) : [];
    const parts = partsRaw(c).map(q => {
      const rv = typeof HzKit !== 'undefined' && HzKit.radVar ? HzKit.radVar(q) : null;
      const sub = side(q) || (rv ? `${rv.zh} ${rv.py}` : '');
      return `<button class="dg-part${parent && formsOf(parent).has(q) ? ' base' : ''}" data-dgo="${esc2(q)}" lang="zh-Hans">${esc2(show(q))}${sub ? `<small>${esc2(sub)}</small>` : ''}</button>`;
    }).join('<i>+</i>');
    const rSelf = radOfGlyph.get(c);
    const selfVars = (rSelf && typeof HzKit !== 'undefined' && HzKit.radFormBuckets)
      ? HzKit.radFormBuckets(Object.keys(D.c), rSelf, D).filter(bk => bk.info) : [];
    const varRow = selfVars.length >= 2
      ? `<p class="dg-row"><span>${T('รูปแปลงร่าง')}</span>${selfVars.map(bk => `<button type="button" class="dg-part${st.charForm === bk.key ? ' base' : ''}" data-cform="${esc2(bk.key)}" lang="zh-Hans">${esc2(bk.glyph)}<small>${esc2(bk.info.zh)} · ${esc2(bk.info.py)}</small></button>`).join('')}</p>` : '';
    const phonCnt = !b ? phonKidsOf(c).length : 0;
    const toPhonBtn = phonCnt >= 2 ? `<button type="button" class="hz-xbtn" data-tophon="${esc2(base(c))}">${ic('vol')}<span>${T('เสียงพ้อง')} (${phonCnt})</span></button>` : '';
    const mo = meanOf(c), meaning = mo.t + (mo.fb || mLang() === 'en' || !x || !x[10] ? '' : ` · ${x[10]}`);
    const reg = x ? [[T('ไต้หวัน'), x[8], 'zh-Hant'], [T('ญี่ปุ่น'), x[13], 'ja']].filter(f => f[1]) : (b && b.trad ? [[T('ตัวเต็ม'), b.trad, 'zh-Hant']] : []);
    const twins = side(c) ? ((D.amb || {})[base(c)] || []).filter(no => `${base(c)}@${no}` !== c).map(no => `${base(c)}@${no}`) : [];
    const xbar = !b && typeof HzKit !== 'undefined' ? HzKit.crossBar(c, 'digi') : '';
    const toWordBtn = !b && wCnt > 0 ? `<button type="button" class="dg-toword" data-toword="${esc2(base(c))}">${ic('star')}<span>${T('ดูกลุ่มดาวคำของตัวนี้')} (${wCnt} ${T('คำ')}) →</span></button>` : '';
    const bonusBadge = b ? `<span class="dg-bonus-tag">${T('นอก HSK')} · ×${b.rep}</span>` : '';
    return `<div class="dg-card s-${stage}${b ? ' is-bonus' : ''}">
      <div class="dg-ch"><span class="dg-stage">${esc2(T(stg.th))} <b>${stg.zh}</b></span>${bonusBadge || `<span class="dg-id">#${esc2((c.codePointAt(0) || 0).toString(16).toUpperCase())}</span>`}</div>
      <div class="dg-hero"><div class="dg-big${b ? ' is-bonus' : ''}"${lvC(c)} lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(g)}</div>
        <div><p class="dg-py"><span class="pyx">${esc2(pyOf(c))}</span><button class="dg-say" data-say="${esc2(base(c))}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></p>
          ${meaning ? `<p class="dg-mean">${esc2(meaning)}</p>` : ''}<p class="dg-sd">${esc2(stg.d)}</p></div></div>
      ${xbar}${toPhonBtn ? `<div class="hz-xbar">${toPhonBtn}</div>` : ''}${toWordBtn}
      ${x ? `<dl class="dg-stats"><div><dt>HSK</dt><dd>${x[1] === 7 ? '7-9' : x[1]}</dd></div><div><dt>${T('ขีด')}</dt><dd>${esc2(x[2])}</dd></div>${rr ? `<div><dt>部首</dt><dd lang="zh-Hans">${esc2(radG(rr))}</dd></div>` : ''}${x[6] ? `<div><dt>六书</dt><dd lang="zh-Hans">${esc2(x[6])}</dd></div>` : ''}</dl>`
        : b ? `<dl class="dg-stats"><div><dt>HSK</dt><dd>${T('นอก HSK')}</dd></div><div><dt>${T('ขีด')}</dt><dd>${b.strokes}</dd></div><div><dt>六书</dt><dd lang="zh-Hans">会意</dd></div><div><dt>${T('ซ้ำร่าง')}</dt><dd>×${b.rep}</dd></div></dl>` : ''}
      ${varRow}
      ${parts ? `<p class="dg-row"><span>${T('โครงสร้าง')}</span>${parts}</p>` : ''}
      ${twins.length ? `<p class="dg-row"><span>${T('หน้าตาเหมือน แต่คนละตัว')}</span>${twins.map(q => `<button class="dg-part" data-dgo="${esc2(q)}" lang="zh-Hans">${esc2(base(q))}<small>${esc2(side(q))}</small></button>`).join('')}</p>` : ''}
      ${cat.length ? `<p class="dg-row"><span>${T('ส่วนที่เพิ่ม')}</span>${cat.map(q => `<b class="dg-cat" lang="zh-Hans">${esc2(show(q))}</b>`).join(' ')}</p>` : ''}
      ${reg.length ? `<p class="dg-row"><span>${T('รูปเขียนตามภูมิภาค')}</span>${reg.map(([k, v, l]) => `<b class="dg-reg" lang="${l}">${esc2(v)}<small>${k}</small></b>`).join('')}</p>` : ''}
      ${words ? `<p class="dg-wt">${T('คำที่ใช้ตัวนี้')} <small>${T('แตะเพื่อดู 5 ภาษา')}</small></p><ul class="dg-ws">${words}</ul>` : ''}
      ${x && (x[4] || []).length > 1 ? `<button class="dg-go" data-evolve="${esc2(c)}">${ic('bolt')}${T('ดูการประกอบอักษร')}</button>` : ''}
    </div>`;
  }

  const trailHTML = () => {
    if (isWord()) {
      return `<button type="button" class="dg-sky-back" data-skyback>✦ ${T('ท้องฟ้าคำศัพท์')}</button>`
        + st.wTrail.map((c, i) => `<i>›</i><button class="${i === st.wTrail.length - 1 ? 'on' : ''}" data-wtrail="${i}" lang="zh-Hans">${esc2(show(c))}</button>`).join('');
    }
    if (isPhon()) {
      return `<button type="button" class="dg-sky-back" data-skyback>✦ ${T('ท้องฟ้าแกนเสียง')}</button>`
        + st.pTrail.map((c, i) => `<i>›</i><button class="${i === st.pTrail.length - 1 ? 'on' : ''}" data-ptrail="${i}" lang="zh-Hans">${esc2(show(c))}</button>`).join('');
    }
    return `<button type="button" class="dg-sky-back" data-skyback>✦ ${T('ท้องฟ้าทั้งหมด')}</button>`
      + st.trail.map((c, i) => `<i>›</i><button class="${i === st.trail.length - 1 ? 'on' : ''}" data-trail="${i}" lang="zh-Hans">${esc2(show(c))}</button>`).join('');
  };

  function paintCharFormBar(f, buckets) {
    const bar = host && host.querySelector('.dg-forms-slot');
    if (!bar) return;
    if (!buckets || buckets.length < 2) { bar.innerHTML = ''; return; }
    const tot = buckets.reduce((s, b) => s + b.count, 0);
    bar.innerHTML = `<div class="hz-forms" role="group" aria-label="${T('รูปแปลงร่าง')}">
      <button type="button" class="${st.charForm ? '' : 'on'}" data-cform="">${T('ทั้งหมด')} <small>${tot}</small></button>
      ${buckets.map(bk => `<button type="button" class="${st.charForm === bk.key ? 'on' : ''}" data-cform="${esc2(bk.key)}"><b lang="zh-Hans">${esc2(bk.glyph)}</b>${bk.info ? `<span>${esc2(bk.info.zh)} <em>${esc2(bk.info.py)}</em></span>` : ''}<small>${bk.count}</small></button>`).join('')}
    </div>`;
  }

  /* ---------- paint (unified 3-realm frame: 字 อักษร | 声 เสียงพ้อง | 词 คำศัพท์) ---------- */
  function paint() {
    if (!host) return;
    cancelAnimationFrame(anim); cur = new Map();
    st.stageFilter = null; st.wFilter = null; st.pFilter = null;
    const wordMode = isWord(), phonMode = isPhon(), sky = isSky();
    const vm = (wordMode || phonMode) && viewMode() === 'tree' ? 'radial' : viewMode();
    const focus = wordMode ? st.wTrail[st.wTrail.length - 1] : phonMode ? st.pTrail[st.pTrail.length - 1] : st.trail[st.trail.length - 1];

    let subArea = '';
    if (sky) {
      const zList = wordMode ? WORD_ZONES : phonMode ? PHON_ZONES : ZONES;
      const curZ = wordMode ? st.wSkyZone : phonMode ? st.pSkyZone : st.skyZone;
      subArea = `<div class="dg-zones">
        <button type="button" class="${curZ === 'all' ? 'on' : ''}" data-zone="all">✦ ${T('ทั้งหมด')}</button>
        ${zList.map(z => `<button type="button" class="${curZ === z.id ? 'on' : ''}" data-zone="${z.id}">${z.icon} ${LANG === 'en' ? z.en : z.th}</button>`).join('')}
      </div>`;
    } else if (wordMode) {
      subArea = `<div class="dg-subbar">
        <div class="dg-tg dg-vw" role="tablist">
          <span class="${vm === 'radial' ? 'on' : ''}" data-view="radial">${T('กลุ่มดาว')}</span>
          <span class="${vm === 'grid' ? 'on' : ''}" data-view="grid">${T('กริด')}</span>
        </div>
        <div class="dg-legend">${W_ORDER.map(k => `<button type="button" class="w-${k}" data-wing="${k}" aria-pressed="false"><i></i><b lang="zh-Hans">${W_WINGS[k].zh}</b><span>${LANG === 'en' ? T(W_WINGS[k].sh) : W_WINGS[k].sh}</span><em class="dg-cnt"></em></button>`).join('')}</div>
      </div>
      <nav class="dg-trail" aria-label="trail">${trailHTML()}</nav>`;
    } else if (phonMode) {
      const pIcon = { exact: '🟢', near: '🟡', diff: '🔴' };
      subArea = `<div class="dg-subbar">
        <div class="dg-tg dg-vw" role="tablist">
          <span class="${vm === 'radial' ? 'on' : ''}" data-view="radial">${T('กลุ่มดาว')}</span>
          <span class="${vm === 'grid' ? 'on' : ''}" data-view="grid">${T('กริด')}</span>
        </div>
        <div class="dg-legend">${PH_ORDER.map(k => `<button type="button" class="ph-${k}" data-pacc="${k}" aria-pressed="false"><span>${pIcon[k]} ${T(PH_META[k].sh)}</span><em class="dg-cnt"></em></button>`).join('')}</div>
      </div>
      <nav class="dg-trail" aria-label="trail">${trailHTML()}</nav>`;
    } else {
      subArea = `<div class="dg-subbar">
        <div class="dg-tg dg-vw" role="tablist">
          <span class="${vm === 'radial' ? 'on' : ''}" data-view="radial">${T('กลุ่มดาว')}</span>
          <span class="${vm === 'grid' ? 'on' : ''}" data-view="grid">${T('กริด')}</span>
          <span class="${vm === 'tree' ? 'on' : ''}" data-view="tree">${T('ขวา')}</span>
        </div>
        <div class="dg-legend">${ORDER.map(k => `<button type="button" class="s-${k}" data-stage="${k}" aria-pressed="false"><i></i><b lang="zh-Hans">${STAGES[k].zh}</b><span>${LANG === 'en' ? T(STAGES[k].th) : STAGES[k].sh}</span><em class="dg-cnt"></em></button>`).join('')}</div>
      </div>
      <nav class="dg-trail" aria-label="trail">${trailHTML()}</nav>
      <div class="dg-forms-slot"></div>`;
    }

    const hintTxt = sky
      ? (wordMode ? T('แตะอักษรแม่คำเพื่อดูกลุ่มดาวคำศัพท์ · ลากหรือซูมได้') : phonMode ? T('แตะแกนเสียงเพื่อดูความแม่นของเสียงอ่าน · กรอบสียังคงเป็นระดับ HSK') : T('แตะรากศัพท์เพื่อเจาะเข้ากลุ่มดาว · ลากหรือซูมได้'))
      : wordMode ? T('แตะคำเพื่อฟังเสียงและดูรายละเอียด · แตะตัวกลางดูสรุป')
      : phonMode ? T('แตะอักษรเพื่อเทียบเสียงอ่านและฟังเสียง · กรอบสี = ระดับ HSK')
      : vm === 'radial' ? T('แตะตัวไหนก็ได้เพื่อย้ายมาไว้ตรงกลาง')
      : T('ลากเพื่อเลื่อน · หมุนล้อหรือบีบเพื่อซูม');

    const qPh = wordMode ? T('ค้นหาแม่คำ หรือคำศัพท์ เช่น 学, 电, 心, 电影…')
      : phonMode ? T('ค้นหาแกนเสียง เช่น 青, 方, 艮, 令, 占…')
      : T('ค้นหาอักษรหรือราก เช่น 木, 森, 想, 叒…');

    host.innerHTML = `<div class="dg${wordMode ? ' is-word' : ''}${phonMode ? ' is-phon' : ''}${sky ? ' is-sky is-radial' : (vm === 'radial' ? ' is-radial' : '')}${!sky && vm === 'grid' ? ' is-grid' : ''}">
      <div class="dg-top">
        <div class="dg-tg dg-realm" role="tablist" aria-label="mode">
          <span class="${!wordMode && !phonMode ? 'on' : ''}" data-realm="char"><b lang="zh-Hans">字</b>${T('อักษร')}</span>
          <span class="${phonMode ? 'on' : ''}" data-realm="phon"><b lang="zh-Hans">声</b>${T('เสียงพ้อง')}</span>
          <span class="${wordMode ? 'on' : ''}" data-realm="word"><b lang="zh-Hans">词</b>${T('คำศัพท์')}</span>
        </div>
        <label class="dg-q">${ic('search')}<input maxlength="6" placeholder="${qPh}" value=""><button class="q-pen" data-handpad=".dg-q input" aria-label="${T('เขียนค้นหา')}">${ic('pen')}</button></label>
      </div>
      ${subArea}
      <div class="dg-body">
        ${!sky && vm === 'grid'
          ? `<div class="dg-grid-wrap"></div>`
          : `<div class="dg-view" tabindex="0" aria-label="${T('ลากเพื่อเลื่อน · หมุนล้อหรือบีบเพื่อซูม')}">
              <div class="dg-world"></div>
              <div class="dg-zoom"><button data-zoom="1" aria-label="zoom in">+</button><button data-zoom="-1" aria-label="zoom out">−</button><button data-zoom="0" aria-label="fit">${ic('repeat')}</button></div>
              <div class="dg-more-bar"></div>
              <p class="dg-hint">${hintTxt}</p>
            </div>`}
        <aside class="dg-side"></aside>
      </div>
      <div class="dg-fx" hidden></div></div>`;

    if (sky) { wordMode ? drawWordSky() : phonMode ? drawPhonSky() : drawSky(); watchShape(); }
    else if (wordMode) {
      if (vm === 'grid') drawWordGrid(focus);
      else { st.fitted = false; drawWordConstellation(focus, false); watchShape(); }
    } else if (phonMode) {
      if (vm === 'grid') drawPhonGrid(focus);
      else { st.fitted = false; drawPhonConstellation(focus, false); watchShape(); }
    } else {
      if (vm === 'radial') { st.fitted = false; drawRadial(focus, false); watchShape(); }
      else if (vm === 'grid') drawGrid(focus);
      else { drawTree(); watchShape(); }
    }
    if (typeof HanziView !== 'undefined' && HanziView.fit) setTimeout(HanziView.fit, 35);
  }

  /* ---------- Sky Map Drawing (Char & Word) ---------- */
  function drawSky() {
    const world = host.querySelector('.dg-world'); if (!world) return;
    skyLay = layoutSky(); lay = null; wLay = null; wSkyLay = null;
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
    host.querySelector('.dg-side').innerHTML = skyGuideHTML();
    applySkyZone(false);
  }

  function drawWordSky() {
    const world = host.querySelector('.dg-world'); if (!world) return;
    wSkyLay = layoutWordSky(); lay = null; wLay = null; skyLay = null;
    const svg = `<svg class="dg-svg sky" width="1" height="1" aria-hidden="true">${wSkyLay.links.map(l =>
      `<line class="dg-sky-l" data-zone="${l.zone}" x1="${l.from.x.toFixed(1)}" y1="${l.from.y.toFixed(1)}" x2="${l.to.x.toFixed(1)}" y2="${l.to.y.toFixed(1)}"/>`
    ).join('')}</svg>`;
    const labels = wSkyLay.labels.map(lb =>
      `<button type="button" class="dg-sky-lbl" data-zone="${lb.id}" style="transform:translate(${lb.x.toFixed(1)}px,${lb.y.toFixed(1)}px) translate(-50%,-50%)">${lb.icon} <span>${esc2(lb.title)}</span><em>${lb.count}</em></button>`
    ).join('');
    const stars = wSkyLay.nodes.map(n =>
      `<button type="button" class="dg-n dg-sky-n t${n.tier} is-whub" data-whub="${esc2(n.key)}" data-zone="${n.zone}" style="transform:translate(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px) translate(-50%,var(--hy))" aria-label="${esc2(show(n.key))}">${wordSkyNodeInner(n)}</button>`
    ).join('');
    world.innerHTML = svg + labels + stars;
    const moreBar = host.querySelector('.dg-more-bar');
    if (moreBar) moreBar.innerHTML = '';
    host.querySelector('.dg-side').innerHTML = wordSkyGuideHTML();
    applySkyZone(false);
  }

  function drawPhonSky() {
    const world = host.querySelector('.dg-world'); if (!world) return;
    pSkyLay = layoutPhonSky(); lay = null; wLay = null; skyLay = null; wSkyLay = null; pLay = null;
    const svg = `<svg class="dg-svg sky" width="1" height="1" aria-hidden="true">${pSkyLay.links.map(l =>
      `<line class="dg-sky-l" data-zone="${l.zone}" x1="${l.from.x.toFixed(1)}" y1="${l.from.y.toFixed(1)}" x2="${l.to.x.toFixed(1)}" y2="${l.to.y.toFixed(1)}"/>`
    ).join('')}</svg>`;
    const labels = pSkyLay.labels.map(lb =>
      `<button type="button" class="dg-sky-lbl" data-zone="${lb.id}" style="transform:translate(${lb.x.toFixed(1)}px,${lb.y.toFixed(1)}px) translate(-50%,-50%)">${lb.icon} <span>${esc2(lb.title)}</span><em>${lb.count}</em></button>`
    ).join('');
    const stars = pSkyLay.nodes.map(n =>
      `<button type="button" class="dg-n dg-sky-n t${n.tier} is-phub" data-phub="${esc2(n.key)}" data-zone="${n.zone}" style="transform:translate(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px) translate(-50%,var(--hy))" aria-label="${esc2(show(n.key))}">${phonSkyNodeInner(n)}</button>`
    ).join('');
    world.innerHTML = svg + labels + stars;
    const moreBar = host.querySelector('.dg-more-bar');
    if (moreBar) moreBar.innerHTML = '';
    host.querySelector('.dg-side').innerHTML = phonSkyGuideHTML();
    applySkyZone(false);
  }

  function drawPhonConstellation(f, animate) {
    const world = host.querySelector('.dg-world'); if (!world) return;
    st.pFilter = null;
    world.classList.remove('sf-on', 'z-dim', 'hov');
    host.querySelectorAll('.dg-legend [data-pacc].on').forEach(el => { el.classList.remove('on'); el.setAttribute('aria-pressed', 'false'); });
    pLay = layoutPhonConstellation(f);
    lay = null; wLay = null; skyLay = null; wSkyLay = null; pSkyLay = null;

    const posMap = new Map(pLay.nodes.map(n => [n.key, n]));
    const svg = `<svg class="dg-svg" width="1" height="1" aria-hidden="true">${pLay.links.map(l => {
      const a = posMap.get(l.from), b = posMap.get(l.to); if (!a || !b) return '';
      return `<line class="dg-l lk-${l.kind} ph-${l.acc}" data-a="${esc2(l.from)}" data-b="${esc2(l.to)}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`;
    }).join('')}</svg>`;

    const labels = pLay.groupLabels.map(lb =>
      `<span class="dg-wing-lbl ph-${lb.acc}" style="transform:translate(${lb.x.toFixed(1)}px,${lb.y.toFixed(1)}px) translate(-50%,-50%)">${esc2(lb.text)}</span>`
    ).join('');

    const nodesHtml = pLay.nodes.map(n => {
      const isR = n.ring === 0, on = !isR && st.pSel === n.c;
      const cls = isR ? 'dg-n r0 dg-proot on' : `dg-n dg-pn r1 ph-${n.acc}${on ? ' on' : ''}`;
      const attr = isR ? `data-proot="${esc2(n.c)}"` : `data-pn="${esc2(n.c)}"`;
      return `<button type="button" class="${cls}" ${attr} style="transform:translate(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px) translate(-50%,var(--hy))" aria-label="${esc2(show(n.c))}">${phonNodeInner(n)}</button>`;
    }).join('');

    const emptyMsg = pLay.nodes.length <= 1
      ? `<p class="dg-none r" style="transform:translate(-50%,0) translate(0px,106px)">${T('ยังไม่มีอักษร HSK ที่ใช้แกนเสียงนี้')} (${typeof HzLv === 'undefined' ? '' : HzLv.label()})</p>` : '';

    world.innerHTML = svg + labels + nodesHtml + emptyMsg;
    const moreBar = host.querySelector('.dg-more-bar');
    if (moreBar) moreBar.innerHTML = '';

    host.querySelectorAll('.dg-legend [data-pacc]').forEach(el => {
      const n = pLay.counts[el.dataset.pacc] || 0;
      el.querySelector('.dg-cnt').textContent = n ? n : '';
      el.classList.toggle('none', !n);
    });
    const tr = host.querySelector('.dg-trail');
    if (tr) tr.innerHTML = trailHTML();
    host.querySelector('.dg-side').innerHTML = phonCardHTML(pLay.f, st.pSel);
    fitBox(pLay.box, animate, false);
  }

  function drawPhonGrid(rawFocus) {
    const f = base(rawFocus), wrap = host.querySelector('.dg-grid-wrap'); if (!wrap) return;
    const all = phonKidsOf(f);
    const groups = { exact: [], near: [], diff: [] };
    all.forEach(it => groups[it.acc].push(it));
    host.querySelectorAll('.dg-legend [data-pacc]').forEach(el => {
      const n = (groups[el.dataset.pacc] || []).length;
      el.querySelector('.dg-cnt').textContent = n ? n : '';
      el.classList.toggle('none', !n);
    });
    const tr = host.querySelector('.dg-trail');
    if (tr) tr.innerHTML = trailHTML();
    const icons = { exact: '🟢', near: '🟡', diff: '🔴' };
    const secs = PH_ORDER.map(acc => {
      const arr = groups[acc];
      if (!arr.length || (st.pFilter && st.pFilter !== acc)) return '';
      return `<section class="dg-gsec ph-${acc}">
        <h4 class="dg-gsh"><span>${icons[acc]} ${T(PH_META[acc].th)}</span><small>${arr.length}</small></h4>
        <div class="dg-glist">${arr.map(it => {
          const c = it.c, m = meanOf(c), dot = typeof HzKit !== 'undefined' ? HzKit.dotHtml(c) : '';
          return `<button type="button" class="dg-gtile${st.pSel === c ? ' on' : ''}"${lvC(c)} data-pn="${esc2(c)}">
            ${dot}${pyBadgeHTML(it.x[0], acc)}
            <b lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(c))}</b>
            ${m.t ? `<small class="${m.fb ? 'fb' : ''}">${esc2(shortM(m.t))}</small>` : ''}
          </button>`;
        }).join('')}</div>
      </section>`;
    }).join('');
    wrap.innerHTML = secs || `<p class="tr-empty">${T('ยังไม่มีอักษร HSK ที่ใช้แกนเสียงนี้')} (${typeof HzLv === 'undefined' ? '' : HzLv.label()})</p>`;
    host.querySelector('.dg-side').innerHTML = phonCardHTML(f, st.pSel);
  }

  function applySkyZone(animate) {
    const world = host && host.querySelector('.dg-world');
    const curSky = isWord() ? wSkyLay : isPhon() ? pSkyLay : skyLay;
    if (!world || !curSky) return;
    const z = isWord() ? st.wSkyZone : isPhon() ? st.pSkyZone : st.skyZone;
    world.classList.toggle('z-dim', z !== 'all');
    world.querySelectorAll('[data-zone]').forEach(el => el.classList.toggle('z-hi', z === 'all' || el.dataset.zone === z));
    host.querySelectorAll('.dg-zones [data-zone]').forEach(b => b.classList.toggle('on', b.dataset.zone === z));
    const box = (z !== 'all' && curSky.zoneBoxes[z]) || curSky.box;
    fitBox(box, animate, !isWord() && !isPhon());
  }

  /* ---------- Word Constellation Drawing (Level 2 · Realm 2) ---------- */
  function drawWordConstellation(f, animate) {
    const world = host.querySelector('.dg-world'); if (!world) return;
    st.wFilter = null;
    world.classList.remove('sf-on', 'z-dim', 'hov');
    host.querySelectorAll('.dg-legend [data-wing].on').forEach(el => { el.classList.remove('on'); el.setAttribute('aria-pressed', 'false'); });
    wLay = layoutWordConstellation(f);
    lay = null; skyLay = null; wSkyLay = null;

    const posMap = new Map(wLay.nodes.map(n => [n.key, n]));
    const svg = `<svg class="dg-svg" width="1" height="1" aria-hidden="true">${wLay.links.map(l => {
      const a = posMap.get(l.from), b = posMap.get(l.to); if (!a || !b) return '';
      return `<line class="dg-l lk-${l.kind} w-${l.wing}" data-a="${esc2(l.from)}" data-b="${esc2(l.to)}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`;
    }).join('')}</svg>`;

    const wingLabels = wLay.wingLabels.map(lb =>
      `<span class="dg-wing-lbl w-${lb.wing}" style="transform:translate(${lb.x.toFixed(1)}px,${lb.y.toFixed(1)}px) translate(-50%,-50%)">${esc2(lb.text)}</span>`
    ).join('');

    const nodesHtml = wLay.nodes.map(n => {
      const isR = n.ring === 0, on = !isR && st.wSel === n.zh;
      const cls = isR ? 'dg-n r0 dg-wroot on' : `dg-n dg-wn r${n.ring} w-${n.wing} k-${n.kind}${on ? ' on' : ''}`;
      const attr = isR ? `data-wroot="${esc2(n.c)}"` : `data-wn="${esc2(n.zh)}"`;
      return `<button type="button" class="${cls}" ${attr} style="transform:translate(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px) translate(-50%,var(--hy))" aria-label="${esc2(isR ? show(n.c) : showWord(n.zh))}">${wordNodeInner(n, wLay.f)}</button>`;
    }).join('');

    const emptyMsg = wLay.nodes.length <= 1
      ? `<p class="dg-none r" style="transform:translate(-50%,0) translate(0px,106px)">${T('ยังไม่มีคำศัพท์ HSK ที่ใช้ตัวอักษรนี้')} (${typeof HzLv === 'undefined' ? '' : HzLv.label()})</p>` : '';

    world.innerHTML = svg + wingLabels + nodesHtml + emptyMsg;

    const moreBar = host.querySelector('.dg-more-bar');
    if (moreBar) {
      if (wLay.more > 0) {
        moreBar.innerHTML = innerWidth < 620
          ? `<button type="button" class="dg-more-pill" data-wmore="${esc2(wLay.f)}">+${wLay.more} ${T('ดูเพิ่มอีก')}</button><button type="button" class="dg-more-pill alt" data-view="grid">${T('กริด')} →</button>`
          : `<button type="button" class="dg-more-pill" data-wmore="${esc2(wLay.f)}">+${wLay.more} ${T('ดูเพิ่มอีก')}</button>`;
      } else if (wLay.isExpanded && wLay.hasMoreToggle) {
        moreBar.innerHTML = `<button type="button" class="dg-more-pill alt" data-wless="${esc2(wLay.f)}">${T('ย่อเหลือคำหลัก')}</button>`;
      } else moreBar.innerHTML = '';
    }

    host.querySelectorAll('.dg-legend [data-wing]').forEach(el => {
      const n = wLay.counts[el.dataset.wing] || 0;
      el.querySelector('.dg-cnt').textContent = n ? n : '';
      el.classList.toggle('none', !n);
    });
    const tr = host.querySelector('.dg-trail');
    if (tr) tr.innerHTML = trailHTML();

    host.querySelector('.dg-side').innerHTML = wordCardHTML(wLay.f, st.wSel);
    fitBox(wLay.box, animate, wLay.hasMoreToggle);
  }

  function drawWordGrid(rawFocus) {
    const f = base(rawFocus), wrap = host.querySelector('.dg-grid-wrap'); if (!wrap) return;
    const all = wordsForChar(f);
    const groups = {
      PRE: all.filter(w => [...w[0]][0] === f),
      SUF: all.filter(w => { const cs = [...w[0]]; return cs[cs.length - 1] === f && cs[0] !== f; }),
      MID: all.filter(w => { const cs = [...w[0]]; return cs[0] !== f && cs[cs.length - 1] !== f; })
    };
    Object.values(groups).forEach(arr => arr.sort((a, b) => a[2] - b[2] || a[0].length - b[0].length));

    host.querySelectorAll('.dg-legend [data-wing]').forEach(el => {
      const k = el.dataset.wing, n = (groups[k] || []).length;
      el.querySelector('.dg-cnt').textContent = n ? n : '';
      el.classList.toggle('none', !n);
    });
    const tr = host.querySelector('.dg-trail');
    if (tr) tr.innerHTML = trailHTML();

    const secs = ['PRE', 'SUF', 'MID'].map(k => {
      const arr = groups[k];
      if (!arr.length || (st.wFilter && st.wFilter !== k)) return '';
      return `<section class="dg-gsec w-${k}">
        <h4 class="dg-gsh"><i></i><b lang="zh-Hans">${W_WINGS[k].zh}</b><span>${T(W_WINGS[k].th)}</span><small>${arr.length}</small></h4>
        <div class="dg-glist dg-wglist">${arr.map(w => {
          const dot = typeof HzKit !== 'undefined' && HzKit.wordDotHtml ? HzKit.wordDotHtml(w[0]) : '';
          const gl = typeof HzKit !== 'undefined' ? HzKit.wordGloss(w[0], w[3], !!w[4]) : { t: w[3], fb: !w[4] };
          return `<button type="button" class="dg-gtile dg-wgtile${st.wSel === w[0] ? ' on' : ''}"${lvWordC(w[2])} data-wn="${esc2(w[0])}">
            ${dot}<span class="pyx">${esc2(w[1])}</span>
            <b lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${markWord(w[0], f)}</b>
            ${gl.t ? `<small class="${gl.fb ? 'fb' : ''}">${esc2(shortM(gl.t))}</small>` : ''}
          </button>`;
        }).join('')}</div>
      </section>`;
    }).join('');

    wrap.innerHTML = secs || `<p class="tr-empty">${T('ยังไม่มีคำศัพท์ HSK ที่ใช้ตัวอักษรนี้')} (${typeof HzLv === 'undefined' ? '' : HzLv.label()})</p>`;
    host.querySelector('.dg-side').innerHTML = wordCardHTML(f, st.wSel);
  }

  /* ---------- Char Grid view ---------- */
  function drawGrid(f) {
    const wrap = host.querySelector('.dg-grid-wrap'); if (!wrap) return;
    const parts = partsOf(f).map(q => ({ c: q, stage: 'PART' }));
    const used = new Set([f, ...parts.map(p => p.c)]);
    let direct = directKidsOf(f, used);
    const rObj = radOfGlyph.get(f);
    const formBuckets = (rObj && typeof HzKit !== 'undefined' && HzKit.radFormBuckets)
      ? HzKit.radFormBuckets(direct.filter(c => !!D.c[c]), rObj, D) : [];
    if (st.charForm && !formBuckets.some(b => b.key === st.charForm)) st.charForm = null;
    paintCharFormBar(f, formBuckets);
    if (st.charForm) {
      const hit = formBuckets.find(b => b.key === st.charForm);
      const allow = new Set(hit ? hit.chars : []);
      direct = direct.filter(c => allow.has(c));
    }
    const focusPy = pyOf(f);
    const all = parts.slice();
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
    byStage.forEach((arr, k) => { if (k !== 'STACK') arr.sort((a, b) => ((D.c[a.c] || [])[1] || 9) - ((D.c[b.c] || [])[1] || 9)); });

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
          const sd = side(c), py = sd ? sd.split(' · ')[0] : pyOf(c);
          const phAcc = (!sd && it.stage === 'ARMOR' && focusPy && py) ? matchPy(focusPy, py) : '';
          return `<button type="button" class="dg-gtile${it.stage === 'PART' ? ' is-part' : ''}${isB ? ' is-bonus' : ''}"${lvC(c)} data-n="${esc2(c)}">
            ${dot}${repBadge(c, it.stage)}${pyBadgeHTML(py, phAcc)}
            <b lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc2(show(c))}</b>
            ${m.t ? `<small class="${m.fb ? 'fb' : ''}">${esc2(shortM(m.t))}</small>` : ''}
          </button>`;
        }).join('')}</div>
      </section>`;
    }).join('');

    wrap.innerHTML = secs || `<p class="tr-empty">${T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้')} (${typeof HzLv === 'undefined' ? '' : HzLv.label()})</p>`;
    host.querySelector('.dg-side').innerHTML = cardHTML(f, stageForFocus(f), st.trail[st.trail.length - 2]);
    writeBig(f);
  }

  /* ---------- Char Constellation Drawing (Level 2 · Realm 1) ---------- */
  function drawRadial(f, tween) {
    const world = host.querySelector('.dg-world'); if (!world) return;
    st.stageFilter = null;
    world.classList.remove('sf-on', 'z-dim', 'hov');
    host.querySelectorAll('.dg-legend [data-stage].on').forEach(el => { el.classList.remove('on'); el.setAttribute('aria-pressed', 'false'); });
    const next = layoutConstellation(f), prev = cur, from = new Map();
    lay = next; skyLay = null; wLay = null; wSkyLay = null; pLay = null; pSkyLay = null;
    paintCharFormBar(f, next.formBuckets);
    const focusPy = pyOf(f);
    let svg = world.querySelector('svg.dg-svg');
    if (!svg) { svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'dg-svg'); svg.setAttribute('width', '1'); svg.setAttribute('height', '1'); world.prepend(svg); }
    else svg.setAttribute('class', 'dg-svg');
    world.querySelectorAll('.dg-sky-n, .dg-sky-lbl, .dg-wing-lbl, .dg-wn, .dg-wroot, .dg-more, .dg-sec, .dg-none').forEach(el => el.remove());

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
      const inLink = n.ring > 0 ? next.links.find(l => l.to === n.key) : null;
      const pPy = inLink ? pyOf(inLink.from) : focusPy;
      el.className = `dg-n r${n.ring} k-${n.kind} s-${n.stage}${n.ring === 0 ? ' on' : ''}${BONUS[n.c] ? ' is-bonus' : ''}`;
      el.setAttribute('aria-label', `${show(n.c)} ${T(STAGES[n.stage].th)}`);
      el.innerHTML = nodeInner(n.c, n.stage, n.ring > 0 ? pPy : '');
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

    host.querySelector('.dg-side').innerHTML = cardHTML(f, next.nodes[0].stage, st.trail[st.trail.length - 2]);
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

  /* ---------- Camera Framing ---------- */
  let ro = null, roT = 0;
  function watchShape() {
    if (typeof ResizeObserver === 'undefined') return;
    const v = host.querySelector('.dg-view'); if (!v) return;
    if (ro) ro.disconnect();
    ro = new ResizeObserver(() => { clearTimeout(roT); roT = setTimeout(() => {
      if (!host || !host.isConnected || !v.isConnected) return;
      if (isSky()) {
        const curSky = isWord() ? wSkyLay : isPhon() ? pSkyLay : skyLay;
        if (curSky && Math.abs(viewAspect() - curSky.asp) > .14) isWord() ? drawWordSky() : isPhon() ? drawPhonSky() : drawSky();
        else applySkyZone(false);
      } else if (isWord() && wLay) {
        if (Math.abs(viewAspect() - wLay.asp) > .14) drawWordConstellation(wLay.f, false);
        else fitBox(wLay.box, false, wLay.hasMoreToggle);
      } else if (isPhon() && pLay) {
        if (Math.abs(viewAspect() - pLay.asp) > .14) drawPhonConstellation(pLay.f, false);
        else fitBox(pLay.box, false, false);
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
    st.mode = 'focus'; st.charForm = null;
    const i = st.trail.indexOf(c);
    if (i >= 0) st.trail = st.trail.slice(0, i + 1); else st.trail.push(c);
    if (st.trail.length > 12) st.trail = st.trail.slice(-12);
    tone([[660, 990, 0, .09, 'square'], [990, 1480, .06, .12, 'sine']]);
    if (wasSky) paint();
    else if (isGrid()) drawGrid(c);
    else if (radial()) drawRadial(c, true);
    else paint();
  }

  function focusWord(ch, preselectZh = null) {
    const f = base(ch);
    if (!D.cw[f] || !D.cw[f].length) return false;
    const wasSky = isSky() || !isWord();
    S().digiRealm = 'word'; Store.save();
    st.mode = 'focus';
    st.wSel = preselectZh || null;
    const i = st.wTrail.indexOf(f);
    if (i >= 0) st.wTrail = st.wTrail.slice(0, i + 1); else st.wTrail.push(f);
    if (st.wTrail.length > 12) st.wTrail = st.wTrail.slice(-12);
    tone([[580, 880, 0, .09, 'sine'], [880, 1280, .06, .11, 'sine']]);
    if (wasSky) paint();
    else if (isGrid()) drawWordGrid(f);
    else drawWordConstellation(f, true);
    return true;
  }

  function setWordBase(ch, preselectZh = null) {
    const f = base(ch);
    if (!D.cw[f] || !D.cw[f].length) return false;
    const wasSky = isSky() || !isWord();
    S().digiRealm = 'word'; Store.save();
    st.mode = 'focus';
    st.wTrail = [f]; st.wSel = preselectZh || null; st.wOpen = {}; st.wFilter = null;
    tone([[440, 880, 0, .1, 'sine']]);
    if (wasSky) paint();
    else if (isGrid()) drawWordGrid(f);
    else drawWordConstellation(f, true);
    return true;
  }

  function setPhonBase(ch, preselectC = null) {
    const f = base(ch);
    if (!phonKidsOf(f).length) return false;
    const wasSky = isSky() || !isPhon();
    S().digiRealm = 'phon'; Store.save();
    st.mode = 'focus';
    st.pTrail = [f]; st.pSel = preselectC || null; st.pFilter = null;
    tone([[490, 880, 0, .1, 'sine']]);
    if (wasSky) paint();
    else if (isGrid()) drawPhonGrid(f);
    else drawPhonConstellation(f, true);
    return true;
  }

  function focusPhon(ch) {
    const f = base(ch);
    if (!phonKidsOf(f).length) return false;
    const wasSky = isSky() || !isPhon();
    S().digiRealm = 'phon'; Store.save();
    st.mode = 'focus'; st.pSel = null;
    const i = st.pTrail.indexOf(f);
    if (i >= 0) st.pTrail = st.pTrail.slice(0, i + 1); else st.pTrail.push(f);
    if (st.pTrail.length > 12) st.pTrail = st.pTrail.slice(-12);
    tone([[580, 880, 0, .09, 'sine']]);
    if (wasSky) paint();
    else if (isGrid()) drawPhonGrid(f);
    else drawPhonConstellation(f, true);
    return true;
  }

  function switchRealm(nextRealm) {
    if (realm() === nextRealm) return;
    const curChar = isWord() ? st.wTrail[st.wTrail.length - 1] : isPhon() ? st.pTrail[st.pTrail.length - 1] : base(st.trail[st.trail.length - 1]);
    S().digiRealm = nextRealm; Store.save();
    sfx('tap');
    if (st.mode === 'focus') {
      if (nextRealm === 'word') {
        if (wordsForChar(curChar).length > 0) { st.wTrail = [curChar]; st.wSel = null; }
        else st.mode = 'sky';
      } else if (nextRealm === 'phon') {
        if (phonKidsOf(curChar).length > 0) { st.pTrail = [curChar]; st.pSel = null; }
        else st.mode = 'sky';
      } else {
        if (D.c[curChar] || D.cc[curChar] || radOfGlyph.get(curChar) || BONUS[curChar]) { st.trail = [curChar]; st.charForm = null; }
        else st.mode = 'sky';
      }
    }
    paint();
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
    const wasSky = isSky() || isWord() || isPhon();
    S().digiRealm = 'char'; Store.save();
    st.mode = 'focus';
    st.trail = [g]; st.sel = null; st.open = {}; st.stageFilter = null; st.charForm = null;
    tone([[440, 880, 0, .12, 'square']]);
    if (wasSky) paint();
    else if (radial()) drawRadial(g, true);
    else if (isGrid()) drawGrid(g);
    else paint();
    return true;
  }

  function handleSearch(rawVal) {
    const val = String(rawVal || '').trim();
    if (!val) return;
    const chars = [...val];
    if (isWord()) {
      if (chars.length >= 2) {
        const hit = D.w.find(w => w[0] === val || showWord(w[0]) === val);
        if (hit) { setWordBase([...hit[0]][0], hit[0]); return; }
      }
      if (!setWordBase(chars[0])) toast(T('ยังไม่มีคำศัพท์ HSK ที่ใช้ตัวอักษรนี้'), { icon: 'info' });
    } else if (isPhon()) {
      const ch = chars[0];
      // If user searches a compound char like 请 or 猜, jump straight to its phonetic base (青) with 请/猜 preselected!
      if (!setPhonBase(ch)) {
        const ph = D.c[ch] && D.c[ch][12];
        if (!ph || !setPhonBase(ph, ch)) toast(T('ยังไม่มีอักษร HSK ที่ใช้แกนเสียงนี้'), { icon: 'info' });
      }
    } else {
      if (!setBase(chars[0])) toast(T('ยังไม่มีอักษร HSK ที่ต่อยอดจากตัวนี้'), { icon: 'info' });
    }
  }

  function backToSky() {
    st.mode = 'sky'; st.stageFilter = null; st.wFilter = null; st.pFilter = null;
    tone([[580, 440, 0, .09, 'sine']]);
    paint();
  }

  function bind() {
    let drag = null; const pts = new Map(); let pinch = 0;
    host.addEventListener('click', e => {
      const b = e.target.closest('button, [data-view], [data-realm]'); if (!b || (drag && drag.moved)) return;
      const d = b.dataset;
      if (d.close !== undefined) { const fx = host.querySelector('.dg-fx'); fx.hidden = true; fx.innerHTML = ''; return; }
      if (d.realm) { switchRealm(d.realm); return; }
      if (d.skyback !== undefined) { backToSky(); return; }
      if (d.sky) { setBase(d.sky); return; }
      if (d.whub) { isSky() ? setWordBase(d.whub) : focusWord(d.whub); return; }
      if (d.phub) { isSky() ? setPhonBase(d.phub) : focusPhon(d.phub); return; }
      if (d.toword) { setWordBase(d.toword); return; }
      if (d.tophon) { setPhonBase(d.tophon); return; }
      if (d.tochar) { setBase(d.tochar); return; }
      if (d.cform !== undefined) {
        sfx('tap');
        st.charForm = st.charForm === d.cform ? null : (d.cform || null);
        const curF = st.trail[st.trail.length - 1];
        if (isGrid()) drawGrid(curF); else if (radial()) drawRadial(curF, true); else paint();
        return;
      }
      if (d.pn) {
        st.pSel = d.pn;
        host.querySelectorAll('.dg-pn, .dg-gtile[data-pn]').forEach(el => el.classList.toggle('on', el.dataset.pn === d.pn));
        const curF = st.pTrail[st.pTrail.length - 1];
        host.querySelector('.dg-side').innerHTML = phonCardHTML(curF, d.pn);
        try { TTS.speak(d.pn); } catch (err) {}
        return;
      }
      if (d.proot) {
        st.pSel = null;
        host.querySelectorAll('.dg-pn, .dg-gtile[data-pn]').forEach(el => el.classList.remove('on'));
        host.querySelector('.dg-side').innerHTML = phonCardHTML(d.proot, null);
        try { TTS.speak(d.proot); } catch (err) {}
        return;
      }
      if (d.ptrail !== undefined) { focusPhon(st.pTrail[+d.ptrail]); return; }
      if (d.pacc && b.closest('.dg-legend')) {
        if (b.classList.contains('none')) return;
        st.pFilter = st.pFilter === d.pacc ? null : d.pacc;
        host.querySelectorAll('.dg-legend [data-pacc]').forEach(el => {
          const on = el.dataset.pacc === st.pFilter;
          el.classList.toggle('on', on); el.setAttribute('aria-pressed', on);
        });
        if (isGrid()) { drawPhonGrid(st.pTrail[st.pTrail.length - 1]); return; }
        const world = host.querySelector('.dg-world');
        if (world) {
          world.classList.toggle('sf-on', !!st.pFilter);
          world.querySelectorAll('.dg-n, .dg-l').forEach(el => {
            el.classList.toggle('sf-hi', !st.pFilter || el.classList.contains('r0') || el.classList.contains('ph-' + st.pFilter));
          });
        }
        return;
      }
      if (d.skyall !== undefined) { st.skyAll = !st.skyAll; st.skyZone = 'all'; drawSky(); return; }
      if (d.zone) {
        if (isWord()) st.wSkyZone = st.wSkyZone === d.zone && d.zone !== 'all' ? 'all' : d.zone;
        else if (isPhon()) st.pSkyZone = st.pSkyZone === d.zone && d.zone !== 'all' ? 'all' : d.zone;
        else st.skyZone = st.skyZone === d.zone && d.zone !== 'all' ? 'all' : d.zone;
        applySkyZone(true);
        return;
      }
      if (d.view) { if (viewMode() !== d.view) { S().digiView = d.view; Store.save(); paint(); } return; }
      if (d.wn) {
        st.wSel = d.wn;
        host.querySelectorAll('.dg-wn, .dg-wgtile').forEach(el => el.classList.toggle('on', el.dataset.wn === d.wn));
        const curF = st.wTrail[st.wTrail.length - 1];
        host.querySelector('.dg-side').innerHTML = wordCardHTML(curF, d.wn);
        try { TTS.speak(d.wn); } catch (err) {}
        return;
      }
      if (d.wroot) {
        st.wSel = null;
        host.querySelectorAll('.dg-wn, .dg-wgtile').forEach(el => el.classList.remove('on'));
        host.querySelector('.dg-side').innerHTML = wordCardHTML(d.wroot, null);
        try { TTS.speak(d.wroot); } catch (err) {}
        return;
      }
      if (d.wtrail !== undefined) { focusWord(st.wTrail[+d.wtrail]); return; }
      if (d.wmore) { st.wOpen[d.wmore] = true; drawWordConstellation(d.wmore, true); return; }
      if (d.wless) { delete st.wOpen[d.wless]; drawWordConstellation(d.wless, true); return; }
      if (d.wing && b.closest('.dg-legend')) {
        if (b.classList.contains('none')) return;
        st.wFilter = st.wFilter === d.wing ? null : d.wing;
        host.querySelectorAll('.dg-legend [data-wing]').forEach(el => {
          const on = el.dataset.wing === st.wFilter;
          el.classList.toggle('on', on); el.setAttribute('aria-pressed', on);
        });
        if (isGrid()) { drawWordGrid(st.wTrail[st.wTrail.length - 1]); return; }
        const world = host.querySelector('.dg-world');
        if (world) {
          world.classList.toggle('sf-on', !!st.wFilter);
          world.querySelectorAll('.dg-n, .dg-l').forEach(el => {
            el.classList.toggle('sf-hi', !st.wFilter || el.classList.contains('r0') || el.classList.contains('w-' + st.wFilter));
          });
        }
        return;
      }
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
          if (isSky()) { if (isWord()) st.wSkyZone = 'all'; else if (isPhon()) st.pSkyZone = 'all'; else st.skyZone = 'all'; applySkyZone(true); }
          else if (isWord() && wLay) fitBox(wLay.box, true, wLay.hasMoreToggle);
          else if (isPhon() && pLay) fitBox(pLay.box, true, false);
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
      if (e.key === 'Enter' && e.target.matches('.dg-q input')) { handleSearch(e.target.value); e.target.value = ''; }
    });
    host.addEventListener('change', e => {
      if (!e.target.matches('.dg-q input')) return;
      handleSearch(e.target.value); e.target.value = '';
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
    host.addEventListener('pointerover', e => { if (e.pointerType === 'touch' || isSky() || isWord() || isPhon() || !radial()) return; const n = e.target.closest('.dg-n'); hover(n ? n.dataset.n : null); });
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
