import React, { useState } from 'react';
import { BookMarked, BookmarkPlus, Check, Sparkles, Volume2 } from 'lucide-react';
import { KeyVocabularyTerm, LanguageCode, getLanguageInfo } from '../../types';

interface KeyVocabularyCardProps {
  terms: KeyVocabularyTerm[];
  sourceLang: LanguageCode;
  onSaveTerm: (term: KeyVocabularyTerm) => Promise<void>;
  onBulkSaveTerms: (terms: KeyVocabularyTerm[]) => Promise<void>;
}

export const KeyVocabularyCard: React.FC<KeyVocabularyCardProps> = ({
  terms,
  sourceLang,
  onSaveTerm,
  onBulkSaveTerms,
}) => {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  if (!terms || terms.length === 0) return null;

  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const info = getLanguageInfo(sourceLang);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = info.speechVoiceLang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleSingleSave = async (term: KeyVocabularyTerm) => {
    await onSaveTerm(term);
    setSavedIds((prev) => new Set(prev).add(term.id));
  };

  const handleBulk = async () => {
    setIsBulkSaving(true);
    try {
      await onBulkSaveTerms(terms);
      setSavedIds(new Set(terms.map((t) => t.id)));
    } finally {
      setIsBulkSaving(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-black text-stone-900">
            Từ Vựng Trọng Tâm & Thuật Ngữ ({terms.length} từ)
          </h3>
        </div>

        {/* Bulk Save Button */}
        <button
          type="button"
          onClick={handleBulk}
          disabled={isBulkSaving || savedIds.size === terms.length}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition disabled:opacity-50"
        >
          {savedIds.size === terms.length ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã lưu tất cả</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Lưu cả {terms.length} từ vào Kho</span>
            </>
          )}
        </button>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {terms.map((term) => {
          const isSaved = savedIds.has(term.id);

          return (
            <div
              key={term.id}
              className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/70 hover:bg-white hover:border-amber-300 transition-all flex items-start justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-stone-900">{term.text}</span>
                  <button
                    type="button"
                    onClick={() => handleSpeak(term.text)}
                    className="text-stone-400 hover:text-amber-600 transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  {term.level && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      {term.level}
                    </span>
                  )}
                </div>

                {term.reading && (
                  <div className="text-xs font-mono font-bold text-amber-700">{term.reading}</div>
                )}

                {term.hanViet && (
                  <div className="text-[11px] text-stone-500 font-medium">
                    Hán-Việt: <span className="text-stone-700">{term.hanViet}</span>
                  </div>
                )}

                <div className="text-xs font-semibold text-stone-800 pt-0.5">
                  {term.meaning}
                  {term.pos && <span className="text-stone-400 font-normal"> ({term.pos})</span>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSingleSave(term)}
                disabled={isSaved}
                className={`p-2 rounded-xl transition ${
                  isSaved
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-stone-400 hover:text-amber-600 hover:bg-amber-50'
                }`}
                title={isSaved ? 'Đã lưu' : 'Lưu vào từ điển cá nhân'}
              >
                {isSaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default KeyVocabularyCard;
