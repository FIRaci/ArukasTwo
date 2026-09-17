// ============================================================
//  ARUKAS 2 — CORE TYPE DEFINITIONS
//  Bi-directional Multi-language, Ollama AI, Local Storage
// ============================================================

export type LanguageCode =
  | 'vi' // Tiếng Việt
  | 'ja' // Tiếng Nhật
  | 'ko' // Tiếng Hàn
  | 'zh' // Tiếng Trung
  | 'ru' // Tiếng Nga
  | 'en' // Tiếng Anh
  | 'es' // Tây Ban Nha
  | 'fr' // Tiếng Pháp
  | 'it' // Tiếng Ý
  | 'de' // Tiếng Đức
  | 'pt'; // Bồ Đào Nha

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  scriptName: string;
  speechVoiceLang: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'vi', name: 'Tiếng Việt', nativeName: 'Tiếng Việt', flag: '🇻🇳', scriptName: 'Chữ Quốc Ngữ (Latin)', speechVoiceLang: 'vi-VN' },
  { code: 'ja', name: 'Tiếng Nhật', nativeName: '日本語', flag: '🇯🇵', scriptName: 'Kana & Kanji', speechVoiceLang: 'ja-JP' },
  { code: 'ko', name: 'Tiếng Hàn', nativeName: '한국어', flag: '🇰🇷', scriptName: 'Hangul (한글)', speechVoiceLang: 'ko-KR' },
  { code: 'zh', name: 'Tiếng Trung', nativeName: '中文', flag: '🇨🇳', scriptName: 'Chữ Hán & Pinyin (汉字)', speechVoiceLang: 'zh-CN' },
  { code: 'ru', name: 'Tiếng Nga', nativeName: 'Русский', flag: '🇷🇺', scriptName: 'Cyrillic (Кириллица)', speechVoiceLang: 'ru-RU' },
  { code: 'en', name: 'Tiếng Anh', nativeName: 'English', flag: '🇬🇧', scriptName: 'Latin & IPA', speechVoiceLang: 'en-US' },
  { code: 'es', name: 'Tây Ban Nha', nativeName: 'Español', flag: '🇪🇸', scriptName: 'Alfabeto Español', speechVoiceLang: 'es-ES' },
  { code: 'fr', name: 'Tiếng Pháp', nativeName: 'Français', flag: '🇫🇷', scriptName: 'Alphabet Français', speechVoiceLang: 'fr-FR' },
  { code: 'it', name: 'Tiếng Ý', nativeName: 'Italiano', flag: '🇮🇹', scriptName: 'Alfabeto Italiano', speechVoiceLang: 'it-IT' },
  { code: 'de', name: 'Tiếng Đức', nativeName: 'Deutsch', flag: '🇩🇪', scriptName: 'Deutsches Alphabet', speechVoiceLang: 'de-DE' },
  { code: 'pt', name: 'Bồ Đào Nha', nativeName: 'Português', flag: '🇵🇹', scriptName: 'Alfabeto Português', speechVoiceLang: 'pt-PT' },
];

export function getLanguageInfo(code: LanguageCode): LanguageInfo {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}

// ============================================================
//  ANALYSIS RESULT TYPES
// ============================================================

export type PartOfSpeech =
  | 'NOUN'
  | 'VERB'
  | 'ADJECTIVE'
  | 'ADVERB'
  | 'PRONOUN'
  | 'PREPOSITION'
  | 'PARTICLE'
  | 'CONJUNCTION'
  | 'INTERJECTION'
  | 'NUMERAL'
  | 'AUXILIARY'
  | 'PUNCTUATION'
  | 'OTHER';

export interface AnalysisToken {
  id: string;
  text: string;
  reading?: string; // Romaji, Pinyin, IPA, Furigana
  pos: PartOfSpeech;
  posLabel: string;
  meaning: string;
  lemma?: string; // Base / dictionary form
  role?: string; // Subject, Object, Predicate, Modifier
  hanViet?: string; // For CJKV (Viet, Japanese, Chinese, Sino-Korean)
  nuanceNote?: string;
}

export interface AnalysisGrammarPoint {
  id: string;
  structure: string;
  reading?: string;
  meaning: string;
  formula?: string;
  explanation: string;
  examples?: { original: string; translation: string }[];
}

export interface AnalysisSummary {
  translation: string;
  overview: string;
  tone: string; // Trang trọng (Formal), Thân mật (Casual), Văn học (Literary), Khẩu ngữ (Colloquial)
  culturalContext?: string;
}

export interface TextAnalysisResult {
  id: string;
  sourceText: string;
  sourceLang: LanguageCode | 'auto';
  resolvedSourceLang: LanguageCode;
  targetLang: LanguageCode;
  summary: AnalysisSummary;
  tokens: AnalysisToken[];
  grammarPoints: AnalysisGrammarPoint[];
  analyzedAt: number;
}

// ============================================================
//  MEDIA / VISION TYPES
// ============================================================

export interface DetectedSegment {
  id: string;
  originalText: string;
  reading?: string;
  translation: string;
  speaker?: string;
  timestampStart?: number; // In seconds for video
  timestampEnd?: number;
  boundingBox?: { x: number; y: number; w: number; h: number }; // For image
  type: 'speech' | 'narration' | 'sfx' | 'document';
  notes?: string;
}

export interface MediaAnalysisResult {
  id: string;
  mediaType: 'image' | 'video';
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  summary: string;
  segments: DetectedSegment[];
  analyzedAt: number;
}

// ============================================================
//  LOCAL MEMORY HUB TYPES
// ============================================================

export interface SavedWord {
  id: string;
  text: string;
  reading: string;
  meaning: string;
  pos?: string;
  lang: LanguageCode;
  targetLang: LanguageCode;
  contextSentence?: string;
  tags: string[];
  savedAt: number;
  notes?: string;
}

export interface SavedGrammar {
  id: string;
  structure: string;
  reading?: string;
  meaning: string;
  formula?: string;
  explanation: string;
  lang: LanguageCode;
  targetLang: LanguageCode;
  tags: string[];
  savedAt: number;
}

export interface ComparisonItem {
  term: string;
  reading?: string;
  meaning: string;
  nuance: string;
  example: string;
  exampleTranslation: string;
}

export interface SavedComparison {
  id: string;
  title: string;
  lang: LanguageCode;
  targetLang: LanguageCode;
  items: ComparisonItem[];
  keyDifference: string;
  summary: string;
  savedAt: number;
}

// ============================================================
//  THEME & PARTICLE TYPES
// ============================================================

export type ThemeId =
  | 'minimal-white'
  | 'minimal-dark'
  | 'sakura'
  | 'bamboo'
  | 'ginkgo'
  | 'ink'
  | 'frost'
  | 'mediterranean'
  | 'lavender';

export type ParticleType =
  | 'none'
  | 'sakura'
  | 'bamboo'
  | 'ginkgo'
  | 'ink'
  | 'snow'
  | 'sunlight'
  | 'lavender';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  country: string;
  countryFlag: string;
  defaultParticle: ParticleType;
  accentColor: string;
  bgStyle: string;
  cardStyle: string;
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  modifiedAt: string;
  isVision: boolean;
}

export interface OllamaConfig {
  endpoint: string; // default http://localhost:11434
  textModel: string;
  visionModel: string;
  isConnected: boolean;
  availableModels: OllamaModelInfo[];
}
