import { useState, useRef, useEffect, useCallback } from 'react';
import { haptics } from '@/lib/haptics';
import { useLanguage } from '@/lib/LanguageContext.jsx';

// Frequencies mapped to real-world FM band (87.5 – 108.0 MHz)
const MIN_FREQ = 87.5;
const MAX_FREQ = 108.0;
const STEP = 0.1;

function freqToAngle(freq) {
  const pct = (freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
  return pct * 270 - 135; // -135° to +135°
}

function angleToFreq(angle) {
  const pct = (angle + 135) / 270;
  return Math.round((MIN_FREQ + pct * (MAX_FREQ - MIN_FREQ)) * 10) / 10;
}

export default function TuningDial({ frequency, onChange, onScan }) {
  const { t } = useLanguage();
  const dialRef = useRef(null);
  const lastAngleRef = useRef(freqToAngle(frequency));
  const isDragging = useRef(false);
  const lastHapticFreq = useRef(frequency);

  const getAngleFromEvent = useCallback((e, el) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const handleStart = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    lastAngleRef.current = getAngleFromEvent(e, dialRef.current);
  }, [getAngleFromEvent]);

  const handleMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const angle = getAngleFromEvent(e, dialRef.current);
    let delta = angle - lastAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastAngleRef.current = angle;

    const freqDelta = (delta / 270) * (MAX_FREQ - MIN_FREQ);
    const newFreq = Math.min(MAX_FREQ, Math.max(MIN_FREQ,
      Math.round((frequency + freqDelta) * 10) / 10
    ));

    if (newFreq !== frequency) {
      if (Math.abs(newFreq - lastHapticFreq.current) >= STEP) {
        haptics.tap();
        lastHapticFreq.current = newFreq;
      }
      onChange(newFreq);
    }
  }, [frequency, onChange, getAngleFromEvent]);

  const handleEnd = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleMove, handleEnd]);

  const dialAngle = freqToAngle(frequency);
  // Tick marks
  const ticks = [];
  for (let f = MIN_FREQ; f <= MAX_FREQ; f = Math.round((f + 2) * 10) / 10) {
    const a = freqToAngle(f) * (Math.PI / 180);
    const isMajor = Math.round(f) === f;
    const r1 = isMajor ? 42 : 46;
    const r2 = 50;
    ticks.push({
      x1: 56 + Math.cos(a) * r1,
      y1: 56 + Math.sin(a) * r1,
      x2: 56 + Math.cos(a) * r2,
      y2: 56 + Math.sin(a) * r2,
      major: isMajor,
    });
  }

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <svg
        ref={dialRef}
        width="112"
        height="112"
        viewBox="0 0 112 112"
        className="cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Outer ring */}
        <circle cx="56" cy="56" r="54" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="hsl(var(--border))" strokeWidth={t.major ? 1.5 : 0.8} />
        ))}
        {/* Knob body */}
        <circle cx="56" cy="56" r="34"
          fill="hsl(var(--secondary))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.6))' }}
        />
        {/* Grip lines */}
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line key={i}
              x1={56 + Math.cos(a) * 22} y1={56 + Math.sin(a) * 22}
              x2={56 + Math.cos(a) * 30} y2={56 + Math.sin(a) * 30}
              stroke="hsl(var(--border))" strokeWidth="1" />
          );
        })}
        {/* Pointer */}
        <line
          x1="56" y1="56"
          x2={56 + Math.cos((dialAngle - 90) * Math.PI / 180) * 28}
          y2={56 + Math.sin((dialAngle - 90) * Math.PI / 180) * 28}
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary)))' }}
        />
        {/* Center dot */}
        <circle cx="56" cy="56" r="4" fill="hsl(var(--primary))" />
      </svg>

      {/* Freq display */}
      <div
        className="font-mono font-bold text-center leading-none"
        style={{ fontSize: '1.6rem', color: 'hsl(var(--primary))', textShadow: '0 0 10px hsl(var(--primary) / 0.5)' }}
      >
        {frequency.toFixed(1)}
        <span className="text-sm ml-1" style={{ color: 'hsl(var(--muted-foreground))' }}>MHz</span>
      </div>

      {/* Seek buttons */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => onScan(-1)}
          className="calc-btn px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
          style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
        >
          {t('radioSeekPrev')}
        </button>
        <button
          onClick={() => onScan(1)}
          className="calc-btn px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
          style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
        >
          {t('radioSeekNext')}
        </button>
      </div>
    </div>
  );
}