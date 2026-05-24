import React, { useState } from 'react';
import { SentenceBlock as SentenceBlockType, PartType, Token, NuanceType, GrammaticalRole, GrammarStructure } from '../types';
import VerbDecomposition from './VerbDecomposition';
import PitchGraph from './PitchGraph';
import GrammarFormula from './GrammarFormula';
import { speakJapaneseText, stopJapaneseTts } from '../services/googleTtsService';
import { useSettings } from '../contexts/SettingsContext';

// --- TTS Speaker Button (inline, SVG only) ---
const SpeakBtn: React.FC<{ text: string; size?: 'sm' | 'md'; light?: boolean }> = ({ text, size = 'sm', light }) => {
    const [playing, setPlaying] = React.useState(false);
    const handleSpeak = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (playing) { stopJapaneseTts(); setPlaying(false); return; }
        setPlaying(true);
        try { await speakJapaneseText(text); } catch { /* */ }
        setPlaying(false);
    };
    if (!text) return null;
    const s = size === 'md' ? 'w-6 h-6' : 'w-5 h-5';
    const ic = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
    return (
        <button onClick={handleSpeak} className={`${s} rounded-full inline-flex items-center justify-center transition-all shrink-0 ${
            playing
                ? (light ? 'bg-white/20 text-white animate-pulse' : 'bg-rose-100 text-rose-500 animate-pulse')
                : (light ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-stone-300 hover:text-stone-600 hover:bg-stone-100')
        }`} title={`Ph\u00e1t \u00e2m: ${text}`}>
            {playing ? (
                <svg className={ic} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
                <svg className={ic} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5.586v12.828a1 1 0 01-1.707.707L5.586 15z" /></svg>
            )}
        </button>
    );
};

interface Props {
  block: SentenceBlockType;
  onToggleSave?: (token: Token) => void;
  isSaved?: (tokenId: string) => boolean;
  onToggleSaveGrammar?: (grammar: GrammarStructure) => void;
  isGrammarSaved?: (grammar: GrammarStructure) => boolean;
}

type SectionKey = 'syntax' | 'anatomy' | 'mapping';

