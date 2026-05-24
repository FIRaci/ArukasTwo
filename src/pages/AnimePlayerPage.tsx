import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import SettingsPanel from '../components/SettingsPanel';
import TutorialPanel from '../components/TutorialPanel';
import AuthModal from '../components/AuthModal';
import FallingPetals from '../components/FallingPetals';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import { analyzeAnimeClip, formatTime } from '../services/animeAnalysisEngine';
import { saveAnimeSession, deleteAnimeSession, loadAnimeSessions } from '../services/firestoreService';
import { AnimeCharacter, AnimeDialogueLine, SavedAnimeSession } from '../types';

// ============================================================
//  CONSTANTS
// ============================================================
const COLOR_PRESETS = [
  { key: 'rose',    label: 'Hồng',        dot: 'bg-rose-400' },
  { key: 'sky',     label: 'Xanh dương',   dot: 'bg-sky-400' },
  { key: 'emerald', label: 'Xanh lá',      dot: 'bg-emerald-400' },
  { key: 'amber',   label: 'Vàng',         dot: 'bg-amber-400' },
  { key: 'purple',  label: 'Tím',          dot: 'bg-purple-400' },
  { key: 'cyan',    label: 'Lục lam',      dot: 'bg-cyan-400' },
  { key: 'pink',    label: 'Hồng nhạt',    dot: 'bg-pink-400' },
  { key: 'indigo',  label: 'Chàm',         dot: 'bg-indigo-400' },
];

// ============================================================
//  CUSTOM SVG EMOTION ICONS — Theme-consistent rose/stone palette
// ============================================================
const EmotionIcon: React.FC<{ emotion: string; className?: string }> = ({ emotion, className = 'w-4 h-4' }) => {
  const base = `${className} flex-shrink-0`;
  switch (emotion) {
    case 'happy':
      return <svg className={base} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-amber-400"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-amber-500"/><circle cx="9" cy="10" r="1" fill="currentColor" className="text-amber-500"/><circle cx="15" cy="10" r="1" fill="currentColor" className="text-amber-500"/></svg>;
    case 'angry':
      return <svg className={base} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-red-400"/><path d="M8 15s1.5 1 4 1 4-1 4-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-red-500"/><line x1="7" y1="8" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-red-500"/><line x1="17" y1="8" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-red-500"/><circle cx="9" cy="11" r="0.8" fill="currentColor" className="text-red-500"/><circle cx="15" cy="11" r="0.8" fill="currentColor" className="text-red-500"/></svg>;
    case 'sad':
      return <svg className={base} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-sky-400"/><path d="M8 16s1.5-2 4-2 4 2 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-sky-500"/><circle cx="9" cy="10" r="1" fill="currentColor" className="text-sky-500"/><circle cx="15" cy="10" r="1" fill="currentColor" className="text-sky-500"/><path d="M9 8c0-1 1.5-1 1.5 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-sky-400"/></svg>;
    case 'surprised':
      return <svg className={base} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-violet-400"/><ellipse cx="12" cy="16" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" className="text-violet-500"/><circle cx="9" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" className="text-violet-500"/><circle cx="15" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" className="text-violet-500"/></svg>;
    case 'scared':
      return <svg className={base} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-indigo-300"/><ellipse cx="12" cy="16" rx="2" ry="1.5" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400"/><circle cx="9" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400"/><circle cx="15" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400"/><path d="M6 4l2 2M18 4l-2 2M12 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-300"/></svg>;
    case 'excited':
      return <svg className={base} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-rose-400"/><path d="M7 13s2 3 5 3 5-3 5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-rose-500"/><path d="M7 9l3 1M17 9l-3 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-rose-500"/><path d="M5 6l1 1M19 6l-1 1M12 4v1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-rose-300"/></svg>;
    case 'serious':
      return <svg className={base} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-stone-400"/><line x1="8" y1="15" x2="16" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-stone-500"/><circle cx="9" cy="10" r="1" fill="currentColor" className="text-stone-500"/><circle cx="15" cy="10" r="1" fill="currentColor" className="text-stone-500"/><line x1="7" y1="8" x2="11" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-stone-400"/><line x1="17" y1="8" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-stone-400"/></svg>;
    default: // neutral
      return <svg className={base} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-stone-300"/><line x1="8" y1="15" x2="16" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-stone-400"/><circle cx="9" cy="10" r="1" fill="currentColor" className="text-stone-400"/><circle cx="15" cy="10" r="1" fill="currentColor" className="text-stone-400"/></svg>;
  }
};

