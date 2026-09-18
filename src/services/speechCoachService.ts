// ============================================================
//  SPEECH & ACCENT COACH AI SERVICE — ARUKAS 2
//  Conversational Roleplay, Speech Evaluation & Real-time Phrasing Assist
// ============================================================

import {
  LanguageCode,
  getLanguageInfo,
  RoleplayScenario,
  SpeechEvaluationResult,
  InSpeechAssistSuggestion,
} from '../types';
import { DEFAULT_OLLAMA_ENDPOINT } from './ollamaService';

/** Clean and parse JSON safely from Ollama */
function cleanJson<T>(rawStr: string): T {
  let cleaned = rawStr.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  }
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Basic repair if ends abruptly
    let repaired = cleaned;
    if (!repaired.endsWith('}')) {
      if (repaired.includes('"') && (repaired.match(/"/g)?.length || 0) % 2 !== 0) {
        repaired += '"';
      }
      repaired += '}';
    }
    return JSON.parse(repaired) as T;
  }
}

/**
 * Evaluates the user's spoken response in a roleplay conversation.
 * Provides 4-metric scoring, constructive feedback, before/after corrections,
 * and the persona's next conversational reply.
 */
export async function evaluateSpokenResponse(params: {
  scenario: RoleplayScenario;
  userSpeechText: string;
  conversationHistory: { role: 'user' | 'assistant'; text: string }[];
  model: string;
  endpoint?: string;
}): Promise<SpeechEvaluationResult> {
  const { scenario, userSpeechText, conversationHistory, model, endpoint = DEFAULT_OLLAMA_ENDPOINT } = params;
  const langInfo = getLanguageInfo(scenario.lang);

  const historyPrompt = conversationHistory
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'User' : scenario.personaName}: "${m.text}"`)
    .join('\n');

  const systemPrompt = `You are ARUKAS 2 Speech & Accent Coach.
You are roleplaying as "${scenario.personaName}" (${scenario.personaRole}) in the context: "${scenario.contextPrompt}".
The language being practiced is ${langInfo.name} (${scenario.lang}).

Analyze the user's spoken response: "${userSpeechText}".
Be honest, constructive, encouraging, and concise. Do NOT be vague. Provide practical corrections.
Return STRICT JSON:
{
  "overallScore": <number 0-100>,
  "fluency": {
    "score": <number 0-100>,
    "label": "<Tốt | Khá | Cần cải thiện>",
    "feedback": "<1-2 sentences on pace, flow, pauses in Vietnamese>"
  },
  "accent": {
    "score": <number 0-100>,
    "label": "<Chuẩn xác | Tương đối chuẩn | Có âm sai>",
    "feedback": "<Specific phoneme, pitch accent, or tone observation in Vietnamese>"
  },
  "intonation": {
    "score": <number 0-100>,
    "label": "<Tự nhiên | Hơi đều đều | Chưa đúng nhịp>",
    "feedback": "<Intonation curve, rising/falling inflection in Vietnamese>"
  },
  "vocabulary": {
    "score": <number 0-100>,
    "label": "<Đúng ngữ cảnh | Rất tự nhiên | Hơi gượng gạo>",
    "feedback": "<Pragmatic suitability for this scenario in Vietnamese>"
  },
  "strengths": [
    "<1 specific thing done well in Vietnamese>"
  ],
  "improvements": [
    "<1 specific high-priority thing to improve in Vietnamese>"
  ],
  "corrections": [
    {
      "before": "<exact flawed word/phrase spoken>",
      "after": "<native polished way to say it in ${scenario.lang}>",
      "reason": "<clear explanation of why this sounds more natural in Vietnamese>",
      "type": "<accent | grammar | vocabulary | intonation>"
    }
  ],
  "aiResponse": {
    "text": "<Persona's natural reply in ${scenario.lang} to continue the roleplay>",
    "reading": "<pronunciation reading if Asian language, else null>",
    "translation": "<natural Vietnamese translation of Persona's reply>"
  },
  "nativeAudioText": "<The polished version of the user's sentence for TTS reference>"
}`;

  const userPrompt = `Scenario: ${scenario.title}\nRecent Chat:\n${historyPrompt}\nUser Spoke: "${userSpeechText}"`;

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
        num_predict: 2048,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Speech Evaluation Error (${res.status}): ${errText}`);
  }

  const raw = await res.json();
  const content = raw.message?.content || '{}';
  const data = cleanJson<SpeechEvaluationResult>(content);

  return {
    overallScore: data.overallScore ?? 80,
    fluency: data.fluency || { score: 80, label: 'Khá', feedback: 'Tốc độ vừa phải.' },
    accent: data.accent || { score: 75, label: 'Tương đối chuẩn', feedback: 'Chú ý phát âm rõ các âm đuôi.' },
    intonation: data.intonation || { score: 80, label: 'Tự nhiên', feedback: 'Ngữ điệu khá tốt.' },
    vocabulary: data.vocabulary || { score: 85, label: 'Đúng ngữ cảnh', feedback: 'Từ vựng phù hợp với ngữ cảnh.' },
    strengths: data.strengths || ['Phát âm rõ ràng, tự tin.'],
    improvements: data.improvements || ['Chú ý ngữ điệu cuối câu.'],
    corrections: data.corrections || [],
    aiResponse: data.aiResponse || {
      text: 'はい、承知いたしました！他にご注文はございますか？',
      translation: 'Vâng, tôi đã hiểu ạ! Quý khách có muốn gọi thêm gì nữa không?',
    },
    nativeAudioText: data.nativeAudioText || userSpeechText,
  };
}

/**
 * Real-time In-Speech Word & Phrase Assist.
 * When the user doesn't know how to say a word or idea during speaking,
 * this returns 2-3 instant natural expressions with formality and pronunciation.
 */
export async function getInSpeechWordAssist(params: {
  query: string;
  targetLang: LanguageCode;
  scenarioContext?: string;
  model: string;
  endpoint?: string;
}): Promise<InSpeechAssistSuggestion[]> {
  const { query, targetLang, scenarioContext = '', model, endpoint = DEFAULT_OLLAMA_ENDPOINT } = params;
  const targetInfo = getLanguageInfo(targetLang);

  const systemPrompt = `You are ARUKAS 2 Phrasing Whisper AI.
The user is speaking in ${targetInfo.name} (${targetLang}) and is stuck trying to express: "${query}".
Context: "${scenarioContext}".
Provide 2 to 3 natural, practical ways to say this in ${targetInfo.name} ranging from natural casual to polite/business.
Return STRICT JSON:
{
  "suggestions": [
    {
      "text": "<phrase in ${targetInfo.name}>",
      "reading": "<pronunciation reading if JA/ZH/KO, else IPA>",
      "meaning": "<precise meaning in Vietnamese>",
      "formality": "<Tự nhiên (Casual) | Lịch sự (Polite/Formal) | Chuyên nghiệp (Business)>",
      "usageTip": "<brief pragmatic note on when to use this in Vietnamese>"
    }
  ]
}`;

  const res = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.1,
        num_predict: 1024,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Word Assist Error: ${res.statusText}`);
  }

  const raw = await res.json();
  const content = raw.message?.content || '{}';
  const data = cleanJson<{ suggestions?: InSpeechAssistSuggestion[] }>(content);

  return data.suggestions || [];
}
