
import React, { useState, useEffect } from 'react';
import { SavedToken, ExtendedAnalysis, PartType, SavedGrammar, RelatedWord, ComparisonResult, SavedComparison, SemanticScale as SemanticScaleType, RecommendationItem } from '../types';
import PitchGraph from './PitchGraph';
import GrammarFormula from './GrammarFormula';
import { generateComparison, addItemsToComparison, getRecommendationsByTag } from '../services/analysisEngine';
import { speakJapaneseText, stopJapaneseTts } from '../services/googleTtsService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedToken[];
  onRemoveItem: (id: string) => void;
  onSelectItem: (item: SavedToken) => void; // Trigger enrichment
  
  savedGrammars: SavedGrammar[];
  onRemoveGrammar: (id: string) => void;
  onSelectGrammar: (grammar: SavedGrammar) => void; // Trigger enrichment

  savedComparisons: SavedComparison[];
  onSaveComparison: (result: ComparisonResult, query: string) => void;
  onRemoveComparison: (id: string) => void;
  
  onAddRelatedItem: (item: RelatedWord, typeHint: PartType) => void;
  onAddRelatedGrammar: (structure: string, meaning?: string) => void;
  
  onManualAddVocab: (text: string) => void;
}

type Tab = 'vocab' | 'grammar' | 'compare';

