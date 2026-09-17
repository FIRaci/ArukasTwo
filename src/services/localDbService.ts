// ============================================================
//  LOCAL DATABASE SERVICE — ARUKAS 2
//  High-Performance IndexedDB Storage with idb-keyval
// ============================================================

import { get, set, del } from 'idb-keyval';
import {
  SavedWord,
  SavedGrammar,
  SavedComparison,
  TextAnalysisResult,
  LanguageCode,
} from '../types';

const KEYS = {
  WORDS: 'arukas2_saved_words',
  GRAMMAR: 'arukas2_saved_grammar',
  COMPARISONS: 'arukas2_saved_comparisons',
  HISTORY: 'arukas2_analysis_history',
} as const;

// ── SAVED WORDS ──
export async function getSavedWords(langFilter?: LanguageCode): Promise<SavedWord[]> {
  try {
    const list = (await get<SavedWord[]>(KEYS.WORDS)) || [];
    if (!langFilter) return list;
    return list.filter((w) => w.lang === langFilter);
  } catch (e) {
    console.error('[DB] Failed to get words:', e);
    return [];
  }
}

export async function saveWordItem(word: SavedWord): Promise<void> {
  const list = (await get<SavedWord[]>(KEYS.WORDS)) || [];
  const existingIdx = list.findIndex((w) => w.id === word.id || (w.text === word.text && w.lang === word.lang));
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...word, savedAt: Date.now() };
  } else {
    list.unshift(word);
  }
  await set(KEYS.WORDS, list);
}

export async function deleteWordItem(id: string): Promise<void> {
  const list = (await get<SavedWord[]>(KEYS.WORDS)) || [];
  const updated = list.filter((w) => w.id !== id);
  await set(KEYS.WORDS, updated);
}

// ── SAVED GRAMMAR ──
export async function getSavedGrammar(langFilter?: LanguageCode): Promise<SavedGrammar[]> {
  try {
    const list = (await get<SavedGrammar[]>(KEYS.GRAMMAR)) || [];
    if (!langFilter) return list;
    return list.filter((g) => g.lang === langFilter);
  } catch (e) {
    console.error('[DB] Failed to get grammar:', e);
    return [];
  }
}

export async function saveGrammarItem(item: SavedGrammar): Promise<void> {
  const list = (await get<SavedGrammar[]>(KEYS.GRAMMAR)) || [];
  const existingIdx = list.findIndex((g) => g.id === item.id || (g.structure === item.structure && g.lang === item.lang));
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...item, savedAt: Date.now() };
  } else {
    list.unshift(item);
  }
  await set(KEYS.GRAMMAR, list);
}

export async function deleteGrammarItem(id: string): Promise<void> {
  const list = (await get<SavedGrammar[]>(KEYS.GRAMMAR)) || [];
  const updated = list.filter((g) => g.id !== id);
  await set(KEYS.GRAMMAR, updated);
}

// ── SAVED COMPARISONS ──
export async function getSavedComparisons(langFilter?: LanguageCode): Promise<SavedComparison[]> {
  try {
    const list = (await get<SavedComparison[]>(KEYS.COMPARISONS)) || [];
    if (!langFilter) return list;
    return list.filter((c) => c.lang === langFilter);
  } catch (e) {
    console.error('[DB] Failed to get comparisons:', e);
    return [];
  }
}

export async function saveComparisonItem(comp: SavedComparison): Promise<void> {
  const list = (await get<SavedComparison[]>(KEYS.COMPARISONS)) || [];
  const existingIdx = list.findIndex((c) => c.id === comp.id);
  if (existingIdx >= 0) {
    list[existingIdx] = comp;
  } else {
    list.unshift(comp);
  }
  await set(KEYS.COMPARISONS, list);
}

export async function deleteComparisonItem(id: string): Promise<void> {
  const list = (await get<SavedComparison[]>(KEYS.COMPARISONS)) || [];
  await set(KEYS.COMPARISONS, list.filter((c) => c.id !== id));
}

// ── ANALYSIS HISTORY ──
export async function getAnalysisHistory(): Promise<TextAnalysisResult[]> {
  try {
    return (await get<TextAnalysisResult[]>(KEYS.HISTORY)) || [];
  } catch (e) {
    console.error('[DB] Failed to get history:', e);
    return [];
  }
}

export async function saveAnalysisToHistory(item: TextAnalysisResult): Promise<void> {
  const list = (await get<TextAnalysisResult[]>(KEYS.HISTORY)) || [];
  // Deduplicate recent same source text
  const filtered = list.filter((h) => h.sourceText !== item.sourceText);
  filtered.unshift(item);
  // Keep max 100 history items
  const trimmed = filtered.slice(0, 100);
  await set(KEYS.HISTORY, trimmed);
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const list = (await get<TextAnalysisResult[]>(KEYS.HISTORY)) || [];
  await set(KEYS.HISTORY, list.filter((h) => h.id !== id));
}

export async function clearAllHistory(): Promise<void> {
  await del(KEYS.HISTORY);
}

// ── BACKUP & RESTORE ──
export async function exportAllLocalData(): Promise<string> {
  const words = (await get<SavedWord[]>(KEYS.WORDS)) || [];
  const grammar = (await get<SavedGrammar[]>(KEYS.GRAMMAR)) || [];
  const comparisons = (await get<SavedComparison[]>(KEYS.COMPARISONS)) || [];
  const history = (await get<TextAnalysisResult[]>(KEYS.HISTORY)) || [];

  return JSON.stringify(
    {
      app: 'ARUKAS 2',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      words,
      grammar,
      comparisons,
      history,
    },
    null,
    2
  );
}

export async function importLocalData(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') throw new Error('Invalid JSON format');

    let totalImported = 0;
    if (Array.isArray(data.words)) {
      await set(KEYS.WORDS, data.words);
      totalImported += data.words.length;
    }
    if (Array.isArray(data.grammar)) {
      await set(KEYS.GRAMMAR, data.grammar);
      totalImported += data.grammar.length;
    }
    if (Array.isArray(data.comparisons)) {
      await set(KEYS.COMPARISONS, data.comparisons);
      totalImported += data.comparisons.length;
    }
    if (Array.isArray(data.history)) {
      await set(KEYS.HISTORY, data.history);
      totalImported += data.history.length;
    }

    return { success: true, count: totalImported };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return { success: false, count: 0, error: message };
  }
}
