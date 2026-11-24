/* 中文很难 · ฝึกเขียนอักษรจีน
   © 2026 李牧飞 Aphisit Kaewnet. All rights reserved. */
/* core engine
   Data constants, stroke/character animation controllers, structure diagrams and the
   Apple Pencil brush canvas, carried over from v3. The new interface lives in app.js. */
/* ==========================================================================
   汉字书写 · Main Application Logic (js/app.js)
   - 214 Kangxi Radicals & Bound Components Index (1-17 Strokes)
   - Six Writings (六书) Theory, Phonetic Families & Character Decomposition
   - Pure CSS Structure Proportion Diagrams
   - Stroke-to-Component Linked Animation & Step-by-Step Highlighter
   ========================================================================== */

const APP = window.APP_DATA || { radicals: [], liushuTheory: { groups: [] }, charDecomp: {}, componentIndex: {}, dict: {} };
const DICT = APP.dict || {};
const RADICALS = APP.radicals || [];
const LIUSHU_THEORY = APP.liushuTheory || { groups: [] };
const CHAR_DECOMP = APP.charDecomp || {};
const COMP_INDEX = APP.componentIndex || {};

// Fast lookup maps
const RAD_BY_ID = {};
const RAD_BY_CHAR = {};
const VARIANT_MAP = {};
RADICALS.forEach(r => {
  RAD_BY_ID[r.id] = r;
  RAD_BY_CHAR[r.radical] = r;
  if (r.kangxiClassic) RAD_BY_CHAR[r.kangxiClassic] = r;
  (r.variants || []).forEach(v => {
    if (!VARIANT_MAP[v.char]) VARIANT_MAP[v.char] = [];
    VARIANT_MAP[v.char].push({ radical: r, variant: v });
  });
});

/* ====================== 32 STROKES DATA ====================== */
const STROKES = [
  {zh:'点',py:'diǎn',th:'จุด',ex:['文','主','六'],src:['文',0],basic:true,tip:'กดปลายพู่กันลงแล้วเฉียงลงขวา หัวเล็กท้ายหนัก',d:'M42 30 Q54 42 58 62'},
  {zh:'横',py:'héng',th:'ขวาง',ex:['一','二','三'],src:['一',0],basic:true,tip:'ลากจากซ้ายไปขวา ปลายขวาเชิดขึ้นเล็กน้อย',d:'M18 52 Q50 46 82 48'},
  {zh:'竖',py:'shù',th:'ตั้ง',ex:['十','中','上'],src:['十',1],basic:true,tip:'ลากจากบนลงล่างให้ตรง',d:'M50 14 L50 86'},
  {zh:'撇',py:'piě',th:'ลากซ้าย',ex:['八','人','千'],src:['八',0],basic:true,tip:'ลากจากขวาบนลงซ้ายล่าง ปลายเรียวแหลม',d:'M64 16 Q60 60 26 84'},
  {zh:'捺',py:'nà',th:'ลากขวา',ex:['人','大','八'],src:['人',1],basic:true,tip:'ลากจากซ้ายบนลงขวาล่าง กดหนักตอนท้ายแล้วปัดออก',d:'M28 18 Q46 62 84 78'},
  {zh:'提',py:'tí',th:'ยก',ex:['我','冲','地'],src:['冲',1],basic:true,tip:'ลากจากซ้ายล่างขึ้นขวาบน สั้นและเรียว',d:'M28 70 L74 38'},
  {zh:'撇点',py:'piědiǎn',th:'ลากซ้าย-จุด',ex:['女','好','巡'],src:['女',0],d:'M58 16 L34 52 L68 80'},
  {zh:'竖提',py:'shùtí',th:'ตั้ง-ยก',ex:['以','民','长'],src:['以',0],d:'M42 16 L42 76 L68 58'},
  {zh:'横折提',py:'héngzhétí',th:'ขวาง-หักมุม-ยก',ex:['说','话','计'],src:['计',1],d:'M30 28 L60 28 L56 78 L74 62'},
  {zh:'弯钩',py:'wāngōu',th:'โค้ง-ขอ',ex:['子','了','家'],src:['了',1],d:'M46 14 Q62 50 52 82 L38 72'},
  {zh:'竖钩',py:'shùgōu',th:'ตั้ง-ขอ',ex:['小','水','丁'],src:['小',0],basic:true,tip:'ลากตั้งลงแล้วตวัดขอไปทางซ้ายบน (เป็นตัวแทนของขีด “钩 ขอ”)',d:'M54 14 L54 82 L40 70'},
  {zh:'竖弯钩',py:'shùwāngōu',th:'ตั้ง-โค้ง-ขอ',ex:['儿','七','比'],src:['儿',1],d:'M32 14 L32 70 Q32 80 44 80 L80 80 L80 64'},
  {zh:'斜钩',py:'xiégōu',th:'เฉียง-ขอ',ex:['我','戈','代'],src:['戈',1],d:'M28 16 Q50 60 78 84 L80 66'},
  {zh:'卧钩',py:'wògōu',th:'นอน-ขอ',ex:['心','必','思'],src:['心',1],d:'M20 40 Q38 86 80 62 L66 58'},
  {zh:'横钩',py:'hénggōu',th:'ขวาง-ขอ',ex:['买','写','字'],src:['写',1],d:'M20 42 L78 42 L66 54'},
  {zh:'横折钩',py:'héngzhégōu',th:'ขวาง-หักมุม-ขอ',ex:['月','门','习'],src:['月',1],d:'M26 22 L72 22 L70 82 L58 72'},
  {zh:'横折弯钩',py:'héngzhéwāngōu',th:'ขวาง-หักมุม-โค้ง-ขอ',ex:['九','几','风'],src:['九',1],d:'M20 24 L50 24 L46 66 Q46 80 60 80 L82 80 L82 64'},
  {zh:'横撇弯钩',py:'héngpiěwāngōu',th:'ขวาง-ลากซ้าย-โค้ง-ขอ',ex:['那','队','都'],src:['队',0],d:'M32 14 L60 14 L44 38 Q72 50 58 80 L46 74'},
  {zh:'横折折折钩',py:'héngzhézhézhégōu',th:'ขวาง-หักมุม-หักมุม-หักมุม-ขอ',ex:['乃','奶','仍'],src:['乃',0],d:'M24 16 L60 16 L54 42 L76 42 Q74 72 56 86 L46 78'},
  {zh:'竖折折钩',py:'shùzhézhégōu',th:'ตั้ง-หักมุม-หักมุม-ขอ',ex:['马','弓','与'],src:['马',1],d:'M32 14 L30 46 L70 46 L68 82 L56 72'},
  {zh:'竖弯',py:'shùwān',th:'ตั้ง-โค้ง',ex:['四','西','酒'],src:['四',3],d:'M36 16 L36 70 Q36 80 46 80 L80 80'},
  {zh:'横折弯',py:'héngzhéwān',th:'ขวาง-หักมุม-โค้ง',ex:['没','朵','投'],src:['朵',1],d:'M22 24 L56 24 L50 66 Q50 78 62 78 L82 78'},
  {zh:'横折',py:'héngzhé',th:'ขวาง-หักมุม',ex:['口','日','田'],src:['口',1],d:'M26 24 L74 24 L70 80'},
  {zh:'竖折',py:'shùzhé',th:'ตั้ง-หักมุม',ex:['山','出','画'],src:['山',1],d:'M30 20 L30 74 L78 74'},
  {zh:'撇折',py:'piězhé',th:'ลากซ้าย-หักมุม',ex:['么','去','台'],src:['么',1],d:'M52 18 L28 66 L76 56'},
  {zh:'横撇',py:'héngpiě',th:'ขวาง-ลากซ้าย',ex:['又','水','冬'],src:['又',0],d:'M26 24 L72 24 Q54 56 28 82'},
  {zh:'横折折撇',py:'héngzhézhépiě',th:'ขวาง-หักมุม-หักมุม-ลากซ้าย',ex:['及','建','延'],src:['及',1],d:'M24 16 L60 16 L46 44 L72 44 Q58 68 28 84'},
  {zh:'竖折撇',py:'shùzhépiě',th:'ตั้ง-หักมุม-ลากซ้าย',ex:['专','传','砖'],src:['专',2],d:'M42 14 L32 48 L70 48 Q54 68 32 86'},
  {zh:'横斜钩',py:'héngxiégōu',th:'ขวาง-เฉียง-ขอ',ex:['飞','风','气'],src:['飞',0],d:'M18 22 L50 22 Q58 62 84 82 L84 64'},
  {zh:'竖折折',py:'shùzhézhé',th:'ตั้ง-หักมุม-หักมุม',ex:['鼎'],src:['鼎',5],d:'M28 16 L28 50 L64 50 L64 84'},
  {zh:'横折折',py:'héngzhézhé',th:'ขวาง-หักมุม-หักมุม',ex:['凹'],src:['凹',1],d:'M20 30 L48 30 L48 62 L80 62'},
  {zh:'横折折折',py:'héngzhézhézhé',th:'ขวาง-หักมุม-หักมุม-หักมุม',ex:['凸'],src:['凸',3],d:'M18 20 L42 20 L42 50 L66 50 L66 84'},
].map((s,i)=>({...s,no:i+1}));

/* ====================== STRUCTURE TREE ====================== */
const ORDER_TIP = {
  lr:'ลำดับการเขียน: ซ้ายก่อนขวา (从左到右)',
  tb:'ลำดับการเขียน: บนก่อนล่าง (从上到下)',
  full:'ลำดับการเขียน: นอก → ใน → ปิดฝาล่างทีหลัง (先里头后封口)',
  tl:'ลำดับการเขียน: นอกก่อนใน (先外后内)',
  tr:'ลำดับการเขียน: นอกก่อนใน (先外后内)',
  bl:'ลำดับการเขียน: ในก่อนนอก (先内后外) — 辶 廴 เขียนทีหลัง',
  top3:'ลำดับการเขียน: นอกก่อนใน (先外后内)',
  bot3:'ลำดับการเขียน: ในก่อนนอก (先内后外)',
  left3:'ลำดับการเขียน: บน → ใน → ปิดซ้ายและล่าง',
};

