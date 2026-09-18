// ============================================================
//  FAST LINGUISTIC ENGINE — ARUKAS 2
//  Two-Tier Progressive Parsing for Blazing-Fast Paragraph & Deep Syntax Analysis
// ============================================================

import {
  LanguageCode,
  getLanguageInfo,
  MacroSyntaxClause,
  KeyVocabularyTerm,
  AnalysisToken,
  AnalysisGrammarPoint,
} from '../types';

export const DEFAULT_ENDPOINT = 'http://localhost:11434';

/** Repair and normalize truncated or imperfect JSON from local LLMs */
function cleanAndNormalizeJson<T>(rawStr: string): T {
  let cleaned = rawStr.trim();
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  }
  cleaned = cleaned.trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Truncation repair: close dangling strings and balance brackets
    let repaired = cleaned;
    let inString = false;
    for (let i = 0; i < repaired.length; i++) {
      if (repaired[i] === '"' && (i === 0 || repaired[i - 1] !== '\\')) {
        inString = !inString;
      }
    }
    if (inString) {
      repaired += '"';
    }

    repaired = repaired.replace(/,\s*$/, '').replace(/:\s*$/, ': null');

    const stack: ('}' | ']')[] = [];
    let insideStr = false;
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (char === '"' && (i === 0 || repaired[i - 1] !== '\\')) {
        insideStr = !insideStr;
      }
      if (!insideStr) {
        if (char === '{') stack.push('}');
        else if (char === '[') stack.push(']');
        else if (char === '}' || char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
          }
        }
      }
    }

    while (stack.length > 0) {
      repaired += stack.pop();
    }

    try {
      parsed = JSON.parse(repaired);
    } catch {
      const extractStr = (key: string): string => {
        const m = cleaned.match(new RegExp(`"${key}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`));
        return m ? m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '';
      };
      parsed = {
        translation: extractStr('translation'),
        literalTranslation: extractStr('literalTranslation'),
        overview: extractStr('overview'),
        tone: extractStr('tone') || 'Báo chí chính luận (Formal)',
        culturalContext: extractStr('culturalContext'),
        detectedSourceLang: extractStr('detectedSourceLang') || 'ja',
        keyTerms: [],
        sentenceTranslations: [],
        macroSyntax: [],
        tokens: [],
        grammarPoints: [],
      };
    }
  }

  const normalizeObj = (obj: unknown): unknown => {
    if (typeof obj === 'string') return obj.normalize('NFC');
    if (Array.isArray(obj)) return obj.map(normalizeObj);
    if (obj && typeof obj === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) out[k] = normalizeObj(v);
      return out;
    }
    return obj;
  };

  return normalizeObj(parsed) as T;
}

/**
 * Phase 1: Fast Global Overview (< 3-5 seconds)
 * Produces natural translation, literal translation, tone, domain context,
 * key vocabulary table, and sentence translations without heavy token arrays.
 */
