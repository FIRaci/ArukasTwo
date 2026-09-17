import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRightLeft,
  Volume2,
  BookmarkPlus,
  Check,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Split,
  BookOpen,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  getLanguageInfo,
  TextAnalysisResult,
  AnalysisToken,
  AnalysisGrammarPoint,
} from '../types';
import { analyzeTextBiDirectional } from '../services/ollamaService';
import {
  saveWordItem,
  saveGrammarItem,
  saveAnalysisToHistory,
  getAnalysisHistory,
} from '../services/localDbService';
import { useNavigate } from 'react-router-dom';

const POS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NOUN: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  VERB: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ADJECTIVE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ADVERB: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  PRONOUN: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  PARTICLE: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  PREPOSITION: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  CONJUNCTION: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  AUXILIARY: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  DEFAULT: { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200' },
};

export const AnalyzePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    sourceLang,
    setSourceLang,
    targetLang,
    setTargetLang,
    swapLanguages,
    ollamaEndpoint,
    textModel,
    isOllamaConnected,
    openSettings,
    currentThemeConfig,
  } = useSettings();

  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TextAnalysisResult | null>(null);
  const [selectedToken, setSelectedToken] = useState<AnalysisToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedTokens, setSavedTokens] = useState<Set<string>>(new Set());
  const [savedGrammars, setSavedGrammars] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<TextAnalysisResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getAnalysisHistory().then(setHistory);
  }, []);

  // When result updates, auto select first token
  useEffect(() => {
    if (result && result.tokens.length > 0) {
      setSelectedToken(result.tokens[0]);
    } else {
      setSelectedToken(null);
    }
  }, [result]);

  const handleSpeak = (text: string, langCode: LanguageCode) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const info = getLanguageInfo(langCode);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = info.speechVoiceLang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    if (!isOllamaConnected) {
      setError('Ollama chưa được kết nối. Hãy khởi động Ollama trên máy để chạy mô hình ' + textModel);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await analyzeTextBiDirectional({
        text: inputText.trim(),
        sourceLang,
        targetLang,
        model: textModel,
        endpoint: ollamaEndpoint,
      });

      setResult(res);
      await saveAnalysisToHistory(res);
      const updatedHistory = await getAnalysisHistory();
      setHistory(updatedHistory);
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Có lỗi khi phân tích câu.';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveWord = async (token: AnalysisToken) => {
    if (!result) return;
    try {
      await saveWordItem({
        id: `word_${Date.now()}_${token.id}`,
        text: token.text,
        reading: token.reading || '',
        meaning: token.meaning,
        pos: token.posLabel || token.pos,
        lang: result.resolvedSourceLang,
        targetLang: result.targetLang,
        contextSentence: result.sourceText,
        tags: [token.posLabel || token.pos],
        savedAt: Date.now(),
        notes: token.nuanceNote,
      });
      setSavedTokens((prev) => new Set(prev).add(token.id));
    } catch (e) {
      console.error('Save word error:', e);
    }
  };

  const handleSaveGrammar = async (gp: AnalysisGrammarPoint) => {
    if (!result) return;
    try {
      await saveGrammarItem({
        id: `gram_${Date.now()}_${gp.id}`,
        structure: gp.structure,
        reading: gp.reading,
        meaning: gp.meaning,
        formula: gp.formula,
        explanation: gp.explanation,
        lang: result.resolvedSourceLang,
        targetLang: result.targetLang,
        tags: [gp.structure],
        savedAt: Date.now(),
      });
      setSavedGrammars((prev) => new Set(prev).add(gp.id));
    } catch (e) {
      console.error('Save grammar error:', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* ── TOP STUDIO HERO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>ARUKAS 2.0 • LINGUISTIC STUDIO CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 mt-1">
            Phân Tích Cấu Trúc Ngôn Ngữ 2 Chiều
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Được vận hành bởi mô hình <strong className="text-stone-800 font-mono">{textModel}</strong> trên Ollama cục bộ.
          </p>
        </div>

        {/* Ollama Status Alert */}
        {!isOllamaConnected && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Ollama chưa kết nối.</span>
            <button onClick={openSettings} className="font-bold underline text-amber-800">
              Cài đặt
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN STUDIO SPLIT WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT PANE: CONSOLE INPUT (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`p-5 rounded-3xl border transition-all shadow-xs ${currentThemeConfig.cardStyle} space-y-4`}>
            {/* Language Selection Row */}
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value as LanguageCode | 'auto')}
                className="w-full bg-transparent px-2.5 py-1.5 text-xs font-bold text-stone-800 outline-none cursor-pointer"
              >
                <option value="auto">🌐 Nhận diện tự động</option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={swapLanguages}
                title="Đảo chiều phân tích"
                className="p-2 rounded-xl bg-white text-stone-600 hover:text-stone-900 shadow-2xs hover:scale-105 active:scale-95 transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
                className="w-full bg-transparent px-2.5 py-1.5 text-xs font-bold text-stone-800 outline-none cursor-pointer text-right"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Textarea */}
            <div className="space-y-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập bất kỳ câu hoặc đoạn văn bằng tiếng Việt, Nhật, Hàn, Trung, Nga, Anh, Pháp, Tây Ban Nha..."
                rows={5}
                className="w-full p-4 rounded-2xl bg-stone-50/70 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-y font-medium"
              />

              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>{inputText.length} ký tự</span>
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="hover:text-stone-600 transition"
                >
                  Xóa ô nhập
                </button>
              </div>
            </div>


            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText.trim()}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:opacity-95 disabled:opacity-50 transition shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang bóc tách đa chiều ({textModel})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bóc Tách & Phân Tích Câu</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Lỗi xử lý mô hình</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* History Accordion */}
          {history.length > 0 && (
            <div className="p-4 rounded-2xl bg-white/70 border border-stone-200/80 space-y-2">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between text-xs font-bold text-stone-600 uppercase tracking-wider"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lịch sử gần đây ({history.length})</span>
                </span>
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHistory && (
                <div className="space-y-2 pt-2 max-h-60 overflow-y-auto pr-1">
                  {history.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setInputText(item.sourceText);
                        setResult(item);
                      }}
                      className="p-2.5 rounded-xl bg-stone-50 hover:bg-blue-50 cursor-pointer border border-stone-100 transition text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-stone-400">
                        <span>
                          {getLanguageInfo(item.resolvedSourceLang).flag} → {getLanguageInfo(item.targetLang).flag}
                        </span>
                        <span>{new Date(item.analyzedAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="font-semibold text-stone-800 truncate">{item.sourceText}</div>
                      <div className="text-stone-500 truncate">{item.summary.translation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANE: LIVE LINGUISTIC INSPECTOR (7 Cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6 animate-fadeIn">
              {/* 1. Natural Translation Card */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Bản Dịch Tự Nhiên
                    </span>
                    <span className="text-xs text-stone-400">
                      {getLanguageInfo(result.resolvedSourceLang).flag} → {getLanguageInfo(result.targetLang).flag}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSpeak(result.summary.translation, result.targetLang)}
                      title="Nghe phát âm bản dịch"
                      className="p-2 rounded-xl text-stone-500 hover:text-blue-600 hover:bg-blue-50 transition"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(result.summary.translation)}
                      title="Sao chép bản dịch"
                      className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-lg sm:text-xl font-medium text-stone-900 leading-relaxed">
                  {result.summary.translation}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-stone-100 font-bold text-stone-700">
                    Sắc thái: <span className="text-blue-600">{result.summary.tone}</span>
                  </span>
                  {result.summary.overview && (
                    <span className="text-stone-500 italic max-w-lg">{result.summary.overview}</span>
                  )}
                </div>

                {result.summary.culturalContext && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Bối cảnh văn hóa & giao tiếp:</span>{' '}
                      {result.summary.culturalContext}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Interactive Token Anatomy Matrix */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-black text-stone-900">
                      Bóc Tách Thành Phần Câu ({result.tokens.length} từ)
                    </h3>
                  </div>
                  <span className="text-[11px] text-stone-400">Click vào từ để soi chi tiết</span>
                </div>

                {/* Interactive Token Ribbon */}
                <div className="flex items-center gap-2 flex-wrap">
                  {result.tokens.map((tok) => {
                    const isSelected = selectedToken?.id === tok.id;
                    const posCfg = POS_COLORS[tok.pos] || POS_COLORS.DEFAULT;

                    return (
                      <button
                        key={tok.id}
                        type="button"
                        onClick={() => setSelectedToken(tok)}
                        className={`group px-3 py-2 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105'
                            : `bg-white ${posCfg.border} hover:border-blue-400 hover:shadow-xs`
                        }`}
                      >
                        <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                          {tok.text}
                        </div>
                        {tok.reading && (
                          <div className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>
                            {tok.reading}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Token Inspector Card */}
                {selectedToken && (
                  <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3 mt-3 animate-fadeIn">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-black text-stone-900 flex items-center gap-2">
                          <span>{selectedToken.text}</span>
                          <button
                            type="button"
                            onClick={() => handleSpeak(selectedToken.text, result.resolvedSourceLang)}
                            title="Nghe phát âm"
                            className="text-stone-400 hover:text-blue-600 transition"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        {selectedToken.reading && (
                          <div className="text-xs font-mono font-bold text-blue-600">{selectedToken.reading}</div>
                        )}
                        {selectedToken.hanViet && (
                          <div className="text-xs text-stone-500 mt-0.5">Hán-Việt: {selectedToken.hanViet}</div>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                          (POS_COLORS[selectedToken.pos] || POS_COLORS.DEFAULT).bg
                        } ${(POS_COLORS[selectedToken.pos] || POS_COLORS.DEFAULT).text} ${
                          (POS_COLORS[selectedToken.pos] || POS_COLORS.DEFAULT).border
                        }`}
                      >
                        {selectedToken.posLabel || selectedToken.pos}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-stone-800">
                      Nghĩa trong câu: <span className="font-normal text-stone-700">{selectedToken.meaning}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 pt-1">
                      {selectedToken.role && (
                        <div className="p-2 rounded-xl bg-white border border-stone-100">
                          Vai trò: <strong className="text-stone-800">{selectedToken.role}</strong>
                        </div>
                      )}
                      {selectedToken.lemma && (
                        <div className="p-2 rounded-xl bg-white border border-stone-100">
                          Nguyên thể (lemma): <code className="text-blue-600 font-mono">{selectedToken.lemma}</code>
                        </div>
                      )}
                    </div>

                    {selectedToken.nuanceNote && (
                      <div className="p-2.5 rounded-xl bg-white border border-stone-100 text-xs text-stone-600 italic">
                        {selectedToken.nuanceNote}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => navigate('/hub')}
                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold"
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Mở trong Đấu Trường So Sánh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveWord(selectedToken)}
                        disabled={savedTokens.has(selectedToken.id)}
                        className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                          savedTokens.has(selectedToken.id)
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                        }`}
                      >
                        {savedTokens.has(selectedToken.id) ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã lưu vào kho</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>Lưu từ này</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Grammar Blueprint Cards */}
              {result.grammarPoints.length > 0 && (
                <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-black text-stone-900">
                      Cấu Trúc Ngữ Pháp Sử Dụng ({result.grammarPoints.length})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {result.grammarPoints.map((gp) => {
                      const isSaved = savedGrammars.has(gp.id);

                      return (
                        <div
                          key={gp.id}
                          className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-stone-900">{gp.structure}</span>
                              {gp.formula && (
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-100">
                                  {gp.formula}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveGrammar(gp)}
                              disabled={isSaved}
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                                isSaved
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              {isSaved ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Đã lưu</span>
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                  <span>Lưu ngữ pháp</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="text-xs font-semibold text-stone-800">
                            Ý nghĩa: <span className="font-normal text-stone-700">{gp.meaning}</span>
                          </div>

                          <div className="text-xs text-stone-600 leading-relaxed bg-white p-3 rounded-xl border border-stone-100">
                            {gp.explanation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State for Inspector */
            <div className="p-16 text-center border-2 border-dashed border-stone-200 rounded-3xl bg-white/50 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-stone-800">Bảng Soi Ngôn Ngữ Học Trực Quan</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Nhập câu ở khung bên trái và bấm "Bóc Tách & Phân Tích Câu" để xem kết quả dịch thuật, phân tích thành phần câu và công thức ngữ pháp.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AnalyzePage;
