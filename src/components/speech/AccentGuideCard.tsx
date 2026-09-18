import React, { useState } from 'react';
import { Award, Volume2, AlertTriangle, HelpCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { LanguageCode, getLanguageInfo } from '../../types';
import { ACCENT_GUIDES } from '../../services/speech-coach-data';

interface AccentGuideCardProps {
  targetLang: LanguageCode;
}

export const AccentGuideCard: React.FC<AccentGuideCardProps> = ({ targetLang }) => {
  const targetInfo = getLanguageInfo(targetLang);
  const rules = ACCENT_GUIDES[targetLang] || [];

  const [expandedId, setExpandedId] = useState<string | null>(rules[0]?.id || null);

  if (rules.length === 0) return null;

  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetInfo.speechVoiceLang;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="text-sm font-black text-stone-900">
              Cẩm Nang Accent & Kỹ Thuật Ngữ Điệu Chuẩn Bản Xứ
            </h3>
            <p className="text-xs text-stone-400">
              Quy tắc phát âm, khẩu hình miệng và cách vượt qua bẫy accent người Việt ({targetInfo.flag} {targetInfo.name})
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          {rules.length} quy tắc cốt lõi
        </span>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => {
          const isExpanded = expandedId === rule.id;

          return (
            <div
              key={rule.id}
              className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50/50 transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-stone-100/60 transition gap-2"
              >
                <div>
                  <div className="text-xs font-black text-stone-900">{rule.title}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{rule.pattern}</div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 pt-1 border-t border-stone-100 space-y-3 bg-white text-xs text-stone-700 animate-fadeIn">
                  {/* Visual Diagram */}
                  {rule.diagram && (
                    <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 font-mono text-[11px] text-purple-900 font-bold">
                      Sơ đồ cao độ / ngữ điệu: <span className="text-purple-700">{rule.diagram}</span>
                    </div>
                  )}

                  {/* Mouth Position Guidance */}
                  <div className="space-y-1">
                    <span className="font-bold text-stone-900 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                      <span>Khẩu hình miệng & Vị trí đặt lưỡi:</span>
                    </span>
                    <p className="text-stone-600 leading-relaxed pl-4">{rule.mouthPosition}</p>
                  </div>

                  {/* Vietnamese Trap Warning */}
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1">
                    <span className="font-bold text-amber-950 flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Bẫy Accent Người Việt Thường Gặp:</span>
                    </span>
                    <p className="text-amber-900 text-[11px] leading-relaxed pl-4">
                      {rule.vietnameseTrap}
                    </p>
                  </div>

                  {/* How to Fix */}
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                    <span className="font-bold text-emerald-950 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cách Khắc Phục Chuẩn:</span>
                    </span>
                    <p className="text-emerald-900 text-[11px] leading-relaxed pl-4">
                      {rule.howToFix}
                    </p>
                  </div>

                  {/* Practice Examples */}
                  {rule.examples.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider block">
                        Từ vựng luyện tập mẫu:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rule.examples.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-stone-900 flex items-center gap-1">
                                <span>{ex.word}</span>
                                <span className="text-[10px] font-mono text-purple-600">
                                  ({ex.reading})
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-500">
                                {ex.meaning} • <span className="text-purple-700">{ex.pitchOrTone}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSpeak(ex.word)}
                              className="p-1.5 text-stone-400 hover:text-purple-600 transition"
                              title="Nghe phát âm chuẩn"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default AccentGuideCard;
