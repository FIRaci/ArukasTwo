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
  SentenceAnalysisChunk,
  MacroSyntaxClause,
  AnalysisToken,
  AnalysisGrammarPoint,
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

import { splitIntoSentences } from './sentence-splitter';
import { analyzeFastOverview, analyzeSentenceSyntaxDeep } from './fast-linguistic-engine';

/** Bi-directional fast & deep text analysis between any pair of 11 languages */
export async function analyzeTextBiDirectional(params: {
  text: string;
  sourceLang: LanguageCode | 'auto';
  targetLang: LanguageCode;
  model: string;
  endpoint?: string;
  onFastOverviewReady?: (overview: Partial<TextAnalysisResult>) => void;
}): Promise<TextAnalysisResult> {
  const { text, sourceLang, targetLang, model, endpoint = DEFAULT_OLLAMA_ENDPOINT, onFastOverviewReady } = params;

  // Phase 1: Rapid Global Overview & Key Terms (< 3-4s)
  const overviewData = await analyzeFastOverview({
    text,
    sourceLang,
    targetLang,
    model,
    endpoint,
  });

  const resolvedSourceLang = overviewData.resolvedSourceLang;
  const sentenceList = splitIntoSentences(text);

  // If callback provided, notify UI immediately
  if (onFastOverviewReady) {
    onFastOverviewReady({
      resolvedSourceLang,
      summary: {
        translation: overviewData.translation,
        literalTranslation: overviewData.literalTranslation,
        overview: overviewData.overview,
        tone: overviewData.tone,
        culturalContext: overviewData.culturalContext,
      },
      keyTerms: overviewData.keyTerms,
    });
  }

  // Phase 2: Deep Syntax for Primary / First Sentence (< 4s)
  const firstSentenceText = sentenceList[0] || text;
  const firstSyntax = await analyzeSentenceSyntaxDeep({
    sentenceText: firstSentenceText,
    sourceLang: resolvedSourceLang,
    targetLang,
    model,
    endpoint,
  });

  // Prepare sentence chunks
  const sentenceChunks: SentenceAnalysisChunk[] = sentenceList.map((st, idx) => {
    if (idx === 0) {
      return {
        sentenceIndex: 0,
        originalText: st,
        translation: overviewData.sentenceTranslations[0] || overviewData.translation,
        macroSyntax: firstSyntax.macroSyntax,
        tokens: firstSyntax.tokens,
        grammarPoints: firstSyntax.grammarPoints,
        isAnalyzed: true,
      };
    }
    return {
      sentenceIndex: idx,
      originalText: st,
      translation: overviewData.sentenceTranslations[idx] || '',
      tokens: [],
      grammarPoints: [],
      isAnalyzed: false,
    };
  });

  return {
    id: `arukas2_${Date.now()}`,
    sourceText: text,
    sourceLang,
    resolvedSourceLang,
    targetLang,
    summary: {
      translation: overviewData.translation,
      literalTranslation: overviewData.literalTranslation,
      overview: overviewData.overview,
      tone: overviewData.tone,
      culturalContext: overviewData.culturalContext,
    },
    tokens: firstSyntax.tokens,
    grammarPoints: firstSyntax.grammarPoints,
    macroSyntax: firstSyntax.macroSyntax,
    keyTerms: overviewData.keyTerms,
    sentences: sentenceChunks,
    activeSentenceIndex: sentenceChunks.length > 1 ? 0 : -1,
    analyzedAt: Date.now(),
  };
}

/** Analyze a specific sentence on demand or during background stream */
export async function analyzeSpecificSentence(params: {
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
  return analyzeSentenceSyntaxDeep(params);
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
