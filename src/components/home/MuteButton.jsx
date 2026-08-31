import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import radioPlayer from '@/lib/radioPlayer';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function MuteButton() {
  const { t } = useLanguage();
  const [muted, setMuted] = useState(radioPlayer.muted);

  useEffect(() => {
    const sync = () => setMuted(radioPlayer.muted);
    return radioPlayer.subscribe(sync);
  }, []);

  return (
    <button
      onClick={() => radioPlayer.toggleMute()}
      title={muted ? (t('unmuteSound') || 'Unmute') : (t('muteSound') || 'Mute')}
      className="w-9 h-9 rounded-xl flex items-center justify-center"
      style={{
        background: 'hsl(220 16% 14%)',
        border: '1px solid hsl(var(--border))',
        boxShadow: '3px 3px 8px rgba(0,0,0,0.5), -1px -1px 4px rgba(255,255,255,0.03)',
        color: muted ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
      }}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}