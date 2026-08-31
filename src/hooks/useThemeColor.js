import { useState, useEffect } from 'react';

function readColorVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val ? `hsl(${val})` : fallback;
}

// Returns the current skin's --primary color as a resolved hsl() string,
// updating live when the user switches appearance (skins dispatch 'skinchange').
export function usePrimaryColor() {
  const [color, setColor] = useState(() => readColorVar('--primary', 'hsl(217, 91%, 60%)'));

  useEffect(() => {
    const update = () => setColor(readColorVar('--primary', 'hsl(217, 91%, 60%)'));
    window.addEventListener('skinchange', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('skinchange', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return color;
}