const STRUCT_TREE = [
  {id:'1',th:'โครงสร้างแบบเดี่ยว',zh:'独体字结构',py:'dútǐzì jiégòu',img:'single',
   desc:'คือตัวอักษรที่เกิดจากขีดพื้นฐานประกอบกันเป็นชิ้นเดียว (สี่เหลี่ยมจัตุรัส 方方正正) ไม่สามารถจับแยกชิ้นส่วนซ้าย-ขวา หรือ บน-ล่าง ได้ (เป็นรากฐานของอักษรอื่นๆ)',
   subPatterns:[
     {no:1, code:'single-1', label:'สี่เหลี่ยมจัตุรัส (方方正正)', desc:'ตัวอักษรเดี่ยว 1 ชิ้นส่วนเต็มช่อง', chars:['山','大','鱼','人','口','日','月','水','火','木']}
   ]},
  {id:'2',th:'โครงสร้างแบบประสม',zh:'合体字结构',py:'hétǐzì jiégòu',
   desc:'คือการนำอักษรเดี่ยวหรือหมวดนำ (Radical / 偏旁) ตั้งแต่ 2 ส่วนขึ้นไปมาประกอบกัน แบ่งออกเป็นกลุ่มหลัก กลุ่มย่อย และรูปแบบย่อยในย่อย (แบบที่ 1–8) ดังนี้',
   children:[
    {id:'2.1',th:'โครงสร้างซ้าย-ขวา',zh:'左右结构',py:'zuǒyòu jiégòu',tip:'lr',children:[
      {id:'2.1.1',th:'ซ้าย-ขวา เท่ากัน (1:1)',zh:'左右相等结构',img:'lr-equal',desc:'แบ่งครึ่งพื้นที่ซ้าย-ขวาเท่ากัน (สี่เหลี่ยมผืนผ้า 2 ข้าง 两个矩形)',
       subPatterns:[
         {no:1, code:'lr-eq-1', label:'แบบที่ 1 (ซ้าย 1 : ขวา 2 เท่ากัน)', desc:'ซ้าย (1) และ ขวา (2) กว้างเท่ากัน', chars:['叫','好','村','林','明','休']}
       ]},
      {id:'2.1.2',th:'ซ้ายแคบ-ขวากว้าง (1:2) — ครบทั้ง 8 แบบย่อย',zh:'左窄右宽结构',img:'lr-narrow-wide',desc:'หมวดนำด้านซ้ายแคบ (1 ส่วน) ส่วนประกอบด้านขวากว้าง (2 ส่วน) แบ่งย่อยตามการซอยชิ้นส่วนด้านขวาและกลางเป็น 8 แบบ',
       subPatterns:[
         {no:1, code:'lr-nw-1', label:'แบบที่ 1', desc:'ซ้ายแคบเดี่ยว (1) + ขวากว้างเดี่ยว (2)', chars:['灯','梅','份','清','晴','请','妈']},
         {no:2, code:'lr-nw-2', label:'แบบที่ 2', desc:'ซ้ายแคบ (1) + ขวาแบ่งเป็น บน (2) และ ล่าง (3)', chars:['楼','招','始','你','吧','话']},
         {no:3, code:'lr-nw-3', label:'แบบที่ 3', desc:'ซ้ายแคบ (1) + ขวาแบ่งเป็น บนซ้าย (2) บนขวา (3) และ ล่าง (4)', chars:['攒','揽','湖','潮']},
         {no:4, code:'lr-nw-4', label:'แบบที่ 4', desc:'ซ้ายแคบ (1) + ขวาแบ่งเป็น บน (2) และ ล่างซ้าย (3) ล่างขวา (4)', chars:['撬','橇','满','落']},
         {no:5, code:'lr-nw-5', label:'แบบที่ 5', desc:'ซ้ายแคบ (1) + ขวาแบ่งเป็น 3 ชั้น: บน (2) / กลาง (3) / ล่าง (4)', chars:['慢','漫','温','渴']},
         {no:6, code:'lr-nw-6', label:'แบบที่ 6', desc:'ซ้ายแคบ (1) + ขวาแบ่งเป็น 4 ชิ้นตาราง 2×2 (2, 3, 4, 5)', chars:['啜','掇']},
         {no:7, code:'lr-nw-7', label:'แบบที่ 7', desc:'ซ้าย (1) + กลาง (2) + ขวาแบ่งเป็น บน (3) และ ล่าง (4)', chars:['假','做','悠']},
         {no:8, code:'lr-nw-8', label:'แบบที่ 8', desc:'ซ้าย (1) + กลางแคบ (2) + ขวาเดี่ยว (3)', chars:['辨','辩','辫']}
       ]},
      {id:'2.1.3',th:'ซ้ายกว้าง-ขวาแคบ (2:1) — ครบทั้ง 3 แบบย่อย',zh:'左宽右窄结构',img:'lr-wide-narrow',desc:'ส่วนหน้าด้านซ้ายกว้าง (2 ส่วน) หมวดนำด้านขวาแคบ (1 ส่วน) แบ่งย่อยเป็น 3 แบบ',
       subPatterns:[
         {no:1, code:'lr-wn-1', label:'แบบที่ 1', desc:'ซ้ายกว้างเดี่ยว (1) + ขวาแคบเดี่ยว (2)', chars:['刚','刘','切','到']},
         {no:2, code:'lr-wn-2', label:'แบบที่ 2', desc:'ซ้ายกว้างแบ่งเป็น บน (1) / ล่าง (2) + ขวาแคบ (3)', chars:['魏','数','静','都','部']},
         {no:3, code:'lr-wn-3', label:'แบบที่ 3', desc:'ซ้ายกว้างแบ่ง 3 ชั้น บน (1) / กลาง (2) / ล่าง (3) + ขวาแคบ (4)', chars:['割','剧','副']}
       ]},
      {id:'2.1.4',th:'ซ้าย-กลาง-ขวา',zh:'左中右结构',py:'zuǒzhōngyòu jiégòu',desc:'แบ่งเป็น 3 ส่วนในแนวนอน',children:[
        {id:'2.1.4.1',th:'ซ้าย-กลาง-ขวา เท่ากัน (1:1:1) — 2 แบบย่อย',zh:'左中右相等结构',img:'lmr-equal',
         subPatterns:[
           {no:1, code:'lmr-eq-1', label:'แบบที่ 1', desc:'ซ้าย (1) + กลาง (2) + ขวา (3) เรียง 3 แถวตั้งเท่ากัน', chars:['街','坳','班','粥']},
           {no:2, code:'lmr-eq-2', label:'แบบที่ 2', desc:'ซ้าย (1) + กลางแบ่งบน (2) ล่าง (3) + ขวา (4)', chars:['激','掰','潮','湖']}
         ]},
        {id:'2.1.4.2',th:'ซ้าย-กลาง-ขวา ไม่เท่ากัน — 2 แบบย่อย',zh:'左中右不等结构',img:'lmr-unequal',
         subPatterns:[
           {no:1, code:'lmr-un-1', label:'แบบที่ 1', desc:'ซ้ายแคบ (1) + กลางกว้าง (2) + ขวาแคบ (3)', chars:['谢','例','树','做']},
           {no:2, code:'lmr-un-2', label:'แบบที่ 2', desc:'ซ้ายกว้าง (1) + กลางแคบ (2) + ขวาแคบ (3)', chars:['翻','棚','搦']}
         ]},
      ]},
    ]},
    {id:'2.2',th:'โครงสร้างบน-ล่าง',zh:'上下结构',py:'shàngxià jiégòu',tip:'tb',children:[
      {id:'2.2.1',th:'บน-ล่าง เท่ากัน (1:1) — 2 แบบย่อย',zh:'上下相等结构',img:'tb-equal',
       subPatterns:[
         {no:1, code:'tb-eq-1', label:'แบบที่ 1', desc:'บนเดี่ยว (1) + ล่างเดี่ยว (2) สัดส่วนเท่ากัน', chars:['要','香','思','早','男','看']},
         {no:2, code:'tb-eq-2', label:'แบบที่ 2', desc:'ซ้ายแบ่งบน (1) ล่าง (2) + ขวาแบ่งบน (3) ล่าง (4)', chars:['能','毁','疑']}
       ]},
      {id:'2.2.2',th:'บนเล็ก-ล่างใหญ่ (1:2) — ครบทั้ง 5 แบบย่อย',zh:'上小下大结构',img:'tb-small-big',
       subPatterns:[
         {no:1, code:'tb-sb-1', label:'แบบที่ 1', desc:'บนเล็กเดี่ยว (1) + ล่างใหญ่เดี่ยว (2)', chars:['花','宝','弄','草','字','安']},
         {no:2, code:'tb-sb-2', label:'แบบที่ 2', desc:'บนเล็ก (1) + ล่างใหญ่แบ่งซ้าย (2) และขวา (3)', chars:['霖','霜','药','落','满']},
         {no:3, code:'tb-sb-3', label:'แบบที่ 3', desc:'บน (1) + กลาง (2) + ล่างแบ่งซ้าย (3) และขวา (4)', chars:['蕊','攀','蒙']},
         {no:4, code:'tb-sb-4', label:'แบบที่ 4', desc:'บนเล็ก (1) + ล่างเป็นกรอบล้อม (2) หุ้มชิ้นส่วนใน (3)', chars:['菡','齿','菌']},
         {no:5, code:'tb-sb-5', label:'แบบที่ 5', desc:'บนเล็ก (1) + ล่างเป็นกรอบเปิดล่าง (2) ล้อมด้านใน (3)', chars:['肖','育','胃']}
       ]},
      {id:'2.2.3',th:'บนใหญ่-ล่างเล็ก (2:1) — ครบทั้ง 5 แบบย่อย',zh:'上大下小结构',img:'tb-big-small',
       subPatterns:[
         {no:1, code:'tb-bs-1', label:'แบบที่ 1', desc:'บนใหญ่เดี่ยว (1) + ล่างเล็กเดี่ยว (2)', chars:['吉','基','各']},
         {no:2, code:'tb-bs-2', label:'แบบที่ 2', desc:'บนแบ่งซ้าย (1) ขวา (2) + ล่างเล็กเดี่ยว (3)', chars:['哲','您','怒','想','替']},
         {no:3, code:'tb-bs-3', label:'แบบที่ 3', desc:'บนซ้ายแบ่งบน-ล่าง (1,2) บนขวา (3) + ล่างเล็ก (4)', chars:['壁','劈','慰']},
         {no:4, code:'tb-bs-4', label:'แบบที่ 4', desc:'บน (1) + กลางแบ่งซ้าย-ขวา (2,3) + ล่าง (4)', chars:['孽','蓝','篮']},
         {no:5, code:'tb-bs-5', label:'แบบที่ 5', desc:'บน (1) + กลาง (2) + ล่างแบ่งซ้าย-ขวา (3,4)', chars:['纛','黎','暴']}
       ]},
      {id:'2.2.4',th:'บน-กลาง-ล่าง',zh:'上中下结构',py:'shàngzhōngxià jiégòu',desc:'แบ่งเป็น 3 ส่วนในแนวตั้ง',children:[
        {id:'2.2.4.1',th:'บน-กลาง-ล่าง เท่ากัน (1:1:1) — ครบทั้ง 6 แบบย่อย',zh:'上中下相等结构',img:'tmb-equal',
         subPatterns:[
           {no:1, code:'tmb-eq-1', label:'แบบที่ 1', desc:'บน (1) + กลาง (2) + ล่าง (3) เรียง 3 ชั้น', chars:['意','累','音','章']},
           {no:2, code:'tmb-eq-2', label:'แบบที่ 2', desc:'บนแบ่งซ้าย-ขวา (1,2) + กลาง (3) + ล่าง (4)', chars:['絮','紫','翼']},
           {no:3, code:'tmb-eq-3', label:'แบบที่ 3', desc:'บนแบ่งซ้าย-ขวา (1,2) + กลาง (3) + ล่างแบ่งซ้าย-ขวา (4,5)', chars:['器','慧']},
           {no:4, code:'tmb-eq-4', label:'แบบที่ 4', desc:'บนแบ่ง 3 ส่วน (1,2,3) + กลาง (4) + ล่าง (5)', chars:['舆','兴','誉']},
           {no:5, code:'tmb-eq-5', label:'แบบที่ 5', desc:'บน (1) + กลางเขียนแกนกลางก่อนซ้าย-ขวา (3,2,4) + ล่าง (5)', chars:['燕']},
           {no:6, code:'tmb-eq-6', label:'แบบที่ 6', desc:'บน (1) + กลาง (2) + ล่างแบ่ง 3 ส่วน (3,4,5)', chars:['赢','羸','瀛']}
         ]},
        {id:'2.2.4.2',th:'บน-กลาง-ล่าง ไม่เท่ากัน — 2 แบบย่อย',zh:'上中下不等结构',img:'tmb-unequal',
         subPatterns:[
           {no:1, code:'tmb-un-1', label:'แบบที่ 1', desc:'บนเล็ก (1) + กลางใหญ่ (2) + ล่างเล็ก (3)', chars:['赛','寒','喜']},
           {no:2, code:'tmb-un-2', label:'แบบที่ 2', desc:'บนเล็ก (1) + กลางเล็ก (2) + ล่างใหญ่ (3)', chars:['曼','崇','蒙']}
         ]},
      ]},
    ]},
    {id:'2.3',th:'โครงสร้างล้อมกรอบ',zh:'包围结构',py:'bāowéi jiégòu',children:[
      {id:'2.3.1',th:'ล้อมรอบทั้ง 4 ด้าน — 2 แบบย่อย',zh:'全包围结构',py:'quán bāowéi',img:'full',tip:'full',
       subPatterns:[
         {no:1, code:'full-1', label:'แบบที่ 1', desc:'กรอบนอก (1) ล้อมชิ้นส่วนเดี่ยวด้านใน (2)', chars:['因','回','园','国','困']},
         {no:2, code:'full-2', label:'แบบที่ 2', desc:'กรอบนอก (1) ล้อมด้านในที่แบ่งเป็น บน (2) และ ล่าง (3)', chars:['圆','图','圊']}
       ]},
      {id:'2.3.2',th:'ล้อมครึ่งเดียว (2 หรือ 3 ด้าน)',zh:'半包围结构',py:'bàn bāowéi',children:[
        {id:'2.3.2.1',th:'ซ้ายบนล้อมขวาล่าง — ครบทั้ง 4 แบบย่อย',zh:'左上包右下结构',img:'tl',tip:'tl',
         subPatterns:[
           {no:1, code:'tl-1', label:'แบบที่ 1', desc:'กรอบซ้ายบน (1) ล้อมด้านในเดี่ยว (2)', chars:['友','石','压','床','厅']},
           {no:2, code:'tl-2', label:'แบบที่ 2', desc:'กรอบซ้ายบน (1) ล้อมด้านในแบ่งซ้าย (2) และขวา (3)', chars:['庇','屁','厕']},
           {no:3, code:'tl-3', label:'แบบที่ 3', desc:'กรอบซ้ายบน (1) ล้อมด้านในแบ่งบน (2) และล่าง (3)', chars:['疩','厚','疫']},
           {no:4, code:'tl-4', label:'แบบที่ 4', desc:'กรอบซ้ายบน (1) ล้อมด้านในแบ่งบน (2) และล่างซ้าย-ขวา (3,4)', chars:['潺','履','靡']}
         ]},
        {id:'2.3.2.2',th:'ซ้ายล่างล้อมขวาบน — ครบทั้ง 4 แบบย่อย',zh:'左下包右上结构',img:'bl',tip:'bl',
         subPatterns:[
           {no:1, code:'bl-1', label:'แบบที่ 1', desc:'เขียนด้านในเดี่ยว (1) ก่อน แล้วลากกรอบซ้ายล่าง (2) ปิดท้าย', chars:['边','处','过','远','这']},
           {no:2, code:'bl-2', label:'แบบที่ 2', desc:'ด้านในแบ่งซ้าย (1) ขวา (2) แล้วลากกรอบซ้ายล่าง (3)', chars:['迎','逊','逃']},
           {no:3, code:'bl-3', label:'แบบที่ 3', desc:'ด้านในแบ่งบน (1) ล่าง (2) แล้วลากกรอบซ้ายล่าง (3)', chars:['迨','迢','逞']},
           {no:4, code:'bl-4', label:'แบบที่ 4', desc:'ด้านในแบ่งซ้าย (1) ขวาบน-ล่าง (2,3) แล้วปิดกรอบซ้ายล่าง (4)', chars:['邂','避','邀']}
         ]},
        {id:'2.3.2.3',th:'ซ้ายล้อมขวา (3 ด้าน) — ครบทั้ง 3 แบบย่อย',zh:'左包右结构',img:'left3',tip:'left3',
         subPatterns:[
           {no:1, code:'left3-1', label:'แบบที่ 1', desc:'ขีดบน (1) → ด้านในเดี่ยว (2) → ปิดกรอบซ้ายล่าง (3)', chars:['叵','匹','医','区','巨']},
           {no:2, code:'left3-2', label:'แบบที่ 2', desc:'ขีดบน (1) → ด้านในแบ่งบน-ล่าง (2,3) → ปิดกรอบซ้ายล่าง (4)', chars:['匿','匾','匮']},
           {no:3, code:'left3-3', label:'แบบที่ 3', desc:'ขีดบน (1) → ด้านในแบ่งซ้าย-ขวา (2,3) → ปิดกรอบซ้ายล่าง (4)', chars:['匪','匣']}
         ]},
        {id:'2.3.2.4',th:'ขวาบนล้อมซ้ายล่าง — ครบทั้ง 4 แบบย่อย',zh:'右上包左下结构',img:'tr',tip:'tr',
         subPatterns:[
           {no:1, code:'tr-1', label:'แบบที่ 1', desc:'กรอบขวาบน (1) ล้อมด้านในเดี่ยว (2)', chars:['勾','句','可','刁','包']},
           {no:2, code:'tr-2', label:'แบบที่ 2', desc:'กรอบขวาบน (1) ล้อมด้านในแบ่งบน (2) และล่าง (3)', chars:['司','氛','贰']},
           {no:3, code:'tr-3', label:'แบบที่ 3', desc:'กรอบขวาบน (1) ล้อมด้านในแบ่ง 3 ชั้น บน (2) กลาง (3) ล่าง (4)', chars:['匐','氧','氨']},
           {no:4, code:'tr-4', label:'แบบที่ 4', desc:'กรอบขวาบน (1) ล้อมด้านในที่มีกรอบเปิดบนซ้อน (2,3)', chars:['匈']}
         ]},
        {id:'2.3.2.5',th:'ซ้ายบนขวาล้อมล่าง (เปิดล่าง) — ครบทั้ง 4 แบบย่อย',zh:'左上右包下结构',img:'top3',tip:'top3',
         subPatterns:[
           {no:1, code:'top3-1', label:'แบบที่ 1', desc:'กรอบบน-ซ้าย-ขวา (1) ล้อมด้านในเดี่ยว (2)', chars:['风','闭','向','问','闻']},
           {no:2, code:'top3-2', label:'แบบที่ 2', desc:'กรอบบน-ซ้าย-ขวา (1) ล้อมด้านในแบ่งบน (2) และล่าง (3)', chars:['同','囧','周']},
           {no:3, code:'top3-3', label:'แบบที่ 3', desc:'กรอบบน-ซ้าย-ขวา (1) ล้อมด้านในแบ่งซ้าย (2) และขวา (3)', chars:['阀','阔','网']},
           {no:4, code:'top3-4', label:'แบบที่ 4', desc:'กรอบบน-ซ้าย-ขวา (1) ล้อมด้านในที่มีซ้ายล่างซ้อน (2,3)', chars:['闼','凤']}
         ]},
        {id:'2.3.2.6',th:'ซ้ายล่างขวาล้อมบน (เปิดบน) — 2 แบบย่อย',zh:'左下右包上结构',img:'bot3',tip:'bot3',
         subPatterns:[
           {no:1, code:'bot3-1', label:'แบบที่ 1', desc:'เขียนด้านในเดี่ยว (1) ก่อน แล้วปิดกรอบล่าง (2)', chars:['画','凶','凷','出']},
           {no:2, code:'bot3-2', label:'แบบที่ 2', desc:'แกนกลาง (1) → ซ้าย-ขวาด้านใน (2,3) → ปิดกรอบล่าง (4)', chars:['幽','函','凼']}
         ]},
      ]},
    ]},
    {id:'2.4',th:'โครงสร้างพิเศษ / โครงสร้างผสม',zh:'特殊结构',py:'tèshū jiégòu',desc:'การนำโครงสร้างมาจัดวางแบบสมมาตร หรือเรียงซ้ำ 3–4 ชิ้นส่วน',children:[
      {id:'2.4.1',th:'โครงสร้างแบบสมส่วนกัน (สมมาตร) — ครบทั้ง 5 แบบย่อย',zh:'对称结构',img:'sym',
       subPatterns:[
         {no:1, code:'sym-1', label:'แบบที่ 1', desc:'ขวางบน (1) + แกนตั้ง (2) ขนาบซ้าย-ขวา (3,4) + ปิดล่าง (5)', chars:['巫','坐']},
         {no:2, code:'sym-2', label:'แบบที่ 2', desc:'ยอดบน (1) + แกนตั้งทะลุ (2) ขนาบซ้าย-ขวาสมมาตร (3,4)', chars:['乖','乘','秉']},
         {no:3, code:'sym-3', label:'แบบที่ 3', desc:'ส่วนยอดกลาง (1) + ขาตั้งสมมาตรซ้าย (2) และขวา (3)', chars:['鼎','北','兆']},
         {no:4, code:'sym-4', label:'แบบที่ 4', desc:'ขวางบน (1) + กากบาทกลาง (2,5) ขนาบ 4 มุม (3,4,6,7) + ล่าง (8)', chars:['噩']},
         {no:5, code:'sym-5', label:'แบบที่ 5', desc:'โครงหลัก (1) ขนาบคู่ซ้าย (2,3) คู่ขวา (4,5) และจบแกน (6)', chars:['爽','尔','夹']}
       ]},
      {id:'2.4.2',th:'โครงสร้างอักษรผิ่น (3 ส่วนรูปสามเหลี่ยม) — 2 แบบย่อย',zh:'品字形结构',img:'pin',
       subPatterns:[
         {no:1, code:'pin-1', label:'แบบที่ 1', desc:'รูปสามเหลี่ยม 1 ชิ้นบน (1) + 2 ชิ้นล่าง (2,3)', chars:['品','众','森','晶','磊','鑫']},
         {no:2, code:'pin-2', label:'แบบที่ 2', desc:'รูปสามเหลี่ยมกลับหัว 2 ชิ้นบน (1,2) + 1 ชิ้นล่าง (3)', chars:['梦','禁','焚','替','辇']}
       ]},
      {id:'2.4.3',th:'โครงสร้างอักษรเถียน (4 ส่วนตาราง)',zh:'田字形结构',img:'tian',
       subPatterns:[
         {no:1, code:'tian-1', label:'สี่เหลี่ยมเล็ก 4 รูป (四个方正)', desc:'แบ่งตาราง 2×2 เรียง บนซ้าย (1) บนขวา (2) ล่างซ้าย (3) ล่างขวา (4)', chars:['叕','燚','喆','敠']}
       ]},
    ]},
  ]},
];

