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

const SAMPLE_SENTENCES: Record<LanguageCode, { text: string; label: string }[]> = {
  vi: [
    { text: 'Mùa xuân đến, những bông hoa đào nở rộ trên khắp nẻo đường Hà Nội.', label: 'Văn chương miêu tả' },
    { text: 'Tôi muốn tìm hiểu thêm về kiến trúc và văn hóa của vùng đất này.', label: 'Giao tiếp hàng ngày' },
  ],
  ja: [
    { text: '桜の花びらが春の柔らかな風に吹かれて舞い落ちていきます。', label: 'Miêu tả mùa xuân' },
    { text: '日本の伝統的な建築は自然との調和を最も大切にしています。', label: 'Văn hóa kiến trúc' },
  ],
  ko: [
    { text: '봄비가 내린 후 남산 타워 주변의 벚꽃이 활짝 피었습니다.', label: 'Thời tiết & hoa xuân' },
    { text: '한국의 전통 차 문화는 마음을 정돈하는 데 도움을 줍니다.', label: 'Trà đạo truyền thống' },
  ],
  zh: [
    { text: '江南的三月，烟雨蒙蒙，柳树已经抽出了嫩绿的枝条。', label: 'Văn phong cổ điển' },
    { text: '在快速发展的现代社会中，保持内心的平静尤为重要。', label: 'Triết lý đời sống' },
  ],
  ru: [
    { text: 'Зимний вечер опустился на старинные улочки Санкт-Петербурга.', label: 'Mùa đông nước Nga' },
    { text: 'Чтение классической литературы помогает глубже понять человеческую душу.', label: 'Văn học cổ điển' },
  ],
  en: [
    { text: 'The gentle morning mist rolled quietly across the ancient stone bridge.', label: 'Descriptive narrative' },
    { text: 'Understanding subtle cultural nuances is key to mastering any foreign language.', label: 'Linguistic advice' },
  ],
  es: [
    { text: 'Las tardes de verano en Sevilla se llenan del aroma de los azahares en flor.', label: 'Hương vị Sevilla' },
    { text: 'La música flamenca expresa la pasión y las profundas emociones del pueblo andaluz.', label: 'Nghệ thuật Flamenco' },
  ],
  fr: [
    { text: 'Le ciel de Paris au crépuscule se teinte de reflets dorés et violets.', label: 'Hoàng hôn Paris' },
    { text: 'La gastronomie française est un patrimoine culturel mondialement reconnu.', label: 'Ẩm thực Pháp' },
  ],
  it: [
    { text: 'Passeggiare per i vicoli storici di Firenze è come viaggiare indietro nel tempo.', label: 'Vẻ đẹp Florence' },
    { text: 'Il caffè espresso in Italia è un vero e proprio rituale quotidiano.', label: 'Văn hóa Espresso' },
  ],
  de: [
    { text: 'Im Herbst färben sich die Blätter der alten Eichen im Schwarzwald golden.', label: 'Mùa thu Rừng Đen' },
    { text: 'Die deutsche Philosophie hat das moderne europäische Denken nachhaltig geprägt.', label: 'Triết học Đức' },
  ],
  pt: [
    { text: 'O som melancólico do fado ecoa pelas ruas estreitas de Alfama em Lisboa.', label: 'Fado Lisbon' },
    { text: 'A hospitalidade das pessoas torna qualquer viagem a Portugal inesquecível.', label: 'Văn hóa Bồ Đào Nha' },
  ],
};

const POS_COLORS: Record<string, string> = {
  NOUN: 'bg-blue-50 text-blue-700 border-blue-200',
  VERB: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ADJECTIVE: 'bg-amber-50 text-amber-700 border-amber-200',
  ADVERB: 'bg-purple-50 text-purple-700 border-purple-200',
  PRONOUN: 'bg-pink-50 text-pink-700 border-pink-200',
  PARTICLE: 'bg-rose-50 text-rose-700 border-rose-200',
  PREPOSITION: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CONJUNCTION: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  AUXILIARY: 'bg-teal-50 text-teal-700 border-teal-200',
  DEFAULT: 'bg-stone-50 text-stone-700 border-stone-200',
};

