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
import MangaImageViewer from '../components/MangaImageViewer';
import MangaDialoguePanel from '../components/MangaDialoguePanel';
import { analyzeMangaPages } from '../services/mangaAnalysisEngine';
import { saveMangaSession, deleteMangaSession, loadMangaSessions } from '../services/firestoreService';
import { MangaCharacter, MangaPage, MangaBubble, SavedMangaSession } from '../types';

// ============================================================
//  CONSTANTS
// ============================================================
const COLOR_PRESETS = [
  { key: 'rose',    label: 'Hồng',    dot: 'bg-rose-400' },
  { key: 'sky',     label: 'Xanh dương', dot: 'bg-sky-400' },
  { key: 'emerald', label: 'Xanh lá',  dot: 'bg-emerald-400' },
  { key: 'amber',   label: 'Vàng',     dot: 'bg-amber-400' },
  { key: 'purple',  label: 'Tím',      dot: 'bg-purple-400' },
  { key: 'cyan',    label: 'Lục lam',   dot: 'bg-cyan-400' },
  { key: 'pink',    label: 'Hồng',      dot: 'bg-pink-400' },
  { key: 'indigo',  label: 'Chàm',      dot: 'bg-indigo-400' },
];

const SESSIONS_CACHE_KEY = 'arukas_manga_sessions_local';

// ============================================================
//  CHARACTER MEMORY — persists characters per manga title
// ============================================================
function charMemoryKey(title: string): string {
  const norm = title.trim().toLowerCase().replace(/\s+/g, '_');
  return `arukas_char_mem_manga_${norm}`;
}

