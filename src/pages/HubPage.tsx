import React, { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  Sparkles,
  Search,
  Trash2,
  Volume2,
  BookOpen,
  Download,
  Upload,
  AlertCircle,
  Check,
  Split,
  Database,
  X,
  Zap,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  getLanguageInfo,
  SavedWord,
  SavedGrammar,
  SavedComparison,
} from '../types';
import {
  getSavedWords,
  deleteWordItem,
  saveWordItem,
  getSavedGrammar,
  deleteGrammarItem,
  saveGrammarItem,
  getSavedComparisons,
  saveComparisonItem,
  deleteComparisonItem,
  exportAllLocalData,
  importLocalData,
} from '../services/localDbService';
import { compareTermsWithOllama } from '../services/ollamaService';

// High-quality multilingual starter seed items
const STARTER_SEED_WORDS: SavedWord[] = [
  {
    id: 'starter_word_1',
    text: '桜 (さくら)',
    reading: 'sakura',
    meaning: 'Hoa anh đào - biểu tượng của vẻ đẹp mong manh và sự tái sinh',
    pos: 'NOUN',
    lang: 'ja',
    targetLang: 'vi',
    contextSentence: '桜の花びらが春の風に吹かれて舞い落ちていきます。',
    tags: ['Thiên nhiên', 'Nhật Bản'],
    savedAt: Date.now() - 1000 * 60 * 60 * 2,
    notes: 'Từ vựng cốt lõi của văn hóa Nhật Bản',
  },
  {
    id: 'starter_word_2',
    text: '봄비',
    reading: 'bombi',
    meaning: 'Cơn mưa xuân tưới mát vạn vật đầu năm',
    pos: 'NOUN',
    lang: 'ko',
    targetLang: 'vi',
    contextSentence: '봄비가 내린 후 온 세상이 푸르게 깨어납니다.',
    tags: ['Thời tiết', 'Hàn Quốc'],
    savedAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'starter_word_3',
    text: '烟雨 (yānyǔ)',
    reading: 'yānyǔ',
    meaning: 'Mưa bụi mờ ảo như sương khói vùng Giang Nam',
    pos: 'NOUN',
    lang: 'zh',
    targetLang: 'vi',
    contextSentence: '江南的三月，烟雨蒙蒙，柳树抽出了嫩芽。',
    tags: ['Văn học', 'Trung Quốc'],
    savedAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: 'starter_word_4',
    text: 'Serendipity',
    reading: '/ˌser.ənˈdɪp.ə.t̬i/',
    meaning: 'Sự tình cờ may mắn tìm thấy điều tốt đẹp ngoài dự tính',
    pos: 'NOUN',
    lang: 'en',
    targetLang: 'vi',
    contextSentence: 'Finding this peaceful library was pure serendipity.',
    tags: ['Tâm lý', 'Tiếng Anh'],
    savedAt: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: 'starter_word_5',
    text: 'Зимний вечер',
    reading: 'Zimniy vecher',
    meaning: 'Buổi chiều tối mùa đông êm đềm nước Nga',
    pos: 'NOUN',
    lang: 'ru',
    targetLang: 'vi',
    contextSentence: 'Зимний вечер тихо опустился на старый Петербург.',
    tags: ['Mùa đông', 'Nga'],
    savedAt: Date.now() - 1000 * 60 * 60 * 10,
  },
];

const STARTER_SEED_GRAMMAR: SavedGrammar[] = [
  {
    id: 'starter_gram_1',
    structure: '〜ていく (te iku)',
    reading: 'te iku',
    meaning: 'Diễn tả hành động tiếp tục tiếp diễn hướng về tương lai, hoặc xa dần khỏi người nói',
    formula: 'V-te + iku',
    explanation: 'Dùng khi hành động biến đổi dần dần từ hiện tại tiến tới tương lai (vd: ấm dần lên, trôi đi xa).',
    lang: 'ja',
    targetLang: 'vi',
    tags: ['JLPT N4', 'Ngữ pháp động từ'],
    savedAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: 'starter_gram_2',
    structure: '〜(으)ㄹ수록',
    reading: '-(eu)l surok',
    meaning: 'Càng... thì càng... (Tỷ lệ thuận)',
    formula: 'V/A + (으)ㄹ수록',
    explanation: 'Biểu thị mức độ của vế trước tăng lên thì kết quả ở vế sau cũng gia tăng tương ứng.',
    lang: 'ko',
    targetLang: 'vi',
    tags: ['TOPIK II', 'Cấu trúc liên kết'],
    savedAt: Date.now() - 1000 * 60 * 60 * 5,
  },
];