export const AnalyzePage: React.FC = () => {
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

  const [inputText, setInputText] = useState('桜の花びらが春の柔らかな風に吹かれて舞い落ちていきます。');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TextAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedTokens, setSavedTokens] = useState<Set<string>>(new Set());
  const [savedGrammars, setSavedGrammars] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<TextAnalysisResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getAnalysisHistory().then(setHistory);
  }, []);

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
      setError('Ollama chưa được kết nối. Vui lòng bật Ollama trên máy hoặc kiểm tra cài đặt.');
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
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi phân tích câu.';
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

  const currentSampleLang = (sourceLang === 'auto' ? 'ja' : sourceLang) as LanguageCode;
  const samples = SAMPLE_SENTENCES[currentSampleLang] || SAMPLE_SENTENCES.vi;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* ── HEADER BANNER ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-stone-100 text-stone-700 border border-stone-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>ARUKAS 2 • AI LINGUISTIC SUITE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          Phân Tích Câu Đa Ngôn Ngữ
        </h1>
        <p className="text-stone-500 text-sm sm:text-base max-w-2xl mx-auto">
          Dịch thuật và bóc tách cấu trúc 2 chiều giữa 11 ngôn ngữ hàng đầu thế giới với mô hình AI Ollama cục bộ.
        </p>
      </div>

      {/* ── CONNECTION STATUS WARNING ── */}
      {!isOllamaConnected && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-semibold">Ollama chưa kết nối:</span> Hãy đảm bảo ứng dụng Ollama đang chạy tại{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">{ollamaEndpoint}</code>.
            </div>
          </div>
          <button
            onClick={openSettings}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition shadow-sm"
          >
            Mở Cài Đặt
          </button>
        </div>
      )}

      {/* ── INPUT & CONTROL CARD ── */}
      <div className={`p-6 rounded-2xl border transition-all ${currentThemeConfig.cardStyle}`}>
        {/* Language Selection Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Nguồn:</span>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as LanguageCode | 'auto')}
              className="bg-stone-50 border border-stone-200 text-stone-800 text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">🌐 Tự động nhận diện (Auto)</option>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swapLanguages}
            title="Đảo ngược 2 chiều ngôn ngữ"
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Đích:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="bg-stone-50 border border-stone-200 text-stone-800 text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text Area */}
        <div className="pt-4 space-y-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập bất kỳ câu, đoạn văn bằng tiếng Việt, Nhật, Hàn, Trung, Nga, Anh, Pháp, v.v..."
            rows={4}
            className="w-full p-4 rounded-xl bg-stone-50/70 border border-stone-200 text-stone-800 text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-y font-normal"
          />

          {/* Bottom Bar: Samples & Submit */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-stone-400 font-medium">Câu mẫu:</span>
              {samples.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(s.text)}
                  className="px-2.5 py-1 text-xs rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-mono text-stone-400">{inputText.length} ký tự</span>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-sm active:scale-95"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang bóc tách...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Phân Tích Câu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Lỗi khi gọi mô hình Ollama</div>
            <div>{error}</div>
            <div className="text-xs text-rose-600 mt-2">
              Gợi ý: Mở terminal chạy lệnh <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">ollama run {textModel}</code> để đảm bảo model đã sẵn sàng.
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYSIS RESULT PRESENTATION ── */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. Natural Translation Box */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Bản dịch tự nhiên
                </span>
                <span className="text-xs text-stone-400">
                  {getLanguageInfo(result.resolvedSourceLang).flag} {getLanguageInfo(result.resolvedSourceLang).name} →{' '}
                  {getLanguageInfo(result.targetLang).flag} {getLanguageInfo(result.targetLang).name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSpeak(result.summary.translation, result.targetLang)}
                  title="Nghe phát âm bản dịch"
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCopy(result.summary.translation)}
                  title="Sao chép bản dịch"
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-lg sm:text-xl font-medium text-stone-900 leading-relaxed">
              {result.summary.translation}
            </div>

            {/* Overview & Tone Pill */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-medium">
                Sắc thái: <strong className="text-stone-900">{result.summary.tone}</strong>
              </span>
              {result.summary.overview && (
                <span className="text-stone-500 italic max-w-xl">
                  {result.summary.overview}
                </span>
              )}
            </div>

            {result.summary.culturalContext && (
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-amber-900 text-xs flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Bối cảnh văn hóa:</span> {result.summary.culturalContext}
                </div>
              </div>
            )}
          </div>

          {/* 2. Token Breakdown Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-700" />
                <h3 className="text-base font-bold text-stone-900">
                  Bóc Tách Thành Phần Câu ({result.tokens.length} từ/ngữ)
                </h3>
              </div>
              <span className="text-xs text-stone-400">
                Click vào biểu tượng bookmark để lưu từ vào bộ nhớ cục bộ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.tokens.map((tok) => {
                const posClass = POS_COLORS[tok.pos] || POS_COLORS.DEFAULT;
                const isSaved = savedTokens.has(tok.id);

                return (
                  <div
                    key={tok.id}
                    className="p-4 rounded-xl bg-white border border-stone-200 hover:border-blue-300 hover:shadow-sm transition space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Word & Reading & POS */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
                            <span>{tok.text}</span>
                            <button
                              onClick={() => handleSpeak(tok.text, result.resolvedSourceLang)}
                              title="Nghe phát âm"
                              className="text-stone-400 hover:text-blue-600 transition"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {tok.reading && (
                            <div className="text-xs font-mono text-blue-600">{tok.reading}</div>
                          )}
                          {tok.hanViet && (
                            <div className="text-[11px] text-stone-400">Hán-Việt: {tok.hanViet}</div>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${posClass}`}
                        >
                          {tok.posLabel || tok.pos}
                        </span>
                      </div>

                      {/* Meaning & Role */}
                      <div className="pt-2 text-sm text-stone-800 font-medium">{tok.meaning}</div>

                      {tok.role && (
                        <div className="text-xs text-stone-500 mt-1">
                          Vai trò: <span className="font-semibold text-stone-700">{tok.role}</span>
                        </div>
                      )}

                      {tok.lemma && tok.lemma !== tok.text && (
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          Nguyên thể (lemma): <code className="text-stone-600 font-mono">{tok.lemma}</code>
                        </div>
                      )}

                      {tok.nuanceNote && (
                        <div className="text-[11px] bg-stone-50 p-1.5 rounded-md text-stone-600 mt-2 italic border border-stone-100">
                          {tok.nuanceNote}
                        </div>
                      )}
                    </div>

                    {/* Footer: Save Button */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-end">
                      <button
                        onClick={() => handleSaveWord(tok)}
                        disabled={isSaved}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-stone-500 hover:text-blue-600 hover:bg-stone-50'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Đã lưu từ</span>
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
                );
              })}
            </div>
          </div>

          {/* 3. Grammar Structures Section */}
          {result.grammarPoints.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-bold text-stone-900">
                  Cấu Trúc Ngữ Pháp Sử Dụng ({result.grammarPoints.length} điểm ngữ pháp)
                </h3>
              </div>

              <div className="space-y-3">
                {result.grammarPoints.map((gp) => {
                  const isSaved = savedGrammars.has(gp.id);

                  return (
                    <div
                      key={gp.id}
                      className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-stone-900">{gp.structure}</span>
                          {gp.reading && (
                            <span className="text-xs font-mono text-stone-500">({gp.reading})</span>
                          )}
                          {gp.formula && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs border border-blue-100">
                              {gp.formula}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleSaveGrammar(gp)}
                          disabled={isSaved}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition ${
                            isSaved
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã lưu ngữ pháp</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3.5 h-3.5" />
                              <span>Lưu ngữ pháp</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-sm font-semibold text-stone-800">
                        Ý nghĩa: <span className="font-normal text-stone-700">{gp.meaning}</span>
                      </div>

                      <div className="text-xs text-stone-600 leading-relaxed bg-stone-50/70 p-3 rounded-xl border border-stone-100">
                        {gp.explanation}
                      </div>

                      {/* Examples */}
                      {gp.examples && gp.examples.length > 0 && (
                        <div className="pt-2 space-y-2">
                          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                            Ví dụ thực tế:
                          </span>
                          <div className="space-y-1.5">
                            {gp.examples.map((ex, exIdx) => (
                              <div
                                key={exIdx}
                                className="text-xs p-2.5 rounded-lg bg-stone-50 border border-stone-100 flex items-start justify-between gap-2"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-medium text-stone-900">{ex.original}</div>
                                  <div className="text-stone-500">{ex.translation}</div>
                                </div>
                                <button
                                  onClick={() => handleSpeak(ex.original, result.resolvedSourceLang)}
                                  title="Nghe phát âm"
                                  className="text-stone-400 hover:text-blue-600 transition mt-0.5"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RECENT ANALYSIS HISTORY STRIP ── */}
      {history.length > 0 && (
        <div className="pt-6 border-t border-stone-200 space-y-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition"
          >
            <Clock className="w-4 h-4" />
            <span>Lịch sử phân tích gần đây ({history.length})</span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showHistory && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {history.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setInputText(item.sourceText);
                    setResult(item);
                  }}
                  className="p-3 rounded-xl bg-white border border-stone-200 hover:border-blue-400 cursor-pointer transition shadow-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>
                      {getLanguageInfo(item.resolvedSourceLang).flag} → {getLanguageInfo(item.targetLang).flag}
                    </span>
                    <span>{new Date(item.analyzedAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs font-semibold text-stone-800 truncate">{item.sourceText}</div>
                  <div className="text-xs text-stone-500 truncate">{item.summary.translation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default AnalyzePage;
