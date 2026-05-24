import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ExtendedAnalysis, ExtendedGrammarAnalysis, ComparisonResult, ComparisonType, ComparisonItem, RecommendationItem } from '../types';
import { 
  getVocabEnrichmentStrategy, getGrammarEnrichmentStrategy,
  mergeVocabEnrichment, mergeGrammarEnrichment,
  enrichTokensWithLocalData, getLocalDataStats,
  cacheVocabEnrichment, cacheGrammarEnrichment,
  getCachedAnalysis, cacheAnalysis,
  getCachedComparison, cacheComparison
} from './localDataService';

let localTokenizerModulePromise: Promise<typeof import('./localTokenizer')> | null = null;

async function getLocalTokenizer() {
  if (!localTokenizerModulePromise) {
    localTokenizerModulePromise = import('./localTokenizer');
  }
  return localTokenizerModulePromise;
}

// ============================================================
//  NFC Normalizer — fixes decomposed Vietnamese diacritics from AI responses
// ============================================================
function normalizeNFC<T>(obj: T): T {
  if (typeof obj === 'string') return obj.normalize('NFC') as T;
  if (Array.isArray(obj)) return obj.map(normalizeNFC) as T;
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = normalizeNFC(v);
    return out as T;
  }
  return obj;
}

export interface ImageInput {
  mimeType: string;
  data: string;
}

export const TARGET_SENTENCE = "昨日の会議は長引いたが、私の提案は採用されたので、結果は良かった。";

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    const key = import.meta.env.VITE_API_KEY;
    if (!key) throw new Error('VITE_API_KEY chưa được cấu hình. Hãy tạo file .env với API key.');
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
}

