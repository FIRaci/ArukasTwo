import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SettingsPanel from '../components/SettingsPanel';
import TutorialPanel from '../components/TutorialPanel';
import { useSettings } from '../contexts/SettingsContext';
import {
  VocabEntry,
  VocabLevel,
  VOCAB_BY_LEVEL,
  VOCAB_LEVEL_INFO,
  loadExtendedDictionary,
  isExtendedLoaded,
  getAllTags,
  getAllTypes,
} from '../data/vocabData';
import { IDEOPHONES_DATA } from '../data/ideophonesList';
import { conjugateVerb, isVerbType, CONJUGATION_LABELS } from '../data/verbConjugation';
import { speakJapaneseText, stopJapaneseTts } from '../services/googleTtsService';
import type { ConjugationForms } from '../data/verbConjugation';

// --- TTS Speaker Button ---
const SpeakBtn: React.FC<{ text: string; size?: 'sm' | 'md' }> = ({ text, size = 'sm' }) => {
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
            playing ? 'bg-rose-100 text-rose-500 animate-pulse' : 'text-stone-300 hover:text-stone-600 hover:bg-stone-100'
        }`} title={`Ph\u00e1t \u00e2m: ${text}`}>
            {playing ? (
                <svg className={ic} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
                <svg className={ic} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5.586v12.828a1 1 0 01-1.707.707L5.586 15z" /></svg>
            )}
        </button>
    );
};

// ============================================================================
// Constants
// ============================================================================

const LEVELS: VocabLevel[] = ['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'];
const ITEMS_PER_PAGE = 40;
const BOOKMARK_KEY = 'arukas-vocab-bookmarks';

// ============================================================================
// Bookmark helpers (localStorage)
// ============================================================================

function loadBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveBookmarks(ids: Set<string>) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...ids]));
}

// ============================================================================
// Sub-components
// ============================================================================

const RelatedList: React.FC<{ label: string; items?: { word: string; reading: string; meaning: string }[]; color: string }> = ({ label, items, color }) => {
  if (!items || items.length === 0) return null;
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  const cls = colorMap[color] || colorMap.blue;

  return (
    <div className="mb-2">
      <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {items.map((it, i) => (
          <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${cls}`}>
            <span className="font-serif-jp font-medium">{it.word}</span>
            <SpeakBtn text={it.word} />
            <span className="opacity-60">({it.reading})</span>
            <span className="opacity-80">— {it.meaning}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Verb Conjugation Table ──
const ConjugationTable: React.FC<{ forms: ConjugationForms }> = ({ forms }) => (
  <div>
    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Chia động từ</span>
    <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
      {CONJUGATION_LABELS.map(({ key, label, labelJp }) => (
        <div key={key} className="flex items-baseline gap-2 py-1 border-b border-stone-50">
          <span className="text-[11px] text-stone-500 w-28 flex-shrink-0 truncate" title={`${label} (${labelJp})`}>
            {label} <span className="text-stone-300 font-serif-jp">{labelJp}</span>
          </span>
          <span className="text-sm font-serif-jp text-stone-800 inline-flex items-center gap-1">{forms[key]} <SpeakBtn text={forms[key]} /></span>
        </div>
      ))}
    </div>
  </div>
);

