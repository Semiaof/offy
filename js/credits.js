'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — แหล่งข้อมูลและเครดิต (#/credits)
   Every outside source whose data the app shows, what it is used for, its licence and a link — plus the sources that
   were only used to cross-check while building (none of their data is in the app).
   Keep in step with vocabulary/เอกสารที่อ้างอิง/อ่านก่อน.md and the builders in แปล HSK1 5ภาษา/tools
   (export_offy.py · build_books.py · build_tree.py · build_compose.py).
   ===================================================================== */
const Credits = (() => {
  Object.assign(window.OFFY_EN || {}, {
    'แหล่งข้อมูลและเครดิต': 'Sources and credits', 'ข้อมูลที่แอปแสดง': 'Data shown in the app',
    'ใช้ตรวจเทียบระหว่างทำเท่านั้น': 'Used only to cross-check while building',
    'แหล่งเหล่านี้ไม่มีข้อมูลอยู่ในแอป ใช้เทียบคำแปลตอนจัดทำ': 'None of their data is in the app; they were compared against while translating.',
    'คำแปลและเนื้อหาของผู้จัดทำ': 'Our own translations and writing', 'ใช้ใน': 'Used in', 'สัญญาอนุญาต': 'Licence',
    'ทางการ': 'Official', 'สูง': 'High', 'กลาง': 'Medium', 'ความน่าเชื่อถือ': 'Reliability', 'เปิดเว็บไซต์': 'Open website',
    'คลังคำ': 'Word library', 'อักษร': 'Hanzi', 'หนังสือ': 'Books', 'เขียนค้นหา': 'Handwriting', 'ทั้งแอป': 'Whole app',
    'แหล่งข้อมูลที่แอปนี้ใช้ พร้อมสัญญาอนุญาตของแต่ละแหล่ง ขอบคุณทุกโครงการที่เปิดข้อมูลให้ใช้': 'The sources this app draws on, each with its licence. Thank you to every project that shares its data.'
  });
  const Q = { o: 'ทางการ', h: 'สูง', m: 'กลาง' };
  // [name, what it gives the app, licence, link, reliability, where]
  const USED = [
    ['มาตรฐาน HSK 3.0 · GF 0025-2021', 'รายการคำ อักษร และระดับ HSK 1–9 (国际中文教育中文水平等级标准)', 'เอกสารราชการจีน', 'https://www.chinesetest.cn/', 'o', ['ทั้งแอป']],
    ['Unihan (Unicode)', 'ความหมายภาษาอังกฤษของอักษร หมวดนำคังซี', 'Unicode License', 'https://www.unicode.org/charts/unihan.html', 'h', ['อักษร']],
    ['Unicode CJK Radicals · GF 0011-2009', 'หมวดนำ 214 และรูปแปรของแต่ละหมวด', 'Unicode License · เอกสารราชการจีน', 'https://www.unicode.org/Public/UCD/latest/ucd/CJKRadicals.txt', 'o', ['อักษร', 'หนังสือ']],
    ['GF 0012-2009 部首归部', 'หมวดนำของอักษร HSK ทั้ง 3,088 ตัวตามมาตรฐานจีน', 'เอกสารราชการจีน', 'https://archive.org/', 'o', ['อักษร']],
    ['GF 0013-2009 独体字', 'รายชื่ออักษรเดี่ยว (独体字) และชนิดโครงสร้าง', 'เอกสารราชการจีน', 'https://web.archive.org/web/20121209200714/http://www.china-language.gov.cn/', 'o', ['อักษร', 'คลังคำ']],
    ['cjkvi-ids', 'โครงสร้างอักษร (IDS) ส่วนประกอบ ต้นไม้ตัวอักษร และหน้าผสมอักษร', 'GPLv2', 'https://github.com/cjkvi/cjkvi-ids', 'h', ['อักษร']],
    ['Make Me a Hanzi', 'จำนวนขีด ส่วนบอกความหมาย/ส่วนบอกเสียง (dictionary.txt) และลายเส้นสำหรับเขียนค้นหา (graphics.txt)', 'LGPL · Arphic Public License', 'https://github.com/skishore/makemeahanzi', 'm', ['อักษร', 'เขียนค้นหา']],
    ['Hanzi Writer', 'ภาพเขียนลำดับขีดแบบเคลื่อนไหว (โหลดจากอินเทอร์เน็ตเมื่อใช้)', 'MIT · ข้อมูลลายเส้น Arphic Public License', 'https://hanziwriter.org/', 'h', ['อักษร', 'คลังคำ']],
    ['说文解字注 (cjkvi-dict)', 'ใช้ตัดสิน 六书 ของอักษร', 'GPLv2', 'https://github.com/cjkvi/cjkvi-dict', 'h', ['อักษร', 'หนังสือ']],
    ['汉典 (zdic.net)', 'ใช้เทียบโครงสร้าง (结构) และ 六书', 'ข้อมูลอ้างอิงจากเว็บไซต์', 'https://www.zdic.net/', 'h', ['อักษร', 'คลังคำ']],
    ['CC-CEDICT', 'ความหมายภาษาอังกฤษของคำที่ยังไม่ได้แปล และลักษณนาม (量词)', 'CC BY-SA 4.0', 'https://www.mdbg.net/chinese/dictionary?page=cc-cedict', 'h', ['คลังคำ', 'อักษร']],
    ['OpenCC', 'รูปตัวเต็มและรูปมาตรฐานไต้หวัน', 'Apache 2.0', 'https://github.com/BYVoid/OpenCC', 'h', ['คลังคำ', 'อักษร']],
    ['重編國語辭典修訂本 (教育部 ไต้หวัน)', 'คำอ่านแบบไต้หวัน', 'CC BY-ND 3.0 TW · ลิขสิทธิ์กระทรวงศึกษาธิการไต้หวัน', 'https://dict.revised.moe.edu.tw/', 'o', ['คลังคำ']],
    ['Hán Việt tự điển · Thiều Chửu', 'คำอ่าน Hán Việt (แหล่งหลัก)', 'CC0', 'https://github.com/catusf/tudien', 'h', ['คลังคำ', 'อักษร']],
    ['hanviet-pinyin-wordlist', 'เลือกคำอ่าน Hán Việt ของอักษรหลายเสียงตามพินอิน', 'MIT', 'https://github.com/ph0ngp/hanviet-pinyin-wordlist', 'h', ['คลังคำ', 'อักษร']],
    ['常用漢字表 (文化庁)', 'รูปอักษรและคำอ่านทางการของญี่ปุ่น', 'เอกสารราชการญี่ปุ่น', 'https://www.bunka.go.jp/', 'o', ['คลังคำ', 'อักษร']],
    ['KANJIDIC2 (EDRDG)', 'คำอ่านคุน/อองของคันจิ', 'CC BY-SA 4.0', 'https://www.edrdg.org/wiki/index.php/KANJIDIC_Project', 'h', ['คลังคำ', 'อักษร']],
    ['JMdict (EDRDG)', 'ใช้ตรวจคำแปลภาษาญี่ปุ่น', 'CC BY-SA 4.0', 'https://www.edrdg.org/jmdict/j_jmdict.html', 'h', ['คลังคำ']],
    ['Kanji alive', 'ชื่อเรียกหมวดนำภาษาญี่ปุ่น', 'CC BY 4.0', 'https://github.com/kanjialive/kanji-data-media', 'm', ['หนังสือ', 'อักษร']],
    ['audio-cmn (Shtooka project)', 'เสียงพยางค์: Chen Wang · เสียงคำ: Yue Tan · รวบรวมโดย Hugo Lopez', 'CC BY-SA', 'https://github.com/hugolpz/audio-cmn', 'h', ['หนังสือ']]
  ];
  const CHECK = [
    ['CVDICT', 'จีน–เวียดนาม (แปลด้วย AI จาก CC-CEDICT)', 'CC BY-SA 4.0', 'https://github.com/ph0ngp/CVDICT'],
    ['VOLUBILIS Mundo', 'ไทย–หลายภาษา', 'CC BY-SA 4.0', 'https://belisan-volubilis.blogspot.com/'],
    ['LEXiTRON (NECTEC)', 'ไทย–อังกฤษ', 'สัญญาอนุญาตของ NECTEC', 'https://www.nectec.or.th/'],
    ['วิกิพจนานุกรม (kaikki.org)', 'หมวดภาษาจีนในวิกิพจนานุกรมไทย', 'CC BY-SA · GFDL', 'https://kaikki.org/'],
    ['Open Multilingual Wordnet', 'คำศัพท์ข้ามภาษา จีน ญี่ปุ่น ไทย อังกฤษ', 'WordNet License', 'https://github.com/omwn/omw-data']
  ];
  const OWN = 'คำแปลไทย อังกฤษ เวียดนาม ญี่ปุ่น ประโยคตัวอย่าง ชื่อหมวดนำภาษาไทย ความหมายไทยของอักษร (How to xie hanzi) และเนื้อหาหนังสือทุกเล่ม เรียบเรียงโดยผู้จัดทำ แปลร่วมกับ Gemini แล้วตรวจทีละแถวกับแหล่งด้านบน · สรุปตามความเข้าใจส่วนตัวเพื่อใช้ทบทวน ไม่ควรใช้อ้างอิงเชิงวิชาการ';

  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const row = ([n, what, lic, url, q, where]) => `<li class="cr-i">
      <div class="cr-h"><b>${esc2(n)}</b>${q ? `<span class="cr-q q-${q}">${T(Q[q])}</span>` : ''}</div>
      <p class="cr-w">${esc2(T(what))}</p>
      <p class="cr-m"><span>${T('สัญญาอนุญาต')}: ${esc2(lic)}</span>${where ? `<span>${T('ใช้ใน')}: ${where.map(x => T(x)).join(' · ')}</span>` : ''}</p>
      <a class="cr-a" href="${esc2(url)}" target="_blank" rel="noopener noreferrer">${T('เปิดเว็บไซต์')} ${ic('arrow-r')}</a></li>`;
  return {
    show() {
      const el = document.getElementById('crBody'); if (!el || el.dataset.done) return;
      el.dataset.done = '1';
      el.innerHTML = `<p class="lead">${T('แหล่งข้อมูลที่แอปนี้ใช้ พร้อมสัญญาอนุญาตของแต่ละแหล่ง ขอบคุณทุกโครงการที่เปิดข้อมูลให้ใช้')}</p>
        <h3 class="st">${T('ข้อมูลที่แอปแสดง')} <small>${USED.length}</small></h3><ul class="cr-list">${USED.map(row).join('')}</ul>
        <h3 class="st">${T('คำแปลและเนื้อหาของผู้จัดทำ')}</h3><div class="card cr-own">${esc2(T(OWN))}</div>
        <h3 class="st">${T('ใช้ตรวจเทียบระหว่างทำเท่านั้น')} <small>${CHECK.length}</small></h3>
        <p class="cr-note">${T('แหล่งเหล่านี้ไม่มีข้อมูลอยู่ในแอป ใช้เทียบคำแปลตอนจัดทำ')}</p>
        <ul class="cr-list cr-check">${CHECK.map(r => row([r[0], r[1], r[2], r[3]])).join('')}</ul>`;
    }
  };
})();