// ============================================================
//  IMAGE COMPRESSION — reduce payload before API calls
// ============================================================
function compressImageForAnalysis(base64: string, mimeType: string, maxW = 1400, quality = 0.75): Promise<ImageInput> {
  return new Promise((resolve) => {
    // Skip small images
    if (base64.length < 150_000) {
      resolve({ data: base64, mimeType });
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxW && base64.length < 200_000) {
        resolve({ data: base64, mimeType });
        return;
      }
      const scale = Math.min(maxW / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const [header, content] = dataUrl.split(',');
      const outMime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      resolve({ data: content, mimeType: outMime });
    };
    img.onerror = () => resolve({ data: base64, mimeType });
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

// ============================================================
//  REQUEST DEDUPLICATION — prevent duplicate concurrent API calls
// ============================================================
const inflightRequests = new Map<string, Promise<any>>();

function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) {
    console.log(`[Dedup] Reusing in-flight request for "${key}"`);
    return existing as Promise<T>;
  }
  const promise = fn().finally(() => inflightRequests.delete(key));
  inflightRequests.set(key, promise);
  return promise;
}

// --- SCHEMA FOR SENTENCE ANALYSIS ---
const schema = {
  type: Type.OBJECT,
  properties: {
    blocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          connectionInfo: {
            type: Type.OBJECT,
            nullable: true,
            description: "Describes the logical connection to the PREVIOUS block (if any).",
            properties: {
                type: { 
                    type: Type.STRING, 
                    enum: ['CONTRAST', 'CAUSE_AND_RESULT', 'ELABORATION', 'SEQUENTIAL', 'TOPIC_CHANGE'] 
                },
                description: { type: Type.STRING, description: "Short explanation of the link in Vietnamese, e.g. 'Câu trước nêu vấn đề, câu này giải quyết.'" }
            }
          },
          grammarStructures: {
              type: Type.ARRAY,
              nullable: true,
              description: "List of KEY grammar structures used in this specific block.",
              items: {
                  type: Type.OBJECT,
                  properties: {
                      structure: { type: Type.STRING, description: "The grammar pattern in Japanese, e.g. '〜ている' or '〜に対して'" },
                      reading: { type: Type.STRING, description: "Hiragana reading of the structure. e.g. '〜ている' or '〜にかんして'" },
                      hanViet: { type: Type.STRING, nullable: true, description: "Sino-Vietnamese for Kanji parts in the grammar. e.g. 'Đối' for '対して'. Null if only Kana." },
                      meaning: { type: Type.STRING, description: "Meaning in Vietnamese" },
                      usage: { type: Type.STRING, description: "Detailed explanation of HOW and WHY it is used in this context." },
                      construction: { type: Type.STRING, nullable: true, description: "Formula/Construction rule. e.g. 'Verb (Te-form) + iru' or 'Noun + ni taishite'" },
                      jlpt: { type: Type.STRING, nullable: true, description: "e.g. N5, N4, N3..." }
                  }
              }
          },
          tokens: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                reading: { type: Type.STRING, description: "Hiragana/Katakana reading. e.g. 'かいぎ'" },
                alternativeReadings: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    nullable: true,
                    description: "List other valid readings if they exist. Example: for 'その後', list ['sonoato', 'sonogo', 'sononochi']."
                },
                romaji: { type: Type.STRING },
                hanViet: { type: Type.STRING, nullable: true, description: "Sino-Vietnamese reading for Kanji. For verbs, provide the HV for the root Kanji (e.g. 食べる -> Thực)." },
                pitchAccent: { 
                    type: Type.STRING, 
                    nullable: true, 
                    description: "CRITICAL: The pitch accent of the word *AS IT IS CONJUGATED* in the sentence. Binary string (0=Low, 1=High). Count Moras accurately." 
                },
                pitchPattern: {
                    type: Type.STRING,
                    nullable: true,
                    enum: ['HEIBAN', 'ATAMADAKA', 'NAKADAKA', 'ODAKA', 'UNKNOWN'],
                    description: "The accent pattern type of the *CONTEXTUAL* form."
                },
                meaning: { type: Type.STRING, description: "Meaning in Vietnamese" },
                type: { 
                    type: Type.STRING, 
                    enum: [
                        'NOUN', 'VERB', 'ADJECTIVE', 'PARTICLE', 
                        'CONJUNCTION', 'AUXILIARY', 'PUNCTUATION'
                    ] 
                },
                grammaticalRole: {
                    type: Type.STRING,
                    enum: ['MAIN_SUBJECT', 'MAIN_PREDICATE', 'OTHER'],
                    description: "Identify if this token is the MAIN Subject/Topic or MAIN Predicate of the block. IMPORTANT: Do NOT assign this to particles."
                },
                isGhost: {
                    type: Type.BOOLEAN,
                    nullable: true,
                    description: "Set to TRUE if this token is a Hidden Subject (e.g. '(私)') that is implied but not in the original text."
                },
                roleDescription: { type: Type.STRING, description: "Role in Vietnamese (e.g., Chủ ngữ, Tân ngữ)" },
                mappingId: { type: Type.STRING, nullable: true },
                relatedTokenIds: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    nullable: true,
                    description: "IDs of other tokens in this block that are grammatically or logically connected." 
                },
                deepDive: {
                  type: Type.OBJECT,
                  nullable: true,
                  properties: {
                    dictionaryForm: { type: Type.STRING, nullable: true, description: "The root/dictionary form (e.g. 食べる)" },
                    dictionaryReading: { type: Type.STRING, nullable: true, description: "Hiragana reading of the dictionary form (e.g. たべる)" },
                    dictionaryPitchAccent: { type: Type.STRING, nullable: true, description: "Binary pitch of the DICTIONARY form." },
                    conjugation: { type: Type.STRING, nullable: true, description: "e.g., Thể quá khứ bị động" },
                    conjugationType: { type: Type.STRING, nullable: true },
                    grammaticalRule: { type: Type.STRING, nullable: true },
                    usageNote: { type: Type.STRING, nullable: true, description: "Usage note in Vietnamese" },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Rich tags. Include JLPT Level AND Macro Topics. Examples: 'Politics', 'Economy', 'IT', 'Medical', 'Culture', 'History', 'Science', 'Law', 'Environment', 'Philosophy', 'Anime Slang', 'Keigo', 'Dialect'."
                    },
                    nuanceType: {
                        type: Type.STRING,
                        nullable: true,
                        enum: [
                            'NONE',
                            'POLITE_HONORIFIC',
                            'GIVING_RECEIVING',
                            'EMOTIONAL_PARTICLE',
                            'VOLITIONAL_INVITATION',
                            'PASSIVE',
                            'CAUSATIVE',
                            'CERTAINTY_CONJECTURE',
                            'LIMITATION_EMPHASIS',
                            'TENSE_ASPECT',
                            'REGRET_UNINTENDED',
                            'POTENTIAL',
                            'OBLIGATION',
                            'CONDITION',
                            'REASON',
                            'CONTRAST',
                            'DESIRE_HOPE',
                            'PURPOSE',
                            'COMPARISON',
                            'CHANGE_TRANSFORMATION',
                            'PERMISSION_PROHIBITION',
                            'NEGATION',
                            'QUOTATION'
                        ],
                        description: "The primary grammatical mood or nuance of this token."
                    },
                    verbComponents: {
                      type: Type.ARRAY,
                      nullable: true,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING, enum: ['root', 'auxiliary', 'conjugation'] },
                          part: { type: Type.STRING, description: "The text part (e.g. '食')" },
                          reading: { type: Type.STRING, nullable: true, description: "Hiragana reading (e.g. 'しょく')" },
                          hanViet: { type: Type.STRING, nullable: true, description: "Hán Việt for this specific part (e.g. 'Thực')" },
                          meaning: { type: Type.STRING, description: "Meaning in Vietnamese" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          translation: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "Translation in Vietnamese" },
              mappings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, nullable: true },
                    text: { type: Type.STRING, description: "Vietnamese word segment" }
                  }
                }
              }
            }
          }
        }
      }
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Vietnamese title" },
        translation: { type: Type.STRING, description: "Full Vietnamese translation" },
        nuance: { type: Type.STRING, description: "Nuance explanation in Vietnamese" },
        flow: { type: Type.STRING, description: "Logical flow description in Vietnamese" }
      }
    }
  }
};

