import { useState, useEffect } from 'react';
import { Radio as RadioIcon, Play, Square, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import player from '@/lib/radioPlayer';
import { getPresets } from '@/lib/presets';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function MiniRadioWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(player.isPlaying());
  const [current, setCurrent] = useState(player.currentStation);
  const [favorites, setFavorites] = useState(() => getPresets().filter(p => p.tool === 'radio'));

  useEffect(() => {
    const unsub = player.subscribe(() => {
      setIsPlaying(player.isPlaying());
      setCurrent(player.currentStation);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const id = setInterval(() => setFavorites(getPresets().filter(p => p.tool === 'radio')), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-1.5">
          <RadioIcon className="w-3.5 h-3.5" /> {t('navRadio')}
        </span>
        <button onClick={() => navigate('/radio')} className="flex items-center text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
          {t('homeViewAll')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {favorites.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('radioNoPresets')}</p>
      ) : (
        <div className="space-y-1.5">
          {favorites.map((p) => {
            const s = p.data;
            const active = current?.url === s?.url && isPlaying;
            return (
              <button
                key={p.id}
                onClick={() => (active ? player.stop() : player.play(s))}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                style={{
                  background: active ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary) / 0.5)',
                  border: active ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border) / 0.5)',
                  color: active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                }}
              >
                {active ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span className="flex-1 text-left truncate">{p.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}