export async function analyzeFastOverview(params: {
  text: string;
  sourceLang: LanguageCode | 'auto';
  targetLang: LanguageCode;
  model: string;
  endpoint?: string;
}): Promise<{
  resolvedSourceLang: LanguageCode;
  translation: string;
  literalTranslation: string;
  overview: string;
  tone: string;
  culturalContext?: string;
  keyTerms: KeyVocabularyTerm[];
  sentenceTranslations: string[];
}> {
  const { text, sourceLang, targetLang, model, endpoint = DEFAULT_ENDPOINT } = params;
  const targetInfo = getLanguageInfo(targetLang);
  const sourceHint =
    sourceLang === 'auto'
      ? 'Auto-detect source language'
      : `${getLanguageInfo(sourceLang).name} (${sourceLang})`;

  const systemPrompt = `You are ARUKAS 2 Linguistic AI. Provide an immediate, high-accuracy global analysis from ${sourceHint} into ${targetInfo.name} (${targetLang}).
Return STRICT JSON:
{
  "detectedSourceLang": "<ISO code: vi, ja, ko, zh, ru, en, es, fr, it, de, pt>",
  "translation": "<Fluent, natural translation in ${targetInfo.name}>",
  "literalTranslation": "<Word-by-word literal gloss translation in ${targetInfo.name}>",
  "overview": "<Concise synthesis of meaning and contextual background in ${targetInfo.name}>",
  "tone": "<e.g. Báo chí chính luận (Journalistic), Trang trọng (Formal), Thân mật (Casual), Khẩu ngữ (Colloquial)>",
  "culturalContext": "<Domain or pragmatic context in ${targetInfo.name}, else null>",
  "keyTerms": [
    {
      "id": "kt1",
      "text": "<core word in source>",
      "reading": "<reading e.g. Romaji/Pinyin/IPA>",
      "hanViet": "<Sino-Vietnamese if CJK, else null>",
      "pos": "<part of speech in ${targetInfo.name}>",
      "meaning": "<meaning in ${targetInfo.name}>",
      "level": "<Core | Specialized | Advanced>"
    }
  ],
  "sentenceTranslations": [
    "<translation of sentence 1 in ${targetInfo.name}>"
  ]
}`;

  const userPrompt = `Input Text:\n"""\n${text}\n"""\nTarget: ${targetInfo.name} (${targetLang})\nKeep keyTerms to max 6 core terms.`;

  const res = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.1,
        top_p: 0.9,
        num_predict: 2048,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Error (${res.status}): ${errText}`);
  }

  const raw = await res.json();
  const content = raw.message?.content || '{}';
  const data = cleanAndNormalizeJson<{
    detectedSourceLang?: string;
    translation?: string;
    literalTranslation?: string;
    overview?: string;
    tone?: string;
    culturalContext?: string;
    keyTerms?: KeyVocabularyTerm[];
    sentenceTranslations?: string[];
  }>(content);

  const resolvedSourceLang =
    (data.detectedSourceLang as LanguageCode) ||
    (sourceLang === 'auto' ? 'ja' : sourceLang);

  return {
    resolvedSourceLang,
    translation: data.translation || '',
    literalTranslation: data.literalTranslation || '',
    overview: data.overview || '',
    tone: data.tone || 'Tự nhiên (Neutral)',
    culturalContext: data.culturalContext || undefined,
    keyTerms: (data.keyTerms || []).map((kt, i) => ({
      ...kt,
      id: kt.id || `kt_${i + 1}`,
    })),
    sentenceTranslations: data.sentenceTranslations || [],
  };
}

/**
 * Phase 2: Deep Syntactic & Morphological Analysis for a single sentence (< 4-5 seconds)
 * Breaks down SVO macro-syntax, interactive tokens with POS & inflection, and grammar formulas.
 */
export async function analyzeSentenceSyntaxDeep(params: {
  sentenceText: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  model: string;
  endpoint?: string;
}): Promise<{
  macroSyntax: MacroSyntaxClause[];
  tokens: AnalysisToken[];
  grammarPoints: AnalysisGrammarPoint[];
}> {
  const { sentenceText, sourceLang, targetLang, model, endpoint = DEFAULT_ENDPOINT } = params;
  const targetInfo = getLanguageInfo(targetLang);
  const sourceInfo = getLanguageInfo(sourceLang);

  const systemPrompt = `You are ARUKAS 2 Sentence Architect. Perform an in-depth linguistic and syntactic breakdown of this single sentence from ${sourceInfo.name} to ${targetInfo.name}.
Return STRICT JSON:
{
  "macroSyntax": [
    {
      "clauseId": "c1",
      "clauseText": "<clause snippet in source>",
      "subject": "<Subject if present>",
      "predicate": "<Predicate>",
      "object": "<Object if present>",
      "modifier": "<Modifier if present>",
      "connector": "<Connector if present>",
      "explanation": "<Syntax explanation in ${targetInfo.name}>"
    }
  ],
  "tokens": [
    {
      "id": "t1",
      "text": "<word/token>",
      "reading": "<reading: Romaji for JA, Pinyin for ZH, IPA for others>",
      "pos": "<NOUN | VERB | ADJECTIVE | ADVERB | PRONOUN | PREPOSITION | PARTICLE | CONJUNCTION | AUXILIARY | PUNCTUATION>",
      "posLabel": "<POS label in ${targetInfo.name}>",
      "meaning": "<meaning in ${targetInfo.name}>",
      "lemma": "<root form>",
      "role": "<Subject | Object | Predicate | Modifier>",
      "hanViet": "<Sino-Vietnamese if CJK, else null>",
      "inflection": "<Grammar form e.g. Thể Te, Quá khứ, Bị động, else null>",
      "nuanceNote": "<nuance note, else null>"
    }
  ],
  "grammarPoints": [
    {
      "id": "g1",
      "structure": "<pattern in source>",
      "reading": "<reading if Asian>",
      "meaning": "<meaning in ${targetInfo.name}>",
      "formula": "<construction rule>",
      "explanation": "<explanation in ${targetInfo.name}>",
      "level": "<JLPT N1-N5, HSK 1-6, or CEFR A1-C2 if applicable>",
      "examples": [
        { "original": "<example in source>", "translation": "<translation in ${targetInfo.name}>" }
      ]
    }
  ]
}`;

  const userPrompt = `Sentence: "${sentenceText}"\nTarget Language: ${targetInfo.name} (${targetLang})\nKeep tokens concise and grammarPoints to 1-2 core structures.`;

  const res = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.1,
        top_p: 0.9,
        num_predict: 2500,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Sentence Error (${res.status}): ${errText}`);
  }

  const raw = await res.json();
  const content = raw.message?.content || '{}';
  const data = cleanAndNormalizeJson<{
    macroSyntax?: MacroSyntaxClause[];
    tokens?: AnalysisToken[];
    grammarPoints?: AnalysisGrammarPoint[];
  }>(content);

  return {
    macroSyntax: (data.macroSyntax || []).map((c, i) => ({
      ...c,
      clauseId: c.clauseId || `c_${i + 1}`,
    })),
    tokens: (data.tokens || []).map((t, i) => ({
      ...t,
      id: t.id || `t_${i + 1}`,
    })),
    grammarPoints: (data.grammarPoints || []).map((g, i) => ({
      ...g,
      id: g.id || `g_${i + 1}`,
    })),
  };
}
