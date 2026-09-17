import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ParticleCanvas } from './components/ParticleCanvas';
import { SettingsModal } from './components/SettingsModal';
import { useSettings } from './contexts/SettingsContext';
import { Database, ShieldCheck, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const { particle, currentThemeConfig, textModel } = useSettings();

  return (
    <div className={`min-h-screen relative flex flex-col transition-colors duration-300 ${currentThemeConfig.bgStyle}`}>
      {/* Dynamic Ambient Particle Canvas (default: 'none' / no particles) */}
      <ParticleCanvas type={particle} />

      {/* Global Top Navigation Bar with Bi-directional Selector */}
      <Navbar />

      {/* Main Routed Page Content */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* System Settings Modal */}
      <SettingsModal />

      {/* Global Footer */}
      <footer className="relative z-10 border-t border-stone-200/60 bg-white/60 backdrop-blur-xs py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentThemeConfig.accentColor }}
            />
            <span className="font-bold text-stone-800">ARUKAS 2.0</span>
            <span>—</span>
            <span>Bộ Công Cụ Phân Tích Đa Ngôn Ngữ 2 Chiều & AI Cục Bộ</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <span className="inline-flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-stone-400" />
              <span>100% Lưu Cục Bộ (IndexedDB)</span>
            </span>

            <span className="inline-flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-stone-400" />
              <span>Ollama: {textModel}</span>
            </span>

            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Không Quảng Cáo & Không Tài Khoản</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
