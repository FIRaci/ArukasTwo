import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DOJG_ENTRIES, HJGP_ENTRIES, DOJP_ENTRIES } from '../data/grammarCrossRef';
import type { DOJGEntry, HJGPEntry, DOJPEntry } from '../data/grammarCrossRef';
import { getDojgViMeaning } from '../data/grammarCrossRefVi';

// ============================================================================
// Grammar Dictionary Reference Page
// DOJG + HJGP + DOJP cross-reference browser
// ============================================================================

type DictTab = 'dojg' | 'hjgp' | 'dojp';

const TAB_INFO: Record<DictTab, { label: string; full: string; color: string; count: number }> = {
  dojg: { label: 'DOJG', full: 'Dictionary of Japanese Grammar', color: 'blue', count: DOJG_ENTRIES.length },
  hjgp: { label: 'HJGP', full: 'Handbook of Japanese Grammar Patterns', color: 'emerald', count: HJGP_ENTRIES.length },
  dojp: { label: 'DOJP', full: 'Dictionary of Japanese Particles', color: 'violet', count: DOJP_ENTRIES.length },
};

const ITEMS_PER_PAGE = 40;

const TAB_ACTIVE_CLS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm',
  emerald: 'bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm',
  violet: 'bg-violet-100 text-violet-700 border border-violet-200 shadow-sm',
};

const TAB_PAGE_CLS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border border-blue-200',
  emerald: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  violet: 'bg-violet-100 text-violet-700 border border-violet-200',
};

