import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { clearHistory } from '@/lib/history';
import HubMenu from '@/components/HubMenu.jsx';
import SettingsModal from '@/components/SettingsModal.jsx';
import { Settings } from 'lucide-react';
import { getSkin, applySkinsVars } from '@/lib/skins';
import { startToolSession, endToolSession } from '@/lib/toolTime';
import GlobalSearch from '@/components/GlobalSearch.jsx';
import NotificationBell from '@/components/home/NotificationBell.jsx';
import MuteButton from '@/components/home/MuteButton.jsx';

const NAV_PATHS = ['/calculator', '/converter', '/datetime', '/geometry', '/graphing', '/radio', '/history'];

// Map each route to a tool id used by the time tracker. Routes absent here
// (home dashboard, history) record no session.
const ROUTE_TO_TOOL = {
  '/calculator': 'calculator',
  '/converter': 'converter',
  '/datetime': 'datetime',
  '/geometry': 'geometry',
  '/graphing': 'graphing',
  '/radio': 'radio',
  '/notes': 'notes',
  '/generator': 'generator',
  '/text-converter': 'textconverter',
  '/weather': 'weather',
  '/map': 'map',
  '/system-status': 'system',
  '/email-inbox': 'email',
  '/messages': 'messages',
  '/calls': 'calls',
  '/contacts': 'contacts',
  '/group-chat': 'groupchat',
  '/games/chess': 'chess',
  '/games/minesweeper': 'minesweeper',
  '/games/snake': 'snake',
  '/games/blocks': 'tetris',
  '/games/dungeon': 'doom',
};

export default function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('preferences');
  const [skinKey, setSkinKey] = useState(getSkin);
  const [scrolled, setScrolled] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const mainRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Re-apply skin whenever it changes
  useEffect(() => {
    const onStorage = () => {
      const newSkin = getSkin();
      setSkinKey(newSkin);
      applySkinsVars(newSkin);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('skinchange', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('skinchange', onStorage);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      setSettingsTab(e.detail?.tab || 'preferences');
      setSettingsOpen(true);
    };
    window.addEventListener('opensettings', handler);
    return () => window.removeEventListener('opensettings', handler);
  }, []);

  useEffect(() => {
    const onHubChange = (e) => setHubOpen(e.detail?.open ?? false);
    window.addEventListener('hubmenuchange', onHubChange);
    return () => window.removeEventListener('hubmenuchange', onHubChange);
  }, []);

  // Track cumulative time spent per tool: open a session for the active route
  // and close it on the next route change, tab hide, or unload.
  useEffect(() => {
    const tool = ROUTE_TO_TOOL[location.pathname];
    startToolSession(tool);
    const flush = () => endToolSession();
    const onVis = () => {
      if (document.hidden) endToolSession();
      else startToolSession(ROUTE_TO_TOOL[location.pathname]);
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      endToolSession();
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape' && !e.altKey) {
        e.preventDefault();
        if (hubOpen) return; // let HubMenu handle it
        setSettingsOpen(prev => !prev);
        return;
      }
      if (e.altKey && /^[1-7]$/.test(e.key)) {
        e.preventDefault();
        navigate(NAV_PATHS[parseInt(e.key) - 1]);
        return;
      }
      if (e.altKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clearHistory(null);
        return;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate, hubOpen]);

  // Detect scroll on the main content area
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 16);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const isPipBoy = skinKey === 'pip-boy';

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">

      {/* ── Sticky top bar — transparent at rest, glass when scrolled ── */}
      <div
        className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-between px-3 transition-all duration-350"
        style={{
          height: '52px',
          background: scrolled
            ? 'hsl(220 18% 8% / 0.82)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          boxShadow: scrolled
            ? '0 1px 0 hsl(var(--border) / 0.35), 0 4px 24px rgba(0,0,0,0.4)'
            : 'none',
          // The bar itself never eats taps in its empty/transparent area — only
          // its actual controls (below) receive input. This keeps the top strip
          // of the page (and the radial hub menu's upper buttons) tappable on
          // mobile instead of being shadowed by a transparent 52px overlay.
          pointerEvents: 'none',
        }}
      >
        {/* Hub menu trigger (fan items rendered fixed by HubMenu itself) */}
        <div style={{ pointerEvents: 'auto' }}><HubMenu /></div>

        {/* Home is reachable via the radial hub menu's centered Home button — no redundant
            top-bar icon needed. */}

        {/* App name — subtle, only visible when scrolled */}
        <span
          className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold tracking-widest uppercase transition-all duration-300 pointer-events-none select-none"
          style={{
            color: 'hsl(var(--muted-foreground))',
            opacity: scrolled ? 0.6 : 0,
          }}
        >
          AtomOS
        </span>

        <div className="flex items-center gap-2 relative z-50" style={{ pointerEvents: 'auto' }}>
          <GlobalSearch />
          <MuteButton />
          <NotificationBell />

          {/* Settings button */}
          <button
            onClick={() => setSettingsOpen(prev => !prev)}
            title="Settings"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              touchAction: 'manipulation',
              flexShrink: 0,
              background: isPipBoy ? '#0d2b0d' : 'hsl(220 16% 14%)',
              border: isPipBoy ? '2px solid #39ff5a' : '1px solid hsl(var(--border))',
              boxShadow: isPipBoy
                ? '0 0 14px #39ff5a, 0 0 28px rgba(57,255,90,0.6), 0 0 4px #39ff5a inset'
                : '3px 3px 8px rgba(0,0,0,0.5), -1px -1px 4px rgba(255,255,255,0.03)',
              color: isPipBoy ? '#39ff5a' : 'hsl(var(--muted-foreground))',
              filter: isPipBoy ? 'brightness(1.4)' : 'none',
            }}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full-viewport tool content — starts below the bar */}
      <main
        ref={mainRef}
        className="overflow-y-auto"
        style={{
          height: '100%',
          paddingTop: '52px',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <Outlet />
      </main>

      {/* Settings modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} defaultTab={settingsTab} />
    </div>
  );
}