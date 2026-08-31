import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CornerDownLeft, Home as HomeIcon, Calculator, ArrowLeftRight, Clock, Triangle, LineChart, FileText, Wand2, RefreshCw, Mail, MessageSquare, Phone, Users, Radio, Cloud, Activity, Map as MapIcon, Crown, Bomb, Waves, Grid2x2, Skull, History as HistoryIcon } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { haptics } from '@/lib/haptics';
import { getSkin } from '@/lib/skins';

// Single source of truth for the searchable catalog — mirrors the radial hub
// menu's tools so search and hub always offer the same destinations.
const CATALOG = [
  { to: '/',                 labelKey: 'navHome',           catKey: 'navHome',            icon: HomeIcon },
  { to: '/calculator',       labelKey: 'navCalculator',     catKey: 'navCatCalculations', icon: Calculator },
  { to: '/converter',        labelKey: 'navConverter',      catKey: 'navCatCalculations', icon: ArrowLeftRight },
  { to: '/datetime',         labelKey: 'navDateTime',       catKey: 'navCatCalculations', icon: Clock },
  { to: '/geometry',         labelKey: 'navGeometry',       catKey: 'navCatCalculations', icon: Triangle },
  { to: '/graphing',         labelKey: 'navGraphing',       catKey: 'navCatCalculations', icon: LineChart },
  { to: '/notes',            labelKey: 'navNotes',          catKey: 'navCatText',         icon: FileText },
  { to: '/generator',        labelKey: 'navGenerator',     catKey: 'navCatText',         icon: Wand2 },
  { to: '/text-converter',   labelKey: 'navTextConverter', catKey: 'navCatText',         icon: RefreshCw },
  { to: '/email-inbox',      labelKey: 'navEmail',         catKey: 'navCatCommunications', icon: Mail },
  { to: '/messages',         labelKey: 'navSms',           catKey: 'navCatCommunications', icon: MessageSquare },
  { to: '/calls',            labelKey: 'navCalls',         catKey: 'navCatCommunications', icon: Phone },
  { to: '/contacts',         labelKey: 'navContacts',      catKey: 'navCatCommunications', icon: Users },
  { to: '/radio',            labelKey: 'navRadio',         catKey: 'navCatUtilities',    icon: Radio },
  { to: '/weather',          labelKey: 'navWeather',      catKey: 'navCatUtilities',    icon: Cloud },
  { to: '/system-status',    labelKey: 'navSystemStatus', catKey: 'navCatUtilities',    icon: Activity },
  { to: '/map',              labelKey: 'navMap',           catKey: 'navCatUtilities',    icon: MapIcon },
  { to: '/games/chess',      labelKey: 'chessTitle',       catKey: 'navCatGames',        icon: Crown },
  { to: '/games/minesweeper', labelKey: 'minesTitle',      catKey: 'navCatGames',        icon: Bomb },
  { to: '/games/snake',      labelKey: 'snakeTitle',       catKey: 'navCatGames',        icon: Waves },
  { to: '/games/blocks',     labelKey: 'tetrisTitle',     catKey: 'navCatGames',        icon: Grid2x2 },
  { to: '/games/dungeon',    labelKey: 'doomTitle',       catKey: 'navCatGames',        icon: Skull },
  { to: '/history',          labelKey: 'navHistory',      catKey: 'navCatHistory',     icon: HistoryIcon },
];

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function GlobalSearch() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hl, setHl] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const isPipBoy = getSkin() === 'pip-boy';

  const items = useMemo(
    () => CATALOG.map((c) => ({ ...c, label: t(c.labelKey), cat: t(c.catKey) })),
    [t]
  );

  const results = useMemo(() => {
    const query = norm(q.trim());
    if (!query) return items;
    const scored = [];
    for (const it of items) {
      const l = norm(it.label);
      let score = -1;
      if (l === query) score = 120;
      else if (l.startsWith(query)) score = 100;
      else if (l.includes(query)) score = 80;
      else if (norm(it.cat).includes(query)) score = 50;
      else if (l.split(/\s+/).some((w) => w.startsWith(query))) score = 70;
      if (score >= 0) scored.push({ it, score });
    }
    scored.sort((a, b) => b.score - a.score || a.it.label.localeCompare(b.it.label));
    return scored.map((s) => s.it);
  }, [q, items]);

  const go = (to) => {
    haptics.click();
    setOpen(false);
    setQ('');
    navigate(to);
  };

  const toggle = () => {
    setOpen((o) => {
      if (!o) { haptics.tap(); setQ(''); setHl(0); }
      return !o;
    });
  };

  // "/" opens; Escape/Arrows/Enter drive the palette. Capture phase + stop
  // so Escape doesn't also toggle the settings modal handled in Layout.
  useEffect(() => {
    const onKey = (e) => {
      if (!open) {
        const tag = e.target.tagName;
        const typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
        if (e.key === '/' && !typing && !e.altKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setOpen(true); setQ(''); setHl(0); haptics.tap();
        }
        return;
      }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setHl((h) => Math.min(results.length - 1, h + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setHl((h) => Math.max(0, h - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); const r = results[hl]; if (r) go(r.to); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, hl]);

  useEffect(() => { if (open) { setHl(0); requestAnimationFrame(() => inputRef.current?.focus()); } }, [open]);
  useEffect(() => { setHl(0); }, [q]);

  // keep the highlighted row scrolled into view + lock background scroll
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector('[data-hl="1"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [hl, open, results]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const triggerStyle = {
    touchAction: 'manipulation',
    flexShrink: 0,
    background: isPipBoy ? '#0d2b0d' : 'hsl(220 16% 14%)',
    border: isPipBoy ? '2px solid #39ff5a' : '1px solid hsl(var(--border))',
    boxShadow: isPipBoy
      ? '0 0 14px #39ff5a, 0 0 28px rgba(57,255,90,0.6), 0 0 4px #39ff5a inset'
      : '3px 3px 8px rgba(0,0,0,0.5), -1px -1px 4px rgba(255,255,255,0.03)',
    color: isPipBoy ? '#39ff5a' : 'hsl(var(--muted-foreground))',
    filter: isPipBoy ? 'brightness(1.4)' : 'none',
  };

  return (
    <>
      <button
        onClick={toggle}
        title={t('searchTitle') + '  (/)'}
        aria-label={t('searchTitle')}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={triggerStyle}
      >
        <Search className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9995] flex items-start justify-center"
          style={{ paddingTop: '12vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="panel w-full mx-3 max-w-md flex flex-col overflow-hidden"
            style={{ maxHeight: '76vh', animation: 'hubItemIn 160ms ease both' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* input */}
            <div className="flex items-center gap-2 px-3 py-3" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'hsl(var(--foreground))', caretColor: 'hsl(var(--primary))' }}
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>/</kbd>
            </div>

            {/* hint row */}
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {t('searchHint')}
            </div>

            {/* results */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-1.5 pb-2">
              {results.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('searchNoResults')}</div>
              ) : results.map((it, i) => {
                const Icon = it.icon;
                const active = i === hl;
                return (
                  <button
                    key={it.to}
                    data-hl={active ? '1' : '0'}
                    onMouseEnter={() => setHl(i)}
                    onClick={() => go(it.to)}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors"
                    style={{
                      background: active ? 'hsl(var(--primary) / 0.18)' : 'transparent',
                      boxShadow: active ? 'inset 0 0 0 1px hsl(var(--primary) / 0.45)' : 'none',
                    }}
                  >
                    <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--border))' }}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{it.label}</span>
                      <span className="block text-[10px] uppercase tracking-widest truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{it.cat}</span>
                    </span>
                    {active && <CornerDownLeft className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}