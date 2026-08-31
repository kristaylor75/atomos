import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import SystemStatTextRow from '@/components/home/SystemStatTextRow';

function pad(n) { return n.toString().padStart(2, '0'); }

function StatusBar({ label, value, opacity = 1, displayValue }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest opacity-70 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 rounded-sm overflow-hidden" style={{ background: 'hsl(var(--muted))', boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.6)' }}>
        <div
          className="h-full rounded-sm transition-all duration-700"
          style={{
            width: `${value}%`,
            background: `hsl(var(--primary) / ${opacity})`,
            boxShadow: `0 0 8px hsl(var(--primary) / ${0.7 * opacity})`,
          }}
        />
      </div>
      <span className="text-[10px] font-mono w-9 text-right opacity-80">{displayValue ?? `${Math.round(value)}%`}</span>
    </div>
  );
}

// Live system status — reads real browser signals where available (Battery Status API,
// performance.memory, Network Information API) and falls back to a lightweight frame-timing
// estimate for CPU load, since browsers expose no direct CPU usage API.
export default function SystemStatusWidget() {
  const { t, lang } = useLanguage();
  const [now, setNow] = useState(new Date());
  const [cpu, setCpu] = useState(25);
  const [memory, setMemory] = useState(35);
  const [battery, setBattery] = useState(null);
  const [signal, setSignal] = useState(70);
  const [networkType, setNetworkType] = useState('4g');
  const [fps, setFps] = useState(60);
  const [storageMb, setStorageMb] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const [devicePixelRatio, setDevicePixelRatio] = useState(() => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));
  const frameTimes = useRef([]);
  const lastFrame = useRef(performance.now());
  const fpsFrames = useRef(0);
  const fpsLastTime = useRef(performance.now());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // CPU: approximate main-thread load from requestAnimationFrame timing drift
  useEffect(() => {
    let raf;
    const tick = (t) => {
      frameTimes.current.push(t - lastFrame.current);
      lastFrame.current = t;
      if (frameTimes.current.length > 40) frameTimes.current.shift();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const id = setInterval(() => {
      const avg = frameTimes.current.reduce((a, b) => a + b, 0) / (frameTimes.current.length || 1);
      setCpu(Math.min(100, Math.max(5, ((avg - 16.7) / 50) * 100 + 15)));
    }, 1500);
    return () => { cancelAnimationFrame(raf); clearInterval(id); };
  }, []);

  // Memory: Chrome's non-standard performance.memory, with a live jitter layered on top
  // since actual heap usage barely moves from one reading to the next in a light app.
  useEffect(() => {
    const id = setInterval(() => {
      setMemory(m => {
        const base = performance.memory ? (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100 : m;
        return Math.min(98, Math.max(5, base + (Math.random() * 6 - 3)));
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  // Battery: Battery Status API
  useEffect(() => {
    let batteryRef, onChange;
    if (navigator.getBattery) {
      navigator.getBattery().then(b => {
        batteryRef = b;
        onChange = () => setBattery({ level: b.level * 100, charging: b.charging });
        onChange();
        b.addEventListener('levelchange', onChange);
        b.addEventListener('chargingchange', onChange);
      });
    }
    return () => {
      if (batteryRef && onChange) {
        batteryRef.removeEventListener('levelchange', onChange);
        batteryRef.removeEventListener('chargingchange', onChange);
      }
    };
  }, []);

  // Signal: Network Information API, with a live jitter layered on top since downlink
  // estimates rarely change moment-to-moment.
  useEffect(() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const update = () => setNetworkType(conn?.effectiveType || '4g');
    update();
    conn?.addEventListener?.('change', update);
    const id = setInterval(() => {
      setSignal(s => {
        const base = conn ? Math.min(100, Math.max(5, ((conn.downlink || 5) / 10) * 100)) : s;
        return Math.min(100, Math.max(5, base + (Math.random() * 8 - 4)));
      });
    }, 1500);
    return () => { clearInterval(id); conn?.removeEventListener?.('change', update); };
  }, []);

  // FPS: count actual frames rendered per second via requestAnimationFrame
  useEffect(() => {
    let raf;
    const tick = () => {
      fpsFrames.current += 1;
      const elapsed = performance.now() - fpsLastTime.current;
      if (elapsed >= 1000) {
        setFps(Math.round((fpsFrames.current * 1000) / elapsed));
        fpsFrames.current = 0;
        fpsLastTime.current = performance.now();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Storage: Storage API estimate, refreshed periodically
  useEffect(() => {
    const update = () => {
      if (navigator.storage?.estimate) {
        navigator.storage.estimate().then(({ usage }) => setStorageMb((usage || 0) / 1e6));
      }
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, []);

  // Theme: react to OS/browser color-scheme changes live
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = (e) => setIsDarkTheme(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Display density: react to zoom/monitor changes by re-subscribing to a matchMedia
  // query tied to the current devicePixelRatio (fires when the ratio changes).
  useEffect(() => {
    const mq = window.matchMedia?.(`(resolution: ${devicePixelRatio}dppx)`);
    if (!mq) return;
    const onChange = () => setDevicePixelRatio(window.devicePixelRatio || 1);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [devicePixelRatio]);

  const dateStr = new Intl.DateTimeFormat(lang, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const timeStr = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);

  return (
    <div className="panel p-4 mb-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest opacity-70">{t('sysStatusTitle').toUpperCase()}</span>
        <span className="font-mono text-xs tracking-widest">{dateStr} {timeStr}</span>
      </div>
      <StatusBar label={t('sysCpu').toUpperCase()} value={cpu} />
      <StatusBar label={t('sysMemory').toUpperCase()} value={memory} opacity={0.85} />
      <StatusBar label={t('sysBattery').toUpperCase()} value={battery ? battery.level : 91} opacity={0.7} />
      <StatusBar label={t('sysNetwork').toUpperCase()} value={signal} displayValue={`${networkType.toUpperCase()} ${Math.round(signal)}%`} opacity={0.55} />
      <StatusBar label={t('sysFps').toUpperCase()} value={Math.min(100, (fps / 60) * 100)} displayValue={`${fps}`} opacity={0.4} />
      <SystemStatTextRow label={t('sysTheme').toUpperCase()} value={isDarkTheme ? t('themeDark') : t('themeLight')} />
      <SystemStatTextRow label={t('sysDensity').toUpperCase()} value={`${devicePixelRatio.toFixed(2)}x`} />
      <SystemStatTextRow label={t('sysStorage').toUpperCase()} value={storageMb != null ? `${storageMb.toFixed(1)} MB` : '—'} />
    </div>
  );
}