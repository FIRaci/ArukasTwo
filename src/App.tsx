import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnalysisState, ImageInput, SavedToken, Token, SavedGrammar, GrammarStructure, SavedComparison, ComparisonResult, RelatedWord, PartType, SavedTextSession } from './types';
import { analyzeJapaneseText, enrichVocabulary, enrichGrammar } from './services/analysisEngine';
import { speakJapaneseText, stopJapaneseTts, onTtsEnd } from './services/googleTtsService';
import SentenceBlock from './components/SentenceBlock';
import FallingPetals from './components/FallingPetals';
import MotionBackground from './components/MotionBackground';
import LottieAnalyzeSpinner from './components/LottieAnalyzeSpinner';
import UserHub from './components/UserHub';
import AuthModal from './components/AuthModal';
import SettingsPanel from './components/SettingsPanel';
import TutorialPanel from './components/TutorialPanel';
import { useSettings } from './contexts/SettingsContext';
import { useAuth } from './hooks/useAuth';
import { useMotionBudget } from './hooks/useMotionBudget';
import { useCinematicMotion } from './hooks/useCinematicMotion';
import { MOCK_ANALYSIS_RESULT, MOCK_VOCAB_ITEMS, MOCK_GRAMMAR_ITEMS, MOCK_COMPARISONS } from './data/mockData';
import {
  loadUserData,
  saveVocabItem,
  deleteVocabItem,
  saveGrammarItem,
  deleteGrammarItem,
  saveComparisonItem,
  deleteComparisonItem,
  seedMockData,
} from './services/firestoreService';
import { signOut } from 'firebase/auth';
import { auth } from './services/firebase';

// --- VISUAL ASSETS ---
const SakuraBranchArt = () => (
  <svg 
    className="fixed bottom-0 right-0 w-[400px] h-[400px] pointer-events-none opacity-10 z-0 text-rose-300"
    viewBox="0 0 500 500" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M450 500 C 450 400, 300 400, 200 300 C 150 250, 100 280, 50 250" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="200" cy="300" r="10" fill="currentColor" />
    <circle cx="180" cy="280" r="8" fill="currentColor" />
    <circle cx="220" cy="290" r="12" fill="currentColor" />
    <circle cx="60" cy="250" r="15" fill="currentColor" />
    <circle cx="40" cy="230" r="10" fill="currentColor" />
    <path d="M200 300 Q 250 200 350 150" stroke="currentColor" strokeWidth="1" fill="none"/>
    <circle cx="350" cy="150" r="8" fill="currentColor"/>
  </svg>
);

interface UploadedImage {
  id: string;
  url: string;      // For display
  base64: string;   // For API (without prefix)
  mimeType: string;
}

function isPreviewData(data: AnalysisState['data'] | null): boolean {
  return Boolean((data as { _isPreview?: boolean } | null)?._isPreview);
}