const SYSTEM_INSTRUCTION = `You are a Japanese Sentence Surgeon optimized for Vietnamese learners.

TASK:
1. **TARGET LANGUAGE**: All output, translations, meanings, token roles, and grammatical explanations MUST be strictly in **VIETNAMESE** (Tiếng Việt) only. Do NOT include any English translations.

2. **PITCH ACCENT (STRICT RULES)**: 
   - **CONTEXT IS KING**: The \`pitchAccent\` field MUST represent the pitch of the word **AS IT IS CONJUGATED** in the sentence. 
   - **DO NOT** just copy the dictionary pitch if the conjugation changes it.
   - Example: 
     - 食べる (Taberu) -> Dictionary: 2 (Nakadaka) "010"
     - 食べて (Tabete) -> Context: 1 (Atamadaka) "100" -> **Output "100" for Tabete**.
   - **MORA COUNTING**: 
     - Standard Kana (あ, か) = 1 mora.
     - Small Tsu (っ) = 1 mora.
     - Long vowel (ー) = 1 mora.
     - Nasal N (ん) = 1 mora.
     - **Digraphs** (kya, shu, jo) = **1 MORA TOTAL**.
   - In \`deepDive\`, provide the \`dictionaryPitchAccent\` separately for the root form.

3. **BLOCK SEGMENTATION (CRITICAL)**:
   - **DO NOT split blocks aggressively.**
   - **KEEP TOGETHER**: A clause and its reason (e.g., "A kara, B" should be ONE block).
   - **KEEP TOGETHER**: A condition and its result (e.g., "A tara, B" should be ONE block).
   - **KEEP TOGETHER**: Long modifying clauses before a noun.
   - **SPLIT ONLY WHEN**: 
     - There is a full stop (。).
     - There is a "Heavy" conjunction starting a new thought (e.g., "Soshite", "Shikashi").
     - The sentence is a compound sentence with very distinct topics (e.g., "I went to Japan, but he stayed in Vietnam" -> Can be 2 blocks).
   - **GOAL**: A block should represent a **Complete Thought** or a **Complex Sentence Structure**.

4. **TOKENIZATION & ANALYSIS**:
   - **READING**: Provide Hiragana reading for ALL tokens.
   - **ALTERNATIVE READINGS**: If a word has multiple valid readings (e.g. 'その後' -> sonogo / sonoato / sononochi), LIST THEM ALL.
   - **HÁN VIỆT**: Provide Sino-Vietnamese reading for ALL Kanji tokens.
   - **ROLES**: 
     - **MAIN_SUBJECT**: Assign ONLY to the **NOUN/PRONOUN** acting as the topic/subject.
     - **MAIN_PREDICATE**: Assign to the main Verb or Adjective.
   - **HIDDEN SUBJECTS (GHOSTS)**: 
     - If the subject is omitted, INSERT a new token at the start with \`isGhost: true\`.
     - Text should be in parentheses, e.g., "(私)", "(彼)".

5. **GRAMMAR STRUCTURES**:
    - Identify key grammar patterns (e.g., "~Te iru", "~Node").
    - Provide Reading, Hán Việt, and Construction rules.

6. **NUANCE & TYPES**:
   - **Distinguish 'Ga'**: Subject Marker (PARTICLE) vs Contrast Conjunction (CONJUNCTION).
   - Identify specific mood nuances (Desire, Potential, etc.).

7. **VERB DECOMPOSITION**: Detailed breakdown.

8. **OUTPUT**: Strictly JSON matching the schema.`;

