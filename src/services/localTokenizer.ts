// ============================================================================
// LOCAL PRE-TOKENIZER v3 — Ultra-smart hybrid analysis engine
// 8,130+ vocab + 2,000+ kanji + 860+ grammar + massive de-inflection engine
// + SOV→SVO translation + numeral/counter parser + onomatopoeia detection
// + register/politeness analysis + colloquial form recognition
// + sentence complexity scoring + expanded grammar patterns
// Provides INSTANT preview rivaling AI-based analysis.
// ============================================================================

import type { AnalysisResult, Token, SentenceBlock, GrammarStructure } from '../types';
import { PartType } from '../types';
import { lookupGrammar, getHanVietForWord, lookupKanji } from './localDataService';
import { VOCAB_BY_LEVEL } from '../data/vocabData';
import { COMPOUND_VOCAB } from '../data/compoundVocab';
import { tryParseNumeral, isNumeralKanji } from './localNumeralParser';
import { tryMatchOnomatopoeia } from './localAdvancedAnalysis';
import { translateTokensToVietnamese } from './localTranslationEngine';
import { detectExtendedGrammar, generateEnhancedSummary } from './localAdvancedAnalysis';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Character classification
// ═══════════════════════════════════════════════════════════════════════════

type CharClass = 'kanji' | 'hiragana' | 'katakana' | 'punct' | 'ascii' | 'other';

function cc(ch: string): CharClass {
  const c = ch.charCodeAt(0);
  if ((c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3400 && c <= 0x4DBF) || c === 0x3005) return 'kanji'; // 々 = repeat
  if (c >= 0x3040 && c <= 0x309F) return 'hiragana';
  if (c >= 0x30A0 && c <= 0x30FF || c === 0xFF70) return 'katakana';
  if (/[。、！？「」『』（）【】…・〜～ー\u3000\s\n\r,.!?;:()[\]{}]/.test(ch)) return 'punct';
  if (c >= 0x20 && c <= 0x7E) return 'ascii';
  return 'other';
}

function isKanji(ch: string): boolean { return cc(ch) === 'kanji'; }

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Vocabulary lookup acceleration
// ═══════════════════════════════════════════════════════════════════════════

let vocabByWord: Map<string, any> | null = null;
let vocabByReading: Map<string, any> | null = null;
let maxWordLen = 0;

function ensureMaps() {
  if (vocabByWord) return;
  vocabByWord = new Map();
  vocabByReading = new Map();
  for (const entry of VOCAB_BY_LEVEL.ALL) {
    if (!vocabByWord.has(entry.word)) vocabByWord.set(entry.word, entry);
    if (entry.reading && !vocabByReading.has(entry.reading)) vocabByReading.set(entry.reading, entry);
    if (entry.word.length > maxWordLen) maxWordLen = entry.word.length;
  }
  // Merge compound vocab — these get highest priority in tryDeinflect,
  // but we also need them in the maps so maxWordLen and reading lookups work
  for (const [word, entry] of COMPOUND_VOCAB) {
    if (word.length > maxWordLen) maxWordLen = word.length;
    if (entry.reading && !vocabByReading.has(entry.reading)) {
      vocabByReading.set(entry.reading, { word, ...entry, id: `cmp_${word}`, examples: [], jlpt: entry.jlpt || '', tags: entry.tags || [] });
    }
  }
}

function directLookup(text: string) {
  ensureMaps();
  return vocabByWord!.get(text) || vocabByReading!.get(text) || null;
}

// ── Phrases index: multi-word expressions from DB phrases field ──
let phrasesMap: Map<string, { word: string; reading: string; meaning: string }> | null = null;
let maxPhraseLen = 0;

function ensurePhrases() {
  if (phrasesMap) return;
  phrasesMap = new Map();
  for (const entry of VOCAB_BY_LEVEL.ALL) {
    if (entry.phrases) {
      for (const p of entry.phrases) {
        if (p.word && p.word.length > 1 && !phrasesMap.has(p.word)) {
          phrasesMap.set(p.word, { word: p.word, reading: p.reading || '', meaning: p.meaning || '' });
          if (p.word.length > maxPhraseLen) maxPhraseLen = p.word.length;
        }
      }
    }
  }
}

