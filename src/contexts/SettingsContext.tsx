import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ThemeId,
  ParticleType,
  LanguageCode,
  ThemeConfig,
  OllamaModelInfo,
} from '../types';
import { checkOllamaConnection, fetchAvailableModels, DEFAULT_OLLAMA_ENDPOINT } from '../services/ollamaService';

export const THEME_CONFIGS: Record<ThemeId, ThemeConfig> = {
  'minimal-white': {
    id: 'minimal-white',
    name: 'Trắng Tinh Khôi (Mặc định)',
    country: 'Tối giản Hiện đại',
    countryFlag: '⚪',
    defaultParticle: 'none',
    accentColor: '#3b82f6',
    bgStyle: 'bg-stone-50/60 text-stone-800',
    cardStyle: 'bg-white border-stone-200 shadow-sm',
  },
  'minimal-dark': {
    id: 'minimal-dark',
    name: 'Đêm Huyền Bí (Dark Mode)',
    country: 'Hiện đại Tối',
    countryFlag: '🌙',
    defaultParticle: 'none',
    accentColor: '#60a5fa',
    bgStyle: 'bg-zinc-950 text-zinc-100',
    cardStyle: 'bg-zinc-900 border-zinc-800 shadow-sm',
  },
  sakura: {
    id: 'sakura',
    name: 'Hoa Anh Đào (Sakura)',
    country: 'Nhật Bản',
    countryFlag: '🇯🇵',
    defaultParticle: 'sakura',
    accentColor: '#f43f5e',
    bgStyle: 'bg-rose-50/50 text-stone-800',
    cardStyle: 'bg-white/95 border-rose-100 shadow-sm',
  },
  bamboo: {
    id: 'bamboo',
    name: 'Trúc Xanh & Sen Việt',
    country: 'Việt Nam',
    countryFlag: '🇻🇳',
    defaultParticle: 'bamboo',
    accentColor: '#10b981',
    bgStyle: 'bg-emerald-50/40 text-stone-800',
    cardStyle: 'bg-white/95 border-emerald-100 shadow-sm',
  },
  ginkgo: {
    id: 'ginkgo',
    name: 'Ngân Hạnh & Phong Đỏ',
    country: 'Hàn Quốc',
    countryFlag: '🇰🇷',
    defaultParticle: 'ginkgo',
    accentColor: '#f59e0b',
    bgStyle: 'bg-amber-50/40 text-stone-800',
    cardStyle: 'bg-white/95 border-amber-100 shadow-sm',
  },
  ink: {
    id: 'ink',
    name: 'Thủy Mặc & Trà Hoa',
    country: 'Trung Quốc',
    countryFlag: '🇨🇳',
    defaultParticle: 'ink',
    accentColor: '#ef4444',
    bgStyle: 'bg-[#faf6f0] text-stone-800',
    cardStyle: 'bg-white/95 border-stone-200 shadow-sm',
  },
  frost: {
    id: 'frost',
    name: 'Băng Tuyết Mùa Đông',
    country: 'Nga & Đức',
    countryFlag: '❄️',
    defaultParticle: 'snow',
    accentColor: '#0ea5e9',
    bgStyle: 'bg-sky-50/40 text-stone-800',
    cardStyle: 'bg-white/95 border-sky-100 shadow-sm',
  },
  mediterranean: {
    id: 'mediterranean',
    name: 'Nắng Ấm Địa Trung Hải',
    country: 'Tây Ban Nha & Ý',
    countryFlag: '🌻',
    defaultParticle: 'sunlight',
    accentColor: '#f97316',
    bgStyle: 'bg-orange-50/40 text-stone-800',
    cardStyle: 'bg-white/95 border-orange-100 shadow-sm',
  },
  lavender: {
    id: 'lavender',
    name: 'Oải Hương Tinh Tế',
    country: 'Pháp & Anh',
    countryFlag: '🪻',
    defaultParticle: 'lavender',
    accentColor: '#8b5cf6',
    bgStyle: 'bg-purple-50/40 text-stone-800',
    cardStyle: 'bg-white/95 border-purple-100 shadow-sm',
  },
};