const App: React.FC = () => {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(() => {
    try { return localStorage.getItem('arukas_navbar_hidden') === 'true'; } catch { return false; }
  });
  const [heroCollapsed, setHeroCollapsed] = useState<boolean | null>(() => {
    try { const v = localStorage.getItem('arukas_hero_collapsed'); return v === 'true' ? true : v === 'false' ? false : null; } catch { return null; }
  });
  const [input, setInput] = useState<string>('');
  const [images, setImages] = useState<UploadedImage[]>([]);

  // --- Text Session Saving ---
  const TEXT_SESSIONS_KEY = 'arukas_text_sessions_local';
  const [savedTextSessions, setSavedTextSessions] = useState<SavedTextSession[]>(() => {
    try { const raw = localStorage.getItem(TEXT_SESSIONS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [currentTextSessionId, setCurrentTextSessionId] = useState<string | null>(null);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const sessionDropdownRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsRanges, setTtsRanges] = useState<{ start: number; end: number }[]>([]);
  const [activeRangeIdx, setActiveRangeIdx] = useState(0);
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rangeTrackRef = useRef<HTMLDivElement>(null);
  const localTokenizerModuleRef = useRef<Awaited<typeof import('./services/localTokenizer')> | null>(null);
  const draggingHandle = useRef<'left' | 'right' | null>(null);
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    data: null,
  });
  
  // --- SAVED STATE (starts with localStorage fallback, then Firestore) ---
  const [savedItems, setSavedItems] = useState<SavedToken[]>(() => {
    try {
      const stored = localStorage.getItem('yomu_saved_vocab');
      return stored ? JSON.parse(stored) : MOCK_VOCAB_ITEMS;
    } catch (e) {
      return MOCK_VOCAB_ITEMS;
    }
  });

  const [savedGrammars, setSavedGrammars] = useState<SavedGrammar[]>(() => {
    try {
      const stored = localStorage.getItem('yomu_saved_grammar');
      return stored ? JSON.parse(stored) : MOCK_GRAMMAR_ITEMS;
    } catch (e) {
      return MOCK_GRAMMAR_ITEMS;
    }
  });

  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>(() => {
    try {
      const stored = localStorage.getItem('yomu_saved_comparisons');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
           return parsed.filter((c: any) => c && Array.isArray(c.items) && Array.isArray(c.scenarios));
        }
      }
      return MOCK_COMPARISONS;
    } catch (e) {
      return MOCK_COMPARISONS;
    }
  });
  
  const [isUserHubOpen, setIsUserHubOpen] = useState(false);
  const { settings, openSettings } = useSettings();
  const motionBudget = useMotionBudget();

  useCinematicMotion({
    enabled: !motionBudget.reducedMotion,
    refreshKey: `${state.data?.blocks.length ?? 0}-${images.length}`,
  });

  // --- FIRESTORE: Load data when user logs in ---
  useEffect(() => {
    if (!user) return;
    loadUserData(user.uid).then(data => {
      if (data.vocab.length === 0 && data.grammar.length === 0 && data.comparisons.length === 0) {
        // First-time user: seed mock data to Firestore, then load from localStorage
        seedMockData(user.uid).catch(console.error);
      } else {
        setSavedItems(data.vocab);
        setSavedGrammars(data.grammar);
        setSavedComparisons(data.comparisons);
      }
    }).catch(console.error);
  }, [user]);

  // Sync to localStorage (offline fallback always works)
  useEffect(() => { localStorage.setItem('yomu_saved_vocab', JSON.stringify(savedItems)); }, [savedItems]);
  useEffect(() => { localStorage.setItem('yomu_saved_grammar', JSON.stringify(savedGrammars)); }, [savedGrammars]);
  useEffect(() => { localStorage.setItem('yomu_saved_comparisons', JSON.stringify(savedComparisons)); }, [savedComparisons]);

  // Helper: sync a single vocab item to Firestore
  const syncVocabToFirestore = useCallback((item: SavedToken) => {
    if (user) saveVocabItem(user.uid, item).catch(console.error);
  }, [user]);
  const syncDeleteVocab = useCallback((id: string) => {
    if (user) deleteVocabItem(user.uid, id).catch(console.error);
  }, [user]);
  const syncGrammarToFirestore = useCallback((item: SavedGrammar) => {
    if (user) saveGrammarItem(user.uid, item).catch(console.error);
  }, [user]);
  const syncDeleteGrammar = useCallback((id: string) => {
    if (user) deleteGrammarItem(user.uid, id).catch(console.error);
  }, [user]);
  const syncComparisonToFirestore = useCallback((item: SavedComparison) => {
    if (user) saveComparisonItem(user.uid, item).catch(console.error);
  }, [user]);
  const syncDeleteComparison = useCallback((id: string) => {
    if (user) deleteComparisonItem(user.uid, id).catch(console.error);
  }, [user]);

  // --- VOCAB HANDLERS ---
  const handleToggleSaveToken = (token: Token) => {
    setSavedItems(prev => {
        const textToSave = token.deepDive?.dictionaryForm || token.text;
        const readingToSave = token.deepDive?.dictionaryReading || token.reading;
        
        const existingIndex = prev.findIndex(item => item.text === textToSave);
        
        if (existingIndex >= 0) {
            const removedId = prev[existingIndex].id;
            syncDeleteVocab(removedId);
            const newItems = [...prev];
            newItems.splice(existingIndex, 1);
            return newItems;
        } else {
            const tokenToSave: SavedToken = { 
                ...token, 
                text: textToSave,
                reading: readingToSave, 
                id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                savedAt: Date.now(),
                extendedAnalysis: null,
            };
            syncVocabToFirestore(tokenToSave);
            return [...prev, tokenToSave];
        }
    });
  };

  const handleManualAddVocab = async (text: string) => {
      const existing = savedItems.find(i => i.text === text || i.reading === text);
      if (existing) return existing;

      const newToken: SavedToken = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
          text: text,
          reading: '', 
          romaji: '',
          meaning: 'Đang phân tích...',
          type: PartType.NOUN, // Default placeholder
          roleDescription: 'Từ vựng thủ công',
          savedAt: Date.now(),
          extendedAnalysis: null,
          deepDive: {
              dictionaryForm: text
          }
      };

      setSavedItems(prev => [newToken, ...prev]);
      syncVocabToFirestore(newToken);
      // Await enrichment to ensure UI updates happen sequentially if possible, 
      // though react state updates are async.
      await handleEnrichItem(newToken);
      return newToken;
  };

  const handleAddRelatedItem = (item: RelatedWord, typeHint: PartType) => {
      setSavedItems(prev => {
          if (prev.some(i => i.text === item.text)) return prev;
          
          const newToken: SavedToken = {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
              text: item.text,
              reading: item.reading,
              meaning: item.meaning,
              type: typeHint,
              romaji: '',
              roleDescription: 'Từ liên quan',
              savedAt: Date.now(),
              extendedAnalysis: null,
              deepDive: { tags: ['Related Word'] }
          };
          
          syncVocabToFirestore(newToken);
          setTimeout(() => handleEnrichItem(newToken), 100);
          return [...prev, newToken];
      });
  };

  const handleRemoveSavedItem = (id: string) => {
      syncDeleteVocab(id);
      setSavedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleEnrichItem = async (item: SavedToken) => {
      if (item.extendedAnalysis && !item.extendedAnalysis.candidates) return;

      try {
          const searchText = item.deepDive?.dictionaryForm || item.text;
          const enrichmentData = await enrichVocabulary(searchText, item.type);
          
          // CANDIDATE EXPANSION LOGIC
          if (enrichmentData.candidates && enrichmentData.candidates.length > 0) {
              const newTokens: SavedToken[] = enrichmentData.candidates.map(c => ({
                  id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                  text: c.text,
                  reading: c.reading,
                  meaning: c.meaning,
                  romaji: '',
                  type: (c.type as PartType) || PartType.NOUN,
                  roleDescription: 'Từ đồng âm',
                  savedAt: Date.now(),
                  extendedAnalysis: null,
                  deepDive: {
                      dictionaryForm: c.text,
                      dictionaryReading: c.reading,
                      tags: ['Homophone']
                  }
              }));

              setSavedItems(prev => {
                  const filtered = prev.filter(p => p.id !== item.id);
                  const nonDuplicateNewTokens = newTokens.filter(nt => !filtered.some(f => f.text === nt.text));
                  return [...nonDuplicateNewTokens, ...filtered];
              });

              newTokens.forEach((t, idx) => {
                  setTimeout(() => handleEnrichItem(t), (idx + 1) * 800);
              });
              return;
          }

          setSavedItems(prev => prev.map(i => {
              if (i.id === item.id) {
                  const newTags = [...(i.deepDive?.tags || [])];
                  if (i.roleDescription === 'Từ liên quan' && !newTags.includes('Related Word')) {
                      newTags.push('Related Word');
                  }
                  
                  // UPDATED: Priority to Canonical Form (Kanji) -> Dictionary Form -> Input Text
                  const updatedText = enrichmentData.canonicalForm || enrichmentData.conjugations?.dictionary || i.text;
                  const updatedReading = enrichmentData.dictionaryReading || i.reading;

                  // CRITICAL FIX: Update Type and Meaning from AI results
                  const updatedType = enrichmentData.type 
                      ? (enrichmentData.type as PartType) 
                      : (enrichmentData.transitivity && enrichmentData.transitivity !== 'N/A' ? PartType.VERB : i.type);

                  const enriched: SavedToken = { 
                      ...i,
                      text: updatedText, 
                      reading: updatedReading,
                      type: updatedType, // Update Type
                      meaning: enrichmentData.definitionDetail || i.meaning, // Update Meaning from Analyzing... to real def
                      extendedAnalysis: enrichmentData,
                      hanViet: i.hanViet || enrichmentData.kanjiDetails?.map(k => k.hanViet).join(' ') || undefined,
                      deepDive: {
                          ...i.deepDive,
                          dictionaryForm: updatedText,
                          dictionaryReading: updatedReading,
                          tags: newTags
                      }
                  };
                  syncVocabToFirestore(enriched);
                  return enriched;
              }
              return i;
          }));
      } catch (e) {
          console.error("Enrichment failed", e);
      }
  };

  const isTokenSaved = (token: Token) => {
      const targetText = token.deepDive?.dictionaryForm || token.text;
      return savedItems.some(item => item.text === targetText);
  }

  // --- GRAMMAR HANDLERS ---
  const generateGrammarId = (grammar: GrammarStructure) => {
      try {
        const utf8 = new TextEncoder().encode(`${grammar.structure}|${grammar.meaning}`);
        return btoa(Array.from(utf8, b => String.fromCharCode(b)).join(''));
      } catch (e) { return `${grammar.structure}-${Date.now()}`; }
  };

  const handleToggleSaveGrammar = (grammar: GrammarStructure) => {
      const grammarId = generateGrammarId(grammar);
      setSavedGrammars(prev => {
          const exists = prev.find(g => g.id === grammarId);
          if (exists) return prev.filter(g => g.id !== grammarId);
          const grammarToSave: SavedGrammar = {
              ...grammar,
              id: grammarId,
              savedAt: Date.now(),
              extendedAnalysis: null
          };
          syncGrammarToFirestore(grammarToSave);
          handleEnrichGrammar(grammarToSave);
          return [...prev, grammarToSave];
      });
  };

  const handleAddRelatedGrammar = (structure: string, meaning?: string) => {
      setSavedGrammars(prev => {
          if (prev.some(g => g.structure === structure)) return prev;
          const newGrammar: SavedGrammar = {
              id: Date.now().toString(),
              structure: structure,
              reading: '',
              meaning: meaning || 'Đang phân tích và chuẩn hóa...',
              usage: 'Được thêm từ mục so sánh/liên quan.',
              construction: 'Đang cập nhật...',
              savedAt: Date.now(),
              extendedAnalysis: null
          };
          syncGrammarToFirestore(newGrammar);
          setTimeout(() => handleEnrichGrammar(newGrammar), 100);
          return [...prev, newGrammar];
      });
  };

  const handleRemoveSavedGrammar = (id: string) => {
      syncDeleteGrammar(id);
      setSavedGrammars(prev => prev.filter(g => g.id !== id));
  };

  const handleEnrichGrammar = async (grammar: SavedGrammar) => {
      if (grammar.extendedAnalysis) return;
      try {
          const enrichmentData = await enrichGrammar(grammar.structure);
          setSavedGrammars(prev => prev.map(g => {
              if (g.id === grammar.id) {
                  const enriched: SavedGrammar = { 
                      ...g, 
                      extendedAnalysis: enrichmentData,
                      // UPDATE: Ensure canonical structure is used (e.g. Romaji -> Japanese)
                      structure: enrichmentData.structure || g.structure,
                      meaning: enrichmentData.generalMeaning || g.meaning, 
                      // FIX: Do not fallback to example reading, strictly use the reading of the grammar
                      reading: enrichmentData.reading || g.reading || '', 
                      hanViet: enrichmentData.hanViet || g.hanViet, 
                      jlpt: enrichmentData.jlpt || g.jlpt,
                      tags: enrichmentData.tags
                  };
                  syncGrammarToFirestore(enriched);
                  return enriched;
              }
              return g;
          }));
      } catch (e) { console.error("Grammar Enrichment failed", e); }
  };

  const isGrammarSaved = (grammar: GrammarStructure) => {
      const id = generateGrammarId(grammar);
      return savedGrammars.some(g => g.id === id);
  }

  // --- COMPARISON HANDLERS ---
  const handleSaveComparison = (comparison: ComparisonResult, query: string) => {
      setSavedComparisons(prev => {
          const exists = prev.find(c => c.title === comparison.title);
          if (exists) return prev;
          const newComparison: SavedComparison = {
              ...comparison,
              id: Date.now().toString(),
              query: query,
              savedAt: Date.now()
          };
          syncComparisonToFirestore(newComparison);
          return [...prev, newComparison];
      });
  };

  const handleRemoveComparison = (id: string) => {
      syncDeleteComparison(id);
      setSavedComparisons(prev => prev.filter(c => c.id !== id));
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- TEXT SESSION HANDLERS ---
  const generateSessionId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sessionDropdownRef.current && !sessionDropdownRef.current.contains(e.target as Node)) {
        setShowSessionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSaveTextSession = useCallback(() => {
    if (!state.data || !input.trim()) return;
    const title = input.trim().slice(0, 50) + (input.trim().length > 50 ? '...' : '');
    const session: SavedTextSession = {
      id: currentTextSessionId || generateSessionId(),
      title,
      inputText: input,
      analysisData: state.data,
      createdAt: currentTextSessionId
        ? savedTextSessions.find(s => s.id === currentTextSessionId)?.createdAt || Date.now()
        : Date.now(),
      updatedAt: Date.now(),
      savedAt: Date.now(),
    };
    setSavedTextSessions(prev => {
      const newList = [session, ...prev.filter(s => s.id !== session.id)];
      try { localStorage.setItem(TEXT_SESSIONS_KEY, JSON.stringify(newList)); } catch { /* */ }
      return newList;
    });
    setCurrentTextSessionId(session.id);
  }, [input, state.data, currentTextSessionId, savedTextSessions]);

  const handleLoadTextSession = useCallback((session: SavedTextSession) => {
    setInput(session.inputText);
    setState({ isAnalyzing: false, data: session.analysisData });
    setCurrentTextSessionId(session.id);
    setShowSessionDropdown(false);
    setImages([]);
    setTtsRanges([]);
    setActiveRangeIdx(0);
    setShowRangeSelector(false);
  }, []);

  const handleDeleteTextSession = useCallback((id: string) => {
    setSavedTextSessions(prev => {
      const newList = prev.filter(s => s.id !== id);
      try { localStorage.setItem(TEXT_SESSIONS_KEY, JSON.stringify(newList)); } catch { /* */ }
      return newList;
    });
    if (currentTextSessionId === id) setCurrentTextSessionId(null);
  }, [currentTextSessionId]);

  const handleNewTextSession = useCallback(() => {
    setInput('');
    setState({ isAnalyzing: false, data: null });
    setCurrentTextSessionId(null);
    setImages([]);
    setTtsRanges([]);
    setActiveRangeIdx(0);
    setShowRangeSelector(false);
    setShowSessionDropdown(false);
  }, []);

  const loadLocalTokenizer = useCallback(async () => {
    if (!localTokenizerModuleRef.current) {
      localTokenizerModuleRef.current = await import('./services/localTokenizer');
    }
    return localTokenizerModuleRef.current;
  }, []);

  const handleAnalyze = async () => {
    if (!input.trim() && images.length === 0) return;
    setState(prev => ({ ...prev, isAnalyzing: true }));
    try {
        const apiImages: ImageInput[] = images.map(img => ({ mimeType: img.mimeType, data: img.base64 }));
        const resultPromise = analyzeJapaneseText(input, apiImages);

        // ═══ INSTANT PREVIEW: Show local tokenization immediately ═══
        if (input.trim() && apiImages.length === 0) {
          try {
            const tokenizer = await loadLocalTokenizer();
            const preview = tokenizer.localPreTokenize(input);
            setState({ isAnalyzing: true, data: preview });
          } catch (previewErr) {
            console.warn('Local preview unavailable, continuing with Gemini analysis.', previewErr);
          }
        }

        const result = await resultPromise;
        setState({ isAnalyzing: false, data: result });
    } catch (error) {
        console.error("Analysis failed:", error);
        // Keep preview if we had one, just stop analyzing
        setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };
  
  const loadMockAnalysis = () => {
      setState({ isAnalyzing: false, data: MOCK_ANALYSIS_RESULT });
      setInput("雨が降っていたのに、彼は傘を持たずに出かけた。その結果、風邪を引いてしまった。");
  };

  const handleTextSelect = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    if (selectionStart !== selectionEnd) {
      // Add as new range (or replace active) when selecting in textarea
      setTtsRanges(prev => {
        const newRange = { start: selectionStart, end: selectionEnd };
        if (prev.length === 0) { setActiveRangeIdx(0); return [newRange]; }
        const next = [...prev];
        next[activeRangeIdx] = newRange;
        return next;
      });
      setShowRangeSelector(true);
    }
  };

  // --- Range drag logic (character-level) ---
  const findClosestCharIdx = (clientX: number, clientY: number): number => {
    const container = rangeTrackRef.current;
    if (!container || !input.length) return 0;
    const charEls = container.querySelectorAll<HTMLElement>('[data-ci]');
    let closestIdx = 0;
    let closestDist = Infinity;
    charEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const dist = dx * dx + dy * dy;
      const idx = parseInt(el.dataset.ci || '0');
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });
    return closestIdx;
  };

  const handleRangePointerDown = (handle: 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    draggingHandle.current = handle;
  };

  const handleRangePointerMove = (e: React.PointerEvent) => {
    if (!draggingHandle.current) return;
    const idx = findClosestCharIdx(e.clientX, e.clientY);
    setTtsRanges(prev => {
      const next = [...prev];
      const cur = next[activeRangeIdx] || { start: 0, end: input.length };
      if (draggingHandle.current === 'left') {
        next[activeRangeIdx] = { start: Math.min(idx, cur.end - 1), end: cur.end };
      } else {
        next[activeRangeIdx] = { start: cur.start, end: Math.max(idx + 1, cur.start + 1) };
      }
      return next;
    });
  };

  const handleRangePointerUp = () => {
    draggingHandle.current = null;
  };

  const getTtsText = (): string => {
    if (ttsRanges.length === 0) return input;
    // Merge all ranges, sort by start, extract text  
    const sorted = [...ttsRanges].filter(r => r.start !== r.end).sort((a, b) => a.start - b.start);
    if (sorted.length === 0) return input;
    return sorted.map(r => input.slice(r.start, r.end).trim()).filter(Boolean).join(' ');
  };

  const handleSpeakText = async () => {
    if (isSpeaking) {
      stopJapaneseTts();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = getTtsText();
    if (!textToSpeak) return;

    try {
      setIsSpeaking(true);
      onTtsEnd(() => setIsSpeaking(false));
      await speakJapaneseText(textToSpeak);
      setIsSpeaking(false);
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: UploadedImage[] = [];
      const files = Array.from(e.target.files) as File[];
      for (const file of files) {
        try {
          const { base64, mimeType } = await readFileAsBase64(file);
          newImages.push({ id: Math.random().toString(36).substring(7), url: URL.createObjectURL(file), base64, mimeType });
        } catch (err) { console.error("Error reading file", err); }
      }
      setImages(prev => [...prev, ...newImages]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault(); 
            const blob = items[i].getAsFile();
            if (blob) {
                try {
                    const { base64, mimeType } = await readFileAsBase64(blob);
                    setImages(prev => [...prev, { id: Math.random().toString(36).substring(7), url: URL.createObjectURL(blob), base64, mimeType }]);
                } catch (err) { console.error("Paste error", err); }
            }
        }
    }
  };

  const removeImage = (id: string) => setImages(prev => prev.filter(img => img.id !== id));

  const readFileAsBase64 = (file: Blob | File): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [header, content] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
        resolve({ base64: content, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  const scrollToBlock = (blockId: string) => {
      const element = document.getElementById(`block-${blockId}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen pb-10 relative overflow-hidden bg-[#FAFAF5]">
      <MotionBackground enabled={motionBudget.allowHeavyEffects} />
      <FallingPetals enabled={settings.petalsEnabled && motionBudget.allowHeavyEffects} />
      <SettingsPanel />
      <TutorialPanel isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <SakuraBranchArt />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} user={user} onLogout={() => signOut(auth)} />
      <UserHub 
        isOpen={isUserHubOpen} onClose={() => setIsUserHubOpen(false)} 
        savedItems={savedItems} onRemoveItem={handleRemoveSavedItem} onSelectItem={handleEnrichItem}
        savedGrammars={savedGrammars} onRemoveGrammar={handleRemoveSavedGrammar} onSelectGrammar={handleEnrichGrammar}
        savedComparisons={savedComparisons} onSaveComparison={handleSaveComparison} onRemoveComparison={handleRemoveComparison}
        onAddRelatedItem={handleAddRelatedItem} onAddRelatedGrammar={handleAddRelatedGrammar}
        onManualAddVocab={handleManualAddVocab}
      />

      {/* Floating navbar reveal button */}
      <button
        onClick={() => { setNavbarHidden(false); try { localStorage.setItem('arukas_navbar_hidden', 'false'); } catch (e) { console.error(e); } }}
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-stone-200 shadow-lg text-stone-500 hover:text-rose-500 hover:bg-white transition-all duration-300 ${navbarHidden ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
        title="Hiện thanh điều hướng"
        aria-label="Hiện thanh điều hướng"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        <span className="text-[11px] font-medium">Menu</span>
      </button>
      
      <nav data-reveal className={`io-fade sticky top-0 z-50 bg-[#FAFAF5]/80 backdrop-blur-md border-b border-stone-200/50 transition-all duration-300 overflow-hidden ${navbarHidden ? 'max-h-0 border-transparent' : 'max-h-20'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <h1 className="text-xl font-bold tracking-tight text-stone-800 font-serif-jp">Aruka<span className="text-rose-400">S</span></h1>
          </div>
          <div className="flex items-center gap-4">

              {/* Reference Link */}
              <Link to="/reference" className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Bảng tham khảo">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <span className="text-xs font-medium hidden sm:inline">Tham khảo</span>
              </Link>
              {/* Dictionary Link */}
              <Link to="/dictionary" className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Từ điển">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                <span className="text-xs font-medium hidden sm:inline">Từ điển</span>
              </Link>
              {/* Grammar Link */}
              <Link to="/grammar" className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Ngữ pháp">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <span className="text-xs font-medium hidden sm:inline">Ngữ pháp</span>
              </Link>

              {/* Auth Button */}
              <button onClick={() => setIsAuthModalOpen(true)} className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title={user ? user.displayName || 'Tài khoản' : 'Đăng nhập'} aria-label={user ? user.displayName || 'Tài khoản' : 'Đăng nhập'}>
                {user ? (
                  <>{user.photoURL ? <img src={user.photoURL} className="w-5 h-5 rounded-full" alt="" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}<span className="text-xs font-medium hidden sm:inline max-w-[80px] truncate">{user.displayName || 'User'}</span></>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg><span className="text-xs font-medium hidden sm:inline">Đăng nhập</span></>
                )}
              </button>
              <button onClick={() => setIsUserHubOpen(true)} className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Kho lưu trữ & Từ vựng" aria-label="Kho lưu trữ và Từ vựng">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  {(savedItems.length + savedGrammars.length + savedComparisons.length) > 0 && (
                      <span className="bg-rose-700 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center">{savedItems.length + savedGrammars.length + savedComparisons.length}</span>
                  )}
              </button>

              {/* Settings Button */}
              <button onClick={() => setIsTutorialOpen(true)} className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Hướng dẫn" aria-label="Hướng dẫn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01" /></svg>
              </button>
              <button onClick={openSettings} className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Cài đặt" aria-label="Cài đặt">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
              {/* Navbar hide button */}
              <button onClick={() => { setNavbarHidden(true); try { localStorage.setItem('arukas_navbar_hidden', 'true'); } catch (e) { console.error(e); } }} className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-100 transition-all" title="Ẩn thanh điều hướng" aria-label="Ẩn thanh điều hướng">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
              </button>
          </div>
        </div>
      </nav>

      {(() => {
        const autoHide = !!(input.trim() || state.data || images.length > 0);
        const isHidden = heroCollapsed === true || (heroCollapsed === null && autoHide);
        return (
      <main className={`max-w-6xl mx-auto px-6 relative z-10 transition-all duration-500 ${isHidden ? 'mt-4' : 'mt-12'}`}>
        <div data-reveal data-parallax className={`io-fade text-center overflow-hidden transition-all duration-500 ease-in-out ${isHidden ? 'max-h-0 opacity-0 mb-0' : 'max-h-32 opacity-100 mb-10'}`}>
            <h2 className="text-4xl font-serif-jp font-light text-stone-800 mb-4">Phân tích cú pháp chuyên sâu</h2>
            <p className="text-stone-500 font-light max-w-lg mx-auto">Khám phá cấu trúc ngữ pháp tiếng Nhật. Nhập văn bản hoặc dán ảnh (Ctrl+V) để phân tích logic câu.</p>
        </div>

        {/* Hero toggle button */}
        <div className="flex justify-center mb-3">
          <button
            onClick={() => setHeroCollapsed(prev => { const next = prev === null ? true : prev ? false : true; try { localStorage.setItem('arukas_hero_collapsed', String(next)); } catch (e) { console.error(e); } return next; })}
            className="group flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-rose-500 transition-all px-3 py-1 rounded-full hover:bg-rose-50 border border-transparent hover:border-rose-200"
            title={isHidden ? 'Hiện tiêu đề' : 'Ẩn tiêu đề'}
            aria-label={isHidden ? 'Hiện tiêu đề' : 'Ẩn tiêu đề'}
          >
            {isHidden ? (
              <><svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg><span>Hiện tiêu đề</span></>
            ) : (
              <><svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg><span>Ẩn tiêu đề</span></>
            )}
          </button>
        </div>

        {/* ═══ MODE TABS: Văn bản / Manga ═══ */}
        <div className="flex items-center gap-1 mb-4 bg-stone-100 p-1 rounded-xl w-fit mx-auto">
          <button className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-white text-stone-800 shadow-sm border border-stone-200 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Văn bản
          </button>
          <Link to="/manga" className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Manga
          </Link>
          <Link to="/anime" className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Anime
          </Link>
        </div>

        <div data-reveal className="io-fade bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-stone-200 p-6 mb-12 transition-all focus-within:ring-2 focus-within:ring-rose-100 focus-within:border-rose-300">
           <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Văn bản & Hình ảnh</span>
              <span className="text-xs text-stone-300 font-serif italic">Hỗ trợ dán ảnh (Ctrl+V)</span>
           </div>
           
           <div className="flex gap-3 items-start">
             <textarea
               ref={textareaRef}
               className="flex-1 h-32 text-xl font-serif-jp text-stone-700 bg-transparent resize-none focus:outline-none placeholder:text-stone-300"
               value={input}
               onChange={(e) => { setInput(e.target.value); setIsSpeaking(false); setTtsRanges([]); setActiveRangeIdx(0); }}
               onPaste={handlePaste}
               onSelect={handleTextSelect}
               placeholder="Nhập tiếng Nhật hoặc dán ảnh (Ctrl+V) vào đây..."
             />
             <div className="flex flex-col items-center gap-1.5 flex-shrink-0 mt-1">
               <button
                 onClick={handleSpeakText}
                 disabled={!input.trim()}
                 className={`group/tts w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${
                   isSpeaking
                     ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-105 ring-4 ring-rose-100'
                     : 'bg-stone-50 text-stone-400 hover:bg-rose-50 hover:text-rose-500 border border-stone-200 hover:border-rose-200'
                 }`}
                 title={isSpeaking ? 'Dừng đọc' : 'Đọc văn bản'}
               >
                 {isSpeaking ? (
                   <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                     <rect x="6" y="6" width="12" height="12" rx="2" />
                   </svg>
                 ) : (
                   <svg className="w-4.5 h-4.5 group-hover/tts:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8H5a1 1 0 00-1 1v4.4a1 1 0 001 1h1.5l4.1 3.7A.5.5 0 0011.5 18.5V5.5a.5.5 0 00-.9-.4L6.5 8.8z" />
                   </svg>
                 )}
               </button>
               {input.trim() && (
                 <button
                   onClick={() => setShowRangeSelector(prev => !prev)}
                   className={`w-10 h-7 rounded-lg flex items-center justify-center transition-all duration-200 text-xs font-bold tracking-tight ${
                     showRangeSelector
                       ? 'bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100'
                       : 'bg-stone-50 text-stone-400 border border-stone-200 hover:bg-stone-100 hover:text-stone-600'
                   }`}
                   title={showRangeSelector ? 'Ẩn vùng đọc' : 'Chọn vùng đọc'}
                 >
                   [&thinsp;]
                 </button>
               )}
             </div>
           </div>

           {/* Multi-range selector — hidden by default */}
           {input.trim() && showRangeSelector && (() => {
             const len = input.length;
             const RANGE_COLORS = [
               { bg: 'bg-rose-100/90', text: 'text-rose-800', bracket: 'text-rose-400', label: 'bg-rose-50 text-rose-500 border-rose-200' },
               { bg: 'bg-sky-100/90', text: 'text-sky-800', bracket: 'text-sky-400', label: 'bg-sky-50 text-sky-500 border-sky-200' },
               { bg: 'bg-emerald-100/90', text: 'text-emerald-800', bracket: 'text-emerald-400', label: 'bg-emerald-50 text-emerald-500 border-emerald-200' },
               { bg: 'bg-amber-100/90', text: 'text-amber-800', bracket: 'text-amber-400', label: 'bg-amber-50 text-amber-500 border-amber-200' },
               { bg: 'bg-purple-100/90', text: 'text-purple-800', bracket: 'text-purple-400', label: 'bg-purple-50 text-purple-500 border-purple-200' },
             ];
             // Build a map: charIndex → { rangeIdx, isStart, isEnd }
             const charMap = new Map<number, { rangeIdx: number; isStart: boolean; isEnd: boolean }>();
             ttsRanges.forEach((r, ri) => {
               for (let ci = r.start; ci < r.end; ci++) {
                 charMap.set(ci, { rangeIdx: ri, isStart: ci === r.start, isEnd: ci === r.end - 1 });
               }
             });
             const selectedCharCount = ttsRanges.reduce((s, r) => s + (r.end - r.start), 0);
             return (
               <div
                 ref={rangeTrackRef}
                 className="mt-2 select-none animate-in fade-in slide-in-from-top-2 duration-200"
                 onPointerMove={handleRangePointerMove}
                 onPointerUp={handleRangePointerUp}
               >
                 <div className="p-3 rounded-lg bg-stone-50/60 border border-stone-100 overflow-y-auto max-h-32">
                   <div className="flex flex-wrap items-center text-base font-serif-jp leading-relaxed">
                     {input.split('').map((char, i) => {
                       const info = charMap.get(i);
                       const inAnyRange = !!info;
                       const color = info ? RANGE_COLORS[info.rangeIdx % RANGE_COLORS.length] : null;
                       const isActiveRange = info && info.rangeIdx === activeRangeIdx;
                       return (
                         <React.Fragment key={i}>
                           {info?.isStart && (
                             <span
                               className={`inline-flex items-center cursor-ew-resize select-none transition-transform ${
                                 draggingHandle.current === 'left' && isActiveRange ? 'scale-125' : 'hover:scale-110'
                               } ${color!.bracket}`}
                               onPointerDown={(e) => { setActiveRangeIdx(info.rangeIdx); handleRangePointerDown('left')(e); }}
                               title={`Vùng ${info.rangeIdx + 1} — kéo [`}
                             >
                               <svg className="w-[7px] h-5" viewBox="0 0 7 20" fill="none" stroke="currentColor" strokeWidth="2">
                                 <path d="M6 1H2v18h4" strokeLinecap="round" strokeLinejoin="round" />
                               </svg>
                             </span>
                           )}
                           <span
                             data-ci={i}
                             className={`inline rounded-[2px] transition-colors duration-75 cursor-default ${
                               inAnyRange ? `${color!.bg} ${color!.text}` : 'text-stone-500'
                             }`}
                             onClick={(e) => {
                               if (inAnyRange && info) {
                                 if (e.ctrlKey || e.metaKey) {
                                   // Ctrl+Click → remove this range
                                   setTtsRanges(prev => prev.filter((_, idx) => idx !== info.rangeIdx));
                                   setActiveRangeIdx(prev => Math.max(0, Math.min(prev, ttsRanges.length - 2)));
                                 } else {
                                   setActiveRangeIdx(info.rangeIdx);
                                 }
                               } else {
                                 // Create a new range around the clicked char
                                 const span = Math.min(5, Math.max(1, Math.ceil(len * 0.08)));
                                 const newRange = { start: Math.max(0, i - Math.floor(span / 2)), end: Math.min(len, i + Math.ceil(span / 2)) };
                                 setTtsRanges(prev => [...prev, newRange]);
                                 setActiveRangeIdx(ttsRanges.length);
                               }
                             }}
                           >
                             {char === ' ' ? '\u00A0' : char === '\n' ? '\u21B5' : char}
                           </span>
                           {info?.isEnd && (
                             <span
                               className={`inline-flex items-center cursor-ew-resize select-none transition-transform ${
                                 draggingHandle.current === 'right' && isActiveRange ? 'scale-125' : 'hover:scale-110'
                               } ${color!.bracket}`}
                               onPointerDown={(e) => { setActiveRangeIdx(info.rangeIdx); handleRangePointerDown('right')(e); }}
                               title={`Vùng ${info.rangeIdx + 1} — kéo ]`}
                             >
                               <svg className="w-[7px] h-5" viewBox="0 0 7 20" fill="none" stroke="currentColor" strokeWidth="2">
                                 <path d="M1 1h4v18H1" strokeLinecap="round" strokeLinejoin="round" />
                               </svg>
                             </span>
                           )}
                         </React.Fragment>
                       );
                     })}
                   </div>
                 </div>
                 {/* Info + controls row */}
                 <div className="mt-1.5 flex items-center justify-between px-1 flex-wrap gap-1">
                   <span className="text-[10px] text-stone-400">
                     {ttsRanges.length === 0
                       ? 'Click vào chữ để tạo vùng đọc'
                       : `${ttsRanges.length} vùng — ${selectedCharCount} / ${len} ký tự`
                     }
                   </span>
                   <div className="flex items-center gap-1.5 flex-wrap">
                     {ttsRanges.map((r, ri) => {
                       const c = RANGE_COLORS[ri % RANGE_COLORS.length];
                       return (
                         <button
                           key={ri}
                           onClick={() => setActiveRangeIdx(ri)}
                           className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${c.label} ${
                             ri === activeRangeIdx ? 'ring-1 ring-offset-1 ring-stone-300' : 'opacity-70 hover:opacity-100'
                           }`}
                         >
                           {ri + 1}: {r.end - r.start}字
                         </button>
                       );
                     })}
                     {ttsRanges.length > 0 && (
                       <>
                         <button
                           onClick={() => {
                             setTtsRanges(prev => prev.filter((_, i) => i !== activeRangeIdx));
                             setActiveRangeIdx(prev => Math.max(0, prev - 1));
                           }}
                           className="text-[10px] px-2 py-0.5 rounded-full border border-stone-200 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                         >
                           Xóa vùng
                         </button>
                         <button
                           onClick={() => { setTtsRanges([]); setActiveRangeIdx(0); }}
                           className="text-[10px] px-2 py-0.5 rounded-full border border-stone-200 text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                         >
                           Xóa hết
                         </button>
                       </>
                     )}
                   </div>
                 </div>
               </div>
             );
           })()}

           {images.length > 0 && (
             <div className="flex flex-wrap gap-3 mt-4 mb-2">
               {images.map(img => (
                 <div key={img.id} className="relative group">
                   <img src={img.url} alt="Upload preview" className="h-20 w-auto rounded border border-stone-200 shadow-sm" />
                   <button onClick={() => removeImage(img.id)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-rose-600">×</button>
                 </div>
               ))}
             </div>
           )}

           <div className="flex justify-between items-center mt-4 pt-4 border-t border-stone-100">
             <div className="flex gap-2 flex-wrap items-center">
               <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />
               <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-100 text-sm font-medium">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                 Thêm ảnh
               </button>
               <button onClick={loadMockAnalysis} className="flex items-center gap-2 text-indigo-500 hover:text-indigo-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50 text-sm font-medium">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   Thử mẫu Demo
               </button>

               {/* Separator */}
               <div className="w-px h-6 bg-stone-200 mx-1"></div>

               {/* Save session button */}
               <button
                 onClick={handleSaveTextSession}
                 disabled={!state.data || !input.trim() || state.isAnalyzing}
                 className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                 title={currentTextSessionId ? 'Cập nhật phiên hiện tại' : 'Lưu phiên phân tích'}
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                 {currentTextSessionId ? 'Cập nhật' : 'Lưu'}
               </button>

               {/* Sessions dropdown */}
               <div className="relative" ref={sessionDropdownRef}>
                 <button
                   onClick={() => setShowSessionDropdown(prev => !prev)}
                   className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-100 text-sm font-medium"
                   title="Danh sách phiên đã lưu"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                   Phiên
                   {savedTextSessions.length > 0 && (
                     <span className="bg-stone-200 text-stone-600 text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center">{savedTextSessions.length}</span>
                   )}
                 </button>

                 {/* Dropdown panel */}
                 {showSessionDropdown && (
                   <div className="absolute left-0 bottom-full mb-1 w-80 max-h-[60vh] bg-white rounded-xl border border-stone-200 shadow-xl z-50 overflow-hidden overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
                     <div className="p-3 border-b border-stone-100 flex items-center justify-between">
                       <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Phiên đã lưu</span>
                       <button
                         onClick={handleNewTextSession}
                         className="text-[11px] text-rose-500 hover:text-rose-600 font-medium px-2 py-0.5 rounded hover:bg-rose-50 transition-colors"
                       >
                         + Phiên mới
                       </button>
                     </div>
                     {savedTextSessions.length === 0 ? (
                       <div className="p-6 text-center text-stone-400 text-sm">
                         <svg className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                         Chưa có phiên nào
                       </div>
                     ) : (
                       <div className="max-h-64 overflow-y-auto">
                         {savedTextSessions.map(session => (
                           <div
                             key={session.id}
                             className={`group flex items-center gap-2 px-3 py-2.5 hover:bg-stone-50 cursor-pointer transition-colors border-b border-stone-50 last:border-0 ${
                               session.id === currentTextSessionId ? 'bg-rose-50/50 border-l-2 border-l-rose-400' : ''
                             }`}
                           >
                             <button
                               onClick={() => handleLoadTextSession(session)}
                               className="flex-1 text-left min-w-0"
                             >
                               <div className="text-sm text-stone-700 font-medium truncate">{session.title}</div>
                               <div className="text-[10px] text-stone-400 mt-0.5">
                                 {session.analysisData.blocks.length} câu · {new Date(session.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                               </div>
                             </button>
                             <button
                               onClick={(e) => { e.stopPropagation(); handleDeleteTextSession(session.id); }}
                               className="p-1 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                               title="Xóa phiên"
                             >
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 )}
               </div>

               {/* New session button */}
               {currentTextSessionId && (
                 <button
                   onClick={handleNewTextSession}
                   className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-stone-100 text-sm"
                   title="Tạo phiên mới"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                 </button>
               )}
             </div>
             <button onClick={handleAnalyze} disabled={state.isAnalyzing || (!input.trim() && images.length === 0)} className="bg-stone-800 text-white px-8 py-2.5 rounded-full text-sm font-bold tracking-wide hover:bg-rose-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none active:scale-95 flex items-center gap-2">
               {state.isAnalyzing ? <><LottieAnalyzeSpinner />Đang phân tích...</> : 'Phân tích'}
             </button>
           </div>
        </div>

        {state.data && (
          <div className="space-y-12 animate-fade-in-up io-fade">
            {/* Preview banner when showing local pre-analysis */}
            {state.isAnalyzing && isPreviewData(state.data) && (
              <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm">
                <span className="w-5 h-5 border-2 border-amber-400/40 border-t-amber-500 rounded-full animate-spin shrink-0"></span>
                <div>
                  <div className="text-sm font-bold text-amber-700">Phân tích sơ bộ từ database local</div>
                  <div className="text-xs text-amber-600/80">Đang chờ Gemini phân tích chi tiết (pitch accent, ngữ pháp, bản dịch)...</div>
                </div>
              </div>
            )}
            {state.data.blocks.map((block) => (
              <div id={`block-${block.id}`} key={block.id} data-reveal className="io-fade scroll-mt-24 transition-colors duration-500 rounded-2xl">
                <SentenceBlock 
                    block={block} 
                    onToggleSave={handleToggleSaveToken}
                    isSaved={(id) => { const t = block.tokens.find(tk => tk.id === id); return t ? isTokenSaved(t) : false; }}
                    onToggleSaveGrammar={handleToggleSaveGrammar}
                    isGrammarSaved={isGrammarSaved}
                />
              </div>
            ))}
            {/* Summary section — hidden during preview since we don't have translations yet */}
            {!isPreviewData(state.data) && (
            <div data-reveal className="io-fade mt-12 p-8 bg-stone-100 rounded-2xl border-2 border-stone-200 shadow-inner">
               <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-400"></span>Tổng kết & Dòng chảy tư duy</h3>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                      <h4 className="text-xs font-bold text-stone-500 uppercase mb-4">Dòng chảy ngữ nghĩa (Click để xem chi tiết)</h4>
                      <div className="flex flex-col">
                        {state.data.blocks.map((block, index) => (
                          <div key={block.id} className="relative group">
                            {index > 0 && block.connectionInfo && (
                              <div className="flex flex-col items-center justify-center py-2 h-16 relative">
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-300 -translate-x-1/2"></div>
                                <div className="z-10 bg-stone-200 text-stone-600 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-stone-300 shadow-sm">{block.connectionInfo.description}</div>
                                <div className="absolute bottom-0 text-stone-300"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-12-18h24z" /></svg></div>
                              </div>
                            )}
                            {index > 0 && !block.connectionInfo && (<div className="flex justify-center py-1"><svg className="text-stone-300 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></div>)}
                            <button onClick={() => scrollToBlock(block.id)} className="w-full text-left bg-white hover:bg-rose-50 p-5 rounded-xl border border-stone-200 hover:border-rose-300 hover:shadow-md transition-all duration-200 group-hover:scale-[1.01] relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-rose-400 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{block.id}</span>
                                  <span className="text-[10px] text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem phân tích ↗</span>
                                </div>
                                <p className="font-serif text-lg text-stone-700 leading-relaxed">{block.translation.text}</p>
                            </button>
                          </div>
                        ))}
                      </div>
                  </div>
                  <div className="space-y-6">
                      <div className="sticky top-24">
                        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                            <h4 className="text-xs font-bold text-stone-500 uppercase mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Phân tích sắc thái tổng quan</h4>
                            <p className="text-sm text-stone-600 leading-relaxed italic">{state.data.summary.nuance}</p>
                        </div>
                        <div className="mt-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                             <h4 className="text-xs font-bold text-stone-500 uppercase mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Cấu trúc tổng thể</h4>
                            <div className="text-sm text-stone-600 space-y-2">
                                {state.data.summary.flow.split('->').map((step, i) => (
                                    <div key={i} className="flex items-center gap-2"><span className="text-stone-300 font-mono text-xs">{(i+1).toString().padStart(2, '0')}</span><span className="font-medium">{step.trim()}</span></div>
                                ))}
                            </div>
                        </div>
                      </div>
                  </div>
               </div>
            </div>
            )}
          </div>
        )}
      </main>
      );
      })()}

      <footer data-reveal className="io-fade mt-20 py-10 text-center text-stone-400 text-sm font-serif italic border-t border-stone-200/50 relative z-10">Created by FIRaci</footer>
      <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
        <button onClick={scrollToTop} className="bg-white/80 backdrop-blur border border-stone-200 p-3 rounded-full shadow-lg hover:shadow-xl hover:bg-white text-stone-600 transition-all active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg></button>
        <button onClick={scrollToBottom} className="bg-white/80 backdrop-blur border border-stone-200 p-3 rounded-full shadow-lg hover:shadow-xl hover:bg-white text-stone-600 transition-all active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></button>
      </div>
    </div>
  );
};

export default App;