// --- SCHEMA FOR VOCABULARY ENRICHMENT ---
const vocabSchema = {
    type: Type.OBJECT,
    properties: {
        canonicalForm: { type: Type.STRING, description: "The standard Japanese written form (Kanji/Kana) for this word. IMPORTANT: If input is Romaji (e.g. 'kokyou'), convert it here (e.g. '故郷')." },
        type: { type: Type.STRING, enum: ['NOUN', 'VERB', 'ADJECTIVE', 'PARTICLE', 'OTHER'], description: "The correct Part of Speech of this word." },
        definitionDetail: { type: Type.STRING, description: "Detailed definition in Vietnamese (Tiếng Việt) only. NEVER output English." },
        transitivity: { 
            type: Type.STRING, 
            enum: ['TRANSITIVE', 'INTRANSITIVE', 'BOTH', 'N/A'],
            description: "Determine if it is 'Tha động từ' (Transitive) or 'Tự động từ' (Intransitive). For Nouns/Adjectives use N/A."
        },
        transitivityPair: {
            type: Type.OBJECT,
            nullable: true,
            description: "If verb has a pair (e.g. Akeru/Aku), provide it here with Kanji and reading. IMPORTANT: Identify the type of the PAIR.",
            properties: {
                text: { type: Type.STRING },
                reading: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['TRANSITIVE', 'INTRANSITIVE'] }
            }
        },
        dictionaryPitchAccent: {
            type: Type.STRING,
            description: "Binary pitch accent string (e.g. '0100') for the DICTIONARY FORM."
        },
        dictionaryPitchPattern: {
             type: Type.STRING,
             nullable: true,
             enum: ['HEIBAN', 'ATAMADAKA', 'NAKADAKA', 'ODAKA', 'UNKNOWN'],
        },
        dictionaryReading: {
             type: Type.STRING,
             description: "The hiragana reading of the DICTIONARY form (e.g., 'たべる'). Important to match with pitch accent."
        },
        conjugations: {
            type: Type.OBJECT,
            nullable: true,
            description: "Only for Verbs and Adjectives. Provide plain/polite forms.",
            properties: {
                dictionary: { type: Type.STRING },
                polite: { type: Type.STRING, description: "~Masu / ~Desu" },
                negative: { type: Type.STRING, description: "~Nai" },
                past: { type: Type.STRING, description: "~Ta / ~Datta" },
                teForm: { type: Type.STRING, description: "~Te" },
                potential: { type: Type.STRING, nullable: true },
                passive: { type: Type.STRING, nullable: true },
                causative: { type: Type.STRING, nullable: true },
                imperative: { type: Type.STRING, nullable: true },
                volitional: { type: Type.STRING, nullable: true }
            }
        },
        examples: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    japanese: { type: Type.STRING },
                    reading: { type: Type.STRING, description: "Full reading with Furigana (e.g. 食べる[たべる]) or just Hiragana" },
                    vietnamese: { type: Type.STRING }
                }
            }
        },
        synonyms: {
            type: Type.ARRAY,
            nullable: true,
            description: "List of synonyms (Từ đồng nghĩa). All meaning fields MUST be in Vietnamese (Tiếng Việt) only. NEVER output English.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    reading: { type: Type.STRING },
                    meaning: { type: Type.STRING, description: "Meaning in Vietnamese (Tiếng Việt) only. NEVER output English." },
                    type: { type: Type.STRING, nullable: true }
                }
            }
        },
        antonyms: {
            type: Type.ARRAY,
            nullable: true,
            description: "List of antonyms (Từ trái nghĩa). All meaning fields MUST be in Vietnamese (Tiếng Việt) only. NEVER output English.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    reading: { type: Type.STRING },
                    meaning: { type: Type.STRING, description: "Meaning in Vietnamese (Tiếng Việt) only. NEVER output English." },
                    type: { type: Type.STRING, nullable: true }
                }
            }
        },
        relatedForms: {
            type: Type.ARRAY,
            nullable: true,
            description: "Related word forms (e.g. Noun form of a Verb, Adverb form of an Adjective, etc). All meaning fields MUST be in Vietnamese (Tiếng Việt) only. NEVER output English.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    reading: { type: Type.STRING },
                    meaning: { type: Type.STRING, description: "Meaning in Vietnamese (Tiếng Việt) only. NEVER output English." },
                    type: { type: Type.STRING, description: "Type description (e.g. 'Danh từ hóa', 'Trạng từ', 'Thể rút gọn')" }
                }
            }
        },
        collocations: {
            type: Type.ARRAY,
            nullable: true,
            description: "Common collocations, compound words, or set phrases using this word. All meaning fields MUST be in Vietnamese (Tiếng Việt) only. NEVER output English.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    reading: { type: Type.STRING },
                    meaning: { type: Type.STRING, description: "Meaning in Vietnamese (Tiếng Việt) only. NEVER output English." },
                    type: { type: Type.STRING, nullable: true }
                }
            }
        },
        kanjiDetails: {
            type: Type.ARRAY,
            nullable: true,
            description: "Detailed breakdown of each Kanji character in the word. All meanings MUST be in Vietnamese (Tiếng Việt) only. NEVER output English.",
            items: {
                type: Type.OBJECT,
                properties: {
                    char: { type: Type.STRING, description: "The Kanji character" },
                    hanViet: { type: Type.STRING, description: "Sino-Vietnamese reading (e.g. 'THỰC')" },
                    onyomi: { type: Type.ARRAY, items: { type: Type.STRING }, description: "On-yomi readings (Katakana)" },
                    kunyomi: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Kun-yomi readings (Hiragana)" },
                    meaning: { type: Type.STRING, description: "Meaning of the single character in Vietnamese (Tiếng Việt) only. NEVER output English." }
                }
            }
        },
        candidates: {
            type: Type.ARRAY,
            nullable: true,
            description: "If the input is ambiguous Romaji or Hiragana (e.g. 'hashi', 'kaku'), provide the most common Kanji homophones here (e.g. 箸, 橋, 端). All meanings MUST be in Vietnamese (Tiếng Việt) only. NEVER output English.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: "The Kanji form (e.g. 箸)" },
                    reading: { type: Type.STRING, description: "The reading (e.g. はし)" },
                    meaning: { type: Type.STRING, description: "Short meaning in Vietnamese (Tiếng Việt) only. NEVER output English." },
                    type: { type: Type.STRING, description: "Word type (NOUN, VERB...)" }
                }
            }
        }
    }
};