const VocabCard: React.FC<{
  entry: VocabEntry;
  isExpanded: boolean;
  onToggle: () => void;
  isBookmarked: boolean;
  onBookmark: () => void;
}> = React.memo(({ entry, isExpanded, onToggle, isBookmarked, onBookmark }) => {
  // JLPT badge color
  const jlptColor: Record<string, string> = {
    N5: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    N4: 'bg-sky-50 text-sky-600 border-sky-200',
    N3: 'bg-violet-50 text-violet-600 border-violet-200',
    N2: 'bg-amber-50 text-amber-600 border-amber-200',
    N1: 'bg-rose-50 text-rose-600 border-rose-200',
  };

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 ${isExpanded ? 'border-rose-300 shadow-lg ring-1 ring-rose-100' : 'border-stone-200 hover:border-rose-200 hover:shadow-md'}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={onToggle}>
        {/* Word */}
        <div className="flex-shrink-0 min-w-0">
          <div className="text-2xl font-serif-jp text-stone-800 leading-tight flex items-center gap-1.5">{entry.word} <SpeakBtn text={entry.reading || entry.word} size="md" /></div>
          {entry.reading && <div className="text-xs text-stone-400 font-serif-jp">{entry.reading}</div>}
        </div>

        {/* Meaning + romaji */}
        <div className="flex-1 min-w-0 ml-2">
          {entry.meaning ? (
            <>
              <div className="text-sm font-medium text-stone-700 truncate">{entry.meaning}</div>
              {entry.romaji && <div className="text-[11px] text-stone-400 font-mono">{entry.romaji}</div>}
            </>
          ) : (
            <div className="text-xs text-stone-400 italic">Chưa có nghĩa</div>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {entry.hanViet && (
            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">{entry.hanViet}</span>
          )}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${jlptColor[entry.jlpt] || 'bg-stone-50 text-stone-500 border-stone-200'}`}>{entry.jlpt}</span>
          {entry.type && <span className="text-[10px] text-stone-500 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100 hidden sm:inline">{entry.type}</span>}
        </div>

        {/* Bookmark */}
        <button
          onClick={e => { e.stopPropagation(); onBookmark(); }}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${isBookmarked ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-stone-300 hover:text-amber-400 hover:bg-stone-50'}`}
          title={isBookmarked ? 'Bỏ lưu' : 'Lưu từ này'}
        >
          <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {/* Expand chevron */}
        <svg className={`w-4 h-4 text-stone-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Tags row (always visible, only if tags exist) */}
      {entry.tags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {entry.tags.map((tag, i) => (
            <span key={i} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-stone-100 px-4 py-4 space-y-3 animate-fade-in-up">

          {/* ── Full Meaning Section — prominent display ── */}
          {entry.meaning && (
            <div className="bg-gradient-to-r from-rose-50/60 to-amber-50/40 rounded-lg px-4 py-3 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Nghĩa</span>
              <div className="text-base text-stone-800 font-medium mt-0.5 leading-relaxed">{entry.meaning}</div>
            </div>
          )}

          {/* ── Word Info Card — always visible ── */}
          <div className="bg-stone-50/80 rounded-lg px-3 py-2.5 border border-stone-100 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-stone-600">
            {entry.type && (
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-stone-500 whitespace-nowrap">Loại:</span>
                <span className="text-stone-700 font-medium">{entry.type}</span>
              </div>
            )}
            {entry.reading && (
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-stone-500 whitespace-nowrap">Đọc:</span>
                <span className="font-serif-jp text-stone-700">{entry.reading}</span>
              </div>
            )}
            {entry.romaji && (
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-stone-500 whitespace-nowrap">Romaji:</span>
                <span className="font-mono text-stone-700">{entry.romaji}</span>
              </div>
            )}
            {entry.hanViet && (
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-stone-500 whitespace-nowrap">Hán Việt:</span>
                <span className="text-rose-600 font-medium">{entry.hanViet}</span>
              </div>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-stone-500 whitespace-nowrap">JLPT:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${jlptColor[entry.jlpt] || 'bg-stone-50 text-stone-500 border-stone-200'}`}>{entry.jlpt}</span>
            </div>
            {entry.word !== entry.reading && !isNaN(entry.word.charCodeAt(0)) && entry.word.length > 0 && (
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-stone-500 whitespace-nowrap">Chữ:</span>
                <span className="text-stone-700">{entry.word.length} ký tự</span>
              </div>
            )}
          </div>

          {/* Examples */}
          {entry.examples.length > 0 && (
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ví dụ</span>
              <div className="mt-1 space-y-2">
                {entry.examples.map((ex, i) => (
                  <div key={i} className="bg-stone-50 rounded-lg px-3 py-2 border border-stone-100">
                    <div className="text-sm font-serif-jp text-stone-800 flex items-center gap-1.5">{ex.jp} <SpeakBtn text={ex.jp} /></div>
                    <div className="text-xs text-stone-400 font-serif-jp mt-0.5">{ex.reading}</div>
                    <div className="text-xs text-stone-600 mt-0.5">{ex.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verb Conjugation Table */}
          {isVerbType(entry.type) && (() => {
            const forms = conjugateVerb(entry.word, entry.reading, entry.type);
            return forms ? <ConjugationTable forms={forms} /> : null;
          })()}

          {/* Synonyms / Antonyms / Phrases / Related */}
          <RelatedList label="Từ đồng nghĩa" items={entry.synonyms} color="blue" />
          <RelatedList label="Từ trái nghĩa" items={entry.antonyms} color="red" />
          <RelatedList label="Cụm từ" items={entry.phrases} color="green" />
          <RelatedList label="Từ liên quan" items={entry.related} color="purple" />

          {/* Notes */}
          {entry.notes && (
            <div className="text-xs text-stone-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 italic">
              {entry.notes}
            </div>
          )}

          {/* Empty state — only when there is truly nothing else */}
          {entry.examples.length === 0 && !isVerbType(entry.type) && !entry.synonyms?.length && !entry.antonyms?.length && !entry.phrases?.length && !entry.related?.length && !entry.notes && (
            <div className="text-[11px] text-stone-400 italic text-center py-1">
              Chưa có ví dụ và thông tin bổ sung cho từ này
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// Ideophones Reference Section
// ============================================================================

const IdeophonesSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [ideoSearch, setIdeoSearch] = useState('');

  const filtered = useMemo(() => {
    if (!ideoSearch.trim()) return IDEOPHONES_DATA;
    const q = ideoSearch.trim().toLowerCase();
    return IDEOPHONES_DATA.filter(
      e => e.romaji.toLowerCase().includes(q) || e.kana.includes(q) || e.meaning.toLowerCase().includes(q)
    );
  }, [ideoSearch]);

  return (
    <div className="max-w-6xl mx-auto px-6 pb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl px-5 py-3 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🔊</span>
          <span className="font-bold text-indigo-700">擬音語・擬態語 — Từ tượng thanh / tượng hình</span>
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{IDEOPHONES_DATA.length} mục</span>
        </div>
        <svg className={`w-5 h-5 text-indigo-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 bg-white border border-indigo-100 rounded-xl p-5 shadow-inner">
          {/* Search */}
          <input
            type="text"
            value={ideoSearch}
            onChange={e => setIdeoSearch(e.target.value)}
            placeholder="Tìm kiếm (romaji, kana hoặc nghĩa)..."
            className="w-full border border-stone-200 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
          <div className="text-xs text-stone-400 mb-3">{filtered.length} / {IDEOPHONES_DATA.length} mục</div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((e, i) => (
              <div key={i} className="flex gap-2 p-2.5 rounded-lg border border-stone-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                <div className="flex flex-col shrink-0">
                  <span className="font-bold text-indigo-600 text-sm">{e.kana}</span>
                  <span className="font-mono text-[10px] text-indigo-400">{e.romaji}</span>
                </div>
                <span className="text-xs text-stone-600 leading-relaxed">{e.meaning}</span>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-stone-400 text-sm py-4">Không tìm thấy từ tượng thanh phù hợp.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main DictionaryPage
// ============================================================================

// Word type groups for visual filter panel
const TYPE_GROUPS: { label: string; types: string[] }[] = [
  { label: 'Loại từ cơ bản', types: ['Danh từ', 'Động từ nhóm 1', 'Động từ nhóm 2', 'Động từ nhóm 3', 'Động từ', 'Tính từ -i', 'Tính từ -na', 'Tính từ'] },
  { label: 'Từ chức năng', types: ['Phó từ', 'Liên từ', 'Trợ từ', 'Lượng từ', 'Nghi vấn từ'] },
  { label: 'Từ đặc biệt', types: ['Quán dụng ngữ', 'Thành ngữ', 'Cụm từ', 'Tiền tố', 'Hậu tố', 'Từ tượng thanh', 'Từ viết tắt'] },
];

const TAG_GROUPS: { label: string; tags: string[] }[] = [
  { label: 'Đời sống', tags: ['Gia đình', 'Nhà cửa', 'Thực phẩm', 'Rau củ', 'Hải sản', 'Món ăn', 'Đồ uống', 'Mua sắm', 'Thời trang'] },
  { label: 'Giao tiếp', tags: ['Tính cách', 'Cảm xúc', 'Hành động', 'Cơ thể', 'Sức khỏe', 'Tình yêu', 'Y tế'] },
  { label: 'Công việc', tags: ['Công việc', 'Kinh doanh', 'IT', 'Coding', 'System', 'Network', 'Security', 'Testing', 'Data', 'Process', 'User', 'Document'] },
  { label: 'Du lịch & Địa lý', tags: ['Du lịch', 'Giao thông', 'Địa lý', 'Quốc gia'] },
  { label: 'Văn hóa', tags: ['Nghệ thuật', 'Âm nhạc', 'Sở thích', 'Truyền thông', 'Giải trí', 'Game', 'Fantasy', 'Anime'] },
  { label: 'Ngôn ngữ', tags: ['Onomatopoeia', 'Idioms', 'Yojijukugo', 'Kansai', 'Keigo', 'Kanji', 'Đếm'] },
];

const DictionaryPage: React.FC = () => {
  const { openSettings } = useSettings();
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  // ── State ──
  const [level, setLevel] = useState<VocabLevel>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [typeFilter, setTypeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks);
  const [isDictLoaded, setIsDictLoaded] = useState<boolean>(() => isExtendedLoaded());
  const [isDictLoading, setIsDictLoading] = useState(false);

  // ── Derived ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allTags = useMemo(() => getAllTags(), [isDictLoaded]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allTypes = useMemo(() => getAllTypes(), [isDictLoaded]);

  // Persist bookmarks
  useEffect(() => { saveBookmarks(bookmarks); }, [bookmarks]);

  // Reset page on filter change
  // Debounce search input by 200ms
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 200);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search]);

  useEffect(() => { setPage(1); }, [level, debouncedSearch, typeFilter, tagFilter, showBookmarksOnly]);

  const handleLoadExtendedDictionary = useCallback(async () => {
    if (isDictLoaded || isDictLoading) return;

    setIsDictLoading(true);
    try {
      await loadExtendedDictionary();
      setIsDictLoaded(true);
    } catch {
      // keep silent in UI; console is handled in vocabData loader
    } finally {
      setIsDictLoading(false);
    }
  }, [isDictLoaded, isDictLoading]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ── Filtered vocabulary ──
  const filtered = useMemo(() => {
    let data = VOCAB_BY_LEVEL[level];
    if (showBookmarksOnly) {
      data = data.filter(v => bookmarks.has(v.id));
    }
    if (typeFilter) {
      data = data.filter(v => v.type === typeFilter);
    }
    if (tagFilter) {
      data = data.filter(v => v.tags.includes(tagFilter));
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      data = data.filter(v =>
        v.word.includes(q) ||
        v.reading.includes(q) ||
        v.romaji.toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q) ||
        (v.hanViet && v.hanViet.toLowerCase().includes(q))
      );
    }
    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, debouncedSearch, typeFilter, tagFilter, showBookmarksOnly, bookmarks, isDictLoaded]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageData = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setTagFilter('');
    setShowBookmarksOnly(false);
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#FAFAF5] relative overflow-hidden">
      <SettingsPanel />
      <TutorialPanel isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#FAFAF5]/80 backdrop-blur-md border-b border-stone-200/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🌸</span>
              <h1 className="text-xl font-bold tracking-tight text-stone-800 font-serif-jp">Aruka<span className="text-rose-400">S</span></h1>
            </Link>
            <span className="text-stone-300 mx-2">|</span>
            <span className="text-sm font-medium text-stone-500">Từ điển</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/reference"
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Tham khảo
            </Link>
            <Link
              to="/grammar"
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Ngữ pháp
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Phân tích
            </Link>
            <button onClick={() => setIsTutorialOpen(true)} className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all border border-stone-200 shadow-sm" title="Hướng dẫn" aria-label="Hướng dẫn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01" /></svg>
            </button>
            <button onClick={openSettings} className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all border border-stone-200 shadow-sm" title="Cài đặt" aria-label="Cài đặt">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 mt-10 mb-6 text-center">
        <h2 className="text-3xl font-serif-jp font-light text-stone-800 mb-2">Từ điển tiếng Nhật</h2>
        <p className="text-stone-500 font-light">
          {VOCAB_LEVEL_INFO[level].subtitle} — <span className="font-medium text-rose-500">{filtered.length}</span> từ
        </p>
        <div className="mt-3">
          {isDictLoaded ? (
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
              Đã nạp từ điển mở rộng
            </span>
          ) : (
            <button
              onClick={handleLoadExtendedDictionary}
              disabled={isDictLoading}
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isDictLoading ? 'Đang nạp dữ liệu mở rộng...' : 'Nạp thêm từ điển mở rộng (on-demand)'}
            </button>
          )}
        </div>
      </div>

      {/* Level tabs */}
      <div className="max-w-6xl mx-auto px-6 mb-4">
        <div className="flex gap-1 p-1 bg-stone-100 rounded-xl w-fit mx-auto">
          {LEVELS.map(lv => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                level === lv
                  ? 'bg-white text-stone-800 shadow-sm border border-stone-200'
                  : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              {lv === 'ALL' ? `Tất cả (${VOCAB_BY_LEVEL[lv].length})` : `${lv} (${VOCAB_BY_LEVEL[lv].length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-6xl mx-auto px-6 mb-6">
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm từ... (漢字, ひらがな, romaji, nghĩa, Hán Việt)"
                className="w-full pl-10 pr-8 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-lg">×</button>
              )}
            </div>

            {/* Filter panel toggle */}
            <button
              onClick={() => setShowFilterPanel(v => !v)}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${
                (typeFilter || tagFilter)
                  ? 'bg-violet-50 text-violet-600 border-violet-200'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-violet-200 hover:text-violet-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              {typeFilter || tagFilter
                ? <>{typeFilter && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px]">{typeFilter}</span>}
                     {tagFilter && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">{tagFilter}</span>}</>
                : 'Bộ lọc'}
            </button>

            {/* Bookmark filter */}
            <button
              onClick={() => setShowBookmarksOnly(v => !v)}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${
                showBookmarksOnly
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-amber-200 hover:text-amber-500'
              }`}
            >
              <svg className="w-4 h-4" fill={showBookmarksOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Đã lưu ({bookmarks.size})
            </button>
          </div>

          {/* Filter panel (collapsible) */}
          {showFilterPanel && (
            <div className="mt-3 pt-3 border-t border-stone-100 animate-fade-in-up space-y-4">
              {/* Type filters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Loại từ</span>
                  {typeFilter && <button onClick={() => setTypeFilter('')} className="text-[10px] text-rose-400 hover:text-rose-600">Bỏ chọn</button>}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    onClick={() => setTypeFilter('')}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      !typeFilter
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-rose-300 hover:text-rose-500'
                    }`}
                  >
                    Tất cả
                  </button>
                </div>
                {TYPE_GROUPS.map(group => {
                  const available = group.types.filter(t => allTypes.includes(t));
                  if (available.length === 0) return null;
                  return (
                    <div key={group.label} className="mb-2">
                      <span className="text-[10px] text-stone-400 font-medium">{group.label}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {available.map(t => (
                          <button
                            key={t}
                            onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                            className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                              typeFilter === t
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300 hover:text-emerald-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {/* Types not in any group */}
                {(() => {
                  const groupedTypes = TYPE_GROUPS.flatMap(g => g.types);
                  const ungrouped = allTypes.filter(t => !groupedTypes.includes(t));
                  if (ungrouped.length === 0) return null;
                  return (
                    <div className="mb-2">
                      <span className="text-[10px] text-stone-400 font-medium">📌 Khác</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {ungrouped.map(t => (
                          <button
                            key={t}
                            onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                            className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                              typeFilter === t
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300 hover:text-emerald-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Divider */}
              <div className="border-t border-stone-100" />

              {/* Tag filters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Chủ đề</span>
                  {tagFilter && <button onClick={() => setTagFilter('')} className="text-[10px] text-rose-400 hover:text-rose-600">Bỏ chọn</button>}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    onClick={() => setTagFilter('')}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      !tagFilter
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-rose-300 hover:text-rose-500'
                    }`}
                  >
                    Tất cả
                  </button>
                </div>
                {TAG_GROUPS.map(group => {
                  const available = group.tags.filter(t => allTags.includes(t));
                  if (available.length === 0) return null;
                  return (
                    <div key={group.label} className="mb-2">
                      <span className="text-[10px] text-stone-400 font-medium">{group.label}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {available.map(t => (
                          <button
                            key={t}
                            onClick={() => setTagFilter(tagFilter === t ? '' : t)}
                            className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                              tagFilter === t
                                ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                                : 'bg-white text-stone-600 border-stone-200 hover:border-purple-300 hover:text-purple-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {/* Tags not in any group */}
                {(() => {
                  const groupedTags = TAG_GROUPS.flatMap(g => g.tags);
                  const ungrouped = allTags.filter(t => !groupedTags.includes(t));
                  if (ungrouped.length === 0) return null;
                  return (
                    <div className="mb-2">
                      <span className="text-[10px] text-stone-400 font-medium">📌 Khác</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {ungrouped.map(t => (
                          <button
                            key={t}
                            onClick={() => setTagFilter(tagFilter === t ? '' : t)}
                            className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                              tagFilter === t
                                ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                                : 'bg-white text-stone-600 border-stone-200 hover:border-purple-300 hover:text-purple-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Active filters summary */}
          {(search || typeFilter || tagFilter || showBookmarksOnly) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100">
              <span className="text-xs text-stone-400">Bộ lọc:</span>
              {search && <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full border border-sky-100">"{search}"</span>}
              {typeFilter && <button onClick={() => setTypeFilter('')} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors">✕ {typeFilter}</button>}
              {tagFilter && <button onClick={() => setTagFilter('')} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors">✕ {tagFilter}</button>}
              {showBookmarksOnly && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">Đã lưu</span>}
              <button onClick={clearFilters} className="text-xs text-rose-400 hover:text-rose-600 ml-auto">Xóa tất cả</button>
            </div>
          )}
        </div>
      </div>

      {/* Vocabulary cards */}
      <div className="max-w-6xl mx-auto px-6 pb-6">
        {pageData.length > 0 ? (
          <div className="space-y-2">
            {pageData.map(entry => (
              <VocabCard
                key={entry.id}
                entry={entry}
                isExpanded={expandedId === entry.id}
                onToggle={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
                isBookmarked={bookmarks.has(entry.id)}
                onBookmark={() => toggleBookmark(entry.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 text-stone-300">—</div>
            <p className="text-stone-500 mb-2">Không tìm thấy từ vựng phù hợp.</p>
            {!isDictLoaded && (
              <button
                onClick={handleLoadExtendedDictionary}
                disabled={isDictLoading}
                className="text-sm text-indigo-500 hover:underline mr-3 disabled:opacity-60"
              >
                {isDictLoading ? 'Đang nạp từ điển mở rộng...' : 'Nạp từ điển mở rộng để tìm thêm'}
              </button>
            )}
            <button onClick={clearFilters} className="text-sm text-rose-500 hover:underline">Xóa bộ lọc</button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="max-w-6xl mx-auto px-6 pb-10">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    page === pageNum
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-stone-500 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
            <span className="text-xs text-stone-400 ml-2">Trang {page}/{totalPages}</span>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <div className="bg-stone-100/50 rounded-xl border border-stone-200/50 p-4 flex flex-wrap gap-4 justify-center text-xs text-stone-500">
          <span>N5: <span className="font-bold text-emerald-600">{VOCAB_BY_LEVEL.N5.length}</span></span>
          <span className="text-stone-300">|</span>
          <span>N4: <span className="font-bold text-sky-600">{VOCAB_BY_LEVEL.N4.length}</span></span>
          <span className="text-stone-300">|</span>
          <span>N3: <span className="font-bold text-violet-600">{VOCAB_BY_LEVEL.N3.length}</span></span>
          <span className="text-stone-300">|</span>
          <span>N2: <span className="font-bold text-amber-600">{VOCAB_BY_LEVEL.N2.length}</span></span>
          <span className="text-stone-300">|</span>
          <span>N1: <span className="font-bold text-rose-600">{VOCAB_BY_LEVEL.N1.length}</span></span>
          <span className="text-stone-300">|</span>
          <span>Tổng: <span className="font-bold text-rose-500">{VOCAB_BY_LEVEL.ALL.length}</span></span>
          <span className="text-stone-300">|</span>
          <span>Đã lưu: <span className="font-bold text-amber-500">{bookmarks.size}</span></span>
        </div>
      </div>

      {/* Ideophones Reference Section */}
      <IdeophonesSection />

      {/* Footer */}
      <footer className="py-10 text-center text-stone-400 text-sm font-serif italic border-t border-stone-200/50">
        Created by FIRaci —{' '}
        <Link to="/" className="text-rose-400 hover:underline">Phân tích</Link>
        {' · '}
        <Link to="/reference" className="text-rose-400 hover:underline">Tham khảo</Link>
        {' · '}
        <Link to="/grammar" className="text-rose-400 hover:underline">Ngữ pháp</Link>
      </footer>
    </div>
  );
};

export default DictionaryPage;
