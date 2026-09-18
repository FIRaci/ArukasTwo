// ============================================================
//  SPEECH & ACCENT COACH DATA — ARUKAS 2
//  Curated Realistic Roleplay Scenarios & Deep Accent Linguistic Guides
// ============================================================

import { RoleplayScenario, AccentGuideRule, LanguageCode } from '../types';

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  // ── JAPANESE SCENARIOS ──
  {
    id: 'rp_ja_izakaya',
    title: 'Gọi Món Tại Quán Izakaya Shinjuku',
    description: 'Trò chuyện cùng chủ quán thân thiện, gọi bia tươi, xin gợi ý món xiên nướng yakitori đặc sản.',
    lang: 'ja',
    level: 'Beginner',
    category: 'Dining',
    personaName: 'Kenji-san',
    personaRole: 'Chủ quán Izakaya lâu năm',
    avatar: '🏮',
    contextPrompt: 'Bạn là Kenji, chủ một quán nhậu Izakaya ấm cúng ở Shinjuku Tokyo. Hãy chào đón khách nồng nhiệt, nói tiếng Nhật tự nhiên, hơi thân mật nhưng vẫn lịch sự (Desu/Masu), và phản hồi ngắn gọn từng câu.',
    initialMessage: 'いらっしゃい！何名様ですか？カウンター席どうぞ！まずはお飲み物からにしますか？',
    initialMessageReading: 'Irasshai! Nan-mei-sama desu ka? Kauntaa-seki douzo! Mazu wa onomimono kara ni shimasu ka?',
    initialMessageTranslation: 'Chào mừng quý khách! Quý khách đi mấy người ạ? Mời ngồi ghế quầy bar! Mình muốn gọi đồ uống trước không?',
    suggestedStarters: [
      { text: '一人です。生ビールを一つお願いします。', reading: 'Hitori desu. Namabiiru o hitotsu onegaishimasu.', meaning: 'Tôi đi một mình. Cho tôi một cốc bia tươi.' },
      { text: 'おすすめの焼き鳥はありますか？', reading: 'Osusume no yakitori wa arimasu ka?', meaning: 'Quán có món xiên nướng nào ngon gợi ý không ạ?' },
      { text: 'お会計をお願いします。', reading: 'Okaikei o onegaishimasu.', meaning: 'Làm ơn tính tiền giúp tôi.' },
    ],
  },
  {
    id: 'rp_ja_tech_interview',
    title: 'Phỏng Vấn Kỹ Sư Phần Mềm Tại Shibuya',
    description: 'Trả lời phỏng vấn ứng tuyển vị trí lập trình viên với giám đốc kỹ thuật Nhật Bản.',
    lang: 'ja',
    level: 'Advanced',
    category: 'Career',
    personaName: 'Yamada Kenichi',
    personaRole: 'Giám đốc Kỹ thuật (CTO)',
    avatar: '💼',
    contextPrompt: 'Bạn là Yamada-san, Giám đốc Kỹ thuật một công ty công nghệ tại Shibuya. Đặt câu hỏi phỏng vấn trang trọng (Keigo/Teineigo), lắng nghe ứng viên và phản hồi chuyên nghiệp.',
    initialMessage: '本日はお時間をいただきありがとうございます。まず簡単に自己紹介と、これまでの開発経験についてお聞かせいただけますか？',
    initialMessageReading: 'Honjitsu wa ojikan o itadaki arigatou gozaimasu. Mazu kantan ni jikoshoukai to, kore made no kaihatsu keiken ni tsuite okikase itadakemasu ka?',
    initialMessageTranslation: 'Cảm ơn bạn đã dành thời gian hôm nay. Trước hết, bạn có thể giới thiệu ngắn gọn bản thân và kinh nghiệm phát triển phần mềm gần đây không?',
    suggestedStarters: [
      { text: '初めまして、ベトナム出身のソフトウェアエンジニアです。主にReactとTypeScriptを担当してまいりました。', reading: 'Hajimemashite, Betonamu shusshin no sofutowea enjinia desu. Omoni React to TypeScript o tantou shite mairimashita.', meaning: 'Rất vui được gặp anh, tôi là kỹ sư phần mềm người Việt. Tôi chủ yếu phụ trách React và TypeScript.' },
      { text: '御社のプロダクトに強く共感し、技術力で貢献したいと考えております。', reading: 'Onsha no purodakuto ni tsuyoku kyoukan shi, gijutsuryoku de kouken shitai to kangaete orimasu.', meaning: 'Tôi rất đồng cảm với sản phẩm của quý công ty và mong muốn cống hiến bằng năng lực kỹ thuật của mình.' },
    ],
  },

  // ── KOREAN SCENARIOS ──
  {
    id: 'rp_ko_cafe',
    title: 'Gọi Cà Phê Tại Quán Cà Phê Hongdae',
    description: 'Gọi đồ uống, chọn độ ngọt, lượng đá và hỏi mật khẩu Wi-Fi tại quán cà phê giới trẻ Seoul.',
    lang: 'ko',
    level: 'Beginner',
    category: 'Dining',
    personaName: 'Min-ji',
    personaRole: 'Nhân viên pha chế Barista',
    avatar: '☕',
    contextPrompt: 'Bạn là Min-ji, nhân viên quán cà phê sành điệu ở Hongdae, Seoul. Nói tiếng Hàn trẻ trung, lịch sự (Yo-che), phản hồi thân thiện và ngắn gọn.',
    initialMessage: '안녕하세요! 주문 도와드릴게요. 매장에서 드시고 가시나요, 아니면 테이크아웃이세요?',
    initialMessageReading: 'Annyeonghaseyo! Jumun dowadeurilgeyo. Maejang-eseo deusigo gasinayo, animyeon teikeu-aus-iseyo?',
    initialMessageTranslation: 'Xin chào! Em có thể giúp gì cho anh/chị ạ? Mình dùng tại quán hay mang đi ạ?',
    suggestedStarters: [
      { text: '매장에서 마실게요. 아이스 아메리카노 한 잔 부탁드려요.', reading: 'Maejang-eseo masilgeyo. Aiseu Amerikano han jan butakdeuryeoyo.', meaning: 'Tôi uống tại quán. Cho tôi một cốc Americano đá nhé.' },
      { text: '덜 달게 해주실 수 있나요? 그리고 와이파이 비밀번호가 뭐예요?', reading: 'Deol dalge haejusil su innayo? Geurigo wa-ipa-i bimilbeonhoga mwoyeyo?', meaning: 'Làm bớt ngọt giúp tôi được không? Và mật khẩu Wi-Fi là gì vậy ạ?' },
    ],
  },

  // ── ENGLISH SCENARIOS ──
  {
    id: 'rp_en_coffee_london',
    title: 'Artisan Coffee Shop in Soho London',
    description: 'Order a speciality coffee, inquire about oat milk alternatives, and chat with a friendly London barista.',
    lang: 'en',
    level: 'Intermediate',
    category: 'Dining',
    personaName: 'Oliver',
    personaRole: 'Head Barista in Soho',
    avatar: '🇬🇧',
    contextPrompt: 'You are Oliver, a warm British barista at a boutique coffee shop in Soho, London. Speak with natural British English idioms and clear phrasing.',
    initialMessage: 'Morning! What can I get started for you today? We have a lovely Ethiopian single origin on batch brew if you fancy something fruity.',
    initialMessageTranslation: 'Chào buổi sáng! Tôi có thể chuẩn bị món gì cho bạn hôm nay? Quán đang có mẻ cà phê Ethiopia vị trái cây rất thơm ngon đấy.',
    suggestedStarters: [
      { text: 'Could I please get a flat white with oat milk?', meaning: 'Cho tôi một cốc flat white dùng sữa yến mạch được không?' },
      { text: 'That sounds brilliant, I would love to try the Ethiopian batch brew.', meaning: 'Nghe tuyệt đấy, tôi muốn thử mẻ cà phê Ethiopia đó.' },
      { text: 'Do you have any vegan pastries available today?', meaning: 'Hôm nay quán có món bánh ngọt thuần chay nào không?' },
    ],
  },
  {
    id: 'rp_en_tech_pitch',
    title: 'Silicon Valley Startup Coffee Chat',
    description: 'Introduce your project, discuss architecture scalability, and pitch your engineering philosophy.',
    lang: 'en',
    level: 'Advanced',
    category: 'Career',
    personaName: 'Sarah Lin',
    personaRole: 'Tech Founder & Angel Investor',
    avatar: '🚀',
    contextPrompt: 'You are Sarah Lin, a Silicon Valley tech founder. You value concise, sharp engineering answers, direct communication, and technical depth.',
    initialMessage: 'Hey! Glad we could catch up. I took a quick look at your repo earlier. Tell me, what was the most difficult architectural bottleneck you tackled recently?',
    initialMessageTranslation: 'Chào bạn! Rất vui được gặp bạn. Tôi vừa xem qua repo dự án của bạn ban nãy. Hãy chia sẻ cho tôi nút thắt cổ chai kiến trúc khó khăn nhất bạn vừa giải quyết gần đây?',
    suggestedStarters: [
      { text: 'We recently decoupled our monolithic processing into a progressive two-tier pipeline, dropping user wait times from 60 seconds down to sub-4 seconds.', meaning: 'Gần đây chúng tôi vừa tách khối xử lý nguyên khối sang đường ống tiến trình 2 pha, giảm thời gian chờ của người dùng từ 60 giây xuống dưới 4 giây.' },
      { text: 'Our main focus has been 100% client-side privacy and offline-first data consistency using IndexedDB.', meaning: 'Trọng tâm cốt lõi của chúng tôi là bảo mật 100% phía người dùng và tính nhất quán dữ liệu ngoại tuyến qua IndexedDB.' },
    ],
  },

  // ── CHINESE SCENARIOS ──
  {
    id: 'rp_zh_tea_shop',
    title: 'Quán Trà Sữa Sanlitun Bắc Kinh',
    description: 'Gọi trà sữa trân châu, tùy chỉnh độ ngọt (vi đường) và lượng đá (thiếu băng).',
    lang: 'zh',
    level: 'Beginner',
    category: 'Dining',
    personaName: 'Tiểu Vũ',
    personaRole: 'Nhân viên quán trà sữa',
    avatar: '🧋',
    contextPrompt: 'Bạn là Tiểu Vũ, nhân viên một tiệm trà sữa nổi tiếng ở Tam Lý Đồn, Bắc Kinh. Nói tiếng Trung phổ thông chuẩn xác, thân thiện, hỏi khẩu vị khách.',
    initialMessage: '您好！欢迎光临，请问今天想喝点什么？我们的招牌黑糖珍珠鲜奶很受欢迎哦！',
    initialMessageReading: 'Nín hǎo! Huānyíng guānglín, qǐngwèn jīntiān xiǎng hē diǎn shénme? Wǒmen de zhāopai hēitáng zhēnzhū xiānnǎi hěn shòu huānyíng ó!',
    initialMessageTranslation: 'Xin chào quý khách! Hôm nay mình muốn dùng món gì ạ? Món sữa tươi trân châu đường đen đặc trưng của quán đang rất được ưa chuộng đấy ạ!',
    suggestedStarters: [
      { text: '我要一杯大杯的黑糖珍珠鲜奶，微糖少冰。', reading: 'Wǒ yào yī bēi dà bēi de hēitáng zhēnzhū xiānnǎi, wēi táng shǎo bīng.', meaning: 'Cho tôi một cốc lớn sữa tươi trân châu đường đen, ít đường ít đá.' },
      { text: '请问可以用微信或支付宝支付吗？', reading: 'Qǐngwèn kěyǐ yòng Wēixìn huò Zhīfùbǎo zhīfù ma?', meaning: 'Xin hỏi có thể thanh toán bằng WeChat hoặc Alipay không?' },
    ],
  },

  // ── FRENCH SCENARIOS ──
  {
    id: 'rp_fr_bakery',
    title: 'Tiệm Bánh Mì Boulangerie Paris',
    description: 'Mua bánh sừng bò croissant tươi nóng hổi và bánh mì que baguette giòn rụm.',
    lang: 'fr',
    level: 'Beginner',
    category: 'Dining',
    personaName: 'Madame Dubois',
    personaRole: 'Chủ tiệm bánh gia truyền',
    avatar: '🥐',
    contextPrompt: 'Bạn là Madame Dubois, chủ tiệm bánh mì truyền thống tại Paris. Nói tiếng Pháp ấm áp, lịch sự (Bonjour/S\'il vous plaît).',
    initialMessage: 'Bonjour ! Bienvenue chez nous. Que puis-je vous servir aujourd\'hui ? Les croissants sortent tout juste du four !',
    initialMessageTranslation: 'Xin chào! Chào mừng quý khách. Tôi có thể lấy gì cho bạn hôm nay? Mẻ bánh sừng bò vừa ra lò nóng hổi đây!',
    suggestedStarters: [
      { text: 'Bonjour madame, deux croissants et une baguette tradition, s\'il vous plaît.', meaning: 'Xin chào bà, cho tôi hai chiếc croissant và một bánh mì baguette truyền thống nhé.' },
      { text: 'Est-ce que vous acceptez la carte bancaire ?', meaning: 'Bà có nhận thanh toán thẻ ngân hàng không ạ?' },
    ],
  },

  // ── GERMAN SCENARIOS ──
  {
    id: 'rp_de_hotel_checkin',
    title: 'Check-in Khách Sạn Tại Munich',
    description: 'Làm thủ tục nhận phòng, xác nhận đặt phòng và hỏi giờ phục vụ bữa sáng.',
    lang: 'de',
    level: 'Intermediate',
    category: 'Travel',
    personaName: 'Herr Weber',
    personaRole: 'Lễ tân khách sạn',
    avatar: '🏨',
    contextPrompt: 'Bạn là Herr Weber, nhân viên lễ tân khách sạn tại Munich. Nói tiếng Đức chuẩn, lịch sự (Sie-Form), chu đáo và rõ ràng.',
    initialMessage: 'Guten Tag! Herzlich willkommen im Hotel Bavaria. Wie kann ich Ihnen behilflich sein? Haben Sie eine Reservierung?',
    initialMessageTranslation: 'Kính chào quý khách! Chào mừng đến với khách sạn Bavaria. Tôi có thể giúp gì cho quý khách? Quý khách đã đặt phòng trước chưa ạ?',
    suggestedStarters: [
      { text: 'Guten Tag, ich habe ein Zimmer auf den Namen Nguyen reserviert.', meaning: 'Xin chào, tôi có đặt một phòng dưới tên Nguyen.' },
      { text: 'Ab wann gibt es morgen Früh Frühstück und wo ist der Frühstücksraum?', meaning: 'Sáng mai bữa sáng bắt đầu từ mấy giờ và phòng ăn ở đâu vậy ạ?' },
    ],
  },
];