const SentenceBlock: React.FC<Props> = ({ block, onToggleSave, isSaved, onToggleSaveGrammar, isGrammarSaved }) => {
  const { settings } = useSettings();
  const [hoveredMappingId, setHoveredMappingId] = useState<string | null>(null);
  const [hoveredRelatedIds, setHoveredRelatedIds] = useState<string[]>([]);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  
  // State for Grammar Inspector
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarStructure | null>(null);

  // Custom Layer Order State
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(['syntax', 'anatomy', 'mapping']);

  const activeToken = block.tokens.find(t => t.id === activeTokenId);

  // --- INTERACTION HANDLERS ---
  
  const handleTokenClick = (token: Token) => {
    setActiveTokenId(prev => (prev === token.id ? null : token.id));
  };

  const handleTokenEnter = (token: Token) => {
    if (token.mappingId) {
      setHoveredMappingId(token.mappingId);
    }
    if (token.relatedTokenIds && token.relatedTokenIds.length > 0) {
        setHoveredRelatedIds(token.relatedTokenIds);
    }
  };

  const handleTokenLeave = () => {
    setHoveredMappingId(null);
    setHoveredRelatedIds([]);
  };

  const handleMappingEnter = (mappingId: string) => {
    setHoveredMappingId(mappingId);
  };

  // --- POS ICON LOGIC ---
  const getPosIcon = (type: PartType) => {
      switch (type) {
          case PartType.NOUN: return 'N';
          case PartType.VERB: return 'V';
          case PartType.ADJECTIVE: return 'A';
          case PartType.PARTICLE: return 'P';
          case PartType.CONJUNCTION: return 'C';
          case PartType.AUXILIARY: return 'X';
          case PartType.PUNCTUATION: return '•';
          default: return '?';
      }
  };

  // --- NUANCE & COLOR LOGIC (Updated for Granularity) ---

  const getBlockMoodClass = () => {
    const textContent = block.tokens.map(t => t.text).join('');
    // Simple block mood detection (can be enhanced later)
    if (textContent.includes('が') || textContent.includes('けど')) return 'bg-amber-50/50 border-amber-100'; 
    if (textContent.includes('から') || textContent.includes('ので')) return 'bg-cyan-50/50 border-cyan-100';
    if (textContent.includes('ば') || textContent.includes('たら')) return 'bg-emerald-50/50 border-emerald-100';
    return 'bg-white/90 border-stone-200';
  };

  const getTokenStyle = (token: Token) => {
    // 0. Ghost Token Override
    if (token.isGhost) {
        return 'text-stone-400 bg-transparent border-stone-300 border-dashed opacity-70 italic';
    }

    // Role-based Border Overrides (ELEGANT UNDERLINES)
    let roleClasses = '';
    if (token.grammaticalRole === GrammaticalRole.MAIN_SUBJECT) {
        roleClasses = 'border-b-amber-400 border-b-[3px]'; // Gold Underline for Subject
    } else if (token.grammaticalRole === GrammaticalRole.MAIN_PREDICATE) {
        roleClasses = 'border-b-slate-400 border-b-[3px]'; // Silver/Slate Underline for Predicate
    } else {
        roleClasses = 'border-b-2'; // Default thickness
    }

    const nuance = token.deepDive?.nuanceType;
    let colorClasses = '';

    // 1. Priority: Explicit Nuance from AI
    if (nuance && nuance !== NuanceType.NONE) {
        switch (nuance) {
            case NuanceType.REGRET_UNINTENDED:
                colorClasses = 'text-zinc-700 bg-zinc-200 border-zinc-300 ring-1 ring-zinc-200'; break;
            case NuanceType.TENSE_ASPECT:
                if (token.text.includes('おく') || token.text.includes('とく')) 
                    colorClasses = 'text-lime-800 bg-lime-100 border-lime-300 ring-1 ring-lime-200';
                else 
                    colorClasses = 'text-blue-800 bg-blue-100 border-blue-200'; 
                break;
            case NuanceType.POLITE_HONORIFIC:
                colorClasses = 'text-yellow-800 bg-yellow-100 border-yellow-300 ring-1 ring-yellow-200'; break;
            case NuanceType.CERTAINTY_CONJECTURE:
                colorClasses = 'text-fuchsia-800 bg-fuchsia-100 border-fuchsia-300 ring-1 ring-fuchsia-200'; break;
            case NuanceType.LIMITATION_EMPHASIS:
                colorClasses = 'text-red-700 bg-red-100 border-red-300 font-bold'; break;
            case NuanceType.GIVING_RECEIVING:
                colorClasses = 'text-rose-800 bg-rose-100 border-rose-300'; break;
            case NuanceType.EMOTIONAL_PARTICLE:
                colorClasses = 'text-pink-600 bg-pink-50 border-pink-200 italic'; break;
            case NuanceType.VOLITIONAL_INVITATION:
                colorClasses = 'text-emerald-700 bg-emerald-100 border-emerald-300'; break;
            case NuanceType.PASSIVE:
                colorClasses = 'text-indigo-800 bg-indigo-100 border-indigo-300'; break;
            case NuanceType.CAUSATIVE:
                colorClasses = 'text-orange-800 bg-orange-100 border-orange-300'; break;
            case NuanceType.POTENTIAL:
                colorClasses = 'text-cyan-700 bg-cyan-100 border-cyan-300'; break;
            case NuanceType.OBLIGATION:
                colorClasses = 'text-red-700 bg-red-100 border-red-300 font-bold border-dashed'; break;
            case NuanceType.REASON:
                 colorClasses = 'text-sky-700 bg-sky-100 border-sky-300 font-bold'; break;
            case NuanceType.CONTRAST:
                colorClasses = 'text-amber-700 bg-amber-100 border-amber-300 font-bold'; break;
            case NuanceType.CONDITION:
                colorClasses = 'text-emerald-700 bg-emerald-100 border-emerald-300 font-bold'; break;
            // --- NEW TYPES STYLING ---
            case NuanceType.DESIRE_HOPE:
                colorClasses = 'text-pink-700 bg-pink-100 border-pink-300'; break;
            case NuanceType.PURPOSE:
                colorClasses = 'text-teal-800 bg-teal-100 border-teal-300'; break;
            case NuanceType.COMPARISON:
                colorClasses = 'text-violet-800 bg-violet-100 border-violet-300'; break;
            case NuanceType.CHANGE_TRANSFORMATION:
                colorClasses = 'text-fuchsia-700 bg-fuchsia-100 border-fuchsia-300'; break;
            case NuanceType.PERMISSION_PROHIBITION:
                colorClasses = 'text-stone-800 bg-red-50 border-red-400 border-double'; break;
            case NuanceType.NEGATION:
                colorClasses = 'text-gray-900 bg-gray-300 border-gray-500 font-medium'; break;
            case NuanceType.QUOTATION:
                colorClasses = 'text-sky-700 bg-sky-100 border-sky-300 italic'; break;
            default:
                break;
        }
    }

    if (!colorClasses) {
        // 2. Fallback: Standard POS
        switch (token.type) {
            case PartType.VERB: colorClasses = 'text-indigo-700 bg-indigo-50 border-indigo-200'; break;
            case PartType.ADJECTIVE: colorClasses = 'text-teal-700 bg-teal-50 border-teal-200'; break;
            case PartType.AUXILIARY: colorClasses = 'text-violet-700 bg-violet-50 border-violet-200'; break;
            case PartType.CONJUNCTION: colorClasses = 'text-amber-700 bg-amber-50 border-amber-200'; break;
            case PartType.PARTICLE: colorClasses = 'text-rose-600 bg-rose-50 border-rose-200'; break;
            case PartType.NOUN: colorClasses = 'text-stone-700 bg-white border-stone-200'; break;
            case PartType.PUNCTUATION: colorClasses = 'text-stone-300 border-transparent bg-transparent'; break;
            default: colorClasses = 'text-stone-600 border-stone-200'; break;
        }
    }

    if (token.grammaticalRole === GrammaticalRole.MAIN_SUBJECT || token.grammaticalRole === GrammaticalRole.MAIN_PREDICATE) {
        return `${colorClasses} ${roleClasses}`; 
    }

    return `${colorClasses} ${roleClasses}`;
  };

  const getNuanceLabel = (nuance: NuanceType) => {
      switch (nuance) {
          case NuanceType.POLITE_HONORIFIC: return 'Kính ngữ / Khiêm nhường';
          case NuanceType.GIVING_RECEIVING: return 'Quan hệ Cho - Nhận';
          case NuanceType.EMOTIONAL_PARTICLE: return 'Cảm thán / Vĩ tố';
          case NuanceType.VOLITIONAL_INVITATION: return 'Ý chí / Rủ rê';
          case NuanceType.PASSIVE: return 'Thể Bị động';
          case NuanceType.CAUSATIVE: return 'Thể Sai khiến';
          case NuanceType.CERTAINTY_CONJECTURE: return 'Mức độ chắc chắn / Phỏng đoán';
          case NuanceType.LIMITATION_EMPHASIS: return 'Giới hạn / Nhấn mạnh';
          case NuanceType.TENSE_ASPECT: return 'Thời thì / Trạng thái';
          case NuanceType.REGRET_UNINTENDED: return 'Hối tiếc / Lỡ làm';
          case NuanceType.POTENTIAL: return 'Khả năng';
          case NuanceType.OBLIGATION: return 'Bắt buộc';
          case NuanceType.CONDITION: return 'Điều kiện';
          case NuanceType.REASON: return 'Nguyên nhân';
          case NuanceType.CONTRAST: return 'Tương phản';
          // --- NEW TYPES LABELS ---
          case NuanceType.DESIRE_HOPE: return 'Mong muốn / Hy vọng';
          case NuanceType.PURPOSE: return 'Mục đích';
          case NuanceType.COMPARISON: return 'So sánh';
          case NuanceType.CHANGE_TRANSFORMATION: return 'Sự thay đổi / Biến đổi';
          case NuanceType.PERMISSION_PROHIBITION: return 'Cho phép / Cấm chỉ';
          case NuanceType.NEGATION: return 'Phủ định';
          case NuanceType.QUOTATION: return 'Trích dẫn';
          default: return null;
      }
  };

  const getRoleBadgeColor = (type: PartType) => {
    switch (type) {
      case PartType.VERB: return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case PartType.ADJECTIVE: return 'bg-teal-100 text-teal-700 border border-teal-200';
      case PartType.AUXILIARY: return 'bg-violet-100 text-violet-700 border border-violet-200';
      case PartType.CONJUNCTION: return 'bg-amber-100 text-amber-800 border border-amber-300';
      case PartType.PARTICLE: return 'bg-rose-100 text-rose-700 border border-rose-200';
      case PartType.NOUN: return 'bg-white border border-stone-200 text-stone-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getTagColor = (tag: string) => {
    const t = tag.toUpperCase();
    if (t.includes('N5')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (t.includes('N4')) return 'bg-green-50 text-green-700 border-green-200';
    if (t.includes('N3')) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (t.includes('N2')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (t.includes('N1')) return 'bg-red-50 text-red-700 border-red-200';
    
    // Tech / Science
    if (t.includes('IT') || t.includes('TECH')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (t.includes('SCIENCE') || t.includes('ENGINEER')) return 'bg-sky-50 text-sky-700 border-sky-200';
    
    // Medical
    if (t.includes('MEDIC')) return 'bg-red-50 text-red-700 border-red-200';
    
    // Business / Economy
    if (t.includes('BUSINESS')) return 'bg-slate-50 text-slate-700 border-slate-200';
    if (t.includes('ECONOMY') || t.includes('FINANCE') || t.includes('MARKET')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    
    // Culture / Art / History
    if (t.includes('ANIME') || t.includes('MANGA')) return 'bg-pink-50 text-pink-700 border-pink-200';
    if (t.includes('CULTURE') || t.includes('ART') || t.includes('LITERAT')) return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
    if (t.includes('HISTORY') || t.includes('TRADITION')) return 'bg-amber-50 text-amber-700 border-amber-200';
    
    // Linguistics
    if (t.includes('SLANG')) return 'bg-violet-50 text-violet-700 border-violet-200';
    if (t.includes('ONOMATOPOEIA')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (t.includes('DIALECT')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    
    // Politics / Law / Environment
    if (t.includes('POLITIC') || t.includes('LAW') || t.includes('GOVERN')) return 'bg-gray-100 text-gray-700 border-gray-300';
    if (t.includes('ENVIRON') || t.includes('NATURE')) return 'bg-lime-50 text-lime-700 border-lime-200';
    if (t.includes('PHILOSO') || t.includes('PSYCHO')) return 'bg-purple-50 text-purple-700 border-purple-200';

    if (t.includes('ENTITY')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (t.includes('CATEGORY')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-stone-100 text-stone-500 border-stone-200';
  };

  const formatTagLabel = (tag: string) => {
    const label = tag.replace('JLPT ', '').replace('Category: ', '').replace('Entity: ', '');
    
    // Richer Mapping including Macro Topics
    const translations: {[key: string]: string} = {
        'Person': 'Người', 'Place': 'Địa điểm', 'Organization': 'Tổ chức', 'Time': 'Thời gian',
        'Business': 'Kinh doanh', 'Daily': 'Đời sống', 'Academic': 'Học thuật', 'Travel': 'Du lịch',
        'IT': 'CNTT', 'IT Term': 'Thuật ngữ IT', 'Technology': 'Công nghệ',
        'Medical': 'Y tế', 'Science': 'Khoa học',
        'Politics': 'Chính trị', 'Law': 'Pháp luật', 'Government': 'Chính phủ',
        'Economy': 'Kinh tế', 'Finance': 'Tài chính', 'Market': 'Thị trường',
        'Culture': 'Văn hóa', 'Art': 'Nghệ thuật', 'History': 'Lịch sử', 'Literature': 'Văn học',
        'Environment': 'Môi trường', 'Nature': 'Tự nhiên',
        'Philosophy': 'Triết học', 'Psychology': 'Tâm lý', 'Society': 'Xã hội', 'Education': 'Giáo dục',
        'Anime': 'Anime/Manga', 'Anime Slang': 'Tiếng lóng Anime',
        'Slang': 'Tiếng lóng',
        'Onomatopoeia': 'Từ tượng thanh/hình',
        'Dialect': 'Phương ngữ',
        'Keigo': 'Kính ngữ',
        'Spoken': 'Văn nói', 'Written': 'Văn viết',
        'Formal': 'Trang trọng', 'Casual': 'Thân mật'
    };
    
    // Check partial matches if exact match fails
    if (!translations[label]) {
        for (const key in translations) {
            if (label.includes(key)) return translations[key];
        }
    }
    
    return translations[label] || label;
  };

  // --- VISUALIZATIONS ---
  
  const RoleMarker = ({ type }: { type: 'gold' | 'silver' }) => (
    <div className={`absolute -top-1.5 -right-1.5 z-20 ${type === 'gold' ? 'text-amber-400' : 'text-slate-400'}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
    </div>
  );

  // --- IMPROVED LOGIC: SMART CLAUSE SPLITTING ---
  const getDynamicClauses = (tokens: Token[]) => {
    const chunks: { id: string, title: string, tokens: Token[] }[] = [];
    let currentChunk: Token[] = [];
    let clauseCount = 1;
    
    // Particles that typically end a clause or phrase
    // CAUTION: Do NOT include Case Particles that act on Nouns (ga - subject, wo, ni, no, de, e, to) unless context implies otherwise.
    // We focus on particles that act as Logical Connectors.
    const splitParticles = [
        'から', // kara (because)
        'ので', // node (because)
        'けど', 'けれど', 'けれども', // kedo (but)
        'が', // ga (BUT - Contrast). Note: AI often mislabels Subject GA as Particle too, so we check roles.
        'し', // shi (and/list)
        'ば', // ba (if)
        'たら', // tara (if)
        'なら', // nara (if)
        'ても', 'でも', // temo (even if)
        'たり', // tari (listing)
        'て', 'で' // te-form (sequence). 'de' can be location/means OR te-form of desu.
    ];

    tokens.forEach((token, index) => {
        currentChunk.push(token);
        
        let shouldSplit = false;

        // 1. Split on Punctuation
        if (token.type === PartType.PUNCTUATION) {
            shouldSplit = true;
        }
        // 2. Split on Explicit Conjunctions
        else if (token.type === PartType.CONJUNCTION) {
            shouldSplit = true;
        }
        // 3. Smart Split on Particles
        else if (token.type === PartType.PARTICLE || token.type === PartType.AUXILIARY) {
             const isSplitParticle = splitParticles.includes(token.text) || splitParticles.some(p => token.text.endsWith(p));
             
             if (isSplitParticle) {
                 // REFINEMENT: Don't split "GA" if it is the MAIN SUBJECT
                 if (token.text === 'が' && token.grammaticalRole === GrammaticalRole.MAIN_SUBJECT) {
                     shouldSplit = false;
                 }
                 // REFINEMENT: Don't split "DE" if it is the means/location (hard to know 100%, but assume standard Case Particle)
                 // We only split 'de' if it seems to be the Te-form of Desu, which usually implies a pause.
                 // Ideally, we'd check if the Previous token is a Noun (Means) vs Adjective-Na (Te-form).
                 // For safety in this "Loose" mode, let's AVOID splitting on 'de' to keep Noun+De phrases together.
                 else if (token.text === 'で') {
                     shouldSplit = false; 
                 }
                 // REFINEMENT: 'Te' usually creates a rhythm break, so we keep it as a split point.
                 else {
                     shouldSplit = true;
                 }
             }
        }

        // If we decided to split, and there are tokens in the chunk
        if (shouldSplit && currentChunk.length > 0) {
            // Edge Case: Don't create a chunk just for a single punctuation mark if it's the start
            // But here we act *after* pushing.
            
            // Check if this is the very last token, no need to "split" really, just finish.
            // If it's not the last token, we push chunk.
            if (index < tokens.length - 1) {
                chunks.push({
                    id: `Đoạn ${clauseCount}`,
                    title: `Mệnh đề ${clauseCount}`,
                    tokens: [...currentChunk]
                });
                currentChunk = [];
                clauseCount++;
            }
        }
    });

    // Add remaining tokens
    if (currentChunk.length > 0) {
        chunks.push({
            id: `Đoạn ${clauseCount}`,
            title: `Mệnh đề ${clauseCount}`,
            tokens: currentChunk
        });
    }

    return chunks.length > 0 ? chunks : [{ id: '1', title: 'Câu hoàn chỉnh', tokens }];
  };

  const clauses = getDynamicClauses(block.tokens);

  // --- REORDER HANDLERS ---
  const moveSection = (key: SectionKey, direction: 'up' | 'down') => {
      // ... existing logic ...
    const currentIndex = sectionOrder.indexOf(key);
    if (currentIndex === -1) return;
    
    const newOrder = [...sectionOrder];
    if (direction === 'up' && currentIndex > 0) {
        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
    } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
        [newOrder[currentIndex + 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex + 1]];
    }
    setSectionOrder(newOrder);
  };

  // --- COMPONENT RENDERERS ---

  const ReorderControls = ({ sectionKey }: { sectionKey: SectionKey }) => (
    <div className="flex items-center gap-1 ml-auto">
        <button onClick={() => moveSection(sectionKey, 'up')} className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-600 transition-colors" title="Lên">↑</button>
        <button onClick={() => moveSection(sectionKey, 'down')} className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-600 transition-colors" title="Xuống">↓</button>
    </div>
  );

  const renderConnectionInfo = () => {
      // ... existing logic ...
    if (!block.connectionInfo) return null;
    return (
        <div className="mb-6 mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-3 bg-stone-100 px-4 py-2 rounded-full border border-stone-200 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                    {block.connectionInfo.type.replace('_', ' ')}
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-sm text-stone-600 font-serif italic">
                    {block.connectionInfo.description}
                </span>
            </div>
            <div className="h-6 w-px bg-stone-200 mx-auto mt-2 mb-2"></div>
        </div>
    );
  };

  const renderSyntax = () => {
    const moodClass = getBlockMoodClass();
    
    return (
    <div key="syntax" className={`${moodClass} backdrop-blur-sm rounded-2xl shadow-sm border p-8 relative z-20 overflow-visible mb-10 transition-all duration-500`}>
      <div className="flex items-center mb-6 border-b border-stone-200/50 pb-2">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">
            1.0 Luồng cú pháp (Nhấn để xem)
        </h3>
        <ReorderControls sectionKey="syntax" />
      </div>
      
      {/* Token Stream */}
      <div className="flex flex-wrap items-end gap-y-6 gap-x-3 leading-loose mb-2 pt-2">
        {block.tokens.map((token) => {
            const isRelated = hoveredRelatedIds.includes(token.id);
            const tokenStyle = getTokenStyle(token);

            return (
                <div key={token.id} className="relative inline-flex group">
                    {/* ELEGANT MARKER FOR MAIN SUBJECT/PREDICATE */}
                    {token.grammaticalRole === GrammaticalRole.MAIN_SUBJECT && <RoleMarker type="gold" />}
                    {token.grammaticalRole === GrammaticalRole.MAIN_PREDICATE && <RoleMarker type="silver" />}
                    
                    <button
                    onClick={() => handleTokenClick(token)}
                    onMouseEnter={() => handleTokenEnter(token)}
                    onMouseLeave={handleTokenLeave}
                    className={`
                        px-3 py-1.5 pt-2 rounded-lg text-2xl font-serif-jp transition-all duration-200 relative z-10 whitespace-nowrap flex items-center gap-1
                        ${tokenStyle}
                        ${hoveredMappingId === token.mappingId && token.mappingId ? 'ring-2 ring-rose-300 shadow-lg -translate-y-1' : ''}
                        ${activeTokenId === token.id ? 'ring-2 ring-rose-400 shadow-xl transform scale-110 z-20' : 'hover:bg-opacity-80 hover:-translate-y-0.5'}
                        ${isRelated ? 'ring-2 ring-indigo-300 scale-105 transition-transform' : ''}
                    `}
                    >
                    {token.text}
                    
                    {/* POS ICON INDICATOR (Hide for Punctuation and Ghost) */}
                    {token.type !== PartType.PUNCTUATION && !token.isGhost && (
                       <span className="text-[9px] font-sans font-bold opacity-40 self-end mb-0.5 ml-0.5 border border-current rounded px-0.5 leading-none">
                           {getPosIcon(token.type)}
                       </span>
                    )}

                    {/* Connection Indicator Dot */}
                    {(token.relatedTokenIds?.length || 0) > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-400 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></span>
                    )}
                    </button>
                    
                    {/* GHOST LABEL BELOW */}
                    {token.isGhost && (
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-stone-400 font-sans italic whitespace-nowrap">
                            (Ẩn)
                        </span>
                    )}
                </div>
            );
        })}
      </div>

      {/* INSPECTOR PANEL */}
      {activeTokenId && activeToken && (
        <div className="mt-8 mx-auto w-full bg-stone-800 text-stone-50 rounded-xl p-6 shadow-xl animate-fade-in-up border border-stone-700 relative overflow-hidden">
            {/* Arrow visual */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 w-4 h-4 bg-stone-800 rotate-45 border-t border-l border-stone-700"></div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Headline Info */}
                <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-stone-700 pb-4 md:pb-0 md:pr-6 flex flex-col">
                    {/* PITCH ACCENT GRAPH (New Skyline Style) */}
                    {activeToken.pitchAccent && activeToken.reading && (
                         <PitchGraph 
                            binaryString={activeToken.pitchAccent} 
                            text={activeToken.reading} 
                            pattern={activeToken.pitchPattern}
                         />
                    )}

                    <div className="flex justify-between items-start mb-2">
                         <div>
                            <div className="font-bold text-rose-300 text-4xl font-serif-jp mb-2 flex items-center gap-2">
                                {activeToken.text}
                            </div>
                            
                            {/* Reading (Hiragana) */}
                            {activeToken.reading && (
                                <div className="text-stone-300 text-lg font-serif-jp font-light mb-1 flex items-center gap-1.5">
                                    {activeToken.reading}
                                    <SpeakBtn text={activeToken.reading} light />
                                </div>
                            )}

                            {/* Alternative Readings */}
                            {activeToken.alternativeReadings && activeToken.alternativeReadings.length > 0 && (
                                <div className="text-stone-400 text-xs mt-1 mb-2 bg-stone-700/50 px-2 py-1.5 rounded border border-stone-600">
                                    <span className="block text-[9px] uppercase tracking-wide opacity-70 mb-0.5">Cách đọc khác:</span>
                                    <span className="font-serif-jp text-stone-300">{activeToken.alternativeReadings.join(', ')}</span>
                                </div>
                            )}

                            {/* Romaji */}
                            <div className="text-stone-500 text-sm uppercase font-bold tracking-wider mb-2">
                                {activeToken.romaji}
                            </div>
                            
                            {/* DISPLAY HAN VIET */}
                            {activeToken.hanViet && (
                                <div className="inline-block px-2 py-0.5 rounded bg-rose-900/30 text-rose-300/90 text-sm font-serif-jp font-medium border border-rose-900/50">
                                    Hán Việt: {activeToken.hanViet}
                                </div>
                            )}
                         </div>

                         {/* SAVE BUTTON (User Hub Feature) */}
                         {onToggleSave && !activeToken.isGhost && (
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSave(activeToken);
                                }}
                                className={`
                                    flex items-center justify-center p-2 rounded-full transition-all duration-200
                                    ${isSaved?.(activeToken.id) 
                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/50' 
                                        : 'bg-stone-700 text-stone-400 hover:bg-stone-600 hover:text-white'}
                                `}
                                title={isSaved?.(activeToken.id) ? "Bỏ lưu" : "Lưu vào kho"}
                             >
                                 <svg className="w-5 h-5" fill={isSaved?.(activeToken.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                 </svg>
                             </button>
                         )}
                    </div>
                    
                    {/* TYPE & NUANCE BADGE */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <span className={`inline-block px-2 py-1 rounded text-[10px] uppercase font-bold bg-stone-700 text-stone-300 border border-stone-600`}>
                            {activeToken.type}
                        </span>
                        
                        {/* ROLE BADGES */}
                        {activeToken.grammaticalRole === GrammaticalRole.MAIN_SUBJECT && (
                            <span className="inline-block px-2 py-1 rounded text-[10px] uppercase font-bold bg-amber-900/40 text-amber-200 border border-amber-600 flex items-center gap-1">
                                <span className="text-[10px]">✦</span> Chủ đề/Chủ ngữ
                            </span>
                        )}
                        {activeToken.grammaticalRole === GrammaticalRole.MAIN_PREDICATE && (
                            <span className="inline-block px-2 py-1 rounded text-[10px] uppercase font-bold bg-slate-700 text-slate-200 border border-slate-500 flex items-center gap-1">
                                <span className="text-[10px]">✦</span> Vị ngữ chính
                            </span>
                        )}
                        {activeToken.isGhost && (
                            <span className="inline-block px-2 py-1 rounded text-[10px] uppercase font-bold bg-stone-700 text-stone-400 border border-stone-600 italic">
                                Chủ ngữ ẩn
                            </span>
                        )}
                        
                        {/* NUANCE BADGE */}
                        {activeToken.deepDive?.nuanceType && activeToken.deepDive.nuanceType !== NuanceType.NONE && (
                            <span className="inline-block px-2 py-1 rounded text-[10px] uppercase font-bold bg-indigo-900/50 text-indigo-200 border border-indigo-700">
                                {getNuanceLabel(activeToken.deepDive.nuanceType)}
                            </span>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-700/50">
                       <span className="block text-[10px] text-stone-500 uppercase tracking-wide mb-1">Ý nghĩa</span>
                       <span className="font-medium text-xl text-white leading-relaxed">{activeToken.meaning}</span>
                    </div>
                </div>

                {/* Right: Deep Dive Details */}
                <div className="md:w-2/3 flex flex-col gap-4">
                     {/* TAGS */}
                    {activeToken.deepDive?.tags && activeToken.deepDive.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {activeToken.deepDive.tags.map((tag, i) => (
                           <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTagColor(tag)}`}>
                             {formatTagLabel(tag)}
                           </span>
                        ))}
                      </div>
                    )}
                    
                    {activeToken.deepDive && (
                      <>
                        {/* Grammar / Usage Note */}
                        {activeToken.deepDive.usageNote && !activeToken.deepDive.grammaticalRule && (
                           <div className="bg-stone-700/50 p-3 rounded border border-stone-600">
                            <span className="block text-[10px] text-rose-300 uppercase font-bold mb-1">Ghi chú ngữ pháp</span>
                            <div className="text-stone-300 leading-snug text-sm">
                                {activeToken.deepDive.usageNote}
                            </div>
                          </div>
                        )}

                        {/* Dictionary & Conjugation Grid */}
                        {(activeToken.deepDive.dictionaryForm || activeToken.deepDive.conjugation) && (
                           <div className="bg-stone-900/30 p-3 rounded flex flex-col gap-3">
                              <div className="grid grid-cols-2 gap-4">
                                {activeToken.deepDive.dictionaryForm && (
                                    <div>
                                    <span className="block text-[10px] text-stone-500">Thể từ điển</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-serif-jp text-stone-200 text-lg">{activeToken.deepDive.dictionaryForm}</span>
                                        <SpeakBtn text={activeToken.deepDive.dictionaryForm} light />
                                        {activeToken.deepDive.conjugationType && (
                                            <span className="text-[10px] text-stone-500 bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700">
                                                {activeToken.deepDive.conjugationType}
                                            </span>
                                        )}
                                    </div>
                                    </div>
                                )}
                                {activeToken.deepDive.conjugation && (
                                    <div>
                                    <span className="block text-[10px] text-stone-500">Chia động từ</span>
                                    <span className="text-stone-300 text-sm font-medium">{activeToken.deepDive.conjugation}</span>
                                    </div>
                                )}
                              </div>
                              
                              {activeToken.deepDive.grammaticalRule && (
                                <div className="border-t border-stone-700/50 pt-2 mt-1">
                                    <span className="block text-[10px] text-rose-300/80 uppercase mb-1">Quy tắc chia</span>
                                    <p className="text-xs text-stone-400 italic leading-relaxed">
                                        "{activeToken.deepDive.grammaticalRule}"
                                    </p>
                                </div>
                              )}
                           </div>
                        )}

                        {/* Verb Anatomy - Main */}
                        {activeToken.deepDive.verbComponents && (
                          <div className="pt-2 border-t border-stone-700">
                             <VerbDecomposition components={activeToken.deepDive.verbComponents} />
                          </div>
                        )}
                      </>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
    );
  };

  const renderAnatomy = () => (
    <div key="anatomy" className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 overflow-hidden shadow-sm mb-10 relative transition-all duration-300">
      <div className="px-8 py-4 bg-stone-50/80 border-b border-stone-100 flex justify-between items-center">
        <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                2.0 Giải phẫu từ vựng & Cấu trúc
            </h3>
            <span className="text-[10px] font-normal normal-case text-stone-400">Chia nhỏ theo mệnh đề, Thành phần & Ngữ pháp</span>
        </div>
        <ReorderControls sectionKey="anatomy" />
      </div>
      
      {/* --- GRAMMAR STRUCTURE BUTTONS (Layer 2 Header) --- */}
      {block.grammarStructures && block.grammarStructures.length > 0 && (
          <div className="px-8 pt-6 pb-2">
             <div className="flex flex-wrap gap-2 items-center">
                 <span className="text-[10px] font-bold text-stone-400 uppercase mr-2">Cấu trúc ngữ pháp:</span>
                 {block.grammarStructures.map((grammar, idx) => (
                     <button
                        key={idx}
                        onClick={() => setSelectedGrammar(prev => prev === grammar ? null : grammar)}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm transition-all active:scale-95 group border
                            ${selectedGrammar === grammar 
                                ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200' 
                                : 'bg-white text-indigo-800 border-indigo-200 hover:border-indigo-300 hover:shadow-md'}
                        `}
                     >
                         <span className={`w-2 h-2 rounded-full ${selectedGrammar === grammar ? 'bg-white' : 'bg-indigo-400 group-hover:animate-pulse'}`}></span>
                         <span className="font-serif-jp font-bold">{grammar.structure}</span>
                         {grammar.jlpt && (
                             <span className={`text-[9px] px-1 rounded ml-1 font-sans ${selectedGrammar === grammar ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                {grammar.jlpt}
                             </span>
                         )}
                     </button>
                 ))}
             </div>
          </div>
      )}

      {/* --- EMBEDDED INSPECTOR DASHBOARD --- */}
      {selectedGrammar && (
          <div className="mx-8 mt-4 mb-6 animate-fade-in-up">
             <div className="bg-indigo-50/30 rounded-2xl border border-indigo-100/50 p-6 relative overflow-hidden group-hover:border-indigo-200 transition-colors">
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedGrammar(null)}
                  className="absolute top-4 right-4 p-1.5 bg-white/50 hover:bg-white text-stone-400 hover:text-rose-500 rounded-full transition-colors border border-transparent hover:border-stone-100"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* SAVE GRAMMAR BUTTON */}
                {onToggleSaveGrammar && (
                    <button 
                        onClick={() => onToggleSaveGrammar(selectedGrammar)}
                        className={`absolute top-4 right-12 p-1.5 rounded-full transition-all border
                            ${isGrammarSaved?.(selectedGrammar) // Using the whole object now
                                ? 'bg-rose-500 text-white border-rose-600 shadow-md' 
                                : 'bg-white/50 hover:bg-white text-stone-400 hover:text-rose-500 border-transparent hover:border-stone-100'}
                        `}
                        title={isGrammarSaved?.(selectedGrammar) ? "Đã lưu vào kho ngữ pháp" : "Lưu ngữ pháp"}
                    >
                         <svg className="w-4 h-4" fill={isGrammarSaved?.(selectedGrammar) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                )}

                {/* Content Grid */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    {/* Left: Structure Visualization */}
                    <div className="md:w-1/3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-indigo-100 pb-4 md:pb-0 md:pr-6">
                        <div className="mb-2">
                             <div className="text-xs text-indigo-400 font-serif-jp mb-1 pl-1">
                                {selectedGrammar.reading}
                             </div>
                             <h3 className="text-3xl font-serif-jp font-bold text-indigo-900 leading-none flex items-center gap-2">
                                {selectedGrammar.structure}
                                <SpeakBtn text={selectedGrammar.reading || selectedGrammar.structure} size="md" />
                             </h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedGrammar.jlpt && (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                    {selectedGrammar.jlpt}
                                </span>
                            )}
                            {selectedGrammar.hanViet && (
                                <span className="px-2 py-0.5 rounded bg-white border border-rose-100 text-rose-500 text-[10px] font-bold uppercase">
                                    Hán Việt: {selectedGrammar.hanViet}
                                </span>
                            )}
                        </div>

                         {/* Construction Box */}
                         {selectedGrammar.construction && (
                             <div className="mt-4 bg-white/60 rounded-lg p-3 border border-indigo-50 shadow-sm">
                                <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest block mb-2">
                                    Cấu trúc (Công thức)
                                </span>
                                {/* Use GrammarFormula instead of plain code block */}
                                <GrammarFormula rule={selectedGrammar.construction} />
                            </div>
                        )}
                    </div>

                    {/* Right: Meaning & Usage */}
                    <div className="md:w-2/3 flex flex-col justify-center gap-4">
                        <div>
                            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Ý nghĩa
                            </h4>
                            <p className="text-lg text-stone-700 font-medium font-serif leading-relaxed">
                                {selectedGrammar.meaning}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                Cách dùng & Ngữ cảnh
                            </h4>
                            <p className="text-sm text-stone-600 leading-relaxed">
                                {selectedGrammar.usage}
                            </p>
                        </div>
                    </div>
                </div>
             </div>
          </div>
      )}
      
      {!settings.hideAnatomyTokens && (
      <div className="border-t border-stone-100 divide-y divide-stone-100">
        {clauses.map((clause) => (
          <div key={clause.id} className="p-8">
            <h4 className="text-sm font-bold text-stone-800 mb-6 flex items-center gap-2">
               <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-xs">{clause.title}</span>
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {clause.tokens.filter(t => t.type !== PartType.PUNCTUATION).map((token) => (
                <div 
                   key={token.id} 
                   className={`
                     flex flex-col items-center p-4 rounded-xl border transition-all duration-200 relative group
                     ${hoveredMappingId === token.mappingId && token.mappingId 
                        ? 'bg-rose-50 border-rose-200 shadow-md' 
                        : 'bg-white border-stone-100 hover:border-stone-300 hover:shadow-sm'}
                     ${token.isGhost ? 'opacity-70 border-dashed bg-stone-50' : ''}
                   `}
                >
                   <span className="text-3xl font-serif-jp text-stone-800 mb-1">{token.text}</span>
                   <span className="text-xs font-mono text-stone-400 mb-3 flex items-center gap-1">{token.romaji} <SpeakBtn text={token.reading || token.text} /></span>
                   
                   <div className="w-full h-px bg-stone-100 mb-3 group-hover:bg-stone-200"></div>
                   
                   <span className="text-sm font-bold text-stone-600 text-center leading-tight mb-2 min-h-[1.25rem]">
                     {token.meaning}
                   </span>
                   
                   <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-tight text-center w-full ${getRoleBadgeColor(token.type)}`}>
                     {token.roleDescription}
                   </span>
                   
                   {/* Verb Anatomy embedded directly in the card if available */}
                   {token.deepDive?.verbComponents && (
                        <div className="w-full mt-2 pt-2 border-t border-stone-100">
                            <VerbDecomposition components={token.deepDive.verbComponents} compact={true} />
                        </div>
                   )}
                   
                   {/* Icon in anatomy view */}
                   <span className="absolute top-2 right-2 text-[8px] opacity-30 font-bold border rounded px-0.5">{getPosIcon(token.type)}</span>
                   
                   {/* Marker for Anatomy View */}
                   {token.grammaticalRole === GrammaticalRole.MAIN_SUBJECT && (
                       <span className="absolute -top-1.5 -right-1.5 text-amber-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg></span>
                   )}
                   {token.grammaticalRole === GrammaticalRole.MAIN_PREDICATE && (
                       <span className="absolute -top-1.5 -right-1.5 text-slate-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg></span>
                   )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );

  const renderMapping = () => (
      // ... existing logic ...
    <div key="mapping" className="bg-stone-50 rounded-2xl border border-stone-200 p-10 flex flex-col items-center text-center shadow-inner mb-10 relative group">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
         <ReorderControls sectionKey="mapping" />
      </div>
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">
        3.0 Ánh xạ ngữ cảnh
      </h3>
      <p className="text-2xl text-stone-700 leading-relaxed font-serif max-w-3xl cursor-default">
        {block.translation.mappings?.map((segment, idx) => (
           <span 
              key={idx}
              onMouseEnter={() => handleMappingEnter(segment.id)}
              onMouseLeave={() => setHoveredMappingId(null)}
              className={`
                 transition-all duration-200 rounded px-1.5 py-0.5 mx-0.5 border border-transparent
                 ${hoveredMappingId === segment.id && segment.id 
                    ? 'bg-rose-200 text-rose-900 border-rose-300 font-medium shadow-sm' 
                    : 'hover:bg-stone-200 hover:border-stone-300'}
              `}
           >
             {segment.text}
           </span>
        ))}
      </p>
      <div className="mt-8 flex items-center gap-2 text-xs text-stone-400">
         <span className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold serif">i</span>
         Di chuột qua từ tiếng Việt để làm nổi bật từ tiếng Nhật tương ứng.
      </div>
    </div>
  );

  const sectionMap = {
    'syntax': renderSyntax,
    'anatomy': renderAnatomy,
    'mapping': renderMapping
  };

  return (
    <div className="w-full">
      {/* RENDER CONNECTION INFO AT TOP */}
      {renderConnectionInfo()}

      {/* COMPREHENSIVE LEGEND */}
      <div className="bg-white/50 backdrop-blur rounded-xl p-6 border border-stone-200 shadow-sm mb-10">
        <div className="flex flex-col gap-6">
            
            <div className="flex flex-col md:flex-row gap-8">
                {/* POS LEGEND */}
                <div className="flex-1">
                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 border-b border-stone-100 pb-1">
                        Loại từ (Ký hiệu)
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs text-stone-600">
                        <div className="flex items-center gap-1.5"><span className="w-5 text-center font-bold border rounded bg-white">N</span> Danh từ</div>
                        <div className="flex items-center gap-1.5"><span className="w-5 text-center font-bold border rounded bg-white">V</span> Động từ</div>
                        <div className="flex items-center gap-1.5"><span className="w-5 text-center font-bold border rounded bg-white">A</span> Tính từ</div>
                        <div className="flex items-center gap-1.5"><span className="w-5 text-center font-bold border rounded bg-white">P</span> Trợ từ</div>
                        <div className="flex items-center gap-1.5"><span className="w-5 text-center font-bold border rounded bg-white">C</span> Liên từ</div>
                        <div className="flex items-center gap-1.5"><span className="w-5 text-center font-bold border rounded bg-white">X</span> Trợ động từ</div>
                    </div>
                </div>
                
                {/* STANDARD TYPE LEGEND */}
                <div className="flex-1">
                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 border-b border-stone-100 pb-1">
                        Màu sắc cơ bản
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600">
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-300"></span> Động từ</div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-100 border border-teal-300"></span> Tính từ</div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-violet-100 border border-violet-300"></span> Trợ động từ</div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-100 border border-rose-300"></span> Trợ từ</div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></span> Liên từ</div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-stone-100 border border-stone-300"></span> Danh từ/Khác</div>
                    </div>
                </div>
            </div>

            {/* NUANCE LEGEND (UPDATED) */}
            <div className="w-full">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 border-b border-stone-100 pb-1">
                    Sắc thái & Ngữ pháp (Màu đặc biệt)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 text-xs text-stone-600">
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                        <span className="border-b-2 border-amber-400">Chủ đề/Chủ ngữ</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                        <span className="border-b-2 border-slate-400">Vị ngữ chính</span>
                    </div>
                    <div className="flex items-center gap-1.5"><span className="w-4 h-4 border border-dashed border-stone-400 text-[9px] flex items-center justify-center text-stone-400">(A)</span> Chủ ngữ ẩn</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></span> Kính ngữ/Khiêm</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-100 border border-rose-300"></span> Cho/Nhận</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-pink-100 border border-pink-200"></span> Cảm thán/Vĩ tố</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></span> Ý chí/Rủ rê</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-300"></span> Bị động</div>
                    
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300"></span> Sai khiến</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-100 border border-cyan-300"></span> Khả năng</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-fuchsia-100 border border-fuchsia-300"></span> Phỏng đoán/Chắc chắn</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-300 font-bold"></span> Giới hạn/Nhấn mạnh</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200"></span> Thời thì/Trạng thái</div>

                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-zinc-200 border border-zinc-400"></span> Hối tiếc/Lỡ làm</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-300 border-dashed"></span> Bắt buộc</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300 font-bold"></span> Điều kiện</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-100 border border-sky-300 font-bold"></span> Nguyên nhân</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300 font-bold"></span> Tương phản</div>

                    {/* New Items */}
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-pink-100 border border-pink-300"></span> Mong muốn/Hy vọng</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-100 border border-teal-300"></span> Mục đích</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-violet-100 border border-violet-300"></span> So sánh</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-fuchsia-100 border border-fuchsia-300"></span> Thay đổi/Biến đổi</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-50 border border-red-400 border-double"></span> Cho phép/Cấm chỉ</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-300 border border-gray-500"></span> Phủ định</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-100 border border-sky-300 italic"></span> Trích dẫn</div>
                </div>
            </div>
        </div>
      </div>

      {/* RENDER SECTIONS BASED ON ORDER */}
      {sectionOrder.map(key => sectionMap[key]())}

    </div>
  );
};

export default SentenceBlock;
