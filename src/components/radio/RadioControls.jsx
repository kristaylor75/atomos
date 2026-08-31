import { Volume2, VolumeX } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import player from '@/lib/radioPlayer';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function RadioControls({ volume, muted, onVolumeChange, onMuteToggle }) {
  const { t } = useLanguage();
  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    onVolumeChange(v);
    player.setVolume(v);
  };

  const handleMute = () => {
    haptics.click();
    onMuteToggle();
    player.toggleMute();
  };

  return (
    <div className="flex items-center gap-3 px-1">
      {/* Mute button */}
      <button
        onClick={handleMute}
        className={cn('calc-btn w-9 h-9 flex items-center justify-center shrink-0 transition-all')}
        style={{
          background: muted ? 'hsl(var(--destructive) / 0.2)' : 'hsl(var(--secondary))',
          border: muted ? '1px solid hsl(var(--destructive) / 0.5)' : '1px solid hsl(var(--border))',
          color: muted ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
          boxShadow: muted
            ? '0 0 8px hsl(var(--destructive) / 0.3), inset 1px 1px 3px rgba(0,0,0,0.4)'
            : '2px 2px 5px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.03)',
        }}
        title={muted ? t('radioUnmute') : t('radioMute')}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Volume slider */}
      <div className="flex-1 relative flex items-center">
        <div
          className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
          style={{
            width: `${(muted ? 0 : volume) * 100}%`,
            background: 'hsl(var(--primary) / 0.6)',
            height: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            borderRadius: '2px',
            transition: 'width 0.1s',
          }}
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={volume}
          onChange={handleVolume}
          className="w-full appearance-none bg-transparent cursor-pointer"
          style={{ height: '4px' }}
        />
      </div>

      {/* Volume percentage */}
      <span
        className="text-[10px] font-mono font-bold w-8 text-right shrink-0"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        {muted ? 'M' : `${Math.round(volume * 100)}`}
      </span>
    </div>
  );
}