function phraseDirectLookup(text: string) {
  ensurePhrases();
  return phrasesMap!.get(text) || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2b: Irregular verbs する / 来る — complete conjugation engine
// ═══════════════════════════════════════════════════════════════════════════

interface IrregularMatch { dictForm: string; conjugation: string; }

// する conjugation patterns: conjugated form → description
const SURU_FORMS: [string, string][] = [
  ['させられました', 'sai khiến bị động (lịch sự qu.khứ)'],
  ['させられます', 'sai khiến bị động (lịch sự)'],
  ['させられる', 'sai khiến bị động'],
  ['させられた', 'sai khiến bị động (qu.khứ)'],
  ['してしまった', 'đã xong (teshimatta)'],
  ['してしまう', 'xong hết (teshimau)'],
  ['していました', 'đang (qu.khứ lịch sự)'],
  ['しなければ', 'nếu không làm'],
  ['してください', 'xin hãy làm'],
  ['しています', 'đang (lịch sự)'],
  ['しませんでした', 'đã không (lịch sự)'],
  ['してきた', 'đã đến (tekita)'],
  ['してみる', 'thử xem (temiru)'],
  ['しておく', 'chuẩn bị trước (teoku)'],
  ['していた', 'đang (qu.khứ)'],
  ['している', 'đang (teiru)'],
  ['しました', 'đã làm (lịch sự)'],
  ['しません', 'không (lịch sự)'],
  ['しましょう', 'hãy cùng (mashou)'],
  ['しないで', 'đừng làm'],
  ['しなかった', 'đã không'],
  ['しなくて', 'không và...'],
  ['させます', 'bắt làm (lịch sự)'],
  ['されます', 'bị làm (lịch sự)'],
  ['できます', 'có thể (lịch sự)'],
  ['しよう', 'hãy làm (ý chí)'],
  ['します', 'làm (lịch sự)'],
  ['された', 'đã bị làm'],
  ['させる', 'bắt / cho phép làm'],
  ['される', 'bị làm'],
  ['しない', 'không làm'],
  ['すれば', 'nếu làm'],
  ['して', 'て form'],
  ['した', 'đã làm (qu.khứ)'],
  ['しろ', 'làm đi! (mệnh lệnh)'],
  ['せず', 'không làm (văn viết)'],
];

// 来る conjugation patterns
const KURU_FORMS: [string, string][] = [
  ['きてしまった', 'đã đến hoàn toàn'],
  ['こさせられる', 'bị bắt đến'],
  ['きてしまう', 'đến hết'],
  ['きていました', 'đang đến (qu.khứ lịch sự)'],
  ['きてください', 'xin hãy đến'],
  ['きています', 'đang đến (lịch sự)'],
  ['こさせる', 'bắt đến'],
  ['こられる', 'có thể đến / bị đến'],
  ['きていた', 'đang đến (qu.khứ)'],
  ['きている', 'đang đến'],
  ['きました', 'đã đến (lịch sự)'],
  ['きません', 'không đến (lịch sự)'],
  ['こなかった', 'đã không đến'],
  ['くれば', 'nếu đến'],
  ['こない', 'không đến'],
  ['きます', 'đến (lịch sự)'],
  ['こよう', 'hãy đến (ý chí)'],
  ['きた', 'đã đến (qu.khứ)'],
  ['きて', 'て form (đến)'],
  ['こい', 'đến đi! (mệnh lệnh)'],
];

function matchIrregularSuru(text: string): IrregularMatch | null {
  for (const [form, desc] of SURU_FORMS) {
    if (text === form) return { dictForm: 'する', conjugation: desc };
  }
  return null;
}

function matchIrregularKuru(text: string): IrregularMatch | null {
  for (const [form, desc] of KURU_FORMS) {
    if (text === form) return { dictForm: '来る', conjugation: desc };
  }
  return null;
}

// 行く conjugation patterns (irregular godan: った/って instead of いた/いて)
const IKU_FORMS: [string, string][] = [
  ['行ってしまった', 'đã đi mất (teshimatta)'],
  ['行ってしまう', 'đi mất (teshimau)'],
  ['行っていました', 'đang đi (qu.khứ lịch sự)'],
  ['行ってください', 'xin hãy đi'],
  ['行っています', 'đang đi (lịch sự)'],
  ['行っていた', 'đang đi (qu.khứ)'],
  ['行っている', 'đang đi'],
  ['行ってみる', 'thử đi'],
  ['行かなければ', 'nếu không đi'],
  ['行きました', 'đã đi (lịch sự)'],
  ['行きません', 'không đi (lịch sự)'],
  ['行きましょう', 'hãy cùng đi'],
  ['行かなかった', 'đã không đi'],
  ['行かれる', 'bị đi / có thể đi'],
  ['行かせる', 'bắt đi'],
  ['行きたい', 'muốn đi'],
  ['行かない', 'không đi'],
  ['行けば', 'nếu đi'],
  ['行ける', 'có thể đi'],
  ['行こう', 'hãy đi (ý chí)'],
  ['行きます', 'đi (lịch sự)'],
  ['行った', 'đã đi (qu.khứ)'],
  ['行って', 'て form (đi)'],
  ['行け', 'đi đi! (mệnh lệnh)'],
];

function matchIrregularIku(text: string): IrregularMatch | null {
  for (const [form, desc] of IKU_FORMS) {
    if (text === form) return { dictForm: '行く', conjugation: desc };
  }
  return null;
}

// Check if text ends with a する conjugation form → split noun + する-form
// REQUIRES noun part to be 2+ chars to avoid false positives (話した ≠ 話+する)
function trySuruCompound(text: string): { nounPart: string; suruForm: string; suruDesc: string } | null {
  for (const [form, desc] of SURU_FORMS) {
    if (text.length > form.length && text.endsWith(form)) {
      const noun = text.slice(0, -form.length);
      if (noun.length < 2) continue; // single-char nouns → likely regular verb, not する-compound
      const nounEntry = directLookup(noun);
      if (nounEntry) return { nounPart: noun, suruForm: form, suruDesc: desc };
      if ([...noun].every(isKanji)) return { nounPart: noun, suruForm: form, suruDesc: desc };
    }
  }
  // Also check plain する at end
  if (text.length > 3 && text.endsWith('する')) {
    const noun = text.slice(0, -2);
    if (noun.length >= 2) {
      const nounEntry = directLookup(noun);
      if (nounEntry) return { nounPart: noun, suruForm: 'する', suruDesc: '' };
      if ([...noun].every(isKanji)) return { nounPart: noun, suruForm: 'する', suruDesc: '' };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2c: Suffix / Prefix recognition
// ═══════════════════════════════════════════════════════════════════════════

interface Affix { text: string; meaning: string; type: 'prefix' | 'suffix'; }

const SUFFIXES: Affix[] = [
  { text: 'さん', meaning: 'Anh/Chị (kính xưng)', type: 'suffix' },
  { text: 'ちゃん', meaning: '(thân mật)', type: 'suffix' },
  { text: 'くん', meaning: '(thân mật, nam)', type: 'suffix' },
  { text: '様', meaning: 'Ngài (tôn kính)', type: 'suffix' },
  { text: '先生', meaning: 'Thầy/Cô', type: 'suffix' },
  { text: '達', meaning: 'Các, bọn (số nhiều)', type: 'suffix' },
  { text: 'たち', meaning: 'Các, bọn (số nhiều)', type: 'suffix' },
  { text: '的', meaning: '-tính, mang tính', type: 'suffix' },
  { text: '中', meaning: 'Đang, trong', type: 'suffix' },
  { text: '員', meaning: 'Nhân viên, thành viên', type: 'suffix' },
  { text: '者', meaning: 'Người (làm gì đó)', type: 'suffix' },
  { text: '家', meaning: '-gia (chuyên gia)', type: 'suffix' },
  { text: '化', meaning: '-hóa', type: 'suffix' },
  { text: '性', meaning: '-tính', type: 'suffix' },
  { text: '感', meaning: 'Cảm giác về~', type: 'suffix' },
  { text: '力', meaning: 'Lực, sức', type: 'suffix' },
  { text: '用', meaning: 'Dùng cho~', type: 'suffix' },
  { text: '式', meaning: 'Kiểu, phương thức', type: 'suffix' },
  { text: '語', meaning: 'Ngôn ngữ~', type: 'suffix' },
  { text: '人', meaning: 'Người~', type: 'suffix' },
];

const PREFIXES: Affix[] = [
  { text: 'お', meaning: '(lịch sự, mỹ hóa)', type: 'prefix' },
  { text: 'ご', meaning: '(lịch sự, Hán)', type: 'prefix' },
  { text: '不', meaning: 'Không, bất~', type: 'prefix' },
  { text: '無', meaning: 'Không có, vô~', type: 'prefix' },
  { text: '非', meaning: 'Phi~, không phải', type: 'prefix' },
  { text: '未', meaning: 'Chưa, vị~', type: 'prefix' },
  { text: '再', meaning: 'Lại, tái~', type: 'prefix' },
  { text: '超', meaning: 'Siêu~', type: 'prefix' },
  { text: '大', meaning: 'Đại~, to', type: 'prefix' },
  { text: '小', meaning: 'Tiểu~, nhỏ', type: 'prefix' },
  { text: '新', meaning: 'Tân~, mới', type: 'prefix' },
  { text: '全', meaning: 'Toàn~', type: 'prefix' },
  { text: '各', meaning: 'Mỗi~, các~', type: 'prefix' },
];

// Try to strip a known suffix and find the stem in vocab
function trySuffixSplit(text: string): { stem: string; stemEntry: any; suffix: Affix } | null {
  for (const suf of SUFFIXES) {
    if (text.length > suf.text.length && text.endsWith(suf.text)) {
      const stem = text.slice(0, -suf.text.length);
      const entry = directLookup(stem);
      if (entry) return { stem, stemEntry: entry, suffix: suf };
      // Also try kanji-only stem
      if (stem.length >= 1 && [...stem].every(isKanji)) {
        const hvStem = getHanVietForWord(stem);
        if (hvStem) return { stem, stemEntry: { word: stem, meaning: '', hanViet: hvStem, type: 'Danh từ' }, suffix: suf };
      }
    }
  }
  return null;
}

// Try to strip a known prefix and find the rest in vocab
function tryPrefixSplit(text: string): { prefix: Affix; rest: string; restEntry: any } | null {
  for (const pre of PREFIXES) {
    if (text.length > pre.text.length && text.startsWith(pre.text)) {
      const rest = text.slice(pre.text.length);
      const entry = directLookup(rest);
      if (entry) return { prefix: pre, rest, restEntry: entry };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2d: Common hiragana-only words (built-in fallback when DB miss)
// ═══════════════════════════════════════════════════════════════════════════

interface BuiltInWord { meaning: string; type: PartType; reading?: string; romaji?: string; }

const HIRAGANA_WORDS: Map<string, BuiltInWord> = new Map([
  ['こと', { meaning: 'Việc, điều', type: PartType.NOUN, romaji: 'koto' }],
  ['もの', { meaning: 'Vật, đồ', type: PartType.NOUN, romaji: 'mono' }],
  ['ところ', { meaning: 'Nơi, chỗ', type: PartType.NOUN, romaji: 'tokoro' }],
  ['とき', { meaning: 'Lúc, khi', type: PartType.NOUN, romaji: 'toki' }],
  ['ひと', { meaning: 'Người', type: PartType.NOUN, romaji: 'hito' }],
  ['いま', { meaning: 'Bây giờ', type: PartType.NOUN, romaji: 'ima' }],
  ['なに', { meaning: 'Cái gì', type: PartType.NOUN, romaji: 'nani' }],
  ['なん', { meaning: 'Gì, mấy', type: PartType.NOUN, romaji: 'nan' }],
  ['だれ', { meaning: 'Ai', type: PartType.NOUN, romaji: 'dare' }],
  ['いつ', { meaning: 'Khi nào', type: PartType.NOUN, romaji: 'itsu' }],
  ['どう', { meaning: 'Thế nào', type: PartType.OTHER, romaji: 'dou' }],
  ['なぜ', { meaning: 'Tại sao', type: PartType.OTHER, romaji: 'naze' }],
  ['どうして', { meaning: 'Tại sao, bằng cách nào', type: PartType.OTHER, romaji: 'doushite' }],
  ['どうも', { meaning: 'Xin chào / cảm ơn', type: PartType.OTHER, romaji: 'doumo' }],
  ['ちょっと', { meaning: 'Một chút', type: PartType.OTHER, romaji: 'chotto' }],
  ['すごく', { meaning: 'Rất, cực kỳ', type: PartType.OTHER, romaji: 'sugoku' }],
  ['すごい', { meaning: 'Tuyệt vời, ghê gớm', type: PartType.ADJECTIVE, romaji: 'sugoi' }],
  ['わたし', { meaning: 'Tôi', type: PartType.NOUN, romaji: 'watashi' }],
  ['ぼく', { meaning: 'Tôi (nam)', type: PartType.NOUN, romaji: 'boku' }],
  ['きみ', { meaning: 'Cậu, bạn', type: PartType.NOUN, romaji: 'kimi' }],
  ['かれ', { meaning: 'Anh ấy', type: PartType.NOUN, romaji: 'kare' }],
  ['これ', { meaning: 'Cái này', type: PartType.NOUN, romaji: 'kore' }],
  ['それ', { meaning: 'Cái đó', type: PartType.NOUN, romaji: 'sore' }],
  ['あれ', { meaning: 'Cái kia', type: PartType.NOUN, romaji: 'are' }],
  ['ここ', { meaning: 'Ở đây', type: PartType.NOUN, romaji: 'koko' }],
  ['そこ', { meaning: 'Ở đó', type: PartType.NOUN, romaji: 'soko' }],
  ['あそこ', { meaning: 'Ở kia', type: PartType.NOUN, romaji: 'asoko' }],
  ['この', { meaning: '~này', type: PartType.OTHER, romaji: 'kono' }],
  ['その', { meaning: '~đó', type: PartType.OTHER, romaji: 'sono' }],
  ['あの', { meaning: '~kia', type: PartType.OTHER, romaji: 'ano' }],
  ['どの', { meaning: '~nào', type: PartType.OTHER, romaji: 'dono' }],
  ['いい', { meaning: 'Tốt, hay', type: PartType.ADJECTIVE, romaji: 'ii' }],
  ['ない', { meaning: 'Không có', type: PartType.ADJECTIVE, romaji: 'nai' }],
  ['よく', { meaning: 'Thường, hay, giỏi', type: PartType.OTHER, romaji: 'yoku' }],
  ['あまり', { meaning: 'Không lắm', type: PartType.OTHER, romaji: 'amari' }],
  ['たくさん', { meaning: 'Nhiều', type: PartType.OTHER, romaji: 'takusan' }],
  ['すこし', { meaning: 'Một chút', type: PartType.OTHER, romaji: 'sukoshi' }],
  ['いちばん', { meaning: 'Nhất, số một', type: PartType.OTHER, romaji: 'ichiban' }],
  ['だいたい', { meaning: 'Đại khái, khoảng', type: PartType.OTHER, romaji: 'daitai' }],
  ['ぜんぶ', { meaning: 'Tất cả, toàn bộ', type: PartType.OTHER, romaji: 'zenbu' }],
  ['はじめて', { meaning: 'Lần đầu tiên', type: PartType.OTHER, romaji: 'hajimete' }],
  ['しかし', { meaning: 'Tuy nhiên', type: PartType.CONJUNCTION, romaji: 'shikashi' }],
  ['そして', { meaning: 'Và rồi', type: PartType.CONJUNCTION, romaji: 'soshite' }],
  ['でも', { meaning: 'Nhưng mà', type: PartType.CONJUNCTION, romaji: 'demo' }],
  ['だから', { meaning: 'Vì vậy', type: PartType.CONJUNCTION, romaji: 'dakara' }],
  ['それから', { meaning: 'Sau đó', type: PartType.CONJUNCTION, romaji: 'sorekara' }],
  ['または', { meaning: 'Hoặc là', type: PartType.CONJUNCTION, romaji: 'matawa' }],
  ['ただ', { meaning: 'Chỉ, chỉ là', type: PartType.OTHER, romaji: 'tada' }],
  ['もし', { meaning: 'Nếu, nếu mà', type: PartType.OTHER, romaji: 'moshi' }],
  ['ぜひ', { meaning: 'Nhất định, bằng mọi giá', type: PartType.OTHER, romaji: 'zehi' }],
  ['やっと', { meaning: 'Cuối cùng cũng', type: PartType.OTHER, romaji: 'yatto' }],
  ['なかなか', { meaning: 'Khá, khó mà', type: PartType.OTHER, romaji: 'nakanaka' }],
  ['そろそろ', { meaning: 'Sắp, gần đến lúc', type: PartType.OTHER, romaji: 'sorosoro' }],
  ['だんだん', { meaning: 'Dần dần', type: PartType.OTHER, romaji: 'dandan' }],
  ['ますます', { meaning: 'Ngày càng', type: PartType.OTHER, romaji: 'masumasu' }],
]);

function builtInLookup(text: string): BuiltInWord | null {
  return HIRAGANA_WORDS.get(text) || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Massive de-inflection engine (150+ rules)
// ═══════════════════════════════════════════════════════════════════════════

interface DRule { suf: string; rep: string[]; desc: string; }

const DEINFLECT: DRule[] = [
  // ═══ COMPOUND AUXILIARY (longest first) ═══
  { suf: 'なければならない', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'phải (nakereba naranai)' },
  { suf: 'なければいけない', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'phải (nakereba ikenai)' },
  { suf: 'なくてはならない', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'phải (nakutewa naranai)' },
  { suf: 'なくてもいい', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'không cần (nakutemo ii)' },
  { suf: 'てしまいました', rep: ['る'], desc: 'đã hoàn toàn (shimaimashita)' },
  { suf: 'させられる', rep: ['る'], desc: 'bị bắt (causative-passive)' },
  { suf: 'させられた', rep: ['る'], desc: 'đã bị bắt (saserareta)' },
  { suf: 'てしまった', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'đã xong (teshimatta)' },
  { suf: 'てしまう', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'xong hết (teshimau)' },
  { suf: 'ちゃった', rep: ['る'], desc: 'đã xong (colloquial)' },
  { suf: 'ちゃう', rep: ['る'], desc: 'xong (colloquial)' },
  { suf: 'ていました', rep: ['る'], desc: 'đang (teimashita)' },
  { suf: 'てきました', rep: ['る'], desc: 'đã đến gần (tekimashita)' },
  { suf: 'ておきます', rep: ['る'], desc: 'chuẩn bị trước (teokimasu)' },
  { suf: 'てあります', rep: ['る'], desc: 'ở trạng thái (tearimasu)' },
  { suf: 'てください', rep: ['る'], desc: 'xin hãy (tekudasai)' },
  { suf: 'てみます', rep: ['る'], desc: 'thử (temimasu)' },
  { suf: 'てもらう', rep: ['る'], desc: 'nhận (temorau)' },
  { suf: 'てあげる', rep: ['る'], desc: 'cho (teageru)' },
  { suf: 'てくれる', rep: ['る'], desc: 'cho tôi (tekureru)' },
  { suf: 'ています', rep: ['る'], desc: 'đang (teimasu)' },
  { suf: 'ていない', rep: ['る'], desc: 'không đang (teinai)' },
  { suf: 'ていた', rep: ['る'], desc: 'đang (teita)' },
  { suf: 'ている', rep: ['る'], desc: 'đang (teiru)' },
  { suf: 'ておく', rep: ['る'], desc: 'chuẩn bị trước (teoku)' },
  { suf: 'てある', rep: ['る'], desc: 'ở trạng thái (tearu)' },
  { suf: 'てくる', rep: ['る'], desc: 'đến (tekuru)' },
  { suf: 'ていく', rep: ['る'], desc: 'rời đi (teiku)' },
  { suf: 'てみる', rep: ['る'], desc: 'thử xem (temiru)' },
  // ═══ POLITE (masu-kei) ═══
  { suf: 'ましょう', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'hãy cùng (mashou)' },
  { suf: 'ませんでした', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'đã không (masen deshita)' },
  { suf: 'ません', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'không (masen)' },
  { suf: 'ました', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'đã (mashita)' },
  { suf: 'ます', rep: ['る','う','く','す','つ','ぬ','ぶ','む','ぐ'], desc: 'lịch sự (masu)' },
  // ═══ GODAN MASU-STEM ═══
  { suf: 'いました', rep: ['う'], desc: 'đã (masu qu.khứ)' },
  { suf: 'きました', rep: ['く'], desc: 'đã (masu qu.khứ)' },
  { suf: 'ぎました', rep: ['ぐ'], desc: 'đã (masu qu.khứ)' },
  { suf: 'しました', rep: ['す'], desc: 'đã (masu qu.khứ)' },
  { suf: 'ちました', rep: ['つ'], desc: 'đã (masu qu.khứ)' },
  { suf: 'にました', rep: ['ぬ'], desc: 'đã (masu qu.khứ)' },
  { suf: 'びました', rep: ['ぶ'], desc: 'đã (masu qu.khứ)' },
  { suf: 'みました', rep: ['む'], desc: 'đã (masu qu.khứ)' },
  { suf: 'りました', rep: ['る'], desc: 'đã (masu qu.khứ)' },
  { suf: 'います', rep: ['う'], desc: 'lịch sự (masu)' },
  { suf: 'きます', rep: ['く'], desc: 'lịch sự (masu)' },
  { suf: 'ぎます', rep: ['ぐ'], desc: 'lịch sự (masu)' },
  { suf: 'します', rep: ['す'], desc: 'lịch sự (masu)' },
  { suf: 'ちます', rep: ['つ'], desc: 'lịch sự (masu)' },
  { suf: 'にます', rep: ['ぬ'], desc: 'lịch sự (masu)' },
  { suf: 'びます', rep: ['ぶ'], desc: 'lịch sự (masu)' },
  { suf: 'みます', rep: ['む'], desc: 'lịch sự (masu)' },
  { suf: 'ります', rep: ['る'], desc: 'lịch sự (masu)' },
  // ═══ PASSIVE / POTENTIAL / CAUSATIVE ═══
  { suf: 'られます', rep: ['る'], desc: 'bị/có thể (lit.)' },
  { suf: 'させます', rep: ['る'], desc: 'bắt/cho phép (lit.)' },
  { suf: 'られる', rep: ['る'], desc: 'bị / có thể (rareru)' },
  { suf: 'られた', rep: ['る'], desc: 'đã bị (rareta)' },
  { suf: 'させる', rep: ['る'], desc: 'bắt / cho phép (saseru)' },
  { suf: 'させた', rep: ['る'], desc: 'đã bắt (saseta)' },
  { suf: 'われる', rep: ['う'], desc: 'bị (wareru)' },
  { suf: 'かれる', rep: ['く'], desc: 'bị (kareru)' },
  { suf: 'がれる', rep: ['ぐ'], desc: 'bị (gareru)' },
  { suf: 'される', rep: ['す'], desc: 'bị (sareru)' },
  { suf: 'たれる', rep: ['つ'], desc: 'bị (tareru)' },
  { suf: 'なれる', rep: ['ぬ'], desc: 'bị (nareru)' },
  { suf: 'ばれる', rep: ['ぶ'], desc: 'bị (bareru)' },
  { suf: 'まれる', rep: ['む'], desc: 'bị (mareru)' },
  { suf: 'わせる', rep: ['う'], desc: 'bắt (waseru)' },
  { suf: 'かせる', rep: ['く'], desc: 'bắt (kaseru)' },
  { suf: 'がせる', rep: ['ぐ'], desc: 'bắt (gaseru)' },
  { suf: 'たせる', rep: ['つ'], desc: 'bắt (taseru)' },
  { suf: 'なせる', rep: ['ぬ'], desc: 'bắt (naseru)' },
  { suf: 'ばせる', rep: ['ぶ'], desc: 'bắt (baseru)' },
  { suf: 'ませる', rep: ['む'], desc: 'bắt (maseru)' },
  { suf: 'らせる', rep: ['る'], desc: 'bắt (raseru)' },
  { suf: 'える', rep: ['う'], desc: 'có thể (eru)' },
  // ═══ CONDITIONAL ═══
  { suf: 'ければ', rep: ['い'], desc: 'nếu (adj -i)' },
  { suf: 'えば', rep: ['う'], desc: 'nếu (eba)' },
  { suf: 'けば', rep: ['く'], desc: 'nếu (keba)' },
  { suf: 'げば', rep: ['ぐ'], desc: 'nếu (geba)' },
  { suf: 'せば', rep: ['す'], desc: 'nếu (seba)' },
  { suf: 'てば', rep: ['つ'], desc: 'nếu (teba)' },
  { suf: 'ねば', rep: ['ぬ'], desc: 'nếu (neba)' },
  { suf: 'べば', rep: ['ぶ'], desc: 'nếu (beba)' },
  { suf: 'めば', rep: ['む'], desc: 'nếu (meba)' },
  { suf: 'れば', rep: ['る'], desc: 'nếu (reba)' },
  // ═══ VOLITIONAL ═══
  { suf: 'よう', rep: ['る'], desc: 'hãy / có lẽ (you)' },
  { suf: 'おう', rep: ['う'], desc: 'hãy (ou)' },
  { suf: 'こう', rep: ['く'], desc: 'hãy (kou)' },
  { suf: 'ごう', rep: ['ぐ'], desc: 'hãy (gou)' },
  { suf: 'そう', rep: ['す'], desc: 'hãy (sou)' },
  { suf: 'とう', rep: ['つ'], desc: 'hãy (tou)' },
  { suf: 'のう', rep: ['ぬ'], desc: 'hãy (nou)' },
  { suf: 'ぼう', rep: ['ぶ'], desc: 'hãy (bou)' },
  { suf: 'もう', rep: ['む'], desc: 'hãy (mou)' },
  { suf: 'ろう', rep: ['る'], desc: 'hãy (rou)' },
  // ═══ TA-FORM (past) ═══
  { suf: 'った', rep: ['う','つ','る'], desc: 'quá khứ (tta)' },
  { suf: 'いた', rep: ['く'], desc: 'quá khứ (ita)' },
  { suf: 'いだ', rep: ['ぐ'], desc: 'quá khứ (ida)' },
  { suf: 'んだ', rep: ['む','ぶ','ぬ'], desc: 'quá khứ (nda)' },
  { suf: 'した', rep: ['す'], desc: 'quá khứ (shita)' },
  // ═══ TE-FORM ═══
  { suf: 'って', rep: ['う','つ','る'], desc: 'て form' },
  { suf: 'いて', rep: ['く'], desc: 'て form' },
  { suf: 'いで', rep: ['ぐ'], desc: 'て form' },
  { suf: 'んで', rep: ['む','ぶ','ぬ'], desc: 'て form' },
  { suf: 'して', rep: ['す'], desc: 'て form' },
  // ═══ NAI-FORM (negative) ═══
  { suf: 'わなかった', rep: ['う'], desc: 'đã không' },
  { suf: 'かなかった', rep: ['く'], desc: 'đã không' },
  { suf: 'がなかった', rep: ['ぐ'], desc: 'đã không' },
  { suf: 'さなかった', rep: ['す'], desc: 'đã không' },
  { suf: 'たなかった', rep: ['つ'], desc: 'đã không' },
  { suf: 'ななかった', rep: ['ぬ'], desc: 'đã không' },
  { suf: 'ばなかった', rep: ['ぶ'], desc: 'đã không' },
  { suf: 'まなかった', rep: ['む'], desc: 'đã không' },
  { suf: 'らなかった', rep: ['る'], desc: 'đã không' },
  { suf: 'なかった', rep: ['る','い'], desc: 'đã không' },
  { suf: 'わない', rep: ['う'], desc: 'không (nai)' },
  { suf: 'かない', rep: ['く'], desc: 'không (nai)' },
  { suf: 'がない', rep: ['ぐ'], desc: 'không (nai)' },
  { suf: 'さない', rep: ['す'], desc: 'không (nai)' },
  { suf: 'たない', rep: ['つ'], desc: 'không (nai)' },
  { suf: 'ばない', rep: ['ぶ'], desc: 'không (nai)' },
  { suf: 'まない', rep: ['む'], desc: 'không (nai)' },
  { suf: 'らない', rep: ['る'], desc: 'không (nai)' },
  { suf: 'ない', rep: ['る'], desc: 'không (nai ichidan)' },
  // ═══ ADJECTIVE ═══
  { suf: 'くありません', rep: ['い'], desc: 'không (adj lịch sự)' },
  { suf: 'かったです', rep: ['い'], desc: 'đã (adj lịch sự)' },
  { suf: 'くなかった', rep: ['い'], desc: 'đã không (adj)' },
  { suf: 'かった', rep: ['い'], desc: 'đã (adj quá khứ)' },
  { suf: 'くない', rep: ['い'], desc: 'không (adj phủ định)' },
  { suf: 'くて', rep: ['い'], desc: 'て form (adj)' },
  { suf: 'さ', rep: ['い'], desc: 'danh từ hóa (adj)' },
  // ═══ IMPERATIVE ═══
  { suf: 'ろ', rep: ['る'], desc: 'mệnh lệnh (ichidan)' },
  // ═══ SIMPLE TAIL ═══
  { suf: 'た', rep: ['る'], desc: 'quá khứ' },
  { suf: 'て', rep: ['る'], desc: 'て form' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Intelligent de-inflector
// ═══════════════════════════════════════════════════════════════════════════

interface VocabHit {
  word: string; reading: string; meaning: string; type: string;
  romaji: string; jlpt: string; hanViet?: string; tags: string[];
  dictForm: string; conjugation?: string;
}

function tryDeinflect(text: string): VocabHit | null {
  ensureMaps();

  // A0) COMPOUND VOCAB — highest priority to prevent incorrect splitting
  //     e.g. すき焼き→sukiyaki, NOT すき+焼き; 焼き肉→yakiniku, NOT 焼き+肉
  const compound = COMPOUND_VOCAB.get(text);
  if (compound) {
    return {
      word: text, reading: compound.reading, romaji: compound.romaji,
      meaning: compound.meaning, type: compound.type,
      jlpt: compound.jlpt || '', hanViet: getHanVietForWord(text) || undefined,
      tags: compound.tags || [], dictForm: text,
    };
  }

  // A1) Exact match by WORD (kanji/word form — high confidence)
  const exactWord = vocabByWord!.get(text);
  if (exactWord) return { ...exactWord, dictForm: exactWord.word, tags: exactWord.tags || [] };

  // B) Irregular verb する (standalone hiragana conjugations)
  const suruMatch = matchIrregularSuru(text);
  if (suruMatch) {
    const suruEntry = directLookup('する');
    if (suruEntry) return { ...suruEntry, dictForm: 'する', conjugation: suruMatch.conjugation, tags: suruEntry.tags || [] };
  }

  // C) Irregular verb 来る (hiragana conjugations like きた, きて, こない)
  const kuruMatch = matchIrregularKuru(text);
  if (kuruMatch) {
    const kuruEntry = directLookup('来る');
    if (kuruEntry) return { ...kuruEntry, dictForm: '来る', conjugation: kuruMatch.conjugation, tags: kuruEntry.tags || [] };
  }

  // C2) Irregular verb 行く (行った/行って instead of regular 行いた/行いて)
  const ikuMatch = matchIrregularIku(text);
  if (ikuMatch) {
    const ikuEntry = directLookup('行く');
    if (ikuEntry) return { ...ikuEntry, dictForm: '行く', conjugation: ikuMatch.conjugation, tags: ikuEntry.tags || [] };
  }

  // A2) Exact match by READING (lower confidence — after irregular verb check)
  const exactReading = vocabByReading!.get(text);
  if (exactReading) return { ...exactReading, dictForm: exactReading.word, tags: exactReading.tags || [] };

  // E) Phrase lookup (multi-word expressions from DB)
  ensurePhrases();
  const phraseHit = phraseDirectLookup(text);
  if (phraseHit) {
    return {
      word: phraseHit.word, reading: phraseHit.reading, meaning: phraseHit.meaning,
      type: 'Quán dụng ngữ', romaji: '', jlpt: '', tags: [],
      dictForm: phraseHit.word,
    };
  }

  // F) Exhaustive de-inflection rules — BEFORE する-compound to avoid false positives
  //    (話した → 話す via rule, not 話+する-compound)
  for (const rule of DEINFLECT) {
    if (text.length > rule.suf.length && text.endsWith(rule.suf)) {
      const stem = text.slice(0, -rule.suf.length);
      for (const rep of rule.rep) {
        const cand = stem + rep;
        const found = directLookup(cand);
        if (found) return { ...found, dictForm: found.word, conjugation: rule.desc, tags: found.tags || [] };
      }
    }
  }

  // D) する-compound: noun + する conjugation (勉強した, 勉強しています, etc.)
  //    Moved AFTER regular de-inflection to avoid false positives on regular verbs
  const suruComp = trySuruCompound(text);
  if (suruComp) {
    const nounEntry = directLookup(suruComp.nounPart);
    if (nounEntry) {
      const meaning = nounEntry.meaning ? nounEntry.meaning + 'する' : '';
      return {
        word: suruComp.nounPart + 'する', reading: (nounEntry.reading || '') + 'する',
        meaning, type: 'Động từ ~する', romaji: (nounEntry.romaji || '') + ' suru',
        jlpt: nounEntry.jlpt || '', hanViet: nounEntry.hanViet,
        tags: nounEntry.tags || [], dictForm: suruComp.nounPart + 'する',
        conjugation: suruComp.suruDesc || undefined,
      };
    }
  }

  // G) Suffix stripping (田中さん → 田中 + さん, 日本的 → 日本 + 的)
  const sufResult = trySuffixSplit(text);
  if (sufResult) {
    const e = sufResult.stemEntry;
    return {
      word: text, reading: (e.reading || '') + sufResult.suffix.text,
      meaning: (e.meaning || sufResult.stem) + ' ' + sufResult.suffix.meaning,
      type: e.type || 'Danh từ', romaji: e.romaji || '', jlpt: e.jlpt || '',
      hanViet: e.hanViet, tags: e.tags || [], dictForm: sufResult.stem,
    };
  }

  // H) Prefix stripping (お茶 → お + 茶, 不安 → 不 + 安)
  const preResult = tryPrefixSplit(text);
  if (preResult) {
    const e = preResult.restEntry;
    return {
      word: text, reading: preResult.prefix.text + (e.reading || ''),
      meaning: preResult.prefix.meaning + ' ' + (e.meaning || ''),
      type: e.type || 'Danh từ', romaji: e.romaji || '', jlpt: e.jlpt || '',
      hanViet: e.hanViet, tags: e.tags || [], dictForm: text,
    };
  }

  // I) Built-in hiragana word fallback
  const builtIn = builtInLookup(text);
  if (builtIn) {
    const typeStr = builtIn.type === PartType.ADJECTIVE ? 'Tính từ -i'
      : builtIn.type === PartType.CONJUNCTION ? 'Liên từ'
      : builtIn.type === PartType.VERB ? 'Động từ' : 'Danh từ';
    return {
      word: text, reading: text, meaning: builtIn.meaning,
      type: typeStr, romaji: builtIn.romaji || '', jlpt: '', tags: [],
      dictForm: text,
    };
  }

  // J) Masu-stem reconstruction: bare stem → dictionary form
  // Ichidan: 食べ → 食べる, Godan: 飲み → 飲む, 書き → 書く
  if (text.length >= 2) {
    // Ichidan: try appending る
    const ichidanCand = text + 'る';
    const ichidanHit = directLookup(ichidanCand);
    if (ichidanHit) return { ...ichidanHit, dictForm: ichidanHit.word, conjugation: 'masu gốc', tags: ichidanHit.tags || [] };
    // Godan: replace last i-dan kana with u-dan dictionary ending
    const MASU_GODAN: Record<string, string> = {
      'い': 'う', 'き': 'く', 'ぎ': 'ぐ', 'し': 'す',
      'ち': 'つ', 'に': 'ぬ', 'び': 'ぶ', 'み': 'む', 'り': 'る',
    };
    const lastCh = text[text.length - 1];
    if (MASU_GODAN[lastCh]) {
      const godanCand = text.slice(0, -1) + MASU_GODAN[lastCh];
      const godanHit = directLookup(godanCand);
      if (godanHit) return { ...godanHit, dictForm: godanHit.word, conjugation: 'masu gốc', tags: godanHit.tags || [] };
    }
    // Try removing trailing ん and adding む (e.g. 飲ん → 飲む from te-form 飲んで)
    if (lastCh === 'ん') {
      for (const end of ['む', 'ぶ', 'ぬ']) {
        const cand = text.slice(0, -1) + end;
        const hit = directLookup(cand);
        if (hit) return { ...hit, dictForm: hit.word, tags: hit.tags || [] };
      }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Particles, conjunctions, auxiliaries (ordered longest first)
// ═══════════════════════════════════════════════════════════════════════════

interface PKnown { text: string; meaning: string; type: PartType; role?: string; }

const KNOWN: PKnown[] = [
  // ─── Compound conjunctions / adverbs ───
  { text: 'それにもかかわらず', meaning: 'Mặc dù vậy', type: PartType.CONJUNCTION },
  { text: 'それにしても', meaning: 'Dù sao thì', type: PartType.CONJUNCTION },
  { text: 'にもかかわらず', meaning: 'Mặc dù', type: PartType.CONJUNCTION },
  { text: 'ところが', meaning: 'Tuy nhiên, thế nhưng', type: PartType.CONJUNCTION },
  { text: 'けれども', meaning: 'Mặc dù, nhưng', type: PartType.CONJUNCTION },
  { text: 'すなわち', meaning: 'Tức là, nói cách khác', type: PartType.CONJUNCTION },
  { text: 'したがって', meaning: 'Do đó, vì thế', type: PartType.CONJUNCTION },
  { text: 'それでは', meaning: 'Vậy thì, nếu vậy', type: PartType.CONJUNCTION },
  { text: 'ところで', meaning: 'Nhân tiện, à mà', type: PartType.CONJUNCTION },
  { text: 'について', meaning: 'Về, liên quan đến', type: PartType.PARTICLE },
  { text: 'にとって', meaning: 'Đối với', type: PartType.PARTICLE },
  { text: 'に対して', meaning: 'Đối với, ngược lại', type: PartType.PARTICLE },
  { text: 'に関して', meaning: 'Liên quan đến', type: PartType.PARTICLE },
  { text: 'によって', meaning: 'Bởi, tùy theo', type: PartType.PARTICLE },
  { text: 'において', meaning: 'Tại, trong', type: PartType.PARTICLE },
  { text: 'として', meaning: 'Với tư cách là', type: PartType.PARTICLE },
  { text: 'による', meaning: 'Do, bởi', type: PartType.PARTICLE },
  { text: 'のような', meaning: 'Giống như', type: PartType.PARTICLE },
  { text: 'ために', meaning: 'Để, vì', type: PartType.PARTICLE },
  { text: 'だから', meaning: 'Vì vậy, cho nên', type: PartType.CONJUNCTION },
  { text: 'ですから', meaning: 'Vì vậy (lịch sự)', type: PartType.CONJUNCTION },
  { text: 'しかし', meaning: 'Tuy nhiên', type: PartType.CONJUNCTION },
  { text: 'そして', meaning: 'Và rồi, sau đó', type: PartType.CONJUNCTION },
  { text: 'それから', meaning: 'Sau đó', type: PartType.CONJUNCTION },
  { text: 'それで', meaning: 'Vì thế, thế nên', type: PartType.CONJUNCTION },
  { text: 'それに', meaning: 'Hơn nữa', type: PartType.CONJUNCTION },
  { text: 'つまり', meaning: 'Tức là, nghĩa là', type: PartType.CONJUNCTION },
  { text: 'けれど', meaning: 'Nhưng mà', type: PartType.CONJUNCTION },
  { text: 'また', meaning: 'Lại, ngoài ra', type: PartType.CONJUNCTION },
  { text: 'そこで', meaning: 'Thế là, vì thế', type: PartType.CONJUNCTION },
  { text: 'すると', meaning: 'Thế rồi', type: PartType.CONJUNCTION },
  { text: 'ただし', meaning: 'Tuy nhiên, nhưng', type: PartType.CONJUNCTION },
  // ─── Compound particles ───
  { text: 'ながら', meaning: 'Trong khi', type: PartType.PARTICLE },
  { text: 'ばかり', meaning: 'Chỉ toàn, vừa mới', type: PartType.PARTICLE },
  { text: 'くらい', meaning: 'Khoảng, tầm', type: PartType.PARTICLE },
  { text: 'ぐらい', meaning: 'Khoảng, tầm', type: PartType.PARTICLE },
  { text: 'らしい', meaning: 'Hình như, có vẻ', type: PartType.AUXILIARY },
  { text: 'みたい', meaning: 'Giống như, có vẻ', type: PartType.AUXILIARY },
  { text: 'ようだ', meaning: 'Có vẻ như', type: PartType.AUXILIARY },
  { text: 'そうだ', meaning: 'Nghe nói / có vẻ', type: PartType.AUXILIARY },
  // ─── Simple particles ───
  { text: 'から', meaning: 'Từ, vì', type: PartType.PARTICLE },
  { text: 'まで', meaning: 'Đến, tới', type: PartType.PARTICLE },
  { text: 'より', meaning: 'Hơn, so với', type: PartType.PARTICLE },
  { text: 'ので', meaning: 'Vì, bởi vì', type: PartType.PARTICLE, role: 'Nguyên nhân' },
  { text: 'のに', meaning: 'Mặc dù, dù rằng', type: PartType.PARTICLE },
  { text: 'ほど', meaning: 'Đến mức', type: PartType.PARTICLE },
  { text: 'だけ', meaning: 'Chỉ', type: PartType.PARTICLE },
  { text: 'しか', meaning: 'Chỉ (+ phủ định)', type: PartType.PARTICLE },
  { text: 'さえ', meaning: 'Ngay cả', type: PartType.PARTICLE },
  { text: 'こそ', meaning: 'Chính là', type: PartType.PARTICLE },
  { text: 'など', meaning: 'Vv, chẳng hạn', type: PartType.PARTICLE },
  { text: 'なら', meaning: 'Nếu (là)', type: PartType.PARTICLE },
  { text: 'でも', meaning: 'Nhưng, dù', type: PartType.CONJUNCTION },
  { text: 'けど', meaning: 'Nhưng', type: PartType.CONJUNCTION },
  { text: 'ても', meaning: 'Dù cho', type: PartType.PARTICLE },
  { text: 'って', meaning: 'Nghe nói, rằng', type: PartType.PARTICLE },
  { text: 'とは', meaning: 'Cái gọi là', type: PartType.PARTICLE },
  { text: 'では', meaning: 'Vậy thì / ở', type: PartType.PARTICLE },
  { text: 'には', meaning: 'Để, đối với', type: PartType.PARTICLE },
  { text: 'もう', meaning: 'Đã, rồi', type: PartType.OTHER },
  { text: 'まだ', meaning: 'Vẫn, chưa', type: PartType.OTHER },
  { text: 'とても', meaning: 'Rất', type: PartType.OTHER },
  { text: 'もっと', meaning: 'Hơn nữa', type: PartType.OTHER },
  { text: 'ずっと', meaning: 'Mãi, suốt', type: PartType.OTHER },
  { text: 'やっぱり', meaning: 'Quả nhiên, vẫn', type: PartType.OTHER },
  { text: 'やはり', meaning: 'Quả nhiên, vẫn', type: PartType.OTHER },
  { text: 'たぶん', meaning: 'Có lẽ', type: PartType.OTHER },
  { text: 'きっと', meaning: 'Chắc chắn', type: PartType.OTHER },
  { text: 'ぜんぜん', meaning: 'Hoàn toàn (không)', type: PartType.OTHER },
  // ─── Single-char particles ───
  { text: 'が', meaning: 'Nhưng / Chủ ngữ', type: PartType.PARTICLE, role: 'Chủ ngữ' },
  { text: 'を', meaning: '(trợ từ tân ngữ)', type: PartType.PARTICLE, role: 'Tân ngữ' },
  { text: 'に', meaning: 'Ở, đến, cho', type: PartType.PARTICLE, role: 'Gián tiếp' },
  { text: 'で', meaning: 'Ở, bằng', type: PartType.PARTICLE, role: 'Phương tiện/Nơi' },
  { text: 'と', meaning: 'Và, với, rằng', type: PartType.PARTICLE },
  { text: 'は', meaning: '(trợ từ chủ đề)', type: PartType.PARTICLE, role: 'Chủ đề' },
  { text: 'も', meaning: 'Cũng', type: PartType.PARTICLE },
  { text: 'の', meaning: 'Của', type: PartType.PARTICLE, role: 'Sở hữu' },
  { text: 'へ', meaning: 'Về phía', type: PartType.PARTICLE },
  { text: 'か', meaning: 'Hay, không', type: PartType.PARTICLE },
  { text: 'よ', meaning: '(nhấn mạnh)', type: PartType.PARTICLE },
  { text: 'ね', meaning: '(xác nhận)', type: PartType.PARTICLE },
  { text: 'な', meaning: '(cảm thán)', type: PartType.PARTICLE },
  { text: 'ぞ', meaning: '(nhấn mạnh, nam)', type: PartType.PARTICLE },
  { text: 'わ', meaning: '(nhẹ nhàng)', type: PartType.PARTICLE },
  { text: 'や', meaning: 'Và (liệt kê)', type: PartType.PARTICLE },
  { text: 'ぜ', meaning: '(mạnh, nam)', type: PartType.PARTICLE },
  { text: 'さ', meaning: '(nhẹ nhàng)', type: PartType.PARTICLE },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Common auxiliary endings (copula, desu/da, etc.)
// ═══════════════════════════════════════════════════════════════════════════

const AUX_ENDINGS: { text: string; meaning: string }[] = [
  { text: 'でございます', meaning: 'là (kính ngữ)' },
  { text: 'でしょう', meaning: 'có lẽ, chắc' },
  { text: 'だろう', meaning: 'có lẽ, chắc' },
  { text: 'ではない', meaning: 'không phải' },
  { text: 'じゃない', meaning: 'không phải' },
  { text: 'ではありません', meaning: 'không phải (lịch sự)' },
  { text: 'でした', meaning: 'đã là (lịch sự)' },
  { text: 'だった', meaning: 'đã là' },
  { text: 'です', meaning: 'là (lịch sự)' },
  { text: 'だ', meaning: 'là' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Proper noun detection
// ═══════════════════════════════════════════════════════════════════════════

const COMMON_NAMES = new Set([
  '田中','山田','佐藤','鈴木','高橋','渡辺','伊藤','中村','小林','加藤',
  '吉田','山本','松本','井上','木村','林','斎藤','清水','山口','阿部',
  '太郎','花子','一郎','次郎','三郎','美咲','大輔','翔太','陽子','恵子',
  '先生','社長','部長','課長','係長','会長','教授','博士',
  '東京','大阪','京都','名古屋','横浜','神戸','札幌','福岡','広島','仙台',
  '北海道','沖縄','富士','日本','中国','韓国','アメリカ','イギリス',
]);

function isProbablyName(text: string): boolean {
  if (COMMON_NAMES.has(text)) return true;
  if (text.length >= 2 && [...text].every(c => cc(c) === 'katakana') && !directLookup(text)) return true;
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: Type mapping
// ═══════════════════════════════════════════════════════════════════════════

function mapType(typeStr: string): PartType {
  const t = typeStr.toLowerCase();
  if (t.includes('動詞') || t.includes('verb') || t.includes('động từ')) return PartType.VERB;
  if (t.includes('名詞') || t.includes('noun') || t.includes('danh từ')) return PartType.NOUN;
  if (t.includes('形容') || t.includes('adj') || t.includes('tính từ')) return PartType.ADJECTIVE;
  if (t.includes('助詞') || t.includes('particle') || t.includes('trợ từ')) return PartType.PARTICLE;
  if (t.includes('接続') || t.includes('conj') || t.includes('liên từ')) return PartType.CONJUNCTION;
  if (t.includes('助動') || t.includes('aux')) return PartType.AUXILIARY;
  if (t.includes('副詞') || t.includes('phó từ')) return PartType.OTHER;
  return PartType.NOUN;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: Grammar pattern detector
// ═══════════════════════════════════════════════════════════════════════════

function detectGrammarPatterns(tokens: Token[]): GrammarStructure[] {
  const result: GrammarStructure[] = [];
  const fullText = tokens.map(t => t.text).join('');
  const seen = new Set<string>();

  const GRAMMAR_SCAN = [
    'ている', 'ていた', 'ています', 'てしまう', 'てしまった',
    'ことができる', 'ことがある', 'ようにする', 'ようになる',
    'なければならない', 'なくてもいい', 'ないで',
    'ながら', 'ので', 'のに', 'ために', 'ように',
    'ばかり', 'だけ', 'しか', 'さえ', 'こそ', 'ほど',
    'そうだ', 'ようだ', 'らしい', 'みたい', 'はずだ', 'わけだ',
    'てくる', 'ていく', 'ておく', 'てある', 'てみる',
    'させる', 'られる', 'させられる',
    'ましょう', 'ませんか',
  ];

  const simpleMap: Record<string, string> = {
    'ている': 'Đang (trạng thái tiếp diễn)',
    'ていた': 'Đang (quá khứ tiếp diễn)',
    'ています': 'Đang (lịch sự)',
    'てしまう': 'Hoàn thành / tiếc nuối',
    'てしまった': 'Đã hoàn toàn (tiếc)',
    'てくる': 'Đến / bắt đầu',
    'ていく': 'Đi / tiếp tục',
    'ておく': 'Chuẩn bị trước',
    'てある': 'Ở trạng thái (kết quả)',
    'てみる': 'Thử xem',
    'させる': 'Bắt / cho phép (sai khiến)',
    'られる': 'Bị / có thể (bị động/khả năng)',
    'させられる': 'Bị bắt (sai khiến bị động)',
    'ので': 'Vì, bởi vì',
    'のに': 'Mặc dù, dù rằng',
    'ために': 'Để, vì',
    'ように': 'Để mà, giống như',
    'ながら': 'Trong khi, mặc dù',
    'ばかり': 'Chỉ toàn, vừa mới',
    'ましょう': 'Hãy cùng (rủ)',
    'ませんか': 'Có muốn không (mời)',
    'ことができる': 'Có thể',
    'ことがある': 'Đã từng / thỉnh thoảng',
    'なければならない': 'Phải, bắt buộc',
    'なくてもいい': 'Không cần, được phép không',
    'そうだ': 'Nghe nói / có vẻ',
    'ようだ': 'Có vẻ như, dường như',
    'らしい': 'Hình như, có vẻ',
    'みたい': 'Giống như, có vẻ',
    'はずだ': 'Chắc hẳn, lẽ ra phải',
    'わけだ': 'Có nghĩa là, tức là',
  };

  for (const pat of GRAMMAR_SCAN) {
    if (fullText.includes(pat) && !seen.has(pat)) {
      seen.add(pat);
      const gEntry = lookupGrammar(pat);
      if (gEntry) {
        result.push({
          structure: gEntry.pattern || `〜${pat}`,
          meaning: gEntry.meaning || '',
          usage: '',
          construction: '',
          jlpt: gEntry.jlpt || undefined,
        });
      } else if (simpleMap[pat]) {
        result.push({
          structure: `〜${pat}`,
          meaning: simpleMap[pat],
          usage: '',
          construction: '',
        });
      }
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: Post-process — roles, enrichment
// ═══════════════════════════════════════════════════════════════════════════

function assignRoles(tokens: Token[]): void {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const next = tokens[i + 1];
    const prev = tokens[i - 1];
    if ((t.text === 'は' || t.text === 'が') && t.type === PartType.PARTICLE) {
      if (prev && (prev.type === PartType.NOUN || prev.type === PartType.VERB || prev.type === PartType.ADJECTIVE)) {
        prev.grammaticalRole = 'MAIN_SUBJECT' as any;
        prev.roleDescription = t.text === 'は' ? 'Chủ đề' : 'Chủ ngữ';
      }
    }
    if (t.text === 'を' && t.type === PartType.PARTICLE) {
      if (prev && prev.type === PartType.NOUN) prev.roleDescription = 'Tân ngữ';
    }
    if ((t.type === PartType.VERB || t.type === PartType.ADJECTIVE) &&
        (!next || next.type === PartType.PUNCTUATION || next.type === PartType.PARTICLE)) {
      if (!t.grammaticalRole) {
        t.grammaticalRole = 'MAIN_PREDICATE' as any;
        t.roleDescription = t.roleDescription || 'Vị ngữ';
      }
    }
    if (t.type === PartType.AUXILIARY) t.roleDescription = 'Trợ động từ';
  }
}

function enrichWithKanji(tokens: Token[]): void {
  for (const t of tokens) {
    if (!t.hanViet) {
      const hv = getHanVietForWord(t.text);
      if (hv) t.hanViet = hv;
    }
    if (!t.reading && [...t.text].some(isKanji)) {
      const chars = [...t.text];
      const readings: string[] = [];
      let hasReadings = false;
      for (const ch of chars) {
        if (isKanji(ch)) {
          const kEntry = lookupKanji(ch);
          if (kEntry && kEntry.kunyomi) {
            const firstReading = kEntry.kunyomi.split(/[,、\s]+/)[0].replace(/[-.]/g, '');
            readings.push(firstReading);
            hasReadings = true;
          } else readings.push(ch);
        } else readings.push(ch);
      }
      if (hasReadings) t.reading = readings.join('');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11: Sentence segmentation
// ═══════════════════════════════════════════════════════════════════════════

function splitSentences(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    current += ch;
    if (ch === '。' || ch === '！' || ch === '？') {
      if (current.trim()) parts.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12: MAIN TOKENIZER ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function tokenizeSentence(text: string, startId: number): { tokens: Token[]; nextId: number } {
  ensureMaps();
  const tokens: Token[] = [];
  let pos = 0;
  let tid = startId;
  const textLen = text.length;
  const scanMax = Math.min(maxWordLen, 20);

  while (pos < textLen) {
    const ch = text[pos];
    const cType = cc(ch);

    // ── PUNCT ──
    if (cType === 'punct') {
      tokens.push({ id: `lt${tid++}`, text: ch, type: PartType.PUNCTUATION });
      pos++;
      continue;
    }
    // ── ASCII (with numeral+counter detection) ──
    if (cType === 'ascii') {
      // Try numeral parse first (e.g. "3人", "100円")
      const numResult = tryParseNumeral(text, pos);
      if (numResult) {
        tokens.push({
          id: `lt${tid++}`, text: numResult.text, type: PartType.NOUN,
          reading: numResult.reading, meaning: numResult.meaning,
          deepDive: { tags: numResult.counterInfo ? ['Counter', `${numResult.counterInfo.usedFor}`] : ['Number'] },
        });
        pos += numResult.text.length;
        continue;
      }
      let end = pos + 1;
      while (end < textLen && cc(text[end]) === 'ascii') end++;
      tokens.push({ id: `lt${tid++}`, text: text.substring(pos, end), type: PartType.OTHER });
      pos = end;
      continue;
    }

    // ── ONOMATOPOEIA (check before vocab to catch ドキドキ etc.) ──
    const onomMatch = tryMatchOnomatopoeia(text, pos);
    if (onomMatch) {
      tokens.push({
        id: `lt${tid++}`, text: onomMatch.word, type: PartType.OTHER,
        meaning: onomMatch.info.meaning,
        roleDescription: `Từ tượng ${onomMatch.info.type === 'giả thanh' ? 'thanh' : onomMatch.info.type === 'giả trạng' ? 'hình' : onomMatch.info.type === 'giả tình' ? 'cảm' : 'thái'}`,
        deepDive: { tags: ['Onomatopoeia', 'Giả thanh/thái'], usageNote: `Loại: ${onomMatch.info.type}` },
      });
      pos += onomMatch.word.length;
      continue;
    }

    // ── KANJI NUMERAL (三百五十人, 二千円, etc.) ──
    if (cType === 'kanji' && isNumeralKanji(ch)) {
      const numResult = tryParseNumeral(text, pos);
      if (numResult && numResult.text.length >= 2) {
        tokens.push({
          id: `lt${tid++}`, text: numResult.text, type: PartType.NOUN,
          reading: numResult.reading, meaning: numResult.meaning,
          hanViet: getHanVietForWord(numResult.text) || undefined,
          deepDive: { tags: numResult.counterInfo ? ['Counter', `${numResult.counterInfo.usedFor}`] : ['Number'] },
        });
        pos += numResult.text.length;
        continue;
      }
    }

    // ── STEP 1: Greedy longest-match from vocab DB ──
    const maxSpan = Math.min(scanMax, textLen - pos);
    let bestHit: { entry: VocabHit; len: number } | null = null;
    for (let len = maxSpan; len >= 1; len--) {
      const substr = text.substring(pos, pos + len);
      if (cc(substr[substr.length - 1]) === 'punct') continue;
      const result = tryDeinflect(substr);
      if (result) {
        if (len === 1 && cType === 'hiragana' && !KNOWN.some(k => k.text === substr)) continue;
        bestHit = { entry: result, len };
        break;
      }
    }

    // ── STEP 2: Try known particles/conjunctions/aux ──
    let knownMatch: PKnown | null = null;
    for (const k of KNOWN) {
      if (pos + k.text.length <= textLen && text.substring(pos, pos + k.text.length) === k.text) {
        knownMatch = k;
        break;
      }
    }

    // ── STEP 3: Try auxiliary endings ──
    let auxMatch: { text: string; meaning: string } | null = null;
    for (const a of AUX_ENDINGS) {
      if (pos + a.text.length <= textLen && text.substring(pos, pos + a.text.length) === a.text) {
        auxMatch = a;
        break;
      }
    }

    // ── DECISION: Prefer vocab hit if longer than particle ──
    if (bestHit && (!knownMatch || bestHit.len > knownMatch.text.length)) {
      const tokenText = text.substring(pos, pos + bestHit.len);
      const e = bestHit.entry;
      const hv = e.hanViet || getHanVietForWord(tokenText);
      tokens.push({
        id: `lt${tid++}`,
        text: tokenText,
        reading: e.reading || undefined,
        romaji: e.romaji || undefined,
        meaning: e.meaning || undefined,
        type: mapType(e.type || ''),
        hanViet: hv || undefined,
        deepDive: {
          dictionaryForm: e.dictForm !== tokenText ? e.dictForm : undefined,
          dictionaryReading: e.reading || undefined,
          conjugation: e.conjugation || undefined,
          tags: e.jlpt ? [`JLPT ${e.jlpt}`] : [],
        },
      });
      pos += bestHit.len;
      continue;
    }

    // ── PARTICLE/CONJUNCTION/AUX ──
    if (knownMatch) {
      tokens.push({
        id: `lt${tid++}`,
        text: knownMatch.text,
        type: knownMatch.type,
        meaning: knownMatch.meaning,
        roleDescription: knownMatch.role,
      });
      pos += knownMatch.text.length;
      continue;
    }
    if (auxMatch) {
      tokens.push({
        id: `lt${tid++}`,
        text: auxMatch.text,
        type: PartType.AUXILIARY,
        meaning: auxMatch.meaning,
        roleDescription: 'Trợ động từ',
      });
      pos += auxMatch.text.length;
      continue;
    }

    // ── STEP 4: Katakana chunk → proper noun or loanword ──
    if (cType === 'katakana') {
      let end = pos + 1;
      while (end < textLen && (cc(text[end]) === 'katakana' || text[end] === 'ー')) end++;
      const segment = text.substring(pos, end);
      const found = tryDeinflect(segment);
      if (found) {
        tokens.push({
          id: `lt${tid++}`, text: segment,
          reading: found.reading, romaji: found.romaji, meaning: found.meaning,
          type: mapType(found.type), hanViet: found.hanViet || undefined,
          deepDive: { tags: found.jlpt ? [`JLPT ${found.jlpt}`] : [] },
        });
      } else {
        tokens.push({
          id: `lt${tid++}`, text: segment, type: PartType.NOUN,
          meaning: isProbablyName(segment) ? '(Tên riêng)' : '(Ngoại lai ngữ)',
          roleDescription: isProbablyName(segment) ? 'Tên riêng' : 'Danh từ ngoại lai',
          deepDive: { tags: ['Katakana'] },
        });
      }
      pos = end;
      continue;
    }

    // ── STEP 5: Kanji chunk (possibly with trailing hiragana = okurigana) ──
    if (cType === 'kanji') {
      let kanjiEnd = pos + 1;
      while (kanjiEnd < textLen && isKanji(text[kanjiEnd])) kanjiEnd++;
      let fullEnd = kanjiEnd;
      while (fullEnd < textLen && cc(text[fullEnd]) === 'hiragana') fullEnd++;
      let found: VocabHit | null = null;
      let hitLen = 0;
      for (let tryLen = fullEnd - pos; tryLen >= kanjiEnd - pos; tryLen--) {
        const tryText = text.substring(pos, pos + tryLen);
        const result = tryDeinflect(tryText);
        if (result) { found = result; hitLen = tryLen; break; }
      }
      if (!found) {
        const kanjiOnly = text.substring(pos, kanjiEnd);
        found = tryDeinflect(kanjiOnly);
        if (found) hitLen = kanjiEnd - pos;
      }
      if (found && hitLen > 0) {
        const tokenText = text.substring(pos, pos + hitLen);
        tokens.push({
          id: `lt${tid++}`, text: tokenText,
          reading: found.reading, romaji: found.romaji, meaning: found.meaning,
          type: mapType(found.type),
          hanViet: found.hanViet || getHanVietForWord(tokenText) || undefined,
          deepDive: {
            dictionaryForm: found.dictForm !== tokenText ? found.dictForm : undefined,
            dictionaryReading: found.reading || undefined,
            conjugation: found.conjugation || undefined,
            tags: found.jlpt ? [`JLPT ${found.jlpt}`] : [],
          },
        });
        pos += hitLen;
        continue;
      }
      const segment = text.substring(pos, kanjiEnd);
      const hv = getHanVietForWord(segment);
      const isName = isProbablyName(segment);
      tokens.push({
        id: `lt${tid++}`, text: segment, type: PartType.NOUN,
        meaning: isName ? '(Tên riêng)' : undefined,
        hanViet: hv || undefined,
        roleDescription: isName ? 'Tên riêng' : undefined,
        deepDive: { tags: isName ? ['Proper Noun'] : [] },
      });
      pos = kanjiEnd;
      continue;
    }

    // ── STEP 6: Hiragana chunk ──
    if (cType === 'hiragana') {
      let hEnd = pos + 1;
      while (hEnd < textLen && cc(text[hEnd]) === 'hiragana') hEnd++;
      let found: VocabHit | null = null;
      let hitLen = 0;
      for (let len = Math.min(hEnd - pos, scanMax); len >= 2; len--) {
        const tryText = text.substring(pos, pos + len);
        const result = tryDeinflect(tryText);
        if (result) { found = result; hitLen = len; break; }
      }
      if (found && hitLen > 0) {
        const tokenText = text.substring(pos, pos + hitLen);
        tokens.push({
          id: `lt${tid++}`, text: tokenText,
          reading: found.reading, romaji: found.romaji, meaning: found.meaning,
          type: mapType(found.type),
          deepDive: {
            dictionaryForm: found.dictForm !== tokenText ? found.dictForm : undefined,
            tags: found.jlpt ? [`JLPT ${found.jlpt}`] : [],
          },
        });
        pos += hitLen;
        continue;
      }
      tokens.push({ id: `lt${tid++}`, text: ch, type: PartType.OTHER });
      pos++;
      continue;
    }

    // ── FALLBACK ──
    tokens.push({ id: `lt${tid++}`, text: ch, type: PartType.OTHER });
    pos++;
  }

  return { tokens, nextId: tid };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 13: Block-level Vietnamese translation — SOV→SVO reordering
// ═══════════════════════════════════════════════════════════════════════════

function buildTranslation(tokens: Token[]): string {
  // Use the advanced SOV→SVO translation engine
  const svoTranslation = translateTokensToVietnamese(tokens);
  if (svoTranslation && svoTranslation.length > 3) return svoTranslation;
  // Fallback: simple concatenation
  const parts: string[] = [];
  const pMap: Record<string, string> = { '。': '.', '、': ',', '！': '!', '？': '?', '「': '"', '」': '"' };
  for (const t of tokens) {
    if (t.type === PartType.PUNCTUATION) {
      parts.push(pMap[t.text] || t.text);
    } else if (t.meaning && !t.meaning.startsWith('(')) {
      parts.push(t.meaning.split(/[,/]/)[0].trim());
    }
  }
  return parts.join(' ').replace(/\s+([.,!?])/g, '$1').replace(/\s+/g, ' ').trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 14: PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export function localPreTokenize(text: string): AnalysisResult {
  ensureMaps();
  const sentences = splitSentences(text);
  const blocks: SentenceBlock[] = [];
  let globalTid = 0;
  let totalMatched = 0;
  let totalContent = 0;
  let allTokens: Token[] = [];

  for (let si = 0; si < sentences.length; si++) {
    const { tokens, nextId } = tokenizeSentence(sentences[si], globalTid);
    globalTid = nextId;
    enrichWithKanji(tokens);
    assignRoles(tokens);
    // Basic grammar detection
    const basicGrammar = detectGrammarPatterns(tokens);
    // Extended grammar detection (N1-N5 expanded patterns)
    const extendedGrammar = detectExtendedGrammar(tokens);
    // Merge, deduplicate by structure
    const seenStructures = new Set(basicGrammar.map(g => g.structure));
    const mergedGrammar = [...basicGrammar];
    for (const eg of extendedGrammar) {
      if (!seenStructures.has(eg.structure)) {
        seenStructures.add(eg.structure);
        mergedGrammar.push(eg);
      }
    }
    // SOV→SVO translation
    const translation = buildTranslation(tokens);
    const content = tokens.filter(t => t.type !== PartType.PUNCTUATION);
    const matched = content.filter(t => !!t.meaning);
    totalMatched += matched.length;
    totalContent += content.length;
    allTokens = allTokens.concat(tokens);
    blocks.push({
      id: `preview_b${si}`,
      tokens,
      translation: { text: translation || '' },
      grammarStructures: mergedGrammar.length > 0 ? mergedGrammar : undefined,
    });
  }

  const coverage = totalContent > 0 ? Math.round((totalMatched / totalContent) * 100) : 0;
  // Generate enhanced summary with register, complexity, colloquial detection
  const summary = generateEnhancedSummary(blocks, allTokens, coverage, totalMatched, totalContent);

  return {
    blocks,
    summary,
    _isPreview: true,
  } as AnalysisResult & { _isPreview?: boolean };
}

/** Check if a result is a local preview (not full Gemini analysis) */
export function isPreviewResult(result: AnalysisResult): boolean {
  return !!(result as any)?._isPreview;
}
