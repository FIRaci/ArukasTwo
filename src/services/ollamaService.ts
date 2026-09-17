// ============================================================
//  OLLAMA AI SERVICE — ARUKAS 2
//  Local-First AI Execution for Bi-directional & Multimodal Analysis
// ============================================================

import {
  LanguageCode,
  getLanguageInfo,
  TextAnalysisResult,
  MediaAnalysisResult,
  SavedComparison,
  OllamaModelInfo,
} from '../types';

export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';

// ── Normalize NFC to fix decomposed Vietnamese diacritics ──
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

/** Check if Ollama is accessible and measure ping latency */
export async function checkOllamaConnection(
  endpoint = DEFAULT_OLLAMA_ENDPOINT
): Promise<{ isConnected: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    const res = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const latencyMs = Math.round(performance.now() - start);
    return { isConnected: true, latencyMs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return { isConnected: false, latencyMs: 0, error: message };
  }
}

/** List all models currently loaded or downloaded in user's Ollama */
export async function fetchAvailableModels(
  endpoint = DEFAULT_OLLAMA_ENDPOINT
): Promise<OllamaModelInfo[]> {
  try {
    const res = await fetch(`${endpoint}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = (data.models || []) as Array<{
      name: string;
      size: number;
      modified_at: string;
      details?: { family?: string; families?: string[] };
    }>;

    return list.map((m) => {
      const nameLower = m.name.toLowerCase();
      const isVision =
        nameLower.includes('vl') ||
        nameLower.includes('vision') ||
        nameLower.includes('llava') ||
        nameLower.includes('minicpm') ||
        (m.details?.families || []).some((f) => f.toLowerCase().includes('vl'));
      return {
        name: m.name,
        size: m.size,
        modifiedAt: m.modified_at,
        isVision,
      };
    });
  } catch (err) {
    console.warn('[Ollama] Failed to fetch models:', err);
    return [];
  }
}

/** Bi-directional deep text analysis between any pair of 11 languages */
export async function analyzeTextBiDirectional(params: {
  text: string;
  sourceLang: LanguageCode | 'auto';
  targetLang: LanguageCode;
  model: string;
  endpoint?: string;
}): Promise<TextAnalysisResult> {
  const { text, sourceLang, targetLang, model, endpoint = DEFAULT_OLLAMA_ENDPOINT } = params;
  const targetInfo = getLanguageInfo(targetLang);
  const sourceHint =
    sourceLang === 'auto'
      ? 'Auto-detect source language'
      : `${getLanguageInfo(sourceLang).name} (${sourceLang})`;

  const systemPrompt = `You are ARUKAS 2, a linguistic polyglot AI. Analyze the input sentence and provide a high-precision translation and structural breakdown from ${sourceHint} to ${targetInfo.name} (${targetLang}).
Return STRICT JSON matching this format:
{
  "detectedSourceLang": "<ISO code of source language: vi, ja, ko, zh, ru, en, es, fr, it, de, pt>",
  "summary": {
    "translation": "<Natural, fluent translation in ${targetInfo.name}>",
    "overview": "<Short explanation of overall meaning and context in ${targetInfo.name}>",
    "tone": "<e.g., Trang trọng (Formal), Thân mật (Casual), Văn chương (Literary), Khẩu ngữ (Colloquial)>",
    "culturalContext": "<Brief cultural or pragmatic nuance if relevant, else null>"
  },
  "tokens": [
    {
      "id": "t1",
      "text": "<word/token>",
      "reading": "<pronunciation transcription: Romaji for Japanese, Pinyin for Chinese, Hangul/RR for Korean, IPA for English/European, else reading>",
      "pos": "<NOUN | VERB | ADJECTIVE | ADVERB | PRONOUN | PREPOSITION | PARTICLE | CONJUNCTION | INTERJECTION | NUMERAL | AUXILIARY | PUNCTUATION>",
      "posLabel": "<human readable part of speech in ${targetInfo.name}>",
      "meaning": "<precise meaning of this token in this context in ${targetInfo.name}>",
      "lemma": "<dictionary/root form>",
      "role": "<grammatical role in ${targetInfo.name}: Chủ ngữ, Vị ngữ, Tân ngữ, Định ngữ, v.v.>",
      "hanViet": "<Sino-Vietnamese / Hanzi / Kanji if relevant, else null>",
      "nuanceNote": "<any subtlety or inflection note, else null>"
    }
  ],
  "grammarPoints": [
    {
      "id": "g1",
      "structure": "<grammar pattern/formula in source language>",
      "reading": "<reading of pattern if applicable>",
      "meaning": "<meaning of the pattern in ${targetInfo.name}>",
      "formula": "<construction rule e.g. V-te + iru, Verb + ing, Noun + preposition>",
      "explanation": "<why and how this grammar is used in this sentence in ${targetInfo.name}>",
      "examples": [
        { "original": "<example sentence in source>", "translation": "<translation in ${targetInfo.name}>" }
      ]
    }
  ]
}`;

  const userPrompt = `Input Text: "${text}"\nTarget Language: ${targetInfo.name} (${targetLang})`;

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
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Error (${res.status}): ${errText}`);
  }

  const raw = await res.json();
  const content = raw.message?.content || '{}';
  const parsed = normalizeNFC(JSON.parse(content));

  const resolvedSourceLang =
    (parsed.detectedSourceLang as LanguageCode) ||
    (sourceLang === 'auto' ? 'ja' : sourceLang);

  return {
    id: `arukas2_${Date.now()}`,
    sourceText: text,
    sourceLang,
    resolvedSourceLang,
    targetLang,
    summary: {
      translation: parsed.summary?.translation || '',
      overview: parsed.summary?.overview || '',
      tone: parsed.summary?.tone || 'Tự nhiên (Neutral)',
      culturalContext: parsed.summary?.culturalContext || undefined,
    },
    tokens: parsed.tokens || [],
    grammarPoints: parsed.grammarPoints || [],
    analyzedAt: Date.now(),
  };
}