/* ====================== PURE CSS STRUCTURE OVERVIEW DIAGRAM ====================== */
function renderStructCSSDiagram(type, zhLabel, thLabel) {
  let inner = '';
  let ratioText = '';
  switch (type) {
    case 'single':
      inner = `<div class="sbox-part part-single" style="inset:10%">独体<span class="part-sub">100%</span></div>`;
      ratioText = 'อักษรเดี่ยว 1 ชิ้นส่วนเต็มช่อง (方方正正)';
      break;
    case 'lr-equal':
      inner = `
        <div class="sbox-part part-1" style="left:6%;top:8%;bottom:8%;width:42%">ซ้าย<span class="part-sub">1 ส่วน (50%)</span></div>
        <div class="sbox-part part-2" style="right:6%;top:8%;bottom:8%;width:42%">ขวา<span class="part-sub">1 ส่วน (50%)</span></div>`;
      ratioText = 'สัดส่วน ซ้าย 1 : ขวา 1 (เท่ากัน)';
      break;
    case 'lr-narrow-wide':
      inner = `
        <div class="sbox-part part-1" style="left:6%;top:8%;bottom:8%;width:27%">ซ้าย<span class="part-sub">แคบ (1)</span></div>
        <div class="sbox-part part-2" style="right:6%;top:8%;bottom:8%;width:57%">ขวา<span class="part-sub">กว้าง (2)</span></div>`;
      ratioText = 'สัดส่วน ซ้ายแคบ 1 : ขวากว้าง 2 (มี 8 แบบย่อย)';
      break;
    case 'lr-wide-narrow':
      inner = `
        <div class="sbox-part part-1" style="left:6%;top:8%;bottom:8%;width:57%">ซ้าย<span class="part-sub">กว้าง (2)</span></div>
        <div class="sbox-part part-2" style="right:6%;top:8%;bottom:8%;width:27%">ขวา<span class="part-sub">แคบ (1)</span></div>`;
      ratioText = 'สัดส่วน ซ้ายกว้าง 2 : ขวาแคบ 1 (มี 3 แบบย่อย)';
      break;
    case 'lmr-equal':
      inner = `
        <div class="sbox-part part-1" style="left:5%;top:8%;bottom:8%;width:27%">ซ้าย<span class="part-sub">1</span></div>
        <div class="sbox-part part-2" style="left:36.5%;top:8%;bottom:8%;width:27%">กลาง<span class="part-sub">1</span></div>
        <div class="sbox-part part-3" style="right:5%;top:8%;bottom:8%;width:27%">ขวา<span class="part-sub">1</span></div>`;
      ratioText = 'สัดส่วน ซ้าย 1 : กลาง 1 : ขวา 1 (มี 2 แบบย่อย)';
      break;
    case 'lmr-unequal':
      inner = `
        <div class="sbox-part part-1" style="left:5%;top:8%;bottom:8%;width:22%">ซ้าย<span class="part-sub">แคบ</span></div>
        <div class="sbox-part part-2" style="left:31%;top:8%;bottom:8%;width:38%">กลาง<span class="part-sub">กว้าง</span></div>
        <div class="sbox-part part-3" style="right:5%;top:8%;bottom:8%;width:22%">ขวา<span class="part-sub">แคบ</span></div>`;
      ratioText = 'สัดส่วน ซ้าย-กลาง-ขวา ไม่เท่ากัน (มี 2 แบบย่อย)';
      break;
    case 'tb-equal':
      inner = `
        <div class="sbox-part part-1" style="left:8%;right:8%;top:6%;height:42%">บน<span class="part-sub">1 ส่วน (50%)</span></div>
        <div class="sbox-part part-2" style="left:8%;right:8%;bottom:6%;height:42%">ล่าง<span class="part-sub">1 ส่วน (50%)</span></div>`;
      ratioText = 'สัดส่วน บน 1 : ล่าง 1 (มี 2 แบบย่อย)';
      break;
    case 'tb-small-big':
      inner = `
        <div class="sbox-part part-1" style="left:8%;right:8%;top:6%;height:27%">บนเล็ก (1)</div>
        <div class="sbox-part part-2" style="left:8%;right:8%;bottom:6%;height:57%">ล่างใหญ่<span class="part-sub">2 ส่วน</span></div>`;
      ratioText = 'สัดส่วน บนเล็ก 1 : ล่างใหญ่ 2 (มี 5 แบบย่อย)';
      break;
    case 'tb-big-small':
      inner = `
        <div class="sbox-part part-1" style="left:8%;right:8%;top:6%;height:57%">บนใหญ่<span class="part-sub">2 ส่วน</span></div>
        <div class="sbox-part part-2" style="left:8%;right:8%;bottom:6%;height:27%">ล่างเล็ก (1)</div>`;
      ratioText = 'สัดส่วน บนใหญ่ 2 : ล่างเล็ก 1 (มี 5 แบบย่อย)';
      break;
    case 'tmb-equal':
      inner = `
        <div class="sbox-part part-1" style="left:8%;right:8%;top:5%;height:27%">บน (1)</div>
        <div class="sbox-part part-2" style="left:8%;right:8%;top:36.5%;height:27%">กลาง (1)</div>
        <div class="sbox-part part-3" style="left:8%;right:8%;bottom:5%;height:27%">ล่าง (1)</div>`;
      ratioText = 'สัดส่วน บน 1 : กลาง 1 : ล่าง 1 (มี 6 แบบย่อย)';
      break;
    case 'tmb-unequal':
      inner = `
        <div class="sbox-part part-1" style="left:8%;right:8%;top:5%;height:22%">บน</div>
        <div class="sbox-part part-2" style="left:8%;right:8%;top:31%;height:38%">กลาง</div>
        <div class="sbox-part part-3" style="left:8%;right:8%;bottom:5%;height:22%">ล่าง</div>`;
      ratioText = 'สัดส่วน บน-กลาง-ล่าง ไม่เท่ากัน (มี 2 แบบย่อย)';
      break;
    case 'full':
      inner = `
        <div class="sbox-part part-1" style="inset:6%;justify-content:flex-start;padding-top:5px"><span class="part-sub">กรอบนอก (囗)</span></div>
        <div class="sbox-part part-2" style="inset:25%">ด้านใน</div>`;
      ratioText = 'ล้อมรอบทั้ง 4 ด้าน (มี 2 แบบย่อย)';
      break;
    case 'tl':
      inner = `
        <div class="sbox-part part-1" style="left:6%;top:6%;right:6%;height:24%">กรอบซ้ายบน (广/厂/尸)</div>
        <div class="sbox-part part-1" style="left:6%;top:6%;bottom:6%;width:24%;border-top:0"></div>
        <div class="sbox-part part-2" style="left:34%;top:34%;right:8%;bottom:8%">ด้านใน<span class="part-sub">ขวาล่าง</span></div>`;
      ratioText = 'ซ้ายบนล้อมขวาล่าง (มี 4 แบบย่อย)';
      break;
    case 'bl':
      inner = `
        <div class="sbox-part part-2" style="left:32%;top:8%;right:8%;bottom:32%">ด้านใน<span class="part-sub">เขียนก่อน</span></div>
        <div class="sbox-part part-1" style="left:6%;top:12%;bottom:6%;width:22%">辶</div>
        <div class="sbox-part part-1" style="left:6%;bottom:6%;right:6%;height:22%">กรอบซ้ายล่าง</div>`;
      ratioText = 'ซ้ายล่างล้อมขวาบน (มี 4 แบบย่อย)';
      break;
    case 'left3':
      inner = `
        <div class="sbox-part part-1" style="left:6%;top:6%;right:8%;height:20%">บน</div>
        <div class="sbox-part part-1" style="left:6%;top:6%;bottom:6%;width:22%">ซ้าย</div>
        <div class="sbox-part part-1" style="left:6%;bottom:6%;right:8%;height:20%">ล่าง</div>
        <div class="sbox-part part-2" style="left:32%;top:30%;right:8%;bottom:30%">ด้านใน</div>`;
      ratioText = 'ซ้ายล้อมขวา 3 ด้าน (มี 3 แบบย่อย)';
      break;
    case 'tr':
      inner = `
        <div class="sbox-part part-1" style="left:8%;top:6%;right:6%;height:24%">กรอบขวาบน (勹/戈/气)</div>
        <div class="sbox-part part-1" style="right:6%;top:6%;bottom:6%;width:24%"></div>
        <div class="sbox-part part-2" style="left:8%;top:34%;right:34%;bottom:8%">ด้านใน<span class="part-sub">ซ้ายล่าง</span></div>`;
      ratioText = 'ขวาบนล้อมซ้ายล่าง (มี 4 แบบย่อย)';
      break;
    case 'top3':
      inner = `
        <div class="sbox-part part-1" style="left:6%;top:6%;right:6%;height:22%">กรอบบน (冂/门/风)</div>
        <div class="sbox-part part-1" style="left:6%;top:6%;bottom:8%;width:20%"></div>
        <div class="sbox-part part-1" style="right:6%;top:6%;bottom:8%;width:20%"></div>
        <div class="sbox-part part-2" style="left:29%;top:32%;right:29%;bottom:8%">ด้านใน</div>`;
      ratioText = 'ซ้ายบนขวาล้อมล่าง เปิดล่าง (มี 4 แบบย่อย)';
      break;
    case 'bot3':
      inner = `
        <div class="sbox-part part-2" style="left:29%;top:8%;right:29%;bottom:32%">ด้านใน<span class="part-sub">เขียนก่อน</span></div>
        <div class="sbox-part part-1" style="left:6%;top:12%;bottom:6%;width:20%"></div>
        <div class="sbox-part part-1" style="right:6%;top:12%;bottom:6%;width:20%"></div>
        <div class="sbox-part part-1" style="left:6%;bottom:6%;right:6%;height:22%">กรอบล่าง (凵)</div>`;
      ratioText = 'ซ้ายล่างขวาล้อมบน เปิดบน (มี 2 แบบย่อย)';
      break;
    case 'sym':
      inner = `
        <div class="sbox-part part-2" style="left:6%;top:18%;bottom:18%;width:26%">ซ้าย</div>
        <div class="sbox-part part-1" style="left:36%;top:6%;bottom:6%;width:28%">แกนกลาง</div>
        <div class="sbox-part part-2" style="right:6%;top:18%;bottom:18%;width:26%">ขวา</div>`;
      ratioText = 'สมมาตรซ้าย-ขวา โดยมีแกนกลาง (มี 5 แบบย่อย)';
      break;
    case 'pin':
      inner = `
        <div class="sbox-part part-1" style="left:26%;right:26%;top:6%;height:41%">บน (1)</div>
        <div class="sbox-part part-2" style="left:6%;width:41%;bottom:6%;height:41%">ซ้ายล่าง (2)</div>
        <div class="sbox-part part-3" style="right:6%;width:41%;bottom:6%;height:41%">ขวาล่าง (3)</div>`;
      ratioText = 'โครงสร้าง 3 ส่วนรูปสามเหลี่ยม 品 (มี 2 แบบย่อย)';
      break;
    case 'tian':
      inner = `
        <div class="sbox-part part-1" style="left:6%;top:6%;width:41%;height:41%">1</div>
        <div class="sbox-part part-2" style="right:6%;top:6%;width:41%;height:41%">2</div>
        <div class="sbox-part part-3" style="left:6%;bottom:6%;width:41%;height:41%">3</div>
        <div class="sbox-part part-4" style="right:6%;bottom:6%;width:41%;height:41%">4</div>`;
      ratioText = 'โครงสร้าง 4 ส่วนตาราง 2×2 (田字形)';
      break;
    default:
      inner = `<div class="sbox-part part-single" style="inset:10%">${zhLabel || ''}</div>`;
      ratioText = thLabel || '';
  }
  return `
    <div class="struct-css-card">
      <div class="struct-css-box">${inner}</div>
      <div class="struct-css-caption">${zhLabel || ''}</div>
      <div class="struct-css-ratio">${ratioText}</div>
    </div>
  `;
}