const COMPARISON_PRESETS = [
  { lang: 'ja' as LanguageCode, a: 'は (wa)', b: 'が (ga)', title: 'Chủ đề (は) vs Chủ ngữ tiêu điểm (が)' },
  { lang: 'ja' as LanguageCode, a: 'きれい', b: 'うつくしい', title: 'Đẹp thanh lịch (Kirei) vs Đẹp cao quý (Utsukushii)' },
  { lang: 'es' as LanguageCode, a: 'por', b: 'para', title: 'Nguyên nhân (Por) vs Mục đích hướng tới (Para)' },
  { lang: 'fr' as LanguageCode, a: 'connaître', b: 'savoir', title: 'Quen biết người/vật (Connaître) vs Biết sự thật/kỹ năng (Savoir)' },
  { lang: 'en' as LanguageCode, a: 'make', b: 'do', title: 'Tạo ra sản phẩm mới (Make) vs Thực hiện hành động/bổn phận (Do)' },
  { lang: 'vi' as LanguageCode, a: 'quá', b: 'lắm', title: 'Cảm thán mức độ: Quá (trước/sau tính từ) vs Lắm (đứng sau tính từ)' },
];

export const HubPage: React.FC = () => {
  const {
    currentThemeConfig,
    isOllamaConnected,
    textModel,
    ollamaEndpoint,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<'words' | 'grammar' | 'arena' | 'backup'>('words');
  const [selectedLangFilter, setSelectedLangFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [words, setWords] = useState<SavedWord[]>([]);
  const [grammars, setGrammars] = useState<SavedGrammar[]>([]);
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);

  // Nuance Arena state
  const [arenaLang, setArenaLang] = useState<LanguageCode>('ja');
  const [arenaTargetLang, setArenaTargetLang] = useState<LanguageCode>('vi');
  const [termA, setTermA] = useState('は');
  const [termB, setTermB] = useState('が');
  const [isComparing, setIsComparing] = useState(false);
  const [activeComparison, setActiveComparison] = useState<SavedComparison | null>(null);
  const [arenaError, setArenaError] = useState<string | null>(null);

  // Backup notification
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const loadData = async () => {
    const [w, g, c] = await Promise.all([
      getSavedWords(),
      getSavedGrammar(),
      getSavedComparisons(),
    ]);
    setWords(w);
    setGrammars(g);
    setComparisons(c);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedStarterPack = async () => {
    for (const w of STARTER_SEED_WORDS) {
      await saveWordItem(w);
    }
    for (const g of STARTER_SEED_GRAMMAR) {
      await saveGrammarItem(g);
    }
    await loadData();
    setBackupMessage('Đã nạp thành công bộ từ vựng & ngữ pháp mẫu khởi động!');
    setTimeout(() => setBackupMessage(null), 3500);
  };

  const handleSpeak = (text: string, lang: LanguageCode) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const info = getLanguageInfo(lang);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = info.speechVoiceLang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const handleDeleteWord = async (id: string) => {
    await deleteWordItem(id);
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  const handleDeleteGrammar = async (id: string) => {
    await deleteGrammarItem(id);
    setGrammars((prev) => prev.filter((g) => g.id !== id));
  };

  const handleDeleteComparison = async (id: string) => {
    await deleteComparisonItem(id);
    setComparisons((prev) => prev.filter((c) => c.id !== id));
    if (activeComparison?.id === id) setActiveComparison(null);
  };

  const handleSendToArena = (term: string, lang: LanguageCode) => {
    setArenaLang(lang);
    setTermA(term);
    setActiveTab('arena');
  };

  const handleSwapTerms = () => {
    const prevA = termA;
    setTermA(termB);
    setTermB(prevA);
  };

  const handleRunComparison = async () => {
    if (!termA.trim() || !termB.trim()) return;
    if (!isOllamaConnected) {
      setArenaError('Ollama chưa được kết nối. Hãy đảm bảo Ollama đang chạy trên máy.');
      return;
    }

    setIsComparing(true);
    setArenaError(null);

    try {
      const res = await compareTermsWithOllama({
        terms: [termA.trim(), termB.trim()],
        lang: arenaLang,
        targetLang: arenaTargetLang,
        model: textModel,
        endpoint: ollamaEndpoint,
      });

      setActiveComparison(res);
      await saveComparisonItem(res);
      const updated = await getSavedComparisons();
      setComparisons(updated);
    } catch (err: unknown) {
      console.error('Arena comparison error:', err);
      const msg = err instanceof Error ? err.message : 'Có lỗi khi so sánh sắc thái.';
      setArenaError(msg);
    } finally {
      setIsComparing(false);
    }
  };

  const handleExportBackup = async () => {
    const json = await exportAllLocalData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arukas2_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage('Đã tải tệp sao lưu dữ liệu về máy.');
    setTimeout(() => setBackupMessage(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await importLocalData(content);
      if (res.success) {
        setBackupMessage(`Khôi phục thành công ${res.count} mục vào bộ nhớ cục bộ!`);
        await loadData();
      } else {
        setBackupMessage(`Lỗi khôi phục: ${res.error}`);
      }
      setTimeout(() => setBackupMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  // Language count breakdown for badges
  const wordsByLang = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of words) counts[w.lang] = (counts[w.lang] || 0) + 1;
    return counts;
  }, [words]);

  // Filters
  const filteredWords = words.filter((w) => {
    const matchesLang = selectedLangFilter === 'all' || w.lang === selectedLangFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      w.text.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      w.reading.toLowerCase().includes(q) ||
      (w.tags && w.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesLang && matchesQuery;
  });

  const filteredGrammar = grammars.filter((g) => {
    const matchesLang = selectedLangFilter === 'all' || g.lang === selectedLangFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      g.structure.toLowerCase().includes(q) ||
      g.meaning.toLowerCase().includes(q) ||
      g.explanation.toLowerCase().includes(q) ||
      (g.tags && g.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesLang && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* ── 1. STUDIO COMMAND TOP BANNER & BENTO STATS ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
              <Zap className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>LOCAL LINGUISTIC VAULT & ARENA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 mt-1">
              Kho Tri Thức & Đấu Trường Sắc Thái
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Toàn bộ dữ liệu được mã hóa và lưu trữ 100% trong trình duyệt qua IndexedDB, không cần đám mây hay tài khoản.
            </p>
          </div>

          {/* Quick Action Seed Button */}
          {words.length === 0 && (
            <button
              onClick={handleSeedStarterPack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md transition active:scale-95 flex-shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Nạp Gói Khởi Động Mẫu (Seed Pack)</span>
            </button>
          )}
        </div>

        {/* ── 4 BENTO KPI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Words */}
          <div
            onClick={() => setActiveTab('words')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-2xs ${
              activeTab === 'words' ? 'bg-white border-blue-500 ring-2 ring-blue-100' : 'bg-white/80 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Từ Vựng</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                <Bookmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-stone-900">{words.length}</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-stone-400 truncate">
              {Object.entries(wordsByLang).length > 0 ? (
                Object.entries(wordsByLang).map(([code, count]) => (
                  <span key={code} className="inline-flex items-center gap-0.5">
                    {getLanguageInfo(code as LanguageCode).flag} {count}
                  </span>
                ))
              ) : (
                <span>Chưa có mục</span>
              )}
            </div>
          </div>

          {/* Card 2: Grammar */}
          <div
            onClick={() => setActiveTab('grammar')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-2xs ${
              activeTab === 'grammar' ? 'bg-white border-emerald-500 ring-2 ring-emerald-100' : 'bg-white/80 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ngữ Pháp</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-stone-900">{grammars.length}</div>
            <div className="mt-1 text-[11px] text-stone-400">Công thức & quy tắc</div>
          </div>

          {/* Card 3: Nuance Arena */}
          <div
            onClick={() => setActiveTab('arena')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-2xs ${
              activeTab === 'arena' ? 'bg-white border-purple-500 ring-2 ring-purple-100' : 'bg-white/80 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Đấu Trường So Sánh</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                <Split className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-stone-900">{comparisons.length}</div>
            <div className="mt-1 text-[11px] text-purple-600 font-medium">Bóc tách sắc thái AI</div>
          </div>

          {/* Card 4: Local Storage Health */}
          <div
            onClick={() => setActiveTab('backup')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-2xs ${
              activeTab === 'backup' ? 'bg-white border-amber-500 ring-2 ring-amber-100' : 'bg-white/80 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">IndexedDB</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-lg font-black text-stone-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Offline Safe</span>
            </div>
            <div className="mt-1 text-[11px] text-stone-400">Sao lưu & xuất JSON</div>
          </div>
        </div>
      </div>

      {/* Backup notification */}
      {backupMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{backupMessage}</span>
          </div>
          <button onClick={() => setBackupMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 2. SEGMENTED STUDIO NAVIGATION & SEARCH BAR ── */}
      <div className={`p-3 rounded-2xl border transition-all shadow-xs ${currentThemeConfig.cardStyle} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100/80 flex-wrap">
            <button
              onClick={() => setActiveTab('words')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'words'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-600" />
              <span>Từ Vựng ({words.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('grammar')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'grammar'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ngữ Pháp ({grammars.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('arena')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'arena'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Split className="w-3.5 h-3.5 text-purple-600" />
              <span>Đấu Trường So Sánh ({comparisons.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'backup'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>Sao Lưu & Dữ Liệu</span>
            </button>
          </div>

          {/* Quick Search */}
          {(activeTab === 'words' || activeTab === 'grammar') && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ vựng, phiên âm, nghĩa..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Interactive Country Flag Filter Ribbon for Words and Grammar */}
        {(activeTab === 'words' || activeTab === 'grammar') && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin border-t border-stone-100">
            <button
              onClick={() => setSelectedLangFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedLangFilter === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              🌐 Tất cả ({activeTab === 'words' ? words.length : grammars.length})
            </button>

            {SUPPORTED_LANGUAGES.map((l) => {
              const count =
                activeTab === 'words'
                  ? words.filter((w) => w.lang === l.code).length
                  : grammars.filter((g) => g.lang === l.code).length;
              if (count === 0 && selectedLangFilter !== l.code) return null;

              const isSelected = selectedLangFilter === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setSelectedLangFilter(l.code)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20' : 'bg-stone-200 text-stone-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. TAB CONTENT: SAVED WORDS ── */}
      {activeTab === 'words' && (
        <div className="space-y-4">
          {filteredWords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredWords.map((item) => {
                const langInfo = getLanguageInfo(item.lang);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      {/* Top Header: Word + Flag */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-lg font-black text-stone-900 flex items-center gap-2">
                            <span>{item.text}</span>
                            <button
                              onClick={() => handleSpeak(item.text, item.lang)}
                              title="Nghe phát âm chuẩn"
                              className="p-1 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {item.reading && (
                            <div className="text-xs font-mono font-semibold text-blue-600">{item.reading}</div>
                          )}
                        </div>

                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          <span>{langInfo.flag}</span>
                          <span>{langInfo.code.toUpperCase()}</span>
                        </span>
                      </div>

                      {/* Meaning */}
                      <div className="text-sm font-semibold text-stone-800 pt-1 leading-snug">
                        {item.meaning}
                      </div>

                      {/* Context Quote */}
                      {item.contextSentence && (
                        <div className="mt-2 text-xs text-stone-600 italic bg-stone-50 p-2.5 rounded-xl border-l-2 border-blue-500 border-stone-200">
                          "{item.contextSentence}"
                        </div>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {item.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-500"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <button
                        onClick={() => handleSendToArena(item.text, item.lang)}
                        title="Gửi từ này vào Đấu Trường So Sánh"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded-lg transition"
                      >
                        <Split className="w-3 h-3" />
                        <span>So sánh sắc thái</span>
                      </button>

                      <button
                        onClick={() => handleDeleteWord(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Xóa từ khỏi kho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Rich Empty State with Action */
            <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-3xl bg-white/70 space-y-4 max-w-lg mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Bookmark className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-800">Kho từ vựng đang trống</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Bạn có thể bấm vào biểu tượng bookmark khi phân tích câu, hoặc nạp ngay bộ từ vựng mẫu để trải nghiệm.
                </p>
              </div>
              <button
                onClick={handleSeedStarterPack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Nạp 5 từ mẫu đa ngôn ngữ</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 4. TAB CONTENT: SAVED GRAMMAR ── */}
      {activeTab === 'grammar' && (
        <div className="space-y-4">
          {filteredGrammar.length > 0 ? (
            <div className="space-y-3">
              {filteredGrammar.map((item) => {
                const langInfo = getLanguageInfo(item.lang);

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white border border-stone-200/80 hover:border-emerald-300 hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base font-black text-stone-900">{item.structure}</span>
                        {item.reading && (
                          <span className="text-xs font-mono text-stone-400">({item.reading})</span>
                        )}
                        {item.formula && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono text-xs font-semibold border border-emerald-100">
                            {item.formula}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          <span>{langInfo.flag}</span>
                          <span>{langInfo.name}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteGrammar(item.id)}
                          className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Xóa điểm ngữ pháp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm font-bold text-stone-800">
                      Ý nghĩa: <span className="font-normal text-stone-700">{item.meaning}</span>
                    </div>

                    <div className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                      {item.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-3xl bg-white/70 space-y-4 max-w-lg mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-800">Chưa có công thức ngữ pháp nào</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Các cấu trúc ngữ pháp được bóc tách từ câu sẽ hiển thị ở đây để bạn dễ dàng ôn tập.
                </p>
              </div>
              <button
                onClick={handleSeedStarterPack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Nạp cấu trúc mẫu</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 5. TAB CONTENT: NUANCE BATTLE ARENA (ĐẤU TRƯỜNG SO SÁNH) ── */}
      {activeTab === 'arena' && (
        <div className="space-y-6">
          {/* Main Battle Pod Box */}
          <div className="p-6 rounded-3xl bg-white border border-purple-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  QWEN 2.5:7B NUANCE ENGINE
                </span>
                <h2 className="text-lg font-black text-stone-900 mt-1">Đấu Trường So Sánh Sắc Thái Chuyên Sâu</h2>
                <p className="text-xs text-stone-500">
                  Phân biệt rạch ròi các cặp từ, hư từ hoặc cấu trúc dễ nhầm lẫn trong cùng một ngôn ngữ.
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-400 uppercase">Ngôn ngữ so sánh:</span>
                  <select
                    value={arenaLang}
                    onChange={(e) => setArenaLang(e.target.value as LanguageCode)}
                    className="bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-400 uppercase">Giải thích bằng:</span>
                  <select
                    value={arenaTargetLang}
                    onChange={(e) => setArenaTargetLang(e.target.value as LanguageCode)}
                    className="bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Battle Arena Row: Term A vs Term B */}
            <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
              {/* Pod A */}
              <div className="md:col-span-5 p-4 rounded-2xl bg-stone-50/70 border-2 border-stone-200 focus-within:border-blue-500 focus-within:bg-white transition space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-500">
                  <span>THUẬT NGỮ A</span>
                  <span>{getLanguageInfo(arenaLang).flag}</span>
                </div>
                <input
                  type="text"
                  value={termA}
                  onChange={(e) => setTermA(e.target.value)}
                  placeholder="Nhập từ hoặc cấu trúc A..."
                  className="w-full text-lg font-black text-stone-900 bg-transparent outline-none"
                />
              </div>

              {/* Center VS Badge */}
              <div className="md:col-span-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleSwapTerms}
                  title="Đảo vị trí A và B"
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
                >
                  VS
                </button>
              </div>

              {/* Pod B */}
              <div className="md:col-span-5 p-4 rounded-2xl bg-stone-50/70 border-2 border-stone-200 focus-within:border-purple-500 focus-within:bg-white transition space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-500">
                  <span>THUẬT NGỮ B</span>
                  <span>{getLanguageInfo(arenaLang).flag}</span>
                </div>
                <input
                  type="text"
                  value={termB}
                  onChange={(e) => setTermB(e.target.value)}
                  placeholder="Nhập từ hoặc cấu trúc B..."
                  className="w-full text-lg font-black text-stone-900 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs font-semibold text-stone-400">Gợi ý đối đầu:</span>
              {COMPARISON_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setArenaLang(p.lang);
                    setTermA(p.a);
                    setTermB(p.b);
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-stone-100 hover:bg-purple-100 hover:text-purple-700 text-stone-600 transition"
                >
                  {p.a} ⚔️ {p.b}
                </button>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-400 font-mono">
                Model: <strong className="text-stone-800">{textModel}</strong>
              </span>

              <button
                onClick={handleRunComparison}
                disabled={isComparing || !termA.trim() || !termB.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition shadow-sm active:scale-95"
              >
                {isComparing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang đối chiếu sắc thái...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Khởi Chạy Đối Chiếu Sắc Thái</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {arenaError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{arenaError}</span>
            </div>
          )}

          {/* Active Comparison Presentation */}
          {activeComparison && (
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded">
                  Bản Đồ Phân Tích Sắc Thái
                </span>
                <h3 className="text-xl font-black text-stone-900 mt-1">{activeComparison.title}</h3>
              </div>

              {/* Core Key Difference Amber Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 text-amber-950 text-sm space-y-1.5 shadow-2xs">
                <span className="font-extrabold text-amber-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Điểm khác biệt then chốt
                </span>
                <p className="leading-relaxed font-medium">{activeComparison.keyDifference}</p>
              </div>

              {/* In-depth Overview */}
              {activeComparison.summary && (
                <div className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  {activeComparison.summary}
                </div>
              )}

              {/* Side-by-Side Comparison Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeComparison.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-stone-50/70 border border-stone-200 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-black text-stone-900">{item.term}</div>
                        <button
                          onClick={() => handleSpeak(item.term, activeComparison.lang)}
                          title="Nghe phát âm"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-white transition"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.reading && (
                        <div className="text-xs font-mono font-semibold text-blue-600">{item.reading}</div>
                      )}

                      <div className="text-xs font-semibold text-stone-800">
                        Nghĩa: <span className="font-normal text-stone-600">{item.meaning}</span>
                      </div>

                      <div className="text-xs text-stone-700 p-3 rounded-xl bg-white border border-stone-100 space-y-1">
                        <span className="font-bold text-purple-700">Ngữ cảnh & Sắc thái sử dụng:</span>
                        <p className="leading-relaxed">{item.nuance}</p>
                      </div>
                    </div>

                    {item.example && (
                      <div className="pt-2.5 border-t border-stone-200/70 text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Ví dụ minh họa:
                        </span>
                        <div className="font-semibold text-stone-900">{item.example}</div>
                        <div className="text-stone-500">{item.exampleTranslation}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous Comparisons Log */}
          {comparisons.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-stone-200">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Các phép so sánh đã lưu ({comparisons.length})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {comparisons.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setActiveComparison(c)}
                    className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-purple-400 cursor-pointer transition shadow-2xs space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 group-hover:text-purple-700 transition truncate">
                        {c.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteComparison(c.id);
                        }}
                        className="text-stone-400 hover:text-rose-600 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-stone-500 line-clamp-2">{c.keyDifference}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 6. TAB CONTENT: DATA MANAGER & BACKUP ── */}
      {activeTab === 'backup' && (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-stone-900">Quản Lý & Sao Lưu Dữ Liệu Cục Bộ</h3>
            <p className="text-xs text-stone-500">
              Dữ liệu của bạn hoàn toàn riêng tư. Xuất ra tệp JSON chuẩn hoặc nhập lại dữ liệu bất cứ lúc nào.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleExportBackup}
              className="p-5 rounded-2xl border border-stone-200 hover:border-blue-400 hover:bg-stone-50 transition flex flex-col items-center justify-center text-center space-y-2 group shadow-2xs"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-900">Xuất Tệp JSON</div>
                <div className="text-[11px] text-stone-400 mt-0.5">Tải toàn bộ từ vựng, ngữ pháp & so sánh</div>
              </div>
            </button>

            <label className="p-5 rounded-2xl border border-stone-200 hover:border-purple-400 hover:bg-stone-50 transition flex flex-col items-center justify-center text-center space-y-2 cursor-pointer group shadow-2xs">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-900">Khôi Phục JSON</div>
                <div className="text-[11px] text-stone-400 mt-0.5">Nhập tệp sao lưu đã lưu trước đó</div>
              </div>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
export default HubPage;