// --- SCHEMA FOR GRAMMAR ENRICHMENT ---
const grammarSchema = {
    type: Type.OBJECT,
    properties: {
        structure: { type: Type.STRING, description: "The canonical form of the grammar structure analyzed. IMPORTANT: If input is Romaji, convert this to Japanese (e.g. 'te iru' -> '〜ている')." },
        reading: { type: Type.STRING, description: "Reading of the grammar structure in Hiragana." },
        hanViet: { type: Type.STRING, nullable: true, description: "Sino-Vietnamese reading of any Kanji in the structure." },
        jlpt: { type: Type.STRING, nullable: true, description: "JLPT Level (e.g. N2, N3)." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags (e.g. 'Formal', 'Spoken', 'Politics', 'Economy', 'Science')." },
        generalMeaning: { type: Type.STRING, description: "General meaning of the grammar point in Vietnamese (Tiếng Việt) only. NEVER output English." },
        constructionRules: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of construction formulas (e.g. 'V-Te + iru', 'N + ni taishite')."
        },
        contexts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Situations/Contexts where this is used (e.g. 'Formal writing', 'Casual speech', 'Business')."
        },
        similarStructures: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Legacy list of simple strings. Prefer detailedComparison for new analysis."
        },
        notes: { type: Type.STRING, description: "Important usage notes or warnings (e.g. 'Cannot be used for superiors')." },
        examples: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    japanese: { type: Type.STRING },
                    reading: { type: Type.STRING, description: "Full reading with Furigana" },
                    vietnamese: { type: Type.STRING }
                }
            }
        },
        breakdown: {
            type: Type.ARRAY,
            nullable: true,
            description: "Dissect the structure into atomic parts. IMPORTANT: Be specific about forms. If it uses Plain Form, say 'Plain Form (Futsuu-kei)' instead of just 'Verb'. All meaning fields MUST be in Vietnamese (Tiếng Việt) only. NEVER output English.",
            items: {
                type: Type.OBJECT,
                properties: {
                    part: { type: Type.STRING },
                    meaning: { type: Type.STRING, description: "Meaning of this part in Vietnamese (Tiếng Việt) only. NEVER output English." },
                    role: { type: Type.STRING }
                }
            }
        },
        commonMistakes: {
            type: Type.ARRAY,
            nullable: true,
            description: "Common errors learners make with this specific grammar.",
            items: {
                type: Type.OBJECT,
                properties: {
                    incorrect: { type: Type.STRING, description: "The wrong sentence/usage" },
                    correct: { type: Type.STRING, description: "The corrected version" },
                    explanation: { type: Type.STRING, description: "Why it is wrong" }
                }
            }
        },
        detailedComparison: {
            type: Type.ARRAY,
            nullable: true,
            description: "Compare with 2-3 specific similar grammar points.",
            items: {
                type: Type.OBJECT,
                properties: {
                    similarStructure: { type: Type.STRING },
                    difference: { type: Type.STRING, description: "How to distinguish them" },
                    nuance: { type: Type.STRING, description: "Subtle difference in feeling" }
                }
            }
        },
        collocations: {
            type: Type.ARRAY,
            nullable: true,
            description: "Common set phrases or collocations using this grammar.",
            items: { type: Type.STRING }
        },
        variations: {
            type: Type.ARRAY,
            nullable: true,
            description: "If the grammar has multiple DISTINCT meanings or usages (e.g. 'You ni' for Purpose vs 'You ni' for Request), separate them here.",
            items: {
                type: Type.OBJECT,
                properties: {
                    meaning: { type: Type.STRING, description: "Specific meaning for this variation" },
                    usage: { type: Type.STRING, description: "Context for this specific variation" },
                    constructionRules: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific construction formula for this meaning." },
                    examples: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                japanese: { type: Type.STRING },
                                reading: { type: Type.STRING },
                                vietnamese: { type: Type.STRING }
                            }
                        }
                    },
                    notes: { type: Type.STRING, nullable: true }
                }
            }
        }
    }
};

const comparisonSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['PARTICLE', 'HOMOPHONE', 'GRAMMAR', 'VOCABULARY'] },
        commonMeaning: { type: Type.STRING },
        keyDistinction: { type: Type.STRING },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    term: { type: Type.STRING },
                    reading: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    nuance: { type: Type.STRING },
                    pitchAccent: { type: Type.STRING, nullable: true },
                    pitchPattern: { type: Type.STRING, nullable: true },
                    structureRule: { type: Type.STRING, nullable: true },
                    collocations: {
                         type: Type.OBJECT,
                         nullable: true,
                         properties: {
                             allowed: { type: Type.ARRAY, items: { type: Type.STRING } },
                             prohibited: { type: Type.ARRAY, items: { type: Type.STRING } }
                         }
                    },
                    usageContext: { type: Type.STRING, nullable: true },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                    example: { type: Type.STRING, nullable: true },
                    exampleMeaning: { type: Type.STRING, nullable: true },
                    hanViet: { type: Type.STRING, nullable: true }
                }
            }
        },
        scenarios: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    scenario: { type: Type.STRING },
                    examples: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                term: { type: Type.STRING },
                                sentence: { type: Type.STRING },
                                sentenceMeaning: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        },
        scales: {
            type: Type.ARRAY,
            nullable: true,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    leftLabel: { type: Type.STRING },
                    rightLabel: { type: Type.STRING },
                    values: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                term: { type: Type.STRING },
                                value: { type: Type.NUMBER }
                            }
                        }
                    }
                }
            }
        }
    }
};

const recommendationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            text: { type: Type.STRING },
            reading: { type: Type.STRING },
            meaning: { type: Type.STRING },
            hanViet: { type: Type.STRING, nullable: true },
            type: { type: Type.STRING, enum: ['VOCAB', 'GRAMMAR'] },
            partType: { type: Type.STRING, enum: ['NOUN', 'VERB', 'ADJECTIVE', 'PARTICLE', 'CONJUNCTION', 'AUXILIARY'], nullable: true }
        }
    }
};