interface SettingsContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  particle: ParticleType;
  setParticle: (p: ParticleType) => void;
  sourceLang: LanguageCode | 'auto';
  setSourceLang: (l: LanguageCode | 'auto') => void;
  targetLang: LanguageCode;
  setTargetLang: (l: LanguageCode) => void;
  swapLanguages: () => void;
  ollamaEndpoint: string;
  setOllamaEndpoint: (url: string) => void;
  textModel: string;
  setTextModel: (m: string) => void;
  visionModel: string;
  setVisionModel: (m: string) => void;
  isOllamaConnected: boolean;
  ollamaLatency: number;
  availableModels: OllamaModelInfo[];
  refreshOllama: () => Promise<void>;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  currentThemeConfig: ThemeConfig;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEYS = {
  THEME: 'arukas2_theme',
  PARTICLE: 'arukas2_particle',
  SRC_LANG: 'arukas2_source_lang',
  TGT_LANG: 'arukas2_target_lang',
  ENDPOINT: 'arukas2_ollama_endpoint',
  TEXT_MODEL: 'arukas2_text_model',
  VISION_MODEL: 'arukas2_vision_model',
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeId) || 'minimal-white';
  });

  const [particle, setParticleState] = useState<ParticleType>(() => {
    return (localStorage.getItem(STORAGE_KEYS.PARTICLE) as ParticleType) || 'none';
  });

  const [sourceLang, setSourceLangState] = useState<LanguageCode | 'auto'>('auto');
  const [targetLang, setTargetLangState] = useState<LanguageCode>('vi');

  const [ollamaEndpoint, setOllamaEndpointState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ENDPOINT) || DEFAULT_OLLAMA_ENDPOINT;
  });

  const [textModel, setTextModelState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.TEXT_MODEL) || 'llama3.1:latest';
  });

  const [visionModel, setVisionModelState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.VISION_MODEL) || 'qwen2.5vl:7b';
  });

  const [isOllamaConnected, setIsOllamaConnected] = useState(false);
  const [ollamaLatency, setOllamaLatency] = useState(0);
  const [availableModels, setAvailableModels] = useState<OllamaModelInfo[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEYS.THEME, t);
  };

  const setParticle = (p: ParticleType) => {
    setParticleState(p);
    localStorage.setItem(STORAGE_KEYS.PARTICLE, p);
  };

  const setSourceLang = (l: LanguageCode | 'auto') => {
    setSourceLangState(l);
    localStorage.setItem(STORAGE_KEYS.SRC_LANG, l);
  };

  const setTargetLang = (l: LanguageCode) => {
    setTargetLangState(l);
    localStorage.setItem(STORAGE_KEYS.TGT_LANG, l);
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') {
      setSourceLang(targetLang);
      setTargetLang('en');
    } else {
      const prevSource = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(prevSource);
    }
  };

  const setOllamaEndpoint = (url: string) => {
    setOllamaEndpointState(url);
    localStorage.setItem(STORAGE_KEYS.ENDPOINT, url);
  };

  const setTextModel = (m: string) => {
    setTextModelState(m);
    localStorage.setItem(STORAGE_KEYS.TEXT_MODEL, m);
  };

  const setVisionModel = (m: string) => {
    setVisionModelState(m);
    localStorage.setItem(STORAGE_KEYS.VISION_MODEL, m);
  };

  const refreshOllama = useCallback(async () => {
    const { isConnected, latencyMs } = await checkOllamaConnection(ollamaEndpoint);
    setIsOllamaConnected(isConnected);
    setOllamaLatency(latencyMs);

    if (isConnected) {
      const models = await fetchAvailableModels(ollamaEndpoint);
      setAvailableModels(models);

      // Auto pick model if current not set or default
      if (models.length > 0) {
        const textNames = models.filter((m) => !m.isVision).map((m) => m.name);
        const visionNames = models.filter((m) => m.isVision).map((m) => m.name);

        if (!textNames.includes(textModel)) {
          const preferred = textNames.find((n) => n.includes('qwen') || n.includes('llama')) || models[0].name;
          setTextModel(preferred);
        }
        if (!visionNames.includes(visionModel)) {
          const preferredVision = visionNames[0] || models[0].name;
          setVisionModel(preferredVision);
        }
      }
    }
  }, [ollamaEndpoint, textModel, visionModel]);

  useEffect(() => {
    refreshOllama();
  }, [refreshOllama]);

  const currentThemeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS['minimal-white'];

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        particle,
        setParticle,
        sourceLang,
        setSourceLang,
        targetLang,
        setTargetLang,
        swapLanguages,
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
        isSettingsOpen,
        openSettings: () => setIsSettingsOpen(true),
        closeSettings: () => setIsSettingsOpen(false),
        currentThemeConfig,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