const TYPE_LABELS: Record<string, { label: string; style: string; icon: string }> = {
  dialogue: { label: 'Hội thoại', style: 'bg-sky-50 text-sky-600 border-sky-200', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  narration: { label: 'Tường thuật', style: 'bg-amber-50 text-amber-600 border-amber-200', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2' },
  inner_thought: { label: 'Độc thoại', style: 'bg-purple-50 text-purple-600 border-purple-200', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  sfx: { label: 'SFX', style: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' },
};

const SESSIONS_CACHE_KEY = 'arukas_anime_sessions_local';

// ============================================================
//  CHARACTER MEMORY — persists characters per anime title
// ============================================================
function charMemoryKey(title: string): string {
  const norm = title.trim().toLowerCase().replace(/\s+/g, '_');
  return `arukas_char_mem_anime_${norm}`;
}

function loadCharMemory(title: string): AnimeCharacter[] {
  if (!title.trim()) return [];
  try {
    const raw = localStorage.getItem(charMemoryKey(title));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCharMemory(title: string, chars: AnimeCharacter[]) {
  if (!title.trim() || chars.length === 0) return;
  try {
    localStorage.setItem(charMemoryKey(title), JSON.stringify(chars));
  } catch { /* quota */ }
}

// ============================================================
//  HELPERS
// ============================================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ============================================================
//  COMPONENT
// ============================================================
const AnimePlayerPage: React.FC = () => {
  const { settings, openSettings } = useSettings();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(() => {
    try { return localStorage.getItem('arukas_navbar_hidden') === 'true'; } catch { return false; }
  });

  // --- Core state ---
  const [animeTitle, setAnimeTitle] = useState('');
  const [episodeLabel, setEpisodeLabel] = useState('');
  const [characters, setCharacters] = useState<AnimeCharacter[]>([]);
  const [lines, setLines] = useState<AnimeDialogueLine[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [charMemoryLoaded, setCharMemoryLoaded] = useState(false);

  // --- UI state ---
  const [heroCollapsed, setHeroCollapsed] = useState<boolean | null>(() => {
    try { const v = localStorage.getItem('arukas_hero_collapsed'); return v === 'true' ? true : v === 'false' ? false : null; } catch { return null; }
  });
  const [showJapanese, setShowJapanese] = useState(!settings.defaultShowVietnamese);
  const [showReading, setShowReading] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharColor, setNewCharColor] = useState('rose');
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterCharacter, setFilterCharacter] = useState<string | null>(null);

  // --- Sessions ---
  const [savedSessions, setSavedSessions] = useState<SavedAnimeSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // --- Load sessions ---
  useEffect(() => {
    if (user) {
      loadAnimeSessions(user.uid).then(setSavedSessions).catch(console.error);
    } else {
      try {
        const raw = localStorage.getItem(SESSIONS_CACHE_KEY);
        if (raw) setSavedSessions(JSON.parse(raw));
      } catch { /* ignore */ }
    }
  }, [user]);

  // --- Auto-load character memory when anime title is set ---
  useEffect(() => {
    if (!animeTitle.trim() || characters.length > 0 || charMemoryLoaded) return;
    const timer = setTimeout(() => {
      const mem = loadCharMemory(animeTitle);
      if (mem.length > 0 && characters.length === 0) {
        setCharacters(mem);
        setCharMemoryLoaded(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [animeTitle, characters.length, charMemoryLoaded]);

  // --- Video file handler ---
  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setLines([]);
    setActiveLineId(null);
    setAnalysisError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [videoUrl]);

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('video/'));
    if (file) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setLines([]);
      setActiveLineId(null);
      setAnalysisError(null);
    }
  }, [videoUrl]);

  // --- Time update from video ---
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    // Auto-highlight the current line
    const currentLine = lines.find(l => t >= l.startTime && t <= l.endTime);
    if (currentLine && currentLine.id !== activeLineId) {
      setActiveLineId(currentLine.id);
    }
  }, [lines, activeLineId]);

  // Auto-scroll to active line
  useEffect(() => {
    if (autoScroll && activeLineRef.current && timelineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeLineId, autoScroll]);

  // --- Click to seek ---
  const seekToLine = useCallback((line: AnimeDialogueLine) => {
    if (videoRef.current) {
      videoRef.current.currentTime = line.startTime;
      setActiveLineId(line.id);
    }
  }, []);

  // --- Character management ---
  const addCharacter = useCallback(() => {
    if (!newCharName.trim()) return;
    setCharacters(prev => [...prev, { id: generateId(), name: newCharName.trim(), color: newCharColor }]);
    setNewCharName('');
    setShowCharacterForm(false);
  }, [newCharName, newCharColor]);

  const removeCharacter = useCallback((id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  }, []);

  const renameCharacter = useCallback((oldName: string, newName: string) => {
    setCharacters(prev => {
      const updated = prev.map(c => c.name === oldName ? { ...c, name: newName } : c);
      if (oldName === 'XXX' && !prev.some(c => c.name === newName)) {
        const usedColors = new Set(prev.map(c => c.color));
        const nextColor = COLOR_PRESETS.find(cp => !usedColors.has(cp.key))?.key || COLOR_PRESETS[prev.length % COLOR_PRESETS.length].key;
        updated.push({ id: generateId(), name: newName, color: nextColor });
      }
      if (animeTitle.trim()) saveCharMemory(animeTitle, updated.filter(c => c.name !== 'XXX'));
      return updated;
    });
    setLines(prev => prev.map(l => ({
      ...l,
      characterName: l.characterName === oldName ? newName : l.characterName,
      characterName2: l.characterName2 === oldName ? newName : l.characterName2,
    })));
  }, [animeTitle]);

  // --- Analysis ---
  const handleAnalyze = useCallback(async () => {
    if (!videoFile || !videoRef.current) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setLines([]);
    setProgressMsg(null);

    try {
      const result = await analyzeAnimeClip(
        videoFile,
        videoRef.current,
        characters,
        (msg) => setProgressMsg(msg),
      );
      setLines(result.lines);

      // Auto-add detected characters
      if (characters.length === 0 && result.detectedCharacters) {
        const autoChars: AnimeCharacter[] = result.detectedCharacters
          .filter(dc => dc.name !== 'XXX' && dc.name !== 'ナレーション' && dc.name !== 'SFX')
          .map((dc, idx) => ({
            id: generateId(),
            name: dc.name,
            color: COLOR_PRESETS[idx % COLOR_PRESETS.length].key,
          }));
        if (autoChars.length > 0) {
          setCharacters(autoChars);
          if (animeTitle.trim()) saveCharMemory(animeTitle, autoChars);
        }
      }
    } catch (err: any) {
      console.error('Anime analysis failed:', err);
      setAnalysisError(err?.message || 'Phân tích thất bại. Vui lòng thử lại.');
    }
    setIsAnalyzing(false);
    setProgressMsg(null);
  }, [videoFile, characters, animeTitle]);

  // --- Session management ---
  const handleSaveSession = useCallback(async () => {
    const title = animeTitle.trim() || `Anime ${new Date().toLocaleDateString('vi-VN')}`;
    const session: SavedAnimeSession = {
      id: currentSessionId || generateId(),
      animeTitle: title,
      episodeLabel: episodeLabel.trim(),
      characters,
      lines,
      videoDuration,
      createdAt: currentSessionId ? savedSessions.find(s => s.id === currentSessionId)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
      savedAt: Date.now(),
    };

    // Persist character memory
    const realChars = characters.filter(c => c.name !== 'XXX');
    if (title && realChars.length > 0) saveCharMemory(title, realChars);

    if (user) {
      await saveAnimeSession(user.uid, session).catch(console.error);
      const updated = await loadAnimeSessions(user.uid).catch(() => []);
      setSavedSessions(updated || []);
    } else {
      setSavedSessions(prev => {
        const newList = [session, ...prev.filter(s => s.id !== session.id)];
        try { localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(newList)); } catch { /* */ }
        return newList;
      });
    }
    setCurrentSessionId(session.id);
    setAnimeTitle(title);
  }, [animeTitle, episodeLabel, characters, lines, videoDuration, currentSessionId, user, savedSessions]);

  const handleLoadSession = useCallback((session: SavedAnimeSession) => {
    setAnimeTitle(session.animeTitle);
    setEpisodeLabel(session.episodeLabel);
    setCharacters(session.characters);
    setLines(session.lines);
    setVideoDuration(session.videoDuration);
    setCurrentSessionId(session.id);
    setCharMemoryLoaded(true);
    // Video needs to be re-uploaded
  }, []);

  const handleDeleteSession = useCallback(async (id: string) => {
    if (user) {
      await deleteAnimeSession(user.uid, id).catch(console.error);
    }
    setSavedSessions(prev => {
      const newList = prev.filter(s => s.id !== id);
      if (!user) {
        try { localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(newList)); } catch { /* */ }
      }
      return newList;
    });
    if (currentSessionId === id) setCurrentSessionId(null);
  }, [user, currentSessionId]);

  // --- Export ---
  const exportDialogue = useCallback(() => {
    if (lines.length === 0) return;
    const rows = lines.map(l => {
      const ts = `[${formatTime(l.startTime)} - ${formatTime(l.endTime)}]`;
      return `${ts} ${l.characterName}: ${showJapanese ? l.japaneseText : l.vietnameseText}${l.notes ? `\n   → ${l.notes}` : ''}`;
    });
    const text = `# ${animeTitle || 'Anime'} ${episodeLabel ? `- ${episodeLabel}` : ''}\n\n${rows.join('\n\n')}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${animeTitle || 'anime'}_dialogue.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [lines, animeTitle, episodeLabel, showJapanese]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
          else { videoRef.current.pause(); setIsPlaying(false); }
        }
      }
      if (e.key === 'j') { setShowJapanese(prev => !prev); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (lines.length === 0) return;
        const currentIdx = activeLineId ? lines.findIndex(l => l.id === activeLineId) : -1;
        const nextIdx = Math.min(currentIdx + 1, lines.length - 1);
        const line = lines[nextIdx];
        setActiveLineId(line.id);
        if (videoRef.current) videoRef.current.currentTime = line.startTime;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (lines.length === 0) return;
        const currentIdx = activeLineId ? lines.findIndex(l => l.id === activeLineId) : 0;
        const prevIdx = Math.max(currentIdx - 1, 0);
        const line = lines[prevIdx];
        setActiveLineId(line.id);
        if (videoRef.current) videoRef.current.currentTime = line.startTime;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeLineId, lines]);

  // Get active character color
  const getCharColor = (name: string) => {
    const char = characters.find(c => c.name === name);
    if (!char) return 'bg-stone-400';
    return COLOR_PRESETS.find(c => c.key === char.color)?.dot || 'bg-stone-400';
  };

  // Filtered lines
  const filteredLines = filterCharacter ? lines.filter(l => l.characterName === filterCharacter) : lines;

  // Unique speaker names from lines
  const speakerNames = Array.from(new Set(lines.map(l => l.characterName)));

  // Unknown character count
  const xxxCount = lines.filter(l => l.characterName === 'XXX').length;

  // Inline rename state
  const [editingLineName, setEditingLineName] = React.useState<string | null>(null);
  const [editLineValue, setEditLineValue] = React.useState('');

  const handleStartRenameLine = (name: string) => {
    setEditingLineName(name);
    setEditLineValue(name === 'XXX' ? '' : name);
  };
  const handleConfirmRenameLine = () => {
    if (editingLineName && editLineValue.trim()) {
      renameCharacter(editingLineName, editLineValue.trim());
    }
    setEditingLineName(null);
    setEditLineValue('');
  };

  return (
    <div className="h-screen flex flex-col bg-[#FAFAF5] overflow-hidden">
      <FallingPetals enabled={settings.petalsEnabled} />
      <SettingsPanel />
      <TutorialPanel isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} user={user} onLogout={() => signOut(auth)} />

      {/* Floating navbar reveal button */}
      <button
        onClick={() => { setNavbarHidden(false); try { localStorage.setItem('arukas_navbar_hidden', 'false'); } catch (e) { console.error(e); } }}
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-stone-200 shadow-lg text-stone-500 hover:text-rose-500 hover:bg-white transition-all duration-300 ${navbarHidden ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
        title="Hiện thanh điều hướng"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        <span className="text-[11px] font-medium">Menu</span>
      </button>

      {/* ═══ NAVBAR ═══ */}
      <nav className={`sticky top-0 z-50 bg-[#FAFAF5]/80 backdrop-blur-md border-b border-stone-200/50 flex-shrink-0 transition-all duration-300 overflow-hidden ${navbarHidden ? 'max-h-0 border-transparent' : 'max-h-20'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🌸</span>
              <h1 className="text-xl font-bold tracking-tight text-stone-800 font-serif-jp">Aruka<span className="text-rose-400">S</span></h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/reference" className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Bảng tham khảo">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <span className="text-xs font-medium hidden sm:inline">Tham khảo</span>
            </Link>
            <Link to="/dictionary" className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Từ điển">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
              <span className="text-xs font-medium hidden sm:inline">Từ điển</span>
            </Link>
            <Link to="/grammar" className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Ngữ pháp">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <span className="text-xs font-medium hidden sm:inline">Ngữ pháp</span>
            </Link>
            <button onClick={() => setIsAuthModalOpen(true)} className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title={user ? user.displayName || 'Tài khoản' : 'Đăng nhập'} aria-label={user ? user.displayName || 'Tài khoản' : 'Đăng nhập'}>
              {user ? (
                <>{user.photoURL ? <img src={user.photoURL} className="w-5 h-5 rounded-full" alt="" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}<span className="text-xs font-medium hidden sm:inline max-w-[80px] truncate">{user.displayName || 'Người dùng'}</span></>
              ) : (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg><span className="text-xs font-medium hidden sm:inline">Đăng nhập</span></>
              )}
            </button>
            <button onClick={() => setIsTutorialOpen(true)} className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Hướng dẫn" aria-label="Hướng dẫn">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01" /></svg>
            </button>
            <button onClick={openSettings} className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title="Cài đặt" aria-label="Cài đặt">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
            {/* Navbar hide button */}
            <button onClick={() => { setNavbarHidden(true); try { localStorage.setItem('arukas_navbar_hidden', 'true'); } catch (e) { console.error(e); } }} className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-100 transition-all" title="Ẩn thanh điều hướng" aria-label="Ẩn thanh điều hướng">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO + MODE TABS ═══ */}
      {(() => {
        const autoHide = !!videoUrl || lines.length > 0;
        const isHidden = heroCollapsed === true || (heroCollapsed === null && autoHide);
        return (
          <div className={`flex-shrink-0 bg-[#FAFAF5] px-6 transition-all duration-500 ${isHidden ? 'pt-2 pb-1' : 'pt-8 pb-2'}`}>
            <div className="max-w-6xl mx-auto">
              <div className={`text-center overflow-hidden transition-all duration-500 ease-in-out ${isHidden ? 'max-h-0 opacity-0 mb-0' : 'max-h-32 opacity-100 mb-6'}`}>
                <h2 className="text-4xl font-serif-jp font-light text-stone-800 mb-4">Phân tích cú pháp chuyên sâu</h2>
                <p className="text-stone-500 font-light max-w-lg mx-auto">Phân tích hội thoại anime tiếng Nhật. Tải video lên để trích xuất và dịch lời thoại.</p>
              </div>
              <div className="flex justify-center mb-2">
                <button
                  onClick={() => setHeroCollapsed(prev => { const next = prev === null ? true : prev ? false : true; try { localStorage.setItem('arukas_hero_collapsed', String(next)); } catch (e) { console.error(e); } return next; })}
                  className="group flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-rose-500 transition-all px-3 py-1 rounded-full hover:bg-rose-50 border border-transparent hover:border-rose-200"
                  title={isHidden ? 'Hiện tiêu đề' : 'Ẩn tiêu đề'}
                >
                  {isHidden ? (
                    <><svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg><span>Hiện tiêu đề</span></>
                  ) : (
                    <><svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg><span>Ẩn tiêu đề</span></>
                  )}
                </button>
              </div>
              {/* Mode tabs */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-fit mx-auto">
                <Link to="/" className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-50 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Văn bản
                </Link>
                <Link to="/manga" className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-50 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  Manga
                </Link>
                <button className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-white text-stone-800 shadow-sm border border-stone-200 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Anime
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ TOOLBAR ═══ */}
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-stone-200 px-4 py-2.5">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-3">
          {/* Title + Episode */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <input type="text" value={animeTitle} onChange={(e) => { setAnimeTitle(e.target.value); setCharMemoryLoaded(false); }} placeholder="Tên anime..." className="text-sm font-medium text-stone-700 bg-transparent border-b border-dashed border-stone-300 focus:border-rose-400 focus:outline-none px-1 py-0.5 w-36 placeholder:text-stone-300" />
            <input type="text" value={episodeLabel} onChange={(e) => setEpisodeLabel(e.target.value)} placeholder="Tập..." className="text-xs text-stone-500 bg-transparent border-b border-dashed border-stone-200 focus:border-rose-300 focus:outline-none px-1 py-0.5 w-16 placeholder:text-stone-300" />
          </div>

          <span className="text-stone-200">|</span>

          {/* Characters */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {characters.map(char => {
              const dotColor = COLOR_PRESETS.find(c => c.key === char.color)?.dot || 'bg-stone-400';
              return (
                <span key={char.id} className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-stone-50 border border-stone-200 rounded-full px-2.5 py-1 group">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  {char.name}
                  <button onClick={() => removeCharacter(char.id)} className="text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 -mr-0.5">×</button>
                </span>
              );
            })}
            {showCharacterForm ? (
              <form onSubmit={(e) => { e.preventDefault(); addCharacter(); }} className="inline-flex items-center gap-1.5 bg-white border border-rose-200 rounded-full px-2 py-0.5 shadow-sm">
                <input autoFocus value={newCharName} onChange={(e) => setNewCharName(e.target.value)} placeholder="Tên..." className="text-xs w-20 bg-transparent focus:outline-none text-stone-700 placeholder:text-stone-300" />
                <div className="flex gap-0.5">
                  {COLOR_PRESETS.slice(0, 6).map(c => (
                    <button key={c.key} type="button" onClick={() => setNewCharColor(c.key)} className={`w-3.5 h-3.5 rounded-full ${c.dot} transition-all ${newCharColor === c.key ? 'ring-2 ring-offset-1 ring-stone-400 scale-110' : 'opacity-50 hover:opacity-80'}`} />
                  ))}
                </div>
                <button type="submit" className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1">✓</button>
                <button type="button" onClick={() => { setShowCharacterForm(false); setNewCharName(''); }} className="text-stone-400 hover:text-stone-600 text-xs px-0.5">✕</button>
              </form>
            ) : (
              <button onClick={() => setShowCharacterForm(true)} className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 hover:text-rose-500 border border-dashed border-stone-300 hover:border-rose-300 rounded-full px-2.5 py-1 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Nhân vật
              </button>
            )}
          </div>

          <span className="text-stone-200">|</span>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setIsSidebarOpen(prev => !prev)} className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full border transition-all ${isSidebarOpen ? 'bg-stone-800 text-white border-stone-700' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100 hover:text-stone-700'}`} title={isSidebarOpen ? 'Ẩn thanh bên' : 'Hiện thanh bên'}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>

            <button onClick={() => setShowJapanese(prev => !prev)} className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${showJapanese ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-sky-50 text-sky-600 border-sky-200'}`} title="J để chuyển">
              {showJapanese ? '日本語' : 'Tiếng Việt'}
            </button>

            <button onClick={() => setShowReading(prev => !prev)} className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-all ${showReading ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-stone-50 text-stone-400 border-stone-200 hover:text-stone-600'}`} title="Hiện/ẩn furigana">
              振
            </button>

            <button onClick={() => setShowNotes(prev => !prev)} className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-all flex items-center justify-center ${showNotes ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-stone-50 text-stone-400 border-stone-200 hover:text-stone-600'}`} title="Hiện/ẩn ghi chú">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </button>

            <button onClick={() => setAutoScroll(prev => !prev)} className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-all flex items-center justify-center ${autoScroll ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200 hover:text-stone-600'}`} title="Tự động cuộn">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
            </button>

            <input type="file" ref={fileInputRef} onChange={handleVideoSelect} className="hidden" accept="video/*" />
            <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full px-3 py-1.5 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Tải video
            </button>

            <button onClick={handleAnalyze} disabled={!videoFile || isAnalyzing} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-stone-800 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-4 py-1.5 transition-all shadow-sm hover:shadow-md active:scale-95">
              {isAnalyzing ? (
                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang phân tích...</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Phân tích</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex min-h-0 overflow-hidden" onDragOver={handleDragOver} onDrop={handleDrop}>

        {/* ═══ SIDEBAR ═══ */}
        <aside className={`flex-shrink-0 border-r border-stone-200 bg-stone-50/50 transition-all duration-300 overflow-hidden flex flex-col ${isSidebarOpen ? 'w-56' : 'w-0'}`}>
          <div className="w-56 h-full flex flex-col">
            <div className="flex-shrink-0 px-3 py-2.5 border-b border-stone-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Quản lý</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors p-0.5 rounded hover:bg-stone-100" title="Đóng">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Video info */}
              <div className="p-3 border-b border-stone-100">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Video
                </h4>
                {videoFile ? (
                  <div className="space-y-1 text-[10px] text-stone-500">
                    <div className="truncate font-medium text-stone-600">{videoFile.name}</div>
                    <div>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB · {videoDuration > 0 ? formatTime(videoDuration) : '...'}</div>
                  </div>
                ) : (
                  <p className="text-[10px] text-stone-400 italic">Chưa có video</p>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="mt-2 w-full text-[10px] font-medium text-stone-400 hover:text-rose-500 border border-dashed border-stone-300 hover:border-rose-300 rounded-lg px-2 py-1.5 transition-colors flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  {videoFile ? 'Đổi video' : 'Chọn video'}
                </button>
              </div>

              {/* Character filter */}
              {speakerNames.length > 0 && (
                <div className="p-3 border-b border-stone-100">
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Lọc nhân vật</h4>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setFilterCharacter(null)} className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${!filterCharacter ? 'bg-stone-800 text-white border-stone-700' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'}`}>
                      Tất cả
                    </button>
                    {speakerNames.map(name => (
                      <button key={name} onClick={() => setFilterCharacter(name === filterCharacter ? null : name)} className={`text-[10px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${filterCharacter === name ? 'bg-stone-800 text-white border-stone-700' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getCharColor(name)}`} />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sessions */}
              <div className="p-3 border-b border-stone-100">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  Phiên ({savedSessions.length})
                </h4>
                <button onClick={handleSaveSession} disabled={lines.length === 0} className="w-full text-[10px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 mb-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  Lưu phiên
                </button>
                {lines.length > 0 && (
                  <button onClick={exportDialogue} className="w-full text-[10px] font-medium text-stone-500 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-3 py-1.5 transition-colors flex items-center justify-center gap-1 mb-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Xuất hội thoại
                  </button>
                )}
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {savedSessions.length === 0 ? (
                    <p className="text-[10px] text-stone-400 italic text-center py-2">Chưa có phiên nào</p>
                  ) : (
                    savedSessions.map(session => (
                      <div key={session.id} className={`p-2 rounded-lg cursor-pointer transition-colors group flex items-center justify-between gap-1 ${currentSessionId === session.id ? 'bg-rose-50 border border-rose-200' : 'hover:bg-white hover:shadow-sm'}`} onClick={() => handleLoadSession(session)}>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-medium text-stone-700 truncate">
                            {session.animeTitle}
                            {session.episodeLabel && <span className="text-stone-400 font-normal ml-1">· {session.episodeLabel}</span>}
                          </div>
                          <div className="text-[9px] text-stone-400 flex items-center gap-1 mt-0.5">
                            <span>{session.lines.length} dòng</span>
                            <span className="text-stone-200">·</span>
                            <span>{formatTime(session.videoDuration)}</span>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-0.5 flex-shrink-0" title="Xóa">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Shortcuts */}
              <div className="p-3">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Phím tắt
                </h4>
                <div className="space-y-1.5 text-[10px] text-stone-500">
                  <div className="flex items-center justify-between"><span>Phát/Dừng</span><kbd className="bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-[9px] font-mono text-stone-500">Space</kbd></div>
                  <div className="flex items-center justify-between"><span>Đổi ngôn ngữ</span><kbd className="bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-[9px] font-mono text-stone-500">J</kbd></div>
                  <div className="flex items-center justify-between"><span>Dòng kế</span><kbd className="bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-[9px] font-mono text-stone-500">↓ →</kbd></div>
                  <div className="flex items-center justify-between"><span>Dòng trước</span><kbd className="bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-[9px] font-mono text-stone-500">↑ ←</kbd></div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══ LEFT: Video Player ═══ */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-stone-200 bg-black/95 relative">
          {videoUrl ? (
            <>
              <div className="flex-1 flex items-center justify-center min-h-0">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="max-w-full max-h-full object-contain"
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setVideoDuration(videoRef.current.duration);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
              {/* Mini timeline bar showing dialogue density */}
              {lines.length > 0 && videoDuration > 0 && (
                <div className="flex-shrink-0 h-6 bg-stone-900 relative px-1 flex items-center">
                  <div className="w-full h-2 bg-stone-800 rounded-full relative overflow-hidden">
                    {lines.map(line => {
                      const left = (line.startTime / videoDuration) * 100;
                      const width = Math.max(0.5, ((line.endTime - line.startTime) / videoDuration) * 100);
                      return (
                        <div
                          key={line.id}
                          className={`absolute top-0 h-full rounded-full transition-opacity cursor-pointer ${
                            line.id === activeLineId ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                          } ${getCharColor(line.characterName).replace('bg-', 'bg-')}`}
                          style={{ left: `${left}%`, width: `${width}%`, backgroundColor: line.id === activeLineId ? undefined : undefined }}
                          onClick={() => seekToLine(line)}
                          title={`${line.characterName}: ${line.japaneseText.slice(0, 30)}...`}
                        />
                      );
                    })}
                    {/* Current time indicator */}
                    <div className="absolute top-0 h-full w-0.5 bg-white/80 z-10 transition-all" style={{ left: `${(currentTime / videoDuration) * 100}%` }} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 p-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-stone-800/50 border-2 border-dashed border-stone-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-stone-400">Kéo thả video anime vào đây</p>
                <p className="text-xs text-stone-500">hoặc nhấn "Tải video" trên thanh công cụ</p>
                <p className="text-[10px] text-stone-600">Hỗ trợ: MP4, WebM, MKV (tối đa 20MB cho phân tích trực tiếp)</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Dialogue Timeline ═══ */}
        <div className="w-[440px] flex-shrink-0 flex flex-col min-h-0 bg-white">
          {/* Panel header */}
          <div className="flex-shrink-0 bg-white border-b border-stone-100 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Lời thoại</h3>
              {lines.length > 0 && (
                <span className="text-[10px] text-stone-300 font-medium">{filteredLines.length} dòng{filterCharacter ? ` (${filterCharacter})` : ''}</span>
              )}
            </div>
            {lines.length > 0 && (
              <div className="text-[10px] text-stone-400 flex items-center gap-2">
                {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </div>
            )}
          </div>

          {/* Error */}
          {analysisError && (
            <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              <span className="font-bold">Lỗi:</span> {analysisError}
            </div>
          )}

          {/* Progress */}
          {isAnalyzing && (
            <div className="mx-4 mt-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-amber-400/40 border-t-amber-500 rounded-full animate-spin shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-700">Đang phân tích anime...</div>
                <div className="text-[10px] text-amber-600/80">{progressMsg || 'Gemini đang nhận diện hội thoại và dịch thuật'}</div>
              </div>
            </div>
          )}

          {/* Unknown character guidance */}
          {xxxCount > 0 && !isAnalyzing && (
            <div className="mx-4 mt-2 px-3 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-amber-700">{xxxCount} dòng chưa xác định nhân vật</p>
                  <p className="text-[10px] text-amber-600/80 mt-0.5">Nhấn vào tên <span className="font-bold text-orange-600 bg-orange-100 px-1 rounded">XXX</span> để gán tên. Sẽ ghi nhớ cho các tập sau.</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline content */}
          <div ref={timelineRef} className="flex-1 overflow-y-auto">
            {filteredLines.length === 0 && !isAnalyzing ? (
              <div className="flex items-center justify-center h-full text-stone-400 text-sm">
                {videoFile ? 'Nhấn "Phân tích" để bắt đầu' : 'Tải video lên để bắt đầu'}
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {filteredLines.map((line, idx) => {
                  const isActive = line.id === activeLineId;
                  const isCurrent = currentTime >= line.startTime && currentTime <= line.endTime;
                  const charDot = getCharColor(line.characterName);
                  const charDot2 = line.characterName2 ? getCharColor(line.characterName2) : null;
                  const typeInfo = TYPE_LABELS[line.type] || TYPE_LABELS.dialogue;

                  return (
                    <div
                      key={line.id}
                      ref={isActive ? activeLineRef : undefined}
                      onClick={() => seekToLine(line)}
                      className={`px-4 py-3 cursor-pointer transition-all group relative ${
                        isActive
                          ? 'bg-rose-50/80 border-l-[3px] border-l-rose-400'
                          : isCurrent
                            ? 'bg-amber-50/40 border-l-[3px] border-l-amber-300'
                            : 'hover:bg-stone-50 border-l-[3px] border-l-transparent'
                      }`}
                    >
                      {/* Timestamp + Speaker row */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); if (videoRef.current) { videoRef.current.currentTime = line.startTime; setActiveLineId(line.id); } }}
                          className="text-[10px] font-mono tabular-nums flex-shrink-0 px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title={`Nhảy đến ${formatTime(line.startTime)}`}
                        >
                          {formatTime(line.startTime)}
                        </button>
                        <span className="text-stone-200 text-[10px]">–</span>
                        <span className="text-[10px] font-mono text-stone-400 tabular-nums flex-shrink-0">
                          {formatTime(line.endTime)}
                        </span>

                        <div className="flex items-center gap-1.5 ml-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${charDot}`} />
                          {editingLineName === line.characterName ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleConfirmRenameLine(); }} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                autoFocus
                                value={editLineValue}
                                onChange={(e) => setEditLineValue(e.target.value)}
                                onBlur={handleConfirmRenameLine}
                                className="text-xs font-bold px-1.5 py-0.5 rounded border border-rose-300 bg-white focus:outline-none focus:ring-1 focus:ring-rose-400 w-24"
                                placeholder="Tên nhân vật..."
                              />
                            </form>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStartRenameLine(line.characterName); }}
                              className={`text-xs font-bold transition-all ${
                                line.characterName === 'XXX'
                                  ? 'text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded animate-pulse hover:bg-orange-200 border border-orange-300'
                                  : 'text-stone-700 hover:underline'
                              }`}
                              title={line.characterName === 'XXX' ? 'Nhấn để gán tên nhân vật' : `Nhấn để đổi tên: ${line.characterName}`}
                            >
                              {line.characterName === 'XXX' ? '? Gán tên' : line.characterName}
                            </button>
                          )}
                          {charDot2 && (
                            <>
                              <span className="text-stone-300 text-[10px]">&</span>
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${charDot2}`} />
                              <span className="text-xs font-bold text-stone-600">{line.characterName2}</span>
                            </>
                          )}
                        </div>

                        <EmotionIcon emotion={line.emotion || 'neutral'} className="w-4 h-4" />

                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ml-auto flex items-center gap-1 ${typeInfo.style}`}>
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={typeInfo.icon} /></svg>
                          {typeInfo.label}
                        </span>

                        <span className="text-[9px] text-stone-300 font-mono">#{idx + 1}</span>
                      </div>

                      {/* Japanese text */}
                      {showJapanese && (
                        <div className="text-sm font-serif-jp text-stone-800 leading-relaxed mb-1">
                          {line.japaneseText}
                        </div>
                      )}

                      {/* Reading */}
                      {showReading && line.reading && (
                        <div className="text-xs text-purple-500/80 mb-1 font-serif-jp">
                          {line.reading}
                        </div>
                      )}

                      {/* Vietnamese translation */}
                      <div className={`text-sm leading-relaxed ${showJapanese ? 'text-rose-600/80' : 'text-stone-800'}`}>
                        {line.vietnameseText}
                      </div>

                      {/* Notes */}
                      {showNotes && line.notes && (
                        <div className="mt-1.5 px-2.5 py-1.5 bg-amber-50/60 border border-amber-100 rounded-lg text-[11px] text-amber-700/80 leading-relaxed flex items-start gap-1.5">
                          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                          <span>{line.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom stats bar */}
          {lines.length > 0 && (
            <div className="flex-shrink-0 border-t border-stone-100 px-4 py-2 bg-stone-50/50 flex items-center justify-between text-[10px] text-stone-400">
              <div className="flex items-center gap-3">
                <span>{lines.length} dòng thoại</span>
                <span className="text-stone-200">·</span>
                <span>{speakerNames.length} nhân vật</span>
                <span className="text-stone-200">·</span>
                <span>{formatTime(videoDuration)}</span>
              </div>
              <div className="flex items-center gap-1">
                {speakerNames.slice(0, 5).map(name => (
                  <span key={name} className={`w-2 h-2 rounded-full ${getCharColor(name)}`} title={name} />
                ))}
                {speakerNames.length > 5 && <span className="text-stone-300">+{speakerNames.length - 5}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimePlayerPage;
