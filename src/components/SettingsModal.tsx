import React, { useState } from 'react';
import { useSettings, THEME_CONFIGS } from '../contexts/SettingsContext';
import { ThemeId, ParticleType } from '../types';
import { exportAllLocalData, importLocalData, clearAllHistory } from '../services/localDbService';
import { X, Check, RefreshCw, Download, Upload, Trash2, Copy, Sparkles, Cpu, Palette, Database } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    closeSettings,
    theme,
    setTheme,
    particle,
    setParticle,
    ollamaEndpoint,
    setOllamaEndpoint,
    textModel,
    setTextModel,
    visionModel,
    setVisionModel,
    isOllamaConnected,
    ollamaLatency,
    availableModels,
    refreshOllama,
  } = useSettings();

  const [endpointInput, setEndpointInput] = useState(ollamaEndpoint);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  if (!isSettingsOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setOllamaEndpoint(endpointInput);
    await refreshOllama();
    setIsTesting(false);
  };

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleExport = async () => {
    const json = await exportAllLocalData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arukas2_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('Đã xuất dữ liệu thành công!');
    setTimeout(() => setBackupMsg(null), 3000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = await importLocalData(text);
    if (res.success) {
      setBackupMsg(`Đã nhập thành công ${res.count} mục dữ liệu!`);
    } else {
      setBackupMsg(`Lỗi nhập: ${res.error}`);
    }
    setTimeout(() => setBackupMsg(null), 4000);
  };

  const particleOptions: { type: ParticleType; label: string; icon: string }[] = [
    { type: 'none', label: 'Không rơi (Mặc định tĩnh)', icon: '⚪' },
    { type: 'sakura', label: 'Cánh hoa anh đào (Nhật)', icon: '🌸' },
    { type: 'bamboo', label: 'Lá tre & lá sen (Việt Nam)', icon: '🌿' },
    { type: 'ginkgo', label: 'Lá ngân hạnh & phong (Hàn)', icon: '🍂' },
    { type: 'ink', label: 'Mây bồng & bụi vàng (Trung)', icon: '🏮' },
    { type: 'snow', label: 'Bông tuyết & băng rơi (Nga/Đức)', icon: '❄️' },
    { type: 'sunlight', label: 'Cúc dại & nắng ấm (Tây Ban Nha/Ý)', icon: '🌻' },
    { type: 'lavender', label: 'Hoa oải hương (Pháp/Anh)', icon: '🪻' },
  ];

  const recommendedModels = [
    { name: 'qwen2.5:7b', role: 'Dịch & Phân tích Đa ngữ (Khuyên dùng)', cmd: 'ollama run qwen2.5:7b' },
    { name: 'qwen2.5vl:7b', role: 'Thị giác OCR & Video (Đã có sẵn trên máy)', cmd: 'ollama run qwen2.5vl:7b' },
    { name: 'llama3.1:latest', role: 'Ngôn ngữ Âu Mỹ & Logic (Đã có sẵn)', cmd: 'ollama run llama3.1' },
    { name: 'deepseek-r1:8b', role: 'Suy luận & Ngữ pháp chuyên sâu', cmd: 'ollama run deepseek-r1:8b' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">Cài Đặt Hệ Thống ARUKAS 2</h2>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6 text-xs text-stone-700 dark:text-zinc-300">
          {/* Section 1: Ollama Local AI */}
          <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-white">
                <Cpu className="h-4 w-4 text-emerald-500" />
                Cấu Hình Ollama AI (Chạy Cục Bộ)
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  isOllamaConnected
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {isOllamaConnected ? `Đã kết nối (${ollamaLatency}ms)` : 'Chưa kết nối'}
              </span>
            </div>

            {/* Endpoint Input */}
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={endpointInput}
                onChange={(e) => setEndpointInput(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                Kiểm tra
              </button>
            </div>

            {/* Model Selectors */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium text-stone-600 dark:text-zinc-400">
                  Model Dịch & Phân Tích (Text)
                </label>
                <select
                  value={textModel}
                  onChange={(e) => setTextModel(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {availableModels.length === 0 && (
                    <option value={textModel}>{textModel} (Mặc định)</option>
                  )}
                  {availableModels.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-stone-600 dark:text-zinc-400">
                  Model Thị Giác / OCR (Vision)
                </label>
                <select
                  value={visionModel}
                  onChange={(e) => setVisionModel(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {availableModels
                    .filter((m) => m.isVision)
                    .map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} (Vision)
                      </option>
                    ))}
                  {availableModels.filter((m) => m.isVision).length === 0 && (
                    <option value={visionModel}>{visionModel} (Đã có)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-3 rounded-lg border border-stone-200/60 bg-white/70 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
              <span className="mb-1.5 block font-semibold text-stone-800 dark:text-zinc-200">
                💡 Gợi ý lệnh cài đặt model trong Terminal:
              </span>
              <div className="space-y-1">
                {recommendedModels.map((rec) => (
                  <div key={rec.name} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-stone-600 dark:text-zinc-400">
                      <strong className="text-stone-900 dark:text-white">{rec.name}</strong>: {rec.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(rec.cmd)}
                      className="flex items-center gap-1 font-mono text-[10px] text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {copiedCmd === rec.cmd ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      {rec.cmd}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Themes & Palette */}
          <div>
            <span className="mb-2.5 flex items-center gap-1.5 font-bold text-stone-900 dark:text-white">
              <Palette className="h-4 w-4 text-rose-500" />
              Theme Giao Diện (Nhẹ nhàng & Tinh tế)
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(THEME_CONFIGS) as ThemeId[]).map((tId) => {
                const cfg = THEME_CONFIGS[tId];
                const isSelected = theme === tId;
                return (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => {
                      setTheme(tId);
                      // Set default particle for this theme
                      setParticle(cfg.defaultParticle);
                    }}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs dark:border-blue-400 dark:bg-blue-950/30'
                        : 'border-stone-200 hover:bg-stone-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <span className="text-base">{cfg.countryFlag}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-stone-900 dark:text-white">{cfg.name}</p>
                      <p className="truncate text-[10px] text-stone-500 dark:text-zinc-400">{cfg.country}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Particle Effects */}
          <div>
            <span className="mb-2.5 flex items-center gap-1.5 font-bold text-stone-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Hiệu Ứng Hạt Rơi (Tùy Chọn)
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {particleOptions.map((opt) => {
                const isSelected = particle === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setParticle(opt.type)}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-xs dark:border-amber-400 dark:bg-amber-950/30'
                        : 'border-stone-200 hover:bg-stone-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <span className="text-sm">{opt.icon}</span>
                    <span className="text-xs font-medium text-stone-800 dark:text-zinc-200">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Local Database & Backup */}
          <div className="rounded-xl border border-stone-200 p-4 dark:border-zinc-800">
            <span className="mb-2 flex items-center gap-1.5 font-bold text-stone-900 dark:text-white">
              <Database className="h-4 w-4 text-indigo-500" />
              Cơ Sở Dữ Liệu Local (IndexedDB)
            </span>
            <p className="mb-3 text-[11px] text-stone-500 dark:text-zinc-400">
              Toàn bộ từ vựng, ngữ pháp và bản dịch được lưu 100% trên trình duyệt của bạn, hoàn toàn bảo mật và riêng tư.
            </p>

            {backupMsg && (
              <p className="mb-3 rounded-md bg-emerald-50 p-2 text-center text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {backupMsg}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <Download className="h-3.5 w-3.5" />
                Xuất Backup JSON
              </button>

              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <Upload className="h-3.5 w-3.5" />
                Nhập Backup JSON
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>

              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử phân tích không?')) {
                    await clearAllHistory();
                    setBackupMsg('Đã xóa toàn bộ lịch sử!');
                    setTimeout(() => setBackupMsg(null), 3000);
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa lịch sử
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