/* ====================== PURE CSS SUB-PATTERN DIAGRAM GENERATOR ====================== */
function renderSubPatternDiagram(code) {
  const B = (n, st = '', cls = '') => `<div class="sp-block ${cls}" style="${st}">${n}</div>`;
  const COL = (children, st = 'flex:1') => `<div style="display:flex;flex-direction:column;gap:4px;${st}">${children}</div>`;
  const ROW = (children, st = 'flex:1') => `<div style="display:flex;gap:4px;${st}">${children}</div>`;

  let html = '';
  switch (code) {
    // 1.0 Single
    case 'single-1':
      html = B('1', 'flex:1;font-size:1.15rem');
      break;
    // 2.1.1 Left-Right Equal
    case 'lr-eq-1':
      html = B('1', 'flex:1') + B('2', 'flex:1');
      break;
    // 2.1.2 Left Narrow - Right Wide (8 Sub-Patterns matching Image 4.1)
    case 'lr-nw-1':
      html = B('1', 'flex:1') + B('2', 'flex:2.1');
      break;
    case 'lr-nw-2':
      html = B('1', 'flex:1') + COL(B('2', 'flex:1') + B('3', 'flex:1'), 'flex:2.1');
      break;
    case 'lr-nw-3':
      html = B('1', 'flex:1') + COL(ROW(B('2', 'flex:1') + B('3', 'flex:1'), 'flex:1') + B('4', 'flex:1'), 'flex:2.1');
      break;
    case 'lr-nw-4':
      html = B('1', 'flex:1') + COL(B('2', 'flex:1') + ROW(B('3', 'flex:1') + B('4', 'flex:1'), 'flex:1'), 'flex:2.1');
      break;
    case 'lr-nw-5':
      html = B('1', 'flex:1') + COL(B('2', 'flex:1') + B('3', 'flex:1') + B('4', 'flex:1'), 'flex:2.1');
      break;
    case 'lr-nw-6':
      html = B('1', 'flex:1') + COL(ROW(B('2', 'flex:1') + B('3', 'flex:1'), 'flex:1') + ROW(B('4', 'flex:1') + B('5', 'flex:1'), 'flex:1'), 'flex:2.1');
      break;
    case 'lr-nw-7':
      html = B('1', 'flex:1') + B('2', 'flex:1') + COL(B('3', 'flex:1') + B('4', 'flex:1'), 'flex:1.2');
      break;
    case 'lr-nw-8':
      html = B('1', 'flex:1.1') + B('2', 'flex:0.85') + B('3', 'flex:1.1');
      break;
    // 2.1.3 Left Wide - Right Narrow (3 Sub-Patterns matching Image 4.3)
    case 'lr-wn-1':
      html = B('1', 'flex:2.1') + B('2', 'flex:1');
      break;
    case 'lr-wn-2':
      html = COL(B('1', 'flex:1') + B('2', 'flex:1'), 'flex:2.1') + B('3', 'flex:1');
      break;
    case 'lr-wn-3':
      html = COL(B('1', 'flex:1') + B('2', 'flex:1') + B('3', 'flex:1'), 'flex:2.1') + B('4', 'flex:1');
      break;
    // 2.1.4.1 Left-Middle-Right Equal (2 Sub-Patterns matching Image 5.1)
    case 'lmr-eq-1':
      html = B('1', 'flex:1') + B('2', 'flex:1') + B('3', 'flex:1');
      break;
    case 'lmr-eq-2':
      html = B('1', 'flex:1') + COL(B('2', 'flex:1') + B('3', 'flex:1'), 'flex:1') + B('4', 'flex:1');
      break;
    // 2.1.4.2 Left-Middle-Right Unequal (2 Sub-Patterns matching Image 5.2)
    case 'lmr-un-1':
      html = B('1', 'flex:0.8') + B('2', 'flex:1.7') + B('3', 'flex:0.8');
      break;
    case 'lmr-un-2':
      html = B('1', 'flex:1.7') + B('2', 'flex:0.8') + B('3', 'flex:0.8');
      break;
    // 2.2.1 Top-Bottom Equal (2 Sub-Patterns matching Image 2.1)
    case 'tb-eq-1':
      html = COL(B('1', 'flex:1') + B('2', 'flex:1'), 'width:100%');
      break;
    case 'tb-eq-2':
      html = COL(ROW(B('1', 'flex:1') + B('3', 'flex:1'), 'flex:1') + ROW(B('2', 'flex:1') + B('4', 'flex:1'), 'flex:1'), 'width:100%');
      break;
    // 2.2.2 Top Small - Bottom Big (5 Sub-Patterns matching Image 2.2)
    case 'tb-sb-1':
      html = COL(B('1', 'flex:1') + B('2', 'flex:2.1'), 'width:100%');
      break;
    case 'tb-sb-2':
      html = COL(B('1', 'flex:1') + ROW(B('2', 'flex:1') + B('3', 'flex:1'), 'flex:2.1'), 'width:100%');
      break;
    case 'tb-sb-3':
      html = COL(B('1', 'flex:0.9') + B('2', 'flex:0.9') + ROW(B('3', 'flex:1') + B('4', 'flex:1'), 'flex:1.3'), 'width:100%');
      break;
    case 'tb-sb-4':
      html = COL(
        B('1', 'flex:0.9') +
        `<div class="sp-block" style="flex:2.1;position:relative;align-items:flex-start;padding-top:3px">2<div class="sp-block inner-white" style="position:absolute;left:16%;right:16%;bottom:16%;height:50%">3</div></div>`,
        'width:100%'
      );
      break;
    case 'tb-sb-5':
      html = COL(
        B('1', 'flex:0.9') +
        `<div class="sp-block" style="flex:2.1;position:relative;align-items:flex-start;padding-top:3px">2<div class="sp-block inner-white" style="position:absolute;left:20%;right:20%;bottom:0;height:62%;border-bottom:0">3</div></div>`,
        'width:100%'
      );
      break;
    // 2.2.3 Top Big - Bottom Small (5 Sub-Patterns matching Image 2.3)
    case 'tb-bs-1':
      html = COL(B('1', 'flex:2.1') + B('2', 'flex:1'), 'width:100%');
      break;
    case 'tb-bs-2':
      html = COL(ROW(B('1', 'flex:1') + B('2', 'flex:1'), 'flex:2.1') + B('3', 'flex:1'), 'width:100%');
      break;
    case 'tb-bs-3':
      html = COL(ROW(COL(B('1', 'flex:1') + B('2', 'flex:1'), 'flex:1') + B('3', 'flex:1'), 'flex:2.1') + B('4', 'flex:1'), 'width:100%');
      break;
    case 'tb-bs-4':
      html = COL(B('1', 'flex:0.95') + ROW(B('2', 'flex:1') + B('3', 'flex:1'), 'flex:1.1') + B('4', 'flex:0.95'), 'width:100%');
      break;
    case 'tb-bs-5':
      html = COL(B('1', 'flex:0.95') + B('2', 'flex:0.95') + ROW(B('3', 'flex:1') + B('4', 'flex:1'), 'flex:1.1'), 'width:100%');
      break;
    // 2.2.4.1 Top-Middle-Bottom Equal (6 Sub-Patterns matching Image 3.1)
    case 'tmb-eq-1':
      html = COL(B('1', 'flex:1') + B('2', 'flex:1') + B('3', 'flex:1'), 'width:100%');
      break;
    case 'tmb-eq-2':
      html = COL(ROW(B('1', 'flex:1') + B('2', 'flex:1'), 'flex:1') + B('3', 'flex:1') + B('4', 'flex:1'), 'width:100%');
      break;
    case 'tmb-eq-3':
      html = COL(ROW(B('1', 'flex:1') + B('2', 'flex:1'), 'flex:1') + B('3', 'flex:1') + ROW(B('4', 'flex:1') + B('5', 'flex:1'), 'flex:1'), 'width:100%');
      break;
    case 'tmb-eq-4':
      html = COL(ROW(B('1', 'flex:1') + B('2', 'flex:1') + B('3', 'flex:1'), 'flex:1') + B('4', 'flex:1') + B('5', 'flex:1'), 'width:100%');
      break;
    case 'tmb-eq-5':
      html = COL(B('1', 'flex:1') + ROW(B('3', 'flex:1') + B('2', 'flex:1') + B('4', 'flex:1'), 'flex:1') + B('5', 'flex:1'), 'width:100%');
      break;
    case 'tmb-eq-6':
      html = COL(B('1', 'flex:1') + B('2', 'flex:1') + ROW(B('3', 'flex:1') + B('4', 'flex:1') + B('5', 'flex:1'), 'flex:1'), 'width:100%');
      break;
    // 2.2.4.2 Top-Middle-Bottom Unequal (2 Sub-Patterns matching Image 3.2)
    case 'tmb-un-1':
      html = COL(B('1', 'flex:0.75') + B('2', 'flex:1.6') + B('3', 'flex:0.85'), 'width:100%');
      break;
    case 'tmb-un-2':
      html = COL(B('1', 'flex:0.75') + B('2', 'flex:0.85') + B('3', 'flex:1.6'), 'width:100%');
      break;
    // 2.3.1 Full Enclosure (2 Sub-Patterns matching Image 6)
    case 'full-1':
      html = `<div class="sp-block" style="flex:1;position:relative;align-items:flex-start;padding-top:3px">1<div class="sp-block inner-white" style="position:absolute;inset:22%">2</div></div>`;
      break;
    case 'full-2':
      html = `<div class="sp-block" style="flex:1;position:relative;align-items:flex-start;padding-top:3px">1<div style="position:absolute;inset:22%;background:#fdfbf7;padding:3px;display:flex;flex-direction:column;gap:3px">${B('2','flex:1')}${B('3','flex:1')}</div></div>`;
      break;
    // 2.3.2.1 Top-Left Enclosure (4 Sub-Patterns matching Image 7.1)
    case 'tl-1':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;justify-content:flex-start;padding:4px 7px">1</div>
        <div style="position:absolute;right:0;bottom:0;width:72%;height:72%;background:#fdfbf7;padding:4px 0 0 4px;display:flex">${B('2','flex:1')}</div>
      </div>`;
      break;
    case 'tl-2':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;justify-content:flex-start;padding:4px 7px">1</div>
        <div style="position:absolute;right:0;bottom:0;width:72%;height:72%;background:#fdfbf7;padding:4px 0 0 4px;display:flex;gap:4px">${B('2','flex:1')}${B('3','flex:1')}</div>
      </div>`;
      break;
    case 'tl-3':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;justify-content:flex-start;padding:4px 7px">1</div>
        <div style="position:absolute;right:0;bottom:0;width:72%;height:72%;background:#fdfbf7;padding:4px 0 0 4px;display:flex;flex-direction:column;gap:4px">${B('2','flex:1')}${B('3','flex:1')}</div>
      </div>`;
      break;
    case 'tl-4':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;justify-content:flex-start;padding:4px 7px">1</div>
        <div style="position:absolute;right:0;bottom:0;width:72%;height:72%;background:#fdfbf7;padding:4px 0 0 4px;display:flex;flex-direction:column;gap:4px">${B('2','flex:1')}${ROW(B('3','flex:1')+B('4','flex:1'),'flex:1')}</div>
      </div>`;
      break;
    // 2.3.2.2 Bottom-Left Enclosure (4 Sub-Patterns matching Image 7.2)
    case 'bl-1':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-end;justify-content:flex-start;padding:4px 7px">2</div>
        <div style="position:absolute;right:0;top:0;width:72%;height:72%;background:#fdfbf7;padding:0 0 4px 4px;display:flex">${B('1','flex:1')}</div>
      </div>`;
      break;
    case 'bl-2':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-end;justify-content:flex-start;padding:4px 7px">3</div>
        <div style="position:absolute;right:0;top:0;width:72%;height:72%;background:#fdfbf7;padding:0 0 4px 4px;display:flex;gap:4px">${B('1','flex:1')}${B('2','flex:1')}</div>
      </div>`;
      break;
    case 'bl-3':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-end;justify-content:flex-start;padding:4px 7px">3</div>
        <div style="position:absolute;right:0;top:0;width:72%;height:72%;background:#fdfbf7;padding:0 0 4px 4px;display:flex;flex-direction:column;gap:4px">${B('1','flex:1')}${B('2','flex:1')}</div>
      </div>`;
      break;
    case 'bl-4':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-end;justify-content:flex-start;padding:4px 7px">4</div>
        <div style="position:absolute;right:0;top:0;width:72%;height:72%;background:#fdfbf7;padding:0 0 4px 4px;display:flex;gap:4px">${B('1','flex:1')}${COL(B('2','flex:1')+B('3','flex:1'),'flex:1')}</div>
      </div>`;
      break;
    // 2.3.2.3 Left-Three Enclosure (3 Sub-Patterns matching Image 7.3)
    case 'left3-1':
      html = COL(
        B('1', 'height:22%') +
        `<div style="flex:1;position:relative">
          <div class="sp-block" style="position:absolute;inset:0;align-items:flex-end;justify-content:flex-start;padding:3px 6px">3</div>
          <div style="position:absolute;right:0;top:0;width:72%;height:72%;background:#fdfbf7;padding:0 0 4px 4px;display:flex">${B('2','flex:1')}</div>
        </div>`,
        'width:100%'
      );
      break;
    case 'left3-2':
      html = COL(
        B('1', 'height:22%') +
        `<div style="flex:1;position:relative">
          <div class="sp-block" style="position:absolute;inset:0;align-items:flex-end;justify-content:flex-start;padding:3px 6px">4</div>
          <div style="position:absolute;right:0;top:0;width:72%;height:72%;background:#fdfbf7;padding:0 0 4px 4px;display:flex;flex-direction:column;gap:3px">${B('2','flex:1')}${B('3','flex:1')}</div>
        </div>`,
        'width:100%'
      );
      break;
    case 'left3-3':
      html = COL(
        B('1', 'height:22%') +
        `<div style="flex:1;position:relative">
          <div class="sp-block" style="position:absolute;inset:0;align-items:flex-end;justify-content:flex-start;padding:3px 6px">4</div>
          <div style="position:absolute;right:0;top:0;width:72%;height:72%;background:#fdfbf7;padding:0 0 4px 4px;display:flex;gap:3px">${B('2','flex:1')}${B('3','flex:1')}</div>
        </div>`,
        'width:100%'
      );
      break;
    // 2.3.2.4 Top-Right Enclosure (4 Sub-Patterns matching Image 7.4)
    case 'tr-1':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;justify-content:flex-end;padding:4px 7px">1</div>
        <div style="position:absolute;left:0;bottom:0;width:72%;height:72%;background:#fdfbf7;padding:4px 4px 0 0;display:flex">${B('2','flex:1')}</div>
      </div>`;
      break;
    case 'tr-2':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;justify-content:flex-end;padding:4px 7px">1</div>
        <div style="position:absolute;left:0;bottom:0;width:72%;height:72%;background:#fdfbf7;padding:4px 4px 0 0;display:flex;flex-direction:column;gap:4px">${B('2','flex:1')}${B('3','flex:1')}</div>
      </div>`;
      break;
    case 'tr-3':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;justify-content:flex-end;padding:4px 7px">1</div>
        <div style="position:absolute;left:0;bottom:0;width:72%;height:72%;background:#fdfbf7;padding:4px 4px 0 0;display:flex;flex-direction:column;gap:3px">${B('2','flex:1')}${B('3','flex:1')}${B('4','flex:1')}</div>
      </div>`;
      break;
    case 'tr-4':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;justify-content:flex-end;padding:4px 7px">1</div>
        <div style="position:absolute;left:0;bottom:0;width:72%;height:72%;background:#fdfbf7;padding:4px 4px 0 0;display:flex">
          <div class="sp-block" style="flex:1;position:relative;align-items:flex-end;padding-bottom:2px">3<div style="position:absolute;top:0;left:22%;right:22%;height:65%;background:#fdfbf7;padding:0 2px 2px;display:flex">${B('2','flex:1')}</div></div>
        </div>
      </div>`;
      break;
    // 2.3.2.5 Top-Three Enclosure (4 Sub-Patterns matching Image 7.5)
    case 'top3-1':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;padding-top:3px">1</div>
        <div style="position:absolute;left:18%;right:18%;bottom:0;height:72%;background:#fdfbf7;padding:4px 4px 0;display:flex">${B('2','flex:1')}</div>
      </div>`;
      break;
    case 'top3-2':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;padding-top:3px">1</div>
        <div style="position:absolute;left:18%;right:18%;bottom:0;height:72%;background:#fdfbf7;padding:4px 4px 0;display:flex;flex-direction:column;gap:4px">${B('2','flex:1')}${B('3','flex:1')}</div>
      </div>`;
      break;
    case 'top3-3':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;padding-top:3px">1</div>
        <div style="position:absolute;left:18%;right:18%;bottom:0;height:72%;background:#fdfbf7;padding:4px 4px 0;display:flex;gap:4px">${B('2','flex:1')}${B('3','flex:1')}</div>
      </div>`;
      break;
    case 'top3-4':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-start;padding-top:3px">1</div>
        <div style="position:absolute;left:18%;right:18%;bottom:0;height:72%;background:#fdfbf7;padding:4px 4px 0;display:flex">
          <div class="sp-block" style="flex:1;position:relative;align-items:flex-end;justify-content:flex-start;padding:2px 5px">3<div style="position:absolute;top:0;right:0;width:68%;height:68%;background:#fdfbf7;padding:0 0 2px 2px;display:flex">${B('2','flex:1')}</div></div>
        </div>
      </div>`;
      break;
    // 2.3.2.6 Bottom-Three Enclosure (2 Sub-Patterns matching Image 7.6)
    case 'bot3-1':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-end;padding-bottom:3px">2</div>
        <div style="position:absolute;left:20%;right:20%;top:0;height:72%;background:#fdfbf7;padding:0 4px 4px;display:flex">${B('1','flex:1')}</div>
      </div>`;
      break;
    case 'bot3-2':
      html = `<div style="position:relative;width:100%;height:100%">
        <div class="sp-block" style="position:absolute;inset:0;align-items:flex-end;padding-bottom:3px">4</div>
        <div style="position:absolute;left:16%;right:16%;top:0;height:72%;background:#fdfbf7;padding:0 3px 3px;display:flex;gap:3px">${B('2','flex:1')}${B('1','flex:1')}${B('3','flex:1')}</div>
      </div>`;
      break;
    // 2.4.1 Symmetrical Structure (5 Sub-Patterns matching Image 8)
    case 'sym-1':
      html = COL(B('1', 'flex:0.8') + ROW(B('3', 'flex:1') + B('2', 'flex:0.9') + B('4', 'flex:1'), 'flex:1.4') + B('5', 'flex:0.8'), 'width:100%');
      break;
    case 'sym-2':
      html = COL(B('1', 'flex:0.8') + ROW(B('3', 'flex:1') + B('2', 'flex:0.9') + B('4', 'flex:1'), 'flex:2.2'), 'width:100%');
      break;
    case 'sym-3':
      html = COL(
        `<div style="flex:1;display:flex;justify-content:center">${B('1','width:42%')}</div>` +
        ROW(B('2', 'flex:1') + B('3', 'flex:1'), 'flex:1.4;gap:14px'),
        'width:100%'
      );
      break;
    case 'sym-4':
      html = COL(
        B('1', 'flex:0.65') +
        ROW(COL(B('3','flex:1')+B('6','flex:1'),'flex:1') + B('2','flex:0.75') + COL(B('4','flex:1')+B('7','flex:1'),'flex:1'), 'flex:1.7') +
        B('8', 'flex:0.65'),
        'width:100%'
      );
      break;
    case 'sym-5':
      html = COL(
        B('1', 'flex:0.65') +
        ROW(COL(B('2','flex:1')+B('3','flex:1'),'flex:1') + B('6','flex:0.85') + COL(B('4','flex:1')+B('5','flex:1'),'flex:1'), 'flex:2.2'),
        'width:100%'
      );
      break;
    // 2.4.2 Pin Structure (2 Sub-Patterns matching Image 9)
    case 'pin-1':
      html = COL(
        `<div style="flex:1;display:flex;justify-content:center">${B('1','width:52%')}</div>` +
        ROW(B('2', 'flex:1') + B('3', 'flex:1'), 'flex:1;gap:8px'),
        'width:100%'
      );
      break;
    case 'pin-2':
      html = COL(
        ROW(B('1', 'flex:1') + B('2', 'flex:1'), 'flex:1;gap:8px') +
        `<div style="flex:1;display:flex;justify-content:center">${B('3','width:52%')}</div>`,
        'width:100%'
      );
      break;
    // 2.4.3 Tian Structure (1 Sub-Pattern matching Image 10)
    case 'tian-1':
      html = COL(
        ROW(B('1', 'flex:1') + B('2', 'flex:1'), 'flex:1;gap:6px') +
        ROW(B('3', 'flex:1') + B('4', 'flex:1'), 'flex:1;gap:6px'),
        'width:100%'
      );
      break;
    default:
      html = B('1', 'flex:1');
  }
  return `<div class="sp-diagram">${html}</div>`;
}


/* ====================== RULES DATA ====================== */
const RULES_BASIC = [
  {zh:'先横后竖',py:'xiān héng hòu shù',th:'เส้นขวางก่อนเส้นตั้ง',ex:[['十','一 十'],['干','一 二 干'],['丰','一 二 三 丰',1]]},
  {zh:'先撇后捺',py:'xiān piě hòu nà',th:'เส้นลากซ้ายก่อนเส้นลากขวา',ex:[['人','丿 人'],['个','丿 人 个'],['八','丿 八',1]]},
  {zh:'从上到下',py:'cóng shàng dào xià',th:'จากบนลงล่าง',ex:[['三','一 二 三'],['云','一 二 云'],['早','日 早',1]]},
  {zh:'从左到右',py:'cóng zuǒ dào yòu',th:'จากซ้ายไปขวา',ex:[['好','女 好'],['吧','口 吧'],['你','亻 你',1]]},
  {zh:'从外到内',py:'cóng wài dào nèi',th:'ข้างนอกก่อนข้างใน',ex:[['月','冂 月'],['闭','门 闭'],['问','门 问',1]]},
  {zh:'先里头后封口',py:'xiān lǐtou hòu fēngkǒu',th:'ข้างนอกก่อน แล้วข้างใน แล้วค่อยปิด',ex:[['日','冂 日 日'],['回','冂 回 回'],['国','冂 国 国',1]]},
  {zh:'先中间后两边',py:'xiān zhōngjiān hòu liǎngbiān',th:'ตรงกลางก่อน แล้วค่อยซ้าย-ขวา',ex:[['小','亅 小 小'],['办','力 办 办'],['水','亅 水 水',1]]},
];
const RULES_EXTRA = [
  {zh:'带点的字',th:'ตัวอักษรที่มีจุด',subs:[
    {th:'เขียนจุดที่อยู่ตรงกลางหรือทางซ้ายก่อน',zh:'点在正上或左上，先写',ex:[['门','丶 门'],['义','丶 丿 义'],['主','丶 主',1]]},
    {th:'เขียนจุดที่อยู่ทางขวาทีหลัง',zh:'点在右上，后写',ex:[['犬','ナ 大 犬'],['戈','七 弋 戈'],['发','友 发',1]]},
    {th:'เขียนจุดที่อยู่ข้างในทีหลัง',zh:'点在里面，后写',ex:[['叉','フ 又 叉'],['瓦','丆 瓦 瓦'],['太','大 太',1]]},
  ]},
  {zh:'两面包围的字',th:'อักษรที่ถูกล้อมกรอบสองด้าน',subs:[
    {th:'ล้อมกรอบด้านบนและขวา ให้เขียนข้างนอกก่อนข้างใน',zh:'右上包围：先外后内',ex:[['刁','フ 刁'],['句','勹 句'],['可','丁 可',1]]},
    {th:'ล้อมกรอบด้านบนและซ้าย ให้เขียนข้างนอกก่อนข้างใน',zh:'左上包围：先外后内',ex:[['床','广 床'],['屋','尸 屋'],['厅','厂 厅',1]]},
    {th:'ล้อมกรอบด้านล่างและซ้าย ให้เขียนข้างในก่อนข้างนอก',zh:'左下包围：先内后外',ex:[['远','元 远'],['廷','壬 廷'],['这','文 这',1]]},
  ]},
  {zh:'三面包围的字',th:'อักษรที่ถูกล้อมกรอบสามด้าน',subs:[
    {th:'ด้านบนว่าง ให้เขียนข้างในก่อนข้างนอก',zh:'上方开口：先内后外',ex:[['凶','㐅 凶'],['函','了 氶 函'],['画','一 由 画',1]]},
    {th:'ด้านล่างว่าง ให้เขียนข้างนอกก่อนข้างใน',zh:'下方开口：先外后内',ex:[['同','冂 同'],['向','丿 冂 向'],['用','冂 用',1]]},
    {th:'ด้านขวาว่าง ให้เขียนข้างบน ข้างใน แล้วจึงปิดด้านซ้ายและข้างล่าง',zh:'右方开口：先上，后里，再左下',ex:[['区','一 㐅 区'],['巨','一 コ 巨'],['医','一 矢 医',1]]},
  ]},
];
const NOTES = [
  {rad:'木',th:'หมวดนำ 木 เมื่ออยู่โดดๆ ขีดสุดท้ายจะเขียนด้วยเส้นลากขวา (捺) แต่เมื่อใช้เป็นหมวดนำและอยู่ด้านซ้าย จะเขียนเป็นจุด (点)',ex:[['木','木'],['林','木 林'],['村','木 村'],['树','木 树',1]]},
  {rad:'土 / 王',th:'หมวดนำ 土 และ 王 เมื่ออยู่โดดๆ ขีดสุดท้ายจะเขียนด้วยเส้นขวาง (横) แต่เมื่อใช้เป็นหมวดนำและอยู่ด้านซ้าย จะเขียนเป็นเส้นยก (提)',ex:[['土','土'],['坏','土 坏'],['环','王 环'],['地','土 地',1]]},
  {rad:'车',th:'หมวดนำ 车 เมื่ออยู่โดดๆ ขีดสุดท้ายจะเขียนด้วยเส้นตั้ง (竖) แต่เมื่อใช้เป็นหมวดนำและอยู่ด้านซ้าย จะเขียนเส้นตั้งก่อน แล้วเขียนขีดสุดท้ายด้วยเส้นยก (提)',ex:[['车','车'],['轮','车 轮'],['轨','车 轨'],['较','车 较',1]]},
];

/* ====================== CORE HELPERS ====================== */
const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
/** Stroke colours for the current theme (dark mode: white ink on a dark tile). */
function themeColors() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return dark
    ? { stroke: '#f3f4f8', outline: '#323746', drawing: '#f3f4f8', future: '#2b303d', done: '#c9ccd6', guide: 'rgba(240, 104, 63, .22)' }
    : { stroke: '#1b1f2a', outline: '#e4e4e4', drawing: '#1b1f2a', future: '#eeeeee', done: '#334155', guide: '#f3d6d6' };
}
const hasHW = () => typeof HanziWriter !== 'undefined';
const CN = () => window.cnchar || window.CnChar || null;
const dataCache = {};
function loadData(ch) {
  if (!dataCache[ch]) dataCache[ch] = HanziWriter.loadCharacterData(ch);
  return dataCache[ch];
}

const PART_TH = {横:'ขวาง',竖:'ตั้ง',撇:'ลากซ้าย',捺:'ลากขวา',点:'จุด',提:'ยก',折:'หักมุม',弯:'โค้ง',钩:'ขอ',斜:'เฉียง',卧:'นอน'};
const strokeTh = n => [...(n||'')].map(c => PART_TH[c] || c).join('-');
const STRUCT_TH = {'左右结构':'ซ้าย-ขวา','上下结构':'บน-ล่าง','独体结构':'ตัวเดี่ยว','半包围结构':'ล้อมครึ่งเดียว','全包围结构':'ล้อมรอบ','品字结构':'รูปตัว 品','上中下结构':'บน-กลาง-ล่าง','左中右结构':'ซ้าย-กลาง-ขวา'};

function getInfo(ch) {
  const decomp = CHAR_DECOMP[ch];
  const d = DICT[ch] || {};
  const info = {
    py: (decomp && decomp.pinyin) || d.py || '',
    th: (decomp && decomp.meaningTh) || d.th || '',
    en: (decomp && decomp.meaningEn) || d.en || '',
    radical: '',
    struct: '',
    liushu: decomp ? decomp.liushu : '',
    badge: decomp ? decomp.badge : ''
  };
  if (decomp && decomp.components && decomp.components.length) {
    const sem = decomp.components.find(c => c.role === 'semantic') || decomp.components[0];
    if (sem) info.radical = sem.char;
  }
  const C = CN();
  if (C) {
    try { if (!info.py) info.py = C.spell(ch, 'tone', 'low'); } catch(e) {}
    try {
      const r = C.radical(ch);
      const x = Array.isArray(r) ? r[0] : r;
      if (x) {
        if (!info.radical) info.radical = x.radical || '';
        info.struct = x.struct || '';
      }
    } catch(e) {}
  }
  if (info.py === ch) info.py = '';
  return info;
}

/* ---- Stroke Name Refinement ---- */
const LETTER_NAME = {a:'横折折撇',b:'竖弯',c:'横折',d:'点',o:'横斜钩',j:'横',l:'捺',r:'横折钩',f:'竖',g:'竖钩',k:'点',s:'撇',n:'撇折',x:'竖折撇',w:'横撇弯钩',z:'竖折折钩',i:'提',t:'弯钩',y:'斜钩',v:'横折弯',e:'横撇',p:'横折提',q:'横折折折',h:'竖提',m:'撇点',u:'竖弯钩'};
const NAI = '乃奶仍扔秀透携孕盈诱绣锈莠艿氖鼐';
function plen(pts) { let s=0; for(let i=1;i<pts.length;i++) s+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); return s; }
function maxDev(pts) {
  const a=pts[0],b=pts[pts.length-1],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1; let m=0;
  pts.forEach(p=>{m=Math.max(m,Math.abs((b[0]-a[0])*(a[1]-p[1])-(a[0]-p[0])*(b[1]-a[1]))/L);}); return m/L;
}
function refineStroke(l,med,ch){
  let n=LETTER_NAME[l]; if(!n||!med) return n||'';
  const xs=med.map(p=>p[0]), ys=med.map(p=>p[1]);
  const w=Math.max(...xs)-Math.min(...xs), h=Math.max(...ys)-Math.min(...ys);
  if(l==='e'){ let ci=xs.indexOf(Math.max(...xs)); const L1=plen(med.slice(0,ci+1)), L2=plen(med.slice(ci)); n=L2<0.45*L1?'横钩':'横撇'; }
  else if(l==='g'){ let lo=ys.indexOf(Math.min(...ys)); const body=med.slice(0,lo+1); if(body.length>2 && maxDev(body)>0.07) n='弯钩'; }
  else if(l==='b'){ const minx=Math.min(...xs),miny=Math.min(...ys); const d=Math.min(...med.map(p=>Math.hypot(p[0]-minx,p[1]-miny))); n=d>0.18*Math.min(w,h)?'竖弯':'竖折'; }
  else if(l==='o'){ let lo=ys.indexOf(Math.min(...ys)); const body=med.slice(0,lo+1); const k=Math.max(1,Math.floor(body.length*0.7)); const a=body[k-1]||body[0], b=body[body.length-1]; n=Math.abs(b[1]-a[1])<0.45*Math.abs(b[0]-a[0])?'横折弯钩':'横斜钩'; }
  else if(l==='v'){ n=ch==='凹'?'横折折':'横折弯'; }
  else if(l==='x'){ const last=med[med.length-1]; n=last[0]<Math.max(...xs)-0.25*w?'竖折撇':'竖折折'; }
  else if(l==='w'){ n=NAI.includes(ch)?'横折折折钩':'横撇弯钩'; }
  else if(l==='y'){ n=h<0.6*w?'卧钩':'斜钩'; }
  return n;
}
function getStrokeNames(ch,data){
  const O=window.CncharOrder; let letters=null;
  try{ letters=O&&O.dict&&O.dict.orders?O.dict.orders[ch]:null; }catch(e){}
  if(!letters){ try{ const r=CN()&&CN().stroke(ch,'order','letter'); letters=r&&r[0]; }catch(e){} }
  if(typeof letters!=='string'||letters.length!==data.strokes.length) return null;
  return [...letters].map((l,i)=>refineStroke(l,data.medians[i],ch));
}

/* ---- Stroke-to-Component Mapping Engine ---- */
const COMP_COLORS = ['#e4572e', '#2a5bb8', '#237a4b', '#a06a12'];
const ROLE_LABELS = {
  semantic: '形旁 / หมวดนำบอกความหมาย',
  phonetic: '声旁 / ส่วนบอกเสียงอ่าน',
  meaning: '会意部件 / ส่วนประกอบความหมาย',
  pictograph: '象形部件 / รูปภาพดั้งเดิม',
  indicator: '指事符号 / สัญลักษณ์ชี้ตำแหน่ง',
  component: '部件 / ชิ้นส่วนประกอบ'
};

/**
 * Maps each stroke index (0..N-1) of character `ch` to a component object from CHAR_DECOMP[ch].components
 */
function mapStrokesToComponents(ch, hwData) {
  const totalStrokes = hwData.strokes.length;
  const decomp = CHAR_DECOMP[ch];
  if (!decomp || !decomp.components || !decomp.components.length) {
    return Array.from({ length: totalStrokes }, (_, i) => ({
      strokeIdx: i,
      compIdx: 0,
      color: '#e4572e',
      comp: { char: ch, role: 'component', meaningTh: getInfo(ch).th, position: 'ทั้งตัว', isStandalone: true }
    }));
  }
  const comps = decomp.components;
  if (comps.length === 1) {
    return Array.from({ length: totalStrokes }, (_, i) => ({
      strokeIdx: i,
      compIdx: 0,
      color: COMP_COLORS[0],
      comp: comps[0]
    }));
  }

  // Check if HanziWriter provides radStrokes and one of our components is semantic/radical
  const radStrokes = Array.isArray(hwData.radStrokes) && hwData.radStrokes.length > 0 ? new Set(hwData.radStrokes) : null;
  const semIdx = comps.findIndex(c => c.role === 'semantic');

  if (radStrokes && comps.length === 2 && semIdx !== -1) {
    const otherIdx = semIdx === 0 ? 1 : 0;
    return Array.from({ length: totalStrokes }, (_, i) => {
      const cIdx = radStrokes.has(i) ? semIdx : otherIdx;
      return {
        strokeIdx: i,
        compIdx: cIdx,
        color: COMP_COLORS[cIdx % COMP_COLORS.length],
        comp: comps[cIdx]
      };
    });
  }

  // Otherwise map sequentially by component strokeCount (scaled/clamped to totalStrokes)
  const result = [];
  let cursor = 0;
  comps.forEach((comp, idx) => {
    const isLast = idx === comps.length - 1;
    const cnt = isLast ? Math.max(1, totalStrokes - cursor) : Math.min(comp.strokeCount || 3, Math.max(1, totalStrokes - cursor - (comps.length - 1 - idx)));
    for (let k = 0; k < cnt && cursor < totalStrokes; k++, cursor++) {
      result.push({
        strokeIdx: cursor,
        compIdx: idx,
        color: COMP_COLORS[idx % COMP_COLORS.length],
        comp
      });
    }
  });
  while (result.length < totalStrokes) {
    const lastIdx = comps.length - 1;
    result.push({
      strokeIdx: result.length,
      compIdx: lastIdx,
      color: COMP_COLORS[lastIdx % COMP_COLORS.length],
      comp: comps[lastIdx]
    });
  }
  return result;
}

/* ---- IntersectionObserver & Animation Classes ---- */
const io = new IntersectionObserver(es => es.forEach(e => e.target._anim && e.target._anim.setVisible(e.isIntersecting)), { rootMargin: '80px' });

/* One controller per host element. Re-binding the same host (e.g. switching characters
   in the studio) replaces the old controller instead of stacking click handlers / loops. */
function bindTap(host, anim) {
  if (host._anim && host._anim !== anim && host._anim.destroy) host._anim.destroy();
  host._anim = anim;
  host.classList.add('anim');
  if (!host.querySelector(':scope > .ind')) {
    const ind = document.createElement('span');
    ind.className = 'ind';
    ind.textContent = '⏸ หยุด';
    host.appendChild(ind);
  }
  if (!host._tapBound) {
    host._tapBound = true;
    host.addEventListener('click', e => {
      const a = host._anim;
      if (!a || a.mode === 'quiz') return; // drawing in quiz mode must not toggle pause
      e.stopPropagation();
      a.toggle();
    });
  }
  io.observe(host);
}

/**
 * Character animation controller.
 * The loop is driven here (animateCharacter → delay → animateCharacter) instead of
 * HanziWriter.loopCharacterAnimation, with a generation counter so that only ONE pass
 * can ever be alive per character. Older passes (replay, quiz, re-render) are ignored
 * when they finish, which removes the "double / stuttering replay" bug.
 */
class CharAnim {
  constructor(host, ch, size, opts = {}) {
    this.host = host; this.ch = ch; this.size = size; this.opts = opts;
    this.paused = false; this.visible = false; this.writer = null;
    this.mode = 'loop';          // 'loop' | 'once' | 'quiz' | 'idle'
    this.gen = 0;                // bumps on every new pass → stale callbacks are ignored
    this.timer = null;           // delay between loops
    this.running = false;        // a writer animation pass is in flight
    this.wPaused = false;        // we paused the writer (only resume what we paused)
    this.needsRestart = false;   // loop delay elapsed while hidden/paused
    this.started = false;
    this.destroyed = false;
    this._onceDone = null;
    this.target = document.createElement('div');
    host.appendChild(this.target);
    bindTap(host, this);
  }
  _fallback() {
    this.target.innerHTML = `<span class="fallback" style="font-size:${this.size * 0.7}px">${this.ch}</span>`;
  }
  ensure() {
    if (this.writer) return true;
    if (this.destroyed) return false;
    if (!hasHW()) { this._fallback(); return false; }
    this.writer = HanziWriter.create(this.target, this.ch, {
      width: this.size,
      height: this.size,
      padding: Math.round(this.size * 0.07),
      showOutline: true,
      outlineColor: themeColors().outline,
      strokeColor: themeColors().stroke,
      drawingColor: themeColors().drawing,
      radicalColor: '#e4572e',
      highlightColor: '#e4572e',
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 280,
      onLoadCharDataError: () => this._fallback()
    });
    return true;
  }
  _clearTimer() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } }
  _settleOnce() { const r = this._onceDone; this._onceDone = null; if (r) r(); }
  _alive() {
    if (this.destroyed) return false;
    if (!this.host.isConnected) { this.destroy(); return false; }
    return true;
  }
  /** Start a fresh pass from stroke 1; invalidates any pass still in flight. */
  _cycle() {
    if (!this._alive() || !this.ensure()) return;
    this._clearTimer();
    const g = ++this.gen;
    this.started = true; this.running = true; this.wPaused = false; this.needsRestart = false;
    this.writer.animateCharacter({
      onComplete: () => {
        if (g !== this.gen || !this._alive()) return;
        this.running = false; this.wPaused = false;
        if (this.mode === 'loop') this._scheduleNext(g);
        else if (this.mode === 'once') { this.mode = 'idle'; this._settleOnce(); }
      }
    });
  }
  _scheduleNext(g) {
    this.timer = setTimeout(() => {
      this.timer = null;
      if (g !== this.gen || this.mode !== 'loop' || !this._alive()) return;
      if (!this.visible || this.paused) { this.needsRestart = true; return; }
      this._cycle();
    }, this.opts.loopDelay || 1200);
  }
  _pauseWriter() {
    if (this.writer && this.running && !this.wPaused) { this.writer.pauseAnimation(); this.wPaused = true; }
  }
  _continue() {
    if (this.paused || !this.visible) return;
    if (this.needsRestart || (!this.started && this.mode === 'loop')) this._cycle();
    else if (this.wPaused) { this.writer.resumeAnimation(); this.wPaused = false; }
  }
  setVisible(v) {
    if (!this._alive()) return;
    this.visible = v;
    if (!v) { this._pauseWriter(); return; }
    if (this.ensure()) this._continue();
  }
  setPaused(p) {
    if (!this.ensure()) return;
    this.paused = p;
    this.host.classList.toggle('paused', p);
    if (p) this._pauseWriter(); else this._continue();
  }
  toggle() {
    if (this.mode === 'idle') { this.loop(); return; }
    this.setPaused(!this.paused);
  }
  _reset(mode) {
    this._settleOnce();
    if (this.writer && this.mode === 'quiz') { try { this.writer.cancelQuiz(); } catch (e) {} }
    this.mode = mode;
    this.paused = false;
    this.host.classList.remove('paused');
    this.host.classList.toggle('quizzing', mode === 'quiz');
  }
  /** Restart the looping animation from the first stroke. */
  loop() {
    if (!this.ensure()) return;
    this._reset('loop');
    this._cycle();
  }
  /** Play exactly one pass; resolves when done (or when superseded). */
  playOnce() {
    return new Promise(res => {
      if (!this.ensure()) return res();
      this._reset('once');
      this._onceDone = res;
      this._cycle();
    });
  }
  /** Stop everything and hide strokes (used before a sequential run). */
  stop() {
    if (!this.ensure()) return;
    this._reset('idle');
    this._clearTimer();
    this.gen++; this.running = false; this.wPaused = false; this.needsRestart = false;
    this.writer.hideCharacter();
  }
  quiz(opts = {}) {
    if (!this.ensure()) return;
    this._reset('quiz');
    this._clearTimer();
    this.gen++; this.running = false; this.wPaused = false; this.needsRestart = false;
    this.writer.quiz(opts);
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.gen++;
    this._clearTimer();
    this._settleOnce();
    io.unobserve(this.host);
    if (this.writer) { try { this.writer.cancelQuiz(); this.writer.pauseAnimation(); } catch (e) {} }
    if (this.host._anim === this) this.host._anim = null;
    this.target.remove();
  }
}
/** Tear down every animation controller inside a container before its HTML is replaced. */
function destroyAnimsIn(root) {
  if (!root) return;
  root.querySelectorAll('.anim').forEach(el => { if (el._anim && el._anim.destroy) el._anim.destroy(); });
}

const strokeAnims = new Set();
let clipSeq = 0;
class StrokeAnim {
  constructor(host, stroke, size) {
    this.host = host; this.size = size; this.stroke = stroke;
    this.t = 0; this.paused = false; this.visible = false; this.ready = false;
    bindTap(host, this); strokeAnims.add(this);
    if (hasHW()) loadData(stroke.src[0]).then(d => this.buildKai(d)).catch(() => this.buildFallback());
    else this.buildFallback();
  }
  mount(svg) { this.host.insertBefore(svg, this.host.firstChild); }
  buildKai(data) {
    const idx = this.stroke.src[1], outline = data.strokes[idx];
    let med = data.medians[idx].map(p => [p[0], p[1]]);
    if (!outline || med.length < 2) return this.buildFallback();
    const ext = (a, b, k) => { const L = Math.hypot(a[0]-b[0], a[1]-b[1]) || 1; return [a[0]+(a[0]-b[0])/L*k, a[1]+(a[1]-b[1])/L*k]; };
    med.unshift(ext(med[0], med[1], 40)); med.push(ext(med[med.length-1], med[med.length-2], 40));
    const xs = med.map(p => p[0]), sy = med.map(p => 900 - p[1]);
    const pad = 140, minx = Math.min(...xs)-pad, maxx = Math.max(...xs)+pad, miny = Math.min(...sy)-pad, maxy = Math.max(...sy)+pad;
    const S = Math.max(maxx-minx, maxy-miny, 640), cx = (minx+maxx)/2, cy = (miny+maxy)/2;
    const id = 'kc' + (++clipSeq), d = 'M' + med.map(p => p.join(' ')).join(' L');
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `${cx-S/2} ${cy-S/2} ${S} ${S}`);
    svg.setAttribute('width', this.size); svg.setAttribute('height', this.size);
    svg.innerHTML = `<g transform="translate(0,900) scale(1,-1)">
      <clipPath id="${id}"><path d="${outline}"/></clipPath>
      <path d="${outline}" fill="${themeColors().outline}"/>
      <path class="ink" d="${d}" fill="none" stroke="${themeColors().stroke}" stroke-width="150" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#${id})"/>
      <circle class="start" r="${S*0.022}" fill="#27ae60" cx="${med[1][0]}" cy="${med[1][1]}"/>
      <circle class="tip" r="${S*0.03}" fill="#e4572e" stroke="#fff" stroke-width="${S*0.006}"/></g>`;
    this.mount(svg);
    this.ink = svg.querySelector('.ink'); this.tip = svg.querySelector('.tip');
    this.pts = med; this.L = plen(med); this.full = this.L + 160;
    this.ink.style.strokeDasharray = `${this.full} ${this.full}`;
    this.ink.style.strokeDashoffset = this.full;
    this.dur = 500 + this.L * 1.6; this.ready = true;
  }
  buildFallback() {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('width', this.size); svg.setAttribute('height', this.size);
    const d = this.stroke.d;
    svg.innerHTML = `<path d="${d}" fill="none" stroke="${themeColors().outline}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="ink" d="${d}" fill="none" stroke="${themeColors().stroke}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      <circle class="tip" r="5.5" fill="#e4572e" stroke="#fff" stroke-width="1.5"/>`;
    this.mount(svg);
    this.ink = svg.querySelector('.ink'); this.tip = svg.querySelector('.tip'); this.fallback = true;
  }
  pointAt(len) {
    if (this.fallback) { const p = this.ink.getPointAtLength(len); return [p.x, p.y]; }
    let acc = 0; const P = this.pts;
    for (let i = 1; i < P.length; i++) {
      const s = Math.hypot(P[i][0]-P[i-1][0], P[i][1]-P[i-1][1]);
      if (acc + s >= len) { const r = (len - acc) / (s || 1); return [P[i-1][0]+(P[i][0]-P[i-1][0])*r, P[i-1][1]+(P[i][1]-P[i-1][1])*r]; }
      acc += s;
    }
    return P[P.length - 1];
  }
  setVisible(v) { this.visible = v; }
  toggle() { this.paused = !this.paused; this.host.classList.toggle('paused', this.paused); }
  step(dt) {
    if (!this.host.isConnected) { strokeAnims.delete(this); io.unobserve(this.host); return; }
    if (!this.visible || this.paused || !this.ink) return;
    if (this.fallback && !this.ready) { this.L = this.ink.getTotalLength(); if (!this.L) return; this.full = this.L; this.ink.style.strokeDasharray = this.L; this.dur = 600 + this.L * 13; this.ready = true; }
    if (!this.ready) return;
    this.t += dt;
    const tt = this.t % (this.dur + 1000), raw = Math.min(1, tt / this.dur);
    const p = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
    this.ink.style.strokeDashoffset = this.full * (1 - p);
    const pt = this.pointAt(this.L * p);
    this.tip.setAttribute('cx', pt[0]); this.tip.setAttribute('cy', pt[1]);
    this.tip.style.opacity = raw < 1 ? 1 : 0;
  }
}
let lastT = performance.now();
(function frame(now) {
  const dt = Math.min(100, now - lastT); lastT = now;
  strokeAnims.forEach(a => a.step(dt));
  requestAnimationFrame(frame);
})(lastT);

/* ---- Step-by-Step SVG with Component Color-Coding ---- */
function stepSVG(data, i, size, hl = true, strokeMap = null) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.innerHTML = `<line x1="0" y1="${size/2}" x2="${size}" y2="${size/2}" stroke="${themeColors().guide}" stroke-dasharray="2"/><line x1="${size/2}" y1="0" x2="${size/2}" y2="${size}" stroke="${themeColors().guide}" stroke-dasharray="2"/>`;
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('transform', HanziWriter.getScalingTransform(size, size, 2).transform);
  data.strokes.forEach((s, j) => {
    if (j > i && !hl) return;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', s);
    let fill = themeColors().future;
    if (j === i) {
      fill = strokeMap && strokeMap[j] ? strokeMap[j].color : '#e4572e';
    } else if (j < i) {
      fill = strokeMap && strokeMap[j] ? strokeMap[j].color + '99' : themeColors().done;
    }
    p.setAttribute('fill', fill);
    g.appendChild(p);
  });
  svg.appendChild(g);
  return svg;
}

function renderSteps(ch, el, size = 46, withNames = false, onStepSelect = null) {
  if (!hasHW()) { el.innerHTML = '<span class="warn">ออฟไลน์ — แสดงเฉพาะลำดับตามหนังสือ</span>'; return; }
  loadData(ch).then(data => {
    el.innerHTML = '';
    const names = withNames ? getStrokeNames(ch, data) : null;
    const strokeMap = mapStrokesToComponents(ch, data);
    data.strokes.forEach((_, i) => {
      const svg = stepSVG(data, i, size, withNames, strokeMap);
      if (withNames) {
        const sm = strokeMap[i];
        const box = document.createElement('div');
        box.className = 'step';
        box.dataset.stepIdx = i;
        box.dataset.compIdx = sm ? sm.compIdx : 0;
        box.innerHTML = `<span class="n">ขีดที่ ${i + 1}</span>`;
        box.appendChild(svg);
        if (names) {
          box.insertAdjacentHTML('beforeend', `<span class="sn" style="color:${sm ? sm.color : '#e4572e'}">${names[i]}</span><span class="st">${strokeTh(names[i])}</span>`);
        }
        if (sm && sm.comp) {
          box.insertAdjacentHTML('beforeend', `<span class="step-comp-tag comp-${sm.compIdx % 3}" title="อยู่ในชิ้นส่วน ${sm.comp.char}">${sm.comp.char}</span>`);
        }
        if (onStepSelect) {
          box.addEventListener('click', () => onStepSelect(i, names ? names[i] : '', sm, data));
        }
        el.appendChild(box);
      } else {
        el.appendChild(svg);
      }
    });
  }).catch(() => { el.innerHTML = '<span class="warn">โหลดข้อมูลขีดไม่ได้</span>'; });
}


/* ====================== WRITING CANVAS ENGINE ====================== */
let studioQueue = [...'永水火木心爱清道'];
let studioActiveIdx = 0;
let studioAnim = null;
let studioTool = 'brush'; // 'brush' | 'pen' | 'eraser'
let studioColor = '#111827';
let studioBaseSize = 18;
let studioGhostAlpha = 0.22;
let studioGridType = 'mi'; // 'mi' | 'tian' | 'jiu'
let studioPalmReject = false;
let studioStrokesHistory = []; // Array of completed strokes for Undo
let studioCurrentStroke = null;
let studioCharHWData = null;






function resizeStudioCanvases() {
  const stage = $('#stCanvasStage');
  const inkCanvas = $('#stInkCanvas');
  const hoverCanvas = $('#stHoverCanvas');
  if (!stage || !inkCanvas || !hoverCanvas) return;
  const rect = stage.getBoundingClientRect();
  const cssSize = Math.max(260, Math.round(rect.width || 420));
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  if (inkCanvas.width !== Math.round(cssSize * dpr) || inkCanvas.height !== Math.round(cssSize * dpr)) {
    inkCanvas.width = Math.round(cssSize * dpr);
    inkCanvas.height = Math.round(cssSize * dpr);
    hoverCanvas.width = Math.round(cssSize * dpr);
    hoverCanvas.height = Math.round(cssSize * dpr);
    redrawStudioCanvas();
  }
}

function drawStudioPaperGrid(ctx, size) {
  ctx.save();
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, size, size);

  // Outer border frame
  const pad = Math.round(size * 0.03);
  const inner = size - pad * 2;
  ctx.strokeStyle = '#e4572e';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, inner, inner);

  // Grid lines
  ctx.strokeStyle = '#f1b5ae';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 5]);

  if (studioGridType === 'mi' || studioGridType === 'tian') {
    // Center horizontal & vertical
    ctx.beginPath();
    ctx.moveTo(pad, size / 2); ctx.lineTo(size - pad, size / 2);
    ctx.moveTo(size / 2, pad); ctx.lineTo(size / 2, size - pad);
    ctx.stroke();
  }
  if (studioGridType === 'mi') {
    // Diagonals for Mi Zi Ge
    ctx.beginPath();
    ctx.moveTo(pad, pad); ctx.lineTo(size - pad, size - pad);
    ctx.moveTo(size - pad, pad); ctx.lineTo(pad, size - pad);
    ctx.stroke();
  }
  if (studioGridType === 'jiu') {
    // 3x3 Jiu Gong Ge
    const step = inner / 3;
    ctx.beginPath();
    ctx.moveTo(pad + step, pad); ctx.lineTo(pad + step, size - pad);
    ctx.moveTo(pad + step * 2, pad); ctx.lineTo(pad + step * 2, size - pad);
    ctx.moveTo(pad, pad + step); ctx.lineTo(size - pad, pad + step);
    ctx.moveTo(pad, pad + step * 2); ctx.lineTo(size - pad, pad + step * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStudioGhostChar(ctx, size) {
  if (studioGhostAlpha <= 0) return;
  const ch = studioQueue[studioActiveIdx] || '永';
  ctx.save();
  if (studioCharHWData && studioCharHWData.strokes && typeof Path2D !== 'undefined') {
    const pad = size * 0.08;
    const drawSize = size - pad * 2;
    const scale = drawSize / 1024;
    ctx.translate(pad, pad + drawSize * (900 / 1024));
    ctx.scale(scale, -scale);
    ctx.fillStyle = `rgba(148, 163, 184, ${studioGhostAlpha})`;
    studioCharHWData.strokes.forEach(d => {
      const path = new Path2D(d);
      ctx.fill(path);
    });
  } else {
    ctx.fillStyle = `rgba(148, 163, 184, ${studioGhostAlpha})`;
    ctx.font = `700 ${Math.round(size * 0.72)}px "KaiTiWeb", "KaiTi", "Kaiti SC", "STKaiti", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, size / 2, size * 0.53);
  }
  ctx.restore();
}

