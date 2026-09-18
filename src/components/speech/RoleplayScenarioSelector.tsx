import React, { useState } from 'react';
import { Sparkles, MessageSquare, Check, ChevronRight } from 'lucide-react';
import { RoleplayScenario, LanguageCode, SUPPORTED_LANGUAGES, getLanguageInfo } from '../../types';
import { ROLEPLAY_SCENARIOS } from '../../services/speech-coach-data';

interface RoleplayScenarioSelectorProps {
  selectedScenario: RoleplayScenario;
  onSelectScenario: (scenario: RoleplayScenario) => void;
  targetLang: LanguageCode;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Intermediate: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Advanced: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Native: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export const RoleplayScenarioSelector: React.FC<RoleplayScenarioSelectorProps> = ({
  selectedScenario,
  onSelectScenario,
  targetLang,
}) => {
  const [filterLang, setFilterLang] = useState<LanguageCode | 'all'>(targetLang);

  const filteredScenarios = ROLEPLAY_SCENARIOS.filter((sc) =>
    filterLang === 'all' ? true : sc.lang === filterLang
  );

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-sm font-black text-stone-900">
              Chọn Tình Huống Nhập Vai Thực Tế ({filteredScenarios.length} kịch bản)
            </h2>
            <p className="text-xs text-stone-400">
              Luyện phản xạ giao tiếp đa ngữ với nhân vật AI theo ngữ cảnh tự nhiên
            </p>
          </div>
        </div>

        {/* Language Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setFilterLang('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
              filterLang === 'all'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Tất cả
          </button>
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setFilterLang(l.code)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition whitespace-nowrap ${
                filterLang === l.code
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredScenarios.map((sc) => {
          const isSelected = selectedScenario.id === sc.id;
          const lvlCfg = LEVEL_COLORS[sc.level] || LEVEL_COLORS.Beginner;
          const langInfo = getLanguageInfo(sc.lang);

          return (
            <div
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative space-y-2.5 ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 shadow-sm scale-[1.01]'
                  : 'bg-stone-50/50 border-stone-200/80 hover:bg-white hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{sc.avatar}</span>
                  <div>
                    <div className="text-xs font-black text-stone-900 leading-snug">{sc.title}</div>
                    <div className="text-[11px] text-stone-500 font-medium">
                      {langInfo.flag} {langInfo.name} • {sc.personaName} ({sc.personaRole})
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${lvlCfg.bg} ${lvlCfg.text} ${lvlCfg.border}`}
                >
                  {sc.level}
                </span>
              </div>

              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-normal">
                {sc.description}
              </p>

              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-blue-600 font-bold inline-flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" />
                  <span>3 câu gợi ý mở đầu</span>
                </span>
                {isSelected ? (
                  <span className="inline-flex items-center gap-1 font-bold text-blue-700">
                    <Check className="w-3.5 h-3.5" /> Đang chọn
                  </span>
                ) : (
                  <span className="text-stone-400 group-hover:text-stone-600 flex items-center">
                    Bắt đầu <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default RoleplayScenarioSelector;
