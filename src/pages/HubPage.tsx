import React, { useState, useEffect } from 'react';
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
  getSavedGrammar,
  deleteGrammarItem,
  getSavedComparisons,
  saveComparisonItem,
  deleteComparisonItem,
  exportAllLocalData,
  importLocalData,
} from '../services/localDbService';
import { compareTermsWithOllama } from '../services/ollamaService';

export const HubPage: React.FC = () => {
  const {
    currentThemeConfig,
    isOllamaConnected,
    textModel,
    ollamaEndpoint,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<'words' | 'grammar' | 'comparison' | 'backup'>('words');
  const [selectedLangFilter, setSelectedLangFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [words, setWords] = useState<SavedWord[]>([]);
  const [grammars, setGrammars] = useState<SavedGrammar[]>([]);
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);

  // Comparison form state
  const [compareLang, setCompareLang] = useState<LanguageCode>('ja');
  const [compareTargetLang, setCompareTargetLang] = useState<LanguageCode>('vi');
  const [termA, setTermA] = useState('は');
  const [termB, setTermB] = useState('が');
  const [isComparing, setIsComparing] = useState(false);
  const [currentComparison, setCurrentComparison] = useState<SavedComparison | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Backup state
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
    if (currentComparison?.id === id) setCurrentComparison(null);
  };

  const handleRunComparison = async () => {
    if (!termA.trim() || !termB.trim()) return;
    if (!isOllamaConnected) {
      setCompareError('Ollama chưa kết nối. Hãy khởi động Ollama trên máy để chạy so sánh.');
      return;
    }

    setIsComparing(true);
    setCompareError(null);

    try {
      const res = await compareTermsWithOllama({
        terms: [termA.trim(), termB.trim()],
        lang: compareLang,
        targetLang: compareTargetLang,
        model: textModel,
        endpoint: ollamaEndpoint,
      });

      setCurrentComparison(res);
      await saveComparisonItem(res);
      const updated = await getSavedComparisons();
      setComparisons(updated);
    } catch (err: unknown) {
      console.error('Comparison error:', err);
      const msg = err instanceof Error ? err.message : 'Có lỗi khi so sánh.';
      setCompareError(msg);
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

  // Filters
  const filteredWords = words.filter((w) => {
    const matchesLang = selectedLangFilter === 'all' || w.lang === selectedLangFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      w.text.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      w.reading.toLowerCase().includes(q);
    return matchesLang && matchesQuery;
  });

  const filteredGrammar = grammars.filter((g) => {
    const matchesLang = selectedLangFilter === 'all' || g.lang === selectedLangFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      g.structure.toLowerCase().includes(q) ||
      g.meaning.toLowerCase().includes(q) ||
      g.explanation.toLowerCase().includes(q);
    return matchesLang && matchesQuery;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* ── HEADER ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-stone-100 text-stone-700 border border-stone-200">
          <Bookmark className="w-3.5 h-3.5 text-blue-600" />
          <span>KHO LƯU TRỮ CỤC BỘ & SO SÁNH</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          Kho Tri Thức & Phân Tích So Sánh
        </h1>
        <p className="text-stone-500 text-sm sm:text-base max-w-2xl mx-auto">
          Dữ liệu 100% lưu cục bộ trên trình duyệt qua IndexedDB, không phụ thuộc tài khoản hay đám mây.
        </p>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className={`p-2 rounded-2xl border transition-all ${currentThemeConfig.cardStyle} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 flex-wrap">
          <button
            onClick={() => setActiveTab('words')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'words'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bookmark className="w-4 h-4 text-blue-600" />
            <span>Từ Vựng Đã Lưu ({words.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'grammar'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Ngữ Pháp Đã Lưu ({grammars.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'comparison'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Split className="w-4 h-4 text-purple-600" />
            <span>So Sánh Từ & Ngữ Pháp ({comparisons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'backup'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span>Sao Lưu / Khôi Phục</span>
          </button>
        </div>

        {/* Language Filter for Words/Grammar */}
        {(activeTab === 'words' || activeTab === 'grammar') && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400 uppercase">Lọc tiếng:</span>
            <select
              value={selectedLangFilter}
              onChange={(e) => setSelectedLangFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả ({words.length + grammars.length})</option>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── TAB 1: SAVED WORDS ── */}
      {activeTab === 'words' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm từ vựng, phiên âm, nghĩa tiếng Việt..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          {filteredWords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWords.map((item) => {
                const langInfo = getLanguageInfo(item.lang);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white border border-stone-200 hover:border-blue-300 transition shadow-xs flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{item.text}</span>
                            <button
                              onClick={() => handleSpeak(item.text, item.lang)}
                              className="text-stone-400 hover:text-blue-600 transition"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {item.reading && (
                            <div className="text-xs font-mono text-blue-600">{item.reading}</div>
                          )}
                        </div>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 flex items-center gap-1">
                          <span>{langInfo.flag}</span>
                          <span>{langInfo.name}</span>
                        </span>
                      </div>

                      <div className="pt-2 text-sm text-stone-800 font-medium">{item.meaning}</div>

                      {item.contextSentence && (
                        <div className="text-xs text-stone-500 italic mt-1.5 bg-stone-50 p-2 rounded-lg border border-stone-100">
                          "{item.contextSentence}"
                        </div>
                      )}

                      {item.notes && (
                        <div className="text-[11px] text-stone-400 mt-1">Ghi chú: {item.notes}</div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                      <span>{new Date(item.savedAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleDeleteWord(item.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition"
                        title="Xóa từ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/40 space-y-2">
              <Bookmark className="w-8 h-8 text-stone-300 mx-auto" />
              <div className="text-sm font-semibold text-stone-600">Chưa có từ vựng nào được lưu</div>
              <p className="text-xs text-stone-400">
                Khi phân tích câu hoặc ảnh, bấm vào biểu tượng bookmark để lưu từ vào đây.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SAVED GRAMMAR ── */}
      {activeTab === 'grammar' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mẫu ngữ pháp, công thức, giải thích..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          {filteredGrammar.length > 0 ? (
            <div className="space-y-3">
              {filteredGrammar.map((item) => {
                const langInfo = getLanguageInfo(item.lang);

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-xl bg-white border border-stone-200 hover:border-blue-300 transition shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-stone-900">{item.structure}</span>
                        {item.reading && (
                          <span className="text-xs font-mono text-stone-500">({item.reading})</span>
                        )}
                        {item.formula && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-xs border border-emerald-100">
                            {item.formula}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 flex items-center gap-1">
                          <span>{langInfo.flag}</span>
                          <span>{langInfo.name}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteGrammar(item.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition"
                          title="Xóa ngữ pháp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-stone-800">
                      Ý nghĩa: <span className="font-normal text-stone-700">{item.meaning}</span>
                    </div>

                    <div className="text-xs text-stone-600 leading-relaxed bg-stone-50/70 p-3 rounded-lg border border-stone-100">
                      {item.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/40 space-y-2">
              <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
              <div className="text-sm font-semibold text-stone-600">Chưa có điểm ngữ pháp nào được lưu</div>
              <p className="text-xs text-stone-400">
                Bấm "Lưu ngữ pháp" ở màn hình Phân Tích Câu để xem lại công thức và ví dụ tại đây.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: TERM & GRAMMAR COMPARISON ── */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Comparison Form Card */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Phân Tích So Sánh Sắc Thái (Nuance Comparison)</h3>
                <p className="text-xs text-stone-500">
                  Đặt 2 từ vựng hoặc cấu trúc dễ nhầm lẫn cạnh nhau để AI phân tích chi tiết điểm khác biệt then chốt.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-stone-400 uppercase">Ngôn ngữ so sánh:</span>
                  <select
                    value={compareLang}
                    onChange={(e) => setCompareLang(e.target.value as LanguageCode)}
                    className="bg-stone-50 border border-stone-200 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-stone-400 uppercase">Giải thích bằng:</span>
                  <select
                    value={compareTargetLang}
                    onChange={(e) => setCompareTargetLang(e.target.value as LanguageCode)}
                    className="bg-stone-50 border border-stone-200 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Input Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-600">Từ hoặc Cấu trúc A:</label>
                <input
                  type="text"
                  value={termA}
                  onChange={(e) => setTermA(e.target.value)}
                  placeholder="Ví dụ: は, por, connaître..."
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-600">Từ hoặc Cấu trúc B:</label>
                <input
                  type="text"
                  value={termB}
                  onChange={(e) => setTermB(e.target.value)}
                  placeholder="Ví dụ: が, para, savoir..."
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-stone-400">Gợi ý so sánh:</span>
              {[
                { lang: 'ja' as LanguageCode, a: 'は (wa)', b: 'が (ga)' },
                { lang: 'ja' as LanguageCode, a: 'きれい (kirei)', b: 'うつくしい (utsukushii)' },
                { lang: 'es' as LanguageCode, a: 'por', b: 'para' },
                { lang: 'fr' as LanguageCode, a: 'connaître', b: 'savoir' },
                { lang: 'en' as LanguageCode, a: 'make', b: 'do' },
                { lang: 'vi' as LanguageCode, a: 'quá', b: 'lắm' },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCompareLang(p.lang);
                    setTermA(p.a);
                    setTermB(p.b);
                  }}
                  className="px-2.5 py-1 text-xs rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
                >
                  {p.a} vs {p.b}
                </button>
              ))}
            </div>

            {/* Action */}
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={handleRunComparison}
                disabled={isComparing || !termA.trim() || !termB.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
              >
                {isComparing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang đối chiếu sắc thái...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Bắt Đầu So Sánh</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {compareError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{compareError}</span>
            </div>
          )}

          {/* Current Comparison Presentation */}
          {currentComparison && (
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-6 animate-fadeIn">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  Kết quả phân tích
                </span>
                <h3 className="text-lg font-extrabold text-stone-900 mt-1">{currentComparison.title}</h3>
              </div>

              {/* Key Difference Callout */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs sm:text-sm space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Điểm khác biệt cốt lõi:
                </span>
                <p className="leading-relaxed">{currentComparison.keyDifference}</p>
              </div>

              {/* In-depth summary */}
              {currentComparison.summary && (
                <div className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100">
                  {currentComparison.summary}
                </div>
              )}

              {/* Comparison Items Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentComparison.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-stone-50/60 border border-stone-200 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-stone-900">{item.term}</div>
                        <button
                          onClick={() => handleSpeak(item.term, currentComparison.lang)}
                          className="text-stone-400 hover:text-blue-600 transition"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.reading && (
                        <div className="text-xs font-mono text-blue-600">{item.reading}</div>
                      )}

                      <div className="text-xs font-medium text-stone-800">
                        Nghĩa: <span className="font-normal text-stone-600">{item.meaning}</span>
                      </div>

                      <div className="text-xs text-stone-700 p-2.5 rounded-lg bg-white border border-stone-100 space-y-1">
                        <span className="font-semibold text-purple-700">Sắc thái & Ngữ cảnh:</span>
                        <p>{item.nuance}</p>
                      </div>
                    </div>

                    {item.example && (
                      <div className="pt-2 border-t border-stone-200/60 text-xs space-y-0.5">
                        <span className="text-[10px] font-semibold uppercase text-stone-400">Ví dụ:</span>
                        <div className="font-medium text-stone-900">{item.example}</div>
                        <div className="text-stone-500">{item.exampleTranslation}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History of Saved Comparisons */}
          {comparisons.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-stone-200">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Các phép so sánh đã lưu trước đây ({comparisons.length})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {comparisons.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setCurrentComparison(c)}
                    className="p-4 rounded-xl bg-white border border-stone-200 hover:border-purple-400 cursor-pointer transition shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 truncate">{c.title}</span>
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
                    <div className="text-xs text-stone-500 line-clamp-2">{c.keyDifference}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: BACKUP & RESTORE ── */}
      {activeTab === 'backup' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-stone-900">Sao Lưu & Phục Hồi Dữ Liệu Cục Bộ</h3>
            <p className="text-xs text-stone-500">
              Xuất toàn bộ từ vựng, ngữ pháp và phép so sánh ra tệp JSON hoặc khôi phục dữ liệu bất cứ lúc nào.
            </p>
          </div>

          {backupMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{backupMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={handleExportBackup}
              className="p-4 rounded-xl border border-stone-200 hover:border-blue-400 hover:bg-stone-50 transition flex flex-col items-center justify-center text-center space-y-2 group"
            >
              <Download className="w-6 h-6 text-blue-600 group-hover:scale-110 transition" />
              <div>
                <div className="text-xs font-bold text-stone-900">Tải tệp JSON về máy</div>
                <div className="text-[11px] text-stone-400 mt-0.5">Xuất toàn bộ dữ liệu IndexedDB</div>
              </div>
            </button>

            <label className="p-4 rounded-xl border border-stone-200 hover:border-blue-400 hover:bg-stone-50 transition flex flex-col items-center justify-center text-center space-y-2 cursor-pointer group">
              <Upload className="w-6 h-6 text-purple-600 group-hover:scale-110 transition" />
              <div>
                <div className="text-xs font-bold text-stone-900">Khôi phục từ tệp JSON</div>
                <div className="text-[11px] text-stone-400 mt-0.5">Nhập lại dữ liệu đã sao lưu</div>
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
