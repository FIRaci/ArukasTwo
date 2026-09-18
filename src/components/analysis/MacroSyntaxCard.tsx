import React from 'react';
import { GitFork, Info } from 'lucide-react';
import { MacroSyntaxClause } from '../../types';

interface MacroSyntaxCardProps {
  clauses: MacroSyntaxClause[];
  sentenceText?: string;
}

export const MacroSyntaxCard: React.FC<MacroSyntaxCardProps> = ({ clauses, sentenceText }) => {
  if (!clauses || clauses.length === 0) return null;

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-black text-stone-900">
            Cấu Trúc Cú Pháp Vĩ Mô (SVO & Mệnh Đề)
          </h3>
        </div>
        <span className="text-[11px] text-stone-400 font-medium">
          {clauses.length} mệnh đề thành phần
        </span>
      </div>

      {sentenceText && (
        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs font-medium text-stone-700 font-mono leading-relaxed">
          {sentenceText}
        </div>
      )}

      <div className="space-y-3">
        {clauses.map((clause, idx) => (
          <div
            key={clause.clauseId || idx}
            className="p-4 rounded-2xl bg-stone-50/60 border border-stone-200/80 space-y-3"
          >
            {/* Clause Original Snippet */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-stone-900">
                Mệnh đề {idx + 1}: <span className="text-indigo-700">{clause.clauseText}</span>
              </span>
              {clause.connector && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                  Liên từ: {clause.connector}
                </span>
              )}
            </div>

            {/* SVO Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {clause.subject && (
                <div className="p-2.5 rounded-xl bg-blue-50/90 border border-blue-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                    Chủ ngữ (S)
                  </span>
                  <span className="font-bold text-blue-950 mt-0.5 block">{clause.subject}</span>
                </div>
              )}

              {clause.predicate && (
                <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                    Vị ngữ (V)
                  </span>
                  <span className="font-bold text-emerald-950 mt-0.5 block">{clause.predicate}</span>
                </div>
              )}

              {clause.object && (
                <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                    Bổ ngữ / Tân ngữ (O)
                  </span>
                  <span className="font-bold text-amber-950 mt-0.5 block">{clause.object}</span>
                </div>
              )}

              {clause.modifier && (
                <div className="p-2.5 rounded-xl bg-purple-50/90 border border-purple-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">
                    Trạng ngữ / Định ngữ
                  </span>
                  <span className="font-bold text-purple-950 mt-0.5 block">{clause.modifier}</span>
                </div>
              )}
            </div>

            {/* Clause Explanation */}
            {clause.explanation && (
              <div className="flex items-start gap-1.5 text-xs text-stone-600 pt-1">
                <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>{clause.explanation}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default MacroSyntaxCard;
