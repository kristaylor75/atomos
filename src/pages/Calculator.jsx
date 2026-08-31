import { useState, useEffect, useCallback, useRef } from 'react';
import { evaluateExpression } from '@/lib/mathEngine';
import { haptics } from '@/lib/haptics';
import { addHistoryEntry } from '@/lib/history';
import { Delete, Clock, Keyboard, ChevronDown, ChevronUp, Settings2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import SendTo from '@/components/SendTo';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import HistoryPanel from '@/components/HistoryPanel.jsx';
import ShortcutCustomizer, { getDefaultShortcuts } from '@/components/ShortcutCustomizer.jsx';
import { getActiveSets, ALL_FUNCTIONS } from '@/lib/quickAccess';
import VoiceInputButton from '@/components/VoiceInputButton.jsx';
import { parseSpokenMath } from '@/lib/speechMath';

// Keyboard shortcut hints for PRIMARY_PAD buttons (by value)
const PRIMARY_HINTS = {
  '7': '7', '8': '8', '9': '9', '÷': '/',
  '4': '4', '5': '5', '6': '6', '×': '*',
  '1': '1', '2': '2', '3': '3', '-': '-',
  '0': '0', '.': '.', '=': '↵', '+': '+',
};

// Keyboard shortcut hints for FN_PAD buttons (by normal value)
const FN_HINTS = {
  'AC':    'Esc',
  '(':     '(',
  ')':     ')',
  'DEL':   '⌫',
  'sin(':  null,
  'cos(':  null,
  'tan(':  null,
  'π':     null,
  '^2':    null,
  'log(':  null,
  '1/':    null,
  '%':     '%',
};

// Global shortcuts shown on the left panel
const GLOBAL_SHORTCUTS = [
  { key: 'Alt+1', descKey: 'navCalculator' },
  { key: 'Alt+2', descKey: 'navConverter' },
  { key: 'Alt+3', descKey: 'navDateTime' },
  { key: 'Alt+4', descKey: 'navGeometry' },
  { key: 'Alt+5', descKey: 'navGraphing' },
  { key: 'Alt+6', descKey: 'navRadio' },
  { key: 'Alt+7', descKey: 'navHistory' },
  { key: 'Tab',   descKey: 'calcDegRadToggle' },
];

const PRIMARY_PAD = [
  [
    { label: '7', type: 'digit', value: '7' },
    { label: '8', type: 'digit', value: '8' },
    { label: '9', type: 'digit', value: '9' },
    { label: '÷', type: 'op', value: '÷' },
  ],
  [
    { label: '4', type: 'digit', value: '4' },
    { label: '5', type: 'digit', value: '5' },
    { label: '6', type: 'digit', value: '6' },
    { label: '×', type: 'op', value: '×' },
  ],
  [
    { label: '1', type: 'digit', value: '1' },
    { label: '2', type: 'digit', value: '2' },
    { label: '3', type: 'digit', value: '3' },
    { label: '−', type: 'op', value: '-' },
  ],
  [
    { label: '0', type: 'digit', value: '0' },
    { label: '.', type: 'digit', value: '.' },
    { label: '=', type: 'equals', value: '=' },
    { label: '+', type: 'op', value: '+' },
  ],
];

const FN_PAD = [
  // Row 1: AC, (, ), DEL
  { normal: { label: 'AC',  type: 'clear',  value: 'AC'   }, shift: { label: 'AC',   type: 'clear',  value: 'AC'    } },
  { normal: { label: '(',   type: 'paren',  value: '('    }, shift: { label: '(',    type: 'paren',  value: '('    } },
  { normal: { label: ')',   type: 'paren',  value: ')'    }, shift: { label: ')',    type: 'paren',  value: ')'    } },
  { normal: { label: '⌫',   type: 'delete', value: 'DEL'  }, shift: { label: '⌫',    type: 'delete', value: 'DEL'  } },
  // Row 2: sin, cos, tan, π
  { normal: { label: 'sin', type: 'fn',     value: 'sin(' }, shift: { label: 'asin', type: 'fn',     value: 'asin(' } },
  { normal: { label: 'cos', type: 'fn',     value: 'cos(' }, shift: { label: 'acos', type: 'fn',     value: 'acos(' } },
  { normal: { label: 'tan', type: 'fn',     value: 'tan(' }, shift: { label: 'atan', type: 'fn',     value: 'atan(' } },
  { normal: { label: 'π',   type: 'const',  value: 'π'    }, shift: { label: 'e',   type: 'const',  value: 'e'    } },
  // Row 3: x², log, 1/x, %
  { normal: { label: 'x²',  type: 'pow2',   value: '^2'   }, shift: { label: '√',   type: 'fn',     value: 'sqrt(' } },
  { normal: { label: 'log', type: 'fn',     value: 'log(' }, shift: { label: 'ln',  type: 'fn',     value: 'ln('  } },
  { normal: { label: '1/x', type: 'fn1x',   value: '1/'   }, shift: { label: 'n!',  type: 'fact',   value: '!'    } },
  { normal: { label: '%',   type: 'op',     value: '%'    }, shift: { label: 'xʸ',  type: 'op',     value: '^'    } },
];

// Advanced functions shown in expanded drawer
const ADVANCED_FN_PAD = [
  // Row 1: sinh, cosh, tanh, x³
  { normal: { label: 'sinh', type: 'fn', value: 'sinh(' }, shift: { label: 'asinh', type: 'fn', value: 'asinh(' } },
  { normal: { label: 'cosh', type: 'fn', value: 'cosh(' }, shift: { label: 'acosh', type: 'fn', value: 'acosh(' } },
  { normal: { label: 'tanh', type: 'fn', value: 'tanh(' }, shift: { label: 'atanh', type: 'fn', value: 'atanh(' } },
  { normal: { label: 'x³', type: 'pow3', value: '^3' }, shift: { label: '∛', type: 'fn', value: 'cbrt(' } },
  // Row 2: nCr, nPr, log₁₀, log₂
  { normal: { label: 'nCr', type: 'fn', value: 'nCr(' }, shift: { label: 'nCr', type: 'fn', value: 'nCr(' } },
  { normal: { label: 'nPr', type: 'fn', value: 'nPr(' }, shift: { label: 'nPr', type: 'fn', value: 'nPr(' } },
  { normal: { label: 'log₁₀', type: 'fn', value: 'log10(' }, shift: { label: 'log₂', type: 'fn', value: 'log2(' } },
  { normal: { label: 'EE', type: 'ee', value: 'EE' }, shift: { label: 'EE', type: 'ee', value: 'EE' } },
];

const BTN_STYLES = {
  digit:  { bg: 'hsl(220 14% 18%)', color: 'hsl(220 20% 88%)' },
  op:     { bg: 'hsl(220 14% 22%)', color: 'hsl(38 92% 65%)'  },
  fn:     { bg: 'hsl(220 14% 14%)', color: 'hsl(220 15% 60%)', small: true },
  fn1x:   { bg: 'hsl(220 14% 14%)', color: 'hsl(220 15% 60%)', small: true },
  fact:   { bg: 'hsl(220 14% 14%)', color: 'hsl(220 15% 60%)', small: true },
  const:  { bg: 'hsl(220 14% 14%)', color: 'hsl(217 80% 68%)' },
  paren:  { bg: 'hsl(220 14% 14%)', color: 'hsl(220 15% 60%)', small: true },
  pow2:   { bg: 'hsl(220 14% 14%)', color: 'hsl(220 15% 60%)', small: true },
  pow3:   { bg: 'hsl(220 14% 14%)', color: 'hsl(220 15% 60%)', small: true },
  ee:     { bg: 'hsl(220 14% 14%)', color: 'hsl(220 15% 60%)', small: true },
  clear:  { bg: 'hsl(0 40% 18%)',   color: 'hsl(0 72% 65%)'   },
  delete: { bg: 'hsl(220 14% 14%)', color: 'hsl(220 12% 50%)' },
  equals: { bg: 'hsl(217 91% 60%)', color: '#fff', glow: true },
  mode:   { bg: 'hsl(220 14% 14%)', color: 'hsl(220 12% 45%)', small: true },
};

function applyDegrees(expr) {
  return expr
    .replace(/sin\(/g, 'sin(Math.PI/180*')
    .replace(/cos\(/g, 'cos(Math.PI/180*')
    .replace(/tan\(/g, 'tan(Math.PI/180*')
    .replace(/asin\(/g, '(180/Math.PI)*asin(')
    .replace(/acos\(/g, '(180/Math.PI)*acos(')
    .replace(/atan\(/g, '(180/Math.PI)*atan(');
}

// Small hint badge shown in bottom-right of button
function HintBadge({ hint }) {
  if (!hint) return null;
  return (
    <span
      className="absolute bottom-0.5 right-0.5 text-[8px] font-bold leading-none px-0.5 rounded"
      style={{
        color: 'rgba(255,255,255,0.45)',
        pointerEvents: 'none',
      }}
    >
      {hint}
    </span>
  );
}

export default function Calculator({ initialValue = '' }) {
  const { t } = useLanguage();
  const [expr, setExpr] = useState(initialValue || '');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('deg');
  const [prevResult, setPrevResult] = useState('');
  const [pressedBtn, setPressedBtn] = useState(null);
  const [committed, setCommitted] = useState(false);
  const [shifted, setShifted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shortcutsOn, setShortcutsOn] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [qaOverlay, setQaOverlay] = useState(false);
  const [qaSets, setQaSets] = useState(() => getActiveSets());
  const [qaSetIdx, setQaSetIdx] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const next = getActiveSets();
      setQaSets(next);
      setQaSetIdx(i => Math.min(i, Math.max(next.length - 1, 0)));
    };
    window.addEventListener('quickaccesschange', refresh);
    return () => window.removeEventListener('quickaccesschange', refresh);
  }, []);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('calc_shortcuts') || '{}');
    return { ...getDefaultShortcuts(), ...stored };
  });
  const displayRef = useRef(null);

  const flashBtn = useCallback((val) => {
    setPressedBtn(val);
    setTimeout(() => setPressedBtn(null), 120);
  }, []);

  useEffect(() => {
    if (initialValue) setExpr(initialValue);
  }, [initialValue]);

  const handleInput = useCallback((val, type, skipFlash) => {
    if (!skipFlash) flashBtn(val);
    if (type === 'mode') { haptics.click(); setMode(val); setShifted(false); return; }
    if (type === 'clear') { haptics.click(); setExpr(''); setResult(''); setError(''); setPrevResult(''); setCommitted(false); setShifted(false); return; }
    if (type === 'delete') { haptics.tap(); setCommitted(false); setShifted(false); setExpr(prev => prev.slice(0, -1)); return; }
    if (type === 'equals') {
      if (!expr) return;
      const processed = mode === 'deg' ? applyDegrees(expr) : expr;
      const { result: res, error: err } = evaluateExpression(processed);
      if (err) { haptics.error(); setError(err); return; }
      haptics.success();
      addHistoryEntry({ tool: 'calculator', input: expr, result: res, mode });
      setPrevResult(expr + ' =');
      setExpr(res);
      setResult(res);
      setError('');
      setCommitted(true);
      setShifted(false);
      return;
    }
    if (type === 'pow2') { haptics.tap(); setCommitted(false); setShifted(false); setExpr(prev => prev + '^2'); return; }
    if (type === 'pow3') { haptics.tap(); setCommitted(false); setShifted(false); setExpr(prev => prev + '^3'); return; }
    if (type === 'fn1x') { haptics.tap(); setCommitted(false); setShifted(false); setExpr(prev => '1/(' + prev); return; }
    if (type === 'fact') { haptics.tap(); setCommitted(false); setShifted(false); setExpr(prev => prev + '!'); return; }
    if (type === 'ee') { haptics.tap(); setCommitted(false); setShifted(false); setExpr(prev => prev + 'e'); return; }
    haptics.tap();
    setCommitted(false);
    setShifted(false);
    setExpr(prev => prev + val);
  }, [expr, mode, flashBtn]);

  const handleVoiceResult = useCallback((transcript) => {
    const parsed = parseSpokenMath(transcript);
    if (!parsed) return;
    haptics.tap();
    setCommitted(false);
    setExpr(prev => prev + parsed);
  }, []);

  // Build a reverse map: key string → { value, type }
  const keyToAction = useCallback(() => {
    const map = {};
    // Primary pad
    const primaryTypes = { '7':'digit','8':'digit','9':'digit','÷':'op','4':'digit','5':'digit','6':'digit','×':'op','1':'digit','2':'digit','3':'digit','-':'op','0':'digit','.':'digit','=':'equals','+':'op' };
    for (const [btnId, type] of Object.entries(primaryTypes)) {
      const k = shortcuts[btnId];
      if (k) map[k] = { value: btnId, type };
    }
    // Fn pad — map by btnId
    const fnTypes = { 'AC':'clear','(':'paren',')':'paren','DEL':'delete','%':'op' };
    for (const [btnId, type] of Object.entries(fnTypes)) {
      const k = shortcuts[btnId];
      if (k) map[k] = { value: btnId, type };
    }
    return map;
  }, [shortcuts]);

  useEffect(() => {
    const actionMap = keyToAction();
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key;
      if (key === 'Tab') { e.preventDefault(); setMode(prev => prev === 'deg' ? 'rad' : 'deg'); return; }
      const action = actionMap[key];
      if (action) {
        if (key === '/') e.preventDefault();
        flashBtn(action.value);
        handleInput(action.value, action.type, true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleInput, flashBtn, keyToAction]);

  // Always render all rows; advanced rows animate in/out via CSS
  const ALL_FN_FLAT = [...FN_PAD, ...ADVANCED_FN_PAD];
  const allFnRows = [];
  for (let i = 0; i < ALL_FN_FLAT.length; i += 4) allFnRows.push(ALL_FN_FLAT.slice(i, i + 4));

  // Build hint maps from current shortcuts
  const primaryHintMap = {};
  const fnHintMap = {};
  for (const [btnId, key] of Object.entries(shortcuts)) {
    if (['7','8','9','÷','4','5','6','×','1','2','3','-','0','.','=','+'].includes(btnId)) {
      primaryHintMap[btnId] = key;
    } else {
      fnHintMap[btnId] = key;
    }
  }

  return (
  <>
    {customizerOpen && (
      <ShortcutCustomizer
        shortcuts={shortcuts}
        onSave={setShortcuts}
        onClose={() => setCustomizerOpen(false)}
      />
    )}
    <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        tool="calculator"
        currentData={expr ? { expr, mode } : null}
        presetLabel={expr || ''}
        onSelectHistory={(entry) => { setExpr(entry.result); setPrevResult(entry.input + ' ='); }}
        onLoadPreset={(data) => { setExpr(data.expr || ''); if (data.mode) setMode(data.mode); setPrevResult(''); }}
      />

      <div className="flex flex-col p-2 sm:p-3 w-full select-none" style={{ height: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box', paddingBottom: 'max(4.5rem, calc(4.5rem + env(safe-area-inset-bottom)))', overflow: 'hidden', gap: '0.5rem' }}>
        {/* Display screen */}
        <div className="display-screen relative flex-shrink-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <button
                onClick={() => setHistoryOpen(true)}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.5)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--foreground))'}
                onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                title="History & Presets"
              >
                <Clock className="w-3 h-3" />
              </button>
              <VoiceInputButton onResult={handleVoiceResult} title="Speak your equation" />
            </div>

            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-mono truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {committed ? prevResult : (expr ? expr : '\u00A0')}
              </p>
              <div
                ref={displayRef}
                className="font-mono font-light leading-none mt-1"
                style={{
                  fontSize: 'clamp(1.8rem, 5vw + 1vh, 3.5rem)',
                  color: 'hsl(var(--foreground))',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {committed
                  ? (error
                    ? <span style={{ color: 'hsl(var(--destructive))', fontSize: '1rem' }}>{error}</span>
                    : result)
                  : (expr
                    ? <span>{expr}</span>
                    : <span style={{ color: 'hsl(var(--muted-foreground) / 0.3)' }}>0</span>)
                }
              </div>
            </div>
          </div>

          {!error && result && (
            <div className="absolute bottom-2 left-3">
              <SendTo value={result} exclude="calculator" />
            </div>
          )}
        </div>

        {/* Button area */}
        <div className="flex gap-2 min-h-0 min-w-0" style={{ flex: '1 1 0', overflow: 'hidden' }}>

          {/* Global shortcuts panel — left side, only visible when shortcutsOn */}
          <div
            className="flex-shrink-0 flex flex-col gap-1 transition-all duration-200 overflow-hidden"
            style={{ width: shortcutsOn ? '64px' : '0px', opacity: shortcutsOn ? 1 : 0 }}
          >
            <div
              className="rounded-2xl p-1.5 h-full flex flex-col gap-1"
              style={{
                background: 'hsl(220 16% 11%)',
                border: '1px solid hsl(var(--border) / 0.5)',
              }}
            >
              <span className="text-[8px] font-bold uppercase tracking-widest text-center block mb-0.5" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                {t('calcGlobalPanel')}
              </span>
              {GLOBAL_SHORTCUTS.map((s) => (
                <div
                  key={s.key}
                  className="rounded-lg px-1 py-1 text-center"
                  style={{ background: 'hsl(220 14% 16%)', border: '1px solid hsl(var(--border) / 0.4)' }}
                >
                  <div className="text-[9px] font-bold font-mono leading-tight" style={{ color: 'hsl(217 80% 65%)' }}>{s.key}</div>
                  <div className="text-[7px] leading-tight mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{t(s.descKey)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main button columns */}
          <div
            className="flex-1 min-w-0 min-h-0 flex flex-col"
            style={{ gap: '6px', overflow: 'hidden', boxSizing: 'border-box' }}
          >

            {/* Function zone */}
            <div
              className="rounded-2xl p-2 flex flex-col gap-1"
              style={{
                background: 'hsl(220 16% 11%)',
                border: '1px solid hsl(var(--border) / 0.5)',
                boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.02)',
                overflow: 'hidden',
                minHeight: 0,
                flex: isExpanded ? '5 1 0' : '3 1 0',
                transition: 'flex 0.3s ease',
              }}
            >
              <div className="flex items-center justify-between px-1 mb-0.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                    {qaOverlay ? t('calcQuickAccess') : t('calcFunctions')}
                  </span>
                  {!qaOverlay && (
                    <button
                      onClick={() => { haptics.tap(); setIsExpanded(e => !e); }}
                      className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                      style={{
                        color: isExpanded ? 'hsl(217 80% 70%)' : 'hsl(var(--muted-foreground) / 0.5)',
                        border: isExpanded ? '1px solid hsl(217 80% 50% / 0.4)' : '1px solid hsl(var(--border) / 0.3)',
                        background: isExpanded ? 'hsl(217 91% 60% / 0.1)' : 'transparent',
                      }}
                      title="Expand advanced functions"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                  <button
                    onClick={() => { haptics.tap(); setQaOverlay(o => !o); }}
                    className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                    style={{
                      color: qaOverlay ? 'hsl(38 92% 65%)' : 'hsl(var(--muted-foreground) / 0.5)',
                      border: qaOverlay ? '1px solid hsl(38 92% 55% / 0.4)' : '1px solid hsl(var(--border) / 0.3)',
                      background: qaOverlay ? 'hsl(38 92% 55% / 0.1)' : 'transparent',
                    }}
                    title="Quick Access"
                  >
                    <Zap className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                   {/* Deg / Rad toggle switch */}
                  <button
                    onClick={() => { haptics.click(); setMode(m => m === 'deg' ? 'rad' : 'deg'); }}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                    title="Toggle Degrees / Radians (Tab)"
                  >
                    <span style={{ color: mode === 'deg' ? 'hsl(217 80% 70%)' : 'hsl(var(--muted-foreground) / 0.5)' }}>{t('graphDegrees')}</span>
                    <div
                      className="relative w-8 h-4 rounded-full transition-colors duration-200"
                      style={{
                        background: mode === 'rad' ? 'hsl(217 91% 50%)' : 'hsl(220 14% 22%)',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.5)',
                      }}
                    >
                      <div
                        className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200"
                        style={{
                          left: mode === 'rad' ? 'calc(100% - 0.875rem)' : '0.125rem',
                          background: mode === 'rad' ? '#fff' : 'hsl(220 15% 55%)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        }}
                      />
                    </div>
                    <span style={{ color: mode === 'rad' ? 'hsl(217 80% 70%)' : 'hsl(var(--muted-foreground) / 0.5)' }}>{t('graphRadians')}</span>
                  </button>

                  <button
                    onClick={() => setShifted(s => !s)}
                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all"
                    style={{
                      background: shifted ? 'hsl(38 92% 55%)' : 'hsl(220 14% 16%)',
                      color: shifted ? 'hsl(220 16% 10%)' : 'hsl(38 92% 65%)',
                      border: shifted ? '1px solid hsl(38 92% 55% / 0.8)' : '1px solid hsl(var(--border))',
                      boxShadow: shifted
                        ? '0 0 10px hsl(38 92% 55% / 0.4), inset 1px 1px 3px rgba(0,0,0,0.3)'
                        : '2px 2px 5px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.03)',
                    }}
                  >
                    {shifted ? '2nd ●' : '2nd'}
                  </button>
                </div>
              </div>

              {/* QA overlay — fades in over the function buttons */}
              <div style={{
                position: 'relative', flex: '1 1 0', minHeight: 0, overflow: 'hidden',
              }}>
                {/* Function buttons layer */}
                <div style={{
                  position: 'absolute', inset: 0, display: 'grid',
                  gridTemplateRows: isExpanded
                    ? '1fr 1fr 1fr 1fr 1fr'
                    : '1fr 1fr 1fr 0fr 0fr',
                  gap: '4px',
                  transition: 'opacity 0.2s ease, grid-template-rows 0.3s ease',
                  opacity: qaOverlay ? 0 : 1,
                  pointerEvents: qaOverlay ? 'none' : 'auto',
                }}>
                  {allFnRows.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-4 gap-1" style={{ minHeight: 0, overflow: 'hidden' }}>
                      {row.map((entry, bi) => {
                        if (entry === null) return <div key={bi} />;
                        const btn = shifted ? entry.shift : entry.normal;
                        const normalVal = entry.normal.value;
                        const hint = shortcutsOn ? (fnHintMap[normalVal] ?? null) : null;
                        const style = BTN_STYLES[btn.type] || BTN_STYLES.fn;
                        const isPressed = pressedBtn === btn.value;
                        return (
                          <button
                            key={bi}
                            onClick={() => handleInput(btn.value, btn.type)}
                            className={cn('calc-btn relative w-full h-full', isPressed && 'pressed')}
                            style={{
                              background: style.bg,
                              color: shifted && btn.type !== 'clear' && btn.type !== 'delete' ? 'hsl(38 92% 70%)' : style.color,
                              fontSize: 'clamp(0.65rem, 1.8vw, 0.85rem)',
                              border: shifted && btn.type !== 'clear' && btn.type !== 'delete' ? '1px solid hsl(38 92% 55% / 0.2)' : '1px solid transparent',
                            }}
                          >
                            {btn.label === '⌫' ? <Delete className="w-3.5 h-3.5" /> : btn.label}
                            <HintBadge hint={hint} />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Quick Access overlay layer */}
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '6px',
                  transition: 'opacity 0.2s ease',
                  opacity: qaOverlay ? 1 : 0,
                  pointerEvents: qaOverlay ? 'auto' : 'none',
                  overflowY: 'auto',
                }}>
                  {qaSets.length === 0 ? (
                    <p className="text-[10px] text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {t('quickAccessOverlayNoSets')}{' '}
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('opensettings', { detail: { tab: 'quickaccess' } }))}
                        className="font-semibold underline underline-offset-2"
                        style={{ color: 'hsl(217 80% 65%)' }}
                      >
                        {t('quickAccessOverlayLink')}
                      </button>
                    </p>
                  ) : (
                    <>
                      {qaSets.length > 1 && (
                        <div className="flex gap-1 overflow-x-auto flex-shrink-0">
                          {qaSets.map((s, i) => (
                            <button
                              key={s.id}
                              onClick={() => setQaSetIdx(i)}
                              className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                              style={{
                                background: i === qaSetIdx ? 'hsl(217 91% 60%)' : 'hsl(var(--muted))',
                                color: i === qaSetIdx ? '#fff' : 'hsl(var(--muted-foreground))',
                                border: i === qaSetIdx ? 'none' : '1px solid hsl(var(--border) / 0.5)',
                              }}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: '8px',
                        width: '100%',
                      }}>
                        {(qaSets[qaSetIdx]?.fnIds || []).map(fnId => {
                          const fn = ALL_FUNCTIONS.find(f => f.id === fnId);
                          if (!fn) return null;
                          const isPressed = pressedBtn === fn.value;
                          return (
                            <button
                              key={fnId}
                              onClick={() => handleInput(fn.value, fn.type)}
                              title={fn.desc}
                              className={cn('calc-btn text-xs font-mono relative', isPressed && 'pressed')}
                              style={{
                                background: isPressed ? 'hsl(220 14% 10%)' : 'hsl(220 14% 17%)',
                                color: 'hsl(220 15% 60%)',
                                border: '1px solid hsl(var(--border) / 0.6)',
                                height: '2.2rem',
                                width: '100%',
                              }}
                            >
                              {fn.label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Main input zone */}
            <div
              className="rounded-2xl p-2 flex flex-col gap-1.5 overflow-hidden"
              style={{
                background: 'hsl(220 16% 13%)',
                border: '1px solid hsl(var(--border) / 0.6)',
                boxShadow: '3px 3px 8px rgba(0,0,0,0.4), -1px -1px 4px rgba(255,255,255,0.02)',
                minHeight: 0,
                flex: '5 1 0',
              }}
            >
              <div className="px-1 mb-0.5 flex items-center justify-between flex-shrink-0">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                  {t('calcInput')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShortcutsOn(s => !s)}
                    className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                    style={{
                      color: shortcutsOn ? 'hsl(217 80% 70%)' : 'hsl(var(--muted-foreground) / 0.5)',
                      border: shortcutsOn ? '1px solid hsl(217 80% 50% / 0.4)' : '1px solid hsl(var(--border) / 0.3)',
                      background: shortcutsOn ? 'hsl(217 91% 60% / 0.1)' : 'transparent',
                    }}
                    title="Toggle keyboard shortcut hints"
                  >
                    <Keyboard className="w-3 h-3" />
                  </button>
                  {shortcutsOn && (
                    <button
                      onClick={() => setCustomizerOpen(true)}
                      className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                      style={{
                        color: 'hsl(38 92% 65%)',
                        border: '1px solid hsl(38 92% 55% / 0.4)',
                        background: 'hsl(38 92% 55% / 0.08)',
                      }}
                      title="Customize shortcuts"
                    >
                      <Settings2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              {PRIMARY_PAD.map((row, ri) => (
                <div key={ri} className="grid grid-cols-4 gap-1.5 min-h-0" style={{ flex: '1 1 0', boxSizing: 'border-box' }}>
                  {row.map((btn, bi) => {
                    const hint = shortcutsOn ? (primaryHintMap[btn.value] ?? null) : null;
                    const style = BTN_STYLES[btn.type] || BTN_STYLES.digit;
                    const isPressed = pressedBtn === btn.value;
                    return (
                      <button
                        key={bi}
                        onClick={() => handleInput(btn.value, btn.type)}
                        className={cn('calc-btn relative w-full h-full', btn.type === 'digit' ? 'text-base font-medium' : 'text-sm', isPressed && 'pressed')}
                        style={{
                          background: style.bg,
                          color: style.color,
                          fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
                          ...(style.glow && !isPressed ? {
                            boxShadow: '3px 3px 7px rgba(0,0,0,0.5), -1px -1px 4px rgba(255,255,255,0.04), 0 0 14px hsl(217 91% 60% / 0.35)',
                          } : {}),
                        }}
                      >
                        {btn.label}
                        <HintBadge hint={hint} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}