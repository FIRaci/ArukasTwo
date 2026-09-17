// ============================================================
//  ALPHABET & WRITING SYSTEMS DATA — ARUKAS 2
//  Comprehensive Reference for 11 World Languages
// ============================================================

import { LanguageCode } from '../types';

export interface AlphabetCharacter {
  char: string;
  name?: string;
  reading?: string; // Transcription / Pinyin / Romaji / IPA
  meaningOrExample?: string;
  category?: string;
}

export interface WritingSystemSection {
  title: string;
  description?: string;
  characters: AlphabetCharacter[];
}

export interface LanguageAlphabetGuide {
  lang: LanguageCode;
  title: string;
  systemType: string;
  description: string;
  sections: WritingSystemSection[];
}

export const ALPHABET_GUIDES: Record<LanguageCode, LanguageAlphabetGuide> = {
  // ────────────────── VIỆT NAM ──────────────────
  vi: {
    lang: 'vi',
    title: 'Hệ Thống Chữ Quốc Ngữ (Tiếng Việt)',
    systemType: 'Bảng chữ cái Latinh mở rộng kèm thanh điệu',
    description: 'Chữ Quốc ngữ gồm 29 chữ cái chính thức, 5 dấu thanh điệu, các phụ âm ghép và nguyên âm đôi.',
    sections: [
      {
        title: 'Bảng 29 Chữ Cái',
        description: 'Chữ in hoa, chữ thường và tên gọi chuẩn theo Bộ Giáo Dục.',
        characters: [
          { char: 'A a', name: 'A', reading: '/aː/', meaningOrExample: 'An toàn, Áo' },
          { char: 'Ă ă', name: 'Á', reading: '/a/', meaningOrExample: 'Ăn cơm, Mặt trăng' },
          { char: 'Â â', name: 'Ớ', reading: '/ɜ/', meaningOrExample: 'Ấm áp, Cây cối' },
          { char: 'B b', name: 'Bê', reading: '/ɓ/', meaningOrExample: 'Bạn bè, Bầu trời' },
          { char: 'C c', name: 'Xê', reading: '/k/', meaningOrExample: 'Con cá, Cười' },
          { char: 'D d', name: 'Dê', reading: '/z/ (B) /j/ (N)', meaningOrExample: 'Dịu dàng, Dòng sông' },
          { char: 'Đ đ', name: 'Đê', reading: '/ɗ/', meaningOrExample: 'Đường đi, Đất nước' },
          { char: 'E e', name: 'E', reading: '/ɛ/', meaningOrExample: 'Em bé, Mẹ' },
          { char: 'Ê ê', name: 'Ê', reading: '/e/', meaningOrExample: 'Êm đềm, Bếp' },
          { char: 'G g', name: 'Giê', reading: '/ɣ/', meaningOrExample: 'Gần gũi, Gió' },
          { char: 'H h', name: 'Hát', reading: '/h/', meaningOrExample: 'Hạnh phúc, Hoa' },
          { char: 'I i', name: 'I ngắn', reading: '/i/', meaningOrExample: 'Im lặng, Trí tuệ' },
          { char: 'K k', name: 'Ca', reading: '/k/', meaningOrExample: 'Kính yêu, Kim' },
          { char: 'L l', name: 'E-lờ', reading: '/l/', meaningOrExample: 'Lung linh, Lòng' },
          { char: 'M m', name: 'Em-mờ', reading: '/m/', meaningOrExample: 'Mặt trời, Mùa xuân' },
          { char: 'N n', name: 'En-nờ', reading: '/n/', meaningOrExample: 'Nụ cười, Nắng' },
          { char: 'O o', name: 'O', reading: '/ɔ/', meaningOrExample: 'Ong bướm, Trong veo' },
          { char: 'Ô ô', name: 'Ô', reading: '/o/', meaningOrExample: 'Ô che mưa, Tổ quốc' },
          { char: 'Ơ ơ', name: 'Ơ', reading: '/əː/', meaningOrExample: 'Ơn nghĩa, Lá cờ' },
          { char: 'P p', name: 'Pê', reading: '/p/', meaningOrExample: 'Phố xá, Phép màu' },
          { char: 'Q q', name: 'Quy', reading: '/k/', meaningOrExample: 'Quê hương, Quả' },
          { char: 'R r', name: 'E-rờ', reading: '/z/ (B) /ʐ/ (N)', meaningOrExample: 'Rực rỡ, Rừng' },
          { char: 'S s', name: 'Ét-xì', reading: '/s/ (B) /ʂ/ (N)', meaningOrExample: 'Sáng suốt, Sóng' },
          { char: 'T t', name: 'Tê', reading: '/t/', meaningOrExample: 'Tương lai, Tình yêu' },
          { char: 'U u', name: 'U', reading: '/u/', meaningOrExample: 'Uống nước, Củi' },
          { char: 'Ư ư', name: 'Ư', reading: '/ɨ/', meaningOrExample: 'Ước mơ, Mưa' },
          { char: 'V v', name: 'Vê', reading: '/v/', meaningOrExample: 'Vui vẻ, Vườn' },
          { char: 'X x', name: 'Ích-xì', reading: '/s/', meaningOrExample: 'Xinh đẹp, Xe' },
          { char: 'Y y', name: 'I dài', reading: '/i/', meaningOrExample: 'Yêu thương, Ý chí' },
        ],
      },
      {
        title: '5 Dấu Thanh Điệu & Thanh Ngang',
        description: 'Tiếng Việt có 6 thanh điệu (kể cả thanh Không Dấu).',
        characters: [
          { char: 'Không dấu', name: 'Thanh Ngang', reading: 'Bằng phẳng (Cao vừa)', meaningOrExample: 'ba (người cha)' },
          { char: 'Dấu Huyền ( ` )', name: 'Thanh Huyền', reading: 'Hạ thấp dần', meaningOrExample: 'bà (người bà)' },
          { char: 'Dấu Sắc ( ´ )', name: 'Thanh Sắc', reading: 'Lên cao dốc', meaningOrExample: 'bá (bác, bá tước)' },
          { char: 'Dấu Hỏi ( ˀ )', name: 'Thanh Hỏi', reading: 'Xuống rồi lên', meaningOrExample: 'bả (mồi bả)' },
          { char: 'Dấu Ngã ( ~ )', name: 'Thanh Ngã', reading: 'Gãy ở giữa, lên cao', meaningOrExample: 'bã (bã trà)' },
          { char: 'Dấu Nặng ( . )', name: 'Thanh Nặng', reading: 'Hạ thấp dứt khoát', meaningOrExample: 'bạ (bừa bãi)' },
        ],
      },
      {
        title: '11 Cụm Phụ Âm Ghép',
        description: 'Các phụ âm ghép đại diện cho một âm tố duy nhất.',
        characters: [
          { char: 'CH', reading: '/c/', meaningOrExample: 'Chim chóc, Chân thật' },
          { char: 'GH', reading: '/ɣ/', meaningOrExample: 'Ghi nhớ, Ghế gỗ' },
          { char: 'GI', reading: '/z/ (B) /j/ (N)', meaningOrExample: 'Gió mát, Gia đình' },
          { char: 'KH', reading: '/x/', meaningOrExample: 'Khát khao, Khéo léo' },
          { char: 'NH', reading: '/ɲ/', meaningOrExample: 'Nhẹ nhàng, Nhớ nhung' },
          { char: 'NG / NGH', reading: '/ŋ/', meaningOrExample: 'Ngọt ngào, Nghĩ suy' },
          { char: 'PH', reading: '/f/', meaningOrExample: 'Phương trời, Phiêu lưu' },
          { char: 'QU', reading: '/kʷ/', meaningOrExample: 'Quê hương, Quý báu' },
          { char: 'TH', reading: '/tʰ/', meaningOrExample: 'Thanh bình, Tha thứ' },
          { char: 'TR', reading: '/c/ (B) /ʈ/ (N)', meaningOrExample: 'Trong sáng, Tre xanh' },
        ],
      },
    ],
  },

  // ────────────────── NHẬT BẢN ──────────────────
  ja: {
    lang: 'ja',
    title: 'Hệ Thống Chữ Viết Tiếng Nhật',
    systemType: 'Bộ ba chữ viết: Hiragana, Katakana và Kanji',
    description: 'Bao gồm 46 ký tự Hiragana (chữ mềm), 46 ký tự Katakana (chữ cứng), âm đục, bán đục và âm ghép.',
    sections: [
      {
        title: 'Hiragana Cơ Bản (46 Chữ Căn Bản)',
        description: 'Dùng cho ngữ pháp, trợ từ và từ thuần Nhật.',
        characters: [
          { char: 'あ', reading: 'a', meaningOrExample: '朝 (asa - buổi sáng)' },
          { char: 'い', reading: 'i', meaningOrExample: '犬 (inu - con chó)' },
          { char: 'う', reading: 'u', meaningOrExample: '海 (umi - biển)' },
          { char: 'え', reading: 'e', meaningOrExample: '駅 (eki - nhà ga)' },
          { char: 'お', reading: 'o', meaningOrExample: 'お茶 (ocha - trà)' },
          { char: 'か', reading: 'ka', meaningOrExample: '傘 (kasa - chiếc ô)' },
          { char: 'き', reading: 'ki', meaningOrExample: '木 (ki - cái cây)' },
          { char: 'く', reading: 'ku', meaningOrExample: '車 (kuruma - xe hơi)' },
          { char: 'け', reading: 'ke', meaningOrExample: '煙 (kemuri - khói)' },
          { char: 'こ', reading: 'ko', meaningOrExample: '声 (koe - giọng nói)' },
          { char: 'さ', reading: 'sa', meaningOrExample: '桜 (sakura - hoa anh đào)' },
          { char: 'し', reading: 'shi', meaningOrExample: '白 (shiro - màu trắng)' },
          { char: 'す', reading: 'su', meaningOrExample: '寿司 (sushi)' },
          { char: 'せ', reading: 'se', meaningOrExample: '世界 (sekai - thế giới)' },
          { char: 'そ', reading: 'so', meaningOrExample: '空 (sora - bầu trời)' },
          { char: 'た', reading: 'ta', meaningOrExample: '太陽 (taiyou - mặt trời)' },
          { char: 'ち', reading: 'chi', meaningOrExample: '父 (chichi - người cha)' },
          { char: 'つ', reading: 'tsu', meaningOrExample: '月 (tsuki - mặt trăng)' },
          { char: 'て', reading: 'te', meaningOrExample: '手 (te - bàn tay)' },
          { char: 'と', reading: 'to', meaningOrExample: '友達 (tomodachi - bạn bè)' },
          { char: 'な', reading: 'na', meaningOrExample: '夏 (natsu - mùa hè)' },
          { char: 'に', reading: 'ni', meaningOrExample: '虹 (niji - cầu vồng)' },
          { char: 'ぬ', reading: 'nu', meaningOrExample: '布 (nuno - tấm vải)' },
          { char: 'ね', reading: 'ne', meaningOrExample: '猫 (neko - con mèo)' },
          { char: 'の', reading: 'no', meaningOrExample: '野原 (nohara - cánh đồng)' },
          { char: 'は', reading: 'ha', meaningOrExample: '花 (hana - bông hoa)' },
          { char: 'ひ', reading: 'hi', meaningOrExample: '光 (hikari - ánh sáng)' },
          { char: 'ふ', reading: 'fu', meaningOrExample: '冬 (fuyu - mùa đông)' },
          { char: 'へ', reading: 'he', meaningOrExample: '平和 (heiwa - hòa bình)' },
          { char: 'ほ', reading: 'ho', meaningOrExample: '星 (hoshi - ngôi sao)' },
          { char: 'ま', reading: 'ma', meaningOrExample: '街 (machi - thành phố)' },
          { char: 'み', reading: 'mi', meaningOrExample: '道 (michi - con đường)' },
          { char: 'む', reading: 'mu', meaningOrExample: '村 (mura - ngôi làng)' },
          { char: 'め', reading: 'me', meaningOrExample: '目 (me - đôi mắt)' },
          { char: 'も', reading: 'mo', meaningOrExample: '森 (mori - khu rừng)' },
          { char: 'や', reading: 'ya', meaningOrExample: '山 (yama - ngọn núi)' },
          { char: 'ゆ', reading: 'yu', meaningOrExample: '雪 (yuki - tuyết trắng)' },
          { char: 'よ', reading: 'yo', meaningOrExample: '夜 (yoru - đêm tối)' },
          { char: 'ら', reading: 'ra', meaningOrExample: '雷 (kaminari - sấm sét)' },
          { char: 'り', reading: 'ri', meaningOrExample: '林檎 (ringo - quả táo)' },
          { char: 'る', reading: 'ru', meaningOrExample: '留守 (rusu - vắng nhà)' },
          { char: 'れ', reading: 're', meaningOrExample: '歴史 (rekishi - lịch sử)' },
          { char: 'ろ', reading: 'ro', meaningOrExample: '蝋燭 (rousoku - cây nến)' },
          { char: 'わ', reading: 'wa', meaningOrExample: '私 (watashi - tôi)' },
          { char: 'を', reading: 'wo (o)', meaningOrExample: 'Trợ từ tân ngữ' },
          { char: 'ん', reading: 'n', meaningOrExample: '本 (hon - cuốn sách)' },
        ],
      },
      {
        title: 'Katakana Cơ Bản (Chữ Cứng)',
        description: 'Dùng cho từ mượn ngoại lai, tên riêng nước ngoài và từ tượng thanh onomatopoeia.',
        characters: [
          { char: 'ア', reading: 'a', meaningOrExample: 'アイス (aisu - kem)' },
          { char: 'イ', reading: 'i', meaningOrExample: 'インターネット (internet)' },
          { char: 'ウ', reading: 'u', meaningOrExample: 'ウイスキー (whisky)' },
          { char: 'エ', reading: 'e', meaningOrExample: 'エネルギー (energy)' },
          { char: 'オ', reading: 'o', meaningOrExample: 'オレンジ (orange)' },
          { char: 'カ', reading: 'ka', meaningOrExample: 'カメラ (camera)' },
          { char: 'キ', reading: 'ki', meaningOrExample: 'キーボード (keyboard)' },
          { char: 'ク', reading: 'ku', meaningOrExample: 'クラス (class)' },
          { char: 'ケ', reading: 'ke', meaningOrExample: 'ケーキ (cake)' },
          { char: 'コ', reading: 'ko', meaningOrExample: 'コーヒー (coffee)' },
          { char: 'サ', reading: 'sa', meaningOrExample: 'サラダ (salad)' },
          { char: 'シ', reading: 'shi', meaningOrExample: 'シャツ (shirt)' },
          { char: 'ス', reading: 'su', meaningOrExample: 'スポーツ (sports)' },
          { char: 'セ', reading: 'se', meaningOrExample: 'センター (center)' },
          { char: 'ソ', reading: 'so', meaningOrExample: 'ソファー (sofa)' },
        ],
      },
    ],
  },

  // ────────────────── HÀN QUỐC ──────────────────
  ko: {
    lang: 'ko',
    title: 'Hệ Thống Chữ Viết Hangeul (Tiếng Hàn)',
    systemType: 'Bảng chữ cái tượng hình âm vị (Phụ âm + Nguyên âm)',
    description: 'Chữ Hangeul do vua Sejong sáng chế năm 1443, gồm 19 phụ âm và 21 nguyên âm ghép thành các khối âm tiết vuông vức.',
    sections: [
      {
        title: '14 Phụ Âm Cơ Bản (자음)',
        description: 'Tượng hình theo cấu trúc cơ quan phát âm (lưỡi, môi, răng, họng).',
        characters: [
          { char: 'ㄱ', name: 'Giyeok', reading: 'g / k', meaningOrExample: '가방 (gabang - chiếc cặp)' },
          { char: 'ㄴ', name: 'Nieun', reading: 'n', meaningOrExample: '나무 (namu - cái cây)' },
          { char: 'ㄷ', name: 'Digeut', reading: 'd / t', meaningOrExample: '다리 (dari - cây cầu, đôi chân)' },
          { char: 'ㄹ', name: 'Rieul', reading: 'r / l', meaningOrExample: '라면 (ramyeon - mì gói)' },
          { char: 'ㅁ', name: 'Mieum', reading: 'm', meaningOrExample: '마음 (ma-eum - tấm lòng)' },
          { char: 'ㅂ', name: 'Bieup', reading: 'b / p', meaningOrExample: '바다 (bada - biển cả)' },
          { char: 'ㅅ', name: 'Siot', reading: 's', meaningOrExample: '사랑 (sarang - tình yêu)' },
          { char: 'ㅇ', name: 'Ieung', reading: 'câm / ng (ở cuối)', meaningOrExample: '아이 (a-i - đứa trẻ), 강 (gang - con sông)' },
          { char: 'ㅈ', name: 'Jieut', reading: 'j / ch', meaningOrExample: '자유 (jayu - tự do)' },
          { char: 'ㅊ', name: 'Chieut', reading: 'ch (bật hơi)', meaningOrExample: '친구 (chingu - bạn bè)' },
          { char: 'ㅋ', name: 'Kieuk', reading: 'k (bật hơi)', meaningOrExample: '커피 (keopi - cà phê)' },
          { char: 'ㅌ', name: 'Tieut', reading: 't (bật hơi)', meaningOrExample: '태양 (taeyang - mặt trời)' },
          { char: 'ㅍ', name: 'Pieup', reading: 'p (bật hơi)', meaningOrExample: '포도 (podo - chùm nho)' },
          { char: 'ㅎ', name: 'Hieut', reading: 'h', meaningOrExample: '하늘 (haneul - bầu trời)' },
        ],
      },
      {
        title: '5 Phụ Âm Kép / Âm Căng (쌍자음)',
        description: 'Phát âm nhấn mạnh, giữ chặt cổ họng không bật hơi.',
        characters: [
          { char: 'ㄲ', name: 'Ssang-giyeok', reading: 'kk', meaningOrExample: '꽃 (kkot - bông hoa)' },
          { char: 'ㄸ', name: 'Ssang-digeut', reading: 'tt', meaningOrExample: '떡 (tteok - bánh gạo)' },
          { char: 'ㅃ', name: 'Ssang-bieup', reading: 'pp', meaningOrExample: '빵 (ppang - bánh mì)' },
          { char: 'ㅆ', name: 'Ssang-siot', reading: 'ss', meaningOrExample: '쌀 (ssal - hạt gạo)' },
          { char: 'ㅉ', name: 'Ssang-jieut', reading: 'jj', meaningOrExample: '짜장면 (jjajangmyeon - mì tương đen)' },
        ],
      },
      {
        title: '10 Nguyên Âm Cơ Bản (모음)',
        description: 'Tượng trưng cho Trời (•), Đất (ㅡ) và Người (ㅣ).',
        characters: [
          { char: 'ㅏ', name: 'A', reading: 'a', meaningOrExample: '아버지 (abeoji - người cha)' },
          { char: 'ㅑ', name: 'Ya', reading: 'ya', meaningOrExample: '야구 (yagu - bóng chày)' },
          { char: 'ㅓ', name: 'Eo', reading: 'ơ / o', meaningOrExample: '어머니 (eomeoni - người mẹ)' },
          { char: 'ㅕ', name: 'Yeo', reading: 'yơ / yo', meaningOrExample: '여름 (yeoreum - mùa hè)' },
          { char: 'ㅗ', name: 'O', reading: 'ô', meaningOrExample: '오빠 (oppa - anh trai)' },
          { char: 'ㅛ', name: 'Yo', reading: 'yô', meaningOrExample: '요리 (yori - nấu ăn)' },
          { char: 'ㅜ', name: 'U', reading: 'u', meaningOrExample: '우유 (uyu - sữa tươi)' },
          { char: 'ㅠ', name: 'Yu', reading: 'yu', meaningOrExample: '유리 (yuri - thủy tinh)' },
          { char: 'ㅡ', name: 'Eu', reading: 'ư', meaningOrExample: '음악 (eum-ak - âm nhạc)' },
          { char: 'ㅣ', name: 'I', reading: 'i', meaningOrExample: '이름 (ireum - tên gọi)' },
        ],
      },
    ],
  },

  // ────────────────── TRUNG QUỐC ──────────────────
  zh: {
    lang: 'zh',
    title: 'Hệ Thống Pinyin & Chữ Hán (Tiếng Trung)',
    systemType: 'Chữ biểu ý (Hán tự) kèm phiên âm Latinh (Pinyin)',
    description: 'Bao gồm 21 thanh mẫu (phụ âm đầu), 36 vận mẫu (nguyên âm/vần) và 4 thanh điệu chuẩn Bắc Kinh.',
    sections: [
      {
        title: '4 Thanh Điệu Pinyin & Thanh Nhẹ',
        description: 'Thanh điệu thay đổi sẽ đổi hoàn toàn nghĩa của từ.',
        characters: [
          { char: 'ā (Thanh 1)', name: 'Âm bình', reading: 'Cao, phẳng (55)', meaningOrExample: 'mā (妈 - mẹ)' },
          { char: 'á (Thanh 2)', name: 'Dương bình', reading: 'Từ trung lên cao (35)', meaningOrExample: 'má (麻 - cây gai)' },
          { char: 'ǎ (Thanh 3)', name: 'Thượng thanh', reading: 'Xuống thấp rồi lên (214)', meaningOrExample: 'mǎ (马 - con ngựa)' },
          { char: 'à (Thanh 4)', name: 'Khứ thanh', reading: 'Rơi dứt khoát (51)', meaningOrExample: 'mà (骂 - mắng mỏ)' },
          { char: 'ma (Thanh nhẹ)', name: 'Khinh thanh', reading: 'Ngắn, nhẹ', meaningOrExample: 'ma (吗 - từ để hỏi)' },
        ],
      },
      {
        title: '21 Thanh Mẫu (Phụ Âm Đầu - 声母)',
        description: 'Các phụ âm mở đầu âm tiết trong tiếng phổ thông.',
        characters: [
          { char: 'b', reading: '[p] (pô)', meaningOrExample: '爸爸 (bàba - cha)' },
          { char: 'p', reading: '[pʰ] (pô bật hơi)', meaningOrExample: '朋友 (péngyou - bạn bè)' },
          { char: 'm', reading: '[m] (mô)', meaningOrExample: '妈妈 (māma - mẹ)' },
          { char: 'f', reading: '[f] (phô)', meaningOrExample: '飞机 (fēijī - máy bay)' },
          { char: 'd', reading: '[t] (tưa)', meaningOrExample: '大地 (dàdì - đại địa)' },
          { char: 't', reading: '[tʰ] (thưa bật hơi)', meaningOrExample: '太阳 (tàiyáng - mặt trời)' },
          { char: 'n', reading: '[n] (nưa)', meaningOrExample: '南方 (nánfāng - phương nam)' },
          { char: 'l', reading: '[l] (lưa)', meaningOrExample: '老师 (lǎoshī - giáo viên)' },
          { char: 'g', reading: '[k] (cưa)', meaningOrExample: '国家 (guójiā - quốc gia)' },
          { char: 'k', reading: '[kʰ] (khưa bật hơi)', meaningOrExample: '开心 (kāixīn - vui vẻ)' },
          { char: 'h', reading: '[x] (hưa/khưa nhẹ)', meaningOrExample: '和平 (hépíng - hòa bình)' },
          { char: 'j', reading: '[tɕ] (chi)', meaningOrExample: '今天 (jīntiān - hôm nay)' },
          { char: 'q', reading: '[tɕʰ] (chi bật hơi)', meaningOrExample: '青春 (qīngchūn - thanh xuân)' },
          { char: 'x', reading: '[ɕ] (xi)', meaningOrExample: '希望 (xīwàng - hy vọng)' },
          { char: 'zh', reading: '[ʈʂ] (tr- uốn lưỡi)', meaningOrExample: '中国 (zhōngguó - Trung Quốc)' },
          { char: 'ch', reading: '[ʈʂʰ] (tr- bật hơi)', meaningOrExample: '春风 (chūnfēng - gió xuân)' },
          { char: 'sh', reading: '[ʂ] (s- uốn lưỡi)', meaningOrExample: '山水 (shānshuǐ - non nước)' },
          { char: 'r', reading: '[ʐ] (r- uốn lưỡi)', meaningOrExample: '热情 (rèqíng - nhiệt tình)' },
          { char: 'z', reading: '[ts] (ch- thẳng lưỡi)', meaningOrExample: '自己 (zìjǐ - tự mình)' },
          { char: 'c', reading: '[tsʰ] (ch- bật hơi)', meaningOrExample: '彩虹 (cǎihóng - cầu vồng)' },
          { char: 's', reading: '[s] (x- thẳng lưỡi)', meaningOrExample: '森林 (sēnlín - rừng rậm)' },
        ],
      },
    ],
  },

  // ────────────────── NGA ──────────────────
  ru: {
    lang: 'ru',
    title: 'Bảng Chữ Cái Kỉ-rin (Tiếng Nga)',
    systemType: 'Bảng chữ cái Cyrillic (Кириллица)',
    description: 'Bao gồm 33 chữ cái: 10 nguyên âm, 21 phụ âm và 2 dấu biểu âm (dấu cứng Ъ và dấu mềm Ь).',
    sections: [
      {
        title: '33 Ký Tự Cyrillic',
        description: 'Chữ in, cách đọc và ví dụ tiêu biểu trong văn học Nga.',
        characters: [
          { char: 'А а', reading: '[a]', meaningOrExample: 'Август (tháng Tám)' },
          { char: 'Б б', reading: '[b]', meaningOrExample: 'Брат (người anh/em)' },
          { char: 'В в', reading: '[v]', meaningOrExample: 'Весна (mùa xuân)' },
          { char: 'Г г', reading: '[g]', meaningOrExample: 'Город (thành phố)' },
          { char: 'Д д', reading: '[d]', meaningOrExample: 'Друг (người bạn)' },
          { char: 'Е е', reading: '[je] / [e]', meaningOrExample: 'Европа (Châu Âu)' },
          { char: 'Ё ё', reading: '[jo]', meaningOrExample: 'Ёлка (cây thông)' },
          { char: 'Ж ж', reading: '[ʐ] (r/dzh)', meaningOrExample: 'Жизнь (cuộc sống)' },
          { char: 'З з', reading: '[z]', meaningOrExample: 'Звезда (ngôi sao)' },
          { char: 'И и', reading: '[i]', meaningOrExample: 'История (lịch sử)' },
          { char: 'Й й', reading: '[j] (i ngắn)', meaningOrExample: 'Музей (bảo tàng)' },
          { char: 'К к', reading: '[k]', meaningOrExample: 'Книга (cuốn sách)' },
          { char: 'Л л', reading: '[l]', meaningOrExample: 'Любовь (tình yêu)' },
          { char: 'М м', reading: '[m]', meaningOrExample: 'Мир (thế giới, hòa bình)' },
          { char: 'Н н', reading: '[n]', meaningOrExample: 'Небо (bầu trời)' },
          { char: 'О о', reading: '[o] (nhấn) / [a] (không nhấn)', meaningOrExample: 'Окно (cửa sổ)' },
          { char: 'П п', reading: '[p]', meaningOrExample: 'Правда (sự thật)' },
          { char: 'Р р', reading: '[r] (rung lưỡi)', meaningOrExample: 'Россия (nước Nga)' },
          { char: 'С с', reading: '[s]', meaningOrExample: 'Солнце (mặt trời)' },
          { char: 'Т т', reading: '[t]', meaningOrExample: 'Театр (nhà hát)' },
          { char: 'У у', reading: '[u]', meaningOrExample: 'Улыбка (nụ cười)' },
          { char: 'Ф ф', reading: '[f]', meaningOrExample: 'Фотография (bức ảnh)' },
          { char: 'Х х', reading: '[x] (kh)', meaningOrExample: 'Хлеб (bánh mì)' },
          { char: 'Ц ц', reading: '[ts]', meaningOrExample: 'Цветок (bông hoa)' },
          { char: 'Ч ч', reading: '[tɕ] (ch mềm)', meaningOrExample: 'Чай (tách trà)' },
          { char: 'Ш ш', reading: '[ʂ] (s cứng)', meaningOrExample: 'Школа (trường học)' },
          { char: 'Щ щ', reading: '[ɕː] (shch mềm)', meaningOrExample: 'Щедрость (hào phóng)' },
          { char: 'Ъ ъ', reading: 'Dấu cứng (ngăn cách)', meaningOrExample: 'Объект (đối tượng)' },
          { char: 'Ы ы', reading: '[ɨ] (ư/i dày)', meaningOrExample: 'Музыка (âm nhạc)' },
          { char: 'Ь ь', reading: 'Dấu mềm (làm mềm phụ âm)', meaningOrExample: 'День (ngày)' },
          { char: 'Э э', reading: '[ɛ]', meaningOrExample: 'Эпоха (thời đại)' },
          { char: 'Ю ю', reading: '[ju]', meaningOrExample: 'Юность (tuổi trẻ)' },
          { char: 'Я я', reading: '[ja]', meaningOrExample: 'Яблоко (quả táo)' },
        ],
      },
    ],
  },

  // ────────────────── ANH ──────────────────
  en: {
    lang: 'en',
    title: 'Bảng Chữ Cái & Phiên Âm IPA (Tiếng Anh)',
    systemType: 'Bảng chữ cái Latinh & Bảng phiên âm quốc tế IPA',
    description: '26 chữ cái Latinh chuẩn kết hợp 44 âm vị IPA (20 nguyên âm, 24 phụ âm).',
    sections: [
      {
        title: 'Bảng 26 Chữ Cái Latinh',
        description: 'Tên chữ cái và phiên âm quốc tế.',
        characters: [
          { char: 'A a', reading: '/eɪ/', meaningOrExample: 'Apple, Air' },
          { char: 'B b', reading: '/biː/', meaningOrExample: 'Brave, Blue' },
          { char: 'C c', reading: '/siː/', meaningOrExample: 'Calm, City' },
          { char: 'D d', reading: '/diː/', meaningOrExample: 'Dream, Dawn' },
          { char: 'E e', reading: '/iː/', meaningOrExample: 'Echo, Earth' },
          { char: 'F f', reading: '/ɛf/', meaningOrExample: 'Flame, Freedom' },
          { char: 'G g', reading: '/dʒiː/', meaningOrExample: 'Grace, Green' },
          { char: 'H h', reading: '/eɪtʃ/', meaningOrExample: 'Hope, Horizon' },
          { char: 'I i', reading: '/aɪ/', meaningOrExample: 'Island, Idea' },
          { char: 'J j', reading: '/dʒeɪ/', meaningOrExample: 'Joy, Journey' },
          { char: 'K k', reading: '/keɪ/', meaningOrExample: 'Kind, King' },
          { char: 'L l', reading: '/ɛl/', meaningOrExample: 'Light, Leaf' },
          { char: 'M m', reading: '/ɛm/', meaningOrExample: 'Moon, Music' },
          { char: 'N n', reading: '/ɛn/', meaningOrExample: 'Nature, Night' },
          { char: 'O o', reading: '/oʊ/', meaningOrExample: 'Ocean, Open' },
          { char: 'P p', reading: '/piː/', meaningOrExample: 'Peace, Poem' },
          { char: 'Q q', reading: '/kjuː/', meaningOrExample: 'Quiet, Quest' },
          { char: 'R r', reading: '/ɑːr/', meaningOrExample: 'Rain, River' },
          { char: 'S s', reading: '/ɛs/', meaningOrExample: 'Sun, Spirit' },
          { char: 'T t', reading: '/tiː/', meaningOrExample: 'Truth, Time' },
          { char: 'U u', reading: '/juː/', meaningOrExample: 'Universe, Unity' },
          { char: 'V v', reading: '/viː/', meaningOrExample: 'Voice, Valley' },
          { char: 'W w', reading: '/ˈdʌbəl.juː/', meaningOrExample: 'Water, Wind' },
          { char: 'X x', reading: '/ɛks/', meaningOrExample: 'Xylophone' },
          { char: 'Y y', reading: '/waɪ/', meaningOrExample: 'Youth, Year' },
          { char: 'Z z', reading: '/zɛd/ /ziː/', meaningOrExample: 'Zephyr, Zen' },
        ],
      },
      {
        title: 'Các Nguyên Âm IPA Đặc Trưng',
        description: 'Các âm ngắn, dài và nguyên âm đôi hay gặp.',
        characters: [
          { char: '/iː/', reading: 'i dài', meaningOrExample: 'see /siː/, meet' },
          { char: '/ɪ/', reading: 'i ngắn', meaningOrExample: 'sit /sɪt/, bit' },
          { char: '/uː/', reading: 'u dài', meaningOrExample: 'blue /bluː/, two' },
          { char: '/ʊ/', reading: 'u ngắn', meaningOrExample: 'book /bʊk/, look' },
          { char: '/eɪ/', reading: 'ê-i', meaningOrExample: 'day /deɪ/, say' },
          { char: '/aɪ/', reading: 'a-i', meaningOrExample: 'sky /skaɪ/, high' },
          { char: '/əʊ/', reading: 'ơ-u', meaningOrExample: 'go /ɡəʊ/, home' },
          { char: '/aʊ/', reading: 'a-u', meaningOrExample: 'now /naʊ/, out' },
          { char: '/θ/', reading: 'th không thanh', meaningOrExample: 'think /θɪŋk/' },
          { char: '/ð/', reading: 'th hữu thanh', meaningOrExample: 'this /ðɪs/' },
        ],
      },
    ],
  },

  // ────────────────── TÂY BAN NHA ──────────────────
  es: {
    lang: 'es',
    title: 'Alfabeto Español (Tiếng Tây Ban Nha)',
    systemType: 'Bảng chữ cái Latinh 27 chữ cái',
    description: 'Gồm 27 chữ cái (kèm ký tự đặc trưng Ñ), các chữ cái có dấu trọng âm và dấu câu ngược ¡, ¿.',
    sections: [
      {
        title: '27 Chữ Cái Chính Thức',
        description: 'Bao gồm ký tự Ñ độc quyền của tiếng Tây Ban Nha.',
        characters: [
          { char: 'A a', reading: 'a', meaningOrExample: 'Amor (tình yêu)' },
          { char: 'B b', reading: 'be', meaningOrExample: 'Bueno (tốt lành)' },
          { char: 'C c', reading: 'ce', meaningOrExample: 'Cielo (bầu trời)' },
          { char: 'D d', reading: 'de', meaningOrExample: 'Día (ngày)' },
          { char: 'E e', reading: 'e', meaningOrExample: 'Estrella (ngôi sao)' },
          { char: 'F f', reading: 'efe', meaningOrExample: 'Fuego (ngọn lửa)' },
          { char: 'G g', reading: 'ge', meaningOrExample: 'Gato (con mèo)' },
          { char: 'H h', reading: 'hache (câm)', meaningOrExample: 'Hola (xin chào)' },
          { char: 'I i', reading: 'i', meaningOrExample: 'Isla (hòn đảo)' },
          { char: 'J j', reading: 'jota [x]', meaningOrExample: 'Jardín (khu vườn)' },
          { char: 'K k', reading: 'ka', meaningOrExample: 'Kilómetro' },
          { char: 'L l', reading: 'ele', meaningOrExample: 'Luna (mặt trăng)' },
          { char: 'M m', reading: 'eme', meaningOrExample: 'Mundo (thế giới)' },
          { char: 'N n', reading: 'ene', meaningOrExample: 'Noche (đêm)' },
          { char: 'Ñ ñ', reading: 'eñe [ɲ] (nh)', meaningOrExample: 'España, Mañana (ngày mai)' },
          { char: 'O o', reading: 'o', meaningOrExample: 'Océano (đại dương)' },
          { char: 'P p', reading: 'pe', meaningOrExample: 'Paz (hòa bình)' },
          { char: 'Q q', reading: 'cu', meaningOrExample: 'Queso (pho mát)' },
          { char: 'R r', reading: 'ere [r/rr]', meaningOrExample: 'Río (dòng sông)' },
          { char: 'S s', reading: 'ese', meaningOrExample: 'Sol (mặt trời)' },
          { char: 'T t', reading: 'te', meaningOrExample: 'Tiempo (thời gian)' },
          { char: 'U u', reading: 'u', meaningOrExample: 'Uva (quả nho)' },
          { char: 'V v', reading: 'uve', meaningOrExample: 'Vida (cuộc sống)' },
          { char: 'W w', reading: 'uve doble', meaningOrExample: 'Web' },
          { char: 'X x', reading: 'equis', meaningOrExample: 'Éxito (thành công)' },
          { char: 'Y y', reading: 'i griega / ye', meaningOrExample: 'Yate' },
          { char: 'Z z', reading: 'zeta [θ/s]', meaningOrExample: 'Zumo (nước ép)' },
        ],
      },
    ],
  },

  // ────────────────── PHÁP ──────────────────
  fr: {
    lang: 'fr',
    title: 'Alphabet Français (Tiếng Pháp)',
    systemType: 'Bảng chữ cái Latinh với 5 loại dấu phụ phong phú',
    description: 'Tiếng Pháp sử dụng 26 chữ cái Latinh cùng hệ thống dấu phụ (accents) điều chỉnh âm sắc tinh tế.',
    sections: [
      {
        title: '5 Loại Dấu Phụ & Ký Tự Đặc Biệt',
        description: 'Điều chỉnh cao độ nguyên âm và phát âm đặc trưng.',
        characters: [
          { char: 'é', name: 'Accent aigu', reading: 'e đóng [e]', meaningOrExample: 'Été (mùa hè), Café' },
          { char: 'è, à, ù', name: 'Accent grave', reading: 'e mở [ɛ]', meaningOrExample: 'Mère (mẹ), Où (ở đâu)' },
          { char: 'â, ê, î, ô, û', name: 'Accent circonflexe', reading: 'Nguyên âm dài / lịch sử', meaningOrExample: 'Fête (lễ hội), Forêt (rừng)' },
          { char: 'ç', name: 'Cédille', reading: 'Phát âm [s] trước a, o, u', meaningOrExample: 'Français (tiếng Pháp), Garçon' },
          { char: 'ë, ï, ü', name: 'Tréma', reading: 'Đọc tách riêng 2 nguyên âm', meaningOrExample: 'Noël (Giáng sinh), Maïs' },
          { char: 'œ, æ', name: 'Ligature', reading: 'Nguyên âm ghép', meaningOrExample: 'Cœur (trái tim), Œil (đôi mắt)' },
        ],
      },
      {
        title: 'Các Nguyên Âm Mũi (Voyelles Nasales)',
        description: 'Âm thanh thanh lịch đặc trưng của tiếng Pháp.',
        characters: [
          { char: 'an / am / en / em', reading: '[ɑ̃]', meaningOrExample: 'Enfant (đứa trẻ), Temps' },
          { char: 'in / im / ain / ein', reading: '[ɛ̃]', meaningOrExample: 'Vin (rượu vang), Pain (bánh mì)' },
          { char: 'on / om', reading: '[ɔ̃]', meaningOrExample: 'Bon (tốt), Maison (ngôi nhà)' },
          { char: 'un / um', reading: '[œ̃]', meaningOrExample: 'Un (số một), Parfum (nước hoa)' },
        ],
      },
    ],
  },

  // ────────────────── Ý ──────────────────
  it: {
    lang: 'it',
    title: 'Alfabeto Italiano (Tiếng Ý)',
    systemType: 'Bảng chữ cái Latinh 21 chữ cái truyền thống',
    description: 'Chỉ có 21 chữ cái truyền thống (J, K, W, X, Y chỉ dùng trong từ mượn). Rất giàu nhạc tính nhờ các nguyên âm mở.',
    sections: [
      {
        title: '21 Chữ Cái Truyền Thống',
        description: 'Phát âm rõ ràng, tròn vành rõ chữ.',
        characters: [
          { char: 'A a', reading: 'a', meaningOrExample: 'Amore (tình yêu)' },
          { char: 'B b', reading: 'bi', meaningOrExample: 'Bello (xinh đẹp)' },
          { char: 'C c', reading: 'ci [k/tʃ]', meaningOrExample: 'Ciao (xin chào), Cuore' },
          { char: 'D d', reading: 'di', meaningOrExample: 'Dolce (ngọt ngào)' },
          { char: 'E e', reading: 'e', meaningOrExample: 'Estate (mùa hè)' },
          { char: 'F f', reading: 'effe', meaningOrExample: 'Fiore (bông hoa)' },
          { char: 'G g', reading: 'gi [ɡ/dʒ]', meaningOrExample: 'Giorno (ngày), Gatto' },
          { char: 'H h', reading: 'acca (câm)', meaningOrExample: 'Hanno (họ có)' },
          { char: 'I i', reading: 'i', meaningOrExample: 'Italia' },
          { char: 'L l', reading: 'elle', meaningOrExample: 'Luce (ánh sáng)' },
          { char: 'M m', reading: 'emme', meaningOrExample: 'Mare (biển)' },
          { char: 'N n', reading: 'enne', meaningOrExample: 'Notte (đêm)' },
          { char: 'O o', reading: 'o', meaningOrExample: 'Oro (vàng)' },
          { char: 'P p', reading: 'pi', meaningOrExample: 'Pace (hòa bình)' },
          { char: 'Q q', reading: 'qu', meaningOrExample: 'Quadro (bức tranh)' },
          { char: 'R r', reading: 'erre (rung lưỡi)', meaningOrExample: 'Roma, Rosa (hoa hồng)' },
          { char: 'S s', reading: 'esse', meaningOrExample: 'Sole (mặt trời)' },
          { char: 'T t', reading: 'ti', meaningOrExample: 'Tempo (thời gian)' },
          { char: 'U u', reading: 'u', meaningOrExample: 'Universo (vũ trụ)' },
          { char: 'V v', reading: 'vi', meaningOrExample: 'Vita (cuộc sống)' },
          { char: 'Z z', reading: 'zeta [ts/dz]', meaningOrExample: 'Zero, Pizza' },
        ],
      },
    ],
  },

  // ────────────────── ĐỨC ──────────────────
  de: {
    lang: 'de',
    title: 'Deutsches Alphabet (Tiếng Đức)',
    systemType: 'Bảng chữ cái Latinh với 3 Umlaute & Eszett',
    description: 'Gồm 26 chữ cái Latinh cơ bản, 3 nguyên âm biến đổi (Ä, Ö, Ü) và ký tự phụ âm độc đáo Eszett (ß).',
    sections: [
      {
        title: 'Ký Tự Đặc Biệt Tiếng Đức (Umlaute & Eszett)',
        description: 'Linh hồn trong ngữ âm tiếng Đức.',
        characters: [
          { char: 'Ä ä', name: 'A-Umlaut', reading: '[ɛː] / [ɛ]', meaningOrExample: 'Mädchen (cô bé), Äpfel' },
          { char: 'Ö ö', name: 'O-Umlaut', reading: '[øː] / [œ]', meaningOrExample: 'Schön (đẹp), Öffnen (mở)' },
          { char: 'Ü ü', name: 'U-Umlaut', reading: '[yː] / [ʏ]', meaningOrExample: 'Glück (hạnh phúc), Über' },
          { char: 'ß', name: 'Eszett / Scharfes S', reading: '[s] (s sắc)', meaningOrExample: 'Straße (con đường), Groß (lớn)' },
        ],
      },
      {
        title: 'Các Cụm Phụ Âm Ghép Thường Gặp',
        description: 'Quy tắc ghép vần tạo nên âm hưởng mạnh mẽ của tiếng Đức.',
        characters: [
          { char: 'CH', reading: '[ç] (sau e,i) / [x] (sau a,o,u)', meaningOrExample: 'Ich (tôi), Bach (suối)' },
          { char: 'SCH', reading: '[ʃ] (s nặng)', meaningOrExample: 'Schule (trường), Schnee (tuyết)' },
          { char: 'EI', reading: '[aɪ] (ai)', meaningOrExample: 'Freiheit (tự do), Eins (số một)' },
          { char: 'IE', reading: '[iː] (i dài)', meaningOrExample: 'Liebe (tình yêu), Lied (bài hát)' },
          { char: 'EU / ÄU', reading: '[ɔʏ] (o-i)', meaningOrExample: 'Freund (bạn), Häuser (nhà)' },
        ],
      },
    ],
  },

  // ────────────────── BỒ ĐÀO NHA ──────────────────
  pt: {
    lang: 'pt',
    title: 'Alfabeto Português (Tiếng Bồ Đào Nha)',
    systemType: 'Bảng chữ cái Latinh với dấu ngã Til và dấu sắc',
    description: '26 chữ cái với dấu ngã (Til: ã, õ) biểu thị âm mũi đặc sắc của bán đảo Iberia và Nam Mỹ.',
    sections: [
      {
        title: 'Các Dấu Phụ & Âm Mũi Đặc Trưng',
        description: 'Dấu ngã Til, Cedilha và các dấu trọng âm.',
        characters: [
          { char: 'Ã ã', name: 'A com til', reading: '[ɐ̃] (a mũi)', meaningOrExample: 'Amanhã (ngày mai), Pão (bánh mì)' },
          { char: 'Õ õ', name: 'O com til', reading: '[õ] (ô mũi)', meaningOrExample: 'Corações (những trái tim)' },
          { char: 'Ç ç', name: 'C cedilha', reading: '[s] trước a, o, u', meaningOrExample: 'Coração (trái tim), Praça' },
          { char: 'Á á', name: 'A agudo', reading: 'a mở, nhấn mạnh', meaningOrExample: 'Água (nước)' },
          { char: 'Â â', name: 'A circunflexo', reading: 'a đóng [ɐ]', meaningOrExample: 'Ângulo (góc độ)' },
          { char: 'É é', name: 'E agudo', reading: 'e mở [ɛ]', meaningOrExample: 'Café (cà phê)' },
          { char: 'Ê ê', name: 'E circunflexo', reading: 'e đóng [e]', meaningOrExample: 'Você (bạn)' },
        ],
      },
    ],
  },
};