const GrammarDictPage: React.FC = () => {
  const [tab, setTab] = useState<DictTab>('dojg');
  const [search, setSearch] = useState('');
  const [volFilter, setVolFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Filter entries based on search and volume
  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (tab === 'dojg') {
      return DOJG_ENTRIES.filter(e => {
        if (volFilter !== 'all' && e.volume !== volFilter) return false;
        if (!q) return true;
        const viMeaning = getDojgViMeaning(e.english).toLowerCase();
        return e.concept.toLowerCase().includes(q) ||
          e.english.toLowerCase().includes(q) ||
          viMeaning.includes(q) ||
          e.page.toLowerCase().includes(q);
      });
    }
    if (tab === 'hjgp') {
      return HJGP_ENTRIES.filter(e => {
        if (!q) return true;
        return e.concept.toLowerCase().includes(q) ||
          e.page.includes(q);
      });
    }
    // dojp
    return DOJP_ENTRIES.filter(e => {
      if (!q) return true;
      return e.concept.toLowerCase().includes(q) ||
        e.page.includes(q);
    });
  }, [tab, search, volFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const pageData = filteredEntries.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page on filter change
  const handleTabChange = (t: DictTab) => { setTab(t); setPage(1); setSearch(''); setVolFilter('all'); };
  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };

  const tabColor = TAB_INFO[tab].color;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-lg font-bold text-rose-500 tracking-tight">ARUKAS</Link>
            <span className="text-stone-300">|</span>
            <span className="text-sm font-medium text-stone-600">Tham chiếu Ngữ pháp</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/grammar" className="text-xs text-stone-500 hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-stone-50">Ngữ pháp</Link>
            <Link to="/dictionary" className="text-xs text-stone-500 hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-stone-50">Từ điển</Link>
            <Link to="/reference" className="text-xs text-stone-500 hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-stone-50">Hán tự</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-800">Từ Điển Ngữ Pháp</h1>
          <p className="text-sm text-stone-500 mt-1">
            {DOJG_ENTRIES.length} DOJG + {HJGP_ENTRIES.length} HJGP + {DOJP_ENTRIES.length} DOJP = <span className="font-bold text-stone-700">{DOJG_ENTRIES.length + HJGP_ENTRIES.length + DOJP_ENTRIES.length}</span> mục tra cứu
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-2 justify-center">
          {(Object.keys(TAB_INFO) as DictTab[]).map(t => {
            const info = TAB_INFO[t];
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? TAB_ACTIVE_CLS[info.color]
                    : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-700'
                }`}
              >
                <span className="font-bold">{info.label}</span>
                <span className="ml-1.5 text-[11px] opacity-70">({info.count})</span>
              </button>
            );
          })}
        </div>

        {/* Tab description */}
        <div className="text-center text-xs text-stone-400">
          {TAB_INFO[tab].full}
        </div>

        {/* Search + Volume filter */}
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="relative flex-1 w-full sm:w-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm mẫu ngữ pháp..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
            />
          </div>
          {tab === 'dojg' && (
            <div className="flex items-center gap-1">
              {['all', 'basic', 'intermediate', 'advanced'].map(v => (
                <button
                  key={v}
                  onClick={() => { setVolFilter(v); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    volFilter === v
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {v === 'all' ? 'Tất cả' : v === 'basic' ? 'Basic' : v === 'intermediate' ? 'Inter.' : 'Adv.'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="text-xs text-stone-400">
          {filteredEntries.length} kết quả {search ? `cho "${search}"` : ''}
          {page > 1 && ` · Trang ${page}/${totalPages}`}
        </div>

        {/* Entries list */}
        <div className="space-y-1.5">
          {tab === 'dojg' && (pageData as DOJGEntry[]).map((e, i) => (
            <div key={`${e.concept}-${e.subEntry}-${i}`} className="bg-white rounded-xl border border-stone-200 hover:border-blue-200 hover:shadow-sm transition-all px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="text-lg font-serif-jp text-stone-800 font-bold">{e.concept}</div>
                  {e.subEntry && <div className="text-[10px] text-stone-400">#{e.subEntry}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-stone-600">{getDojgViMeaning(e.english) || '—'}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    e.volume === 'basic' ? 'bg-green-50 text-green-600 border-green-200' :
                    e.volume === 'intermediate' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {e.volume === 'basic' ? 'Basic' : e.volume === 'intermediate' ? 'Inter.' : 'Adv.'}
                  </span>
                  <span className="text-[10px] text-stone-400">{e.page}</span>
                </div>
              </div>
              {/* Cross-refs */}
              <div className="flex gap-2 mt-1.5">
                {e.hjgpRef && <span className="text-[10px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">HJGP p.{e.hjgpRef}</span>}
                {e.dojpRef && <span className="text-[10px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">DOJP p.{e.dojpRef}</span>}
              </div>
            </div>
          ))}

          {tab === 'hjgp' && (pageData as HJGPEntry[]).map((e, i) => (
            <div key={`${e.concept}-${e.subEntry}-${i}`} className="bg-white rounded-xl border border-stone-200 hover:border-emerald-200 hover:shadow-sm transition-all px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="text-lg font-serif-jp text-stone-800 font-bold">{e.concept}</div>
                  {e.subEntry && <div className="text-[10px] text-stone-400">#{e.subEntry}</div>}
                </div>
                <div className="flex-1 min-w-0" />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-emerald-600 font-bold">p.{e.page}</span>
                  {e.pageCount && <span className="text-[10px] text-stone-400">({e.pageCount}p)</span>}
                </div>
              </div>
              <div className="flex gap-2 mt-1.5">
                {e.dojgRef && <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">DOJG {e.dojgRef}</span>}
                {e.dojpRef && <span className="text-[10px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">DOJP p.{e.dojpRef}</span>}
              </div>
            </div>
          ))}

          {tab === 'dojp' && (pageData as DOJPEntry[]).map((e, i) => (
            <div key={`${e.concept}-${i}`} className="bg-white rounded-xl border border-stone-200 hover:border-violet-200 hover:shadow-sm transition-all px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="text-lg font-serif-jp text-stone-800 font-bold">{e.concept}</div>
                </div>
                <div className="flex-1 min-w-0" />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-violet-600 font-bold">p.{e.page}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-1.5">
                {e.dojgRef && <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">DOJG {e.dojgRef}</span>}
                {e.hjgpRef && <span className="text-[10px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">HJGP p.{e.hjgpRef}</span>}
              </div>
            </div>
          ))}

          {pageData.length === 0 && (
            <div className="text-center py-12 text-stone-400 text-sm">
              Không tìm thấy kết quả
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 py-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ←
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pgNum: number;
              if (totalPages <= 7) pgNum = i + 1;
              else if (page <= 4) pgNum = i + 1;
              else if (page >= totalPages - 3) pgNum = totalPages - 6 + i;
              else pgNum = page - 3 + i;
              return (
                <button
                  key={pgNum}
                  onClick={() => setPage(pgNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    page === pgNum
                      ? TAB_PAGE_CLS[tabColor]
                      : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {pgNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        )}

        {/* Stats footer */}
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-xs text-stone-500 text-center space-y-1">
            <div className="flex flex-wrap gap-3 justify-center">
              <span className="text-blue-500 font-medium">DOJG: {DOJG_ENTRIES.length} mục</span>
              <span className="text-emerald-500 font-medium">HJGP: {HJGP_ENTRIES.length} mục</span>
              <span className="text-violet-500 font-medium">DOJP: {DOJP_ENTRIES.length} mục</span>
            </div>
            <div className="text-stone-400">
              Nguồn: Dictionary of Japanese Grammar · Handbook of Japanese Grammar Patterns · Dictionary of Japanese Particles
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-stone-300 py-4">
          ARUKAS — Nền tảng học tiếng Nhật
        </div>
      </main>
    </div>
  );
};

export default GrammarDictPage;
