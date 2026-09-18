// ============================================================
//  LINGUISTIC MASTERCLASS DATA — ARUKAS 2.0
//  Comprehensive writing system guides, phonetics, rules & mnemonics
// ============================================================

import { LanguageCode } from '../types';

export interface LinguisticMasterclass {
  originAndHistory: string;
  structuralRules: string[];
  phoneticTips: string[];
  learnerMistakesAndMnemonics: string[];
}

export const LINGUISTIC_MASTERCLASS_DATA: Record<LanguageCode, LinguisticMasterclass> = {
  // ──────────────────────────────────────────────────────────
  //  1. VIỆT NAM (vi)
  // ──────────────────────────────────────────────────────────
  vi: {
    originAndHistory:
      'Chữ Quốc ngữ bắt đầu hình thành vào đầu thế kỷ 17 (khoảng 1615–1651) do các giáo sĩ Dòng Tên Bồ Đào Nha, Ý và Pháp (đặc biệt là Alexandre de Rhodes với cuốn Từ điển Việt-Bồ-La năm 1651) xây dựng dựa trên mẫu tự Latinh để ghi lại ngữ âm tiếng Việt. Đến đầu thế kỷ 20, dưới sự cổ động của các phong trào canh tân như Đông Kinh Nghĩa Thục, chữ Quốc ngữ chính thức thay thế chữ Hán và chữ Nôm, trở thành văn tự quốc gia.',
    structuralRules: [
      'Âm tiết tiếng Việt có cấu trúc tối đa 5 thành phần: [Âm đầu] + [Âm đệm] + [Âm chính] + [Âm cuối] + [Thanh điệu]. Trong đó Âm chính và Thanh điệu là hai thành phần bắt buộc.',
      'Quy tắc chính tả phân bố nguyên âm dòng trước: Các phụ âm K, GH, NGH bắt buộc đứng trước các nguyên âm dòng trước (E, Ê, I, Y). Đứng trước các nguyên âm khác sẽ viết là C, G, NG.',
      'Âm đệm /w/ được biểu diễn bằng ký tự "o" trước a, ă, e (hoa, hoè) hoặc "u" trước â, ê, i, y (huấn, huế, huy). Riêng sau phụ âm /k/ viết là "q" thì âm đệm luôn viết là "u" (quê, quà).',
      'Quy tắc viết i ngắn / y dài: Đứng một mình làm âm tiết độc lập thường viết "y" (ý kiến, y tế) hoặc "i" (ì ạch). Đi sau âm đệm bắt buộc dùng "y" (khuya, truyện).',
    ],
    phoneticTips: [
      'Hệ thống 6 thanh điệu mang đặc trưng cao độ (pitch contour) và tính chất thanh hầu (glottalization): Thanh Ngang (33 cao vừa), Huyền (21 hạ thấp), Sắc (35 vút cao), Hỏi (312 lượn xuống rồi lên nhẹ), Ngã (325 gãy giữa chừng với tắc nghẽn thanh môn), Nặng (21ˀ nghẽn gấp ở đáy giọng).',
      'Phụ âm cuối /p, t, k/ trong tiếng Việt là các âm khép vô thanh (unreleased stops): luồng hơi bị chặn lại hoàn toàn tại môi hoặc vòm họng mà không được bật nổ ra ngoài.',
      'Phụ âm /ɗ/ (Đ) và /ɓ/ (B) là các âm hút vào (implosive consonants): khi phát âm có xu hướng hạ thấp thanh quản tạo lực hút nhẹ vào trong.',
    ],
    learnerMistakesAndMnemonics: [
      'Nhầm lẫn thanh Hỏi và thanh Ngã: Người học miền Trung/Nam và người nước ngoài thường gặp khó khăn. Mẹo: Thanh ngã có độ ngắt gãy nghẹn ở cổ họng trước khi vút lên cao.',
      'Phát âm D, GI, R: Ở miền Bắc d/gi/r đồng hóa thành /z/; ở miền Nam d/gi phát âm là /j/ (như de), r phát âm uốn lưỡi /r/.',
      'Mẹo ghi nhớ chính tả: "Em Ê I Y đi cùng K, GH, NGH" để không bao giờ viết sai "cê", "ge" hay "nge".',
    ],
  },

  // ──────────────────────────────────────────────────────────
  //  2. NHẬT BẢN (ja)
  // ──────────────────────────────────────────────────────────
  ja: {
    originAndHistory:
      'Chữ viết tiếng Nhật là sự kết hợp độc đáo giữa 3 hệ thống: Kanji (chữ Hán du nhập vào khoảng thế kỷ 4–5), Hiragana (chữ mềm phát triển từ lối viết thảo của chữ Hán vào thời Heian thế kỷ 9 do giới quý tộc nữ sử dụng) và Katakana (chữ cứng do các tăng lữ Phật giáo lược trích các nét bộ thủ của chữ Hán để ghi chú phát âm kinh sách).',
    structuralRules: [
      'Tiếng Nhật là ngôn ngữ định thời gian theo phách (Mora-timed language): Mỗi ký tự Kana đại diện cho đúng 1 phách (Mora) có thời lượng phát âm tương đương nhau.',
      'Trường âm (Chōon): Kéo dài gấp đôi thời lượng của 1 mora (thành 2 mora). Trong Hiragana thêm nguyên âm tương ứng (aa, ii, uu, ee/ei, oo/ou); trong Katakana dùng dấu gạch ngang (ー).',
      'Âm ngắt (Sokuon: っ/ッ): Chiếm trọn 1 mora thời gian im lặng, chuẩn bị phát âm cho phụ âm tắc phía sau (vd: がっこう gakkou).',
      'Biến âm đục (Dakuon) gắn dấu tenten (゛) và âm bán đục (Handakuon) gắn dấu tròn maru (゜) vào 4 hàng ka, sa, ta, ha.',
    ],
    phoneticTips: [
      'Cao độ từ (Pitch Accent): Tiếng Nhật chuẩn Tokyo phân biệt nghĩa từ dựa trên cao độ (High/Low) với 4 dạng hình thái: Atamadaka (đầu cao), Nakadaka (giữa cao), Odaka (đuôi cao rơi trợ từ) và Heiban (bằng phẳng).',
      'Phụ âm hàng R /ɾ/: Là âm vỗ lợi (alveolar tap), đầu lưỡi gõ nhẹ một cái vào nướu răng trên, lai giữa "L", "D" và "R" nhẹ, tuyệt đối không rung lưỡi như tiếng Nga hay Tây Ban Nha.',
      'Âm "Fu" (ふ): Là âm xát hai môi vô thanh (/ɸɯ/), thở nhẹ luồng hơi qua khe hai môi hờ, không cắn răng vào môi dưới như âm "Ph" tiếng Việt.',
    ],
    learnerMistakesAndMnemonics: [
      'Bỏ quên âm ngắt hoặc phát âm quá ngắn: Làm biến đổi nghĩa hoàn toàn (vd: かたい katai - cứng vs かった katta - đã thắng; きて kite - hãy đến vs きって kitte - con tem).',
      'Đọc sai trường âm: おばさん (obasan - cô/dì) vs おばあさん (obāsan - bà cụ).',
      'Mẹo nhớ mặt chữ: Hiragana nét mềm mại lượn tròn ("Hira" nghĩa là phẳng, mềm); Katakana nét gấp khúc vuông vức ("Kata" nghĩa là từng mảnh, góc cạnh).',
    ],
  },

  // ──────────────────────────────────────────────────────────
  //  3. HÀN QUỐC (ko)
  // ──────────────────────────────────────────────────────────
  ko: {
    originAndHistory:
      'Hangeul (한글) được đích thân Vua Sejong Đại đế cùng các học sĩ Tập Hiền Điện sáng chế vào năm 1443 và ban hành năm 1446 qua văn bản "Huấn Dân Chính Âm" (Hunminjeongeum). Đây được UNESCO công nhận là hệ thống chữ viết khoa học và logic nhất thế giới: các phụ âm mô phỏng hình dáng cơ quan phát âm (miệng, lưỡi, răng, họng) khi phát ra âm đó, còn nguyên âm dựa trên triết lý Tam tài phương Đông (Thiên - Địa - Nhân).',
    structuralRules: [
      'Mỗi âm tiết tiếng Hàn bắt buộc được gói gọn trong một khối vuông (Syllable Block) kết hợp: [Phụ âm đầu] + [Nguyên âm] + [Phụ âm cuối Batchim (tùy chọn)].',
      'Quy tắc sắp khối: Nguyên âm nét đứng (ㅏ, ㅓ, ㅣ, ㅐ, ㅔ...) thì phụ âm đầu nằm bên trái (가, 너); nguyên âm nét ngang (ㅗ, ㅜ, ㅡ...) thì phụ âm đầu nằm bên trên (고, 누).',
      'Vị trí âm câm: Nếu âm tiết bắt đầu bằng nguyên âm, ký tự "ㅇ" (ieung) được đặt làm phụ âm đầu đóng vai trò giữ chỗ và không phát âm (vd: 안 = ㅇ câm + ㅏ + ㄴ). Khi "ㅇ" đứng ở vị trí Batchim, nó đọc là âm ngạc mềm /ŋ/ (ng).',
    ],
    phoneticTips: [
      'Hệ thống phụ âm 3 bậc độc nhất: Âm thường/âm lỏng (ㄱ, ㄷ, ㅂ, ㅅ, ㅈ), Âm căng/căng môi (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ) và Âm bật hơi (ㅋ, ㅌ, ㅍ, ㅊ).',
      '7 đại diện âm cuối Batchim: Dù có tới 27 cách viết batchim đơn và kép, khi phát âm chỉ quy về 7 âm: [ㄱ] (k), [ㄴ] (n), [ㄷ] (t), [ㄹ] (l), [ㅁ] (m), [ㅂ] (p), [ㅇ] (ng).',
      'Quy tắc nối âm (Yeon-eum): Khi âm tiết trước có batchim và âm tiết sau bắt đầu bằng phụ âm câm "ㅇ", âm batchim sẽ được đẩy sang làm phụ âm đầu của âm tiết sau (vd: 한국어 -> [한구거] hangugeo).',
    ],
    learnerMistakesAndMnemonics: [
      'Không phân biệt được âm thường, âm căng và âm bật hơi: vd 달 (dal - trăng) vs 딸 (ttal - con gái) vs 탈 (tal - mặt nạ). Mẹo: Đặt bàn tay trước miệng, âm bật hơi (ㅋ, ㅌ, ㅍ) phải có luồng hơi phà mạnh vào tay, âm căng (ㄲ, ㄸ, ㅃ) nén họng không có hơi phà ra.',
      'Quên quy tắc biến âm mũi (Nasalization): Khi batchim [ㄱ, ㄷ, ㅂ] gặp phụ âm mũi [ㄴ, ㅁ], chúng biến đổi tương ứng thành [ㅇ, ㄴ, ㅁ] (vd: 합니다 -> [함니다] hamnida).',
    ],
  },

  // ──────────────────────────────────────────────────────────
  //  4. TRUNG QUỐC (zh)
  // ──────────────────────────────────────────────────────────
  zh: {
    originAndHistory:
      'Hán tự là hệ thống văn tự liên tục cổ xưa nhất còn tồn tại của nhân loại với lịch sử hơn 3.500 năm, khởi nguồn từ Giáp cốt văn thời nhà Thương, qua Kim văn, Đại triện, Tiểu triện, Lệ thư và Khải thư. Năm 1958, Quốc vụ viện Trung Quốc chính thức ban hành Phương án Bính âm La-tinh Hán ngữ (Hanyu Pinyin) để chuẩn hóa phiên âm quốc tế cho tiếng Phổ thông.',
    structuralRules: [
      'Cấu trúc một âm tiết Pinyin: Thanh mẫu (Initials - 21 phụ âm) + Vận mẫu (Finals - 36 nguyên âm đơn, kép, mũi) + Thanh điệu (Tones).',
      'Quy tắc đánh dấu thanh điệu: Đánh dấu theo thứ tự ưu tiên nguyên âm mở rộng: a > o, e > i, u, ü. Khi "i" và "u" đi liền nhau (iu, ui), dấu luôn đặt trên nguyên âm đứng sau.',
      'Bộ thủ (Radicals): 214 bộ thủ Khang Hy là chìa khóa phân loại ý nghĩa của Hán tự; hơn 80% chữ Hán là chữ hình thanh (một nửa gợi nghĩa, một nửa gợi âm).',
      'Quy tắc dấu hai chấm trên ü: Khi ü đi sau j, q, x, y, dấu hai chấm được lược bỏ (ju, qu, xu, yu) nhưng vẫn giữ cách đọc /y/ (uy). Khi đi sau n, l vẫn giữ nguyên (nü, lü).',
    ],
    phoneticTips: [
      'Hệ thống 4 thanh điệu: Thanh 1 (55: cao phẳng ngân dài, ā), Thanh 2 (35: từ trung lên cao như dấu sắc nhẹ, á), Thanh 3 (214: hạ sâu rồi lên nhẹ, ǎ), Thanh 4 (51: từ đỉnh cao rơi dứt khoát xuống đáy, à). Khinh thanh (neutral tone: ngắn, nhẹ, không dấu).',
      'Biến điệu Thanh 3: Hai thanh 3 đứng cạnh nhau thì thanh đầu đọc thành thanh 2 (3 + 3 -> 2 + 3, vd: 你好 nǐ hǎo -> ní hǎo). Khi có 3 thanh 3, thanh ở giữa đổi thành thanh 2.',
      'Phân biệt âm uốn lưỡi (zh, ch, sh, r - cong đầu lưỡi chạm ngạc cứng) và âm đầu lưỡi thẳng (z, c, s - đầu lưỡi chạm mặt sau răng trên).',
    ],
    learnerMistakesAndMnemonics: [
      'Đọc thanh 4 thành dấu huyền tiếng Việt: Đây là lỗi phổ biến nhất. Thanh 4 phải phát âm dứt khoát, dậm chân giật giọng từ nấc 5 xuống nấc 1 (vd: 是 shì - không đọc thành "sì").',
      'Nhầm lẫn giữa cặp âm bật hơi và không bật hơi: b/p, d/t, g/k, j/q, zh/ch, z/c. Các âm p, t, k, q, ch, c phải bật luồng hơi mạnh mẽ làm bay tờ giấy đặt trước miệng.',
    ],
  },

  // ──────────────────────────────────────────────────────────
  //  5. TIẾNG ANH (en)
  // ──────────────────────────────────────────────────────────
  en: {
    originAndHistory:
      'Tiếng Anh thuộc nhánh Tây Germanic của hệ ngôn ngữ Ấn-Âu. Bảng chữ cái Latinh thay thế chữ Rune Futhorc từ thế kỷ 7. Sau cuộc xâm lược của người Norman năm 1066, tiếng Pháp cổ truyền vào một lượng khổng lồ từ vựng từ gốc Rôman. Từ thế kỷ 14–17 diễn ra cuộc "Đại dịch chuyển nguyên âm" (Great Vowel Shift), làm phát âm nguyên âm thay đổi hoàn toàn trong khi cách viết giữ nguyên, tạo nên sự chênh lệch lớn giữa chữ viết và phát âm ngày nay.',
    structuralRules: [
      'Bảng chữ cái chỉ có 26 chữ cái Latinh nhưng biểu thị tới 44 âm vị (phonemes) trong bảng ký hiệu ngữ âm quốc tế IPA (Oxford Standard): 12 nguyên âm đơn, 8 nguyên âm đôi và 24 phụ âm.',
      'Tính chất chính tả mờ đục (Opaque Orthography): Một tổ hợp chữ viết có thể phát âm theo nhiều cách (vd: "ough" trong though /ðoʊ/, through /θruː/, rough /rʌf/, thought /θɔːt/).',
      'Trọng âm từ (Word Stress): Mỗi từ có từ 2 âm tiết trở lên đều có ít nhất 1 trọng âm chính. Trọng âm làm thay đổi hoàn toàn nguyên âm không nhấn thành âm lướt Schwa /ə/.',
    ],
    phoneticTips: [
      'Nguyên âm Schwa /ə/: Là âm vị xuất hiện với tần suất cao nhất trong tiếng Anh giao tiếp tự nhiên (trong các âm tiết không nhấn trọng âm, vd: about /əˈbaʊt/, banana /bəˈnɑːnə/).',
      'Cặp âm ma sát răng-lưỡi /θ/ và /ð/: Đặt đầu lưỡi nằm nhẹ giữa hai hàm răng và đẩy luồng hơi ra: /θ/ vô thanh (think, three) và /ð/ hữu thanh có rung dây thanh (this, mother).',
      'Nhịp điệu câu dựa vào trọng âm (Stress-timed rhythm): Khoảng cách thời gian giữa các từ mang trọng âm là tương đối đồng đều; các từ chức năng (to, a, the, of) bị nén ngắn lại.',
    ],
    learnerMistakesAndMnemonics: [
      'Nuốt âm cuối (Dropping final consonants): Người Việt quen với tiếng Việt không có phụ âm bật nổ cuối từ nên thường quên phát âm đuôi /s/, /z/, /t/, /d/, /k/, /ʃ/, /tʃ/ làm biến dạng nghĩa của từ (vd: life, like, light, line).',
      'Đọc ngang bằng không trọng âm: Cần phát âm âm tiết có trọng âm to hơn, cao hơn và ngân dài hơn một chút so với các âm tiết còn lại.',
    ],
  },

  // ──────────────────────────────────────────────────────────
  //  6. TIẾNG PHÁP (fr)
  // ──────────────────────────────────────────────────────────
  fr: {
    originAndHistory:
      'Tiếng Pháp là ngôn ngữ Rôman phát sinh từ tiếng Latinh bình dân được quân đội La Mã mang vào xứ Gaulois (Pháp ngày nay) kết hợp với ngôn ngữ Celt bản địa và tiếng Frank của người Germanic. Năm 1539, sắc lệnh Villers-Cotterêts chính thức chọn tiếng Pháp làm ngôn ngữ hành chính. Năm 1635, Hồng y Richelieu sáng lập Viện Hàn lâm Pháp (Académie française) để gìn giữ sự trong sáng và chuẩn hóa ngữ pháp.',
    structuralRules: [
      'Hệ thống 5 loại dấu phụ bắt buộc: Accent aigu (é), Accent grave (à, è, ù), Accent circonflexe (â, ê, î, ô, û), Cédille (ç - giúp c đọc là /s/ trước a, o, u), Tréma (ë, ï, ü - tách hai nguyên âm đứng liền nhau).',
      'Quy tắc nối âm (Liaison): Phụ âm cuối vốn là âm câm của từ đứng trước sẽ được phát âm nối sang nguyên âm đầu của từ đứng sau (vd: les_amis đọc là /le.za.mi/).',
      'Quy tắc nuốt âm (Élision): Lược bỏ nguyên âm cuối đứng trước nguyên âm khác và thay bằng dấu nháy đơn (vd: le + ami -> l\'ami; je + aime -> j\'aime).',
    ],
    phoneticTips: [
      '4 nguyên âm mũi đặc trưng (Voyelles nasales): /ɑ̃/ (an/en), /ɛ̃/ (in/ain/ein), /ɔ̃/ (on/om), /œ̃/ (un/um) — phát âm bằng cách hạ thấp vòm họng mềm để luồng hơi thoát đồng thời qua cả mũi và miệng.',
      'Âm R lưỡi gà (Consonne uvulaire /ʁ/): Lưỡi gà rung nhẹ khi luồng hơi cọ sát ở đáy cuống họng, hoàn toàn khác âm R rung đầu lưỡi của tiếng Tây Ban Nha hay R tiếng Việt.',
      'Quy tắc phụ âm câm cuối "CaReFuL": Hầu hết phụ âm đứng cuối từ tiếng Pháp đều là âm câm, trừ các phụ âm C, R, F, L là thường xuyên được phát âm (vd: sac, cher, vif, sel).',
    ],
    learnerMistakesAndMnemonics: [
      'Phát âm phụ âm cuối như tiếng Anh: Trong tiếng Pháp "Paris" đọc là /pa.ʁi/, "vous" đọc là /vu/, "chat" đọc là /ʃa/.',
      'Nhầm lẫn âm R họng với âm Kh: Âm R tiếng Pháp là âm cọ xát rung đáy họng thanh nhã, không khạc mạnh luồng hơi như âm "Kh" tiếng Việt.',
    ],
  },

  // ──────────────────────────────────────────────────────────
  //  7. TIẾNG ĐỨC (de)
  // ──────────────────────────────────────────────────────────
  de: {
    originAndHistory:
      'Tiếng Đức thuộc ngữ tộc German Tây. Bản dịch Kinh Thánh tiếng Đức của Martin Luther vào thế kỷ 16 đóng vai trò quyết định trong việc thống nhất các phương ngữ miền Thượng và miền Hạ thành tiếng Đức chuẩn (Hochdeutsch). Các quy chuẩn chính tả hiện đại được thống nhất qua Cải cách Chính tả tiếng Đức (Rechtschreibreform) năm 1996.',
    structuralRules: [
      'Quy tắc viết hoa Danh từ: Tất cả các Danh từ (Nouns) trong tiếng Đức bắt buộc phải viết hoa chữ cái đầu tiên, bất kể đứng ở vị trí nào trong câu (vd: das Buch, die Freiheit, der Tisch).',
      '3 biến âm Umlaute (Ä/ä, Ö/ö, Ü/ü) làm thay đổi nguyên âm ban đầu và mang tính phân biệt ngữ pháp số nhiều hoặc chia động từ.',
      'Ký tự đặc biệt Eszett (ß - Scharfes S): Tương đương âm "ss", chỉ xuất hiện sau nguyên âm dài hoặc nguyên âm đôi (vd: Straße, weiß). Sau nguyên âm ngắn bắt buộc viết "ss" (vd: Fluss).',
      'Từ ghép vô tận (Komposita): Tiếng Đức có khả năng ghép nhiều từ đơn lẻ thành một từ ghép duy nhất biểu thị khái niệm phức tạp (vd: Handschuh = Hand + Schuh: găng tay).',
    ],
    phoneticTips: [
      'Hiện tượng vô thanh hóa phụ âm cuối (Auslautverhärtung): Các phụ âm hữu thanh /b, d, g/ khi đứng ở cuối từ hoặc cuối âm tiết sẽ biến thành âm vô thanh tương ứng [p, t, k] (vd: "Tag" đọc là [ta:k], "und" đọc là [ʊnt]).',
      'Hai biến thể của tổ hợp "ch": "Ich-Laut" /ç/ (âm vòm miệng mềm mại sau e, i, ä, ö, ü) và "Ach-Laut" /x/ (âm họng trầm khàn sau a, o, u, au).',
      'Âm Glottal Stop (Knacklaut): Âm tắc nghẽn thanh môn ngắn dứt khoát trước mỗi âm tiết bắt đầu bằng một nguyên âm.',
    ],
    learnerMistakesAndMnemonics: [
      'Phát âm sai âm Ö và Ü: Mẹo phát âm Ü: Chu tròn môi như đang huýt sáo phát âm "U" nhưng vị trí đầu lưỡi đẩy ra phía trước như đang nói chữ "I". Mẹo phát âm Ö: Giữ khẩu hình môi tròn của âm "O" nhưng để lưỡi ở vị trí âm "E".',
      'Quên viết hoa danh từ: Luôn chú ý danh từ trong câu phải viết hoa.',
    ],
  },

  // ──────────────────────────────────────────────────────────
  //  8. TIẾNG Ý (it)
  // ──────────────────────────────────────────────────────────
  it: {
    originAndHistory:
      'Tiếng Ý là ngôn ngữ giữ lại cấu trúc ngữ âm gần gũi nhất với tiếng Latinh cổ điển trong các ngôn ngữ Rôman. Nền móng tiếng Ý văn học chuẩn được xây dựng vào thế kỷ 14 bởi đại thi hào Dante Alighieri qua tác phẩm Thần Khúc (Divina Commedia) cùng Petrarch và Boccaccio dựa trên phương ngữ vùng Firenze xứ Toscana.',
    structuralRules: [
      'Quy tắc kết thúc bằng nguyên âm: Gần như tất cả các từ thuần Ý (hơn 98%) đều kết thúc bằng một trong 5 nguyên âm (a, e, i, o, u).',
      'Bảng chữ cái truyền thống chỉ có 21 chữ cái. 5 ký tự J, K, W, X, Y được coi là ký tự ngoại lai (lettere straniere) chỉ dùng trong từ vay mượn quốc tế.',
      'Phụ âm kép (Consonanti doppie: bb, cc, dd, ff, gg, ll, mm, nn, pp, rr, ss, tt...): Kéo dài gấp đôi thời gian phát âm, tạo điểm ngắt và độ căng đặc trưng mang tính khu biệt nghĩa sống còn.',
    ],
    phoneticTips: [
      'Quy tắc biến âm C và G: Đứng trước E, I đọc mềm (/tʃ/ như "ch" và /dʒ/ như "gi"); đứng trước A, O, U đọc cứng (/k/ và /g/). Thêm "H" (ch, gh) để giữ âm cứng trước E, I (vd: spaghetti /spaˈɡetti/, ciao /ˈtʃaːo/).',
      'Âm GLI /ʎ/: Âm bên ngạc cứng, mặt lưỡi áp sát vòm họng và luồng hơi thoát ra hai bên cạnh lưỡi (như "ly" lướt mềm, vd: famiglia).',
      'Âm GN /ɲ/: Âm mũi ngạc cứng, giống hệt âm "nh" trong tiếng Việt (vd: gnocchi, lasagna).',
    ],
    learnerMistakesAndMnemonics: [
      'Xem nhẹ phụ âm kép: Phát âm phụ âm đơn thay vì phụ âm kép sẽ làm đổi nghĩa hoàn toàn (vd: nono [thứ chín] vs nonno [ông nội]; casa [ngôi nhà] vs cassa [quầy thu ngân/thùng hàng]; penne [mì ống] vs pene [bộ phận nhạy cảm]).',
      'Mẹo ghi nhớ C/G: "H làm cứng lại" — thêm H vào ci/gi sẽ biến thành chi/ghi mang âm /k/ và /g/.',
    ],
  },

  // ──────────────────────────────────────────────────────────
  //  9. TÂY BAN NHA (es)
  // ──────────────────────────────────────────────────────────
  es: {
    originAndHistory:
      'Tiếng Tây Ban Nha (Castellano) là ngôn ngữ Rôman phát triển từ vùng Castilla trên bán đảo Iberia. Trong suốt gần 800 năm thời kỳ Al-Andalus (711–1492), ngôn ngữ này chịu ảnh hưởng sâu sắc của tiếng Ả Rập, để lại hơn 4.000 từ vựng mượn (đặc biệt là các từ bắt đầu bằng tiền tố "al-"). Năm 1492, Antonio de Nebrija xuất bản cuốn ngữ pháp tiếng Tây Ban Nha đầu tiên, cũng là năm bắt đầu mở rộng sang châu Mỹ.',
    structuralRules: [
      'Bảng chữ cái chính thức gồm 27 ký tự theo Viện Hàn lâm Hoàng gia Tây Ban Nha (RAE), bao gồm ký tự đặc trưng riêng biệt Ñ/ñ (eñe) biểu thị âm /ɲ/.',
      'Ký hiệu câu ngược: Dấu chấm hỏi ngược (¿) và dấu chấm than ngược (¡) bắt buộc đặt ở đầu mệnh đề nghi vấn hoặc cảm thán để báo hiệu ngữ điệu cho người đọc.',
      'Dấu trọng âm họa đồ (Tilde / Acento ortográfico: á, é, í, ó, ú): Đánh dấu vị trí nhấn trọng âm khi từ không tuân theo 2 quy tắc trọng âm tự nhiên (kết thúc bằng nguyên âm, N, S nhấn âm áp chót; kết thúc bằng phụ âm khác nhấn âm cuối).',
    ],
    phoneticTips: [
      '5 nguyên âm thuần khiết (Pure vowels: a, e, i, o, u): Luôn giữ nguyên độ mở và cách phát âm ngắn gọn, dứt khoát, không bao giờ trượt âm thành nguyên âm đôi như tiếng Anh.',
      'Âm R đơn (alveolar tap) và Rr kép (alveolar trill): R đơn (pero) chỉ vỗ đầu lưỡi 1 lần; Rr kép hoặc R đứng đầu từ (perro, rosa) rung liên tục 2–3 nhịp ở đầu lưỡi.',
      'Âm B và V trong tiếng Tây Ban Nha chuẩn phát âm hoàn toàn đồng nhất: Đều là âm môi-môi (bilabial), không cắn răng môi dưới như âm "V" tiếng Việt hay tiếng Anh.',
    ],
    learnerMistakesAndMnemonics: [
      'Không rung được âm Rr: Cần thả lỏng phần đầu lưỡi, nâng nhẹ lên nướu răng trên và dùng luồng hơi mạnh từ phổi để làm đầu lưỡi rung bật tự nhiên.',
      'Phát âm nhầm chữ J: Chữ J (jota) đọc như âm "H" khàn sâu trong họng /x/, không đọc như âm "J" hay "Gi" tiếng Việt.',
    ],
  },

  // ──────────────────────────────────────────────────────────
  //  10. BỒ ĐÀO NHA (pt)
  // ──────────────────────────────────────────────────────────
  pt: {
    originAndHistory:
      'Tiếng Bồ Đào Nha khởi nguồn từ tiếng Galicia-Bồ Đào Nha thời Trung Cổ ở vùng tây bắc bán đảo Iberia. Trong Thời đại Khám phá vĩ đại thế kỷ 15–16, tiếng Bồ Đào Nha được các nhà thám hiểm như Vasco da Gama mang đi khắp thế giới. Ngày nay tiếng Bồ Đào Nha có hai biến thể tiêu chuẩn lớn: Tiếng Bồ Đào Nha Châu Âu (European PT) và Tiếng Bồ Đào Nha Brazil (Brazilian PT).',
    structuralRules: [
      'Dấu ngã Til (~) trên "ã" và "õ" đại diện cho hệ thống nguyên âm mũi đặc thù (Vogais nasais) độc đáo nhất trong các ngôn ngữ Rôman.',
      'Dấu móc Cédille (ç): Đặt dưới chữ C trước các nguyên âm a, o, u để biến cách phát âm thành /s/ (vd: coração, açúcar).',
      'Hệ thống dấu phân biệt nguyên âm mở và đóng: Dấu sắc (´: á, é, ó) biểu thị nguyên âm mở; Dấu mũ (^: â, ê, ô) biểu thị nguyên âm đóng hẹp vòm họng.',
    ],
    phoneticTips: [
      'Các nguyên âm đôi mũi (Ditongos nasais: ão, ãe, õe): Phát âm bằng cách đẩy luồng hơi đồng thời qua khoang mũi và miệng (vd: pão /pɐ̃w̃/ - bánh mì, capitão - thuyền trưởng).',
      'Âm "S" cuối từ: Ở Bồ Đào Nha và vùng Rio de Janeiro (Brazil), "s" ở cuối từ hoặc trước phụ âm vô thanh phát âm thành âm xuýt /ʃ/ (như "sh" trong tiếng Anh).',
      'Hiện tượng nuốt nguyên âm ở Bồ Đào Nha: Người Bồ Đào Nha phát âm khép miệng và nuốt gần như toàn bộ các nguyên âm không nhấn trọng âm, tạo cảm giác giọng nói trầm ấm và nhanh.',
    ],
    learnerMistakesAndMnemonics: [
      'Đọc vần "ão" thành "ao" thông thường: Âm "ão" bắt buộc phải có độ rung vang nghẹn trong khoang mũi. Mẹo: Bịt nhẹ hai cánh mũi khi phát âm, bạn phải cảm nhận được cánh mũi rung lên.',
    ],
  },

  // ──────────────────────────────────────────────────────────
  //  11. TIẾNG NGA (ru)
  // ──────────────────────────────────────────────────────────
  ru: {
    originAndHistory:
      'Tiếng Nga thuộc nhánh Đông Slav của ngữ tộc Slav. Bảng chữ cái Kirin (Cyrillic) được hai nhà truyền giáo người Hy Lạp là Thánh Cyril và Methodius sáng chế vào thế kỷ 9 dựa trên mẫu tự Hy Lạp để dịch Kinh Thánh sang tiếng Slav Giáo hội cổ. Năm 1708, Sa hoàng Peter Đại đế tiến hành cải cách giản lược kiểu chữ dân sự (Grazhdansky shrift), và cuộc cải cách chính tả năm 1918 đã hoàn thiện bảng chữ cái 33 ký tự như ngày nay.',
    structuralRules: [
      'Bảng chữ cái gồm đúng 33 ký tự: 10 nguyên âm (а, о, у, ы, э, я, ё, ю, и, е), 21 phụ âm, và 2 ký tự dấu đặc biệt không có âm thanh riêng: Dấu cứng (Ъ) và Dấu mềm (Ь).',
      'Tính đối lập Cứng - Mềm (Hard vs Soft consonants): Trụ cột của ngữ âm tiếng Nga. Phụ âm đi kèm nguyên âm cứng (а, о, у, ы, э) phát âm cứng; đi kèm nguyên âm mềm (я, ё, ю, и, е) hoặc Dấu mềm (Ь) sẽ bị ngạc mềm hóa (palatalized), lưỡi dẹt ép lên vòm ngạc.',
      'Trọng âm tự do và linh hoạt (Free and dynamic stress): Trọng âm có thể rơi vào bất kỳ âm tiết nào trong từ và thường xuyên dịch chuyển vị trí khi biến cách danh từ hoặc chia động từ.',
    ],
    phoneticTips: [
      'Quy tắc suy giảm nguyên âm (Akan\'ye): Chữ "О" khi không mang trọng âm sẽ bị suy giảm và phát âm nhẹ thành âm "А" hoặc âm Schwa /ə/ (vd: "Хорошо" mang trọng âm ở âm tiết cuối, phát âm thành [xə.rɐ.ˈʂo]).',
      'Đồng hóa phụ âm: Phụ âm hữu thanh biến thành vô thanh khi đứng ở cuối từ (vd: "город" [thành phố] đọc thành [gorət]) hoặc khi đứng trước phụ âm vô thanh.',
      'Nguyên âm "Ы" /ɨ/: Là âm nguyên âm giữa đóng, không có trong tiếng Việt. Mẹo phát âm: Cắn nhẹ hai hàm răng nói chữ "Ư" nhưng kéo lưỡi lùi sâu về phía sau cuống họng.',
    ],
    learnerMistakesAndMnemonics: [
      'Bẫy ký tự "giả dạng Latinh": Nhiều chữ cái Cyrillic nhìn giống hệt chữ Latinh nhưng phát âm hoàn toàn khác: "В" đọc là /v/ (không phải b), "Н" đọc là /n/ (không phải h), "Р" đọc là /r/ rung lưỡi (không phải p), "С" đọc là /s/ (không phải c), "Х" đọc là /kh/ (không phải x).',
      'Phát âm tròn môi chữ "О" không có trọng âm: Làm mất đi ngữ điệu tự nhiên của người Nga.',
    ],
  },
};