export const ACCENT_GUIDES: Record<LanguageCode, AccentGuideRule[]> = {
  ja: [
    {
      id: 'ja_pitch_heiban',
      title: 'Mô hình Heiban (平板型 - ⓪)',
      pattern: 'Âm 1 Thấp ➔ Âm 2 trở đi Cao và giữ nguyên, trợ từ đi kèm vẫn Cao [L H H...]',
      diagram: '⓪:  _ ‾ ‾ (Nodokana)',
      mouthPosition: 'Khẩu hình mở vừa phải, giữ quai hàm ổn định, không kéo căng cơ môi quá mức. Độ cao giọng chuyển từ trầm nhẹ ở mora 1 lên âm vực cao hơn ở mora 2 và duy trì ổn định.',
      vietnameseTrap: 'Người Việt hay tự động thêm dấu sắc (´) hoặc dấu nặng (.) vào các âm tiếng Nhật khiến thanh điệu bị bẻ gãy gập ghềnh như tiếng Việt.',
      howToFix: 'Hình dung như đang ngân một nốt nhạc phẳng dài. Đọc mora 1 hơi trầm, mora 2 nhích cao lên một chút và GIỮ NGUYÊN độ cao đó đến hết từ và trợ từ (が, を, に).',
      examples: [
        { word: '桜 (さくら)', reading: 'sa-ku-ra', meaning: 'Hoa anh đào', pitchOrTone: '⓪ Heiban [L H H]' },
        { word: '日本語 (にほんご)', reading: 'ni-hon-go', meaning: 'Tiếng Nhật', pitchOrTone: '⓪ Heiban [L H H H]' },
        { word: '先生 (せんせい)', reading: 'sen-sei', meaning: 'Thầy cô giáo', pitchOrTone: '⓪ Heiban [L H H H]' },
      ],
    },
    {
      id: 'ja_pitch_atamadaka',
      title: 'Mô hình Atamadaka (頭高型 - ①)',
      pattern: 'Âm 1 Cao vọt ➔ Rơi mạnh ngay từ âm 2 trở đi [H L L...]',
      diagram: '①: ‾ _ _ (Rơi ngay sau âm đầu)',
      mouthPosition: 'Nhấn mạnh luồng hơi và độ cao giọng ngay mora đầu tiên, từ mora thứ hai buông lỏng thanh quản để cao độ rơi xuống trầm.',
      vietnameseTrap: 'Người Việt thường đọc âm 1 ngang phè hoặc đọc âm 2 cao bằng âm 1, làm người Nhật nghe nhầm sang từ khác (ví dụ: 雨 ame trời mưa [① H L] vs 飴 ame kẹo [⓪ L H]).',
      howToFix: 'Bắt đầu ở nốt Sol/La cao và thả rơi ngay xuống nốt Đồ ở âm tiếp theo. Nhớ rằng chỉ có DUY NHẤT âm đầu tiên được cao.',
      examples: [
        { word: '雨 (あめ)', reading: 'a-me', meaning: 'Cơn mưa', pitchOrTone: '① Atamadaka [H L]' },
        { word: '命 (いのち)', reading: 'i-no-chi', meaning: 'Sinh mệnh', pitchOrTone: '① Atamadaka [H L L]' },
        { word: '本 (ほん)', reading: 'hon', meaning: 'Quyển sách', pitchOrTone: '① Atamadaka [H L]' },
      ],
    },
    {
      id: 'ja_sokuon_chouon',
      title: 'Âm Ngắt (っ) & Âm Dài (ー)',
      pattern: 'Âm ngắt chiếm trọn 1 mora tĩnh lặng; Âm dài kéo đủ đúng 2 nhịp gõ',
      diagram: '[Nhịp 1] + [Khoảng ngắt 1 nhịp] + [Nhịp 2]',
      mouthPosition: 'Khi gặp chữ nhỏ っ, chặn hoàn toàn luồng hơi tại cuống họng hoặc vòm họng trong đúng 1 tích tắc (1 phách nhịp) rồi mới bật âm tiếp theo.',
      vietnameseTrap: 'Người Việt có xu hướng đọc lướt qua âm ngắt hoặc đọc dính liền nhau (ví dụ: きっと kitto bị đọc thành kito; ずっと zutto bị đọc thành zuto).',
      howToFix: 'Hãy gõ ngón tay xuống bàn: nhịp 1 đọc âm đầu, nhịp 2 gõ xuống nhưng IM LẶNG giữ hơi, nhịp 3 bật âm tiếp theo.',
      examples: [
        { word: '切符 (きっぷ)', reading: 'kip-pu', meaning: 'Vé tàu', pitchOrTone: 'Chặn hơi 1 nhịp tại môi' },
        { word: '東京 (とうきょう)', reading: 'tou-kyou', meaning: 'Tokyo', pitchOrTone: 'Kéo đủ 4 nhịp: to-o-kyo-o' },
      ],
    },
  ],

  zh: [
    {
      id: 'zh_four_tones',
      title: 'Quy Tắc 4 Thanh Điệu Tiếng Trung (四声)',
      pattern: 'Thanh 1 (55 Cao phẳng) ➔ Thanh 2 (35 Vút lên) ➔ Thanh 3 (214 Uốn cong) ➔ Thanh 4 (51 Rơi dứt khoát)',
      diagram: '1: ‾ | 2: ↗ | 3: ↘↗ | 4: ↘',
      mouthPosition: 'Thanh 1 giữ giọng cao đều không ngân rung. Thanh 4 hạ mạnh từ đỉnh cao xuống đáy như một tiếng quát dứt khoát.',
      vietnameseTrap: 'Người Việt hay lẫn lộn Thanh 4 tiếng Trung với dấu huyền (`) của tiếng Việt (dấu huyền tiếng Việt nhẹ và dài, còn Thanh 4 tiếng Trung giật mạnh và rơi gấp từ cao xuống thấp).',
      howToFix: 'Khi phát âm Thanh 4, hãy hạ cằm dứt khoát và nén bụng giống như một lệnh dứt khoát: "KHOAN!".',
      examples: [
        { word: '妈妈 (māma)', reading: 'mā-ma', meaning: 'Mẹ', pitchOrTone: 'Thanh 1 (Cao phẳng 55)' },
        { word: '麻 (má)', reading: 'má', meaning: 'Cây gai/Tê', pitchOrTone: 'Thanh 2 (Vút lên 35)' },
        { word: '马 (mǎ)', reading: 'mǎ', meaning: 'Con ngựa', pitchOrTone: 'Thanh 3 (Uốn lượn 214)' },
        { word: '骂 (mà)', reading: 'mà', meaning: 'Mắng chửi', pitchOrTone: 'Thanh 4 (Rơi mạnh 51)' },
      ],
    },
    {
      id: 'zh_curled_tongue',
      title: 'Âm Cuộn Lưỡi (zh, ch, sh, r) vs Âm Đầu Lưỡi (z, c, s)',
      pattern: 'Phân biệt rạch ròi độ uốn cong của đầu lưỡi chạm vào ngạc cứng',
      diagram: 'Uốn lưỡi chạm ngạc cứng bên trên',
      mouthPosition: 'Đầu lưỡi uốn ngược lên chạm vào vòm họng cứng phía sau nướu răng trên, giữ môi hơi tròn nhẹ.',
      vietnameseTrap: 'Đọc âm zh, ch, sh phẳng lì giống hệt z, c, s của tiếng Việt hoặc không tạo được luồng hơi ma sát cuộn lưỡi.',
      howToFix: 'Tập phát âm chữ "sh": uốn lưỡi lên trên, thổi hơi ra ngoài nghe như tiếng suỵt khẽ rồi mở miệng đọc âm.',
      examples: [
        { word: '知道 (zhīdào)', reading: 'zhī-dào', meaning: 'Biết / Hiểu rõ', pitchOrTone: 'Uốn lưỡi zh' },
        { word: '中国 (zhōngguó)', reading: 'zhōng-guó', meaning: 'Trung Quốc', pitchOrTone: 'Uốn lưỡi zh' },
      ],
    },
  ],

  en: [
    {
      id: 'en_stress_timing',
      title: 'Nhịp Điệu Trọng Âm (Stress-timed Rhythm)',
      pattern: 'Từ mang nội dung (Content words) được nhấn rõ và dài; Từ chức năng (Function words) bị rút ngắn và nhược hóa (Schwa /ə/)',
      diagram: 'DA-da-DA-da (To-nhỏ-Dài-ngắn)',
      mouthPosition: 'Thả lỏng hàm đối với các âm không nhấn, đưa nguyên âm về âm schwa trung tính /ə/. Mở rộng hàm và tăng âm lượng tại âm tiết mang trọng âm chính.',
      vietnameseTrap: 'Tiếng Việt là ngôn ngữ đẳng thời âm tiết (Syllable-timed) nên người Việt có thói quen đọc mọi từ trong câu tiếng Anh to và đều bằng nhau, làm mất nhịp điệu tự nhiên.',
      howToFix: 'Lướt nhanh các từ như "to, of, and, a, the" (đọc lướt chỉ bằng 1/3 thời gian), dồn 80% năng lượng hơi vào danh từ, động từ chính.',
      examples: [
        { word: 'Photograph', reading: '/ˈfəʊ.tə.ɡrɑːf/', meaning: 'Bức ảnh', pitchOrTone: 'Trọng âm rơi vào âm 1' },
        { word: 'Photographer', reading: '/fəˈtɒɡ.rə.fər/', meaning: 'Nhiếp ảnh gia', pitchOrTone: 'Trọng âm chuyển sang âm 2' },
      ],
    },
    {
      id: 'en_th_sounds',
      title: 'Âm Kẹp Lưỡi /θ/ & /ð/ (TH Sounds)',
      pattern: 'Đặt đầu lưỡi giữa hai hàm răng, thổi luồng hơi nhẹ qua kẽ răng',
      diagram: 'Lưỡi kẹp nhẹ giữa 2 hàng răng cửa',
      mouthPosition: 'Đưa đầu lưỡi hơi nhô ra ngoài giữa răng cửa trên và dưới. Thổi hơi ma sát (không cắn chặt làm nghẽn hơi).',
      vietnameseTrap: 'Người Việt hay thay âm /θ/ bằng âm "th" tiếng Việt (bật hơi trong miệng) hoặc thay /ð/ bằng chữ "d/đ" tiếng Việt.',
      howToFix: 'Nhìn vào gương: nếu không nhìn thấy đầu lưỡi nhô ra khỏi răng thì chắc chắn là bạn đang phát âm sai.',
      examples: [
        { word: 'Think', reading: '/θɪŋk/', meaning: 'Suy nghĩ', pitchOrTone: 'Âm /θ/ vô thanh' },
        { word: 'This / That', reading: '/ðɪs/ /ðæt/', meaning: 'Cái này / Cái kia', pitchOrTone: 'Âm /ð/ hữu thanh rung dây thanh' },
      ],
    },
  ],

  ko: [
    {
      id: 'ko_three_consonants',
      title: 'Hệ Thống 3 Bậc Phụ Âm (Thường - Bật hơi - Căng)',
      pattern: 'ㄱ (Thường) ➔ ㅋ (Bật hơi mạnh) ➔ ㄲ (Căng cơ cổ họng nén hơi)',
      diagram: 'Thường (bình thản) | Bật hơi (phù luồng hơi) | Căng (nén họng)',
      mouthPosition: 'Với âm căng (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ), gồng cứng cơ thanh quản, nén hơi lại và bật ra không có luồng gió.',
      vietnameseTrap: 'Người Việt hay phát âm âm căng giống hệt âm thường hoặc âm bật hơi, làm người Hàn nghe không phân biệt được nghĩa.',
      howToFix: 'Đặt tờ giấy trước miệng: Khi phát âm âm bật hơi (ㅋ, ㅍ, ㅌ), tờ giấy phải bay mạnh. Khi phát âm âm căng (ㄲ, ㅃ, ㄸ), tờ giấy hoàn toàn KHÔNG ĐƯỢC rung.',
      examples: [
        { word: '달 (dal)', reading: 'dal', meaning: 'Mặt trăng', pitchOrTone: 'Âm thường ㄷ' },
        { word: '탈 (tal)', reading: 'tal', meaning: 'Mặt nạ', pitchOrTone: 'Âm bật hơi ㅌ' },
        { word: '딸 (ttal)', reading: 'ttal', meaning: 'Con gái', pitchOrTone: 'Âm căng ㄸ' },
      ],
    },
  ],

  fr: [
    {
      id: 'fr_r_uvular',
      title: 'Âm R Họng Rung Nhẹ /ʁ/ (R Uvulaire)',
      pattern: 'Rung nhẹ tại lưỡi gà cuống họng, tuyệt đối không rung đầu lưỡi',
      diagram: 'Rung tại cuống họng sâu phía trong',
      mouthPosition: 'Phần cuống lưỡi nâng nhẹ chạm gần vào lưỡi gà, tạo luồng hơi ma sát êm như đang súc miệng nhẹ bằng nước.',
      vietnameseTrap: 'Người Việt hay phát âm chữ R tiếng Pháp thành chữ "R" tiếng Việt hoặc "G" cứng.',
      howToFix: 'Ngửa cổ giả vờ súc họng khẽ "khhh", sau đó giữ đúng vị trí đó để phát âm chữ R.',
      examples: [
        { word: 'Paris', reading: '/pa.ʁi/', meaning: 'Thủ đô Paris', pitchOrTone: 'Âm R cuống họng' },
        { word: 'Merci', reading: '/mɛʁ.si/', meaning: 'Cảm ơn', pitchOrTone: 'Âm R êm nhẹ' },
      ],
    },
  ],

  de: [
    {
      id: 'de_ich_ach',
      title: 'Phân Biệt Âm CH Mềm [ç] & CH Cứng [x]',
      pattern: 'Sau nguyên âm trước (e, i, ä, ö, ü) đọc âm mềm [ç]; Sau nguyên âm sau (a, o, u) đọc âm cứng [x]',
      diagram: 'Ich-Laut (tiếng gió rì rào) vs Ach-Laut (khạc nhẹ ở cuống họng)',
      mouthPosition: 'Âm Ich-Laut: Mặt lưỡi dẹt dâng lên gần vòm miệng cứng, thổi hơi như tiếng mèo thở phì. Âm Ach-Laut: Cuống lưỡi lùi về sau ma sát gần lưỡi gà.',
      vietnameseTrap: 'Người Việt đọc cả hai âm thành âm "kh" tiếng Việt hoặc âm "k".',
      howToFix: 'Khi đọc "ich", khóe môi kéo nhẹ sang hai bên cười mỉm và đẩy luồng hơi êm.',
      examples: [
        { word: 'Ich', reading: '/ɪç/', meaning: 'Tôi', pitchOrTone: 'Âm mềm Ich-Laut [ç]' },
        { word: 'Nacht', reading: '/naxt/', meaning: 'Đêm', pitchOrTone: 'Âm cứng Ach-Laut [x]' },
      ],
    },
  ],

  // Fallback defaults for other languages
  vi: [
    {
      id: 'vi_six_tones',
      title: 'Hệ Thống 6 Thanh Điệu Tiếng Việt',
      pattern: 'Ngang, Huyền, Sắc, Hỏi, Ngã, Nặng',
      diagram: 'Ngang ➔ Xuống ➔ Lên ➔ Uốn gãy ➔ Rơi nặng',
      mouthPosition: 'Thanh Ngã đòi hỏi ngắt thanh quản nửa chừng rồi vút lên cao.',
      vietnameseTrap: 'Người nước ngoài học tiếng Việt hay nhầm dấu hỏi và dấu ngã.',
      howToFix: 'Luyện tập ngắt giọng ở giữa âm tiết khi phát âm dấu ngã.',
      examples: [
        { word: 'Ma, Má, Mà, Mả, Mã, Mạ', reading: 'ma, má, mà, mả, mã, mạ', meaning: 'Các thanh điệu cơ bản', pitchOrTone: '6 thanh điệu chuẩn' },
      ],
    },
  ],
  ru: [],
  es: [],
  it: [],
  pt: [],
};
