import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../types';
import {
  ArrowLeftRight,
  Settings,
  Sparkles,
  BookOpen,
  Eye,
  Bookmark,
  Cpu,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const {
    sourceLang,
    setSourceLang,
    targetLang,
    setTargetLang,
    swapLanguages,
    isOllamaConnected,
    ollamaLatency,
    textModel,
    openSettings,
    currentThemeConfig,
  } = useSettings();

  const navLinks = [
    { path: '/', label: 'Phân Tích Câu', icon: Sparkles },
    { path: '/media', label: 'Ảnh & Video', icon: Eye },
    { path: '/alphabets', label: 'Bảng Chữ Cái', icon: BookOpen },
    { path: '/hub', label: 'Kho Tri Thức & So Sánh', icon: Bookmark },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 backdrop-blur-md transition-all shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: Brand Logo + Status */}
        <div className="flex items-center gap-4 lg:gap-8">
          <Link to="/" className="group flex items-center gap-2.5 select-none">
            <div
              className="relative flex h-9 w-9 items-center justify-center rounded-xl font-extrabold text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
              style={{ backgroundColor: currentThemeConfig.accentColor }}
            >
              <span>A2</span>
              {/* Pulsing Status Dot */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                  isOllamaConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
                title={isOllamaConnected ? `Ollama đã kết nối (${ollamaLatency}ms)` : 'Ollama ngoại tuyến'}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-extrabold tracking-tight text-stone-900 text-sm sm:text-base">
                <span>ARUKAS</span>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-black uppercase text-white tracking-wider"
                  style={{ backgroundColor: currentThemeConfig.accentColor }}
                >
                  2.0
                </span>
              </div>
              <p className="text-[10px] font-medium text-stone-400 -mt-0.5">
                Local-First Linguistic Suite
              </p>
            </div>
          </Link>

          {/* Navigation Segmented Pills (Desktop) */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-stone-100/90 border border-stone-200/60 shadow-inner">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-stone-900 shadow-xs scale-102 font-bold'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-white/50'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-stone-400'
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Model Badge + Bi-directional Language Switcher + Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Model Pill Badge (Click to open settings) */}
          <button
            type="button"
            onClick={openSettings}
            title="Nhấn để đổi mô hình hoặc cấu hình Ollama"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-stone-100/80 hover:bg-stone-200/80 border border-stone-200 text-stone-700 font-mono transition group"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-stone-800 truncate max-w-[120px]">{textModel}</span>
            {isOllamaConnected ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-sans font-medium">
                <Wifi className="w-2.5 h-2.5" />
                <span>{ollamaLatency}ms</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-sans font-medium">
                <WifiOff className="w-2.5 h-2.5" />
                <span>Off</span>
              </span>
            )}
          </button>

          {/* Bi-directional Language Pill Selector ⇄ */}
          <div className="flex items-center rounded-xl border border-stone-200/90 bg-stone-50/90 p-0.5 shadow-2xs">
            {/* Source Lang */}
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as LanguageCode | 'auto')}
              className="rounded-lg bg-transparent px-2 py-1 text-xs font-semibold text-stone-700 outline-none hover:bg-white transition cursor-pointer"
              aria-label="Ngôn ngữ nguồn"
            >
              <option value="auto">🌐 Tự động</option>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>

            {/* Swap Button with 360 Spin on click */}
            <button
              type="button"
              onClick={swapLanguages}
              title="Đảo chiều phân tích 2 chiều"
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-white transition-all active:scale-90"
              aria-label="Đảo ngôn ngữ"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>

            {/* Target Lang */}
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="rounded-lg bg-transparent px-2 py-1 text-xs font-semibold text-stone-700 outline-none hover:bg-white transition cursor-pointer"
              aria-label="Ngôn ngữ đích"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Settings Trigger Button */}
          <button
            type="button"
            onClick={openSettings}
            title="Cài đặt hệ thống, Theme & Hạt rơi"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition shadow-2xs group"
          >
            <Settings className="h-4 w-4 transition-transform group-hover:rotate-45" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer Row */}
      <div className="flex md:hidden items-center justify-around px-2 py-1.5 border-t border-stone-100 bg-stone-50/70 text-xs">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                isActive
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
export default Navbar;
