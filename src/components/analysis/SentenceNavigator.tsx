import React from 'react';
import { Layers, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { SentenceAnalysisChunk } from '../../types';

interface SentenceNavigatorProps {
  sentences: SentenceAnalysisChunk[];
  activeIndex: number; // -1 for 'All / Toàn văn', 0..N-1 for specific sentence
  onSelectIndex: (index: number) => void;
  onAnalyzeSentence?: (index: number) => void;
}

export const SentenceNavigator: React.FC<SentenceNavigatorProps> = ({
  sentences,
  activeIndex,
  onSelectIndex,
  onAnalyzeSentence,
}) => {
  if (!sentences || sentences.length <= 1) return null;

  const analyzedCount = sentences.filter((s) => s.isAnalyzed).length;
  const progressPercent = Math.round((analyzedCount / sentences.length) * 100);

  return (
    <div className="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
            Điều Hướng Phân Đoạn ({sentences.length} câu)
          </h3>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-2 text-xs">
          <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-bold text-stone-600 font-mono text-[11px]">
            {analyzedCount}/{sentences.length} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Sentence Selection Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onSelectIndex(-1)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeIndex === -1
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          Toàn đoạn văn
        </button>

        {sentences.map((st, idx) => {
          const isSelected = activeIndex === idx;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelectIndex(idx);
                if (!st.isAnalyzed && !st.isAnalyzing && onAnalyzeSentence) {
                  onAnalyzeSentence(idx);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-105'
                  : st.isAnalyzed
                  ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:border-emerald-400'
                  : st.isAnalyzing
                  ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              {st.isAnalyzing ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
              ) : st.isAnalyzed ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : (
                <Sparkles className="w-3 h-3 text-stone-400" />
              )}
              <span>Câu {idx + 1}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  isSelected ? 'bg-blue-700 text-blue-100' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {st.originalText.length}kt
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default SentenceNavigator;
