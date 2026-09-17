// ============================================================
//  UI LOCALIZATION / i18n SERVICE — ARUKAS 2
//  Supports Vietnamese, English, Japanese, Korean, Chinese
// ============================================================

export type UILanguage = 'vi' | 'en' | 'ja' | 'ko' | 'zh';

export interface UILangInfo {
  code: UILanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_UI_LANGUAGES: UILangInfo[] = [
  { code: 'vi', name: 'Tiếng Việt', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳' },
];

export const TRANSLATIONS: Record<UILanguage, Record<string, string>> = {
  vi: {
    app_subtitle: 'Bộ Công Cụ Ngôn Ngữ Cục Bộ',
    nav_analyze: 'Phân Tích Câu',
    nav_media: 'Ảnh & Video',
    nav_alphabets: 'Bảng Chữ Cái',
    nav_hub: 'Kho Tri Thức & So Sánh',
    offline_safe: '100% Lưu Cục Bộ (IndexedDB)',
    no_ads_no_login: 'Không Quảng Cáo & Không Cần Tài Khoản',
    settings_title: 'Cài Đặt Hệ Thống',
    change_ui_lang: 'Ngôn Ngữ Hiển Thị Web',
    model_active: 'Mô hình AI',
    seed_starter: 'Nạp Gói Khởi Động Mẫu',
    arena_title: 'Đấu Trường So Sánh Sắc Thái',
    vocab_vault: 'Kho Từ Vựng',
    grammar_vault: 'Ngữ Pháp Đã Lưu',
    data_manager: 'Sao Lưu & Dữ Liệu',
  },
  en: {
    app_subtitle: 'Local-First Linguistic Suite',
    nav_analyze: 'Sentence Analyzer',
    nav_media: 'Image & Video Lab',
    nav_alphabets: 'Alphabets & Scripts',
    nav_hub: 'Knowledge Vault & Arena',
    offline_safe: '100% Local Storage (IndexedDB)',
    no_ads_no_login: 'Zero Ads & No Account Required',
    settings_title: 'System Settings',
    change_ui_lang: 'Website Interface Language',
    model_active: 'AI Model',
    seed_starter: 'Load Starter Seed Pack',
    arena_title: 'Nuance Battle Arena',
    vocab_vault: 'Vocabulary Vault',
    grammar_vault: 'Saved Grammar',
    data_manager: 'Data Backup & Restore',
  },
  ja: {
    app_subtitle: 'ローカル言語AIスイート',
    nav_analyze: '文分析・構文分解',
    nav_media: '画像・動画解析',
    nav_alphabets: '文字・五十音図',
    nav_hub: '単語帳・ニュアンス比較',
    offline_safe: '100% ローカル保存 (IndexedDB)',
    no_ads_no_login: '広告なし・アカウント不要',
    settings_title: 'システム設定',
    change_ui_lang: '表示言語',
    model_active: 'AIモデル',
    seed_starter: 'サンプルデータをロード',
    arena_title: 'ニュアンス比較アリーナ',
    vocab_vault: '保存した単語',
    grammar_vault: '文法ルール',
    data_manager: 'データ管理・バックアップ',
  },
  ko: {
    app_subtitle: '로컬 인공지능 언어 스위트',
    nav_analyze: '문장 분석 및 구문 분해',
    nav_media: '이미지 및 영상 분석',
    nav_alphabets: '문자 체계・알파벳',
    nav_hub: '단어장 및 뉘앙스 비교',
    offline_safe: '100% 로컬 저장 (IndexedDB)',
    no_ads_no_login: '광고 없음・로그인 불필요',
    settings_title: '시스템 설정',
    change_ui_lang: '웹사이트 언어',
    model_active: 'AI 모델',
    seed_starter: '샘플 단어팩 불러오기',
    arena_title: '뉘앙스 비교 배틀존',
    vocab_vault: '저장된 단어',
    grammar_vault: '문법 규칙',
    data_manager: '데이터 백업 및 복원',
  },
  zh: {
    app_subtitle: '本地优先多语言语言学工具箱',
    nav_analyze: '句子深度解析',
    nav_media: '图像与视频识别',
    nav_alphabets: '字母表与书写系统',
    nav_hub: '词库与语感辨析',
    offline_safe: '100% 本地存储 (IndexedDB)',
    no_ads_no_login: '无广告・免注册登录',
    settings_title: '系统设置',
    change_ui_lang: '界面显示语言',
    model_active: 'AI模型',
    seed_starter: '加载示例新手包',
    arena_title: '语感微异辨析区',
    vocab_vault: '已存词汇',
    grammar_vault: '语法结构',
    data_manager: '数据备份与恢复',
  },
};

export function getUITranslation(lang: UILanguage, key: string): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.vi[key] || key;
}
