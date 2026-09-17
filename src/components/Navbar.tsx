import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../types';
import { ArrowLeftRight, Settings, Sparkles, BookOpen, Image, Bookmark, Cpu } from 'lucide-react';

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
    { path: '/', label: 'Phân tích câu', icon: Sparkles },
    { path: '/media', label: 'Ảnh & Video', icon: Image },
    { path: '/alphabets', label: 'Bảng chữ cái', icon: BookOpen },
    { path: '/hub', label: 'Kho lưu trữ', icon: Bookmark },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/80 backdrop-blur-md transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: currentThemeConfig.accentColor }}
            >
              A2
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-stone-900 dark:text-white sm:text-lg">
                <span>ARUKAS</span>
                <span
                  className="rounded-md px-1.5 py-0.2 text-xs font-extrabold text-white"
                  style={{ backgroundColor: currentThemeConfig.accentColor }}
                >
                  2.0
                </span>
              </div>
              <p className="text-[10px] font-medium text-stone-500 dark:text-zinc-400">
                Local-First Multi-Language
              </p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-stone-100 text-stone-900 shadow-xs dark:bg-zinc-800 dark:text-white'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center/Right: Bi-directional Language Selector ⇄ */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-xl border border-stone-200/80 bg-stone-50/70 p-1 text-xs shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/70">
            {/* Source Lang */}
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as LanguageCode | 'auto')}
              className="rounded-lg bg-transparent px-2 py-1 font-medium text-stone-700 outline-none hover:bg-white dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Ngôn ngữ nguồn"
            >
              <option value="auto">🌐 Tự động phát hiện</option>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>

            {/* Swap Button */}
            <button
              type="button"
              onClick={swapLanguages}
              title="Đổi chiều ngôn ngữ"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 transition-transform hover:scale-110 hover:bg-white hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>

            {/* Target Lang */}
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="rounded-lg bg-transparent px-2 py-1 font-medium text-stone-700 outline-none hover:bg-white dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Ngôn ngữ đích"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ollama Status Badge */}
          <button
            type="button"
            onClick={openSettings}
            title={
              isOllamaConnected
                ? `Ollama online (${ollamaLatency}ms) - Model: ${textModel}`
                : 'Ollama offline - Click để kiểm tra cài đặt'
            }
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOllamaConnected ? 'bg-emerald-500 shadow-xs shadow-emerald-500' : 'bg-rose-500'
              }`}
            />
            <Cpu className="hidden h-3.5 w-3.5 sm:inline" />
            <span className="hidden max-w-[90px] truncate text-[11px] sm:inline">
              {isOllamaConnected ? textModel : 'Ollama Offline'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={openSettings}
            title="Cài đặt Theme, Hạt rơi, Model"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-600 transition-transform hover:scale-105 hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="flex items-center justify-around border-t border-stone-200/60 py-1.5 md:hidden dark:border-zinc-800/60">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center py-1 text-[10px] font-medium ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-stone-500 dark:text-zinc-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;