/** Multimodal Image & Document Analysis using Ollama Vision models (e.g. qwen2.5vl:7b) */
export async function analyzeImageMultimodal(params: {
  base64Image: string;
  sourceLang: LanguageCode | 'auto';
  targetLang: LanguageCode;
  model: string;
  endpoint?: string;
}): Promise<MediaAnalysisResult> {
  const { base64Image, sourceLang, targetLang, model, endpoint = DEFAULT_OLLAMA_ENDPOINT } = params;
  const targetInfo = getLanguageInfo(targetLang);

  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  const prompt = `You are ARUKAS 2 Vision AI. Inspect this image (which may be a manga page, book page, photo of text, or comic).
Extract all visible speech bubbles, text boxes, and dialogue. Translate each segment into ${targetInfo.name} (${targetLang}).
Return STRICT JSON:
{
  "summary": "<Overall description of the scene/content in ${targetInfo.name}>",
  "detectedLang": "<ISO code: vi, ja, ko, zh, ru, en, es, fr, it, de, pt>",
  "segments": [
    {
      "id": "s1",
      "originalText": "<transcribed text from the image>",
      "reading": "<pronunciation/reading if Asian language>",
      "translation": "<accurate translation in ${targetInfo.name}>",
      "speaker": "<character name if dialogue, or 'Narration' or 'Text'>",
      "type": "<speech | narration | sfx | document>",
      "notes": "<cultural, tone, or grammatical note in ${targetInfo.name}>"
    }
  ]
}`;

  const res = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      images: [cleanBase64],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Vision Error (${res.status}): ${errText}`);
  }

  const raw = await res.json();
  const parsed = normalizeNFC(JSON.parse(raw.response || '{}'));

  return {
    id: `media_${Date.now()}`,
    mediaType: 'image',
    sourceLang: parsed.detectedLang || (sourceLang === 'auto' ? 'ja' : sourceLang),
    targetLang,
    summary: parsed.summary || 'Phân tích hình ảnh hoàn tất.',
    segments: parsed.segments || [],
    analyzedAt: Date.now(),
  };
}

/** Compare 2 or more terms or grammar patterns to explain nuanced differences */
export async function compareTermsWithOllama(params: {
  terms: string[];
  lang: LanguageCode;
  targetLang: LanguageCode;
  model: string;
  endpoint?: string;
}): Promise<SavedComparison> {
  const { terms, lang, targetLang, model, endpoint = DEFAULT_OLLAMA_ENDPOINT } = params;
  const langInfo = getLanguageInfo(lang);
  const targetInfo = getLanguageInfo(targetLang);

  const prompt = `Compare these terms/patterns in ${langInfo.name}: ${terms.map((t) => `"${t}"`).join(', ')}.
Explain the key nuances, differences, and appropriate contexts in ${targetInfo.name} (${targetLang}).
Return STRICT JSON:
{
  "title": "<Comparison title in ${targetInfo.name}>",
  "keyDifference": "<Core summary of difference in 1-2 sentences in ${targetInfo.name}>",
  "summary": "<In-depth comparative explanation in ${targetInfo.name}>",
  "items": [
    {
      "term": "<term>",
      "reading": "<reading / pronunciation>",
      "meaning": "<general meaning in ${targetInfo.name}>",
      "nuance": "<specific nuance, register, feeling>",
      "example": "<natural example sentence>",
      "exampleTranslation": "<example translation in ${targetInfo.name}>"
    }
  ]
}`;

  const res = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
    }),
  });

  if (!res.ok) throw new Error(`Ollama Error: ${res.statusText}`);
  const raw = await res.json();
  const parsed = normalizeNFC(JSON.parse(raw.message?.content || '{}'));

  return {
    id: `comp_${Date.now()}`,
    title: parsed.title || `So sánh ${terms.join(' vs ')}`,
    lang,
    targetLang,
    keyDifference: parsed.keyDifference || '',
    summary: parsed.summary || '',
    items: parsed.items || [],
    savedAt: Date.now(),
  };
}
