import React from 'react';
import { Volume2, CheckCircle, ArrowRight } from 'lucide-react';
import { SpeechEvaluationResult, LanguageCode, getLanguageInfo } from '../../types';

interface SpeechEvaluationCardProps {
  evaluation: SpeechEvaluationResult;
  targetLang: LanguageCode;
  personaName: string;
  personaAvatar: string;
}

export const SpeechEvaluationCard: React.FC<SpeechEvaluationCardProps> = ({
  evaluation,
  targetLang,
  personaName,
  personaAvatar,
}) => {
  const targetInfo = getLanguageInfo(targetLang);

  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetInfo.speechVoiceLang;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-6 animate-fadeIn">
      {/* ── TOP SCORE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">
            Kết Quả Đánh Giá Nhận Xét
          </div>
          <h3 className="text-base font-black text-stone-900 mt-1">
            Bảng Đánh Giá Ngữ Âm & Khả Năng Giao Tiếp
          </h3>
          <p className="text-xs text-stone-400">
            Nhận xét khách quan, có tâm, chỉ rõ lỗi cụ thể để sửa ngay lập tức
          </p>
        </div>

        <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 ${getScoreColor(evaluation.overallScore)}`}>
          <div className="text-2xl font-black">{evaluation.overallScore}</div>
          <div className="text-left">
            <div className="text-[10px] font-bold uppercase tracking-wider">Điểm Tổng Thể</div>
            <div className="text-xs font-semibold">
              {evaluation.overallScore >= 85 ? '🌟 Rất Xuất Sắc' : evaluation.overallScore >= 70 ? '👍 Khá Tự Nhiên' : '💪 Cần Luyện Thêm'}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 DETAILED METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Fluency */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase">Độ Trôi Chảy</span>
            <span className="text-xs font-black text-blue-600">{evaluation.fluency.score}/100</span>
          </div>
          <div className="text-xs font-bold text-stone-800">{evaluation.fluency.label}</div>
          <p className="text-[11px] text-stone-500 leading-snug">{evaluation.fluency.feedback}</p>
        </div>

        {/* Accent */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase">Chuẩn Accent</span>
            <span className="text-xs font-black text-purple-600">{evaluation.accent.score}/100</span>
          </div>
          <div className="text-xs font-bold text-stone-800">{evaluation.accent.label}</div>
          <p className="text-[11px] text-stone-500 leading-snug">{evaluation.accent.feedback}</p>
        </div>

        {/* Intonation */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase">Ngữ Điệu & Nhịp</span>
            <span className="text-xs font-black text-emerald-600">{evaluation.intonation.score}/100</span>
          </div>
          <div className="text-xs font-bold text-stone-800">{evaluation.intonation.label}</div>
          <p className="text-[11px] text-stone-500 leading-snug">{evaluation.intonation.feedback}</p>
        </div>

        {/* Vocabulary */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase">Từ Vựng & Ngữ Cảnh</span>
            <span className="text-xs font-black text-amber-600">{evaluation.vocabulary.score}/100</span>
          </div>
          <div className="text-xs font-bold text-stone-800">{evaluation.vocabulary.label}</div>
          <p className="text-[11px] text-stone-500 leading-snug">{evaluation.vocabulary.feedback}</p>
        </div>
      </div>

      {/* ── STRENGTHS & IMPROVEMENTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {evaluation.strengths.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <span className="font-bold text-emerald-950 flex items-center gap-1 text-[11px]">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Điểm Làm Tốt:</span>
            </span>
            <ul className="space-y-1 text-emerald-900 list-disc pl-4">
              {evaluation.strengths.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.improvements.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
            <span className="font-bold text-amber-950 flex items-center gap-1 text-[11px]">
              <span>Chỗ Cần Khắc Phục:</span>
            </span>
            <ul className="space-y-1 text-amber-900 list-disc pl-4">
              {evaluation.improvements.map((imp, idx) => (
                <li key={idx}>{imp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── BEFORE / AFTER CORRECTION TABLE ── */}
      {evaluation.corrections.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-black text-stone-900">
            Chi Tiết Sửa Lỗi Ngữ Âm & Từ Vựng (Trước ➔ Sau):
          </div>
          <div className="space-y-2">
            {evaluation.corrections.map((cor, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="line-through text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                      {cor.before}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      {cor.after}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSpeak(cor.after)}
                      className="p-1 text-stone-400 hover:text-blue-600 transition"
                      title="Nghe cách nói chuẩn"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-stone-500 text-[11px] italic">{cor.reason}</p>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600 uppercase self-start sm:self-auto">
                  {cor.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PERSONA'S CONVERSATIONAL REPLY ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 border border-blue-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{personaAvatar}</span>
            <span className="text-xs font-black text-blue-950">
              Câu Đối Đáp Của {personaName}:
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleSpeak(evaluation.aiResponse.text)}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 transition p-1 rounded"
            title="Nghe đối thoại tiếp theo"
          >
            <Volume2 className="w-4 h-4" />
            <span>Nghe đối đáp</span>
          </button>
        </div>

        <div className="text-sm font-bold text-stone-900 leading-relaxed">
          {evaluation.aiResponse.text}
        </div>

        {evaluation.aiResponse.reading && (
          <div className="text-xs font-mono font-medium text-blue-700">
            {evaluation.aiResponse.reading}
          </div>
        )}

        <div className="text-xs text-stone-600 italic">
          "{evaluation.aiResponse.translation}"
        </div>
      </div>
    </div>
  );
};
export default SpeechEvaluationCard;
