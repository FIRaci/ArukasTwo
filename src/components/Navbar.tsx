import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { SUPPORTED_UI_LANGUAGES, UILanguage } from '../services/i18n';
import {
  Settings,
  Sparkles,
  BookOpen,
  Eye,
  Bookmark,
  Cpu,
  Wifi,
  WifiOff,
  Globe,
  ChevronDown,
  Check,
  HelpCircle,
  Mic,
} from 'lucide-react';
import { UserGuideModal } from './UserGuideModal';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const {
    uiLang,
    setUILang,
    t,
    isOllamaConnected,
    ollamaLatency,
    textModel,
    openSettings,
    currentThemeConfig,
  } = useSettings();

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: '/', label: t('nav_analyze'), icon: Sparkles },
    { path: '/speech', label: t('nav_speech'), icon: Mic },
    { path: '/media', label: t('nav_media'), icon: Eye },
    { path: '/alphabets', label: t('nav_alphabets'), icon: BookOpen },
    { path: '/hub', label: t('nav_hub'), icon: Bookmark },
  ];

  const currentUILangInfo =
    SUPPORTED_UI_LANGUAGES.find((l) => l.code === uiLang) || SUPPORTED_UI_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md transition-all shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* ── LEFT: Brand Logo & Title ── */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <Link to="/" className="group flex items-center gap-2.5 select-none">
            <div
              className="relative flex h-9 w-9 items-center justify-center rounded-xl font-black text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
              style={{ backgroundColor: currentThemeConfig.accentColor }}
            >
              <span>A2</span>
              {/* Pulsing AI status indicator */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                  isOllamaConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
                title={isOllamaConnected ? `Ollama connected (${ollamaLatency}ms)` : 'Ollama offline'}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-black tracking-tight text-stone-900 text-sm sm:text-base leading-none">
                <span>ARUKAS</span>
                <span
                  className="rounded px-1 py-0.5 text-[10px] font-black uppercase text-white tracking-wider"
                  style={{ backgroundColor: currentThemeConfig.accentColor }}
                >
                  2.0
                </span>
              </div>
              <p className="text-[10px] font-medium text-stone-400 mt-0.5">
                {t('app_subtitle')}
              </p>
            </div>
          </Link>
        </div>

        {/* ── CENTER: Segmented Studio Navigation Ribbon ── */}
        <nav className="hidden md:flex items-center p-1 rounded-2xl bg-stone-100/90 border border-stone-200/70 shadow-inner">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-xs scale-102 font-black text-blue-600'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-white/60'
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

        {/* ── RIGHT: UI Language Selector + AI Model Pill + Settings ── */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-[200px] justify-end">
          {/* 🌐 Website Interface Language Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              title={t('change_ui_lang')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200/90 bg-stone-50 hover:bg-white text-xs font-bold text-stone-700 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-sm leading-none">{currentUILangInfo.flag}</span>
              <span className="hidden lg:inline">{currentUILangInfo.name}</span>
              <ChevronDown className="w-3 h-3 text-stone-400 ml-0.5" />
            </button>

            {/* Language Dropdown Menu */}
            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-stone-200 shadow-xl p-1.5 space-y-1 z-50 animate-fadeIn">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 mb-1">
                  {t('change_ui_lang')}
                </div>
                {SUPPORTED_UI_LANGUAGES.map((item) => {
                  const isSelected = item.code === uiLang;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setUILang(item.code as UILanguage);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.flag}</span>
                        <span>{item.nativeName}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Model Pill Badge */}
          <button
            type="button"
            onClick={openSettings}
            title={`${t('model_active')}: ${textModel} (${isOllamaConnected ? `${ollamaLatency}ms` : 'Offline'})`}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-stone-700 font-mono transition group cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-stone-800 truncate max-w-[100px]">{textModel}</span>
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

          {/* User Guide Trigger Button */}
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            title="Cẩm Nang Hướng Dẫn Sử Dụng (User Guide)"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-blue-600 hover:bg-stone-50 transition shadow-2xs group cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
          </button>

          {/* Settings Trigger Gear Button */}
          <button
            type="button"
            onClick={openSettings}
            title={t('settings_title')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition shadow-2xs group cursor-pointer"
          >
            <Settings className="h-4 w-4 transition-transform group-hover:rotate-45" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="flex md:hidden items-center justify-around px-2 py-1.5 border-t border-stone-100 bg-stone-50/80 text-xs">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition ${
                isActive
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User Guide Modal */}
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </header>
  );
};
export default Navbar;
