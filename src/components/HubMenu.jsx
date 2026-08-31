import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { haptics } from '@/lib/haptics';
import { Calculator, ArrowLeftRight, Clock, Triangle, History, Grid3x3, Radio, LineChart, ChevronLeft, Layers, Zap, FileText, Wand2, RefreshCw, Cloud, Home, Activity, MessageCircle, Mail, MessageSquare, Phone, Users, Map, Gamepad2, Crown, Bomb, Waves, Grid2x2, Skull } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'calculations',
    labelKey: 'navCatCalculations',
    icon: Layers,
    color: 'hsl(217 91% 60%)',
    tools: [
      { to: '/calculator', icon: Calculator,    labelKey: 'navCalculator' },
      { to: '/converter', icon: ArrowLeftRight, labelKey: 'navConverter' },
      { to: '/datetime',  icon: Clock,         labelKey: 'navDateTime' },
      { to: '/geometry',  icon: Triangle,      labelKey: 'navGeometry' },
      { to: '/graphing',  icon: LineChart,     labelKey: 'navGraphing' },
    ],
  },
  {
    id: 'text',
    labelKey: 'navCatText',
    icon: FileText,
    color: 'hsl(280 65% 65%)',
    tools: [
      { to: '/notes',          icon: FileText,    labelKey: 'navNotes' },
      { to: '/generator',      icon: Wand2,       labelKey: 'navGenerator' },
      { to: '/text-converter', icon: RefreshCw,   labelKey: 'navTextConverter' },
    ],
  },
  {
    id: 'communications',
    labelKey: 'navCatCommunications',
    icon: MessageCircle,
    color: 'hsl(340 75% 58%)',
    tools: [
      { to: '/email-inbox', icon: Mail, labelKey: 'navEmail' },
      { to: '/messages', icon: MessageSquare, labelKey: 'navSms' },
      { to: '/calls', icon: Phone, labelKey: 'navCalls' },
      { to: '/contacts', icon: Users, labelKey: 'navContacts' },
    ],
  },
  {
    id: 'utilities',
    labelKey: 'navCatUtilities',
    icon: Zap,
    color: 'hsl(38 92% 60%)',
    tools: [
      { to: '/radio', icon: Radio, labelKey: 'navRadio' },
      { to: '/weather', icon: Cloud, labelKey: 'navWeather' },
      { to: '/system-status', icon: Activity, labelKey: 'navSystemStatus' },
      { to: '/map', icon: Map, labelKey: 'navMap' },
    ],
  },
  {
    id: 'games',
    labelKey: 'navCatGames',
    icon: Gamepad2,
    color: 'hsl(280 65% 65%)',
    tools: [
      { to: '/games/chess', icon: Crown, labelKey: 'chessTitle' },
      { to: '/games/minesweeper', icon: Bomb, labelKey: 'minesTitle' },
      { to: '/games/snake', icon: Waves, labelKey: 'snakeTitle' },
      { to: '/games/blocks', icon: Grid2x2, labelKey: 'tetrisTitle' },
      { to: '/games/dungeon', icon: Skull, labelKey: 'doomTitle' },
    ],
  },
  {
    id: 'history',
    labelKey: 'navCatHistory',
    icon: History,
    color: 'hsl(173 58% 45%)',
    tools: [
      { to: '/history', icon: History, labelKey: 'navHistory' },
    ],
  },
];

const CAT_RADIUS  = 110;  // inner ring — categories
const TOOL_RADIUS = 210;  // outer ring — tools (beyond the category ring)

function catAngle(idx, total) {
  return (idx / total) * 2 * Math.PI - Math.PI / 2;
}

function catPos(idx, total) {
  const a = catAngle(idx, total);
  return { x: Math.cos(a) * CAT_RADIUS, y: Math.sin(a) * CAT_RADIUS, angle: a };
}

