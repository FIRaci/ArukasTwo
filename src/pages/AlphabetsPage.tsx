import React, { useState } from 'react';
import {
  Volume2,
  Search,
  BookOpen,
  Sparkles,
  Info,
  Check,
  Copy,
  GraduationCap,
  History,
  Lightbulb,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { LanguageCode, SUPPORTED_LANGUAGES, getLanguageInfo } from '../types';
import { ALPHABET_GUIDES, AlphabetCharacter, WritingSystemSection } from '../services/alphabetData';
import { LINGUISTIC_MASTERCLASS_DATA } from '../services/alphabet-masterclass-data';

export const AlphabetsPage: React.FC = () => {
  const { currentThemeConfig } = useSettings();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>('vi');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedChar, setCopiedChar] = useState<string | null>(null);
  const [showMasterclass, setShowMasterclass] = useState(true);
  const [masterclassTab, setMasterclassTab] = useState<'rules' | 'phonetics' | 'mistakes' | 'history'>('rules');

  const guide = ALPHABET_GUIDES[selectedLang] || ALPHABET_GUIDES.vi;
  const masterclass = LINGUISTIC_MASTERCLASS_DATA[selectedLang] || LINGUISTIC_MASTERCLASS_DATA.vi;
  const langInfo = getLanguageInfo(selectedLang);

  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langInfo.speechVoiceLang;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (char: string) => {
    navigator.clipboard.writeText(char);
    setCopiedChar(char);
    setTimeout(() => setCopiedChar(null), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* ── HEADER ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-stone-100 text-stone-700 border border-stone-200">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>HỆ THỐNG VĂN TỰ TOÀN CẦU</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          Bảng Chữ Cái & Hệ Thống Ký Tự
        </h1>
        <p className="text-stone-500 text-sm sm:text-base max-w-2xl mx-auto">
          Tra cứu quy chuẩn bảng chữ cái, phiên âm, dấu thanh và phát âm chuẩn của 11 ngôn ngữ trên thế giới.
        </p>
      </div>

      {/* ── LANGUAGE TABS BAR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {SUPPORTED_LANGUAGES.map((l) => {
          const isActive = l.code === selectedLang;
          return (
            <button
              key={l.code}
              onClick={() => {
                setSelectedLang(l.code);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition flex-shrink-0 ${
                isActive
                  ? 'bg-stone-900 text-white shadow-sm scale-102'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW CARD FOR SELECTED LANGUAGE ── */}
      <div className={`p-6 rounded-2xl border transition-all ${currentThemeConfig.cardStyle} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{langInfo.flag}</span>
            <div>
              <h2 className="text-xl font-bold text-stone-900">{guide.title}</h2>
              <p className="text-xs text-stone-500">
                Phân loại: <strong className="text-stone-800">{guide.systemType}</strong>
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm ký tự, phiên âm..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Description / Rules */}
        {guide.description && (
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-950 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Mô tả đặc trưng:</span> {guide.description}
            </div>
          </div>
        )}

        {/* ── LINGUISTIC MASTERCLASS GUIDE (CẨM NANG CHUYÊN SÂU) ── */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-50 via-white to-blue-50/30 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-stone-900 tracking-tight">
                  Cẩm Nang Ngôn Ngữ & Phát Âm Chuyên Sâu ({langInfo.name})
                </h3>
                <p className="text-[11px] text-stone-500">
                  Phân tích cấu trúc âm vị, quy tắc ghép vần, kỹ thuật khẩu hình và mẹo tránh lỗi phổ biến.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMasterclass(!showMasterclass)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition border border-stone-200"
            >
              <span>{showMasterclass ? 'Thu gọn' : 'Xem cẩm nang'}</span>
              {showMasterclass ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showMasterclass && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setMasterclassTab('rules')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    masterclassTab === 'rules'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Quy Tắc Cấu Trúc ({masterclass.structuralRules.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMasterclassTab('phonetics')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    masterclassTab === 'phonetics'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Kỹ Thuật Phát Âm ({masterclass.phoneticTips.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMasterclassTab('mistakes')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    masterclassTab === 'mistakes'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Mẹo & Lỗi Hay Mắc ({masterclass.learnerMistakesAndMnemonics.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMasterclassTab('history')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    masterclassTab === 'history'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Nguồn Gốc Lịch Sử</span>
                </button>
              </div>

              {/* Tab Content Panes */}
              <div className="p-4 rounded-xl bg-white border border-stone-200/80 text-xs leading-relaxed text-stone-700 space-y-2.5">
                {masterclassTab === 'rules' && (
                  <div className="space-y-2">
                    <div className="font-bold text-stone-900 text-xs uppercase tracking-wider text-blue-700">
                      Quy tắc tạo âm tiết & Cú pháp chính tả:
                    </div>
                    <ul className="space-y-2 list-disc list-inside">
                      {masterclass.structuralRules.map((rule, rIdx) => (
                        <li key={rIdx} className="text-stone-700 leading-normal">
                          <span className="font-medium text-stone-900">{rule.split(':')[0]}:</span>
                          {rule.includes(':') ? rule.substring(rule.indexOf(':') + 1) : rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {masterclassTab === 'phonetics' && (
                  <div className="space-y-2">
                    <div className="font-bold text-stone-900 text-xs uppercase tracking-wider text-emerald-700">
                      Hướng dẫn khẩu hình, cao độ & ngữ điệu:
                    </div>
                    <ul className="space-y-2 list-disc list-inside">
                      {masterclass.phoneticTips.map((tip, tIdx) => (
                        <li key={tIdx} className="text-stone-700 leading-normal">
                          <span className="font-medium text-stone-900">{tip.split(':')[0]}:</span>
                          {tip.includes(':') ? tip.substring(tip.indexOf(':') + 1) : tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {masterclassTab === 'mistakes' && (
                  <div className="space-y-2">
                    <div className="font-bold text-stone-900 text-xs uppercase tracking-wider text-amber-700">
                      Mẹo học nhanh & Các bẫy phát âm người học hay mắc:
                    </div>
                    <ul className="space-y-2 list-disc list-inside">
                      {masterclass.learnerMistakesAndMnemonics.map((item, mIdx) => (
                        <li key={mIdx} className="text-stone-700 leading-normal">
                          <span className="font-medium text-stone-900">{item.split(':')[0]}:</span>
                          {item.includes(':') ? item.substring(item.indexOf(':') + 1) : item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {masterclassTab === 'history' && (
                  <div className="space-y-2">
                    <div className="font-bold text-stone-900 text-xs uppercase tracking-wider text-purple-700">
                      Bối cảnh văn hóa & Lịch sử hình thành văn tự:
                    </div>
                    <p className="text-stone-700 leading-relaxed font-normal">
                      {masterclass.originAndHistory}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── ALPHABET SECTIONS ── */}
        <div className="space-y-6 pt-2">
          {guide.sections.map((sec: WritingSystemSection, secIdx: number) => {
            const filteredChars = sec.characters.filter((item: AlphabetCharacter) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                item.char.toLowerCase().includes(q) ||
                (item.reading && item.reading.toLowerCase().includes(q)) ||
                (item.name && item.name.toLowerCase().includes(q)) ||
                (item.meaningOrExample && item.meaningOrExample.toLowerCase().includes(q))
              );
            });

            if (filteredChars.length === 0) return null;

            return (
              <div key={secIdx} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <h3 className="text-sm font-bold text-stone-900">{sec.title}</h3>
                  <span className="text-xs text-stone-400">({filteredChars.length} ký tự)</span>
                </div>

                {sec.description && (
                  <p className="text-xs text-stone-500 italic -mt-1">{sec.description}</p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filteredChars.map((item: AlphabetCharacter, itemIdx: number) => {
                    const isCopied = copiedChar === item.char;

                    return (
                      <div
                        key={itemIdx}
                        className="group relative p-3 rounded-xl bg-white border border-stone-200 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between space-y-1.5"
                      >
                        <div className="flex items-start justify-between">
                          <div
                            onClick={() => handleSpeak(item.char.split(' ')[0] || item.char)}
                            title="Bấm để nghe phát âm"
                            className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-blue-600 cursor-pointer transition select-all"
                          >
                            {item.char}
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleSpeak(item.char.split(' ')[0] || item.char)}
                              title="Nghe"
                              className="p-1 text-stone-400 hover:text-blue-600 rounded"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopy(item.char)}
                              title="Sao chép"
                              className="p-1 text-stone-400 hover:text-stone-700 rounded"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Reading & Name */}
                        <div>
                          {item.reading && (
                            <div className="text-xs font-mono font-semibold text-blue-600">
                              {item.reading}
                            </div>
                          )}
                          {item.name && (
                            <div className="text-[11px] text-stone-500 line-clamp-1">{item.name}</div>
                          )}
                        </div>

                        {/* Meaning or Example */}
                        {item.meaningOrExample && (
                          <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                            {item.meaningOrExample}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default AlphabetsPage;