// --- HELPER COMPONENT: SEMANTIC SCALE ---
const SemanticScale: React.FC<{ scale: SemanticScaleType }> = ({ scale }) => {
    return (
        <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-100 mb-2">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{scale.label}</span>
            </div>
            
            <div className="relative h-10 flex items-center">
                {/* Background Line */}
                <div className="absolute w-full h-1.5 bg-gradient-to-r from-stone-200 via-stone-300 to-stone-200 rounded-full"></div>
                
                {/* Labels */}
                <span className="absolute -left-2 top-6 text-[9px] text-stone-400 font-medium">{scale.leftLabel}</span>
                <span className="absolute -right-2 top-6 text-[9px] text-stone-400 font-medium">{scale.rightLabel}</span>

                {/* Points */}
                {scale.values.map((v, i) => (
                    <div 
                        key={i}
                        className="absolute flex flex-col items-center group transition-all duration-500"
                        style={{ left: `${v.value}%`, transform: 'translateX(-50%)' }}
                    >
                        {/* Dot */}
                        <div className="w-4 h-4 bg-white border-2 border-indigo-400 rounded-full shadow-sm z-10 group-hover:scale-125 transition-transform"></div>
                        
                        {/* Tooltip Label (Always visible for clarity or hover) */}
                        <div className="absolute bottom-5 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap opacity-90">
                            {v.term}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- HELPER: SPEAK BUTTON ---
const SpeakBtn: React.FC<{ text: string; size?: 'sm' | 'md' | 'lg'; light?: boolean }> = ({ text, size = 'sm', light }) => {
    const [playing, setPlaying] = React.useState(false);
    const handleSpeak = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (playing) { stopJapaneseTts(); setPlaying(false); return; }
        setPlaying(true);
        try { await speakJapaneseText(text); } catch { /* */ }
        setPlaying(false);
    };
    if (!text) return null;
    const s = size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-6 h-6' : 'w-5 h-5';
    const ic = size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
    return (
        <button onClick={handleSpeak} className={`${s} rounded-full inline-flex items-center justify-center transition-all shrink-0 ${
            playing 
                ? (light ? 'bg-white/20 text-white animate-pulse' : 'bg-rose-100 text-rose-500 animate-pulse')
                : (light ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-stone-300 hover:text-stone-600 hover:bg-stone-100')
        }`} title={`Phát âm: ${text}`}>
            {playing ? (
                <svg className={ic} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
                <svg className={ic} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5.586v12.828a1 1 0 01-1.707.707L5.586 15z" /></svg>
            )}
        </button>
    );
};

// --- HELPER: GRAMMAR THEME GENERATOR ---
const getGrammarTheme = (grammar: SavedGrammar) => {
    const text = (
        (grammar.tags?.join(' ') || '') + ' ' + 
        grammar.meaning + ' ' + 
        (grammar.extendedAnalysis?.generalMeaning || '')
    ).toLowerCase();

    // 1. Purpose / Benefit (Mục đích) -> Teal
    if (text.includes('purpose') || text.includes('mục đích') || text.includes('để') || text.includes('lợi ích')) {
        return { 
            bg: 'bg-teal-50', border: 'border-teal-100', 
            badgeBg: 'bg-teal-100', badgeText: 'text-teal-700',
            icon: '' 
        };
    }
    // 2. Reason / Cause (Nguyên nhân) -> Sky Blue
    if (text.includes('reason') || text.includes('nguyên nhân') || text.includes('lý do') || text.includes('vì') || text.includes('do')) {
        return { 
            bg: 'bg-sky-50', border: 'border-sky-100', 
            badgeBg: 'bg-sky-100', badgeText: 'text-sky-700',
            icon: '' 
        };
    }
    // 3. Contrast / But (Tương phản) -> Amber
    if (text.includes('contrast') || text.includes('tương phản') || text.includes('tuy nhiên') || text.includes('nhưng') || text.includes('mặc dù')) {
        return { 
            bg: 'bg-amber-50', border: 'border-amber-100', 
            badgeBg: 'bg-amber-100', badgeText: 'text-amber-700',
            icon: '⚡' // Or '⇄'
        };
    }
    // 4. Condition (Điều kiện) -> Emerald
    if (text.includes('condition') || text.includes('điều kiện') || text.includes('nếu') || text.includes('giả định')) {
        return { 
            bg: 'bg-emerald-50', border: 'border-emerald-100', 
            badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700',
            icon: '🌱' 
        };
    }
    // 5. Emotion / Exclamation (Cảm xúc) -> Pink
    if (text.includes('emotion') || text.includes('cảm xúc') || text.includes('cảm thán') || text.includes('ngạc nhiên')) {
        return { 
            bg: 'bg-pink-50', border: 'border-pink-100', 
            badgeBg: 'bg-pink-100', badgeText: 'text-pink-700',
            icon: '♥' 
        };
    }
    // 6. Negative / Prohibition (Phủ định/Cấm) -> Red/Rose
    if (text.includes('negative') || text.includes('phủ định') || text.includes('cấm') || text.includes('không')) {
        return { 
            bg: 'bg-rose-50', border: 'border-rose-100', 
            badgeBg: 'bg-rose-100', badgeText: 'text-rose-700',
            icon: '✕' 
        };
    }
    // 7. Formal / Written (Trang trọng) -> Slate
    if (text.includes('formal') || text.includes('trang trọng') || text.includes('văn viết') || text.includes('hard')) {
        return { 
            bg: 'bg-slate-50', border: 'border-slate-200', 
            badgeBg: 'bg-slate-200', badgeText: 'text-slate-700',
            icon: '✒️' 
        };
    }
    // 8. Time / Aspect (Thời gian) -> Blue
    if (text.includes('time') || text.includes('thời gian') || text.includes('khi') || text.includes('sau khi') || text.includes('trước khi')) {
        return { 
            bg: 'bg-blue-50', border: 'border-blue-100', 
            badgeBg: 'bg-blue-100', badgeText: 'text-blue-700',
            icon: '⏰' 
        };
    }

    // Default -> Indigo
    return { 
        bg: 'bg-indigo-50', border: 'border-indigo-100', 
        badgeBg: 'bg-indigo-100', badgeText: 'text-indigo-600',
        icon: '文' 
    };
};

const TAG_TRANSLATIONS: Record<string, string> = {
    'Formal': 'Trang trọng',
    'Casual': 'Thân mật',
    'Spoken': 'Văn nói',
    'Written': 'Văn viết',
    'Emphatic': 'Nhấn mạnh',
    'Negative': 'Phủ định',
    'Polite': 'Lịch sự',
    'Honorific': 'Kính ngữ',
    'Humble': 'Khiêm nhường',
    'Volitional': 'Ý chí',
    'Potential': 'Khả năng',
    'Passive': 'Bị động',
    'Causative': 'Sai khiến',
    'Imperative': 'Mệnh lệnh',
    'Prohibition': 'Cấm chỉ',
    'Reason': 'Nguyên nhân',
    'Purpose': 'Mục đích',
    'Condition': 'Điều kiện',
    'Contrast': 'Tương phản',
    'Conjecture': 'Phỏng đoán',
    'Hearsay': 'Nghe nói',
    'Quote': 'Trích dẫn',
    'Time': 'Thời gian',
    'Place': 'Địa điểm',
    'Person': 'Người',
    'Object': 'Vật thể',
    'Direction': 'Phương hướng',
    'Limit': 'Giới hạn',
    'Degree': 'Mức độ',
    'Topic': 'Chủ đề',
    'Subject': 'Chủ ngữ',
    'Change': 'Biến đổi',
    'State': 'Trạng thái',
    'Emotion': 'Cảm xúc',
    'Suffix': 'Hậu tố',
    'Prefix': 'Tiền tố',
    'Compound': 'Từ ghép',
    'Suru-verb': 'Động từ Suru',
    'Transitive': 'Tha động từ',
    'Intransitive': 'Tự động từ',
    'Adverb': 'Trạng từ',
    'Conjunction': 'Liên từ',
    'Auxiliary': 'Trợ động từ',
    'Common Sense': 'Thường thức',
    'Multiple Meanings': 'Đa nghĩa',
    'Psychology': 'Tâm lý',
    'Business': 'Kinh doanh',
    'Culture': 'Văn hóa',
    'Politics': 'Chính trị',
    'Law': 'Pháp luật',
    'Science': 'Khoa học',
    'Nature': 'Tự nhiên',
    'Abstract': 'Trừu tượng',
    'Logical Deduction': 'Suy luận Logic',
    'Regret': 'Hối tiếc',
    'Advice': 'Lời khuyên',
    'Reminiscing': 'Hồi tưởng',
    'Exclamation': 'Cảm thán',
    'Weather': 'Thời tiết',
    'Sentiment': 'Cảm xúc',
    'Philosophy': 'Triết học',
    'Tea Ceremony': 'Trà đạo',
    'Idiom': 'Thành ngữ',
    'Logic': 'Logic',
    'Daily Life': 'Đời sống',
    'Action': 'Hành động',
    'Common': 'Thông dụng',
    'Unknown': 'Chưa xác định'
};

const translateTag = (tag: string) => {
    // Xử lý các tag động như "JLPT N2" hoặc có prefix
    const cleanTag = tag.replace('Category: ', '').replace('Entity: ', '');
    if (cleanTag.startsWith('JLPT')) return cleanTag; 
    return TAG_TRANSLATIONS[cleanTag] || cleanTag;
};

const getTagStyle = (tag: string) => {
    const t = tag.toUpperCase();
    if (t.includes('N1')) return 'bg-rose-50 text-rose-600 border-rose-200';
    if (t.includes('N2')) return 'bg-orange-50 text-orange-600 border-orange-200';
    if (t.includes('N3')) return 'bg-amber-50 text-amber-600 border-amber-200';
    if (t.includes('N4')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (t.includes('N5')) return 'bg-teal-50 text-teal-600 border-teal-200';
    return 'bg-stone-100 text-stone-500 border-stone-200';
};

const UserHub: React.FC<Props> = ({ 
    isOpen, onClose, 
    savedItems, onRemoveItem, onSelectItem,
    savedGrammars, onRemoveGrammar, onSelectGrammar,
    savedComparisons, onSaveComparison, onRemoveComparison,
    onAddRelatedItem, onAddRelatedGrammar,
    onManualAddVocab
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('vocab');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // --- RECOMMENDATION STATE ---
  const [activeRecommendationTag, setActiveRecommendationTag] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // --- VOCAB TAB STATE ---
  const [vocabQuery, setVocabQuery] = useState('');
  const [isAddingVocab, setIsAddingVocab] = useState(false);

  // --- GRAMMAR TAB STATE ---
  const [grammarQuery, setGrammarQuery] = useState('');
  const [isAddingGrammar, setIsAddingGrammar] = useState(false);

  // --- COMPARISON STATE ---
  const [query, setQuery] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  
  // New State for "Add Item"
  const [newItemQuery, setNewItemQuery] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const selectedItem = activeTab === 'vocab' 
      ? savedItems.find(i => i.id === selectedItemId)
      : savedGrammars.find(g => g.id === selectedItemId);

  // Filter Logic
  const filteredVocab = savedItems.filter(item => 
      !vocabQuery || 
      item.text.toLowerCase().includes(vocabQuery.toLowerCase()) || 
      (item.reading && item.reading.toLowerCase().includes(vocabQuery.toLowerCase())) ||
      (item.romaji && item.romaji.toLowerCase().includes(vocabQuery.toLowerCase()))
  );

  const filteredGrammar = savedGrammars.filter(item =>
      !grammarQuery ||
      item.structure.toLowerCase().includes(grammarQuery.toLowerCase()) ||
      (item.reading && item.reading.toLowerCase().includes(grammarQuery.toLowerCase()))
  );

  // Auto-enrich when item is selected or when it updates
  useEffect(() => {
      if (selectedItem && activeTab === 'vocab') {
          if (!(selectedItem as SavedToken).extendedAnalysis) {
             onSelectItem(selectedItem as SavedToken);
          }
      } else if (selectedItem && activeTab === 'grammar') {
          if (!(selectedItem as SavedGrammar).extendedAnalysis) {
             onSelectGrammar(selectedItem as SavedGrammar);
          }
      }
  }, [selectedItem, activeTab, onSelectItem, onSelectGrammar]); 

  const handleSelect = (item: SavedToken | SavedGrammar) => {
      setSelectedItemId(item.id);
      setActiveRecommendationTag(null);
      setRecommendations([]);
  };

  const handleBackToList = () => {
      setSelectedItemId(null);
      setActiveRecommendationTag(null);
      setRecommendations([]);
  };

  const handleBackToCompareList = () => {
      setComparisonResult(null);
      setQuery('');
      setNewItemQuery('');
  };

  const handleTagClick = async (tag: string) => {
      setActiveRecommendationTag(tag);
      setIsLoadingRecommendations(true);
      
      const currentSavedList = activeTab === 'vocab' 
          ? savedItems.map(i => i.text) 
          : savedGrammars.map(g => g.structure);

      try {
          const recs = await getRecommendationsByTag(tag, currentSavedList);
          setRecommendations(recs);
      } catch (error) {
          console.error("Failed to fetch recommendations", error);
      } finally {
          setIsLoadingRecommendations(false);
      }
  };

  const handleSaveRecommendation = (rec: RecommendationItem) => {
      if (rec.type === 'VOCAB') {
          onAddRelatedItem({ 
              text: rec.text, 
              reading: rec.reading, 
              meaning: rec.meaning 
          }, rec.partType || PartType.NOUN);
      } else {
          onAddRelatedGrammar(rec.text, rec.meaning);
      }
      // Remove from the local recommendation list to show it's "handled"
      setRecommendations(prev => prev.filter(r => r.text !== rec.text));
  };

  // --- HANDLERS FOR VOCAB ADDITION ---
  const handleVocabAddSubmit = async () => {
      if (!vocabQuery.trim()) return;
      
      const existing = savedItems.find(i => i.text === vocabQuery || i.reading === vocabQuery);
      if (existing) {
          handleSelect(existing);
          setVocabQuery('');
          return;
      }

      setIsAddingVocab(true);
      try {
          await onManualAddVocab(vocabQuery);
          setVocabQuery('');
      } catch (error) {
          console.error("Manual add failed", error);
      } finally {
          setIsAddingVocab(false);
      }
  };

  const handleVocabKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleVocabAddSubmit();
  };

  // --- HANDLERS FOR GRAMMAR ADDITION ---
  const handleGrammarAddSubmit = () => {
      if (!grammarQuery.trim()) return;
      
      const existing = savedGrammars.find(g => g.structure === grammarQuery || g.reading === grammarQuery);
      if (existing) {
          handleSelect(existing);
          setGrammarQuery('');
          return;
      }

      setIsAddingGrammar(true);
      onAddRelatedGrammar(grammarQuery);
      setGrammarQuery('');
      setTimeout(() => setIsAddingGrammar(false), 500);
  };

  const handleGrammarKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleGrammarAddSubmit();
  };

  // --- HANDLERS FOR COMPARISON ---
  const handleCompare = async () => {
      if (!query.trim()) return;
      setIsComparing(true);
      try {
          const result = await generateComparison(query);
          setComparisonResult(result);
      } catch (error) {
          console.error("Comparison error", error);
      } finally {
          setIsComparing(false);
      }
  };

  const handleAddItem = async () => {
      if (!newItemQuery.trim() || !comparisonResult) return;
      setIsAddingItem(true);
      try {
          const newItems = await addItemsToComparison(
              comparisonResult.items, 
              newItemQuery, 
              comparisonResult.type
          );
          
          setComparisonResult(prev => {
              if (!prev) return null;
              return {
                  ...prev,
                  items: [...prev.items, ...newItems]
              };
          });
          setNewItemQuery('');
      } catch (error) {
          console.error("Add item error", error);
      } finally {
          setIsAddingItem(false);
      }
  };

  const handleSelectSavedComparison = (comp: SavedComparison) => {
      setComparisonResult(comp);
      setQuery(comp.query || comp.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCompare();
  };
  
  const handleAddItemKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAddItem();
  };

  const isCurrentComparisonSaved = () => {
      if (!comparisonResult) return false;
      return savedComparisons.some(c => c.title === comparisonResult.title);
  }

  const getCommonRule = (result: ComparisonResult | null) => {
      if (!result || !result.items || result.items.length === 0) return null;
      const rules = result.items.map(i => i.structureRule).filter(r => r);
      if (rules.length !== result.items.length) return null; 
      const firstRule = rules[0];
      const allSame = rules.every(r => r === firstRule);
      return allSame ? firstRule : null;
  }

  // --- SUB-COMPONENTS ---
  const RecommendationView = () => {
      if (!activeRecommendationTag) return null;
      return (
          <div className="bg-indigo-900 text-white rounded-2xl p-8 shadow-2xl mt-12 animate-fade-in-up relative overflow-hidden">
               {/* Background visual decoration */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl"></div>

               <div className="relative z-10">
                   <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-indigo-300 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-300">Khám phá thêm (AI Recommendations)</h4>
                                <p className="text-lg font-serif">Nội dung liên quan đến: <span className="text-rose-400 font-bold">{translateTag(activeRecommendationTag)}</span></p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setActiveRecommendationTag(null)}
                            className="text-white/40 hover:text-white"
                            aria-label="Đóng gợi ý"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                   </div>

                   {isLoadingRecommendations ? (
                       <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
                            <p className="text-indigo-200 italic">ArukaS đang tìm kiếm các nội dung hay nhất cho bạn...</p>
                       </div>
                   ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {recommendations.map((rec, i) => (
                               <div key={i} className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-4 transition-all group">
                                   <div className="flex justify-between items-start mb-2">
                                       <div>
                                            <div className="font-serif-jp text-2xl font-bold text-white mb-0.5 flex items-center gap-2">{rec.text} <SpeakBtn text={rec.text} size="sm" light /></div>
                                            <div className="text-xs text-indigo-300 font-serif-jp">{rec.reading}</div>
                                       </div>
                                       <button 
                                            onClick={() => handleSaveRecommendation(rec)}
                                            className="bg-indigo-500 hover:bg-rose-500 text-white p-2 rounded-full shadow-lg transition-colors"
                                            title="Lưu vào kho của bạn"
                                       >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                       </button>
                                   </div>
                                   <p className="text-sm text-indigo-100 line-clamp-2 italic">"{rec.meaning}"</p>
                                   <div className="mt-3 flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5">{rec.type}</span>
                                        {rec.hanViet && <span className="text-[10px] font-bold text-rose-300 uppercase">{rec.hanViet}</span>}
                                   </div>
                               </div>
                           ))}
                           <button 
                                onClick={() => handleTagClick(activeRecommendationTag!)}
                                className="col-span-1 md:col-span-2 py-4 border-2 border-dashed border-white/10 rounded-xl text-indigo-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest"
                            >
                               Xem thêm gợi ý khác...
                           </button>
                       </div>
                   )}
               </div>
          </div>
      );
  };

  const ConjugationView = ({ data }: { data: ExtendedAnalysis['conjugations'] }) => {
      if (!data) return null;
      return (
          <div className="bg-stone-50 rounded-xl p-6 border border-stone-200 mt-6 animate-fade-in-up">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Bảng chia từ (Conjugation)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 text-sm">
                  <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Từ điển</span>
                      <span className="font-serif-jp text-stone-800 text-lg flex items-center gap-1.5">{data.dictionary} <SpeakBtn text={data.dictionary} /></span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Lịch sự (Masu)</span>
                      <span className="font-serif-jp text-stone-800 text-lg flex items-center gap-1.5">{data.polite} <SpeakBtn text={data.polite} /></span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Phủ định (Nai)</span>
                      <span className="font-serif-jp text-stone-800 text-lg flex items-center gap-1.5">{data.negative} <SpeakBtn text={data.negative} /></span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Quá khứ (Ta)</span>
                      <span className="font-serif-jp text-stone-800 text-lg flex items-center gap-1.5">{data.past} <SpeakBtn text={data.past} /></span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Tiếp diễn (Te)</span>
                      <span className="font-serif-jp text-stone-800 text-lg flex items-center gap-1.5">{data.teForm} <SpeakBtn text={data.teForm} /></span>
                  </div>
                  {data.potential && (
                      <div className="flex flex-col">
                          <span className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Khả năng</span>
                          <span className="font-serif-jp text-stone-800 text-lg flex items-center gap-1.5">{data.potential} <SpeakBtn text={data.potential} /></span>
                      </div>
                  )}
                  {data.passive && (
                      <div className="flex flex-col">
                          <span className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Bị động</span>
                          <span className="font-serif-jp text-stone-800 text-lg flex items-center gap-1.5">{data.passive} <SpeakBtn text={data.passive} /></span>
                      </div>
                  )}
                  {data.causative && (
                      <div className="flex flex-col">
                          <span className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Sai khiến</span>
                          <span className="font-serif-jp text-stone-800 text-lg flex items-center gap-1.5">{data.causative} <SpeakBtn text={data.causative} /></span>
                      </div>
                  )}
                   {data.volitional && (
                      <div className="flex flex-col">
                          <span className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Ý chí</span>
                          <span className="font-serif-jp text-stone-800 text-lg flex items-center gap-1.5">{data.volitional} <SpeakBtn text={data.volitional} /></span>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const RelatedWordGroup = ({ title, items, colorClass, iconColor }: { title: string, items?: RelatedWord[], colorClass: string, iconColor: string }) => {
      if (!items || items.length === 0) return null;
      return (
          <div className="mt-6 animate-fade-in-up">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${iconColor}`}></span>
                  {title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((item, idx) => {
                      const isSaved = savedItems.some(s => s.text === item.text);
                      return (
                      <div key={idx} className={`relative p-3 rounded-lg border ${colorClass} flex flex-col justify-center pr-10 group transition-all`}>
                          <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isSaved) {
                                      const typeHint = (selectedItem as SavedToken).type || PartType.NOUN;
                                      onAddRelatedItem(item, typeHint);
                                  }
                              }}
                              disabled={isSaved}
                              className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                  isSaved 
                                  ? 'bg-emerald-100 text-emerald-600 cursor-default opacity-100' 
                                  : 'bg-white hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-200 hover:border-stone-800 shadow-sm opacity-0 group-hover:opacity-100'
                              }`}
                              title={isSaved ? "Đã lưu" : "Thêm vào kho từ vựng"}
                          >
                              {isSaved ? (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                              )}
                          </button>

                          <div className="flex justify-between items-baseline mb-1">
                              <span className="font-serif-jp font-bold text-lg text-stone-800 flex items-center gap-1.5">{item.text} <SpeakBtn text={item.text} /></span>
                              {item.type && (
                                  <span className="text-[10px] uppercase font-bold text-stone-400 opacity-80">{item.type}</span>
                              )}
                          </div>
                          <div className="flex justify-between items-end">
                              <span className="text-xs text-stone-500 font-serif-jp">{item.reading}</span>
                              <span className="text-xs text-stone-600 italic ml-2 text-right line-clamp-1" title={item.meaning}>{item.meaning}</span>
                          </div>
                      </div>
                  )})}
              </div>
          </div>
      );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={onClose} />
      )}

      <div className={`fixed top-0 right-0 h-full w-full md:w-[900px] bg-white/95 backdrop-blur-xl shadow-2xl z-[70] transform transition-transform duration-300 ease-out border-l border-stone-200 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* --- HEADER & TABS --- */}
        <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ${selectedItemId ? '-translate-x-full opacity-50' : 'translate-x-0'}`}>
            <div className="p-8 border-b border-stone-200 bg-stone-50/50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold font-serif-jp text-stone-800 flex items-center gap-2">
                            Kiến thức & Lưu trữ
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors" aria-label="Đóng bảng lưu trữ">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="flex border-b border-stone-200">
                    <button className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'vocab' ? 'border-rose-400 text-rose-500' : 'border-transparent text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'}`} onClick={() => setActiveTab('vocab')}>
                        Từ vựng ({savedItems.length})
                    </button>
                    <button className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'grammar' ? 'border-indigo-400 text-indigo-500' : 'border-transparent text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'}`} onClick={() => setActiveTab('grammar')}>
                        Ngữ pháp ({savedGrammars.length})
                    </button>
                    <button className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'compare' ? 'border-amber-400 text-amber-600' : 'border-transparent text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'}`} onClick={() => setActiveTab('compare')}>
                        So sánh
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[#FAFAF5]">
                {/* --- VOCAB LIST --- */}
                {activeTab === 'vocab' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm sticky -top-8 z-30 pt-6 mt-0 before:content-[''] before:absolute before:-top-0 before:left-[-2rem] before:right-[-2rem] before:h-[calc(100%+2rem)] before:bg-[#FAFAF5] before:-z-10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                    Tìm kiếm & Thêm từ
                                </h3>
                                {vocabQuery && filteredVocab.length > 0 && (
                                    <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-bold">
                                        Tìm thấy {filteredVocab.length}
                                    </span>
                                )}
                            </div>
                            
                            <div className="relative">
                                <input 
                                    value={vocabQuery}
                                    onChange={e => setVocabQuery(e.target.value)}
                                    onKeyDown={handleVocabKeyDown}
                                    placeholder="Nhập từ, Furigana hoặc Romaji (ví dụ: Taberu, 食べる)..."
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 font-serif-jp focus:outline-none focus:ring-2 focus:ring-rose-200 shadow-inner pr-20 text-lg"
                                />
                                {vocabQuery && (
                                    <button 
                                        onClick={() => setVocabQuery('')} 
                                        className="absolute right-14 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 p-1"
                                        aria-label="Xóa từ khóa tìm kiếm"
                                    >
                                        ✕
                                    </button>
                                )}
                                <button 
                                    onClick={handleVocabAddSubmit}
                                    disabled={isAddingVocab || !vocabQuery.trim()}
                                    className={`absolute right-2 top-2 bottom-2 px-4 rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center shadow-sm
                                        ${filteredVocab.length === 0 && vocabQuery ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-stone-800 text-white hover:bg-rose-500'}`}
                                >
                                    {isAddingVocab ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        filteredVocab.length === 0 && vocabQuery ? '+' : '→'
                                    )}
                                </button>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-2 italic ml-1">
                                Hỗ trợ: Hiragana, Katakana, Kanji, Romaji. Nhấn Enter để thêm nhanh.
                            </p>
                        </div>

                        {filteredVocab.length === 0 && vocabQuery ? (
                            <div className="text-center py-12 text-stone-400">
                                <p className="mb-2">Không tìm thấy từ này trong kho.</p>
                                <button onClick={handleVocabAddSubmit} className="text-rose-500 font-bold hover:underline">
                                    Thêm "{vocabQuery}" vào danh sách?
                                </button>
                            </div>
                        ) : filteredVocab.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-stone-400">
                                <span className="text-5xl mb-4 opacity-50">📭</span>
                                <p className="font-serif text-lg">Chưa có từ vựng nào.</p>
                                <p className="text-sm">Nhập từ ở trên hoặc lưu từ khi phân tích câu.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredVocab.slice().reverse().map((item) => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => handleSelect(item)}
                                        className="group bg-white rounded-xl p-5 border border-stone-100 shadow-sm hover:shadow-md hover:border-rose-200 transition-all relative cursor-pointer active:scale-[0.98] flex flex-col justify-between"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-xs border ${item.type === PartType.VERB ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-stone-50 text-stone-500 border-stone-100'}`}>
                                                {item.type === PartType.VERB ? 'V' : item.type === PartType.ADJECTIVE ? 'A' : 'N'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div className="font-serif-jp font-bold text-xl text-stone-800 leading-tight truncate pr-6 flex items-center gap-2">
                                                        {item.text}
                                                        <SpeakBtn text={item.reading || item.text} />
                                                        {item.hanViet && (
                                                            <span className="text-[10px] bg-rose-50 text-rose-500 border border-rose-100 px-1.5 py-0.5 rounded font-sans uppercase font-bold tracking-wider shrink-0">
                                                                {item.hanViet}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-stone-400 font-serif-jp mb-2">{item.reading}</div>
                                                <div className="text-sm text-stone-600 line-clamp-2">
                                                    {!item.extendedAnalysis ? (
                                                        <span className="flex items-center gap-2 text-stone-400 italic">
                                                            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse"></span>
                                                            Đang phân tích...
                                                        </span>
                                                    ) : item.meaning}
                                                </div>
                                                {item.deepDive?.tags && item.deepDive.tags.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {item.deepDive.tags.slice(0,3).map((t, i) => (
                                                            <button 
                                                                key={i} 
                                                                onClick={(e) => { e.stopPropagation(); handleTagClick(t); }}
                                                                className={`text-[8px] border px-1.5 py-0.5 rounded font-bold hover:brightness-95 transition-all ${getTagStyle(t)}`}
                                                                title={`Khám phá thêm về ${translateTag(t)}`}
                                                            >
                                                                {translateTag(t)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Nút xóa được cải thiện: Chỉ hiện khi hover và giảm z-index để không xuyên tầng Header */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} 
                                            className="absolute top-4 right-4 text-stone-200 hover:text-rose-500 p-1 transition-all opacity-0 group-hover:opacity-100"
                                            aria-label="Xóa từ vựng"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Recommendation Panel */}
                        <RecommendationView />
                    </div>
                )}

                {/* --- GRAMMAR LIST --- */}
                {activeTab === 'grammar' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm sticky -top-8 z-30 pt-6 mt-0 before:content-[''] before:absolute before:-top-0 before:left-[-2rem] before:right-[-2rem] before:h-[calc(100%+2rem)] before:bg-[#FAFAF5] before:-z-10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                    Tìm kiếm & Thêm ngữ pháp
                                </h3>
                                {grammarQuery && filteredGrammar.length > 0 && (
                                    <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-bold">
                                        Tìm thấy {filteredGrammar.length}
                                    </span>
                                )}
                            </div>
                            
                            <div className="relative">
                                <input 
                                    value={grammarQuery}
                                    onChange={e => setGrammarQuery(e.target.value)}
                                    onKeyDown={handleGrammarKeyDown}
                                    placeholder="Nhập cấu trúc, Romaji (ví dụ: ~Te iru, 〜に対して)..."
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 font-serif-jp focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-inner pr-20 text-lg"
                                />
                                {grammarQuery && (
                                    <button 
                                        onClick={() => setGrammarQuery('')} 
                                        className="absolute right-14 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 p-1"
                                        aria-label="Xóa từ khóa tìm kiếm"
                                    >
                                        ✕
                                    </button>
                                )}
                                <button 
                                    onClick={handleGrammarAddSubmit}
                                    disabled={isAddingGrammar || !grammarQuery.trim()}
                                    className={`absolute right-2 top-2 bottom-2 px-4 rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center shadow-sm
                                        ${filteredGrammar.length === 0 && grammarQuery ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-stone-800 text-white hover:bg-rose-500'}`}
                                >
                                    {isAddingGrammar ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        filteredGrammar.length === 0 && grammarQuery ? '+' : '→'
                                    )}
                                </button>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-2 italic ml-1">
                                Mẹo: Nhập cấu trúc (ví dụ: "nai to", "chawu") hoặc tên ngữ pháp. AI sẽ tự động phân tích chi tiết.
                            </p>
                        </div>

                        {filteredGrammar.length === 0 && grammarQuery ? (
                            <div className="text-center py-12 text-stone-400">
                                <p className="mb-2">Không tìm thấy cấu trúc này.</p>
                                <button onClick={handleGrammarAddSubmit} className="text-indigo-500 font-bold hover:underline">
                                    Thêm và phân tích "{grammarQuery}"?
                                </button>
                            </div>
                        ) : filteredGrammar.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-stone-400">
                                <span className="text-5xl mb-4 opacity-50">🧩</span>
                                <p className="font-serif text-lg">Chưa có ngữ pháp nào.</p>
                                <p className="text-sm">Nhập cấu trúc ở trên hoặc lưu từ khi phân tích câu.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredGrammar.slice().reverse().map((item) => {
                                    const theme = getGrammarTheme(item);
                                    return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => handleSelect(item)}
                                        className={`group bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-all relative cursor-pointer active:scale-[0.99] hover:${theme.border}`}
                                        style={{ borderColor: 'rgba(231, 229, 228, 1)' }} // Default stone-200, hover handled by class
                                    >
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onRemoveGrammar(item.id); }} 
                                            className="absolute top-6 right-6 text-stone-200 hover:text-rose-500 p-1 transition-all opacity-0 group-hover:opacity-100"
                                            aria-label="Xóa ngữ pháp"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                        
                                        <div className="flex items-center gap-4">
                                            {/* Dynamic Icon Badge */}
                                            <div className={`w-12 h-12 rounded-full ${theme.bg} border ${theme.border} flex items-center justify-center shrink-0`}>
                                                {item.jlpt ? (
                                                    <span className={`text-sm font-bold ${theme.badgeText}`}>{item.jlpt}</span>
                                                ) : (
                                                    <span className="text-xl">{theme.icon}</span>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <div className="font-serif-jp font-bold text-xl text-stone-800">{item.structure} <SpeakBtn text={item.reading || item.structure} /></div>
                                                    {item.hanViet && (
                                                        <span className="text-[9px] bg-white border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                                            {item.hanViet}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-stone-600 mb-1">
                                                    {!item.extendedAnalysis ? (
                                                        <span className="flex items-center gap-2 text-indigo-400 italic">
                                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                                                            Đang phân tích cấu trúc...
                                                        </span>
                                                    ) : item.meaning}
                                                </div>
                                                
                                                {/* Smart Tags */}
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {item.tags?.map((tag, i) => {
                                                        // Only show "Meaningful" tags, hide generic JLPT tag as it's in the icon
                                                        if (tag.includes('JLPT')) return null;
                                                        return (
                                                            <button 
                                                                key={i} 
                                                                onClick={(e) => { e.stopPropagation(); handleTagClick(tag); }}
                                                                className={`text-[9px] hover:brightness-95 transition-all ${theme.badgeBg} ${theme.badgeText} px-2 py-0.5 rounded border ${theme.border} font-medium`}
                                                                title={`Khám phá thêm về ${translateTag(tag)}`}
                                                            >
                                                                {translateTag(tag)}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="ml-auto pr-10 hidden sm:block">
                                                <span className="text-xs text-stone-400 font-mono bg-stone-50 px-2 py-1 rounded">Click để xem chi tiết</span>
                                            </div>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        )}
                        
                        {/* Recommendation Panel */}
                        <RecommendationView />
                    </div>
                )}

                {/* --- COMPARISON TAB --- */}
                {activeTab === 'compare' && (
                    <div className="space-y-6">
                        {/* Comparison Input Panel */}
                         {!comparisonResult && (
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm sticky -top-8 z-30 pt-6 mt-0 before:content-[''] before:absolute before:-top-0 before:left-[-2rem] before:right-[-2rem] before:h-[calc(100%+2rem)] before:bg-[#FAFAF5] before:-z-10">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                    Thiết lập so sánh thông minh
                                </h3>
                                
                                <div className="relative">
                                    <input 
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ví dụ: 'Phân biệt Wa và Ga', 'So sánh các trợ từ', 'Kaeru/Kawaru'..."
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 font-serif-jp focus:outline-none focus:ring-2 focus:ring-amber-200 shadow-inner pr-12 text-lg"
                                    />
                                    <button 
                                        onClick={handleCompare}
                                        disabled={isComparing || !query}
                                        className="absolute right-2 top-2 bottom-2 bg-stone-800 text-white px-4 rounded-lg font-bold text-sm hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:bg-stone-300"
                                    >
                                        {isComparing ? '...' : '→'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-stone-400 mt-2 italic ml-1">
                                    Mẹo: Hãy hỏi "So sánh các..." hoặc "All particles" để AI tự động liệt kê.
                                </p>
                            </div>
                        )}

                        {/* SAVED COMPARISON LIST */}
                        {!comparisonResult && savedComparisons.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 mt-8">Đã lưu ({savedComparisons.length})</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {savedComparisons.slice().reverse().map((comp) => (
                                        <div 
                                            key={comp.id}
                                            onClick={() => handleSelectSavedComparison(comp)}
                                            className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm hover:shadow-md hover:border-amber-200 cursor-pointer relative group active:scale-[0.98] transition-all"
                                        >
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onRemoveComparison(comp.id); }}
                                                className="absolute top-4 right-4 text-stone-200 hover:text-rose-500 p-1 transition-all opacity-0 group-hover:opacity-100"
                                                aria-label="Xóa mục so sánh"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                            
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                    comp.type === 'PARTICLE' ? 'bg-rose-100 text-rose-600' :
                                                    comp.type === 'HOMOPHONE' ? 'bg-blue-100 text-blue-600' :
                                                    comp.type === 'GRAMMAR' ? 'bg-indigo-100 text-indigo-600' :
                                                    'bg-amber-100 text-amber-600'
                                                }`}>
                                                    {comp.type}
                                                </span>
                                                <span className="text-[10px] text-stone-400">
                                                    {new Date(comp.savedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="font-serif-jp font-bold text-stone-800 text-lg mb-1">{comp.title}</h3>
                                            <p className="text-sm text-stone-500 line-clamp-2">{comp.keyDistinction}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comparison Result Display */}
                        {comparisonResult && (
                            <div className="animate-fade-in-up space-y-6">
                                {/* Back & Save Header */}
                                <div className="flex justify-between items-center mb-2">
                                    <button 
                                        onClick={handleBackToCompareList}
                                        className="text-sm font-bold text-stone-500 hover:text-stone-800 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors"
                                    >
                                        ← Quay lại tìm kiếm
                                    </button>
                                    
                                    <button 
                                        onClick={() => onSaveComparison(comparisonResult, query)}
                                        disabled={isCurrentComparisonSaved()}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wide transition-all ${
                                            isCurrentComparisonSaved() 
                                                ? 'bg-emerald-500 text-white shadow-md' 
                                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        }`}
                                    >
                                        {isCurrentComparisonSaved() ? (
                                            <>✓ Đã lưu</>
                                        ) : (
                                            <>+ Lưu kết quả</>
                                        )}
                                    </button>
                                </div>

                                {/* Header */}
                                <div className="text-center">
                                    <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest mb-2">
                                        {comparisonResult.type === 'PARTICLE' && 'So sánh Trợ từ'}
                                        {comparisonResult.type === 'HOMOPHONE' && 'Từ đồng âm khác nghĩa'}
                                        {comparisonResult.type === 'GRAMMAR' && 'Cấu trúc ngữ pháp'}
                                        {comparisonResult.type === 'VOCABULARY' && 'Từ vựng & Sắc thái'}
                                    </div>
                                    <h2 className="text-3xl font-serif-jp font-bold text-stone-800 mb-2">{comparisonResult.title}</h2>
                                    <p className="text-stone-500 text-sm max-w-lg mx-auto leading-relaxed">
                                        <span className="font-bold text-amber-500 uppercase text-xs mr-2">Điểm chung</span>
                                        {comparisonResult.commonMeaning}
                                    </p>
                                </div>

                                {/* Key Distinction Hero */}
                                <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl text-center">
                                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Quy tắc phân biệt cốt lõi</h4>
                                    <p className="text-lg font-medium text-stone-800 font-serif">{comparisonResult.keyDistinction}</p>
                                </div>
                                
                                {/* VISUAL SEMANTIC SCALES */}
                                {comparisonResult.scales && comparisonResult.scales.length > 0 && (
                                    <div className="space-y-2 mt-4">
                                        {comparisonResult.scales.map((scale, i) => (
                                            <SemanticScale key={i} scale={scale} />
                                        ))}
                                    </div>
                                )}
                                
                                {/* COMMON RULE DISPLAY */}
                                {getCommonRule(comparisonResult) && (
                                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex flex-col items-center">
                                         <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Cấu trúc chung (Công thức)</span>
                                         <GrammarFormula rule={getCommonRule(comparisonResult)!} />
                                    </div>
                                )}
                                
                                {/* ADD ITEM BAR */}
                                <div className="flex gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 shadow-inner items-center">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-stone-400 shadow-sm font-bold text-sm shrink-0">
                                        +
                                    </div>
                                    <input 
                                        value={newItemQuery}
                                        onChange={e => setNewItemQuery(e.target.value)}
                                        onKeyDown={handleAddItemKeyDown}
                                        placeholder="Thêm từ/ngữ pháp (ngăn cách bằng dấu phẩy, ví dụ: 'Ni, De, Wo')..."
                                        className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium text-stone-700 placeholder-stone-400"
                                        disabled={isAddingItem}
                                    />
                                    <button 
                                        onClick={handleAddItem}
                                        disabled={isAddingItem || !newItemQuery.trim()}
                                        className="bg-stone-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-rose-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isAddingItem && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                                        Thêm
                                    </button>
                                </div>

                                {/* Comparison Columns */}
                                <div className={`grid gap-4 ${
                                    (comparisonResult.items || []).length === 2 ? 'md:grid-cols-2' : 
                                    (comparisonResult.items || []).length === 3 ? 'md:grid-cols-3' : 
                                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                                }`}>
                                    {(comparisonResult.items || []).map((item, idx) => (
                                        <div key={idx} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col h-full animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                                            <div className="flex justify-between items-start mb-4 border-b border-stone-100 pb-3">
                                                <div className="min-w-0">
                                                    <div className="text-3xl font-serif-jp font-bold text-stone-800 truncate flex items-center gap-2" title={item.term}>
                                                        {item.term}
                                                        <SpeakBtn text={item.reading || item.term} size="md" />
                                                        {item.hanViet && (
                                                            <span className="text-[10px] bg-rose-50 text-rose-500 border border-rose-100 px-1.5 py-0.5 rounded font-sans uppercase font-bold tracking-wider">
                                                                {item.hanViet}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-stone-400 text-sm font-serif-jp">{item.reading}</div>
                                                </div>
                                                <span className="text-xs font-bold bg-stone-100 px-2 py-1 rounded text-stone-500 shrink-0 ml-2">
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                            </div>
                                            
                                            {comparisonResult.type === 'HOMOPHONE' && item.pitchAccent && (
                                                <div className="mb-4">
                                                    <PitchGraph 
                                                        binaryString={item.pitchAccent}
                                                        text={item.reading}
                                                        pattern={item.pitchPattern}
                                                    />
                                                </div>
                                            )}
                                            
                                            {!getCommonRule(comparisonResult) && item.structureRule && (
                                                <div className="mb-4">
                                                     <span className="block text-[9px] font-bold text-stone-300 uppercase mb-1">Cấu trúc</span>
                                                     <GrammarFormula rule={item.structureRule} />
                                                </div>
                                            )}

                                            <p className="font-medium text-stone-800 mb-2">{item.meaning}</p>
                                            <p className="text-sm text-stone-500 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100 flex-grow">
                                                {item.nuance}
                                            </p>
                                            
                                            {item.collocations && (
                                                <div className="mt-4 flex flex-col gap-2">
                                                    <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                                                        <span className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">Dùng với (✓)</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.collocations.allowed.map((c, i) => (
                                                                <span key={i} className="text-xs text-stone-700 bg-white px-1.5 py-0.5 rounded border border-emerald-100 shadow-sm">{c}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {item.collocations.prohibited && item.collocations.prohibited.length > 0 && (
                                                        <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
                                                            <span className="text-[9px] font-bold text-rose-500 uppercase block mb-1">Tránh dùng (✕)</span>
                                                            <div className="flex flex-wrap gap-1">
                                                                {item.collocations.prohibited.map((c, i) => (
                                                                    <span key={i} className="text-xs text-stone-500 line-through decoration-rose-300 bg-white px-1.5 py-0.5 rounded border border-rose-100">{c}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {(item.usageContext || (item.tags && item.tags.length > 0)) && (
                                                <div className="mt-3 pt-3 border-t border-stone-100">
                                                    {item.usageContext && (
                                                        <div className="text-xs text-stone-500 mb-2">
                                                            <span className="font-bold uppercase text-stone-400 mr-1 block text-[9px]">Ngữ cảnh:</span>
                                                            {item.usageContext}
                                                        </div>
                                                    )}
                                                    {item.tags && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.tags.map((tag, tIdx) => (
                                                                <button 
                                                                    key={tIdx} 
                                                                    onClick={() => handleTagClick(tag)}
                                                                    className={`text-[9px] border px-1.5 py-0.5 rounded font-bold hover:brightness-95 transition-all ${getTagStyle(tag)}`}
                                                                    title={`Khám phá thêm về ${translateTag(tag)}`}
                                                                >
                                                                    {translateTag(tag)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {item.example && (
                                                <div className="mt-4 pt-3 border-t border-dashed border-stone-200">
                                                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Ví dụ bổ sung</span>
                                                    <p className="font-serif-jp text-sm text-indigo-900 leading-snug mb-1 flex items-start gap-1">
                                                        {item.example} <SpeakBtn text={item.example} />
                                                    </p>
                                                    {item.exampleMeaning && (
                                                        <p className="text-xs text-stone-500 italic">
                                                            "{item.exampleMeaning}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Scenarios */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest text-center">Ví dụ minh họa theo ngữ cảnh (Gốc)</h4>
                                    {(comparisonResult.scenarios || []).map((scenario, idx) => (
                                        <div key={idx} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                                            <div className="text-xs font-bold text-amber-500 uppercase mb-3 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                {scenario.scenario}
                                            </div>
                                            
                                            <div className="space-y-4">
                                                {(scenario.examples || []).map((ex, eIdx) => (
                                                    <div key={eIdx} className="flex gap-4 items-start p-3 bg-stone-50 rounded-lg border border-stone-100">
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-bold text-stone-800 text-sm px-2 py-0.5 bg-white border border-stone-200 rounded shadow-sm">
                                                                    {ex.term}
                                                                </span>
                                                            </div>
                                                            
                                                            <p className="font-serif-jp text-lg text-indigo-900 mb-1 leading-relaxed flex items-start gap-1.5">
                                                                {ex.sentence} <SpeakBtn text={ex.sentence} />
                                                            </p>
                                                            
                                                            {ex.sentenceMeaning && (
                                                                <p className="text-sm text-stone-500 italic mb-2 border-l-2 border-stone-300 pl-2">
                                                                    "{ex.sentenceMeaning}"
                                                                </p>
                                                            )}

                                                            <div className="text-xs text-stone-600 bg-amber-50 p-2 rounded border border-amber-100 mt-2">
                                                                <span className="font-bold text-amber-600 uppercase text-[10px] mr-1">Giải thích:</span>
                                                                {ex.explanation}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* --- VIEW 2: INSPECTOR DETAIL VIEW --- */}
        <div className={`absolute inset-0 bg-[#FAFAF5] flex flex-col transition-transform duration-300 ${selectedItemId ? 'translate-x-0' : 'translate-x-full'}`}>
             {activeTab === 'vocab' && selectedItem && (
                 <>
                    <div className="px-8 py-4 border-b border-stone-200 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                        <button onClick={handleBackToList} className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors group flex items-center gap-2">
                            <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            <span className="text-sm font-bold">Quay lại</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                         <div className="text-center mb-10">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 items-end">
                                 {(selectedItem as SavedToken).reading && (selectedItem as SavedToken).pitchAccent && (
                                     <div className="flex flex-col items-center opacity-80">
                                         <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span>
                                            Trong câu (Context)
                                         </div>
                                         <div className="w-full max-w-sm">
                                             <PitchGraph binaryString={(selectedItem as SavedToken).pitchAccent} text={(selectedItem as SavedToken).reading} pattern={(selectedItem as SavedToken).pitchPattern || undefined} />
                                         </div>
                                     </div>
                                 )}
                                 {(selectedItem as SavedToken).extendedAnalysis?.dictionaryPitchAccent && (selectedItem as SavedToken).extendedAnalysis?.dictionaryReading && (
                                     <div className="flex flex-col items-center animate-fade-in-up">
                                          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                            Từ điển (Dictionary)
                                         </div>
                                         <div className="w-full max-w-sm">
                                             <PitchGraph binaryString={(selectedItem as SavedToken).extendedAnalysis!.dictionaryPitchAccent} text={(selectedItem as SavedToken).extendedAnalysis!.dictionaryReading} pattern={(selectedItem as SavedToken).extendedAnalysis!.dictionaryPitchPattern || undefined} />
                                         </div>
                                     </div>
                                 )}
                             </div>
                            <h1 className="text-6xl font-serif-jp font-bold text-stone-800 mb-1 tracking-tight">{(selectedItem as SavedToken).text}</h1>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="text-2xl text-stone-500 font-serif-jp font-light">{(selectedItem as SavedToken).reading}</div>
                                <SpeakBtn text={(selectedItem as SavedToken).reading || (selectedItem as SavedToken).text} size="md" />
                            </div>
                            
                            <div className="flex items-center justify-center mb-4">
                                {(selectedItem as SavedToken).hanViet && (
                                    <span className="text-sm font-bold text-rose-400 uppercase tracking-widest">
                                        {(selectedItem as SavedToken).hanViet}
                                    </span>
                                )}
                            </div>

                            {/* Tags in Detail View */}
                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                {(selectedItem as SavedToken).deepDive?.tags?.map((t, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleTagClick(t)}
                                        className={`text-xs px-3 py-1 rounded-full border font-bold shadow-sm hover:scale-105 active:scale-95 transition-all ${getTagStyle(t)}`}
                                        title={`Khám phá thêm về ${translateTag(t)}`}
                                    >
                                        {translateTag(t)}
                                    </button>
                                ))}
                            </div>
                            
                            {(selectedItem as SavedToken).extendedAnalysis && (
                                <div className="animate-fade-in-up space-y-8 max-w-4xl mx-auto pb-10 text-left">
                                    <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                            Định nghĩa chi tiết
                                        </h4>
                                        <p className="text-xl text-stone-800 font-medium leading-relaxed">{(selectedItem as SavedToken).extendedAnalysis!.definitionDetail || selectedItem.meaning}</p>
                                        {(selectedItem as SavedToken).extendedAnalysis!.transitivityPair && (
                                            <div className="mt-6 pt-6 border-t border-stone-100">
                                                <span className="text-xs text-stone-400 uppercase tracking-widest flex items-center gap-2 mb-3 font-bold">
                                                    Cặp {(selectedItem as SavedToken).extendedAnalysis!.transitivityPair!.type === 'TRANSITIVE' ? 'Tha động từ' : 'Tự động từ'} tương ứng
                                                </span>
                                                <div className="bg-stone-50 rounded-xl p-4 flex items-center justify-between border border-stone-200">
                                                    <div>
                                                        <div className="font-serif-jp text-2xl text-stone-800 font-bold mb-1 flex items-center gap-2">{(selectedItem as SavedToken).extendedAnalysis!.transitivityPair!.text} <SpeakBtn text={(selectedItem as SavedToken).extendedAnalysis!.transitivityPair!.text} size="md" /></div>
                                                        <div className="text-sm text-stone-500 font-serif-jp">{(selectedItem as SavedToken).extendedAnalysis!.transitivityPair!.reading}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* --- KANJI ANATOMY SECTION --- */}
                                    {(selectedItem as SavedToken).extendedAnalysis!.kanjiDetails && (selectedItem as SavedToken).extendedAnalysis!.kanjiDetails!.length > 0 && (
                                        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm mt-6">
                                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                                Chi tiết Hán tự (Kanji Breakdown)
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {(selectedItem as SavedToken).extendedAnalysis!.kanjiDetails!.map((kanji, idx) => (
                                                    <div key={idx} className="group relative bg-stone-50 p-4 rounded-xl border border-stone-100 hover:border-rose-200 transition-all cursor-help">
                                                        <div className="text-4xl font-serif-jp font-bold text-stone-800 mb-1 text-center">{kanji.char}</div>
                                                        <div className="text-[10px] font-bold text-rose-500 uppercase text-center border-t border-stone-200 pt-1">{kanji.hanViet}</div>
                                                        
                                                        {/* Floating Tooltip with detailed readings */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-stone-800 text-white p-4 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-40 transform translate-y-2 group-hover:translate-y-0">
                                                            <div className="text-[10px] uppercase text-stone-400 font-bold mb-2 border-b border-stone-700 pb-1 flex justify-between">
                                                                <span>{kanji.char}</span>
                                                                <span>{kanji.hanViet}</span>
                                                            </div>
                                                            <div className="space-y-3 text-left">
                                                                <div>
                                                                    <span className="text-[9px] text-rose-300 font-bold block uppercase tracking-tighter">Âm On (音):</span>
                                                                    <span className="text-xs font-serif-jp">{kanji.onyomi.join('、') || 'N/A'}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[9px] text-sky-300 font-bold block uppercase tracking-tighter">Âm Kun (訓):</span>
                                                                    <span className="text-xs font-serif-jp">{kanji.kunyomi.join('、') || 'N/A'}</span>
                                                                </div>
                                                                <div className="pt-2 border-t border-stone-700/50">
                                                                    <span className="text-[9px] text-emerald-400 font-bold block uppercase tracking-tighter">Nghĩa:</span>
                                                                    <span className="text-xs italic leading-tight block">{kanji.meaning}</span>
                                                                </div>
                                                            </div>
                                                            {/* Tooltip Arrow */}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-stone-800"></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-stone-400 mt-4 text-center italic">Di chuột vào từng chữ Hán để xem âm On/Kun và ý nghĩa chi tiết.</p>
                                        </div>
                                    )}

                                    <ConjugationView data={(selectedItem as SavedToken).extendedAnalysis!.conjugations} />
                                    
                                    {/* Detailed Recommendations when on detail view */}
                                    <RecommendationView />

                                    <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-400"></span>Ví dụ minh họa</h4>
                                        <div className="space-y-8">{(selectedItem as SavedToken).extendedAnalysis!.examples?.map((ex, idx) => (
                                            <div key={idx} className="relative pl-6 border-l-4 border-indigo-100">
                                                <p className="font-serif-jp text-xl text-stone-800 mb-2 leading-relaxed flex items-start gap-2">{ex.japanese} <SpeakBtn text={ex.japanese} size="md" /></p>
                                                <p className="text-sm text-stone-400 mb-1 font-serif-jp">{ex.reading}</p>
                                                <p className="text-stone-600 italic text-base">{ex.vietnamese}</p>
                                            </div>
                                        ))}</div>
                                    </div>
                                    <div className="space-y-6">
                                        <RelatedWordGroup title="Từ đồng nghĩa" items={(selectedItem as SavedToken).extendedAnalysis!.synonyms} colorClass="bg-emerald-50 border-emerald-100" iconColor="bg-emerald-400" />
                                        <RelatedWordGroup title="Từ trái nghĩa" items={(selectedItem as SavedToken).extendedAnalysis!.antonyms} colorClass="bg-rose-50 border-rose-100" iconColor="bg-rose-400" />
                                        <RelatedWordGroup title="Cụm từ" items={(selectedItem as SavedToken).extendedAnalysis!.collocations} colorClass="bg-amber-50 border-amber-100" iconColor="bg-amber-400" />
                                    </div>
                                </div>
                            )}
                         </div>
                    </div>
                 </>
             )}

             {activeTab === 'grammar' && selectedItem && (
                 <>
                    <div className="px-8 py-4 border-b border-stone-200 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                        <button onClick={handleBackToList} className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors group flex items-center gap-2">
                            <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            <span className="text-sm font-bold">Quay lại</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                        <div className="mb-10 text-center">
                             <div className="text-xl text-stone-500 font-serif-jp mb-2">{(selectedItem as SavedGrammar).reading}</div>
                             <h1 className="text-5xl md:text-6xl font-serif-jp font-bold text-indigo-900 leading-tight mb-4 flex items-center justify-center gap-3">{(selectedItem as SavedGrammar).structure} <SpeakBtn text={(selectedItem as SavedGrammar).reading || (selectedItem as SavedGrammar).structure} size="lg" /></h1>
                             <div className="flex flex-wrap justify-center gap-3">
                                {(selectedItem as SavedGrammar).jlpt && <span className="px-3 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200 text-sm font-bold">{(selectedItem as SavedGrammar).jlpt}</span>}
                                {(selectedItem as SavedGrammar).hanViet && (
                                    <span className="px-3 py-1 rounded bg-white border border-indigo-100 text-indigo-500 text-sm font-bold uppercase shadow-sm">
                                        Hán Việt: {(selectedItem as SavedGrammar).hanViet}
                                    </span>
                                )}
                                {(selectedItem as SavedGrammar).tags?.map((tag, i) => {
                                    if (tag.includes('JLPT')) return null;
                                    const theme = getGrammarTheme(selectedItem as SavedGrammar);
                                    return (
                                        <button 
                                            key={i} 
                                            onClick={() => handleTagClick(tag)}
                                            className={`px-3 py-1 rounded border text-sm font-bold hover:scale-105 active:scale-95 transition-all ${theme.badgeBg} ${theme.badgeText} ${theme.border}`}
                                            title={`Khám phá thêm về ${translateTag(tag)}`}
                                        >
                                            {translateTag(tag)}
                                        </button>
                                    );
                                })}
                             </div>
                        </div>
                        {!(selectedItem as SavedGrammar).extendedAnalysis ? (
                             <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-stone-100 shadow-sm animate-pulse">
                                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-base text-stone-500 font-bold uppercase tracking-wider">Đang phân tích tổng quát...</p>
                                <p className="text-sm text-stone-400 mt-2">Đang lấy thêm ví dụ & bối cảnh sử dụng</p>
                            </div>
                        ) : (
                             <div className="animate-fade-in-up space-y-8 max-w-4xl mx-auto">
                                 {/* --- SECTION 1: GENERAL MEANING --- */}
                                 <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
                                     <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Ý nghĩa tổng quát</h4>
                                    <p className="text-2xl text-stone-800 font-medium font-serif leading-relaxed mb-6">{(selectedItem as SavedGrammar).extendedAnalysis!.generalMeaning}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedItem as SavedGrammar).extendedAnalysis!.contexts?.map((ctx, idx) => (
                                            <span key={idx} className="bg-stone-50 text-stone-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-stone-200 uppercase tracking-wide">
                                                {ctx}
                                            </span>
                                        ))}
                                    </div>
                                 </div>

                                 {/* --- SECTION 2: USAGE NOTES (GLOBAL) --- */}
                                 {(selectedItem as SavedGrammar).extendedAnalysis!.notes && (
                                     <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                         <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                             Lưu ý quan trọng
                                         </h4>
                                         <p className="text-sm text-stone-800 leading-relaxed font-medium">
                                             {(selectedItem as SavedGrammar).extendedAnalysis!.notes}
                                         </p>
                                     </div>
                                 )}

                                 <RecommendationView />

                                 {/* --- SECTION 3: CONSTRUCTION / VARIATIONS --- */}
                                 {(selectedItem as SavedGrammar).extendedAnalysis!.variations && (selectedItem as SavedGrammar).extendedAnalysis!.variations!.length > 0 ? (
                                     <div className="space-y-6">
                                         <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2 px-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                            Các trường hợp sử dụng (Variations)
                                         </h4>
                                         {(selectedItem as SavedGrammar).extendedAnalysis!.variations!.map((variation, vIdx) => (
                                             <div key={vIdx} className="bg-indigo-50/30 p-8 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
                                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-200"></div>
                                                 <div className="mb-6">
                                                     <h5 className="font-bold text-xl text-indigo-900 mb-2 flex items-center gap-3">
                                                         <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs">{vIdx + 1}</span>
                                                         {variation.meaning}
                                                     </h5>
                                                     {variation.usage && <p className="text-sm text-stone-500 ml-9">{variation.usage}</p>}
                                                 </div>
                                                 
                                                 <div className="ml-9 mb-6">
                                                     <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 block">Cấu trúc</span>
                                                     <ul className="space-y-2">
                                                        {variation.constructionRules.map((rule, rIdx) => (
                                                            <li key={rIdx}><GrammarFormula rule={rule} /></li>
                                                        ))}
                                                     </ul>
                                                 </div>

                                                 <div className="ml-9">
                                                     <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 block">Ví dụ</span>
                                                     <div className="space-y-4">
                                                         {variation.examples.map((ex, eIdx) => (
                                                             <div key={eIdx} className="pl-4 border-l-2 border-indigo-200">
                                                                 <p className="font-serif-jp text-lg text-stone-800 mb-1 flex items-start gap-1.5">{ex.japanese} <SpeakBtn text={ex.japanese} /></p>
                                                                 <p className="text-xs text-stone-400 mb-0.5">{ex.reading}</p>
                                                                 <p className="text-sm text-stone-600 italic">{ex.vietnamese}</p>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 ) : (
                                     // FALLBACK TO SINGLE VIEW
                                     <div className="bg-indigo-50/50 p-8 rounded-2xl border border-indigo-100">
                                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>Công thức cấu tạo</h4>
                                        <ul className="space-y-4">
                                            {(selectedItem as SavedGrammar).extendedAnalysis!.constructionRules?.map((rule, idx) => (
                                                <li key={idx} className="flex items-start gap-3"><div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0"></div><div className="flex-1"><GrammarFormula rule={rule} /></div></li>
                                            ))}
                                        </ul>
                                     </div>
                                 )}

                                 {/* --- SECTION 4: BREAKDOWN (DEEP STRUCTURE) --- */}
                                 {(selectedItem as SavedGrammar).extendedAnalysis!.breakdown && (selectedItem as SavedGrammar).extendedAnalysis!.breakdown!.length > 0 && (
                                    <div className="mt-4 pt-6 border-t border-indigo-200/50">
                                            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Mổ xẻ thành phần (Deep Structure)</h4>
                                            <div className="flex flex-wrap gap-4">
                                                {(selectedItem as SavedGrammar).extendedAnalysis!.breakdown!.map((part, pIdx) => {
                                                    // VISUAL TWEAK: Check for special forms like "Futsuu-kei" to style differently
                                                    const isSpecialForm = part.part.toLowerCase().includes('futsuu') || part.part.toLowerCase().includes('plain') || part.part.includes('thể thông thường');
                                                    return (
                                                    <div key={pIdx} className={`rounded-lg p-3 border shadow-sm flex flex-col items-center min-w-[100px] text-center
                                                        ${isSpecialForm ? 'bg-amber-50 border-amber-200' : 'bg-white border-indigo-200'}`}>
                                                        <span className={`text-lg font-serif-jp font-bold mb-1 ${isSpecialForm ? 'text-amber-800' : 'text-indigo-800'}`}>{part.part}</span>
                                                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded mb-1 ${isSpecialForm ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-400'}`}>{part.role}</span>
                                                        <span className="text-xs text-stone-500 leading-tight">{part.meaning}</span>
                                                    </div>
                                                )})}
                                            </div>
                                    </div>
                                )}
                                
                                 {/* --- SECTION 5: COMMON MISTAKES (THE CLINIC) --- */}
                                 {(selectedItem as SavedGrammar).extendedAnalysis!.commonMistakes && (selectedItem as SavedGrammar).extendedAnalysis!.commonMistakes!.length > 0 && (
                                     <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 mt-8">
                                        <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                            Phòng khám lỗi sai (The Clinic)
                                        </h4>
                                        <div className="grid gap-6">
                                            {(selectedItem as SavedGrammar).extendedAnalysis!.commonMistakes!.map((mistake, mIdx) => (
                                                <div key={mIdx} className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm flex flex-col md:flex-row group">
                                                    <div className="p-4 bg-rose-50 border-b md:border-b-0 md:border-r border-rose-100 md:w-1/2 flex flex-col justify-center">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-600 flex items-center justify-center font-bold text-xs">✕</div>
                                                            <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">Sai (Pathology)</span>
                                                        </div>
                                                        <p className="font-serif-jp text-lg text-stone-700 line-through decoration-rose-400/50 mb-1 flex items-start gap-1.5">{mistake.incorrect} <SpeakBtn text={mistake.incorrect} /></p>
                                                    </div>
                                                    <div className="p-4 bg-emerald-50 md:w-1/2 flex flex-col justify-center relative">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</div>
                                                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Đúng (Treatment)</span>
                                                        </div>
                                                        <p className="font-serif-jp text-lg text-emerald-800 font-medium mb-3 flex items-start gap-1.5">{mistake.correct} <SpeakBtn text={mistake.correct} /></p>
                                                        <div className="pt-3 border-t border-emerald-100 text-xs text-stone-600 italic bg-white/50 p-2 rounded">
                                                            <span className="font-bold text-emerald-600 not-italic mr-1 uppercase text-[9px]">Giải thích:</span>
                                                            {mistake.explanation}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     </div>
                                 )}

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {(selectedItem as SavedGrammar).extendedAnalysis!.detailedComparison && (selectedItem as SavedGrammar).extendedAnalysis!.detailedComparison!.length > 0 && (
                                        <div className="bg-white p-6 rounded-2xl border border-stone-200 h-full col-span-1 md:col-span-2">
                                            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6">Chẩn đoán phân biệt (Similar Grammar)</h4>
                                            <div className="grid gap-6 md:grid-cols-2">
                                                {(selectedItem as SavedGrammar).extendedAnalysis!.detailedComparison!.map((comp, cIdx) => {
                                                    const isSaved = savedGrammars.some(g => g.structure === comp.similarStructure);
                                                    return (
                                                    <div key={cIdx} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col relative group/item hover:border-indigo-300 transition-colors">
                                                        <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-serif-jp font-bold text-xl text-indigo-900">
                                                                    {comp.similarStructure}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!isSaved) {
                                                                            onAddRelatedGrammar(comp.similarStructure, comp.nuance);
                                                                        }
                                                                    }}
                                                                    disabled={isSaved}
                                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                                                        isSaved 
                                                                        ? 'bg-emerald-100 text-emerald-600 cursor-default opacity-100' 
                                                                        : 'bg-white hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-200 hover:border-stone-800 shadow-sm opacity-0 group-hover/item:opacity-100'
                                                                    }`}
                                                                    title={isSaved ? "Đã lưu" : "Thêm vào kho ngữ pháp"}
                                                                >
                                                                    {isSaved ? (
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                                    ) : (
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                                                    )}
                                                                </button>
                                                            </div>
                                                            <span className="text-indigo-200 font-bold text-xs uppercase">VS</span>
                                                        </div>
                                                        <div className="px-5 py-4 bg-white border-b border-stone-100">
                                                            <div className="flex items-start gap-2">
                                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
                                                                        Sắc thái khác biệt
                                                                    </span>
                                                                    <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                                                                        {comp.nuance}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-5 bg-stone-50 flex-1">
                                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">
                                                                Giải thích chi tiết
                                                            </span>
                                                            <p className="text-sm text-stone-600 leading-loose text-justify">
                                                                {comp.difference}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )})}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Legacy Similar Structures Fallback */}
                                    {(!((selectedItem as SavedGrammar).extendedAnalysis!.detailedComparison) || (selectedItem as SavedGrammar).extendedAnalysis!.detailedComparison!.length === 0) && 
                                     (selectedItem as SavedGrammar).extendedAnalysis!.similarStructures && (selectedItem as SavedGrammar).extendedAnalysis!.similarStructures!.length > 0 && (
                                        <div className="bg-white p-6 rounded-2xl border border-stone-200 h-full">
                                            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Cấu trúc tương tự (Tham khảo)</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {(selectedItem as SavedGrammar).extendedAnalysis!.similarStructures!.map((s, i) => {
                                                    const isSaved = savedGrammars.some(g => g.structure === s);
                                                    return (
                                                    <div key={i} className="relative group/chip inline-flex items-center">
                                                        <span className="text-base font-serif-jp font-medium text-stone-700 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100 pr-8">{s}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!isSaved) {
                                                                    onAddRelatedGrammar(s);
                                                                }
                                                            }}
                                                            disabled={isSaved}
                                                            className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                                                isSaved 
                                                                ? 'text-emerald-500 cursor-default' 
                                                                : 'text-stone-300 hover:text-stone-600 hover:bg-stone-200 opacity-0 group-hover/chip:opacity-100'
                                                            }`}
                                                            title={isSaved ? "Đã lưu" : "Thêm vào kho ngữ pháp"}
                                                        >
                                                            {isSaved ? (
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                            ) : (
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                )})}
                                            </div>
                                        </div>
                                    )}
                                 </div>

                                 {(selectedItem as SavedGrammar).extendedAnalysis!.collocations && (selectedItem as SavedGrammar).extendedAnalysis!.collocations!.length > 0 && (
                                     <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm mt-4">
                                         <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            Cụm từ thường gặp (Collocations)
                                        </h4>
                                        <div className="flex flex-wrap gap-3">
                                            {(selectedItem as SavedGrammar).extendedAnalysis!.collocations!.map((col, idx) => (
                                                <span key={idx} className="font-serif-jp text-stone-700 bg-stone-50 px-4 py-2 rounded-lg border border-stone-100 text-sm inline-flex items-center gap-1.5">
                                                    {col} <SpeakBtn text={col} />
                                                </span>
                                            ))}
                                        </div>
                                     </div>
                                 )}

                                {/* Show Examples separately ONLY if NOT using variations mode (otherwise they are inside variations) */}
                                {(!((selectedItem as SavedGrammar).extendedAnalysis!.variations) || (selectedItem as SavedGrammar).extendedAnalysis!.variations!.length === 0) && (
                                    <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm mt-4">
                                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-400"></span>Ví dụ mẫu</h4>
                                        <div className="space-y-8">
                                            {(selectedItem as SavedGrammar).extendedAnalysis!.examples?.map((ex, idx) => (
                                                <div key={idx} className="relative pl-6 border-l-4 border-indigo-100">
                                                    <p className="font-serif-jp text-xl text-stone-800 mb-2 leading-relaxed flex items-start gap-2">{ex.japanese} <SpeakBtn text={ex.japanese} size="md" /></p>
                                                    <p className="text-sm text-stone-400 mb-1 font-serif-jp">{ex.reading}</p>
                                                    <p className="text-stone-600 italic text-base">{ex.vietnamese}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                             </div>
                        )}
                    </div>
                 </>
             )}
        </div>
      </div>
    </>
  );
};

export default UserHub;