// Tools fan out in an arc centred on their parent category's angle
function toolPositions(catIdx, toolCount, catTotal) {
  const parentAngle = catAngle(catIdx, catTotal);
  const spread = Math.min(Math.PI * 0.7, (toolCount - 1) * 0.44);
  return Array.from({ length: toolCount }, (_, i) => {
    const offset = toolCount === 1 ? 0 : ((i / (toolCount - 1)) - 0.5) * spread;
    const a = parentAngle + offset;
    return { x: Math.cos(a) * TOOL_RADIUS, y: Math.sin(a) * TOOL_RADIUS };
  });
}

export default function HubMenu() {
  const [open, setOpen]               = useState(false);
  const [activeCatIdx, setActiveCatIdx] = useState(null); // null = no submenu open
  const [highlightedCat, setHighlightedCat] = useState(0);
  const [highlightedTool, setHighlightedTool] = useState(0);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t }     = useLanguage();

  // Responsive scale: shrink the whole radial menu on small screens so the
  // outer (tool) ring never overflows the viewport. Uses the smaller viewport
  // dimension so it fits in both portrait and landscape.
  const [scale, setScale] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const vp = Math.min(window.innerWidth, window.innerHeight);
    return Math.min(1, Math.max(0.58, vp / 520));
  });
  useEffect(() => {
    const onR = () => {
      const vp = Math.min(window.innerWidth, window.innerHeight);
      setScale(Math.min(1, Math.max(0.58, vp / 520)));
    };
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
    return () => { window.removeEventListener('resize', onR); window.removeEventListener('orientationchange', onR); };
  }, []);

  const categories = CATEGORIES.map(cat => ({
    ...cat,
    label: t(cat.labelKey),
    tools: cat.tools.map(tk => ({ ...tk, label: t(tk.labelKey) })),
  }));
  const catTotal = categories.length;

  // Which category contains the current path
  const activeCatForPath = categories.findIndex(cat =>
    cat.tools.some(tk => tk.to === location.pathname)
  );

  // ── Open / close ────────────────────────────────────────────────────────────
  const openMenu = useCallback(() => {
    haptics.menu();
    setOpen(true);
    window.dispatchEvent(new CustomEvent('hubmenuchange', { detail: { open: true } }));
    setActiveCatIdx(null);          // ALWAYS start at Tier 1
    setHighlightedCat(activeCatForPath >= 0 ? activeCatForPath : 0);
    setHighlightedTool(0);
  }, [activeCatForPath]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('hubmenuchange', { detail: { open: false } }));
    setActiveCatIdx(null);
    setHighlightedCat(0);
    setHighlightedTool(0);
  }, []);

  // Alt is a TOGGLE
  const toggle = useCallback(() => {
    if (open) closeMenu(); else openMenu();
  }, [open, openMenu, closeMenu]);

  const goBack = useCallback(() => {
    haptics.tap();
    setActiveCatIdx(null);
    setHighlightedTool(0);
  }, []);

  const selectCategory = useCallback((idx) => {
    const cat = categories[idx];
    setHighlightedCat(idx);
    if (cat.tools.length === 1) {
      // Single-tool category: navigate directly
      haptics.click();
      closeMenu();
      navigate(cat.tools[0].to);
      return;
    }
    haptics.tap();
    setActiveCatIdx(idx);
    const activeInCat = cat.tools.findIndex(tk => tk.to === location.pathname);
    setHighlightedTool(activeInCat >= 0 ? activeInCat : 0);
  }, [categories, closeMenu, navigate, location.pathname]);

  const goToTool = useCallback((to) => {
    haptics.click();
    closeMenu();
    navigate(to);
  }, [closeMenu, navigate]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Alt = toggle (keydown fires repeatedly; only act on first press)
      if (e.key === 'Alt' && !e.repeat) {
        e.preventDefault();
        toggle();
        return;
      }

      if (!open) return;

      const inSubmenu = activeCatIdx !== null;

      // Number keys: 1-9 select by index
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (!inSubmenu) {
          if (idx < categories.length) selectCategory(idx);
        } else {
          const tools = categories[activeCatIdx].tools;
          if (idx < tools.length) goToTool(tools[idx].to);
        }
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (!inSubmenu) {
          setHighlightedCat(p => (p + 1) % catTotal);
        } else {
          setHighlightedTool(p => (p + 1) % categories[activeCatIdx].tools.length);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!inSubmenu) {
          setHighlightedCat(p => (p - 1 + catTotal) % catTotal);
        } else {
          setHighlightedTool(p => (p - 1 + categories[activeCatIdx].tools.length) % categories[activeCatIdx].tools.length);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!inSubmenu) selectCategory(highlightedCat);
        else goToTool(categories[activeCatIdx].tools[highlightedTool].to);
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        if (inSubmenu) goBack(); else closeMenu();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, activeCatIdx, highlightedCat, highlightedTool, categories, catTotal, toggle, selectCategory, goToTool, goBack, closeMenu]);

  // ── Mouse wheel ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onWheel = (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      if (activeCatIdx === null) {
        setHighlightedCat(p => (p + dir + catTotal) % catTotal);
      } else {
        const tLen = categories[activeCatIdx].tools.length;
        setHighlightedTool(p => (p + dir + tLen) % tLen);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [open, activeCatIdx, catTotal, categories]);

  // ── Touch swipe ───────────────────────────────────────────────────────────────
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    const onTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      if (touchStartX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || open) return;
      const dir = dx < 0 ? 1 : -1;

      // Swipe within current category's tools if possible
      if (activeCatForPath >= 0) {
        const catTools = categories[activeCatForPath].tools;
        if (catTools.length > 1) {
          const cur = catTools.findIndex(tk => tk.to === location.pathname);
          haptics.click();
          navigate(catTools[(cur + dir + catTools.length) % catTools.length].to);
          return;
        }
      }
      // Fallback: cycle categories (navigate to first tool)
      const nextCat = categories[(activeCatForPath + dir + catTotal) % catTotal];
      haptics.click();
      navigate(nextCat.tools[0].to);
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onTouchStart); window.removeEventListener('touchend', onTouchEnd); };
  }, [open, activeCatForPath, categories, catTotal, location.pathname, navigate]);

  const inSubmenu = open && activeCatIdx !== null;

  return (
    <>
      {open && createPortal(
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={closeMenu}
            onContextMenu={(e) => { e.preventDefault(); if (inSubmenu) goBack(); else closeMenu(); }}
          />

          {/* Centre anchor */}
          <div style={{ position: 'fixed', top: '50vh', left: '50vw', width: 0, height: 0, zIndex: 9991, pointerEvents: 'none', transform: `scale(${scale})`, transformOrigin: '0 0' }}>

            {/* ── Centre Home button — always at the middle of the radial menu ── */}
            <button
              onClick={(e) => { e.stopPropagation(); haptics.click(); closeMenu(); navigate('/'); }}
              title={t('navHome')}
              style={{
                position: 'absolute',
                left: -28,
                top: -28,
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid hsl(var(--primary))',
                background: 'hsl(var(--primary))',
                color: '#fff',
                boxShadow: '0 0 20px hsl(var(--primary) / 0.6), 3px 3px 12px rgba(0,0,0,0.7)',
                cursor: 'pointer',
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                padding: 0,
                zIndex: 2,
                animation: 'hubItemIn 200ms ease both',
              }}
            >
              <Home style={{ width: 22, height: 22 }} />
            </button>

            {/* ── Tier 1: Category ring — ALWAYS visible when menu is open ── */}
            {categories.map((cat, idx) => {
              const pos = catPos(idx, catTotal);
              const isSelected = activeCatIdx === idx;
              const isHighlighted = !inSubmenu && highlightedCat === idx;
              const isActivePath = activeCatForPath === idx;
              const CatIcon = cat.icon;
              const dimmed = inSubmenu && !isSelected; // fade unselected when submenu open

              return (
                <button
                  key={cat.id}
                  onClick={(e) => { e.stopPropagation(); selectCategory(idx); }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (inSubmenu) goBack(); else closeMenu(); }}
                  onMouseEnter={() => { if (!inSubmenu) setHighlightedCat(idx); }}
                  title={cat.label}
                  style={{
                    position: 'absolute',
                    left: pos.x - 32,
                    top: pos.y - 50,
                    width: 64,
                    height: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    padding: 0,
                    animation: `hubItemIn 220ms ease ${idx * 40}ms both`,
                    transform: isHighlighted || isSelected ? 'scale(1.15) translateY(-4px)' : 'scale(1) translateY(0)',
                    transition: 'transform 160ms cubic-bezier(0.34,1.56,0.64,1), opacity 200ms',
                    opacity: dimmed ? 0.4 : 1,
                  }}
                >
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isSelected
                      ? cat.color
                      : isActivePath
                        ? cat.color.replace(')', ' / 0.25)').replace('hsl(', 'hsl(')
                        : isHighlighted
                          ? 'hsl(220 20% 26%)'
                          : 'hsl(220 16% 18%)',
                    border: isSelected
                      ? `2px solid ${cat.color}`
                      : isHighlighted
                        ? `1px solid ${cat.color}`
                        : isActivePath
                          ? `1px solid ${cat.color.replace(')', ' / 0.6)').replace('hsl(', 'hsl(')}`
                          : '1px solid hsl(var(--border))',
                    boxShadow: isSelected
                      ? `0 0 24px ${cat.color.replace(')', ' / 0.6)').replace('hsl(', 'hsl(')}, 3px 3px 12px rgba(0,0,0,0.7)`
                      : isHighlighted
                        ? `0 0 20px ${cat.color.replace(')', ' / 0.35)').replace('hsl(', 'hsl(')}, 3px 3px 10px rgba(0,0,0,0.6)`
                        : '3px 3px 10px rgba(0,0,0,0.5)',
                    color: isSelected || isHighlighted || isActivePath ? '#fff' : 'hsl(var(--muted-foreground))',
                    transition: 'background 160ms, box-shadow 160ms, border-color 160ms, color 160ms',
                  }}>
                    <CatIcon style={{ width: 22, height: 22 }} />
                  </div>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflowWrap: 'normal',
                    textAlign: 'center',
                    lineHeight: 1.15,
                    marginBottom: 6,
                    pointerEvents: 'none',
                    color: isSelected ? cat.color : isHighlighted || isActivePath ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.65)',
                    transition: 'color 160ms',
                  }}>
                    {cat.label}
                  </span>
                  {/* Number hint badge */}
                  <div style={{
                    position: 'absolute',
                    top: -6,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: isSelected ? cat.color : 'hsl(220 14% 22%)',
                    border: `1px solid ${isSelected ? cat.color : 'hsl(var(--border))'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 800,
                    color: isSelected ? '#fff' : 'hsl(var(--muted-foreground))',
                    transition: 'background 160ms, color 160ms',
                    pointerEvents: 'none',
                  }}>
                    {idx + 1}
                  </div>

                </button>
              );
            })}

            {/* ── Tier 2: Tool arc — appears OUTSIDE the category ring ─────── */}
            {inSubmenu && (() => {
              const cat = categories[activeCatIdx];
              const tPositions = toolPositions(activeCatIdx, cat.tools.length, catTotal);
              const parentPos = catPos(activeCatIdx, catTotal);

              return (
                <>
                  {/* Dashed connector lines from category to each tool */}
                  <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}>
                    {tPositions.map((tp, i) => (
                      <line
                        key={i}
                        x1={parentPos.x} y1={parentPos.y}
                        x2={tp.x} y2={tp.y}
                        stroke={cat.color.replace(')', ' / 0.25)').replace('hsl(', 'hsl(')}
                        strokeWidth="1.5"
                        strokeDasharray="4 5"
                      />
                    ))}
                  </svg>

                  {/* Tool buttons */}
                  {cat.tools.map((tool, idx) => {
                    const pos = tPositions[idx];
                    const isActive  = location.pathname === tool.to;
                    const isHl      = highlightedTool === idx;
                    const Icon      = tool.icon;

                    return (
                      <button
                        key={tool.to}
                        onClick={(e) => { e.stopPropagation(); goToTool(tool.to); }}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); goBack(); }}
                        onMouseEnter={() => setHighlightedTool(idx)}
                        title={tool.label}
                        style={{
                          position: 'absolute',
                          left: pos.x - 30,
                          top: pos.y - 42,
                          width: 60,
                          height: 82,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          padding: 0,
                          animation: `hubItemIn 180ms ease ${idx * 35}ms both`,
                          transform: isHl ? 'scale(1.18) translateY(-4px)' : 'scale(1) translateY(0)',
                          transition: 'transform 160ms cubic-bezier(0.34,1.56,0.64,1)',
                        }}
                      >
                        <div style={{
                          width: 46,
                          height: 46,
                          borderRadius: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          background: isActive
                            ? cat.color
                            : isHl
                              ? 'hsl(220 20% 26%)'
                              : 'hsl(220 16% 16%)',
                          border: isActive
                            ? `2px solid ${cat.color}`
                            : isHl
                              ? `1px solid ${cat.color}`
                              : '1px solid hsl(var(--border))',
                          boxShadow: isActive
                            ? `0 0 20px ${cat.color.replace(')', ' / 0.55)').replace('hsl(', 'hsl(')}, 3px 3px 10px rgba(0,0,0,0.6)`
                            : isHl
                              ? `0 0 22px ${cat.color.replace(')', ' / 0.4)').replace('hsl(', 'hsl(')}, 3px 3px 12px rgba(0,0,0,0.7)`
                              : '3px 3px 10px rgba(0,0,0,0.5)',
                          color: isActive || isHl ? '#fff' : 'hsl(var(--muted-foreground))',
                          transition: 'background 160ms, box-shadow 160ms, border-color 160ms, color 160ms',
                        }}>
                          <Icon style={{ width: 19, height: 19 }} />
                        </div>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          overflowWrap: 'normal',
                          textAlign: 'center',
                          lineHeight: 1.15,
                          pointerEvents: 'none',
                          color: isActive ? cat.color : isHl ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.7)',
                          transition: 'color 160ms',
                        }}>
                          {tool.label}
                        </span>
                        {/* Number hint badge */}
                        <div style={{
                          position: 'absolute',
                          top: -6,
                          right: -2,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: isActive ? cat.color : 'hsl(220 14% 22%)',
                          border: `1px solid ${isActive ? cat.color : 'hsl(var(--border))'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 8,
                          fontWeight: 800,
                          color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
                          pointerEvents: 'none',
                        }}>
                          {idx + 1}
                        </div>
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>

          {/* Hint bar */}
          <div style={{
            position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9992, display: 'flex', gap: 16, alignItems: 'center',
            pointerEvents: 'none', opacity: 0.5, fontSize: 10,
            color: 'rgba(255,255,255,0.7)', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            animation: 'hubItemIn 300ms ease 200ms both',
          }}>
            {inSubmenu ? (
              <>
                <span>1–{categories[activeCatIdx].tools.length} {t('hubSelectTool')}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{t('hubNavigate')}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{t('hubBack')}</span>
              </>
            ) : (
              <>
                <span>1–{catTotal} {t('hubSelectCategory')}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{t('hubNavigate')}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{t('hubAltToggle')}</span>
              </>
            )}
          </div>
        </>,
        document.body
      )}

      {/* Trigger button */}
      <button
        onClick={toggle}
        style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'hsl(var(--primary))' : 'hsl(220 16% 14%)',
          border: '1px solid hsl(var(--border))',
          boxShadow: open
            ? '0 0 20px hsl(var(--primary) / 0.5), 0 4px 16px rgba(0,0,0,0.7)'
            : '3px 3px 8px rgba(0,0,0,0.7)',
          color: open ? '#fff' : 'hsl(var(--muted-foreground))',
          cursor: 'pointer', position: 'relative', zIndex: 9999,
          padding: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
        title="Switch tool (Alt)"
      >
        <Grid3x3 style={{
          width: 16, height: 16,
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 200ms',
          pointerEvents: 'none',
        }} />
      </button>

      <style>{`
        @keyframes hubItemIn {
          from { opacity: 0; transform: scale(0.4); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}