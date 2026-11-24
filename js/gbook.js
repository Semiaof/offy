'use strict';
/* =====================================================================
   VOL 06 语法手册 — the grammar book's own reader (data: OFFY_BOOKS5.grammar, made by build_books.py)
     #/book/grammar          Book.i = 0 → overview with cross-level search, ready lessons, mixed practice & 7 HSK levels
                             Book.i = 1…7 → one level (HSK 1 … 7-9): ready lessons, searchable outline, tappable dict words
     #/book/grammar/<id>     one lesson, read top to bottom; in-book 5-lang & pinyin toggles; practice dock always at hand
   Practice results are tallied per grammar point in Store.d.gram (see applyWord), never as vocabulary.
   ===================================================================== */
(function gbook() {
  const ID = 'grammar', L5 = ['th', 'en', 'zh', 'vi', 'ja'];
  const HL = { th: 'th', en: 'en', zh: 'zh-Hans', vi: 'vi', ja: 'ja' };
  const L5_SHORT = { th: 'TH', en: 'EN', zh: '中', vi: 'VI', ja: 'JA' };
  const L5_NAME = { th: 'ไทย', en: 'English', zh: '中文', vi: 'Tiếng Việt', ja: '日本語' };
  const D = () => window.OFFY_BOOKS5 && window.OFFY_BOOKS5.grammar;
  let open = null, flashId = null, lastKey = null, _wset = null, lvFilter = 'all', ovSpotLv = 0;
  const packLoading = {};

  Object.assign(window.OFFY_EN || {}, {
    'ไวยากรณ์': 'Grammar', 'ภาพรวม': 'Overview', 'หัวข้อ': 'topics', 'บทเรียน': 'Lessons', 'บทเรียนพร้อมเรียน': 'Ready to study', 'ยังไม่มีบทเรียน': 'No lessons yet',
    'หัวข้อทั้งหมดในระดับนี้': 'All topics at this level', 'ค้นหาหัวข้อ คำ หรือรหัส': 'Search a topic, word or id', 'ค้นหาไวยากรณ์ทุกระดับ HSK 1–9': 'Search grammar across all HSK 1–9',
    'ไม่พบหัวข้อที่ค้นหา': 'Nothing matches', 'พบ': 'Found', 'ล้างคำค้น': 'Clear search', 'สารบัญ': 'Outline', 'เร็ว ๆ นี้': 'Coming soon',
    'ตัวอย่าง': 'Examples', 'จุดที่มักพลาด': 'Common mistakes', 'เรียนคู่กับ': 'Study with', 'ฝึกเรียงประโยค': 'Sentence order', 'ฝึกเติมคำ': 'Fill the gap',
    'จับผิดประโยค': 'Spot mistake', 'เรียงประโยค': 'Order', 'เติมคำ': 'Cloze', 'จับผิด': 'Mistake',
    'ฝึกทบทวนรวม': 'Mixed review', 'ฝึกผสมทุกบท': 'Mix all lessons', 'ข้อ': 'items',
    'ยังไม่ได้ฝึก': 'Not practised yet', 'ฝึกแล้ว': 'Practised', 'ครั้ง': 'times', 'ถูก': 'correct', 'บทถัดไป': 'Next lesson', 'บทก่อนหน้า': 'Previous lesson',
    'เรียนต่อ': 'Continue', 'เลือกระดับ แตะหัวข้อที่มีบทเรียน อ่านจบแล้วกดฝึกได้ทันที': 'Pick a level, open a lesson, practise right after reading',
    'หัวข้อทางการ': 'official topics', 'ฟังเสียง': 'Listen', 'ซ่อนคำแปล': 'Hide translations', 'แตะเพื่อดูคำแปล': 'Tap an example to reveal its translation',
    'อ่านแล้ว': 'Read', 'ทำเครื่องหมายว่าอ่านแล้ว': 'Mark as read', 'เปิดในคลังคำศัพท์': 'Open in dictionary', 'ดูในสารบัญ': 'View in outline',
    'ภาษาคำอธิบาย': 'Explanation language', 'แสดง/ซ่อนพินอิน': 'Show/hide pinyin', 'บท': 'lessons',
    'วิธีใช้ & ข้อควรระวัง': 'Usage & cautions', 'ทำได้': 'Can do', 'ทำไม่ได้': 'Avoid', 'ทั้งหมด': 'All',
    'ทำได้เพราะอะไร': 'Why it works', 'ทำไม่ได้เพราะอะไร': 'Why not', 'อ้างอิง': 'Ref',
    'ดูบทเรียนทั้งหมด': 'View all lessons', 'ยังไม่เรียน': 'To study', 'ครบทุกหัวข้อ': 'All topics complete', 'บทเรียนแนะนำ': 'Suggested lessons',
    'ยุบทั้งหมด': 'Collapse all', 'ขยายทั้งหมด': 'Expand all', 'กำลังโหลดบทเรียน…': 'Loading lessons…', 'ดูทั้งหมด': 'View all'
  });

  const GROUP_EN = {
    '语素 · 前缀': 'Morphemes · Prefixes', '语素 · 后缀': 'Morphemes · Suffixes', '语素 · 类前缀': 'Morphemes · Quasi-prefixes', '语素 · 类后缀': 'Morphemes · Quasi-suffixes',
    '词类 · 名词': 'Parts of speech · Nouns', '词类 · 动词': 'Parts of speech · Verbs', '词类 · 形容词': 'Parts of speech · Adjectives', '词类 · 代词': 'Parts of speech · Pronouns',
    '词类 · 数词': 'Parts of speech · Numbers', '词类 · 量词': 'Parts of speech · Measure words', '词类 · 副词': 'Parts of speech · Adverbs', '词类 · 介词': 'Parts of speech · Prepositions',
    '词类 · 连词': 'Parts of speech · Conjunctions', '词类 · 助词': 'Parts of speech · Particles', '词类 · 叹词': 'Parts of speech · Interjections',
    '短语 · 结构类型': 'Phrases · By structure', '短语 · 功能类型': 'Phrases · By function', '短语 · 固定短语': 'Phrases · Fixed phrases',
    '固定格式': 'Fixed patterns', '固定格式 · 固定短语': 'Fixed patterns · Fixed phrases', '固定格式 · 特殊句型': 'Fixed patterns · Special sentence types',
    '句子成分': 'Sentence parts', '句子成分 · 主语': 'Sentence parts · Subject', '句子成分 · 谓语': 'Sentence parts · Predicate', '句子成分 · 宾语': 'Sentence parts · Object',
    '句子成分 · 定语': 'Sentence parts · Attributive', '句子成分 · 状语': 'Sentence parts · Adverbial', '句子成分 · 补语': 'Sentence parts · Complement',
    '句子的类型 · 句型': 'Sentence types · Structures', '句子的类型 · 句类': 'Sentence types · Moods', '句子的类型 · 特殊句型': 'Sentence types · Special patterns',
    '句子的类型 · 特殊句式': 'Sentence types · Special constructions', '句子的类型 · 复句': 'Sentence types · Complex sentences',
    '句子的类型 · 简单复句': 'Sentence types · Simple complex', '句子的类型 · 多重复句': 'Sentence types · Multi-clause',
    '动作的态': 'Verb aspect', '特殊表达法 · 数的表达法': 'Special expressions · Numbers', '特殊表达法 · 数的表示法': 'Special expressions · Numbers',
    '特殊表达法 · 时间表示法': 'Special expressions · Time', '语段（句群）': 'Discourse & paragraphs'
  };

  /* grammar formula metalanguage → localized gloss for non-Chinese readers */
  const FORM_GLOSS = {
    '学来的技能': ['ทักษะที่เรียนมา', 'learned skill', 'kỹ năng học được', '学んだ技能'],
    '一般是非问': ['คำถามใช่/ไม่ใช่ทั่วไป', 'yes/no question', 'câu hỏi đúng/sai', 'はい・いいえ疑問文'],
    '两个句子用': ['สองประโยคใช้', 'two clauses use ', 'hai câu dùng ', '二つの文は'],
    '光杆宾语时': ['เมื่อกรรมเป็นคำเดี่ยว', 'with a bare object', 'khi tân ngữ trơn', '裸の目的語なら'],
    '不是全部都': ['ไม่ได้ทั้งหมด', 'not all', 'không phải tất cả', '全員ではない'],
    '客观条件': ['เงื่อนไขสถานการณ์', 'conditions', 'điều kiện', '客観的条件'],
    '数量不限': ['ไม่จำกัดจำนวน', 'any quantity', 'không giới hạn', '数量不問'],
    '人称代词': ['คำสรรพนามบุคคล', 'Pronoun', 'đại từ nhân xưng', '人称代名詞'],
    '没有某物': ['ไม่มีสิ่งนั้น', "don't have sth", 'không có vật gì', '何かがない'],
    '复数主语': ['ประธานพหูพจน์', 'Plural subject', 'chủ ngữ số nhiều', '複数主語'],
    '必须有': ['ต้องมี', 'requires ', 'bắt buộc có ', '必須：'],
    '可省': ['ละได้: ', 'optional ', 'bỏ được ', '省略可：'],
    '全都不': ['ไม่ทั้งหมดเลย', 'none of them', 'tất cả đều không', 'どれも〜ない'],
    '修饰语': ['ส่วนขยาย', 'Modifier', 'định ngữ', '修飾語'],
    '陈述句': ['ประโยคบอกเล่า', 'Statement', 'câu trần thuật', '平叙文'],
    '多位数': ['เลขหลายหลัก', 'multi-digit', 'số nhiều chữ số', '多桁の数'],
    '问价格': ['ถามราคา', 'ask price', 'hỏi giá', '値段を尋ねる'],
    '离合词': ['กริยาแยกได้', 'Separable verb', 'động từ ly hợp', '離合詞'],
    '放句末': ['วางท้ายประโยค', 'at sentence end', 'đặt cuối câu', '文末に置く'],
    '不想要': ['ไม่ต้องการ/ไม่เอา', "don't want", 'không muốn lấy', '要らない'],
    '形容词': ['คำคุณศัพท์', 'Adj', 'tính từ', '形容詞'],
    '没发生': ['ไม่ได้เกิดขึ้น', 'did not happen', 'chưa xảy ra', '起きていない'],
    '以内': [' ลงมา', ' or less', ' trở xuống', '以下'],
    '能力': ['ความสามารถ', 'ability', 'năng lực', '能力'],
    '允许': ['การอนุญาต', 'permission', 'cho phép', '許可'],
    '请求': ['ขอร้อง', 'request', 'xin phép', '依頼'],
    '愿望': ['ความปรารถนา', 'wish', 'mong muốn', '願望'],
    '想法': ['ความคิด', 'thought', 'ý định', '考え'],
    '决定': ['ตัดสินใจแล้ว', 'decision', 'quyết định', '決定'],
    '需要': ['ต้องการ', 'need', 'cần', '必要'],
    '否定': ['ปฏิเสธ', 'negate ', 'phủ định ', '否定：'],
    '数数': ['นับเลข', 'counting', 'đếm số', '数える'],
    '序号': ['ลำดับที่', 'ordinals', 'số thứ tự', '序数'],
    '日期': ['วันที่', 'dates', 'ngày tháng', '日付'],
    '分句': ['ประโยคย่อย', 'Clause', 'mệnh đề', '節'],
    '逗号': ['จุลภาค', 'comma', 'dấu phẩy', '読点'],
    '亲属': ['ญาติสนิท', 'family', 'người thân', '親族'],
    '集体': ['กลุ่ม/องค์กร', 'group', 'tập thể', '所属集団'],
    '商量': ['ปรึกษา/ชวน', 'suggest', 'bàn bạc', '相談'],
    '提议': ['เสนอแนะ', 'propose', 'đề nghị', '提案'],
    '推测': ['คาดเดา', 'guess', 'phỏng đoán', '推測'],
    '反问': ['ถามย้อน', 'follow-up', 'hỏi ngược', '聞き返し'],
    '主语': ['ประธาน', 'Subject', 'chủ ngữ', '主語'],
    '谓语': ['ภาคแสดง', 'Predicate', 'vị ngữ', '述語'],
    '宾语': ['กรรม', 'Object', 'tân ngữ', '目的語'],
    '定语': ['ส่วนขยายนาม', 'Modifier', 'định ngữ', '定語'],
    '状语': ['ส่วนขยายกริยา', 'Adverbial', 'trạng ngữ', '状況語'],
    '补语': ['ส่วนเสริมกริยา', 'Complement', 'bổ ngữ', '補語'],
    '动词': ['กริยา', 'Verb', 'động từ', '動詞'],
    '名词': ['คำนาม', 'Noun', 'danh từ', '名詞'],
    '副词': ['คำวิเศษณ์', 'Adverb', 'phó từ', '副詞'],
    '量词': ['ลักษณนาม', 'Measure', 'lượng từ', '量詞'],
    '代词': ['คำสรรพนาม', 'Pronoun', 'đại từ', '代名詞'],
    '时间': ['เวลา', 'Time', 'thời gian', '時間'],
    '地点': ['สถานที่', 'Place', 'nơi chốn', '場所'],
    '处所': ['สถานที่', 'Place', 'nơi chốn', '場所'],
    '数量': ['จำนวน', 'Quantity', 'số lượng', '数量'],
    '现在': ['ปัจจุบัน', 'present', 'hiện tại', '現在'],
    '将来': ['อนาคต', 'future', 'tương lai', '未来'],
    '习惯': ['นิสัย', 'habit', 'thói quen', '習慣'],
    '意愿': ['ความตั้งใจ', 'intention', 'ý muốn', '意志'],
    '不用': ['ไม่ใช้', 'no ', 'không dùng ', '使わない：'],
    '劝阻': ['ห้ามปราม', 'prohibition', 'khuyên ngăn', '制止'],
    '命令': ['คำสั่ง', 'command', 'mệnh lệnh', '命令'],
    '句子': ['ประโยค', 'Sentence', 'câu', '文'],
    '小句': ['อนุประโยค', 'Clause', 'mệnh đề', '節'],
    '回答许可或禁止': ['ตอบอนุญาตหรือห้าม', 'grant or refuse permission', 'trả lời cho phép/cấm', '許可・禁止の返答'],
    '未发生的重复': ['การทำซ้ำในอนาคต', 'future repetition', 'lặp lại tương lai', 'これからの反復'],
    '否定词放介词前': ['วางคำปฏิเสธหน้าบุพบท', 'negation before preposition', 'phủ định trước giới từ', '否定詞は前置詞の前'],
    '无需“第”的惯用序数': ['ลำดับที่ไม่ต้องใส่ 第', 'ordinals without 第', 'số thứ tự không cần 第', '「第」不要の序数'],
    '带零头口语': ['มีเศษ (ภาษาพูด)', 'spoken decimals', 'số lẻ khẩu ngữ', '端数（口語）'],
    '名词性词语': ['คำ/วลีนาม', 'Noun phrase', 'cụm danh từ', '名詞句'],
    '名词性短语': ['วลีนาม', 'Noun phrase', 'cụm danh từ', '名詞句'],
    '数量短语': ['วลีจำนวน', 'Numeral-CL', 'cụm số lượng', '数量詞句'],
    '介宾短语': ['วลีบุพบท', 'Prep phrase', 'cụm giới tân', '前置詞句'],
    '方位短语': ['วลีตำแหน่ง', 'Locative phrase', 'cụm phương vị', '方位句'],
    '亲切称呼': ['เรียกอย่างสนิทสนม', 'warm address', 'gọi thân mật', '親しみの呼称'],
    '请求许可': ['ขออนุญาต', 'ask permission', 'xin phép', '許可を求める'],
    '指人名词': ['คำนามเรียกคน', 'Human noun', 'danh từ chỉ người', '人の名詞'],
    '交通工具': ['พาหนะ', 'Transport', 'phương tiện', '乗り物'],
    '心理动词': ['กริยาความรู้สึก', 'Mental verb', 'động từ tâm lý', '心理動詞'],
    '自然现象': ['ปรากฏการณ์ธรรมชาติ', 'Nature', 'hiện tượng tự nhiên', '自然現象'],
    '礼貌请求': ['ขอร้องสุภาพ', 'Polite request', 'yêu cầu lịch sự', '丁寧な依頼'],
    '商量建议': ['ชวน/แนะนำ', 'Suggestion', 'gợi ý', '提案・勧誘'],
    '禁止劝阻': ['ห้ามปราม', 'Prohibition', 'cấm đoán', '禁止'],
    '同一主语': ['ประธานคนเดิม', 'Same subject', 'cùng chủ ngữ', '同一主語'],
    '从大到小': ['เรียงใหญ่→เล็ก', 'Big→Small', 'Lớn→Nhỏ', '大→小の順'],
    '中心名词': ['คำนามหลัก', 'Head noun', 'danh từ trung tâm', '中心名詞'],
    '方位词': ['คำบอกตำแหน่ง', 'Position word', 'phương vị từ', '方位詞'],
    '时量词': ['ลักษณนามเวลา', 'Time CL', 'lượng từ thời gian', '時間量詞'],
    '多音节': ['หลายพยางค์', 'Multi-syllable', 'đa âm tiết', '多音節'],
    '双音节': ['สองพยางค์', '2-syllable', '2 âm tiết', '2音節'],
    '不加': ['ไม่ใส่', 'no ', 'không thêm ', '不要：'],
    '数词': ['ตัวเลข', 'Number', 'số từ', '数詞'],
    '序数': ['ลำดับที่', 'Ordinal', 'số thứ tự', '序数'],
    '单数': ['เอกพจน์', 'Singular', 'số ít', '単数'],
    '复数': ['พหูพจน์', 'Plural', 'số nhiều', '複数'],
    '敬称': ['คำสุภาพ', 'Polite', 'kính xưng', '敬称'],
    '饮品': ['เครื่องดื่ม', 'Drink', 'đồ uống', '飲み物'],
    '肯定': ['บอกเล่า', 'Affirmative', 'khẳng định', '肯定'],
    '疑问': ['คำถาม', 'Question', 'nghi vấn', '疑問'],
    '口语': ['ภาษาพูด', 'Spoken', 'khẩu ngữ', '口語'],
    '书面': ['ภาษาเขียน', 'Written', 'văn viết', '書き言葉'],
    '标价': ['ป้ายราคา', 'Price tag', 'bảng giá', '値札'],
    '整点': ['โมงตรง', 'On the hour', 'giờ chẵn', 'ちょうど'],
    '半点': ['ครึ่งชั่วโมง', 'Half past', 'giờ rưỡi', '半'],
    '时段': ['ช่วงเวลา', 'Time of day', 'buổi', '時間帯'],
    '钟点': ['นาฬิกา', 'Clock time', 'giờ giấc', '時刻'],
    '年龄': ['อายุ', 'Age', 'tuổi', '年齢'],
    '钱数': ['จำนวนเงิน', 'Money', 'số tiền', '金額'],
    '价格': ['ราคา', 'Price', 'giá cả', '価格'],
    '籍贯': ['บ้านเกิด', 'Hometown', 'quê quán', '出身地'],
    '天气': ['อากาศ', 'Weather', 'thời tiết', '天気'],
    '对象': ['เป้าหมาย/บุคคล', 'Target/Person', 'đối tượng', '対象'],
    '事物': ['สิ่งของ', 'Thing', 'sự vật', '事物'],
    '动作': ['การกระทำ', 'Action', 'hành động', '動作'],
    '目的': ['จุดประสงค์', 'Purpose', 'mục đích', '目的'],
    '方式': ['วิธีการ', 'Method', 'phương thức', '手段'],
    '状态补语': ['บทเสริมสภาพ', 'State complement', 'bổ ngữ trạng thái', '様態補語'],
    '形容词性补语': ['บทเสริมคุณศัพท์', 'Adj complement', 'bổ ngữ tính từ', '形容詞性補語'],
    '形容词性短语': ['วลีคุณศัพท์', 'Adj phrase', 'cụm tính từ', '形容詞句'],
    '神态': ['สีหน้า/อารมณ์', 'Expression/Manner', 'thần thái', '表情・様子'],
    '结果补语': ['บทเสริมผลลัพธ์', 'Result complement', 'bổ ngữ kết quả', '結果補語'],
    '趋向补语': ['บทเสริมทิศทาง', 'Directional comp.', 'bổ ngữ xu hướng', '方向補語'],
    '数量补语': ['บทเสริมจำนวน/เวลา', 'Quantity comp.', 'bổ ngữ số lượng', '数量補語'],
    '程度补语': ['บทเสริมระดับ', 'Degree comp.', 'bổ ngữ trình độ', '程度補語'],
    '原因分句': ['ประโยคเหตุผล', 'Cause clause', 'mệnh đề nguyên nhân', '原因節'],
    '结果分句': ['ประโยคผลลัพธ์', 'Result clause', 'mệnh đề kết quả', '結果節'],
    '强调部分': ['ส่วนที่เน้น', 'Focused part', 'phần nhấn mạnh', '強調部分'],
    '说明性短语': ['วลีอธิบายลักษณะ', 'Descriptive phrase', 'cụm mô tả', '説明語句'],
    '普通名词': ['คำนามทั่วไป', 'Common noun', 'danh từ thường', '普通名詞'],
    '有普通宾语': ['มีกรรมทั่วไป', 'With common object', 'có tân ngữ thường', '普通目的語あり'],
    '普通宾语': ['กรรมทั่วไป', 'Common object', 'tân ngữ thường', '普通目的語'],
    '具体数量': ['ตัวเลขชัดเจน', 'Exact amount', 'số lượng cụ thể', '具体数量'],
    '具体差额': ['ส่วนต่างชัดเจน', 'Exact difference', 'chênh lệch cụ thể', '具体的な差'],
    '主语相同': ['ประธานเดียวกัน', 'Same subject', 'cùng chủ ngữ', '主語が同じ'],
    '主语不同': ['ประธานต่างกัน', 'Different subjects', 'khác chủ ngữ', '主語が異なる'],
    '不同主语': ['ประธานต่างกัน', 'Different subjects', 'khác chủ ngữ', '異なる主語'],
    '方式伴随': ['อาการประกอบ', 'Accompanying manner', 'trạng thái đi kèm', '付帯状況'],
    '动作持续': ['กริยากำลังค้างอยู่', 'Ongoing action', 'hành động kéo dài', '動作の持続'],
    '选择疑问': ['คำถามให้เลือก', 'Choice question', 'câu hỏi lựa chọn', '選択疑問'],
    '承接推论': ['สรุปต่อความ', 'Consequent / Then', 'suy luận tiếp nối', '承接・推論'],
    '可分量词': ['ลักษณนามแบ่งย่อยได้', 'Divisible CL', 'lượng từ chia nhỏ được', '分割可能な量詞'],
    '绝不能省略': ['ห้ามละเด็ดขาด', 'cannot be omitted', 'tuyệt đối không lược bỏ', '省略絶対不可'],
    '正式人数': ['จำนวนคน (ทางการ)', 'Formal headcount', 'số người trang trọng', '正式な人数'],
    '单音节': ['หนึ่งพยางค์', '1-syllable', '1 âm tiết', '1音節'],
    '整十数': ['เลขหลักสิบลงตัว', 'Multiples of 10', 'số tròn chục', '10の倍数'],
    '非整十': ['ไม่ใช่หลักสิบเต็ม', 'Non-round ten', 'không tròn chục', '端数あり'],
    '小差距': ['ต่างเล็กน้อย', 'Small gap', 'chênh lệch nhỏ', 'わずかな差'],
    '大差距': ['ต่างกันมาก', 'Large gap', 'chênh lệch lớn', '大きな差'],
    '动作者': ['ผู้กระทำ', 'Agent / Doer', 'người thực hiện', '動作主'],
    '大主语': ['ประธานใหญ่', 'Big subject', 'chủ ngữ lớn', '大主語'],
    '小主语': ['ประธานย่อย', 'Small subject', 'chủ ngữ nhỏ', '小主語'],
    '无宾语': ['ไม่มีกรรม', 'No object', 'không tân ngữ', '目的語なし'],
    '带宾语': ['มีกรรมตามหลัง', 'With object', 'có tân ngữ', '目的語あり'],
    '长条形': ['ของเรียวยาว', 'Long & thin', 'vật dài mảnh', '細長い物'],
    '已发生': ['เกิดขึ้นแล้ว', 'already happened', 'đã xảy ra', '既発'],
    '最常用': ['ใช้บ่อยสุด', 'Most common', 'dùng nhiều nhất', '最頻出'],
    '绝对不会': ['เป็นไปไม่ได้เด็ดขาด', 'impossible', 'tuyệt đối không', '絶対ありえない'],
    '也许不': ['อาจจะไม่', 'might not', 'có thể không', '〜ないかも'],
    '绝不是': ['ไม่ใช่เด็ดขาด', 'NEVER ', 'tuyệt đối không phải ', '絶対不可：'],
    '绝不用': ['ห้ามใช้เด็ดขาด', 'NEVER use ', 'tuyệt đối không dùng ', '使用厳禁：'],
    '形式1': ['แบบที่ 1', 'Form 1', 'Dạng 1', '形1'],
    '形式2': ['แบบที่ 2', 'Form 2', 'Dạng 2', '形2'],
    '主语1': ['ประธาน 1', 'Subj 1', 'Chủ ngữ 1', '主語1'],
    '主语2': ['ประธาน 2', 'Subj 2', 'Chủ ngữ 2', '主語2'],
    '动词1': ['กริยา 1', 'Verb 1', 'Động từ 1', '動詞1'],
    '动词2': ['กริยา 2', 'Verb 2', 'Động từ 2', '動詞2'],
    '动作1': ['การกระทำ 1', 'Action 1', 'Hành động 1', '動作1'],
    '动作2': ['การกระทำ 2', 'Action 2', 'Hành động 2', '動作2'],
    '宾语1': ['กรรม 1', 'Obj 1', 'Tân ngữ 1', '目的語1'],
    '宾语2': ['กรรม 2', 'Obj 2', 'Tân ngữ 2', '目的語2'],
    '分句1': ['ประโยคย่อย 1', 'Clause 1', 'Mệnh đề 1', '節1'],
    '分句2': ['ประโยคย่อย 2', 'Clause 2', 'Mệnh đề 2', '節2'],
    '整十': ['หลักสิบเต็ม', 'Tens', 'tròn chục', '10の倍数'],
    '整百': ['หลักร้อยเต็ม', 'Hundreds', 'tròn trăm', '100の倍数'],
    '整千': ['หลักพันเต็ม', 'Thousands', 'tròn nghìn', '1000の倍数'],
    '概数': ['จำนวนประมาณ', 'Approx.', 'ước lượng', '概数'],
    '起点': ['จุดเริ่มต้น', 'Start point', 'điểm đầu', '起点'],
    '终点': ['จุดหมาย', 'End point', 'điểm cuối', '終点'],
    '路径': ['เส้นทางผ่าน', 'Route / Path', 'lối đi', '経路'],
    '方向': ['ทิศทาง', 'Direction', 'phương hướng', '方向'],
    '转折': ['ขัดแย้ง', 'Contrast', 'tương phản', '逆接'],
    '因果': ['เหตุและผล', 'Cause & effect', 'nhân quả', '因果'],
    '时长': ['ระยะเวลา', 'Duration', 'thời lượng', '時間の長さ'],
    '次数': ['จำนวนครั้ง', 'Frequency', 'số lần', '回数'],
    '程度': ['ระดับ', 'Degree', 'mức độ', '程度'],
    '条件': ['เงื่อนไข', 'Condition', 'điều kiện', '条件'],
    '重动': ['ซ้ำกริยา', 'Verb-copying', 'lặp động từ', '動詞重ね'],
    '物品': ['สิ่งของ', 'Item', 'đồ vật', '品物'],
    '例如': ['ตัวอย่าง', 'e.g.', 'Ví dụ', '例'],
    '整体': ['ทั้งตัว/ทั้งหมด', 'Whole', 'tổng thể', '全体'],
    '部分': ['ส่วนย่อย', 'Part', 'bộ phận', '部分'],
    '属性': ['คุณสมบัติ', 'Attribute', 'thuộc tính', '属性'],
    '可能补语': ['บทเสริมความเป็นไปได้', 'Potential comp.', 'bổ ngữ khả năng', '可能補語'],
    '主谓短语': ['วลีประธาน-กริยา', 'Subj-Pred phrase', 'cụm chủ vị', '主述句'],
    '同位短语': ['วลีซ้อนความหมาย', 'Appositive phrase', 'cụm đồng vị', '同格句'],
    '动补短语': ['วลีกริยา-บทเสริม', 'Verb-Comp phrase', 'cụm động bổ', '動補句'],
    '动词短语': ['วลีกริยา', 'Verb phrase', 'cụm động từ', '動詞句'],
    '名词短语': ['วลีนาม', 'Noun phrase', 'cụm danh từ', '名詞句'],
    '形容词短语': ['วลีคุณศัพท์', 'Adj phrase', 'cụm tính từ', '形容詞句'],
    '多项定语': ['ส่วนขยายนามหลายชั้น', 'Multi-modifiers', 'đa định ngữ', '多重連体修飾'],
    '其他成分': ['ส่วนประกอบอื่น (了/บทเสริม)', 'Other element', 'thành phần khác', 'その他成分'],
    '间隔时间': ['ช่วงเวลาที่ผ่านไป', 'Elapsed time', 'thời gian đã qua', '経過時間'],
    '排行数词': ['เลขลำดับพี่น้อง', 'Sibling order', 'số thứ tự anh em', '兄弟順の数'],
    '固定称呼词': ['คำเรียกเฉพาะ', 'Fixed title', 'danh xưng cố định', '固定呼称'],
    '量词重叠': ['ซ้ำลักษณนาม', 'CL reduplication', 'lặp lượng từ', '量詞の重ね型'],
    '数量重叠': ['ซ้ำจำนวน+ลักษณนาม', 'Num-CL redup.', 'lặp số lượng', '数量重ね型'],
    '相邻数词': ['เลขสองตัวติดกัน', 'Adjacent numbers', 'hai số liền kề', '隣り合う数詞'],
    '处所词': ['คำบอกสถานที่', 'Place word', 'từ chỉ nơi chốn', '場所詞'],
    '时间点': ['จุดเวลา', 'Point in time', 'mốc thời gian', '時点'],
    '时间段': ['ช่วงเวลา', 'Time span', 'khoảng thời gian', '期間'],
    '肯定式': ['รูปบอกเล่า', 'Affirmative', 'thể khẳng định', '肯定形'],
    '否定式': ['รูปปฏิเสธ', 'Negative', 'thể phủ định', '否定形'],
    '疑问式': ['รูปคำถาม', 'Interrogative', 'thể nghi vấn', '疑問形'],
    '反问句': ['ประโยคคำถามย้อน', 'Rhetorical Q', 'câu hỏi tu từ', '反語文'],
    '被动句': ['ประโยคถูกกระทำ', 'Passive', 'câu bị động', '受け身文'],
    '把字句': ['ประโยค 把', '把 sentence', 'câu chữ 把', '把構文'],
    '重动句': ['ประโยคซ้ำกริยา', 'Verb-copying', 'câu lặp động từ', '動詞重ね文'],
    '递进': ['เสริมระดับขึ้นไป', 'Progressive', 'tăng tiến', '漸進・累加'],
    '假设': ['สมมติเงื่อนไข', 'Hypothetical', 'giả thiết', '仮定'],
    '让步': ['ยอมรับเงื่อนไข', 'Concessive', 'nhượng bộ', '譲歩'],
    '并列': ['คู่ขนาน', 'Parallel', 'song song', '並列'],
    '承接': ['ต่อเนื่องตามลำดับ', 'Sequential', 'kế tiếp', '継起'],
    '选择': ['เลือกอย่างใดอย่างหนึ่ง', 'Alternative', 'lựa chọn', '選択'],
    '施事': ['ผู้กระทำ', 'Agent', 'chủ thể', '動作主'],
    '受事': ['ผู้ถูกกระทำ', 'Patient', 'đối tượng bị tác động', '対象'],
    '依据': ['หลักเกณฑ์/แหล่งอ้างอิง', 'Basis/Source', 'căn cứ', '根拠'],
    '前提': ['เงื่อนไขเบื้องต้น', 'Premise', 'tiền đề', '前提'],
    '例外': ['ข้อยกเว้น', 'Exception', 'ngoại lệ', '例外'],
    '对比': ['เปรียบเทียบต่าง', 'Contrast', 'đối chiếu', '対比'],
    '原因': ['เหตุผล', 'Reason', 'nguyên nhân', '原因'],
    '结果': ['ผลลัพธ์', 'Result', 'kết quả', '結果'],
    '动': ['กริยา', 'V', 'Đt', '動'],
    '宾': ['กรรม', 'O', 'Tn', '目']
  };
  const FORM_KEYS = Object.keys(FORM_GLOSS).sort((a, b) => b.length - a.length);
  const FORM_RE = new RegExp(`(${FORM_KEYS.join('|')})`, 'g');

  /* curated distractors for cloze practice (matched by grammar category / length) */
  const CONFUSE = {
    '会': ['能', '可以', '想', '要'], '能': ['会', '可以', '想', '要'], '可以': ['不会', '不要', '没有', '有点儿'], '不可以': ['不会', '没有', '不是', '不想'],
    '想': ['要', '会', '能', '很'], '要': ['想', '会', '能', '在'], '不想': ['不要', '没有', '不能', '不会'],
    '睡觉': ['说话', '上课', '看病', '吃饭'], '说话': ['睡觉', '上课', '看病', '学习'], '说': ['睡', '看', '听', '写'], '睡': ['说', '坐', '去', '吃'],
    '上课': ['上班', '说话', '睡觉', '看病'], '看病': ['生病', '上课', '睡觉', '说话'],
    '几': ['多', '谁', '哪', '两'], '多少': ['几个', '什么', '怎么', '哪儿'],
    '两': ['二', '三', '几', '一'], '二': ['两', '三', '几', '十'],
    '很': ['太', '真', '都', '也'], '非常': ['有点儿', '一点儿', '不要', '没有'], '太': ['很', '真', '都', '不'], '真': ['很', '太', '都', '也'], '有点儿': ['一点儿', '非常', '没有', '不要'],
    '都': ['也', '还', '很', '不'], '都不': ['不都', '没有', '不要', '不想'], '不都': ['都不', '没有', '不是', '不想'],
    '了': ['没', '的', '呢', '吧'], '没': ['不', '了', '很', '都'], '不': ['没', '很', '也', '都'],
    '没有': ['不要', '不是', '不能', '不想'], '不要': ['没有', '不能', '不想', '不是'], '不是': ['没有', '不要', '不能', '不在'],
    '和': ['的', '在', '都', '也'], '的': ['了', '和', '吗', '呢'], '对': ['在', '和', '给', '到'],
    '吗': ['吧', '呢', '了', '的'], '吧': ['吗', '呢', '了', '的'], '呢': ['吗', '吧', '了', '的'],
    '上': ['下', '里', '前', '后'], '下': ['上', '里', '前', '后'], '里': ['上', '下', '外', '前'], '前': ['后', '上', '下', '里'], '后': ['前', '上', '下', '里'],
    '外边': ['里面', '上面', '下面', '这里'], '这里': ['那里', '外边', '哪儿', '这些'],
    '这': ['那', '哪', '几', '他'], '那个': ['这个', '哪个', '这些', '那些'], '这些': ['那些', '这个', '那个', '很多'],
    '您': ['你', '他', '她', '我'], '她': ['他', '它', '你', '我'], '它': ['他', '她', '你', '我'], '大家': ['我们', '你们', '他们', '朋友'],
    '本': ['个', '件', '只', '杯'], '件': ['本', '个', '只', '家'], '只': ['个', '本', '件', '口'], '口': ['个', '家', '本', '只'], '家': ['个', '口', '件', '本'], '块': ['元', '个', '杯', '本'], '杯': ['个', '本', '块', '件'], '元': ['块', '分', '岁', '号'],
    '年': ['天', '岁', '月', '号'], '天': ['年', '岁', '号', '分'], '岁': ['年', '天', '号', '点'], '号': ['月', '年', '天', '点'], '分': ['点', '号', '天', '岁'],
    '正在': ['没有', '不要', '已经', '可以'], '在': ['去', '来', '有', '是'], '没在': ['不在', '没有', '不是', '不要'], '不在': ['没在', '不是', '没有', '不去'],
    '再': ['还', '也', '都', '在'], '也': ['还', '都', '再', '很'], '还': ['也', '再', '都', '很'],
    '第一': ['第二', '第三', '一个', '一次'], '第二': ['第两', '第一', '第三', '两个'], '第三': ['第二', '第一', '第五', '三个'], '第五': ['第二', '第三', '第一', '五个'],
    '一下': ['一点', '一个', '一下儿', '两个'], '请': ['要', '想', '去', '来'], '喂': ['请', '好', '嗯', '对'],
    '什么': ['哪儿', '怎么', '多少', '哪个'], '谁': ['哪', '几', '他', '我'], '哪儿': ['什么', '怎么', '这里', '那里'], '怎么': ['什么', '哪儿', '多少', '为什么'],
    '去不去': ['不去去', '去没去', '是不是', '有没有'], '是不是': ['有没有', '去不去', '冷不冷', '好不好'], '有没有': ['有不有', '是不是', '去不去', '没有'], '冷不冷': ['很冷不冷', '是不是', '热不热', '好不好'], '喜不喜欢': ['很喜欢', '是不是', '有没有', '去不去'],
    '是': ['有', '在', '去', '叫'], '有': ['是', '在', '买', '给'], '两点半': ['二点半', '两小时', '十点半', '八点半'], '两块': ['二块', '五块', '十元', '两个'], '星期天': ['星期七', '星期一', '今天', '明天'],
    '在家': ['回家', '去家', '在医院', '在学校'], '在医院': ['在家里', '去医院', '在饭店', '明天'], '在家里': ['在医院', '在饭店', '明天', '晚上'],
    '明天': ['昨天', '今天', '晚上', '现在'], '晚上': ['早上', '昨天', '明天', '上午'],
    '得': ['的', '地', '了', '着'], '地': ['的', '得', '了', '着'], '着': ['了', '过', '的', '得'], '过': ['了', '着', '的', '完'],
    '啊': ['吗', '呢', '吧', '了'], '比': ['跟', '从', '往', '给'], '从': ['往', '跟', '在', '到'], '往': ['从', '在', '给', '跟'],
    '给': ['跟', '从', '往', '在'], '跟': ['比', '从', '往', '给'], '别': ['不', '没', '请', '再'], '最': ['很', '太', '真', '更'],
    '好': ['很', '太', '真', '最'], '多': ['很', '太', '真', '几'], '就': ['再', '都', '还', '也'], '正': ['常', '就', '再', '快'],
    '常': ['正', '就', '再', '快'], '快': ['正', '常', '就', '已'], '每': ['几', '哪', '这', '那'], '左': ['右', '前', '后', '上'],
    '万': ['千', '百', '十', '两'], '条': ['个', '件', '本', '只'], '位': ['个', '名', '条', '间'], '间': ['个', '条', '位', '家'],
    '名': ['个', '位', '条', '只'], '包': ['杯', '块', '件', '本'], '次': ['个', '天', '年', '点'], '那': ['这', '哪', '但', '就'],
    '但': ['那', '就', '还', '也'], '让': ['给', '跟', '比', '从'], '叫': ['让', '请', '给', '跟'], '一': ['就', '再', '都', '还'],
    '因为': ['所以', '虽然', '但是', '为什么'], '所以': ['因为', '但是', '虽然', '还是'], '虽然': ['因为', '但是', '所以', '已经'],
    '但是': ['所以', '因为', '虽然', '还是'], '还是': ['但是', '所以', '因为', '一起'], '一起': ['已经', '经常', '有时候', '自己'],
    '已经': ['快要', '正在', '经常', '一起'], '快要': ['已经', '正在', '经常', '可能'], '就要': ['已经', '正在', '不常', '可能'],
    '经常': ['不常', '已经', '快要', '一起'], '不常': ['经常', '没常', '不能', '不想'], '有时候': ['经常', '已经', '快要', '为什么'],
    '可能': ['可以', '已经', '经常', '应该'], '不可能': ['不可以', '没可能', '不经常', '为什么'], '为什么': ['怎么样', '什么时候', '多少钱', '什么'],
    '自己': ['大家', '一起', '我们', '他们'], '这么': ['那么', '怎么', '这样', '那样'], '那么': ['这么', '怎么', '那样', '这样'],
    '这样': ['那样', '这么', '那么', '怎么'], '那样': ['这样', '那么', '这么', '怎么'], '好多': ['很少', '多少', '几个', '一点儿'],
    '上面': ['下面', '里面', '外面', '前面'], '外面': ['里面', '上面', '前面', '后面'], '里面': ['外面', '上面', '下面', '前面'],
    '前面': ['后面', '上面', '左边', '右边'], '后面': ['前面', '下面', '左边', '右边'], '左边': ['右边', '前面', '后面', '上面'],
    '右边': ['左边', '前面', '后面', '里面'], '什么的': ['怎么的', '为什么', '是不是', '有没有'], '请别': ['别请', '不要', '没有', '不能'],
    '别太': ['太别', '不要', '不太', '没有'], '从小': ['从大', '现在', '以后', '经常'],
    '看完': ['看懂', '看错', '看过', '看着'], '吃完': ['吃错', '吃懂', '吃过', '吃着'], '听懂': ['听完', '听错', '听过', '听着'],
    '写错': ['写完', '写懂', '写过', '写着'], '做好': ['做错', '做完', '做过', '做着'], '准备好': ['准备错', '准备完', '准备过', '没准备'],
    '学会': ['学完', '学错', '学过', '学着'], '进来': ['进去', '出来', '出去', '上去'], '出去': ['出来', '进去', '进来', '下去'],
    '下去': ['上去', '下来', '进来', '出去'], '过来': ['过去', '进来', '出来', '起来'], '起来': ['过来', '下去', '进来', '出去'],
    '走进': ['走出', '走过', '走着', '走回'], '走过': ['走进', '走着', '走回', '走上'], '跑进': ['跑回', '跑上', '跑过', '跑着'],
    '跑上': ['跑下', '跑进', '跑回', '跑过'], '跑回': ['跑进', '跑上', '跑过', '跑着'], '拿进': ['拿出', '拿给', '拿着', '拿回'],
    '送给': ['拿给', '介绍给', '送去', '送来'], '送给了': ['拿给了', '给送了', '送去了', '送着'], '拿给': ['送给', '介绍给', '拿着', '拿进'],
    '介绍给': ['送给', '拿给', '给介绍', '介绍完'],
    '没去过': ['不去过', '去过了', '没去了', '没去着'], '没吃过': ['不吃过', '吃过了', '没吃了', '没吃着'], '没开着': ['不开着', '开着了', '没开了', '没开过'],
    '开着': ['开了', '开过', '没开', '打开'], '穿着': ['穿了', '穿过', '没穿', '站着'], '拿着': ['拿了', '拿过', '拿给', '拿进'],
    '笑着': ['笑了', '笑过', '站着', '坐着'], '站着': ['坐着', '走着', '等着', '笑着'], '坐着': ['站着', '走着', '等着', '拿着'],
    '走着': ['站着', '坐着', '等着', '走过'], '等着': ['站着', '坐着', '走着', '等过'], '睡着': ['睡了', '睡过', '站着', '坐着'],
    '看过': ['看着', '看完', '看懂', '看看'], '学过': ['学着', '学会', '学完', '学习'], '找过': ['找着', '找完', '找错', '找到'],
    '看看': ['看了看', '看一看', '看过', '看着'], '看了看': ['看一看', '看看', '看过', '看着'], '听一听': ['听了听', '听懂', '听完', '听过'],
    '休息休息': ['休休息息', '休息了', '介绍介绍', '学习学习'], '介绍介绍': ['介介绍绍', '介绍给', '休息休息', '介绍了'],
    '慢慢': ['慢一点儿', '快快', '常常', '已经'], '大大的': ['大一点儿', '大得多', '长长的', '高高兴兴'], '长长的': ['大大的', '高高兴兴', '很长的', '短一点儿'],
    '高高兴兴': ['高兴高兴', '大大的', '长长的', '非常高兴'],
    '跑得': ['跑的', '跑地', '跑过', '跑着'], '说得': ['说的', '说地', '说过', '说着'], '考得': ['考的', '考地', '考过', '考完'],
    '游得': ['游的', '游地', '游过', '游泳'], '得不': ['不得', '的不', '地不', '没得'],
    '二楼': ['两楼', '一楼', '二班', '二路'], '一楼': ['二楼', '一班', '一路', '一个楼'], '二班': ['两班', '二楼', '二月', '二路'],
    '二月': ['两月', '二号', '二楼', '二班'], '二路': ['两路', '二楼', '二班', '两条路'],
    '两万': ['二万', '两千', '一万', '二十万'], '十多': ['多十', '十几', '二十多', '三十多'], '二十多': ['二十几', '十多', '三十多', '四十多'],
    '三十多': ['三十几', '二十多', '四十多', '八十多'], '四十多': ['四十几', '三十多', '二十多', '八十多'], '八十多': ['八十几', '四十多', '一百多', '三十多'],
    '一百多': ['多一百', '八十多', '两百多', '十多'], '两年多': ['两多年', '二多年', '两个多月', '十多年'], '三个多小时': ['三多个小时', '三个小时多', '两个多月', '十分钟'],
    '两个多月': ['两多个月', '两个月多', '两年多', '十多天'], '五块多': ['五多块', '十五块钱', '五块钱', '十点多'], '十点多': ['十多点', '十点了', '两点半', '五块多'],
    '几天': ['十天', '几本', '几次', '每天'], '几本': ['几天', '几次', '两本', '每本'], '几次': ['几天', '几本', '两次', '一次'],
    '十几': ['几十', '二十几', '十多', '几个'], '二十几': ['几十', '十几', '二十多', '两天'], '几十': ['十几', '二十几', '十多', '很多'],
    '冷一点儿': ['一点儿冷', '很冷', '冷多了', '热一点儿'], '大一点儿': ['一点儿大', '大得多', '大三岁', '很大'], '慢一点儿': ['一点儿慢', '慢多了', '慢慢', '很快'],
    '舒服一点儿': ['一点儿舒服', '非常舒服', '舒服多了', '不舒服'], '快多了': ['很快', '快一点儿', '多快', '慢多了'], '大得多': ['很大', '大一点儿', '多大', '大三岁'],
    '大三岁': ['三岁大', '大一点儿', '大得多', '大两岁'], '贵五块钱': ['五块钱贵', '贵二十块钱', '很贵', '贵一点儿'], '贵二十块钱': ['二十块钱贵', '贵五块钱', '贵多了', '很贵'],
    '早十分钟': ['十分钟早', '早一点儿', '很早', '十分钟'], '两次': ['二次', '一次', '几次', '两天'], '两年': ['二年', '两年多', '两个月', '两天'],
    '十分钟': ['一小时', '早十分钟', '十点多', '十天'], '一个小时': ['两个小时', '八个小时', '十分钟', '一次'], '两个小时': ['二个小时', '一个小时', '八个小时', '两天'],
    '八个小时': ['两个小时', '一个小时', '八点', '八天'], '比我跑得': ['跑得比我', '比我跑的', '跑的比我', '比我跑地'], '跑得比我': ['比我跑得', '跑的比我', '比我跑的', '跑地比我'],
    '说得比我': ['比我说得', '说的比我', '说地比我', '说得很好'], '来得比我': ['比我来得', '来的比我', '来地比我', '来得很早'],
    '把': ['被', '给', '让', '向'], '被': ['把', '让', '叫', '给'], '由': ['把', '被', '向', '为'],
    '向': ['往', '从', '对', '为'], '为': ['向', '把', '被', '跟'], '而': ['却', '才', '又', '更'],
    '与': ['和', '跟', '而', '为'], '又': ['再', '才', '却', '更'], '才': ['就', '又', '再', '却'],
    '却': ['才', '又', '更', '而'], '更': ['最', '很', '越', '又'], '先': ['前', '再', '刚', '才'],
    '或': ['和', '与', '而', '但'], '敢': ['能', '会', '要', '肯'], '场': ['次', '遍', '回', '个'],
    '碗': ['盘', '杯', '把', '张'], '盘': ['碗', '杯', '双', '辆'],
    '一边': ['一会儿', '一起', '一直', '一般'], '一会儿': ['一边', '不一会儿', '一下', '一起'],
    '的话': ['的时候', '以后', '以前', '以外'], '为了': ['因为', '关于', '对于', '根据'],
    '或者': ['还是', '而且', '但是', '否则'], '由于': ['因为', '为了', '关于', '根据'],
    '否则': ['然而', '不过', '于是', '因此'], '就是': ['即使', '要是', '而是', '只是'],
    '越来越': ['越……越', '比较', '特别', '差不多'], '大概': ['一定', '几乎', '好像', '恐怕'],
    '然后': ['后来', '于是', '而且', '因此'], '并且': ['而且', '或者', '但是', '不过'],
    '甚至': ['反而', '其实', '终于', '竟然'], '根据': ['关于', '对于', '为了', '按照'],
    '可是': ['但是', '不过', '然而', '所以'], '不一会儿': ['一会儿', '一边', '差不多', '越来越'],
    '看来': ['看起来', '看上去', '原来', '其实'], '看起来': ['看上去', '看来', '好像', '来说'],
    '看上去': ['看起来', '看来', '好像', '来说'], '一般来说': ['总体来说', '对……来说', '总而言之', '其实'],
    '不怎么样': ['怎么样', '不怎么', '还不错', '差不多'], '不怎么': ['不怎么样', '一点儿也不', '不太', '从来不'],
    '一点儿也不': ['有点儿不', '不怎么样', '不怎么', '再也不'], '不比': ['没有', '不如', '比', '更'],
    '要是': ['如果', '即使', '只要', '既然'], '有的是': ['有的', '只有', '都是', '总是'],
    '说不定': ['一定', '大概', '恐怕', '差不多'], '难道': ['居然', '其实', '当然', '究竟'],
    '不如': ['不比', '没有', '比', '好像'], '于是': ['因此', '然后', '否则', '然而'],
    '然而': ['但是', '不过', '可是', '于是'], '不过': ['但是', '然而', '可是', '只是'],
    '而且': ['并且', '或者', '但是', '所以'], '既然': ['如果', '虽然', '因为', '只要'],
    '因此': ['所以', '于是', '然而', '否则'], '首先': ['其次', '然后', '最后', '原来'],
    '其次': ['首先', '然后', '另外', '最后'], '怎样': ['怎么', '怎么样', '为什么', '什么'],
    '怎样的': ['怎么的', '什么样的', '别的', '其他的'], '别人': ['自己', '咱们', '大家', '别的'],
    '咱们': ['我们', '你们', '他们', '别人'], '别的': ['其他', '别人', '另外', '有的'],
    '其他': ['别的', '别人', '另外', '其中'], '如果': ['虽然', '因为', '只要', '只有'],
    '只要': ['只有', '如果', '即使', '既然'], '只有': ['只要', '如果', '不但', '除了'],
    '不但': ['虽然', '因为', '如果', '既然'], '即使': ['如果', '虽然', '只要', '既然'],
    '恐怕': ['大概', '一定', '好像', '几乎'], '对于': ['关于', '根据', '为了', '除了'],
    '关于': ['对于', '根据', '为了', '除了'], '总是': ['经常', '从来', '已经', '终于'],
    '不必': ['不用', '不能', '不要', '不得'], '来得及': ['来不及', '没关系', '差不多', '说不定'],
    '这就是说': ['一般来说', '换句话说', '另一方面', '总的来说'], '再也不': ['一点儿也不', '从来不', '不怎么', '不再'],
    '而是': ['就是', '还是', '可是', '只是'], '另一方面': ['一方面', '首先', '其次', '另外']
  };
  const COMMON_1 = ['的', '了', '在', '不', '没', '都', '也', '很', '吗', '吧', '是', '有', '和', '给'];
  const COMMON_2 = ['没有', '不要', '不是', '可以', '已经', '一起', '因为', '所以', '但是', '虽然'];

  /* ---------- language helpers (supports in-book 5-lang switch + syncs with word library default) ---------- */
  const exLang = () => {
    const g = S().gbLang;
    if (L5.includes(g)) return g;
    try { const m = typeof f5explain === 'function' ? f5explain() : (typeof f5main === 'function' ? f5main() : LANG); return L5.includes(m) ? m : 'th'; }
    catch (e) { return LANG === 'en' ? 'en' : 'th'; }
  };
  const trLang = () => {
    const g = S().gbLang;
    if (g && g !== 'zh' && L5.includes(g)) return g;
    try { const m = typeof f5main === 'function' ? f5main() : LANG; return ['th', 'en', 'vi', 'ja'].includes(m) ? m : 'th'; }
    catch (e) { return LANG === 'en' ? 'en' : 'th'; }
  };
  const pick = (arr, l = exLang()) => { if (!arr) return ''; const i = L5.indexOf(l); return arr[i] || arr[0] || ''; };
  const trOf = (ex, l = trLang()) => ex[{ th: 2, en: 3, vi: 4, ja: 5 }[l] || 2] || ex[2] || '';
  const grpSub = gr => {
    const l = exLang();
    if (l === 'zh') return '';
    if (l === 'th' && LANG !== 'en') return gr[1] || '';
    if (l === 'en' || LANG === 'en') return GROUP_EN[gr[0]] || gr[1] || '';
    return gr[1] || '';
  };
  const srcNote = () => {
    const d = D();
    return exLang() === 'th' && LANG !== 'en'
      ? d.src
      : 'Extracted from the Official HSK 3.0 Exam Syllabus (CLEC, pp. 383–403). Trailing numbers such as 都1 mark distinct senses in the syllabus.';
  };

  /* ---------- lazy grammar packs (data/grammar/hsk*.js) + data & stat helpers ---------- */
  let _packIds = null, _packKey = '';
  function syncPacks() {
    const d = D(); if (!d) return;
    if (!d.lessons) d.lessons = {};
    const P = window.OFFY_GBOOK_PACKS || {};
    for (const lv of Object.keys(P)) {
      if (P[lv] && !P[lv]._merged) {
        Object.assign(d.lessons, P[lv]);
        P[lv]._merged = true;
      }
    }
  }
  window.OFFY_ON_GBOOK_PACK = () => {
    syncPacks();
    if (Book.id === ID && location.hash.startsWith('#/book/')) draw();
  };
  const hasPack = lv => !!(D() && D().packs && D().packs[lv]);
  const packLoaded = lv => {
    syncPacks();
    const d = D(), p = d && d.packs && d.packs[lv];
    if (!p) return true;
    return !!(window.OFFY_GBOOK_PACKS && window.OFFY_GBOOK_PACKS[lv]) || (p.ids && p.ids.length > 0 && !!d.lessons[p.ids[0]]);
  };
  function ensurePack(lv) {
    syncPacks();
    const d = D(), p = d && d.packs && d.packs[lv];
    if (!p || packLoaded(lv)) return Promise.resolve(true);
    if (!packLoading[lv]) {
      packLoading[lv] = Fx.script(p.f).then(() => { syncPacks(); return true; })
        .catch(() => { delete packLoading[lv]; return false; });
    }
    return packLoading[lv];
  }
  function ensureAllPacks() {
    const d = D(), packs = (d && d.packs) || {};
    return Promise.all(Object.keys(packs).map(lv => ensurePack(+lv)));
  }
  function packIdSet() {
    const d = D(); if (!d) return new Set();
    const key = Object.keys(d.packs || {}).join(',') + ':' + Object.keys(d.lessons || {}).length;
    if (_packIds && _packKey === key) return _packIds;
    _packKey = key;
    _packIds = new Set(Object.keys(d.lessons || {}));
    Object.values(d.packs || {}).forEach(p => (p.ids || []).forEach(id => _packIds.add(id)));
    return _packIds;
  }
  const hasLesson = gid => {
    const d = D(); if (!d) return false;
    return !!(d.lessons && d.lessons[gid]) || packIdSet().has(gid);
  };
  const readyLevels = () => {
    const d = D(); if (!d) return [];
    const s = new Set(Object.keys(d.packs || {}).map(Number));
    d.items.forEach(x => { if (d.lessons && d.lessons[x[0]]) s.add(x[1]); });
    return [...s].sort((a, b) => a - b);
  };
  const exCountOf = (lv = 0) => {
    const d = D(); if (!d) return 0;
    const packs = d.packs || {};
    if (lv) {
      if (packs[lv] && packs[lv].ex != null) return packs[lv].ex;
      return d.items.filter(x => x[1] === lv && d.lessons[x[0]]).reduce((a, x) => a + d.lessons[x[0]].ex.length, 0);
    }
    let total = 0;
    const counted = new Set();
    for (const [k, p] of Object.entries(packs)) {
      total += p.ex || 0;
      (p.ids || []).forEach(id => counted.add(id));
    }
    for (const [id, L] of Object.entries(d.lessons || {})) {
      if (!counted.has(id)) total += (L.ex || []).length;
    }
    return total;
  };

  const lvOf = i => D().levels[i - 1];
  const item = gid => D().items.find(x => x[0] === gid);
  const order = (lv = 0) => D().items.filter(x => (!lv || x[1] === lv) && hasLesson(x[0])).map(x => x[0]);
  const stat = gid => (Store.d.gram || {})[gid];
  const isRead = gid => !!(stat(gid) && stat(gid).r);
  const titleOf = gid => { const L = D().lessons[gid]; if (L) return pick(L.t); const it = item(gid); return it ? it[4] : gid; };
  const statTxt = gid => { const s = stat(gid); return s && s.s ? `${T('ฝึกแล้ว')} ${s.s} ${T('ข้อ')} · ${T('ถูก')} ${Math.round(s.c / s.s * 100)}%` : T('ยังไม่ได้ฝึก'); };
  const zh = s => `<span lang="zh-Hans">${esc(s)}</span>`;
  const icn = (n, c = '') => `<svg class="ic ${c}"><use href="#i-${n}"/></svg>`;
  const hideTr = () => !!S().gbHideTr;
  const wordSet = () => {
    if (_wset) return _wset;
    _wset = new Set();
    if (typeof WORDS !== 'undefined' && Array.isArray(WORDS)) WORDS.forEach(w => { if (w && w.zh) _wset.add(w.zh); });
    return _wset;
  };

  /* turn concrete HSK words inside an outline item into tappable dict buttons, keeping meta text plain */
  function outlineText(raw) {
    const ws = wordSet();
    return String(raw || '').split(/([、，,：:·\s]+)/).map(part => {
      if (!part || /^[、，,：:·\s]+$/.test(part)) return esc(part);
      let q = part.replace(/\d+$/, '');
      if (/（[\u4e00-\u9fff]+）/.test(q)) {
        const full = q.replace(/[（）]/g, ''), bare = q.replace(/（[^）]*）/g, '');
        q = ws.has(full) ? full : ws.has(bare) ? bare : '';
      }
      if (q && /^[\u4e00-\u9fff]{1,4}$/.test(q) && ws.has(q)) {
        return `<button type="button" class="b5-q gb-w" data-q="${esc(q)}" title="${esc(T('เปิดในคลังคำศัพท์'))}">${esc(part)}</button>`;
      }
      return esc(part);
    }).join('');
  }

  /* highlight all occurrences of one or multiple markers inside an example sentence */
  function markAll(s, target) {
    const list = Array.isArray(target) ? target.filter(Boolean) : (target ? [target] : []);
    if (!list.length) return esc(s);
    const re = new RegExp(list.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    let out = '', last = 0, m;
    while ((m = re.exec(s))) {
      out += esc(s.slice(last, m.index)) + `<mark>${esc(m[0])}</mark>`;
      last = m.index + m[0].length;
    }
    return out + esc(s.slice(last));
  }

  /* split bullets on " · " only when outside quotes and parentheses */
  function splitBullets(p) {
    const pts = [];
    let cur = '', q1 = false, q2 = false, par = 0;
    for (let i = 0; i < p.length; i++) {
      const ch = p[i];
      const isApos = ch === "'" && i > 0 && /[A-Za-z]/.test(p[i - 1]) && i + 1 < p.length && /[A-Za-z]/.test(p[i + 1]);
      if (ch === "'" && !isApos && !q2) q1 = !q1;
      else if (ch === '"' && !q1) q2 = !q2;
      else if (ch === '‘' || ch === '“' || ch === '(' || ch === '（') par++;
      else if ((ch === '’' || ch === '”' || ch === ')' || ch === '）') && par > 0) par--;
      if (!q1 && !q2 && par === 0 && p.slice(i, i + 3) === ' · ') {
        if (cur.trim()) pts.push(cur.trim());
        cur = '';
        i += 2;
        continue;
      }
      cur += ch;
    }
    if (cur.trim()) pts.push(cur.trim());
    return pts;
  }

  /* format explanation text: split · bullets, parse **bold** / `code` / `g3-x-xxx` refs, and style embedded Chinese */
  function formatWhy(text, l) {
    const inlineRich = s => {
      let h = esc(s)
        .replace(/`(g3-\d-\d{3})`/g, '<button type="button" class="gb-ref-link" data-gjump="$1">$1</button>')
        .replace(/`([^`]+)`/g, '<code class="gb-code-in">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      if (l === 'zh' || l === 'ja') return h;
      // Highlight Chinese spans only in text outside HTML tags
      return h.split(/(<[^>]+>)/g).map(seg => {
        if (!seg || seg[0] === '<') return seg;
        return seg.replace(/([\u4e00-\u9fff]+(?:[，。！？、…（）\s]*[\u4e00-\u9fff…]+)*)/g, '<span class="gb-zh-in" lang="zh-Hans">$1</span>');
      }).join('');
    };
    const paras = String(text || '').split(/\n+/).map(p => p.trim()).filter(Boolean);
    return paras.map(p => {
      const pts = splitBullets(p);
      if (pts.length > 1) return `<ul class="gb-pts">${pts.map(x => `<li>${inlineRich(x)}</li>`).join('')}</ul>`;
      return `<p>${inlineRich(p)}</p>`;
    }).join('');
  }

  /* localize citation source labels across all 5 languages */
  const REF_MAP = [
    ['กลุ่มเทียบคำ', { en: 'Confusable group', zh: '近义词辨析', vi: 'Nhóm từ dễ nhầm', ja: '類義語比較' }],
    ['ประโยคตัวอย่าง', { en: 'Sample sentences', zh: '例句库', vi: 'Câu mẫu', ja: '例文集' }],
    ['คำอธิบายเสริม', { en: 'Grammar notes', zh: '补充说明', vi: 'Ghi chú ngữ pháp', ja: '文法補足' }],
    ['เอกสารอ้างอิง', { en: 'Reference', zh: '参考资料', vi: 'Tài liệu tham khảo', ja: '参考資料' }],
    ['สัญญาข้อมูล', { en: 'Data spec', zh: '数据规范', vi: 'Quy chuẩn dữ liệu', ja: 'データ仕様' }]
  ];
  function refText(ref, el) {
    let s = String(ref || '');
    if (el === 'th' || !s) return s;
    for (const [thKey, tr] of REF_MAP) {
      if (tr[el]) s = s.split(thKey).join(tr[el]);
    }
    return s;
  }

  /* localized gloss under Chinese grammar formulas (hidden when reading in Chinese) */
  function formulaGloss(f, l) {
    if (l === 'zh') return '';
    const idx = { th: 0, en: 1, vi: 2, ja: 3 }[l];
    if (idx == null) return '';
    let changed = false;
    const html = esc(f)
      .replace(/（/g, ' (').replace(/）/g, ')').replace(/、/g, ', ')
      .replace(FORM_RE, m => { changed = true; return `<span class="gb-fg-t">${esc(FORM_GLOSS[m][idx])}</span>`; })
      .replace(/([\u4e00-\u9fff]+)/g, '<b lang="zh-Hans">$1</b>');
    return changed ? `<span class="gb-f-gl" lang="${HL[l]}">${html}</span>` : '';
  }

  /* automatic alternate valid orders for Subj+Time ↔ Time+Subj (plus explicit e[7] if supplied in future data) */
  const SUBJ_TIME_RE = /^(我们|你们|他们|她们|大家|我|你|他|她)(今天|明天|昨天|晚上|早上|上午|下午|中午|现在)(.+)$/;
  const TIME_SUBJ_RE = /^(今天|明天|昨天|晚上|早上|上午|下午|中午|现在)(我们|你们|他们|她们|大家|我|你|他|她)(.+)$/;
  function orderAlts(ex) {
    const body = String(ex[0] || '').trim().replace(/[。！？!?．.]+$/, ''), out = new Set();
    if (Array.isArray(ex[7])) ex[7].forEach(a => out.add(String(a).trim().replace(/[。！？!?．.]+$/, '')));
    let m = SUBJ_TIME_RE.exec(body);
    if (m) out.add(m[2] + m[1] + m[3]);
    else if ((m = TIME_SUBJ_RE.exec(body))) out.add(m[2] + m[1] + m[3]);
    out.delete(body);
    return [...out];
  }

  /* in-book compact 5-language bar */
  function langBar() {
    const cur = exLang();
    return `<div class="gb-langs" role="group" aria-label="${esc(T('ภาษาคำอธิบาย'))}">${L5.map(l =>
      `<button type="button" class="gb-lg${l === cur ? ' on' : ''}" data-glang="${l}" title="${esc(L5_NAME[l])}" aria-pressed="${l === cur}">${L5_SHORT[l]}</button>`).join('')}</div>`;
  }

  /* ---------- level tabs (sticky on level pages) ---------- */
  const tabs = cur => `<nav class="gb-tabs" aria-label="HSK">
    <button class="gb-tab gb-home${cur === 0 ? ' on' : ''}" data-glv="0" aria-label="${esc(T('ภาพรวม'))}">${icn('books')}</button>
    ${D().levels.map((n, k) => `<button class="gb-tab${cur === k + 1 ? ' on' : ''}" data-glv="${k + 1}" style="--c:var(--hsk${k + 1})">${n}</button>`).join('')}
  </nav>`;

  /* ---------- lesson card markup (shared by overview spotlight & level page) ---------- */
  function lessonCard(x, n, showLv = false) {
    const d = D(), L = d.lessons[x[0]], s = stat(x[0]), read = isRead(x[0]), el = exLang();
    return `<button class="gb-card${read ? ' is-read' : ''}" data-gopen="${x[0]}" style="--c:var(--hsk${x[1]});--d:${n * 40}ms">
      <div class="gb-card-top">${showLv ? `<span class="gb-lvpill">HSK ${lvOf(x[1])}</span>` : ''}${read ? `<span class="gb-read-tag">${icn('check')}${T('อ่านแล้ว')}</span>` : ''}</div>
      <b class="gb-card-t" lang="${HL[el]}">${esc(pick(L.t))}</b>
      <code lang="zh-Hans">${esc(L.f[0] || x[4])}</code>
      <span class="gb-card-s${s && s.s ? ' on' : ''}">${esc(statTxt(x[0]))}</span>
    </button>`;
  }

  /* ---------- overview ---------- */
  function overview() {
    syncPacks();
    const d = D(), last = S().gbLast && hasLesson(S().gbLast) ? S().gbLast : null;
    const readyItems = d.items.filter(x => hasLesson(x[0]));
    const readyLvs = readyLevels();
    const nL = readyItems.length, nDone = readyItems.filter(x => { const s = stat(x[0]); return s && (s.s > 0 || s.r); }).length;

    const cards = d.levels.map((name, k) => {
      const i = k + 1, its = d.items.filter(x => x[1] === i), ls = its.filter(x => hasLesson(x[0]));
      const done = ls.filter(x => { const s = stat(x[0]); return s && (s.s > 0 || s.r); }).length;
      const wide = k === d.levels.length - 1 ? ' gb-lv-wide' : '';
      const full = ls.length && ls.length === its.length;
      return `<button class="gb-lv${ls.length ? ' has-ls' : ''}${wide}" data-glv="${i}" style="--c:var(--hsk${i});--d:${k * 40}ms">
        <span class="gb-lv-n">HSK <b>${name}</b></span>
        <span class="gb-lv-m">${its.length} ${T('หัวข้อ')}</span>
        ${ls.length
          ? `<span class="gb-meter" title="${done}/${ls.length}"><i style="width:${done / ls.length * 100}%"></i></span>
             <span class="gb-lv-l on">${T('บทเรียน')} ${full ? `${ls.length}/${its.length}` : ls.length}${done ? ` · ${T('ฝึกแล้ว')} ${done}` : ''}</span>`
          : `<span class="gb-lv-l">${T('สารบัญ')} · ${T('เร็ว ๆ นี้')}</span>`}
      </button>`;
    }).join('');

    const mixBar = nL >= 2 ? `<div class="gb-mix">
      <div class="gb-mix-t">${icn('shuffle')}<div><b>${T('ฝึกทบทวนรวม')}</b><small>${nL} ${T('บท')} · ${exCountOf(0)} ${T('ข้อ')}</small></div></div>
      <div class="gb-mix-a">
        <button class="btn sm primary" data-gmix="0" data-game="order">${icn('g-order')}${T('ฝึกเรียงประโยค')}</button>
        <button class="btn sm" data-gmix="0" data-game="cloze">${icn('g-gap')}${T('ฝึกเติมคำ')}</button>
        <button class="btn sm" data-gmix="0" data-game="judge">${icn('target')}${T('จับผิดประโยค')}</button>
      </div>
    </div>` : '';

    // Pick spotlight level (defaults to last studied level or highest/first ready level) and lazy-load ONLY that pack
    if (!ovSpotLv || !readyLvs.includes(ovSpotLv)) {
      const lastLv = last && item(last) ? item(last)[1] : 0;
      ovSpotLv = (lastLv && readyLvs.includes(lastLv)) ? lastLv : (readyLvs[readyLvs.length - 1] || 1);
    }
    if (last && item(last) && !d.lessons[last]) ensurePack(item(last)[1]);
    const spotPackReady = packLoaded(ovSpotLv);
    if (!spotPackReady) ensurePack(ovSpotLv);

    const isUndone = x => { const s = stat(x[0]); return !s || (!s.s && !s.r); };
    const lvReadyItems = readyItems.filter(x => x[1] === ovSpotLv);
    const spotItems = spotPackReady
      ? [...lvReadyItems.filter(isUndone), ...lvReadyItems.filter(x => !isUndone(x))].filter(x => d.lessons[x[0]]).slice(0, 8)
      : [];

    const spotTabs = readyLvs.length > 1
      ? `<div class="gb-uf gb-spot-tabs" role="tablist">${readyLvs.map(lv => {
          const cnt = readyItems.filter(x => x[1] === lv).length;
          return `<button type="button" class="${ovSpotLv === lv ? 'on' : ''}" style="--c:var(--hsk${lv})" data-gspot="${lv}">HSK ${lvOf(lv)} (${cnt})</button>`;
        }).join('')}</div>`
      : '';
    const seeAllBtn = lvReadyItems.length > 8
      ? `<button type="button" class="gb-seeall" style="--c:var(--hsk${ovSpotLv})" data-glv="${ovSpotLv}">${T('ดูทั้งหมด')} HSK ${lvOf(ovSpotLv)} (${lvReadyItems.length})${icn('chev-r')}</button>`
      : '';

    return `<div class="gb gb-ov">
      <header class="gb-hero">
        <div class="gb-hero-top">
          <h2><span lang="zh-Hans">语法</span> ${T('ไวยากรณ์')} HSK 3.0</h2>
          ${langBar()}
        </div>
        <p>${d.items.length} ${T('หัวข้อทางการ')} · ${T('บทเรียน')} ${nL}${nDone ? ` (${T('ฝึกแล้ว')} ${nDone}/${nL})` : ''} · ${T('เลือกระดับ แตะหัวข้อที่มีบทเรียน อ่านจบแล้วกดฝึกได้ทันที')}</p>
        ${last ? `<button class="gb-cont" data-gopen="${last}">${icn('play')}<span><small>${T('เรียนต่อ')} · HSK ${lvOf(item(last)[1])}</small><b>${esc(titleOf(last))}</b></span>${icn('chev-r', 'gb-chev')}</button>` : ''}
      </header>
      <div class="gb-gsearch-wrap">
        <label class="gb-search gb-gsearch">${icn('search')}<input type="search" id="gbGlobalQ" placeholder="${esc(T('ค้นหาไวยากรณ์ทุกระดับ HSK 1–9'))}" autocomplete="off"><button type="button" class="gb-clr" id="gbGlobalClr" hidden aria-label="${esc(T('ล้างคำค้น'))}">${icn('x')}</button></label>
        <div class="gb-gres" id="gbGlobalRes" hidden></div>
      </div>
      <div class="gb-ov-main" id="gbOvMain">
        <div class="gb-lvs">${cards}</div>
        ${readyItems.length ? `<section class="gb-ready">
          <div class="gb-sh gb-sh-wrap">
            <h3 class="gb-k">${T('บทเรียนแนะนำ')} <small>${spotItems.length} / ${lvReadyItems.length}</small></h3>
            <div class="gb-seeall-row">${spotTabs}${seeAllBtn}</div>
          </div>
          ${spotPackReady
            ? `<div class="gb-cards">${spotItems.map((x, n) => lessonCard(x, n, true)).join('')}</div>`
            : `<p class="muted b5-loading">${T('กำลังโหลดบทเรียน…')}</p>`}
          ${mixBar}
        </section>` : ''}
        <p class="b5-note">${esc(srcNote())}</p>
      </div>
    </div>`;
  }

  /* ---------- one level ---------- */
  function level(i) {
    syncPacks();
    const d = D(), its = d.items.filter(x => x[1] === i);
    if (hasPack(i) && !packLoaded(i)) {
      ensurePack(i);
      return `<div class="gb gb-level" style="--c:var(--hsk${i})">${tabs(i)}
        <header class="gb-lh"><div class="gb-lh-t"><h2>HSK ${lvOf(i)}</h2><p>${its.length} ${T('หัวข้อ')} · ${T('บทเรียน')} ${d.packs[i].n}</p></div>${langBar()}</header>
        <p class="muted b5-loading">${T('กำลังโหลดบทเรียน…')}</p>
      </div>`;
    }
    const ls = its.filter(x => d.lessons[x[0]]);
    const full = ls.length > 0 && ls.length === its.length;
    const compact = ls.length > 12;
    const nDone = ls.filter(x => { const s = stat(x[0]); return s && (s.s > 0 || s.r); }).length;
    const exTotal = exCountOf(i);

    const mixLv = ls.length >= 2 ? `<div class="gb-mix gb-mix-sm">
      <div class="gb-mix-t">${icn('shuffle')}<div><b>${T('ฝึกผสมทุกบท')} · HSK ${lvOf(i)}</b><small>${ls.length} ${T('บท')} · ${exTotal} ${T('ข้อ')}</small></div></div>
      <div class="gb-mix-a">
        <button class="btn sm primary" data-gmix="${i}" data-game="order">${icn('g-order')}${T('ฝึกเรียงประโยค')}</button>
        <button class="btn sm" data-gmix="${i}" data-game="cloze">${icn('g-gap')}${T('ฝึกเติมคำ')}</button>
        <button class="btn sm" data-gmix="${i}" data-game="judge">${icn('target')}${T('จับผิดประโยค')}</button>
      </div>
    </div>` : '';

    // For <= 12 lessons, keep the top card spotlight; for > 12 (e.g. HSK 1-4 full levels), enrich the categorized outline directly
    const ready = !compact && ls.length ? `<section class="gb-ready" id="gbReady"><h3 class="gb-k">${T('บทเรียนพร้อมเรียน')} <small>${ls.length}</small></h3><div class="gb-cards">${ls.map((x, n) => {
      const L = d.lessons[x[0]], gr = d.groups[x[2]];
      const s = [x[0], x[3], x[4], gr[0], gr[1], GROUP_EN[gr[0]] || '', L.t.join(' '), L.f.join(' ')].join(' ').toLowerCase();
      return lessonCard(x, n, false).replace('<button ', `<button data-s="${esc(s)}" `);
    }).join('')}</div>${mixLv}</section>` : mixLv;

    const filterPills = compact ? `<div class="gb-uf gb-lf" role="tablist">
      <button type="button" class="${lvFilter === 'all' ? 'on' : ''}" data-glf="all">${T('ทั้งหมด')} (${ls.length})</button>
      <button type="button" class="${lvFilter === 'todo' ? 'on' : ''}" data-glf="todo">${T('ยังไม่เรียน')} (${ls.length - nDone})</button>
      <button type="button" class="${lvFilter === 'done' ? 'on' : ''}" data-glf="done">${T('อ่านแล้ว')} (${nDone})</button>
    </div>` : '';
    const togAllBtn = `<button type="button" class="gb-togall" id="gbTogAll" data-gtogall="1">${T('ยุบทั้งหมด')}</button>`;

    let body = '', g = -1;
    const el = exLang();
    for (const x of its) {
      const gr = d.groups[x[2]];
      if (x[2] !== g) {
        if (g >= 0) body += '</div></details>';
        g = x[2];
        const n = its.filter(y => y[2] === g).length, sub = grpSub(gr);
        body += `<details class="gb-grp" open><summary><span lang="zh-Hans">${esc(gr[0])}</span>${sub ? `<small>${esc(sub)}</small>` : ''}<i>${n}</i></summary><div class="gb-rows${n === 1 ? ' one' : ''}">`;
      }
      const L = d.lessons[x[0]];
      const s = [x[0], x[3], x[4], gr[0], gr[1], GROUP_EN[gr[0]] || '', L ? L.t.join(' ') : '', L ? L.f.join(' ') : ''].join(' ').toLowerCase();
      if (L) {
        const st = stat(x[0]), read = isRead(x[0]), done = !!(st && (st.s > 0 || st.r));
        const stPill = st && st.s ? `<span class="gb-row-st on">${T('ถูก')} ${Math.round(st.c / st.s * 100)}%</span>` : '';
        const rdPill = read ? `<span class="gb-read-tag">${icn('check')}${T('อ่านแล้ว')}</span>` : '';
        const fPrev = compact && L.f && L.f[0] ? `<code class="gb-row-f" lang="zh-Hans">${esc(L.f[0])}</code>` : '';
        body += `<button class="gb-row has${done ? ' is-done' : ''}" id="${x[0]}" data-gopen="${x[0]}" data-s="${esc(s)}" data-done="${done ? '1' : '0'}"><span class="gb-row-t"><span class="gb-row-h"><b lang="${HL[el]}">${esc(pick(L.t, el))}</b>${rdPill}${stPill}</span>${fPrev}<span class="gb-row-sub">${zh(x[4])}<i>${x[0]}</i></span></span>${icn('chev-r', 'gb-chev')}</button>`;
      } else {
        body += `<div class="gb-row" id="${x[0]}" data-s="${esc(s)}" data-done="0">${x[3] ? `<b class="b5-gt" lang="zh-Hans">${esc(x[3])}</b>` : ''}<span class="gb-row-zh" lang="zh-Hans">${outlineText(x[4])}</span><i>${x[0]}</i></div>`;
      }
    }
    if (g >= 0) body += '</div></details>';

    return `<div class="gb gb-level" style="--c:var(--hsk${i})">${tabs(i)}
      <header class="gb-lh">
        <div class="gb-lh-t"><h2>HSK ${lvOf(i)}</h2><p>${its.length} ${T('หัวข้อ')} · ${T('บทเรียน')} ${ls.length}${nDone ? ` (${T('ฝึกแล้ว')} ${nDone})` : ''}</p>${full ? `<span class="gb-full-badge">${icn('check')}${T('ครบทุกหัวข้อ')}</span>` : ''}</div>
        ${langBar()}
      </header>
      <div class="gb-all-h">
        <label class="gb-search">${icn('search')}<input type="search" id="gbQ" placeholder="${esc(T('ค้นหาหัวข้อ คำ หรือรหัส'))}" autocomplete="off"><button type="button" class="gb-clr" id="gbClr" hidden aria-label="${esc(T('ล้างคำค้น'))}">${icn('x')}</button></label>
        ${filterPills}
        ${togAllBtn}
        <span class="gb-qcnt" id="gbQCnt" hidden></span>
      </div>
      ${ready}
      <section class="gb-all"><h3 class="gb-k">${T('หัวข้อทั้งหมดในระดับนี้')} <small>${its.length}</small></h3>
        <div class="gb-outline">${body}</div><p class="gb-none muted" hidden>${T('ไม่พบหัวข้อที่ค้นหา')}</p></section>
    </div>`;
  }

  /* ---------- one lesson ---------- */
  function lesson(gid) {
    syncPacks();
    const d = D(), it = item(gid), i = it[1], gr = d.groups[it[2]], ids = order(), k = ids.indexOf(gid);
    const L = d.lessons[gid];
    if (!L) {
      ensurePack(i);
      return `<div class="gb gb-read" style="--c:var(--hsk${i})">
        <div class="gb-crumb"><button class="gb-back" data-gback>${icn('chev-l')}HSK ${lvOf(i)}</button></div>
        <p class="muted b5-loading">${T('กำลังโหลดบทเรียน…')}</p>
      </div>`;
    }
    const lvIds = order(i), lvK = lvIds.indexOf(gid);
    const prev = ids[k - 1], next = ids[k + 1], el = exLang(), tl = trLang(), sub = grpSub(gr), read = isRead(gid), s = stat(gid);
    const pyOn = S().showPinyin !== false;

    const ex = L.ex.map((e, n) => `<li style="--d:${n * 45}ms"><div class="gx-zh"><span lang="zh-Hans">${markAll(e[0], e[6])}</span>
        <button class="gx-say" data-say="${esc(e[0])}" aria-label="${esc(T('ฟังเสียง'))}">${icn('vol')}</button></div>
        <div class="pyx">${esc(e[1])}</div><div class="gb-tr" lang="${HL[tl]}">${esc(trOf(e, tl))}</div></li>`).join('');

    const useList = L.use || [];
    const dos = useList.filter(u => u.ok), donts = useList.filter(u => !u.ok);
    const UL = {
      ok: ['ทำได้', 'Can do', '可以这样用', 'Dùng được', 'OK'],
      no: ['ทำไม่ได้', 'Avoid', '不能这样用', 'Tránh dùng', 'NG'],
      whyOk: ['ทำได้เพราะอะไร', 'Why it works', '为什么可以', 'Vì sao đúng', 'できる理由'],
      whyNo: ['ทำไม่ได้เพราะอะไร', 'Why not', '为什么不行', 'Vì sao sai', 'ダメな理由'],
      ref: ['อ้างอิง', 'Ref', '参考', 'Tham khảo', '出典']
    };
    const ul = k => pick(UL[k], el);
    const useCard = (u, n) => {
      const sayZh = u.ok ? u.zh : u.fix;
      const trIdx = { th: 0, en: 1, vi: 2, ja: 3 }[tl] || 0;
      const trTxt = (u.tr && (u.tr[trIdx] || u.tr[0])) || '';
      const sentHtml = u.ok
        ? `<div class="gb-u-zh"><b lang="zh-Hans">${esc(u.zh)}</b><button class="gx-say sm" data-say="${esc(sayZh)}" aria-label="${esc(T('ฟังเสียง'))}">${icn('vol')}</button></div>`
        : `<div class="gb-u-zh"><s lang="zh-Hans">${esc(u.zh)}</s>${icn('chev-r', 'gb-arr')}<b lang="zh-Hans">${esc(u.fix)}</b><button class="gx-say sm" data-say="${esc(sayZh)}" aria-label="${esc(T('ฟังเสียง'))}">${icn('vol')}</button></div>`;
      return `<article class="gb-u-card ${u.ok ? 'ok' : 'no'}" style="--d:${n * 35}ms">
        <div class="gb-u-head"><span class="gb-u-tag ${u.ok ? 'ok' : 'no'}">${icn(u.ok ? 'check' : 'x')}${u.ok ? ul('ok') : ul('no')}</span><h4 lang="${HL[el]}">${esc(pick(u.h, el))}</h4></div>
        <div class="gb-u-ex">${sentHtml}${u.py ? `<div class="pyx">${esc(u.py)}</div>` : ''}${trTxt ? `<div class="gb-u-tr" lang="${HL[tl]}">${esc(trTxt)}</div>` : ''}</div>
        <div class="gb-u-why" lang="${HL[el]}"><span class="gb-u-wk">${u.ok ? ul('whyOk') : ul('whyNo')}:</span> ${formatWhy(pick(u.w, el), el).replace(/^<p>|<\/p>$/g, '')}</div>
        ${u.ref ? `<div class="gb-u-ref">${ul('ref')}: ${esc(refText(u.ref, el))}</div>` : ''}
      </article>`;
    };
    const useSec = useList.length ? `<section class="gb-use-sec" data-ufilter="all">
      <div class="gb-sh gb-sh-wrap">
        <h3 class="gb-k">${T('วิธีใช้ & ข้อควรระวัง')} <small>✓ ${dos.length} · ✗ ${donts.length}</small></h3>
        <div class="gb-uf" role="tablist">
          <button type="button" class="on" data-guf="all">${T('ทั้งหมด')}</button>
          <button type="button" data-guf="ok">✓ ${ul('ok')} (${dos.length})</button>
          <button type="button" data-guf="no">✗ ${ul('no')} (${donts.length})</button>
        </div>
      </div>
      <div class="gb-use-grid">
        <div class="gb-use-col col-ok">
          <div class="gb-use-ch ok">${icn('check')}<span>${ul('ok')} · ${ul('whyOk')}</span></div>
          <div class="gb-use-list">${dos.map((u, n) => useCard(u, n)).join('')}</div>
        </div>
        <div class="gb-use-col col-no">
          <div class="gb-use-ch no">${icn('x')}<span>${ul('no')} · ${ul('whyNo')}</span></div>
          <div class="gb-use-list">${donts.map((u, n) => useCard(u, n)).join('')}</div>
        </div>
      </div>
    </section>` : '';

    const shownWrongs = new Set(donts.map(u => u.zh));
    const extraErrs = (L.err || []).filter(x => !shownWrongs.has(x[0]));
    const err = extraErrs.map(x => `<li><p><s lang="zh-Hans">${esc(x[0])}</s>${icn('chev-r', 'gb-arr')}<b lang="zh-Hans">${esc(x[1])}</b><button class="gx-say sm" data-say="${esc(x[1])}" aria-label="${esc(T('ฟังเสียง'))}">${icn('vol')}</button></p><div class="gb-err-note" lang="${HL[el]}">${formatWhy(pick(x.slice(2), el), el)}</div></li>`).join('');

    const rel = L.rel.map(r => {
      const rit = item(r), has = hasLesson(r), lvTag = rit ? `HSK ${lvOf(rit[1])}` : '';
      return has
        ? `<button class="gb-chip has" data-gopen="${r}">${rit && rit[1] !== i ? `<small class="gb-chip-lv">${lvTag}</small>` : ''}${esc(titleOf(r))}${icn('chev-r', 'gb-chip-ic')}</button>`
        : `<button class="gb-chip" data-gfind="${r}" title="${esc(T('ดูในสารบัญ'))} ${lvTag}"><small class="gb-chip-lv">${lvTag}</small>${zh(titleOf(r))}</button>`;
    }).join('');

    const nextIt = next ? item(next) : null;
    const nextCrossLv = nextIt && nextIt[1] !== i ? ` · HSK ${lvOf(nextIt[1])}` : '';

    return `<div class="gb gb-read" style="--c:var(--hsk${i})">
      <div class="gb-crumb">
        <button class="gb-back" data-gback>${icn('chev-l')}HSK ${lvOf(i)}</button>
        <span class="gb-pos">HSK ${lvOf(i)} · ${lvK + 1} / ${lvIds.length}</span>
        <span class="gb-tools">
          <button type="button" class="gb-tbtn${pyOn ? '' : ' off'}" data-gpy aria-label="${esc(T('แสดง/ซ่อนพินอิน'))}" title="${esc(T('แสดง/ซ่อนพินอิน'))}">${icn(pyOn ? 'eye' : 'eye-off')}</button>
          <span class="gb-step"><button data-gstep="-1" ${prev ? '' : 'disabled'} aria-label="${esc(T('บทก่อนหน้า'))}">${icn('chev-l')}</button><button data-gstep="1" ${next ? '' : 'disabled'} aria-label="${esc(T('บทถัดไป'))}">${icn('chev-r')}</button></span>
        </span>
      </div>
      <header class="gb-h">
        <div class="gb-h-top"><p class="gb-eye"><span class="gb-lvpill">HSK ${lvOf(i)}</span><span lang="zh-Hans">${esc(gr[0])}</span>${sub ? `<span>${esc(sub)}</span>` : ''}</p>${langBar()}</div>
        <h2 lang="${HL[el]}">${esc(pick(L.t, el))}</h2>
        <p class="gb-src">${zh(it[4])}<i>${gid}</i></p>
        <div class="gb-meta">
          <span class="gb-stat-pill${s && s.s ? ' on' : ''}">${esc(statTxt(gid))}</span>
          <button type="button" class="gb-read-btn${read ? ' on' : ''}" data-gread="${gid}" aria-pressed="${read}">${icn('check')}<span>${read ? T('อ่านแล้ว') : T('ทำเครื่องหมายว่าอ่านแล้ว')}</span></button>
        </div>
      </header>
      ${L.f.length ? `<div class="gb-f">${L.f.map(f => { const gl = formulaGloss(f, el); return `<div class="gb-f-item"><code lang="zh-Hans">${esc(f)}</code>${gl}</div>`; }).join('')}</div>` : ''}
      <div class="gb-why" lang="${HL[el]}">${formatWhy(pick(L.why, el), el)}</div>
      <section>
        <div class="gb-sh"><h3 class="gb-k">${T('ตัวอย่าง')} <small>${L.ex.length}</small></h3><label class="gb-tog"><input type="checkbox" data-ghide ${hideTr() ? 'checked' : ''}><span>${T('ซ่อนคำแปล')}</span></label></div>
        <p class="gb-hid-tip" ${hideTr() ? '' : 'hidden'}>${T('แตะเพื่อดูคำแปล')}</p>
        <ol class="gx-ex${hideTr() ? ' gb-hid' : ''}">${ex}</ol>
      </section>
      ${useSec}
      ${err ? `<section><div class="gb-sh"><h3 class="gb-k">${T('จุดที่มักพลาด')}</h3></div><ul class="gb-err">${err}</ul></section>` : ''}
      ${rel ? `<section><h3 class="gb-k">${T('เรียนคู่กับ')}</h3><div class="gb-chips">${rel}</div></section>` : ''}
      ${next ? `<button class="gb-next" data-gopen="${next}"><span class="gb-next-t"><small>${T('บทถัดไป')}${nextCrossLv}</small><b lang="${HL[el]}">${esc(titleOf(next))}</b></span>${icn('chev-r', 'gb-chev')}</button>` : ''}
      <div class="gb-dock">
        <span class="gb-dock-s">${esc(statTxt(gid))}</span>
        <div class="gb-dock-btns">
          <button class="btn primary" data-gpractice="${gid}" data-game="order">${icn('g-order')}<span class="gb-lbl-lg">${T('ฝึกเรียงประโยค')}</span><span class="gb-lbl-sm">${T('เรียงประโยค')}</span><span class="gb-n"> · ${L.ex.length}</span></button>
          <button class="btn" data-gpractice="${gid}" data-game="cloze">${icn('g-gap')}<span class="gb-lbl-lg">${T('ฝึกเติมคำ')}</span><span class="gb-lbl-sm">${T('เติมคำ')}</span></button>
          ${L.err && L.err.length ? `<button class="btn" data-gpractice="${gid}" data-game="judge">${icn('target')}<span class="gb-lbl-lg">${T('จับผิดประโยค')}</span><span class="gb-lbl-sm">${T('จับผิด')}</span></button>` : ''}
        </div>
      </div>
    </div>`;
  }

  /* ---------- render & search ---------- */
  function draw() {
    syncPacks();
    const d = D(), body = $('#bkBody');
    if (open && !hasLesson(open)) open = null;
    if (open) { const lv = item(open)[1]; Book.i = Book.pos[ID] = lv; S().gbLast = open; try { Store.save(); } catch (e) { } }
    const key = open ? 'L:' + open : 'V:' + Book.i;
    const screenChanged = key !== lastKey;
    lastKey = key;

    body.innerHTML = open ? lesson(open) : Book.i ? level(Book.i) : overview();
    $('#bkVol').textContent = open ? `${BOOK_META[ID].vol} · HSK ${lvOf(Book.i)} · ${open}` : Book.i ? `${BOOK_META[ID].vol} · HSK ${lvOf(Book.i)}` : BOOK_META[ID].vol;
    $('#bkToc').hidden = !open && !Book.i;

    const q = $('#gbQ'), clr = $('#gbClr');
    if (q) {
      q.addEventListener('input', () => { filterLevel(q.value); if (clr) clr.hidden = !q.value; });
      if (clr) clr.onclick = () => { q.value = ''; clr.hidden = true; filterLevel(''); q.focus(); };
      if (lvFilter !== 'all') filterLevel(q.value);
    }
    const gq = $('#gbGlobalQ'), gclr = $('#gbGlobalClr');
    if (gq) {
      gq.addEventListener('input', () => { filterGlobal(gq.value); if (gclr) gclr.hidden = !gq.value; });
      if (gclr) gclr.onclick = () => { gq.value = ''; gclr.hidden = true; filterGlobal(''); gq.focus(); };
    }

    const t = $('.gb-tab.on', body);
    if (t) { const nv = t.parentNode; nv.scrollLeft = t.offsetLeft - (nv.clientWidth - t.offsetWidth) / 2; }
    if (flashId) {
      const id = flashId; flashId = null;
      setTimeout(() => {
        const el = document.getElementById(id); if (!el) return;
        const det = el.closest('details'); if (det) det.open = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('gb-flash'); setTimeout(() => el.classList.remove('gb-flash'), 1600);
      }, 220);
    } else if (screenChanged) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function filterLevel(v) {
    const q = (v || '').trim().toLowerCase(), body = $('#bkBody'), f = lvFilter;
    let hits = 0, readyHits = 0;
    const rd = $('#gbReady', body);
    if (rd) {
      $$('.gb-card', rd).forEach(c => { const hit = !q || (c.dataset.s || '').includes(q); c.hidden = !hit; if (hit) readyHits++; });
      const mix = $('.gb-mix', rd); if (mix) mix.hidden = !!q;
      rd.hidden = !!q && !readyHits;
    }
    $$('.gb-grp', body).forEach(g => {
      let n = 0;
      $$('.gb-row', g).forEach(r => {
        const mQ = !q || (r.dataset.s || '').includes(q);
        const mF = f === 'all' || (f === 'done' ? r.dataset.done === '1' : r.dataset.done !== '1');
        const hit = mQ && mF;
        r.hidden = !hit; if (hit) n++;
      });
      g.hidden = !n; if ((q || f !== 'all') && n) g.open = true;
      const rowsBox = $('.gb-rows', g); if (rowsBox) rowsBox.classList.toggle('one', n === 1);
      hits += n;
    });
    const none = $('.gb-none', body); if (none) none.hidden = hits > 0;
    const cnt = $('#gbQCnt', body);
    if (cnt) { const on = !!q || f !== 'all'; cnt.hidden = !on; cnt.textContent = on ? `${T('พบ')} ${hits} ${T('หัวข้อ')}` : ''; }
  }

  let _gSearchLoaded = false;
  function filterGlobal(v) {
    syncPacks();
    const q = v.trim().toLowerCase(), body = $('#bkBody'), res = $('#gbGlobalRes', body), main = $('#gbOvMain', body);
    if (!res || !main) return;
    if (!q) { res.hidden = true; res.innerHTML = ''; main.hidden = false; return; }
    main.hidden = true; res.hidden = false;
    const d = D(), el = exLang(), lessons = [], rows = [];
    if (!_gSearchLoaded && Object.keys(d.packs || {}).some(lv => !packLoaded(+lv))) {
      _gSearchLoaded = true;
      ensureAllPacks().then(() => { const gq = $('#gbGlobalQ'); if (gq && gq.value.trim()) filterGlobal(gq.value); });
    }
    for (const x of d.items) {
      const L = d.lessons[x[0]], gr = d.groups[x[2]];
      const hay = [x[0], 'hsk ' + lvOf(x[1]), x[3], x[4], gr[0], gr[1], GROUP_EN[gr[0]] || '', L ? L.t.join(' ') : '', L ? L.f.join(' ') : ''].join(' ').toLowerCase();
      if (!hay.includes(q)) continue;
      if (hasLesson(x[0])) lessons.push(x); else rows.push(x);
    }
    const total = lessons.length + rows.length;
    if (!total) { res.innerHTML = `<p class="gb-none muted">${T('ไม่พบหัวข้อที่ค้นหา')}</p>`; return; }
    const lHtml = lessons.map(x => `<button class="gb-row has" style="--c:var(--hsk${x[1]})" data-gopen="${x[0]}"><span class="gb-lvpill">HSK ${lvOf(x[1])}</span><span class="gb-row-t"><b lang="${HL[el]}">${esc(titleOf(x[0]))}</b>${zh(x[4])}</span>${icn('chev-r', 'gb-chev')}</button>`).join('');
    const rHtml = rows.slice(0, 80).map(x => `<div class="gb-row gb-row-g" style="--c:var(--hsk${x[1]})"><button type="button" class="gb-lvpill gb-lvjump" data-gfind="${x[0]}" title="${esc(T('ดูในสารบัญ'))}">HSK ${lvOf(x[1])}</button>${x[3] ? `<b class="b5-gt" lang="zh-Hans">${esc(x[3])}</b>` : ''}<span class="gb-row-zh" lang="zh-Hans">${outlineText(x[4])}</span><i>${x[0]}</i></div>`).join('');
    res.innerHTML = `<p class="gb-gcnt">${T('พบ')} ${total} ${T('หัวข้อ')}${rows.length > 80 ? ' (80+)' : ''}</p><div class="gb-rows gb-grows">${lHtml}${rHtml}</div>`;
  }

  /* ---------- practice builders (single lesson OR mixed across level / all lessons) ---------- */
  function buildDistractors(blank, allBlanks, exZh, custom) {
    const len = Array.from(blank).length;
    const sameLenCommon = len >= 2 ? COMMON_2 : COMMON_1;
    const raw = [].concat(
      Array.isArray(custom) ? custom : [],
      CONFUSE[blank] || [],
      allBlanks.filter(b => b !== blank),
      shuffle(sameLenCommon.filter(c => c !== blank)),
      shuffle(COMMON_1.filter(c => c !== blank))
    );
    const out = [];
    for (const cand of raw) {
      if (out.length >= 3) break;
      if (!cand || cand === blank || out.includes(cand)) continue;
      if (exZh.includes(cand) && len > 1 && cand.length === 1) continue;
      out.push(cand);
    }
    return out;
  }

  function makeItems(gids, game) {
    const d = D(), el = exLang(), tl = trLang();
    if (game === 'judge') {
      const items = [];
      for (const gid of gids) {
        const L = d.lessons[gid], it = item(gid); if (!L || !it) continue;
        const lvl = it[1], title = pick(L.t, el), seenW = new Set();
        let wrongCnt = 0;
        (L.err || []).forEach((er, i) => {
          seenW.add(er[0]); wrongCnt++;
          items.push({
            id: `G:${gid}:e${i}`, zh: er[0], py: '', lvl, th: title, en: L.t[1] || title, pos: '', _pk: 'g',
            ex_zh: er[1], _wrong: er[0], _right: er[1], _ok: false, _note: pick(er.slice(2), el), _noteLang: HL[el], _lesson: title
          });
        });
        (L.use || []).forEach((u, ui) => {
          if (u.ok || !u.fix || seenW.has(u.zh)) return;
          seenW.add(u.zh); wrongCnt++;
          items.push({
            id: `G:${gid}:u${ui}`, zh: u.zh, py: '', lvl, th: title, en: L.t[1] || title, pos: '', _pk: 'g',
            ex_zh: u.fix, ex_py: u.py || '', _wrong: u.zh, _right: u.fix, _ok: false, _note: pick(u.w, el), _noteLang: HL[el], _lesson: title
          });
        });
        const takeEx = shuffle([...L.ex.keys()]).slice(0, Math.max(2, wrongCnt));
        takeEx.forEach(i => {
          const e = L.ex[i];
          items.push({
            id: `G:${gid}:${i}`, zh: e[0], py: e[1], lvl, th: title, en: L.t[1] || title, pos: '', _pk: 'g',
            ex_zh: e[0], ex_py: e[1], ex_th: e[2], ex_en: e[3], _tr: trOf(e, tl), _trLang: HL[tl],
            _right: e[0], _ok: true, _note: trOf(e, tl), _noteLang: HL[tl], _lesson: title
          });
        });
      }
      return items;
    }

    const items = [];
    for (const gid of gids) {
      const L = d.lessons[gid], it = item(gid); if (!L || !it) continue;
      const lvl = it[1], title = pick(L.t, el);
      const blanks = [...new Set(L.ex.map(e => Array.isArray(e[6]) ? e[6][0] : e[6]).filter(Boolean))];
      L.ex.forEach((e, i) => {
        const blank = Array.isArray(e[6]) ? e[6][0] : e[6];
        items.push({
          id: `G:${gid}:${i}`, zh: blank, py: '', lvl, th: title, en: L.t[1] || title, pos: '', _pk: 'g', _len: Array.from(blank).length,
          ex_zh: e[0], ex_py: e[1], ex_th: e[2], ex_en: e[3], _tr: trOf(e, tl), _trLang: HL[tl],
          _alts: orderAlts(e),
          _opts: buildDistractors(blank, blanks, e[0], e[8])
        });
      });
    }
    return items;
  }

  function practice(gid, game) {
    const it = item(gid); if (!it) return;
    ensurePack(it[1]).then(() => {
      const L = D().lessons[gid]; if (!L) return;
      const words = makeItems([gid], game);
      playGame(game, { words, title: pick(L.t), kind: 'grammar', back: '/book/grammar/' + gid });
    });
  }

  function practiceMix(lv, game) {
    const wait = lv ? ensurePack(lv) : ensureAllPacks();
    wait.then(() => {
      const gids = order(lv); if (!gids.length) return;
      const words = shuffle(makeItems(gids, game)).slice(0, 12);
      const title = lv ? `${T('ไวยากรณ์')} HSK ${lvOf(lv)}` : `${T('ไวยากรณ์')} HSK 3.0`;
      playGame(game, { words, title, kind: 'grammar', back: '/book/grammar' });
    });
  }

  const openLesson = (gid, swap) => (swap ? Router.replace : Router.go).call(Router, '/book/grammar/' + gid);
  const toList = () => { open = null; Router.up('/book/grammar'); };

  /* ---------- hooks into the generic book reader ---------- */
  const show0 = Book.show, render0 = Book.render, go0 = Book.go, key0 = Book.key;
  Book.show = function (id) {
    if (id === ID) { open = Router.parse(location.hash).args[1] || null; if (open && D() && item(open)) this.pos[ID] = item(open)[1]; }
    else lastKey = null;
    return show0.apply(this, arguments);
  };
  Book.render = function () {
    const r = render0.apply(this, arguments), on = this.id === ID && !!D() && !!D().items;
    $('#v-book').classList.toggle('gb-on', on);
    if (on) draw();
    return r;
  };
  Book.go = function (i) {
    if (this.id !== ID || !D() || !D().items) return go0.apply(this, arguments);
    if (open) { const ids = order(), k = ids.indexOf(open), to = ids[k + Math.sign(i - this.i)]; if (to) { sfx('flip'); openLesson(to, true); } return; }
    if (i === this.i) return;
    return go0.apply(this, arguments);
  };
  Book.key = function (e) { if (this.id === ID && open && e.key === 'Escape') { toList(); return; } return key0.apply(this, arguments); };

  /* smart header buttons: top-left back steps up one level (lesson → HSK level → overview → bookshelf) */
  document.addEventListener('click', e => {
    if (Book.id !== ID || !D() || !D().items) return;
    if (e.target.closest('#bkToc')) {
      e.stopImmediatePropagation();
      if (open) toList(); else if (Book.i) Book.go(0);
      return;
    }
    if (e.target.closest('#v-book .back-btn')) {
      if (open) { e.preventDefault(); e.stopImmediatePropagation(); sfx('tap'); toList(); }
      else if (Book.i > 0) { e.preventDefault(); e.stopImmediatePropagation(); sfx('tap'); Book.go(0); }
    }
  }, true);

  $('#bkBody').addEventListener('click', e => {
    if (Book.id !== ID || !D() || !D().items) return;
    const t = e.target.closest('[data-glv],[data-gopen],[data-gfind],[data-gjump],[data-gspot],[data-gtogall],[data-gback],[data-gstep],[data-gpractice],[data-gmix],[data-ghide],[data-glang],[data-gpy],[data-gread],[data-guf],[data-glf]');
    if (!t) return;
    const ds = t.dataset;
    if (ds.gspot) {
      sfx('tap');
      ovSpotLv = +ds.gspot;
      draw();
      return;
    }
    if (ds.gtogall) {
      sfx('tap');
      const grps = $$('.gb-grp:not([hidden])', $('#bkBody'));
      const collapse = grps.some(g => g.open);
      grps.forEach(g => { g.open = !collapse; });
      t.textContent = collapse ? T('ขยายทั้งหมด') : T('ยุบทั้งหมด');
      return;
    }
    if (ds.gjump) {
      sfx('tap');
      if (hasLesson(ds.gjump)) openLesson(ds.gjump, !!open);
      else {
        const it = item(ds.gjump); if (!it) return;
        flashId = ds.gjump;
        if (open) { Book.pos[ID] = it[1]; toList(); }
        else if (Book.i !== it[1]) Book.go(it[1]);
        else draw();
      }
      return;
    }
    if (ds.glf) {
      sfx('tap');
      lvFilter = ds.glf;
      $$('[data-glf]', $('#bkBody')).forEach(b => b.classList.toggle('on', b === t));
      const q = $('#gbQ'); filterLevel(q ? q.value : '');
      return;
    }
    if (ds.guf) {
      sfx('tap');
      const sec = t.closest('.gb-use-sec');
      if (sec) {
        sec.dataset.ufilter = ds.guf;
        $$('[data-guf]', sec).forEach(b => b.classList.toggle('on', b === t));
      }
      return;
    }
    if (ds.glv != null) { const i = +ds.glv; lvFilter = 'all'; sfx('tap'); if (open) { Book.pos[ID] = i; toList(); } else Book.go(i); }
    else if (ds.gopen) { sfx('tap'); openLesson(ds.gopen, !!open); }
    else if (ds.gfind) {
      const it = item(ds.gfind); if (!it) return;
      sfx('tap'); flashId = ds.gfind;
      if (open) { Book.pos[ID] = it[1]; toList(); }
      else if (Book.i !== it[1]) Book.go(it[1]);
      else draw();
    }
    else if (ds.gback != null) { sfx('tap'); toList(); }
    else if (ds.gstep) Book.go(Book.i + +ds.gstep);
    else if (ds.gpractice) practice(ds.gpractice, ds.game);
    else if (ds.gmix != null) practiceMix(+ds.gmix, ds.game);
    else if (ds.glang) {
      if (L5.includes(ds.glang)) { sfx('tap'); S().gbLang = ds.glang; try { Store.save(); } catch (err) { } draw(); }
    }
    else if (ds.gpy != null) {
      if (typeof togglePinyin === 'function') togglePinyin();
      const on = S().showPinyin !== false;
      t.classList.toggle('off', !on);
      const u = t.querySelector('use'); if (u) u.setAttribute('href', on ? '#i-eye' : '#i-eye-off');
    }
    else if (ds.gread) {
      const g = ds.gread, map = Store.d.gram || (Store.d.gram = {}), cur = map[g] || (map[g] = { s: 0, c: 0, w: 0, t: 0 });
      cur.r = cur.r ? 0 : 1; cur.t = Date.now();
      sfx(cur.r ? 'on' : 'off'); try { Store.save(); } catch (err) { } draw();
    }
    else if (ds.ghide != null) {
      S().gbHideTr = t.checked; try { Store.save(); } catch (err) { }
      const ex = $('.gx-ex', $('#bkBody')); if (ex) ex.classList.toggle('gb-hid', t.checked);
      const tip = $('.gb-hid-tip', $('#bkBody')); if (tip) tip.hidden = !t.checked;
    }
  });

  // a hidden translation shows when its example is tapped
  $('#bkBody').addEventListener('click', e => {
    const li = Book.id === ID && e.target.closest('.gb-hid > li');
    if (li && !e.target.closest('[data-say]')) li.classList.toggle('show');
  });
})();