function renderSingleStrokeOnCtx(ctx, stroke, size) {
  const pts = stroke.points;
  if (!pts || !pts.length) return;
  ctx.save();
  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  }
  ctx.fillStyle = stroke.color;
  ctx.strokeStyle = stroke.color;

  if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const x0 = p0.nx * size, y0 = p0.ny * size;
      const x1 = p1.nx * size, y1 = p1.ny * size;
      const w = stroke.tool === 'eraser'
        ? stroke.baseSize * 1.6
        : Math.max(2, stroke.baseSize * 0.45 * (0.45 + p1.pressure * 0.9));
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // Calligraphy Brush ('brush') with Pressure, Tilt, and Apple Pencil Pro Barrel Roll (twist)
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const x0 = p0.nx * size, y0 = p0.ny * size;
    const x1 = p1.nx * size, y1 = p1.ny * size;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / 1.5));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const press = p0.pressure + (p1.pressure - p0.pressure) * t;
      const twistDeg = p0.twist + (p1.twist - p0.twist) * t;
      const tiltX = p0.tiltX + (p1.tiltX - p0.tiltX) * t;
      const tiltY = p0.tiltY + (p1.tiltY - p0.tiltY) * t;

      // Brush radius modulated by Apple Pencil pressure + tilt spread
      const tiltMag = Math.hypot(tiltX, tiltY) / 90; // 0..1
      const radius = Math.max(1.8, (stroke.baseSize * 0.55) * (0.28 + Math.pow(press, 1.15) * 1.15) * (1 + tiltMag * 0.35));
      // Nib angle from Apple Pencil Pro Barrel Roll (twist) or Tilt azimuth or default -38deg calligraphy slant
      let nibAngle = -0.66; // ~ -38 deg classic KaiTi brush angle
      if (twistDeg > 0) {
        nibAngle = (twistDeg * Math.PI) / 180;
      } else if (Math.abs(tiltX) > 3 || Math.abs(tiltY) > 3) {
        nibAngle = Math.atan2(tiltY, tiltX);
      }

      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.18, radius * 0.62, nibAngle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function redrawStudioCanvas() {
  const inkCanvas = $('#stInkCanvas');
  if (!inkCanvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const size = inkCanvas.width / dpr;
  const ctx = inkCanvas.getContext('2d');
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  drawStudioPaperGrid(ctx, size);
  drawStudioGhostChar(ctx, size);

  // Offscreen or layered rendering so Eraser only erases user ink, not grid!
  const inkLayer = document.createElement('canvas');
  inkLayer.width = inkCanvas.width;
  inkLayer.height = inkCanvas.height;
  const inkCtx = inkLayer.getContext('2d');
  inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  studioStrokesHistory.forEach(st => renderSingleStrokeOnCtx(inkCtx, st, size));
  if (studioCurrentStroke) renderSingleStrokeOnCtx(inkCtx, studioCurrentStroke, size);

  ctx.drawImage(inkLayer, 0, 0, size, size);
  ctx.restore();
}

function drawHoverPreview(e) {
  const hoverCanvas = $('#stHoverCanvas');
  if (!hoverCanvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const size = hoverCanvas.width / dpr;
  const ctx = hoverCanvas.getContext('2d');
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  if (!e || e.pointerType !== 'pen') {
    ctx.restore();
    return;
  }
  const rect = hoverCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const twistDeg = e.twist || 0;
  const tiltX = e.tiltX || 0;
  const tiltY = e.tiltY || 0;
  let nibAngle = -0.66;
  if (twistDeg > 0) nibAngle = (twistDeg * Math.PI) / 180;
  else if (Math.abs(tiltX) > 3 || Math.abs(tiltY) > 3) nibAngle = Math.atan2(tiltY, tiltX);

  const r = Math.max(4, studioBaseSize * 0.55);
  ctx.strokeStyle = studioTool === 'eraser' ? '#ef4444' : studioColor;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.2, r * 0.65, nibAngle, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshair center dot
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.arc(x, y, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function updatePencilTelemetry(e) {
  const isPen = e.pointerType === 'pen';
  const isTouch = e.pointerType === 'touch';
  const dot = $('#stInputDot');
  const typeEl = $('#stInputType');
  const globalBadge = $('#globalPencilBadge');

  if (dot) {
    dot.className = 'tele-dot ' + (isPen ? 'pen' : (isTouch ? 'touch' : ''));
  }
  if (typeEl) {
    if (isPen) {
      typeEl.textContent = e.twist ? 'Apple Pencil Pro' : 'Apple Pencil';
    } else if (isTouch) {
      typeEl.textContent = 'นิ้ว';
    } else {
      typeEl.textContent = 'เมาส์';
    }
  }
  if (isPen && globalBadge) {
    globalBadge.classList.add('active-pen');
    globalBadge.textContent = 'Apple Pencil';
  }

  const rawPressure = e.buttons > 0 ? (e.pressure || 0.5) : 0;
  const pct = Math.round(rawPressure * 100);
  if ($('#stPressureFill')) $('#stPressureFill').style.width = `${pct}%`;
  if ($('#stPressureVal')) $('#stPressureVal').textContent = `${pct}%`;
  if ($('#stTiltVal')) $('#stTiltVal').textContent = `${Math.round(e.tiltX || 0)}°, ${Math.round(e.tiltY || 0)}°`;
  if ($('#stTwistVal')) $('#stTwistVal').textContent = `${Math.round(e.twist || 0)}°`;
}

function extractPoint(e, rect, prevPt) {
  const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  let pressure = e.pressure;
  if (e.pointerType !== 'pen' || !pressure || pressure === 0.5) {
    // Velocity-based calligraphy pressure simulation for finger/mouse
    if (prevPt) {
      const dt = Math.max(1, (e.timeStamp || performance.now()) - prevPt.time);
      const dist = Math.hypot(nx - prevPt.nx, ny - prevPt.ny) * rect.width;
      const vel = dist / dt; // px per ms
      pressure = Math.max(0.22, Math.min(0.92, 0.85 - vel * 0.28));
    } else {
      pressure = 0.65;
    }
  }
  return {
    nx,
    ny,
    pressure,
    tiltX: e.tiltX || 0,
    tiltY: e.tiltY || 0,
    twist: e.twist || 0,
    time: e.timeStamp || performance.now()
  };
}

function initPencilProStudio() {
  const stage = $('#stCanvasStage');
  const inkCanvas = $('#stInkCanvas');
  if (!stage || !inkCanvas) return;

  resizeStudioCanvases();
  renderStudioQueue();
  loadStudioActiveChar();

  // Pointer Events on Ink Canvas (supports Apple Pencil Pro coalesced events, pressure, tilt, twist, hover)
  inkCanvas.addEventListener('pointerdown', e => {
    updatePencilTelemetry(e);
    // Auto-enable palm rejection the first time Apple Pencil touches the canvas
    if (e.pointerType === 'pen' && !studioPalmReject) {
      studioPalmReject = true;
      const cb = $('#stPalmRejectToggle');
      if (cb) cb.checked = true;
    }
    // Ignore palm/finger touch when Palm Rejection is enabled
    if (studioPalmReject && e.pointerType === 'touch') {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    try { inkCanvas.setPointerCapture(e.pointerId); } catch (err) {}
    const rect = inkCanvas.getBoundingClientRect();
    const pt = extractPoint(e, rect, null);
    studioCurrentStroke = {
      tool: studioTool,
      color: studioColor,
      baseSize: studioBaseSize,
      points: [pt]
    };
    redrawStudioCanvas();
  }, { passive: false });

  inkCanvas.addEventListener('pointermove', e => {
    updatePencilTelemetry(e);
    if (e.buttons === 0) {
      // Apple Pencil Hover Preview before touching glass!
      drawHoverPreview(e);
      return;
    }
    if (!studioCurrentStroke) return;
    if (studioPalmReject && e.pointerType === 'touch') return;
    e.preventDefault();

    const rect = inkCanvas.getBoundingClientRect();
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
    (events.length ? events : [e]).forEach(ev => {
      const prev = studioCurrentStroke.points[studioCurrentStroke.points.length - 1];
      studioCurrentStroke.points.push(extractPoint(ev, rect, prev));
    });
    drawHoverPreview(e);
    redrawStudioCanvas();
  }, { passive: false });

  const finishStroke = e => {
    if (!studioCurrentStroke) return;
    if (studioCurrentStroke.points.length > 0) {
      studioStrokesHistory.push(studioCurrentStroke);
    }
    studioCurrentStroke = null;
    updatePencilTelemetry(e);
    redrawStudioCanvas();
  };

  inkCanvas.addEventListener('pointerup', finishStroke);
  inkCanvas.addEventListener('pointercancel', finishStroke);
  inkCanvas.addEventListener('pointerleave', () => drawHoverPreview(null));

  // Toolbar bindings
  document.querySelectorAll('#stToolSeg button').forEach(btn => {
    btn.onclick = () => {
      studioTool = btn.dataset.tool;
      document.querySelectorAll('#stToolSeg button').forEach(b => b.classList.toggle('active', b === btn));
    };
  });

  document.querySelectorAll('#stColorSeg .color-dot').forEach(btn => {
    btn.onclick = () => {
      studioColor = btn.dataset.color;
      if (studioTool === 'eraser') {
        studioTool = 'brush';
        document.querySelectorAll('#stToolSeg button').forEach(b => b.classList.toggle('active', b.dataset.tool === 'brush'));
      }
      document.querySelectorAll('#stColorSeg .color-dot').forEach(b => b.classList.toggle('active', b === btn));
    };
  });

  const palmToggle = $('#stPalmRejectToggle');
  if (palmToggle) {
    palmToggle.onchange = () => { studioPalmReject = palmToggle.checked; };
  }

  const sizeRange = $('#stBrushSize');
  if (sizeRange) {
    sizeRange.oninput = () => {
      studioBaseSize = Number(sizeRange.value);
      if ($('#stBrushSizeVal')) $('#stBrushSizeVal').textContent = `${studioBaseSize}px`;
    };
  }

  document.querySelectorAll('#stGhostSeg button').forEach(btn => {
    btn.onclick = () => {
      studioGhostAlpha = Number(btn.dataset.ghost);
      document.querySelectorAll('#stGhostSeg button').forEach(b => b.classList.toggle('active', b === btn));
      redrawStudioCanvas();
    };
  });

  document.querySelectorAll('#stGridTypeSeg button').forEach(btn => {
    btn.onclick = () => {
      studioGridType = btn.dataset.grid;
      document.querySelectorAll('#stGridTypeSeg button').forEach(b => b.classList.toggle('active', b === btn));
      redrawStudioCanvas();
    };
  });

  if ($('#stUndoBtn')) {
    $('#stUndoBtn').onclick = () => {
      studioStrokesHistory.pop();
      redrawStudioCanvas();
    };
  }
  if ($('#stClearBtn')) {
    $('#stClearBtn').onclick = () => {
      studioStrokesHistory = [];
      redrawStudioCanvas();
    };
  }
  if ($('#stSaveImgBtn')) {
    $('#stSaveImgBtn').onclick = () => {
      const ch = studioQueue[studioActiveIdx] || '永';
      const link = document.createElement('a');
      link.download = `hanzi-calligraphy-${ch}.png`;
      link.href = inkCanvas.toDataURL('image/png');
      link.click();
    };
  }
  if ($('#stPrevCharBtn')) {
    $('#stPrevCharBtn').onclick = () => {
      studioActiveIdx = (studioActiveIdx - 1 + studioQueue.length) % studioQueue.length;
      renderStudioQueue();
      loadStudioActiveChar();
    };
  }
  if ($('#stNextCharBtn')) {
    $('#stNextCharBtn').onclick = () => {
      studioActiveIdx = (studioActiveIdx + 1) % studioQueue.length;
      renderStudioQueue();
      loadStudioActiveChar();
    };
  }
  if ($('#studioLoadBtn')) {
    const loadCustomQueue = () => {
      const raw = ($('#studioCharInput')?.value || '').trim();
      const chars = [...raw].filter(c => /\p{Script=Han}/u.test(c));
      if (chars.length) {
        studioQueue = chars;
        studioActiveIdx = 0;
        renderStudioQueue();
        loadStudioActiveChar();
      }
    };
    $('#studioLoadBtn').onclick = loadCustomQueue;
    $('#studioCharInput').onkeydown = e => { if (e.key === 'Enter') loadCustomQueue(); };
  }
  if ($('#stSpeakBtn')) {
    $('#stSpeakBtn').onclick = () => speak(studioQueue[studioActiveIdx] || '永');
  }
  if ($('#stDetailModalBtn')) {
    $('#stDetailModalBtn').onclick = () => showChar(studioQueue[studioActiveIdx] || '永');
  }
  if ($('#stReplayAnimBtn')) {
    $('#stReplayAnimBtn').onclick = () => { if (studioAnim) studioAnim.loop(); };
  }
  if ($('#stQuizModeBtn')) {
    $('#stQuizModeBtn').onclick = () => {
      if (studioAnim) studioAnim.quiz();
    };
  }
}

