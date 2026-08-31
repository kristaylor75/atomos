import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

// Renders a single geometry dimension input.
// If `alternatives` has more than one option, the label becomes a clickable button
// to swap which property is being entered (e.g. Radius → Diameter → Area).
export default function FieldInput({ field, value, onChange, alternatives, mode, onModeChange }) {
  const { t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const btnRef = useRef(null);

  const hasAlts = alternatives && alternatives.length > 1;
  const currentAlt = hasAlts ? (alternatives.find(a => a.key === mode) || alternatives[0]) : null;
  // Translate an alternative option by its key: try geoField_ first, then geoFormula_, then raw label
  // t() returns the key itself when not found, so we check for that
  const tSafe = (key) => { const v = t(key); return v !== key ? v : null; };
  const translateAltKey = (key, fallbackLabel) => tSafe(`geoField_${key}`) || tSafe(`geoFormula_${key}`) || fallbackLabel;
  // Display label: when alternatives exist show the current alt's translated label; otherwise translate the field key
  const displayLabel = currentAlt ? translateAltKey(currentAlt.key, currentAlt.label) : tSafe(`geoField_${field}`) || field;

  useEffect(() => {
    if (!dropdownOpen || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 180;
    const left = Math.min(rect.left, window.innerWidth - menuWidth - 8);
    // Prefer below; if too close to bottom go above
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight + 8 ? rect.bottom + 4 : rect.top - menuHeight - 4;
    setDropdownStyle({
      position: 'fixed',
      top: Math.max(8, top),
      left,
      zIndex: 9999,
    });
  }, [dropdownOpen]);

  return (
    <div>
      {hasAlts ? (
        <>
          <button
            ref={btnRef}
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1.5 rounded-md px-1.5 py-0.5 -ml-1.5 transition-all"
            style={{
              color: 'hsl(217 80% 68%)',
              border: '1px solid hsl(217 80% 50% / 0.3)',
              background: 'hsl(217 91% 60% / 0.08)',
            }}
          >
            {displayLabel}
            <ChevronDown className="w-2.5 h-2.5 flex-shrink-0" />
          </button>

          {dropdownOpen && createPortal(
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setDropdownOpen(false)} />
              <div style={{
                ...dropdownStyle,
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                minWidth: '160px',
                boxShadow: '6px 6px 16px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.04)',
              }}>
                <p className="text-[10px] text-muted-foreground px-3 pt-2 pb-1 font-medium uppercase tracking-wider">
                  {t('geoInputAs')}
                </p>
                {alternatives.map((alt, i) => {
                  const isActive = alt.key === mode;
                  const altLabel = translateAltKey(alt.key, alt.label);
                  return (
                    <button
                      key={alt.key}
                      onClick={() => {
                        onModeChange(field, alt.key);
                        onChange(field, '');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between"
                      style={{
                        borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.5)' : undefined,
                        background: isActive ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                        color: isActive ? 'hsl(217 80% 70%)' : 'hsl(var(--foreground))',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'hsl(var(--secondary))'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'hsl(var(--primary) / 0.08)' : 'transparent'; }}
                    >
                      {altLabel}
                      {isActive && <span className="text-[10px] text-primary">●</span>}
                    </button>
                  );
                })}
              </div>
            </>,
            document.body
          )}
        </>
      ) : (
        <label
          className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {tSafe(`geoField_${field}`) || field}
        </label>
      )}

      <input
        type="number"
        value={value}
        onChange={e => onChange(field, e.target.value)}
        placeholder="0"
        min="0"
        step="any"
        className="neu-input font-mono"
      />
    </div>
  );
}