export const analyzeJapaneseText = async (text: string, images: ImageInput[] = []): Promise<AnalysisResult> => {
  // Log local data stats on first call
  try { const stats = getLocalDataStats(); console.log('[LocalData] Stats:', stats); } catch(e) { /* ignore */ }

  // ═══ CACHE CHECK: Return instantly if sentence was analyzed before ═══
  if (text.trim() && images.length === 0) {
    const cached = getCachedAnalysis(text);
    if (cached) {
      console.log(`[Cache HIT] Sentence analysis returned from cache — API call SAVED`);
      return cached;
    }
  }

  // ═══ LOCAL-FIRST FALLBACK: Skip Gemini for short text with high local coverage ═══
  if (text.trim() && images.length === 0 && text.trim().length <= 120) {
    try {
      const { localPreTokenize } = await getLocalTokenizer();
      const localResult = localPreTokenize(text);
      // Count coverage: tokens with meanings vs total content tokens
      let matched = 0, total = 0;
      for (const block of localResult.blocks || []) {
        for (const t of block.tokens || []) {
          if (t.type !== 'PUNCTUATION') {
            total++;
            if (t.meaning) matched++;
          }
        }
      }
      const coverage = total > 0 ? (matched / total) * 100 : 0;
      if (coverage >= 85) {
        // Enrich with local data
        for (const block of localResult.blocks || []) {
          if (block.tokens) block.tokens = enrichTokensWithLocalData(block.tokens);
        }
        // Remove _isPreview flag — this is now the real result
        delete (localResult as any)._isPreview;
        // Cache it so subsequent calls are instant
        cacheAnalysis(text, localResult);
        console.log(`[LocalFirst] Coverage ${Math.round(coverage)}% — full local analysis, API call SAVED`);
        return localResult;
      }
      console.log(`[LocalFirst] Coverage ${Math.round(coverage)}% — falling through to Gemini API`);
    } catch (e) {
      console.warn('[LocalFirst] Local analysis failed, falling through to API', e);
    }
  }

  // ═══ DEDUP: Prevent duplicate concurrent calls for same text ═══
  const dedupKey = `analyze:${text.trim().slice(0, 100)}:${images.length}`;
  return dedup(dedupKey, async () => {

  let retries = 3;
  const parts: any[] = [];

  // Compress images in parallel before sending
  if (images.length > 0) {
    const compressed = await Promise.all(
      images.map(img => compressImageForAnalysis(img.data, img.mimeType))
    );
    compressed.forEach(img => {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    });
    console.log(`[Analysis] Compressed ${images.length} images for API`);
  }

  if (text.trim()) {
      parts.push({ text: text });
  } else if (images.length > 0) {
      parts.push({ text: "Hãy chép lại và phân tích đoạn văn tiếng Nhật trong các hình ảnh này." });
  }

  while (retries > 0) {
    try {
      const response = await getAI().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: parts.length > 0 ? parts : [{ text: '' }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      if (!response.text) throw new Error("No response from AI");
      const result = normalizeNFC(JSON.parse(response.text.normalize('NFC')) as AnalysisResult);

      // POST-PROCESS: Enrich tokens with local data (hanViet, JLPT tags, meanings)
      if (result.blocks) {
        for (const block of result.blocks) {
          if (block.tokens) {
            block.tokens = enrichTokensWithLocalData(block.tokens);
          }
        }
      }
      console.log('[Analysis] Tokens enriched with local vocab/kanji data');

      // ═══ CACHE STORE: Save result for future lookups ═══
      if (text.trim() && images.length === 0) {
        cacheAnalysis(text, result);
      }

      return result;
    } catch (error) {
      console.warn(`Analysis attempt failed. Retries left: ${retries - 1}`, error);
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (4 - retries)));
    }
  }
  throw new Error("All retry attempts failed.");

  }); // end dedup
};

