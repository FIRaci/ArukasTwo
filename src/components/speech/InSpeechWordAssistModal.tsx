import React, { useState } from 'react';
import { Sparkles, X, Volume2, ArrowRight, Lightbulb, Search } from 'lucide-react';
import { InSpeechAssistSuggestion, LanguageCode, getLanguageInfo } from '../../types';
import { getInSpeechWordAssist } from '../../services/speechCoachService';

interface InSpeechWordAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLang: LanguageCode;
  scenarioTitle: string;
  onSelectSuggestion: (text: string) => void;
  model: string;
  endpoint?: string;
}

export const InSpeechWordAssistModal: React.FC<InSpeechWordAssistModalProps> = ({
  isOpen,
  onClose,
  targetLang,
  scenarioTitle,
  onSelectSuggestion,
  model,
  endpoint,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<InSpeechAssistSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetInfo = getLanguageInfo(targetLang);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const results = await getInSpeechWordAssist({
        query: query.trim(),
        targetLang,
        scenarioContext: scenarioTitle,
        model,
        endpoint,
      });
      setSuggestions(results);
    } catch (err: unknown) {
      console.error('Word assist error:', err);
      const msg = err instanceof Error ? err.message : 'Có lỗi khi tìm gợi ý diễn đạt.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetInfo.speechVoiceLang;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">
                Cứu Cánh Từ Vựng & Gợi Ý Diễn Đạt Tức Thì
              </h3>
              <p className="text-[11px] text-stone-400">
                Đang hỗ trợ tiếng {targetInfo.name} ({targetInfo.flag}) • Ngữ cảnh: {scenarioTitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nhập từ hoặc ý muốn nói (ví dụ: muốn gọi tính tiền, xin lỗi vì đến muộn)..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tìm...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gợi ý cách nói</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestions Body */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {suggestions.length > 0 ? (
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Các cách diễn đạt tự nhiên gợi ý:
              </div>
              {suggestions.map((sug, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 hover:bg-amber-50/40 hover:border-amber-300 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-black text-stone-900 flex items-center gap-2">
                        <span>{sug.text}</span>
                        <button
                          type="button"
                          onClick={() => handleSpeak(sug.text)}
                          className="p-1 text-stone-400 hover:text-amber-600 transition"
                          title="Nghe phát âm chuẩn"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      {sug.reading && (
                        <div className="text-xs font-mono font-bold text-amber-700">{sug.reading}</div>
                      )}
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600">
                      {sug.formality}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-stone-800">
                    Ý nghĩa: <span className="font-normal text-stone-700">{sug.meaning}</span>
                  </div>

                  {sug.usageTip && (
                    <div className="text-[11px] text-stone-500 italic bg-white p-2 rounded-xl border border-stone-100">
                      💡 Mẹo sử dụng: {sug.usageTip}
                    </div>
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSuggestion(sug.text);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 shadow-2xs transition"
                    >
                      <span>Chọn câu này vào bài nói</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center space-y-2 text-stone-400">
              <Lightbulb className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-xs">
                Bạn đang bí từ hoặc chưa biết diễn đạt thế nào? Nhập vào ô trên để AI gợi ý 2-3 cách nói tự nhiên nhất!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default InSpeechWordAssistModal;