function loadCharMemory(title: string): MangaCharacter[] {
  if (!title.trim()) return [];
  try {
    const raw = localStorage.getItem(charMemoryKey(title));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCharMemory(title: string, chars: MangaCharacter[]) {
  if (!title.trim() || chars.length === 0) return;
  try {
    localStorage.setItem(charMemoryKey(title), JSON.stringify(chars));
  } catch { /* quota */ }
}

// ============================================================
//  HELPERS
// ============================================================
function readFileAsBase64(file: Blob | File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, content] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      resolve({ base64: content, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ============================================================
//  COMPONENT
// ============================================================
const MangaReaderPage: React.FC = () => {
  const { settings, openSettings } = useSettings();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // --- Core state ---
  const [mangaTitle, setMangaTitle] = useState('');
  const [chapterLabel, setChapterLabel] = useState('');
  const [characters, setCharacters] = useState<MangaCharacter[]>([]);
  const [pages, setPages] = useState<MangaPage[]>([]);
  const [bubbles, setBubbles] = useState<MangaBubble[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [charMemoryLoaded, setCharMemoryLoaded] = useState(false);

  // --- UI state ---
  const [navbarHidden, setNavbarHidden] = useState(() => {
    try { return localStorage.getItem('arukas_navbar_hidden') === 'true'; } catch { return false; }
  });
  const [heroCollapsed, setHeroCollapsed] = useState<boolean | null>(() => {
    try { const v = localStorage.getItem('arukas_hero_collapsed'); return v === 'true' ? true : v === 'false' ? false : null; } catch { return null; }
  });
  const [showJapanese, setShowJapanese] = useState(!settings.defaultShowVietnamese);
  const [showReading, setShowReading] = useState(false);
  const [activeBubbleId, setActiveBubbleId] = useState<string | null>(null);
  const [hoveredBubbleId, setHoveredBubbleId] = useState<string | null>(null);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharColor, setNewCharColor] = useState('rose');
  
  // --- Sessions state ---
  const [savedSessions, setSavedSessions] = useState<SavedMangaSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // --- Sidebar state ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // --- Load saved sessions ---
  useEffect(() => {
    if (user) {
      loadMangaSessions(user.uid).then(setSavedSessions).catch(console.error);
    } else {
      try {
        const raw = localStorage.getItem(SESSIONS_CACHE_KEY);
        if (raw) setSavedSessions(JSON.parse(raw));
      } catch { /* ignore */ }
    }
  }, [user]);

  // --- Auto-load character memory when manga title is set (with debounce) ---
  useEffect(() => {
    if (!mangaTitle.trim() || characters.length > 0 || charMemoryLoaded) return;
    const timer = setTimeout(() => {
      const mem = loadCharMemory(mangaTitle);
      if (mem.length > 0 && characters.length === 0) {
        setCharacters(mem);
        setCharMemoryLoaded(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [mangaTitle, characters.length, charMemoryLoaded]);

  // --- File handlers ---
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newPages: MangaPage[] = [];
    for (const file of files) {
      try {
        const { base64, mimeType } = await readFileAsBase64(file);
        newPages.push({ id: generateId(), url: URL.createObjectURL(file), base64, mimeType });
      } catch (err) { console.error('Error reading file', err); }
    }
    setPages(prev => [...prev, ...newPages]);
    setBubbles([]); // Reset analysis when pages change
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          try {
            const { base64, mimeType } = await readFileAsBase64(blob);
            setPages(prev => [...prev, { id: generateId(), url: URL.createObjectURL(blob), base64, mimeType }]);
            setBubbles([]);
          } catch (err) { console.error('Paste error', err); }
        }
      }
    }
  }, []);

  // Clipboard paste listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste as any);
    return () => document.removeEventListener('paste', handlePaste as any);
  }, [handlePaste]);

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const newPages: MangaPage[] = [];
    for (const file of files) {
      try {
        const { base64, mimeType } = await readFileAsBase64(file);
        newPages.push({ id: generateId(), url: URL.createObjectURL(file), base64, mimeType });
      } catch (err) { console.error('Drop error', err); }
    }
    if (newPages.length > 0) {
      setPages(prev => [...prev, ...newPages]);
      setBubbles([]);
    }
  }, []);

  const removePage = useCallback((id: string) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      const newPages = prev.filter(p => p.id !== id);
      // Update bubble imageIndex references
      setBubbles(prevBubbles => prevBubbles
        .filter(b => b.imageIndex !== idx)
        .map(b => b.imageIndex > idx ? { ...b, imageIndex: b.imageIndex - 1 } : b)
      );
      return newPages;
    });
  }, []);

  // --- Character management ---
  const addCharacter = useCallback(() => {
    if (!newCharName.trim()) return;
    const char: MangaCharacter = { id: generateId(), name: newCharName.trim(), color: newCharColor };
    setCharacters(prev => [...prev, char]);
    setNewCharName('');
    setShowCharacterForm(false);
  }, [newCharName, newCharColor]);

  const removeCharacter = useCallback((id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  }, []);

  const renameCharacter = useCallback((oldName: string, newName: string) => {
    // Update character list
    setCharacters(prev => {
      const updated = prev.map(c => c.name === oldName ? { ...c, name: newName } : c);
      // If renaming XXX → real name, add as new character if not existing
      if (oldName === 'XXX' && !prev.some(c => c.name === newName)) {
        const usedColors = new Set(prev.map(c => c.color));
        const nextColor = COLOR_PRESETS.find(cp => !usedColors.has(cp.key))?.key || COLOR_PRESETS[prev.length % COLOR_PRESETS.length].key;
        updated.push({ id: generateId(), name: newName, color: nextColor });
      }
      // Persist to character memory
      if (mangaTitle.trim()) saveCharMemory(mangaTitle, updated.filter(c => c.name !== 'XXX'));
      return updated;
    });
    // Update all bubbles referencing this name
    setBubbles(prev => prev.map(b => b.characterName === oldName ? { ...b, characterName: newName } : b));
  }, [mangaTitle]);

  // --- Analysis ---
  const handleAnalyze = useCallback(async () => {
    if (pages.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setProgressMsg(null);
    setBubbles([]);

    try {
      const result = await analyzeMangaPages(
        pages.map(p => ({ id: p.id, url: p.url, base64: p.base64, mimeType: p.mimeType })),
        characters,
        (msg) => setProgressMsg(msg), // Progress display
      );
      setBubbles(result.bubbles);

      // Auto-add detected characters if we had none
      if (characters.length === 0 && result.detectedCharacters) {
        const autoChars: MangaCharacter[] = result.detectedCharacters
          .filter(dc => dc.name !== 'XXX' && dc.name !== 'ナレーション' && dc.name !== 'SFX')
          .map((dc, idx) => ({
            id: generateId(),
            name: dc.name,
            color: COLOR_PRESETS[idx % COLOR_PRESETS.length].key,
          }));
        if (autoChars.length > 0) {
          setCharacters(autoChars);
          // Persist to character memory for future chapters
          if (mangaTitle.trim()) saveCharMemory(mangaTitle, autoChars);
        }
      }
    } catch (err: any) {
      console.error('Manga analysis failed:', err);
      setAnalysisError(err?.message || 'Phân tích thất bại. Vui lòng thử lại.');
    }
    setIsAnalyzing(false);
    setProgressMsg(null);
  }, [pages, characters, mangaTitle]);

  // --- Session save/load ---
  const handleSaveSession = useCallback(async () => {
    const title = mangaTitle.trim() || `Manga ${new Date().toLocaleDateString('vi-VN')}`;
    const session: SavedMangaSession = {
      id: currentSessionId || generateId(),
      mangaTitle: title,
      chapterLabel: chapterLabel.trim(),
      characters,
      bubbles,
      pageCount: pages.length,
      createdAt: currentSessionId ? savedSessions.find(s => s.id === currentSessionId)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
      savedAt: Date.now(),
    };

    // Persist character memory for this manga title
    const realChars = characters.filter(c => c.name !== 'XXX');
    if (title && realChars.length > 0) saveCharMemory(title, realChars);

    if (user) {
      await saveMangaSession(user.uid, session).catch(console.error);
      const updated = await loadMangaSessions(user.uid).catch(() => []);
      setSavedSessions(updated || []);
    } else {
      setSavedSessions(prev => {
        const newList = [session, ...prev.filter(s => s.id !== session.id)];
        try { localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(newList)); } catch { /* */ }
        return newList;
      });
    }
    setCurrentSessionId(session.id);
    setMangaTitle(title);
  }, [mangaTitle, chapterLabel, characters, bubbles, pages, currentSessionId, user, savedSessions]);

  const handleLoadSession = useCallback((session: SavedMangaSession) => {
    setMangaTitle(session.mangaTitle);
    setChapterLabel(session.chapterLabel || '');
    setCharacters(session.characters);
    setBubbles(session.bubbles);
    setCurrentSessionId(session.id);
    setCharMemoryLoaded(true); // don't auto-load memory over loaded session
    setPages([]); // Images need to be re-uploaded
  }, []);

  const handleDeleteSession = useCallback(async (id: string) => {
    if (user) {
      await deleteMangaSession(user.uid, id).catch(console.error);
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

  // --- Export dialogue ---
  const exportDialogue = useCallback(() => {
    if (bubbles.length === 0) return;
    const lines = bubbles.map(b => {
      const pageLabel = `[Trang ${b.imageIndex + 1}]`;
      return `${pageLabel} ${b.characterName}: ${showJapanese ? b.japaneseText : b.vietnameseText}`;
    });
    const text = `# ${mangaTitle || 'Manga'}\n\n${lines.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mangaTitle || 'manga'}_hoi_thoai.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bubbles, mangaTitle, showJapanese]);

  // Keep a ref to bubbles for keyboard handler (avoids setState anti-pattern)
  const bubblesRef = useRef(bubbles);
  useEffect(() => { bubblesRef.current = bubbles; }, [bubbles]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        setShowJapanese(prev => !prev);
      }
      const cur = bubblesRef.current;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (cur.length === 0) return;
        const currentIdx = activeBubbleId ? cur.findIndex(b => b.id === activeBubbleId) : -1;
        const nextIdx = (currentIdx + 1) % cur.length;
        setActiveBubbleId(cur[nextIdx].id);
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (cur.length === 0) return;
        const currentIdx = activeBubbleId ? cur.findIndex(b => b.id === activeBubbleId) : 0;
        const prevIdx = currentIdx <= 0 ? cur.length - 1 : currentIdx - 1;
        setActiveBubbleId(cur[prevIdx].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeBubbleId]);

  return (
    <div className="h-screen flex flex-col bg-[#FAFAF5] overflow-hidden">
      <FallingPetals enabled={settings.petalsEnabled} />
      <SettingsPanel />
      <TutorialPanel isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onLogout={() => signOut(auth)}
      />

      {/* Floating navbar reveal button */}
      <button
        onClick={() => { setNavbarHidden(false); try { localStorage.setItem('arukas_navbar_hidden', 'false'); } catch (e) { console.error(e); } }}
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-stone-200 shadow-lg text-stone-500 hover:text-rose-500 hover:bg-white transition-all duration-300 ${navbarHidden ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
        title="Hiện thanh điều hướng"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        <span className="text-[11px] font-medium">Menu</span>
      </button>

      {/* ═══ NAVBAR — mirrors App.tsx exactly ═══ */}
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

              {/* Auth Button */}
              <button onClick={() => setIsAuthModalOpen(true)} className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500 transition-all flex items-center gap-2 border border-stone-200 shadow-sm" title={user ? user.displayName || 'Tài khoản' : 'Đăng nhập'} aria-label={user ? user.displayName || 'Tài khoản' : 'Đăng nhập'}>
                {user ? (
                  <>{user.photoURL ? <img src={user.photoURL} className="w-5 h-5 rounded-full" alt="" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}<span className="text-xs font-medium hidden sm:inline max-w-[80px] truncate">{user.displayName || 'Người dùng'}</span></>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg><span className="text-xs font-medium hidden sm:inline">Đăng nhập</span></>
                )}
              </button>

              {/* Settings Button */}
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

      {/* ═══ TITLE + MODE TABS ═══ */}
      {(() => {
        const autoHide = pages.length > 0 || bubbles.length > 0;
        const isHidden = heroCollapsed === true || (heroCollapsed === null && autoHide);
        return (
      <div className={`flex-shrink-0 bg-[#FAFAF5] px-6 transition-all duration-500 ${isHidden ? 'pt-2 pb-1' : 'pt-8 pb-2'}`}>
        <div className="max-w-6xl mx-auto">
          <div className={`text-center overflow-hidden transition-all duration-500 ease-in-out ${isHidden ? 'max-h-0 opacity-0 mb-0' : 'max-h-32 opacity-100 mb-6'}`}>
            <h2 className="text-4xl font-serif-jp font-light text-stone-800 mb-4">Phân tích cú pháp chuyên sâu</h2>
            <p className="text-stone-500 font-light max-w-lg mx-auto">Khám phá cấu trúc ngữ pháp tiếng Nhật. Nhập văn bản hoặc dán ảnh (Ctrl+V) để phân tích logic câu.</p>
          </div>
          {/* Hero toggle */}
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
          {/* ═══ MODE TABS ═══ */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-fit mx-auto">
            <Link to="/" className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-50 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Văn bản
            </Link>
            <button className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-white text-stone-800 shadow-sm border border-stone-200 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Manga
            </button>
            <Link to="/anime" className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-50 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Anime
            </Link>
          </div>
        </div>
      </div>
        );
      })()}

      {/* ═══ TOOLBAR — manga title, characters, controls ═══ */}
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-stone-200 px-4 py-2.5">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-3">
          {/* Manga title + Chapter */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              type="text"
              value={mangaTitle}
              onChange={(e) => { setMangaTitle(e.target.value); setCharMemoryLoaded(false); }}
              placeholder="Tên manga..."
              className="text-sm font-medium text-stone-700 bg-transparent border-b border-dashed border-stone-300 focus:border-rose-400 focus:outline-none px-1 py-0.5 w-40 placeholder:text-stone-300"
            />
            <input
              type="text"
              value={chapterLabel}
              onChange={(e) => setChapterLabel(e.target.value)}
              placeholder="Chương..."
              className="text-xs text-stone-500 bg-transparent border-b border-dashed border-stone-200 focus:border-rose-300 focus:outline-none px-1 py-0.5 w-20 placeholder:text-stone-300"
            />
          </div>

          <span className="text-stone-200">|</span>

          {/* Characters */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {characters.map(char => {
              const dotColor = COLOR_PRESETS.find(c => c.key === char.color)?.dot || 'bg-stone-400';
              return (
                <span
                  key={char.id}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-stone-50 border border-stone-200 rounded-full px-2.5 py-1 group"
                >
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  {char.name}
                  <button
                    onClick={() => removeCharacter(char.id)}
                    className="text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 -mr-0.5"
                  >
                    ×
                  </button>
                </span>
              );
            })}

            {/* Add character button/form */}
            {showCharacterForm ? (
              <form
                onSubmit={(e) => { e.preventDefault(); addCharacter(); }}
                className="inline-flex items-center gap-1.5 bg-white border border-rose-200 rounded-full px-2 py-0.5 shadow-sm"
              >
                <input
                  autoFocus
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="Tên..."
                  className="text-xs w-20 bg-transparent focus:outline-none text-stone-700 placeholder:text-stone-300"
                />
                <div className="flex gap-0.5">
                  {COLOR_PRESETS.slice(0, 6).map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setNewCharColor(c.key)}
                      className={`w-3.5 h-3.5 rounded-full ${c.dot} transition-all ${newCharColor === c.key ? 'ring-2 ring-offset-1 ring-stone-400 scale-110' : 'opacity-50 hover:opacity-80'}`}
                    />
                  ))}
                </div>
                <button type="submit" className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1">✓</button>
                <button type="button" onClick={() => { setShowCharacterForm(false); setNewCharName(''); }} className="text-stone-400 hover:text-stone-600 text-xs px-0.5">✕</button>
              </form>
            ) : (
              <button
                onClick={() => setShowCharacterForm(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 hover:text-rose-500 border border-dashed border-stone-300 hover:border-rose-300 rounded-full px-2.5 py-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Nhân vật
              </button>
            )}
          </div>

          <span className="text-stone-200">|</span>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full border transition-all ${
                isSidebarOpen
                  ? 'bg-stone-800 text-white border-stone-700'
                  : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100 hover:text-stone-700'
              }`}
              title={isSidebarOpen ? 'Ẩn thanh bên' : 'Hiện thanh bên'}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>

            {/* Language toggle */}
            <button
              onClick={() => setShowJapanese(prev => !prev)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                showJapanese
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-sky-50 text-sky-600 border-sky-200'
              }`}
              title="Space để chuyển"
            >
              {showJapanese ? '日本語' : 'Tiếng Việt'}
            </button>

            {/* Furigana toggle */}
            <button
              onClick={() => setShowReading(prev => !prev)}
              className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-all ${
                showReading
                  ? 'bg-purple-50 text-purple-600 border-purple-200'
                  : 'bg-stone-50 text-stone-400 border-stone-200 hover:text-stone-600'
              }`}
              title="Hiện/ẩn furigana"
            >
              振
            </button>

            {/* Upload files */}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full px-3 py-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Thêm ảnh
            </button>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={pages.length === 0 || isAnalyzing}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-stone-800 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-4 py-1.5 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              {isAnalyzing ? (
                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang phân tích...</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Phân tích</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT — Split View ═══ */}
      <div
        ref={dropRef}
        className="flex-1 flex min-h-0 overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* ═══ SIDEBAR ═══ */}
        <aside className={`flex-shrink-0 border-r border-stone-200 bg-stone-50/50 transition-all duration-300 overflow-hidden flex flex-col ${
          isSidebarOpen ? 'w-56' : 'w-0'
        }`}>
          <div className="w-56 h-full flex flex-col">
            {/* Sidebar header */}
            <div className="flex-shrink-0 px-3 py-2.5 border-b border-stone-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Quản lý</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors p-0.5 rounded hover:bg-stone-100"
                title="Đóng thanh bên"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* ── Pages section ── */}
              <div className="p-3 border-b border-stone-100">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Trang ({pages.length})
                </h4>
                {pages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {pages.map((page, idx) => (
                      <div
                        key={page.id}
                        className="relative group cursor-pointer"
                        onClick={() => {
                          const el = document.getElementById(`manga-overlay-p${idx}_b0`) || document.querySelector(`[data-page-idx="${idx}"]`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                      >
                        <img src={page.url} alt={`Trang ${idx + 1}`} className="w-full h-auto rounded border border-stone-200 hover:border-rose-300 transition-colors" />
                        <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-stone-800/80 text-white text-[8px] rounded flex items-center justify-center font-bold">{idx + 1}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        >×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-stone-400 italic">Chưa có trang nào</p>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full text-[10px] font-medium text-stone-400 hover:text-rose-500 border border-dashed border-stone-300 hover:border-rose-300 rounded-lg px-2 py-1.5 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Thêm trang
                </button>
              </div>

              {/* ── Sessions section ── */}
              <div className="p-3 border-b border-stone-100">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  Phiên ({savedSessions.length})
                </h4>
                <button
                  onClick={handleSaveSession}
                  disabled={bubbles.length === 0}
                  className="w-full text-[10px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 mb-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  Lưu phiên hiện tại
                </button>
                {bubbles.length > 0 && (
                  <button
                    onClick={exportDialogue}
                    className="w-full text-[10px] font-medium text-stone-500 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-3 py-1.5 transition-colors flex items-center justify-center gap-1 mb-2"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Xuất hội thoại
                  </button>
                )}
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {savedSessions.length === 0 ? (
                    <p className="text-[10px] text-stone-400 italic text-center py-2">Chưa có phiên nào</p>
                  ) : (
                    savedSessions.map(session => (
                      <div
                        key={session.id}
                        className={`p-2 rounded-lg cursor-pointer transition-colors group flex items-center justify-between gap-1 ${
                          currentSessionId === session.id ? 'bg-rose-50 border border-rose-200' : 'hover:bg-white hover:shadow-sm'
                        }`}
                        onClick={() => handleLoadSession(session)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-medium text-stone-700 truncate">
                            {session.mangaTitle}
                            {session.chapterLabel && <span className="text-stone-400 font-normal ml-1">· {session.chapterLabel}</span>}
                          </div>
                          <div className="text-[9px] text-stone-400 flex items-center gap-1 mt-0.5">
                            <span>{session.pageCount}tr</span>
                            <span className="text-stone-200">·</span>
                            <span>{session.bubbles.length}bb</span>
                            <span className="text-stone-200">·</span>
                            <span>{session.characters.length}nv</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                          className="text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-0.5 flex-shrink-0"
                          title="Xóa phiên"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── Keyboard shortcuts ── */}
              <div className="p-3">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Phím tắt
                </h4>
                <div className="space-y-1.5 text-[10px] text-stone-500">
                  <div className="flex items-center justify-between">
                    <span>Đổi ngôn ngữ</span>
                    <kbd className="bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-[9px] font-mono text-stone-500">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bong bóng kế</span>
                    <kbd className="bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-[9px] font-mono text-stone-500">↓ →</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bong bóng trước</span>
                    <kbd className="bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-[9px] font-mono text-stone-500">↑ ←</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* LEFT: Manga images with overlays */}
        <div className="flex-1 border-r border-stone-200 flex flex-col min-h-0 relative">
          {/* Page thumbnails strip */}
          {pages.length > 0 && (
            <div className="flex-shrink-0 bg-stone-50/80 border-b border-stone-100 px-3 py-1.5 flex items-center gap-2 overflow-x-auto">
              {pages.map((page, idx) => (
                <div key={page.id} className="relative group flex-shrink-0">
                  <img
                    src={page.url}
                    alt={`Trang ${idx + 1}`}
                    className="h-10 w-auto rounded border border-stone-200 cursor-pointer hover:border-rose-300 transition-colors"
                    onClick={() => {
                      const el = document.getElementById(`manga-overlay-p${idx}_b0`) || document.querySelector(`[data-page-idx="${idx}"]`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  />
                  <span className="absolute -top-1 -left-1 w-4 h-4 bg-stone-700 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => removePage(page.id)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 flex items-center justify-center rounded border-2 border-dashed border-stone-300 text-stone-400 hover:border-rose-300 hover:text-rose-500 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          )}

          <MangaImageViewer
            pages={pages}
            bubbles={bubbles}
            characters={characters}
            activeBubbleId={activeBubbleId || hoveredBubbleId}
            onBubbleClick={(id) => setActiveBubbleId(id)}
            onBubbleHover={(id) => setHoveredBubbleId(id)}
          />

          {/* Drag-drop overlay hint when no pages */}
          {pages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-3 p-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center">
                  <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-stone-500">Kéo thả ảnh manga vào đây</p>
                <p className="text-xs text-stone-400">hoặc dán từ bộ nhớ tạm (Ctrl+V) hoặc nhấn "Thêm ảnh"</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Dialogue panel */}
        <div className="w-[420px] flex-shrink-0 flex flex-col min-h-0 bg-white">
          {/* Panel header */}
          <div className="flex-shrink-0 bg-white border-b border-stone-100 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Hội thoại</h3>
              {bubbles.length > 0 && (
                <span className="text-[10px] text-stone-300 font-medium">{bubbles.length} bong bóng</span>
              )}
            </div>
            {bubbles.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                <span>Phím cách: đổi ngôn ngữ</span>
                <span className="text-stone-200">|</span>
                <span>↑↓: chuyển bong bóng</span>
              </div>
            )}
          </div>

          {/* Analysis error */}
          {analysisError && (
            <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              <span className="font-bold">Lỗi:</span> {analysisError}
            </div>
          )}

          {/* Analyzing indicator */}
          {isAnalyzing && (
            <div className="mx-4 mt-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-amber-400/40 border-t-amber-500 rounded-full animate-spin shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-700">{progressMsg || 'Đang phân tích manga...'}</div>
                <div className="text-[10px] text-amber-600/80">Gemini đang nhận diện bong bóng thoại, nhân vật và dịch thuật</div>
              </div>
            </div>
          )}

          <MangaDialoguePanel
            bubbles={bubbles}
            characters={characters}
            pageCount={pages.length}
            showJapanese={showJapanese}
            showReading={showReading}
            activeBubbleId={activeBubbleId}
            hoveredBubbleId={hoveredBubbleId}
            onBubbleClick={(id) => setActiveBubbleId(id)}
            onRenameCharacter={renameCharacter}
          />
        </div>
      </div>
    </div>
  );
};

export default MangaReaderPage;