export const enrichVocabulary = async (word: string, type: string): Promise<ExtendedAnalysis> => {
    // STEP 1: Check cache + local data
    const strategy = getVocabEnrichmentStrategy(word, type);
    
    // CACHE HIT: Return immediately, no API call needed
    if (!strategy.needsApi && strategy.localData.definitionDetail) {
      console.log(`[Cache HIT] Returning cached enrichment for "${word}" — API call SAVED`);
      return strategy.localData as ExtendedAnalysis;
    }

    // ═══ DEDUP: Prevent duplicate concurrent enrichment calls ═══
    return dedup(`vocab:${word}`, async () => {

    const hasLocalMeaning = !!strategy.localData.definitionDetail;
    const hasLocalKanji = strategy.localData.kanjiDetails && strategy.localData.kanjiDetails.length > 0;
    
    if (hasLocalMeaning || hasLocalKanji) {
      console.log(`[LocalData] Found local data for "${word}": meaning=${hasLocalMeaning}, kanji=${hasLocalKanji}`);
    }

    // STEP 2: Call Gemini API with local context hint
    try {
        const contextHint = strategy.contextHint;
        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ text: `Analyze vocabulary: "${word}". Type Hint: ${type}.${contextHint}` }],
            config: {
                systemInstruction: `You are a Japanese Dictionary expert.
                
                **Task**:
                1. **ROMAJI HANDLING (IMPORTANT)**: If the input is in Romaji (e.g., 'kokyou', 'taberu') or Kana, you **MUST** identify the standard written form (Kanji/Kana) and populate the \`canonicalForm\` field (e.g., '故郷', '食べる'). Use this canonical form for all analysis.
                
                2. If the input is **Ambiguous Romaji** (e.g., 'hashi', 'kaeru', 'kumo') or pure Kana with multiple common meanings:
                   - **DO NOT** just pick one arbitrarily.
                   - **INSTEAD**, populate the \`candidates\` array with the 3-5 most common Kanji variations (Homophones).
                   - Fill other fields (definition, examples) for the *most likely* candidate, but the \`candidates\` array is the priority.
                
                3. If the input is specific (Kanji or unambiguous context):
                   - **IDENTIFY THE TYPE**: Explicitly set the \`type\` field to NOUN, VERB, ADJECTIVE, PARTICLE, or OTHER.
                   - Provide transitivity, full conjugation table (if verb/adj).
                   - 2 natural examples in Vietnamese.
                   - Synonyms, antonyms, related forms, collocations.
                   - Kanji breakdown (On/Kun/Meaning).
                   - \`candidates\` can be null or empty.

                ${hasLocalKanji ? '**NOTE**: kanjiDetails are already provided from local database. You can keep them minimal or skip — they will be overridden with authoritative local data.' : ''}
                
                **FOCUS ON**: conjugations, pitch accent, transitivity, relatedForms, collocations — these are the HIGH VALUE fields not available locally.

                Output MUST be strictly in **Vietnamese** (Tiếng Việt) only. Do NOT include any English translations.`,
                responseMimeType: "application/json",
                responseSchema: vocabSchema,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        
        if (!response.text) throw new Error("No data");
        const apiResult = normalizeNFC(JSON.parse(response.text.normalize('NFC')) as ExtendedAnalysis);

        // STEP 3: Merge local data with API result
        const merged = mergeVocabEnrichment(strategy.localData, apiResult);
        
        // STEP 4: Cache the result for future lookups (skip API next time)
        cacheVocabEnrichment(word, merged);

        console.log(`[Enrichment] Vocab "${word}" enriched (local + API merged + cached)`);
        return merged;
    } catch (error) {
        // If API fails but we have local data, return partial enrichment
        if (hasLocalMeaning) {
          console.warn(`[Enrichment] API failed for "${word}", using local data fallback`);
          const fallback = {
            definitionDetail: strategy.localData.definitionDetail || '',
            examples: strategy.localData.examples || [],
            canonicalForm: strategy.localData.canonicalForm,
            type: strategy.localData.type,
            kanjiDetails: strategy.localData.kanjiDetails,
            synonyms: strategy.localData.synonyms,
            antonyms: strategy.localData.antonyms,
          } as ExtendedAnalysis;
          // Don't cache partial fallback — let next attempt try API again
          return fallback;
        }
        console.error("Enrichment failed", error);
        throw error;
    }

    }); // end dedup
}

export const enrichGrammar = async (grammar: string): Promise<ExtendedGrammarAnalysis> => {
    // STEP 1: Check cache + local grammar data
    const strategy = getGrammarEnrichmentStrategy(grammar);
    
    // CACHE HIT: Return immediately, no API call needed
    if (!strategy.needsApi && strategy.localData.generalMeaning) {
      console.log(`[Cache HIT] Returning cached grammar enrichment for "${grammar}" — API call SAVED`);
      return strategy.localData as ExtendedGrammarAnalysis;
    }

    // ═══ DEDUP: Prevent duplicate concurrent grammar enrichment ═══
    return dedup(`grammar:${grammar}`, async () => {

    const hasLocalMeaning = !!strategy.localData.generalMeaning;
    const hasLocalJlpt = !!strategy.localData.jlpt;
    
    if (hasLocalMeaning || hasLocalJlpt) {
      console.log(`[LocalData] Found local grammar for "${grammar}": meaning=${hasLocalMeaning}, jlpt=${strategy.localData.jlpt || 'N/A'}`);
    }

    // STEP 2: Call Gemini with local context
    try {
        const contextHint = strategy.contextHint;
        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ text: `Provide detailed grammar analysis for the structure: ${grammar}${contextHint}` }],
            config: {
                systemInstruction: `You are a Japanese Grammar expert (Bunpou). Output strictly in Vietnamese (Tiếng Việt) only. Do NOT include any English translations.
                
                **MANDATORY REQUIREMENTS:**
                1. **Variations**: If the grammar point has MULTIPLE distinct meanings (e.g. 'You ni' = 'So that' OR 'Request' OR 'Hope'), you **MUST** split them into the \`variations\` array.
                2. **Common Mistakes (The Clinic)**: You **MUST** populate the \`commonMistakes\` array with 2-3 common errors learners make (e.g. wrong particle, wrong conjugation connection). Explain WHY it is wrong.
                3. **Detailed Comparison (Differential Diagnosis)**: You **MUST** populate \`detailedComparison\` with 1-2 grammar points that are easily confused with this one (e.g. 'Aida' vs 'Aida ni'). Explain the nuance difference clearly.
                4. **Usage Notes**: In the \`notes\` field, include critical warnings (e.g. "Only used for negative outcomes", "Formal usage only").
                5. **Deep Structure**: In \`breakdown\`, be specific. Use "Thể thông thường (Futsuu-kei)" instead of just "Verb" if applicable.
                
                ${hasLocalMeaning ? '**NOTE**: Vietnamese meaning and JLPT level are provided from local database. Focus your energy on variations, commonMistakes, detailedComparison, breakdown, collocations — these HIGH VALUE analyses are what the user needs.' : ''}
                
                **Formatting**:
                - Structure: Convert Romaji to Japanese (e.g. 'te iru' -> '〜ている').
                - Tags: Include JLPT Level.
                `,
                responseMimeType: "application/json",
                responseSchema: grammarSchema,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        
        if (!response.text) throw new Error("No data");
        const apiResult = normalizeNFC(JSON.parse(response.text.normalize('NFC')) as ExtendedGrammarAnalysis);

        // STEP 3: Merge local data with API result
        const merged = mergeGrammarEnrichment(strategy.localData, apiResult);
        
        // STEP 4: Cache the result for future lookups
        cacheGrammarEnrichment(grammar, merged);

        console.log(`[Enrichment] Grammar "${grammar}" enriched (local + API merged + cached)`);
        return merged;
    } catch (error) {
        // If API fails but we have local data, return partial enrichment
        if (hasLocalMeaning) {
          console.warn(`[Enrichment] API failed for grammar "${grammar}", using local data fallback`);
          return {
            generalMeaning: strategy.localData.generalMeaning || '',
            examples: strategy.localData.examples || [],
            constructionRules: strategy.localData.constructionRules || [],
            contexts: strategy.localData.contexts || [],
            structure: strategy.localData.structure,
            jlpt: strategy.localData.jlpt,
            notes: strategy.localData.notes,
          } as ExtendedGrammarAnalysis;
        }
        console.error("Grammar Enrichment failed", error);
        throw error;
    }

    }); // end dedup
}

export const generateComparison = async (query: string): Promise<ComparisonResult> => {
    // ═══ CACHE CHECK ═══
    const cached = getCachedComparison(query);
    if (cached) {
      console.log(`[Cache HIT] Comparison for "${query}" returned from cache`);
      return cached;
    }

    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ text: `Compare the following Japanese terms/concepts: "${query}".` }],
            config: {
                systemInstruction: `You are a Japanese language expert. Compare the requested terms deeply.
                Identify if this is a comparison of PARTICLES, HOMOPHONES, GRAMMAR, or VOCABULARY nuances.
                Provide key distinctions, usage contexts, collocations, and scenarios.
                Output strictly in Vietnamese (Tiếng Việt) only. Do NOT include any English translations.`,
                responseMimeType: "application/json",
                responseSchema: comparisonSchema,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });

        if (!response.text) throw new Error("No data");
        const result = normalizeNFC(JSON.parse(response.text.normalize('NFC')) as ComparisonResult);
        // ═══ CACHE STORE ═══
        cacheComparison(query, result);
        return result;
    } catch (error) {
        console.error("Comparison failed", error);
        throw error;
    }
}

export const getRecommendationsByTag = async (tagName: string, currentItems: string[]): Promise<RecommendationItem[]> => {
    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ text: `Gợi ý thêm 5 từ vựng hoặc điểm ngữ pháp liên quan đến tag: "${tagName}". Tránh các từ này: ${currentItems.join(', ')}.` }],
            config: {
                systemInstruction: `Bạn là chuyên gia ngôn ngữ Nhật. Hãy gợi ý 5 mục (từ vựng hoặc ngữ pháp) chất lượng cao liên quan đến chủ đề/tag được yêu cầu.
                Mỗi mục bao gồm: text (Kanji/Kana), reading (Hiragana), meaning (Tiếng Việt), hanViet (nếu có), type (VOCAB hoặc GRAMMAR), partType (NOUN/VERB/ADJECTIVE...).
                Đảm bảo các mục gợi ý và giải thích hữu ích cho người học và HOÀN TOÀN bằng Tiếng Việt, không chứa tiếng Anh. Output: JSON Array.`,
                responseMimeType: "application/json",
                responseSchema: recommendationSchema,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        if (!response.text) return [];
        return normalizeNFC(JSON.parse(response.text.normalize('NFC')) as RecommendationItem[]);
    } catch (error) {
        console.error("Recommendation failed", error);
        return [];
    }
}

export const addItemsToComparison = async (existingItems: ComparisonItem[], newQuery: string, type: ComparisonType): Promise<ComparisonItem[]> => {
     const itemsSchema = {
         type: Type.ARRAY,
         items: comparisonSchema.properties.items.items
     };

     try {
        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ text: `Add these items: "${newQuery}" to the existing comparison group (Type: ${type}). Existing items: ${existingItems.map(i => i.term).join(', ')}.` }],
            config: {
                systemInstruction: `You are a Japanese expert. Analyze the new terms provided and structure them exactly like the existing comparison items.
                Focus on how they contrast with the existing group.
                Output strictly in Vietnamese (Tiếng Việt) only. Do NOT include any English.`,
                responseMimeType: "application/json",
                responseSchema: itemsSchema,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });

        if (!response.text) throw new Error("No data");
        return normalizeNFC(JSON.parse(response.text.normalize('NFC')) as ComparisonItem[]);
    } catch (error) {
        console.error("Add item failed", error);
        throw error;
    }
}
